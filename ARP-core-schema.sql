-- Proposed, self-contained PostgreSQL subset; run as a migration owner in an empty database.
-- UUIDs come from the caller. External object, run, scan and evidence FKs are added by integration.
-- Executed on PostgreSQL 16 on 2026-09-20 (see AUDIT.md): loads cleanly; organization, workspace,
-- revocation-fence and concurrent-hold tests pass. This is still a representative subset, not a full migration.
--
-- Schemas follow the product: auth holds sign-in users, org holds organizations and their members,
-- workspace holds workspaces, oxagen holds the ARP control records. An organization is the customer
-- account; older prose calls it a tenant. Every private row carries org_id.
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
