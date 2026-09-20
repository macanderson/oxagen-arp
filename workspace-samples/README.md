# Proposed `.oxagen` export examples

These are design examples, not live workspace files or proof of a real run. Every ID and Git commit is invented. The sync lock names a pre-run tool resolution; the run receipt names the final run tool-belt snapshot and actual composition. Neither prepared data nor a local file is evidence of model delivery. The receipt contains an all-zero example signature that a real verifier must reject. The JSON examples pass their structural schemas; that does not make them authorized.

`project/` shows a small repo. Its `.oxagen` folder contains reference-only configuration and pinned JSON Schema files. `project/.oxagen/state/sync-lock.json` shows an ignored local mirror. `examples/run-start-receipt.json` shows the shape of a trusted start receipt. It is outside the repo tree on purpose.

## Files and owners

| File | Owner and purpose |
| --- | --- |
| `.oxagen/workspace.json` | Repo-managed request for an existing workspace, repo, data plane, agent release, and mode. The service checks each reference against Oxagen. |
| `.oxagen/context.json` | Repo-managed list of desired context sources. Oxagen source references pin a record and revision; VCS sources resolve at the checked-out snapshot. |
| `.oxagen/steering.json` | Repo-managed task guidance requested at turn start. It grants no rights and is not a higher-priority system policy. |
| `.oxagen/schemas/*.json` | Versioned format definitions for review and editor help. The trusted service uses its own approved copy, never an untrusted schema from the repo. |
| `.oxagen/state/sync-lock.json` | Ignored receipt mirror showing loaded versions. Deleting or editing it cannot change the protected service's state. |
| `examples/run-start-receipt.json` | Illustrative export of the actual run, first model attempt, loaded manifests, and scan references required to confirm setup. |

The protected service stores enrollment, credentials, authoritative sync receipts, safe context caches, and scope outside the repo. A repo can request a context source but cannot grant its reader access. Commit exports only if their IDs and names are approved for everyone who can read that repo.

## Exact schema profile

Register the harness target first, then link the checkout to that target. This avoids requiring a checkout binding before its target exists.

The proposed format is `arp.repo/0.2`. Schemas use JSON Schema 2020-12, reject unknown properties, and declare required fields. Ship the schemas together and resolve the fixed URN IDs from a local registry. Do not fetch an arbitrary `$schema` URL supplied by a repo. Also reject duplicate JSON keys before validation.

The six schema files cover common types, workspace references, context, steering, sync locks, and run-start receipts. An optional context source may be omitted with a safe reason. A required missing source blocks sync and launch. An omitted entry contains no hidden record metadata.

Schema validation is one check. The service must also enforce:

- Same-tenant and same-workspace membership for every referenced record.
- Current rights, policy versions, expiry, and revocation.
- Unique entry keys and one instance of each required config path.
- Repo-relative paths resolved through trusted handles; no symlink escape, alternate encoding, or scan-to-use race.
- Valid source versions and immutable cleaned artifact bytes.
- Correct ordering of times and no stale authority epoch.
- Manifest contents matching the actual model request.
- Trusted issuer and signature verification on a receipt retrieved through the authenticated API.

The sample checksums of local files describe the sample's clean bytes. A blocked original is never uploaded or fingerprinted to prove what was removed. The example exported-record checksum has no corresponding private payload in this bundle.

## Proposed CLI additions

These additions complete the flow around the commands already specified:

| Command | Contract |
| --- | --- |
| `oxagen harness register KIND --name NAME` | Register an initially unbound target after device and adapter checks; return its ID and control level. Launch stays blocked until repo link creates a verified checkout binding. |
| `oxagen repo link PATH --repository REF --target TARGET` | Establish a verified checkout binding; return binding ID and settings revision. |
| `oxagen repo init --path PATH --agent REF --mode REF` | Export allowed references and schemas; refuse to overwrite changed files without a reviewed plan. |
| `oxagen repo sync --path PATH --plan` | Show safe source/config differences, missing rights, and expected versions without applying changes. |
| `oxagen repo sync --path PATH --apply` | Apply a fresh, authorized plan to protected state; return the sync receipt and loaded manifest IDs. |
| `oxagen harness configure TARGET --mcp oxagen` | Configure the tested adapter's scoped MCP route without storing a token in repo files. |
| `oxagen repo validate --path PATH --strict --json` | Check bindings, exact loaded versions, policies, routes, scanner, tool belt, and capability profile. Return preflight status only. |

Extend `work.submit` CLI options with `--config` and `--work-order`. Add `--wait started --timeout` to `work status`. Allow target scoping on `tools list`. `repo sync --apply` accepts the plan ID, expected config version, and an idempotency key for scripts; interactive use shows and confirms the same fresh plan. Reuse a key only for unchanged input. An approval step, if required by policy, produces a pending operation; it never grants itself consent.

## Proposed API additions

These are operation names, not claims of deployed HTTP paths:

| Operation | Required request and response |
| --- | --- |
| `workspace.create` / `workspace.configure` | Authorized name, data-plane binding, expected version, and retry key; return workspace and settings version. |
| `repository.connect` / `workspace.repository.configure` | Trusted connector/repository identity and explicit default branch; return repo binding and settings revision. |
| `checkout.bind` | Enrollment, local checkout proof, and requested repo; return verified binding and current scope. |
| `target.register` / `target.configure` | Enrollment, version/capability evidence, checkout, and approved adapter settings; return target and control status. |
| `repo_config.export` | Authorized workspace, repo, agent, and mode; return cleaned reference-only files and their source versions. |
| `repo_config.plan` / `repo_config.apply` | Cleaned config references, source snapshot, expected version, and retry key; return safe changes, then a protected sync receipt with `prepared_tool_belt_id`. |
| `repo_config.validate` | Binding and sync receipt; return current preflight checks and safe failure codes. |
| `run.start_receipt` | Run ID with read rights; return a trusted receipt tied to saved run and first-model-dispatch events, the final run tool belt, and required `composition_receipt_id`. |

`work.submit` additionally accepts a config snapshot or sync receipt and a work-order revision. It must resolve final current rights and record the exact manifests loaded, rather than trust a caller's local lock. Existing steering, tool-belt, ScanReceipt, event, and work-report contracts remain in force.

Repo config, context, and steering changes need source/version links in the required graph. The graph records discovery and provenance; it never grants access or overrides the current gate decision. First-run success is established through the authenticated event and receipt records, not by whether these example files exist.
