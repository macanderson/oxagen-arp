-- Proposed, self-contained PostgreSQL subset; run as a migration owner in an empty database.
-- UUIDs come from the caller. External object, run, scan and evidence FKs are added by integration.
-- Structurally reviewed, not executed: no PostgreSQL runtime was available. This is not a full migration.
CREATE SCHEMA oxagen;
CREATE ROLE oxagen_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS;
SET search_path = oxagen, pg_catalog;
CREATE TABLE tenants (
  tenant_id uuid PRIMARY KEY, name text NOT NULL,
  state text NOT NULL CHECK (state IN ('active','suspended','closing')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE workspaces (
  tenant_id uuid NOT NULL REFERENCES tenants, id uuid NOT NULL, object_id uuid NOT NULL,
  name text NOT NULL, slug text NOT NULL, settings_revision bigint NOT NULL DEFAULT 1 CHECK (settings_revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,slug), UNIQUE (tenant_id,object_id)
);
CREATE TABLE principals (
  tenant_id uuid NOT NULL REFERENCES tenants, id uuid NOT NULL, object_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('human','agent','service','plugin')), display_name text NOT NULL,
  state text NOT NULL CHECK (state IN ('active','suspended','revoked')), revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,object_id)
);
CREATE TABLE protected_objects (
  tenant_id uuid NOT NULL REFERENCES tenants, id uuid NOT NULL, workspace_id uuid,
  kind text NOT NULL, deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id), FOREIGN KEY (tenant_id,workspace_id) REFERENCES workspaces DEFERRABLE INITIALLY DEFERRED
);
ALTER TABLE workspaces ADD FOREIGN KEY (tenant_id,object_id) REFERENCES protected_objects DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE principals ADD FOREIGN KEY (tenant_id,object_id) REFERENCES protected_objects DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE governed_actions (
  tenant_id uuid NOT NULL REFERENCES tenants, id uuid NOT NULL, object_id uuid NOT NULL,
  workspace_id uuid, run_id uuid, principal_id uuid NOT NULL, capability text NOT NULL,
  context_kind text NOT NULL CHECK (context_kind IN ('run','workspace_admin','tenant_admin')),
  state text NOT NULL CHECK (state IN ('proposed','denied','approved','running','completed','failed','unknown')),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0), input_object_id uuid NOT NULL, scan_receipt_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,object_id),
  FOREIGN KEY (tenant_id,workspace_id) REFERENCES workspaces,
  FOREIGN KEY (tenant_id,principal_id) REFERENCES principals,
  FOREIGN KEY (tenant_id,object_id) REFERENCES protected_objects,
  CHECK ((context_kind='run' AND workspace_id IS NOT NULL AND run_id IS NOT NULL)
      OR (context_kind='workspace_admin' AND workspace_id IS NOT NULL AND run_id IS NULL)
      OR (context_kind='tenant_admin' AND workspace_id IS NULL AND run_id IS NULL))
);
-- Full schema adds run_id -> runs, input_object_id -> evidence_objects, scan_receipt_id -> scan_receipts.
CREATE TABLE action_attempts (
  tenant_id uuid NOT NULL, id uuid NOT NULL, action_id uuid NOT NULL, attempt_no integer NOT NULL CHECK (attempt_no > 0),
  state text NOT NULL CHECK (state IN ('proposed','authorized','dispatched','completed','failed','unknown')),
  provider_idempotency_key text, started_at timestamptz, finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,action_id,attempt_no), UNIQUE (tenant_id,action_id,id),
  FOREIGN KEY (tenant_id,action_id) REFERENCES governed_actions,
  CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at)
);
CREATE TABLE action_authorizations (
  tenant_id uuid NOT NULL, id uuid NOT NULL, action_id uuid NOT NULL, attempt_id uuid NOT NULL,
  decision_id uuid NOT NULL, audience_principal_id uuid NOT NULL, scan_receipt_id uuid NOT NULL,
  request_digest bytea NOT NULL CHECK (octet_length(request_digest)=32),
  run_control_epoch bigint CHECK (run_control_epoch>=0), owner_epoch bigint CHECK (owner_epoch>0),
  scope_count integer NOT NULL CHECK (scope_count>0), expires_at timestamptz NOT NULL, consumed_at timestamptz,
  proof_object_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,attempt_id), FOREIGN KEY (tenant_id,action_id,attempt_id) REFERENCES action_attempts (tenant_id,action_id,id),
  FOREIGN KEY (tenant_id,audience_principal_id) REFERENCES principals, CHECK (expires_at > created_at),
  CHECK ((run_control_epoch IS NULL)=(owner_epoch IS NULL))
);
CREATE TABLE authority_epochs (
  tenant_id uuid NOT NULL, id uuid NOT NULL, scope_object_id uuid NOT NULL, epoch bigint NOT NULL DEFAULT 1 CHECK (epoch>0),
  changed_at timestamptz NOT NULL DEFAULT now(), reason_code text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,scope_object_id), FOREIGN KEY (tenant_id,scope_object_id) REFERENCES protected_objects
);
CREATE TABLE authorization_scope_epochs (
  tenant_id uuid NOT NULL, id uuid NOT NULL, authorization_id uuid NOT NULL, scope_object_id uuid NOT NULL,
  observed_epoch bigint NOT NULL CHECK (observed_epoch>0), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,authorization_id,scope_object_id), FOREIGN KEY (tenant_id,authorization_id) REFERENCES action_authorizations,
  FOREIGN KEY (tenant_id,scope_object_id) REFERENCES authority_epochs (tenant_id,scope_object_id)
);
-- Integration adds decision_id -> matching authorization_decisions, scan_receipt_id -> scan_receipts,
-- proof_object_id -> evidence_objects. Signed proofs contain no live bearer credential.
CREATE TABLE limit_accounts (
  tenant_id uuid NOT NULL, id uuid NOT NULL, object_id uuid NOT NULL, scope_object_id uuid NOT NULL,
  capability text NOT NULL, currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'), charge_unit text NOT NULL,
  rule_revision_id uuid NOT NULL, cap_kind text NOT NULL CHECK (cap_kind IN ('fixed','ratio')),
  cap_minor bigint, ratio_numerator bigint, ratio_denominator bigint,
  period_kind text NOT NULL CHECK (period_kind IN ('lifetime','calendar_day','rolling')),
  timezone_name text NOT NULL, event_basis text NOT NULL, state text NOT NULL CHECK (state IN ('active','frozen','closed')),
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,object_id),
  FOREIGN KEY (tenant_id,object_id) REFERENCES protected_objects,
  FOREIGN KEY (tenant_id,scope_object_id) REFERENCES protected_objects,
  CHECK ((cap_kind='fixed' AND cap_minor IS NOT NULL AND cap_minor>=0 AND ratio_numerator IS NULL AND ratio_denominator IS NULL)
      OR (cap_kind='ratio' AND cap_minor IS NULL AND ratio_numerator IS NOT NULL AND ratio_denominator IS NOT NULL
          AND ratio_numerator>=0 AND ratio_denominator>0 AND ratio_numerator<=ratio_denominator))
);
-- Integration adds rule_revision_id -> policy_revisions. Rolling windows require serialized overlap accounting.
CREATE TABLE limit_periods (
  tenant_id uuid NOT NULL, id uuid NOT NULL, account_id uuid NOT NULL,
  cap_fact_id uuid, period_start timestamptz NOT NULL, period_end timestamptz NOT NULL,
  effective_cap_minor bigint NOT NULL CHECK (effective_cap_minor>=0),
  used_minor bigint NOT NULL DEFAULT 0 CHECK (used_minor>=0), held_minor bigint NOT NULL DEFAULT 0 CHECK (held_minor>=0),
  version bigint NOT NULL DEFAULT 1 CHECK (version>0), frozen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,account_id,period_start),
  FOREIGN KEY (tenant_id,account_id) REFERENCES limit_accounts, CHECK (period_end>period_start)
);
CREATE TABLE limit_holds (
  tenant_id uuid NOT NULL, id uuid NOT NULL, action_id uuid NOT NULL, attempt_id uuid NOT NULL,
  state text NOT NULL CHECK (state IN ('held','settled','released','unknown')), expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,attempt_id),
  FOREIGN KEY (tenant_id,action_id,attempt_id) REFERENCES action_attempts (tenant_id,action_id,id)
);
CREATE TABLE limit_reservations (
  tenant_id uuid NOT NULL, id uuid NOT NULL, hold_id uuid NOT NULL, period_id uuid NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor>0), currency char(3) NOT NULL, fx_quote_id uuid, price_schedule_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,hold_id,period_id),
  FOREIGN KEY (tenant_id,hold_id) REFERENCES limit_holds, FOREIGN KEY (tenant_id,period_id) REFERENCES limit_periods
);
CREATE TABLE limit_ledger_entries (
  tenant_id uuid NOT NULL, id uuid NOT NULL, period_id uuid NOT NULL, hold_id uuid,
  entry_kind text NOT NULL CHECK (entry_kind IN ('reserve','release','settle','adjust')),
  held_delta bigint NOT NULL, used_delta bigint NOT NULL, source_event_id uuid NOT NULL,
  posted_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,period_id,source_event_id), FOREIGN KEY (tenant_id,period_id) REFERENCES limit_periods,
  FOREIGN KEY (tenant_id,hold_id) REFERENCES limit_holds,
  CHECK ((entry_kind='reserve' AND held_delta>0 AND used_delta=0)
      OR (entry_kind='release' AND held_delta<0 AND used_delta=0)
      OR (entry_kind='settle' AND held_delta<=0 AND used_delta>=0)
      OR entry_kind='adjust')
);
CREATE TABLE idempotency_keys (
  tenant_id uuid NOT NULL, id uuid NOT NULL, principal_id uuid NOT NULL, operation text NOT NULL, key text NOT NULL,
  request_digest bytea NOT NULL CHECK (octet_length(request_digest)=32), response_object_id uuid,
  state text NOT NULL CHECK (state IN ('pending','complete','unknown')), expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,principal_id,operation,key),
  FOREIGN KEY (tenant_id,principal_id) REFERENCES principals, FOREIGN KEY (tenant_id,response_object_id) REFERENCES protected_objects,
  CHECK (length(key) BETWEEN 1 AND 200), CHECK (expires_at>created_at)
);
CREATE TABLE outbox_events (
  tenant_id uuid NOT NULL, id uuid NOT NULL, aggregate_object_id uuid NOT NULL, aggregate_version bigint NOT NULL CHECK (aggregate_version>0),
  event_type text NOT NULL, payload_object_id uuid NOT NULL, available_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz, attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count>=0),
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,aggregate_object_id,aggregate_version,event_type),
  FOREIGN KEY (tenant_id,aggregate_object_id) REFERENCES protected_objects
);
-- Integration adds outbox_events.payload_object_id -> evidence_objects; only cleaned payloads enter this table.
CREATE INDEX actions_by_run ON governed_actions (tenant_id,run_id,created_at,id);
CREATE INDEX objects_by_workspace ON protected_objects (tenant_id,workspace_id,id);
CREATE INDEX reservations_by_period ON limit_reservations (tenant_id,period_id,hold_id);
CREATE INDEX ledger_by_hold ON limit_ledger_entries (tenant_id,hold_id,posted_at,id);
CREATE INDEX pending_outbox ON outbox_events (available_at,id) WHERE published_at IS NULL;
CREATE INDEX pending_authorizations ON action_authorizations (tenant_id,expires_at,id) WHERE consumed_at IS NULL;
-- RLS is a floor. Per-record IAM remains mandatory at the checked API and query layer.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['tenants','workspaces','principals','protected_objects','governed_actions','action_attempts',
    'action_authorizations','authority_epochs','authorization_scope_epochs','limit_accounts','limit_periods','limit_holds','limit_reservations','limit_ledger_entries','idempotency_keys','outbox_events'] LOOP
    EXECUTE format('ALTER TABLE oxagen.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE oxagen.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY tenant_scope ON oxagen.%I USING
      (tenant_id = nullif(current_setting(''oxagen.tenant_id'',true),'''')::uuid) WITH CHECK
      (tenant_id = nullif(current_setting(''oxagen.tenant_id'',true),'''')::uuid)',t);
  END LOOP;
END $$;
CREATE POLICY workspace_scope ON workspaces AS RESTRICTIVE USING
  (id=nullif(current_setting('oxagen.workspace_id',true),'')::uuid)
  WITH CHECK (id=nullif(current_setting('oxagen.workspace_id',true),'')::uuid);
CREATE POLICY workspace_scope ON protected_objects AS RESTRICTIVE USING
  (workspace_id IS NULL OR workspace_id=nullif(current_setting('oxagen.workspace_id',true),'')::uuid)
  WITH CHECK (workspace_id IS NULL OR workspace_id=nullif(current_setting('oxagen.workspace_id',true),'')::uuid);
CREATE POLICY workspace_scope ON governed_actions AS RESTRICTIVE USING
  (workspace_id IS NULL OR workspace_id=nullif(current_setting('oxagen.workspace_id',true),'')::uuid)
  WITH CHECK (workspace_id IS NULL OR workspace_id=nullif(current_setting('oxagen.workspace_id',true),'')::uuid);
-- Child tables inherit the visible parent's workspace floor. Global IAM principals remain tenant-wide.
CREATE POLICY action_scope ON action_attempts AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM governed_actions a WHERE a.tenant_id=action_attempts.tenant_id AND a.id=action_attempts.action_id));
CREATE POLICY action_scope ON action_authorizations AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM governed_actions a WHERE a.tenant_id=action_authorizations.tenant_id AND a.id=action_authorizations.action_id));
CREATE POLICY scope_object ON authority_epochs AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM protected_objects o WHERE o.tenant_id=authority_epochs.tenant_id AND o.id=authority_epochs.scope_object_id));
CREATE POLICY parent_scope ON authorization_scope_epochs AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM action_authorizations a WHERE a.tenant_id=authorization_scope_epochs.tenant_id AND a.id=authorization_scope_epochs.authorization_id));
CREATE POLICY object_scope ON limit_accounts AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM protected_objects o WHERE o.tenant_id=limit_accounts.tenant_id AND o.id=limit_accounts.scope_object_id));
CREATE POLICY account_scope ON limit_periods AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM limit_accounts a WHERE a.tenant_id=limit_periods.tenant_id AND a.id=limit_periods.account_id));
CREATE POLICY action_scope ON limit_holds AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM governed_actions a WHERE a.tenant_id=limit_holds.tenant_id AND a.id=limit_holds.action_id));
CREATE POLICY hold_scope ON limit_reservations AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM limit_holds h WHERE h.tenant_id=limit_reservations.tenant_id AND h.id=limit_reservations.hold_id));
CREATE POLICY period_scope ON limit_ledger_entries AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM limit_periods p WHERE p.tenant_id=limit_ledger_entries.tenant_id AND p.id=limit_ledger_entries.period_id));
CREATE POLICY object_scope ON outbox_events AS RESTRICTIVE USING
  (EXISTS (SELECT 1 FROM protected_objects o WHERE o.tenant_id=outbox_events.tenant_id AND o.id=outbox_events.aggregate_object_id));
-- Without an explicit WITH CHECK, PostgreSQL applies these USING expressions to new rows too.
GRANT USAGE ON SCHEMA oxagen TO oxagen_runtime;
GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA oxagen TO oxagen_runtime;
REVOKE UPDATE ON limit_ledger_entries,limit_reservations,limit_periods,limit_holds,action_authorizations,authorization_scope_epochs,outbox_events FROM oxagen_runtime;
GRANT UPDATE (effective_cap_minor,cap_fact_id,used_minor,held_minor,version,frozen) ON limit_periods TO oxagen_runtime;
GRANT UPDATE (state,expires_at) ON limit_holds TO oxagen_runtime;
GRANT UPDATE (consumed_at) ON action_authorizations TO oxagen_runtime;
GRANT UPDATE (available_at,published_at,attempt_count) ON outbox_events TO oxagen_runtime;
-- Never grant this role to a browser/agent or expose arbitrary SQL. Session settings are not unforgeable identity.
-- A trusted service begins EVERY transaction with set_config(..., true) for verified tenant/workspace scope.
-- Missing scope returns no rows; invalid UUID scope errors. SET LOCAL resets on commit/rollback, preventing pool leakage.
CREATE FUNCTION reserve_limit_hold(p_tenant uuid,p_hold uuid,p_action uuid,p_attempt uuid,
  p_periods uuid[],p_amounts bigint[],p_reservation_ids uuid[],p_ledger_ids uuid[]) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=oxagen,pg_catalog AS $$
DECLARE n integer; i integer; found_count integer; p record;
BEGIN
  IF p_tenant IS DISTINCT FROM nullif(current_setting('oxagen.tenant_id',true),'')::uuid THEN
    RAISE EXCEPTION 'SCOPE_MISMATCH'; END IF;
  n:=cardinality(p_periods);
  IF n IS NULL OR n=0 OR cardinality(p_amounts) IS DISTINCT FROM n
     OR cardinality(p_reservation_ids) IS DISTINCT FROM n OR cardinality(p_ledger_ids) IS DISTINCT FROM n
     OR array_ndims(p_periods)<>1 OR array_ndims(p_amounts)<>1
     OR array_ndims(p_reservation_ids)<>1 OR array_ndims(p_ledger_ids)<>1
     OR array_lower(p_periods,1)<>1 OR array_lower(p_amounts,1)<>1
     OR array_lower(p_reservation_ids,1)<>1 OR array_lower(p_ledger_ids,1)<>1 THEN
    RAISE EXCEPTION 'INVALID_RESERVATION'; END IF;
  IF (SELECT count(DISTINCT v) FROM unnest(p_periods) AS u(v))<>n
     OR EXISTS (SELECT 1 FROM unnest(p_amounts) AS u(v) WHERE v IS NULL OR v<=0) THEN
    RAISE EXCEPTION 'INVALID_RESERVATION'; END IF;
  PERFORM id FROM governed_actions WHERE tenant_id=p_tenant AND id=p_action FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACTION_NOT_FOUND'; END IF;
  -- Trusted authority resolves complete buckets, current epochs, period/fact/FX validity; caller cannot choose them.
  -- Lock account rows first so rule/cap changes cannot race admission; all other writers use this order.
  PERFORM a.id FROM limit_accounts a WHERE a.tenant_id=p_tenant AND a.id IN
    (SELECT account_id FROM limit_periods WHERE tenant_id=p_tenant AND id=ANY(p_periods)) ORDER BY a.id FOR UPDATE;
  PERFORM id FROM limit_periods WHERE tenant_id=p_tenant AND id=ANY(p_periods) ORDER BY id FOR UPDATE;
  GET DIAGNOSTICS found_count=ROW_COUNT;
  IF found_count<>n THEN RAISE EXCEPTION 'BUCKET_NOT_FOUND'; END IF;
  FOR i IN 1..n LOOP
    SELECT b.*,a.state AS account_state,a.cap_kind,a.currency,a.period_kind INTO p FROM limit_periods b JOIN limit_accounts a
      ON a.tenant_id=b.tenant_id AND a.id=b.account_id WHERE b.tenant_id=p_tenant AND b.id=p_periods[i];
    IF p.cap_kind<>'fixed' OR p.period_kind='rolling' OR p.currency<>'USD' THEN RAISE EXCEPTION 'FULL_PRICING_GATE_REQUIRED'; END IF;
    IF clock_timestamp()<p.period_start OR clock_timestamp()>=p.period_end THEN RAISE EXCEPTION 'PERIOD_STALE'; END IF;
    IF p.frozen OR p.account_state<>'active' OR p.used_minor::numeric+p.held_minor::numeric+p_amounts[i]::numeric>p.effective_cap_minor::numeric THEN
      RAISE EXCEPTION 'LIMIT_EXCEEDED'; END IF;
  END LOOP;
  INSERT INTO limit_holds(tenant_id,id,action_id,attempt_id,state) VALUES(p_tenant,p_hold,p_action,p_attempt,'held');
  -- UNIQUE attempt means reserve once. Duplicate callers read the existing result; they never dispatch twice.
  FOR i IN 1..n LOOP
    INSERT INTO limit_reservations(tenant_id,id,hold_id,period_id,amount_minor,currency)
      SELECT p_tenant,p_reservation_ids[i],p_hold,b.id,p_amounts[i],a.currency FROM limit_periods b JOIN limit_accounts a
      ON a.tenant_id=b.tenant_id AND a.id=b.account_id WHERE b.tenant_id=p_tenant AND b.id=p_periods[i];
    UPDATE limit_periods SET held_minor=held_minor+p_amounts[i],version=version+1 WHERE tenant_id=p_tenant AND id=p_periods[i];
    INSERT INTO limit_ledger_entries(tenant_id,id,period_id,hold_id,entry_kind,held_delta,used_delta,source_event_id)
      VALUES(p_tenant,p_ledger_ids[i],p_periods[i],p_hold,'reserve',p_amounts[i],0,p_hold);
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION reserve_limit_hold(uuid,uuid,uuid,uuid,uuid[],bigint[],uuid[],uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_limit_hold(uuid,uuid,uuid,uuid,uuid[],bigint[],uuid[],uuid[]) TO oxagen_runtime;
-- Example reserves current fixed USD caps; ratio, rolling and FX admission require full procedures; pricing/FX contexts must use the full gate, not this helper alone.
-- Call in ONE transaction with identity/epoch checks, action version, sanitized evidence and outbox write.
-- Any exception aborts the statement; the service MUST ROLLBACK the whole transaction, never commit partial work.
-- Before provider dispatch, consume exactly one current authorization and write dispatch/outbox atomically:
-- UPDATE action_authorizations SET consumed_at=clock_timestamp()
-- WHERE tenant_id=:verified_tenant AND id=:authorization AND consumed_at IS NULL
--   AND expires_at>clock_timestamp() AND run_control_epoch IS NOT DISTINCT FROM :verified_run_epoch
--   AND owner_epoch IS NOT DISTINCT FROM :verified_owner_epoch
--   AND request_digest=:cleaned_wire_digest AND audience_principal_id=:verified_gateway
-- RETURNING id;  -- require one row after locking/checking ALL scope epochs, complete scope_count, scan, policies and holds.
-- Settlement locks accounts then periods in the same order; replaces held with used; appends unique postings.
-- It requires a trusted receipt and cannot release unknown liability because a timeout or expiry occurred.
-- Omits settlement, all-policy evaluation joins, source/price/FX tables and their FKs; see the full typed catalog.
-- It is not a production admission API: interval/fact/FX checks and complete scope resolution are required integration gates.
