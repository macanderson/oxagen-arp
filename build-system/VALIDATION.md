# Build and AWS release validation

Checked on 20 September 2026 using Node v24.21.0, local Git, real local Unix sockets with fake provider replies, and controlled Docker/GitHub/AWS command fixtures. No paid model request, Linux Docker run, live GitHub write, real CI job, product build, merge, cloud provisioning or deployment ran.

## Results

The complete `node --test test/*.test.mjs` suite passes **131 tests, 0 failures** after the concurrent wave scheduler landed (three concurrency tests) and after merging the AWS release modules and the 2026-09-20 review fixes (a split invocation test and a ledger-liability test). The 22-batch plan passes dry-run validation. A temporary bootstrap installed the AWS modules and templates, left money and release disabled, and produced the correct installation digest; the `local-host.mjs` entry point, the mTLS client call, and the runner commands other than `retry` still have no automated test.

| Area | Tests | Evidence |
|---|---:|---|
| Original controller and optional mTLS client | 26 | Signed inputs, bounded steps, opposite review, path checks, journal locks, unknown effects, certificate rechecks and rollback state recovery. |
| Local model execution | 16 | Real socket requests with fake replies, scan-before-send, blocked unsupported paths, shared integer money reservations, unknown liability, pricing expiry, Docker arguments and tool fixtures. |
| Exact-head local quality | 9 | Fresh source snapshots, explicit checks, actual exit handling, missing/failed checks, isolated scratch, cleanup and reconciliation. |
| GitHub | 21 | Pinned repo, PR/CI producers, squash/merge parents and tree, actual merged-head CI, branch protection, token separation, races, lost replies and locks. |
| Local integration | 10 | Certification before product work, source/profile binding, exact merge checks, saved receipts, bounded repair, installation hashes including infrastructure code, release dispatch and stopped rollback recovery. |
| Artifact builder | 5 | Exact Git source, OCI source/digest checks, same bytes for both accounts, no build credentials, ECR mismatch, immutable destinations and read-only lost-upload recovery. |
| AWS release adapter | 19 | Full simulated release flow; source-bound migration; snapshots and clone checks; new/old compatibility order; private, bounded and healthy baseline; scoped test tasks; approval expiry; malformed replies; partial and lost writes; failed health; rollback; conditional lock cleanup. |
| Production approval signer | 1 | Exact reviewed bytes, private key, stale/replacement rejection, and no deployment side effect. |
| Local development | 5 | Pinned images, private storage, secret files, loopback ports, explicit health/setup dependencies and no privileged or Docker-socket mounts. |
| AWS infrastructure | 13 | Scoped IAM, template controls, exact setup parameters, image command alignment, release-action permissions and output-to-target mapping. |

Both AWS templates passed **cfn-lint 1.57.0**. The generator reproduced their exact bytes. Inline IAM policy sizes were checked. See the [infrastructure validation record](infrastructure/aws/VALIDATION.json) for hashes and scope. The registry foundation has 6 resources; the environment template has 87 resources, 42 parameters and 59 outputs. These counts are not a cloud readiness result.

## Independent review and corrections

The [independent AWS review](INDEPENDENT-REVIEW.md) examined the artifact builder, release integration, adapter and infrastructure together. Findings were corrected before the final run: new-table RLS defaults, conditional lock release, approval expiry at each production write, isolated rehearsal roles/settings, new-write then old-read compatibility checks, complete health observations, exact IAM action/resource mappings, all effective setup parameters, typed AWS response checks and private migration-journal ownership. The final additional baseline test rejects public tasks, a root container, excessive replicas, an in-flight deployment and an unhealthy old release.

The earlier local-execution review also led to concrete Docker/CLI, model broker, quality and GitHub implementations in place of a service-only route. The runner keeps design work local before certification, uses actual merge tree/parent proof, distinguishes known failed checks from unknown charges, and cannot clear an unfinished operation while its original wrapper may still run.

No remaining P1 was reported in these bounded reviews. This is not a proof against every runtime failure or attack.

## Implemented scope and remaining qualification

The chosen release target is implemented: ECS/Fargate with separate accounts, Aurora PostgreSQL Serverless v2 and S3. The package includes artifact publication, constrained additive migration rehearsal, signed production approval, rollout, health and rollback/recovery code. It also includes configurable infrastructure and a local-development Compose bundle. It does not rely on an unimplemented deployment service.

The Linux Docker and pinned CLI preflight is implemented but was not run on this macOS host. Qualify the real images, host isolation, provider accounts, price assumptions, wire behavior and cancellation. Unsupported media, opaque state and compaction still stop this narrow model-broker profile. Direct macOS/Windows build-runner support is not claimed.

GitHub tests use fixtures, not a live repository. Qualify real branch rules, identities, CI producers and merge behavior. Quality commands and compatibility probes must be meaningful product tests; a zero exit alone cannot prove full product correctness.

AWS fixtures and template lint do not qualify IAM, OIDC, networking, DNS/TLS, container builds, ECR publication, secrets, Data API execution, PostgreSQL migrations, snapshot restore, service readiness or billing. These need approved account-specific drills. The representative product SQL was not executed against a database here. The supported release grammar is not the full future schema migration system; unsupported or destructive changes require a separate reviewed plan.

AWS alerts are not a hard cloud bill cap. Finite deadlines and resource bounds constrain operations, but retained or uncertain cloud resources keep costing money. Model-call budgets remain a separate enforced accounting path.

**No product certification or production release approval has been supplied.** The earlier gate for desktop/web designs and full API/schema contracts remains in force. One-time setup inputs and live qualification are documented in [RELEASE-SETUP.md](RELEASE-SETUP.md); no account, region or domain is invented.
