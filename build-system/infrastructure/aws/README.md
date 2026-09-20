# AWS deployment foundation

This package defines separate staging and production deployments on ECS/Fargate. It uses native CloudFormation and AWS CLI v2. It has not created any AWS resources or passed a live deployment qualification.

Use separate AWS accounts for staging and production. Account, region, profile, network, keys, certificate, domain and secret references are explicit inputs. The templates do not create accounts, buy domains, issue certificates, supply credentials, or infer a customer's network.

## Bootstrap order

1. An operator supplies an approved VPC, public ALB subnets and private task/database subnets across at least two availability zones. Private subnets must not route directly to an Internet gateway. They need an S3 gateway endpoint and the correct regional S3 prefix list. The template creates private interface endpoints for ECR, CloudWatch Logs and metrics, Secrets Manager, KMS and SQS; use a VPC without conflicting private-DNS endpoints for this profile. Only the gateway receives the explicitly configured HTTPS provider/proxy egress rule. Its private subnet needs the corresponding controlled outbound route.
2. Supply existing customer-managed KMS keys, an issued ACM certificate in the target region, a DNS hostname covered by it, a protected controller IAM role, and a separately approved CloudFormation provisioning role. KMS policies must permit the named AWS services and authorized roles: CloudWatch Logs needs its regional service principal and log-group encryption context; SNS/CloudWatch alarm delivery, RDS, Secrets Manager, ECR, S3 and DynamoDB need their documented service grants. A key ARN alone is not an access grant.
3. Review and apply `registry.json` in each environment. It creates three immutable KMS-encrypted ECR repositories, a private versioned infrastructure-template bucket, and an **ECR-only artifact-publisher role**. This role cannot deploy services, change IAM or read database credentials. Registry creation does not require a nonexistent application image.
4. Build approved baseline `api`, `gateway` and `worker` images once. Publish those exact image digests to staging and production through their separate publisher roles. Do not rebuild the production copy. Record each role's repository URI, ARN and digest. Enhanced ECR scanning is an account/registry setting: configure and qualify that service separately; this template does not pretend a repository flag provides a vulnerability gate.
5. Create each role's own runtime secret and separate database-user secret. Database secrets contain `username` and `password`; runtime secrets contain only that role's approved settings. No app task receives the database master secret. Secret values never belong in parameter files. Supply ARNs only.
6. Review/apply `environment.json` with `EnableServices=false` and the real published baseline images. It creates the data plane, task definitions and services with zero running tasks. Use the trusted bootstrap/migration authority to create the least-privilege database users, schema and row-level security required by the certified application. Set the DNS alias to the returned ALB address and confirm notification subscriptions.
7. Review a second change set with `EnableServices=true`. Only do this after image, database-user, secret, health and application checks are ready. Initial infrastructure provisioning and enabling production remain explicit operator actions. The autonomous release controller updates these pre-provisioned targets; it is not the infrastructure administrator.

Phase-zero certification and the operator's target approval precede paid provisioning. These files supply the infrastructure contract; they do not certify the application or the operator's account configuration.

## Reviewable setup commands

Copy `config.registry.example.json` or `config.environment.example.json`, replace every placeholder, and keep the completed files under the protected controller directory. The examples deliberately cannot pass validation unchanged.

```sh
python3 infrastructure/aws/setup.py validate --config /protected/staging-registry.json
python3 infrastructure/aws/setup.py preflight --config /protected/staging-registry.json
python3 infrastructure/aws/setup.py plan --config /protected/staging-registry.json --change-set-type CREATE --receipt /protected/staging-plan.json
```

`validate` is offline. `preflight` makes read-only AWS calls and checks the account. `plan` uploads a versioned template when needed and creates a CloudFormation change set, but does not execute it. The larger environment template uses `template_bucket` from the foundation output; the provisioning role needs read/decrypt access to that private bucket. Review the change-set ARN and AWS change details before applying:

```sh
python3 infrastructure/aws/setup.py apply --config /protected/staging-registry.json --change-set-arn REVIEWED_CHANGE_SET_ARN --receipt /protected/staging-plan.json --approve-account EXACT_ACCOUNT_ID --approve-stack EXACT_STACK_NAME
```

Apply checks the target account, exact template, every effective parameter including defaults, provisioning role and reviewed change set. Omitted setup values are resolved before review; an update cannot silently keep a previous value outside that receipt. It requests execution; that is not a readiness result. Inspect stack events, then export real identifiers:

```sh
python3 infrastructure/aws/setup.py outputs --config /protected/staging-environment.json
```

Use a different config, account/profile and approval for production. A failed or uncertain infrastructure operation must be reconciled through CloudFormation state; do not create a second stack as an automatic retry. Changing a service through the release adapter can create CloudFormation drift: before a later infrastructure change set, reconcile the template's task-image parameters and service definitions to the current approved release. Never let an unrelated infrastructure update silently restore an old image.

## Running services

There are three single-container Fargate services. Each task uses 0.5 vCPU and 1 GiB memory, a non-root user, a read-only root file system and a writable `/tmp` volume. ECS Exec is disabled. The shared local/cloud image entrypoint is `/opt/oxagen/bin/oxagen`. Its command is `serve api`, `serve gateway` or `serve worker`. The health command is `/opt/oxagen/bin/oxagen health --component ROLE --ready --quiet`. Both old and candidate images must also implement `database check-compatibility --component ROLE` for restore rehearsal.

This cloud profile injects `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_SSLMODE=verify-full`, `DB_USER` and `DB_PASSWORD`; the last two come from each role's Secrets Manager JSON fields. Local Compose uses `OXAGEN_DB_*` and password files. The same certified image must accept both explicit configuration profiles, reject conflicting simultaneous values, and keep secrets out of logs. Cloud tasks also receive `OXAGEN_RUNTIME_CONFIG`, `ARTIFACT_BUCKET`, `WORK_QUEUE_URL`, `RELEASE_IMAGE_DIGEST` and `OXAGEN_ENVIRONMENT`. Restore probes strip runtime/provider settings and use only clone database settings. Never fall back to a source database when a probe setting is missing.

API listens on 8080. Gateway listens on 8081. Both serve `/health/ready`; the gateway also accepts `/gateway/health/ready` because the ALB preserves the `/gateway/*` prefix. All public traffic uses the supplied TLS certificate. Worker readiness is its container health result, not an HTTP endpoint. Applications publish a sanitized `Oxagen/Runtime` HealthyHeartbeat metric with Environment and Service dimensions. Operational logs must never contain raw prompts, tool bodies, credentials or secrets; the application's protected record path is separate from lossy operational logging.

Each service gets its own task role, execution role, runtime secret and DB-user secret. PostgreSQL connections must use TLS with hostname and CA validation. Images must include the appropriate RDS CA bundle. The S3 artifact bucket is private, encrypted and versioned. Application roles can read/write objects but cannot delete saved versions. Aurora is encrypted, forces TLS, has automated backups/PITR, snapshot-on-replacement/deletion and deletion protection. Production gets a second Serverless v2 instance for failover. Retained S3 objects and logs outlive a deleted stack; versioning is not a substitute for a separately tested cross-account backup policy.

Automatic minor database upgrades are disabled in this pinned release profile. Schedule and approve security updates, test the selected version, then update the stack and release target together. An unplanned version change blocks release qualification.

## Release and restore rehearsal

The deployment role can update only this stack's three services, pass only the named task/execution roles, inspect the configured repositories, use the deployment lock, perform Data API work against the source/qualified rehearsal database, and manage snapshots/clones with the named release prefixes. It cannot create IAM roles, change networking, edit CloudFormation or push images.

Outputs match the release adapter: ECS cluster/service/task identifiers; target groups and HTTPS health URLs; database cluster/subnet/key/master-secret references; lock table; and rehearsal security groups, roles, logs and task family. The managed master secret is restricted to the trusted migration authority. Rehearsal-secret reads also require the AWS-managed `aws:rds:primarydbclusterarn` tag to match this environment's rehearsal prefix. Target qualification must prove that RDS creates this tag and that secret rotation, clone creation and cleanup work in the selected region/version.

Rehearsal tasks use their dedicated execution role and a task role with no business permissions. They receive only the selected app database credentials and the clone endpoint; no provider/runtime secrets. Their security group can reach the clone DB security group, private AWS endpoints and the regional S3 prefix list needed for ECR image layers. It has no Internet/NAT egress rule and is not admitted to the source database. The existing S3 endpoint policy should restrict access to approved ECR layer buckets and approved object destinations; network reachability alone is not an application grant.

The DynamoDB lock key is `release_scope`. **There is no TTL.** An uncertain deployment retains ownership until the controller proves the old owner stopped and reconciles the effect. A lease timeout does not permit an overlapping deployment.

Compatibility tasks carry `oxagen:purpose=compatibility` and a nonempty `oxagen:release` tag. IAM permits their creation only in the compatibility family and permits tagging only during `RunTask`; stop authority requires those resource tags. The protected controller still checks the exact release ID and returned task ARN. These static IAM rules do not substitute for that per-release ownership check.

The templates provide real snapshot/clone authority, not an automatic claim of a tested restore. The adapter must restore, run old/new image compatibility checks against the clone, record results and clean up its rehearsal resources. Destructive or incompatible migrations are outside the supported additive-migration profile and must block.

## Map stack outputs to the controller

Save `setup.py outputs` for each registry and environment stack as four JSON arrays. `render-targets.py` reads those files and the two reviewed environment setup files. It performs no AWS calls and never reads secret values. It rejects mismatched accounts, repositories, database versions and subnets. Its output is a configuration fragment for `local.artifacts.targets`, `local.deployment.targets` and the runner's target IDs.

```sh
python3 -B infrastructure/aws/render-targets.py \
  --staging-setup /protected/staging-environment.json \
  --staging-environment-outputs /protected/staging-environment-outputs.json \
  --staging-registry-outputs /protected/staging-registry-outputs.json \
  --staging-target-id oxagen-staging \
  --staging-publish-profile oxagen-staging-publish \
  --staging-deploy-profile oxagen-staging-deploy \
  --production-setup /protected/production-environment.json \
  --production-environment-outputs /protected/production-environment-outputs.json \
  --production-registry-outputs /protected/production-registry-outputs.json \
  --production-target-id oxagen-production \
  --production-publish-profile oxagen-production-publish \
  --production-deploy-profile oxagen-production-deploy
```

Review and merge this fragment into the protected controller configuration. It does not fill in tool paths, CLI versions, signed approval files, migration digest, image build inputs or secret material; use the artifact and release adapter configuration for those fields. The renderer supports the commercial AWS partition used by the current release adapter. It rejects other partitions. Offline mapping cannot prove that an exported output file is genuine; the live adapter must confirm the account, assumed role and current resource state before release.

## Capacity, alarms and identity

CloudFormation limits configured desired counts to 1–6 API/gateway tasks and 1–4 workers. Rolling replacement may temporarily reach twice the desired count. Aurora capacity is bounded per instance by the chosen limits; production has two instances. These are declared deployment settings, not an immutable account-wide resource ceiling.

Monthly AWS Budgets notifications cover account costs, with actual/forecast thresholds. Email subscriptions require confirmation where applicable. Budgets and CloudWatch alarms do **not** stop charges. ECR, interface endpoints, load balancers, snapshots, retained records, NAT/egress and failed rehearsal resources may continue to cost money. The application/model budgets described by ARP are a separate enforcement system.

The optional GitHub OIDC trust is restricted to one exact repository, one exact `staging` or `production` environment subject, and `sts.amazonaws.com` audience. Configure GitHub environment protection and restrict which refs can target each environment. An OIDC token does not grant account administration. The protected local controller role is the other explicit assume-role principal.

No allow policy grants wildcard administrative actions. A few AWS APIs do not offer useful resource-level authorization: ECR authorization-token retrieval, ECS task-definition registration/read inventory, certain RDS/ALB/CloudWatch describes and metric publication use `Resource: "*"` with a region, cluster or metric-namespace condition. Resource-changing operations otherwise name the environment's resources or narrowly named rehearsal resources. These roles still need live IAM qualification; schema validation cannot prove an AWS authorization outcome.

## Validation and sources

`generate-templates.py` rebuilds the checked-in JSON without making AWS calls. Run cfn-lint and the focused Node tests after edits. This task ran cfn-lint 1.57.0 and the included checks; no live AWS deployment, TLS request, restore, IAM evaluation, Data API call or billing event was performed.

Primary references: [ECS service](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-ecs-service.html), [Aurora cluster](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-rds-dbcluster.html), [ECR repository](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-ecr-repository.html), [task secret references](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-ecs-taskdefinition-secret.html), [Data API authorization](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.access.html), [GitHub OIDC trust](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html), [AWS Budgets](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-budgets-budget.html), and [AWS RDS rotation sample using the managed-secret tag](https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas/blob/master/SecretsManagerRDSPostgreSQLRotationMultiUser/lambda_function.py).
