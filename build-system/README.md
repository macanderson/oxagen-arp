# Oxagen local build runner

This Node and Bash package now contains the code that runs the chosen Codex and Claude CLIs, runs local checks, creates GitHub pull requests, waits for CI, and checks GitHub's actual merge result. Those steps do not require a new execution or Git service to be built.

The supported local profile is a **Linux host with Docker Engine**, pinned container images, Node 22+, Git, and `gh`. Agents run with no network interface. A local socket gives them a narrow route to the configured model API. Real provider credentials and GitHub credentials stay on the host, outside their mounts. A fresh container and session are used for each implementation and review.

**The selected release target is AWS ECS with Fargate**, using separate staging and production accounts. The package includes the artifact builder, release adapter, infrastructure templates and recovery code for that target. It uses Aurora PostgreSQL Serverless v2 and S3. Docker Compose is for local development; Kubernetes is deferred. One-time account and host setup, explicit product certification and live qualification remain required. See [RELEASE-SETUP.md](RELEASE-SETUP.md). The optional mTLS client is not an execution dependency.

No paid model call, real PR, merge, product build, or deployment was run in this task. Linux isolation and live provider compatibility still need qualification on the supported host. The tests exercise real local Git, local HTTP/socket code, money accounting, state recovery, and simulated CLI/GitHub replies. See [validation](VALIDATION.md).

## Install and inspect

Follow [LOCAL-SETUP.md](LOCAL-SETUP.md) for the actual configuration and one-time authentication steps. The example budget is zero, images and repository IDs are placeholders, and certification is absent. The package cannot start paid work as supplied.

```sh
node --test test/*.test.mjs
./run.sh plan --manifest examples/plan.json
./run.sh dry-run --manifest examples/plan.json
```

These commands use no model or remote repository. Bootstrap also makes no network call:

```sh
node bootstrap.mjs /srv/oxagen-control /srv/oxagen-agent-work \
  /srv/oxagen-readonly-inputs /path/to/reviewed-source-pack
```

Bootstrap installs the runner, copies the reviewed source files, and writes a hash manifest. Agent work, controller files, and source inputs use separate roots. Agents get only their own worktree and read-only source inputs. They cannot read the controller root, provider keys, GitHub login, or private signing key.

## What runs at each step

| Step | Concrete implementation |
|---|---|
| Host checks | `adapters/local-execution.mjs` checks Docker, pinned CLI versions and flags, mounted-file rules, dropped privileges, and the supported CLI wire behavior using an offline fixture. |
| Agent session | `local-execution-docker.mjs` creates a bounded container with `--network=none`, a read-only root, no added capabilities, a fresh home, and explicit mounts. The relay starts the pinned CLI. |
| Model access | `local-execution-broker.mjs` scans supported JSON fields, allows only its named provider/model profiles, reserves a conservative cost bound before each request, and keeps unknown liabilities. |
| Review | The other harness receives a separate read-only checkout, the exact head/base diff, and the required result schema. The executor assigns the session ID; model text cannot invent it. |
| Local checks | `local-quality.mjs` takes a fresh copy of the exact commit and runs configured argv checks in an isolated container. Missing checks, missing dependencies, or failed commands block progress. |
| GitHub | `local-github.mjs` uses host-side `gh` authentication and pinned repository identity. It publishes the exact reviewed commit and reads CI from the configured producers. |
| Merge | Squash and merge commits are supported. The adapter verifies the actual commit's parents and tree against the reviewed base and candidate, then requires CI on that actual commit. Rebase merge is not supported. |
| Recovery | The local adapter saves bound receipts before returning. Reconciliation can adopt those receipts, inspect GitHub, and clean up stopped or orphan containers without blindly repeating a write. |
| Artifact | `local-artifacts.mjs` exports images from the checked merged commit, verifies OCI digests, and copies the same images into separate immutable ECR repositories. |
| Release | `local-release.mjs` restores database test copies, checks limited additive changes and old/new image compatibility, updates ECS services, checks health, and verifies signed production approval. Rollback keeps the current data and requires compatibility proof. |

The model broker is a narrow build-runner profile, not the full Oxagen enterprise gateway. It supports only the documented text request formats and price profiles. Its local data rules are literal block/redact/replace rules; they are not a general secret or personal-data detector. Unsupported media, remote files, and API paths stop the call. The broader product scanner, SDKs, IAM, tenant controls, and platform support remain work in the certified product plan.

## Certification before product work

The first four batches refine only `phase0/` artifacts. They are reviewed and checked locally; they do not publish PRs or merge. Before product work, the user-selected certifier approves the complete design tree, the plan, the source pack, the local execution settings, and an expiry.

```sh
./run.sh snapshot --config /srv/oxagen-control/config.json \
  --worktree /srv/oxagen-agent-work/design-certification-pack-1
```

Save that payload, review the linked artifacts, and set an explicit expiry. A human certifier can sign it using the supplied standalone tool:

```sh
node certify.mjs /path/to/reviewed-payload.json \
  /private/certifier-key.pem /srv/oxagen-control/phase-zero.cert.json
```

The controller never invokes this signer. Keep the private key outside all controller and agent mounts; install only the public key in the control root. Signing proves approval by the holder of that key, not the quality of the design. Do not sign before review.

The runner checks the exact signed bytes before and after each product step. Every batch pins one certificate. Changed files, models, budgets, local settings, runner code, expired approval, or a replacement certificate block progress. A material change needs a new reviewed control run. Installation hashes cover executable adapters, container helpers and infrastructure/configuration templates. Keep generated local-development files outside the installed runner.

The first product review covers the full candidate against GitHub's actual default-branch base, including the approved local design commits. A branch that moves needs a fresh review. The live GitHub profile requires measured classic branch protection: up-to-date checks tied to the exact CI apps, checks enforced for administrators, no force/delete/bypass allowance, and an ordinary non-admin write identity. A separate read-only credential may inspect protection without raising the writer's rights. Those server rules reject an outdated branch; the adapter still verifies parents and tree after merging. GitHub's merge request does not itself offer an expected-base compare-and-swap. A policy change or unproved result stops the run; an already possible merge is never reported as no effect.

## Budgets, checks, and repair

Choose Codex and Claude models separately for each role. The local broker accepts only its reviewed profiles and requires a fresh approval of their exact pricing table. A reservation uses the model's full supported context at its highest supported input price plus the configured output cap. This is deliberately more conservative than guessing a token count. It may reject a request whose actual cost would have been smaller.

Costs use integer units. Each settled request releases only the unused reservation; failed or incomplete usage keeps the hold and blocks further calls. The dollar bound assumes the approved provider price profile is valid. Changing prices or unsupported billing options require a new reviewed profile. The CLI's own budget display is not the money authority.

Local checks are explicit by batch. The [quality image guide](images/quality/README.md) shows how to build a pinned image with reviewed dependencies and no runtime network. A changed lockfile or native install script needs a reviewed image update and new approval. The runner cannot invent missing project tests or declare them green. The reviewer still checks whether the configured tests are meaningful.

Known review or test failures may use bounded repair. Repair starts a fresh worktree and session and requires a new opposite-harness review of the new commit. Each attempt uses the remaining batch/run money and time. Unknown paid calls and uncertain remote writes do not enter that repair path.

## Run and recover

```sh
./run.sh preflight --config /srv/oxagen-control/config.json
./run.sh run --config /srv/oxagen-control/config.json
./run.sh status --config /srv/oxagen-control/config.json
./run.sh cancel --config /srv/oxagen-control/config.json
./run.sh reconcile --config /srv/oxagen-control/config.json
./run.sh retry --config /srv/oxagen-control/config.json --batch storage-iam
```

Preflight reads GitHub identity and fetches repository state. It runs local containers and synthetic model fixtures, but no paid model call, PR, or merge. It does not certify the product or start its run clock.

A synced journal records an operation before it starts. An exclusive lock prevents stale concurrent commands. The controller saves returned receipts before the next stage. An interrupted response may be recovered from the protected adapter's saved receipt, which is bound to the original operation and settings. This cannot charge the same completed call twice.

Cancellation requests a stop and closes admission to new work. It does not mean “paused.” Docker cleanup must confirm the container is gone; unknown provider charges stay held. A lost GitHub reply is reconciled with read-only checks. If the remote result cannot be proved, the run stays blocked. Do not edit journals or delete holds to force progress.

The release and rollback state contracts remain in the controller, but the local profile deliberately has no deployment action until the target-specific adapter is built. The architecture's confirmed-pause and late-response rules continue to apply.

## Optional remote profile

`adapters/mtls-services.mjs` and `examples/services.json` remain for users who already have compatible trusted services. That route requires their actual implementations and qualification. It is separate from the shipped local Docker/GitHub route and does not supply the missing release target.
