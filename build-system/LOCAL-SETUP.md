# Set up the local runner

This is the setup path for the code in this package. It uses a Linux host or a local Linux VM with Docker Engine. Direct macOS/Windows execution and a remote Docker daemon are not supported by this profile. The controller and Docker must see the same absolute paths. Agents never receive the Docker socket.

The operator chooses the repository, model budget, credentials, allowed data, images, and required tests. Those are configuration choices, not missing execution services. The chosen release target is **AWS ECS with Fargate** in separate staging and production accounts. Follow [RELEASE-SETUP.md](RELEASE-SETUP.md) for the concrete cloud setup. Release remains disabled in the supplied example until real settings are reviewed.

## 1. Install tools and copy the approved inputs

Use Node 22 or later, `/usr/bin/git`, Docker Engine, and GitHub CLI. Pin their approved versions using your normal host package process. Run the controller as a dedicated non-root user with access to the chosen local Docker socket. Treat that account's Docker access as host administration access.

Copy the reviewed architecture, all surface specs, mockups, API files, schema, brand guidance, and acceptance evidence into a source-pack directory. Keep secrets out. Run:

```sh
node bootstrap.mjs /srv/oxagen-control /srv/oxagen-agent-work \
  /srv/oxagen-readonly-inputs /absolute/reviewed-source-pack
```

Choose paths the dedicated account owns; create the parent directories through the host's normal administration process. Bootstrap requires a new or empty control directory. It creates private config and source records. It does not sign in, run agents, or publish code.

The resulting `/srv/oxagen-control/config.json` selects `adapter: "local"`. Its hook points to the supplied `adapters/local-host.sh`. Its run budget is zero and several required fields deliberately remain unset.

## 2. Build and pin the CLI and quality images

The [CLI Dockerfile](adapters/local-execution.Dockerfile) installs the exact Codex and Claude versions named in the sample. Supply an approved Node base image by digest. Review the build recipe before running it. This is an operator image build, outside agent work, and may download those approved packages. It copies no credentials or source repository.

```text
docker build --pull=false \
  --build-arg NODE_IMAGE=node:22-bookworm-slim@sha256:<APPROVED_BASE_DIGEST> \
  --file /srv/oxagen-control/runner/adapters/local-execution.Dockerfile \
  --tag oxagen-cli-reviewed /srv/oxagen-control/runner/adapters
```

Inspect the built image's immutable digest. For a local image, use its `sha256:...` image ID if supported by the selected profile; for the quality image use the configured repository digest. Never substitute a floating tag. Preload the exact images on the same Docker host; the runner uses `--pull=never`.

Follow the [quality image instructions](images/quality/README.md) to include the trusted argv launcher and reviewed dependencies. That recipe accepts a reviewed npm lockfile. A different language, pnpm, native install scripts, browser tests, or database test tools need a reviewed image recipe for those dependencies. No runtime package network is enabled.

Set the image fields and the exact version outputs in `local.execution.cli`. Set both execution and quality UID/GID to the controller user's IDs so it can write disposable worktrees. Preflight measures access from inside the container. Pin the local Unix Docker socket in both profiles.

## 3. Supply host-only credentials and pin GitHub

Store provider keys as private files under `/srv/oxagen-control/secrets/`, readable only by the controller account. Fill the two credential file references in `local.execution`. Do not put keys in the JSON config, prompts, image layers, worktrees, or shell arguments.

Create a private `gh-auth` directory under the control root. Use your organization's approved GitHub CLI login or a private token file supported by the GitHub adapter. The token must have the required rights on the one chosen repository. Normal credential storage and rotation remain the operator's responsibility. [GitHub setup details](adapters/local-github.md) list the exact supported fields.

An interactive login, if your host's credential store is available to the dedicated account, is:

```sh
GH_CONFIG_DIR=/srv/oxagen-control/gh-auth gh auth login \
  --hostname github.com --git-protocol https --web
```

The adapter does not need a new GitHub service. It calls `gh` and Git directly. If the host keyring is unavailable in the minimal runtime environment, use its private token-file option. It passes that value only to the trusted host process and never prints or mounts it for agents.

Use an existing repository with an initial default-branch commit. The adapter never creates an account or repository. Read its numeric repository ID and exact default branch from `gh api repos/OWNER/REPOSITORY` using your actual repository name. Configure the numeric REST `id`, not a GraphQL node ID. Set `targets.repository` and `local.github.repository` to the same `owner/name`.

Configure classic branch protection to require up-to-date checks, enforce them for administrators, and disallow force pushes, branch deletion, and bypass allowances. Use a standard non-admin write account for merges. Preflight reads the actual settings and role; it does not accept a local checkbox. If the writer cannot read protection, configure a separate `policyTokenFile` with read-only policy permissions. It is never used to push or merge.

Set `mergeMethod` to `squash` or `merge`. Pin each required pre-merge and post-merge job by its name and producer ID. Use the check-run app ID, or the commit-status creator ID. These lists must be nonempty. Configure CI to run on both pull requests and the default branch. A missing, skipped, wrong-producer, or still-running job does not count as a pass.

## 4. Review models, data rules, limits, and checks

The local broker currently supports only the model profiles listed in [the execution guide](adapters/LOCAL-EXECUTION.md). Choose each implementation and review model explicitly. Other models are refused until their wire and price profile is added and reviewed.

Review the current price sources and the exported `PRICE_DIGEST`. Set `local.execution.pricingApproval.expiresAt` to a reviewed expiry no more than 31 days away. The supplied expiry is invalid on purpose. Approval of a price file is not a promise that a provider will never change its prices; recheck before use.

Replace the example literal data rules with approved rules. Every supported JSON key and value is scanned before it reaches a provider. These simple rules block, redact, or replace known text. They do not find all unknown secrets or personal data. This build-runner helper is not the full product data-protection engine.

Set a finite positive `runBudgetCents` only when you authorize paid work. The per-batch cap and per-call reservation also apply. The broker reserves a conservative worst-case context/output cost; small caps may stop a call before dispatch. Keep unused and unknown liability separate.

`local.quality.commandsByBatch` names the actual checks. The sample expects `phase0/check.mjs` for design checks and `tests/batch-check.mjs` for product checks, each with the batch ID. The implementer receives these exact commands and must create meaningful checks in its allowed paths. The independent reviewer rejects missing or no-op checks. Replace this convention with the real project checks before certification if needed. A command's exit code does not prove that its tests are sufficient.

Do not add credential variables to `hook.env`; the local launcher permits only PATH. Use private host credential files. The signed profile binds the launcher, images, model choices, limits, and quality/GitHub configuration.

## 5. Run the unpaid preflight

```sh
/srv/oxagen-control/runner/run.sh preflight \
  --config /srv/oxagen-control/config.json
```

This performs real local isolation probes, exact CLI version/help checks, and a synthetic two-request model/tool round trip. It checks all configured quality commands, reads GitHub identity, and fetches the existing default branch into the protected bare repository. It creates no PR, merge, or paid model request.

If the CLI fixture fails, stop and fix that pinned image/profile. Do not skip the probe or claim compatibility based only on a help flag. A successful fixture is still not live-provider qualification. Before production use, qualify the profile's real provider billing, shutdown, and hostile-input behavior under an explicitly approved test budget.

## 6. Review designs, sign once, and run

The `run` command may spend the configured budget. Its first four batches produce and review only local design files. It then stops before product work if the required certificate is absent. It does not publish those design branches to GitHub.

The [README](README.md#certification-before-product-work) gives the exact snapshot and manual signing commands. Keep the certifier's private key outside all agent and controller mounts. Install only its public key in `certifierPublicKey`. The signer reviews the complete phase-zero tree and execution settings before signing. No approval has been supplied with this package.

After certification, the runner implements each batch, gets a fresh opposite-harness review, runs the configured local checks, creates a PR, waits for required CI, verifies the actual merge result, and waits for checks on that merge commit. It keeps durable records for resume and bounded repair.

Use `status`, `cancel`, `reconcile`, and `retry` as documented. Never delete unknown cost holds or edit journal records. Before the release stage, complete the AWS setup, infrastructure review, exact-image checks and required certification in [RELEASE-SETUP.md](RELEASE-SETUP.md).
