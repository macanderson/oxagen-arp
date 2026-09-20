# Oxagen HTTP API reference

Proposed version `0.1.0-draft`. These are concrete proposed HTTP paths and payloads, not live endpoints or certification evidence. The machine-readable source is [OpenAPI 3.1 JSON](oxagen-openapi-0.1.json). The endpoint inventory is [also available as JSON](endpoint-inventory.json).

## How to read this contract

Every route in this HTTP profile appears below with its method, input, result and permission. The model section lists each field and whether it is required. Unknown request fields are rejected. Server checks still prove cross-record scope, current facts, signature validity, money bounds and state transitions; a JSON Schema pass cannot prove those facts.

The placeholder host `api.oxagen.invalid` is deliberately not a deployment. Use only a tenant-approved authority. IDs in paths are requested scope, not proof of ownership. Unauthorized records can return 404 to avoid disclosing their existence. A browser, CLI, custom SDK and enrolled harness all use the same human/agent/service IAM checks. RBAC, object grants, policy, business limits, current run state and source rights must all pass. Private database rows have tenant/workspace RLS; this does not replace API permission checks.

## Authentication and local data protection

Content-bearing changes require a caller token, enrolled gateway/service mutual TLS, and `Oxagen-Scan-Receipt`. The protected local service signs the complete inspected request and attachments, then sends it. An API key cannot bypass this step. Registering the signed receipt is the narrow prerequisite operation; it accepts no raw prompt. Device bootstrap accepts only its fixed public-key/challenge fields and uses an approved bootstrap policy. It is not a general upload path.

No provider key, refresh token, raw secret, raw prompt copy, raw digest, or uninspected attachment belongs in a request log or error. Credential routes return broker references only. The tenant model proxy uses the exact cleaned request. It relays raw provider replies transiently to the enrolled scanner before persisting cleaned evidence. The same rule covers connector replies and CI callbacks. If scanning is unavailable, pause content flow; safe typed wakeup references may remain pending. Never use a public data store as fallback for a private tenant.

A ScanReceipt binds the canonical content and destination, excluding itself and transport authentication to avoid a circular signature. The final signature transcript and test vectors must be frozen before certification. The token/cost check and governed-action approval bind the final cleaned bytes. Changed content requires another scan and decision.

## Versions, retries, and completion

Every changing command carries `Idempotency-Key`. Existing aggregate changes also require `If-Match: "revision"`. Repeating a key with changed content returns a conflict. Keep financial and external-effect deduplication beyond the HTTP key's cache lifetime. Creation does not let the caller set authoritative timestamps, commit sequences, trusted actor identity, or outcome state.

A 202 response means accepted work. It never proves a run launched, a policy reached a target, a pause completed, a refund succeeded, or an artifact became durable. Read the operation and its relevant proof receipt. Pause requires closed gates, quiet or isolated workers, resolved or safely fenced effects, and a committed save boundary. Late replies remain historical evidence until an explicit adoption. A stopped run cannot be resumed.

Use new attempts only after earlier effects are known or reconciled. Transport retries do not promise exactly-once outside effects. Authorizations are single-use; shared limits reserve all buckets atomically. A stable limit definition survives policy revisions and keeps prior usage. Settlement names the trusted source effect revision; repeated receipts and retry holds cannot charge the same effect twice to one account. Policy exceptions can cross only an explicitly overridable threshold, never a hard ban or higher cap.

## Lists, streams, errors, and fairness

Lists use a caller/scope/query-bound cursor and limit 1–200. Empty results cannot disclose hidden counts. Recheck access on every page, artifact download, event delivery and resumed stream. Responses are `private, no-store`; deployment caches must not widen rights. Protected URLs and cursors are not independent grants.

SSE sends `id`, `event`, and one JSON Event in `data`. Delivery can repeat; deduplicate stable event IDs. Last-Event-ID resumes only within its authorized retained frontier. An expired cursor returns CURSOR_EXPIRED and requires a fresh snapshot; it must not silently skip a gap. Heartbeats contain no customer text. Apply backpressure and bounded per-tenant queues. Preserve a separate capacity lane for authorized stop and revoke requests.

Errors use the Error schema. They provide a safe code, correlation ID and retry rule without quoting rejected secrets. Honor Retry-After on 429. An unknown outcome says reconcile_first; a generic retry loop must not repeat the action. The complete status/error matrix and race tests remain certification gates.

## Tenant creation and external bootstrap boundary

The platform routes accept only verified proof IDs and approved deployment profile IDs. They require a platform-audience service identity and named platform permission. They create an isolated tenant, its first owner principal and grant, and its first checked data-plane binding. They do not confer tenant content access on platform operators. The tenant remains unable to launch work until owner acceptance, storage attestation, initial IAM and activation checks complete. Retries reuse the same provisioning operation.

The preceding identity login, owner acceptance and device/private-install attestation are a separate bootstrap profile. It must pin the identity provider protocol, workload trust roots, proof transcript, challenge expiry and recovery process before release. It is not an undocumented customer-data upload API: only fixed typed public keys, nonces, approved profile IDs and signed proofs may cross it. Free text and files wait for an approved local scanner and tenant binding. The OpenAPI does not claim to define an external identity provider's login routes.

## Setup and first-run order

Create/configure the authorized workspace and connect its repo with an explicit default branch. Enroll the local gateway, then register an unbound harness target. Bind the checked-out repo to that target. Export and inspect `.oxagen` reference files, plan/apply sync, prepare the tool belt, configure the target, and validate preflight. Launch stays blocked until every required binding and control is proven.

A pre-run prepared tool belt is not a run snapshot or execution grant. Work submission freezes its target set and exact work-order/config references. At start, resolve current rights again and record the run's actual tool belt, context, steering and composition manifests. Only the trusted first-model-dispatch and RunStartReceipt prove work actually started. A copied local lock file cannot do so. Repo file schemas under `repo-schemas/` describe export files separately from these HTTP records.

## Transport boundaries

This OpenAPI covers HTTP control routes and checked service envelopes. It does not describe MCP JSON-RPC discovery/calls, CGP frames, provider-native model APIs, native hooks, or protected local IPC. Those need pinned protocol bindings and conformance tests. `gateway.model_dispatch` is the internal checked dispatch envelope; a provider-compatible endpoint requires a separate pinned provider-wire schema, streaming/error mapping and tested adapter. Until that exists, the corresponding harness route is not certified.

Raw third-party webhook signatures and body formats belong to versioned connector adapters. This API accepts their authenticated, inspected, typed receipt, not arbitrary upstream JSON. Future plugin and business-correlation routes return FEATURE_DISABLED without side effects. No marketplace, verifier, partner engine or outcome-correlation implementation is included.

## Endpoint index


### Foundation

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `capabilities.negotiate` | `POST /v0.1/tenants/{tenant_id}/capabilities/negotiate` | CapabilitiesRequest → Capabilities (200) | `capabilities.negotiate` |
| `identity.get` | `GET /v0.1/identity` | none → Identity (200) | `identity.read` |
| `tenant.get` | `GET /v0.1/tenants/{tenant_id}` | none → Tenant (200) | `tenant.get` |
| `tenant.configure` | `PATCH /v0.1/tenants/{tenant_id}` | TenantPatch → Tenant (200) | `tenant.configure` |
| `workspaces.list` | `GET /v0.1/tenants/{tenant_id}/workspaces` | none → WorkspacePage (200) | `workspaces.list` |
| `workspaces.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}` | none → Workspace (200) | `workspaces.get` |
| `workspaces.create` | `POST /v0.1/tenants/{tenant_id}/workspaces` | WorkspaceCreate → Workspace (201) | `workspaces.create` |
| `workspaces.update` | `PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}` | WorkspacePatch → Workspace (200) | `workspaces.update` |
| `workspaces.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/revoke` | RevocationRequest → Accepted (202) | `workspaces.revoke` |
| `operation.get` | `GET /v0.1/tenants/{tenant_id}/operations/{operation_id}` | none → Operation (200) | `operation.get` |

### IAM

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `principals.list` | `GET /v0.1/tenants/{tenant_id}/principals` | none → PrincipalPage (200) | `principals.list` |
| `principals.get` | `GET /v0.1/tenants/{tenant_id}/principals/{principal_id}` | none → Principal (200) | `principals.get` |
| `principals.create` | `POST /v0.1/tenants/{tenant_id}/principals` | PrincipalCreate → Principal (201) | `principals.create` |
| `principals.update` | `PATCH /v0.1/tenants/{tenant_id}/principals/{principal_id}` | PrincipalPatch → Principal (200) | `principals.update` |
| `principals.revoke` | `POST /v0.1/tenants/{tenant_id}/principals/{principal_id}/revoke` | RevocationRequest → Accepted (202) | `principals.revoke` |
| `identity_providers.list` | `GET /v0.1/tenants/{tenant_id}/identity-providers` | none → IdentityProviderPage (200) | `identity_providers.list` |
| `identity_providers.get` | `GET /v0.1/tenants/{tenant_id}/identity-providers/{identity_provider_id}` | none → IdentityProvider (200) | `identity_providers.get` |
| `identity_providers.create` | `POST /v0.1/tenants/{tenant_id}/identity-providers` | IdentityProviderCreate → IdentityProvider (201) | `identity_providers.create` |
| `identity_providers.revoke` | `POST /v0.1/tenants/{tenant_id}/identity-providers/{identity_provider_id}/revoke` | RevocationRequest → Accepted (202) | `identity_providers.revoke` |
| `groups.list` | `GET /v0.1/tenants/{tenant_id}/groups` | none → GroupPage (200) | `groups.list` |
| `groups.get` | `GET /v0.1/tenants/{tenant_id}/groups/{group_id}` | none → Group (200) | `groups.get` |
| `groups.create` | `POST /v0.1/tenants/{tenant_id}/groups` | GroupCreate → Group (201) | `groups.create` |
| `groups.update` | `PATCH /v0.1/tenants/{tenant_id}/groups/{group_id}` | GroupPatch → Group (200) | `groups.update` |
| `groups.revoke` | `POST /v0.1/tenants/{tenant_id}/groups/{group_id}/revoke` | RevocationRequest → Accepted (202) | `groups.revoke` |
| `group_memberships.list` | `GET /v0.1/tenants/{tenant_id}/group-memberships` | none → GroupMembershipPage (200) | `group_memberships.list` |
| `group_memberships.get` | `GET /v0.1/tenants/{tenant_id}/group-memberships/{group_membership_id}` | none → GroupMembership (200) | `group_memberships.get` |
| `group_memberships.create` | `POST /v0.1/tenants/{tenant_id}/group-memberships` | GroupMembershipCreate → GroupMembership (201) | `group_memberships.create` |
| `group_memberships.revoke` | `POST /v0.1/tenants/{tenant_id}/group-memberships/{group_membership_id}/revoke` | RevocationRequest → Accepted (202) | `group_memberships.revoke` |
| `permissions.list` | `GET /v0.1/tenants/{tenant_id}/permissions` | none → PermissionPage (200) | `permissions.list` |
| `permissions.get` | `GET /v0.1/tenants/{tenant_id}/permissions/{permission_id}` | none → Permission (200) | `permissions.get` |
| `roles.list` | `GET /v0.1/tenants/{tenant_id}/roles` | none → RolePage (200) | `roles.list` |
| `roles.get` | `GET /v0.1/tenants/{tenant_id}/roles/{role_id}` | none → Role (200) | `roles.get` |
| `roles.create` | `POST /v0.1/tenants/{tenant_id}/roles` | RoleCreate → Role (201) | `roles.create` |
| `roles.update` | `PATCH /v0.1/tenants/{tenant_id}/roles/{role_id}` | RolePatch → Role (200) | `roles.update` |
| `roles.revoke` | `POST /v0.1/tenants/{tenant_id}/roles/{role_id}/revoke` | RevocationRequest → Accepted (202) | `roles.revoke` |
| `role_grants.list` | `GET /v0.1/tenants/{tenant_id}/role-grants` | none → RoleGrantPage (200) | `role_grants.list` |
| `role_grants.get` | `GET /v0.1/tenants/{tenant_id}/role-grants/{role_grant_id}` | none → RoleGrant (200) | `role_grants.get` |
| `role_grants.create` | `POST /v0.1/tenants/{tenant_id}/role-grants` | RoleGrantCreate → RoleGrant (201) | `role_grants.create` |
| `role_grants.revoke` | `POST /v0.1/tenants/{tenant_id}/role-grants/{role_grant_id}/revoke` | RevocationRequest → Accepted (202) | `role_grants.revoke` |
| `record_grants.list` | `GET /v0.1/tenants/{tenant_id}/record-grants` | none → RecordGrantPage (200) | `record_grants.list` |
| `record_grants.get` | `GET /v0.1/tenants/{tenant_id}/record-grants/{record_grant_id}` | none → RecordGrant (200) | `record_grants.get` |
| `record_grants.create` | `POST /v0.1/tenants/{tenant_id}/record-grants` | RecordGrantCreate → RecordGrant (201) | `record_grants.create` |
| `record_grants.revoke` | `POST /v0.1/tenants/{tenant_id}/record-grants/{record_grant_id}/revoke` | RevocationRequest → Accepted (202) | `record_grants.revoke` |
| `delegations.list` | `GET /v0.1/tenants/{tenant_id}/delegations` | none → DelegationPage (200) | `delegations.list` |
| `delegations.get` | `GET /v0.1/tenants/{tenant_id}/delegations/{delegation_id}` | none → Delegation (200) | `delegations.get` |
| `delegations.create` | `POST /v0.1/tenants/{tenant_id}/delegations` | DelegationCreate → Delegation (201) | `delegations.create` |
| `delegations.revoke` | `POST /v0.1/tenants/{tenant_id}/delegations/{delegation_id}/revoke` | RevocationRequest → Accepted (202) | `delegations.revoke` |
| `principal_auth_bindings.list` | `GET /v0.1/tenants/{tenant_id}/principal-auth-bindings` | none → PrincipalAuthBindingPage (200) | `principal_auth_bindings.list` |
| `principal_auth_bindings.get` | `GET /v0.1/tenants/{tenant_id}/principal-auth-bindings/{principal_auth_binding_id}` | none → PrincipalAuthBinding (200) | `principal_auth_bindings.get` |
| `principal_auth_bindings.create` | `POST /v0.1/tenants/{tenant_id}/principal-auth-bindings` | PrincipalAuthBindingCreate → PrincipalAuthBinding (201) | `principal_auth_bindings.create` |
| `principal_auth_bindings.revoke` | `POST /v0.1/tenants/{tenant_id}/principal-auth-bindings/{principal_auth_binding_id}/revoke` | RevocationRequest → Accepted (202) | `principal_auth_bindings.revoke` |

### Data planes

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `data_plane_bindings.list` | `GET /v0.1/tenants/{tenant_id}/data-plane-bindings` | none → DataPlaneBindingPage (200) | `data_plane_bindings.list` |
| `data_plane_bindings.get` | `GET /v0.1/tenants/{tenant_id}/data-plane-bindings/{data_plane_binding_id}` | none → DataPlaneBinding (200) | `data_plane_bindings.get` |
| `data_plane_bindings.create` | `POST /v0.1/tenants/{tenant_id}/data-plane-bindings` | DataPlaneBindingCreate → DataPlaneBinding (201) | `data_plane_bindings.create` |
| `data_plane_bindings.revoke` | `POST /v0.1/tenants/{tenant_id}/data-plane-bindings/{data_plane_binding_id}/revoke` | RevocationRequest → Accepted (202) | `data_plane_bindings.revoke` |
| `data_plane.revision.create` | `POST /v0.1/tenants/{tenant_id}/data-plane-revisions` | DataPlaneRevisionRequest → Reference (201) | `data_plane.revision.create` |
| `data_plane.activate` | `POST /v0.1/tenants/{tenant_id}/data-plane-bindings/{binding_id}/activate` | DataPlaneCutover → Accepted (202) | `data_plane.activate` |

### Enrollment

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `device.challenge` | `POST /v0.1/tenants/{tenant_id}/device-enrollment/challenges` | EnrollmentChallengeRequest → EnrollmentChallenge (201) | `device.challenge` |
| `device.enroll` | `POST /v0.1/tenants/{tenant_id}/device-enrollment/complete` | EnrollmentProof → DeviceEnrollment (201) | `device.enroll` |
| `devices.list` | `GET /v0.1/tenants/{tenant_id}/devices` | none → DevicePage (200) | `devices.list` |
| `devices.get` | `GET /v0.1/tenants/{tenant_id}/devices/{device_id}` | none → Device (200) | `devices.get` |
| `devices.update` | `PATCH /v0.1/tenants/{tenant_id}/devices/{device_id}` | DevicePatch → Device (200) | `devices.update` |
| `devices.revoke` | `POST /v0.1/tenants/{tenant_id}/devices/{device_id}/revoke` | RevocationRequest → Accepted (202) | `devices.revoke` |
| `gateway_enrollments.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/gateway-enrollments` | none → GatewayEnrollmentPage (200) | `gateway_enrollments.list` |
| `gateway_enrollments.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/gateway-enrollments/{gateway_enrollment_id}` | none → GatewayEnrollment (200) | `gateway_enrollments.get` |
| `gateway_enrollments.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/gateway-enrollments` | GatewayEnrollmentCreate → GatewayEnrollment (201) | `gateway_enrollments.create` |
| `gateway_enrollments.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/gateway-enrollments/{gateway_enrollment_id}/revoke` | RevocationRequest → Accepted (202) | `gateway_enrollments.revoke` |
| `harness_targets.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets` | none → HarnessTargetPage (200) | `harness_targets.list` |
| `harness_targets.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets/{harness_target_id}` | none → HarnessTarget (200) | `harness_targets.get` |
| `harness_targets.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets` | HarnessTargetCreate → HarnessTarget (201) | `harness_targets.create` |
| `harness_targets.update` | `PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets/{harness_target_id}` | HarnessTargetPatch → HarnessTarget (200) | `harness_targets.update` |
| `harness_targets.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets/{harness_target_id}/revoke` | RevocationRequest → Accepted (202) | `harness_targets.revoke` |
| `target.heartbeat` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets/{target_id}/heartbeat` | Heartbeat → Reference (200) | `target.heartbeat` |
| `target.configure` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets/{target_id}/configure` | TargetConfiguration → Accepted (202) | `target.configure` |
| `adapter.attest` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/adapter-attestations` | AdapterAttestation → Reference (201) | `adapter.attest` |

### Repos

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `repositories.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repositories` | none → RepositoryPage (200) | `repositories.list` |
| `repositories.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repositories/{repository_id}` | none → Repository (200) | `repositories.get` |
| `repositories.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repositories` | RepositoryCreate → Repository (201) | `repositories.create` |
| `repositories.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repositories/{repository_id}/revoke` | RevocationRequest → Accepted (202) | `repositories.revoke` |
| `workspace.repository.configure` | `PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repositories/{repository_id}/settings` | RepositorySettings → Reference (200) | `workspace.repository.configure` |
| `checkout_bindings.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkout-bindings` | none → CheckoutBindingPage (200) | `checkout_bindings.list` |
| `checkout_bindings.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkout-bindings/{checkout_binding_id}` | none → CheckoutBinding (200) | `checkout_bindings.get` |
| `checkout_bindings.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkout-bindings` | CheckoutBindingCreate → CheckoutBinding (201) | `checkout_bindings.create` |
| `checkout_bindings.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkout-bindings/{checkout_binding_id}/revoke` | RevocationRequest → Accepted (202) | `checkout_bindings.revoke` |

### Repo config

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `repo_config.export` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repo-config/exports` | RepoExportRequest → RepoExport (200) | `repo_config.export` |
| `repo_config.plan` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repo-config/plans` | RepoConfigPlanRequest → RepoConfigPlan (201) | `repo_config.plan` |
| `repo_config.apply` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repo-config/plans/{plan_id}/apply` | RepoConfigApply → SyncReceipt (200) | `repo_config.apply` |
| `repo_config.validate` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repo-config/validate` | RepoValidate → ValidationResult (200) | `repo_config.validate` |
| `repo_config.receipt.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repo-config/sync-receipts/{receipt_id}` | none → SyncReceipt (200) | `repo_config.receipt.get` |
| `run.start_receipt` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/start-receipt` | none → LaunchReceipt (200) | `run.start_receipt` |

### Agent definitions

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `personas.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/personas` | none → PersonaPage (200) | `personas.list` |
| `personas.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/personas/{persona_id}` | none → Persona (200) | `personas.get` |
| `personas.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/personas` | PersonaCreate → Persona (201) | `personas.create` |
| `personas.update` | `PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/personas/{persona_id}` | PersonaPatch → Persona (200) | `personas.update` |
| `personas.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/personas/{persona_id}/revoke` | RevocationRequest → Accepted (202) | `personas.revoke` |
| `persona_versions.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/persona-versions` | none → PersonaVersionPage (200) | `persona_versions.list` |
| `persona_versions.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/persona-versions/{persona_version_id}` | none → PersonaVersion (200) | `persona_versions.get` |
| `persona_versions.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/persona-versions` | PersonaVersionCreate → PersonaVersion (201) | `persona_versions.create` |
| `agents.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents` | none → AgentPage (200) | `agents.list` |
| `agents.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents/{agent_id}` | none → Agent (200) | `agents.get` |
| `agents.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents` | AgentCreate → Agent (201) | `agents.create` |
| `agents.update` | `PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents/{agent_id}` | AgentPatch → Agent (200) | `agents.update` |
| `agents.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents/{agent_id}/revoke` | RevocationRequest → Accepted (202) | `agents.revoke` |
| `agent_releases.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-releases` | none → AgentReleasePage (200) | `agent_releases.list` |
| `agent_releases.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-releases/{agent_release_id}` | none → AgentRelease (200) | `agent_releases.get` |
| `agent_releases.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-releases` | AgentReleaseCreate → AgentRelease (201) | `agent_releases.create` |
| `agent_modes.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-modes` | none → AgentModePage (200) | `agent_modes.list` |
| `agent_modes.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-modes/{agent_mode_id}` | none → AgentMode (200) | `agent_modes.get` |
| `agent_modes.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-modes` | AgentModeCreate → AgentMode (201) | `agent_modes.create` |
| `skills.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skills` | none → SkillPage (200) | `skills.list` |
| `skills.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skills/{skill_id}` | none → Skill (200) | `skills.get` |
| `skills.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skills` | SkillCreate → Skill (201) | `skills.create` |
| `skills.update` | `PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skills/{skill_id}` | SkillPatch → Skill (200) | `skills.update` |
| `skills.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skills/{skill_id}/revoke` | RevocationRequest → Accepted (202) | `skills.revoke` |
| `skill_versions.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skill-versions` | none → SkillVersionPage (200) | `skill_versions.list` |
| `skill_versions.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skill-versions/{skill_version_id}` | none → SkillVersion (200) | `skill_versions.get` |
| `skill_versions.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skill-versions` | SkillVersionCreate → SkillVersion (201) | `skill_versions.create` |
| `agent.resolve` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents/resolve` | AgentResolveRequest → AgentResolution (200) | `agent.resolve` |
| `projection.compile` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/projections/compile` | ProjectionCompileRequest → Projection (200) | `projection.compile` |
| `projection.verify` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/projections/verify` | ProjectionVerifyRequest → ValidationResult (200) | `projection.verify` |

### Tools

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `tool_definitions.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-definitions` | none → ToolDefinitionPage (200) | `tool_definitions.list` |
| `tool_definitions.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-definitions/{tool_definition_id}` | none → ToolDefinition (200) | `tool_definitions.get` |
| `tool_definitions.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-definitions` | ToolDefinitionCreate → ToolDefinition (201) | `tool_definitions.create` |
| `tool_definitions.update` | `PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-definitions/{tool_definition_id}` | ToolDefinitionPatch → ToolDefinition (200) | `tool_definitions.update` |
| `tool_definitions.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-definitions/{tool_definition_id}/revoke` | RevocationRequest → Accepted (202) | `tool_definitions.revoke` |
| `tool_releases.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-releases` | none → ToolReleasePage (200) | `tool_releases.list` |
| `tool_releases.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-releases/{tool_release_id}` | none → ToolRelease (200) | `tool_releases.get` |
| `tool_releases.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-releases` | ToolReleaseCreate → ToolRelease (201) | `tool_releases.create` |
| `tool_bindings.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-bindings` | none → ToolBindingPage (200) | `tool_bindings.list` |
| `tool_bindings.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-bindings/{tool_binding_id}` | none → ToolBinding (200) | `tool_bindings.get` |
| `tool_bindings.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-bindings` | ToolBindingCreate → ToolBinding (201) | `tool_bindings.create` |
| `tool_bindings.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-bindings/{tool_binding_id}/revoke` | RevocationRequest → Accepted (202) | `tool_bindings.revoke` |
| `agent_tool_rules.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-tool-rules` | none → AgentToolRulePage (200) | `agent_tool_rules.list` |
| `agent_tool_rules.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-tool-rules/{agent_tool_rule_id}` | none → AgentToolRule (200) | `agent_tool_rules.get` |
| `agent_tool_rules.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-tool-rules` | AgentToolRuleCreate → AgentToolRule (201) | `agent_tool_rules.create` |
| `toolbelt.resolve` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-belts/resolve` | ToolBeltResolve → ToolBelt (200) | `toolbelt.resolve` |
| `toolbelt.status` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-belts/{snapshot_id}` | none → ToolBelt (200) | `toolbelt.status` |
| `toolbelt.prepare` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-belts/prepare` | PreparedToolBeltRequest → PreparedToolBelt (200) | `toolbelt.prepare` |

### Models

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `model_providers.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-providers` | none → ModelProviderPage (200) | `model_providers.list` |
| `model_providers.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-providers/{model_provider_id}` | none → ModelProvider (200) | `model_providers.get` |
| `model_providers.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-providers` | ModelProviderCreate → ModelProvider (201) | `model_providers.create` |
| `model_providers.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-providers/{model_provider_id}/revoke` | RevocationRequest → Accepted (202) | `model_providers.revoke` |
| `model_releases.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-releases` | none → ModelReleasePage (200) | `model_releases.list` |
| `model_releases.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-releases/{model_release_id}` | none → ModelRelease (200) | `model_releases.get` |
| `model_releases.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-releases` | ModelReleaseCreate → ModelRelease (201) | `model_releases.create` |
| `model_routes.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-routes` | none → ModelRoutePage (200) | `model_routes.list` |
| `model_routes.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-routes/{model_route_id}` | none → ModelRoute (200) | `model_routes.get` |
| `model_routes.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-routes` | ModelRouteCreate → ModelRoute (201) | `model_routes.create` |
| `model_routes.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-routes/{model_route_id}/revoke` | RevocationRequest → Accepted (202) | `model_routes.revoke` |

### Connectors

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `secret_backend_bindings.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/secret-backend-bindings` | none → SecretBackendBindingPage (200) | `secret_backend_bindings.list` |
| `secret_backend_bindings.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/secret-backend-bindings/{secret_backend_binding_id}` | none → SecretBackendBinding (200) | `secret_backend_bindings.get` |
| `secret_backend_bindings.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/secret-backend-bindings` | SecretBackendBindingCreate → SecretBackendBinding (201) | `secret_backend_bindings.create` |
| `secret_backend_bindings.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/secret-backend-bindings/{secret_backend_binding_id}/revoke` | RevocationRequest → Accepted (202) | `secret_backend_bindings.revoke` |
| `credential_references.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/credential-references` | none → CredentialReferencePage (200) | `credential_references.list` |
| `credential_references.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/credential-references/{credential_reference_id}` | none → CredentialReference (200) | `credential_references.get` |
| `credential_references.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/credential-references` | CredentialReferenceCreate → CredentialReference (201) | `credential_references.create` |
| `credential_references.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/credential-references/{credential_reference_id}/revoke` | RevocationRequest → Accepted (202) | `credential_references.revoke` |
| `connectors.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connectors` | none → ConnectorPage (200) | `connectors.list` |
| `connectors.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connectors/{connector_id}` | none → Connector (200) | `connectors.get` |
| `connectors.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connectors` | ConnectorCreate → Connector (201) | `connectors.create` |
| `connectors.update` | `PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connectors/{connector_id}` | ConnectorPatch → Connector (200) | `connectors.update` |
| `connectors.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connectors/{connector_id}/revoke` | RevocationRequest → Accepted (202) | `connectors.revoke` |
| `connector_releases.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-releases` | none → ConnectorReleasePage (200) | `connector_releases.list` |
| `connector_releases.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-releases/{connector_release_id}` | none → ConnectorRelease (200) | `connector_releases.get` |
| `connector_releases.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-releases` | ConnectorReleaseCreate → ConnectorRelease (201) | `connector_releases.create` |
| `connector_deployments.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-deployments` | none → ConnectorDeploymentPage (200) | `connector_deployments.list` |
| `connector_deployments.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-deployments/{connector_deployment_id}` | none → ConnectorDeployment (200) | `connector_deployments.get` |
| `connector_deployments.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-deployments` | ConnectorDeploymentCreate → ConnectorDeployment (201) | `connector_deployments.create` |
| `connector_deployments.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-deployments/{connector_deployment_id}/revoke` | RevocationRequest → Accepted (202) | `connector_deployments.revoke` |
| `connector.receipt.ingest` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-receipts` | OutcomeReceipt → Reference (201) | `connector.receipt.ingest` |
| `credential.lease` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/credential-leases` | CredentialLeaseRequest → CredentialLease (201) | `credential.lease` |

### Policies

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `policy_templates.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-templates` | none → PolicyTemplatePage (200) | `policy_templates.list` |
| `policy_templates.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-templates/{policy_template_id}` | none → PolicyTemplate (200) | `policy_templates.get` |
| `policy_templates.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-templates` | PolicyTemplateCreate → PolicyTemplate (201) | `policy_templates.create` |
| `policies.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies` | none → PolicyPage (200) | `policies.list` |
| `policies.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies/{policy_id}` | none → Policy (200) | `policies.get` |
| `policies.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies` | PolicyCreate → Policy (201) | `policies.create` |
| `policies.update` | `PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies/{policy_id}` | PolicyPatch → Policy (200) | `policies.update` |
| `policies.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies/{policy_id}/revoke` | RevocationRequest → Accepted (202) | `policies.revoke` |
| `policy_revisions.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-revisions` | none → PolicyRevisionPage (200) | `policy_revisions.list` |
| `policy_revisions.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-revisions/{policy_revision_id}` | none → PolicyRevision (200) | `policy_revisions.get` |
| `policy_revisions.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-revisions` | PolicyRevisionCreate → PolicyRevision (201) | `policy_revisions.create` |
| `policy.validate` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies/validate` | PolicyValidation → ValidationResult (200) | `policy.validate` |
| `policy_activations.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-activations` | none → PolicyActivationPage (200) | `policy_activations.list` |
| `policy_activations.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-activations/{policy_activation_id}` | none → PolicyActivation (200) | `policy_activations.get` |
| `policy_activations.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-activations` | PolicyActivationCreate → PolicyActivation (201) | `policy_activations.create` |
| `policy_activations.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-activations/{policy_activation_id}/revoke` | RevocationRequest → Accepted (202) | `policy_activations.revoke` |
| `policy.explain` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies/explain` | PolicyExplainRequest → PolicyExplanation (200) | `policy.explain` |
| `policy.target_receipt` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-target-receipts` | PolicyReceiptRequest → Reference (201) | `policy.target_receipt` |

### Data protection

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `data_protection_profiles.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/data-protection-profiles` | none → DataProtectionProfilePage (200) | `data_protection_profiles.list` |
| `data_protection_profiles.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/data-protection-profiles/{data_protection_profile_id}` | none → DataProtectionProfile (200) | `data_protection_profiles.get` |
| `data_protection_profiles.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/data-protection-profiles` | DataProtectionProfileCreate → DataProtectionProfile (201) | `data_protection_profiles.create` |
| `scan_receipt.register` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/scan-receipts` | ScanReceipt → Reference (201) | `scan_receipt.register` |
| `scan_receipt.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/scan-receipts/{receipt_id}` | none → ScanReceipt (200) | `scan_receipt.get` |
| `tenant.scan_receipt.register` | `POST /v0.1/tenants/{tenant_id}/scan-receipts` | ScanReceipt → Reference (201) | `tenant.scan_receipt.register` |

### Work

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `work_orders.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-orders` | none → WorkOrderPage (200) | `work_orders.list` |
| `work_orders.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-orders/{work_order_id}` | none → WorkOrder (200) | `work_orders.get` |
| `work_orders.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-orders` | WorkOrderCreate → WorkOrder (201) | `work_orders.create` |
| `work_orders.update` | `PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-orders/{work_order_id}` | WorkOrderPatch → WorkOrder (200) | `work_orders.update` |
| `work_orders.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-orders/{work_order_id}/revoke` | RevocationRequest → Accepted (202) | `work_orders.revoke` |
| `work_order_revisions.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-order-revisions` | none → WorkOrderRevisionPage (200) | `work_order_revisions.list` |
| `work_order_revisions.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-order-revisions/{work_order_revision_id}` | none → WorkOrderRevision (200) | `work_order_revisions.get` |
| `work_order_revisions.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-order-revisions` | WorkOrderRevisionCreate → WorkOrderRevision (201) | `work_order_revisions.create` |
| `work.submit` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-requests` | WorkSubmit → Accepted (202) | `work.submit` |
| `work.status` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-requests/{work_request_id}` | none → WorkStatus (200) | `work.status` |
| `work.cancel` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-requests/{work_request_id}/cancel` | ReasonRequest → Accepted (202) | `work.cancel` |

### Runs

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `run.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs` | none → RunPage (200) | `run.list` |
| `run.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}` | none → Run (200) | `run.get` |
| `steering.submit` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/steering` | SteeringRequest → Accepted (202) | `steering.submit` |
| `steering.status` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/steering/{steering_id}` | none → SteeringStatus (200) | `steering.status` |
| `run.pause` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/pause` | RunControlRequest → Accepted (202) | `run.pause` |
| `run.stop` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/stop` | RunControlRequest → Accepted (202) | `run.stop` |
| `run.force_continue` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/force-continue` | RunControlRequest → Accepted (202) | `run.force_continue` |
| `run.pause_status` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/pause` | none → PauseStatus (200) | `run.pause_status` |
| `run.resume` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/resume` | ResumeRequest → Accepted (202) | `run.resume` |
| `run.mode.change` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/mode` | ModeChangeRequest → Accepted (202) | `run.mode.change` |

### Actions

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `action.propose` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions` | ActionProposal → GovernedAction (201) | `action.propose` |
| `admin_action.propose` | `POST /v0.1/tenants/{tenant_id}/admin-actions` | ActionProposal → GovernedAction (201) | `admin_action.propose` |
| `action.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions/{action_id}` | none → GovernedAction (200) | `action.get` |
| `action.attempt.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions/{action_id}/attempts` | AttemptCreate → ActionAttempt (201) | `action.attempt.create` |
| `action.authorize` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions/{action_id}/authorize` | AuthorizeRequest → AuthorizationDecision (200) | `action.authorize` |
| `action.dispatch` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions/{action_id}/dispatch` | DispatchRequest → Accepted (202) | `action.dispatch` |
| `action.reconcile` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions/{action_id}/reconcile` | ReconcileRequest → GovernedAction (200) | `action.reconcile` |
| `response.adopt` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/responses/{response_id}/adopt` | AdoptResponse → Accepted (202) | `response.adopt` |
| `admin_action.get` | `GET /v0.1/tenants/{tenant_id}/admin-actions/{action_id}` | none → GovernedAction (200) | `admin_action.get` |
| `admin_action.attempt.create` | `POST /v0.1/tenants/{tenant_id}/admin-actions/{action_id}/attempts` | AttemptCreate → ActionAttempt (201) | `admin_action.attempt.create` |
| `admin_action.authorize` | `POST /v0.1/tenants/{tenant_id}/admin-actions/{action_id}/authorize` | AuthorizeRequest → AuthorizationDecision (200) | `admin_action.authorize` |
| `admin_action.dispatch` | `POST /v0.1/tenants/{tenant_id}/admin-actions/{action_id}/dispatch` | DispatchRequest → Accepted (202) | `admin_action.dispatch` |
| `admin_action.reconcile` | `POST /v0.1/tenants/{tenant_id}/admin-actions/{action_id}/reconcile` | ReconcileRequest → GovernedAction (200) | `admin_action.reconcile` |

### Gateway

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `gateway.model_dispatch` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/gateway/model-dispatches` | DispatchRequest → Accepted (202) | `gateway.model_dispatch` |
| `model.response.ingest` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-response-receipts` | OutcomeReceipt → Reference (201) | `model.response.ingest` |

### Approvals

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `access_requests.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/access-requests` | none → AccessRequestPage (200) | `access_requests.list` |
| `access_requests.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/access-requests/{access_request_id}` | none → AccessRequest (200) | `access_requests.get` |
| `access_requests.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/access-requests` | AccessRequestCreate → AccessRequest (201) | `access_requests.create` |
| `access.approve` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/access-requests/{request_id}/approve` | AccessApproval → Accepted (202) | `access.approve` |
| `approval_requests.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/approval-requests` | none → ApprovalRequestPage (200) | `approval_requests.list` |
| `approval_requests.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/approval-requests/{approval_request_id}` | none → ApprovalRequest (200) | `approval_requests.get` |
| `approval_requests.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/approval-requests` | ApprovalRequestCreate → ApprovalRequest (201) | `approval_requests.create` |
| `approval.decide` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/approval-requests/{request_id}/decide` | ExceptionDecision → Accepted (202) | `approval.decide` |

### Budgets

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `limit_accounts.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts` | none → LimitAccountPage (200) | `limit_accounts.list` |
| `limit_accounts.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts/{limit_account_id}` | none → LimitAccount (200) | `limit_accounts.get` |
| `limit_accounts.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts` | LimitAccountCreate → LimitAccount (201) | `limit_accounts.create` |
| `limit_accounts.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts/{limit_account_id}/revoke` | RevocationRequest → Accepted (202) | `limit_accounts.revoke` |
| `budget.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts/{account_id}/balance` | none → BudgetBalance (200) | `budget.get` |
| `budget.configure` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts/{account_id}/configure` | BudgetChange → Accepted (202) | `budget.configure` |
| `budget.reserve` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/budget-reservations` | ReservationRequest → Reservation (201) | `budget.reserve` |
| `budget.settle` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/budget-settlements` | SettlementRequest → Reference (201) | `budget.settle` |
| `budget.release` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/budget-reservations/{hold_id}/release` | ReasonRequest → Reservation (200) | `budget.release` |
| `price_schedules.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/price-schedules` | none → PriceSchedulePage (200) | `price_schedules.list` |
| `price_schedules.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/price-schedules/{price_schedule_id}` | none → PriceSchedule (200) | `price_schedules.get` |
| `price_schedules.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/price-schedules` | PriceScheduleCreate → PriceSchedule (201) | `price_schedules.create` |
| `limit_definitions.list` | `GET /v0.1/tenants/{tenant_id}/limit-definitions` | none → LimitDefinitionPage (200) | `limit_definitions.list` |
| `limit_definitions.get` | `GET /v0.1/tenants/{tenant_id}/limit-definitions/{limit_definition_id}` | none → LimitDefinition (200) | `limit_definitions.get` |
| `limit_definitions.create` | `POST /v0.1/tenants/{tenant_id}/limit-definitions` | LimitDefinitionCreate → LimitDefinition (201) | `limit_definitions.create` |
| `limit_definitions.revoke` | `POST /v0.1/tenants/{tenant_id}/limit-definitions/{limit_definition_id}/revoke` | RevocationRequest → Accepted (202) | `limit_definitions.revoke` |
| `limit_definition_terms.list` | `GET /v0.1/tenants/{tenant_id}/limit-definition-terms` | none → LimitDefinitionTermsPage (200) | `limit_definition_terms.list` |
| `limit_definition_terms.get` | `GET /v0.1/tenants/{tenant_id}/limit-definition-terms/{limit_definition_terms_id}` | none → LimitDefinitionTerms (200) | `limit_definition_terms.get` |
| `limit_definition_terms.create` | `POST /v0.1/tenants/{tenant_id}/limit-definition-terms` | LimitDefinitionTermsCreate → LimitDefinitionTerms (201) | `limit_definition_terms.create` |
| `tenant.limit_accounts.list` | `GET /v0.1/tenants/{tenant_id}/limit-accounts` | none → LimitAccountPage (200) | `tenant.limit_accounts.list` |
| `tenant.limit_accounts.get` | `GET /v0.1/tenants/{tenant_id}/limit-accounts/{account_id}` | none → LimitAccount (200) | `tenant.limit_accounts.get` |
| `tenant.limit_accounts.create` | `POST /v0.1/tenants/{tenant_id}/limit-accounts` | LimitAccountCreate → LimitAccount (201) | `tenant.limit_accounts.create` |
| `tenant.budget.get` | `GET /v0.1/tenants/{tenant_id}/limit-accounts/{account_id}/balance` | none → BudgetBalance (200) | `tenant.budget.get` |
| `tenant.budget.configure` | `POST /v0.1/tenants/{tenant_id}/limit-accounts/{account_id}/configure` | BudgetChange → Accepted (202) | `tenant.budget.configure` |
| `tenant.limit_accounts.revoke` | `POST /v0.1/tenants/{tenant_id}/limit-accounts/{account_id}/revoke` | RevocationRequest → Accepted (202) | `tenant.limit_accounts.revoke` |
| `tenant.budget.reserve` | `POST /v0.1/tenants/{tenant_id}/budget-reservations` | ReservationRequest → Reservation (201) | `tenant.budget.reserve` |
| `tenant.budget.settle` | `POST /v0.1/tenants/{tenant_id}/budget-settlements` | SettlementRequest → Reference (201) | `tenant.budget.settle` |
| `tenant.budget.release` | `POST /v0.1/tenants/{tenant_id}/budget-reservations/{hold_id}/release` | ReasonRequest → Reservation (200) | `tenant.budget.release` |

### Graph

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `source_bindings.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/source-bindings` | none → SourceBindingPage (200) | `source_bindings.list` |
| `source_bindings.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/source-bindings/{source_binding_id}` | none → SourceBinding (200) | `source_bindings.get` |
| `source_bindings.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/source-bindings` | SourceBindingCreate → SourceBinding (201) | `source_bindings.create` |
| `source_bindings.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/source-bindings/{source_binding_id}/revoke` | RevocationRequest → Accepted (202) | `source_bindings.revoke` |
| `ontology_versions.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/ontology-versions` | none → OntologyVersionPage (200) | `ontology_versions.list` |
| `ontology_versions.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/ontology-versions/{ontology_version_id}` | none → OntologyVersion (200) | `ontology_versions.get` |
| `ontology_versions.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/ontology-versions` | OntologyVersionCreate → OntologyVersion (201) | `ontology_versions.create` |
| `graph_entities.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entities` | none → GraphEntityPage (200) | `graph_entities.list` |
| `graph_entities.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entities/{graph_entity_id}` | none → GraphEntity (200) | `graph_entities.get` |
| `graph_entities.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entities` | GraphEntityCreate → GraphEntity (201) | `graph_entities.create` |
| `graph_entity_revisions.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entity-revisions` | none → GraphEntityRevisionPage (200) | `graph_entity_revisions.list` |
| `graph_entity_revisions.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entity-revisions/{graph_entity_revision_id}` | none → GraphEntityRevision (200) | `graph_entity_revisions.get` |
| `graph_entity_revisions.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entity-revisions` | GraphEntityRevisionCreate → GraphEntityRevision (201) | `graph_entity_revisions.create` |
| `graph_relations.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-relations` | none → GraphRelationPage (200) | `graph_relations.list` |
| `graph_relations.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-relations/{graph_relation_id}` | none → GraphRelation (200) | `graph_relations.get` |
| `graph_relations.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-relations` | GraphRelationCreate → GraphRelation (201) | `graph_relations.create` |
| `graph.relation.revise` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-relation-revisions` | GraphRelationRevisionRequest → Reference (201) | `graph.relation.revise` |
| `graph.query` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph/query` | GraphQuery → GraphResult (200) | `graph.query` |
| `source.sync` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/source-bindings/{binding_id}/sync` | ReasonRequest → Accepted (202) | `source.sync` |

### Context

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `context_records.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-records` | none → ContextRecordPage (200) | `context_records.list` |
| `context_records.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-records/{context_record_id}` | none → ContextRecord (200) | `context_records.get` |
| `context_records.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-records` | ContextRecordCreate → ContextRecord (201) | `context_records.create` |
| `context_records.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-records/{context_record_id}/revoke` | RevocationRequest → Accepted (202) | `context_records.revoke` |
| `context_revisions.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-revisions` | none → ContextRevisionPage (200) | `context_revisions.list` |
| `context_revisions.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-revisions/{context_revision_id}` | none → ContextRevision (200) | `context_revisions.get` |
| `context_revisions.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-revisions` | ContextRevisionCreate → ContextRevision (201) | `context_revisions.create` |
| `memory_views.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory-views` | none → MemoryViewPage (200) | `memory_views.list` |
| `memory_views.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory-views/{memory_view_id}` | none → MemoryView (200) | `memory_views.get` |
| `memory_views.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory-views` | MemoryViewCreate → MemoryView (201) | `memory_views.create` |
| `cgp_providers.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/cgp-providers` | none → CGPProviderPage (200) | `cgp_providers.list` |
| `cgp_providers.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/cgp-providers/{c_g_p_provider_id}` | none → CGPProvider (200) | `cgp_providers.get` |
| `cgp_providers.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/cgp-providers` | CGPProviderCreate → CGPProvider (201) | `cgp_providers.create` |
| `cgp_providers.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/cgp-providers/{c_g_p_provider_id}/revoke` | RevocationRequest → Accepted (202) | `cgp_providers.revoke` |
| `context.resolve` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context/resolve` | ContextResolveRequest → ContextResult (200) | `context.resolve` |
| `memory.query` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory/query` | ContextResolveRequest → ContextResult (200) | `memory.query` |
| `memory.propose` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory/proposals` | MemoryProposal → Reference (201) | `memory.propose` |
| `memory.promote` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory/proposals/{proposal_id}/promote` | MemoryPromotion → Reference (201) | `memory.promote` |
| `tenant.context.resolve` | `POST /v0.1/tenants/{tenant_id}/context/resolve` | ContextResolveRequest → ContextResult (200) | `tenant.context.resolve` |

### Evidence

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `artifact.upload.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/artifact-uploads` | ArtifactUploadRequest → ArtifactUpload (201) | `artifact.upload.create` |
| `artifact.upload.content` | `PUT /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/artifact-uploads/{upload_id}/content` | binary cleaned bytes → Reference (200) | `artifact.upload.content` |
| `artifact.upload.commit` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/artifact-uploads/{upload_id}/commit` | ArtifactUploadRequest → ArtifactRef (200) | `artifact.upload.commit` |
| `artifact.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/artifacts/{artifact_id}` | none → ArtifactRef (200) | `artifact.get` |
| `artifact.content.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/artifacts/{artifact_id}/content` | none → binary cleaned bytes (200) | `artifact.content.get` |
| `events.append` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/events` | EventBatch → Reference (201) | `events.append` |
| `events.subscribe` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/events` | none → Event (200) | `events.subscribe` |
| `run.events.subscribe` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/events` | none → Event (200) | `run.events.subscribe` |

### Continuation

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `checkpoint.prepare` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkpoints/prepare` | CheckpointRequest → Accepted (202) | `checkpoint.prepare` |
| `checkpoint.commit` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkpoints` | CheckpointCommit → Checkpoint (201) | `checkpoint.commit` |
| `checkpoint.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkpoints/{checkpoint_id}` | none → Checkpoint (200) | `checkpoint.get` |
| `fork.plan` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/fork-plans` | ForkPlanRequest → ForkPlan (201) | `fork.plan` |
| `fork.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/fork-plans/{plan_id}/create` | ForkCreate → Accepted (202) | `fork.create` |
| `migration.commit` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/migrations` | MigrationCommit → Accepted (202) | `migration.commit` |

### Retention

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `retention_policies.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/retention-policies` | none → RetentionPolicyPage (200) | `retention_policies.list` |
| `retention_policies.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/retention-policies/{retention_policy_id}` | none → RetentionPolicy (200) | `retention_policies.get` |
| `retention_policies.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/retention-policies` | RetentionPolicyCreate → RetentionPolicy (201) | `retention_policies.create` |
| `legal_holds.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/legal-holds` | none → LegalHoldPage (200) | `legal_holds.list` |
| `legal_holds.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/legal-holds/{legal_hold_id}` | none → LegalHold (200) | `legal_holds.get` |
| `legal_holds.create` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/legal-holds` | LegalHoldCreate → LegalHold (201) | `legal_holds.create` |
| `legal_holds.revoke` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/legal-holds/{legal_hold_id}/revoke` | RevocationRequest → Accepted (202) | `legal_holds.revoke` |
| `retention.delete` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/deletion-requests` | DeleteRequest → Accepted (202) | `retention.delete` |
| `audit.query` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/audit/query` | AuditQuery → AuditPage (200) | `audit.query` |
| `audit.export` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/audit/exports` | AuditQuery → Accepted (202) | `audit.export` |

### Reports

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `work_report.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports` | none → WorkReportPage (200) | `work_report.list` |
| `work_report.get` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports/{report_id}` | none → WorkReport (200) | `work_report.get` |
| `work_report.refresh` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports/refresh` | ReportRefresh → Accepted (202) | `work_report.refresh` |
| `work_report.ingest` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports` | WorkReport → Reference (201) | `work_report.ingest` |
| `work_report.subscribe` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports/{report_id}/events` | none → Event (200) | `work_report.subscribe` |
| `ci.ingest` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/ci-observations` | CIObservationBatch → Reference (201) | `ci.ingest` |
| `work_report.files.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports/{report_id}/files` | none → ChangedFilePage (200) | `work_report.files.list` |
| `work_report.ci.list` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports/{report_id}/ci-jobs` | none → CIJobPage (200) | `work_report.ci.list` |

### Future plugins

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `plugin_packages.list` (disabled) | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-packages` | none → PluginPackagePage (501) | `plugin_packages.list` |
| `plugin_packages.get` (disabled) | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-packages/{plugin_package_id}` | none → PluginPackage (501) | `plugin_packages.get` |
| `plugin_packages.create` (disabled) | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-packages` | PluginPackageCreate → PluginPackage (501) | `plugin_packages.create` |
| `plugin_installs.list` (disabled) | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-installs` | none → PluginInstallPage (501) | `plugin_installs.list` |
| `plugin_installs.get` (disabled) | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-installs/{plugin_install_id}` | none → PluginInstall (501) | `plugin_installs.get` |
| `plugin_installs.create` (disabled) | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-installs` | PluginInstallCreate → PluginInstall (501) | `plugin_installs.create` |
| `plugin_installs.revoke` (disabled) | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-installs/{plugin_install_id}/revoke` | RevocationRequest → Accepted (501) | `plugin_installs.revoke` |
| `plugin.control` (disabled) | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/control` | PluginControl → Accepted (501) | `plugin.control` |
| `plugin.context.offer` (disabled) | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/context-offers` | PluginContextOffer → Reference (501) | `plugin.context.offer` |
| `plugin.job.request` (disabled) | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/jobs` | PluginJobRequest → Accepted (501) | `plugin.job.request` |
| `plugin.events.subscribe` (disabled) | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/events` | none → Event (501) | `plugin.events.subscribe` |
| `plugin.events.ack` (disabled) | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/event-acks` | PluginEventAck → Reference (501) | `plugin.events.ack` |
| `plugin.decision.submit` (disabled) | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/completion-decisions` | PluginDecision → Reference (501) | `plugin.decision.submit` |

### Completion

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `completion.propose` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/completion-proposals` | CompletionProposalRequest → CompletionProposal (201) | `completion.propose` |
| `completion.status` | `GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/completion-proposals/{proposal_id}` | none → CompletionProposal (200) | `completion.status` |
| `hold.release` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/holds/{hold_id}/release` | HoldDecision → Accepted (202) | `hold.release` |
| `hold.override` | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/holds/{hold_id}/override` | HoldDecision → Accepted (202) | `hold.override` |

### Future business data

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `business.correlation.create` (disabled) | `POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/business-correlations` | BusinessCorrelationRequest → Reference (501) | `business.correlation.create` |

### Platform bootstrap

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `platform.deployment_profiles.list` | `GET /v0.1/platform/deployment-profiles` | none → DeploymentProfilePage (200) | `platform.deployment_profiles.list` |
| `platform.tenant.provision` | `POST /v0.1/platform/tenant-provisions` | TenantProvisionRequest → TenantProvisionOperation (202) | `platform.tenant.provision` |
| `platform.tenant.provision.get` | `GET /v0.1/platform/tenant-provisions/{provision_id}` | none → TenantProvisionOperation (200) | `platform.tenant.provision.get` |
| `platform.tenant.activate` | `POST /v0.1/platform/tenant-provisions/{provision_id}/activate` | TenantActivationRequest → TenantProvisionOperation (202) | `platform.tenant.activate` |

### Financial evidence

| Operation | Method and path | Request → result | Permission |
|---|---|---|---|
| `financial_sources.list` | `GET /v0.1/tenants/{tenant_id}/financial-sources` | none → FinancialSourcePage (200) | `financial_sources.list` |
| `financial_sources.get` | `GET /v0.1/tenants/{tenant_id}/financial-sources/{financial_source_id}` | none → FinancialSource (200) | `financial_sources.get` |
| `financial_sources.create` | `POST /v0.1/tenants/{tenant_id}/financial-sources` | FinancialSourceCreate → FinancialSource (201) | `financial_sources.create` |
| `financial_effects.list` | `GET /v0.1/tenants/{tenant_id}/financial-effects` | none → FinancialEffectPage (200) | `financial_effects.list` |
| `financial_effects.get` | `GET /v0.1/tenants/{tenant_id}/financial-effects/{financial_effect_id}` | none → FinancialEffect (200) | `financial_effects.get` |
| `financial_effects.create` | `POST /v0.1/tenants/{tenant_id}/financial-effects` | FinancialEffectCreate → FinancialEffect (201) | `financial_effects.create` |
| `financial_effect_revisions.list` | `GET /v0.1/tenants/{tenant_id}/financial-effect-revisions` | none → FinancialEffectRevisionPage (200) | `financial_effect_revisions.list` |
| `financial_effect_revisions.get` | `GET /v0.1/tenants/{tenant_id}/financial-effect-revisions/{financial_effect_revision_id}` | none → FinancialEffectRevision (200) | `financial_effect_revisions.get` |
| `financial_effect_revisions.create` | `POST /v0.1/tenants/{tenant_id}/financial-effect-revisions` | FinancialEffectRevisionCreate → FinancialEffectRevision (201) | `financial_effect_revisions.create` |
| `financial_effect.observation.record` | `POST /v0.1/tenants/{tenant_id}/financial-effect-observations` | FinancialEffectObservation → Reference (201) | `financial_effect.observation.record` |

## Endpoint details

### capabilities.negotiate

`POST /v0.1/tenants/{tenant_id}/capabilities/negotiate`

Negotiate required capabilities. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **CapabilitiesRequest**. Result: **Capabilities**, HTTP **200**. Permission: `capabilities.negotiate`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### identity.get

`GET /v0.1/identity`

Read the authenticated identity.

Request: **none**. Result: **Identity**, HTTP **200**. Permission: `identity.read`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tenant.get

`GET /v0.1/tenants/{tenant_id}`

Read tenant settings.

Request: **none**. Result: **Tenant**, HTTP **200**. Permission: `tenant.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tenant.configure

`PATCH /v0.1/tenants/{tenant_id}`

Configure tenant settings. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **TenantPatch**. Result: **Tenant**, HTTP **200**. Permission: `tenant.configure`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### workspaces.list

`GET /v0.1/tenants/{tenant_id}/workspaces`

List workspaces.

Request: **none**. Result: **WorkspacePage**, HTTP **200**. Permission: `workspaces.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### workspaces.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}`

Get Workspace.

Request: **none**. Result: **Workspace**, HTTP **200**. Permission: `workspaces.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### workspaces.create

`POST /v0.1/tenants/{tenant_id}/workspaces`

Create Workspace. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **WorkspaceCreate**. Result: **Workspace**, HTTP **201**. Permission: `workspaces.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### workspaces.update

`PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}`

Update Workspace. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **WorkspacePatch**. Result: **Workspace**, HTTP **200**. Permission: `workspaces.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### workspaces.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/revoke`

Revoke Workspace. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `workspaces.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### principals.list

`GET /v0.1/tenants/{tenant_id}/principals`

List principals.

Request: **none**. Result: **PrincipalPage**, HTTP **200**. Permission: `principals.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### principals.get

`GET /v0.1/tenants/{tenant_id}/principals/{principal_id}`

Get Principal.

Request: **none**. Result: **Principal**, HTTP **200**. Permission: `principals.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### principals.create

`POST /v0.1/tenants/{tenant_id}/principals`

Create Principal. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PrincipalCreate**. Result: **Principal**, HTTP **201**. Permission: `principals.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### principals.update

`PATCH /v0.1/tenants/{tenant_id}/principals/{principal_id}`

Update Principal. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PrincipalPatch**. Result: **Principal**, HTTP **200**. Permission: `principals.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### principals.revoke

`POST /v0.1/tenants/{tenant_id}/principals/{principal_id}/revoke`

Revoke Principal. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `principals.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### identity_providers.list

`GET /v0.1/tenants/{tenant_id}/identity-providers`

List identity-providers.

Request: **none**. Result: **IdentityProviderPage**, HTTP **200**. Permission: `identity_providers.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### identity_providers.get

`GET /v0.1/tenants/{tenant_id}/identity-providers/{identity_provider_id}`

Get IdentityProvider.

Request: **none**. Result: **IdentityProvider**, HTTP **200**. Permission: `identity_providers.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### identity_providers.create

`POST /v0.1/tenants/{tenant_id}/identity-providers`

Create IdentityProvider. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **IdentityProviderCreate**. Result: **IdentityProvider**, HTTP **201**. Permission: `identity_providers.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### identity_providers.revoke

`POST /v0.1/tenants/{tenant_id}/identity-providers/{identity_provider_id}/revoke`

Revoke IdentityProvider. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `identity_providers.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### groups.list

`GET /v0.1/tenants/{tenant_id}/groups`

List groups.

Request: **none**. Result: **GroupPage**, HTTP **200**. Permission: `groups.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### groups.get

`GET /v0.1/tenants/{tenant_id}/groups/{group_id}`

Get Group.

Request: **none**. Result: **Group**, HTTP **200**. Permission: `groups.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### groups.create

`POST /v0.1/tenants/{tenant_id}/groups`

Create Group. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **GroupCreate**. Result: **Group**, HTTP **201**. Permission: `groups.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### groups.update

`PATCH /v0.1/tenants/{tenant_id}/groups/{group_id}`

Update Group. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **GroupPatch**. Result: **Group**, HTTP **200**. Permission: `groups.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### groups.revoke

`POST /v0.1/tenants/{tenant_id}/groups/{group_id}/revoke`

Revoke Group. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `groups.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### group_memberships.list

`GET /v0.1/tenants/{tenant_id}/group-memberships`

List group-memberships.

Request: **none**. Result: **GroupMembershipPage**, HTTP **200**. Permission: `group_memberships.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### group_memberships.get

`GET /v0.1/tenants/{tenant_id}/group-memberships/{group_membership_id}`

Get GroupMembership.

Request: **none**. Result: **GroupMembership**, HTTP **200**. Permission: `group_memberships.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### group_memberships.create

`POST /v0.1/tenants/{tenant_id}/group-memberships`

Create GroupMembership. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **GroupMembershipCreate**. Result: **GroupMembership**, HTTP **201**. Permission: `group_memberships.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### group_memberships.revoke

`POST /v0.1/tenants/{tenant_id}/group-memberships/{group_membership_id}/revoke`

Revoke GroupMembership. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `group_memberships.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### permissions.list

`GET /v0.1/tenants/{tenant_id}/permissions`

List permissions.

Request: **none**. Result: **PermissionPage**, HTTP **200**. Permission: `permissions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### permissions.get

`GET /v0.1/tenants/{tenant_id}/permissions/{permission_id}`

Get Permission.

Request: **none**. Result: **Permission**, HTTP **200**. Permission: `permissions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### roles.list

`GET /v0.1/tenants/{tenant_id}/roles`

List roles.

Request: **none**. Result: **RolePage**, HTTP **200**. Permission: `roles.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### roles.get

`GET /v0.1/tenants/{tenant_id}/roles/{role_id}`

Get Role.

Request: **none**. Result: **Role**, HTTP **200**. Permission: `roles.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### roles.create

`POST /v0.1/tenants/{tenant_id}/roles`

Create Role. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RoleCreate**. Result: **Role**, HTTP **201**. Permission: `roles.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### roles.update

`PATCH /v0.1/tenants/{tenant_id}/roles/{role_id}`

Update Role. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RolePatch**. Result: **Role**, HTTP **200**. Permission: `roles.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### roles.revoke

`POST /v0.1/tenants/{tenant_id}/roles/{role_id}/revoke`

Revoke Role. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `roles.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### role_grants.list

`GET /v0.1/tenants/{tenant_id}/role-grants`

List role-grants.

Request: **none**. Result: **RoleGrantPage**, HTTP **200**. Permission: `role_grants.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### role_grants.get

`GET /v0.1/tenants/{tenant_id}/role-grants/{role_grant_id}`

Get RoleGrant.

Request: **none**. Result: **RoleGrant**, HTTP **200**. Permission: `role_grants.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### role_grants.create

`POST /v0.1/tenants/{tenant_id}/role-grants`

Create RoleGrant. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RoleGrantCreate**. Result: **RoleGrant**, HTTP **201**. Permission: `role_grants.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### role_grants.revoke

`POST /v0.1/tenants/{tenant_id}/role-grants/{role_grant_id}/revoke`

Revoke RoleGrant. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `role_grants.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### record_grants.list

`GET /v0.1/tenants/{tenant_id}/record-grants`

List record-grants.

Request: **none**. Result: **RecordGrantPage**, HTTP **200**. Permission: `record_grants.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### record_grants.get

`GET /v0.1/tenants/{tenant_id}/record-grants/{record_grant_id}`

Get RecordGrant.

Request: **none**. Result: **RecordGrant**, HTTP **200**. Permission: `record_grants.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### record_grants.create

`POST /v0.1/tenants/{tenant_id}/record-grants`

Create RecordGrant. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RecordGrantCreate**. Result: **RecordGrant**, HTTP **201**. Permission: `record_grants.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### record_grants.revoke

`POST /v0.1/tenants/{tenant_id}/record-grants/{record_grant_id}/revoke`

Revoke RecordGrant. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `record_grants.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### delegations.list

`GET /v0.1/tenants/{tenant_id}/delegations`

List delegations.

Request: **none**. Result: **DelegationPage**, HTTP **200**. Permission: `delegations.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### delegations.get

`GET /v0.1/tenants/{tenant_id}/delegations/{delegation_id}`

Get Delegation.

Request: **none**. Result: **Delegation**, HTTP **200**. Permission: `delegations.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### delegations.create

`POST /v0.1/tenants/{tenant_id}/delegations`

Create Delegation. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **DelegationCreate**. Result: **Delegation**, HTTP **201**. Permission: `delegations.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### delegations.revoke

`POST /v0.1/tenants/{tenant_id}/delegations/{delegation_id}/revoke`

Revoke Delegation. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `delegations.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### data_plane_bindings.list

`GET /v0.1/tenants/{tenant_id}/data-plane-bindings`

List data-plane-bindings.

Request: **none**. Result: **DataPlaneBindingPage**, HTTP **200**. Permission: `data_plane_bindings.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### data_plane_bindings.get

`GET /v0.1/tenants/{tenant_id}/data-plane-bindings/{data_plane_binding_id}`

Get DataPlaneBinding.

Request: **none**. Result: **DataPlaneBinding**, HTTP **200**. Permission: `data_plane_bindings.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### data_plane_bindings.create

`POST /v0.1/tenants/{tenant_id}/data-plane-bindings`

Create DataPlaneBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **DataPlaneBindingCreate**. Result: **DataPlaneBinding**, HTTP **201**. Permission: `data_plane_bindings.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### data_plane_bindings.revoke

`POST /v0.1/tenants/{tenant_id}/data-plane-bindings/{data_plane_binding_id}/revoke`

Revoke DataPlaneBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `data_plane_bindings.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### data_plane.revision.create

`POST /v0.1/tenants/{tenant_id}/data-plane-revisions`

Create a data-plane revision. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **DataPlaneRevisionRequest**. Result: **Reference**, HTTP **201**. Permission: `data_plane.revision.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### data_plane.activate

`POST /v0.1/tenants/{tenant_id}/data-plane-bindings/{binding_id}/activate`

Commit a checked storage cutover. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **DataPlaneCutover**. Result: **Accepted**, HTTP **202**. Permission: `data_plane.activate`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### device.challenge

`POST /v0.1/tenants/{tenant_id}/device-enrollment/challenges`

Authenticated bootstrap for fixed public-key and platform fields only. No prompt, files, arbitrary labels, credentials or other free-form content is accepted. The installed local service applies the bootstrap policy. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation.

Request: **EnrollmentChallengeRequest**. Result: **EnrollmentChallenge**, HTTP **201**. Permission: `device.challenge`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### device.enroll

`POST /v0.1/tenants/{tenant_id}/device-enrollment/complete`

Verify a device enrollment proof. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation.

Request: **EnrollmentProof**. Result: **DeviceEnrollment**, HTTP **201**. Permission: `device.enroll`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### devices.list

`GET /v0.1/tenants/{tenant_id}/devices`

List devices.

Request: **none**. Result: **DevicePage**, HTTP **200**. Permission: `devices.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### devices.get

`GET /v0.1/tenants/{tenant_id}/devices/{device_id}`

Get Device.

Request: **none**. Result: **Device**, HTTP **200**. Permission: `devices.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### devices.update

`PATCH /v0.1/tenants/{tenant_id}/devices/{device_id}`

Update Device. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **DevicePatch**. Result: **Device**, HTTP **200**. Permission: `devices.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### devices.revoke

`POST /v0.1/tenants/{tenant_id}/devices/{device_id}/revoke`

Revoke Device. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `devices.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### gateway_enrollments.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/gateway-enrollments`

List gateway-enrollments.

Request: **none**. Result: **GatewayEnrollmentPage**, HTTP **200**. Permission: `gateway_enrollments.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### gateway_enrollments.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/gateway-enrollments/{gateway_enrollment_id}`

Get GatewayEnrollment.

Request: **none**. Result: **GatewayEnrollment**, HTTP **200**. Permission: `gateway_enrollments.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### gateway_enrollments.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/gateway-enrollments`

Create GatewayEnrollment. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **GatewayEnrollmentCreate**. Result: **GatewayEnrollment**, HTTP **201**. Permission: `gateway_enrollments.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### gateway_enrollments.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/gateway-enrollments/{gateway_enrollment_id}/revoke`

Revoke GatewayEnrollment. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `gateway_enrollments.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### harness_targets.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets`

List harness-targets.

Request: **none**. Result: **HarnessTargetPage**, HTTP **200**. Permission: `harness_targets.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### harness_targets.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets/{harness_target_id}`

Get HarnessTarget.

Request: **none**. Result: **HarnessTarget**, HTTP **200**. Permission: `harness_targets.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### harness_targets.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets`

Create HarnessTarget. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **HarnessTargetCreate**. Result: **HarnessTarget**, HTTP **201**. Permission: `harness_targets.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### harness_targets.update

`PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets/{harness_target_id}`

Update HarnessTarget. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **HarnessTargetPatch**. Result: **HarnessTarget**, HTTP **200**. Permission: `harness_targets.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### harness_targets.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets/{harness_target_id}/revoke`

Revoke HarnessTarget. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `harness_targets.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### target.heartbeat

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets/{target_id}/heartbeat`

Report target presence. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **Heartbeat**. Result: **Reference**, HTTP **200**. Permission: `target.heartbeat`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### repositories.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repositories`

List repositories.

Request: **none**. Result: **RepositoryPage**, HTTP **200**. Permission: `repositories.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### repositories.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repositories/{repository_id}`

Get Repository.

Request: **none**. Result: **Repository**, HTTP **200**. Permission: `repositories.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### repositories.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repositories`

Create Repository. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RepositoryCreate**. Result: **Repository**, HTTP **201**. Permission: `repositories.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### repositories.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repositories/{repository_id}/revoke`

Revoke Repository. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `repositories.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### workspace.repository.configure

`PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repositories/{repository_id}/settings`

Set the workspace target branch. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RepositorySettings**. Result: **Reference**, HTTP **200**. Permission: `workspace.repository.configure`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### checkout_bindings.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkout-bindings`

List checkout-bindings.

Request: **none**. Result: **CheckoutBindingPage**, HTTP **200**. Permission: `checkout_bindings.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### checkout_bindings.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkout-bindings/{checkout_binding_id}`

Get CheckoutBinding.

Request: **none**. Result: **CheckoutBinding**, HTTP **200**. Permission: `checkout_bindings.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### checkout_bindings.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkout-bindings`

Create CheckoutBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **CheckoutBindingCreate**. Result: **CheckoutBinding**, HTTP **201**. Permission: `checkout_bindings.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### checkout_bindings.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkout-bindings/{checkout_binding_id}/revoke`

Revoke CheckoutBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `checkout_bindings.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### target.configure

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/harness-targets/{target_id}/configure`

Apply checked harness settings. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **TargetConfiguration**. Result: **Accepted**, HTTP **202**. Permission: `target.configure`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### repo_config.export

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repo-config/exports`

Export reference-only repo config. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RepoExportRequest**. Result: **RepoExport**, HTTP **200**. Permission: `repo_config.export`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### repo_config.plan

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repo-config/plans`

Plan repo sync without applying it. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RepoConfigPlanRequest**. Result: **RepoConfigPlan**, HTTP **201**. Permission: `repo_config.plan`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### repo_config.apply

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repo-config/plans/{plan_id}/apply`

Apply a fresh authorized sync plan. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RepoConfigApply**. Result: **SyncReceipt**, HTTP **200**. Permission: `repo_config.apply`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### repo_config.validate

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repo-config/validate`

Validate current setup without launching. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RepoValidate**. Result: **ValidationResult**, HTTP **200**. Permission: `repo_config.validate`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### repo_config.receipt.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/repo-config/sync-receipts/{receipt_id}`

Read the protected sync receipt.

Request: **none**. Result: **SyncReceipt**, HTTP **200**. Permission: `repo_config.receipt.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### personas.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/personas`

List personas.

Request: **none**. Result: **PersonaPage**, HTTP **200**. Permission: `personas.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### personas.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/personas/{persona_id}`

Get Persona.

Request: **none**. Result: **Persona**, HTTP **200**. Permission: `personas.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### personas.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/personas`

Create Persona. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PersonaCreate**. Result: **Persona**, HTTP **201**. Permission: `personas.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### personas.update

`PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/personas/{persona_id}`

Update Persona. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PersonaPatch**. Result: **Persona**, HTTP **200**. Permission: `personas.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### personas.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/personas/{persona_id}/revoke`

Revoke Persona. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `personas.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### persona_versions.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/persona-versions`

List persona-versions.

Request: **none**. Result: **PersonaVersionPage**, HTTP **200**. Permission: `persona_versions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### persona_versions.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/persona-versions/{persona_version_id}`

Get PersonaVersion.

Request: **none**. Result: **PersonaVersion**, HTTP **200**. Permission: `persona_versions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### persona_versions.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/persona-versions`

Create PersonaVersion. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PersonaVersionCreate**. Result: **PersonaVersion**, HTTP **201**. Permission: `persona_versions.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### agents.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents`

List agents.

Request: **none**. Result: **AgentPage**, HTTP **200**. Permission: `agents.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### agents.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents/{agent_id}`

Get Agent.

Request: **none**. Result: **Agent**, HTTP **200**. Permission: `agents.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### agents.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents`

Create Agent. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AgentCreate**. Result: **Agent**, HTTP **201**. Permission: `agents.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### agents.update

`PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents/{agent_id}`

Update Agent. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AgentPatch**. Result: **Agent**, HTTP **200**. Permission: `agents.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### agents.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents/{agent_id}/revoke`

Revoke Agent. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `agents.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### agent_releases.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-releases`

List agent-releases.

Request: **none**. Result: **AgentReleasePage**, HTTP **200**. Permission: `agent_releases.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### agent_releases.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-releases/{agent_release_id}`

Get AgentRelease.

Request: **none**. Result: **AgentRelease**, HTTP **200**. Permission: `agent_releases.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### agent_releases.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-releases`

Create AgentRelease. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AgentReleaseCreate**. Result: **AgentRelease**, HTTP **201**. Permission: `agent_releases.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### agent_modes.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-modes`

List agent-modes.

Request: **none**. Result: **AgentModePage**, HTTP **200**. Permission: `agent_modes.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### agent_modes.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-modes/{agent_mode_id}`

Get AgentMode.

Request: **none**. Result: **AgentMode**, HTTP **200**. Permission: `agent_modes.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### agent_modes.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-modes`

Create AgentMode. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AgentModeCreate**. Result: **AgentMode**, HTTP **201**. Permission: `agent_modes.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### skills.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skills`

List skills.

Request: **none**. Result: **SkillPage**, HTTP **200**. Permission: `skills.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### skills.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skills/{skill_id}`

Get Skill.

Request: **none**. Result: **Skill**, HTTP **200**. Permission: `skills.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### skills.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skills`

Create Skill. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **SkillCreate**. Result: **Skill**, HTTP **201**. Permission: `skills.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### skills.update

`PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skills/{skill_id}`

Update Skill. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **SkillPatch**. Result: **Skill**, HTTP **200**. Permission: `skills.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### skills.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skills/{skill_id}/revoke`

Revoke Skill. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `skills.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### skill_versions.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skill-versions`

List skill-versions.

Request: **none**. Result: **SkillVersionPage**, HTTP **200**. Permission: `skill_versions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### skill_versions.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skill-versions/{skill_version_id}`

Get SkillVersion.

Request: **none**. Result: **SkillVersion**, HTTP **200**. Permission: `skill_versions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### skill_versions.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/skill-versions`

Create SkillVersion. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **SkillVersionCreate**. Result: **SkillVersion**, HTTP **201**. Permission: `skill_versions.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### tool_definitions.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-definitions`

List tool-definitions.

Request: **none**. Result: **ToolDefinitionPage**, HTTP **200**. Permission: `tool_definitions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tool_definitions.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-definitions/{tool_definition_id}`

Get ToolDefinition.

Request: **none**. Result: **ToolDefinition**, HTTP **200**. Permission: `tool_definitions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tool_definitions.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-definitions`

Create ToolDefinition. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ToolDefinitionCreate**. Result: **ToolDefinition**, HTTP **201**. Permission: `tool_definitions.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### tool_definitions.update

`PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-definitions/{tool_definition_id}`

Update ToolDefinition. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ToolDefinitionPatch**. Result: **ToolDefinition**, HTTP **200**. Permission: `tool_definitions.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### tool_definitions.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-definitions/{tool_definition_id}/revoke`

Revoke ToolDefinition. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `tool_definitions.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### tool_releases.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-releases`

List tool-releases.

Request: **none**. Result: **ToolReleasePage**, HTTP **200**. Permission: `tool_releases.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tool_releases.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-releases/{tool_release_id}`

Get ToolRelease.

Request: **none**. Result: **ToolRelease**, HTTP **200**. Permission: `tool_releases.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tool_releases.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-releases`

Create ToolRelease. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ToolReleaseCreate**. Result: **ToolRelease**, HTTP **201**. Permission: `tool_releases.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### tool_bindings.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-bindings`

List tool-bindings.

Request: **none**. Result: **ToolBindingPage**, HTTP **200**. Permission: `tool_bindings.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tool_bindings.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-bindings/{tool_binding_id}`

Get ToolBinding.

Request: **none**. Result: **ToolBinding**, HTTP **200**. Permission: `tool_bindings.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tool_bindings.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-bindings`

Create ToolBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ToolBindingCreate**. Result: **ToolBinding**, HTTP **201**. Permission: `tool_bindings.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### tool_bindings.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-bindings/{tool_binding_id}/revoke`

Revoke ToolBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `tool_bindings.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### agent_tool_rules.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-tool-rules`

List agent-tool-rules.

Request: **none**. Result: **AgentToolRulePage**, HTTP **200**. Permission: `agent_tool_rules.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### agent_tool_rules.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-tool-rules/{agent_tool_rule_id}`

Get AgentToolRule.

Request: **none**. Result: **AgentToolRule**, HTTP **200**. Permission: `agent_tool_rules.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### agent_tool_rules.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agent-tool-rules`

Create AgentToolRule. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AgentToolRuleCreate**. Result: **AgentToolRule**, HTTP **201**. Permission: `agent_tool_rules.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### toolbelt.resolve

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-belts/resolve`

Resolve the active allowed tool belt. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ToolBeltResolve**. Result: **ToolBelt**, HTTP **200**. Permission: `toolbelt.resolve`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### toolbelt.status

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-belts/{snapshot_id}`

Read a tool-belt snapshot.

Request: **none**. Result: **ToolBelt**, HTTP **200**. Permission: `toolbelt.status`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### model_providers.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-providers`

List model-providers.

Request: **none**. Result: **ModelProviderPage**, HTTP **200**. Permission: `model_providers.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### model_providers.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-providers/{model_provider_id}`

Get ModelProvider.

Request: **none**. Result: **ModelProvider**, HTTP **200**. Permission: `model_providers.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### model_providers.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-providers`

Create ModelProvider. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ModelProviderCreate**. Result: **ModelProvider**, HTTP **201**. Permission: `model_providers.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### model_providers.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-providers/{model_provider_id}/revoke`

Revoke ModelProvider. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `model_providers.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### model_releases.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-releases`

List model-releases.

Request: **none**. Result: **ModelReleasePage**, HTTP **200**. Permission: `model_releases.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### model_releases.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-releases/{model_release_id}`

Get ModelRelease.

Request: **none**. Result: **ModelRelease**, HTTP **200**. Permission: `model_releases.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### model_releases.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-releases`

Create ModelRelease. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ModelReleaseCreate**. Result: **ModelRelease**, HTTP **201**. Permission: `model_releases.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### model_routes.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-routes`

List model-routes.

Request: **none**. Result: **ModelRoutePage**, HTTP **200**. Permission: `model_routes.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### model_routes.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-routes/{model_route_id}`

Get ModelRoute.

Request: **none**. Result: **ModelRoute**, HTTP **200**. Permission: `model_routes.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### model_routes.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-routes`

Create ModelRoute. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ModelRouteCreate**. Result: **ModelRoute**, HTTP **201**. Permission: `model_routes.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### model_routes.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-routes/{model_route_id}/revoke`

Revoke ModelRoute. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `model_routes.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### secret_backend_bindings.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/secret-backend-bindings`

List secret-backend-bindings.

Request: **none**. Result: **SecretBackendBindingPage**, HTTP **200**. Permission: `secret_backend_bindings.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### secret_backend_bindings.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/secret-backend-bindings/{secret_backend_binding_id}`

Get SecretBackendBinding.

Request: **none**. Result: **SecretBackendBinding**, HTTP **200**. Permission: `secret_backend_bindings.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### secret_backend_bindings.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/secret-backend-bindings`

Create SecretBackendBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **SecretBackendBindingCreate**. Result: **SecretBackendBinding**, HTTP **201**. Permission: `secret_backend_bindings.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### secret_backend_bindings.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/secret-backend-bindings/{secret_backend_binding_id}/revoke`

Revoke SecretBackendBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `secret_backend_bindings.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### credential_references.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/credential-references`

List credential-references.

Request: **none**. Result: **CredentialReferencePage**, HTTP **200**. Permission: `credential_references.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### credential_references.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/credential-references/{credential_reference_id}`

Get CredentialReference.

Request: **none**. Result: **CredentialReference**, HTTP **200**. Permission: `credential_references.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### credential_references.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/credential-references`

Create CredentialReference. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **CredentialReferenceCreate**. Result: **CredentialReference**, HTTP **201**. Permission: `credential_references.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### credential_references.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/credential-references/{credential_reference_id}/revoke`

Revoke CredentialReference. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `credential_references.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### connectors.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connectors`

List connectors.

Request: **none**. Result: **ConnectorPage**, HTTP **200**. Permission: `connectors.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### connectors.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connectors/{connector_id}`

Get Connector.

Request: **none**. Result: **Connector**, HTTP **200**. Permission: `connectors.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### connectors.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connectors`

Create Connector. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ConnectorCreate**. Result: **Connector**, HTTP **201**. Permission: `connectors.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### connectors.update

`PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connectors/{connector_id}`

Update Connector. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ConnectorPatch**. Result: **Connector**, HTTP **200**. Permission: `connectors.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### connectors.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connectors/{connector_id}/revoke`

Revoke Connector. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `connectors.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### connector_releases.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-releases`

List connector-releases.

Request: **none**. Result: **ConnectorReleasePage**, HTTP **200**. Permission: `connector_releases.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### connector_releases.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-releases/{connector_release_id}`

Get ConnectorRelease.

Request: **none**. Result: **ConnectorRelease**, HTTP **200**. Permission: `connector_releases.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### connector_releases.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-releases`

Create ConnectorRelease. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ConnectorReleaseCreate**. Result: **ConnectorRelease**, HTTP **201**. Permission: `connector_releases.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### connector_deployments.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-deployments`

List connector-deployments.

Request: **none**. Result: **ConnectorDeploymentPage**, HTTP **200**. Permission: `connector_deployments.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### connector_deployments.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-deployments/{connector_deployment_id}`

Get ConnectorDeployment.

Request: **none**. Result: **ConnectorDeployment**, HTTP **200**. Permission: `connector_deployments.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### connector_deployments.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-deployments`

Create ConnectorDeployment. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ConnectorDeploymentCreate**. Result: **ConnectorDeployment**, HTTP **201**. Permission: `connector_deployments.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### connector_deployments.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-deployments/{connector_deployment_id}/revoke`

Revoke ConnectorDeployment. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `connector_deployments.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### policy_templates.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-templates`

List policy-templates.

Request: **none**. Result: **PolicyTemplatePage**, HTTP **200**. Permission: `policy_templates.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### policy_templates.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-templates/{policy_template_id}`

Get PolicyTemplate.

Request: **none**. Result: **PolicyTemplate**, HTTP **200**. Permission: `policy_templates.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### policy_templates.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-templates`

Create PolicyTemplate. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PolicyTemplateCreate**. Result: **PolicyTemplate**, HTTP **201**. Permission: `policy_templates.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### policies.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies`

List policies.

Request: **none**. Result: **PolicyPage**, HTTP **200**. Permission: `policies.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### policies.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies/{policy_id}`

Get Policy.

Request: **none**. Result: **Policy**, HTTP **200**. Permission: `policies.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### policies.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies`

Create Policy. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PolicyCreate**. Result: **Policy**, HTTP **201**. Permission: `policies.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### policies.update

`PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies/{policy_id}`

Update Policy. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PolicyPatch**. Result: **Policy**, HTTP **200**. Permission: `policies.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### policies.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies/{policy_id}/revoke`

Revoke Policy. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `policies.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### policy_revisions.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-revisions`

List policy-revisions.

Request: **none**. Result: **PolicyRevisionPage**, HTTP **200**. Permission: `policy_revisions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### policy_revisions.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-revisions/{policy_revision_id}`

Get PolicyRevision.

Request: **none**. Result: **PolicyRevision**, HTTP **200**. Permission: `policy_revisions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### policy_revisions.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-revisions`

Create PolicyRevision. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PolicyRevisionCreate**. Result: **PolicyRevision**, HTTP **201**. Permission: `policy_revisions.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### policy.validate

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies/validate`

Validate a proposed policy revision. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PolicyValidation**. Result: **ValidationResult**, HTTP **200**. Permission: `policy.validate`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### policy_activations.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-activations`

List policy-activations.

Request: **none**. Result: **PolicyActivationPage**, HTTP **200**. Permission: `policy_activations.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### policy_activations.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-activations/{policy_activation_id}`

Get PolicyActivation.

Request: **none**. Result: **PolicyActivation**, HTTP **200**. Permission: `policy_activations.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### policy_activations.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-activations`

Create PolicyActivation. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PolicyActivationCreate**. Result: **PolicyActivation**, HTTP **201**. Permission: `policy_activations.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### policy_activations.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-activations/{policy_activation_id}/revoke`

Revoke PolicyActivation. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `policy_activations.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### policy.explain

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policies/explain`

Explain effective rules without executing. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PolicyExplainRequest**. Result: **PolicyExplanation**, HTTP **200**. Permission: `policy.explain`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### policy.target_receipt

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/policy-target-receipts`

Record whether a target applied a policy. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PolicyReceiptRequest**. Result: **Reference**, HTTP **201**. Permission: `policy.target_receipt`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### data_protection_profiles.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/data-protection-profiles`

List data-protection-profiles.

Request: **none**. Result: **DataProtectionProfilePage**, HTTP **200**. Permission: `data_protection_profiles.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### data_protection_profiles.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/data-protection-profiles/{data_protection_profile_id}`

Get DataProtectionProfile.

Request: **none**. Result: **DataProtectionProfile**, HTTP **200**. Permission: `data_protection_profiles.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### data_protection_profiles.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/data-protection-profiles`

Create DataProtectionProfile. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **DataProtectionProfileCreate**. Result: **DataProtectionProfile**, HTTP **201**. Permission: `data_protection_profiles.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### scan_receipt.register

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/scan-receipts`

Bootstrap the receipt before artifact upload. Verify enrolled signer, signature, current policy and exact canonical request/artifact digests. Accept no raw text. A content upload is not authorized by a client assertion alone. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation.

Request: **ScanReceipt**. Result: **Reference**, HTTP **201**. Permission: `scan_receipt.register`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **trusted service only**.

### scan_receipt.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/scan-receipts/{receipt_id}`

Read allowed scan receipt metadata.

Request: **none**. Result: **ScanReceipt**, HTTP **200**. Permission: `scan_receipt.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### work_orders.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-orders`

List work-orders.

Request: **none**. Result: **WorkOrderPage**, HTTP **200**. Permission: `work_orders.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### work_orders.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-orders/{work_order_id}`

Get WorkOrder.

Request: **none**. Result: **WorkOrder**, HTTP **200**. Permission: `work_orders.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### work_orders.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-orders`

Create WorkOrder. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **WorkOrderCreate**. Result: **WorkOrder**, HTTP **201**. Permission: `work_orders.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### work_orders.update

`PATCH /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-orders/{work_order_id}`

Update WorkOrder. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **WorkOrderPatch**. Result: **WorkOrder**, HTTP **200**. Permission: `work_orders.update`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### work_orders.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-orders/{work_order_id}/revoke`

Revoke WorkOrder. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `work_orders.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### work_order_revisions.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-order-revisions`

List work-order-revisions.

Request: **none**. Result: **WorkOrderRevisionPage**, HTTP **200**. Permission: `work_order_revisions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### work_order_revisions.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-order-revisions/{work_order_revision_id}`

Get WorkOrderRevision.

Request: **none**. Result: **WorkOrderRevision**, HTTP **200**. Permission: `work_order_revisions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### work_order_revisions.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-order-revisions`

Create WorkOrderRevision. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **WorkOrderRevisionCreate**. Result: **WorkOrderRevision**, HTTP **201**. Permission: `work_order_revisions.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### work.submit

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-requests`

Submit new work to a fixed target set. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **WorkSubmit**. Result: **Accepted**, HTTP **202**. Permission: `work.submit`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### work.status

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-requests/{work_request_id}`

Read each target launch outcome.

Request: **none**. Result: **WorkStatus**, HTTP **200**. Permission: `work.status`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### work.cancel

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-requests/{work_request_id}/cancel`

Request cancellation of queued or started work. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ReasonRequest**. Result: **Accepted**, HTTP **202**. Permission: `work.cancel`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### run.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs`

List visible runs.

Request: **none**. Result: **RunPage**, HTTP **200**. Permission: `run.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### run.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}`

Read current run state.

Request: **none**. Result: **Run**, HTTP **200**. Permission: `run.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### steering.submit

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/steering`

Without interruption, admit steering after the next execution boundary and before new eligible work. With interruption, request a confirmed pause. Target versions are checked individually; broadcast is not an atomic all-device transaction. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **SteeringRequest**. Result: **Accepted**, HTTP **202**. Permission: `steering.submit`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### steering.status

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/steering/{steering_id}`

Read per-run steering application.

Request: **none**. Result: **SteeringStatus**, HTTP **200**. Permission: `steering.status`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### run.pause

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/pause`

Core controls commit state. Pause and stop remain pending until effects and workers are proven quiet or safely fenced. Force continue admits more checked work; it cannot bypass policy, budget or a confirmed pause requirement, force completion, or revive a stopped run. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RunControlRequest**. Result: **Accepted**, HTTP **202**. Permission: `run.pause`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### run.stop

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/stop`

Core controls commit state. Pause and stop remain pending until effects and workers are proven quiet or safely fenced. Force continue admits more checked work; it cannot bypass policy, budget or a confirmed pause requirement, force completion, or revive a stopped run. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RunControlRequest**. Result: **Accepted**, HTTP **202**. Permission: `run.stop`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### run.force_continue

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/force-continue`

Core controls commit state. Pause and stop remain pending until effects and workers are proven quiet or safely fenced. Force continue admits more checked work; it cannot bypass policy, budget or a confirmed pause requirement, force completion, or revive a stopped run. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RunControlRequest**. Result: **Accepted**, HTTP **202**. Permission: `run.force_continue`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### run.pause_status

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/pause`

Read confirmed pause proof.

Request: **none**. Result: **PauseStatus**, HTTP **200**. Permission: `run.pause_status`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### run.resume

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/resume`

Resume from a confirmed boundary. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ResumeRequest**. Result: **Accepted**, HTTP **202**. Permission: `run.resume`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### run.mode.change

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/mode`

Change mode behind closed old gates. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ModeChangeRequest**. Result: **Accepted**, HTTP **202**. Permission: `run.mode.change`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### run.start_receipt

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/start-receipt`

Actual run and first model dispatch must exist. Preflight success or a local sync-lock file cannot produce this receipt. The separately packaged arp.repo/0.2 export format includes its format discriminator and source manifest.

Request: **none**. Result: **LaunchReceipt**, HTTP **200**. Permission: `run.start_receipt`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### action.propose

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions`

Propose a governed workspace action. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ActionProposal**. Result: **GovernedAction**, HTTP **201**. Permission: `action.propose`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### admin_action.propose

`POST /v0.1/tenants/{tenant_id}/admin-actions`

Requires tenant_admin context and null run. Scope comes from the authenticated tenant. Tenant-wide rights do not follow from the null run. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ActionProposal**. Result: **GovernedAction**, HTTP **201**. Permission: `admin_action.propose`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### action.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions/{action_id}`

Read action and attempts.

Request: **none**. Result: **GovernedAction**, HTTP **200**. Permission: `action.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### action.attempt.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions/{action_id}/attempts`

Create a checked new attempt. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AttemptCreate**. Result: **ActionAttempt**, HTTP **201**. Permission: `action.attempt.create`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### action.authorize

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions/{action_id}/authorize`

Only the trusted authorization authority may call this route. Resolve all rule versions, record grants, scope epochs, owner fence, current control epoch, authoritative business facts and atomic budget holds. Client-supplied scope sets cannot replace server resolution. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AuthorizeRequest**. Result: **AuthorizationDecision**, HTTP **200**. Permission: `action.authorize`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### action.dispatch

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions/{action_id}/dispatch`

Consume authorization before tool dispatch. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **DispatchRequest**. Result: **Accepted**, HTTP **202**. Permission: `action.dispatch`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### gateway.model_dispatch

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/gateway/model-dispatches`

Artifact contains the exact locally scanned final provider request. Resolve its pinned provider-wire profile and route, consume one authorization, record dispatch, and send using gateway-held credentials. No model-visible field may be added afterward. Provider responses must reach the local scanner before remote persistence. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **DispatchRequest**. Result: **Accepted**, HTTP **202**. Permission: `gateway.model_dispatch`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### connector.receipt.ingest

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/connector-receipts`

Service webhook ingress for an authenticated registered adapter after local inspection. Match issuer, deployment, attempt and stable external IDs; reject conflicting duplicate bytes. Raw provider webhook parsers and signature adapters have separate versioned contracts, not arbitrary JSON payload support. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **OutcomeReceipt**. Result: **Reference**, HTTP **201**. Permission: `connector.receipt.ingest`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### model.response.ingest

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/model-response-receipts`

A raw provider stream is transiently relayed to the enrolled scanner; only cleaned response evidence may be referenced. Old epochs are evidence-only. A response receipt alone never authorizes a proposed tool call. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **OutcomeReceipt**. Result: **Reference**, HTTP **201**. Permission: `model.response.ingest`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### action.reconcile

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/actions/{action_id}/reconcile`

Reconcile an uncertain external effect. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ReconcileRequest**. Result: **GovernedAction**, HTTP **200**. Permission: `action.reconcile`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### response.adopt

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/responses/{response_id}/adopt`

Explicitly admit selected late evidence. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AdoptResponse**. Result: **Accepted**, HTTP **202**. Permission: `response.adopt`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### access_requests.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/access-requests`

List access-requests.

Request: **none**. Result: **AccessRequestPage**, HTTP **200**. Permission: `access_requests.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### access_requests.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/access-requests/{access_request_id}`

Get AccessRequest.

Request: **none**. Result: **AccessRequest**, HTTP **200**. Permission: `access_requests.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### access_requests.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/access-requests`

Create AccessRequest. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AccessRequestCreate**. Result: **AccessRequest**, HTTP **201**. Permission: `access_requests.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### access.approve

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/access-requests/{request_id}/approve`

Grant the allowed portion of an access request. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AccessApproval**. Result: **Accepted**, HTTP **202**. Permission: `access.approve`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### approval_requests.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/approval-requests`

List approval-requests.

Request: **none**. Result: **ApprovalRequestPage**, HTTP **200**. Permission: `approval_requests.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### approval_requests.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/approval-requests/{approval_request_id}`

Get ApprovalRequest.

Request: **none**. Result: **ApprovalRequest**, HTTP **200**. Permission: `approval_requests.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### approval_requests.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/approval-requests`

Create ApprovalRequest. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ApprovalRequestCreate**. Result: **ApprovalRequest**, HTTP **201**. Permission: `approval_requests.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### approval.decide

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/approval-requests/{request_id}/decide`

Approver must hold the named right. An exception cannot waive an absolute prohibition or higher hard cap. Recheck facts, policy, identity, currency, time period and all available reservations before execution. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ExceptionDecision**. Result: **Accepted**, HTTP **202**. Permission: `approval.decide`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### limit_accounts.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts`

List limit-accounts.

Request: **none**. Result: **LimitAccountPage**, HTTP **200**. Permission: `limit_accounts.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### limit_accounts.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts/{limit_account_id}`

Get LimitAccount.

Request: **none**. Result: **LimitAccount**, HTTP **200**. Permission: `limit_accounts.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### limit_accounts.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts`

Create LimitAccount. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **LimitAccountCreate**. Result: **LimitAccount**, HTTP **201**. Permission: `limit_accounts.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### limit_accounts.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts/{limit_account_id}/revoke`

Revoke LimitAccount. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `limit_accounts.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### budget.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts/{account_id}/balance`

Read used held and remaining amounts.

Request: **none**. Result: **BudgetBalance**, HTTP **200**. Permission: `budget.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### budget.configure

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/limit-accounts/{account_id}/configure`

Change a cap through current policy. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **BudgetChange**. Result: **Accepted**, HTTP **202**. Permission: `budget.configure`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### budget.reserve

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/budget-reservations`

Trusted authority resolves every applicable bucket; callers do not choose a subset. Serialize shared caps in one authority transaction or consume disjoint prepaid allocations. Unknown external exposure remains held. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **ReservationRequest**. Result: **Reservation**, HTTP **201**. Permission: `budget.reserve`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### budget.settle

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/budget-settlements`

Settle a hold from authoritative evidence. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **SettlementRequest**. Result: **Reference**, HTTP **201**. Permission: `budget.settle`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### budget.release

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/budget-reservations/{hold_id}/release`

Release only a proven unused reservation. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **ReasonRequest**. Result: **Reservation**, HTTP **200**. Permission: `budget.release`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### price_schedules.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/price-schedules`

List price-schedules.

Request: **none**. Result: **PriceSchedulePage**, HTTP **200**. Permission: `price_schedules.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### price_schedules.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/price-schedules/{price_schedule_id}`

Get PriceSchedule.

Request: **none**. Result: **PriceSchedule**, HTTP **200**. Permission: `price_schedules.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### price_schedules.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/price-schedules`

Create PriceSchedule. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **PriceScheduleCreate**. Result: **PriceSchedule**, HTTP **201**. Permission: `price_schedules.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### credential.lease

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/credential-leases`

Return a scoped broker handle, never a provider key or refresh token. The trusted connector supplies transport credentials outside model-visible content and evidence. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **CredentialLeaseRequest**. Result: **CredentialLease**, HTTP **201**. Permission: `credential.lease`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### source_bindings.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/source-bindings`

List source-bindings.

Request: **none**. Result: **SourceBindingPage**, HTTP **200**. Permission: `source_bindings.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### source_bindings.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/source-bindings/{source_binding_id}`

Get SourceBinding.

Request: **none**. Result: **SourceBinding**, HTTP **200**. Permission: `source_bindings.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### source_bindings.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/source-bindings`

Create SourceBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **SourceBindingCreate**. Result: **SourceBinding**, HTTP **201**. Permission: `source_bindings.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### source_bindings.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/source-bindings/{source_binding_id}/revoke`

Revoke SourceBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `source_bindings.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### ontology_versions.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/ontology-versions`

List ontology-versions.

Request: **none**. Result: **OntologyVersionPage**, HTTP **200**. Permission: `ontology_versions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### ontology_versions.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/ontology-versions/{ontology_version_id}`

Get OntologyVersion.

Request: **none**. Result: **OntologyVersion**, HTTP **200**. Permission: `ontology_versions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### ontology_versions.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/ontology-versions`

Create OntologyVersion. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **OntologyVersionCreate**. Result: **OntologyVersion**, HTTP **201**. Permission: `ontology_versions.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### graph_entities.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entities`

List graph-entities.

Request: **none**. Result: **GraphEntityPage**, HTTP **200**. Permission: `graph_entities.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### graph_entities.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entities/{graph_entity_id}`

Get GraphEntity.

Request: **none**. Result: **GraphEntity**, HTTP **200**. Permission: `graph_entities.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### graph_entities.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entities`

Create GraphEntity. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **GraphEntityCreate**. Result: **GraphEntity**, HTTP **201**. Permission: `graph_entities.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### graph_entity_revisions.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entity-revisions`

List graph-entity-revisions.

Request: **none**. Result: **GraphEntityRevisionPage**, HTTP **200**. Permission: `graph_entity_revisions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### graph_entity_revisions.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entity-revisions/{graph_entity_revision_id}`

Get GraphEntityRevision.

Request: **none**. Result: **GraphEntityRevision**, HTTP **200**. Permission: `graph_entity_revisions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### graph_entity_revisions.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-entity-revisions`

Create GraphEntityRevision. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **GraphEntityRevisionCreate**. Result: **GraphEntityRevision**, HTTP **201**. Permission: `graph_entity_revisions.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### graph_relations.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-relations`

List graph-relations.

Request: **none**. Result: **GraphRelationPage**, HTTP **200**. Permission: `graph_relations.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### graph_relations.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-relations/{graph_relation_id}`

Get GraphRelation.

Request: **none**. Result: **GraphRelation**, HTTP **200**. Permission: `graph_relations.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### graph_relations.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-relations`

Create GraphRelation. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **GraphRelationCreate**. Result: **GraphRelation**, HTTP **201**. Permission: `graph_relations.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### graph.relation.revise

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph-relation-revisions`

Append a relation assertion or retraction. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **GraphRelationRevisionRequest**. Result: **Reference**, HTTP **201**. Permission: `graph.relation.revise`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### graph.query

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/graph/query`

Authorize nodes, edges, provenance and visible counts before returning them. The graph is a projection; it cannot grant access or supply fresh refund balances. No arbitrary database query language is accepted. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **GraphQuery**. Result: **GraphResult**, HTTP **200**. Permission: `graph.query`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### source.sync

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/source-bindings/{binding_id}/sync`

Request a checked source refresh. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ReasonRequest**. Result: **Accepted**, HTTP **202**. Permission: `source.sync`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### context_records.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-records`

List context-records.

Request: **none**. Result: **ContextRecordPage**, HTTP **200**. Permission: `context_records.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### context_records.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-records/{context_record_id}`

Get ContextRecord.

Request: **none**. Result: **ContextRecord**, HTTP **200**. Permission: `context_records.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### context_records.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-records`

Create ContextRecord. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ContextRecordCreate**. Result: **ContextRecord**, HTTP **201**. Permission: `context_records.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### context_records.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-records/{context_record_id}/revoke`

Revoke ContextRecord. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `context_records.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### context_revisions.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-revisions`

List context-revisions.

Request: **none**. Result: **ContextRevisionPage**, HTTP **200**. Permission: `context_revisions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### context_revisions.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-revisions/{context_revision_id}`

Get ContextRevision.

Request: **none**. Result: **ContextRevision**, HTTP **200**. Permission: `context_revisions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### context_revisions.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context-revisions`

Create ContextRevision. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ContextRevisionCreate**. Result: **ContextRevision**, HTTP **201**. Permission: `context_revisions.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### memory_views.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory-views`

List memory-views.

Request: **none**. Result: **MemoryViewPage**, HTTP **200**. Permission: `memory_views.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### memory_views.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory-views/{memory_view_id}`

Get MemoryView.

Request: **none**. Result: **MemoryView**, HTTP **200**. Permission: `memory_views.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### memory_views.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory-views`

Create MemoryView. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **MemoryViewCreate**. Result: **MemoryView**, HTTP **201**. Permission: `memory_views.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### cgp_providers.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/cgp-providers`

List cgp-providers.

Request: **none**. Result: **CGPProviderPage**, HTTP **200**. Permission: `cgp_providers.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### cgp_providers.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/cgp-providers/{c_g_p_provider_id}`

Get CGPProvider.

Request: **none**. Result: **CGPProvider**, HTTP **200**. Permission: `cgp_providers.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### cgp_providers.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/cgp-providers`

Create CGPProvider. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **CGPProviderCreate**. Result: **CGPProvider**, HTTP **201**. Permission: `cgp_providers.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### cgp_providers.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/cgp-providers/{c_g_p_provider_id}/revoke`

Revoke CGPProvider. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `cgp_providers.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### context.resolve

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/context/resolve`

Apply source rights, consent, purpose and intended model export checks. Verify signed source data locally; persist only allowed derivatives and safe verification receipts. CGP wire messages are a separate pinned adapter contract. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ContextResolveRequest**. Result: **ContextResult**, HTTP **200**. Permission: `context.resolve`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### memory.query

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory/query`

Query permitted memories. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ContextResolveRequest**. Result: **ContextResult**, HTTP **200**. Permission: `memory.query`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### memory.propose

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory/proposals`

Propose a memory change without granting rights. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **MemoryProposal**. Result: **Reference**, HTTP **201**. Permission: `memory.propose`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### memory.promote

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/memory/proposals/{proposal_id}/promote`

Publish a reviewed memory version. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **MemoryPromotion**. Result: **Reference**, HTTP **201**. Permission: `memory.promote`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### artifact.upload.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/artifact-uploads`

Create an upload for sealed cleaned bytes. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ArtifactUploadRequest**. Result: **ArtifactUpload**, HTTP **201**. Permission: `artifact.upload.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### artifact.upload.content

`PUT /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/artifact-uploads/{upload_id}/content`

Stream only pre-inspected immutable bytes through the authenticated gateway. Verify the declared full digest, size, scope and data-plane binding before marking durable. Reject changed bytes and never silently route a private upload to public storage. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **binary cleaned bytes**. Result: **Reference**, HTTP **200**. Permission: `artifact.upload.content`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### artifact.upload.commit

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/artifact-uploads/{upload_id}/commit`

Confirm durable artifact storage. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ArtifactUploadRequest**. Result: **ArtifactRef**, HTTP **200**. Permission: `artifact.upload.commit`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### artifact.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/artifacts/{artifact_id}`

Read permitted artifact metadata.

Request: **none**. Result: **ArtifactRef**, HTTP **200**. Permission: `artifact.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### artifact.content.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/artifacts/{artifact_id}/content`

Read permitted cleaned artifact bytes.

Request: **none**. Result: **binary cleaned bytes**, HTTP **200**. Permission: `artifact.content.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### events.append

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/events`

Caller cannot forge server commit sequence or trusted producer identity. Validate every event against its producer and run; duplicate IDs require matching cleaned bytes. Persist referenced artifacts before admitting dependent work. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **EventBatch**. Result: **Reference**, HTTP **201**. Permission: `events.append`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### events.subscribe

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/events`

Subscribe to permitted workspace events.

Request: **none**. Result: **Event**, HTTP **200**. Permission: `events.subscribe`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### run.events.subscribe

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/runs/{run_id}/events`

Subscribe to permitted run events.

Request: **none**. Result: **Event**, HTTP **200**. Permission: `run.events.subscribe`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### operation.get

`GET /v0.1/tenants/{tenant_id}/operations/{operation_id}`

Read an accepted operation until it resolves.

Request: **none**. Result: **Operation**, HTTP **200**. Permission: `operation.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### checkpoint.prepare

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkpoints/prepare`

Reach a safe checkpoint boundary. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **CheckpointRequest**. Result: **Accepted**, HTTP **202**. Permission: `checkpoint.prepare`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### checkpoint.commit

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkpoints`

Commit an inspected checkpoint manifest. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **CheckpointCommit**. Result: **Checkpoint**, HTTP **201**. Permission: `checkpoint.commit`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### checkpoint.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/checkpoints/{checkpoint_id}`

Read checkpoint coverage and manifest.

Request: **none**. Result: **Checkpoint**, HTTP **200**. Permission: `checkpoint.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### fork.plan

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/fork-plans`

Plan a supported continuation. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ForkPlanRequest**. Result: **ForkPlan**, HTTP **201**. Permission: `fork.plan`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### fork.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/fork-plans/{plan_id}/create`

Start a fork with fresh grants and budgets. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ForkCreate**. Result: **Accepted**, HTTP **202**. Permission: `fork.create`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### migration.commit

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/migrations`

Transfer ownership after source fencing. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **MigrationCommit**. Result: **Accepted**, HTTP **202**. Permission: `migration.commit`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### retention_policies.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/retention-policies`

List retention-policies.

Request: **none**. Result: **RetentionPolicyPage**, HTTP **200**. Permission: `retention_policies.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### retention_policies.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/retention-policies/{retention_policy_id}`

Get RetentionPolicy.

Request: **none**. Result: **RetentionPolicy**, HTTP **200**. Permission: `retention_policies.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### retention_policies.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/retention-policies`

Create RetentionPolicy. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RetentionPolicyCreate**. Result: **RetentionPolicy**, HTTP **201**. Permission: `retention_policies.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### legal_holds.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/legal-holds`

List legal-holds.

Request: **none**. Result: **LegalHoldPage**, HTTP **200**. Permission: `legal_holds.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### legal_holds.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/legal-holds/{legal_hold_id}`

Get LegalHold.

Request: **none**. Result: **LegalHold**, HTTP **200**. Permission: `legal_holds.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### legal_holds.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/legal-holds`

Create LegalHold. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **LegalHoldCreate**. Result: **LegalHold**, HTTP **201**. Permission: `legal_holds.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### legal_holds.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/legal-holds/{legal_hold_id}/revoke`

Revoke LegalHold. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `legal_holds.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### retention.delete

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/deletion-requests`

Request a governed deletion with a tombstone. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **DeleteRequest**. Result: **Accepted**, HTTP **202**. Permission: `retention.delete`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### audit.query

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/audit/query`

Read authorized audit facts. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AuditQuery**. Result: **AuditPage**, HTTP **200**. Permission: `audit.query`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### audit.export

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/audit/exports`

Create an approved cleaned audit export. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AuditQuery**. Result: **Accepted**, HTTP **202**. Permission: `audit.export`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### work_report.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports`

List authorized saved work reports.

Request: **none**. Result: **WorkReportPage**, HTTP **200**. Permission: `work_report.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### work_report.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports/{report_id}`

Read required repo work and CI evidence.

Request: **none**. Result: **WorkReport**, HTTP **200**. Permission: `work_report.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### work_report.refresh

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports/refresh`

Refresh a report from trusted sources. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ReportRefresh**. Result: **Accepted**, HTTP **202**. Permission: `work_report.refresh`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### work_report.ingest

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports`

Target is always the workspace-configured default branch at the stated settings revision. Save metadata and referenced artifacts in the configured tenant store before acknowledging durable success. CI coverage is independent of job conclusions; exact source versions and attempts are preserved. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **WorkReport**. Result: **Reference**, HTTP **201**. Permission: `work_report.ingest`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### work_report.subscribe

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports/{report_id}/events`

Follow authorized report updates.

Request: **none**. Result: **Event**, HTTP **200**. Permission: `work_report.subscribe`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### ci.ingest

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/ci-observations`

Connector verifies source installation and repository binding. Never queue raw webhook bodies remotely when the scanner is unavailable; retain only safe typed wakeup references, refetch later, and mark report pending or stale. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **CIObservationBatch**. Result: **Reference**, HTTP **201**. Permission: `ci.ingest`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### plugin_packages.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-packages`

List plugin-packages. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **none**. Result: **PluginPackagePage**, HTTP **501**. Permission: `plugin_packages.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### plugin_packages.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-packages/{plugin_package_id}`

Get PluginPackage. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **none**. Result: **PluginPackage**, HTTP **501**. Permission: `plugin_packages.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### plugin_packages.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-packages`

Create PluginPackage. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **PluginPackageCreate**. Result: **PluginPackage**, HTTP **501**. Permission: `plugin_packages.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### plugin_installs.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-installs`

List plugin-installs. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **none**. Result: **PluginInstallPage**, HTTP **501**. Permission: `plugin_installs.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### plugin_installs.get

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-installs/{plugin_install_id}`

Get PluginInstall. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **none**. Result: **PluginInstall**, HTTP **501**. Permission: `plugin_installs.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### plugin_installs.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-installs`

Create PluginInstall. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **PluginInstallCreate**. Result: **PluginInstall**, HTTP **501**. Permission: `plugin_installs.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### plugin_installs.revoke

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugin-installs/{plugin_install_id}/revoke`

Revoke PluginInstall. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **501**. Permission: `plugin_installs.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### plugin.control

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/control`

Reserved scoped plugin run control. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **PluginControl**. Result: **Accepted**, HTTP **501**. Permission: `plugin.control`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### plugin.context.offer

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/context-offers`

Reserved plugin context offer. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **PluginContextOffer**. Result: **Reference**, HTTP **501**. Permission: `plugin.context.offer`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### plugin.job.request

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/jobs`

Reserved external plugin job. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **PluginJobRequest**. Result: **Accepted**, HTTP **501**. Permission: `plugin.job.request`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### plugin.events.subscribe

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/events`

Reserved authorized plugin event stream. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **none**. Result: **Event**, HTTP **501**. Permission: `plugin.events.subscribe`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### plugin.events.ack

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/event-acks`

Reserved delivery acknowledgment. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **PluginEventAck**. Result: **Reference**, HTTP **501**. Permission: `plugin.events.ack`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### completion.propose

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/completion-proposals`

Propose completion to core controls. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **CompletionProposalRequest**. Result: **CompletionProposal**, HTTP **201**. Permission: `completion.propose`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### completion.status

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/completion-proposals/{proposal_id}`

Read completion state and holds.

Request: **none**. Result: **CompletionProposal**, HTTP **200**. Permission: `completion.status`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### plugin.decision.submit

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/plugins/completion-decisions`

Reserved immutable completion-seat reply. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **PluginDecision**. Result: **Reference**, HTTP **501**. Permission: `plugin.decision.submit`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### hold.release

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/holds/{hold_id}/release`

Resolve only the named authorized hold. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **HoldDecision**. Result: **Accepted**, HTTP **202**. Permission: `hold.release`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### hold.override

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/holds/{hold_id}/override`

Resolve only the named authorized hold. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **HoldDecision**. Result: **Accepted**, HTTP **202**. Permission: `hold.override`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### business.correlation.create

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/business-correlations`

Requires trusted connector action/source identity, exact IDs and matching receipt. A model assertion, fuzzy search, matching amount or nearby timestamp cannot prove causation. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Reserved, disabled, and uncertified. This contract does not build a plugin, marketplace or business-correlation engine.

Request: **BusinessCorrelationRequest**. Result: **Reference**, HTTP **501**. Permission: `business.correlation.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### tenant.context.resolve

`POST /v0.1/tenants/{tenant_id}/context/resolve`

Requires tenant_admin context with no run; same source/record/export checks apply. Workspace-scoped records still require the caller's exact rights. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ContextResolveRequest**. Result: **ContextResult**, HTTP **200**. Permission: `tenant.context.resolve`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### tenant.scan_receipt.register

`POST /v0.1/tenants/{tenant_id}/scan-receipts`

Register an approved tenant-scope scan receipt. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation.

Request: **ScanReceipt**. Result: **Reference**, HTTP **201**. Permission: `tenant.scan_receipt.register`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **trusted service only**.

### principal_auth_bindings.list

`GET /v0.1/tenants/{tenant_id}/principal-auth-bindings`

List principal-auth-bindings.

Request: **none**. Result: **PrincipalAuthBindingPage**, HTTP **200**. Permission: `principal_auth_bindings.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### principal_auth_bindings.get

`GET /v0.1/tenants/{tenant_id}/principal-auth-bindings/{principal_auth_binding_id}`

Get PrincipalAuthBinding.

Request: **none**. Result: **PrincipalAuthBinding**, HTTP **200**. Permission: `principal_auth_bindings.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### principal_auth_bindings.create

`POST /v0.1/tenants/{tenant_id}/principal-auth-bindings`

Create PrincipalAuthBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PrincipalAuthBindingCreate**. Result: **PrincipalAuthBinding**, HTTP **201**. Permission: `principal_auth_bindings.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### principal_auth_bindings.revoke

`POST /v0.1/tenants/{tenant_id}/principal-auth-bindings/{principal_auth_binding_id}/revoke`

Revoke PrincipalAuthBinding. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `principal_auth_bindings.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### adapter.attest

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/adapter-attestations`

Attest tested adapter controls. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AdapterAttestation**. Result: **Reference**, HTTP **201**. Permission: `adapter.attest`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### agent.resolve

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/agents/resolve`

Resolve the approved agent release for a target. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AgentResolveRequest**. Result: **AgentResolution**, HTTP **200**. Permission: `agent.resolve`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### projection.compile

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/projections/compile`

Compile a release for the tested adapter. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ProjectionCompileRequest**. Result: **Projection**, HTTP **200**. Permission: `projection.compile`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### projection.verify

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/projections/verify`

Compare actual setup to approved projection. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ProjectionVerifyRequest**. Result: **ValidationResult**, HTTP **200**. Permission: `projection.verify`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### toolbelt.prepare

`POST /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/tool-belts/prepare`

Prepare a pre-run tool menu without granting execution. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **PreparedToolBeltRequest**. Result: **PreparedToolBelt**, HTTP **200**. Permission: `toolbelt.prepare`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### work_report.files.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports/{report_id}/files`

Page the report's full permitted file set.

Request: **none**. Result: **ChangedFilePage**, HTTP **200**. Permission: `work_report.files.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### work_report.ci.list

`GET /v0.1/tenants/{tenant_id}/workspaces/{workspace_id}/work-reports/{report_id}/ci-jobs`

Page the report's full permitted CI job set.

Request: **none**. Result: **CIJobPage**, HTTP **200**. Permission: `work_report.ci.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### admin_action.get

`GET /v0.1/tenants/{tenant_id}/admin-actions/{action_id}`

Read a governed tenant admin action.

Request: **none**. Result: **GovernedAction**, HTTP **200**. Permission: `admin_action.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### admin_action.attempt.create

`POST /v0.1/tenants/{tenant_id}/admin-actions/{action_id}/attempts`

Create a checked tenant admin attempt. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AttemptCreate**. Result: **ActionAttempt**, HTTP **201**. Permission: `admin_action.attempt.create`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### admin_action.authorize

`POST /v0.1/tenants/{tenant_id}/admin-actions/{action_id}/authorize`

Authorize tenant admin input under all current grants. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **AuthorizeRequest**. Result: **AuthorizationDecision**, HTTP **200**. Permission: `admin_action.authorize`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### admin_action.dispatch

`POST /v0.1/tenants/{tenant_id}/admin-actions/{action_id}/dispatch`

Dispatch a governed tenant admin action. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **DispatchRequest**. Result: **Accepted**, HTTP **202**. Permission: `admin_action.dispatch`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### admin_action.reconcile

`POST /v0.1/tenants/{tenant_id}/admin-actions/{action_id}/reconcile`

Reconcile a tenant admin effect. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **ReconcileRequest**. Result: **GovernedAction**, HTTP **200**. Permission: `admin_action.reconcile`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

### platform.deployment_profiles.list

`GET /v0.1/platform/deployment-profiles`

Platform-audience workload identity and explicit platform permission are required. An authenticated human requests this through the protected provisioning service; platform authority does not confer tenant content access. Accept only fixed typed IDs of verified bootstrap proofs, never customer text, credentials or file content. The installed scanner applies the published bootstrap profile even though no tenant ScanReceipt can yet exist. Atomically create the initial tenant owner grant and checked data-plane binding, and admit no tenant work until activation. Existing identity login, owner acceptance and deployment attestation use the separately pinned bootstrap protocol.

Request: **none**. Result: **DeploymentProfilePage**, HTTP **200**. Permission: `platform.deployment_profiles.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **trusted service only**.

### platform.tenant.provision

`POST /v0.1/platform/tenant-provisions`

Platform-audience workload identity and explicit platform permission are required. An authenticated human requests this through the protected provisioning service; platform authority does not confer tenant content access. Accept only fixed typed IDs of verified bootstrap proofs, never customer text, credentials or file content. The installed scanner applies the published bootstrap profile even though no tenant ScanReceipt can yet exist. Atomically create the initial tenant owner grant and checked data-plane binding, and admit no tenant work until activation. Existing identity login, owner acceptance and deployment attestation use the separately pinned bootstrap protocol. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation.

Request: **TenantProvisionRequest**. Result: **TenantProvisionOperation**, HTTP **202**. Permission: `platform.tenant.provision`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **trusted service only**.

### platform.tenant.provision.get

`GET /v0.1/platform/tenant-provisions/{provision_id}`

Platform-audience workload identity and explicit platform permission are required. An authenticated human requests this through the protected provisioning service; platform authority does not confer tenant content access. Accept only fixed typed IDs of verified bootstrap proofs, never customer text, credentials or file content. The installed scanner applies the published bootstrap profile even though no tenant ScanReceipt can yet exist. Atomically create the initial tenant owner grant and checked data-plane binding, and admit no tenant work until activation. Existing identity login, owner acceptance and deployment attestation use the separately pinned bootstrap protocol.

Request: **none**. Result: **TenantProvisionOperation**, HTTP **200**. Permission: `platform.tenant.provision.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **trusted service only**.

### platform.tenant.activate

`POST /v0.1/platform/tenant-provisions/{provision_id}/activate`

Platform-audience workload identity and explicit platform permission are required. An authenticated human requests this through the protected provisioning service; platform authority does not confer tenant content access. Accept only fixed typed IDs of verified bootstrap proofs, never customer text, credentials or file content. The installed scanner applies the published bootstrap profile even though no tenant ScanReceipt can yet exist. Atomically create the initial tenant owner grant and checked data-plane binding, and admit no tenant work until activation. Existing identity login, owner acceptance and deployment attestation use the separately pinned bootstrap protocol. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation.

Request: **TenantActivationRequest**. Result: **TenantProvisionOperation**, HTTP **202**. Permission: `platform.tenant.activate`. Expected version: **required**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **trusted service only**.

### limit_definitions.list

`GET /v0.1/tenants/{tenant_id}/limit-definitions`

List limit-definitions.

Request: **none**. Result: **LimitDefinitionPage**, HTTP **200**. Permission: `limit_definitions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### limit_definitions.get

`GET /v0.1/tenants/{tenant_id}/limit-definitions/{limit_definition_id}`

Get LimitDefinition.

Request: **none**. Result: **LimitDefinition**, HTTP **200**. Permission: `limit_definitions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### limit_definitions.create

`POST /v0.1/tenants/{tenant_id}/limit-definitions`

Create LimitDefinition. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **LimitDefinitionCreate**. Result: **LimitDefinition**, HTTP **201**. Permission: `limit_definitions.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### limit_definitions.revoke

`POST /v0.1/tenants/{tenant_id}/limit-definitions/{limit_definition_id}/revoke`

Revoke LimitDefinition. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `limit_definitions.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### limit_definition_terms.list

`GET /v0.1/tenants/{tenant_id}/limit-definition-terms`

List limit-definition-terms.

Request: **none**. Result: **LimitDefinitionTermsPage**, HTTP **200**. Permission: `limit_definition_terms.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### limit_definition_terms.get

`GET /v0.1/tenants/{tenant_id}/limit-definition-terms/{limit_definition_terms_id}`

Get LimitDefinitionTerms.

Request: **none**. Result: **LimitDefinitionTerms**, HTTP **200**. Permission: `limit_definition_terms.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### limit_definition_terms.create

`POST /v0.1/tenants/{tenant_id}/limit-definition-terms`

Create LimitDefinitionTerms. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **LimitDefinitionTermsCreate**. Result: **LimitDefinitionTerms**, HTTP **201**. Permission: `limit_definition_terms.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### tenant.limit_accounts.list

`GET /v0.1/tenants/{tenant_id}/limit-accounts`

Requires the named tenant-level right. This route manages only accounts whose workspace scope is null; workspace routes manage only their named workspace accounts. Operator/agent subject rights are checked separately. Account identity and all historical exposure survive terms changes. The reservation authority automatically includes applicable tenant and workspace parent accounts; callers cannot select only a cheaper scope.

Request: **none**. Result: **LimitAccountPage**, HTTP **200**. Permission: `tenant.limit_accounts.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tenant.limit_accounts.get

`GET /v0.1/tenants/{tenant_id}/limit-accounts/{account_id}`

Requires the named tenant-level right. This route manages only accounts whose workspace scope is null; workspace routes manage only their named workspace accounts. Operator/agent subject rights are checked separately. Account identity and all historical exposure survive terms changes. The reservation authority automatically includes applicable tenant and workspace parent accounts; callers cannot select only a cheaper scope.

Request: **none**. Result: **LimitAccount**, HTTP **200**. Permission: `tenant.limit_accounts.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tenant.limit_accounts.create

`POST /v0.1/tenants/{tenant_id}/limit-accounts`

Requires the named tenant-level right. This route manages only accounts whose workspace scope is null; workspace routes manage only their named workspace accounts. Operator/agent subject rights are checked separately. Account identity and all historical exposure survive terms changes. The reservation authority automatically includes applicable tenant and workspace parent accounts; callers cannot select only a cheaper scope. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **LimitAccountCreate**. Result: **LimitAccount**, HTTP **201**. Permission: `tenant.limit_accounts.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **authorized principal**.

### tenant.budget.get

`GET /v0.1/tenants/{tenant_id}/limit-accounts/{account_id}/balance`

Requires the named tenant-level right. This route manages only accounts whose workspace scope is null; workspace routes manage only their named workspace accounts. Operator/agent subject rights are checked separately. Account identity and all historical exposure survive terms changes. The reservation authority automatically includes applicable tenant and workspace parent accounts; callers cannot select only a cheaper scope.

Request: **none**. Result: **BudgetBalance**, HTTP **200**. Permission: `tenant.budget.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### tenant.budget.configure

`POST /v0.1/tenants/{tenant_id}/limit-accounts/{account_id}/configure`

Requires the named tenant-level right. This route manages only accounts whose workspace scope is null; workspace routes manage only their named workspace accounts. Operator/agent subject rights are checked separately. Account identity and all historical exposure survive terms changes. The reservation authority automatically includes applicable tenant and workspace parent accounts; callers cannot select only a cheaper scope. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **BudgetChange**. Result: **Accepted**, HTTP **202**. Permission: `tenant.budget.configure`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### tenant.limit_accounts.revoke

`POST /v0.1/tenants/{tenant_id}/limit-accounts/{account_id}/revoke`

Requires the named tenant-level right. This route manages only accounts whose workspace scope is null; workspace routes manage only their named workspace accounts. Operator/agent subject rights are checked separately. Account identity and all historical exposure survive terms changes. The reservation authority automatically includes applicable tenant and workspace parent accounts; callers cannot select only a cheaper scope. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **RevocationRequest**. Result: **Accepted**, HTTP **202**. Permission: `tenant.limit_accounts.revoke`. Expected version: **required**. Local scan: **required**. Caller: **authorized principal**.

### financial_sources.list

`GET /v0.1/tenants/{tenant_id}/financial-sources`

List financial-sources.

Request: **none**. Result: **FinancialSourcePage**, HTTP **200**. Permission: `financial_sources.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### financial_sources.get

`GET /v0.1/tenants/{tenant_id}/financial-sources/{financial_source_id}`

Get FinancialSource.

Request: **none**. Result: **FinancialSource**, HTTP **200**. Permission: `financial_sources.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### financial_sources.create

`POST /v0.1/tenants/{tenant_id}/financial-sources`

Create FinancialSource. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **FinancialSourceCreate**. Result: **FinancialSource**, HTTP **201**. Permission: `financial_sources.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### financial_effects.list

`GET /v0.1/tenants/{tenant_id}/financial-effects`

List financial-effects.

Request: **none**. Result: **FinancialEffectPage**, HTTP **200**. Permission: `financial_effects.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### financial_effects.get

`GET /v0.1/tenants/{tenant_id}/financial-effects/{financial_effect_id}`

Get FinancialEffect.

Request: **none**. Result: **FinancialEffect**, HTTP **200**. Permission: `financial_effects.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### financial_effects.create

`POST /v0.1/tenants/{tenant_id}/financial-effects`

Create FinancialEffect. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **FinancialEffectCreate**. Result: **FinancialEffect**, HTTP **201**. Permission: `financial_effects.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### financial_effect_revisions.list

`GET /v0.1/tenants/{tenant_id}/financial-effect-revisions`

List financial-effect-revisions.

Request: **none**. Result: **FinancialEffectRevisionPage**, HTTP **200**. Permission: `financial_effect_revisions.list`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### financial_effect_revisions.get

`GET /v0.1/tenants/{tenant_id}/financial-effect-revisions/{financial_effect_revision_id}`

Get FinancialEffectRevision.

Request: **none**. Result: **FinancialEffectRevision**, HTTP **200**. Permission: `financial_effect_revisions.get`. Expected version: **not a changing existing aggregate**. Local scan: **no content body or narrow bootstrap/receipt registration**. Caller: **authorized principal**.

### financial_effect_revisions.create

`POST /v0.1/tenants/{tenant_id}/financial-effect-revisions`

Create FinancialEffectRevision. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **FinancialEffectRevisionCreate**. Result: **FinancialEffectRevision**, HTTP **201**. Permission: `financial_effect_revisions.create`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### financial_effect.observation.record

`POST /v0.1/tenants/{tenant_id}/financial-effect-observations`

Different receipt IDs can prove one effect revision. Verify source-native identity and reject conflicting totals before any posting; do not infer a new financial effect from each callback. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload.

Request: **FinancialEffectObservation**. Result: **Reference**, HTTP **201**. Permission: `financial_effect.observation.record`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### tenant.budget.reserve

`POST /v0.1/tenants/{tenant_id}/budget-reservations`

Tenant-admin action context only. Reuse the same account, hold, effect and ledger authority as workspace work; never create a second tenant ledger. Resolve every applicable account and preserve unknown exposure. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **ReservationRequest**. Result: **Reservation**, HTTP **201**. Permission: `tenant.budget.reserve`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### tenant.budget.settle

`POST /v0.1/tenants/{tenant_id}/budget-settlements`

Tenant-admin action context only. Reuse the same account, hold, effect and ledger authority as workspace work; never create a second tenant ledger. Resolve every applicable account and preserve unknown exposure. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **SettlementRequest**. Result: **Reference**, HTTP **201**. Permission: `tenant.budget.settle`. Expected version: **not a changing existing aggregate**. Local scan: **required**. Caller: **trusted service only**.

### tenant.budget.release

`POST /v0.1/tenants/{tenant_id}/budget-reservations/{hold_id}/release`

Tenant-admin action context only. Reuse the same account, hold, effect and ledger authority as workspace work; never create a second tenant ledger. Resolve every applicable account and preserve unknown exposure. Idempotency is scoped to tenant, caller, operation and key. A retry cannot duplicate an external effect; unknown effects require reconciliation. Require complete local inspection before remote upload. The receipt and sender-bound gateway identity must match the exact cleaned payload. Count-account creation, configuration, reservation and settlement are reserved and return FEATURE_DISABLED before effects in this release.

Request: **ReasonRequest**. Result: **Reservation**, HTTP **200**. Permission: `tenant.budget.release`. Expected version: **required**. Local scan: **required**. Caller: **trusted service only**.

## Payload models

IDs are UUID strings, timestamps are RFC 3339 date-times, and money/large counters use decimal strings. Nullable differs from optional. Artifact IDs refer only to inspected, access-controlled content.

### ScopeEpoch

| Field | Type | Required |
|---|---|---|
| `scope_object_id` | uuid | yes |
| `epoch` | string | yes |

### Money

| Field | Type | Required |
|---|---|---|
| `minor` | string | yes |
| `currency` | string | yes |

### ArtifactRef

| Field | Type | Required |
|---|---|---|
| `artifact_id` | uuid | yes |
| `cleaned_sha256` | string | yes |
| `byte_count` | string | yes |

### Signature

| Field | Type | Required |
|---|---|---|
| `algorithm` | `Ed25519` | yes |
| `key_id` | uuid | yes |
| `value_base64` | string | yes |

### Reference

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `revision` | string | yes |

### SafeFinding

| Field | Type | Required |
|---|---|---|
| `code` | string | yes |
| `count` | integer | yes |
| `field_path` | string | no |

### Scope

| Field | Type | Required |
|---|---|---|
| `kind` | `tenant`, `workspace`, `record` | yes |
| `object_id` | uuid | yes |

### Error

| Field | Type | Required |
|---|---|---|
| `code` | `UNAUTHENTICATED`, `ACCESS_DENIED`, `NOT_FOUND`, `VALIDATION_FAILED`, `POLICY_DENIED`, `APPROVAL_REQUIRED`, `TOOL_NOT_ALLOWED`, `TOOLBELT_STALE`, `STALE_EPOCH`, `VERSION_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `SCAN_REQUIRED`, `SCAN_INCOMPLETE`, `SCAN_EXPIRED`, `CAPABILITY_UNSUPPORTED`, `FEATURE_DISABLED`, `BUDGET_EXCEEDED`, `LIMIT_EXCEEDED`, `CAPTURE_INCOMPLETE`, `UNSAFE_CHECKPOINT`, `OUTCOME_UNKNOWN`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`, `CURSOR_EXPIRED`, `SIGNATURE_INVALID` | yes |
| `message` | string | yes |
| `correlation_id` | uuid | yes |
| `retry` | `never`, `same_key`, `after_refresh`, `after_approval`, `reconcile_first` | yes |
| `current_version` | string | no |
| `operation_id` | uuid | no |

### Operation

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `kind` | string | yes |
| `state` | `accepted`, `queued`, `running`, `pending_approval`, `completed`, `failed`, `cancelled`, `unknown` | yes |
| `revision` | string | yes |
| `result_object_id` | uuid or null | yes |
| `error` | Error or null | yes |
| `created_at` | date-time | yes |
| `updated_at` | date-time | yes |

### Accepted

| Field | Type | Required |
|---|---|---|
| `operation_id` | uuid | yes |
| `state` | `accepted`, `queued`, `pending_approval` | yes |
| `accepted_at` | date-time | yes |
| `status_path` | string | yes |

### RevocationRequest

| Field | Type | Required |
|---|---|---|
| `reason_artifact_id` | uuid | yes |
| `effective_at` | date-time | no |

### ReasonRequest

| Field | Type | Required |
|---|---|---|
| `reason_artifact_id` | uuid | yes |

### ValidationResult

| Field | Type | Required |
|---|---|---|
| `valid` | boolean | yes |
| `findings` | array of SafeFinding | yes |
| `required_approvals` | array of uuid | yes |
| `checked_version` | string | yes |

### ScanReceipt

Signed by the enrolled protected gateway, not the client. Digest binds canonical method, approved route, scope, content fields and artifact manifest; excludes this receipt and transport credentials to avoid self-reference. Partial/blocked receipts cannot authorize send. Signature transcript vectors are a certification gate. A tenant admin receipt may use an approved scanner authority before a run or workspace enrollment exists. This is not permission to post unscanned forms.

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `principal_id` | uuid | yes |
| `enrollment_id` | uuid or null | yes |
| `run_id` | uuid or null | yes |
| `attempt_id` | uuid or null | yes |
| `purpose` | `submission`, `model_send`, `tool_send`, `record_export`, `context`, `admin_write` | yes |
| `destination_binding` | string | yes |
| `request_digest` | string | yes |
| `artifact_manifest` | array of ArtifactRef | yes |
| `policy_revision_ids` | array of uuid | yes |
| `scanner_revision` | string | yes |
| `coverage` | `complete`, `partial`, `unsupported` | yes |
| `outcome` | `allowed`, `redacted`, `replaced`, `blocked` | yes |
| `scope_epochs` | array of ScopeEpoch | yes |
| `issued_at` | date-time | yes |
| `expires_at` | date-time | yes |
| `signature` | Signature | yes |
| `scanner_authority_id` | uuid | yes |

### CapabilitiesRequest

| Field | Type | Required |
|---|---|---|
| `protocol_versions` | array of string | yes |
| `required_controls` | array of string | yes |
| `client_name` | string | yes |
| `client_version` | string | yes |

### Capabilities

| Field | Type | Required |
|---|---|---|
| `selected_version` | string | yes |
| `supported_controls` | array of string | yes |
| `missing_controls` | array of string | yes |
| `strict_eligible` | boolean | yes |
| `profile_revision` | string | yes |
| `disabled_features` | array of string | yes |

### Identity

| Field | Type | Required |
|---|---|---|
| `principal_id` | uuid | yes |
| `tenant_ids` | array of uuid | yes |
| `principal_kind` | `human`, `agent`, `service`, `plugin` | yes |
| `session_expires_at` | date-time | yes |

### Tenant

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `name` | string | yes |
| `state` | `provisioning`, `active`, `suspended`, `closing` | yes |
| `data_plane_binding_id` | uuid or null | yes |
| `revision` | string | yes |

### TenantPatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |
| `data_plane_binding_id` | uuid | no |

### WorkspaceCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `slug` | string | yes |
| `data_plane_binding_id` | uuid | yes |
| `default_agent_release_id` | uuid or null | no |
| `default_mode_id` | uuid or null | no |

### Workspace

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `slug` | string | yes |
| `data_plane_binding_id` | uuid | yes |
| `default_agent_release_id` | uuid or null | no |
| `default_mode_id` | uuid or null | no |

### WorkspacePage

| Field | Type | Required |
|---|---|---|
| `items` | array of Workspace | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### WorkspacePatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |
| `default_agent_release_id` | uuid or null | no |
| `default_mode_id` | uuid or null | no |

### PrincipalCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `kind` | `human`, `agent`, `service`, `plugin` | yes |
| `display_name` | string | yes |
| `owner_principal_id` | uuid or null | no |

### Principal

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `kind` | `human`, `agent`, `service`, `plugin` | yes |
| `display_name` | string | yes |
| `owner_principal_id` | uuid or null | no |

### PrincipalPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Principal | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### PrincipalPatch

| Field | Type | Required |
|---|---|---|
| `display_name` | string | no |
| `owner_principal_id` | uuid or null | no |

### IdentityProviderCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `issuer` | string | yes |
| `protocol` | `oidc`, `saml` | yes |
| `metadata_binding` | string | yes |
| `directory_credential_reference_id` | uuid or null | no |

### IdentityProvider

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `issuer` | string | yes |
| `protocol` | `oidc`, `saml` | yes |
| `metadata_binding` | string | yes |
| `directory_credential_reference_id` | uuid or null | no |

### IdentityProviderPage

| Field | Type | Required |
|---|---|---|
| `items` | array of IdentityProvider | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### GroupCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `identity_provider_id` | uuid or null | no |
| `external_key` | string or null | no |

### Group

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `identity_provider_id` | uuid or null | no |
| `external_key` | string or null | no |

### GroupPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Group | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### GroupPatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |

### GroupMembershipCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `group_id` | uuid | yes |
| `principal_id` | uuid | yes |
| `source_revision` | string | yes |

### GroupMembership

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `group_id` | uuid | yes |
| `principal_id` | uuid | yes |
| `source_revision` | string | yes |

### GroupMembershipPage

| Field | Type | Required |
|---|---|---|
| `items` | array of GroupMembership | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### PermissionCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `description` | string | yes |

### Permission

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `description` | string | yes |

### PermissionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Permission | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### RoleCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `permission_ids` | array of uuid | yes |

### Role

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `permission_ids` | array of uuid | yes |

### RolePage

| Field | Type | Required |
|---|---|---|
| `items` | array of Role | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### RolePatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |
| `permission_ids` | array of uuid | no |

### RoleGrantCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `role_id` | uuid | yes |
| `principal_id` | uuid or null | yes |
| `group_id` | uuid or null | yes |
| `scope` | Scope | yes |
| `expires_at` | date-time | yes |

### RoleGrant

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `role_id` | uuid | yes |
| `principal_id` | uuid or null | yes |
| `group_id` | uuid or null | yes |
| `scope` | Scope | yes |
| `expires_at` | date-time | yes |

### RoleGrantPage

| Field | Type | Required |
|---|---|---|
| `items` | array of RoleGrant | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### RecordGrantCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `principal_id` | uuid | yes |
| `permission_id` | uuid | yes |
| `object_id` | uuid | yes |
| `expires_at` | date-time | yes |

### RecordGrant

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `principal_id` | uuid | yes |
| `permission_id` | uuid | yes |
| `expires_at` | date-time | yes |

### RecordGrantPage

| Field | Type | Required |
|---|---|---|
| `items` | array of RecordGrant | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### DelegationCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `grantee_principal_id` | uuid | yes |
| `parent_delegation_id` | uuid or null | yes |
| `scope` | Scope | yes |
| `permission_ids` | array of uuid | yes |
| `expires_at` | date-time | yes |

### Delegation

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `grantee_principal_id` | uuid | yes |
| `parent_delegation_id` | uuid or null | yes |
| `scope` | Scope | yes |
| `permission_ids` | array of uuid | yes |
| `expires_at` | date-time | yes |

### DelegationPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Delegation | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### DataPlaneBindingCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `placement` | `saas`, `hybrid`, `private` | yes |
| `region` | string | yes |
| `approved_endpoint_binding` | string | yes |
| `service_principal_id` | uuid | yes |
| `key_reference_id` | uuid | yes |

### DataPlaneBinding

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `placement` | `saas`, `hybrid`, `private` | yes |
| `region` | string | yes |
| `approved_endpoint_binding` | string | yes |
| `service_principal_id` | uuid | yes |
| `key_reference_id` | uuid | yes |

### DataPlaneBindingPage

| Field | Type | Required |
|---|---|---|
| `items` | array of DataPlaneBinding | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### DataPlaneRevisionRequest

| Field | Type | Required |
|---|---|---|
| `binding_id` | uuid | yes |
| `region` | string | yes |
| `approved_endpoint_binding` | string | yes |
| `namespace` | string | yes |
| `key_reference_id` | uuid | yes |
| `placement` | `saas`, `hybrid`, `private` | yes |

### DataPlaneCutover

| Field | Type | Required |
|---|---|---|
| `revision_id` | uuid | yes |
| `validated_migration_receipt_id` | uuid | yes |
| `expected_source_frontier` | string | yes |

### EnrollmentChallengeRequest

| Field | Type | Required |
|---|---|---|
| `device_public_key_base64` | string | yes |
| `platform` | `macos`, `windows`, `linux`, `remote` | yes |
| `installer_profile_id` | string | yes |

### EnrollmentChallenge

| Field | Type | Required |
|---|---|---|
| `challenge_id` | uuid | yes |
| `nonce_base64` | string | yes |
| `expires_at` | date-time | yes |
| `required_attestation_profile` | string | yes |

### EnrollmentProof

| Field | Type | Required |
|---|---|---|
| `challenge_id` | uuid | yes |
| `signature` | Signature | yes |
| `attestation_evidence_id` | uuid | yes |

### DeviceEnrollment

| Field | Type | Required |
|---|---|---|
| `device_id` | uuid | yes |
| `service_principal_id` | uuid | yes |
| `certificate_issue_operation_id` | uuid | yes |
| `state` | `pending`, `active`, `rejected` | yes |

### DeviceCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `owner_principal_id` | uuid | yes |
| `display_name` | string | yes |
| `platform` | `macos`, `windows`, `linux`, `remote` | yes |
| `device_key_id` | uuid | yes |
| `state` | `enrolled`, `suspended`, `revoked` | yes |

### Device

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `owner_principal_id` | uuid | yes |
| `display_name` | string | yes |
| `platform` | `macos`, `windows`, `linux`, `remote` | yes |
| `device_key_id` | uuid | yes |
| `state` | `enrolled`, `suspended`, `revoked` | yes |

### DevicePage

| Field | Type | Required |
|---|---|---|
| `items` | array of Device | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### DevicePatch

| Field | Type | Required |
|---|---|---|
| `display_name` | string | no |

### GatewayEnrollmentCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `device_id` | uuid | yes |
| `service_principal_id` | uuid | yes |
| `profile_id` | string | yes |
| `profile_revision` | string | yes |
| `gateway_version` | string | yes |
| `attestation_evidence_id` | uuid | yes |

### GatewayEnrollment

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `device_id` | uuid | yes |
| `service_principal_id` | uuid | yes |
| `profile_id` | string | yes |
| `profile_revision` | string | yes |
| `gateway_version` | string | yes |
| `attestation_evidence_id` | uuid | yes |

### GatewayEnrollmentPage

| Field | Type | Required |
|---|---|---|
| `items` | array of GatewayEnrollment | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### HarnessTargetCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `enrollment_id` | uuid | yes |
| `owner_principal_id` | uuid | yes |
| `harness_kind` | string | yes |
| `harness_version` | string | yes |
| `adapter_version` | string | yes |
| `capabilities_artifact_id` | uuid | yes |
| `control_level` | `strict`, `observed`, `unsupported` | yes |
| `capacity` | integer | yes |

### HarnessTarget

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `enrollment_id` | uuid | yes |
| `owner_principal_id` | uuid | yes |
| `harness_kind` | string | yes |
| `harness_version` | string | yes |
| `adapter_version` | string | yes |
| `capabilities_artifact_id` | uuid | yes |
| `control_level` | `strict`, `observed`, `unsupported` | yes |
| `capacity` | integer | yes |

### HarnessTargetPage

| Field | Type | Required |
|---|---|---|
| `items` | array of HarnessTarget | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### HarnessTargetPatch

| Field | Type | Required |
|---|---|---|
| `capacity` | integer | no |

### Heartbeat

| Field | Type | Required |
|---|---|---|
| `target_revision` | string | yes |
| `presence` | `online`, `stale`, `offline` | yes |
| `active_run_ids` | array of uuid | yes |
| `available_capacity` | integer | yes |
| `observed_at` | date-time | yes |

### RepositoryCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `connector_deployment_id` | uuid | yes |
| `provider_repository_id` | string | yes |
| `safe_name` | string | yes |
| `safe_url` | uri | yes |
| `default_branch` | string | yes |

### Repository

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `connector_deployment_id` | uuid | yes |
| `provider_repository_id` | string | yes |
| `safe_name` | string | yes |
| `safe_url` | uri | yes |
| `default_branch` | string | yes |

### RepositoryPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Repository | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### RepositorySettings

| Field | Type | Required |
|---|---|---|
| `default_branch` | string | yes |
| `expected_provider_repository_id` | string | yes |

### CheckoutBindingCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `target_id` | uuid | yes |
| `repository_id` | uuid | yes |
| `local_checkout_key` | string | yes |
| `binding_evidence_id` | uuid | yes |

### CheckoutBinding

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `target_id` | uuid | yes |
| `repository_id` | uuid | yes |
| `local_checkout_key` | string | yes |
| `binding_evidence_id` | uuid | yes |

### CheckoutBindingPage

| Field | Type | Required |
|---|---|---|
| `items` | array of CheckoutBinding | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### TargetConfiguration

| Field | Type | Required |
|---|---|---|
| `checkout_binding_ids` | array of uuid | yes |
| `mcp_route_binding_id` | uuid | yes |
| `adapter_settings_artifact_id` | uuid | yes |

### RepoExportRequest

| Field | Type | Required |
|---|---|---|
| `repository_id` | uuid | yes |
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid | yes |
| `source_settings_revision_id` | uuid | yes |

### RepoExport

| Field | Type | Required |
|---|---|---|
| `files` | array of ArtifactRef | yes |
| `source_versions` | array of Reference | yes |
| `format_version` | `arp.repo/0.2` | yes |

### RepoConfigPlanRequest

| Field | Type | Required |
|---|---|---|
| `checkout_binding_id` | uuid | yes |
| `target_id` | uuid | yes |
| `config_artifact_ids` | array of uuid | yes |
| `source_snapshot_id` | uuid | yes |
| `expected_sync_revision` | string | yes |

### RepoConfigPlan

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `revision` | string | yes |
| `source_snapshot_id` | uuid | yes |
| `change_manifest_id` | uuid | yes |
| `missing_required_refs` | array of uuid | yes |
| `safe_findings` | array of SafeFinding | yes |
| `expires_at` | date-time | yes |
| `applicable` | boolean | yes |

### RepoConfigApply

| Field | Type | Required |
|---|---|---|
| `plan_id` | uuid | yes |
| `source_snapshot_id` | uuid | yes |

### SyncReceipt

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid | yes |
| `repository_id` | uuid | yes |
| `checkout_binding_id` | uuid | yes |
| `target_id` | uuid | yes |
| `principal_id` | uuid | yes |
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid | yes |
| `scope_epochs` | array of ScopeEpoch | yes |
| `config_manifest_id` | uuid | yes |
| `context_manifest_id` | uuid | yes |
| `steering_manifest_id` | uuid | yes |
| `policy_revision_ids` | array of uuid | yes |
| `applied_at` | date-time | yes |
| `expires_at` | date-time | yes |
| `signature` | Signature | yes |
| `prepared_tool_belt_id` | uuid | yes |

### RepoValidate

| Field | Type | Required |
|---|---|---|
| `checkout_binding_id` | uuid | yes |
| `sync_receipt_id` | uuid | yes |
| `required_control_level` | `strict`, `observed` | yes |

### PersonaCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `owner_principal_id` | uuid | yes |

### Persona

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `owner_principal_id` | uuid | yes |

### PersonaPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Persona | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### PersonaPatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |

### PersonaVersionCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `persona_id` | uuid | yes |
| `version_label` | string | yes |
| `instruction_artifact_id` | uuid | yes |

### PersonaVersion

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `persona_id` | uuid | yes |
| `version_label` | string | yes |
| `instruction_artifact_id` | uuid | yes |

### PersonaVersionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of PersonaVersion | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### AgentCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `agent_principal_id` | uuid | yes |
| `owner_principal_id` | uuid | yes |

### Agent

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `agent_principal_id` | uuid | yes |
| `owner_principal_id` | uuid | yes |

### AgentPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Agent | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### AgentPatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |
| `owner_principal_id` | uuid | no |

### AgentReleaseCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `agent_id` | uuid | yes |
| `version_label` | string | yes |
| `persona_version_id` | uuid | yes |
| `instruction_artifact_id` | uuid | yes |
| `model_route_id` | uuid | yes |
| `skill_version_ids` | array of uuid | yes |
| `memory_view_id` | uuid or null | yes |

### AgentRelease

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `agent_id` | uuid | yes |
| `version_label` | string | yes |
| `persona_version_id` | uuid | yes |
| `instruction_artifact_id` | uuid | yes |
| `model_route_id` | uuid | yes |
| `skill_version_ids` | array of uuid | yes |
| `memory_view_id` | uuid or null | yes |

### AgentReleasePage

| Field | Type | Required |
|---|---|---|
| `items` | array of AgentRelease | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### AgentModeCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `agent_release_id` | uuid | yes |
| `name` | string | yes |
| `persona_version_id` | uuid | yes |
| `context_view_id` | uuid or null | yes |

### AgentMode

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `agent_release_id` | uuid | yes |
| `name` | string | yes |
| `persona_version_id` | uuid | yes |
| `context_view_id` | uuid or null | yes |

### AgentModePage

| Field | Type | Required |
|---|---|---|
| `items` | array of AgentMode | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### SkillCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `publisher_principal_id` | uuid | yes |

### Skill

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `publisher_principal_id` | uuid | yes |

### SkillPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Skill | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### SkillPatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |

### SkillVersionCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `skill_id` | uuid | yes |
| `version_label` | string | yes |
| `manifest_artifact_id` | uuid | yes |
| `content_artifact_id` | uuid | yes |
| `required_permission_ids` | array of uuid | yes |

### SkillVersion

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `skill_id` | uuid | yes |
| `version_label` | string | yes |
| `manifest_artifact_id` | uuid | yes |
| `content_artifact_id` | uuid | yes |
| `required_permission_ids` | array of uuid | yes |

### SkillVersionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of SkillVersion | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ToolDefinitionCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `namespace` | string | yes |
| `name` | string | yes |
| `business_capability` | string | yes |
| `owner_principal_id` | uuid | yes |

### ToolDefinition

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `namespace` | string | yes |
| `name` | string | yes |
| `business_capability` | string | yes |
| `owner_principal_id` | uuid | yes |

### ToolDefinitionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of ToolDefinition | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ToolDefinitionPatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |

### ToolReleaseCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `tool_definition_id` | uuid | yes |
| `input_schema_artifact_id` | uuid | yes |
| `output_schema_artifact_id` | uuid or null | yes |
| `description_artifact_id` | uuid | yes |
| `implementation_revision` | string | yes |

### ToolRelease

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `tool_definition_id` | uuid | yes |
| `input_schema_artifact_id` | uuid | yes |
| `output_schema_artifact_id` | uuid or null | yes |
| `description_artifact_id` | uuid | yes |
| `implementation_revision` | string | yes |

### ToolReleasePage

| Field | Type | Required |
|---|---|---|
| `items` | array of ToolRelease | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ToolBindingCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `tool_release_id` | uuid | yes |
| `route_kind` | `connector`, `native`, `mcp` | yes |
| `connector_deployment_id` | uuid or null | yes |
| `native_target_id` | uuid or null | yes |
| `approved_route_binding` | string | yes |

### ToolBinding

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `tool_release_id` | uuid | yes |
| `route_kind` | `connector`, `native`, `mcp` | yes |
| `connector_deployment_id` | uuid or null | yes |
| `native_target_id` | uuid or null | yes |
| `approved_route_binding` | string | yes |

### ToolBindingPage

| Field | Type | Required |
|---|---|---|
| `items` | array of ToolBinding | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### AgentToolRuleCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid or null | yes |
| `tool_definition_id` | uuid | yes |
| `effect` | `allow`, `deny` | yes |
| `allowed_binding_id` | uuid or null | yes |

### AgentToolRule

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid or null | yes |
| `tool_definition_id` | uuid | yes |
| `effect` | `allow`, `deny` | yes |
| `allowed_binding_id` | uuid or null | yes |

### AgentToolRulePage

| Field | Type | Required |
|---|---|---|
| `items` | array of AgentToolRule | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ToolBeltResolve

| Field | Type | Required |
|---|---|---|
| `run_id` | uuid | yes |
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid | yes |

### ToolBeltEntry

| Field | Type | Required |
|---|---|---|
| `tool_definition_id` | uuid | yes |
| `tool_binding_id` | uuid | yes |
| `name` | string | yes |
| `input_schema_artifact_id` | uuid | yes |

### ToolBelt

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `run_id` | uuid | yes |
| `entries` | array of ToolBeltEntry | yes |
| `policy_revision_ids` | array of uuid | yes |
| `scope_epochs` | array of ScopeEpoch | yes |
| `state` | `pending`, `active`, `stale`, `blocked` | yes |

### ModelProviderCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `provider_kind` | string | yes |
| `approved_route_binding` | string | yes |

### ModelProvider

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `provider_kind` | string | yes |
| `approved_route_binding` | string | yes |

### ModelProviderPage

| Field | Type | Required |
|---|---|---|
| `items` | array of ModelProvider | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ModelReleaseCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `provider_id` | uuid | yes |
| `model_name` | string | yes |
| `revision_label` | string | yes |
| `capabilities_artifact_id` | uuid | yes |

### ModelRelease

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `provider_id` | uuid | yes |
| `model_name` | string | yes |
| `revision_label` | string | yes |
| `capabilities_artifact_id` | uuid | yes |

### ModelReleasePage

| Field | Type | Required |
|---|---|---|
| `items` | array of ModelRelease | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ModelRouteCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `model_release_id` | uuid | yes |
| `credential_reference_id` | uuid | yes |
| `approved_endpoint_binding` | string | yes |
| `placement` | `saas`, `private`, `local` | yes |
| `gateway_enrollment_id` | uuid or null | yes |

### ModelRoute

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `model_release_id` | uuid | yes |
| `credential_reference_id` | uuid | yes |
| `approved_endpoint_binding` | string | yes |
| `placement` | `saas`, `private`, `local` | yes |
| `gateway_enrollment_id` | uuid or null | yes |

### ModelRoutePage

| Field | Type | Required |
|---|---|---|
| `items` | array of ModelRoute | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### SecretBackendBindingCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `provider_kind` | string | yes |
| `approved_endpoint_binding` | string | yes |
| `namespace` | string | yes |
| `auth_principal_id` | uuid | yes |

### SecretBackendBinding

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `provider_kind` | string | yes |
| `approved_endpoint_binding` | string | yes |
| `namespace` | string | yes |
| `auth_principal_id` | uuid | yes |

### SecretBackendBindingPage

| Field | Type | Required |
|---|---|---|
| `items` | array of SecretBackendBinding | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### CredentialReferenceCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `owner_principal_id` | uuid | yes |
| `secret_backend_binding_id` | uuid | yes |
| `opaque_secret_handle` | string | yes |
| `audience` | string | yes |
| `expires_at` | date-time | yes |

### CredentialReference

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `owner_principal_id` | uuid | yes |
| `secret_backend_binding_id` | uuid | yes |
| `opaque_secret_handle` | string | yes |
| `audience` | string | yes |
| `expires_at` | date-time | yes |

### CredentialReferencePage

| Field | Type | Required |
|---|---|---|
| `items` | array of CredentialReference | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ConnectorCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `kind` | string | yes |
| `owner_principal_id` | uuid | yes |

### Connector

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `kind` | string | yes |
| `owner_principal_id` | uuid | yes |

### ConnectorPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Connector | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ConnectorPatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |

### ConnectorReleaseCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `connector_id` | uuid | yes |
| `version_label` | string | yes |
| `manifest_artifact_id` | uuid | yes |

### ConnectorRelease

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `connector_id` | uuid | yes |
| `version_label` | string | yes |
| `manifest_artifact_id` | uuid | yes |

### ConnectorReleasePage

| Field | Type | Required |
|---|---|---|
| `items` | array of ConnectorRelease | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ConnectorDeploymentCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `connector_release_id` | uuid | yes |
| `service_principal_id` | uuid | yes |
| `credential_reference_id` | uuid or null | yes |
| `approved_endpoint_binding` | string | yes |
| `placement` | `local`, `private`, `saas` | yes |

### ConnectorDeployment

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `connector_release_id` | uuid | yes |
| `service_principal_id` | uuid | yes |
| `credential_reference_id` | uuid or null | yes |
| `approved_endpoint_binding` | string | yes |
| `placement` | `local`, `private`, `saas` | yes |

### ConnectorDeploymentPage

| Field | Type | Required |
|---|---|---|
| `items` | array of ConnectorDeployment | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### PolicyThreshold

Exactly one metric value for a numeric cap; absolute denial has no value. Only approval_threshold may name an approver permission. Ratio denominator is positive and numerator does not exceed it. Server validates cross-field rules, currency, time zone and authoritative denominator.

| Field | Type | Required |
|---|---|---|
| `key` | string | yes |
| `capability` | string | yes |
| `kind` | `absolute_deny`, `hard_cap`, `approval_threshold` | yes |
| `metric` | `money`, `ratio`, `count` or null | yes |
| `money` | Money or null | yes |
| `ratio_numerator` | string or null | yes |
| `ratio_denominator` | string or null | yes |
| `count_limit` | string or null | yes |
| `scope_kind` | `tenant`, `workspace`, `operator`, `agent`, `customer`, `order`, `run` | yes |
| `period_kind` | `lifetime`, `calendar_day`, `rolling` | yes |
| `timezone` | string | yes |
| `approver_permission_id` | uuid or null | yes |

### PolicyTemplateCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `version_label` | string | yes |
| `form_schema_artifact_id` | uuid | yes |
| `compiler_revision` | string | yes |

### PolicyTemplate

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `version_label` | string | yes |
| `form_schema_artifact_id` | uuid | yes |
| `compiler_revision` | string | yes |

### PolicyTemplatePage

| Field | Type | Required |
|---|---|---|
| `items` | array of PolicyTemplate | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### PolicyCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `owner_principal_id` | uuid | yes |

### Policy

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `owner_principal_id` | uuid | yes |

### PolicyPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Policy | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### PolicyPatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |

### PolicyRevisionCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `policy_id` | uuid | yes |
| `template_id` | uuid or null | yes |
| `thresholds` | array of PolicyThreshold | yes |
| `rule_artifact_id` | uuid or null | yes |
| `compiler_revision` | string | yes |

### PolicyRevision

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `policy_id` | uuid | yes |
| `template_id` | uuid or null | yes |
| `thresholds` | array of PolicyThreshold | yes |
| `rule_artifact_id` | uuid or null | yes |
| `compiler_revision` | string | yes |

### PolicyRevisionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of PolicyRevision | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### PolicyValidation

| Field | Type | Required |
|---|---|---|
| `policy_revision_id` | uuid | yes |
| `fixture_artifact_ids` | array of uuid | yes |

### PolicyActivationCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `policy_revision_id` | uuid | yes |
| `scope` | Scope | yes |
| `effective_at` | date-time | yes |
| `expires_at` | date-time or null | yes |

### PolicyActivation

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `policy_revision_id` | uuid | yes |
| `scope` | Scope | yes |
| `effective_at` | date-time | yes |
| `expires_at` | date-time or null | yes |

### PolicyActivationPage

| Field | Type | Required |
|---|---|---|
| `items` | array of PolicyActivation | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### PolicyExplainRequest

| Field | Type | Required |
|---|---|---|
| `principal_id` | uuid | yes |
| `object_id` | uuid | yes |
| `capability` | string | yes |
| `action_id` | uuid or null | yes |

### PolicyEvaluation

| Field | Type | Required |
|---|---|---|
| `policy_revision_id` | uuid | yes |
| `activation_id` | uuid | yes |
| `scope_object_id` | uuid | yes |
| `outcome` | `allow`, `deny`, `not_applicable`, `error` | yes |
| `reason_code` | string | yes |

### PolicyExplanation

| Field | Type | Required |
|---|---|---|
| `outcome` | `allow`, `deny`, `approval_required` | yes |
| `evaluations` | array of PolicyEvaluation | yes |
| `required_approval_ids` | array of uuid | yes |
| `scope_epochs` | array of ScopeEpoch | yes |
| `safe_findings` | array of SafeFinding | yes |

### PolicyReceiptRequest

| Field | Type | Required |
|---|---|---|
| `activation_id` | uuid | yes |
| `target_id` | uuid | yes |
| `installed_revision_id` | uuid | yes |
| `target_epoch` | string | yes |
| `state` | `applied`, `blocked`, `failed` | yes |
| `proof_artifact_id` | uuid | yes |
| `observed_at` | date-time | yes |

### DataProtectionProfileCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `policy_revision_ids` | array of uuid | yes |
| `detector_revision` | string | yes |
| `allowed_media_types` | array of string | yes |
| `max_artifact_bytes` | string | yes |
| `max_archive_depth` | integer | yes |
| `max_scan_milliseconds` | integer | yes |
| `unknown_format_action` | `block` | yes |
| `raw_quarantine_enabled` | boolean | yes |

### DataProtectionProfile

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `policy_revision_ids` | array of uuid | yes |
| `detector_revision` | string | yes |
| `allowed_media_types` | array of string | yes |
| `max_artifact_bytes` | string | yes |
| `max_archive_depth` | integer | yes |
| `max_scan_milliseconds` | integer | yes |
| `unknown_format_action` | `block` | yes |
| `raw_quarantine_enabled` | boolean | yes |

### DataProtectionProfilePage

| Field | Type | Required |
|---|---|---|
| `items` | array of DataProtectionProfile | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### WorkOrderCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `owner_principal_id` | uuid | yes |

### WorkOrder

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `owner_principal_id` | uuid | yes |

### WorkOrderPage

| Field | Type | Required |
|---|---|---|
| `items` | array of WorkOrder | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### WorkOrderPatch

| Field | Type | Required |
|---|---|---|
| `name` | string | no |

### WorkOrderRevisionCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `work_order_id` | uuid | yes |
| `agent_release_id` | uuid | yes |
| `assignment_artifact_id` | uuid | yes |
| `constraints_artifact_id` | uuid | yes |
| `policy_revision_ids` | array of uuid | yes |
| `expires_at` | date-time or null | yes |

### WorkOrderRevision

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `work_order_id` | uuid | yes |
| `agent_release_id` | uuid | yes |
| `assignment_artifact_id` | uuid | yes |
| `constraints_artifact_id` | uuid | yes |
| `policy_revision_ids` | array of uuid | yes |
| `expires_at` | date-time or null | yes |

### WorkOrderRevisionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of WorkOrderRevision | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### WorkSubmit

Exact frozen targets; each must independently pass IAM, placement, local scan and launch controls. Choosing a target does not imply a verified checkout.

| Field | Type | Required |
|---|---|---|
| `accountable_operator_id` | uuid | yes |
| `payer_scope_object_id` | uuid | yes |
| `work_order_revision_id` | uuid | yes |
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid | yes |
| `target_ids` | array of uuid | yes |
| `repository_id` | uuid | yes |
| `workspace_settings_revision_id` | uuid | yes |
| `request_artifact_id` | uuid | yes |
| `sync_receipt_id` | uuid or null | yes |
| `config_snapshot_artifact_id` | uuid or null | yes |
| `queue_expires_at` | date-time | yes |
| `required_controls` | array of string | yes |

### DispatchTarget

| Field | Type | Required |
|---|---|---|
| `target_id` | uuid | yes |
| `checkout_binding_id` | uuid or null | yes |
| `run_id` | uuid or null | yes |
| `state` | `queued`, `waiting_capacity`, `waiting_device`, `starting`, `started`, `blocked`, `expired`, `cancelled`, `unknown` | yes |
| `safe_reason_code` | string or null | yes |

### WorkStatus

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `revision` | string | yes |
| `state` | `accepted`, `queued`, `partial`, `running`, `completed`, `blocked`, `cancelled`, `unknown` | yes |
| `targets` | array of DispatchTarget | yes |
| `submitted_at` | date-time | yes |

### Run

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid | yes |
| `agent_principal_id` | uuid | yes |
| `operator_principal_id` | uuid | yes |
| `target_id` | uuid | yes |
| `work_order_revision_id` | uuid | yes |
| `parent_run_id` | uuid or null | yes |
| `state` | `queued`, `running`, `pausing`, `paused`, `stopping`, `stopped`, `blocked`, `completed`, `uncertain` | yes |
| `current_epoch` | string | yes |
| `owner_epoch` | string | yes |
| `last_event_sequence` | string | yes |

### RunPage

| Field | Type | Required |
|---|---|---|
| `items` | array of Run | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### SteeringRequest

| Field | Type | Required |
|---|---|---|
| `run_ids` | array of uuid | yes |
| `message_artifact_id` | uuid | yes |
| `interrupt` | boolean | yes |
| `expires_at` | date-time | yes |
| `expected_control_versions` | array of Reference | yes |

### SteeringTarget

| Field | Type | Required |
|---|---|---|
| `run_id` | uuid | yes |
| `state` | `accepted`, `delivered`, `queued`, `pause_requested`, `boundary_reached`, `applied`, `expired`, `ended_without_application`, `blocked` | yes |
| `applied_attempt_id` | uuid or null | yes |
| `reason_code` | string or null | yes |

### SteeringStatus

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `revision` | string | yes |
| `targets` | array of SteeringTarget | yes |

### RunControlRequest

| Field | Type | Required |
|---|---|---|
| `reason_artifact_id` | uuid | yes |
| `expected_epoch` | string | yes |

### PauseBoundary

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `run_id` | uuid | yes |
| `command_id` | uuid | yes |
| `closed_epoch` | string | yes |
| `next_epoch` | string | yes |
| `last_admitted_sequence` | string | yes |
| `worker_receipt_id` | uuid | yes |
| `effect_receipt_id` | uuid | yes |
| `checkpoint_id` | uuid | yes |
| `confirmed_at` | date-time | yes |

### PauseStatus

| Field | Type | Required |
|---|---|---|
| `run_id` | uuid | yes |
| `state` | `running`, `requested`, `draining`, `blocked`, `confirmed` | yes |
| `boundary` | PauseBoundary or null | yes |
| `unresolved_action_ids` | array of uuid | yes |

### ResumeRequest

| Field | Type | Required |
|---|---|---|
| `boundary_id` | uuid | yes |
| `context_manifest_id` | uuid | yes |
| `expected_closed_epoch` | string | yes |

### ModeChangeRequest

| Field | Type | Required |
|---|---|---|
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid | yes |
| `expected_epoch` | string | yes |

### LaunchReceipt

| Field | Type | Required |
|---|---|---|
| `work_request_id` | uuid | yes |
| `target_id` | uuid | yes |
| `run_id` | uuid | yes |
| `checkout_binding_id` | uuid | yes |
| `sync_receipt_id` | uuid | yes |
| `start_event_id` | uuid | yes |
| `first_model_attempt_id` | uuid | yes |
| `first_model_dispatch_event_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |
| `context_manifest_id` | uuid | yes |
| `steering_manifest_id` | uuid | yes |
| `policy_revision_ids` | array of uuid | yes |
| `tool_belt_snapshot_id` | uuid | yes |
| `started_at` | date-time | yes |
| `signature` | Signature | yes |
| `composition_receipt_id` | uuid | yes |

### ActionProposal

Caller supplies a proposal, never a decision or authority. Admin actions can precede a run; target resources and role rights still apply.

| Field | Type | Required |
|---|---|---|
| `context_kind` | `run`, `workspace_admin`, `tenant_admin` | yes |
| `run_id` | uuid or null | yes |
| `capability` | string | yes |
| `target_object_ids` | array of uuid | yes |
| `tool_binding_id` | uuid or null | yes |
| `model_route_id` | uuid or null | yes |
| `input_artifact_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |
| `expected_run_epoch` | string or null | yes |

### GovernedAction

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `context_kind` | `run`, `workspace_admin`, `tenant_admin` | yes |
| `run_id` | uuid or null | yes |
| `principal_id` | uuid | yes |
| `capability` | string | yes |
| `state` | `proposed`, `awaiting_decision`, `approval_required`, `authorized`, `dispatched`, `running`, `completed`, `failed`, `cancelled`, `denied`, `expired`, `outcome_unknown` | yes |
| `input_artifact_id` | uuid | yes |
| `attempt_ids` | array of uuid | yes |

### ActionAttempt

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `action_id` | uuid | yes |
| `attempt_number` | integer | yes |
| `state` | `proposed`, `authorized`, `dispatched`, `running`, `completed`, `failed`, `outcome_unknown` | yes |
| `provider_idempotency_key` | string or null | yes |
| `outcome_artifact_id` | uuid or null | yes |

### AttemptCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `previous_attempt_id` | uuid or null | yes |
| `reconciliation_receipt_id` | uuid or null | yes |

### AuthorizeRequest

| Field | Type | Required |
|---|---|---|
| `attempt_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |
| `cleaned_request_digest` | string | yes |

### AuthorizationDecision

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `action_id` | uuid | yes |
| `attempt_id` | uuid | yes |
| `outcome` | `allow`, `deny`, `approval_required` | yes |
| `evaluations` | array of PolicyEvaluation | yes |
| `scope_epochs` | array of ScopeEpoch | yes |
| `run_control_epoch` | string or null | yes |
| `owner_epoch` | string or null | yes |
| `hold_ids` | array of uuid | yes |
| `authorization_id` | uuid or null | yes |
| `expires_at` | date-time or null | yes |
| `reason_codes` | array of string | yes |

### DispatchRequest

| Field | Type | Required |
|---|---|---|
| `action_id` | uuid | yes |
| `attempt_id` | uuid | yes |
| `authorization_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |
| `request_artifact_id` | uuid | yes |
| `cleaned_request_digest` | string | yes |

### OutcomeReceipt

| Field | Type | Required |
|---|---|---|
| `attempt_id` | uuid | yes |
| `source_principal_id` | uuid | yes |
| `connector_deployment_id` | uuid or null | yes |
| `model_exchange_id` | uuid or null | yes |
| `external_request_id` | string | yes |
| `external_receipt_id` | string or null | yes |
| `source_event_key` | string | yes |
| `outcome` | `pending`, `succeeded`, `failed`, `unknown` | yes |
| `clean_evidence_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |
| `observed_at` | date-time | yes |
| `source_binding_id` | uuid or null | yes |
| `external_record_kind` | `customer`, `order`, `refund`, `other` or null | yes |
| `external_record_id` | string or null | yes |
| `source_version` | string or null | yes |

### ReconcileRequest

| Field | Type | Required |
|---|---|---|
| `attempt_id` | uuid | yes |
| `receipt_ids` | array of uuid | yes |
| `expected_outcome` | `succeeded`, `failed`, `unknown` | yes |

### AdoptResponse

| Field | Type | Required |
|---|---|---|
| `response_id` | uuid | yes |
| `destination_run_id` | uuid | yes |
| `destination_turn_id` | uuid | yes |
| `purpose` | string | yes |
| `transformed_artifact_id` | uuid | yes |
| `expected_epoch` | string | yes |

### AccessRequestCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `scope` | Scope | yes |
| `permission_ids` | array of uuid | yes |
| `purpose_artifact_id` | uuid | yes |
| `expires_at` | date-time | yes |

### AccessRequest

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `scope` | Scope | yes |
| `permission_ids` | array of uuid | yes |
| `purpose_artifact_id` | uuid | yes |
| `expires_at` | date-time | yes |

### AccessRequestPage

| Field | Type | Required |
|---|---|---|
| `items` | array of AccessRequest | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### AccessApproval

| Field | Type | Required |
|---|---|---|
| `request_id` | uuid | yes |
| `permission_ids` | array of uuid | yes |
| `scope` | Scope | yes |
| `expires_at` | date-time | yes |
| `reason_artifact_id` | uuid | yes |

### ApprovalRequestCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `action_id` | uuid | yes |
| `threshold_id` | uuid | yes |
| `facts_artifact_id` | uuid | yes |
| `expires_at` | date-time | yes |

### ApprovalRequest

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `action_id` | uuid | yes |
| `threshold_id` | uuid | yes |
| `facts_artifact_id` | uuid | yes |
| `expires_at` | date-time | yes |

### ApprovalRequestPage

| Field | Type | Required |
|---|---|---|
| `items` | array of ApprovalRequest | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ExceptionDecision

| Field | Type | Required |
|---|---|---|
| `outcome` | `approve`, `deny` | yes |
| `action_id` | uuid | yes |
| `threshold_id` | uuid | yes |
| `max_amount` | Money or null | yes |
| `expires_at` | date-time | yes |
| `expected_facts_artifact_id` | uuid | yes |
| `reason_artifact_id` | uuid | yes |

### LimitAccountCreate

Exact shared limit account. A percentage cap pins an authoritative denominator fact; currency and FX must match that fact. Count accounts have no currency. All source/cap/period constraints are checked before atomic reservation. Stable identity is tenant plus limit definition, explicit workspace scope, subject, currency and charge unit. A new policy revision or agent release cannot create fresh allowance. Terms must belong to that definition; preserve settled and held exposure. The count shape is reserved until a matching certified counter-account storage/settlement profile exists; this release returns FEATURE_DISABLED for count accounts.

| Field | Type | Required |
|---|---|---|
| `scope` | Scope | yes |
| `capability` | string | yes |
| `charge_unit` | `usd_minor`, `currency_minor`, `count` | yes |
| `cap` | Money or null | yes |
| `ratio_numerator` | string or null | yes |
| `ratio_denominator` | string or null | yes |
| `policy_revision_id` | uuid | yes |
| `threshold_id` | uuid or null | yes |
| `period_kind` | `lifetime`, `calendar_day`, `rolling` | yes |
| `timezone` | string | yes |
| `event_basis` | `authorized_dispatch`, `authoritative_initiation` | yes |
| `count_limit` | string or null | yes |
| `limit_fact_id` | uuid or null | yes |
| `fx_quote_id` | uuid or null | yes |
| `limit_definition_id` | uuid | yes |
| `definition_terms_id` | uuid | yes |

### LimitAccount

Exact shared limit account. A percentage cap pins an authoritative denominator fact; currency and FX must match that fact. Count accounts have no currency. All source/cap/period constraints are checked before atomic reservation. Stable identity is tenant plus limit definition, explicit workspace scope, subject, currency and charge unit. A new policy revision or agent release cannot create fresh allowance. Terms must belong to that definition; preserve settled and held exposure. The count shape is reserved until a matching certified counter-account storage/settlement profile exists; this release returns FEATURE_DISABLED for count accounts.

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `scope` | Scope | yes |
| `capability` | string | yes |
| `charge_unit` | `usd_minor`, `currency_minor`, `count` | yes |
| `cap` | Money or null | yes |
| `ratio_numerator` | string or null | yes |
| `ratio_denominator` | string or null | yes |
| `policy_revision_id` | uuid | yes |
| `threshold_id` | uuid or null | yes |
| `period_kind` | `lifetime`, `calendar_day`, `rolling` | yes |
| `timezone` | string | yes |
| `event_basis` | `authorized_dispatch`, `authoritative_initiation` | yes |
| `count_limit` | string or null | yes |
| `limit_fact_id` | uuid or null | yes |
| `fx_quote_id` | uuid or null | yes |
| `limit_definition_id` | uuid | yes |
| `definition_terms_id` | uuid | yes |

### LimitAccountPage

| Field | Type | Required |
|---|---|---|
| `items` | array of LimitAccount | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### BudgetBalance

| Field | Type | Required |
|---|---|---|
| `account_id` | uuid | yes |
| `period_start` | date-time | yes |
| `period_end` | date-time | yes |
| `currency` | string or null | yes |
| `frozen` | boolean | yes |
| `as_of` | date-time | yes |
| `source_version` | string | yes |
| `charge_unit` | `usd_minor`, `currency_minor`, `count` | yes |
| `cap_quantity` | string | yes |
| `settled_quantity` | string | yes |
| `held_quantity` | string | yes |
| `remaining_quantity` | string | yes |

### BudgetChange

Terms update the existing stable account. Preserve all usage and unknown holds; lowering below current exposure blocks new admission. This is not a reset operation.

| Field | Type | Required |
|---|---|---|
| `new_cap` | LimitQuantity | yes |
| `policy_revision_id` | uuid | yes |
| `effective_at` | date-time | yes |
| `reason_artifact_id` | uuid | yes |
| `definition_terms_id` | uuid | yes |

### ReservationRequest

| Field | Type | Required |
|---|---|---|
| `action_id` | uuid | yes |
| `attempt_id` | uuid | yes |
| `authorization_decision_id` | uuid | yes |
| `pricing_snapshot_id` | uuid | yes |

### Reservation

Each amount corresponds to account_ids at the same position. The trusted authority proves equal lengths, matching units/currencies and atomic admission across all required accounts.

| Field | Type | Required |
|---|---|---|
| `hold_id` | uuid | yes |
| `action_id` | uuid | yes |
| `attempt_id` | uuid | yes |
| `state` | `held`, `settled`, `released`, `unknown` | yes |
| `account_ids` | array of uuid | yes |
| `amounts` | array of LimitQuantity | yes |

### SettlementRequest

Settle monetary exposure using a trusted canonical financial effect revision, never receipt identity alone. Prove the effect belongs to the hold action; actual amount, currency and observation match the effect revision. Lock each account and its effect/account state. Post only the change from the last recognized cumulative total; uniqueness is effect revision plus account. Repeated observations and reconciled retry holds cannot debit twice. Source corrections require a new proved revision. Count settlement returns FEATURE_DISABLED before any hold, debit or effect until its dedicated profile is certified.

| Field | Type | Required |
|---|---|---|
| `hold_id` | uuid | yes |
| `source_kind` | `model_usage`, `connector_receipt`, `approved_adjustment` | yes |
| `source_id` | uuid | yes |
| `actual` | LimitQuantity | yes |
| `price_schedule_id` | uuid or null | yes |
| `fx_quote_id` | uuid or null | yes |
| `financial_effect_revision_id` | uuid | yes |

### PriceScheduleCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `model_release_id` | uuid | yes |
| `version_label` | string | yes |
| `currency` | string | yes |
| `rates_artifact_id` | uuid | yes |
| `effective_at` | date-time | yes |
| `expires_at` | date-time or null | yes |
| `source_evidence_id` | uuid | yes |

### PriceSchedule

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `model_release_id` | uuid | yes |
| `version_label` | string | yes |
| `currency` | string | yes |
| `rates_artifact_id` | uuid | yes |
| `effective_at` | date-time | yes |
| `expires_at` | date-time or null | yes |
| `source_evidence_id` | uuid | yes |

### PriceSchedulePage

| Field | Type | Required |
|---|---|---|
| `items` | array of PriceSchedule | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### CredentialLeaseRequest

| Field | Type | Required |
|---|---|---|
| `credential_reference_id` | uuid | yes |
| `action_id` | uuid | yes |
| `attempt_id` | uuid | yes |
| `audience` | string | yes |
| `expires_at` | date-time | yes |

### CredentialLease

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `credential_reference_id` | uuid | yes |
| `audience` | string | yes |
| `expires_at` | date-time | yes |
| `connector_handle` | string | yes |

### SourceBindingCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `source_kind` | string | yes |
| `external_scope` | string | yes |
| `connector_deployment_id` | uuid or null | yes |
| `owner_principal_id` | uuid | yes |

### SourceBinding

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `source_kind` | string | yes |
| `external_scope` | string | yes |
| `connector_deployment_id` | uuid or null | yes |
| `owner_principal_id` | uuid | yes |

### SourceBindingPage

| Field | Type | Required |
|---|---|---|
| `items` | array of SourceBinding | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### OntologyVersionCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `version_label` | string | yes |
| `definition_artifact_id` | uuid | yes |

### OntologyVersion

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `version_label` | string | yes |
| `definition_artifact_id` | uuid | yes |

### OntologyVersionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of OntologyVersion | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### GraphEntityCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `source_binding_id` | uuid or null | yes |
| `external_key` | string or null | yes |
| `ontology_type_id` | uuid | yes |

### GraphEntity

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `source_binding_id` | uuid or null | yes |
| `external_key` | string or null | yes |
| `ontology_type_id` | uuid | yes |

### GraphEntityPage

| Field | Type | Required |
|---|---|---|
| `items` | array of GraphEntity | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### GraphEntityRevisionCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `entity_id` | uuid | yes |
| `source_version` | string or null | yes |
| `clean_artifact_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |
| `source_access_version` | string or null | yes |
| `trust` | `proposed`, `inferred`, `verified` | yes |
| `valid_from` | date-time or null | yes |
| `valid_until` | date-time or null | yes |
| `source_evidence_id` | uuid | yes |

### GraphEntityRevision

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `entity_id` | uuid | yes |
| `source_version` | string or null | yes |
| `clean_artifact_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |
| `source_access_version` | string or null | yes |
| `trust` | `proposed`, `inferred`, `verified` | yes |
| `valid_from` | date-time or null | yes |
| `valid_until` | date-time or null | yes |
| `source_evidence_id` | uuid | yes |

### GraphEntityRevisionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of GraphEntityRevision | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### GraphRelationCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `from_entity_id` | uuid | yes |
| `to_entity_id` | uuid | yes |
| `ontology_type_id` | uuid | yes |
| `source_binding_id` | uuid or null | yes |

### GraphRelation

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `from_entity_id` | uuid | yes |
| `to_entity_id` | uuid | yes |
| `ontology_type_id` | uuid | yes |
| `source_binding_id` | uuid or null | yes |

### GraphRelationPage

| Field | Type | Required |
|---|---|---|
| `items` | array of GraphRelation | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### GraphRelationRevisionRequest

| Field | Type | Required |
|---|---|---|
| `relation_id` | uuid | yes |
| `from_revision_id` | uuid | yes |
| `to_revision_id` | uuid | yes |
| `event_kind` | `assertion`, `retraction` | yes |
| `supersedes_revision_id` | uuid or null | yes |
| `source_evidence_id` | uuid | yes |
| `trust` | `proposed`, `inferred`, `verified` | yes |

### GraphQuery

| Field | Type | Required |
|---|---|---|
| `start_object_ids` | array of uuid | yes |
| `relation_type_ids` | array of uuid | yes |
| `max_hops` | integer | yes |
| `as_of` | date-time or null | yes |
| `limit` | integer | yes |
| `cursor` | string or null | yes |

### GraphResult

| Field | Type | Required |
|---|---|---|
| `entity_revision_ids` | array of uuid | yes |
| `relation_revision_ids` | array of uuid | yes |
| `next_cursor` | string or null | yes |
| `source_frontier` | string | yes |
| `coverage` | `complete`, `partial`, `stale` | yes |
| `decision_id` | uuid | yes |

### ContextRecordCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `kind` | `memory`, `document`, `skill`, `run_evidence`, `derived` | yes |
| `owner_principal_id` | uuid | yes |
| `source_entity_id` | uuid or null | yes |

### ContextRecord

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `kind` | `memory`, `document`, `skill`, `run_evidence`, `derived` | yes |
| `owner_principal_id` | uuid | yes |
| `source_entity_id` | uuid or null | yes |

### ContextRecordPage

| Field | Type | Required |
|---|---|---|
| `items` | array of ContextRecord | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ContextRevisionCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `record_id` | uuid | yes |
| `clean_artifact_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |
| `source_revision_id` | uuid or null | yes |
| `valid_until` | date-time or null | yes |

### ContextRevision

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `record_id` | uuid | yes |
| `clean_artifact_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |
| `source_revision_id` | uuid or null | yes |
| `valid_until` | date-time or null | yes |

### ContextRevisionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of ContextRevision | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### MemoryViewCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `owner_principal_id` | uuid | yes |
| `context_revision_ids` | array of uuid | yes |

### MemoryView

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `owner_principal_id` | uuid | yes |
| `context_revision_ids` | array of uuid | yes |

### MemoryViewPage

| Field | Type | Required |
|---|---|---|
| `items` | array of MemoryView | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### CGPProviderCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `source_binding_id` | uuid | yes |
| `principal_id` | uuid | yes |
| `protocol_version` | string | yes |
| `schema_digest` | string | yes |
| `registry_key_id` | uuid | yes |

### CGPProvider

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `source_binding_id` | uuid | yes |
| `principal_id` | uuid | yes |
| `protocol_version` | string | yes |
| `schema_digest` | string | yes |
| `registry_key_id` | uuid | yes |

### CGPProviderPage

| Field | Type | Required |
|---|---|---|
| `items` | array of CGPProvider | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ContextResolveRequest

| Field | Type | Required |
|---|---|---|
| `run_id` | uuid or null | yes |
| `purpose` | string | yes |
| `query_artifact_id` | uuid | yes |
| `memory_view_id` | uuid or null | yes |
| `source_binding_ids` | array of uuid | yes |
| `destination_model_route_id` | uuid or null | yes |
| `max_bytes` | string | yes |
| `max_results` | integer | yes |
| `context_kind` | `run`, `workspace_admin`, `tenant_admin` | yes |

### ContextResult

| Field | Type | Required |
|---|---|---|
| `query_id` | uuid | yes |
| `retrieval_receipt_ids` | array of uuid | yes |
| `context_revision_ids` | array of uuid | yes |
| `cleaned_result_artifact_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |
| `source_versions` | array of Reference | yes |
| `coverage` | `complete`, `partial`, `unavailable` | yes |
| `expires_at` | date-time | yes |

### MemoryProposal

| Field | Type | Required |
|---|---|---|
| `record_id` | uuid or null | yes |
| `clean_artifact_id` | uuid | yes |
| `source_evidence_ids` | array of uuid | yes |
| `intended_scope` | Scope | yes |

### MemoryPromotion

| Field | Type | Required |
|---|---|---|
| `proposal_id` | uuid | yes |
| `approved_scope` | Scope | yes |
| `evidence_ids` | array of uuid | yes |

### ArtifactUploadRequest

| Field | Type | Required |
|---|---|---|
| `cleaned_sha256` | string | yes |
| `byte_count` | string | yes |
| `media_type` | string | yes |
| `classification` | string | yes |
| `scan_receipt_id` | uuid | yes |
| `retention_policy_id` | uuid | yes |
| `data_plane_revision_id` | uuid | yes |

### ArtifactUpload

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `artifact_id` | uuid | yes |
| `data_plane_revision_id` | uuid | yes |
| `upload_path` | string | yes |
| `expires_at` | date-time | yes |
| `max_bytes` | string | yes |

### Event

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `run_id` | uuid or null | yes |
| `type` | string | yes |
| `sequence` | string | yes |
| `producer_id` | uuid | yes |
| `action_id` | uuid or null | yes |
| `attempt_id` | uuid or null | yes |
| `origin_epoch` | string or null | yes |
| `observed_at` | date-time | yes |
| `recorded_at` | date-time | yes |
| `payload_artifact_id` | uuid or null | yes |
| `capture_trust` | `trusted_gateway`, `trusted_connector`, `client_observation` | yes |
| `disposition` | `current`, `late_evidence`, `gap`, `tombstone` | yes |

### EventBatch

| Field | Type | Required |
|---|---|---|
| `events` | array of Event | yes |

### CheckpointRequest

| Field | Type | Required |
|---|---|---|
| `run_id` | uuid | yes |
| `expected_epoch` | string | yes |
| `required_fidelity` | `cleaned_portable`, `native_local` | yes |
| `reason_artifact_id` | uuid | yes |

### Checkpoint

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `run_id` | uuid | yes |
| `boundary_id` | uuid | yes |
| `manifest_artifact_id` | uuid | yes |
| `coverage` | `complete_permitted`, `partial`, `blocked` | yes |
| `omitted_state_codes` | array of string | yes |
| `confirmed_at` | date-time | yes |

### CheckpointCommit

| Field | Type | Required |
|---|---|---|
| `run_id` | uuid | yes |
| `boundary_id` | uuid | yes |
| `manifest_artifact_id` | uuid | yes |
| `scope_epochs` | array of ScopeEpoch | yes |

### ForkPlanRequest

| Field | Type | Required |
|---|---|---|
| `checkpoint_id` | uuid | yes |
| `target_id` | uuid | yes |
| `mode` | `fork`, `migration`, `portable_continuation`, `native_recovery` | yes |
| `accept_permitted_loss` | boolean | yes |

### ForkPlan

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `checkpoint_id` | uuid | yes |
| `target_id` | uuid | yes |
| `required_access_ids` | array of uuid | yes |
| `missing_state_codes` | array of string | yes |
| `safe_change_manifest_id` | uuid | yes |
| `eligible` | boolean | yes |
| `expires_at` | date-time | yes |

### ForkCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `plan_id` | uuid | yes |
| `approved_loss_manifest_id` | uuid | yes |
| `new_work_order_revision_id` | uuid | yes |

### MigrationCommit

| Field | Type | Required |
|---|---|---|
| `plan_id` | uuid | yes |
| `source_fence_receipt_id` | uuid | yes |
| `destination_target_id` | uuid | yes |

### RetentionPolicyCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `retain_seconds` | string | yes |
| `rule_artifact_id` | uuid | yes |

### RetentionPolicy

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `name` | string | yes |
| `retain_seconds` | string | yes |
| `rule_artifact_id` | uuid | yes |

### RetentionPolicyPage

| Field | Type | Required |
|---|---|---|
| `items` | array of RetentionPolicy | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### LegalHoldCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `held_object_id` | uuid | yes |
| `reason_artifact_id` | uuid | yes |

### LegalHold

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `held_object_id` | uuid | yes |
| `reason_artifact_id` | uuid | yes |

### LegalHoldPage

| Field | Type | Required |
|---|---|---|
| `items` | array of LegalHold | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### DeleteRequest

| Field | Type | Required |
|---|---|---|
| `object_id` | uuid | yes |
| `reason_artifact_id` | uuid | yes |
| `expected_retention_policy_revision` | uuid | yes |

### AuditQuery

| Field | Type | Required |
|---|---|---|
| `principal_id` | uuid or null | yes |
| `object_id` | uuid or null | yes |
| `from_time` | date-time | yes |
| `to_time` | date-time | yes |
| `event_types` | array of string | yes |
| `cursor` | string or null | yes |
| `limit` | integer | yes |

### AuditPage

| Field | Type | Required |
|---|---|---|
| `events` | array of Event | yes |
| `next_cursor` | string or null | yes |
| `coverage` | `complete`, `partial` | yes |

### ChangedFile

| Field | Type | Required |
|---|---|---|
| `path` | string or null | yes |
| `old_path` | string or null | yes |
| `change` | `added`, `modified`, `deleted`, `renamed`, `copied`, `type_changed`, `binary`, `submodule` | yes |
| `redacted` | boolean | yes |

### BranchComparison

| Field | Type | Required |
|---|---|---|
| `repository_id` | uuid | yes |
| `workspace_settings_revision_id` | uuid | yes |
| `work_branch` | string or null | yes |
| `work_commit` | string | yes |
| `target_branch` | string | yes |
| `target_commit` | string | yes |
| `kind` | `target_tip_to_work_head`, `merge_base_to_work_head` | yes |
| `patch_artifact_id` | uuid or null | yes |
| `files` | array of ChangedFile | yes |
| `coverage` | `complete_permitted`, `partial`, `unavailable` | yes |
| `captured_at` | date-time | yes |
| `files_manifest_artifact_id` | uuid | yes |
| `inline_files_complete` | boolean | yes |

### PullRequest

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `provider_pr_id` | string | yes |
| `number` | string | yes |
| `safe_url` | uri or null | yes |
| `state` | `open`, `closed`, `merged`, `unknown` | yes |
| `head_repository_id` | uuid | yes |
| `base_repository_id` | uuid | yes |
| `head_branch` | string or null | yes |
| `base_branch` | string or null | yes |
| `target_mismatch` | boolean | yes |
| `observed_at` | date-time | yes |

### CIJob

| Field | Type | Required |
|---|---|---|
| `source_id` | uuid | yes |
| `job_id` | string | yes |
| `name` | string or null | yes |
| `attempt` | integer | yes |
| `matrix_key` | string or null | yes |
| `safe_url` | uri or null | yes |
| `status` | `queued`, `in_progress`, `completed`, `unknown` | yes |
| `conclusion` | string or null | yes |
| `tested_commit` | string or null | yes |
| `test_kind` | `head`, `test_merge`, `merge_group`, `other`, `unknown` | yes |
| `observed_at` | date-time | yes |

### PersonaSegment

| Field | Type | Required |
|---|---|---|
| `persona_id` | uuid | yes |
| `persona_version_id` | uuid | yes |
| `name_at_use` | string or null | yes |
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid | yes |
| `first_event_sequence` | string | yes |
| `last_event_sequence` | string | yes |

### ToolCount

| Field | Type | Required |
|---|---|---|
| `name_at_use` | string or null | yes |
| `binding_ids` | array of uuid | yes |
| `confirmed_uses` | string | yes |
| `denied` | string | yes |
| `uncertain_start` | string | yes |

### WorkReport

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `run_id` | uuid | yes |
| `repository_id` | uuid | yes |
| `revision` | string | yes |
| `operator_id` | uuid | yes |
| `work_order_revision_id` | uuid | yes |
| `data_plane_revision_id` | uuid | yes |
| `comparison` | BranchComparison | yes |
| `working_copy_snapshot_id` | uuid or null | yes |
| `pull_requests` | array of PullRequest | yes |
| `ci_jobs` | array of CIJob | yes |
| `ci_coverage` | `complete`, `partial`, `unknown` | yes |
| `persona_segments` | array of PersonaSegment | yes |
| `tool_counts` | array of ToolCount | yes |
| `store_receipt_id` | uuid | yes |
| `source_frontier` | string | yes |
| `saved_at` | date-time | yes |
| `redacted` | boolean | yes |
| `missing_codes` | array of string | yes |
| `ci_manifest_artifact_id` | uuid | yes |
| `inline_ci_complete` | boolean | yes |

### WorkReportPage

| Field | Type | Required |
|---|---|---|
| `items` | array of WorkReport | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### ReportRefresh

| Field | Type | Required |
|---|---|---|
| `run_id` | uuid | yes |
| `repository_id` | uuid | yes |
| `reason` | `explicit_request`, `source_update`, `run_end` | yes |

### CIObservationBatch

| Field | Type | Required |
|---|---|---|
| `repository_id` | uuid | yes |
| `pull_request_id` | uuid | yes |
| `source_id` | uuid | yes |
| `source_event_key` | string | yes |
| `jobs` | array of CIJob | yes |
| `coverage` | `complete`, `partial`, `unknown` | yes |
| `pages_complete` | boolean | yes |
| `source_evidence_id` | uuid | yes |
| `scan_receipt_id` | uuid | yes |

### PluginPackageCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `publisher_principal_id` | uuid | yes |
| `name` | string | yes |
| `version_label` | string | yes |
| `manifest_artifact_id` | uuid | yes |

### PluginPackage

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `publisher_principal_id` | uuid | yes |
| `name` | string | yes |
| `version_label` | string | yes |
| `manifest_artifact_id` | uuid | yes |

### PluginPackagePage

| Field | Type | Required |
|---|---|---|
| `items` | array of PluginPackage | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### PluginInstallCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `package_id` | uuid | yes |
| `plugin_principal_id` | uuid | yes |
| `record_grant_ids` | array of uuid | yes |

### PluginInstall

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `package_id` | uuid | yes |
| `plugin_principal_id` | uuid | yes |
| `record_grant_ids` | array of uuid | yes |

### PluginInstallPage

| Field | Type | Required |
|---|---|---|
| `items` | array of PluginInstall | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### PluginControl

| Field | Type | Required |
|---|---|---|
| `install_id` | uuid | yes |
| `run_id` | uuid | yes |
| `verb` | `pause`, `resume`, `stop`, `force_continue` | yes |
| `expected_run_revision` | string | yes |
| `expected_run_epoch` | string | yes |
| `boundary_id` | uuid or null | yes |
| `reason_artifact_id` | uuid | yes |

### PluginContextOffer

| Field | Type | Required |
|---|---|---|
| `install_id` | uuid | yes |
| `run_id` | uuid | yes |
| `context_revision_id` | uuid | yes |
| `purpose` | string | yes |

### PluginJobRequest

| Field | Type | Required |
|---|---|---|
| `install_id` | uuid | yes |
| `run_id` | uuid | yes |
| `request_artifact_id` | uuid | yes |
| `deadline` | date-time | yes |
| `payer_scope_id` | uuid | yes |

### PluginEventAck

| Field | Type | Required |
|---|---|---|
| `install_id` | uuid | yes |
| `delivery_id` | uuid | yes |
| `event_id` | uuid | yes |

### CompletionProposalRequest

| Field | Type | Required |
|---|---|---|
| `run_id` | uuid | yes |
| `turn_id` | uuid or null | yes |
| `target_revision` | string | yes |
| `candidate_artifact_id` | uuid | yes |
| `expected_run_epoch` | string | yes |

### CompletionProposal

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `run_id` | uuid | yes |
| `turn_id` | uuid or null | yes |
| `target_revision` | string | yes |
| `state` | `proposed`, `held`, `committed`, `superseded` | yes |
| `required_seat_ids` | array of uuid | yes |
| `unresolved_seat_ids` | array of uuid | yes |

### PluginDecision

| Field | Type | Required |
|---|---|---|
| `seat_id` | uuid | yes |
| `round_id` | uuid | yes |
| `proposal_id` | uuid | yes |
| `vote` | `ready`, `hold`, `continue`, `abstain` | yes |
| `reason_artifact_id` | uuid | yes |
| `expected_target_revision` | string | yes |

### HoldDecision

| Field | Type | Required |
|---|---|---|
| `hold_id` | uuid | yes |
| `seat_id` | uuid or null | yes |
| `round_id` | uuid or null | yes |
| `reason_artifact_id` | uuid | yes |

### BusinessCorrelationRequest

| Field | Type | Required |
|---|---|---|
| `action_id` | uuid | yes |
| `connector_receipt_id` | uuid | yes |
| `source_binding_id` | uuid | yes |
| `external_record_id` | string | yes |
| `source_version` | string or null | yes |
| `decision_id` | uuid | yes |
| `policy_revision_ids` | array of uuid | yes |
| `approval_id` | uuid or null | yes |

### PrincipalAuthBindingCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `principal_id` | uuid | yes |
| `identity_provider_id` | uuid or null | yes |
| `issuer` | string | yes |
| `subject` | string | yes |
| `kind` | `federated`, `workload`, `device` | yes |
| `expires_at` | date-time or null | yes |

### PrincipalAuthBinding

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `principal_id` | uuid | yes |
| `identity_provider_id` | uuid or null | yes |
| `issuer` | string | yes |
| `subject` | string | yes |
| `kind` | `federated`, `workload`, `device` | yes |
| `expires_at` | date-time or null | yes |

### PrincipalAuthBindingPage

| Field | Type | Required |
|---|---|---|
| `items` | array of PrincipalAuthBinding | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### AdapterAttestation

| Field | Type | Required |
|---|---|---|
| `target_id` | uuid | yes |
| `profile_id` | string | yes |
| `profile_revision` | string | yes |
| `challenge_id` | uuid | yes |
| `control_results_artifact_id` | uuid | yes |
| `signature` | Signature | yes |
| `expires_at` | date-time | yes |

### AgentResolveRequest

| Field | Type | Required |
|---|---|---|
| `agent_id` | uuid | yes |
| `release_id` | uuid or null | yes |
| `mode_id` | uuid | yes |
| `target_id` | uuid | yes |
| `required_controls` | array of string | yes |

### AgentResolution

| Field | Type | Required |
|---|---|---|
| `agent_release_id` | uuid | yes |
| `persona_version_id` | uuid | yes |
| `mode_id` | uuid | yes |
| `skill_version_ids` | array of uuid | yes |
| `model_route_id` | uuid | yes |
| `required_controls` | array of string | yes |
| `policy_revision_ids` | array of uuid | yes |
| `scope_epochs` | array of ScopeEpoch | yes |

### ProjectionCompileRequest

| Field | Type | Required |
|---|---|---|
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid | yes |
| `target_id` | uuid | yes |
| `config_snapshot_artifact_id` | uuid | yes |

### Projection

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `target_id` | uuid | yes |
| `agent_release_id` | uuid | yes |
| `compiled_manifest_id` | uuid | yes |
| `omissions` | array of SafeFinding | yes |
| `required_controls_met` | boolean | yes |

### ProjectionVerifyRequest

| Field | Type | Required |
|---|---|---|
| `projection_id` | uuid | yes |
| `actual_settings_artifact_id` | uuid | yes |
| `target_attestation_id` | uuid | yes |

### PreparedToolBeltRequest

| Field | Type | Required |
|---|---|---|
| `principal_id` | uuid | yes |
| `target_id` | uuid | yes |
| `agent_release_id` | uuid | yes |
| `mode_id` | uuid | yes |
| `config_snapshot_artifact_id` | uuid | yes |

### PreparedToolBelt

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `principal_id` | uuid | yes |
| `target_id` | uuid | yes |
| `config_snapshot_artifact_id` | uuid | yes |
| `entries` | array of ToolBeltEntry | yes |
| `scope_epochs` | array of ScopeEpoch | yes |
| `expires_at` | date-time | yes |
| `execution_authority` | `False` | yes |

### ChangedFilePage

| Field | Type | Required |
|---|---|---|
| `items` | array of ChangedFile | yes |
| `next_cursor` | string or null | yes |
| `report_revision` | string | yes |

### CIJobPage

| Field | Type | Required |
|---|---|---|
| `items` | array of CIJob | yes |
| `next_cursor` | string or null | yes |
| `report_revision` | string | yes |

### LimitQuantity

| Field | Type | Required |
|---|---|---|
| `charge_unit` | `usd_minor`, `currency_minor`, `count` | yes |
| `quantity` | string | yes |
| `currency` | string or null | yes |

### DeploymentProfile

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `placement` | `saas`, `hybrid`, `private` | yes |
| `region_code` | string | yes |
| `bootstrap_policy_revision_id` | uuid | yes |
| `requires_private_attestation` | boolean | yes |
| `revision` | string | yes |

### DeploymentProfilePage

| Field | Type | Required |
|---|---|---|
| `items` | array of DeploymentProfile | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### TenantProvisionRequest

| Field | Type | Required |
|---|---|---|
| `deployment_profile_id` | uuid | yes |
| `initial_owner_platform_principal_id` | uuid | yes |
| `owner_acceptance_receipt_id` | uuid | yes |
| `bootstrap_approval_receipt_id` | uuid | yes |

### TenantProvisionOperation

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `revision` | string | yes |
| `state` | `accepted`, `checking`, `awaiting_attestation`, `awaiting_owner`, `active`, `failed`, `cancelled` | yes |
| `tenant_id` | uuid or null | yes |
| `owner_tenant_principal_id` | uuid or null | yes |
| `data_plane_binding_id` | uuid or null | yes |
| `failure_code` | `OWNER_PROOF_INVALID`, `PROFILE_UNAVAILABLE`, `ATTESTATION_REQUIRED`, `APPROVAL_REQUIRED`, `PROVISION_FAILED` or null | yes |
| `created_at` | date-time | yes |
| `updated_at` | date-time | yes |

### TenantActivationRequest

| Field | Type | Required |
|---|---|---|
| `storage_attestation_receipt_id` | uuid | yes |
| `initial_iam_receipt_id` | uuid | yes |
| `owner_acceptance_receipt_id` | uuid | yes |
| `bootstrap_approval_receipt_id` | uuid | yes |

### LimitDefinitionCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `logical_key` | string | yes |
| `capability` | string | yes |
| `state` | `active`, `retired` | yes |

### LimitDefinition

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `logical_key` | string | yes |
| `capability` | string | yes |
| `state` | `active`, `retired` | yes |

### LimitDefinitionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of LimitDefinition | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### LimitDefinitionTermsCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `limit_definition_id` | uuid | yes |
| `policy_revision_id` | uuid | yes |
| `threshold_id` | uuid | yes |
| `effective_at` | date-time | yes |

### LimitDefinitionTerms

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `limit_definition_id` | uuid | yes |
| `policy_revision_id` | uuid | yes |
| `threshold_id` | uuid | yes |
| `effective_at` | date-time | yes |

### LimitDefinitionTermsPage

| Field | Type | Required |
|---|---|---|
| `items` | array of LimitDefinitionTerms | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### FinancialSourceCreate

Typed proposed record input. IDs and revisions come from the server. Referenced scopes, owners and resources require current IAM rights; relationship IDs are not grants. Every free-text field is already locally inspected.

| Field | Type | Required |
|---|---|---|
| `connector_deployment_id` | uuid or null | yes |
| `model_provider_id` | uuid or null | yes |
| `provider_installation_key` | string | yes |
| `source_kind` | `model_provider`, `payment_provider` | yes |
| `currency` | string | yes |

### FinancialSource

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `connector_deployment_id` | uuid or null | yes |
| `model_provider_id` | uuid or null | yes |
| `provider_installation_key` | string | yes |
| `source_kind` | `model_provider`, `payment_provider` | yes |
| `currency` | string | yes |

### FinancialSourcePage

| Field | Type | Required |
|---|---|---|
| `items` | array of FinancialSource | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### FinancialEffectCreate

Trusted source-native effect identity is unique per source installation, kind and external ID. Amount/time similarity cannot establish identity. External history may constrain limits without claiming an Oxagen action caused it.

| Field | Type | Required |
|---|---|---|
| `financial_source_id` | uuid | yes |
| `kind` | `model_charge`, `refund` | yes |
| `external_effect_id` | string | yes |
| `origin` | `oxagen`, `external`, `unknown` | yes |
| `action_id` | uuid or null | yes |
| `currency` | string | yes |

### FinancialEffect

Trusted source-native effect identity is unique per source installation, kind and external ID. Amount/time similarity cannot establish identity. External history may constrain limits without claiming an Oxagen action caused it.

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `financial_source_id` | uuid | yes |
| `kind` | `model_charge`, `refund` | yes |
| `external_effect_id` | string | yes |
| `origin` | `oxagen`, `external`, `unknown` | yes |
| `action_id` | uuid or null | yes |
| `currency` | string | yes |

### FinancialEffectPage

| Field | Type | Required |
|---|---|---|
| `items` | array of FinancialEffect | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### FinancialEffectRevisionCreate

Immutable trusted cumulative total for one source effect. A correction supersedes a revision of the same effect. It is not a second charge. Scope, source observation, currency and source version must match.

| Field | Type | Required |
|---|---|---|
| `effect_id` | uuid | yes |
| `source_revision_key` | string | yes |
| `settlement_source_id` | uuid | yes |
| `total_minor` | string | yes |
| `observed_at` | date-time | yes |
| `supersedes_revision_id` | uuid or null | yes |

### FinancialEffectRevision

| Field | Type | Required |
|---|---|---|
| `id` | uuid | yes |
| `tenant_id` | uuid | yes |
| `workspace_id` | uuid or null | yes |
| `object_id` | uuid | yes |
| `revision` | string | yes |
| `created_at` | date-time | yes |
| `effect_id` | uuid | yes |
| `source_revision_key` | string | yes |
| `settlement_source_id` | uuid | yes |
| `total_minor` | string | yes |
| `observed_at` | date-time | yes |
| `supersedes_revision_id` | uuid or null | yes |

### FinancialEffectRevisionPage

| Field | Type | Required |
|---|---|---|
| `items` | array of FinancialEffectRevision | yes |
| `next_cursor` | string or null | yes |
| `snapshot_id` | uuid | yes |

### FinancialEffectObservation

| Field | Type | Required |
|---|---|---|
| `effect_revision_id` | uuid | yes |
| `source_kind` | `model_usage`, `connector_receipt`, `approved_adjustment` | yes |
| `source_id` | uuid | yes |

## Before claiming support

This is a complete inventory of the HTTP surface proposed here, not a claim that every provider or platform contract is finished. [Certification blockers](CERTIFICATION-BLOCKERS.md) identify what must be resolved and tested. [Validation results](validation-report.json) state exactly what was checked. OpenAPI describes HTTP interfaces; it does not enforce policy or prove runtime behavior. [OpenAPI 3.1.1 specification](https://spec.openapis.org/oas/v3.1.1.html)
