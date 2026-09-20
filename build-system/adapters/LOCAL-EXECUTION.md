# Local execution profile

This module runs Codex and Claude Code in local Docker containers. It includes the model broker, the container launcher, no-charge CLI fixtures, structured result parsing, and crash records. It does not require the earlier external execution service.

This profile is narrow: a **Linux host, rootful Linux Docker Engine without user-namespace remapping, and a non-root controller user**. The container UID/GID must match that user. Docker Desktop, Windows, rootless Docker, remapped users, other models, and other provider gateways need separate qualification. No Linux container or paid model was run while making this package on macOS. The executable preflight must pass on the chosen Linux host before agent work can start.

## Configuration and image

Merge [the configuration fragment](../examples/local-execution.json) into the controller config. Replace every placeholder. Keep the run budget disabled until the source pack, installation, targets, isolation, and phase-zero certificate are approved.

[The Dockerfile](local-execution.Dockerfile) builds an image with the two pinned CLIs, Node, Git, and GNU timeout. Supply a reviewed immutable Node22+ Debian base image:

```sh
docker build --build-arg NODE_IMAGE=YOUR_REVIEWED_NODE_IMAGE_AT_SHA256 \
  -f adapters/local-execution.Dockerfile -t oxagen-build-agent .
docker image inspect oxagen-build-agent --format '{{.Id}}'
```

Set `local.execution.image` to that exact `sha256:...` image ID, or a preloaded registry image digest. Runtime uses `--pull=never`. The recipe is a starting assembly recipe; the final image, dependency contents, and supply chain still need review. Do not bake in credentials, user homes, shell startup secrets, or workspace files.

`cli.codex.version` and `cli.claude.version` are the exact output of each pinned binary's `--version`. This profile was written against `codex-cli 0.155.1` and `2.1.278 (Claude Code)`. A different version must pass the same help and two-request fixture checks. The configured executable paths are inside the image.

Provider keys stay on the host. A `credentials` entry names either a private file inside `controlDir`, or an environment variable explicitly available to the trusted controller. Agent containers receive neither. Do not put keys in `hook.args`, command arguments, workspace files, or the image.

## What preflight measures

`preflight(config)` reads `config.local.execution` and returns `{verified:true,...evidence}` only after checks succeed. It uses an explicit local Unix Docker socket, not a saved Docker context or inherited `DOCKER_HOST`.

It inspects the daemon and a created container. Inside that container it checks that root files and an input mount reject writes, no Docker socket is present, Linux capabilities are zero, `NoNewPrivs` is set, and only the loopback network interface exists. It reads every approved input file. It writes through a temporary work-root bind mount, then checks those bytes on the host. It also checks the configured CLI versions and required flags.

Next, both installed CLIs run against a local synthetic provider. Each must issue a harmless shell call, return its output in another model request, and finish with valid review JSON for the exact fixture head. This exercises the model path, tool loop, result format, and fresh home without calling a real provider or spending money. Unknown wire fields, missing tools, blocked local commands, or incompatible CLI output fail preflight. Cold starts can take several minutes; allow a 240-second outer preflight timeout. Successful preflight saves a private receipt bound to the exact execution settings, models, and roots. It expires no later than the run time limit or 24 hours. Each execution requires that receipt; it does not repeat the fixtures. Every actual container still undergoes isolation inspection. Run/resume must call preflight first.

## Isolation while an agent runs

Each operation gets a new named container with:

- no network interface except loopback;
- a read-only root filesystem, no Linux capabilities, and no new privileges;
- fixed memory, CPU, process, output-size, and time limits;
- a fresh temporary home and temporary files;
- its own worktree, approved inputs, a tiny trusted relay, and one operation's model socket;
- no Docker socket, provider credentials, controller journal, or writable Git metadata;
- Docker logging disabled, so raw CLI output cannot reach a daemon logging driver.

The reviewer worktree is mounted read-only. Implementation gets a writable worktree; the controller still checks the allowed changed paths and exact certified files afterward. The trusted review diff comes from the protected Git repository and is mounted read-only beside the relay. Prompts replace host work/input paths with `/workspace` and `/inputs`.

Both CLIs use their documented permissions-bypass mode **inside this measured outer container**. That avoids nested sandbox restrictions and permission prompts breaking unattended tool calls. These flags must never be copied to host execution. The outer read-only mounts and network boundary enforce the restrictions. The module builds its own fixed arguments and ignores caller-supplied executable arguments.

The in-container relay exposes only localhost and forwards to the Unix socket. Only the host broker can call a provider. A second model client or child agent can use that same socket, but it gets the same model allowlist, scan rules, and shared operation budget. It cannot reach another provider directly.

## Dollar bounds

The supported standard first-party profiles are:

| Model | Supported endpoint | Context bound | Reviewed token prices |
|---|---|---:|---|
| `gpt-5.3-codex` | OpenAI `/v1/responses` | 400,000 | $1.75 input and $14 output per million. Cached input is conservatively charged here at the full input rate. |
| `claude-sonnet-4-6` | Anthropic `/v1/messages` | 1,000,000 | $3 input, up to $6 cache-write, $0.30 cache-read, and $15 output per million. Cache writes are conservatively charged at the one-hour rate. |

Sources checked on 20 September 2026: [OpenAI model limits and prices](https://developers.openai.com/api/docs/models/gpt-5.3-codex), [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing). The configured approval must match exported `PRICE_DIGEST`, expire within 31 days, and be checked before every new request. The rates must be rechecked against the provider's terms. Rates are code-reviewed constants; configuration cannot quietly lower them. Provider discounts are not assumed. Taxes, cloud-host costs, and other services are outside these model-token limits.

Before a paid request, the broker reserves **the entire model context at its highest supported input price, plus the capped output**. It does not use an estimated prompt token count as a hard guarantee. With an 8,192-output cap, the reservation is about $0.82 for the Codex profile and $6.13 for Sonnet. A smaller operation balance denies the request even if its likely cost would be lower.

The ledger uses integer nano-dollars and syncs a reservation before dispatch. Concurrent calls share that balance. Only terminal provider usage can release unused money. Returned `costCents` rounds the settled conservative upper bound up to whole cents; it is not a claim to reproduce the provider invoice exactly. A missing, failed, disconnected, malformed, or over-bound reply holds its reservation and blocks further paid requests. There is no automatic retry of an uncertain provider effect.

Standard text and local function/custom tools are supported. Hosted tools, uploads, remote file handles, prior-response handles, item references, media, background jobs, premium service tiers, WebSockets, and unknown request fields or endpoints are denied. The free Anthropic token-count endpoint is scanned and limited to 100 requests per operation; it is not used to relax the dollar reservation. Large Codex sessions that require the separate compaction endpoint stop at that unsupported boundary. This is not universal harness compatibility.

## Local data checks

`scanPolicy` has a version and literal rules. A rule blocks a matched value, replaces it with `[REDACTED]`, or replaces it with named allowed text. The broker scans all keys and string values in the complete outgoing JSON request, including history and tool output, before sending it. Only the cleaned request goes to the provider. Logs keep its hash and the policy hash; they do not keep the raw request. Remote file handles are blocked because the scanner cannot inspect their contents.

These literal rules are an executable policy mechanism, not a claim to detect all secrets, encodings, or personal data. Customers must choose and qualify their rules. A richer scanner can replace this narrow profile through a reviewed change. CLI stdout/stderr stay local and are discarded after parsing. Only scanned, validated review fields and compact execution receipts leave the executor.

## API and recovery

`execute(request,config)` accepts the controller's `kind:'agent'` operation and returns `operationId`, `status:'succeeded'`, integer `costCents`, a budget receipt, an isolation receipt, and `allChildrenStopped:true`. A review also returns the exact head, harness, fresh executor-created session ID, verdict, and findings. Success requires terminal CLI output, settled model usage, and confirmed removal of the container.

The container also has an internal GNU timeout, so a controller process crash cannot leave an unlimited agent lifetime. Operation metadata is saved first under `controlDir/local-operations/<id-hash>/`. Container names are `oxagen-op-<first32sha256(operationId)>`. The launcher force-removes the container and confirms absence before returning; errors remain unknown unless that cleanup is proven.

`recoverOperation(operationId,config)` discovers and stops that exact container. It returns either `{status:'completed',allChildrenStopped:true,receipt}` for a stored, hash-checked completed receipt, or `{status:'unknown',allChildrenStopped:true,reason,ledger}`. A stopped container alone does not prove that no files changed or no provider cost occurred.

`reconcile(operation,config)` checks the original controller request and exact execution profile before it wraps a completed receipt as `{status:'succeeded',operationId,completedReceipt}`. If no operation metadata, budget ledger, or container ever exists, it can return a checked zero-cost no-effect result. Otherwise it returns `status:'unknown'`; it never converts held provider liability into a no-effect retry. The caller must adopt completed receipts through the controller's checked recovery path. Unknown work remains stopped.

## Tests and remaining host qualification

The focused tests use real local Unix sockets with fake provider replies. They check scan-before-send, denied paths and remote file handles, shared reservations, held unknown charges, terminal usage, pricing approval, fixed Docker arguments, structured CLI result parsing, synthetic tool-loop fixtures, and rejection of remote Docker endpoints. No paid call or Linux isolation run was made here.

Before live use, run the measured preflight on the chosen image and host. Then qualify the actual provider accounts, CLI/model wire profile, cancellation, host crash cleanup, owned bind mounts, and artifact checks. The rest of the controller still needs its separate repository, CI, deployment, and certification gates.

Additional primary references: [Codex configuration](https://developers.openai.com/codex/config-reference), [Claude gateway setup](https://code.claude.com/docs/en/llm-gateway), [Claude structured CLI output](https://code.claude.com/docs/en/headless), [Anthropic token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting).
