# Independent AWS release review

Scope: the local artifact builder, release controller integration, ECS/Aurora release adapter, and CloudFormation configuration. This review uses source inspection, official command documentation, real local Git snapshots, and mocked Docker/AWS replies. No live image build, image push, AWS provisioning, Data API request, or paid model call was made.

## Verification so far

- Five local Compose checks pass. The bundle supplies real storage configuration and a future image contract, not a pretend product.
- The final independent combined artifact/release/integration/Compose/AWS run passes **46/46**, including eighteen release cases. These tests cover approval expiry, exact artifact/source binding, migration hashes, new-then-old compatibility probes, failed probes, uncertain and partial deployments, conditional lock release, known failed-health rollback, malformed replies, and migration-journal write grants.
- After the IAM and setup corrections, the expanded AWS infrastructure suite passes **12/12** independently (four more cases than the combined run). It checks clone/snapshot permissions, tagged task creation and cleanup, ECR publication scope, and complete reviewed CloudFormation parameters.
- Docker's current reference supports the selected Buildx network, output, provenance, and resource options. Skopeo's implementation writes the raw manifest without adding a newline; the builder compares its raw SHA256 with the reported digest and preserves that digest during copy.

## Findings corrected during review

1. **New tables lacked default-deny row protection.** The constrained compiler now enables and forces RLS and revokes public privileges before committing newly created tables. The real product's org keys, policies, grants, and bootstrap remain separately certified work; this narrow compiler is not a complete application schema installer.
2. **Terminal releases retained locks forever.** Confirmed production health or confirmed rollback now records its terminal outcome before conditionally deleting only its own environment locks. Partial or uncertain work retains its lock. Read-only recovery checks the exact saved terminal outcome and observed absence before adopting a lost final reply.
3. **Production approval could expire during a long snapshot.** The adapter now pins the signed authorization receipt and checks that same approval and its expiry before every production deployment mutation.
4. **Rehearsal tasks inherited production execution settings.** Probe definitions are now constructed from a small allowed field set, using dedicated task/execution roles and logs, explicit clone connection fields, and scoped database secrets. Production environment files, provider settings, and unrelated inherited task configuration are absent.
5. **Old compatibility ran before new writes.** New-image probes now run before old-image probes on the same restored database. The documented command contract must test backward-compatible writes. This is a declared compatibility profile, not proof that any arbitrary data migration can be reversed.
6. **Incomplete task observations could count as healthy.** Readiness now requires the exact task ARN set, running state, expected task definition, and the exact named healthy container. Missing, partial, or stale stopped-task evidence stays unconfirmed.

## Cross-adapter findings corrected

7. **The probe task family did not match IAM.** Infrastructure permits `ecs:RunTask` only for the dedicated compatibility family. Probes now use that configured family and per-role database secret selectors. The fixture release exercises this path.
8. **Rehearsal API calls were missing IAM rights.** The generated deployment role now includes clone-only `rds:EnableHttpEndpoint`, bounded `rds:ListTagsForResource`, and tag scope for owned clones and release snapshots. This addresses API/resource alignment; live policy evaluation remains an environment qualification step.
9. **CloudFormation review did not bind omitted parameter values.** Setup checked defaults locally but originally sent and compared only the parameters explicitly in the input file. It now resolves all defaults before planning and compares the full remote parameter map, so an old remote value cannot silently survive outside the reviewed receipt.
10. **Missing AWS response fields could count as proof.** Typed SELECT records, the exact committed transaction status, and explicit cluster/member arrays are now required. Unknown replies retain the release hold. The independent regression run passes all three malformed-reply cases.
11. **Tagged rehearsal tasks needed task tagging authority.** `RunTask` now has tagging authority on the exact cluster task prefix with `ecs:CreateAction=RunTask` and the required purpose/release tags. Task-definition tagging remains separate. This follows the [AWS tag-on-create contract](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/supported-iam-actions-tagging.html).
12. **Migration proof needed a trusted writer.** The adapter revokes public journal privileges and checks its owner and mutation ACLs before using it. A fixture with an application write grant is rejected. The separately reviewed database bootstrap must also prevent application roles from assuming the database authority role.

The local and AWS container contracts now use the same explicit `/opt/oxagen/bin/oxagen` entrypoint, `serve` command, and component health command. Real reviewed images must implement that contract; no placeholder product image was supplied.

## Checks that held

The artifact builder reads the exact merged commit from protected Git metadata, verifies actual-commit CI, removes Git metadata from its fresh source copy, and rejects source symlinks/submodules in this profile. Each build/push intent is durable before dispatch. Interrupted builds cannot be rerun automatically. Read-only artifact recovery requires all archives to retain their original hashes and all destination images to exist at their exact digests. It never rebuilds or republishes.

The build command receives an empty Docker login configuration and no AWS/provider environment. Publishing happens through separate ECR-only identities, checked in each account. Actual image manifest digests and source labels are verified before the bound release evidence is used. Killing a Docker client does not prove its BuildKit job stopped; unfinished work remains blocked.

The controller retains uncertain external operations, binds receipt adoption to the original payload/profile, and uses the same rollback checks for direct and recovered results. Rollback stays stopped afterward and requires a new reviewed release plan. Staging and production must have different accounts; service, task role, execution role, cluster, database, encryption key, and managed secret references are explicit.

The migration grammar permits only small additive changes, runs under a transaction with lock/statement timeouts, and verifies existing column shapes. Restore checks use a separate encrypted cluster, real old/new application commands, and confirmed clone cleanup. Source data is not restored over production during code rollback.

Live IAM policy evaluation, restored-secret behavior, actual task health commands, provider billing, and AWS service readiness still require environment qualification. Static and mock tests do not establish those facts.
