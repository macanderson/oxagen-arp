# Oxagen product mockups

These are clickable design candidates, not production applications. All people, receipts, permissions and results are fictional. No control sends data or changes a real system. The user has not certified them.

Open [Web mockups](Oxagen-web-mockups.html) or [Desktop mockups](Oxagen-desktop-mockups.html). Use the screen navigation and primary buttons to follow flows. The state selector exposes ready, empty, loading, denied, error and stale fixtures; it does not simulate a backend. Each view supports light and dark themes.

## Web screen and flow inventory

### Workspace

**Support.** Assign work, see what needs you, and track shared limits.

Entry: [Workspace](Oxagen-web-mockups.html#home). Primary action: Send work; opens dispatch.

| Assignment | Agent / harness | State | Spend |
|---|---|---|---|
| Fix the receipt layout | Builder · Codex | Running | $12.48 |
| Review refund policy | Reviewer · Claude Code | Paused | $7.20 |
| Update setup guide | Docs · Codex | Approval needed | $2.10 |

| Measure | Value | Meaning |
|---|---|---|
| Active runs | 8 | 3 devices · 2 harnesses |
| Needs you | 2 | One approval · one blocked run |
| Spent today | $84.20 | $15.80 reserved · $150 limit |

Last sync 10:42:08 · Private data plane · All shown records are within your workspace grants.

### Create workspace

**Connect your workspace.** Choose where work belongs before an agent starts.

Entry: [Create workspace](Oxagen-web-mockups.html#setup). Primary action: Save and continue; opens targets.

| Field | Example |
|---|---|
| Workspace name | Support |
| Connected repository | acme / support-app |
| Default comparison branch | main |
| Record storage | Company private data plane · us-west |
| Initial data policy | Block secrets · replace personal data |

This selection needs workspace.create and access to the selected data plane. The default branch is explicit. Changing a repo file cannot change this binding.

### Connected harnesses

**Connected harnesses.** Only targets with current control checks can start strict work.

Entry: [Connected harnesses](Oxagen-web-mockups.html#targets). Primary action: Enroll a device; opens setup.

| Target | Harness | Control | Last seen |
|---|---|---|---|
| Maya’s Mac · builder | Codex 0.155.1 | Strict profile current | Now |
| Private runner · review | Claude Code 2.1.278 | Strict profile current | 4 sec ago |
| Research laptop | Custom SDK | Observed only | 3 min ago |

These version numbers are fictional certification fixtures, not claims of Oxagen support. An observed target cannot be selected for strict work.

### Send work

**Send a new assignment.** Each selected target gets its own run and receipt.

Entry: [Send work](Oxagen-web-mockups.html#dispatch). Primary action: Preview assignment; opens dispatch-review.

| Field | Example |
|---|---|
| Agent and mode | Support builder · code |
| Work order | First docs check · read only |
| Repository / branch | support-app / docs/setup |
| Target | Maya’s Mac · Codex |
| Prompt source | Paired local bridge · first-task.md |
| Maximum spend | $5.00 · shared operator limit also applies |
| Implementation harness / model | Codex / selected from its supported model profile |
| Reviewer harness / model | Claude Code / separately selected supported model |

Local preview: “Read docs/start.md and report its test command.” This mockup accepts no real uploads. In the product, raw input must reach the local service before any cloud form, autosave, or log.

### Assignment preview

**Ready for admission checks.** Previewing the assignment does not authorize a model call.

Entry: [Assignment preview](Oxagen-web-mockups.html#dispatch-review). Primary action: Send assignment; opens runs.

| Check | Resolved value | Status |
|---|---|---|
| Local scan | Rules v14 · complete supported coverage | Current |
| Identity | Maya → Support builder / code | Current |
| Budget | $5.00 requested · $50.00 remaining | Current |
| Tool belt | read_file · search_repo | Current |

Send records acceptance. The target must confirm start; the first model dispatch receipt proves which cleaned input was used.

### Steer runs

**Steer 3 active runs.** The target list is fixed when this message is saved.

Entry: [Steer runs](Oxagen-web-mockups.html#steer). Primary action: Send steering; opens steer-results.

| Field | Example |
|---|---|
| Targets | run_41 · run_42 · run_43 |
| Message | Use the new setup example in this workspace. |
| Delivery | Next execution boundary |
| Interrupt current work | Off · change to request a confirmed pause first |

Without interruption, new direction enters before the next eligible model request. With interruption, “pausing” remains pending until every required boundary is confirmed.

### Steering receipts

**Track each target.** One fleet request can have several different outcomes.

Entry: [Steering receipts](Oxagen-web-mockups.html#steer-results). Primary action: Open run 41; opens runs.

| Run | Receipt | Meaning |
|---|---|---|
| run_41 | Applied | Included in model request model_184 |
| run_42 | Pausing | One child tool has not stopped |
| run_43 | Waiting for device | Saved; not yet delivered |

Applied proves delivery to the recorded request, not obedience. A disconnected device is not paused.

### Agents

**Permissions & limits.** An agent has its own identity. A persona is its approved setup.

Entry: [Agents](Oxagen-web-mockups.html#agents). Primary action: Review changes; opens approvals.

| Tool | Assignment | Source |
|---|---|---|
| read_file | Allowed | Agent release 12 |
| search_repo | Allowed | Workspace + mode |
| process_refund | Denied | Code mode denies business writes |
| Native shell | Denied | Strict tool policy |

| Measure | Value | Meaning |
|---|---|---|
| Agent release | 12 | Persona: Support builder · p_17 |
| Mode | code | Narrower than the agent ceiling |
| Agent spend cap | $25.00 | Operator and workspace caps still apply |

Deny wins. Hiding a tool is not enforcement: the guard also blocks native tools and other MCP servers.

### Tools

**Tools in this workspace.** One MCP endpoint resolves the right tool belt for each identity and run.

Entry: [Tools](Oxagen-web-mockups.html#tools). Primary action: Inspect refund tool; opens policies.

| Tool | Version | Route | Assignment |
|---|---|---|---|
| lookup_customer | 3 | Approved MCP connector | Support service |
| process_refund | 5 | Payments connector | Refund agent only |
| search_repo | 2 | Protected local broker | Support builder |

tools/call checks current identity, tool version, record access, inputs, policy and spend again. Tools outside Oxagen need a supported guard or must be disabled.

### Policies

**Refund limits.** Simple forms set reusable rules. Every applicable limit must pass.

Entry: [Policies](Oxagen-web-mockups.html#policies). Primary action: Review policy revision; opens approvals.

| Field | Example |
|---|---|
| Per order | 20% of eligible paid amount · cumulative |
| Per customer | USD 100 per workspace / calendar day |
| Workspace total | USD 5,000 per calendar day |
| Time zone | America/Los_Angeles |
| At a hard limit | Block · no approval override |

| Version | Activation | Target receipt |
|---|---|---|
| 14 | Active | 2 of 2 guards current |
| 15 | Draft | Not enforcing |

A $200 eligible order has a $40 total cap. $15 already refunded leaves $25 before other limits. Publishing a new revision does not reset shared use.

### Data protection

**Clean data before it leaves.** These workspace rules run on the host where the raw data lives.

Entry: [Data protection](Oxagen-web-mockups.html#protection). Primary action: Review scan coverage; opens evidence.

| Data class | Action | Scope |
|---|---|---|
| Provider keys and passwords | Block | Full assembled request + files |
| Personal identifiers | Replace | Consistent local placeholders |
| Private internal URL | Redact | Request metadata and reports |
| Unreadable attachment | Block | No raw upload fallback |

The scanner checks context, history, tool data, filenames and outgoing records too. It cannot promise perfect detection. New content requires a fresh local scan.

### Spend

**Shared spend and holds.** Funds are held before dispatch. Unknown charges keep their holds.

Entry: [Spend](Oxagen-web-mockups.html#spend). Primary action: Inspect agent limits; opens agents.

| Scope | Limit | Spent + held | Remaining |
|---|---|---|---|
| Workspace | USD 150.00 | USD 100.00 | USD 50.00 |
| Maya · operator | USD 75.00 | USD 44.80 | USD 30.20 |
| Support builder | USD 25.00 | USD 18.00 | USD 7.00 |

| Measure | Value | Meaning |
|---|---|---|
| Spent | $84.20 | Confirmed charges |
| Held | $15.80 | Unfinished or unknown work |
| Available | $50.00 | USD 150.00 shared ceiling |

Each scope must have room. Refund allowance and model spending use distinct charge units. A timeout does not free a possible charge.

### Approvals

**An exact action needs review.** You can approve only the threshold your role and policy allow.

Entry: [Approvals](Oxagen-web-mockups.html#approvals). Primary action: View scoped decision; opens evidence.

| Field | Example |
|---|---|
| Requested action | Read customer record customer_84 |
| Requester | Support agent · agent_23 |
| Reason | Resolve support case case_106 |
| Grant scope | One record · read only · expires in 15 minutes |
| Policy | Customer access v8 · exception allowed |

This mockup makes no access change. The production decision needs the current expected version and a recorded approver. Absolute bans and higher hard caps cannot be waived.

### Run detail

**Read the setup guide.** Codex · code mode · support-app / docs/setup

Entry: [Run detail](Oxagen-web-mockups.html#runs). Primary action: View work report; opens report.

| Time | Event | Receipt |
|---|---|---|
| 10:41:12 | Started | Config 8 · context 21 · steering 4 |
| 10:41:13 | Model dispatched | Scan v14 · request hash pinned |
| 10:41:15 | read_file completed | 1 call · cleaned output saved |
| 10:41:16 | Steering applied | model_184 |

| Measure | Value | Meaning |
|---|---|---|
| Run state | Running | Start confirmed at 10:41:12 |
| Last model action | model_184 | Cleaned request saved |
| Spend | $0.18 | $0.12 held |

A requested pause shows pausing. Only a saved PauseBoundary allows paused. A late reply is evidence-only until a separately checked adoption.

### Evidence

**What this request used.** Allowed viewers can inspect the exact cleaned bytes sent to the model.

Entry: [Evidence](Oxagen-web-mockups.html#evidence). Primary action: Open report; opens report.

| Record | Version / reference | Meaning |
|---|---|---|
| Operator / agent | Maya / agent_23 | Separate IAM principals |
| Persona / mode | p_17 v12 / code | Approved definition |
| Config / composition | config_8 / compose_184 | Actual included input |
| Policies / decision | v14 + v8 / allow_184 | All evaluated rule versions |
| Scan / model exchange | scan_184 / model_184 | Cleaned request binding |
| Model route / resolved model | Pinned by model exchange 184 | Role, harness and model recorded separately |

Removed raw values, raw hashes and replacement maps are absent. Receipt verification proves a named claim; it is not proof that all work is correct.

### Work report

**Work recorded in the tenant store.** Private data plane · durable receipt store_391 · updated 10:42:08

Entry: [Work report](Oxagen-web-mockups.html#report). Primary action: Inspect related records; opens graph.

| Required field | Recorded value |
|---|---|
| Repository / work branch | acme/support-app / docs/setup |
| Configured target / comparison | main · base abc123 → work def456 |
| Diff / files | No changes · complete permitted coverage |
| Pull request | Not created |
| CI jobs | Not applicable · no PR |
| Tracking | Until work-order cutoff · current |

| Measure | Value | Meaning |
|---|---|---|
| Changed files | 0 | Read-only first assignment |
| Tool use | read_file × 1 | Unique tool names and counts |
| Persona | Support builder | p_17 · release 12 |

A real changed-code report includes the full permitted diff, every changed file, PR number/link, all CI jobs and coverage. A PR targeting another branch does not change the workspace comparison target.

### Context graph

**Related facts with clear sources.** Code, guidance, policy and evidence share one permissioned map.

Entry: [Context graph](Oxagen-web-mockups.html#graph). Primary action: Inspect source versions; opens evidence.

| Record | Source | Trust / freshness |
|---|---|---|
| docs/start.md | VCS · commit abc123 | Source verified · current |
| Setup guidance | Context record ctx_21 | Published · current |
| Refund policy | Oxagen · revision 14 | Active authority |
| Future refund link | Payments system | Future ingestion · disabled |

The graph does not grant access. Every node, link, field and count needs the same checks. Inferred links never become verified outcomes on their own.

### People & identities

**One permission system.** Humans, agents, services and future plugins each have their own identity.

Entry: [People & identities](Oxagen-web-mockups.html#iam). Primary action: View approval; opens approvals.

| Principal | Kind | Role / scope |
|---|---|---|
| Maya Chen | Human | Operator · Support workspace |
| Support builder | Agent | Repo reader · selected context |
| Local gateway | Service | Device-bound dispatch + scan |
| Partner plugin | Plugin | Not installed · no grant |

RBAC groups rights. Record grants narrow them. RLS protects tenant rows; object storage, search and graph enforce equivalent rules. Agents do not inherit every operator right.

### Data plane

**Records stay in the chosen place.** Company private data plane · us-west · revision 3

Entry: [Data plane](Oxagen-web-mockups.html#placement). Primary action: Inspect connected targets; opens targets.

| Component | Location | State |
|---|---|---|
| Authority database | Private network | Current |
| Encrypted evidence store | Private network | Current |
| Model proxy / key broker | Private network | Current |
| Outbound control link | Oxagen SaaS metadata | Connected |

Loss of a private route blocks work. There is no public fallback. Key handles are shown only to permitted custodians; no credential value is rendered.

## Desktop screen and flow inventory

### Overview

**Your workspace is connected.** Maya’s Mac · Support · proposed strict profile

Entry: [Overview](Oxagen-desktop-mockups.html#home). Primary action: Open first-run setup; opens checkout.

| Target | Identity | State |
|---|---|---|
| local-codex | Support builder / code | Ready |
| local-claude | Support reviewer / review | Ready |

| Measure | Value | Meaning |
|---|---|---|
| Protected service | Ready | Window may close; guard stays active |
| Policy revision | 14 | Confirmed by the local guard |
| Pending records | 0 | Only cleaned content is synced |

Demonstration data only. Supported-platform certification must prove tool, file and network control for the installed harness version.

### Enrollment

**Connect this device.** Sign in as yourself. The protected service gets its own revocable identity.

Entry: [Enrollment](Oxagen-desktop-mockups.html#enroll). Primary action: Review device checks; opens health.

| Field | Example |
|---|---|
| Signed-in organization | Acme · allowed tenant |
| Human identity | Maya Chen · Operator |
| Device | Maya’s Mac · macOS |
| Enrollment scope | Support workspace only |

Device keys stay in protected OS storage, outside the repo and agent process. This prototype does not sign in or issue credentials.

### Workspace & repo

**Link a checked-out repository.** Repo files request a workspace; the protected service verifies the binding.

Entry: [Workspace & repo](Oxagen-desktop-mockups.html#checkout). Primary action: Review loaded configuration; opens config.

| Field | Example |
|---|---|
| Workspace | Support |
| Connected repository | acme/support-app |
| Local checkout | approved repo handle · support-app |
| Registered harness target | local-codex · enrolled, awaiting binding |
| Comparison target | main · workspace settings v6 |

Register the enrolled harness, then link its checkout. A renamed folder or edited remote cannot select a weaker workspace.

### Harnesses

**Choose a supported harness.** Control support is tested per adapter, version and feature set.

Entry: [Harnesses](Oxagen-desktop-mockups.html#harness). Primary action: Load workspace setup; opens config.

| Harness | Adapter | Control status |
|---|---|---|
| Codex | Oxagen adapter · example profile | Ready |
| Claude Code | Oxagen adapter · example profile | Ready |
| Custom SDK | No approved guard profile | Unsupported |

Hooks carry turn and steering events. The protected service blocks bypasses. An unsupported harness cannot claim strict model or tool control.

### Loaded setup

**Review the loaded records.** Tracked .oxagen files hold references. Trusted loaded state stays outside the repo.

Entry: [Loaded setup](Oxagen-desktop-mockups.html#config). Primary action: Validate and preview first task; opens scan.

| Input | Loaded version | Source |
|---|---|---|
| .oxagen/workspace.json | Config snapshot 8 | Checked-out clean file |
| Context | ctx_21 · manifest 21 | Approved VCS + Oxagen records |
| Steering | guide_4 · manifest 4 | Task guidance · not policy |
| Tool belt | Prepared resolution 9 | Agent + mode + IAM + policy |

Edits become proposals or a new sync plan. Required missing sources block launch. A branch switch invalidates the old loaded setup.

### Data protection

**Review the cleaned request.** The complete assembled request is checked before any upload or model call.

Entry: [Data protection](Oxagen-desktop-mockups.html#scan). Primary action: Send cleaned first task; opens runs.

| Field | Example |
|---|---|
| Source | Prompt + 1 attachment + context + tool schemas |
| Rules | Support / data protection v14 |
| Coverage | Complete for supported inputs |
| Action | Replace 1 personal identifier |
| Cleaned preview | Read setup notes for [PERSON_1] and report the test command. |

The original value and replacement map are never shown here or sent to Oxagen. No real input is accepted by this mockup. New model-visible content requires another local scan.

### Blocked input

**This attachment could not be checked.** Nothing was uploaded. The model call has not started.

Entry: [Blocked input](Oxagen-desktop-mockups.html#blocked). Primary action: Return to local preview; opens scan.

| Field | Example |
|---|---|
| Input | Attachment 1 · encrypted archive |
| Reason | Unsupported inspection path |
| Workspace rule | Block incomplete scans |
| Next step | Use an approved local conversion, then scan again |

No raw-to-cloud fallback. A person cannot waive a hard data rule by clicking “continue.” Safe usage facts may sync; private error text stays local.

### Tool belt

**Allowed tools for this context.** The same identity and policy checks apply to Oxagen and outside tools.

Entry: [Tool belt](Oxagen-desktop-mockups.html#tools). Primary action: Inspect gateway health; opens health.

| Tool | Source | Effective access |
|---|---|---|
| read_file | Protected native broker | Allowed |
| search_repo | Oxagen MCP | Allowed |
| process_refund | Payments MCP connector | Denied |
| Unchecked shell | Harness native | Blocked by guard |

Listing tools does not authorize an argument or record. Mode changes create a fresh checked tool belt before use.

### Runs

**First docs check is running.** The first model dispatch proves which loaded input was used.

Entry: [Runs](Oxagen-desktop-mockups.html#runs). Primary action: Request pause; opens pausing.

| Step | Saved evidence |
|---|---|
| Run start | Agent release 12 · config snapshot 8 |
| Local scan | scan_184 · cleaned bytes pinned |
| Model request | model_184 · compose_184 |
| Tool call | read_file · complete |

| Measure | Value | Meaning |
|---|---|---|
| State | Running | Start confirmed |
| Context / steering | 21 / 4 | compose_184 records inclusion |
| Spend | $0.18 | $0.12 still held |

Closing this window does not stop the guard. Use the run controls to request a boundary.

### Pause requested

**Pausing. One tool is still running..** New work and old-response admission are closed.

Entry: [Pause requested](Oxagen-desktop-mockups.html#pausing). Primary action: View confirmed-boundary example; opens paused.

| Required proof | State |
|---|---|
| Model admission closed | Confirmed |
| Child tool stopped or isolated | Pending |
| Outside effects reconciled | No pending write |
| Stable state saved | Waiting |

The next button selects another design fixture. It does not complete a pause. In the product, only trusted worker and effect proof can change this state.

### Pause confirmed

**Paused at step 42.** Every required guard confirmed the boundary. No new work can start.

Entry: [Pause confirmed](Oxagen-desktop-mockups.html#paused). Primary action: Review resume checks; opens resume.

| Proof | Receipt |
|---|---|
| Closed admission epoch | 7 |
| Workers stopped or isolated | workers_42 |
| Stable state | checkpoint_42 |
| Pending external writes | None unresolved |

Resume checks current rights, policy, budget and holds. A paused run cannot reuse old single-use action approvals.

### Resume checks

**Start from a confirmed boundary.** The next request will use fresh authority and a new scan.

Entry: [Resume checks](Oxagen-desktop-mockups.html#resume). Primary action: Resume example run; opens runs.

| Field | Example |
|---|---|
| Boundary | pause_boundary_42 |
| Current policy | 14 · current |
| Context update | Next-boundary manifest 22 |
| Blocking holds | None |
| Remaining budget | $4.70 · subject to actual next-call bound |

An accepted resume still needs a recorded state transition. A stopped run cannot resume; it needs a new run and fresh grants.

### Late reply

**A reply arrived after interruption.** Saved as evidence. It cannot drive the resumed run.

Entry: [Late reply](Oxagen-desktop-mockups.html#late). Primary action: Return to pause state; opens paused.

| Field | Value |
|---|---|
| Original attempt | model_183 · epoch 7 |
| Arrival | After admission closed |
| Disposition | Late · evidence only |
| Adoption | Not requested |

A permitted actor may propose adoption into a named new epoch. Oxagen rechecks source rights, data rules and run state. Arrival alone never adopts it.

### Request access

**Request one scoped right.** The agent asks Oxagen for access when it needs it.

Entry: [Request access](Oxagen-desktop-mockups.html#access). Primary action: View request status; opens health.

| Field | Example |
|---|---|
| Agent | Support builder · agent_23 |
| Requested capability | Read record customer_84 |
| Purpose | Answer support case case_106 |
| Expiry | 15 minutes |
| Credential delivery | Brokered call · no key exposed |

An approval grants only its exact scope. The model, repo, prompts and process environment receive no provider credential.

### Health & recovery

**All required checks are current.** A failed guard or stale rule set closes strict admission.

Entry: [Health & recovery](Oxagen-desktop-mockups.html#health). Primary action: Open workspace overview; opens home.

| Component | State | Recovery |
|---|---|---|
| Local scanner | Current · supported formats | Inspect coverage |
| Model proxy route | Connected | Approved private endpoint |
| Tool / network guard | Current | Platform profile required |
| Policy update | Revision 14 applied | Urgent denies fence gates |
| Evidence queue | 0 pending | Cleaned content only |

Offline is not paused. A restart reconciles past sends before retrying them. Signed updates switch safely or leave work closed.

## Review before certification

Verify both complete happy paths and denied/unknown recovery: workspace → enrollment → unbound target → repo binding → sync → local scan → admission → actual start receipt → required work report. Review fleet steering, confirmed pause and late response as separate flows. Test keyboard navigation, screen-reader labels, focus, both themes and narrow screens. Global state fixtures show presentation, not real authorization or asynchronous behavior. A specialist should validate the platform-specific enrollment, scanner, native windows and assistive-technology experience before approving implementation.

Only a complete, explicitly reviewed manifest may be certified. The manifest must include these HTML files, this full screen description, OpenAPI, data schemas, the architecture, brand guidance and acceptance criteria. A later material change invalidates that approval.
