# AWS release adapter

This is an executable AWS CLI adapter for three ECS Fargate services and Aurora PostgreSQL Serverless v2. It uses real AWS API calls when enabled. The tests use fake AWS replies; **no AWS account, snapshot, task, image push, migration or deployment was used to qualify this delivery**. Complete an account-specific rehearsal before using it for production. Docker Compose is the local development path, not this release target.

The supported path is deliberately narrow: `api`, `gateway` and `worker`, one container per service, ECS rolling deployments, private Fargate tasks, immutable image digests, two AWS accounts, Aurora PostgreSQL with Data API, and additive schema changes. Other databases, arbitrary SQL, blue/green controllers and destructive migrations stop with an error.

## Entry points

`local-release.mjs` exports:

- `preflight(config, deps)` performs read-only checks of the pinned AWS CLI version, both caller identities, lock table, database and live task definitions. It does not build or push images.
- `execute(request, config, deps)` accepts the runner's release stages and returns `{status:'succeeded', operationId, costCents:0, head, executionHead, ...stageEvidence}`.
- `reconcile(originalRequest, config, deps)` returns `{status:'succeeded', operationId, completedReceipt}` only when durable records and read-only AWS checks support it. It never retries a write.
- `validateReleaseConfig`, `compileMigration` and `verifyProductionApproval` are also exported for setup and tests.

The injected test dependencies are `run(command, argv, options)`, `now()`, `sleep(ms)`, `fetch(url, options)` and `buildArtifact(request, config, deps)`. The production defaults use the installed AWS CLI, the real clock, HTTPS and `local-artifacts.mjs`. Commands are argv arrays with no shell. Every AWS call names its profile and region; the environment excludes ambient credentials, disables metadata credentials and CLI retries, and ignores configured endpoint overrides. The AWS config and credentials files must be private files under the controller directory. Do not configure `credential_process` or external plugins in these trusted files without reviewing that executable as controller code.

`costCents:0` means no **model** charge. It does not make AWS resources free. Set separate AWS budgets and alarms. Finite deadlines limit waiting, not cloud spending after a crash. The probe reserves 65 seconds inside the operation deadline for a bounded 60-second stop-and-confirm attempt for its known task ARN. A host crash or failed cleanup can still leave billable clones, tasks and snapshots; their exact identifiers remain in the protected operation records for cleanup.

## Required configuration

Put this object at `local.deployment`. Fill both target objects from the two reviewed infrastructure stacks. The JSON below shows the shape; angle-bracket values are placeholders, not working credentials. `config.targets.staging` and `config.targets.production` must equal the two target `id` values.

```json
{
  "enabled": true,
  "provider": "aws-ecs-fargate",
  "aws": {
    "command": "/usr/local/bin/aws",
    "version": "2.36.45",
    "homeDir": "/protected/controller/aws-home",
    "configFile": "/protected/controller/aws-config",
    "credentialsFile": "/protected/controller/aws-credentials"
  },
  "timeoutSeconds": 14400,
  "pollSeconds": 10,
  "migration": {
    "path": "infra/release/migration.json",
    "sha256": "<64 hex characters: exact file bytes in the merged commit>"
  },
  "productionApproval": {
    "publicKeyFile": "/protected/controller/production-approval.pub",
    "approvalFile": "/protected/controller/production-approval.json"
  },
  "targets": {
    "staging": "<target object below: staging account>",
    "production": "<same shape: separate production account>"
  }
}
```

Use the exact installed CLI version approved for the controller. Changing it changes the execution profile and requires renewed certification. Each target has this shape:

```json
{
  "id": "<stable target ID>",
  "accountId": "<12 digit AWS account>",
  "region": "us-east-1",
  "profile": "oxagen-staging-deploy",
  "deploymentRoleArn": "<DeploymentRoleArn output>",
  "clusterArn": "<ClusterArn output>",
  "lockTable": "<DeploymentLockTableName output>",
  "releaseScope": "oxagen-staging",
  "namePrefix": "oxagen",
  "services": {
    "api": {
      "name": "<ApiServiceName>",
      "containerName": "api",
      "taskRoleArn": "<ApiTaskRoleArn>",
      "executionRoleArn": "<ApiExecutionRoleArn>",
      "databaseSecretArn": "<ApiDatabaseSecretArn>",
      "compatibilityCommand": ["/opt/oxagen/bin/oxagen", "database", "check-compatibility", "--component", "api"]
    },
    "gateway": "<same fields, gateway outputs and command>",
    "worker": "<same fields, worker outputs and command>"
  },
  "healthUrls": ["https://<approved hostname>/health/ready"],
  "database": {
    "identifier": "<DatabaseClusterIdentifier>",
    "arn": "<DatabaseClusterArn>",
    "secretArn": "<DatabaseMasterSecretArn>",
    "name": "oxagen",
    "engineVersion": "<exact supported Aurora PostgreSQL version>",
    "kmsKeyArn": "<DataKmsKeyArn>"
  },
  "rehearsal": {
    "subnetGroup": "<DatabaseSubnetGroupName>",
    "securityGroupIds": ["<RehearsalDatabaseSecurityGroupId>"],
    "subnetIds": ["<private subnet A>", "<private subnet B>"],
    "taskSecurityGroupIds": ["<RehearsalTaskSecurityGroupId>"],
    "taskRoleArn": "<RehearsalTaskRoleArn>",
    "executionRoleArn": "<RehearsalExecutionRoleArn>",
    "taskFamily": "<CompatibilityTaskFamily>",
    "logGroup": "<RehearsalLogGroupName>",
    "minCapacity": 0.5,
    "maxCapacity": 2
  }
}
```

The task family's compatibility command must exist in **both** old and candidate images. It is not a magic AWS feature. The new-image commands must exercise representative writes that the old-image commands then read and validate. All three new commands run before the three old commands on the same migrated clone. A zero exit code is the application's test contract; the adapter cannot infer complete data compatibility from SQL shape alone.

The approved infrastructure must isolate rehearsal tasks: no route to the source database, no Internet rule, restricted database and AWS endpoint access, and dedicated task/execution roles. Each role's database secret contains JSON `username` and `password`. Only those two fields reach the probe, along with the clone hostname and database name. Provider secrets, runtime config, environment files and the production task's other settings are stripped. The probe is non-root, uses a read-only root and a writable `/tmp`. Its log group is separate. Do not print source customer data or secrets in compatibility tests.

## Release sequence

1. Require successful CI for the actual merged commit. Read the migration file directly from that protected Git object and compare its exact bytes with the certified SHA256.
2. Ask the concrete artifact builder for the three-image bundle. Check its source head, execution profile and digest. The same image digests must be present in each account's ECR repository.
3. Acquire each target's DynamoDB lock using a conditional write. The lock has no timeout or TTL. Require a single completed, healthy old deployment; capture its task definition revisions and image digests. Services must have public task IPs disabled, at most six API/gateway tasks and four workers, and user 10001 with a read-only root.
4. Create an encrypted cluster snapshot. Restore a separate temporary Aurora cluster, create its writer, enable a managed master secret and Data API, apply the constrained migration, and run the six application checks. Confirm the clone is deleted. Retain the source snapshots.
5. Before each target rollout, confirm locks, identities and unchanged old services; take another fresh backup; apply the same migration; register image-bound task definitions; update the three services.
6. Check the exact task definition revisions, exact running task set, named-container health, ECS rollout, attached target groups and HTTPS status 200. The HTTP body is not treated as an artifact attestation. ECS definition bindings provide image identity.
7. Require signed production approval after staging passes. Recheck its exact digest and expiry immediately before every production write. An expired or changed approval stops the operation.
8. Release both locks through conditional deletes only after confirmed production health or a confirmed healthy rollback. A crash, failed check or uncertain reply retains locks and blocks further releases.

ECS does not expose an expected-current-revision compare-and-swap on `UpdateService`. This profile combines an exclusive deployment role, cooperative DynamoDB locks and a fresh service read before each update. Someone with separate AWS administration rights can still change the service. IAM and account change controls are part of the security boundary; this code does not override an AWS administrator.

## Safe migration limits

A source file can contain this plan:

```json
{
  "version": 1,
  "id": "customer-note-v1",
  "operations": [
    {"kind":"add_nullable_column", "table":"customers", "column":"note", "type":"text"},
    {"kind":"create_index", "table":"customers", "name":"customers_note", "columns":["note"]}
  ]
}
```

The grammar permits new tables, nullable columns without defaults, and nonunique indexes. Identifiers and types are allowlisted. It cannot carry arbitrary SQL. New tables get `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY` and `REVOKE ALL ... FROM PUBLIC`; it creates no org policies or runtime grants. Initial schema, org keys, IAM policies and database roles need a separate reviewed provisioning process. Features that require new grants, foreign keys, policy changes, destructive changes or data rewrites must use a separately reviewed migration and recovery plan. This adapter refuses to silently extend its grammar.

Changes run in a PostgreSQL Data API transaction with short lock and statement timeouts. The same transaction writes a migration journal bound to the plan digest, source head and artifact. Existing column shape must survive. The journal also allows an unchanged, previously applied plan to be recorded for a later artifact without repeating the DDL. Before using the journal, the adapter verifies that the current trusted database authority owns it and no other role has a write grant. Broad default table grants therefore block this path until reviewed and corrected. The runtime roles must not inherit the master role or have database administration rights.

## Approval and recovery

Use the controller's `approve-release.mjs` with a reviewed body containing `executionHead`, `artifactDigest`, `target`, `releaseId`, `expiresAt` and a nonce of at least 16 characters. The output is `{body,signature}`. Signatures are Ed25519 over canonical JSON; expiry may be at most 24 hours away. Keep the private signing key separate from the runner and agent worktrees. Missing approval is an expected stop: supply the signed file, then reconcile the pending authorization operation.

Every mutation has a durable intent before dispatch and a confirmed result after the reply. Files are private, fsynced and bound to the original request and execution profile. A repeated operation ID cannot issue another write. Read-only reconciliation can adopt a completed receipt, a fully issued deployment whose exact AWS state and migration journal match, or completed terminal lock removal. It does not reconstruct missing multi-step work by guessing. Partial snapshot, migration, probe or rollout work remains stopped for a reviewed recovery. A lost commit reply is never treated as proof that nothing happened.

Rollback requires the confirmed failed health receipt, captured old definitions, successful new/old compatibility tests and preserved schema shape. It restores the old images, keeps the additive schema and all data, then verifies health. It never restores a database snapshot over live data. Application behavior beyond the test contract may still require a forward fix. The runner remains stopped after rollback rather than quietly resuming the failed release.

## Validation and primary references

Run `node --test test/local-release.test.mjs` from `build-system`. The fixtures cover source hash binding, role/account checks, the full release path, stripped probe credentials, old/new ordering, lost replies, partial rollout holds, signed approval, expiry during snapshot work, and rollback. They validate the adapter's command and state logic, not an AWS account's IAM or network configuration.

The commands follow the current official AWS references: [ECS UpdateService](https://docs.aws.amazon.com/cli/latest/reference/ecs/update-service.html), [RegisterTaskDefinition](https://docs.aws.amazon.com/cli/latest/reference/ecs/register-task-definition.html), [RunTask and its client token](https://docs.aws.amazon.com/cli/latest/reference/ecs/run-task.html), [cluster snapshots](https://docs.aws.amazon.com/cli/latest/reference/rds/create-db-cluster-snapshot.html), [restore a cluster](https://docs.aws.amazon.com/cli/latest/reference/rds/restore-db-cluster-from-snapshot.html), [manage its secret](https://docs.aws.amazon.com/cli/latest/reference/rds/modify-db-cluster.html), [enable Data API for Serverless v2](https://docs.aws.amazon.com/cli/latest/reference/rds/enable-http-endpoint.html), [Data API transactions](https://docs.aws.amazon.com/cli/latest/reference/rds-data/commit-transaction.html), and [DynamoDB conditional writes](https://docs.aws.amazon.com/cli/latest/reference/dynamodb/put-item.html).
