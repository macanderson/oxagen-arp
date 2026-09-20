# AWS release setup

The selected hosted target is **AWS ECS with Fargate**. The app/API, gateway and workers are three services. Each environment uses Aurora PostgreSQL Serverless v2 and S3. Staging and production use separate AWS accounts. Docker Compose is for local development. Kubernetes is deferred until a concrete need justifies it.

The package contains operational code and infrastructure templates. It does not contain the product services yet. **The user must certify the desktop/web designs and full API/schema contracts before product implementation. That certification has not been given.** No cloud account, region, network, domain, certificate or credential is invented here. No AWS resource was provisioned, and no product build or deployment ran for this document.

## What is supplied

| File | What it does |
|---|---|
| [AWS infrastructure](infrastructure/aws/README.md) | Configurable CloudFormation for registries, network-linked services, Aurora, S3, keys, roles, backups, locks and alerts. The setup tool prepares a reviewable change set by default. |
| [Image builder](adapters/local-artifacts.md) | Builds OCI archives from the exact merged commit after CI, then copies the same image digests into both accounts. |
| [Release adapter](adapters/local-release.md) | Makes snapshots, restores private test copies, applies the supported schema changes, runs actual old/new app checks, deploys ECS task definitions, checks health and handles recovery. |
| [Approval signer](approve-release.mjs) | Signs a reviewed exact-release production approval with a private Ed25519 key. It is run manually and starts no deployment. |
| [Local development](infrastructure/local/README.md) | Runs reviewed product images with local PostgreSQL and S3-compatible storage. It is not an AWS or production qualification. |

## One-time inputs

Fill these in from real, reviewed infrastructure. Start with the disabled [release configuration fragment](examples/local-release.json) and [artifact configuration fragment](examples/local-artifacts.json), then merge reviewed values into the controller config. Keep the resulting configuration under the protected controller root. Placeholder values deliberately fail live validation.

| Input | Required choice |
|---|---|
| AWS identity | Separate staging and production account IDs, exact region, named CLI profiles and role ARNs. Pin an installed AWS CLI v2 version. |
| Network and HTTPS | VPC, private service/database subnets, HTTPS load balancer subnets, certificate ARN and approved health URLs. Configure DNS and egress through the reviewed network setup. |
| Storage | Aurora engine version supported in that region, database name, bounded capacity, encryption keys, runtime secret references, object bucket and backup retention. |
| Release access | Separate infrastructure-setup, artifact-publisher, deployer, runtime, database-maintenance and production-approver authority. Install only secret references in service settings. |
| Existing baseline | Reviewed baseline images and a working certified schema. The regular release adapter updates that known baseline; it does not pretend a nonexistent initial app passed rollback tests. |
| Product checks | Exact Dockerfile paths, approved dependency images, source-bound migration plan, real old/new compatibility commands and ready/health routes. |
| Limits | Finite model money/time bounds, release deadline, builder CPU/memory/disk limits, service counts, database capacity and cloud alert threshold. |
| Approval | Public approval key and approval-file path. The private signing key stays outside the controller and all agent mounts. |

Create the immutable ECR registries first using the registry template. That stack needs no placeholder product image. After product certification and implementation, build the reviewed baseline images, provision the initial environment with those exact images and the certified schema, and qualify its health and recovery. Only then use the regular update path. First installation is a reviewed infrastructure/bootstrap task; there is no fake old release to roll back to.

The [AWS template guide](infrastructure/aws/README.md) lists exact parameters, stack outputs and setup commands. The included offline output mapper turns real stack outputs into both environments’ artifact and release target settings. Its review/change-set step does not certify the product. Applying a change set can provision paid resources and needs a deliberate operator action. The runner itself does not create those foundation stacks.

## Keep access separate

The agent containers receive no AWS credentials, signing key or Docker socket. The host-side artifact publisher can write only the approved ECR repositories. It cannot deploy services or read database secrets. The deployer can update the named ECS services and perform the bounded database rehearsal operations. It cannot sign production approval.

App tasks use their own restricted roles and database users. They do not receive the managed master database secret. Schema compatibility tasks use a separate rehearsal role, execution role, network and test-copy credentials. A task testing an old app must not inherit production secret files, logs, sidecars or environment files.

Use short-lived assumed roles and protected profile files. Optional CI roles must trust a specific repository and environment through OIDC. Do not make a pull-request identity a production deployer. Cloud IAM is separate from Oxagen's human/agent permission layer: both are required at their respective boundaries.

## Build and test the exact release

The final product batch must have a fresh review, merge proof and CI on the actual merged commit. The release adapter then builds the API, gateway and worker images once. The image bundle records source commit, source tree, image digests and settings. Staging and production receive the same image bytes, even though their registry URLs differ.

The current release profile permits a limited, declarative set of added database changes. The plan file comes from the checked commit, and its hash is pinned in protected settings. New org tables start with forced row security and no public grants. Unsupported SQL, destructive changes and general permission changes are rejected. The full certified schema and role system remain product implementation work; this small release profile does not replace them.

For each environment the adapter makes a snapshot, restores a private copy, applies the candidate change, and runs configured checks using both old and new app images. These commands must actually prove database compatibility. A command that only exits zero is not adequate; the product's independent review and qualification must reject it. The adapter checks real task results but cannot infer whether a poorly written test covers the whole product.

Staging then receives the new images and database change. ECS tasks, container health, load balancer health and configured HTTPS readiness checks must pass. HTTP 200 alone is not proof of source identity; exact image/task records provide that binding. A failed health result blocks the release.

## Approve production after staging

Use the adapter's saved release ID, source commit and artifact digest to prepare the exact approval body described in [the adapter reference](adapters/local-release.md). Review staging evidence and set a short expiry and a new nonce. Run the signer manually:

```bash
node approve-release.mjs /path/to/reviewed-release-body.json \
  /private/production-approver.pem \
  /srv/oxagen-control/production-approval.json
```

This tool signs only the supplied body. It does not grant phase-zero certification, run a product build or deploy anything. The controller checks the public-key signature and exact target/source/artifact match. It rechecks the approval before live production writes. Expiry or drift stops further writes; it does not undo a write already made.

Snapshot and rehearsal work may read the production baseline into a protected test copy before final production approval. That work uses the already reviewed release configuration. The production approval governs changes to the live app and schema. Test copies need the same data-protection controls as the source.

## Failed or interrupted work

Every cloud write saves intent first. A timeout does not mean the write failed. Retain the operation record, exact identifiers, cost/effect uncertainty and release lock. Reconciliation observes known AWS resources and can adopt a proved result. It never blindly repeats an uncertain mutation. Partial or conflicting results require a reviewed recovery using the saved IDs.

A failed app release can return to its saved old task definitions only when compatibility and current schema checks pass. The live database stays in place. There is no automatic destructive down migration or rewind to an old snapshot. If the old app is unsafe, keep the release stopped and use a reviewed forward fix or incident restore plan with a stated loss window. A successful rollback still ends the controller run in a stopped state that requires a new reviewed release plan.

Retain backups under the approved retention policy. Confirm removal of temporary test copies; unknown cleanup remains an operational incident, not a claim that all temporary costs ended. Inspect the adapter's recovery limits before a live drill. Avoid deleting journals, locks or cost holds to force a retry.

## Costs and validation

Cloud costs are separate from model-call budgets. ECS and Aurora capacity bounds, fixed service counts, finite polls and release deadlines limit work. AWS budget alerts do **not** enforce a hard bill cap, and retained databases, snapshots, logs and services continue to cost money. Review the chosen account limits, cleanup and alert ownership before provisioning. No USD cloud estimate is invented here.

Fixture tests cover release transitions and adverse cases; static template checks validate structure and selected controls. These are not live AWS proof. Before customer use, qualify real IAM denials, OIDC conditions, networking, TLS, image publication, Aurora/Data API behavior, backup restore, migration locking, task health, service drift, lost replies and rollback on the chosen accounts. The [validation report](VALIDATION.md) states what actually ran.
