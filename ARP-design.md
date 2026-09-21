# Agent Run Protocol and the Oxagen design

Plain-language edition • Draft 0.2 • 20 September 2026

## 1. What this design would do

Oxagen would be mission control for agent operators and the people who oversee them. Its web app would be the hub for sending work, tracking results and spend, and setting limits. Its gateways would control access to models, tools, and context. Its **agent control plane** is the service that assigns work and sets what each managed run may do.

Codex and Claude Code are apps that help an AI agent do work. In this document, that kind of app is called a **harness**. The AI model makes choices and writes replies. The harness gives it a way to read files, run tools, and work on a task.

**Agent Run Protocol**, or **ARP**, is the proposed shared set of rules for those apps. It would describe how to ask for access, record work, pause a run, and start from a saved point. ARP should be open and versioned. Other companies should be able to use it without an Oxagen-only file format.

Policies set reusable rules. Agent settings show Permissions & limits. The required knowledge graph links code, context, policies, and run evidence to their exact sources.

The main promise is this: **define an agent once, send it work in a supported harness, and keep its access, limits, spend, and results in view.** ARP also lets work move from a safe saved point into another supported harness. A copy of the chat is only one part of that move.

Oxagen would hold the records for agents, people, skills, memories, rules, tools, and steering. A skill is a set of instructions, sometimes with code or files. A memory is saved information the agent may use later. Steering is a new direction sent to an agent while it works.

This is a design proposal. It does not say these features have been built or tested. Product documents cited below support findings about other tools. Each Oxagen adapter still needs to pass tests before it can claim support.

Read the surface requirements in [Desktop app spec](ARP-Desktop-app-spec.md), [Web app spec](ARP-Web-app-spec.md), [API spec](ARP-API-spec.md), [MCP spec](ARP-MCP-spec.md), and [CLI spec](ARP-CLI-spec.md). This design holds the shared rules they must all follow.

![A human operator or human team lead uses the Oxagen web app to choose a workspace and approved targets, dispatch work, steer runs, track spend and progress, and set work orders and context access. Durable routing saves each request, checks the right to start or steer, and creates a distinct run for each selected target when starting new work. Registered Codex, Claude Code, and custom harness targets each have a protected run guard. A protected desktop gateway scans full outgoing requests under workspace rules before remote egress. All model, tool, and context requests pass through mandatory gates that check record access, policies, work orders, and budgets. Only cleaned results and evidence reach Oxagen records and the web app. Sending work to several targets does not mean sending every target the same write. Shared writes still need their own checks.](diagrams/overview.svg)

*Proposed architecture. People set work orders and context access in the Oxagen web app, select approved workspace targets, and send each one its own work. Protected local gateways scan outgoing data before remote request gates. Only cleaned results and evidence reach the web app.*

## 2. The workspace is mission control

The Oxagen web app is the main place to run an agent team. An **operator** is a person who gives agents work and follows it. A **team supervisor** is a person who leads the operators. The **desktop guard** is the protected program that guards a run on a device. Earlier drafts called it the Oxagen Supervisor, the local guard, the protected service, or the desktop gateway. Those names mean the desktop guard. The word supervisor now refers only to the person. The [brand glossary](ARP-Brand-spec.md#names-and-words) is the one list of names every surface uses.

An **org** is the customer account. Identifiers call it `org_id`, the database schema is `org`, and the table is `org.organizations`. Where older text says company or customer, it means the org.

An operator can send work to any supported harness registered in the workspace that they may use. They can pick one target, a saved group, or all matching targets. Work may run on their laptop, another approved device, or a private worker. Each target still needs its own access check.

The app has a few clear views:

| View | What a person can do |
|---|---|
| Workspace home | See active work, queued requests, blocked runs, spend, and issues that need a person. |
| Send work | Pick an agent, mode, repo, target harness, and work order. Send a new task or follow up on named work. |
| Runs | Read progress and results. Steer, pause, stop, resume, or plan a fork with the right access. |
| Policies | Set reusable rules for tool use, data protection, spend, business actions, and reviews. |
| Agents: Permissions & limits | Set identity, tools, skills, and context. See effective rights and limits, with their source. |
| Work orders | Assign jobs and choose their targets, scope, deadline, and stricter limits. |
| Spend and results | Compare costs, useful outputs, rework, delays, and limits by agent, operator, or team. |
| Approvals | Review requests for access, exceptions that policy allows, and changes to limits. |

The app shows each workspace's agents, runs, people, devices, and checked-out repos. A repo is a project stored in a tool such as Git. A checkout is a local copy. The target list shows which harnesses are online, busy, offline, or no longer trusted. It also shows which controls each one supports.

Before an owner acts, Oxagen checks their current company and workspace rights. It cannot trust a browser field that says “owner.” A team supervisor may see team spend without seeing prompt text. The app filters reports by those rights. Reading results, sending work, setting rules, raising a budget, and granting access are separate rights.

### Policies govern work; a work order assigns it

**Policies** are the rules customers set in Oxagen. They apply across jobs and harnesses. Each agent has **Permissions & limits**. Permissions say what it may do. Limits say how far it may go, such as how much it may spend. Company and workspace rules set the ceiling. An agent or run may have tighter limits.

A **work order** is a saved assignment with binding limits. It states the job, its owner, which agent may act, and where it may work. It names allowed tools and context, rule versions, budget, expiry, and review points. A chat message may describe the job. It cannot grant the rights to do it.

For example, a work order can say: fix the login bug, use only the listed tools and approved files, spend no more than $20, and stop when the job is done or the work order expires. The operator’s shared spending cap still applies across all their agents.

The agent definition sets a ceiling on what it may do. Its work order and current rules may lower that ceiling. They cannot cancel an agent deny or a company rule. All spending caps that apply must hold. This includes caps for the operator and agent. A team budget does not give each target a fresh copy of the same funds.

Some work orders cover one task with a clear end. Others cover ongoing work with review points and an expiry. Do not force a fake finish on ongoing work. The plugin system is optional. If it is enabled, workspace rules and the work order set the required checks. A work order cannot remove a check that workspace rules require. This design defines only the plugin interface and its stub. It builds no plugins.

People change work orders through checked, saved updates. The app shows the draft, the published version, and the version each target uses. Urgent limits close the old gates. A delayed screen update does not keep old rights alive.

A **governed action** is one action checked and controlled by Oxagen, such as a model call or a tool call. The work order sets limits for the job. Each action must fit those limits and pass the current access, policy, and budget checks. Most checks run on their own. They do not ask a person each time. An approval is valid for one exact attempt. A changed request needs a new check.

![A versioned work order assigns a task to an agent and records its owner and fixed revision. Reusable policies and the agent’s Permissions & limits separately govern access, tools, context, and shared budget limits. A work order cannot grant rights beyond the agent definition or workspace. Every proposed model, tool, or data call is checked against current identity and record access, policy, approval requirements, and the shared budget. Outgoing data is cleaned locally before remote disclosure, and checks bind the final cleaned request. Oxagen saves the decision and reserves the bounded cost. The resulting governed action is one exact checked call. Its internal one-use authorization binds the exact request, caller, run, current authority, and expiry. The protected gate rechecks current access and uses that authorization once. Changed inputs or reuse are denied. Oxagen records the order version, action ID, cleaned request and output, usage, cost, and outcome. Uncertain remote results remain explicit and need reconciliation before an unsafe retry. One-use internal authorization does not make a remote system exactly once. Human approval is needed only when current policy requires it.](diagrams/work_order.svg)

*A work order records the task and who should do it. Reusable policies and the agent’s Permissions & limits govern access, tools, context, and spend. Each call must pass those current checks. A governed action is one exact checked call. Its gate uses internal authorization once. A rule may allow it without asking a person.*

### Control access to context as well as tools

The same app sets which records, memories, skills, and sources an agent may use. Check access before fetching context. Check again before sending it to a model. Keep the sources and access decisions in the run record.

Context may be allowed for the agent but barred from a given model or region. Extra context from a plugin needs the same checks. Local file reads and other ways to fetch private data must pass the protected gates too. Without those gates, strict context control cannot be claimed.

### The promises the app must keep

| What a user does | What Oxagen must do |
|---|---|
| Sends work to registered harnesses | Save the request, check each target, and show which work started or remains queued. |
| Steers all agents in a workspace | Find the right runs, send the message, and show a result for each run. |
| Sets allowed tools and context | Show the approved tool set and context. Block other paths before they act. |
| Reviews agent work | Link spend, prompts, tool calls, outputs, and results to the person, agent, and work order. |
| Sets limits and policy | Enforce them at the gates, including holding funds before each paid call. |

These promises apply to enrolled agents whose work passes through the required gates. A web login, an entry on a list, or a folder name alone is not enough. The rest of this guide defines the gates and their limits.

### Keep role, harness, and model separate

A team can ask Codex to build a change and Claude Code to review it, or swap those roles. The **role** says what work to do. The **harness** is the app that runs the agent. The **model** is the AI service it calls. Pick each one on its own, then check that the target supports that combination.

A reviewer gets a fresh session, its own identity and limits, and the exact version to inspect. It must not edit the candidate while reviewing it. A changed commit needs a fresh review. The web app shows both assignments and their receipts. Neither the implementer nor its model can grant itself approval.

## 3. Desktop gateway and local data protection

A local program called the **Oxagen Supervisor** controls each enrolled agent. We also call it the **local guard** here. It runs outside the area the agent can change. The agent must not be able to turn it off, change its rules, or steal its keys.

The guard checks each model request and tool action before it runs. It uses gateways to reach models, tools, and other systems. A gateway is a checked path through which requests must pass. Model and system keys stay in these trusted services.

For strict control, each agent runs in a protected space. Its file and network access are limited. Give each run its own space when practical. A connector is code that talks to a system such as a database or code host. One with private access should have its own space with even fewer rights.

The agent must not have a second, unchecked path to the model or a tool. Network rules cover child processes, direct addresses, name lookups, local links, redirects, and tunnels. A general web proxy can still let private data out. Check the target, action, and data as well as the route.

Hooks and SDKs help apps connect to Oxagen. A hook is code an app calls at a chosen point. An SDK is a code library used to build an app. Both can be bypassed if the agent can change or avoid them. Strict control needs a gate outside agent-owned code. A sandbox also needs its own network rules. [gVisor security model](https://gvisor.dev/docs/architecture_guide/security/)

A device owner with full power can remove Oxagen. To control that owner, use a managed device or a runner owned by someone else. A hosted agent also needs provider support for the gates. Without it, Oxagen cannot promise full control.

If a provider runs tools inside its system, Oxagen must approve each action first. Otherwise strict mode turns those tools off or uses Oxagen connectors. The same rule applies to remote child agents.

### Yes, Oxagen is a real model gateway

In strict mode, **every model call goes through an Oxagen proxy**. A proxy receives a request, checks it, and sends it on. The reply comes back through it. This includes calls from child agents, retries, and small calls to make a title or shorten a chat.

The required desktop app runs a protected local gateway. It checks and cleans the full request before any content leaves the machine. It then sends that clean request to the org's model gateway. That gateway checks access and cost, saves the clean request, and calls the model with a key the agent cannot read. The gateway may run in Oxagen's cloud or inside the customer's network.

Hooks and adapters also have a job. They link each harness to Oxagen, carry steering, and report safe pause points. They help build the tool belt and context. The local guard blocks other network and tool paths. Hooks alone do not give strict control. A tool built into the harness still needs a check before it runs.

Build the final model request locally after all due context and steering arrive. Scan it there. A remote service must not add new content after that check. Any content change must go back through the local scan and access checks. Model sign-in headers are added by the trusted gateway and stay out of prompts and records.

If a harness hides calls or cannot use this route, list it as observed or unsupported for strict mode. Being registered is not proof of control. Each harness version and feature set needs tests.

![Oxagen prepares allowed run context and steering. A harness adapter or custom SDK puts them into the next supported step. Hooks report events and help with steering, but are not the security boundary. The harness sends model, tool, and context requests through a protected desktop gateway outside the agent process and separate from the app UI. The local gateway scans the full assembled request, history, tool data, and attachments under workspace rules. It blocks, redacts, or replaces sensitive content before remote egress and blocks a send if required content cannot be checked. It also prevents direct network and credential bypass. Only cleaned requests reach the org model proxy, which authorizes each call, holds provider keys, and sends approved requests to models. Each org gate checks the ScanReceipt that binds the exact cleaned request to the current workspace scan policy. A missing, stale, or mismatched receipt blocks the request. Remote tool and context gates also check operations and record rights. Only cleaned evidence enters Oxagen records. Strict mode refuses any required route that cannot be guarded or disabled. A removable hook alone cannot stop bypass.](diagrams/gateway.svg)

*The protected desktop gateway is separate from the app UI. It scans the full outgoing request and applies workspace rules before data leaves the device. Only cleaned requests reach the org model proxy, tool and context gates, or Oxagen records. Adapters and hooks add context and steering but do not enforce this boundary.*

The main services have clear jobs:

| Part | Job |
|---|---|
| Web app and control service | Give operators one place to assign work, set work orders, and oversee the team. |
| Request service and queues | Save work requests, route them to registered targets, and track each result. |
| Agent registry | Hold definitions, work orders, skills, context rules, and access records. |
| Desktop app and protected local service | Enroll the device, scan outgoing data, and connect local harnesses. |
| Supervisor, or local guard | Stops actions that lack current rights and blocks unchecked paths. |
| Model gateway | Checks model requests, records them, and holds model keys. |
| Tool gateway | Checks tool calls and provides scoped access. |
| Context gateway and knowledge graph | Find related code, policies, context, and evidence; fetch allowed source versions. |
| Run record | Keeps events, files, and evidence. |
| Spend and work views | Show current costs, limits, progress, and results from saved records. |
| Save-and-fork service | Saves a stable point and restores allowed state. |
| Plugin capability stub | Reserves a checked path for future partner controls, context, events, and completion seats. |

These are roles in the design. They do not all need their own service at launch. The split between agent code and trusted control is required from the start.

### Local data protection is a shared rule

The required desktop gateway scans the **whole outgoing request** on the machine. This covers prompts, files, history, context, tool data, and metadata. Workspace **Policies → Data protection** choose block, redact, or replace. Only cleaned content reaches the model or Oxagen records. Apply this before upload, logging, tracing, graph ingestion, or sync.

The final model request is built and scanned locally after all additions. A signed `ScanReceipt` binds the exact cleaned bytes, files, scope, and rule version. The receiving gate checks that proof. Changed content needs a new scan and decision. File uploads and caches must use cleaned bytes from the start.

Web-app input uses a paired local path before any cloud form submit or autosave. If the local path is missing, block the submit. Scan tools and supported file formats locally. Do not ask a cloud scanner or model to inspect raw secrets. Block unreadable files, incomplete scans, and unknown paths. No detector can find every password or private fact. Show its limits and test each supported path.

New raw copies stay only in brief local memory by default. Do not upload raw matches, raw hashes, or replacement maps. Original source files stay in place. Separate local retention requires explicit rights and stays outside normal sync. Removed data limits replay of the original. The record still shows exactly what the model received.

The [Desktop app spec](ARP-Desktop-app-spec.md) defines setup, screens, the protected service, local scans, updates, failures, and recovery. The [API spec](ARP-API-spec.md) defines the shared request contract. The exact data-protection fields remain in chapter 23.

![Raw prompt text, full history, tool inputs and results, tool schemas, files, images, attachments, URLs, and request headers enter the protected local desktop gateway. The service is separate from the app UI and protected from the controlled agent. The workspace scanner checks the full assembled outgoing request and every required attachment. Workspace rules may block the send, redact content, or replace sensitive values. If required content cannot be checked, the send is blocked. The blocked path does not upload raw content or raw evidence. The allowed path carries only the cleaned full request and a minimal ScanReceipt without raw text. This receipt binds the exact cleaned request digest and workspace scan-policy version. The org gateway checks the receipt and blocks missing, stale, or mismatched receipts. Changed requests are rechecked under current access and policy. Only this cleaned form reaches the org gateway, approved model or tool, and sanitized Oxagen evidence records. The same path applies to outgoing reports and telemetry. No raw request, raw evidence, or replacement mapping may take a separate cloud path.](diagrams/data_protection.svg)

*A protected desktop gateway scans the full assembled request under workspace rules. It may block, redact, or replace content. Only the cleaned form can reach org gateways, approved models, or Oxagen records. The app UI and harness cannot use a raw-to-cloud route.*

## 4. Enroll devices and bind workspaces

The local guard keeps a protected outbound link to Oxagen. It registers each supported harness target with its device, owner, version, capacity, and controls. It links later runs to their assigned agent and operator. It binds each local repo copy to an approved workspace.

That link uses the connected repo's stable ID and trusted facts about the files. A Git remote address helps check the link. The agent must not choose its workspace by editing that address.

Users may launch through Oxagen or an enrolled tool. Set the workspace link before the first controlled action. Attach an old session only if the adapter can prove the needed control. Otherwise restart it under the guard. Mark earlier history as partly observed.

Workspace rules follow the run and its children. Changing folders does not remove them. A call from another folder still needs rights to touch protected workspace files.

Folder links, extra Git worktrees, and runs across several repos need clear handling. Oxagen finds their true IDs and applies all relevant rules. The agent cannot choose the least strict workspace.

Each device has a time-limited presence record. The app shows online, stale, or offline status. Lost contact does not prove that work stopped.

### First workspace and first run

This walkthrough specifies the setup flow to build. The commands are proposed, not a released CLI. Names such as `support` and `local-codex` are example aliases. Oxagen resolves them to stable IDs after checking the signed-in org. The sample files contain invented IDs, not live access.

#### The quick start must reach a first run in one command

The six-step walkthrough below is the reference path. It has about twenty decisions across the web app and the CLI before the first model call. A person trying Oxagen for the first time must not need all of them. The product must also ship a one-command path:

```bash
oxagen quickstart
```

Quick start runs the same gates as the reference path. It asks nothing it can decide safely. It signs the person in, enrolls the device, and creates a personal workspace when the person has none. It makes that person the workspace owner and operator. It detects an installed supported harness in the current checkout, registers it, links the checkout, and writes the `.oxagen` files. It applies the org's default data-protection template, a read-only work order, and a small spend cap of a few dollars. It then submits one read-only task and prints the run start receipt.

Quick start may not weaken any control. It cannot skip the local scanner, create a write-capable work order, raise a cap above the org default, or register a harness the adapter does not support. When a required piece is missing, it stops at that step, names the step, and prints the exact command to continue. A solo developer with no admin reaches a governed first run alone. A person in a managed org gets the same flow inside the limits their admin published. The full walkthrough stays as the reference for teams that want each step explicit.

#### 1. Create the workspace in the web app

Sign in, select the organization, and create a workspace called **Support**. Whoever creates an organization is its first owner. That person holds the owner, operator, policy admin, and approver roles in every workspace they create until they delegate them, so a solo developer needs nobody else to finish this walkthrough. Sign-in supports email with a second factor; single sign-on is optional, not required. The data plane defaults to Oxagen-hosted and can be changed later. Being an owner of a different organization grants nothing here.

Add a model route under **Policies → Model routes** before anything else. Paste a provider key or choose an Oxagen-managed model. The model proxy stores the key; the device never sees it. **Send work** stays disabled until one route exists and says so: “No model route yet. Add a provider key to send work.”

Connect the example repo `acme/support-app`. Choose **main** as this workspace's default branch. This is an explicit setting, not an assumption that every repo uses main. Reports compare the work branch with the exact commit on this configured target. Save the repository and settings revision.

Choose the org's approved data plane and confirm where cleaned records will live. Set Data protection rules before accepting prompts or attachments. Set allowed model routes and a shared operator budget. Publish the policy revision. Targets must confirm that revision before strict work starts.

Create or select the **support-builder** agent and its **code** mode. Assign its tools, skills, and allowed context. For the first run, use a work order named **first-doc-check** that permits reading the repo, forbids writes, and has a small approved spend cap. The amount must fit the available model price bounds; a cap is not a promise that work will fit.

#### 2. Enroll the protected local service

Install a signed desktop build for the machine's OS. The service must pass that platform's strict checks. Then, from the repo checkout:

```bash
oxagen login
oxagen device enroll
oxagen workspace use support
oxagen harness register codex --name local-codex
oxagen repo link . --repository support-app --target local-codex
oxagen agent use support-builder --mode code
oxagen status --json
```

The repo link uses the connected repository identity and trusted local evidence. A changed Git remote or copied config cannot switch orgs. Register the enrolled harness first; it stays unbound and cannot launch. Linking the checkout then establishes its repo scope. Registration checks the exact harness and adapter version. Do not mark it strict merely because its name is Codex. An unsupported adapter blocks this walkthrough until an approved version is used.

The protected service holds device keys and grants outside the checkout. It maintains its outbound control link after the browser closes. If web prompts or attachments will be used, pair that browser with the authenticated local bridge before entering sensitive content.

#### 3. Create the repo's `.oxagen` files

```bash
oxagen repo init --path . --agent support-builder --mode code
oxagen repo sync --path . --plan
oxagen repo sync --path . --apply
```

`init` exports the allowed references and requested defaults. It does not copy secrets or grant access. `sync --plan` shows what will change. `sync --apply` fetches only context and steering that the current identity may read, records the exact versions, and updates the protected local cache. A machine-readable reply names the applied configuration revision and safe gaps.

Use this layout:

```text
.oxagen/
  workspace.json          tracked: workspace/repo references and defaults
  context.json            tracked: requested source references
  steering.json           tracked: requested reusable guidance
  schemas/                tracked: pinned format definitions
  .gitignore              tracked: excludes all generated state
  state/                  ignored: safe receipt mirrors, never grants
    sync-lock.json
docs/
  start.md                tracked source context in this example
  agent-guidance.md       tracked source guidance in this example
```

Commit only content the repo's readers may see. Even IDs and titles may be private. Local generated state is ignored as a further guard, not as access control. Keep keys, provider credentials, replacement maps, raw scan matches, and private context payloads out of this tree. The service's trusted state lives outside agent-writable files.

#### 4. Check tools and loaded content

```bash
oxagen harness configure local-codex --mcp oxagen
oxagen tools list --target local-codex --json
oxagen repo validate --path . --strict --json
```

The adapter sets the supported MCP route without putting a bearer token in a repo file. One Oxagen endpoint returns this agent's allowed tools in this workspace. The guard must still block native and third-party bypasses. A successful tool list does not prove that a particular call is allowed.

Validation checks enrollment, checkout binding, signed policy, exact agent and mode, required source access, source versions, local scan support, model route, and pending state. It also checks that the loaded tool belt matches its schemas. A clean result is a preflight result, not proof that a run started.

#### 5. Start one small assignment

Create a local `first-task.md` containing: “Read docs/start.md and report the test command it names. Do not change files.” Then submit it through the local service:

```bash
oxagen work submit --target local-codex --work-order first-doc-check \
  --config .oxagen/workspace.json --prompt-file first-task.md --json
oxagen work status <returned-work-id> --wait started --timeout 60s --json
oxagen run status <returned-run-id> --json
```

Angle-bracket values come from the preceding response. The service scans the local input before upload. It assembles and scans the final request again, checks current rights, reserves funds, and sends the approved bytes through the model proxy.

Acceptance of `work.submit` is not enough. Success requires a trusted **RunStartReceipt**, backed by saved start and first-model-attempt events. It must bind the run and target, checkout and work order, agent release and mode, policy revision, loaded config revisions, context and steering manifests, actual composition receipt, final ScanReceipt, and the actual first model attempt. A local lock file or screenshot is not this proof. These records show what the model received, not that it obeyed the instructions.

#### 6. Inspect the result and try steering

```bash
oxagen report show <returned-run-id> --json
oxagen run logs <returned-run-id> --follow
oxagen run steer <active-run-id> --message-file steering-note.md
```

For a live run, steering without `--interrupt` joins the next eligible boundary. Add `--interrupt` only when a confirmed pause and restart are intended. A finished run cannot be silently restarted by steering.

The report shows the repo, work and configured target branch, exact compared commits, permitted diff and files, persona name and ID, tool-use counts, and PR/CI state. For this read-only assignment, no changes and `PR: not_created` may be the correct result. Confirm that the report is durably saved in the chosen org store. Pending sync is not a central save.

#### Sources, updates, and conflicts

Oxagen is the authority for identity, grants, published policies, tool bindings, and agent releases. Version control is the authority for the tracked `.oxagen` files and VCS context history. The knowledge graph records the source versions and relationships; it cannot turn an edited repo file into a grant.

Repo config requests a selection. It cannot raise a budget, weaken a deny, choose an unapproved endpoint, or install a tool. Guidance from the repo remains task data at its stated priority. It cannot override policy or become a system instruction merely because a file calls itself “steering.”

Each sync records source IDs, versions, cleaned payload references, provenance, and access scope. A branch change invalidates the old local loaded state. Re-resolve the repo binding and apply a new snapshot. A running turn keeps its recorded input; a new source version enters through a recorded next-boundary update. Urgent revocations close the old gates at once.

If both a source and its local copy changed, show the conflict. Do not overwrite either or silently merge instructions. Local edits to an Oxagen-owned exported record are proposals; they need the publish rights and review that source requires. Loss of access removes affected cached content and blocks reuse. An old export does not preserve permission.

#### Recover from a blocked step

| Result | Next step |
| --- | --- |
| Device not enrolled or revoked | Open desktop enrollment. Use an approved device and identity; do not copy another device's files. |
| Tool, record, or workspace denied | Read the safe reason and request the named right. A config edit cannot fix a denial. |
| Stale rules or source versions | Restore the service link, sync, and validate again. Keep old evidence as history. |
| Unsupported harness or scan format | Use a tested adapter or an approved local conversion, then recheck. Do not lower the control level silently. |
| Missing private store or local scanner | Wait or repair the configured route. Do not fall back to public storage or remote raw scanning. |
| Start or outside result unknown | Look up the same request and reconcile it. Do not submit a second copy with a new key. |

See [desktop](ARP-Desktop-app-spec.md), [web](ARP-Web-app-spec.md), [CLI](ARP-CLI-spec.md), [API](ARP-API-spec.md), [MCP](ARP-MCP-spec.md), and the [schema](ARP-Schema-spec.md) for the shared contracts.

Read the [sample-file guide](workspace-samples/README.md). The package includes all six JSON schemas, the proposed `.oxagen` files, and an example start receipt. The sample IDs and signature are invented and grant no access.

## 5. Send work and steer it from one place

Starting new work and steering a running agent are distinct actions in the web app. The person chooses which they mean. A general message must not launch extra runs or interrupt work on its own.

### Send new work to registered harnesses

The operator picks an agent release, approved mode, work order, repo, and target. A **target** is an enrolled place where a supported harness can run. The agent has its own identity. A target may host several runs only if it has room and keeps them apart as its rules require.

Send a request to one target or a fixed group. Before sending, the app shows the targets and whether they share a budget. A group request creates one child request per target. Each child has a stable ID, its own state, and a link to the group request.

Oxagen checks the sender's rights to each target, agent, repo, and attached context. It saves the request before placing it in the work queue. Each device's guard picks up work through its protected outbound link. A laptop behind a firewall needs no public inbound port.

Before starting, the guard rechecks access, rules, funds, files, and room to run. It uses the tested adapter to start the chosen harness. It then reports the new run ID. Mark a request **started** only after that start is recorded. Saving or delivering a message does not prove a start.

Show each target as queued, waiting for capacity, waiting for a device, starting, started, blocked, expired, or cancelled. Runs then have their own progress and result states. A group may partly succeed. One target's success must not hide another's failure.

An offline target may hold a request only until its stated expiry. On reconnect, recheck rights and versions before starting. If cancel or expiry was saved before the right to start, do not start the work later. If start was allowed first, cancel becomes a stop request for that run. It is complete only when the stop is confirmed. Closing a browser tab does not cancel saved work. A cancel needs its own saved command.

Repeated delivery must not create extra runs. Each child request may have at most one active run, with one current worker allowed to own it. If the link breaks during a start, keep the result unknown while checking that same request. Do not copy the work to another machine until the first start is ruled out or safely stopped. Giving a new worker ownership must disable the old worker's right to own that work.

If a target is busy, let the request wait or use a separate approved work area. A private job must not move to a public worker just because its device is offline. A new target needs fresh access and placement checks. Do not slip it into an existing chat. Follow-up work must name the run and use its steering or next-turn path. Runs that work at the same time need separate file copies. Otherwise they need checked ownership of shared files and outside resources.

### Keep the hub responsive as use grows

The web request saves work and returns a tracking ID. It does not wait for each laptop or model to finish. Services deliver queued work and stream progress to the app. A lost browser link resumes from the last saved event.

Split queues and workers by company and workspace. Set fair limits on queued work, active runs, group size, and event traffic. Slow devices and large outputs must not block other customers. Put urgent stop and access-revoke commands ahead of bulk work. Each target must still confirm the result of those commands.

The live dashboard shows saved records the viewer has rights to see. Show when it was last updated and whether data is missing. A stale chart cannot grant access, confirm a pause, or let a run exceed its budget. The trusted gates and budget records make those choices.

### The device pulls work through three named operations

The desktop guard's outbound link is the load-bearing connection of the product, so its contract is explicit. Three trusted worker operations drive the `queue_deliveries` lease state in the schema:

| Operation | What it does |
|---|---|
| `work.claim` | The guard asks for deliveries addressed to its targets. Each claim returns a lease with an owner epoch and an expiry. A lease that expires unrenewed returns the delivery to the queue. |
| `work.extend` | The guard renews a lease it still holds, naming the lease epoch. A renewal with a stale epoch is refused. |
| `work.start_ack` | The guard reports the recorded run start for one delivery. The request is marked started only after this record exists. |

Each target has its own event stream, so a device receives only events for runs it owns, not every event in the workspace. A guard that reconnects after a gap does not replay the stream or poll each run. It calls one `target.control_snapshot` operation that returns, for every run the target owns, the current authority epoch, any pending pause, stop, or revoke command, and the steering inbox high-water mark. The guard applies that snapshot before it admits any further step.

### Steer runs that are already active

When an owner clicks **Steer**, Oxagen saves the message and a fixed list of matching runs. That list includes their delegated work. It also records who sent the message, its expiry, and whether it should interrupt.

One click can reach many devices at different times. Track each target and retry safe deliveries. Do not apply the same message twice.

A one-time broadcast covers the sessions chosen when it is sent. New sessions do not silently join later. A separate standing workspace rule can apply to future sessions. An idle session saves the message for its next request. A run that ends first is marked “ended before application.” An offline run stays visible as pending or offline.

### Steering without an interruption

An **execution boundary** is the end of a model request, one tool action, or a declared group of tool calls. The group must have a fixed size and membership before it starts. It cannot keep adding work to delay steering.

After Oxagen orders the steering message into a run's control inbox, the current allowed step may finish. At the first boundary after that, the next step waits. Oxagen puts the message into the next model request, checks access, and lets work continue. No new human chat turn is needed.

Each next-step gate must check the authoritative inbox. Sending a push message is not enough. Oxagen records which came first: the new steering or permission to start the next step. If steering came first, the next step must use it. If the step was approved first, it may finish, then steering applies.

In strict mode, work waits when the gate cannot sync with the inbox. A mode that allows old cached instructions while offline must state its weaker timing promise.

The gate does not make a control-plane round trip before every step. Oxagen pushes inbox changes over the target's control connection with a monotonic high-water mark and a short lease. While the lease is valid, the gate admits the next step locally against the mark it holds. When the lease lapses or the connection drops, the gate waits for a fresh mark. The bounded staleness is the lease length, and the design states it as a number in the capability profile so a fifty-tool-call turn does not pay fifty round trips.

Tool calls proposed under the old context wait too. They must not run ahead of the model seeing the new direction. Oxagen records whether they were dropped or chosen again with fresh permission. If the current step never ends, steering stays queued until an owner interrupts it.

### Steering with an interruption

Oxagen first confirms the pause using chapter 6. It adds the message and resumes with fresh access. The interrupt-and-steer click allows this restart. No second click is required.

A target that has not reached a confirmed pause remains blocked. Late replies from its old request stay out of the resumed work.

The web app shows progress such as accepted, delivered, queued, boundary reached, and applied. “Applied” names the exact request that received the message. It does not mean the model obeyed it. The app must never say “applied to all” while even one target lacks that record.

![A person submits a workspace message. Oxagen saves the target list and places it in each run inbox. Without interrupting, current admitted work ends and the message enters before the next step. With interruption, Oxagen first confirms a pause, then applies the message and resumes. The web app shows per-run receipts, including offline runs.](diagrams/steering.svg)

*A workspace message targets a saved list of enrolled runs. Each run gets its own receipt. Offline runs stay visible as waiting.*

## 6. Pause only when the stop is confirmed

Clicking pause asks for a stop. It does not prove the run stopped. A cancel reply, closed link, timeout, or one worker's reply is not enough.

The visible states are:

```text
running → pause requested → pausing → paused → resuming → running
```

Show **paused** only after the trusted local guard saves proof of the pause. If proof is missing, keep the state **pausing** and show why. New work stays blocked.

The pause command returns a saved request ID. Completion is a separate event. Sending the same request again returns the same operation. Resume must name a confirmed pause and the expected run version. It cannot jump ahead of the pause.

### The four checks for a confirmed pause

1. **Close the gates.** Save the pause request and advance the access version. Block new model calls, tool calls, and old-result acceptance. Save this ordering as one controlled state change. Calls already allowed to start join the list of work in flight. Later calls fail the gate. A result is active only if its acceptance was saved before the fence closed. Saving its bytes alone is not acceptance. Provider clocks and arrival order cannot change this rule.
2. **Reach every worker.** Cover child agents, tool workers, queued retries, unsent work, and file writers. Separate forks are outside this scope. Each relevant gate must confirm the stop. Proof of a stop, isolation, or expiry of enforced access may take its place. Account for clock error when using expiry. A missing reply is not proof. Unsent work must recheck the fence before sending. Old permission cannot be reused after resume.
3. **Stop changes.** Stop or isolate processes that can change files, context, memory, or shared resources. Check work already sent to other systems. If a write might still happen, the pause is not confirmed. Evidence collection and separately allowed read-only checks may continue.
4. **Save a stable point.** Save accepted events and required files. Record the workspace and context. Mark how far each worker got in its stream. Record the state of every pending request. Commit this proof and the paused state together. The pause ID, access version, and expected run version must still match. An old reply must not pause a newer run.

A normal pause need not create a full portable save. It still needs stable state that can be checked for safe resume. A fork needs the fuller saved state in chapter 13.

A remote model may keep computing after pause if its replies are isolated and it can cause no effects. Mark it “upstream stop unconfirmed.” This proves that Oxagen-controlled work paused. It does not prove the provider stopped work or billing. A hosted tool that may write data does not meet this rule.

The pause record lists its scope, workers, and access versions. It records the closed gates, replies or proof of isolation, and the end of each accepted event stream. It names stable files and context, pending requests, detached requests, and proof that the record is unchanged. Paused state stays fixed while new evidence may arrive.

### Buffered replies need the same gate

Delivery to the harness, model context, and active UI streams must check the access version too. A response not released for delivery before the old gate closed stays evidence-only. This holds even if its acceptance was saved earlier. It cannot drain into the resumed run on its own. If delivery had started, the pause record must show what was actually applied.

The harness may have hidden buffered state. If that state is uncertain, isolate it or rebuild from a known state. Do that before calling the pause complete.

### A stuck pause has a defined exit

A pause that cannot be confirmed must not hold a concurrency slot forever. One hung connector would otherwise occupy an operator's or workspace's capacity until someone edits the database. An operator with the right access may **abandon** the run. Abandon records every unresolved effect as unknown, keeps every hold, revokes the run's credentials and treats that revocation as proof of isolation, moves the run to **outcome unknown**, and releases the counted slot. The run cannot resume. Its evidence stays. This is the only transition into outcome unknown from pausing, and the state machine in this chapter includes it.

![A pause request holds new actions and late results. All workers must acknowledge the hold or be proved isolated. Local files and active context must stop changing. Unknown outside writes keep the run pausing. A confirmed saved boundary allows the paused state. Late replies go to evidence only and can enter a future run only through a separate checked adoption.](diagrams/pause.svg)

*A pause request is only the start. Oxagen reports paused after it holds new work, confirms all workers are quiet, and saves a stable boundary.*

## 7. Keep late replies without letting them take over

Replies from a stopped request need two checks for active use. Both acceptance and release for delivery must come before the old run's gates closed. Otherwise the reply stays evidence-only. This holds even if the model wrote it earlier or it arrives after resume.

Oxagen uses its own saved map to link the reply to the old run, branch, request, attempt, and access version. It saves the bytes, source time, arrival time, and reason for exclusion. Repeated deliveries count as one fact. Conflicting content with the same ID is flagged.

Late text or tool calls must not enter any of these places on their own:

- The resumed chat or next model request.
- Agent memory or search results the agent can use.
- A tool queue or a new approval.
- Task success checks or saved restart state.

A late reply cannot finish the resumed turn or revive cancelled work. Partial text shown before the pause stays marked interrupted. Late chunks do not quietly finish it. A person with the right access may view the excluded reply as evidence.

Late receipts may still settle a bill or show that an earlier outside write succeeded. Never throw that fact away. It may block an unsafe retry or resume. If it shows that a confirmed pause was false, record the breach and stop the affected work. Keep the old pause record intact.

Resume checks the saved boundary and current rules. It starts a new access version and names the exact context to use. Old replies keep their old version. If excluded text entered hidden harness state, it must be removed safely. Otherwise restore a clean point or start a fresh session.

Reusing late text needs its own saved **adoption decision**. A controller with the right access names the evidence, target, and purpose. It checks current rights and freshness, then records any text changes. The adopted text enters at a future model boundary. It does not change the old pause record.

A rule may automate that decision. Arrival alone never grants adoption. Any tool call in the text needs fresh action rights.

For example, request M runs under access version 12. Pause P closes the gates at version 13. Oxagen confirms P. M then returns a tool call, which is saved but not run. Resume starts at version 14. M stays excluded unless a separate decision adopts its text.

## 8. Tool belts, permissions, and business policies

Each agent definition holds an **allow list** and a **deny list** of tools. These are saved rules in Oxagen. A prompt that asks the agent to avoid a tool is not enough. Tools absent from the allow list are blocked. A deny beats an allow. A tool ban covers new versions too unless the rule names just one version.

A **tool belt** is the set of tools an agent may use in its current role and workspace. A persona or mode is an approved role for that agent. The mode can narrow its tool belt. It cannot grant more than the agent definition allows. Changing a name in a chat grants no rights.

Oxagen checks the active agent, person, mode, workspace, and run. It uses trusted sign-in and run records for those facts. A folder path, tool argument, or model claim cannot choose a more powerful identity.

Start with the definition's allowed tools. Keep only those also allowed by the mode, workspace, person's grant, and run rules. Remove every denied tool. If a required check fails or is missing, block use. A tool in that set still needs checks on each call's inputs and target records.

### Customer tools belong in the same catalog

Customers can define tools such as `lookup_customer` and `process_refund`. They assign those tools to agents in the web app. Each tool has a stable ID, a version, a known route, and rules for its inputs and results. Two tools with the same display name are not the same tool.

The **catalog** is Oxagen's list of registered tools. It can hold Oxagen tools and customer tools. A customer may host its code behind its own firewall. Oxagen still controls the tool's entry, assignment, and path of use. Owning the tool's code and governing its use are separate things.

Only approved catalog tools are offered through Oxagen's MCP service. An outside tool is blocked by default. To allow one, first register its true identity and put a checked gate in its path. Assigning it to an agent does not fix an unchecked path.

### One MCP service can serve many tool belts

**Yes: one logical MCP server can serve the right tools for each agent and workspace.** It can run across many machines behind one address. MCP lets the tool list depend on each request's access rights. It must not depend on a shared “current agent” or past calls on a connection. [MCP tool lists](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)

The trusted guard gets a short-lived grant for one agent, mode, workspace, and run. Each request presents that grant. The server checks it and finds the matching tool belt. The model never gets a broad owner key to choose its own scope. MCP checks access on each HTTP request, including whether its token is meant for that server. [MCP access rules](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)

Both agents below use the same MCP address:

| Agent and mode | Workspace | Tools it sees |
|---|---|---|
| Support agent, read mode | Shop A | `lookup_customer` |
| Refund agent, refund mode | Shop A | `lookup_customer`, `process_refund` |
| Support agent, read mode | Shop B | Shop B's assigned lookup tool and records only |

A client that holds just one login per MCP setup may need a separate setup for each agent. A local Oxagen adapter can also keep those grants apart. All can still reach the same service address. Never solve that client limit by sharing one broad grant.

### The tool list and the lock have different jobs

The list tells the model what it can ask to use. The lock checks what may run. `tools/list` returns the allowed catalog view. `tools/call` checks current rights again before doing work. Guessing a hidden name or using an old list does not get past that check.

For `lookup_customer`, check the right to read the named customer. For `process_refund`, also check the account, amount, and any needed approval. The tool's own broad service key does not grant those rights to the agent.

MCP alone cannot block tools built into a harness or served by another MCP server. Oxagen's protected guard must cover those paths too:

| Path | Required control |
|---|---|
| Oxagen or customer catalog tool | Check the MCP call before sending it to the tool. |
| Another MCP server | Route calls through a checked proxy, or turn that server off. |
| Built-in file, shell, or browser tool | Check before it runs, replace it with a guarded tool, or turn it off. |
| Tool run inside a model provider | Require a check before each action, or turn it off. |
| Tool used by a child agent | Give the child its own grant with no more rights than its parent. |

The adapter maps real tools to their stable catalog IDs. Unknown or false mappings fail the check. Oxagen also checks the tool menu in each model request. If a harness cannot block or turn off an unchecked path, it cannot run in strict mode.

An allowed shell or browser must not become a back door to a denied tool. Keep keys out of agent code. Check network routes and the actions on protected systems. Banning the name `process_refund` alone would not block a direct call to the same refund service.

![Oxagen stores a versioned agent definition with allowed and denied tool lists. The effective toolbelt keeps only tools allowed by that definition, the approved mode, workspace, operator rights, current policy, and current run grant. Deny wins and unknown tools are denied. One logical Oxagen MCP endpoint authenticates each request and returns this agent and workspace’s allowed managed catalog. In the support-agent example, lookup_customer is shown and process_refund is denied. Every tools/call is checked again for trusted identity, tool assignment, inputs, approvals, access to each record, current policy, run state, and budget. A protected run guard also checks registered native, shell, file, other MCP, and hosted tool paths. Only an exact governed action with a saved decision, reserved cost, and current authorization may run. A hidden or stale tool name does not grant permission. MCP alone cannot block other tool paths. Strict mode refuses a harness setup whose required tool paths cannot be guarded or disabled.](diagrams/authorization.svg)

*The agent definition sets allowed and denied tools. The active mode and workspace can narrow that list. One authenticated Oxagen MCP endpoint shows allowed catalog tools. A separate protected guard also checks native tools and other MCP tools before they act.*

### Change a tool belt without leaving old rights active

When rights shrink, close the old action gate first. Advance the access version and reject old single-use approvals. Queued calls do not keep old rights. Work already sent may need a confirmed pause and a check of its outcome. A new deny cannot undo a past write.

For a mode change, check the caller's right to switch. Then bind the new mode to the run and rebuild its tool belt. Refresh the model's tool menu before its next request. A request to change mode is not proof that the change took effect.

Keep cached lists private to each access context. Notify clients when lists change. A lost notice may leave an old menu on screen. It must never let an old grant run a denied tool. Page links for a long list must stay tied to the same grant and catalog version. [MCP cache rules](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)

If a client cannot safely refresh tools, restart its tool setup at a safe boundary. Rebuild model context if it holds tool details it may no longer see. Keep late results under the pause rules in chapters 6 and 7. Save which tool belt the model saw and which checks each call passed or failed.

### Bash rules are one example of tool policy

Bash is a shell used to run commands. Every controlled Bash call must pass through a protected local broker. That check happens before the shell starts. The broker checks the whole call against the current workspace rule. It uses the true work folder, shell, allowed settings, and original command text.

If a deny rule matches, block the entire call. No command substitution, pipeline prefix, or earlier part may run. The checker must never run a command to find out what it means.

The web app must separate a saved draft rule from a rule in force. A new rule takes effect for a target when its gate confirms the change. Until then, block that target from further work. Show targets still pending or offline. Each send checks the current rule version. A new rule cannot undo work already sent.

Users need to choose what kind of ban they mean:

| Rule type | What it blocks |
|---|---|
| Text match | Calls that contain specified text or a defined pattern. Case and encoding rules are explicit. Quoted examples and comments may match too. |
| Shell command match | Supported command forms, flags, pipelines, and nested substitutions found by a parser. Strict mode rejects forms it cannot resolve or support. |
| Program ban | A named program, including child launches, through a supported operating-system gate. |
| Capability ban | The file, network, or connector action, whichever program tries it. |

A text rule can block a Bash call that contains the denied command. It does not prove that every way to do the same work is blocked. Aliases, scripts, `eval`, or Python may do the same job. Stronger bans need program and resource controls.

Open shells, later terminal input, nested shells, and child code must not create an unchecked path. Strict mode must ban those paths or use tested process and resource gates to control them.

Editable hooks, proxy settings, and a folder check alone are not enough. Strict Bash control needs the protected broker. If an agent cannot use it, that workspace must reject the agent.

### Policies for business actions

Customers set **Policies** in Oxagen. Each agent has **Permissions & limits**. These show which tools and data the agent may use, what it may spend or change, and when it must ask a person. A work order is a job given to an agent. It can add tighter limits for that job, but it cannot remove company rules.

A **governed action** is an action Oxagen checks before it runs. Oxagen handles the internal proof of approval. Customers set the rules and review the actions.

#### Set rules with forms

Offer reusable policy templates for common tasks. A refund template can ask for the largest share of an order, the daily amount per customer, the daily amount for the workspace, and what happens when a limit is reached. Customers should not need to write Rego code to set these rules. Advanced rules use the same checks and access system.

Here is an example, not a required default:

| Rule | Limit |
|---|---|
| Total refunds for one order | 20% of the order's eligible paid amount |
| Total refunds for one customer in this workspace | $100 per day |
| Total refunds for the workspace | $5,000 per day |

Name the currency and the time zone that defines a day. Define which charges count in the order amount. Use the real order and customer IDs from the payment system. The agent cannot supply its own totals or change an ID to get a fresh allowance.

If an order's eligible paid amount is $200, its total refund cap is $40. A prior $15 refund leaves $25 under that rule. A lower customer, workspace, agent, or job limit can reduce that amount further. Every rule must pass.

#### Check before money moves

Having permission to use `process_refund` does not give an agent permission to refund any amount. The trusted refund service reads the current order, refund history, rules, and reserved amounts. It holds room under every limit before sending the refund.

Two agents cannot each spend the same remaining allowance. A retry must not create a second refund. If the payment service stops replying, keep the amount reserved until the outcome is known.

Refunds made outside Oxagen count too when the rule claims to cover all refunds. To promise that limit, the payment system must enforce it or give Oxagen control over every refund path. Reading history alone cannot prevent a cashier from making another refund at the same time. Show a narrower promise when those paths cannot be controlled.

#### Explain blocks and approvals

A policy can block an action or ask a permitted person to approve an exception. Approval can cross only a threshold the policy marks as overridable. It cannot remove an absolute ban or a higher hard cap. Check the facts and reserve the funds again before acting.

The app shows the effective limit, its source, the amount used and reserved, and what remains. A blocked action names the rule that stopped it. An approval request shows the exact refund, the requested exception, who may decide, and when it expires.

These controls sit at the refund tool and its credentials. The model proxy alone cannot stop a refund through an unchecked tool or network path.

![A work order requests a task but grants no new rights. The agent’s Permissions & limits and reusable business policies separately govern the task. This example caps total refunds at 20 percent of the order amount, 100 USD per customer per day, and 5000 USD per workspace per day. These are sample policies, not defaults. Current tool and record access must pass. The shared limit service reserves the proposed amount atomically across every applicable scope, using a defined currency and day boundary. Concurrent agents share these totals. If any permission or limit fails, the refund does not run. A governed action binds the exact approved refund request. The protected tool gate and trusted refund connector enforce it; controlling model traffic alone is not enough. The connector returns an authoritative receipt. Known results settle the actual amount and release only confirmed unused reservations. Unknown results keep their reservations and require reconciliation before any retry that could duplicate a refund. Cleaned decisions and receipts are saved through the local scan path. A work order references work; it does not own or replace reusable business policies.](diagrams/business_policy.svg)

*Example rules, not built-in defaults. Reusable policies and the agent’s Permissions & limits govern each refund. Oxagen checks all limits and reserves room across every shared total before the trusted tool can act. A model gateway alone cannot enforce a refund limit.*

## 9. Keep one trusted set of agent records

An agent has a stable identity, a set of rules that can change, and separate running copies. Keep those apart. A release is a fixed version of its setup and skills. Each run records the release it used.

Oxagen stores the agent's purpose and who owns it. It keeps instructions, skills, tool allow and deny lists, model limits, and memory sources. Each approved mode has its own tool limits within that ceiling. Tool contracts, rule versions, steering, identity links, and grants live there too.

A name such as “production” may point to a release. Each request records the exact fixed version behind that name. Keep a change log that shows who changed what. Support review, trial rollouts, rollback, and approval for sensitive changes.

Local settings brought into Oxagen become proposed changes with a source link. They must not silently become company rules. A skill may ask for access but cannot grant it. A memory, prompt, or model plan cannot create rights.

An adapter turns the release into the setup for a target harness. It maps instructions, tools, skills, memory, and settings. It records each source, change, and omission. It says which controls the app supports.

If a required control is missing, the run cannot start. Telling the agent to behave is not a substitute. Other behavior changes may be accepted if company rules allow them and the user can see them.

At startup and before model calls, compare the planned setup with the real one. Protect that setup from agent edits. Use supported live updates when possible. Otherwise rebuild the session and record the change.

Routine skill or instruction updates may wait for the next turn, save point, or manual choice. Lost access and urgent denies apply at the next gate that can enforce them. Old rule records explain past actions. They cannot grant new access after a fork.

## 10. IAM and RBAC for humans and agents

**IAM** means identity and access management. It answers two questions: who is acting, and what may they do? Humans and agents are both first-class **principals**. A principal is a known identity with its own ID, roles, grants, owner, and access history. An agent is not a copy of a person's login.

Use **one permission layer** for both. The web app, APIs, tools, context, memories, models, run controls, and saved records all use it. Services and future plugins have their own scoped identities too. Hiding a button or a tool name does not enforce access.

Keep the operator, agent identity, persona, mode, and running copy distinct. A persona is a saved agent setup. Its name is not proof of identity. A delegated agent gets only the rights it was granted within its owner's allowed scope. A service agent can work without a person logged in. It needs an explicit owner and service grant.

Use company sign-in and strong checks for admins. Support single sign-on and account setup. Require more than one sign-in factor for high access, with checks that resist fake sign-in pages. Workloads should use short-lived identities. SPIFFE and SPIRE help services prove who they are over protected links. [SPIFFE overview](https://spiffe.io/docs/latest/spiffe-about/overview/)

Roles should include owner, team supervisor, rule admin, key custodian, operator, approver, auditor, and viewer. The human team supervisor sees and controls only the operators, workspaces, and records covered by their grants. Split sensitive duties. Reading saved prompts or memories needs permission too.

**RBAC** means role-based access control. A role is a set of rights, such as viewer, operator, or approver. A person or agent may hold a role in one workspace and not in another. A role may grant use of a tool. The call still needs access to each record that tool reads or changes.

Each action also needs checks on purpose, destination, and current run state. Child agents may get less access than a parent, never more. An imported agent cannot bring another company's rights. Revoking a grant cuts off the delegations that depend on it.

### One decision with several required checks

Use **OpenFGA** to check who owns or may use a named record. It also checks teams and sharing. Use **Open Policy Agent**, or **OPA**, to check rules about purpose, data type, destination, inputs, approvals, and run state.

OPA is a mature rule engine. CNCF lists it as Graduated. Its stated production users include Goldman Sachs, Netflix, Pinterest, and T-Mobile. OPA does not provide all of agent identity or ARP on its own. [CNCF OPA status](https://www.cncf.io/projects/open-policy-agent-opa/), [CNCF adoption evidence](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/)

One Oxagen service joins the checks. OpenFGA and OPA are parts of this one permission layer. Customers do not manage two rival sets of access rules. All checks must pass:

```text
Known identity
+ valid grant of access
+ right to use this tool
+ rights to every affected record
+ work order and policy allow the action
+ budget is held for any paid work
+ required approvals and conditions are met
+ access is still current
= permission to proceed
```

Neither OPA nor OpenFGA may override the other's denial. These engines do not hold money or prevent approval reuse on their own. The budget and action services must do that. Record the rule bundle and access model used. Get facts about rights from trusted sources, not from agent claims. [OpenFGA concepts](https://openfga.dev/docs/concepts)

Oxagen owns rule writing, review, tests, releases, and the final decision. Signed OPA rule bundles can run near the gateway. A rule may be missing, stale, broken, or lack a needed fact. In strict mode, any such problem blocks the action. Limit the computing power and network use of customer-written rules. Keep sensitive text out of rule logs. [OPA bundles](https://www.openpolicyagent.org/docs/management-bundles), [OPA decision logs](https://www.openpolicyagent.org/docs/management-decision-logs)

Use a priority channel to cut off urgent access while connected. Offline work needs a company-approved grant with an expiry. State how old it may be and stop when it expires. A device working offline cannot be sure to get a global stop at once.

A model may spot drift and suggest a pause or correction. It cannot create rights. Rules should name stable actions and targets. A ban on a tool called `send_email` does not stop email through an unchecked shell or network path.

Save one decision ID with the identity, action, target, scope, rule versions, and reasons. Check that access is still current when data is released or work is sent. Apply this to people as well as agents.

![Human and agent identities are first-class principals in the same canonical IAM and RBAC system. They have distinct identities, roles, and record grants; an agent also has an accountable operator. One authorization service composes identity, role and record rights, workspace scope, and current policy into an allow, deny, or approval-required decision. A person is asked only when the rule requires it. Only allowed requests may proceed through tool, context, model, and web or API gates. Data queries also enforce org and workspace boundaries through SQL row-level security where SQL is used. Application-level record checks still apply. Object and file stores, search indexes, and their gateways separately enforce org and per-record rights. SQL row-level security does not cover non-SQL stores by itself.](diagrams/iam.svg)

*People and agents have their own identities. One shared identity and access service checks their roles, record grants, and current policy. Its decision reaches each request gate. SQL row rules add org and workspace checks. File and search services enforce their own record checks.*

### Keep keys outside agent code

The preferred access path is:

```text
Agent asks → Oxagen checks → access broker → protected connector → target system
```

The agent gets a result or a limited handle. Model keys, refresh tokens, and production secrets stay outside its process. Use short-lived access and target-enforced scopes when possible. OAuth token exchange can show who acts for whom. It does not replace the single-use approval checks. [OAuth token exchange](https://www.rfc-editor.org/info/rfc8693/)

An access request names the task, system, resource, time needed, reason, and run evidence. A rule may approve it. Otherwise Oxagen asks the right person. Sign-in takes place in a protected flow. Never paste secrets into chat.

Older systems may need fixed keys. Put them only in a dedicated connector and rotate them. If agent-owned code must get a secret, show the weaker protection. Limit that secret's scope and life. Code can read its own environment variables.

With MCP, check each link's access on its own. Check the client to Oxagen first. Then check Oxagen to the provider. A token for one service must not simply pass to another. [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)

## 11. Protect every record and its history

Give each record a stable ID and each version a fixed revision ID. This covers memories, skills, source excerpts, tool results, files, and rule decisions. It also covers links that show where data came from. An old saved version does not restore old access rights.

Each record names its owner and company. It has access rules, a data class, allowed purposes, and source links. Rules also state where it may live and how long to keep it. Some users may see only a title or a view with private text removed.

Keep each right distinct. A person may find a record, read facts about it, read its full text, or see its sources. Other rights allow new text based on it, tool use, writes, and sharing. Model export, granting rights, and easing rules need their own checks. A viewer is not free to send data to any model.

A tool call needs rights to use both the tool and its true targets. A CRM connector's broad login does not grant agents every customer record. Check a read query first, then check results before delivery. For writes, check the actual target, fields, and current version at the point of change. Block bulk actions that cannot be scoped safely.

**Provenance** is the record of where data came from. Keep it apart from the map of access rights. A link from a summary to a report does not grant rights to read that report. W3C PROV gives shared names for sources, actions, people, and new records based on old ones. ARP can export this format. It need not use that format for its own data store. [W3C PROV](https://www.w3.org/TR/prov-o/)

Even a link, count, title, or missing-result marker may reveal private facts. Check each visible node, link, and field in a graph or search result. Filter out forbidden matches before private content reaches outside search or ranking models. Check the final records again before showing or sending them to a model.

New content keeps its sources' rules. This includes summaries, search embeddings, cached answers, test reports, and model replies. An embedding is a search form of content. Use only the sharing rights and purposes that all sources allow. Keep the rules for privacy and where data may live. Untrusted sources stay marked untrusted.

For a model reply, treat all visible input as a source. Only a trusted process may prove a narrower link. To allow more access, save an approved choice to ease the rules. If duties conflict, block creating or sharing the result.

Rights must change safely across services. Block affected records while changing access. Check that the new state took effect before lifting the block. Check rights again when data is shown or work is sent. A cached check must match the person, record versions, and rule. Its purpose, target, and access version must also match. [OpenFGA consistency](https://openfga.dev/docs/interacting/consistency), [SpiceDB alternative](https://authzed.com/docs/spicedb/concepts/consistency)

When access ends, stop reusing affected context and model sessions. Check whether that data is still in a chat. If so, build fresh allowed context before using the chat again. A rule cannot make a provider forget data already sent.

## 12. Knowledge graph, memory, and context

Keep run evidence, proposed memories, approved shared knowledge, and skills apart. Search indexes point to the real records. They do not replace them.

Each memory needs a source, owner, scope, trust level, dates, freshness rule, and retention rule. A claim that “tests pass” should link to the test result and exact code version. A summary is a derived claim, not a stronger fact.

Agent memory writes start as proposals. Rules decide how they become shared knowledge. Sensitive claims may need review or outside proof. Repeating a claim across many runs must not make it trusted.

Record the exact memory versions found and the excerpts sent to the model. Running the search later is not a copy of the first result. At a fork, use a fixed memory view with a branch-local layer for new memories. A customer may choose live updates, but each one is recorded. Code merges do not merge shared memories on their own.

Deleted data and lost access must also be removed from search, embeddings, summaries, caches, and exports. New context must use the new rules.

### Make the knowledge graph part of the core

Oxagen needs one way to find related code, rules, context, and run evidence. The **knowledge graph** is this map. Each item is a node. A link shows how two items relate. A policy might link to a tool, its code, and the tests that check it. The graph is a required part of this design.

The graph joins these views:

- Code files, symbols, changes, and tests.
- Agents, tools, policies, decisions, and run records.
- Skills, memories, and approved context.
- Business types, such as Customer, Order, and Refund.
- In a future phase, real business records from linked systems.

The list of business types and their links is an **ontology**. It tells Oxagen that a refund belongs to an order and a customer. A real refund is a record of that type. The design must support both types and real records.

### Keep each source in charge of its own facts

The graph does not replace every source. Version control owns code files and their history. A payment service owns its refund records. Oxagen owns its approved policies and run records. Large files can stay in their own stores. The graph can hold safe facts and links to them.

Each graph record needs a source, an exact source version, and a sync state. A code link must name the repo and commit. A context link must name the saved revision. Show when a source is stale, missing, or out of reach. Keep old versions so a later edit does not change the story of an earlier run.

Graph facts also need a trust state. A link proposed by an agent is not a verified fact. A model's guess that code enforces a rule must stay a guess until a trusted check confirms it.

### Use one path to find context

Oxagen's MCP service should use the Context Gateway and graph to find allowed context. The graph finds the related items. The gateway checks access, gets the needed source versions, and returns the allowed content. CGP remains the shared way to exchange that context. It does not replace the graph or grant access.

Humans and agents use the same IAM checks. Check each node, link, field, search result, count, and path. A link can reveal a secret even if its two names seem harmless. A summary keeps the limits of all its sources. Database row rules alone do not protect every graph search or export.

Only approved, cleaned content may enter the graph. The local scan must run before raw content leaves the machine. Do not copy secrets into node names, search data, source links, logs, or content fingerprints.

The graph helps find rules. It does not grant a governed action. The tool gate must check the current approved policy and trusted live facts. A stale graph must never turn a denied action into an allowed one.

### Future: connect a run to the real result

A future connector can link a refund to the agent run that caused it. The chain is: run and tool action, policy and decision, any required human approval, execution receipt, then the payment service's refund record. That record links to its order and customer.

Use IDs and receipts from the trusted connector. An agent's claim, or a match on an amount, is not enough. Keep requested, pending, failed, and confirmed actions distinct. Later source updates may change what is known; save the new evidence without rewriting the old decision.

This would let a user ask why a refund happened, which agent caused it, and which code or tests support its rule.

Build the graph records, access checks, version links, sync rules, and stable IDs now. Business connectors, real business-record ingestion, and screens for these future questions come later. This document specifies that foundation; it does not claim these features exist today.

The graph is required in the architecture, not on the critical path of a first run. A new workspace has an empty graph. The first-run path resolves context from the explicit source references in the `.oxagen` files and the Context Gateway's direct source fetch. Graph ingestion fills in behind that first run. No gate may wait on graph freshness to admit a model call, and an empty or stale graph must never turn into a denial by itself.

![Version-control, CRM, and other source systems remain authoritative for their own records. Oxagen keeps stable source and record IDs, versions, permission references, sanitized data, and provenance links in its shared context graph. Foundational IDs and provenance synchronization belong to the initial design. The Context Gateway is the shared route for context access. A common MCP catalog discovers allowed tools and context routes but grants no extra rights. Identity, per-record rights, policy, and local data scanning still apply. Code, tools, context, tests, and reusable policy versions can be linked through the graph. The future business-record section is explicitly not an implemented connector or ingestion feature in this phase. It shows a possible provenance chain from Run and ToolAction to PolicyVersion and Decision, to an optional approval if required, to ConnectorReceipt, to the external Refund record, then its Order and Customer records. Receipts point to exact external source versions when available. Unknown source versions remain marked unknown. An approval is optional only when the policy does not require it; missing required proof never counts as success. Source permissions and freshness remain attached to all links. The graph stores authorized links and sanitized fields, not a copy that overrides the source system or bypasses record access.](diagrams/knowledge_graph.svg)

*The context graph is a shared foundation. It links allowed records, their source versions, policies, tools, code, and tests. The Context Gateway and common MCP catalog expose only what the caller may use. The lower section shows future business records; that business ingestion is not being built in this phase.*

### Use Context Graph Protocol for search

The `macanderson/context-graph-protocol` project, or **CGP**, defines how to exchange context. It carries source links, size budgets, consent, and time data. It leaves company-wide access rules outside its core. This fits Oxagen: CGP carries found data, Oxagen checks access, and ARP records its use. [CGP specification](https://github.com/macanderson/context-graph-protocol/blob/main/SPEC.md), [CGP governance](https://github.com/macanderson/context-graph-protocol/blob/main/GOVERNANCE.md)

The Context Gateway can expose allowed memories, knowledge, and run evidence through CGP. A piece of returned context is a **frame**. A frame that names a skill is still data. It cannot grant rights to install or run the skill.

For each search, Oxagen must:

1. Check the agent, run, purpose, and eventual model destination.
2. Check the query and any data sent to outside search services.
3. Verify the provider, consent, and allowed features.
4. Search within the allowed company and record scope.
5. Check each result, view, and source link.
6. Check freshness, source evidence, and size limits. Hold unresolved restricted links.
7. Save an approved summary or redaction as a new derived record.
8. Check model export and save exactly what enters the request.

Provider consent and record access are both required. Neither grants the other. A provider's service identity is distinct from the agent's identity.

Keep two receipts. The **retrieval receipt** shows what the provider returned. The **composition receipt** shows what Oxagen put in the model request, in what order and with what changes. Found text may never reach the model. Delivery proves the model had the text. It does not prove that text caused a choice.

Check the original context reply and its signature locally. Trust keys from an approved registry, not just from a new service. Save only an allowed clean copy and a safe check receipt. A changed copy does not keep the original signature. Do not upload a blocked original or its content fingerprint.

CGP's size budget and the model's token budget are different. CGP uses a stated byte-based unit. The full model budget must also cover instructions, tools, wrappers, and output space. Links to more content need fresh access checks when followed. A date label does not prove a source is true or fixed.

Pin the CGP spec, schema, and tests to a fixed release or commit. The source design inspected commit `c13ede1527d840cf39bff2f4ab9838efd7a1aa8f`. At that point the repo used `contextgraph/1.0`. The website still said `1.0-draft`. This design makes no claim of broad adoption. [Pinned specification](https://github.com/macanderson/context-graph-protocol/blob/c13ede1527d840cf39bff2f4ab9838efd7a1aa8f/SPEC.md), [website introduction](https://contextgraphprotocol.org/docs)

The optional lifecycle record profile stays separate. It may point to outside approval but cannot become an execution approval. ARP's `context.resolve` is an Oxagen service. Core CGP 1.0 has no `context/resolve` message. [Lifecycle records](https://github.com/macanderson/context-graph-protocol/blob/c13ede1527d840cf39bff2f4ab9838efd7a1aa8f/contextgraph-types/src/record.rs), [CGP size units](https://contextgraphprotocol.org/docs/concepts)

Try to make CGP leak data between companies. Test denied records, lost consent, false keys, and stale rights. Try unsafe links, bad size counts, and hostile content. A protocol test pass does not prove every source is true.

## 13. Save and fork a run safely

A saved point must have files, context, and records that agree. A time or chat number alone cannot prove that match. Count child work and messages still in flight too. [Distributed snapshots](https://lamport.azurewebsites.net/pubs/chandy.pdf)

A portable save bundle holds the allowed agent release, instructions, skills, memory sources, chat, task state, files, and environment. It holds child work, known outside effects, and the controls the new app must provide. Add proof that the bundle is unchanged and a list of missing state.

First reach a confirmed pause. Resolve uncertain writes, capture local state, and save the bundle. Link it to the pause record. Keep late evidence separate unless explicitly adopted. The source may resume once that save boundary is set.

To rebuild an old point, start with an earlier snapshot. Apply the saved changes. Today's folder cannot restore yesterday's state. Check file digests, which are content fingerprints. A missing change or unsaved database limits or blocks the restore.

A full file snapshot includes the Git version, staged and unstaged changes, untracked files, binaries, file modes, links, submodules, and needed dependencies. A Git diff alone is not enough. File watchers help but may miss changes. Use controlled writes and safe snapshots. Human edits must join the save process or cause a version conflict.

Only inspected, cleaned content enters a portable bundle. Existing files may be used on their local machine if access allows it. New raw local checkpoints are off by default and need a separate, explicit local retention grant. If cleaning removes state needed to restore the work, report that loss or block the move. Do not claim full raw recovery from a clean bundle.

A user may click “fork here” anywhere on the timeline. Oxagen finds a supported boundary for that request. During a model reply, finish it or cancel and restart from a safe prior point. During an outside write, wait, check the outcome, or block the fork.

![An enrolled source run reaches a confirmed safe boundary. Oxagen saves an allowed local snapshot, visible history, selected context, and work still pending. The local gateway scans every exported record and file view before it leaves the device. Only cleaned data may leave. A target adapter loads the allowed state into another harness and reports missing or redacted state and any limits on continuing the work. Current access and cost checks create a new run. Keys and private model state are not copied. A move also stops the old run before the new one starts.](diagrams/fork.svg)

*ARP carries an allowed snapshot and cleaned records into another harness. Any exported data passes through the local scanner. The new run gets new access checks and its own branch.*

### Say exactly what moves

| Mode | Promise |
|---|---|
| Playback | Show the record without making outside changes. |
| Replay | Rebuild supported steps from recorded replies and results. |
| Native recovery | Restore a compatible app's own saved state. |
| Portable continuation | Start another app with preserved visible context, files, pending work, and fresh access. |
| Fork | Create a separate branch that may run beside the source. |
| Migration | Transfer ownership after disabling the source's old authority. |

A fork plan shows what stays, changes, is missing, needs a refresh, needs new access, or blocks the move. It names the source boundary, target adapter, and file digest. Show this contract before the fork runs.

Private model state may be hidden or tied to one provider. A virtual-machine snapshot cannot turn Codex into Claude Code or rewind an outside service. Keep allowed private state for a compatible restore. Say what is lost when moving between providers. Future model behavior cannot be guaranteed to match. [OpenAI reasoning](https://developers.openai.com/api/docs/guides/reasoning), [Claude thinking](https://platform.claude.com/docs/en/build-with-claude/thinking)

Keep goals, limits, choices, finished work, questions, and pending work linked to evidence. Summaries help readers find it. They do not replace source records or turn tool text into trusted rules. If required content will not fit or is missing, block the move or disclose the loss as policy allows.

Old process IDs, sockets, tool IDs, and access handles cannot simply move. Map them safely, create new ones with permission, or declare them lost. Browser state needs its own capture and checks of outside state. A screenshot does not restore a browser process. Live login sessions are not portable keys by default.

Saved state also names plugin versions, holds, completion rounds, and pending jobs. It contains no live plugin grants or keys. A fork gets fresh plugin seats. Missing required plugin state blocks that restore. Outside jobs need a result check before any retry.

Every fork gets a fresh runtime identity, access, and budget checks. Live single-use approvals never travel in a save bundle. Forks need separate files or enforced rules for shared files and resources. Shared outside resources need conflict checks, version preconditions, or one owner at a time.

Begin with read-only or test access unless rules allow live writes. A migration disables the source before giving ownership to the target. A fork knows about past writes. It does not get a command to repeat them.

## 14. Record what happened and what the model saw

“Full recording” has a stated scope. It covers all work the trusted gates can see. It cannot show a model's hidden state or all use of an unmanaged computer. Even an agent-only view needs human file edits and outside changes that affect the run. A view may hide some actors when rules allow it. The source record needs the allowed view of those inputs. Removed parts limit what can later be restored.

Keep shared ARP records and allowed state from the app. Save only content that passed the local data rules. For each model call, save the exact cleaned request sent, in order. Include its allowed sources, rules, steering, memories, tools, cleaned files, settings, and summaries. Removed input never goes to Oxagen for record keeping. This replaces the earlier promise to keep raw input.

Keep these views separate:

| Record | Why it matters |
|---|---|
| Cleaned user prompt | Shows the allowed part of what the person asked. Removed parts have safe markers. |
| Final model request | Shows the exact cleaned request the model received, including context and files. |
| Proposed tool call | Shows the allowed view of what the agent wanted to do. |
| Executed tool call | Shows the action that ran, with any removed fields marked. |
| Cleaned tool output | Keeps the result after local data rules, with any gaps marked. |
| Consumed tool output | Shows any shorter or changed result sent to the model. |

Scan replies and tool results locally before sending them to remote records. Save only cleaned content, with safe exit status, work folder, settings, timing, and file changes. The model proxy must relay replies for this check before it saves their content. It may not keep raw replies in debug logs. Save links between parent and child processes and receipts from outside systems. Trusted process pipes and connectors supply tool records. The gateway supplies model records. Include child and background calls, such as a call to write a title or shorten a chat.

Use trusted IDs to link each record to its company, workspace, repo, device, person, and agent. Also link it to the run, branch, turn, request, attempt, and tool call. Record cost, usage, errors, blocked calls, delays, and results. Keep stream chunks in order.

Do not store keys or sign-in headers in run history. Mark gaps, missing data, hidden text, and cut-off text. If content was removed, say the record is less complete. A provider's hidden prompts and private reasoning are outside the visible capture promise. Local source files stay in place. Cleaned remote snapshots cannot promise an exact copy of removed local data.

In strict mode, save a request before sending it. Save results before any work that depends on them. Stream chunks may be saved in groups only after the local scan proves a safe boundary. Otherwise buffer the whole reply before release. State the extra delay. Chunks append to one evidence object per attempt, never one object per chunk. A group is at least 16 KB or two seconds of stream, whichever comes first, so a long reply costs tens of durable writes rather than thousands. If safe storage fails, stop new work. A faster mode that allows gaps must show its weaker capture level.

Each adapter must prove coverage of model calls, tools, children, and background work. Samples alone cannot prove full capture.

### Save a work report in the org's chosen store

Oxagen must save a **work report** for each run. For repo work, keep one report per linked repo. The report comes from trusted run records and approved VCS and CI connections. Scan its paths, patches, job text, and other fields before remote storage. Save cleaned views and mark removed parts; the report requirement never grants permission to export raw secrets. It must not depend on what the agent says in its final reply.

**Write the report to the same org-configured data store that the Oxagen web app uses.** The org is the customer account. Its **data plane** is the set of services that handles its work and stored data. That setup may live in Oxagen's cloud or inside the customer's network. Trusted services choose the store from the org's saved settings. The agent cannot choose a different store.

The report must contain these fields:

| Saved field | What it must show |
|---|---|
| VCS repo | The linked repo's stable ID, name, provider, and safe URL. VCS means version control, such as Git. |
| Work branch | The name of the branch where work took place and its exact commit ID. A commit is a saved code version. |
| Target branch | The default branch set for that repo in the Oxagen workspace, its settings version, and its exact commit ID. |
| Files changed | Every changed file, with added, edited, deleted, or renamed status. Keep old and new paths for a rename. |
| VCS diff | The actual diff between the saved target commit and work-branch commit. A diff shows the changes between two code versions. Store large patches as protected files linked from the report. |
| Pull request | The PR number, link, state, repo, source branch, and target branch. A PR asks to merge code. Keep each linked PR if there is more than one. |
| CI jobs | The name, ID, link, status, result, and tested code version for every job on each PR. CI jobs are automated checks. Include jobs beyond the required merge checks. |
| Agent persona | The name, stable ID, and version of the approved persona used. A persona is the agent role selected in Oxagen. Keep each role used if it changes during the run. |
| Tool use | A list of unique tool names and the total use count for each. Keep the tool IDs and sources behind those totals. |
| Report state | The run, operator, work order, store, save time, source times, version, and any missing data. |

The target is **always the workspace's configured default branch**. Do not assume it is `main`. Do not replace it with the provider's default, the local branch's upstream, or a PR's target. If a PR targets another branch, keep the PR link and flag the mismatch. Its CI results do not prove the work passes against Oxagen's chosen target.

Compare the two saved branch tips for the required diff. A second view may show changes since the branches split. Keep that view separate. Git treats those as different comparisons. [Git diff reference](https://git-scm.com/docs/git-diff)

Also save local edits that are not yet committed, including new files. Keep that view separate from the committed branch diff. The full branch diff may include work from other people or earlier runs. Use run records to show which changes this run made. Do not credit every changed line to the agent.

Count a tool use once when trusted evidence confirms it ran. A retry that runs adds another use. Duplicate reports or streamed chunks add none. Blocked requests have a separate count. A call with an unknown start stays marked unknown. If two tools share a name, the name total must link to both tool IDs.

Keep every CI job's status, including jobs still waiting, skipped jobs, failed jobs, and reruns. An empty or partly read list is not a pass. Show which CI sources were checked and when. Keep missing access, stale data, and unknown results visible. If a CI service exposes only a single overall result, report that limit until a connection can fetch each job.

A new commit, branch move, PR event, CI result, or changed default-branch setting creates a new report version. Keep the old version as evidence. Old CI results stay tied to the old code. Keep collecting PR and CI updates after the run ends while that PR is tracked. Those updates do not resume the agent on their own.

![The trusted run guard supplies the approved persona ID and name, run identity, and per-tool call counts. Version-control and pull-request connectors supply repository and workspace identity, the configured default branch and its exact base revision, the working branch and head commit, the changed-file list and diff, and any pull-request number and link. CI connectors supply every job status with the commit it checked. The protected local gateway scans report text, files, and references before any upload. Only cleaned report data is persisted through the org-selected data service into the same record store and file references used by the Oxagen web app. That data service may be SaaS or customer-private. It checks access to each record when writing and reading. The web app shows observation time, freshness, and field status. No PR, unknown PR state, missing or redacted data, running jobs, and failed jobs stay distinct. An old commit’s CI result does not prove the current head passed. Every required field has a value or an explicit status. A model summary does not replace these trusted records.](diagrams/reporting.svg)

*Trusted run records and code, PR, and CI connectors supply the required report fields. Reports link branches, persona, tool counts, and each CI result to the exact work. The local gateway cleans report data before the org-selected data service saves it for the Oxagen web app. Record rights, freshness, and field status stay visible.*

“Collected” and “saved” are separate states. Oxagen marks a report saved only after the chosen store confirms the write. If it must wait in an approved local buffer, show that it is waiting to sync. Loss of a private store must not cause a silent copy to public cloud storage. Strict recording rules stop new governed work when required records cannot be saved.

The web app reads those saved reports with the same record permissions as other org data. If there is no PR yet, say so. If no repo applies, record that reason. If a source cannot be read, mark it unknown. Do not invent an ID or treat missing facts as success.

CI, tool, and context callbacks follow the same scan rule as model replies. A remote service may relay raw text through brief memory buffers to the local scanner. It may not save that text in a queue or log first. If the scanner is offline, keep only safe status and opaque IDs. Fetch and scan the content later. Show the report as pending or stale.

### Show spend and useful results in mission control

The app groups work by company, workspace, team, operator, agent, work order, repo, and harness. A team supervisor can move from a total to the permitted records behind it. Apply record permissions to chart results and exports too. Do not leak private data through totals or search.

Spend views separate settled cost, funds held for work in flight, money left, and estimates. They show the billing period, currency, and data age. Shared totals count a child charge once. Budgets come from the authoritative ledger, even if a dashboard update is late.

Progress views show useful outputs, accepted results, reopened work, failed calls, queue time, run time, review time, and cost per accepted result. State who accepted a result and what the measure counts. A model saying “done” is one recorded claim. It is not proof that the result was useful.

Compare similar work and show missing data. Tokens, lines of code, and time online are activity counts. Pair them with reviewed results and task context when comparing work. The goal is to show operators where work succeeds, stalls, or needs to be redone.

### Turn records into useful guidance

Oxagen must show how agents and operators spend tokens. For each call, save input and output counts, prompt-cache reads and writes, other billed units, the price basis, and gaps in the data. Use the provider's rules so input subsets are not counted twice. Show totals by operator, agent, harness, custom SDK agent, model, run, turn, and tool. Include the cost of retries, summaries, and Oxagen's own coaching.

Link the cleaned request to its parts: human text, history, context, skills, files, tool menus, and tool results. Show how often each part was sent again. Count cache reuse from reported usage, not from a guess that two prompts look alike. Cache reuse does not prove useful work. Separate measured counts, local token estimates, and unknown fields.

Run analysis may find repeated failed calls, needless retries, repeat file reads, large trace files, or slow steps. Each suggestion links to its evidence and states which part is a measure and which part is a judgment. An estimated saving must name the affected calls, price, assumptions, range, and costs added by the proposed change.

For example, suggest a local trace-file path and a focused read when the agent can reach that file. A path saves nothing if the tool then returns the whole file. Include extra calls, returned text, cache effects, and output before claiming a dollar saving. The [performance specification](ARP-Performance-spec.md) gives the full rules and an illustrative calculation.

Look at the task, context, and result before judging how well time or money was used. Fewer tokens do not always mean better work. Analysis obeys the same read, scan, export, and budget rules as the agent. Advice becomes a change only through a permitted action. These core usage and loop checks require no witness or DoD feature.

![A governed request passes a full local scan and the model gateway before provider usage is saved as a safe linked record. Observed token, cache and cost facts and SDK events support a proposed change. The operator reviews it, may approve a later run, and measures the change. Estimated costs and savings remain separate from facts; metrics contain no prompt bodies or secrets.](diagrams/efficiency.svg)

*Proposed flow: scanned requests and safe usage records support suggestions. Operators review changes, and later runs measure the result.*

### Enroll a custom agent with the SDK

The main JavaScript and TypeScript entry point is:

```javascript
const result = await oxagen.register({your_agent}).run("prompt");
```

This is a proposed SDK, not a package that exists today. Registration binds a supported agent adapter to the configured workspace, operator, approved identity, and rules. Each model and tool call passes the protected gateway. A wrapper around opaque code cannot prove control; strict mode blocks if the needed routes cannot be guarded.

The SDK records which step requested a tool, which result the next request used, what work is still open, and why a retry happened. Oxagen can then flag broken call/result pairs, unknown writes retried, stale replies reused, or work declared complete while required steps are still running. Repeated work may be a useful clue, but it is not proof of an error.

The [SDK specification](ARP-SDK-spec.md) defines enrollment, run handles, streams, pause and resume, language bindings, and checks for custom loops. Use the Fleet, Spend, Run, and Operator coaching screens of `apps/web`, which follow the oxagen-roadmap Mission Control v2 layout, for these views. Add the missing controls within that design.

## 15. Give each governed action a clear state

A governed action needs a saved plan and current rights for that exact work. A send record must name who acts. These checks cover model calls, tools, memory, exports, child agents, keys, and publishing.

A customer may allow routine requests by rule. “Ask Oxagen first” does not mean “ask a human every time.”

Before a call, Oxagen checks who is acting, adds due steering, and builds the exact context. It checks rules and data export, then sets aside enough money. It saves the plan and decision and issues a short-lived approval. The gateway consumes that approval once and saves the send record before it sends. It saves results before dependent work continues.

An approval binds one agent to one exact action. It names who may use it and which service may accept it. It sets the target, limits, expiry, and use count. It binds the current rules, context, and access version too. The full field list is in chapter 23. A signature alone cannot stop reuse. The gateway must save approval use in one step that cannot be split or repeated.

Approval use, the send attempt, and the saved send queue must be committed together. This proves an allowed plan to send. It does not prove the provider got the call. After a crash, check or resume that same attempt. Do not quietly create a second action.

Code may change an input, follow a new address, or find a new target. Check that change or ask again. Use fixed target IDs and version checks. These stop a resource from being swapped between the check and the action.

An action moves from a proposal to a decision and then to work. It may wait, be allowed, or become ready to send. It may run, complete, fail, be denied, expire, or be cancelled. Its outcome may remain unknown. Each attempt has its own state. Some services never report “running.” Approval applies to the exact request and expires if it changes.

Before sending, denial or cancellation means nothing ran. After sending, cancellation is still a request until the result is known. A provider may finish while its reply stays out of the resumed run. Keep pause state, provider outcome, and rights to use a reply as separate facts.

A timeout after a write means **outcome unknown**. It does not mean “safe to retry.” Each connector must state how to check results and when retries are safe. It must explain duplicate keys, how long those keys last, and whether a repair can undo the effect. Repair needs fresh access and may not fully undo the first action. [Temporal action and retry model](https://github.com/temporalio/temporal/blob/main/docs/architecture/README.md)

Reuse an outside duplicate-prevention key only when the connector contract allows it. Each retry gets a new attempt and a fresh approval. A new forked action gets a new action ID. Playback never changes outside systems. Test replay uses saved replies or cloned services. Live reads may need a fresh check. New writes always need fresh access.

## 16. Enforce dollar budgets before spending

Set a budget in the web app for a company, workspace, operator, or agent. A limit may also apply to an operator-and-agent pair. Name the USD cap and time period. State its reset time zone, covered costs, price version, and control mode.

Trusted records link each bill to the operator and any parent that gave access. Child agents, forks, retries, and a change of owner cannot shed old costs. They cannot escape parent limits that still apply. A change to who pays for future work needs its own approval.

A central Budget Authority holds money before calls and settles bills after them. OPA may check spending rules. The budget ledger keeps the balance. It must put requests from many devices in one safe order.

One organization-wide budget is one ledger row. Every model call, child agent, title call, summary, and embedding in the organization would otherwise lock that row twice, once to hold and once to settle, and the row would become the ceiling on throughput. To keep the invariant without the bottleneck, a model proxy may **lease** a bounded block from a parent period and sub-allocate from that block locally. The lease is itself a hold on the parent, so the parent's arithmetic never changes. The proxy settles the block back when it drains or expires. Unused lease is released only after the proxy proves it is closed. The device escrow in this chapter is the same mechanism at the device level.

Before every paid call, hold its defensible maximum cost in every budget that applies. Either all those holds succeed or none do. Use exact money units and round maximum holds up.

```text
Settled charges + all money still held + maximum new charge ≤ limit
```

A large agent budget cannot override a smaller operator budget. Each hold names the exact request, model, provider, price, payer, usage limits, and attempt. A changed request, paid retry, or fallback needs a new bound and check. Link the hold to the send record. A crash must not allow an unfunded call or free funds for a call already sent.

![With a 100 dollar limit, 60 dollars spent and 30 dollars held leave 10 dollars available. A request that may cost 15 dollars is denied because total exposure would reach 105. A request bounded at 5 dollars may be allowed because total exposure reaches 95. If its confirmed bill is 3 dollars, 3 dollars becomes spent and 2 dollars is freed. Every applicable budget must allow the request.](diagrams/budget.svg)

*Oxagen checks spent money plus money held for unfinished requests. Concurrent requests share the same balance. A timeout does not refund a possible charge.*

### A hard cap needs a true maximum cost

The hold must cover every allowed charge. Count input, output, and paid hidden tokens. Assume the worst allowed cache cost. Add server tools, fixed fees, and all enabled extras. Put supported usage limits in the actual provider request.

The gateway sets the provider's output limit itself, so the maximum is a number it controls, not a guess. When the remaining budget cannot cover the full default limit, the gateway may lower that output limit to what the budget can cover and record the lower limit in the hold. A nearly spent budget then degrades to shorter replies before it blocks. The gateway must not lower the limit below the floor the work order names, and it must never raise a cap to fit a call.

An estimate plus a margin is not a hard ceiling. Strict mode must block routes with no defensible upper cost. Or Oxagen may quote a binding maximum customer charge and pay any supplier overage itself. That caps the customer's Oxagen bill. It does not cap the supplier's bill. [Claude token counts](https://platform.claude.com/docs/en/build-with-claude/token-counting), [Claude tool pricing](https://platform.claude.com/docs/en/about-claude/pricing), [OpenAI cost controls](https://developers.openai.com/api/docs/guides/reasoning)

State whether the cap covers controlled use only or other fees too. Subscription use and list-price estimates are not exact vendor costs for each call. Use of personal keys outside Oxagen is outside this promise.

Every paid path needs funds held for it. This includes models, child agents, chat summaries, search and ranking, paid plugin work, paid tools, and paid run analysis. Hidden retries and fallbacks must be turned off or pass through the gate. The agent must not have another key or network path to spend through.

### Settle only when the charge is known

When a trusted usage receipt confirms the charge, replace the hold with that amount. Free only the part proved unused. Do not post the same bill twice. A timeout, cancel, pause, ended run, lost device, or missing usage reply must not free money that may have been spent.

Keep uncertain charges pending until checked. Late bill receipts settle the old action. They do not put late text into the resumed run. Provider corrections need their own entries and alerts. If a provider exceeds its promised bound, treat that as an incident.

A new month does not erase old holds. Keep each hold in the period chosen before the call until its bill is settled. A promise to match supplier invoice periods also needs support in that provider's contract.

Reject a new limit below funds already spent or committed. A freeze-and-reduce action can stop new spending and hold the lower limit as pending. The lower limit takes effect only when the math holds. It cannot undo past spending.

### Offline spending needs money set aside

Strict online mode holds funds before each call. Offline work may use only a separate device-bound allowance. Its funds must already be held in every parent budget. Local spending draws from that allowance and is not counted twice.

Never assign the same balance to two devices. A lost link or expired lease does not prove an offline allowance went unused. Check the spend and prove the old right to spend no longer works before reusing the balance. Without that system, strict offline spending stops.

The app shows known charges, funds held, funds left, offline funds, and charges still being checked. These views must not count the same money twice.

## 17. Plugin controls in the turn loop

Oxagen should let partners add new kinds of help through a shared **plugin interface**. A plugin is a separate program a workspace chooses to use. The interface states what it may ask for and what it must report. It also states how Oxagen acts on those requests.

**Only the interface and a stub for future plugins are in scope now. Building a plugin, a witness system, or a marketplace is out of scope.** The first build should leave clear places for plugins to join later. It should not ship partner code or pretend that a check ran.

A future Oxagen marketplace could help users find plugins. A listing would name who published the plugin and its fixed version. It would show the code fingerprint, needed rights, and where the code runs. Being listed does not grant access. An owner must choose a version and grant its rights for a workspace. A new version that asks for more rights needs a new grant.

### Share control through one checked path

An approved plugin can have the **same run-control rights as the Supervisor** within its grant. Its commands have real effect. They are not just tips for the agent to follow.

Both the plugin and the Supervisor use one shared control service. That service checks the caller, saves the command, orders it with other commands, and tells the trusted gates what to do. Only that service commits the run state. A plugin cannot edit that state on its own.

| Control | What the plugin can require |
|---|---|
| Stop | End the run. Block new work at the control gate, then prove active work stopped or is isolated. Resolve unknown effects too. Show stopping until that proof exists. A stopped run cannot resume. |
| Pause | Block new work and start the confirmed pause process from chapter 6. A request alone does not mean paused. |
| Resume | Restart from a confirmed pause once all blocking holds are cleared and current checks pass. |
| Force continue | Require more work instead of accepting a proposed finish. Record the next direction and start it at a checked boundary. |

Force continue does not mean force complete. It cannot skip a denied tool rule, a spent budget, a missing access grant, or pause proof. It cannot silently clear another plugin's hold. If the run is paused, the caller also needs the right to resume it. If a turn has already ended, more work starts a new linked turn. A stopped run needs a new run with fresh rights.

Same control rights do not mean access to every record or key. Each plugin has its own identity and separate grants for records, tools, context, and control. Even the Supervisor must obey the core rules. Customer rules inside a private network still set the limit.

![Possible future plugins include remote documentation, allowed context, Slack notices, and a witness with an oracle. They send stop, pause, resume, or force continue requests to the same shared control interface used by the Supervisor. The core checks identity, permissions, policy, budgets, and pause proof, then orders allowed requests through the Supervisor and gates. When a turn asks to end, Oxagen freezes its version. Subscribed plugin seats vote ready, hold, continue, or abstain. Required seats that are missing, in error, or not ready keep completion waiting unless a named, authorized waiver clears that seat. Each required seat needs a ready vote or a named, authorized waiver for the exact turn version. Core checks must still hold before the core alone commits completion. This is not a majority vote. No partner plugin is implemented in this phase.](diagrams/plugins.svg)

*Oxagen capability stub only. No partner plugin is being built in this phase. Future plugins use checked control requests and can hold turn completion when given a required seat.*

### Let plugins weigh in before a turn ends

When an agent says it is done, Oxagen saves a **completion proposal**. This is a request to end the turn. It is not yet a completed turn.

The proposal fixes the turn version, files, context, known effects, and list of plugin seats. Normal agent work and file edits wait while this fixed proposal is checked. Other changes to the files or grants void that round. A seat is one plugin's right to give a result for that proposal. Each seat is **required** or **advisory**, as set by the workspace. An advisory seat offers advice. A required seat can block the finish.

A plugin can reply with one of four choices:

- **Ready:** this seat has no further objection for this exact proposal.
- **Hold:** do not finish yet. Save the reason and what would clear the hold.
- **Continue:** do more work. Save the next task and its evidence.
- **Abstain:** this seat has no answer. This does not satisfy a required seat.

A required seat’s reply controls whether the turn may finish. An advisory reply is advice. That plugin may still use a control command if its grant allows it.

Plugin replies and audit notes can be saved without changing the work under review. Only a change to the judged work, its rights, or its effects makes that review stale. A completion-only hold blocks a finish. A separate run hold can block the next work step.

The core marks a turn complete only when its own checks pass. Each required seat must be ready or have a valid, named waiver. Any binding hold, pending stop or pause, or accepted continue request blocks the finish. Work still in flight or an unknown write can keep the turn open. This is not a majority vote. An advisory reply cannot waive a required seat.

A ready reply applies only to the saved version. File edits, new context, new work, or changed rules or grants require a new proposal. Old replies remain in the record. They cannot approve the new one. A completed turn stays a historical fact. A later finding may flag it or start more work, but cannot erase that fact.

With no plugin seats, only the core checks apply. An open-ended run may contain many completed turns. Ending one turn does not end that run. A request to end a run uses the same pattern at run scope.

### Resolve conflicts and delays in the open

The control service puts all requests in a saved order. A stop blocks later resume or force-continue requests for that run. A pause blocks work until its proof exists. Each hold has an owner and an ID. Resume can happen only when all current blockers allow it.

A plugin may release its own hold. Changing a final completion reply needs a new round. It cannot rewrite the old reply. An owner or plugin may get a separate right to override some holds. Workspace rules must mark those holds as open to override. That command must name each hold, the caller, the reason, and the rule used. Core access, tool-deny, budget, pause-proof, and unresolved-effect checks cannot be waived this way. Granting force continue alone does not grant hold override.

Each seat has a deadline. A missing, broken, or timed-out required plugin keeps the finish waiting. Oxagen shows why and lets a person with the right grant handle it. An advisory timeout records missing advice and need not block. Removing a required plugin does not turn its open seats into ready replies. The owner must make an allowed waiver or start a new proposal under an explicit rule change.

Every reply names its request and exact version. Old, duplicate, revoked, or late replies stay as evidence and cannot drive current work. A late reply needs a fresh checked choice before its content is used. A saved command receipt means the command was received. Only a later state receipt proves it took effect.

A plugin cannot stop a remote machine the instant it sends a message. Oxagen reports when the control service accepts it and when each gate confirms it. A mode that requires a live plugin must stop new work when that link is lost. Current work still needs the same stop proof.

### Give each kind of plugin the rights it needs

The same protocol supports several future uses:

| Future example | How it could use the protocol |
|---|---|
| Witness verification | A partner checks a claim using an oracle, which is a source of the expected answer. Its required seat could hold completion or require more work. Oxagen does not define or build that test here. |
| Docs author | A partner sends a prompt to a separate author agent. It returns a proposed docs change tied to exact file versions. Applying that change needs fresh tool and file rights. |
| Extra context | A partner offers useful context with source links and access rules. Oxagen checks it before adding it at the next allowed boundary. |
| Security notice | A partner subscribes to allowed events and sends a notice to an approved Slack target. It needs explicit rights to that data and that destination. |

An event notice needs no vote on the finish unless a workspace grants one. A context plugin need not receive stop rights. A plugin that runs another agent must declare that work, its owner, and who pays. Controlled work uses the same model, tool, and budget gates. Work outside those gates must be shown as outside Oxagen's control.

Plugin code runs apart from the Supervisor. A remote partner gets only the records and services named in its grant. Oxagen holds brokered keys and uses them on the plugin's behalf. Signed packages show who published them, not that they are safe.

All plugin work has size, time, retry, and cost limits. A plugin cannot create an endless loop of continue requests or trigger its own notices forever. When a limit is reached, the work stays blocked with a reason. It must not be called complete merely to escape the limit.

### Define the seam now, build plugins later

The stub needs a versioned manifest, scoped grants, named hooks, request and reply types, saved receipts, and a shared control interface. It needs an empty plugin registry that adds no partner work. Use fixed fake replies to test the interface and how it handles failure.

Do not build a witness engine, docs agent, context provider, Slack sender, plugin runner, billing marketplace, or partner marketplace UI in this phase. The protocol reserves their place. Future projects can build them without changing who owns the run state.

ARP is the shared run protocol. The following Oxagen plugin capability contract is part of this design; it is not a second public protocol.

### Scope: reserve the interface

This is a contract for future partner plugins. The present scope is the interface and its stub. **No plugin, witness engine, oracle, remote author agent, Slack sender, plugin host, or marketplace is being built in this phase.**

The stub has named hooks, typed records, an empty registry, and a common path for control requests. Fixed test fixtures stand in for future replies. A disabled stub runs no partner code and claims no partner checks. It does not open an unauthenticated callback or accept installs.

A future Oxagen-hosted marketplace can list plugins. A plugin can run in an isolated Oxagen service, inside a customer's network, or at an approved partner service. The contract must work in all three places. A marketplace listing and a grant to control a run are separate things.

### Scoped plugin control

A workspace can grant a plugin the same run-control authority as its Supervisor. Both call the same control service. That service orders requests, checks rights, and commits state. A permitted plugin command must be acted on or rejected with a saved reason. It is not merely advice in a prompt.

Grants name the company, workspace, runs, actions, records, destinations, and expiry. Scope may include a fixed set of repo-bound runs. Fleet commands save their target list and show a receipt per run. The caller cannot choose its company by setting a field in a request.

Control rights are separate from read rights, tool rights, and completion seats. A plugin uses its own scoped identity and tool grants. It cannot widen the supervised agent’s tool belt by sending context or control commands. Helper agents need their own approved definitions and checked grants. An advisory plugin can still pause a run if it has a pause grant. A required seat does not give its holder every control right. Neither role grants keys, host admin access, or the right to sign a Supervisor's receipts.

### Core controls and their meaning

| Operation | Effect | Proof needed |
|---|---|---|
| `run.pause` | Close new-work and old-result gates, then seek a stable pause. | Confirmed `PauseBoundary`, as defined by ARP. |
| `run.resume` | Start again from a named confirmed pause. | Current rights, current version, fresh access epoch, and all blocking holds cleared or lawfully overridden. |
| `run.stop` | End this run and fence further work under it. | A terminal stop receipt after all relevant workers are stopped or isolated and unknown effects are resolved. |
| `run.force_continue` | Reject a proposed finish and require a named next task. | A current control grant and checked admission of the new work. |

`run.cancel` is an alias for the same stop request, not a second way around its checks. Once stop is accepted, it closes the gates and cannot be undone by resume. Show `stopping` until proof exists. A request, timeout, or closed link is not proof of `stopped`.

Force continue is never force complete. It grants no new access, tools, funds, or policy waiver. It records a direction and closes the old completion round. New work passes through the normal gates. A paused run also needs a permitted resume from its confirmed boundary. A completed turn needs a new linked turn. A stopped run needs a new run with fresh grants.

All commands carry an expected control revision, access epoch, and duplicate-prevention key. The service puts them in one saved order. Stale commands are rejected, not silently rebased. Once a stop is accepted, later enablement commands fail. A pending pause blocks resume and continuation until its proof exists. A hold blocks only the transitions in its scope. A completion-only hold does not block corrective work unless a separate hold covers that work. A racing completion and stop have one committed order. Neither receipt can overwrite the other.

The reply to a command separates **saved**, **rejected**, **in progress**, **confirmed**, and **superseded**. Receipt of a plugin request does not prove its effect. Only the core and trusted gates issue authoritative state and execution receipts.

### Completion is a proposal, then a core decision

The harness calls `turn.completion.propose` when the agent reports done. It cannot issue the authoritative `turn.completed` event.

The core saves a fixed proposal. It binds the turn, files, artifact fingerprints, context version, accepted event frontier, pending effects, current rules, and plugin seat list. Each seat also binds its installation version, grant, deadline, and waiver rule. The list cannot change silently while replies are in flight.

The turn enters `completion_pending`. Normal agent dispatch and candidate edits wait. Separately allowed plugin checks may run with their own IDs and budgets. They read the fixed candidate. They do not modify it in place. A required plugin gets only the evidence its read grant allows. Missing evidence leaves its seat unresolved.

| Final seat reply | Required seat | Advisory seat |
|---|---|---|
| `ready` | No objection for this proposal only. | Advice recorded. |
| `hold` | Blocks completion, with a reason. | Advice recorded. |
| `continue` | Rejects this finish and requests more work. The work still needs normal access and funds. | Suggests more work. |
| `abstain` | Does not meet the required condition. | Ends the advisory response. |

Transport pending, error, and timeout are separate states. They are not ready replies. A failed or absent required seat keeps completion waiting. An advisory failure can be recorded without holding completion.

There is one final reply per seat per proposal. A replay of identical bytes returns the same receipt. Conflicting bytes under the same ID are rejected. Changing a final reply requires a new round or an authorized control request. It cannot rewrite the old reply.

The core commits `turn.completed` only if all of these remain true in one checked state change:

1. The proposal, files, context, rules, grants, and candidate-affecting accepted frontier are still current.
2. Every required seat is ready or has an explicit valid waiver.
3. No binding hold, accepted continuation, or pending stop or pause blocks the finish.
4. Core checks on effects and run state allow completion. A pending or unknown write cannot be ignored.

This is not a majority vote. A plugin cannot directly commit done. An agent's own claim cannot count as a required partner reply. Empty seat lists add no partner requirement. A zero balance does not itself block a free completion step. Any paid work still needs funds held before it starts.

The accepted frontier here covers state that affects the candidate. Logging a plugin reply, an audit event, or a bill receipt does not itself void the round. It does so only if it changes the judged state, current rights, or the outcome of an effect.

Edits, new work, material context changes, or policy or grant changes invalidate the round. They require a new proposal and fresh replies. A human file edit counts too. Forks and new runs do not inherit ready votes.

A completed turn is a historical fact. Later findings can flag it or start a new linked turn. They cannot silently remove its completion event. A long-running agent may finish many turns while its run stays open. `run.completion.propose` uses the same contract when the whole run has an endpoint.

### Holds, waivers, and missing partners

A `ControlHold` has an ID, issuer, scope, reason, active version, and override rule. It blocks only the transitions named by its type. A completion hold can keep a turn open without claiming that all outside activity is paused. A pause command needs the full pause process. A seat's hold belongs to its proposal. It does not create a run-wide hold by itself. Separate run holds stay active across rounds until their own release or override rule is met.

A holder may release its own control hold. A release of a final completion hold starts a new round. It does not change the old vote into ready. Resume does not clear all holds by default.

An override needs a separate `hold.override` grant and a workspace rule. The command must name each hold or seat, the target proposal, and the reason. Only holds marked overridable can be waived. Record the approver and decision. Force-continue rights alone do not grant override rights. Core access, tool-deny, budget, pause-proof, and unresolved-effect checks cannot be waived through this interface.

Choose seat deadlines, retry limits, and escalation rules before dispatch. A required timeout stays unresolved. Uninstalling or disabling a required plugin does not satisfy its seat. An authorized waiver or explicit policy change and new round is required. A plugin cannot mark itself not applicable by abstaining. The core records applicability when it sets the seat list.

A lost link cannot promise instant remote control. Record when a command is accepted and when each gate confirms it. Modes that require live control checks fail closed when that channel is lost. No deadline turns an unconfirmed pause into a confirmed one.

### Proposed records

| Record | Required contents |
|---|---|
| `PluginManifest` | Plugin and publisher IDs, fixed version and package digest, profile versions, hooks, requested rights, declared effects, runtime options, configuration schema, and size limits. |
| `PluginInstallation` | Org and workspace, pinned manifest, distinct workload identity, current grant version, allowed records and endpoints, event filters, seat rules, expiry, quotas, and payer. |
| `PluginHookRequest` | Request and event IDs, installation and grant, hook name, target run and turn, candidate or boundary reference, allowed evidence references, deadline, and causal parent. |
| `CompletionProposal` | Proposal ID and digest, target kind `turn` or `run`, run ID, turn ID when required, round, control revision and epoch, candidate and context digests, candidate-affecting frontier, effects, policy and grant versions, fixed seats, and deadlines. |
| `ActionGateProposal` | Target kind `action`, run and action IDs, exact action digest, current policy and grants, fixed seats, and deadline. Uses the same reply rules but controls action admission, not turn completion. |
| `PluginDecision` | Decision ID, installation, exact proposal and digest, seat ID, grant version, final choice, reason, allowed evidence references, and optional next task. |
| `PluginControlRequest` | Command ID, operation, target, expected revision and epoch, exact input, reason, expiry, idempotency key, and any pause, proposal, or hold references. |
| `ControlHold` / `HoldOverride` | Owner, transition scope, blockers, release or waiver rule, named target, authorizing actor, reason, and recorded result. |
| `PluginContextOffer` | Offer ID, target boundary, content reference and digest, sources, trust labels, relevance claim, expiry, and declared data use. |
| `PluginJobRequest` | Job and parent IDs, remote agent identity, task, fixed inputs, allowed outputs and effects, dependency on completion, limits, payer, and callback contract. |

Trusted ingress derives org and actor identity. A caller-supplied field alone proves neither. Record references do not grant read access. Payload bytes use ARP's protected artifact store and retention rules. Signatures bind source and bytes. They do not prove that a plugin's claim is true.

### Hooks, operations, and events

Reserve these hooks:

| Hook | Purpose |
|---|---|
| `turn.before_start` | Offer context or request control before the first model call. |
| `execution.boundary` | Offer due context or controls before the next allowed step. |
| `action.before_dispatch` | Optional policy-selected decision seat for a fixed action. |
| `turn.completion_proposed` | Judge the fixed proposed finish of a turn. |
| `run.completion_proposed` | Judge the finish of an endpoint-bound run. |
| `security.event` | Receive a filtered event for an allowed response or notice. |
| `run.state_changed` | Track confirmed lifecycle facts. |

Only configured blocking hooks wait for a plugin. An event subscriber does not become a blocking seat by accident. For a before-action seat, bind the exact action digest and apply the same missing-reply and stale-version rules. Recheck core permission and cost gates before dispatch even if all plugin seats are ready.

Proposed operations are `plugin.capabilities`, `plugin.events.subscribe`, `plugin.events.ack`, `plugin.decision.submit`, `plugin.context.offer`, `plugin.job.request`, `hold.release`, `hold.override`, and the shared run controls. Add `turn.completion.propose`, `turn.completion.status`, `run.completion.propose`, and `run.completion.status` for endpoint decisions.

Core events include `plugin.requested`, `plugin.reply_recorded`, `plugin.reply_rejected`, `completion.proposed`, `completion.blocked`, `completion.invalidated`, `completion.waived`, `run.continuation_requested`, `turn.completed`, and `run.completed`. Existing requested and confirmed pause, stop, and resume events carry the state changes. `plugin.context_admitted` records the exact prompt that received an offer.

This example is a data shape, not working plugin code:

```json
{
  "schema_version": "oxagen.plugin-stub/0.1",
  "operation": "plugin.decision.submit",
  "request_id": "reply-27",
  "installation_id": "plugin-install-4",
  "grant_revision": 3,
  "proposal_id": "finish-12",
  "proposal_digest": "sha256:example",
  "seat_id": "required-seat-2",
  "decision": "continue",
  "reason": "The docs still describe the old behavior.",
  "next_task": "Update the setup guide for the changed command.",
  "evidence_refs": ["artifact:docs-review-7"],
  "idempotency_key": "reply-27"
}
```

Authentication travels in the approved service channel. The server checks the installation's current grant and that the evidence belongs to its allowed scope. Accepting this reply does not run a shell command or give its text system-level trust.

### Delivery, context, and remote work

Use authenticated HTTPS for commands and cursor-based subscriptions for events. A customer-local worker may pull events over an outbound connection. Do not require public inbound callbacks behind a firewall. A webhook is an optional delivery method, not a source of authority.

Deliveries may repeat. Use IDs, saved cursors, bounded retries, and expiry. Bind callbacks to the installation, audience, request, body digest, grant, and target version. Revocation fences new work and active callbacks. A response from an old round, revoked install, expired job, or interrupted request is evidence-only. Keeping that evidence does not allow its reuse as a fresh vote. Fresh review must issue a fresh decision.

Context plugins offer data rather than writing the prompt. Oxagen checks source rights, data export, trust, freshness, size, duplicates, and relevance before use. Record all changes and the final prompt spans. Apply offers at the start of a turn or the next controlled boundary. Mid-turn interruption needs granted pause and steering rights. CGP can carry context, and MCP can expose tools. Neither replaces this control contract.

A future remote docs author gets its own identity, task, budget, and approved tools. Its returned patch names its base files. Applying it needs a checked action and invalidates any completion round for the changed candidate. A job declared independent may finish later. The completion record must not imply that it already finished.

Plugin work that uses Oxagen's strict guarantees must route model and tool calls through its gates. Outside partner compute must be labeled as such. Remote results are partner assertions unless trusted evidence supports a stronger claim. Give remote partners only approved data and scoped service access. Brokered secrets stay outside their code where the integration supports mediated calls.

A future Slack plugin needs a grant for the event fields, target channel, message action, and any sensitive data export. A subscription alone does not allow sending. Use a stable event ID to prevent duplicate notices.

Set bounds for bytes, time, retries, child depth, follow-up turns, and spend. Hold money for paid plugin work under every applicable budget. Keep causation and event-origin filters so a plugin cannot trigger itself forever. Reaching a limit blocks work with a reason. It does not mean done.

Checkpoints record plugin versions, relevant holds, proposals, pending jobs, and allowed state references. They never carry live grants or keys. A fork must create fresh grants and seats. Required plugin state that cannot be restored blocks that continuation claim. Reconcile outside jobs before retrying them.

### What the stub must prove

Use fake responses, not a real partner plugin, to check these rules:

- Empty registries leave the normal core path intact.
- A granted plugin and Supervisor command reach the same state-change path.
- Wrong scopes, stale grants, replayed IDs, and mismatched digests are rejected.
- Required hold, abstain, error, and timeout cannot silently finish a turn.
- Advisory advice cannot clear another seat's hold.
- Pause needs proof. Resume and force continue cannot skip it.
- Stop, completion, revocation, and continuation races have one recorded outcome.
- Changed files or rights invalidate old ready votes.
- Context cannot bypass prompt boundaries or export rules.
- Remote jobs, repeated events, and continue requests stay within their limits.

The stub must remain disabled for real partner execution until a later project builds and tests the host and install flow. Marketplace search, publishing, review, billing, SDK implementations, and all sample plugins are outside this phase.

Witness verification with an oracle is one possible future use of this interface. It is not an ARP core service, a required built-in seat, or a plugin being specified for implementation here.

## 18. Keep records private and show changes

Link each record to a content fingerprint and sign saved points. This helps show that records have not changed. Give customers proof that an event is in the log and that new history extends the old log. Send log roots to a customer-owned or outside log observer. This helps detect two conflicting versions of history. A blockchain is not required. [Merkle log foundations](https://www.rfc-editor.org/rfc/rfc9162.html)

That promise needs a mechanism, and the first draft had none. The schema now carries it: every run event is a leaf with a leaf hash and index in `audit_log_leaves`, and `audit_log_checkpoints` holds a signed tree size and root hash, with the observer's acknowledgement when one exists. Two operations serve the proofs: `audit.inclusion_proof` shows that one event is under a checkpoint, and `audit.consistency_proof` shows that a newer checkpoint extends an older one. Without those tables and operations, the claim is only "signed records", and the documentation must say so.

Keep three claims separate: the record is unchanged, a trusted part saw it, and all relevant events were saved. A signature helps the first claim. Trusted gates and coverage tests support the other two.

Encrypt stored data and use separate customer keys. Protect the keys with a managed key service. Cover databases, files, backups, queues, local buffers, and snapshots. Protect data while it moves too. Bind each encrypted item to its company, object, and version. Do not put secrets in the labels sent to the key service. Some services log those labels as plain text. [AWS KMS context](https://docs.aws.amazon.com/kms/latest/developerguide/encrypt_context.html)

Use object IDs that reveal no content. Keep duplicate detection within one customer. Public plain-text hashes may reveal that two customers have the same file. They may also allow guesses about simple data. Restrict who sees digests. Approved exports need a manifest and safe handling of keys.

Keep a small audit record separate from encrypted content that can be deleted. State how long data is kept. Set rules for legal holds, deletion, key destruction, and backups. Keep a marker when an approved deletion takes place. Say which replay features no longer work. The same content cannot be fully deleted and kept forever for full replay.

If a secret enters a record by mistake, block access and rotate it. Save a safe note about the removal, not the secret. Follow incident and deletion rules for any copy already retained. This is a response to a failure, not permission to upload raw content.

## 19. Org isolation, RLS, and private networks

Keep each customer's data, keys, and work apart. Apply this to storage, queues, caches, search, services, and workers. A company ID column alone is not enough. Use trusted sign-in facts to set the company for every job and request. Check rights in the app and in database row rules. Give service accounts only the rights they need. [SaaS isolation guidance](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/preventing-cross-org-access.html)

Keep a bounded group of customers and their workers, data, and keys in each region. A small global service routes requests without needing prompt text. Give one customer its own group when needed. It can use the same protocol.

The org’s data-plane setting selects the store used by the web app and work-report writers. Use that same store for required repo, diff, PR, CI, persona, and tool-use records. The browser talks through checked services. Agents never choose a database route.

Start with PostgreSQL for records and action state. Include typed graph nodes and links, source versions, and sync records from the start. A graph search service may use a separate store as needs grow. It must keep the same rights and source links. Encrypt large files in object storage. Add a saved send queue, protected workers, and a search view. Add larger stores for events and reports as use grows. Access checks must not rely on a stale copy built for reports.

One active trusted service owns the right to send work for a run. Test backup and restore across zones. State how much data could be lost and how long a restore may take. A remote copy that lags cannot support a zero-loss promise. Strict work stops if it cannot reach saved records or current rules. A contract may allow a valid local service to keep control and continue work.

Keep large model streams outside the workflow engine's own history. Link to saved files instead. Limit sizes, queues, storage, and resource use so one customer cannot exhaust the service.

### Use row-level security to keep customers apart

**Row-level security**, or **RLS**, makes the database check which rows a request may read or change. Each private row carries a company ID and, where needed, a workspace ID. Missing or invalid scope must deny access. A caller cannot choose its company by typing an ID into a request.

RLS enforces the scope from the same IAM system. It is not a second place for customers to manage rights. Roles, record grants, and policy still govern each action. An org check alone does not grant access to every record in that org.

Trusted services set the scope for each database task. Normal app services must use accounts that cannot bypass RLS. Keep stronger maintenance accounts separate and audit their use. Background tasks, such as CI updates, need scoped service identities too. [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

Scope has two verified shapes. A run or workspace task names one workspace and sees only that workspace. An org-level task, such as the workspace picker, a cross-workspace spend view, or an org policy template, names the org and no workspace. The service sets that org shape only after checking an org-level grant. A session with neither shape sees no rows. Set the scope per transaction, never per connection, and pool connections in transaction mode. A scope that survives on a pooled connection is a cross-organization leak. Background relays, such as the outbox publisher, run once per organization under the same scope. There is no global poller that reads every organization's rows.

State the threat model honestly. Row rules keyed on a transaction setting stop application code that forgets a filter. They do not stop SQL injection run with the runtime role, because an injected statement can set the scope itself. The defense against injection is parameterized statements only, no SQL built from input, and a lint gate that rejects dynamic SQL. The design does not claim that row rules defend against injection.

RLS only protects database rows. Files, search results, queues, caches, downloads, and exports need the same IAM checks. A private row must not point to a public file. Test both human and agent requests that try to cross company or workspace lines.

### Support three placements

| Mode | Where the work lives |
|---|---|
| Managed SaaS | Oxagen hosts management and work, with customers kept apart. |
| Hybrid | Oxagen hosts management. The customer keeps enforcement, payloads, workers, connectors, keys, and approved models locally. |
| Fully private | Management and work run in the customer's space, including agreed offline use. |

![Three deployment options use the same architecture. Hosted Oxagen keeps management and request checks in its cloud with isolated customer data. In a split setup, hosted management sends commands to customer-local gates, keys, records, and approved models. Fully private Oxagen keeps both management and data services within the customer environment. Cloud commands cannot override local customer rules, and offline use needs prior allowed limits.](diagrams/deployments.svg)

*Start with hosted Oxagen. Keep the same control boundaries for customer-local handling of data and for fully private installs.*

Hybrid links should start from inside the customer's network. Each end must prove who it is. The customer may send only approved facts about its records to the cloud. It can keep full definitions and memories local. Oxagen remains the source of truth wherever its services run.

Local customer root rules cannot be overridden by cloud steering. A cloud command must not be able to force private data through the firewall. Local checks, signed releases, and customer-owned rules enforce that limit.

Offline use needs signed local rules and proof of who may act. Both must expire. Keep secrets and evidence locally too. Later sync sends only approved data and keeps each event's first ID. Agreed offline use must not rely on hidden license checks or calls that report data.

Ship signed releases that rebuild to the same output from the same source. List the software parts and their sources. Include steps to upgrade, roll back, and move stored data to new formats. Document data reporting and backup. Let customers manage keys without changing ARP's core records.

### First hosted release: AWS ECS with Fargate

The first hosted release uses **Amazon ECS with Fargate**. AWS runs three small groups of containers: the web app and API, the gateway, and background workers. Each has its own access role. Add more services only when there is a clear need.

Use separate AWS accounts for staging and production. Staging is where a release is tested before it reaches customers. Each account has its own keys, database, file store, secrets and access roles. Private services sit behind an HTTPS entry point. They do not expose their own public network addresses.

Use Aurora PostgreSQL Serverless v2 for the first hosted database and S3 for files. Aurora runs PostgreSQL and is managed by AWS. Set bounds on database size and compute, service counts and log retention. Keep encrypted backups and test restores. SQL row rules and Oxagen's shared IAM checks still apply; choosing AWS does not supply those product controls by itself.

A release starts from the exact merged commit that passed CI. Build the images once. Check their fingerprints in both accounts. Test the same images in staging, then require signed approval for that exact release before production. A changed image or commit needs new evidence.

Before a database change, make a snapshot, restore a private test copy, and test the change there. Check that both the old and new app can still use it. The supplied release path accepts only its small set of safe, added schema changes. It rejects other changes. A failed update may restore the old app only while it still fits the data. Never overwrite the live database with an old snapshot just to undo an app update.

![After design certification, the exact merged commit must pass CI. A protected builder makes API, gateway and worker images once and checks their digests in separate staging and production registries. Each environment restores a database snapshot into a private test copy, applies the supported migration and tests old and new app compatibility. Staging deploys those images and must pass health checks. A human signs approval for the exact source, artifact and production target. Production deploys the same digests. Failed health keeps release stopped; the old app may return only if compatible with the current data. Unknown writes keep their records and locks until reconciled. The live database is not automatically rewound.](diagrams/aws_release.svg)

*The selected AWS release path uses separate accounts, exact images, restored database tests, health checks and signed approval. Unknown results remain blocked. This drawing describes the implemented release controls; cloud qualification and product certification are still required.*

Use Docker Compose for local development only. It runs the reviewed app images with local PostgreSQL and a local file store. It is not a production install or proof that the protected build runner works on a Mac. That runner still requires its qualified Linux setup. Kubernetes is deferred until a measured need justifies it. The private-customer design keeps its own deployment options; ARP does not depend on AWS.

The package includes configurable AWS templates and release code. It does not include a running product or provisioned cloud resources. Account, region, network, domain, certificate, image and access settings must come from the operator. Design, full API and schema certification still comes before product implementation. See the [build plan](ARP-Build-plan.md) and [AWS release setup](build-system/RELEASE-SETUP.md).

AWS cost alerts are alerts. They do not enforce a hard cloud bill cap. Finite run deadlines and fixed resource bounds limit a release's work. Running databases and services keep costing money until they are changed or stopped. Model-call budgets remain a separate, enforced limit in Oxagen.

### Start the SOC 2 work on day one

SOC 2 needs controls that work and an outside review. Encryption alone is not enough. Define service promises and who owns each control. Review access and remove it when people leave. Check releases, flaws, and vendors. Plan for incidents, practice recovery, and test for break-ins. Keep evidence as each control runs. [AICPA SOC resources](https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services)

## 20. Build adapters and reuse shared standards

Test each harness version and each way to use or host it. “Supports Codex” is too broad. Codex hooks have known gaps. Claude's file checkpoints have limits too. Oxagen must own the control and save layers needed for its claims. [Codex hooks](https://learn.chatgpt.com/docs/hooks), [Codex app-server](https://learn.chatgpt.com/docs/app-server), [Claude checkpoints](https://code.claude.com/docs/en/agent-sdk/file-checkpointing)

Build local Codex and Claude Code adapters first. Then assess Gemini CLI, OpenCode, Copilot CLI and SDK, Cursor, and custom agents. Check routing, tools, pauses, saves, and failure modes for each. A hosted or hidden path may not qualify for strict control. [Claude gateway](https://code.claude.com/docs/en/llm-gateway-connect), [Gemini hooks](https://geminicli.com/docs/hooks/reference/), [OpenCode SDK](https://opencode.ai/docs/sdk/), [Copilot SDK](https://docs.github.com/en/copilot/how-tos/copilot-sdk/troubleshooting/compatibility), [Cursor hooks](https://cursor.com/docs/hooks)

Provide SDKs for JavaScript/TypeScript, Python, Go, Java/Kotlin, C#/.NET, Rust, Ruby, PHP, Swift, and C/C++. Use shared tests across languages. Keep access decisions in trusted gateways. Do not copy that logic into every SDK.

Keep the provider's special request features when supported. Do not reduce them all to basic chat. Record all changes. Reject features that cannot be mapped safely. This includes unknown fields that may change what is safe.

| Standard or tool | Use in Oxagen |
|---|---|
| OPA / Rego | Evaluate rules. |
| OpenFGA | Check roles and rights to records. |
| CGP | Retrieve context with source and consent data. |
| MCP | Serve each agent’s allowed catalog tools and connect approved resources. |
| W3C PROV | Exchange source and derivation records. |
| SPIFFE, OAuth, OIDC | Prove workload, delegated, and human identities. |
| Agent Client Protocol | Connect app clients and agent sessions. |
| A2A | Exchange agent tasks, messages, and files. |
| OpenTelemetry | Export operational metrics and traces. |
| CloudEvents | Exchange event envelopes where useful. |
| OCI and signed files | Distribute environments and skills. |
| in-toto / DSSE | Package signed evidence. |
| ARP | Link allowed actions, evidence, saved state, and continuation. |

The MCP mapping must name the version it supports. The July 2026 version and older clients use different message forms and change notices. Keep the same access checks in each adapter. Test safe list refresh and separate grants for each agent.

ACP session resume does not promise a move across runtimes. A2A messages do not prove control of a remote agent. Sampled OpenTelemetry records cannot replace ARP's full run record. Pin the version of each mapping. [ACP sessions](https://agentclientprotocol.com/protocol/v1/session-setup), [A2A](https://a2a-protocol.org/v1.0.0/specification/), [OpenTelemetry AI fields](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/), [CloudEvents](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md)

Choose clear protocol names and file types. Another project uses the phrase “Agent Run Protocol.” Keep the requested name, but do not claim it is unique. [Paperclip specification](https://github.com/paperclipai/paperclip/blob/master/doc/spec/agent-runs.md)

## 21. Prove the promises before claiming support

Test and label each promise on its own. These include records, steering, model gates, tool gates, native resume, cross-app forks, restored runtime state, and the plugin interface stub. State the version and hosting mode. An adapter's own claim is not proof.

Show capture gaps, changed state, missing outside state, and any future plugin results separately. Do not hide them in one vague “fidelity” score. A fork that works once does not prove all future forks will act the same.

The product promises need these tests:

1. Send new work to several registered targets. Race duplicate delivery, cancellation, expiry, worker takeover, and reconnect against startup. Prove one child request creates at most one active run, with no cross-workspace delivery. Then steer several devices and harnesses from one workspace. Get proof for each target. Send nothing to another workspace. Show idle, ended, and offline sessions correctly.
2. Race steering against a model reply and a group of tool calls. The saved order must decide which step sees the message. No next step may skip pending steering.
3. Use two agents in two workspaces at one MCP address. Each sees only its assigned tools. Deny guessed, stale, renamed, and revoked tools. Try a false mode change, a reused list page, a native tool, and another MCP server. A lost list-change notice must not let a denied call run. Also test a Bash rule within its stated scope. No part of a matching call may run, including pipelines and later shell input.
4. Check that all required work-report fields reach the org’s configured store. Use a workspace default that differs from the provider default and PR target. Test new commits, moving targets, stale CI, reruns, persona changes, and duplicate tool reports. Prove a private-store failure cannot send the report to public storage. Compare known inputs with their expected cleaned records and model requests. Prove planted secrets do not reach any model, log, report, upload, or sync path. Include long results, failures, summaries, children, and delayed streams. Check access to analysis. Stop strict work when capture fails.
5. Race paid calls from devices and agents sharing a budget. Keep spent and held funds within every limit. Test retries, fallbacks, cancellation, missing bills, new months, lower limits, and offline funds.
6. Try direct model access, other keys, and unsupported hosted paths. Strict control must block them or reject the setup.

Pause tests must cover missing worker replies, unknown writes, timeouts, crashes, unsent calls, and queued retries. Race replies against the result gate. Test late chunks before and after resume, late tool calls, duplicate callbacks, and dirty native history. Test stale replies and pause/resume races. Test explicit adoption after rights change.

Show “paused” only after a saved, confirmed boundary. Late evidence must not change active work. A late receipt that proves a write must still be kept to check the old action.

Test shared business limits with concurrent agents, retries, approval waits, and outside refunds. Test graph links and counts that may reveal hidden records. Try stale policy facts, false refund links, missing source versions, and secrets in graph labels.

Try to break the access rules. Use a false company ID or try to read another customer's files. Steal or reuse an approval. Break a rule or remove a hook. Try another network path or another way to do a banned action. Try to steal a secret or feed hostile text through a tool. Change inputs after approval. Try to give a child more rights or let the cloud override a local rule.

Test crashes before and after sending. Remove or damage files. Send the same event twice. Stop capture, edit files by hand, and save during a write. Remove access while a reply streams. Let two branches clash. Try expired provider state and context the new app cannot use. Compare restored file fingerprints and required context across adapters.

Test the plugin seam with fixed fake replies. Required holds, missing replies, errors, and timeouts must keep completion waiting. Race stop, pause, resume, force continue, and completion. Try stale votes, changed files, revoked grants, wrong-company callbacks, and invalid hold overrides. Prove that no plugin can bypass a core gate. These are stub tests, not a plugin implementation.

Use shared byte-format and signature tests across SDKs. Feed parsers and streams broken inputs. Use formal checks on the small state machines for access, sending, pausing, and saving. Do that before tuning speed. Set speed and uptime targets from real tests and customer promises.

## 22. Build in a useful order

Start with agent records, work orders, and identity checks. Include the required desktop gateway and local data scanner in the first strict local-run path. Build the web app for target registration, new-work requests, run control, and spend views alongside the gates. Add reusable policy forms, protected runners, and saved workspaces. Build the required graph and context path with source versions and access checks. Save business-action correlation IDs now. Real business-data connectors and their result views come in a later phase. Encrypt the evidence and keep customers apart from day one. Include key storage, admin rights, and SOC evidence in the first live release.

Test local Codex and Claude Code next. Show one agent release in both. Block a forbidden action. Fork safely with matching files, a clear report of lost state, and fresh access.

Add the plugin interface stub with empty seat lists, named hooks, and fake test replies. Do not build a partner plugin, witness engine, plugin host, or marketplace in this phase. Keep publish gates separate from turn completion. Add branch memories and better checks for uncertain writes. Test a setup inside the customer's network early. Once the core promises hold, add more adapters and SDKs. Expand private installs and work with outside conformance partners.

## 23. Technical reference in plain words

These names are proposed ARP interfaces. The explanations below guide implementation. A complete normative schema still needs to be published and tested.

### Records and identity

| Proposed name | Meaning |
|---|---|
| `Principal` / `RoleGrant` / `DelegationGrant` | Human, agent, and service identities, workspace roles, record rights, and scoped delegation under one IAM system. |
| `DesktopEnrollment` / `DataProtectionPolicy` | Trusted device setup and workspace rules for local block, redact, and replace checks. |
| `SanitizedRequest` / `CleanArtifact` / `SanitizationResult` | Exact cleaned content and safe evidence of the local check. No raw value or raw content fingerprint. |
| `GovernedAction` / `ActionAuthorization` | One checked operation and the single-use approval for an exact attempt, with current scope, request, budget, and expiry. |
| `AgentDefinition` | Purpose, owner, instructions, tool allow and deny lists, approved modes, limits, and dependencies. |
| `AgentRelease` | A fixed version of an agent and its dependencies. |
| `WorkReport` / `WorkReportRevision` | Required repo, branch, file, diff, PR, CI, persona, and tool-use records saved in the org’s configured store. |
| `OrgDataPlaneBinding` / `ReportStoreReceipt` | The trusted storage route and proof that required report data was saved there. |
| `WorkOrder` / `WorkOrderRevision` | The assigned job, owners, scope, access ceiling, tool/context limits, policy and budget links, expiry, and review points. |
| `SkillPackage` | Instructions and optional code, with source, tests, required access, and a content fingerprint. |
| `PolicyTemplate` / `ExceptionGrant` | Reusable rule forms and explicit, bounded approval of an overridable threshold. |
| `GraphEntity` / `GraphRelation` / `GraphProjectionState` | Versioned code, policy, context, and evidence links with source authority, trust, rights, and sync state. |
| `OntologyRevision` / `BusinessActionCorrelation` | Business type definitions and trusted links from actions to future source-confirmed business records. |
| `PolicyBundle` | A versioned set of rules, facts, approval rules, and urgent denies. |
| `ToolBinding` | Stable tool ID, publisher, workspace scope, schema and route versions, targets, access needs, effects, and retry rules. |
| `ToolBeltSnapshot` | The effective tool set and visible schema fingerprint for one approved run context. |
| `RunContextBinding` | Verified company, workspace, operator, agent release, mode, runtime, run, and access version. |
| `MemoryRecord` / `MemoryView` | Saved knowledge and the authorized query used to select it. |
| `SteeringDirective` | A direction with issuer, targets, timing, priority, expiry, version, and status. |
| `IdentityBinding` | The link between a person, agent, workload, and chain of access grants. |
| `EffectiveRunManifest` | The exact release, context, policy, tools, skills, and restrictions used. |
| `HarnessProjection` | The target app's generated setup, with source mappings and differences. |
| `DeviceEnrollment` / `CheckoutBinding` | A trusted device registration and repo-to-workspace link. |
| `RuntimeRegistration` / `PresenceLease` | A running agent's owner, app, repo, child work, capabilities, and current contact status. |
| `HarnessTarget` | An enrolled place to run a supported harness, with owner, workspace, repo bindings, capacity, controls, and presence. |
| `WorkRequest` / `DispatchTarget` | A saved assignment and its fixed set of child requests, each with a destination and tracked start. |
| `FleetSteeringOperation` | A saved workspace broadcast with a fixed target set and per-target progress. |
| `AuthorizationDecision` | Allow/deny result, rule version, reasons, evidence, and required conditions. |
| `PauseBoundary` | Proof of the confirmed stop and the exact stable state. |
| `ContinuationCapsule` | The files, context, history, pending work, and limits for a restart or fork. |
| `BudgetPolicy` / `BillingAttribution` | The spending rule and trusted chain of who pays. |
| `PluginManifest` / `PluginInstallation` | Fixed partner package, distinct identity, workspace grant, hook choices, seats, limits, and payer. |
| `CompletionProposal` / `PluginDecision` | Exact proposed turn or run finish, fixed seat list, partner replies, and final core decision. |
| `ActionGateProposal` | An optional plugin seat request for an exact action before it runs. |
| `PluginControlRequest` / `ControlHold` | A checked run-control command, its blockers, and the rule for release or override. |
| `PluginContextOffer` / `PluginJobRequest` | Proposed context or remote work with source, access, cost, and boundary rules. |

A session is the visible task and conversation history. A run is one execution episode in an environment. A fork starts a new run and branch. A turn may hold many model requests and tool actions. One logical action may have several attempts.

### Mission control, work orders, and work dispatch

The web app is the primary operating surface. Its control API receives work requests, assigns them to approved harness targets, and tracks results across the workspace. Mandatory model, tool, and context gateways enforce the current grants and limits. The harness performs the work. A human team supervisor has scoped rights over operators and their work. The local Supervisor is a separate trusted software service.

These are proposed ARP records and operations. They reuse the existing run, policy, approval, budget, pause, evidence, and plugin contracts.

| Record | Required meaning |
|---|---|
| `HarnessTarget` | Stable target ID, org/workspace, owning person or team, enrolled device/runner, adapter version, repo bindings, approved releases, placement rules, capacity, presence, and supported controls. Registration alone grants no right to launch. |
| `WorkOrderRevision` | Immutable assignment, issuer, accountable operator, authorized agent and modes, scope, context/tool constraints, policy links, budget references, placement, required capture, expiry, review points, and optional completion conditions. |
| `WorkOrderEnforcementReceipt` | Target, work order revision, effective control sequence/epoch, gates covered, activation outcome, and evidence. A draft or published record is distinct from active enforcement. |
| `WorkRequest` | Submitter, accountable operator, exact agent release/mode/work order, prompt and input references, workspace/repo state, placement options, fixed target set, payer/budget references, queue expiry, start deadline, and required controls. |
| `DispatchTarget` | Stable child request ID, parent request, resolved target, launch ownership epoch, state, failure or waiting reason, cancellation version, and resulting run ID. |
| `LaunchReceipt` | Trusted acknowledgement linking one child request to its run, actual agent release, adapter, repo/files, runtime key, work order, and launch epoch. It proves the recorded start, not task success. |

`work.submit` must explicitly mean new work. Existing-run messages name their run and use steering or a checked next-turn operation. A UI label, free-form prompt, or busy target must not silently change that meaning. Resolve aliases to immutable releases and bind input digests at acceptance. The target must not run a later release merely because an alias changed while work waited.

Authorize the caller for each target, agent, work order, repo, input record, and destination. Keep submitter, accountable operator, and payer distinct and verified. A team supervisor sending on another operator's behalf needs that delegation. Reassignment cannot reset charges or shed applicable operator limits. Do not reveal hidden targets through bulk results. Default bulk admission rejects a changed or unauthorized target set before launch. Explicit partial-admission mode may save individually authorized children and return a safe status for each omitted target. Neither mode promises simultaneous starts or rollback of starts that already happened.

Persist the request, fixed child IDs, and outbound queue records before acknowledging acceptance. An idempotency key names one immutable request within its caller/workspace scope. Reusing it with different content fails. A bounded scheduler chooses only permitted placements, using capacity and isolation requirements. It cannot move a private request, prompt, or context to a public worker just because a private target is unavailable. Rerouting requires an allowed placement choice and fresh checks on the new target.

```text
accepted → queued → assigned → preparing → started
               ↘ waiting for device or capacity
before start: blocked | expired | cancelled | failed
uncertain start: reconciling, with no replacement launch
after start: use the linked run's state and control protocol
```

Each child has at most one current launch owner, enforced by an epoch at the trusted launcher and action gates. A heartbeat timeout does not prove an old owner stopped. A replacement must fence old authority before acquiring control. Start authorization rechecks enrollment, caller/delegation, work order, release, policy, deadline, scope, placement, capacity, and current grants. The first paid action still needs its own budget hold. Reserving a worker slot does not reserve money.

The protected launcher records a stable child-to-run mapping and launch intent before starting a harness. It reconciles that same mapping after a crash. Launch acknowledgement loss must not cause a second process with new authority or a repeated paid first request. If the adapter cannot determine whether launch occurred, the child remains `reconciling` and replacement work is blocked. Existing action receipts govern uncertain effects. Local startup itself must remain in the enrolled isolation boundary.

Order cancellation, expiry, and launch authorization in the child's authoritative state. A cancel committed before launch authorization blocks startup. A launch authorized first may already be starting. In that case cancellation becomes a stop request for the linked run and remains pending until the stop is confirmed. Never report “cancelled, nothing started” without that evidence. Reconnect redelivers stable IDs from saved cursors and rechecks current rights. Closing the web browser does not cancel work.

Each run reports the files it actually received. Two targets sharing a Git remote are not necessarily on the same commit or file state. Use isolated worktrees/work areas by default, or protected writer ownership and version checks for shared files. Shared remote side effects still require record-level checks, duplicate prevention, and conflict handling. Fan-out creates several assignments, not permission to repeat one irreversible write everywhere.

Work orders reference the agent-definition ceiling and cannot widen it. Compose limits by their defined type: denies win, required checks all apply, and narrower resource bounds constrain the action. Apply every relevant budget ledger, with its own period and attribution, rather than taking a naïve minimum across unlike periods. All children sharing one cap reserve against that same ledger. A work order can also limit concurrent work. Acquire capacity atomically across all applicable company, workspace, operator, and agent limits, or acquire none. Each hold names the counted unit, such as an active run, worker, or upstream request. Duplicate delivery reuses that unit’s hold. Separately concurrent attempts need separate holds when the limit counts attempts. Release only after that counted resource stops or is isolated in a way that ends its counted activity. Pausing a run cannot release an upstream-request slot while the provider request still runs. Lost contact alone releases nothing.

Publish work order changes through the existing versioned policy path. Check the issuer before closing gates. Revoke old authority at the effective boundary and record enforcement per target. Stop new spending if a lowered cap is below settled plus held cost, retain outstanding liabilities, and show the excess. A changed operator or agent label does not create a new billing identity. Ongoing work orders use review points and expiry without requiring a false terminal result. The plugin system is optional. When enabled, applicable workspace policy and the work order determine the required seats for an actual completion proposal. A work order cannot omit or waive a seat required by workspace policy.

Partition durable dispatch queues, connection routing, event streams, and report workers by org and workspace. Bound queue size, fan-out, active work, and stream traffic. Use fair scheduling and backpressure, with a separate priority path for authorized stop/revoke commands. No global ordering across all customers is required. Keep authoritative order for each assignment/run and atomic reservations across shared budget accounts. Route large encrypted prompt and output payloads by references instead of through the connection broker. Customer-local services apply local root rules and export only permitted fields in hybrid mode.

Dashboards are permission-filtered read views. Each shows freshness, capture gaps, scope, and definitions of its measures. Distinguish settled cost, reserved liability, available funds, unpriced usage, and forecasts. Count each charge once across child/parent views. Measure accepted outputs, rework, retries, waiting time, run time, review time, and cost under stated task filters. Record who or what accepted an output and which checks were used. Cached chart data cannot authorize work, release holds, prove a pause, or decide completion. UI actions go back through current checks and expected-version control commands.

Proposed operations are `target.register`, `target.list`, `target.revoke`, `work.submit`, `work.status`, `work.cancel`, `work_order.publish`, `work_order.assign`, `work_order.status`, and `work_order.revoke`. `work.claim` and `work.start_ack` are trusted worker operations, not operator shortcuts. Future plugin jobs use this same admission and dispatch path under their own scoped grants. No real plugin or marketplace is added by this design.

Acceptance cases must cover multi-harness dispatch, per-target authorization, private placement, duplicate submission and delivery, lost launch receipts, cancel/expiry races, revoked operators, old launcher takeover, shared checkouts, shared money and capacity, work order rollout, stale dashboards, and reconnect after cancellation. Each outcome needs evidence at the target, not just a successful web response.

### Required work-report profile

`WorkReport` is a first-class ARP record, with immutable revisions and a current read view for each run/repository pair. It MUST be persisted through the org's configured data service into the same authoritative store used for that org's Oxagen web-app records. An agent summary, dashboard-only cache, or unacknowledged event queue is not a saved report. This is a proposed protocol requirement, not a claim that a collector is implemented.

| Record or field group | Required contents |
|---|---|
| `WorkReportRevision` | Report ID/revision, org/workspace, work request, run/branch/turn scope, accountable operator, work-order revision, data-plane binding revision, source frontier, source observation times, save receipt, completeness, and supersession links. |
| `WorkspaceRepoBinding` | Workspace's linked repo ID, VCS type, provider/host, stable repo ID, safe URL/name, configured default-branch name, settings revision, and rights to resolve that branch. Keep fork/head repo identity separately from the base repo. |
| `BranchComparison` | Work-branch name and commit ID, target branch from the workspace setting and resolved commit ID, comparison kind, file list, patch object reference/digest, collection tool/version/options, capture times, fetch state, and known gaps. |
| `ChangedFile` | Repo-relative path, change type, prior/new path for a rename, old/new blob IDs or captured content references, file modes, binary/submodule markers, and diff completeness. Counts alone cannot replace the list or patch. |
| `PullRequestLink` | Stable provider PR ID, number, URL, state/draft/merge state, head/base repo IDs, branch names and commit IDs, source receipt, observation time, and `target_mismatch`. Support zero, one, or many PRs. |
| `CIJobObservation` | Provider/source ID, job/check ID and name, workflow/run ID, attempt, matrix identity, URL, native status/conclusion, mapped status, start/end/observation times, actual tested commit/ref, test scope, PR association, and update/version evidence. |
| `PersonaUsageSegment` | Approved persona ID, name at use, persona revision, agent ID/release, active mode, runtime, access epoch, and first/last action frontier. A rename or mode change cannot rewrite prior attribution. |
| `ToolUsageRollup` | Unique tool names, confirmed-use totals by name, binding/source/revision breakdown, persona segments, distinct logical action and execution-attempt IDs, and separate denied, sent, successful, failed, and uncertain-start counts. |
| `ReportStoreReceipt` | Org/workspace, report/event IDs, configured data-plane/store binding and revision, committed sequence, durable acknowledgement time, artifact references, and integrity data. |

**Data protection.** Scan report payloads locally before remote storage, including patches, paths, URLs, CI text, persona names, and tool labels. Store only cleaned fields and allowed identifiers, with explicit redaction/coverage markers. Required full patches mean full permitted patches, not a right to export secrets. Raw source remains in the local repo; no cloud raw archive or raw content digest is created. Mark exact restoration unavailable when required data was removed.

**Target and diff rules.** Resolve the target from the workspace web-app setting for that linked repository. The required comparison kind is `target_tip_to_work_head`: the tree at the configured default-branch commit is the old side, and the tree at the work-branch commit is the new side. For Git this is `git diff <target_commit> <work_commit>`. A separately labeled `merge_base_to_work_head` comparison may show branch-introduced changes. Store its merge-base ID. It cannot replace the required two-tip comparison. [Git diff semantics](https://git-scm.com/docs/git-diff)

Do not trust moving branch names without object IDs. Resolve the authorized target and work head, then publish the report against a named workspace-settings revision. If the settings changed during collection, retain the observation as superseded and collect a current revision. New commits, force pushes, target advancement, or a newly configured default branch create new report revisions. Never mutate an old patch to make it look current. Failure to fetch the chosen target produces stale/unavailable state, not fallback to a different branch. Detached HEAD and missing/deleted branches have explicit states and nullable names, with known commits retained.

The provider's PR diff may have different semantics. Record it as an optional additional view with its actual endpoints. GitHub's PR comparison uses a merge base. A PR with a different base branch remains linked but sets `target_mismatch`; its checks do not establish compatibility with the Oxagen workspace target. Do not automatically retarget or create a PR as part of reporting. [GitHub comparisons](https://docs.github.com/en/pull-requests/reference/branches)

Capture staged, unstaged, and untracked changes as a separate `WorkingCopySnapshot`, linked to a stable file boundary or labeled non-atomic. A committed branch patch cannot claim to include uncommitted work. Maintain a run-start-to-current view and actor-linked changes for attribution. An inherited branch diff is not proof that the current persona authored all changes. Preserve large/binary content through governed objects rather than silently truncating it. Every file list identifies which comparison or local snapshot it describes.

**Callback capture.** CI webhooks, context responses, tool callbacks, and connector events use the same transient-relay/local-scan contract as model replies. No remote queue, ingress log, trace, graph writer, or retry store may persist their raw payload before scanning. If the enrolled scanner is unavailable, accept only an allowlisted safe envelope of opaque IDs and typed status, or reject delivery so the source can retry. Re-fetch and scan content when the local path recovers. Mark the report pending/stale and preserve known coverage gaps. An external source's own retention remains outside this capture promise.

**CI collection.** Collect every job associated with each tracked PR from all configured CI sources, not just required merge checks or the latest successful workflow. Adapters must exhaust pagination, expand workflows into individual jobs, preserve attempts, and reconcile missed or out-of-order updates with source reads. GitHub requires collection from Checks, Commit Statuses, and Actions jobs where applicable. Keep source-native IDs and map duplicate representations of the same job without collapsing distinct matrix jobs. [GitHub check runs](https://docs.github.com/en/rest/checks/runs), [commit statuses](https://docs.github.com/en/rest/commits/statuses), [workflow jobs](https://docs.github.com/en/rest/actions/workflow-jobs)

Save `coverage = complete | partial | unknown` separately from each job's result, with source inventory, permission gaps, page-completion evidence, observation time, and errors. Complete means all jobs exposed by the configured sources at that observation. It does not promise that no later jobs will appear. A source that exposes only an overall status is insufficient for a complete per-job claim. Never turn no jobs, skipped jobs, inaccessible jobs, or a provider error into “all passed.” Required-check policy and observed-job status remain distinct.

Store the actual commit tested. PR checks can run on a synthetic merge commit, and merge queues can test a merge-group commit. Label `head`, `test_merge`, `merge_group`, or `other` and link the tested head/base inputs where the provider can prove them. Otherwise mark that association unknown. Previous attempts and results for older code remain history, not current success. [GitHub workflow triggers](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)

**Persona and tool counts.** Resolve persona identity from the approved Oxagen registry binding, never from prompt text. Every tool fact joins the binding and persona segment active at that action. `confirmed_use_count` counts distinct execution-attempt IDs with trusted evidence that tool execution began. Success and execution failure both count as use. A rejected proposal does not. A dispatched request whose start is unconfirmed belongs in `uncertain_start_count` until reconciled. Keep sent counts separately so the report does not conceal that uncertainty.

Duplicate event delivery, replay, and stream chunks never add uses. A newly executed retry has a new attempt ID and adds one. The unique-name view sums those facts across binding rows, retains the name used at the time, and exposes each binding/source/revision behind a collision. Whole-tree summaries count each underlying attempt once and label whether child runs are included. Persona-segment totals must reconcile with the same run totals. Reports contain no bearer tokens.

**Storage and updates.** `OrgDataPlaneBinding` is trusted org configuration, with backend namespace, region, service identity, key policy, routing version, and approved buffering rules. Web-app writes and report ingest resolve the same binding through trusted services. Database rows and large patch artifacts may use different storage components within that configured data plane. Their references remain org-scoped. A private deployment keeps code, paths, diffs, persona details, counts, and CI records in its configured store unless an explicit export rule allows a copy elsewhere.

Save source events and artifact bytes before committing a report revision that relies on them. The durable acknowledgement must cover required artifacts as well as metadata. Build the current read view through a recoverable transaction/outbox or equivalent. Distinguish `collected`, `pending_sync`, `durably_saved`, and `projected`; the UI reports its last applied sequence. Missing required persistence stops new strict-mode dispatch under the existing capture rule. An approved encrypted local spool is bounded and visible as pending. It is not permission to report a central save or silently change storage destination.

Storage changes use an authorized versioned cutover that preserves record IDs, deduplication, ordering, and one authoritative write destination. Delayed callbacks cannot choose a stale or cross-org store. Report reads, exports, diffs, names, and counts obey record and source permissions. Refresh on file boundaries, tool/persona events, commits, branch/default-setting changes, pushes, PR lifecycle events, CI updates, and run end. Continue PR/CI tracking after run completion until its stated retention/tracking rule ends, then expose the cutoff. Later facts update the report without silently reopening completed agent work.

A missing PR is `not_created` or `unknown`, as supported by evidence. No applicable repo is `not_applicable` with a reason. A CI outage marks freshness and coverage; it does not claim a passing result. Which missing facts block further work is determined by the current work order and policy. Required report persistence cannot be bypassed by a plugin completion vote.

Proposed operations: `work_report.ingest`, `work_report.refresh`, `work_report.get`, and `work_report.subscribe`. Only trusted collectors/connectors may assert authoritative source facts. Events include `work_report.saved`, `work_report.updated`, `work_report.incomplete`, and `work_report.sync_failed`. Expected revision, stable event IDs, idempotency keys, and configured store binding apply to each write.

Acceptance cases include different workspace/provider/PR defaults; advancing targets and force pushes; uncommitted files and inherited changes; multiple PRs; missing or partial CI permissions; matrix jobs and reruns; old-code success after a new commit; mid-run persona changes; repeated events versus real tool retries; same-name tools from different sources; private-store failure; and an authorized storage cutover with delayed callbacks.

### Business policy and shared action limits

This is a proposed design, not an implemented refund system. Customer-facing names are **Policies** and agent **Permissions & limits**. A `WorkOrder` carries assignment scope and may narrow limits. A `GovernedAction` is checked execution; its single-use authorization is internal infrastructure, not a customer configuration object.

#### Policy definitions and effective limits

Provide versioned `PolicyTemplate` forms with validated typed fields, previews, examples, and tests. Compile forms into a normalized policy model and the chosen evaluation backend. Rego is an advanced authoring option, not a required customer skill. Preserve the template revision, resolved values, source policy, approval history, and activation time. One IAM layer governs policy changes, tool use, affected records, exception decisions, and disclosure of evidence.

Bind rules to a stable business capability such as `refund.issue`, its approved tool bindings, connector operations, and protected effects. Tool aliases or a renamed function cannot change this mapping. An unknown implementation cannot inherit access because its name matches. Use the same enforcement for human-triggered and agent-triggered governed refunds.

Effective authority is the intersection of organization, workspace, agent, delegated grant, and current work-order constraints. All applicable limits pass independently. A narrower scope cannot raise a parent ceiling. Distinguish absolute prohibitions, hard numeric caps, and explicitly overridable approval thresholds. Do not represent them with an ambiguous single limit field.

#### Refund example and monetary meaning

Illustrative rules: cumulative order refunds ≤20% of eligible paid order amount; refunds per canonical customer per workspace per day ≤USD100; all workspace refunds per day ≤USD5,000. A product label must expose the full scope, not silently imply organization-wide customer coverage. Organization-wide rules need organization-wide customer identity and accounting.

Define eligible order amount from authoritative captured charges, explicit tax/shipping/discount rules, and currency. Prior refunds reduce remaining allowance; they do not become a new denominator. A changed charge requires a new authoritative amount version and reevaluation. Use integer minor units and a declared rounding rule. Either require a common currency or pin an approved conversion quote and conservative reservation bound. Never add mixed-currency figures directly.

Use a named IANA time zone and calendar day, or an explicitly selected rolling interval. Define the event time that charges a period. For example, calendar-day limits count authorized dispatch time from the trusted clock; external refunds need an equivalent authoritative initiation time. Recheck the period immediately before dispatch. If it changed, acquire the new period's reservation before releasing the old one. Unknown times or untrusted history block a strict all-refunds claim.

#### Atomic admission and settlement

A protected refund service obtains current order/customer identity, refundable balance, refund history, policy revisions, and scope. It atomically reserves capacity in every applicable limit account before external dispatch. Admission requires `settled + held + proposed ≤ cap` for each account. Policy evaluation alone is not a reservation. Refund exposure and model-spend budgets are separate ledgers even if they share infrastructure.

Create a durable action and attempt record, reserve once, then dispatch using a stable provider idempotency key where supported. Retries retain logical operation identity and reconcile previous attempts first. Ledger postings have unique authoritative refund/event identities. Duplicate webhooks or observations cannot count twice. Do not promise exactly-once external effects unless the provider contract supports the needed guarantee.

A confirmed failure before any effect releases its hold. Timeouts, cancellation, run completion, missing receipts, and uncertain outcomes retain potential liability. On authoritative settlement, replace the hold with the actual charge and release only the verified remainder. Refund reversals or corrections change allowance only through a policy-defined, authoritative adjustment, never through a claimed failed status.

Reconcile external refunds too. Strict global limits require source-system enforcement or serialization of every refund path. Polling and webhooks alone cannot eliminate races with outside actors. Otherwise label the limit as covering Oxagen-admitted activity, include observed external exposure conservatively, and block when required history is incomplete.

#### Exceptions, gates, and product evidence

An `ExceptionGrant` binds the authorized approver, exact action/facts, named overridable threshold, maximum amount, scope, expiry, reason, and policy revision. It cannot waive an absolute prohibition or higher hard cap. Pending approval creates no right to dispatch. Any temporary hold remains explicit and expiring; after approval recheck facts, rights, policy, periods, and available capacity before acquiring or confirming all holds.

The trusted tool/connector service enforces these checks before the payment API call. Protect its credentials and block alternate refund routes. Model-call proxying does not enforce business-tool effects by itself. The app shows effective sources, used/held/remaining values, freshness, scope, and safe denial explanations. Save decision and settlement evidence in the org's configured store under the local data-protection rules.

### Required knowledge graph and source contract

The knowledge graph is a required discovery and relationship layer for code, business ontology, governance, context, and run evidence. Future business connectors add actual entity instances. Keep source authority explicit: VCS owns file/history facts; CRM and payment systems own their records; Oxagen owns approved policies, IAM records, and execution evidence. A graph projection does not acquire authority merely by copying a record. Separate authorization relationships from knowledge/provenance relationships logically, even if storage is shared. `derived_from`, `mentions`, or `caused_by` must never imply `can_read` or `can_invoke`.

Define the following records now:

| Record | Required content |
| --- | --- |
| `GraphEntity` / `GraphEntityRevision` | Org-scoped opaque ID, entity type, immutable revision, source authority and binding, exact source version, safe source reference, classification, source-permission dependencies, trust state, observed time, validity time, transformation references. |
| `GraphRelation` / `GraphRelationRevision` | Org-scoped ID; exact endpoint revisions; typed relationship; provenance and evidence; proposed, inferred, or verified status; independent field/edge access restrictions. |
| `GraphProjectionState` | Source binding, requested and applied source versions, checkpoint, sync state, observation time, safe error code, policy/access epoch, deletion state. |
| `OntologyRevision` | Versioned entity/relationship definitions, source-field mappings, validation rules, ownership, and approved migration plan. |
| `BusinessActionCorrelation` | Run/trace, governed action and execution-attempt IDs; decision/policy references; applicable approval; trusted connector binding and receipt; source-native record identity/version; correlation provenance and status. |

IDs are scoped by org and source installation. A provider record ID alone is not globally unique. Preserve source-native identity inside permissioned bindings rather than exposing it in public URLs. Code entities bind repository identity, commit, path, and symbol identity; retain rename/move lineage without claiming symbols have universally stable identifiers. Context records bind authoritative revisions and any sanitized derivative separately. An unavailable source version remains unavailable, not silently replaced with current content.

### Projection, access, and retrieval

Use durable change events plus reconciliation to update projections. Make consumers idempotent; order updates within each source, reject stale overwrite, and represent deletes/revocations with tombstones and access barriers. A projection checkpoint describes its observed source state, not a global atomic snapshot across unrelated systems. Branches and forks retain their selected source revisions. Enforce deletion and access changes across graph stores, embeddings, caches, search indexes, and derived results.

Oxagen MCP discovery uses the Context Gateway and graph. Authorize the query, search permitted scope, check nodes/edges/properties and derived results, dereference allowed source versions, then apply final disclosure/export checks. Reuse the existing ARP–CGP binding for returned frames and retrieval/composition receipts; do not invent a replacement CGP wire protocol. The graph store API remains an Oxagen internal contract, while CGP exchanges selected context.

Use the same human/agent IAM principal, RBAC grants, resource permissions, purpose, destination, and authorization epoch throughout. Org/workspace row-level security provides a database floor where applicable; graph traversals and non-SQL indexes still need explicit scope enforcement. Protect counts, existence, path explanations, and edge properties. Derived access is no broader than the allowed intersection of its sources. Filter within the trusted boundary before external embeddings, ranking, or models see data. Recheck before response delivery; a cached graph path is not a reusable access grant.

Only allowed sanitized derivatives enter the graph. Local protection precedes network export, indexing, telemetry, and remote buffering. Node labels, source references, fingerprints, diagnostic fields, and correlation metadata must not carry prohibited originals. Use opaque local receipt references when raw-content hashes would disclose protected content. Retain transformation provenance without claiming raw replay or preserving a signature over changed bytes.

Policy discovery and policy enforcement remain separate. The action gate loads current approved policy revisions and authoritative business facts. It may use verified graph references to locate them, but never stale projections or inferred links as authorization. Fail closed if required current facts cannot be established.

### Future business evidence

Future connectors ingest actual `Refund`, `Order`, and `Customer` instances under approved ontology mappings. Link exact run/trace and tool attempt → evaluated policy revision and decision → required human approval → connector execution receipt → source-confirmed refund → order/customer. Link policy revisions to relevant files, code symbols, tools, context, tests, and evidence with a stated relation and trust level.

Correlation requires a trusted connector-returned source identity or verified source event joined to a recorded idempotency/correlation key. Agent assertions and approximate amount/time matching remain unverified proposals. Track requested, pending, failed, and confirmed states per attempt; a tool's success text alone does not prove an external refund. Reconcile later provider updates, including reversal or cancellation, as new evidence. Preserve the policy evaluated when execution occurred and the separate current policy.

Scope now: mandatory graph/discovery contracts, stable identifiers, version/provenance records, access enforcement, safe projection events, and correlation slots. Future scope: business connector implementations, ontology-instance ingestion, business reconciliation workflows, and outcome analysis screens. Test org isolation, denied edges/counts, stale-policy rejection, projection lag, duplicate/out-of-order events, revoked sources, forged correlations, and sanitized-only indexing before claiming support.

### Desktop gateway and local data protection profile

Status: proposed architecture. `GovernedAction` names a checked execution. Its authorization is a short-lived, single-use decision bound to the final cleaned request. `WorkOrder` names the assignment and its limits. This contract does not build an app or a scanner.

**Components and trust boundary**

`DesktopUI` signs people in, selects an enrolled workspace, and displays safe status. `DesktopGatewayService` runs independently under a protected service identity. It holds a hardware-backed device key where supported, authenticates local IPC, validates callers and workspace/run bindings, verifies signed policy and update packages, and operates bounded scanners. Agent-controlled processes cannot change its code, rules, identity, or network enforcement.

Enrollment issues a revocable device identity and connects the device to an org, permitted workspaces, human principal, and agent runtime. IAM authorizes enrollment and every operation. The UI is not the root of authority. Signed updates require approved publisher identity, version policy, staged rollout, and an atomic rollback or closed state. Disable remote error-upload defaults in service dependencies.

The adapter integrates turn boundaries and tool dispatch. The Supervisor enforces process, file, credential, and network controls. Provider traffic must pass through the local gateway and the org's model proxy. Block alternate HTTPS routes, child processes, direct uploads, other proxies, uncontrolled native tools, and unrelated credential sources. Certify this claim per platform and harness version. A host administrator outside the managed boundary can defeat it; do not imply otherwise.

**Data path and order**

1. Resolve org/workspace/run/principal identity from trusted enrollment and IAM state.
2. Read the signed `DataProtectionPolicy` revision. Missing, stale, unverified, or incomplete policy denies egress.
3. Accept raw local content into bounded memory. The first outbound boundary is the local scanner, including any Oxagen API submission or telemetry path.
4. Parse and classify each field and attachment locally. Apply block, redact, or safe replacement. Check the transformed result again.
5. Compose the complete provider request locally, including authorized history, system context, memory, tool schemas, steering, files, and remote context. Scan the assembled request and the final serialized fields. Gateway-added prompt content must return to this check. A transport credential is provided separately by the trusted proxy and never becomes model-visible content or evidence.
6. Produce an immutable `SanitizedRequest` and cleaned artifact references. Count tokens, resolve price bounds, reserve budget, and create the GovernedAction authorization from those exact bytes and references.
7. Record the sanitized evidence and consume the authorization atomically at the dispatch gate. Send only this approved request to the org proxy, then provider. No component may change model-visible content after this point without a new check and authorization.
8. Apply local outbound checks again before publishing tool output, inbound response excerpts, reports, diffs, or plugin messages. Later content is a new disclosure, not covered by an earlier prompt scan.

If browser-originated work can contain raw sensitive data, the browser must use an authenticated local bridge or an approved local preflight before submitting content to Oxagen. A raw POST to the web app cannot later be described as locally protected before egress. Use a companion-paired bridge with caller authentication, allowed browser origins, CSRF defenses, and a narrow API; being on loopback is not authentication. Disable raw form submission, autosave, upload, session replay, and analytics before this route exists. Do not rely on the user remembering to preclean an ordinary cloud form.

**Policy and transformations**

`DataProtectionPolicy` contains policy ID/revision, org/workspace, principal/run applicability, effective and expiry times, classification rules, local detector versions, action per finding, allowed formats, parsing limits, replacement rules, retention controls, and signature. A workspace can narrow inherited rules, not remove a required organization restriction. An urgent revision closes affected admissions and invalidates stale pending authorizations.

`SanitizationResult` contains outcome, scanner/policy revisions, safe finding codes and counts, transformed field references, coverage status, and timestamps. Omit matched text, raw offsets if revealing, raw names, raw content digests, scanner excerpts, and unsanitized exceptions. Hash only cleaned bytes for evidence. Keep any replacement map local and transient by default; use workspace/run-scoped non-meaningful identifiers and never upload a raw lookup map.

Preserve valid JSON, multipart, message role boundaries, and tool-call structure. Do not use string substitution that can alter a tool target, argument meaning, or signed provider envelope without a fresh semantic and authorization check. If required provider signatures or opaque blocks cannot survive safe editing, block the entire request or use an approved alternate workflow. Always revalidate the output schema. A tool's permission to act does not allow exporting its raw results. Verify signed context responses locally, then create a sanitized derivative and a safe verification receipt. Do not claim the changed payload retains the original signature or upload the original/raw digest to prove it.

**Files, cached content, and streams**

Scan every included field, including URLs, filename and path metadata, schema descriptions, MIME attributes, and structured values. Resolve local file references using stable handles and approved workspace scope; reject symlink/path races and file changes between scan and use. Dispatch immutable cleaned copies, not reopened raw paths.

Use sandboxed local parsers and local OCR. Bound bytes, pages, nesting, decompression ratio, output size, memory, CPU, and elapsed time. Archives require complete member coverage within these bounds. Unknown formats, encrypted files, parse failure, unsupported image/audio/video content, active content, incomplete coverage, or detector failure deny by default. Password-assisted unpacking can occur only locally through a protected approved flow, followed by complete scanning. No cloud OCR, remote scanning API, or model-assisted remote detector receives raw input. Detection remains fallible; supported coverage is not proof that a file contains no sensitive information.

A `CleanArtifact` binds cleaned bytes, org/workspace, policy/scanner versions, scope, and immutable artifact identity. Create provider file uploads and prompt caches exclusively from these artifacts. Provider IDs are scoped handles, not proof of safety. Reject unproven IDs, raw external upload handles, and stale handles invalidated by new policy. A changed policy may require recheck and regeneration before reuse.

Full-message buffering is the default for outgoing content. A bounded streaming mode requires a supported parser and a rule set proving that already released bytes cannot become a later match. Chunk-by-chunk scanning without cross-boundary protection is forbidden. Cancellation clears raw buffers and leaves only safe status. Metadata sent before body approval must itself pass checks.

**Storage and isolation**

Default: no new raw gateway copies or unmanaged harness transcript persistence. Original source files remain in their existing local repo; scanning neither edits them nor quietly archives copies. No raw content in traces, logs, crash/heap dumps, diagnostic bundles, temporary files, spool queues, model usage probes, hashes, or sync. Disable raw diagnostic capture and use safe structured errors. Control swap/hibernation and crash settings as the platform profile requires; if the profile cannot ensure the stated protection, reject that strict profile or disclose its bounded memory-exposure limit. Never claim guaranteed secure erasure from ordinary process memory.

Optional quarantine is explicit, local-only, encrypted under separate keys, scoped by IAM, time-limited, and excluded from sync and automatic diagnostics. Off by default. Record safe access events. Raw diagnostic exports are a distinct exceptional operation, never an implied consequence of enabling telemetry.

Separate workspace queues, keys, caches, replacement state, parser jobs, and artifacts. Recheck the authenticated scope at dispatch. A blocked request can emit a safe decision event, never the original payload. Persist cleaned evidence in the org's configured data plane; no public-cloud fallback for private-store failure. This covers VCS diffs, paths, work reports, and portable snapshots. Mark sanitization gaps and reduced replay fidelity; required reporting does not authorize exporting raw source. Gateway-held authentication secrets are used only in authorized transport/connector paths and are excluded from content scans' diagnostic output and all evidence.



The org proxy must not persist an unscanned model response in a remote log or trace. Relay it through bounded transient buffers to the enrolled local gateway for the required scan. Commit only the cleaned response and safe usage metadata to remote evidence before dependent execution. If that path is unavailable, hold or stop delivery under the capture rules. This requirement includes provider errors and streamed replies; raw debug capture must remain disabled. The customer controls provider-side retention separately; local filtering cannot erase information already held by an external provider.



**Proof of local inspection.** A signed `ScanReceipt` binds the enrolled gateway identity, trusted workspace/run scope, policy and detector revisions, complete-coverage status, final cleaned request digest, immutable cleaned artifact references, destination, and expiry. The org proxy requires a current receipt from an authorized gateway and checks it against the received request. A caller-supplied `scanned: true` flag is never proof. Reusing a receipt for changed bytes or a new unauthorized scope fails. Signature validity proves the named scanner reported the result, not that detection is infallible. Device management and platform checks establish the trusted scanner boundary. No raw content digest enters this receipt.

**Desktop lifecycle.** Certify macOS, Windows, and Linux builds separately. A required-platform capability failure prevents strict launch. Remote/headless runners install the equivalent protected gateway on the data's host. Enrollment, workspace selection, repo binding, target registration, data-rule preview, access requests, health, and signed updates are required UI/API flows. The local preview never uploads its original. Leaving a workspace revokes local grants and clears scoped transient state. Service failure leaves egress closed; recovery reconciles prior sends. Managed uninstall stops or isolates governed work before removing controls. An offline status cannot prove a confirmed pause.

**Required tests**

Test secrets across chunks, fields, encodings, filenames, tool schemas, history, OCR, and nested archives. Test encrypted/unknown formats and parser limits. Test guessed provider file/cache IDs, raw uploads, changed files after scan, symlink swaps, policy expiry/revocation, cross-workspace cache reuse, retries, blocked direct network paths, and background calls. Inject failures into scanners, telemetry, logging, crashes, pool reuse, sync, and dispatch. Capture all test egress and inspect persisted records to prove that planted raw markers never leave. Verify budget and authorization bind final cleaned bytes. Test exact sanitized replay and explicit original-input gaps.

### Shared IAM, model gateway, and row security

**One permission contract.** `Principal` is a first-class org-bound record with human, agent, and service types. Each has a stable ID, lifecycle state, owner where applicable, roles, record grants, and revocation history. Agent identity, persona ID/name/revision, agent release, active mode, runtime identity, accountable operator, and delegation chain are separate fields. A persona label or caller-supplied org field is not identity proof.

One authorization service owns the canonical grants and decision contract. The web app, public API, model/tool/context gates, local brokers, plugin seam, background workers, and record service all use it. RBAC provides scoped roles. Record grants and relationships narrow the resources a principal can reach. A delegated action cannot exceed the delegator's grant or the agent definition. Agents do not inherit all operator rights. Service agents need an explicit owner and service grant; they need not depend on a human browser session. Revocation invalidates grants and dependent delegations under a recorded rule.

OpenFGA can evaluate role and record relationships; OPA evaluates rules using trusted facts. These are internal parts of the same customer-facing permission system. An allow from either cannot override a denial from the other. Work-order constraints, active tool belt, current run state, required conditions, data-export rules, and budget reservations also apply. Stateful services reserve funds and consume approvals; a rule-engine result cannot do either. [OpenFGA roles and permissions](https://openfga.dev/docs/modeling/roles-and-permissions), [OPA policy decisions](https://www.openpolicyagent.org/docs/philosophy)

Every decision records principal, delegation, action, resource, purpose, scope, granted view, model/policy revisions, current access epoch, reason codes, and expiry. `GovernedAction` names the logical operation. `ActionAuthorization` approves one exact attempt, not every future use of a tool. Recheck current authority at disclosure or dispatch. Retain the same protections for human actions, services, and agents. Bulk operations must not reveal inaccessible records through counts or errors.

**Real gateway path.** In strict mode the complete, locally inspected provider request passes through the Oxagen model proxy for every governed model call. This includes retries, child agents, summaries, title generation, embeddings, and other background model work. Provider-internal execution is not claimed as visible; admit only features whose access and maximum cost can be bounded. Disable provider-hosted tools that cannot be checked before each action.

The required desktop service assembles and scans the request before remote transmission. The org gateway verifies that exact cleaned request, current authority, destination, and budget; persists permitted evidence; consumes the approval once; and dispatches using broker-held credentials. Org deployment determines whether that proxy is in SaaS or the customer's private network. Routing must not add content after local inspection. If new content, fields, file bytes, or tool results are introduced, assemble and inspect again locally before release. Safe sign-in headers are added only by the trusted connector and excluded from content records.

Adapters and hooks translate harness events, steering, tool menus, context, and pause boundaries. A before-tool hook enforces a gate only if it covers the path and the governed workload cannot bypass it. After-action hooks only observe. A protected service, sandbox, and network controls block alternate model routes, native tools, other MCP servers, child processes, and credential theft. The app window is not this security boundary. Certify harness/version/feature combinations; an opaque or bypassable route cannot claim strict support. Enforcement on an unmanaged host does not constrain a hostile host administrator.

**RLS and org isolation.** Enable PostgreSQL RLS and `FORCE ROW LEVEL SECURITY` on org-owned tables. Use a non-owner runtime role without superuser, `BYPASSRLS`, or permission to assume such roles. Keep migration and emergency identities separate and audited. `FORCE` does not stop superusers or `BYPASSRLS` roles. Withhold whole-table privileges such as `TRUNCATE` from normal services. [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

Resolve org, workspace, principal, and request scope from authenticated server state. Missing scope denies. Set that scope transaction-locally on every pooled connection, including background work. Test commit, rollback, savepoint, error, reconnect, and pool reuse. Do not give agents arbitrary SQL through the application database role: callers able to change session variables can defeat a naïve org-variable check. [PostgreSQL transaction-local settings](https://www.postgresql.org/docs/current/sql-set.html)

Use `USING` for existing rows and `WITH CHECK` for inserted or changed rows. The org constraint must remain mandatory when policies compose. PostgreSQL combines permissive policies with OR and restrictive policies with AND; test the full policy set. Prevent org changes and unauthorized workspace moves. Use org-aware joins and foreign keys. Put shared catalogs in deliberately separate tables. [PostgreSQL policy rules](https://www.postgresql.org/docs/current/sql-createpolicy.html)

Use caller-rights views where intended and review privileged functions, triggers, and export paths. A view owned by a stronger role must not silently bypass expected scope. [PostgreSQL view security](https://www.postgresql.org/docs/current/sql-createview.html)

RLS provides an org/workspace floor. Fine-grained record and purpose checks remain in the shared authorization service and its trusted query filters; an org predicate is not a full OPA policy implementation. The browser uses checked data APIs. It has no privileged database session. Background jobs use scoped service principals; split cross-org work into separate authorized tasks. CI ingestion derives scope from a verified connector installation and repository binding, not a workspace value in an event payload.

Apply equivalent checks to object storage, signed links, search/vector indexes, caches, queues, reports, backups, and exports. These are not covered by database RLS. The org's configured data plane enforces the same contract in SaaS, hybrid, and private placements. The web app reads the same authorized records used by report writers.

Required tests include human and agent cross-org reads/writes, a permitted tool touching a forbidden record, scope leakage across pooled connections, privileged views, stale grants, forged webhooks, unchecked native tools, direct model egress, and a request changed after local scanning.

### Agent tool policy and one shared MCP endpoint

This is a proposed Oxagen profile. These record fields are not new fields required by MCP.

`AgentDefinition.tool_policy` owns the tool ceiling. It contains `default: deny`, explicit allowed `ToolBinding` references, and explicit deny selectors. Each allow resolves to a reviewed revision. A deny names a stable tool ID and covers every revision by default. A revision-specific deny must say so explicitly. Publishing a new revision cannot evade a tool-wide deny. Each approved mode has an explicit allowed subset and may add denies. Missing or unknown modes fail closed. Changing the definition requires the rights to publish a release. Changing modes requires a separate authorized control command.

Resolve the effective set as follows. A missing required grant is an empty set, not unrestricted access.

```text
effective_tools =
  definition_allow
  ∩ mode_allow
  ∩ workspace_allow
  ∩ operator_delegation_allow
  ∩ run_grant_allow
  ∩ current_policy_allow
  − all_applicable_denies
```

The set authorizes possible use, not every argument or target. Record access, purpose, approvals, cost, input rules, and run state are checked at dispatch. A tool cannot grant itself permissions by changing its annotations. A prompt, skill, context provider, or future plugin cannot add tools to this set. A plugin may request a change through a separately granted admin operation.

Example definition fragment:

```yaml
agent_id: support_agent
definition_revision: "7"
tool_policy:
  default: deny
  allow:
    - tool_id: customer_lookup
      revision: "3"
  deny:
    - tool_id: customer_refund
      revisions: all
modes:
  read:
    allow:
      - tool_id: customer_lookup
        revision: "3"
    deny: []
```

The catalog maps `customer_lookup@3` to the reviewed MCP name `lookup_customer`, its schema, and its route. A display name cannot establish identity. The binding also records the publisher, org/workspace scope, implementation digest or approved deployment revision, effects, resource constraints, credentials, and retry rules. Registering a replacement implementation requires a reviewed revision. Explicit assignment of a third-party or native binding does not bypass its required enforcement gate.

`RunContextBinding` binds the authenticated organization, workspace, operator, agent release, mode, runtime key, run, and authority epoch. A short-lived, audience-bound grant refers to it. The gateway verifies that binding on every request. Neither a tool argument nor a client-selected header is proof of scope. Keep the grant outside agent-readable memory where the enforced adapter supports that boundary. Never include bearer tokens in evidence.

One logical MCP service can provide all authorized views. MCP 2026-07-28 allows request-authorization-specific lists, rather than connection-specific identities. Oxagen's catalog and IAM records determine its additional agent/workspace constraints. [MCP tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)

`tools/list` exposes only the allowed, discoverable tools that Oxagen serves through its catalog. Customer implementations may execute in a private network through a scoped connector. This is governance of the tool route, not a claim to own the customer's code. Native tools that remain native are tracked in the same belt but need not be served by Oxagen's MCP endpoint. Their authorized schemas must still be reconciled against the actual model request.

`tools/call` MUST resolve a stable binding and run a fresh decision before dispatch. Do not trust that the client called `tools/list` first. Reject hidden, unassigned, revoked, stale-version, and mismapped tools before any effect. Return a safe denial without disclosing hidden tool details, while storing the full authorized audit reason. Keep caller-to-Oxagen and Oxagen-to-backend credentials separate. [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)

The trusted adapter links each proposal to the tool schema and binding revisions shown in its originating model request. Single-use approvals bind those revisions and the exact request. A tool name must not silently move to a new implementation between proposal and dispatch. The Oxagen binding travels as trusted adapter metadata, not model-editable tool arguments. Clients unable to prove that binding must refresh or stop under the strict profile.

`ToolBeltSnapshot` records the context binding, policy and grant revisions, tool binding revisions, visible schema digest, MCP profile, adapter projection, and activation state. Evidence links discovery, the exact model menu, proposals, denials, dispatch, and results to that snapshot. It stores no live approval or credential. Forks recompute their tool belts with fresh grants.

Filtered catalogs use `cacheScope: private`. Scope cached pages by authorization context and catalog revision. Bind opaque page cursors to that same context, expire them, and restart listing if a revision changed. Change notices refresh discovery, while the call gate remains authoritative. These are Oxagen's consistency checks on top of MCP's cache rules. [MCP caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)

Pin and test supported MCP profiles. Use the 2026-07-28 fields and subscription flow only with clients that support them. The 2025-11-25 adapter must use its own response and notification forms. Separate authenticated client instances may be needed when a harness stores only one credential per configured MCP server. They may all target one endpoint. Do not share an owner credential to work around that limit.

Tool policy applies to all execution paths. Use a protected pre-dispatch check for native tools, an enforcing proxy or disabled route for third-party MCP servers, and per-action mediation or disabled access for provider-hosted tools. Child agents need separately narrowed grants. Unknown mappings and unguarded routes MUST be denied in strict mode. An allowed general shell or network tool cannot retain credentials or routes that bypass a protected operation's policy.

A revocation must come from an authorized policy change. A mode-change command must pass caller authorization and the expected run-version check before it can close any gate. Then fence dispatch on old authority and reject queued or unsent work using old single-use approvals. Commit the new binding and epoch, compile and verify the new menu, then reopen eligible gates. Account for already dispatched work under the confirmed-pause rules when necessary. Refresh or rebuild clients that retain stale tools. Rebuild context if previously visible schemas are now confidential. A lost notice never restores permission.

A rights or mode change that affects a completion candidate invalidates that candidate's old plugin decisions. Future plugins use the same enforcement rules under their own scoped identities and grants. Their independent tool rights do not come from the supervised agent. A helper agent has its own approved definition and a grant narrowed from its issuer’s delegation rights. A plugin cannot expand the supervised agent’s tool belt through a control or context request. This does not add a built-in verifier or a real plugin to the present scope.

The web app distinguishes a draft change, a published version, and enforcement per target. A target is active on the new policy only after it acknowledges its gate and menu state. Pending or offline targets stay blocked from new strict work until they can sync. Work already dispatched before the fence cannot be retroactively prevented.

Proposed operations are `tool.register`, `toolbelt.resolve`, `toolbelt.status`, and `run.mode.change`. Mode changes use a duplicate-prevention key, expected run version, explicit target mode, and a durable operation result. Events include `toolbelt.resolved`, `toolbelt.activated`, `tool.call_denied`, and `run.mode_changed`. Internal denial reasons include `TOOL_NOT_ALLOWED`, `TOOL_BINDING_UNKNOWN`, `TOOLBELT_STALE`, and `MODE_NOT_GRANTED`.

Required tests include two agents and two workspaces sharing one endpoint; private list-page isolation; stale and guessed calls; forged mode or workspace claims; deny-overrides-allow; schema/route replacement; dropped change notices; native and third-party tools; direct API bypass; and adapters that cannot safely refresh or intercept. A customer-hosted custom tool must pass the same tests before claiming strict support.

### Governed action and approval fields

A `GovernedAction` records one logical operation and its attempts. Each `ActionAuthorization` is a single-use approval. It binds org, logical agent, runtime key, run, branch, action, attempt, audience or receiving service, exact request digest, tool or connector version, resource constraints, policy revision, context revision, authority epoch, expiry, and consumption limit. Live single-use approvals are excluded from portable save bundles.

### Commands, events, and ordering

A command asks for work. An event states a committed fact. Keep acceptance separate from completion. Every changing command needs a duplicate-prevention key, expected version, verified caller, and typed result. Messages may arrive more than once, so receivers deduplicate them. Do not claim exactly-once transport.

Events include identity, run and branch, action and attempt, producer sequence, commit sequence, causal parent links, access and policy versions, context version, payload reference and fingerprint, trust level, source time, arrival time, schema, privacy rules, signing key, and integrity data. Verify caller fields during ingestion.

Each run needs ordered control decisions. Producers also keep their own sequence numbers and links to causes. A distributed save needs a frontier across those streams. Database commit order is not proof of real-world time among concurrent events. [Lamport event ordering](https://lamport.azurewebsites.net/pubs/time-clocks.pdf)

Events are append-only. Corrections point to older evidence. Reject reused IDs with different content. Make gaps explicit. Save required artifacts before events that consume them, or block consumption while artifacts are pending. A producer signs its observation. The receiving service separately signs acceptance data that did not exist earlier.

Use a language-neutral schema with JSON Schema/OpenAPI and Protobuf bindings. Choose one canonical JSON form for fingerprints and signatures. If using JCS, follow its number limits, use decimal strings for large counters, and declare time and money units. Protobuf bytes alone are not a universal canonical form. [JSON canonicalization](https://www.rfc-editor.org/info/rfc8785/)

Suggested paths are HTTPS/JSON for control, resumable SSE for events, two-way gRPC for supervisors, and protected local sockets for SDKs. Check local peer identity. Use mutually authenticated service connections and tokens valid for the intended service.

### Proposed operation families

| Family | Operation names |
|---|---|
| Capabilities | `capabilities.negotiate`, `adapter.attest` |
| Agent setup | `agent.resolve`, `release.publish`, `projection.compile`, `projection.verify` |
| Tool belts | `tool.register`, `toolbelt.resolve`, `toolbelt.status`, `run.mode.change` |
| Work dispatch | `target.register`, `target.list`, `target.revoke`, `work.submit`, `work.status`, `work.cancel` |
| Work orders | `work_order.publish`, `work_order.assign`, `work_order.status`, `work_order.revoke` |
| Runs | `run.create`, `turn.start`, `run.pause`, `run.pause_status`, `run.resume`, `run.cancel`, `run.stop`, `run.force_continue` |
| Actions | `action.propose`, `action.authorize`, `action.dispatch`, `action.reconcile` |
| Steering | `steering.submit`, `steering.status`, `context.resolve` |
| Access | `access.request`, `access.approve`, `access.revoke` |
| Memory | `memory.query`, `memory.propose`, `memory.promote`, `memory.revoke` |
| Work reports | `work_report.ingest`, `work_report.refresh`, `work_report.get`, `work_report.subscribe` |
| Evidence | `events.append`, `events.subscribe`, `artifact.put`, `artifact.get`, `response.adopt` |
| Saves and moves | `checkpoint.prepare`, `checkpoint.commit`, `fork.plan`, `fork.create`, `migration.commit` |
| Plugin seam | `plugin.capabilities`, `plugin.events.subscribe`, `plugin.events.ack`, `plugin.decision.submit`, `plugin.context.offer`, `plugin.job.request` |
| Completion | `turn.completion.propose`, `turn.completion.status`, `run.completion.propose`, `run.completion.status` |
| Holds | `hold.release`, `hold.override` |

Only trusted supervisors and gateways may assert authoritative execution receipts. Retain client-reported observations with their lower trust level.

Capability checks cover protocol versions, app surface, routing, tool interception, steering, capture, native state, snapshots, isolation, and required extensions. Reject unknown required capabilities. Unknown noncritical evidence may be kept unchanged. Mark security extensions as critical.

Error names include `TOOL_NOT_ALLOWED`, `TOOL_BINDING_UNKNOWN`, `TOOLBELT_STALE`, `MODE_NOT_GRANTED`, `POLICY_DENIED`, `APPROVAL_REQUIRED`, `STALE_EPOCH`, `REVISION_CONFLICT`, `CAPABILITY_UNSUPPORTED`, `CAPTURE_INCOMPLETE`, `UNSAFE_CHECKPOINT`, `OUTCOME_UNKNOWN`, `CONTEXT_UNAVAILABLE`, and `BUDGET_EXCEEDED`, `PLUGIN_GRANT_REVOKED`, `COMPLETION_STALE`, and `REQUIRED_SEAT_UNRESOLVED`. Each reply should say whether retry is safe and what can happen next.

An **epoch** is the access version used to reject old authority. Exact state names include `run.pause_confirmed`, `response.late_observed`, `response.adopt`, and `response.adopted`. Late evidence remains tied to the old epoch. Adoption never changes the old pause boundary.

The ARP-to-CGP profile carries provider and schema versions, query and response references, run/turn/request IDs, frame IDs and fingerprints, source revisions, consent, access decisions, transformations, and final prompt spans. Put identity in verified transport or an agreed extension. A caller-supplied company ID is not proof of authority. CGP's content unit is `ceil(UTF8 bytes / 4)` and is separate from model token accounting.
