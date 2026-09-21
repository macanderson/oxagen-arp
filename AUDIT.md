# Adversarial review of the ARP plans

Date: 2026-09-20. Reviewer: Claude (Fable 5.1) at the request of the repository owner. Scope: every Markdown plan, the representative SQL, the OpenAPI contract, the mockup inventory, and the build system. Concerns, in order: security, scale, performance, user experience, and frictionless onboarding.

This file records what was checked, what was found, and what changed. Every change is in the same pull request as this file. Findings that could not be fixed responsibly here are under "Left open" with the reason.

## How the review ran

- The design, short guide, surface specs, schema spec, build plan, and certification packet were read in full. The API reference and OpenAPI document were sampled for authentication, idempotency, rate limits, pagination, and error handling.
- Four independent reviewers ran in parallel with separate briefs: security, scale and performance, user experience and onboarding, and the build-system code. Each finding below was checked against the source text or executed before any change was made. Findings that did not survive that check are not here.
- The representative SQL was executed for the first time. The pack said it had been "reviewed, not database-executed". It now has been, before and after the changes.
- The owner asked mid-review for one structural change: the customer account is an org, with `org` as the schema name and `org.organizations` as the table, and the previous word for it is gone from every file. That rename is listed under change 11.

## What was executed

| Check | Result |
|---|---|
| `ARP-core-schema.sql` on PostgreSQL 16 in Docker, before and after changes | Loads with no errors both times |
| Organization scope: session for org A lists org B's rows | 0 rows |
| No scope set | 0 rows |
| Org-admin scope lists all workspaces in the org | 0 rows before the fix, 2 rows after |
| Workspace scope lists workspaces | 1 row |
| Workspace scope inserts into another workspace | Rejected by policy |
| Workspace scope reads org-admin governed actions | 2 of 3 rows (org-admin row hidden) |
| Org scope reads the same | 3 rows |
| Users visible only through membership | 1 of 2 |
| Move an object to another workspace by UPDATE | Permission denied on column |
| Decrement an authority epoch | `EPOCH_MUST_ADVANCE` |
| Un-revoke a principal | `REVOCATION_IS_FINAL` |
| Rewrite an idempotency digest, or reopen a complete key | Permission denied; `IDEMPOTENCY_STATE_FINAL` |
| Illegal action transition, or retarget capability after decision | `ILLEGAL_ACTION_TRANSITION`; permission denied |
| Second limit account for the same definition and scope under a new policy revision | Unique violation |
| Reserve while omitting a bucket that applies | `INCOMPLETE_SCOPE` |
| Reserve, then repeat the same attempt | `HELD`, then `EXISTING_HOLD` |
| Two concurrent holds for the last 100 minor units across two buckets | One `COMMIT`, one `LIMIT_EXCEEDED`; both periods consistent, one hold |
| `build-system` test suite on Node 24, before and after changes | 79 pass; 81 pass, 0 fail |
| Brand status colors, WCAG contrast on canvas, panel, and raised row | Three dark values and one light value below 4.5:1; corrected |
| 70 context records in `.oxagen/rules/` | TOML parses; `record_id` and `record_hash` recompute; stamping reproduces a published product record exactly |

## Findings and changes

### Security

**1. A new policy revision could mint a fresh allowance.** `limit_accounts` keyed on `rule_revision_id` with no stable identity, contradicting the schema spec's own rule. Fixed: `limit_definitions` table, `definition_id` and `workspace_id` on accounts, and `UNIQUE NULLS NOT DISTINCT` across definition, workspace, scope, currency, and unit. Verified by execution.

**2. A workspace session could publish any object org-wide.** Full-table `UPDATE` on `protected_objects` let `SET workspace_id = NULL` pass both policy checks. Fixed: column-level grants on every protected table and a trigger that forbids any change to `org_id` or `workspace_id`. Verified.

**3. Revocation could be undone in the database.** `authority_epochs.epoch` and `principals.state` were writable. Fixed: triggers so an epoch only advances and a revoked principal stays revoked. Verified.

**4. Idempotency keys and governed actions were fully rewritable after decision.** Fixed: column grants plus triggers for legal action transitions and immutable digests. Verified.

**5. Org-admin actions had no floor.** Rows with `workspace_id IS NULL` were readable and writable from any workspace scope. Fixed: those rows now require `oxagen.scope_kind = 'org'`. Verified.

**6. Org-level sessions saw zero workspaces.** The workspace policy had no org-scope shape, so the workspace picker and cross-workspace views could not work. Fixed with `workspace_scope_allows()` and two explicit scope shapes. Verified.

**7. The claim that RLS stops a caller choosing its org was too strong.** An injected statement run as the runtime role can set the scope itself. Changed the design and SQL to state the threat model: RLS is a floor against forgotten filters; injection is defended by parameterized statements and a lint gate. No mechanism claims more than it delivers.

**8. Device enrollment proofs were replayable.** No persisted challenge existed. The schema spec now requires `enrollment_challenges`, consumed in the enrollment transaction, with the attestation signing over nonce and device key.

**9. Tamper-evidence had no mechanism.** Chapter 18 cited RFC 9162 with no leaf, checkpoint, or proof operation anywhere. Added `audit_log_leaves`, `audit_log_checkpoints`, and two proof operations to the catalog, and the design now says the claim is "signed records" without them.

**10. Encryption keys were unrepresented and scheduled in batch 20 of 22.** Added `encryption_key_versions`, key-version and context columns on evidence objects, and moved key provisioning to batch 5 with a re-wrap gate.

**11. The customer account is an org (owner request).** The previous word for it is gone from every file in the repository, prose included. Identifiers use `org_id` everywhere in SQL, the schema spec, OpenAPI, the API reference, the repo schemas, and the samples. Tables live in the product's schema layout: `org.organizations`, `org.org_users` as the junction to `auth.users`, `workspace.workspaces`, and the ARP control tables in `oxagen`. The scope setting is `oxagen.org_id`; API paths are `/organizations/{org_id}`; the brand glossary defines org, and company or customer in older prose means the org.

**12. Other schema and API defects fixed in text:** ScanReceipt signing key now a typed FK to an active scanner authority; separation of duties on exception grants with a hard-cap bound; `root_run_id` so forks cannot shed cost; trust markers on context revisions and composition items; credential lease expiry server-issued with published ceilings; outcome-receipt identity derived from mTLS, never from the body; `Retry-After` declared as a header component and attached to 724 response entries; loopback peer authentication specified for the desktop guard; login-role guidance so `NOLOGIN` does not force an unbounded `SET ROLE` pattern; `provisioning` and workspace state added.

### Scale and performance

**13. The reserve procedure's stated duplicate behavior contradicted its code, and its lock order was not a lock order.** `ORDER BY ... FOR UPDATE` does not guarantee acquisition order in PostgreSQL, and a duplicate insert raised instead of returning the existing hold. Fixed: per-row locking over sorted arrays, a documented total order that settlement shares, and `EXISTING_HOLD` on repeat. Verified.

**14. Nothing proved the bucket set was complete.** The caller supplied the periods. Fixed: the procedure resolves the required accounts from the action's scope chain and raises `INCOMPLETE_SCOPE` on any gap. Verified.

**15. The outbox had no reader that could run under forced RLS.** The index was unprefixed and no per-org relay was stated. Fixed: org-prefixed index and a stated per-organization relay.

**16. One org-wide budget row would serialize every paid call.** Design now lets a model proxy lease a bounded block from a parent period and sub-allocate locally, with the lease itself a hold on the parent.

**17. Per-step control-plane round trips.** Strict steering required an inbox sync before every step. Design now pushes a high-water mark with a short lease and admits locally while it is valid; the staleness bound is a stated number.

**18. The device work-pull path had no contract.** Added `work.claim`, `work.extend`, `work.start_ack`, a target-scoped stream, and `target.control_snapshot` for reconnect.

**19. A stuck pause held a concurrency slot forever.** Added an authorized abandon transition into outcome unknown.

**20. Write amplification, partitioning, hot run row, stream chunks, graph bounds, CI rate limits, fork rescans, JSONB bounds, rolling windows.** Each is now a stated constraint or rule in the schema spec: writes per turn as a design budget, partition by org hash because time partitioning is unsatisfiable as keyed, `run_sequences` off the indexed run row, chunk groups of 16 KB or two seconds appending to one object, hop and candidate bounds, webhooks primary with one token bucket per installation, a scan-result cache, `pg_column_size` checks, and rolling windows removed from the subset until a windowed aggregate exists.

**21. Build order and load testing.** Batch 6 now carries the scan-receipt record, composition receipt, and epoch fence that batches 8, 11, and 12 depended on, plus a synthetic load gate before certification freezes the schema. The two independent batch pairs are named for parallel execution once the controller supports it.

### Onboarding and user experience

**22. About twenty decisions stood before a first model call, and a solo developer lacked the rights to make them.** Added `oxagen quickstart` and `oxagen doctor`; the organization creator is the first owner with every role; email plus a second factor is supported; the data plane defaults to hosted; a model-route step is now the first web step with copy for the disabled state.

**23. The web app could not take a prompt without a paired desktop, and that state was undesigned.** Added the unpaired Send-work state with a pairing card, per-screen empty states, and four shared failure fixtures with copy.

**24. Enrollment order contradicted itself across three documents.** One order everywhere: enroll device, register harness, link checkout, choose agent and mode.

**25. Device lifecycle was undocumented.** Added a Devices section covering second computer, reinstall, session expiry, lost network, and leaving a workspace, plus `device list`, `rename`, and `revoke`.

**26. Stop existed in prose only.** Added `run stop` and `work cancel`, a Stop control on run detail, and the copy for a stopped run. Budget blocks now have their own copy and a machine-readable reason.

**27. Naming.** One glossary in the brand spec: organization, desktop guard, browser pairing, model proxy, persona, role, work order, work request, run, tool belt. Supervisor means only the person. The design's opening defines the retired names. Run and governed-action states are one vocabulary; the API enum now matches it.

**28. Brand contrast claims were false on raised rows.** Dark Denied 3.94, Failed 3.78, Urgent 3.46 on `#27272A`; Urgent 4.11 on the dark panel; light gold accent 4.23 on `#F4F4F5`. Replaced the three dark values with ones that clear 4.5:1 on every dark surface and forbade gold text on light raised rows.

**29. Mockups.** The double period in the pausing copy is fixed, and the inventory now lists what the fixtures lack before certification: per-screen states, a Stop control, live regions and a skip link, raw identifiers in copy, borrowed states, and the corrected status colors.

### Build system

**30. Two operational dead ends.** A non-zero harness exit always became an unrecoverable unknown, and the GitHub adapter capped CI wait at 50 seconds and every git call at 60 seconds regardless of configuration. Fixed: a stopped harness whose broker ledger shows no reservation and no unknown outcome is now a known no-charge failure eligible for bounded retry; CI wait honors configuration up to the operation deadline with backoff and jitter; git transfers have their own timeout. A settled nonzero charge still needs operator adoption, and the docs say so.

**31. Smaller defects.** Controller lock is JSON with pid and hostname and treats unparsable content as stale; a crash between journaling and `git worktree add` is now recoverable; cancel grace is 30 seconds and configurable; engine git calls time out; failed gh stderr is kept in a private log; review findings are bounded and labeled untrusted before re-entering a prompt; the unreachable environment-variable credential branch is removed and documented as unsupported; the certifier accepts a remote profile; a dead branch is gone; the Linux-skipped test is split so the invocation assertions always run; a ledger-liability regression test is added; product batches may no longer edit `.github/`; LOCAL-SETUP gains the operational limits the reviewer found undocumented and is retitled so it is not mistaken for product setup; VALIDATION.md no longer claims bootstrap was tested.

## Context records for builders

`.oxagen/` holds 70 context records in `context-record/v0.1`, the format the current Oxagen product reads from a linked repository. Each file is one lineage under `.oxagen/rules/`, with `record_id` and `record_hash` stamped the way the product's `context.steering.file.ts` and Stella stamp them; the stamper reproduced a published record from the main product repository byte for byte. `workspace.toml` binds this repository to the `oxagen/product` workspace as a linked repo, so records carry `sharing_scope = "repository"`. `governance.toml` is `solo`.

The records carry every rule above that a builder must not lose while turning these plans into code, plus the housekeeping rules of this repository.

## Added after the review, at the owner's request

- **Org everywhere.** The previous word for the customer account is gone from every file, including identifiers, SVG text, and the HTML readers.
- **Uncapped, dependency-ordered plan.** `build-system/examples/plan.json` is a graph of 13 waves; every batch sits at the ledger's arithmetic cost ceiling with the four-hour stage maximum. The controller still walks the list in order; concurrent wave execution with a serialized merge lane is filed as issue #2.
- **Sibling snapshot absorbed.** The `oxagen-arp 2` directory was a later generator snapshot. It was merged three-way against the original import: 35 new files (artifact and release adapters, release approval tool, AWS ECS Fargate and local compose infrastructure, independent review, release setup, a release drawing, five test files) plus its document edits, with the review's changes kept on every conflict. The build-system suite is now 127 tests.
- **Mockups as a working app.** The static HTML mockups are retired in favor of `apps/web`: Next.js App Router, base-ui, Tailwind 4, a shadcn-style kit, and Storybook, with eight routes and stories for the states the specs name. Fixtures live only in `packages/fixtures` and validate against the contracts; `apps/web/src/data` is the seam that swaps fixtures for live endpoints by one environment variable.
- **Kernel and invoke with parity.** `packages/kernel` follows the macanderson/oxagen pattern: one `CapabilityDeclaration` per capability with its `surfaces`, one registry, one `invoke()`. `apps/api`, `apps/mcp`, and `apps/cli` are binders derived from the registry with no per-capability files. `tools/check-surface-parity.mjs --strict` and the `Surfaces` workflow enforce it. Thirteen ARP capabilities are registered; tests cover the kernel, fixtures, each binder, and the data seam.

- **SDK, usage, coaching, and cost savings absorbed from the Codex outputs run.** `ARP-SDK-spec.md`, `ARP-Performance-spec.md`, and the efficiency drawing are in; the matching sections went into the design, web, API, schema, short guide, drawings, build plan, and certification blockers. The import feature, the plugin protocol, and the prose audit from that run were left out on purpose. The specs are made concrete in the kernel: `usage.query`, `finding.list`, and `finding.respond` contracts, fixtures that encode the trace-file example with a range that can be negative and an overlap group, a Coaching page and stories, and the parity gate covering all sixteen capabilities. That run also recorded the owner's choice of the oxagen-roadmap Mission Control v2 layout as the web direction; `apps/web` follows it.

## Left open

- **HTML readers are stale.** `Oxagen-ARP.html` and `Oxagen-ARP-TLDR.html` embed the pre-audit Markdown and a pre-rendered copy of each document. The renderer that produced that HTML is not in the pack, so the readers were not regenerated. The README and a context record say so. Regenerate them from the Markdown before distributing the readers.
- **Production settlement and the full catalog are still untested.** Only the representative subset ran. Settlement, ratio caps, FX, and the new catalog rows remain build-plan gates.
- **Agent stages with a settled nonzero charge still block for manual adoption.** Automating that needs the controller to charge a failed stage's cost to the batch and route it through retry, which is a larger change than this review should land alone.
- **Wholesale renaming of retired names in prose.** The glossary defines the canonical names and the design's opening maps the old ones, but hundreds of sentences still use org, local guard, or protected service. A copy-editing pass should follow once the vocabulary is agreed.
- **The mockup HTML was not changed.** The gaps are listed for the next design batch rather than patched into generated fixtures.
