# Oxagen schema specification

This is a proposed database design for a new product. It names the records, their fields, and the rules a build must enforce. It is not a migration for the current Oxagen app. The SQL at the end is a working-shape example of the core rules, not DDL for every table in this catalog. It has not been run against PostgreSQL in this task.

## One store owns each fact

The org's configured data plane owns its saved records. The web app, reports, API, and local services use that same placement. A private org does not quietly send a second copy to a public analytics store.

| Store | What it owns | What it does not decide |
|---|---|---|
| PostgreSQL authority database | Identities, grants, definitions, policy versions, current run state, decisions, shared limits, source references, and immutable event metadata. | A replica cannot approve work using stale rights or money. |
| Encrypted object store | Exact cleaned requests, replies, files, diffs, receipts, and other large allowed content. | Possessing a URL or content digest grants no access. |
| Required knowledge graph records | Typed entities, links, source versions, trust, and provenance. The relational catalog below is their authority. | An inferred relationship cannot become a permission or a proven business result. |
| Graph and search indexes | Rebuildable views for discovery and traversal. A separate engine may help at scale. | They cannot replace record checks or invent source truth. |
| Event bus and task queue | Delivery, wakeups, and retries. The committed outbox is the handoff. | A delivered message does not prove an action ran. |
| Local protected service | Machine identity, enforced checkout bindings, active guards, and short-lived raw input. | Editable repo files are not policy or credential authorities. |
| VCS and business systems | Their files, history, orders, payments, and other source records. | Oxagen records links and trusted receipts; it does not rewrite source history. |

Keep one writer for a set of shared limits. A workspace, operator, and agent can draw from the same account. Their reservations must commit together. If regions must work apart, assign disjoint prepaid shares. Never promise a global hard cap from eventually consistent totals.

![Org, workspace, and canonical IAM records identify people and agents and hold per-record permissions. Runs and governed actions reference these identities. Policy decisions and shared limits reference the exact action. These primary PostgreSQL records use org and workspace row-level security plus canonical record grants. Sanitized evidence and a transactional outbox are saved with the work. Large clean evidence files live in a separate encrypted object store through checked references; object storage is not a competing authority or an escape from record access. Outbox workers build graph and search projections from committed records. Source systems such as version control and business services keep authority over their own facts. Checked source bindings retain stable IDs, native versions, permissions, and cleaned data. These also feed the required context graph. A future business ingestion block joins the shared trusted connector receipt to external business records using exact source IDs and versions. The future join never uses a model guess or a fuzzy amount match. Every graph edge and search result still receives record access checks. This drawing groups schema domains rather than depicting each physical table.](diagrams/schema.svg)

*Proposed data model. Org and identity records anchor runs, actions, policy decisions, and shared limits. PostgreSQL is the primary record store. Clean evidence uses checked file references. The outbox updates graph and search views. Exact receipt links to business records are a future ingestion feature.*

## How to read this catalog

A UUID identifies a row. A foreign key, written FK or an arrow, links it to another row. A unique key stops two rows from claiming the same identity. A check constraint rejects an invalid value. Names in code are exact implementation names; the surrounding prose explains why they exist.

Org IDs form part of every private key and reference. Workspace links must match too. Human and agent records use the same permission system. Every independently permissioned record links to `protected_objects`; child rows inherit their protected parent's checks. SQL row-level security is an isolation floor. The API must still check the action, record, purpose, and fields.

Database owners and migration accounts are separate from normal services. End users never receive arbitrary SQL access. An org field or database session setting is not a login proof. Only a trusted service sets transaction-local scope from a verified identity and a checked request. A missing scope blocks access.

The catalog uses a few local markers. **B** gives common org, ID, and created-at columns. **W** means workspace scope, **T** org scope, and **S** explicitly permits either. **I** means immutable history, **P** a current projection, and **A** an independently protected graph/context record. Each section states any extra fields. NULL scope means deliberately org-wide; it never means “skip checks.”

All published versions are fixed. Current pointers and projection rows use compare-and-swap versions. Uniqueness is org scoped. State words become closed CHECK sets in DDL, not unchecked free text. Large free text, JSON, filenames, and source metadata follow local data protection before they reach any remote store. No schema field is a hidden raw-data archive.


## Authority, policy, and limit schema

This is a proposed greenfield schema. It does not describe the current app. PostgreSQL holds the source records, decisions, and transactional ledgers. Large cleaned content belongs in the configured object store. Search and graph stores are projections of these records, never alternate grant authorities.

### Column rules

`B` below means `org_id uuid NOT NULL`, `id uuid NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()`, and `PRIMARY KEY (org_id,id)`. The root `org.organizations` table instead uses `org_id uuid PRIMARY KEY`. Every private foreign key includes `org_id`. UUIDs are generated by the trusted caller; no database extension is assumed. A column is NOT NULL unless marked `?`. Required columns have no default unless stated. `?` means nullable, with no default unless stated. `ws?` means `workspace_id uuid? REFERENCES workspaces`; null explicitly means org-wide scope, not unknown scope.

Money uses `bigint` minor units, currency `char(3)`, and an explicit charge unit. Ratios use integers or `numeric`, never float. Timestamps use `timestamptz`. References to signed evidence point to `evidence_objects`; references to credentials are vault handles only. JSON is reserved for versioned rule ASTs or bounded provider facts, not identities, grants, balances, or relationship keys. Composite references below abbreviate the org column, never omit it in DDL. Every UNIQUE claim is org-prefixed unless it names the org root.

Every permissioned domain record has `object_id uuid NOT NULL UNIQUE (org_id,object_id) REFERENCES protected_objects`. It may reuse its record ID. Graph nodes use this same protected-object ID. Shared forward references to `runs`, `scan_receipts`, `evidence_objects`, and connector tables are added when all schema parts are assembled.

### Org and IAM records

| Table | Columns in addition to B; keys and constraints |
|---|---|
| `org.organizations` | Root: `org_id uuid PK`, `name text`, `state text CHECK IN ('provisioning','active','suspended','closing')`, `active_data_plane_binding_id uuid? FK data_plane_bindings`, `created_at timestamptz DEFAULT now()`; active orgs require a binding. |
| `workspaces` | `object_id uuid`, `name text`, `slug text`, `state text`, `settings_revision bigint DEFAULT 1 CHECK >0`; UNIQUE org/slug. |
| `protected_objects` | `ws?`, `kind text`, `deleted_at timestamptz?`; kind is a controlled registry value. Parent workspace FK may be deferred for workspace creation. |
| `data_plane_bindings` | `object_id uuid`, `name text`, `active_revision_id uuid?`, `state text`; the active pointer must reference this binding's revision. |
| `data_plane_revisions` | `binding_id uuid FK`, `revision bigint CHECK >0`, `placement text CHECK IN ('saas','hybrid','private')`, `region text`, `namespace text`, `service_principal_id uuid FK`, `key_vault_ref text`, `endpoint_registry_ref text`, `activated_at timestamptz?`; UNIQUE org/binding/revision and org/binding/id. No embedded URL credentials. |
| `principals` | `object_id uuid`, `kind text CHECK IN ('human','agent','service','plugin')`, `display_name text`, `state text`, `owner_principal_id uuid? FK self`, `revoked_at timestamptz?`; org-wide identities, scope comes from grants. |
| `principal_auth_bindings` | `principal_id uuid FK`, `idp_connection_id uuid? FK idp_connections`, `auth_kind text`, `issuer text`, `subject text`, `credential_vault_ref text?`, `valid_from timestamptz`, `expires_at timestamptz?`, `revoked_at timestamptz?`; UNIQUE org/auth_kind/issuer/subject. No bearer tokens or provider keys. |
| `idp_connections` | `object_id uuid`, `issuer text`, `protocol text CHECK IN ('oidc','saml')`, `directory_vault_ref text?`, `state text`; UNIQUE org/issuer. |
| `groups` | `object_id uuid`, `name text`, `source_idp_id uuid? FK idp_connections`, `external_key text?`; external key requires IdP; UNIQUE org/IdP/external key when present. |
| `group_memberships` | `group_id uuid FK`, `principal_id uuid FK`, `source_revision text`, `verified_at timestamptz`, `revoked_at timestamptz?`; UNIQUE org/group/principal. No nested groups in this profile. |
| `permissions` | `name text`, `description text`; UNIQUE org/name. Examples: `tool.invoke`, `context.read`, `run.pause`. |
| `roles` | `object_id uuid`, `name text`, `revision bigint DEFAULT 1 CHECK >0`; UNIQUE org/name. |
| `role_permissions` | `role_id uuid FK`, `permission_id uuid FK`; UNIQUE org/role/permission. |
| `role_grants` | `principal_id uuid? FK`, `group_id uuid? FK groups`, `role_id uuid FK`, `scope_object_id uuid FK`, `granted_by uuid FK principals`, `valid_from timestamptz`, `expires_at timestamptz?`, `revoked_at timestamptz?`; interval check. Exactly one principal/group is set. Scope is an explicit org/workspace/resource object; group members inherit this same IAM grant. |
| `record_grants` | `principal_id uuid FK`, `permission_id uuid FK`, `object_id uuid FK`, `granted_by uuid FK principals`, `valid_from timestamptz`, `expires_at timestamptz?`, `revoked_at timestamptz?`, `authority_epoch bigint CHECK >0`. |
| `delegations` | `grantor_id uuid FK principals`, `grantee_id uuid FK principals`, `parent_delegation_id uuid? FK self`, `scope_object_id uuid FK`, `permission_id uuid FK`, `valid_from timestamptz`, `expires_at timestamptz`, `revoked_at timestamptz?`, `authority_epoch bigint`; expiry must exceed start. Validate acyclic, narrower delegation in the authority transaction. |
| `authority_epochs` | `scope_object_id uuid FK UNIQUE`, `epoch bigint DEFAULT 1 CHECK >0`, `changed_at timestamptz DEFAULT now()`, `reason_code text`; every dispatch compares the relevant current epochs. |

Index all grant lookups on `(org_id,principal_id,scope/object_id)`, active expiries, and reverse foreign keys. Expiry is evaluated with the clock, not a time-dependent partial-index predicate. Revocation and directory membership changes close admission and advance scope epochs before dependent projections update.

### Definitions and policy records

| Table | Columns in addition to B; keys and constraints |
|---|---|
| `persona_definitions` | `object_id uuid`, `name text`, `owner_id uuid FK principals`, `state text`. |
| `persona_versions` | `persona_id uuid FK`, `version bigint`, `instruction_object_id uuid FK evidence_objects`, `published_by uuid FK principals`, `published_at timestamptz`; UNIQUE org/persona/version. Immutable. |
| `agent_definitions` | `object_id uuid`, `name text`, `agent_principal_id uuid FK principals`, `owner_id uuid FK principals`, `state text`; agent principal kind must be checked on write. |
| `agent_releases` | `agent_id uuid FK`, `version bigint`, `persona_version_id uuid FK`, `model_profile_id uuid FK protected_objects`, `instruction_object_id uuid FK evidence_objects`, `published_by uuid FK principals`; UNIQUE org/agent/version. Immutable. |
| `agent_modes` | `release_id uuid FK`, `name text`, `persona_version_id uuid FK`, `context_view_id uuid? FK protected_objects`; UNIQUE org/release/name. Mode selection never creates a grant. |
| `skill_definitions` | `object_id uuid`, `name text`, `publisher_id uuid FK principals`, `state text`. |
| `skill_versions` | `skill_id uuid FK`, `version bigint`, `artifact_id uuid FK evidence_objects`, `manifest_id uuid FK evidence_objects`; UNIQUE org/skill/version. |
| `agent_release_skills` | `release_id uuid FK`, `skill_version_id uuid FK`, `ordinal integer CHECK >=0`; UNIQUE org/release/skill and org/release/ordinal. |
| `agent_tool_rules` | `release_id uuid FK`, `mode_id uuid? FK`, `tool_definition_id uuid FK tool_definitions`, `allowed_binding_id uuid? FK tool_bindings`, `effect text CHECK IN ('allow','deny')`; deny requires null binding and covers all versions. Allow requires an approved binding belonging to that definition. Partial unique indexes distinguish null/non-null mode; composite FK proves mode belongs to release. |
| `policy_definitions` | `object_id uuid`, `name text`, `owner_id uuid FK principals`, `state text`; UNIQUE org/name. |
| `policy_templates` | `object_id uuid`, `name text`, `version bigint`, `form_schema_id uuid FK evidence_objects`, `compiler_version text`; UNIQUE org/name/version. Simple forms need no Rego knowledge. |
| `policy_revisions` | `object_id uuid`, `policy_id uuid FK policy_definitions`, `revision bigint`, `template_id uuid? FK`, `rule_ast jsonb`, `compiled_object_id uuid FK evidence_objects`, `author_id uuid FK principals`, `proof_object_id uuid FK evidence_objects`; UNIQUE org/policy_id/revision. Validate AST schema and limits. |
| `policy_thresholds` | `object_id uuid`, `policy_revision_id uuid FK`, `key text`, `capability text`, `kind text CHECK IN ('absolute_deny','hard_cap','approval_threshold')`, `metric text? CHECK IN ('money','ratio','count')`, `limit_minor bigint?`, `currency char(3)?`, `ratio_numerator bigint?`, `ratio_denominator bigint?`, `count_limit bigint?`, `approver_permission_id uuid? FK permissions`; UNIQUE org/revision/key. Exactly one valid nonnegative metric form for a cap; absolute deny has none. Money requires currency; ratios require 0≤numerator≤denominator and denominator>0. Only approval thresholds name an approver permission. |
| `policy_activations` | `policy_revision_id uuid FK`, `scope_object_id uuid FK`, `effective_at timestamptz`, `expires_at timestamptz?`, `revoked_at timestamptz?`, `activation_epoch bigint`; interval check. |
| `policy_target_receipts` | `activation_id uuid FK`, `target_object_id uuid FK`, `installed_revision_id uuid FK policy_revisions`, `target_epoch bigint`, `status text`, `observed_at timestamptz`, `proof_object_id uuid FK evidence_objects`; UNIQUE org/activation/target/epoch. |
| `approval_requests` | `object_id uuid`, `action_id uuid FK governed_actions`, `requester_id uuid FK principals`, `policy_revision_id uuid FK`, `facts_object_id uuid FK evidence_objects`, `state text`, `expires_at timestamptz`, `expected_action_version bigint`. |
| `exception_grants` | `approval_request_id uuid FK`, `approver_id uuid FK principals`, `threshold_id uuid FK policy_thresholds`, `action_id uuid FK`, `max_amount_minor bigint CHECK >=0`, `currency char(3)`, `expires_at timestamptz`, `revoked_at timestamptz?`, `proof_object_id uuid FK evidence_objects`; only an explicitly overridable threshold qualifies. |

Use normalized join rows for release dependencies and required permission sets. Decision/action/attempt and release/mode links use matching composite unique keys and foreign keys, not unrelated same-org IDs. Signed exception proofs bind the approved fact version and exact threshold. Published versions are append-only; a new version replaces editing. Policy activation and target receipt differ: publishing does not prove a device applied the rule.

### Governed execution and accounting

| Table | Columns in addition to B; keys and constraints |
|---|---|
| `governed_actions` | `object_id uuid`, `ws?`, `context_kind text CHECK IN ('run','workspace_admin','org_admin')`, `run_id uuid? FK runs`, `principal_id uuid FK`, `capability text`, `state text`, `version bigint DEFAULT 1 CHECK >0`, `input_object_id uuid FK evidence_objects`, `scan_receipt_id uuid FK scan_receipts`; state includes proposed, denied, approved, running, completed, failed, unknown. Run context requires workspace/run; workspace admin requires workspace and null run; org admin requires both null. Human/service authority is still checked. |
| `action_attempts` | `action_id uuid FK`, `attempt_no integer CHECK >0`, `state text`, `provider_idempotency_key text?`, `started_at timestamptz?`, `finished_at timestamptz?`, `receipt_object_id uuid? FK evidence_objects`; UNIQUE org/action/attempt_no and org/action/id. |
| `execution_owners` | `run_id uuid FK UNIQUE`, `runtime_principal_id uuid FK`, `owner_epoch bigint CHECK >0`, `lease_expires_at timestamptz`, `version bigint`; takeover advances epoch before new dispatch. |
| `authorization_decisions` | `action_id uuid FK`, `attempt_id uuid FK`, `caller_id uuid FK principals`, `outcome text CHECK IN ('allow','deny','approval_required')`, `entitlement_model_revision text`, `facts_object_id uuid FK evidence_objects`, `reason_code text`, `decided_at timestamptz`; UNIQUE org/action/attempt/id; append-only. |
| `decision_policy_evaluations` | `decision_id uuid FK`, `activation_id uuid FK`, `policy_revision_id uuid FK`, `scope_object_id uuid FK`, `activation_epoch bigint`, `outcome text CHECK IN ('allow','deny','not_applicable','error')`, `reason_code text`; UNIQUE org/decision/activation. Composite activation/revision FK; retain every evaluated policy, not only the last one. |
| `action_authorizations` | `action_id uuid`, `attempt_id uuid`, `decision_id uuid FK`, `audience_principal_id uuid FK`, `request_digest bytea CHECK length=32`, `scan_receipt_id uuid FK`, `run_control_epoch bigint? CHECK >=0`, `owner_epoch bigint? CHECK >0`, `scope_count integer CHECK >0`, `expires_at timestamptz`, `consumed_at timestamptz?`, `proof_object_id uuid FK evidence_objects`; UNIQUE org/attempt; composite FKs action/attempt and action/attempt/decision match the same decision. Run authorizations require both run/owner epochs; admin actions require neither. Only cleaned wire content is hashed. |
| `authorization_scope_epochs` | `authorization_id uuid FK`, `scope_object_id uuid FK authority_epochs(scope_object_id)`, `observed_epoch bigint CHECK >0`; UNIQUE org/authorization/scope. The authority, never the client, resolves the complete scope set. |
| `model_price_schedules` | `object_id uuid`, `model_release_id uuid FK model_releases`, `version text`, `currency char(3)`, `effective_from timestamptz`, `effective_until timestamptz?`, `source_evidence_id uuid FK evidence_objects`; UNIQUE org/model/version. |
| `model_price_rates` | `schedule_id uuid FK`, `dimension text`, `price_numerator_minor bigint CHECK >=0`, `price_denominator_units bigint CHECK >0`, `rounding_mode text`; UNIQUE org/schedule/dimension. Dimensions distinguish input/output/cache and other charges. |
| `model_usage_receipts` | `exchange_id uuid FK model_exchanges`, `schedule_id uuid FK`, `provider_receipt_key text`, `observed_at timestamptz`, `evidence_id uuid FK evidence_objects`, `actual_minor bigint? CHECK >=0`, `currency char(3)`; UNIQUE org/exchange/provider key. Null charge means unresolved, not free. |
| `model_usage_lines` | `receipt_id uuid FK`, `rate_id uuid FK model_price_rates`, `quantity numeric(38,0) CHECK >=0`; UNIQUE org/receipt/rate. Rate must belong to receipt schedule. |
| `fx_quotes` | `object_id uuid`, `base_currency char(3)`, `quote_currency char(3)`, `rate_numerator numeric(38,0) CHECK >0`, `rate_denominator numeric(38,0) CHECK >0`, `valid_until timestamptz`, `source_evidence_id uuid FK evidence_objects`; fixed, versioned quotes only. |
| `settlement_sources` | `kind text CHECK IN ('model','connector','adjustment')`, `model_usage_receipt_id uuid? FK`, `connector_receipt_id uuid? FK`, `adjustment_action_id uuid? FK governed_actions`, `evidence_id uuid FK`; exactly one source matches kind; each nonnull source has a partial unique index. This identifies evidence, not the underlying charge. |
| `financial_sources` | `object_id uuid`, `kind text CHECK IN ('model','connector')`, `provider_namespace text`, `canonical_account_key text`; UNIQUE org/kind/provider-namespace/account. This stable registry identity survives route, key, and deployment rotation. |
| `financial_source_bindings` | `source_id uuid FK financial_sources`, `model_provider_id uuid? FK model_providers`, `connector_deployment_id uuid? FK connector_deployments`, `external_account_key text`, `valid_from timestamptz`, `revoked_at timestamptz?`; exactly one provider/deployment matches source kind. Partial UNIQUE provider/account or deployment/account while unrevoked. Authorized binding changes preserve historical links to the same source; late receipts resolve through their original binding. |
| `financial_effects` | `object_id uuid`, `source_id uuid FK financial_sources`, `kind text CHECK IN ('model_charge','refund')`, `external_effect_id text`, `origin text CHECK IN ('oxagen','external','unknown')`, `action_id uuid? FK governed_actions`, `currency char(3)`; UNIQUE org/source/kind/external-effect. Oxagen origin requires a proved action; external/unknown origin requires NULL until an authorized correlation transition. Identity is source-confirmed; equal amounts or times cannot establish it. |
| `financial_effect_revisions` | `effect_id uuid FK financial_effects`, `source_revision_key text`, `source_id uuid FK settlement_sources`, `total_minor bigint CHECK >=0`, `observed_at timestamptz`, `supersedes_id uuid? FK self`; UNIQUE org/effect/source-revision and org/effect/id. Immutable; prior revision must belong to this effect. Total is the confirmed cumulative value, not a second debit. |
| `financial_effect_observations` | `effect_revision_id uuid FK financial_effect_revisions`, `source_id uuid FK settlement_sources`; UNIQUE org/effect-revision/source. Many receipts can prove one financial effect revision. |
| `limit_definitions` | `object_id uuid`, `logical_key text`, `capability text`, `state text CHECK IN ('active','retired')`; UNIQUE org/logical-key. Stable identity survives policy revisions, renames, and agent release changes. |
| `limit_definition_terms` | `definition_id uuid FK limit_definitions`, `policy_revision_id uuid FK policy_revisions`, `threshold_id uuid FK policy_thresholds`, `effective_at timestamptz`; UNIQUE org/definition/policy-revision/threshold. Prove threshold belongs to revision; immutable approved term history. |
| `limit_accounts` | `object_id uuid`, `ws?`, `definition_id uuid FK limit_definitions`, `scope_object_id uuid FK`, `capability text`, `currency char(3)`, `charge_unit text`, `rule_revision_id uuid FK`, `threshold_id uuid? FK policy_thresholds`, `cap_kind text CHECK IN ('fixed','ratio')`, `cap_minor bigint?`, `ratio_numerator bigint?`, `ratio_denominator bigint?`, `period_kind text`, `timezone_name text`, `event_basis text`, `state text`; UNIQUE org/definition/workspace/scope/currency/charge-unit NULLS NOT DISTINCT. NULL workspace is an explicit org-wide allowance; a named workspace is a distinct narrowing account. Own protected-object scope must match. Exactly one valid cap form; current terms must belong to the definition. |
| `limit_periods` | `account_id uuid FK`, `cap_fact_id uuid? FK limit_facts`, `period_start timestamptz`, `period_end timestamptz`, `effective_cap_minor bigint CHECK >=0`, `used_minor bigint DEFAULT 0 CHECK >=0`, `held_minor bigint DEFAULT 0 CHECK >=0`, `version bigint DEFAULT 1`, `frozen boolean DEFAULT false`; UNIQUE org/account/start, end>start. Ratio periods require a pinned fact for that account; cap creation verifies the exact calculation. |
| `limit_facts` | `account_id uuid FK`, `source_connector_id uuid FK connectors`, `source_receipt_id uuid FK connector_receipts`, `subject_object_id uuid FK protected_objects`, `eligible_amount_minor bigint CHECK >=0`, `currency char(3)`, `source_version text`, `observed_at timestamptz`; UNIQUE org/account/id; append-only authoritative denominator/history evidence. |
| `limit_holds` | `action_id uuid FK`, `attempt_id uuid FK`, `state text CHECK IN ('held','settled','released','unknown')`, `expires_at timestamptz?`; UNIQUE org/attempt. Expiry does not release unknown liability. |
| `limit_reservations` | `hold_id uuid FK`, `period_id uuid FK`, `amount_minor bigint CHECK >0`, `currency char(3)`, `fx_quote_id uuid? FK fx_quotes`, `price_schedule_id uuid? FK model_price_schedules`; UNIQUE org/hold/period. Currency must match the period account. One hold spans all applicable buckets. |
| `limit_ledger_entries` | `period_id uuid FK`, `hold_id uuid? FK`, `entry_kind text`, `held_delta bigint`, `used_delta bigint`, `source_event_id uuid`, `posted_at timestamptz DEFAULT now()`, `reason_object_id uuid? FK evidence_objects`; UNIQUE org/period/source_event. Append-only. |
| `limit_settlements` | `hold_id uuid FK UNIQUE`, `effect_revision_id uuid FK financial_effect_revisions`, `source_id uuid FK settlement_sources`, `source_actual_minor bigint CHECK >=0`, `source_currency char(3)`, `settled_at timestamptz`; hold/action must match the effect's nonnull action. Amount/currency and source observation must match the revision and its trusted evidence. Several reconciled retry holds may name the same effect, but debit deduplication occurs per account below. |
| `financial_effect_account_states` | `effect_id uuid FK financial_effects`, `account_id uuid FK limit_accounts`, `period_id uuid FK limit_periods`, `last_revision_id uuid FK financial_effect_revisions`, `posted_minor bigint CHECK >=0`, `version bigint DEFAULT 1 CHECK >0`; UNIQUE org/effect/account. Lock with the account; revision must belong to effect and period to account. This projection records the charge already applied. |
| `financial_effect_postings` | `effect_revision_id uuid FK financial_effect_revisions`, `account_id uuid FK limit_accounts`, `ledger_entry_id uuid FK limit_ledger_entries`, `fx_quote_id uuid? FK fx_quotes`, `used_delta bigint`; UNIQUE org/effect-revision/account and org/ledger-entry. Immutable; first debit or later correction only. Ledger period and currency must match the account state; the approved pinned FX/rounding rule computes the difference. |
| `idempotency_keys` | `principal_id uuid FK`, `operation text`, `key text`, `request_digest bytea CHECK length=32`, `response_object_id uuid? FK protected_objects`, `state text`, `expires_at timestamptz`; UNIQUE org/principal/operation/key. Expiring an API key cannot discard live financial deduplication. |
| `outbox_events` | `aggregate_object_id uuid FK protected_objects`, `aggregate_version bigint`, `event_type text`, `payload_object_id uuid FK evidence_objects`, `available_at timestamptz DEFAULT now()`, `published_at timestamptz?`, `attempt_count integer DEFAULT 0`; UNIQUE org/aggregate/version/event_type. |

Dispatch compares all recorded IAM scope epochs, the run control epoch (`runs.current_epoch`), and the owner fence (`execution_owners.owner_epoch`) independently. A newer owner does not erase a pause, and an unchanged run epoch does not preserve revoked grants. Validate scope completeness before single-use consumption.

A policy update changes terms on the existing logical limit and account. It preserves all used and held exposure in the applicable period. Lowering a cap below exposure freezes new admission. Creating agents or renaming policies does not create a fresh allowance. A true reset is a distinct authorized governed action with adjustment evidence. A time-zone or period change needs a forward cutover that carries overlapping exposure; freeze admission until that carry-forward is proven. Never close an old account and silently replace its current window with an empty one.

Settlement first resolves a trusted financial effect and its revision. Model request IDs or provider refund IDs may serve as effect identity only under a reviewed source profile. If the provider cannot prove stable identity or an equivalent exact correlation, keep the outcome unresolved. Lock each effect/account state, release only proven duplicate retry holds, and post only the difference between the newly confirmed total and the already posted amount. Later receipt observations with unchanged totals add evidence, not spend. Corrections use a new effect revision and immutable postings to the original account period under its approved adjustment rule. Unknown retry exposure remains held. Source-account and deployment rotation preserve effect identity through an authorized binding, not a newly empty deduplication namespace.

Confirmed outside refunds can create effect/account postings without an Oxagen hold. Their source evidence and applicable shared scopes are still required. They remain external observations, not proof that an Oxagen agent caused them. Unknown source identity or incomplete outside history blocks a strict all-refunds allowance; source-system serialization remains necessary to prevent races with other writers.

Index pending outbox `(available_at,id) WHERE published_at IS NULL`, live authorization expiries, run/action history, and reservations by period. Source IDs use stable provider event identity through connector receipts, not an agent's claim. Ratio caps pin authoritative eligible captured amounts and exact rounding; reusing a stale denominator is forbidden. Model USD accounts reserve from a pinned price schedule and fixed/conservatively bounded FX quote. Usage and provider billing corrections remain separate evidence until reconciled. Already-refunded amounts reduce allowance, not the denominator. Only the trusted period-creation procedure derives interval boundaries from the account rule. Calendar/lifetime periods cannot overlap for one account; check this while locking that account. Rolling rules instead count overlapping event windows under the same lock, not independent resettable buckets. Every scope and currency has its own ledger. Percentage, customer/day, workspace/day, operator, and agent ceilings all pass.

### Atomicity and security

One authority database transaction locks the action, then all applicable account rows and period rows in deterministic ID order, checks current facts/policy/epochs, reserves every bucket, writes the action/ledger/outbox, and commits. Any failed bucket rolls back the whole transaction. Never split shared parent limits across independent regional writers. Route those limits to one authority or use explicit prepaid disjoint allocations. Polling outside refunds cannot guarantee a global cap; source enforcement or serialized access is required.

Settlement locks the same rows, verifies a unique model/connector/adjustment source, replaces held exposure with actual usage, and writes ledger/outbox atomically. Unknown outcomes keep holds. Never let held/used balances become negative. Compare using `numeric` intermediates to avoid bigint addition overflow. A real upstream overcharge must be recorded, freeze further admission, and raise an incident; do not reject the fact merely because it breaches the cap. Exactly-once ledger postings do not promise exactly-once external effects.

RLS is the org/workspace floor under the shared IAM service. Use non-owner roles without superuser/BYPASSRLS, ENABLE and FORCE RLS, explicit read and write predicates, and transaction-local verified scope. Trusted services alone get SQL access; arbitrary SQL can forge a session setting. Pool reuse without scope fails closed. Separate migrations, emergency access, backups, and scoped workers. [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [policy read/write checks](https://www.postgresql.org/docs/current/sql-createpolicy.html), [transaction-local settings](https://www.postgresql.org/docs/current/sql-set.html)

## Runtime, evidence, tools, and work-report tables

This is a proposed PostgreSQL schema, not an implemented database. PostgreSQL owns transactional metadata, action state, and durable evidence references. Large cleaned payloads live in the org's configured object store.

### Column and key rules

Every table below has `org_id uuid NOT NULL`, `id uuid NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()`, and `PRIMARY KEY (org_id,id)`. **W** adds required `workspace_id uuid`, an FK to `workspaces`, and `UNIQUE (org_id,workspace_id,id)`. **T** is org-wide. **S** permits an explicit org-wide NULL workspace or a named workspace; it must match the protected object. S references require an org FK plus a checked scope relation because NULL cannot enforce a workspace FK. UUIDs come from the trusted caller. Unmarked columns are `NOT NULL` with no default; `?` means nullable. `→table` denotes an FK to that table's ID with `ON DELETE RESTRICT`. All FKs include `org_id`; W-to-W links also include `workspace_id`. Shared-table references must enforce their declared workspace scope. No cross-org links are valid. Every independently permissioned record also has `object_id uuid NOT NULL`, `UNIQUE (org_id,object_id)`, and an FK to `protected_objects`; the row ID may equal its object ID. Scope must match the protected object. Junction rows without their own object ID inherit access from their protected parent and cannot be separately discovered or granted.

Each FK needs an org-prefixed index unless covered by its primary or unique key. Positive revisions use `integer CHECK (>0)`; sequences and epochs use nonnegative `bigint`. Money uses integer minor units, never floating point. State columns are `text` with explicit `CHECK` values named below. JSON columns use `jsonb CHECK (jsonb_typeof(value)='object')`; schema validation occurs before writes. JSON cannot replace declared identity, version, state, or FK columns. All persisted content and free text must pass data protection. A `digest` means SHA-256 of approved cleaned bytes only; raw secret fingerprints are forbidden.

**I** marks immutable rows: app roles cannot update or delete them. **P** marks current projections with `row_version bigint DEFAULT 1` for compare-and-swap updates. Retention uses controlled deletion, not normal update rights. Append-only records and related outbox entries commit together through the shared transaction outbox. Retry keys are unique in their declared scope; repeating a key with changed content fails.

### Devices, gateways, and harness targets

- **`devices` T/P:** `principal_id uuid→principals`, `owner_principal_id uuid→principals`, `display_name text`, `platform text CHECK IN ('macos','windows','linux','remote')`, `status text CHECK IN ('enrolled','suspended','revoked')`, `device_key_id text`, `last_seen_at timestamptz?`, `revoked_at timestamptz?`. Unique `(org_id,device_key_id)`; index owner/status. Device keys are references, not private-key bytes.
- **`scanner_authorities` S/P:** `principal_id uuid→principals`, `device_id uuid→devices`, `key_id text`, `profile_revision text`, `status text CHECK IN ('active','revoked')`, `expires_at timestamptz`. Unique org/key ID. Scope follows the protected object; an org authority needs an explicit org-service grant.
- **`gateway_enrollments` W/P:** `device_id uuid→devices`, `scanner_authority_id uuid→scanner_authorities`, `service_principal_id uuid→principals`, `profile_id text`, `profile_revision integer`, `gateway_version text`, `certificate_key_id text`, `policy_epoch bigint`, `status text CHECK IN ('pending','active','stale','revoked')`, `expires_at timestamptz`, `last_confirmed_at timestamptz?`. Unique workspace/device/service principal; index status/expiry.
- **`platform_attestations` W/I:** `enrollment_id uuid→gateway_enrollments`, `challenge_id uuid`, `observed_at timestamptz`, `expires_at timestamptz`, `profile_revision integer`, `result text CHECK IN ('pass','fail','unknown')`, `coverage_artifact_id uuid?→evidence_objects`, `verifier_principal_id uuid→principals`, `signature bytea`. Unique enrollment/challenge; expiry after observation.
- **`harness_targets` W/P:** `enrollment_id uuid→gateway_enrollments`, `owner_principal_id uuid→principals`, `harness_kind text`, `harness_version text`, `adapter_version text`, `capabilities_artifact_id uuid→evidence_objects`, `control_level text CHECK IN ('strict','observed','unsupported')`, `presence text CHECK IN ('online','stale','offline')`, `capacity integer CHECK (capacity>=0)`, `presence_expires_at timestamptz`, `disabled_at timestamptz?`. Index workspace/presence/control level.
- **`checkout_bindings` W/P:** `target_id uuid→harness_targets`, `repository_id uuid→vcs_repositories`, `local_checkout_key text`, `safe_path text?`, `binding_evidence_id uuid→evidence_objects`, `verified_at timestamptz`, `status text CHECK IN ('active','uncertain','revoked')`. Unique target/local checkout key. Register an enrolled but unbound harness target before creating this binding; strict launch requires a verified binding. The opaque key comes from trusted enrollment, not a caller's folder name.

### Model catalog, tool catalog, and protected connections

- **`model_providers` W/P:** `name text`, `provider_kind text`, `approved_route_binding text`, `status text CHECK IN ('active','disabled')`. Unique workspace/name. **`model_releases` W/I:** `provider_id uuid→model_providers`, `model_name text`, `revision_label text`, `capabilities_artifact_id uuid→evidence_objects`, `published_at timestamptz`. Unique provider/model name/revision label. Labels record known provider claims; an alias does not prove the provider's weights remained fixed.
- **`model_routes` W/P:** `model_release_id uuid→model_releases`, `credential_reference_id uuid→credential_references`, `gateway_enrollment_id uuid?→gateway_enrollments`, `region text`, `placement text CHECK IN ('saas','private','local')`, `endpoint_binding text`, `status text CHECK IN ('active','disabled','unhealthy')`. Index release/status. Approved endpoint bindings and credential references stay separate from model-visible content. Route changes invalidate pending authorizations and require a new versioned route record.

- **`secret_backend_bindings` W/P:** `provider_kind text`, `approved_endpoint_binding text`, `region text`, `namespace text`, `auth_principal_id uuid→principals`, `revision integer`, `safe_config jsonb`, `status text CHECK IN ('active','disabled','revoked')`. Unique workspace/provider/namespace/revision. A changed endpoint or auth scope creates a new binding; safe configuration excludes secret values.
- **`credential_references` W/P:** `owner_principal_id uuid→principals`, `secret_backend_binding_id uuid→secret_backend_bindings`, `opaque_secret_handle text`, `audience text`, `status text CHECK IN ('active','expired','revoked')`, `expires_at timestamptz?`. Backend binding uses the org's protected secret registry; no credential value, refresh token, or signed access URL is stored here.
- **`connectors` W/P:** `owner_principal_id uuid→principals`, `name text`, `kind text`, `status text CHECK IN ('active','retired')`. Unique workspace/name. **`connector_releases` W/I:** `connector_id uuid→connectors`, `version text`, `manifest_artifact_id uuid→evidence_objects`, `published_by uuid→principals`. Unique connector/version. **`connector_deployments` W/P:** `connector_release_id uuid→connector_releases`, `service_principal_id uuid→principals`, `credential_reference_id uuid?→credential_references`, `approved_endpoint_binding text`, `placement text CHECK IN ('local','private','saas')`, `status text CHECK IN ('active','disabled','unhealthy')`. Endpoint bindings resolve trusted routes; agents cannot supply arbitrary URLs.
- **`tool_definitions` W/P:** `owner_principal_id uuid→principals`, `namespace text`, `name text`, `business_capability text?`, `status text CHECK IN ('active','retired')`. Unique workspace/namespace/name. Stable IDs survive labels and aliases.
- **`tool_releases` W/I:** `tool_id uuid→tool_definitions`, `revision integer`, `input_schema_artifact_id uuid→evidence_objects`, `output_schema_artifact_id uuid?→evidence_objects`, `description_artifact_id uuid→evidence_objects`, `implementation_ref text`, `published_by uuid→principals`. Unique tool/revision; schema artifacts contain validated schema bytes.
- **`tool_bindings` W/P:** `tool_release_id uuid→tool_releases`, `connector_deployment_id uuid?→connector_deployments`, `native_target_id uuid?→harness_targets`, `binding_revision integer`, `route_kind text CHECK IN ('connector','native','mcp')`, `status text CHECK IN ('active','disabled','revoked')`. Check exactly one route owner; index release/status. Referenced revisions cannot be edited; route changes create a new binding row.
- **`tool_belt_snapshots` W/I:** `agent_release_id uuid→agent_releases`, `run_id uuid→runs`, `prepared_resolution_id uuid?→prepared_tool_belts`, `authority_epoch bigint`, `manifest_artifact_id uuid→evidence_objects`. **`tool_belt_entries` W/I:** `snapshot_id uuid→tool_belt_snapshots`, `tool_binding_id uuid→tool_bindings`, `exposed_name text`, `schema_artifact_id uuid→evidence_objects`. Unique snapshot/exposed name and snapshot/binding. Calls pin the exact entry; snapshots are discovery evidence, not lasting permission. **`tool_belt_policy_versions` W/I:** `snapshot_id uuid→tool_belt_snapshots`, `policy_revision_id uuid→policy_revisions`. Unique snapshot/policy revision.

### Assignments, queues, and control

- **`work_orders` W/P:** `owner_principal_id uuid→principals`, `name text`, `status text CHECK IN ('draft','active','expired','revoked','closed')`, `current_revision_id uuid?→work_order_revisions`. **`work_order_revisions` W/I:** `work_order_id uuid→work_orders`, `revision integer`, `agent_release_id uuid→agent_releases`, `assignment_artifact_id uuid→evidence_objects`, `constraints_artifact_id uuid→evidence_objects`, `published_by uuid→principals`, `effective_at timestamptz`, `expires_at timestamptz?`. Unique order/revision; current revision must belong to its order. **`work_order_policy_versions` W/I:** `order_revision_id uuid→work_order_revisions`, `policy_revision_id uuid→policy_revisions`. Unique order revision/policy revision. Historical pins explain the assignment; current revocations still apply.
- **`work_requests` W/I:** `requested_by uuid→principals`, `accountable_operator_id uuid→principals`, `payer_scope_object_id uuid→protected_objects`, `work_order_revision_id uuid→work_order_revisions`, `request_key text`, `request_artifact_id uuid→evidence_objects`, `target_selection_artifact_id uuid→evidence_objects`, `expires_at timestamptz`. Unique workspace/requester/request key.
- **`dispatch_targets` W/P:** `work_request_id uuid→work_requests`, `target_id uuid→harness_targets`, `checkout_binding_id uuid→checkout_bindings`, `state text CHECK IN ('queued','waiting_capacity','waiting_device','starting','started','blocked','expired','cancelled','unknown')`, `run_id uuid?→runs`, `start_authorized_seq bigint?`, `cancel_seq bigint?`, `reason_code text?`. Unique request/target; unique nonnull run ID. Index state/created time.
- **`queue_deliveries` W/P:** `dispatch_target_id uuid→dispatch_targets`, `delivery_key uuid`, `attempt_count integer DEFAULT 0 CHECK (attempt_count>=0)`, `available_at timestamptz DEFAULT now()`, `lease_owner_id uuid?→principals`, `lease_epoch bigint DEFAULT 0`, `lease_expires_at timestamptz?`, `acked_at timestamptz?`. Unique delivery key; partial index available time where unacknowledged. Delivery is not proof of launch.
- **`control_commands` W/I:** `issuer_principal_id uuid→principals`, `command_key text`, `kind text CHECK IN ('steer','pause','stop','resume','force_continue','cancel')`, `interrupt boolean DEFAULT false`, `payload_artifact_id uuid?→evidence_objects`, `expires_at timestamptz?`. Unique issuer/command key. **`control_deliveries` W/P:** `command_id uuid→control_commands`, `run_id uuid→runs`, `inbox_seq bigint`, `state text CHECK IN ('accepted','delivered','queued','boundary_reached','applied','expired','ended','blocked')`, `applied_attempt_id uuid?→action_attempts`, `ack_event_id uuid?→run_events`. Unique command/run and run/inbox sequence; applied requires an attempt for steering.
- **`run_authority_epochs` W/I:** `run_id uuid→runs`, `epoch bigint`, `reason_code text`, `issuer_principal_id uuid→principals`, `effective_event_id uuid→run_events`. Unique run/epoch. The current epoch belongs in the locked run row; old epochs cannot dispatch.

### Runs, pause proof, and continuation

- **`runs` W/P:** `agent_release_id uuid→agent_releases`, `active_mode_id uuid→agent_modes`, `agent_principal_id uuid→principals`, `operator_principal_id uuid→principals`, `work_order_revision_id uuid→work_order_revisions`, `target_id uuid→harness_targets`, `parent_run_id uuid?→runs`, `state text CHECK IN ('queued','running','pausing','paused','stopping','stopped','blocked','completed','uncertain')`, `current_epoch bigint DEFAULT 0`, `last_event_seq bigint DEFAULT 0`, `started_at timestamptz?`, `ended_at timestamptz?`. Index operator/state, agent/state, parent, and target/state.
- **`run_branches` W/P:** `run_id uuid→runs`, `parent_branch_id uuid?→run_branches`, `fork_checkpoint_id uuid?→checkpoints`, `name text`, `status text CHECK IN ('active','closed')`. Unique run/name. **`turns` W/P:** `run_id uuid→runs`, `branch_id uuid→run_branches`, `turn_number bigint`, `state text CHECK IN ('open','completing','held','complete','interrupted','failed')`, `input_artifact_id uuid→evidence_objects`, `completion_event_id uuid?→run_events`. Unique branch/turn number; branch must belong to run.
- **`run_workers` W/P:** `run_id uuid→runs`, `principal_id uuid→principals`, `parent_worker_id uuid?→run_workers`, `kind text CHECK IN ('harness','child','connector','background')`, `state text CHECK IN ('starting','active','stopping','stopped','isolated','unknown')`, `last_seen_at timestamptz?`. **`worker_leases` W/P:** `worker_id uuid→run_workers`, `run_id uuid→runs`, `epoch bigint`, `lease_expires_at timestamptz`, `revoked_at timestamptz?`. Partial unique worker where unrevoked; dispatch checks both lease expiry and run epoch.
- **`pause_boundaries` W/I:** `run_id uuid→runs`, `command_id uuid→control_commands`, `closed_epoch bigint`, `next_epoch bigint`, `last_admitted_seq bigint`, `workers_receipt_id uuid→evidence_objects`, `effects_receipt_id uuid→evidence_objects`, `checkpoint_id uuid→checkpoints`, `confirmed_at timestamptz`. Unique run/closed epoch; next epoch greater than closed. Creation requires closed admission, stopped/isolated workers, resolved or safely fenced effects, and durable stable state.
- **`response_evidence` W/I:** `attempt_id uuid→action_attempts`, `run_id uuid→runs`, `origin_epoch bigint`, `response_key text`, `artifact_id uuid→evidence_objects`, `arrived_at timestamptz`, `disposition text CHECK IN ('current','late','duplicate','quarantined')`. Unique attempt/response key. **`response_adoptions` W/I:** `response_id uuid→response_evidence`, `destination_run_id uuid→runs`, `destination_epoch bigint`, `decision_action_id uuid→governed_actions`, `adopted_artifact_id uuid→evidence_objects`, `adopted_by uuid→principals`. Unique response/destination run/epoch. No adoption is inferred from arrival.
- **`checkpoints` W/I:** `run_id uuid→runs`, `branch_id uuid→run_branches`, `event_seq bigint`, `epoch bigint`, `manifest_artifact_id uuid→evidence_objects`, `coverage_id uuid→capture_coverage`, `stable boolean`, `confirmed_by uuid→principals`. Unique run/branch/event sequence. **`continuation_capsules` W/I:** `checkpoint_id uuid→checkpoints`, `target_adapter text`, `target_version text`, `mode text CHECK IN ('replay','native','portable','fork','migration')`, `manifest_artifact_id uuid→evidence_objects`, `losses_artifact_id uuid→evidence_objects`, `source_fenced_event_id uuid?→run_events`. Capsules contain no live credentials, leases, or reusable action approvals.

### Cleaned payloads and capture

- **`evidence_objects` S/I:** `kind text`, `data_plane_revision_id uuid→data_plane_revisions`, `store_component_key text`, `object_key text`, `object_version text`, `cleaned_sha256 bytea CHECK (octet_length(cleaned_sha256)=32)`, `byte_count bigint CHECK (byte_count>=0)`, `media_type text`, `classification text`, `transform_receipt_id uuid?→sanitization_receipts`, `retention_policy_id uuid→retention_policies`. Unique data-plane revision/store component/key/version. Storage bindings resolve the configured org data plane; object keys are opaque.
- **`sanitization_receipts` S/I:** `scanner_authority_id uuid→scanner_authorities`, `enrollment_id uuid?→gateway_enrollments`, `policy_revision_id uuid→policy_revisions`, `detector_revision text`, `outcome text CHECK IN ('allowed','redacted','replaced','blocked')`, `coverage text CHECK IN ('complete','partial','unsupported')`, `safe_findings jsonb`, `performed_at timestamptz`. **`scan_receipts` S/I** is the canonical **ScanReceipt**: `sanitization_receipt_id uuid→sanitization_receipts`, `principal_id uuid→principals`, `purpose text CHECK IN ('submission','model_send','tool_send','record_export','context','admin_write')`, `run_id uuid?→runs`, `attempt_id uuid?→action_attempts`, `request_artifact_id uuid→evidence_objects`, `artifact_manifest_id uuid→evidence_objects`, `destination_binding text`, `authority_epoch bigint`, `expires_at timestamptz`, `scanner_authority_id uuid→scanner_authorities` (replaces the untyped `signing_key_id`; a check requires the authority's `status='active'` and `expires_at` after the receipt's `performed_at`, and the authority's device must match the enrollment on the sanitization receipt), `signature bytea`. Unique nonnull attempt/request artifact. A final model/tool send requires an attempt. Agent execution also requires its run; separately authorized human admin actions may precede a run. Submission scanning can precede either. Scope and disclosure must match the action context and preserve every source restriction. The scanner authority and optional enrollment must agree on device, service identity, and scope. Managed local workspace input requires its matching workspace enrollment; an org-admin request uses an explicitly granted org scanner without borrowing a workspace. The proxy rejects a submission receipt as model-send proof. No raw hash or matched value.
- **`model_exchanges` W/I:** `attempt_id uuid→action_attempts`, `scan_receipt_id uuid→scan_receipts`, `request_artifact_id uuid→evidence_objects`, `tool_belt_snapshot_id uuid?→tool_belt_snapshots`, `model_route_id uuid→model_routes`. Unique attempt. **`model_response_receipts` W/I:** `exchange_id uuid→model_exchanges`, `response_evidence_id uuid→response_evidence`, `provider_reported_model text?`, `provider_request_id text?`, `usage_receipt_artifact_id uuid?→evidence_objects`, `source_receipt_key text`. Unique exchange/source receipt key. **`tool_executions` W/I:** `attempt_id uuid→action_attempts`, `belt_entry_id uuid→tool_belt_entries`, `input_artifact_id uuid→evidence_objects`, `resolved_targets_artifact_id uuid→evidence_objects`. Unique attempt. Trusted connector receipts join through `connector_receipts.attempt_id`; later results never edit the original execution input.
- **`run_events` W/I:** `run_id uuid→runs`, `seq bigint`, `event_key uuid`, `kind text`, `action_id uuid?→governed_actions`, `attempt_id uuid?→action_attempts`, `epoch bigint`, `actor_principal_id uuid→principals`, `payload_artifact_id uuid?→evidence_objects`, `observed_at timestamptz`, `recorded_at timestamptz DEFAULT now()`. Unique run/sequence and workspace/event key; index kind/time. **`stream_chunks` W/I:** `attempt_id uuid→action_attempts`, `stream_kind text`, `chunk_seq bigint`, `artifact_id uuid→evidence_objects`, `terminal boolean DEFAULT false`. Unique attempt/stream/chunk sequence; cleaned chunks only.
- **`traces` W/I:** `run_id uuid→runs`, `trace_key text`. Unique workspace/trace key. **`spans` W/P:** `trace_id uuid→traces`, `span_key text`, `parent_span_id uuid?→spans`, `action_id uuid?→governed_actions`, `started_at timestamptz`, `ended_at timestamptz?`, `safe_attributes jsonb`, `last_event_id uuid→run_events`. Unique trace/span key; parent must share trace. The projection follows immutable start/end events. **`provenance_links` W/I:** `derived_artifact_id uuid→evidence_objects`, `source_artifact_id uuid→evidence_objects`, `relation text`, `transformation_ref text?`. Unique endpoints/relation; no access is implied by a link.
- **`capture_coverage` W/I:** `run_id uuid→runs`, `start_seq bigint`, `end_seq bigint`, `profile_revision text`, `status text CHECK IN ('complete','partial','unknown')`, `gaps_artifact_id uuid?→evidence_objects`. Check end≥start. **`retention_policies` S/I:** `revision integer`, `name text`, `retain_seconds bigint CHECK (retain_seconds>=0)`, `rules_artifact_id uuid→evidence_objects`. **`legal_holds` S/P:** `held_object_id uuid→protected_objects`, `authorized_by uuid→principals`, `reason_code text`, `released_at timestamptz?`. **`artifact_deletions` S/I:** `deletion_operation_id uuid`, `step_seq bigint`, `artifact_id uuid→evidence_objects`, `authorized_by uuid→principals`, `state text CHECK IN ('requested','objects_deleted','backups_pending','complete','blocked')`, `receipt_artifact_id uuid?→evidence_objects`. Unique deletion operation/step; append each observed state, never edit history. Index artifact/time; deletion creates safe tombstone evidence and checks holds.

### VCS facts and required reports

- **`vcs_repositories` W/P:** `connector_deployment_id uuid→connector_deployments`, `provider_repository_id text`, `safe_name text?`, `safe_url text?`. Unique connector/provider repository ID; `current_settings_id uuid?→workspace_repo_settings` selects its current revision. **`workspace_repo_settings` W/I:** `repository_id uuid→vcs_repositories`, `revision integer`, `default_branch_name text`, `published_by uuid→principals`, `effective_at timestamptz`. Unique repository/revision. An explicit current-settings pointer belongs to the repository row and must reference its own revision.
- **`vcs_snapshots` W/I:** `repository_id uuid→vcs_repositories`, `checkout_binding_id uuid?→checkout_bindings`, `work_branch_name text?`, `work_commit_id text?`, `tree_id text?`, `local_manifest_id uuid?→evidence_objects`, `state text CHECK IN ('clean','dirty','detached','unavailable')`, `atomic boolean`, `observed_at timestamptz`. Commit IDs are source identifiers permitted by data policy, never a substitute for exporting a blocked patch.
- **`vcs_comparisons` W/I:** `repository_id uuid→vcs_repositories`, `settings_revision_id uuid→workspace_repo_settings`, `snapshot_id uuid→vcs_snapshots`, `kind text CHECK IN ('target_tip_to_work_head','merge_base_to_work_head','working_copy','run_delta')`, `target_commit_id text?`, `work_commit_id text?`, `merge_base_commit_id text?`, `patch_artifact_id uuid?→evidence_objects`, `status text CHECK IN ('complete','redacted','partial','unavailable')`. Required branch comparisons pin target/work commits; merge-base view cannot replace default-tip comparison.
- **`changed_files` W/I:** `comparison_id uuid→vcs_comparisons`, `file_seq integer`, `old_path text?`, `new_path text?`, `change_kind text CHECK IN ('add','modify','delete','rename','copy','type','submodule')`, `area text CHECK IN ('committed','staged','unstaged','untracked')`, `binary boolean`, `old_mode text?`, `new_mode text?`, `content_artifact_id uuid?→evidence_objects`, `redacted boolean DEFAULT false`. Unique comparison/file sequence; at least one permitted path or an explicit redacted marker.
- **`pull_requests` W/P:** `repository_id uuid→vcs_repositories`, `provider_pr_id text`, `number bigint CHECK (number>0)`, `safe_url text?`. Unique repository/provider ID and repository/number. **`pull_request_observations` W/I:** `pull_request_id uuid→pull_requests`, `source_version text`, `state text CHECK IN ('open','closed','merged','unknown')`, `base_branch text?`, `head_branch text?`, `base_commit text?`, `head_commit text?`, `target_mismatch boolean?`, `observed_at timestamptz`. Unique PR/source version.
- **`ci_sources` W/P:** `repository_id uuid→vcs_repositories`, `connector_deployment_id uuid→connector_deployments`, `source_kind text`, `installation_key text`, `enabled boolean DEFAULT true`. **`ci_jobs` W/P:** `source_id uuid→ci_sources`, `provider_job_id text`, `safe_name text?`, `matrix_key text?`. Unique source/provider job ID. **`ci_attempts` W/I:** `source_id uuid→ci_sources`, `job_id uuid→ci_jobs`, `attempt_number integer`, `provider_attempt_id text`, `tested_commit text?`, `tested_kind text CHECK IN ('head','test_merge','merge_group','other','unknown')`. Unique job/attempt number and source/provider attempt ID; a composite FK proves the job belongs to that source.
- **`ci_observations` W/I:** `attempt_id uuid→ci_attempts`, `source_event_key text`, `status text`, `conclusion text?`, `observed_at timestamptz`, `source_updated_at timestamptz?`, `safe_details_artifact_id uuid?→evidence_objects`. Unique attempt/source event key; status check queued/in_progress/completed/unknown, with provider conclusion kept separately. **`pr_ci_links` W/I:** `pull_request_id uuid→pull_requests`, `ci_attempt_id uuid→ci_attempts`, `proof_artifact_id uuid→evidence_objects`. Unique PR/attempt. **`ci_coverage` W/I:** `pull_request_id uuid→pull_requests`, `source_id uuid→ci_sources`, `observed_at timestamptz`, `coverage text CHECK IN ('complete','partial','unknown')`, `pages_complete boolean`, `reason_code text?`. Empty or hidden jobs never imply passing CI.
- **`work_reports` W/P:** `run_id uuid→runs`, `report_kind text CHECK IN ('repository','non_repository')`, `repository_id uuid?→vcs_repositories`, `current_revision_id uuid?→work_report_revisions`, `tracking_policy_revision_id uuid→policy_revisions`, `tracking_until timestamptz?`, `next_refresh_at timestamptz?`, `tracking_state text CHECK IN ('active','paused','ended','blocked')`. Unique run/repository NULLS NOT DISTINCT; repository kind requires repo, non_repository requires NULL and a reason in the report. **`work_report_revisions` W/I:** `report_id uuid→work_reports`, `revision integer`, `tracking_policy_revision_id uuid→policy_revisions`, `tracking_until timestamptz?`, `comparison_id uuid?→vcs_comparisons`, `snapshot_id uuid?→vcs_snapshots`, `source_event_seq bigint`, `manifest_artifact_id uuid→evidence_objects`, `store_receipt_id uuid→report_store_receipts`, `freshness text CHECK IN ('current','stale','partial','unknown')`. Unique report/revision. A NULL tracking cutoff requires an explicit approved ongoing rule; unknown expiry blocks tracking admission. Ended tracking saves the cutoff without claiming CI cannot later change. Index report tracking state/next refresh time. Repo reports require comparison and snapshot; non-repo reports require NULL and explicit not_applicable fields. **`report_pr_links` W/I:** `report_revision_id uuid→work_report_revisions`, `pr_observation_id uuid→pull_request_observations`, `coverage_id uuid?→ci_coverage`. Unique revision/PR observation/source coverage; manifest pins the complete observation set.
- **`persona_usage_segments` W/P:** `run_id uuid→runs`, `agent_release_id uuid→agent_releases`, `persona_id uuid→persona_definitions`, `persona_version_id uuid→persona_versions`, `persona_name text`, `agent_mode_id uuid?→agent_modes`, `mode_name text`, `start_event_seq bigint`, `end_event_seq bigint?`. Only the end may be closed from immutable persona-change events; pinned identity fields never change. Persona version must belong to persona ID; it is separate from the agent principal. Segments cannot overlap within the same run. **`tool_use_facts` W/I:** `execution_attempt_id uuid→action_attempts`, `execution_id uuid→tool_executions`, `persona_segment_id uuid→persona_usage_segments`, `tool_binding_id uuid→tool_bindings`, `historical_name text`, `started_event_id uuid→run_events`. Unique execution attempt. Counts aggregate these confirmed starts, not callbacks, stream chunks, proposals, or denied calls.
- **`report_store_receipts` W/I:** `data_plane_binding_id uuid→data_plane_bindings`, `data_plane_revision_id uuid→data_plane_revisions`, `event_id uuid→run_events`, `committed_seq bigint`, `artifact_manifest_id uuid→evidence_objects`, `durable_at timestamptz`. Binding is the same trusted org data-plane registry used by the web app. A receipt requires durable artifact bytes and metadata. Local pending spools cannot claim this receipt or choose a public fallback.

Create cyclic FKs after table creation; use deferred constraints only for valid same-transaction inserts. Validate parent membership, scope, pinned versions, and state transitions inside trusted write transactions. Org RLS and these FKs do not replace record authorization. Partition large event/chunk/observation tables only when uniqueness and same-org references retain their stated guarantees.

### Transaction and projection rules

Run event sequences are allocated while locking the run's sequence row. A transaction saves the event, any admitted action, and the matching outbox entry before it acknowledges acceptance. Sequence gaps caused by rollback may be avoided by this allocation; consumers must still detect missing committed events. The event ID deduplicates retries. Times describe observations, not a substitute for ordering. The same run lock or equivalent compare-and-swap serializes steering with new-step admission.

Current pointers need composite membership FKs: an order can select only its own revision, a repository only its own settings, and a report only its own revision. Add the needed unique parent-ID/child-ID keys to the referenced tables. Likewise, prove that each turn's branch belongs to its run, a CI attempt's job belongs to its source, a PR coverage row belongs to its PR, and a tool-use fact names the attempt on its execution. Application checks alone are insufficient for these structural relationships.

Use column-specific update grants or protected procedures on P tables. A tool binding or model route may change status, but its pinned implementation, schema, destination, and identity may not be rewritten. A replacement creates a new row. Active worker ownership uses a database uniqueness constraint plus a monotonically increasing epoch; an expired lease is not enough to let an old worker dispatch. Every action gate compares its epoch with the current locked authority.

Reports are rebuildable views over immutable observations. The current report manifest pins the chosen PR observations, CI attempts and latest admitted observations, coverage receipts, persona segments, and tool facts. A late CI event updates a new report revision; it does not mutate the prior report or resume a finished run. Preserve provider source times and reconcile out-of-order callbacks against source reads. A job list is complete only for the configured sources and observation time recorded by its coverage rows.

Indexes for operator dashboards should start with org/workspace, then run state or observed time. Tool rollups group unique execution-attempt facts by historical name while retaining binding IDs for drill-down. Do not store a free-standing counter as the source of truth. A retried execution gets a new attempt and counts once if it really starts; a repeated callback does not. Uncertain starts remain separate until a trusted execution or connector receipt resolves them.

Object-store writes must be durable before a database transaction publishes evidence references. A committed metadata row cannot point to an unconfirmed upload. Use staging objects and reconciliation to clean abandoned uploads, without treating them as approved evidence. Every read rechecks access to the protected object, permitted source views, and current policy. Cleaned payload checksums verify stored bytes; they neither grant access nor promise the missing original can be restored.

Deletion is a workflow across database projections, object versions, caches, graph views, and backup retention. Keep a safe tombstone and receipt while removing content as policy requires. Legal holds cover protected objects and their required evidence, not merely a convenient current URL. Never drop a referenced source record with cascading deletes during ordinary operation. A controlled retention job resolves dependency and replay consequences, records the reduced coverage, and checks the org's approved retention and hold rules.

## Graph, context, and future plugin tables

These are proposed PostgreSQL tables. The graph and checked context path are required. Business ingestion and partner plugins are future features; their rows reserve a contract, not a claim that those features exist.

### Shared table rules

Every table below has `org_id uuid`, `id uuid`, `workspace_id uuid`, and `created_at timestamptz NOT NULL`. Its primary key is `(org_id,id)`. Workspace is required except for S-scoped tables and the explicit org-only plugin records. **S** permits a deliberately org-wide NULL workspace or a named workspace. The source/graph foundation, `context_records`, `context_revisions`, `memory_views`, `memory_view_memberships`, `skill_context_refs`, `cgp_providers`, `context_queries`, `retrieval_receipts`, and `retrieval_frames` are S-scoped. Composition, business execution, and run plugins remain workspace-scoped. `(org_id,workspace_id)` references `workspaces(org_id,id)`. Each table has an index on `(org_id,workspace_id,id)`.

All columns below are NOT NULL unless marked `?` or covered by S scope. `-> table` means a composite foreign key `(org_id,column)` to that table’s `(org_id,id)`, never a bare UUID reference. Workspace-required parents also have `UNIQUE(org_id,workspace_id,id)`; workspace-required child links include workspace in their foreign key. S links use an org FK plus a mandatory scope constraint trigger: revisions/memberships inherit their parent's scope, a workspace record may use authorized org-wide content, and org-wide content cannot depend on narrower workspace inputs without explicit authorized declassification. An edge from an org entity to a workspace entity uses that workspace's scope and checks both endpoints. Links to org-only parents use the same checked scope rule. No cascading delete may erase evidence. Nullable-scope unique keys use NULLS NOT DISTINCT where an org-wide duplicate would otherwise be possible.

`U(...)` means UNIQUE and `I(...)` means a B-tree index; both start with `org_id`. `A` means the table also has `object_id uuid`, UNIQUE within org, referencing `protected_objects`. Its workspace must match that object. The object’s canonical IAM grants protect the row; a graph edge is never an access grant. Search results, links, counts, and cached views need the same checks. SQL row rules guard every table. Non-SQL copies must enforce equivalent access.

Text status fields have CHECK constraints listing only the stated values. Digests are `bytea` with length 32 and cover approved cleaned content only. Positive revisions and sequence numbers use `bigint CHECK (>0)`. Money uses integer minor units, never floating point. Referenced evidence objects and scan receipts must already pass the shared local-cleaning contract.

### Required source and graph foundation

| Table | Typed columns beyond the shared fields | Keys and checks |
|---|---|---|
| `source_bindings` A | `source_kind text`, `external_scope text`, `deployment_id uuid? -> connector_deployments`, `owner_principal_id uuid -> principals`, `state text` | U(workspace_id,source_kind,external_scope); state active/paused/revoked. Kind comes from the approved source registry. |
| `source_sync_states` | `binding_id uuid -> source_bindings`, `cursor_object_id uuid? -> evidence_objects`, `last_source_version text?`, `observed_at timestamptz?`, `state text`, `retry_at timestamptz?` | U(binding_id); I(state,retry_at); state current/stale/running/error. A cursor is cleaned and encrypted. |
| `ontology_versions` A | `name text`, `revision bigint`, `definition_object_id uuid -> evidence_objects`, `digest bytea`, `state text` | U(workspace_id,name,revision); state draft/published/retired. Published rows are immutable. |
| `ontology_types` | `ontology_id uuid -> ontology_versions`, `type_key text`, `kind text` | U(ontology_id,type_key); kind entity/relation. |
| `source_type_mappings` | `binding_id uuid -> source_bindings`, `external_type text`, `ontology_type_id uuid -> ontology_types`, `mapping_revision bigint`, `mapping_object_id uuid -> evidence_objects` | U(binding_id,external_type,mapping_revision); approved immutable mapping rules, not arbitrary executable code. |
| `graph_entities` A | `binding_id uuid? -> source_bindings`, `external_key text?`, `type_id uuid -> ontology_types`, `deleted_at timestamptz?` | U(binding_id,external_key) where binding exists; binding and external key are both set or both absent. Internal entities reuse a protected object ID. Trigger requires entity-kind ontology type. |
| `graph_entity_revisions` | `entity_id uuid -> graph_entities`, `revision bigint`, `source_version text?`, `source_version_state text`, `source_access_version text?`, `clean_object_id uuid -> evidence_objects`, `scan_receipt_id uuid -> scan_receipts`, `issuer_id uuid -> principals`, `evidence_object_id uuid -> evidence_objects`, `trust_state text`, `valid_from timestamptz?`, `valid_until timestamptz?`, `observed_at timestamptz` | U(entity_id,revision); source state known/unknown; known requires version, unknown requires NULL. Trust proposed/inferred/verified. Valid end requires start and exceeds it. I(entity_id,observed_at). |
| `graph_relations` A | `from_entity_id uuid -> graph_entities`, `to_entity_id uuid -> graph_entities`, `type_id uuid -> ontology_types`, `source_binding_id uuid? -> source_bindings`, `external_relation_key text?` | Stable identity. Source binding/key are both set or absent; partial U(source_binding_id,external_relation_key). I(from_entity_id,type_id); I(to_entity_id,type_id). Trigger requires relation-kind ontology type. |
| `graph_relation_revisions` | `relation_id uuid -> graph_relations`, `revision bigint`, `source_version text?`, `from_revision_id uuid -> graph_entity_revisions`, `to_revision_id uuid -> graph_entity_revisions`, `issuer_id uuid -> principals`, `evidence_object_id uuid -> evidence_objects`, `trust_state text`, `event_kind text`, `event_key uuid`, `valid_from timestamptz?`, `valid_until timestamptz?`, `observed_at timestamptz`, `supersedes_id uuid? -> graph_relation_revisions` | U(relation_id,revision); U(event_key); partial U(supersedes_id) when set; trust proposed/inferred/verified; kind assertion/retraction. Endpoints must revise the stable relation’s entities. Superseded row must be an earlier revision of this relation. Retraction requires supersedes. Valid end exceeds its required start. I(relation_id,observed_at). |
| `graph_provenance` | `subject_object_id uuid -> protected_objects`, `source_revision_id uuid -> graph_entity_revisions`, `derivation text`, `evidence_object_id uuid -> evidence_objects`, `decision_id uuid -> authorization_decisions` | U(subject_object_id,source_revision_id,derivation); derivation copied/summary/redacted/asserted. I(source_revision_id). |

Source versions are opaque source-issued text. PostgreSQL cannot foreign-key a remote record; the checked binding and receipt establish where it came from. Unknown versions stay unknown. Graph revisions are immutable history. Each relation revision is an event; retraction appends a retraction event rather than updating an old claim. Valid time describes when the source says a fact holds; observed time records when Oxagen learned it. NULL valid time means unknown. Verified requires an authorized trusted issuer and checked evidence; inferred never silently becomes verified. Deletion or permission changes fence reads immediately. An outbox event rebuilds search and graph indexes after the database transaction commits. A stale graph never supplies current authority to execute a tool.

### Required context and memory path

| Table | Typed columns beyond the shared fields | Keys and checks |
|---|---|---|
| `context_records` A | `kind text`, `owner_principal_id uuid -> principals`, `source_entity_id uuid? -> graph_entities`, `deleted_at timestamptz?` | Kind memory/document/skill/run_evidence/derived. I(owner_principal_id,kind). |
| `context_revisions` | `record_id uuid -> context_records`, `revision bigint`, `clean_object_id uuid -> evidence_objects`, `scan_receipt_id uuid -> scan_receipts`, `source_revision_id uuid? -> graph_entity_revisions`, `valid_until timestamptz?` | U(record_id,revision); I(record_id,valid_until). Immutable; no unscanned original attached. |
| `memory_views` A | `name text`, `owner_principal_id uuid -> principals`, `revision bigint` | U(workspace_id,owner_principal_id,name,revision). A view selects records; it grants no access. |
| `memory_view_memberships` | `view_id uuid -> memory_views`, `context_revision_id uuid -> context_revisions`, `position integer CHECK (>=0)` | U(view_id,position); U(view_id,context_revision_id). |
| `skill_context_refs` | `agent_release_id uuid -> agent_releases`, `context_revision_id uuid -> context_revisions`, `purpose text` | U(agent_release_id,context_revision_id,purpose). Trigger requires skill-kind context. This reference grants no install or execution right. |
| `cgp_providers` A | `binding_id uuid -> source_bindings`, `principal_id uuid -> principals`, `protocol_version text`, `schema_digest bytea`, `registry_key_id text`, `state text` | U(binding_id,principal_id,protocol_version); state enabled/disabled. Keys come from a trusted registry. |
| `context_queries` A | `context_kind text CHECK IN ('run','workspace_admin','org_admin')`, `run_id uuid? -> runs`, `caller_id uuid -> principals`, `clean_query_id uuid -> evidence_objects`, `scan_receipt_id uuid -> scan_receipts`, `decision_id uuid -> authorization_decisions`, `byte_limit bigint CHECK (>=0)`, `state text` | I(run_id,created_at); state pending/complete/denied/failed. Run requires workspace/run; workspace_admin requires workspace and NULL run; org_admin requires both NULL. Query decision/action/scan must match caller and this exact scope. Human pre-run discovery needs no fabricated run. |
| `retrieval_receipts` A | `query_id uuid -> context_queries`, `provider_id uuid -> cgp_providers`, `provider_request_id text`, `clean_reply_id uuid -> evidence_objects`, `scan_receipt_id uuid -> scan_receipts`, `signature_check text`, `received_at timestamptz` | U(provider_id,provider_request_id); signature valid/invalid/unavailable. Invalid data cannot enter composition. |
| `retrieval_frames` | `receipt_id uuid -> retrieval_receipts`, `position integer CHECK (>=0)`, `context_revision_id uuid -> context_revisions`, `provider_frame_id text`, `byte_count bigint CHECK (>=0)` | U(receipt_id,position); U(receipt_id,provider_frame_id). |
| `composition_receipts` A | `run_id uuid -> runs`, `action_id uuid -> governed_actions`, `request_object_id uuid -> evidence_objects`, `scan_receipt_id uuid -> scan_receipts`, `request_digest bytea`, `composed_at timestamptz` | U(action_id,request_digest); I(run_id,composed_at). Records the actual cleaned model request. |
| `composition_items` | `composition_id uuid -> composition_receipts`, `position integer CHECK (>=0)`, `context_revision_id uuid -> context_revisions`, `frame_id uuid? -> retrieval_frames`, `decision_id uuid -> authorization_decisions`, `transformation text` | U(composition_id,position); transformation unchanged/summary/redacted. A changed item links its new revision. |

Retrieval proves what returned; composition proves what entered a request. Neither proves model causation. Stored skills, memories, and graph links do not add rights. Resolve access again at retrieval, composition, and export. CGP wire versions stay pinned; MCP may wrap the Context Gateway but does not replace these records.

### Connector proof and future business ingestion

`connector_receipts` is a shared execution record. The other tables below reserve future business ingestion.

| Table | Typed columns beyond the shared fields | Keys and checks |
|---|---|---|
| `connector_receipts` A | `deployment_id uuid -> connector_deployments`, `issuer_id uuid -> principals`, `attempt_id uuid -> action_attempts`, `external_request_id text`, `external_receipt_id text?`, `source_event_id text?`, `ingestion_key text`, `payload_digest bytea`, `source_binding_id uuid? -> source_bindings`, `external_record_kind text?`, `external_record_id text?`, `source_version text?`, `outcome text`, `clean_evidence_id uuid -> evidence_objects`, `scan_receipt_id uuid -> scan_receipts`, `observed_at timestamptz` | U(deployment_id,ingestion_key); partial U(deployment_id,source_event_id) when set. Outcome pending/succeeded/failed/unknown. I(attempt_id,observed_at). Append new observations; never rewrite an uncertain receipt. |
| `business_records` A | `binding_id uuid -> source_bindings`, `external_id text`, `kind text`, `entity_id uuid -> graph_entities` | U(binding_id,kind,external_id); U(entity_id); kind customer/order/refund. |
| `business_record_revisions` | `record_id uuid -> business_records`, `graph_revision_id uuid -> graph_entity_revisions`, `source_version text?`, `amount_minor bigint?`, `currency char(3)?`, `status text`, `observed_at timestamptz` | U(record_id,graph_revision_id); amount/currency both present or absent; amount nonnegative. Trigger verifies graph revision belongs to that record’s entity. |
| `business_record_links` A | `from_revision_id uuid -> business_record_revisions`, `to_revision_id uuid -> business_record_revisions`, `kind text`, `receipt_id uuid -> connector_receipts` | U(from_revision_id,to_revision_id,kind); kind refund_order/order_customer. Trusted source types must match. |
| `action_correlations` A | `action_id uuid -> governed_actions`, `receipt_id uuid -> connector_receipts`, `record_revision_id uuid -> business_record_revisions`, `decision_id uuid -> authorization_decisions`, `policy_revision_id uuid -> policy_revisions`, `approval_id uuid? -> approval_requests` | U(action_id,receipt_id,record_revision_id,policy_revision_id); I(record_revision_id). Trigger checks attempt/action, decision/action, source binding, record kind, exact external ID, and any known source version. |

The trusted connector assigns one durable ingestion key per logical receipt and reuses it on transport retries. A repeated key or source event must match the stored cleaned payload digest; a mismatch is a conflict, not an overwrite. A new observed timestamp cannot create another receipt. Later source events use new stable event keys. Receipt source fields are either absent together or name a known binding, kind, and external ID. The receipt deployment must serve that binding. Its authenticated issuer must match the deployment’s service principal. Missing source access versions cannot prove a fresh permission check. Correlation needs a trusted connector’s exact request and source IDs. A model claim, matching amount, or fuzzy search cannot create the link. The decision must reference the named policy and any required granted approval. Missing proof leaves correlation pending; it never changes an unknown refund into success.

### Reserved plugin and completion stub

These tables define a future interface. They do not implement partner code, a marketplace, or built-in witness tests. Every plugin uses a canonical principal; the same IAM checks govern its operations.

| Table | Typed columns beyond the shared fields | Keys and checks |
|---|---|---|
| `plugin_publishers` A | `principal_id uuid -> principals`, `name text`, `state text` | Workspace may be NULL for org-only publisher; U(principal_id); state active/revoked. |
| `plugin_packages` A | `publisher_id uuid -> plugin_publishers`, `name text`, `version text`, `manifest_object_id uuid -> evidence_objects`, `digest bytea` | Org-only allowed; U(publisher_id,name,version). Immutable, reviewed metadata. |
| `plugin_installs` A | `package_id uuid -> plugin_packages`, `principal_id uuid -> principals`, `state text` | U(workspace_id,principal_id); state reserved/enabled/disabled/revoked. Required workspace. |
| `plugin_install_grants` | `install_id uuid -> plugin_installs`, `iam_grant_id uuid -> record_grants`, `capability text`, `expires_at timestamptz` | U(install_id,iam_grant_id,capability); capability control/context_offer/event_read/job. Trigger checks grant principal, object scope, mapped permission, revocation, and expiry. It never supplies separate authority. |
| `plugin_subscriptions` A | `install_id uuid -> plugin_installs`, `event_kind text`, `run_id uuid? -> runs`, `required boolean`, `state text` | U(install_id,event_kind,run_id); use NULLS NOT DISTINCT. State enabled/disabled. Event kind from reviewed registry. |
| `plugin_event_deliveries` | `subscription_id uuid -> plugin_subscriptions`, `event_id uuid -> run_events`, `attempt_count integer CHECK (>=0)`, `state text`, `next_attempt_at timestamptz?`, `ack_at timestamptz?` | U(subscription_id,event_id); I(state,next_attempt_at); state pending/sent/acked/failed. |
| `plugin_control_requests` A | `install_id uuid -> plugin_installs`, `run_id uuid -> runs`, `request_key text`, `verb text`, `expected_run_version bigint`, `decision_id uuid -> authorization_decisions`, `applied_event_id uuid? -> run_events`, `state text` | U(install_id,request_key); verb stop/pause/resume/force_continue; state denied/accepted/applied/failed. Applied requires the matching core event. Acceptance is not application. |
| `plugin_jobs` A | `install_id uuid -> plugin_installs`, `run_id uuid -> runs`, `request_key text`, `deadline timestamptz`, `decision_id uuid -> authorization_decisions`, `state text`, `result_object_id uuid? -> evidence_objects` | U(install_id,request_key); I(state,deadline); state queued/running/succeeded/failed/cancelled/unknown. |
| `plugin_context_offers` A | `install_id uuid -> plugin_installs`, `run_id uuid -> runs`, `context_revision_id uuid -> context_revisions`, `decision_id uuid -> authorization_decisions`, `state text` | U(install_id,run_id,context_revision_id); state offered/accepted/rejected/expired. Acceptance does not prove composition. |
| `completion_proposals` A | `run_id uuid -> runs`, `scope_kind text`, `turn_id uuid? -> turns`, `target_version bigint`, `state text` | Scope run/turn; turn scope requires turn_id belonging to run, run scope requires NULL. U(run_id,scope_kind,turn_id,target_version) NULLS NOT DISTINCT. State proposed/committed/superseded; partial unique committed target per run/scope/turn, with NULLS NOT DISTINCT. |
| `completion_rounds` | `proposal_id uuid -> completion_proposals`, `round_number bigint`, `authority_epoch bigint`, `deadline timestamptz`, `state text` | U(proposal_id,round_number); state open/closed/superseded. Frozen proposal version. |
| `completion_seats` | `round_id uuid -> completion_rounds`, `subscription_id uuid -> plugin_subscriptions`, `install_id uuid -> plugin_installs`, `required boolean` | U(round_id,subscription_id); trigger verifies subscription’s install. Required seat list is frozen. |
| `completion_decisions` | `seat_id uuid -> completion_seats`, `sequence bigint`, `vote text`, `received_at timestamptz`, `reason_object_id uuid? -> evidence_objects` | U(seat_id); sequence is transport ordering only, not permission to change a final vote; vote ready/hold/continue/abstain. Append-only; exact round only. |
| `completion_holds` | `seat_id uuid -> completion_seats`, `decision_id uuid? -> completion_decisions`, `reason text`, `state text` | U(seat_id) WHERE state=open; reason vote/missing/error; state open/resolved. A vote reason requires a decision from the same seat. |
| `completion_waivers` A | `seat_id uuid -> completion_seats`, `actor_id uuid -> principals`, `authorization_id uuid -> authorization_decisions`, `reason_object_id uuid -> evidence_objects` | U(seat_id); named waiver only for this seat and frozen round. |

Plugin deliveries reference durable run_events; outbox rows only transport them. An applied control event must name the same run and checked request. No majority vote completes a run or turn. Every required seat needs its one valid final ready decision or a named authorized waiver. Authenticate votes against the seat’s install principal; return the same receipt for an identical final reply and reject conflicting bytes. A changed vote needs a new round, never an update to the old decision. Missing and failed seats hold completion. A transaction locks the round, checks all seats plus core run, pause, policy, and budget conditions, then commits once. Late votes remain evidence for their original round and cannot change a later round.

## Repo setup, loaded inputs, and first-run proof

These records support the proposed `.oxagen` setup flow. They use the existing B/W/I/P column rules, org-prefixed keys, workspace constraints, protected objects, and reverse-FK indexes. They store cleaned evidence and source references. They are not a second permission system. An ignored local lock is a read-only mirror of a protected receipt, not authority.

### Configuration and sync

| Table | Typed columns beyond B/W; keys and checks |
| --- | --- |
| `repo_config_snapshots` I | `repository_id uuid FK vcs_repositories`, `checkout_binding_id uuid FK checkout_bindings`, `source_snapshot_id uuid FK vcs_snapshots`, `settings_revision_id uuid FK workspace_repo_settings`, `data_plane_revision_id uuid FK data_plane_revisions`, `agent_release_id uuid FK agent_releases`, `mode_id uuid FK agent_modes`, `config_format text`, `manifest_object_id uuid FK evidence_objects`, `created_by uuid FK principals`. Prove all repository references match, mode belongs to release, and data placement is the current approved org binding. |
| `repo_config_files` I | `snapshot_id uuid FK repo_config_snapshots`, `relative_path text`, `source_commit_id text?`, `clean_object_id uuid FK evidence_objects`, `cleaned_sha256 bytea CHECK length=32`; UNIQUE snapshot/path. The strict repo profile requires workspace/context/steering files. Validate safe paths and recorded cleaned bytes. A dirty source has a pinned working-copy snapshot, never a fabricated commit ID. |
| `repo_config_entries` I | `snapshot_id uuid FK repo_config_snapshots`, `entry_key text`, `kind text CHECK IN ('context','steering')`, `source_kind text CHECK IN ('vcs','context')`, `source_path text?`, `context_revision_id uuid? FK context_revisions`, `required boolean`, `delivery text CHECK IN ('request','turn_start')`, `priority text CHECK IN ('task_context','task_guidance')`; UNIQUE snapshot/kind/key. Exactly one source form; steering requires turn_start/task_guidance. Neither form grants rights. |
| `repo_sync_plans` P | `snapshot_id uuid FK repo_config_snapshots`, `target_id uuid FK harness_targets`, `actor_id uuid FK principals`, `expected_binding_version bigint CHECK >0`, `plan_object_id uuid FK evidence_objects`, `expires_at timestamptz`, `state text CHECK IN ('planned','applied','conflict','expired','blocked')`, `request_key text`; UNIQUE actor/request key. A stale or changed plan needs a new checked revision. |
| `repo_sync_plan_epochs` I | `plan_id uuid FK repo_sync_plans`, `scope_object_id uuid FK authority_epochs(scope_object_id)`, `epoch bigint CHECK >0`; UNIQUE plan/scope. Trusted authority resolves the full relevant scope set. |
| `runtime_input_manifests` I | `kind text CHECK IN ('context','steering')`, `config_snapshot_id uuid FK repo_config_snapshots`, `principal_id uuid FK principals`, `manifest_object_id uuid FK evidence_objects`, `assembled_at timestamptz`. A prepared selection is neither an access grant nor proof of model delivery. |
| `runtime_input_manifest_items` I | `manifest_id uuid FK runtime_input_manifests`, `entry_id uuid FK repo_config_entries`, `position integer CHECK >=0`, `context_revision_id uuid FK context_revisions`, `source_graph_revision_id uuid? FK graph_entity_revisions`, `decision_id uuid FK authorization_decisions`; UNIQUE manifest/position and manifest/entry. Entry and manifest must share config snapshot/kind; decisions bind the same principal, source, purpose, and destination. VCS excerpts become cleaned context revisions with source evidence. |
| `repo_sync_receipts` I | `plan_id uuid FK repo_sync_plans`, `scanner_authority_id uuid FK scanner_authorities`, `target_id uuid FK harness_targets`, `principal_id uuid FK principals`, `context_manifest_id uuid FK runtime_input_manifests`, `steering_manifest_id uuid FK runtime_input_manifests`, `prepared_tool_belt_id uuid FK prepared_tool_belts`, `applied_at timestamptz`, `expires_at timestamptz`, `proof_object_id uuid FK evidence_objects`; UNIQUE plan. Match manifest kinds, snapshot, target, actor, scanner, and workspace. |
| `repo_sync_policy_versions` I | `receipt_id uuid FK repo_sync_receipts`, `policy_revision_id uuid FK policy_revisions`; UNIQUE receipt/policy revision. |
| `repo_sync_scope_epochs` I | `receipt_id uuid FK repo_sync_receipts`, `scope_object_id uuid FK authority_epochs(scope_object_id)`, `epoch bigint CHECK >0`; UNIQUE receipt/scope. Receipt epochs explain the applied state; dispatch still checks current authority. |

An optional unavailable source is recorded as omitted in the safe manifest without exposing hidden metadata. A required unavailable source blocks application. Local edits to Oxagen-owned exports are proposals; they cannot change approved source records. A branch or source change creates a new snapshot and plan. The service detects conflicts instead of overwriting local work or silently merging guidance.

### Prepared tools and actual delivery

| Table | Typed columns beyond B/W; keys and checks |
| --- | --- |
| `prepared_tool_belts` I | `config_snapshot_id uuid FK repo_config_snapshots`, `target_id uuid FK harness_targets`, `requested_by uuid FK principals`, `agent_principal_id uuid FK principals`, `agent_release_id uuid FK agent_releases`, `mode_id uuid FK agent_modes`, `manifest_object_id uuid FK evidence_objects`, `expires_at timestamptz`. Release, mode, principal, and config must agree. This is pre-run discovery under current rights, not an execution grant. |
| `prepared_tool_belt_entries` I | `resolution_id uuid FK prepared_tool_belts`, `tool_binding_id uuid FK tool_bindings`, `exposed_name text`, `schema_object_id uuid FK evidence_objects`; UNIQUE resolution/binding and resolution/exposed name. Preserve exact approved binding and schema. |
| `run_start_receipts` I | `run_id uuid FK runs`, `dispatch_target_id uuid FK dispatch_targets`, `sync_receipt_id uuid FK repo_sync_receipts`, `start_event_id uuid FK run_events`, `first_model_exchange_id uuid FK model_exchanges`, `first_model_dispatch_event_id uuid FK run_events`, `composition_receipt_id uuid FK composition_receipts`, `tool_belt_snapshot_id uuid FK tool_belt_snapshots`, `proof_object_id uuid FK evidence_objects`; UNIQUE run. Events, exchange, composition, and final belt must belong to this run and its first dispatched model attempt. |
| `run_input_loads` I | `run_start_receipt_id uuid FK run_start_receipts`, `prepared_manifest_id uuid FK runtime_input_manifests`, `composition_id uuid FK composition_receipts`, `selection_object_id uuid FK evidence_objects`; UNIQUE start receipt/prepared manifest. The safe selection record maps prepared entries to actual composition items, with explicit omissions and transformations. Required entries must be present under the approved profile. |
| `run_input_items` I | `load_id uuid FK run_input_loads`, `prepared_item_id uuid FK runtime_input_manifest_items`, `composition_item_id uuid? FK composition_items`, `outcome text CHECK IN ('included','transformed','omitted')`, `transformation_decision_id uuid? FK authorization_decisions`, `reason_code text?`; UNIQUE load/prepared-item/composition-item NULLS NOT DISTINCT. Included/transformed require a composition item belonging to the load's composition; omitted requires NULL plus safe reason. Transformation requires its checked decision and source provenance. Parent-manifest membership is enforced by composite FKs. |

Register the enrolled harness target before creating its checkout binding. Strict launch remains blocked until that binding is verified. Context discovery may use the explicit workspace-admin query scope before a run exists; it does not fabricate a run identity.

At start, recheck source access, current policies, target state, and all epochs. Create the final run-bound `tool_belt_snapshots` row from a fresh resolution, optionally referencing its prepared belt. Differences remain visible; an expired or weakened preflight result does not restore old access. Match the final tool schemas and context to the locally scanned request. A newly introduced source or tool needs the same full checks.

Save the start receipt only after durable run-start and first-model-dispatch events exist. Its `composition_receipt_id` links the actual cleaned request; prepared manifests alone prove only selection. Validate that the exchange and composition share the request artifact, ScanReceipt, action, and attempt. A queue acknowledgement, local JSON file, or valid JSON shape cannot substitute for this proof. The first-model dispatch proves the input was sent through the gate, not that the model obeyed it.

The protected service stores canonical sync and load state outside the agent-writable repo. Mirrors contain no credentials, raw scan matches, replacement maps, or unauthorized private payloads. Every API read and generated export uses the existing record IAM layer. No setup operation can publish policy, install a tool, widen a grant, or choose a new data plane merely because a repo file asks for it.

## Cross-domain constraints

Every foreign key named in the catalog is a required integration constraint. Same-org UUIDs are not enough: a turn must belong to its run, a tool release to its tool, a grant to its principal, a policy evaluation to its decision, and a receipt to its exact attempt. Use composite unique keys and foreign keys for these links. Where a check needs several rows, use a locked trusted procedure and constraint trigger. Do not hide that check in an optional UI validator.

An S-scoped evidence, graph, or context object may be org-wide only when the author and all contributing inputs allow that scope. A workspace row may reference org-wide evidence that its actor can read; it may not widen workspace content by relabeling it org-wide. The catalog's S-scoped `scanner_authorities`, `sanitization_receipts`, and `scan_receipts` support explicitly granted org-admin work. Optional gateway enrollment must match the authority's device, identity, and permitted scope. Managed local workspace data still requires its matching workspace enrollment. This covers org-level templates without borrowing an arbitrary workspace's authority.

The `workspace_admin` and `org_admin` context labels name non-run scope; they do not grant an administrator role. A human context read still needs its ordinary IAM permission for the selected records.

The scanner authority, signed receipt, and destination must agree. Final request digests cover only cleaned wire content. Headers added by the trusted transport are outside model-visible content and contain no prompt additions. New content needs a new local scan and new action decision.

Graph edges retain their own access rules. Protect endpoints, edge existence, properties, counts, and derived views. Revocation fences reads before asynchronous index cleanup. All derived records preserve the contributing access restrictions unless an authorized declassification creates new evidence.

`agent_releases.model_profile_id` references typed `model_profiles`, not any protected object. Define `model_profiles` (B, object_id, workspace_id nullable, name text, state draft/active/retired) and immutable `model_profile_revisions` (B, profile_id FK, revision bigint >0, route_id FK model_routes, bounds_artifact_id FK evidence_objects; unique profile/revision). Pin a profile revision on the release. Agent mode context views reference `memory_views`; tool rules reference the stable catalog tool and any exact allowed release/binding. A deny on the stable tool covers every version.

Independent table creation may use forward references. Cycles such as a report and its store receipt must use deferred constraints inside one trusted transaction, or a staged record that is not yet published. No active row may point to an absent proof. Document the allowed bootstrap state instead of dropping the final constraint.

## Important transactions

| Change | Required atomic boundary |
|---|---|
| Publish a policy or revoke a grant | Save the version/change, advance applicable authority epochs, and append the outbox event. New dispatch checks the current authority before use. Target rollout receipts arrive separately. |
| Change a shared limit | Keep the stable logical limit/account, lock its active periods, preserve used and held exposure, apply new terms, and freeze if the new cap is below exposure. Reset or period-cutover operations require separate checked evidence; a new policy revision is not a new allowance. |
| Start a governed action | Lock the action, validate rights and facts, check all epochs, hold all applicable limits, save the decision and exact attempt. Consume its single-use authorization at the trusted dispatch gate. |
| Settle a charge | Resolve canonical financial effect identity and its confirmed revision; lock the same accounts/periods and effect/account state. Reconcile duplicate retry holds, post each true effect once, and apply only the difference for an approved later correction. Unknown effects retain exposure. |
| Confirm a pause | Fence admission and old replies, collect trusted worker/effect receipts, commit a stable boundary, then publish paused. A timeout cannot perform this transaction. |
| Complete a turn | Lock the frozen proposal, verify core conditions and every required future plugin seat, then commit one completion event. A new candidate needs a new round. |
| Save a report | Commit exact repo/default-branch versions, cleaned diff/file list, all known PR/CI observations and coverage, persona history, tool counts, and the configured-store receipt. Publish after durability. |
| Apply repo setup and prove a start | Save checked config/source snapshots, prepared context/steering and tool resolution, and a protected sync receipt. At launch recheck authority, create the final run tool belt and actual composition, then link the first dispatch to a run-start receipt. Local mirrors never grant access. |
| Rebuild a projection | Read a fixed event/version frontier, replace only the matching generation, and expose its source frontier and freshness. Never invent missing facts. |

An external API call cannot be made atomic with a local database commit. Store dispatch intent first, use a supported upstream idempotency key, then reconcile its outcome. A crash after dispatch is uncertain until checked. This is why an attempt and a logical action are different records.

## Indexes and scale

Create org-prefixed indexes for every FK and common scope filter. Add `(org_id,workspace_id,created_at,id)` for bounded timeline lists, `(org_id,run_id,seq)` for event order, active grant expiry indexes, and partial pending-work indexes. Index fixed states, not predicates that depend on the changing clock. Partition high-volume events and ledger history by organization hash, not by time. A PostgreSQL unique constraint on a partitioned table must include every partition column, and `run_events` and `limit_ledger_entries` are keyed without time and are foreign-key targets from rows that carry only organization and id, so time partitioning is not satisfiable as keyed. Retention therefore runs as a bounded deletion job, not a partition drop. Do not weaken financial deduplication to make a partition key fit.

State the write cost of a model call as a design constraint. With per-item composition decisions, per-scope epoch rows, per-bucket reservations and ledger entries, an event row and an outbox row per state change, and the same ledger rows again at settlement, one call is on the order of a hundred durable row writes before content. Batch the per-item disclosure decisions into one decision row with an item manifest artifact, keep run sequence allocation in a narrow `run_sequences (org_id, run_id, next_seq)` table with no secondary indexes so the indexed `runs` row is not rewritten on every event, and give `graph_entities` and `context_records` a compare-and-swap current-revision pointer with an index on `(org_id, entity_id, revision DESC)` so the per-turn read path does not sort revisions. Bound context assembly: a maximum hop count and candidate set per graph query, a per-organization entity and edge sizing target, and assembly latency as a measured gate. Make CI webhooks primary with bounded reconciliation polling under one token bucket per installation, degrading to `ci_coverage=partial` with a reason. Allow a scan-result cache keyed by content digest plus policy and detector revision so a fork does not rescan an unchanged tree, and give `continuation_capsules` a retention policy reference like `evidence_objects`. Bound JSONB columns with `pg_column_size` checks and spill larger values to evidence objects. Batch 21 measures writes per turn against the stated budget, and a synthetic load gate on event and ledger volume runs after batch 6, before certification freezes the schema.

Return opaque keyset cursors for large lists. Cursors bind the caller, query, scope, and snapshot. Apply access before counts, sorting, aggregation, and pagination. Rate-limit exports and graph fan-out. Admission and revoke controls need capacity even when an org's stream queue is full.

One data-plane revision identifies the authority database, object namespace, region, and key handles. Use org encryption keys and authenticated internal links. Caches, search, backups, signed URLs, and exports honor the same residency and access rules. Private installs use the same contracts with local endpoints. They need no unsolicited inbound internet connection.

## Migrations, backup, and deletion

Version the schema and API together. A migration has an immutable ID, checksum, compatible reader/writer range, test evidence, and rollback or roll-forward plan. Expand first, backfill in bounded org-scoped jobs, compare old and new results, switch readers, then remove obsolete fields after the rollback window. Never let a worker running an older schema skip a required new gate.

Keep encrypted backups and point-in-time recovery in the org's allowed region. Test restores into an isolated environment. On restore, invalidate old service credentials, dispatch ownership, and authorization epochs before reconnecting. Reconcile outside effects and charges that occurred after the restored point. Do not replay queue messages as new refunds or model calls. A restore is not permission to reuse old single-use approvals.

Retention is a controlled job. Check legal holds and dependencies; delete allowed content across object versions, search, graph, caches, and replicas; keep a safe tombstone and reduced-capture marker. Backups age out by a declared schedule. Key destruction and content deletion have separate receipts. A legal hold must cover the actual content and keys needed to preserve it. Never promise full replay of deleted or locally removed data.

Use separate migration, backup, emergency, and runtime identities. Require recorded access for emergency work, org-scoped export tests, and restore exercises. This design supports audit evidence; a schema alone does not grant SOC 2 certification.

## Required verification before production

Test org and workspace isolation for reads, writes, joins, views, graph traversal, search, exports, and background jobs. Include human and agent identities, stale grants, pooled connection reuse, malicious IDs, null scope, forged receipts, and revoked keys. Test concurrent shared reservations, ratios, timezone boundaries, provider corrections, unknown results, duplicate callbacks, and integer overflow.

Test a policy revision during an active budget period, a lower cap with outstanding holds, a renamed agent, and a period/time-zone cutover. Test duplicate success observations and two retry holds for one external effect, source-account rotation, and a legitimate later correction. Test org-level context/scanning without a borrowed workspace and pre-run setup without a fabricated run. Prove that first-start receipts bind actual composition rather than only prepared input.

Use crash and race tests at every transaction boundary. Test a late response after pause, a takeover with an old ownership epoch, a policy change during dispatch, and a stale completion reply. Verify report fields against the actual default-branch comparison and CI provider coverage. Exercise private placement, scanner failure, missing evidence, and backup restoration.

The following SQL is a representative subset for review. It does not create every catalog table, the whole policy service, production settlement procedures, or every integration FK. In particular, it omits stable limit-definition continuity, canonical financial-effect deduplication, S-scoped scanner/context records, and the repo-setup tables; the catalog rules remain mandatory. It must be assembled and tested with the full schema before deployment. These statements were executed on PostgreSQL 16 on 2026-09-20 with org, workspace, cross-org and concurrent-hold tests (see AUDIT.md). Loading cleanly is not the same as production qualification. The build plan makes real database tests a required gate.

## Additions from the 2026-09-20 review

These rows and rules were missing from the catalog and are now required. The representative SQL below carries the ones that fit its subset; the rest are catalog rules for the full migration.

| Table or rule | What it adds and why |
|---|---|
| `org.organizations`, `org.org_users`, `auth.users`, `workspace.workspaces` | The customer account is an organization (`org_id`), users live in `auth`, membership is the `org_users` junction, and workspaces have their own schema, matching the product's schema layout. |
| `enrollment_challenges` W/P | `device_public_key bytea`, `nonce bytea`, `required_attestation_profile text`, `expires_at`, `consumed_at?`; unique org/id. `device.enroll` consumes the challenge in its own transaction, and the attestation transcript signs over the nonce and the device public key. Without this row an enrollment proof replays until expiry and `attestation_evidence_id` can name another device's attestation. |
| `encryption_key_versions` T/P and `evidence_objects.encryption_key_version_id`, `encryption_context_digest` | `purpose text`, `kms_key_ref text`, `version integer`, `state text CHECK IN ('active','rotating','retired','destroyed')`, `rotated_at?`, `destroyed_at?`. Every evidence object names the key version that wraps it. Key provisioning moves to batch 5, and a re-wrap migration is a gate before batch 20. |
| `limit_definitions` T/P and `limit_accounts.definition_id`, `workspace_id` | Stable limit identity across policy revisions. `UNIQUE NULLS NOT DISTINCT (org_id, definition_id, workspace_id, scope_object_id, currency, charge_unit)` so a new revision or a renamed policy cannot mint a fresh allowance. In the SQL below. |
| `runs.root_run_id` | Self for a root run, inherited by every fork and child. Run-scoped limit accounts key on the root run's protected object, so a fork cannot shed cost. |
| `policy_thresholds.requires_distinct_approver boolean DEFAULT true` and `exception_grants.hard_cap_threshold_id` | A trigger rejects `exception_grants` whose `approver_id` equals the request's `requester_id` or the action's accountable operator, and whose `max_amount_minor` exceeds the governing `hard_cap` threshold in the same policy revision. Self-approval returns 422. |
| `context_revisions.trust_state`, `context_revisions.origin`, `context_records.state`, and both on `composition_items` | `trust_state CHECK IN ('untrusted','proposed','inferred','verified')`, `origin CHECK IN ('human','agent','external_source','model_output')`, and a promotion state with an approving decision FK. The trust label must survive to the point the text enters the model request; that is the prompt-injection boundary. |
| `audit_log_leaves` and `audit_log_checkpoints` | `leaf_index bigint`, `leaf_hash bytea`, `event_ref`; `tree_size bigint`, `root_hash bytea`, `signed_at`, `signature bytea`, `witness_ack?`. Backs `audit.inclusion_proof` and `audit.consistency_proof`. Without them chapter 18's tamper-evidence claim had no mechanism. |
| `ledger_source_events` | FK target for `limit_ledger_entries.source_event_id`, with the derivation fixed per entry kind: reserve uses the hold id, release and settle use the receipt or cancellation event id, adjust uses the correction id. |
| `credential_references.max_lease_seconds` | Server ceiling on every credential lease; `expires_at` on a lease is server-issued. |
| Column-level update grants and one-way triggers | No P table is fully updatable by the runtime role. `authority_epochs.epoch` may only advance; a `revoked` principal cannot return to `active`; `idempotency_keys` cannot leave `complete` or change its digest; `governed_actions` may change only `state` and `version` through legal transitions; `protected_objects` may change only `deleted_at`. In the SQL below. |
| Lock order | Every money writer locks the action row, then accounts in id order one row at a time, then periods in id order one row at a time, then holds, then effect state. `ORDER BY ... FOR UPDATE` is not a lock order in PostgreSQL. Settlement follows the same order. In the SQL below. |
| Rolling windows | Removed from the subset's `period_kind`. A rolling window needs a windowed aggregate table indexed on `(org_id, account_id, posted_at)` and a compaction rule before it can be admitted. |
| `orgs.state` and `workspaces.state` | The SQL now carries `provisioning` and a workspace state, so platform provisioning cannot create an active organization and `workspaces.revoke` has a column to write. |

## Representative core SQL

Download the same [core SQL file](ARP-core-schema.sql). It demonstrates org RLS, a single-use action authorization, and a transaction that reserves several limit buckets together.

```sql
-- Proposed, self-contained PostgreSQL subset; run as a migration owner in an empty database.
-- UUIDs come from the caller. External object, run, scan and evidence FKs are added by integration.
-- Executed on PostgreSQL 16 on 2026-09-20 (see AUDIT.md): loads cleanly; organization, workspace,
-- revocation-fence and concurrent-hold tests pass. This is still a representative subset, not a full migration.
--
-- Schemas follow the product: auth holds sign-in users, org holds organizations and their members,
-- workspace holds workspaces, oxagen holds the ARP control records. An organization is the customer
-- account; older prose calls it an org. Every private row carries org_id.
CREATE SCHEMA auth;
CREATE SCHEMA org;
CREATE SCHEMA workspace;
CREATE SCHEMA oxagen;
-- oxagen_runtime is a NOLOGIN group role that holds every runtime privilege. The application connects as
-- a LOGIN role that is a member of it and of nothing else, for example:
--   CREATE ROLE oxagen_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB INHERIT IN ROLE oxagen_runtime;
-- The migration owner must never grant oxagen_app or oxagen_runtime membership in the owner role.
CREATE ROLE oxagen_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS;
SET search_path = oxagen, pg_catalog;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY, display_name text NOT NULL,
  state text NOT NULL CHECK (state IN ('active','suspended','deleted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE org.organizations (
  org_id uuid PRIMARY KEY, name text NOT NULL,
  state text NOT NULL CHECK (state IN ('provisioning','active','suspended','closing')),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Membership of a user in an organization. Roles and record grants live in the IAM tables; this row only
-- says the user belongs. The first member of a new organization is created with role 'owner' in the same
-- transaction that activates the organization.
CREATE TABLE org.org_users (
  org_id uuid NOT NULL REFERENCES org.organizations, user_id uuid NOT NULL REFERENCES auth.users,
  membership_role text NOT NULL CHECK (membership_role IN ('owner','member')),
  state text NOT NULL CHECK (state IN ('active','suspended','removed')),
  created_at timestamptz NOT NULL DEFAULT now(), removed_at timestamptz,
  PRIMARY KEY (org_id,user_id)
);
CREATE TABLE workspace.workspaces (
  org_id uuid NOT NULL REFERENCES org.organizations, id uuid NOT NULL, object_id uuid NOT NULL,
  name text NOT NULL, slug text NOT NULL, settings_revision bigint NOT NULL DEFAULT 1 CHECK (settings_revision > 0),
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','suspended','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id),
  UNIQUE (org_id,slug), UNIQUE (org_id,object_id)
);
CREATE TABLE principals (
  org_id uuid NOT NULL REFERENCES org.organizations, id uuid NOT NULL, object_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('human','agent','service','plugin')), display_name text NOT NULL,
  user_id uuid REFERENCES auth.users,
  state text NOT NULL CHECK (state IN ('active','suspended','revoked')), revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id), UNIQUE (org_id,object_id),
  CHECK ((kind='human') = (user_id IS NOT NULL)),
  FOREIGN KEY (org_id,user_id) REFERENCES org.org_users (org_id,user_id)
);
CREATE TABLE protected_objects (
  org_id uuid NOT NULL REFERENCES org.organizations, id uuid NOT NULL, workspace_id uuid,
  kind text NOT NULL, deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id,id), FOREIGN KEY (org_id,workspace_id) REFERENCES workspace.workspaces DEFERRABLE INITIALLY DEFERRED
);
ALTER TABLE workspace.workspaces ADD FOREIGN KEY (org_id,object_id) REFERENCES protected_objects DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE principals ADD FOREIGN KEY (org_id,object_id) REFERENCES protected_objects DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE governed_actions (
  org_id uuid NOT NULL REFERENCES org.organizations, id uuid NOT NULL, object_id uuid NOT NULL,
  workspace_id uuid, run_id uuid, principal_id uuid NOT NULL, capability text NOT NULL,
  context_kind text NOT NULL CHECK (context_kind IN ('run','workspace_admin','org_admin')),
  state text NOT NULL CHECK (state IN ('proposed','denied','approved','running','completed','failed','unknown')),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0), input_object_id uuid NOT NULL, scan_receipt_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id), UNIQUE (org_id,object_id),
  FOREIGN KEY (org_id,workspace_id) REFERENCES workspace.workspaces,
  FOREIGN KEY (org_id,principal_id) REFERENCES principals,
  FOREIGN KEY (org_id,object_id) REFERENCES protected_objects,
  CHECK ((context_kind='run' AND workspace_id IS NOT NULL AND run_id IS NOT NULL)
      OR (context_kind='workspace_admin' AND workspace_id IS NOT NULL AND run_id IS NULL)
      OR (context_kind='org_admin' AND workspace_id IS NULL AND run_id IS NULL))
);
-- Full schema adds run_id -> runs, input_object_id -> evidence_objects, scan_receipt_id -> scan_receipts.
CREATE TABLE action_attempts (
  org_id uuid NOT NULL, id uuid NOT NULL, action_id uuid NOT NULL, attempt_no integer NOT NULL CHECK (attempt_no > 0),
  state text NOT NULL CHECK (state IN ('proposed','authorized','dispatched','completed','failed','unknown')),
  provider_idempotency_key text, started_at timestamptz, finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id),
  UNIQUE (org_id,action_id,attempt_no), UNIQUE (org_id,action_id,id),
  FOREIGN KEY (org_id,action_id) REFERENCES governed_actions,
  CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at)
);
CREATE TABLE action_authorizations (
  org_id uuid NOT NULL, id uuid NOT NULL, action_id uuid NOT NULL, attempt_id uuid NOT NULL,
  decision_id uuid NOT NULL, audience_principal_id uuid NOT NULL, scan_receipt_id uuid NOT NULL,
  request_digest bytea NOT NULL CHECK (octet_length(request_digest)=32),
  run_control_epoch bigint CHECK (run_control_epoch>=0), owner_epoch bigint CHECK (owner_epoch>0),
  scope_count integer NOT NULL CHECK (scope_count>0), expires_at timestamptz NOT NULL, consumed_at timestamptz,
  proof_object_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id),
  UNIQUE (org_id,attempt_id), FOREIGN KEY (org_id,action_id,attempt_id) REFERENCES action_attempts (org_id,action_id,id),
  FOREIGN KEY (org_id,audience_principal_id) REFERENCES principals, CHECK (expires_at > created_at),
  CHECK ((run_control_epoch IS NULL)=(owner_epoch IS NULL))
);
CREATE TABLE authority_epochs (
  org_id uuid NOT NULL, id uuid NOT NULL, scope_object_id uuid NOT NULL, epoch bigint NOT NULL DEFAULT 1 CHECK (epoch>0),
  changed_at timestamptz NOT NULL DEFAULT now(), reason_code text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id,id), UNIQUE (org_id,scope_object_id), FOREIGN KEY (org_id,scope_object_id) REFERENCES protected_objects
);
CREATE TABLE authorization_scope_epochs (
  org_id uuid NOT NULL, id uuid NOT NULL, authorization_id uuid NOT NULL, scope_object_id uuid NOT NULL,
  observed_epoch bigint NOT NULL CHECK (observed_epoch>0), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id),
  UNIQUE (org_id,authorization_id,scope_object_id), FOREIGN KEY (org_id,authorization_id) REFERENCES action_authorizations,
  FOREIGN KEY (org_id,scope_object_id) REFERENCES authority_epochs (org_id,scope_object_id)
);
-- Integration adds decision_id -> matching authorization_decisions, scan_receipt_id -> scan_receipts,
-- proof_object_id -> evidence_objects. Signed proofs contain no live bearer credential.
-- A limit definition is the stable identity of one limit across policy revisions. Renaming a policy,
-- publishing a new revision, or creating an agent must not mint a fresh allowance, so accounts key on
-- the definition, not on the revision.
CREATE TABLE limit_definitions (
  org_id uuid NOT NULL REFERENCES org.organizations, id uuid NOT NULL, name text NOT NULL,
  capability text NOT NULL, state text NOT NULL CHECK (state IN ('active','retired')),
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id)
);
CREATE TABLE limit_accounts (
  org_id uuid NOT NULL, id uuid NOT NULL, object_id uuid NOT NULL, definition_id uuid NOT NULL,
  workspace_id uuid, scope_object_id uuid NOT NULL,
  capability text NOT NULL, currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'), charge_unit text NOT NULL,
  rule_revision_id uuid NOT NULL, cap_kind text NOT NULL CHECK (cap_kind IN ('fixed','ratio')),
  cap_minor bigint, ratio_numerator bigint, ratio_denominator bigint,
  period_kind text NOT NULL CHECK (period_kind IN ('lifetime','calendar_day')),
  timezone_name text NOT NULL, event_basis text NOT NULL, state text NOT NULL CHECK (state IN ('active','frozen','closed')),
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id), UNIQUE (org_id,object_id),
  UNIQUE NULLS NOT DISTINCT (org_id,definition_id,workspace_id,scope_object_id,currency,charge_unit),
  FOREIGN KEY (org_id,definition_id) REFERENCES limit_definitions,
  FOREIGN KEY (org_id,workspace_id) REFERENCES workspace.workspaces,
  FOREIGN KEY (org_id,object_id) REFERENCES protected_objects,
  FOREIGN KEY (org_id,scope_object_id) REFERENCES protected_objects,
  CHECK ((cap_kind='fixed' AND cap_minor IS NOT NULL AND cap_minor>=0 AND ratio_numerator IS NULL AND ratio_denominator IS NULL)
      OR (cap_kind='ratio' AND cap_minor IS NULL AND ratio_numerator IS NOT NULL AND ratio_denominator IS NOT NULL
          AND ratio_numerator>=0 AND ratio_denominator>0 AND ratio_numerator<=ratio_denominator))
);
-- Integration adds rule_revision_id -> policy_revisions. Rolling windows are not in this subset: a running
-- total cannot age amounts out, so the full catalog adds a windowed aggregate table indexed on
-- (org_id, account_id, posted_at) with a stated compaction rule before 'rolling' is allowed.
CREATE TABLE limit_periods (
  org_id uuid NOT NULL, id uuid NOT NULL, account_id uuid NOT NULL,
  cap_fact_id uuid, period_start timestamptz NOT NULL, period_end timestamptz NOT NULL,
  effective_cap_minor bigint NOT NULL CHECK (effective_cap_minor>=0),
  used_minor bigint NOT NULL DEFAULT 0 CHECK (used_minor>=0), held_minor bigint NOT NULL DEFAULT 0 CHECK (held_minor>=0),
  version bigint NOT NULL DEFAULT 1 CHECK (version>0), frozen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id), UNIQUE (org_id,account_id,period_start),
  FOREIGN KEY (org_id,account_id) REFERENCES limit_accounts, CHECK (period_end>period_start)
);
CREATE TABLE limit_holds (
  org_id uuid NOT NULL, id uuid NOT NULL, action_id uuid NOT NULL, attempt_id uuid NOT NULL,
  state text NOT NULL CHECK (state IN ('held','settled','released','unknown')), expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id), UNIQUE (org_id,attempt_id),
  FOREIGN KEY (org_id,action_id,attempt_id) REFERENCES action_attempts (org_id,action_id,id)
);
CREATE TABLE limit_reservations (
  org_id uuid NOT NULL, id uuid NOT NULL, hold_id uuid NOT NULL, period_id uuid NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor>0), currency char(3) NOT NULL, fx_quote_id uuid, price_schedule_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id,id), UNIQUE (org_id,hold_id,period_id),
  FOREIGN KEY (org_id,hold_id) REFERENCES limit_holds, FOREIGN KEY (org_id,period_id) REFERENCES limit_periods
);
-- source_event_id makes postings idempotent per period. Its derivation is fixed per entry kind: reserve uses
-- the hold id; release and settle use the id of the trusted receipt or cancellation event that caused them;
-- adjust uses the id of the recorded correction. The full catalog adds ledger_source_events as the FK target.
CREATE TABLE limit_ledger_entries (
  org_id uuid NOT NULL, id uuid NOT NULL, period_id uuid NOT NULL, hold_id uuid,
  entry_kind text NOT NULL CHECK (entry_kind IN ('reserve','release','settle','adjust')),
  held_delta bigint NOT NULL, used_delta bigint NOT NULL, source_event_id uuid NOT NULL,
  posted_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id),
  UNIQUE (org_id,period_id,source_event_id), FOREIGN KEY (org_id,period_id) REFERENCES limit_periods,
  FOREIGN KEY (org_id,hold_id) REFERENCES limit_holds,
  CHECK ((entry_kind='reserve' AND held_delta>0 AND used_delta=0)
      OR (entry_kind='release' AND held_delta<0 AND used_delta=0)
      OR (entry_kind='settle' AND held_delta<=0 AND used_delta>=0)
      OR entry_kind='adjust')
);
CREATE TABLE idempotency_keys (
  org_id uuid NOT NULL, id uuid NOT NULL, principal_id uuid NOT NULL, operation text NOT NULL, key text NOT NULL,
  request_digest bytea NOT NULL CHECK (octet_length(request_digest)=32), response_object_id uuid,
  state text NOT NULL CHECK (state IN ('pending','complete','unknown')), expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id), UNIQUE (org_id,principal_id,operation,key),
  FOREIGN KEY (org_id,principal_id) REFERENCES principals, FOREIGN KEY (org_id,response_object_id) REFERENCES protected_objects,
  CHECK (length(key) BETWEEN 1 AND 200), CHECK (expires_at>created_at)
);
CREATE TABLE outbox_events (
  org_id uuid NOT NULL, id uuid NOT NULL, aggregate_object_id uuid NOT NULL, aggregate_version bigint NOT NULL CHECK (aggregate_version>0),
  event_type text NOT NULL, payload_object_id uuid NOT NULL, available_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz, attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count>=0),
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (org_id,id),
  UNIQUE (org_id,aggregate_object_id,aggregate_version,event_type),
  FOREIGN KEY (org_id,aggregate_object_id) REFERENCES protected_objects
);
-- Integration adds outbox_events.payload_object_id -> evidence_objects; only cleaned payloads enter this table.
CREATE INDEX actions_by_run ON governed_actions (org_id,run_id,created_at,id);
CREATE INDEX objects_by_workspace ON protected_objects (org_id,workspace_id,id);
CREATE INDEX accounts_by_scope ON limit_accounts (org_id,scope_object_id,capability) WHERE state='active';
CREATE INDEX reservations_by_period ON limit_reservations (org_id,period_id,hold_id);
CREATE INDEX ledger_by_hold ON limit_ledger_entries (org_id,hold_id,posted_at,id);
-- The outbox relay runs once per organization under that organization's scope, so the index is org-prefixed.
-- There is no global cross-organization poller; FORCE ROW LEVEL SECURITY would return it nothing.
CREATE INDEX pending_outbox ON outbox_events (org_id,available_at,id) WHERE published_at IS NULL;
CREATE INDEX pending_authorizations ON action_authorizations (org_id,expires_at,id) WHERE consumed_at IS NULL;
CREATE INDEX expired_idempotency_keys ON idempotency_keys (expires_at,org_id,id);

-- Column-level write protection. Revocation, ledger, authorization, and identity columns cannot be rewritten
-- by the runtime role; triggers below make the remaining transitions one-way.
CREATE FUNCTION forbid_identity_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.org_id IS DISTINCT FROM OLD.org_id THEN RAISE EXCEPTION 'ORG_CHANGE_FORBIDDEN'; END IF;
  IF TG_TABLE_NAME IN ('protected_objects','governed_actions') AND NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
    RAISE EXCEPTION 'WORKSPACE_MOVE_FORBIDDEN'; END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION epoch_only_advances() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.epoch <= OLD.epoch THEN RAISE EXCEPTION 'EPOCH_MUST_ADVANCE'; END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION revocation_is_final() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.state='revoked' AND (NEW.state<>'revoked' OR NEW.revoked_at IS DISTINCT FROM OLD.revoked_at) THEN
    RAISE EXCEPTION 'REVOCATION_IS_FINAL'; END IF;
  IF NEW.state='revoked' AND NEW.revoked_at IS NULL THEN RAISE EXCEPTION 'REVOKED_AT_REQUIRED'; END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION idempotency_key_is_final() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.state='complete' AND NEW.state<>'complete' THEN RAISE EXCEPTION 'IDEMPOTENCY_STATE_FINAL'; END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION action_state_transition() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ok boolean;
BEGIN
  ok := (OLD.state,NEW.state) IN (('proposed','denied'),('proposed','approved'),('approved','running'),('approved','denied'),
         ('running','completed'),('running','failed'),('running','unknown'),('unknown','completed'),('unknown','failed'))
        OR OLD.state=NEW.state;
  IF NOT ok THEN RAISE EXCEPTION 'ILLEGAL_ACTION_TRANSITION % -> %', OLD.state, NEW.state; END IF;
  IF NEW.state<>OLD.state AND NEW.version<=OLD.version THEN RAISE EXCEPTION 'VERSION_MUST_ADVANCE'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protected_objects_identity BEFORE UPDATE ON protected_objects FOR EACH ROW EXECUTE FUNCTION forbid_identity_change();
CREATE TRIGGER governed_actions_identity BEFORE UPDATE ON governed_actions FOR EACH ROW EXECUTE FUNCTION forbid_identity_change();
CREATE TRIGGER governed_actions_transition BEFORE UPDATE ON governed_actions FOR EACH ROW EXECUTE FUNCTION action_state_transition();
CREATE TRIGGER authority_epochs_advance BEFORE UPDATE ON authority_epochs FOR EACH ROW EXECUTE FUNCTION epoch_only_advances();
CREATE TRIGGER principals_revocation BEFORE UPDATE ON principals FOR EACH ROW EXECUTE FUNCTION revocation_is_final();
CREATE TRIGGER idempotency_keys_final BEFORE UPDATE ON idempotency_keys FOR EACH ROW EXECUTE FUNCTION idempotency_key_is_final();

-- RLS is a floor. Per-record IAM remains mandatory at the checked API and query layer.
-- Threat model: RLS keyed on a transaction setting stops application logic that forgets a WHERE clause.
-- It does not stop SQL injection executed with the runtime role, because an injected statement can set the
-- scope itself. Services must use parameterized statements only, never build SQL from input, and a lint gate
-- must reject dynamic SQL. The design does not claim RLS defends against injection.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['principals','protected_objects','governed_actions','action_attempts',
    'action_authorizations','authority_epochs','authorization_scope_epochs','limit_definitions','limit_accounts','limit_periods',
    'limit_holds','limit_reservations','limit_ledger_entries','idempotency_keys','outbox_events'] LOOP
    EXECUTE format('ALTER TABLE oxagen.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE oxagen.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY org_scope ON oxagen.%I USING
      (org_id = nullif(current_setting(''oxagen.org_id'',true),'''')::uuid) WITH CHECK
      (org_id = nullif(current_setting(''oxagen.org_id'',true),'''')::uuid)',t);
  END LOOP;
END $$;
ALTER TABLE org.organizations ENABLE ROW LEVEL SECURITY; ALTER TABLE org.organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY org_scope ON org.organizations USING (org_id = nullif(current_setting('oxagen.org_id',true),'')::uuid)
  WITH CHECK (org_id = nullif(current_setting('oxagen.org_id',true),'')::uuid);
ALTER TABLE org.org_users ENABLE ROW LEVEL SECURITY; ALTER TABLE org.org_users FORCE ROW LEVEL SECURITY;
CREATE POLICY org_scope ON org.org_users USING (org_id = nullif(current_setting('oxagen.org_id',true),'')::uuid)
  WITH CHECK (org_id = nullif(current_setting('oxagen.org_id',true),'')::uuid);
ALTER TABLE workspace.workspaces ENABLE ROW LEVEL SECURITY; ALTER TABLE workspace.workspaces FORCE ROW LEVEL SECURITY;
CREATE POLICY org_scope ON workspace.workspaces USING (org_id = nullif(current_setting('oxagen.org_id',true),'')::uuid)
  WITH CHECK (org_id = nullif(current_setting('oxagen.org_id',true),'')::uuid);
-- A user row is visible only through a membership in the current organization. Users are global rows, so
-- the scoped runtime never lists them without that join.
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY; ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;
CREATE POLICY member_of_current_org ON auth.users USING
  (EXISTS (SELECT 1 FROM org.org_users ou WHERE ou.user_id=users.id
     AND ou.org_id = nullif(current_setting('oxagen.org_id',true),'')::uuid));
-- Workspace scope has two verified shapes. A run or workspace-admin transaction sets
-- oxagen.workspace_id and sees one workspace. An organization-admin transaction (workspace picker,
-- cross-workspace spend and audit views, org-level policy templates) sets
-- oxagen.scope_kind='org' and no workspace_id. Any other combination denies. The trusted
-- service sets scope_kind only after checking the caller's organization-level grant.
CREATE FUNCTION workspace_scope_allows(p_workspace uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path=oxagen,pg_catalog AS $$
  SELECT CASE
    WHEN nullif(current_setting('oxagen.workspace_id',true),'') IS NOT NULL
      THEN p_workspace = nullif(current_setting('oxagen.workspace_id',true),'')::uuid
    WHEN current_setting('oxagen.scope_kind',true) = 'org' THEN true
    ELSE false END
$$;
CREATE FUNCTION org_scope_allows() RETURNS boolean
LANGUAGE sql STABLE AS $$ SELECT current_setting('oxagen.scope_kind',true) = 'org' $$;
CREATE POLICY workspace_scope ON workspace.workspaces AS RESTRICTIVE USING
  (oxagen.workspace_scope_allows(id)) WITH CHECK (oxagen.workspace_scope_allows(id));
-- Org-wide objects such as principals stay readable from a workspace scope because workspace rows reference
-- them. Creating or changing an org-wide object needs org scope.
CREATE POLICY workspace_scope ON protected_objects AS RESTRICTIVE USING
  (workspace_id IS NULL OR workspace_scope_allows(workspace_id))
  WITH CHECK (CASE WHEN workspace_id IS NULL THEN org_scope_allows() ELSE workspace_scope_allows(workspace_id) END);
-- org_admin actions are the most privileged class; a workspace-scoped session may neither read nor create them.
CREATE POLICY workspace_scope ON governed_actions AS RESTRICTIVE USING
  (CASE WHEN workspace_id IS NULL THEN org_scope_allows() ELSE workspace_scope_allows(workspace_id) END)
  WITH CHECK (CASE WHEN workspace_id IS NULL THEN org_scope_allows() ELSE workspace_scope_allows(workspace_id) END);
CREATE POLICY workspace_scope ON limit_accounts AS RESTRICTIVE USING
  (workspace_id IS NULL OR workspace_scope_allows(workspace_id))
  WITH CHECK (CASE WHEN workspace_id IS NULL THEN org_scope_allows() ELSE workspace_scope_allows(workspace_id) END);
-- Child tables inherit the visible parent's workspace floor. Global IAM principals remain org-wide.
CREATE POLICY action_scope ON action_attempts AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM governed_actions a WHERE a.org_id=action_attempts.org_id AND a.id=action_attempts.action_id));
CREATE POLICY action_scope ON action_authorizations AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM governed_actions a WHERE a.org_id=action_authorizations.org_id AND a.id=action_authorizations.action_id));
CREATE POLICY scope_object ON authority_epochs AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM protected_objects o WHERE o.org_id=authority_epochs.org_id AND o.id=authority_epochs.scope_object_id));
CREATE POLICY parent_scope ON authorization_scope_epochs AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM action_authorizations a WHERE a.org_id=authorization_scope_epochs.org_id AND a.id=authorization_scope_epochs.authorization_id));
CREATE POLICY account_scope ON limit_periods AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM limit_accounts a WHERE a.org_id=limit_periods.org_id AND a.id=limit_periods.account_id));
CREATE POLICY action_scope ON limit_holds AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM governed_actions a WHERE a.org_id=limit_holds.org_id AND a.id=limit_holds.action_id));
CREATE POLICY hold_scope ON limit_reservations AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM limit_holds h WHERE h.org_id=limit_reservations.org_id AND h.id=limit_reservations.hold_id));
CREATE POLICY period_scope ON limit_ledger_entries AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM limit_periods p WHERE p.org_id=limit_ledger_entries.org_id AND p.id=limit_ledger_entries.period_id));
CREATE POLICY object_scope ON outbox_events AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM protected_objects o WHERE o.org_id=outbox_events.org_id AND o.id=outbox_events.aggregate_object_id));
-- Without an explicit WITH CHECK, PostgreSQL applies these USING expressions to new rows too.
GRANT USAGE ON SCHEMA auth,org,workspace,oxagen TO oxagen_runtime;
GRANT SELECT ON auth.users TO oxagen_runtime;
GRANT SELECT,INSERT ON org.organizations,org.org_users,workspace.workspaces TO oxagen_runtime;
GRANT UPDATE (state) ON org.organizations TO oxagen_runtime;
GRANT UPDATE (membership_role,state,removed_at) ON org.org_users TO oxagen_runtime;
GRANT UPDATE (name,settings_revision,state) ON workspace.workspaces TO oxagen_runtime;
GRANT SELECT,INSERT ON ALL TABLES IN SCHEMA oxagen TO oxagen_runtime;
-- No table in oxagen is fully updatable by the runtime role. Each grant below names the columns a
-- transition may touch; identity, scope, digest, and posted amounts are never among them.
GRANT UPDATE (state,revoked_at,display_name) ON principals TO oxagen_runtime;
GRANT UPDATE (deleted_at) ON protected_objects TO oxagen_runtime;
GRANT UPDATE (state,version) ON governed_actions TO oxagen_runtime;
GRANT UPDATE (state,started_at,finished_at) ON action_attempts TO oxagen_runtime;
GRANT UPDATE (epoch,changed_at,reason_code) ON authority_epochs TO oxagen_runtime;
GRANT UPDATE (state) ON limit_definitions TO oxagen_runtime;
GRANT UPDATE (state,rule_revision_id) ON limit_accounts TO oxagen_runtime;
GRANT UPDATE (effective_cap_minor,cap_fact_id,used_minor,held_minor,version,frozen) ON limit_periods TO oxagen_runtime;
GRANT UPDATE (state,expires_at) ON limit_holds TO oxagen_runtime;
GRANT UPDATE (consumed_at) ON action_authorizations TO oxagen_runtime;
GRANT UPDATE (state,response_object_id) ON idempotency_keys TO oxagen_runtime;
GRANT UPDATE (available_at,published_at,attempt_count) ON outbox_events TO oxagen_runtime;
-- Never grant this role to a browser/agent or expose arbitrary SQL. Session settings are not unforgeable identity.
-- A trusted service begins EVERY transaction with set_config(..., true) for verified org/workspace scope.
-- Use transaction-mode connection pooling only. Session-mode pooling or a plain SET (not SET LOCAL /
-- set_config(..., true)) can leak one organization's scope into the next borrower of the connection.
-- Missing scope returns no rows; invalid UUID scope errors. SET LOCAL resets on commit/rollback, preventing pool leakage.
--
-- Lock order for every writer that touches money: governed_actions row, then limit_accounts rows in id order
-- one at a time, then limit_periods rows in id order one at a time, then limit_holds, then effect state.
-- Settlement, release, and adjustment follow this same order. ORDER BY ... FOR UPDATE does not guarantee
-- acquisition order in PostgreSQL, so the procedure locks one row per iteration over a sorted array.
CREATE FUNCTION reserve_limit_hold(p_org uuid,p_hold uuid,p_action uuid,p_attempt uuid,
  p_scope_object_ids uuid[],p_periods uuid[],p_amounts bigint[],p_reservation_ids uuid[],p_ledger_ids uuid[]) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path=oxagen,pg_catalog AS $$
DECLARE n integer; i integer; found_count integer; required_count integer; p record; v_capability text;
        v_account_ids uuid[]; v_period_ids uuid[]; v_id uuid;
BEGIN
  IF p_org IS DISTINCT FROM nullif(current_setting('oxagen.org_id',true),'')::uuid THEN
    RAISE EXCEPTION 'SCOPE_MISMATCH'; END IF;
  n:=cardinality(p_periods);
  IF n IS NULL OR n=0 OR cardinality(p_amounts) IS DISTINCT FROM n
     OR cardinality(p_reservation_ids) IS DISTINCT FROM n OR cardinality(p_ledger_ids) IS DISTINCT FROM n
     OR cardinality(p_scope_object_ids) IS NULL OR cardinality(p_scope_object_ids)=0
     OR array_ndims(p_periods)<>1 OR array_ndims(p_amounts)<>1
     OR array_ndims(p_reservation_ids)<>1 OR array_ndims(p_ledger_ids)<>1
     OR array_lower(p_periods,1)<>1 OR array_lower(p_amounts,1)<>1
     OR array_lower(p_reservation_ids,1)<>1 OR array_lower(p_ledger_ids,1)<>1 THEN
    RAISE EXCEPTION 'INVALID_RESERVATION'; END IF;
  IF (SELECT count(DISTINCT v) FROM unnest(p_periods) AS u(v))<>n
     OR EXISTS (SELECT 1 FROM unnest(p_amounts) AS u(v) WHERE v IS NULL OR v<=0) THEN
    RAISE EXCEPTION 'INVALID_RESERVATION'; END IF;
  SELECT capability INTO v_capability FROM governed_actions WHERE org_id=p_org AND id=p_action FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACTION_NOT_FOUND'; END IF;
  -- Reserve once per attempt. The action row lock above serializes duplicate callers, so a second caller
  -- finds the existing hold here and returns it instead of dispatching twice.
  IF EXISTS (SELECT 1 FROM limit_holds WHERE org_id=p_org AND attempt_id=p_attempt) THEN
    RETURN 'EXISTING_HOLD'; END IF;
  -- Bucket completeness: every active account for this capability on the action's scope chain must be
  -- covered by exactly one supplied period. An omitted bucket is an error, not a smaller reservation.
  SELECT count(*) INTO required_count FROM limit_accounts a
    WHERE a.org_id=p_org AND a.state='active' AND a.capability=v_capability AND a.scope_object_id=ANY(p_scope_object_ids);
  SELECT array_agg(DISTINCT b.account_id ORDER BY b.account_id) INTO v_account_ids
    FROM limit_periods b WHERE b.org_id=p_org AND b.id=ANY(p_periods);
  IF required_count<>n OR cardinality(v_account_ids) IS DISTINCT FROM n
     OR EXISTS (SELECT 1 FROM unnest(v_account_ids) AS u(v) LEFT JOIN limit_accounts a
                ON a.org_id=p_org AND a.id=u.v AND a.state='active' AND a.capability=v_capability
                   AND a.scope_object_id=ANY(p_scope_object_ids) WHERE a.id IS NULL) THEN
    RAISE EXCEPTION 'INCOMPLETE_SCOPE'; END IF;
  -- Lock accounts, then periods, one row per iteration in sorted id order (see lock order note above).
  FOREACH v_id IN ARRAY v_account_ids LOOP
    PERFORM 1 FROM limit_accounts WHERE org_id=p_org AND id=v_id FOR UPDATE;
  END LOOP;
  SELECT array_agg(v ORDER BY v) INTO v_period_ids FROM unnest(p_periods) AS u(v);
  found_count:=0;
  FOREACH v_id IN ARRAY v_period_ids LOOP
    PERFORM 1 FROM limit_periods WHERE org_id=p_org AND id=v_id FOR UPDATE;
    IF FOUND THEN found_count:=found_count+1; END IF;
  END LOOP;
  IF found_count<>n THEN RAISE EXCEPTION 'BUCKET_NOT_FOUND'; END IF;
  FOR i IN 1..n LOOP
    SELECT b.*,a.state AS account_state,a.cap_kind,a.currency,a.period_kind INTO p FROM limit_periods b JOIN limit_accounts a
      ON a.org_id=b.org_id AND a.id=b.account_id WHERE b.org_id=p_org AND b.id=p_periods[i];
    IF p.cap_kind<>'fixed' OR p.currency<>'USD' THEN RAISE EXCEPTION 'FULL_PRICING_GATE_REQUIRED'; END IF;
    IF clock_timestamp()<p.period_start OR clock_timestamp()>=p.period_end THEN RAISE EXCEPTION 'PERIOD_STALE'; END IF;
    IF p.frozen OR p.account_state<>'active' OR p.used_minor::numeric+p.held_minor::numeric+p_amounts[i]::numeric>p.effective_cap_minor::numeric THEN
      RAISE EXCEPTION 'LIMIT_EXCEEDED'; END IF;
  END LOOP;
  INSERT INTO limit_holds(org_id,id,action_id,attempt_id,state) VALUES(p_org,p_hold,p_action,p_attempt,'held');
  FOR i IN 1..n LOOP
    INSERT INTO limit_reservations(org_id,id,hold_id,period_id,amount_minor,currency)
      SELECT p_org,p_reservation_ids[i],p_hold,b.id,p_amounts[i],a.currency FROM limit_periods b JOIN limit_accounts a
      ON a.org_id=b.org_id AND a.id=b.account_id WHERE b.org_id=p_org AND b.id=p_periods[i];
    UPDATE limit_periods SET held_minor=held_minor+p_amounts[i],version=version+1 WHERE org_id=p_org AND id=p_periods[i];
    INSERT INTO limit_ledger_entries(org_id,id,period_id,hold_id,entry_kind,held_delta,used_delta,source_event_id)
      VALUES(p_org,p_ledger_ids[i],p_periods[i],p_hold,'reserve',p_amounts[i],0,p_hold);
  END LOOP;
  RETURN 'HELD';
END $$;
REVOKE ALL ON FUNCTION reserve_limit_hold(uuid,uuid,uuid,uuid,uuid[],uuid[],bigint[],uuid[],uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_limit_hold(uuid,uuid,uuid,uuid,uuid[],uuid[],bigint[],uuid[],uuid[]) TO oxagen_runtime;
-- Example reserves current fixed USD caps; ratio and FX admission require full procedures; pricing/FX contexts must use the full gate, not this helper alone.
-- Call in ONE transaction with identity/epoch checks, action version, sanitized evidence and outbox write.
-- Any exception aborts the statement; the service MUST ROLLBACK the whole transaction, never commit partial work.
-- Before provider dispatch, consume exactly one current authorization and write dispatch/outbox atomically:
-- UPDATE action_authorizations SET consumed_at=clock_timestamp()
-- WHERE org_id=:verified_org AND id=:authorization AND consumed_at IS NULL
--   AND expires_at>clock_timestamp() AND run_control_epoch IS NOT DISTINCT FROM :verified_run_epoch
--   AND owner_epoch IS NOT DISTINCT FROM :verified_owner_epoch
--   AND request_digest=:cleaned_wire_digest AND audience_principal_id=:verified_gateway
-- RETURNING id;  -- require one row after locking/checking ALL scope epochs, complete scope_count, scan, policies and holds.
-- Settlement locks the action, then accounts, then periods in the same order; replaces held with used; appends unique postings.
-- It requires a trusted receipt and cannot release unknown liability because a timeout or expiry occurred.
-- Omits settlement, all-policy evaluation joins, source/price/FX tables and their FKs; see the full typed catalog.
-- It is not a production admission API: interval/fact/FX checks and complete scope resolution are required integration gates.
```
