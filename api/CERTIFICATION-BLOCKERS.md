# API certification gates

The OpenAPI and reference describe a proposed HTTP contract. They do not certify an implementation. Passing structural validation means the document is internally parseable; it does not prove security, correct money handling, data protection, or compatibility with a harness.

## Contracts that must be frozen before release

| Gate | Required decision and evidence |
|---|---|
| Signature transcripts | Exact canonical bytes, domain separation, encoding, signer registry, revocation, nonce/audience binding and test vectors for ScanReceipt, enrollment, dispatch, sync and launch proofs. Exclude receipt fields from their own request digest. Reject duplicate JSON keys before signing and parsing. |
| Enrollment bootstrap | Complete protected installer/device-key and attestation exchange, including a safe path for attestation evidence before normal enrollment. No free-form content or upload may use bootstrap as a scanner bypass. |
| Org provisioning | Freeze and test the typed platform provisioning/activation routes and their preceding identity/owner-acceptance/deployment-attestation profile. Pin proof transcripts, trust roots, recovery and the atomic initial owner/data-plane transaction. Platform authority must not grant org content access. No unscanned customer upload belongs in bootstrap. |
| Core schema mapping | Turn each HTTP payload into database constraints and transactions. Validate same-org/workspace references, object scope, grant ownership, every policy version, all IAM epochs, owner fences, current run epoch, fixed source versions and source receipts. Do not implement arbitrary CRUD over ledger or authority tables. |
| State and error matrix | Publish all legal transitions, preconditions and error codes for every command. Test accepted versus applied states, version races, delayed callbacks, clock skew, stale grants, deletion, shutdown, failover, and duplicate/conflicting delivery. |
| Business rule forms | Freeze cross-field constraints and normalization for PolicyThreshold and LimitAccount. Specify rounding, currency, time zone, rolling windows, percentage denominator, external history and which thresholds may be overridden. A JSON field name is not a complete refund policy. Count account shapes are reserved; return FEATURE_DISABLED before effects until their separate counter storage, source evidence and settlement profile is certified. |
| Budget authority | Implement atomic all-bucket reservation, known-cost upper bounds, model price/FX versions, outside refund reconciliation and ledger settlement. Retain unknown liability. Keep stable limit-definition identity across policy changes, and deduplicate postings by canonical financial effect revision and account rather than receipt/hold identity. Prove that shared parent limits cannot be spent twice across devices, regions, retries or plugins. |
| Full request coverage | Specify every provider request field, attachment format, safe parser, archive/OCR limit, streaming release boundary, cache/upload ID, cloud callback and error path. Run planted-secret egress tests. Native opaque blocks must be safely supported or blocked. |
| Provider and harness wire profiles | Ship pinned provider-native HTTP schemas, streaming/error mappings, cancellation and usage contracts, plus adapter test suites. The checked gateway dispatch envelope is not a substitute for `/responses`, `/messages`, or another provider's wire contract. Do not certify a harness merely because it can call the control API. |
| Local and non-HTTP profiles | Freeze local IPC peer authentication, native tool interception, protected process/network rules, MCP authorization and tool refresh, CGP provenance rules, and run event ordering. OpenAPI does not define those protocols. |
| Connectors and raw webhooks | Define each provider's signature, replay window, source IDs, raw-body handling, paging, CI coverage and effect reconciliation. Only a trusted local adapter may emit the cleaned service receipt. Never queue an unscanned raw webhook remotely. |
| Repo and first-run contracts | Keep the `arp.repo/0.2` file schemas, protected sync receipt and API representation consistent. A prepared tool belt is pre-run; the final snapshot and composition receipt must match actual first-model dispatch. Imported local locks are informational only. |
| Bulk and streaming limits | Set deployed request/page/attachment quotas, fairness, admission deadlines, backpressure, event retention, cursor invalidation and artifact download rules. Large reports must preserve full permitted CI/file sets through manifests and paginated routes, rather than truncate silently. |
| IAM and data planes | Test human, agent and service actions through one permission layer; test RLS, pooled connections, cross-org objects, graph/cache disclosures, private storage failures and authorized cutover. No public fallback. |
| Generated clients | Generate and compile each promised language SDK, including unions, nullable values, decimal-string money, UUIDs, errors, SSE and binary transfers. Verify clients never copy policy logic or expose credentials and raw debug content. |
| Future interfaces | Plugin installs, marketplace execution, external partner jobs and business outcome correlation remain disabled. An implementation must not enable them just because their route and schema are reserved here. |

## Required negative tests

- Uninspected prompt, filename, attachment, tool result, CI text or error cannot reach a remote log or store.
- A missing, expired, forged or mismatched scan receipt fails before admission. A client-selected workspace cannot change authority.
- A guessed tool name, another MCP route, native shell path, renamed business capability or direct provider credential cannot bypass checks.
- Replayed action authorization cannot dispatch twice. A failed HTTP retry never frees unknown budget liability.
- Two concurrent operators cannot reserve the same last dollar or refund allowance.
- A pause command cannot report paused before its confirmed boundary. Late results cannot drive a resumed run without adoption.
- A hidden record cannot appear through an entity link, count, search result, cursor, cached response, signed URL or event stream.
- A repo sync plan cannot apply after files, grants, source versions or policy changed. An unbound target cannot start.
- A blocked or redacted snapshot cannot promise exact restoration of the removed data.
- Future routes return FEATURE_DISABLED without installing code, granting rights, opening a subscription or launching a job.

## Validation performed for this artifact

Read [validation-report.json](validation-report.json) for the actual checks. Local references, unique operation IDs, path parameters, required authentication/idempotency/scan declarations, component JSON Schema structure and representative positive/negative payloads are checked. The official OpenAPI structural schema is used when retrievable. No live service, generated SDK, provider adapter, database, race test or end-to-end security test is claimed here.
