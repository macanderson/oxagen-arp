# Oxagen web app specification

This is a proposed app. It is the main place for operators and team supervisors to assign work, track results, and enforce rules. The app uses saved ARP records and checked commands. A screen or browser session is never the enforcement gate.

## Clickable design candidate

Open the [high-fidelity web mockups](certification/Oxagen-web-mockups.html). They use fictional data, linked flows, both themes and selectable failure states. They make no real requests. The [full screen inventory](certification/Mockups.md) is also Markdown. These files are available for review; they are not certified or implemented product screens.

## Workspace home and access

Sign in, choose an organization and workspace, then show only allowed records. Humans and agents are first-class IAM principals: each has an identity, roles, grants, and a way to revoke access. One permission system governs tools, context, records, and controls. Role-based access control, or RBAC, groups those rights.

An owner may manage a workspace. An operator may send work. A team supervisor may review team results. A policy admin may publish rules. These roles do not imply every possible right. Reading prompt content, raising a limit, and granting access need their own checks. Show hidden or unavailable fields without exposing private names or counts.

Whoever creates an organization is its first owner and holds owner, operator, policy admin, and approver in every workspace they create until delegated. Email plus a second factor is supported; single sign-on is optional. The data plane defaults to Oxagen-hosted. A solo developer therefore reaches a first governed run without an administrator.

A denial names the missing role and who can grant it, without exposing private records: “You’re a Viewer in Support. Sending work needs the Operator role. Ask the workspace owner.” A denial never says only “request the named role” without naming it.

**Policies → Model routes** is the first setup step. Paste a provider key or pick an Oxagen-managed model; the model proxy stores the key and the device never sees it. Until one route exists, Send work is disabled with the copy “No model route yet. Add a provider key to send work.”

Home shows active work, blocked actions, approvals, spend, target health, and data freshness. Database row-level security, or RLS, keeps org rows apart. The same IAM checks also cover files, graphs, search, and exports. The browser has no privileged database login.

## Send work or steer existing work

**Send work** starts a new task. Pick the agent, mode, repo, work order, and registered target. A work order assigns a job and can narrow its limits. Preview the fixed target list and shared budget before sending. Check each target separately.

**Steer** adds direction to named runs. Select one, a group, or all allowed workspace runs. With no interruption, apply the message at the next allowed execution boundary. With interruption, first confirm the pause, then add the message and resume under fresh checks. Include delegated work in the control plan.

Show each target's state: queued, waiting for a device, waiting for capacity, starting, started, blocked, expired, or cancelled. For steering, show accepted, delivered, boundary reached, and applied. “Applied” must name the model request that received it. It does not prove obedience.

Registration does not prove control. Show unsupported and observed-only targets clearly. Offline does not prove paused. A group can partly succeed; never hide its pending targets. Saved requests survive browser closure. Safe retries must not start duplicate runs.

![A person submits a workspace message. Oxagen saves the target list and places it in each run inbox. Without interrupting, current admitted work ends and the message enters before the next step. With interruption, Oxagen first confirms a pause, then applies the message and resumes. The web app shows per-run receipts, including offline runs.](diagrams/steering.svg)

*A workspace message targets a saved list of enrolled runs. Each run gets its own receipt. Offline runs stay visible as waiting.*

## Agents, tools, and context

Agent settings contain **Permissions & limits**, identity, approved personas and modes, tools, skills, and context. Show effective limits with their source. Workspace rules set a ceiling; agent and run rules may narrow it.

Customers can register custom tools such as `lookup_customer` or `process_refund`, assign versions, and add them to agents. Show both allowed and denied tools. The MCP service lists the tools allowed for the current identity and workspace. Fresh execution checks still apply, including to tools outside Oxagen's own service.

The knowledge graph is a required foundation for related code, policies, context, and evidence. Show exact source versions, trust, and sync state. Version control remains in charge of files; source systems remain in charge of their records. Actual business-record ingestion and its outcome screens are future work.

## Policies and data protection

Use reusable templates and simple forms. Customers should not need a policy language. A refund template could set illustrative limits of 20% per order, $100 per customer per workspace per day, and $5,000 across the workspace per day. Show the time zone, scope, used amount, held amount, and remaining allowance.

All applicable rules must pass. Agents share workspace limits; making more agents creates no new allowance. Configure block or request approval. Show who may approve an exception and which threshold it can change. An approval cannot waive an absolute prohibition. The protected tool service checks authoritative facts and reserves allowance before execution.

**Policies → Data protection** sets workspace block, redact, and replace rules. Show supported formats and known scan limits. Prompt and file entry require the paired [desktop guard](ARP-Desktop-app-spec.md). Raw content cannot first go to a cloud form, autosave, analytics, or upload. If the local path is unavailable, block submission with a clear recovery step.

The unpaired state is a designed screen, not an error. When no desktop guard is paired, the prompt field on Send work is replaced by a card: “Prompts are checked on your computer before they leave it. Open Oxagen desktop and choose Pair browser.” The card shows the six-digit pairing code, a “Not installed? Download” link, and the rest of the form stays usable so the person can pick the agent, work order, and target first. Every screen has its own empty state with one next action, and four shared failure fixtures: guard not running (“The Oxagen desktop app isn’t running on this computer. Open it to continue. Nothing was sent.”), browser unpaired, device revoked (“This device was removed from Support on Sep 19 by the workspace owner. Enroll again to continue.”), and harness not certified (“Codex 0.160 isn’t certified. Use 0.155.1, or switch this target to observed mode.”).

A budget block has its own copy on every surface: “Budget blocked. This call could cost up to $6.10. $4.70 remains for Support builder today. Raise the agent limit or wait for held funds to settle.” The preview before Send shows the tightest applicable scope, not one unlabeled number.

Publish versioned policies. Show draft, active, and each target's applied version. Pending rollout is visible. Urgent denies close affected gates; an old screen must not preserve old rights.

## Spend, results, and approvals

Show spent, held, pending, and remaining funds by operator, agent, and shared scope. A forecast helps planning but cannot authorize a call. The budget service reserves funds before spending.

Each work report must include the repo, changed files, work branch, configured default target branch, exact compared commits and diff, PR number and link, all available CI jobs and their coverage, persona name and ID, and unique tool names with use counts. Mark stale, unknown, redacted, and missing data. Store reports in the org-configured data plane used by this app.

Approvals show safe reasons, scope, evidence, expiry, and the exact action. Record decisions and recheck before execution. Future plugins may share scoped run controls and completion checks. Only the capability stub is in scope; no plugin marketplace is built here.

## Tokens, cache use, and speed

Let people drill from operator, agent, harness, or model into a run, turn, and call. Include custom agents built with an Oxagen SDK, which is a code library for connecting an agent. They use the same views and checks as Codex and Claude Code. Show the app or SDK version and which parts of the run were captured.

Show input tokens, output tokens, cached input read, and cache writes. Tokens are the small pieces a model reads or writes. Use the provider's stated counting rules: cached input may already be part of total input. Never add a subset twice. Explain whether a cache-hit rate measures requests or tokens, and show the count it divides by. Missing or unsupported counts stay unknown, not zero. Mark values as provider-reported, gateway-measured, client-reported, or estimated.

Keep token use and USD cost separate. Fewer tokens do not always mean a lower bill. Show known paid extras, such as reasoning use, server tools, and cache storage or writes, under the provider's pricing rules. Include retries, child agents, and Oxagen's own paid coaching or analysis. Split work cost from Oxagen assistance cost while counting each charge once in the full total. Show coverage gaps, pending charges, price versions, and estimates clearly.

Show how long a call took, how long the user waited for its first token, and time spent waiting in a queue or on tools. A missing time stays unknown. A fast first token does not mean the whole task finished faster. Compare similar work and show the time window and sample size. Token counts, cache rates, and lines changed are not scores for useful work.

## Coaching from recorded work

Keep Operator coaching linked to Spend and the run trace. Each suggestion names the observed pattern, the calls behind it, a change to try, and any risk to the result. Only show evidence the viewer may read. Use cleaned records; coaching must not recover or expose removed data.

For example, a person may paste a whole error trace on each turn. Suggest a short error excerpt and a targeted local file read only when the file exists, the agent has a suitable tool, access is allowed, and the content passes the local scan. A file path by itself does not give the model the file. Reading it can still use tokens and cost money. Do not promise savings from a path or a cache hit that has not happened.

Show a possible USD saving as a range, with its price assumptions, sample, and confidence explained in plain words. Include the cost of extra reads, retries, and coaching. State when there is too little evidence to estimate savings. Suggestions may overlap; do not add both savings when they remove the same work. Separate an estimated opportunity from a saving measured in a later comparable run.

Compare saved cleaned records without sending model or tool requests where possible. That comparison estimates an opportunity; it cannot prove a future answer or cache hit. A live trial needs an explicit opt-in to that trial, fresh access checks, local data checks, and its own budget. Opening a coaching card never reruns work or repeats an outside write.

## Find problems in custom agent loops

An agent loop asks a model for a next step, runs allowed tools, and sends their results back. Add a loop view to the same Run trace for SDK and custom agents. Link each model request, tool request, result, retry, and next model request by its recorded IDs.

Flag duplicate dispatches, missing results, results tied to the wrong call, repeated steps with no observed change, and retries that used extra time or budget. Distinguish a result still being awaited from one missing at a point where it was needed. Show whether a late result stayed excluded or entered through a recorded adoption decision. Repeated event delivery is not another tool use. An intentional retry is not automatically a bug.

Separate facts from advice. A missing matching result is a recorded gap; a claim that the agent is stuck is a guess with stated reasons. Let users inspect the relevant calls and dismiss an unhelpful suggestion. Any choice to steer, pause, or retry uses the usual checked control path. These diagnostics do not certify that a task is done. They add no built-in verifier or partner plugin to this phase.

See [shared control rules](ARP-design.md#5-send-work-and-steer-it-from-one-place), [desktop](ARP-Desktop-app-spec.md), [API](ARP-API-spec.md), [MCP](ARP-MCP-spec.md), and [CLI](ARP-CLI-spec.md).


See [shared control rules](ARP-design.md#5-send-work-and-steer-it-from-one-place), [desktop](ARP-Desktop-app-spec.md), [API](ARP-API-spec.md), [MCP](ARP-MCP-spec.md), and [CLI](ARP-CLI-spec.md).

## First-workspace contract

Follow the [first workspace and first run walkthrough](ARP-design.md#first-workspace-and-first-run). It connects the web setup, enrolled service, `.oxagen` repo files, scoped MCP route, and first recorded model call. The [sample-file guide](workspace-samples/README.md) includes exact JSON schemas, commands and receipt fields. These are proposed formats, not live configuration for today’s app.
