# Local build runner validation

Checked on 20 September 2026 using Node v24.21.0, local Git, real local Unix sockets with fake provider replies, and controlled GitHub/Docker command fixtures. No paid model request, Linux Docker run, live GitHub write, real CI job, product build, merge, or deployment ran.

## Results

The complete `node --test test/*.test.mjs` suite passes **79 tests, 0 failures** in the final independent run. The 22-batch plan passes dry-run validation. Bootstrap was also checked in a temporary directory: it installs the local adapter, leaves money disabled, sets correct paths and installation hashes, and starts no repository or agent work.

| Area | Tests | Evidence |
|---|---:|---|
| Original controller and optional mTLS client | 26 | Exact signed inputs, bounded steps, opposite review, worktree/path checks, journal locks, unknown effects, saved receipts, certificate rechecks, rollback state recovery. |
| Local model execution | 16 | Real socket requests with fake provider replies, scan-before-send, denied paths/media/remote handles, shared integer money reservations, retained unknown liability, terminal usage, pricing expiry, structured results, Docker arguments and synthetic tool fixtures. |
| Exact-head local quality | 9 | Fresh source snapshots, explicit commands, preparation/test exits, missing or failed checks, separate writable scratch, cleanup, and reconciliation. |
| GitHub | 21 | Pinned repository, PR/CI operations, paginated/latest checks and producers, squash/merge parents and tree, actual merged-head CI, strict classic protection, token separation, base changes, lost responses, locks and process cleanup. |
| Local integration | 7 | Local-only design work, certification of settings, remote-base review, actual squash commit checks, durable result adoption, bounded check repair, complete code hashes, and live/missing-wrapper recovery guards. |

The independent review found no remaining reported P1 issue within this bounded scope. It examined the new local executor and quality modules, the controller's local integration, receipt recovery, and the final protected GitHub merge path. This does not certify all possible runtime or adversarial behavior.

## Changes prompted by review

The original service-only route did not meet the requirement for local execution. The default configuration now uses actual Docker/CLI, model broker, quality, and GitHub modules. The optional mTLS client remains separate.

The local code rejects remote file handles and unsupported nested tools, rechecks price approval before each paid request, disables Docker logging, pins a local Unix daemon, measures bind-mount/UID access, and records the exact preflight profile. It keeps controller credentials outside agent mounts.

The controller signs the local launcher and settings, hashes executable adapter/helper files, keeps design work off GitHub before certification, distinguishes the local design tip from the actual remote review base, and checks the real merged commit. Known test failures have bounded repair; unknown charges do not. Reconciliation cannot clear an unfinished operation while its original wrapper may still run or its startup is unproved.

GitHub merges require measured classic branch protection, exact CI app bindings, checks enforced for administrators, no force/delete/bypass allowance, and an ordinary non-admin writer. A separate read-only credential may inspect policy. The adapter still proves the actual merge tree and parents and checks CI on that commit. It does not claim the merge API itself provides an expected-base compare-and-swap.

## What remains unverified or incomplete

The Linux Docker and actual installed-CLI preflight is implemented, including an unpaid two-request tool loop, but it was not run on this macOS host. A real supported host must qualify the pinned images, provider accounts, pricing/billing assumptions, live CLI wire behavior, and cancellation under host failures. The broker supports only its documented text and model profiles; large sessions needing unsupported compaction stop.

GitHub tests use command fixtures, not a live repository. Required branch protection, identity permissions, CI producers, and actual merge behavior must be qualified on the selected repository before live use. Quality images need the project's reviewed dependencies and real checks; neither a test exit nor a model review proves full product correctness.

**Deployment and rollback implementation remain incomplete pending the user's staging/production hosting-platform choice.** The local route stops before deployment with `HOSTING_TARGET_REQUIRED`. No unspecified external service is presented as a completed release integration. No product certification or production authorization has been supplied.
