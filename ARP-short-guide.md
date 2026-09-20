# Oxagen and ARP: the short guide

**Agent work, access, rules, and spend in one web app.**

This is a design plan. It still needs to be built and tested.

## Start with the names

An **AI agent** is a software helper that can read files, change code, and run checks toward a goal.

Codex and Claude Code are apps where people use these helpers. Such an app is called a **harness**. A **model** is the AI service the app asks for its next answer.

An **operator** is a person who runs agents. **Oxagen** is mission control for operators and the human supervisors who oversee them. Its web app is the main hub. Its **control plane** sets rules and assigns work. Its **gateway** checks requests before they go through. Together, they control tools, context, access, and spend.

**Agent Run Protocol (ARP)** is a shared format for that record. Other apps can use it to pick up work from a saved point.

## Policies set the rules

**Policies** are rules that apply across jobs. Each agent has **Permissions & limits**. Permissions say which actions it may take. Limits set bounds, such as how much it may spend.

A team gives each agent one main definition in Oxagen. It sets the agent's ID, files, budget, and lists of allowed and denied tools. Tools are denied unless allowed. A deny always wins.

Oxagen binds the active agent ID and its approved role or mode to the workspace. A role describes the job the agent plays. The agent cannot gain rights by claiming a new role.

These rules follow the agent into each supported app. Switching from Codex to Claude Code does not grant more access.

Each job has a **work order**: a saved assignment with a goal, scope, access, tools, context, rules, and spending limit. It also states when those rights expire. Context is the information the agent receives. The agent's own limits and workspace rules still apply. Oxagen enforces these terms as work runs. A prompt alone cannot do that.

The work order covers the job. A **governed action** is one exact request checked against those limits before it runs. Oxagen applies the rules automatically. A person need not approve every call. A changed request or retry needs a fresh check.

Jobs that keep running have review points. They need not claim the whole job is done at each review.

Oxagen also holds agent skills, which are guides for doing jobs. Saved knowledge has a source and access rules. A team can require review before an agent's new note becomes shared knowledge.

## A team fixes a bug

Maya owns a workspace for a small software team. A workspace groups their projects, agents, and rules. Two agents use Codex, and one uses Claude Code. Each works on a local copy of the team's code.

Maya connects those agents through the Oxagen desktop gateway. It has a user interface and a protected guard that runs in the background. This **local Supervisor** is software. A **human supervisor** is a person who oversees the people using agents.

When an agent wants an AI answer or wants to use a tool, Oxagen checks its access, rules, and cost. If allowed, the request runs and its result is saved. If denied, the agent gets the reason.

## Put every model call through the gateway

In strict mode, every local harness call must pass through the desktop gateway. Every model call goes through Oxagen, including child agents and background calls. The guard checks local tools before they run. It sends allowed model requests onward.

Hooks and adapters connect an app to Oxagen for steering and context. Hooks are built-in points where an app can call other code. The protected local guard, network rules, and control of secret keys prevent bypass. An app with hidden or unchecked paths cannot claim strict control.

## Check data before it leaves the computer

The **Policies → Data protection** screen sets each workspace's rules. A local scanner follows them. It checks the full outgoing request: the prompt, files, chat history, tool results, context, and extra fields the user may not see. The check happens before any of that data leaves the machine. Web-app text and files also use the paired desktop scanner before upload.

The scanner may block the request, remove private text, or replace it with safe text. Only the cleaned request goes to the model and Oxagen's records. Removed content must not leak into cloud logs, usage records, or hashes, which are content fingerprints.

The final request sent must match the exact cleaned request that was checked and recorded. Any later content change needs another local check. A cloud service cannot add new context after that check and send it on unchecked.

No scanner finds every secret perfectly. Each workspace needs clear rules and tests. Strict mode blocks content or paths it cannot inspect or judge safely.

![Raw prompt text, full history, tool inputs and results, tool schemas, files, images, attachments, URLs, and request headers enter the protected local desktop gateway. The service is separate from the app UI and protected from the controlled agent. The workspace scanner checks the full assembled outgoing request and every required attachment. Workspace rules may block the send, redact content, or replace sensitive values. If required content cannot be checked, the send is blocked. The blocked path does not upload raw content or raw evidence. The allowed path carries only the cleaned full request and a minimal ScanReceipt without raw text. This receipt binds the exact cleaned request digest and workspace scan-policy version. The org gateway checks the receipt and blocks missing, stale, or mismatched receipts. Changed requests are rechecked under current access and policy. Only this cleaned form reaches the org gateway, approved model or tool, and sanitized Oxagen evidence records. The same path applies to outgoing reports and telemetry. No raw request, raw evidence, or replacement mapping may take a separate cloud path.](diagrams/data_protection.svg)

*A protected desktop gateway scans the full assembled request under workspace rules. It may block, redact, or replace content. Only the cleaned form can reach org gateways, approved models, or Oxagen records. The app UI and harness cannot use a raw-to-cloud route.*

![A human operator or human team lead uses the Oxagen web app to choose a workspace and approved targets, dispatch work, steer runs, track spend and progress, and set work orders and context access. Durable routing saves each request, checks the right to start or steer, and creates a distinct run for each selected target when starting new work. Registered Codex, Claude Code, and custom harness targets each have a protected run guard. A protected desktop gateway scans full outgoing requests under workspace rules before remote egress. All model, tool, and context requests pass through mandatory gates that check record access, policies, work orders, and budgets. Only cleaned results and evidence reach Oxagen records and the web app. Sending work to several targets does not mean sending every target the same write. Shared writes still need their own checks.](diagrams/overview.svg)

*Proposed architecture. People set work orders and context access in the Oxagen web app, select approved workspace targets, and send each one its own work. Protected local gateways scan outgoing data before remote request gates. Only cleaned results and evidence reach the web app.*

## Run the team from the web app

With the right access, Maya can send a request to any supported agent app registered in her workspace. She can start new work, follow a task in progress, or steer it. One request can reach selected agents or all of them. Each target gets its own status.

Maya clicks **Steer** and writes, “Focus on the login bug. Leave the payment code alone.” Oxagen sends the message to all matching agents in her workspace.

Without **Interrupt**, work already allowed can finish. When that step ends, Oxagen adds the message before allowing another step. It need not wait for a new user turn.

With **Interrupt**, Oxagen blocks new work and asks current work to stop. It shows **pausing** until it proves a safe stop point. A write with an unknown result can delay that proof.

The outside AI service may still finish its old request. A late answer stays in the record. It cannot quietly become input when work starts again. Using it needs a fresh check and a clear choice to adopt it.

An offline agent stays pending. “Applied” means the message reached a model request, not proof that the AI followed it.

## Give each agent its own toolbelt

The team can add tools such as `lookup_customer` and `process_refund`. **MCP** is a shared way for agents to call tools. One Oxagen MCP service address can serve many agents. It checks who is asking on each request.

That address lists only the tools in Oxagen's catalog that the agent may use. A support agent might see only customer lookup. A refund agent may see both tools. Customer-owned tools can still run inside the customer's network.

The list is a menu, not a lock. Oxagen checks access again on every call, including access to the customer record and refund amount. Guessing a hidden tool's name grants no rights.

A protected guard also checks tools built into the agent app and tools from other MCP servers. All obey the agent's allowed and denied tool lists. An unchecked path must be blocked or the app cannot claim strict control.

For example, a Bash tool runs shell commands. A matching deny rule can block its whole call before any part runs. A text rule alone cannot block every other way to cause the same effect. Changing folders does not remove workspace rules.

## Set shared limits on business actions

Policies can cover more than AI bills. A refund form could set these sample rules: up to 20% of an order, $100 per customer each day, and $5,000 for the whole workspace each day. These are examples, not defaults. The form states the currency, day, and what each total covers.

Every rule must pass. All agents share the workspace allowance. Adding an agent does not reset it. The trusted refund tool checks real order facts and holds the amount before it acts. Two agents cannot each claim the same money. An unknown result keeps its hold until checked.

A rule can block an action or ask a person for a permitted exception. An approval cannot remove an absolute ban. Agent settings show each limit and its source. Mission control shows what is left and why a request stopped. The model proxy alone cannot enforce refund rules; the tool and its access keys need guards too.

## Keep useful records without sharing every record

Oxagen saves cleaned copies of prompts, model requests, and tool inputs and outputs. It records where content was removed or cut short, without sending the removed text or its hash to cloud records. The log must show these limits on what was saved.

Web dashboards show spend, remaining limits, and useful work produced. They can show time, cost, and work that had to be redone. These measures help teams improve. Token counts and lines of code alone do not show how useful the work was. Advice links to evidence, with gaps and cuts marked.

## Give people and agents checked identities

People and agents each have a registered identity in Oxagen's access system, called **IAM**. Each is a **principal**, meaning an identity that can hold rights. The same checks cover both, for tools, context, memory, models, and records.

Access roles group rights, a method called **RBAC**. Each record and call still needs its own access check. An operator cannot pass rights they do not have to an agent. Child agents cannot gain more rights than their parent.

Access to a tool does not grant access to every file it can read. Permission to read a file may still forbid sending it to an outside AI service.

Oxagen holds secret access keys outside the agent. When more access is needed, the agent asks Oxagen. Stored records are encrypted, or locked with a secret key. Access keys are kept out of the work log.

## Save a work report for every run

Oxagen must save each report in the same customer-chosen store that feeds the web app. That store may stay inside the customer's private network. Reports pass the same local data checks before leaving the machine.

| Part | What the report saves |
|---|---|
| Code | Repo, working branch, changed files, and a diff, which shows changes against the workspace's chosen default branch. |
| Review | Pull request (PR) number and link. |
| Checks | Status of every CI job, which is an automatic code check. |
| Agent | Active persona name and ID. A persona is the agent's approved role. |
| Tools | Each distinct tool name, listed once, with its use count. |

Save the exact code versions used for the diff. Branch names alone can point to new code later. If a PR targets another branch, flag that mismatch; the report still uses the workspace default. Save new report versions as code or checks change. Show missing PRs and unknown check results as such. Never call them passed.

## Set money aside before spending

Maya gives an agent a $20 budget. Before each paid request, Oxagen sets aside enough to cover the most it could cost.

If only $2 remains, two agents cannot each claim that same $2. Operator and agent limits both apply. Retries and helper agents count too.

A hard cap needs a known upper cost. Without one, Oxagen must block the request or promise to cover any cost above a fixed price. Stopping a request does not erase costs it may have already caused.

## Find related facts through one graph

The **knowledge graph** is a required map of code, tools, rules, context, and evidence. Items are nodes. Links show how they relate. Oxagen's context service uses this map to find allowed sources. It checks the same permissions for people and agents, including each link and search result.

Code history stays in version control. A payment system keeps its own refund records. The graph links their exact versions and shows when its copy is old. Only cleaned content enters the graph. A stale link or an agent's guess cannot grant permission to act.

In a future phase, the graph can hold real business records too. An **ontology** defines types such as Customer, Order, and Refund. A trusted receipt can link an agent's action to its policy check, any human approval, and the real refund. This can explain why that refund happened. An agent saying “done” does not prove it.

Build the IDs, source links, version tracking, and access checks now. Actual business-data connectors and their result screens come later. These are planned features, not claims about today's product.

## Pick up work in another app

Maya can make a new branch of a run, called a **fork**. A fork starts from a safe saved step. Oxagen saves the allowed cleaned files, chat, rules, and work still pending. Removed data cannot be restored from that bundle. Another supported app can start from that point with fresh access checks.

The fork cannot copy private AI thoughts or promise the same next answer. It also cannot undo an email sent or a file changed in another system. The handoff shows what was kept and what could not transfer.

## Plugin controls in the turn loop

A **plugin** adds a job to Oxagen. A future plugin might check a fix with an **oracle**, a trusted expected answer. Others might ask a remote agent to write docs, add useful context, or send security alerts to Slack.

The workspace must grant each plugin a place in the run and set what it may see and do. With those rights, a plugin can ask to stop, pause, resume, or **force continue** through the same checked path as the local Supervisor.

Force continue means “keep working” when an agent proposes to finish. It cannot mark work done or skip access checks, rules, budgets, or a confirmed pause when one is required.

Required plugin checks hold the finish until their replies allow it, or a named person with the right access grants an override. Only Oxagen's core records the run as done.

The first release defines the plugin rules and leaves a small placeholder. Real plugins, a built-in service to check fixes, and a plugin store are outside that scope. A future store would be hosted by Oxagen.

![Possible future plugins include remote documentation, allowed context, Slack notices, and a witness with an oracle. They send stop, pause, resume, or force continue requests to the same shared control interface used by the Supervisor. The core checks identity, permissions, policy, budgets, and pause proof, then orders allowed requests through the Supervisor and gates. When a turn asks to end, Oxagen freezes its version. Subscribed plugin seats vote ready, hold, continue, or abstain. Required seats that are missing, in error, or not ready keep completion waiting unless a named, authorized waiver clears that seat. Each required seat needs a ready vote or a named, authorized waiver for the exact turn version. Core checks must still hold before the core alone commits completion. This is not a majority vote. No partner plugin is implemented in this phase.](diagrams/plugins.svg)

*Oxagen capability stub only. No partner plugin is being built in this phase. Future plugins use checked control requests and can hold turn completion when given a required seat.*

## Choose where the system runs

Oxagen can run as an online service with protected spaces for each customer. A team can also keep the work and private records inside its own network, or run the full system there.

**Row-level security**, or **RLS**, checks access to each database row. It helps keep one company's rows out of another company's reach. It adds to IAM checks. Data outside that database, such as files, still needs the same access checks.

SOC 2 is an outside review of how a company protects customer data. The team must check access, make safe updates, and test how it recovers from failures. It must keep proof that these checks took place.


## How the first hosted version will run

AWS will run the app, gateway and workers using a service called ECS with Fargate. The test space and the live customer space use separate AWS accounts. AWS also stores the database and files.

A release is built once. That same release is tested before it reaches customers. The team tests a copy of the database too. Production needs approval for that exact release. If an update fails, the old app can return only if it still works with the current data.

Docker Compose is for local development. Kubernetes can wait. The AWS setup does not change the plan to support customers who keep data in their own network. No cloud resources or live product were started for this document.

## Set up your first workspace

This is the proposed setup, not a released product. The fastest path is one command, `oxagen quickstart`. It signs you in, enrolls the device, creates a personal workspace if you have none, links the checkout, applies safe read-only defaults, and runs one small task. It uses the same checks as the full path and cannot weaken them.

The full path starts in the web app: create a workspace, link a repo, and choose its default branch. Set the data rules, agent, tools, and budget. Then enroll the desktop service and connect a supported harness.

The CLI links the checkout and creates `.oxagen` files. These files ask for a workspace, context, and guidance. They hold no keys and grant no rights. Sync and validate them through the local service. Run one small read-only task, then inspect its report.

Setup is complete only when a trusted start record shows which config, context, steering, and agent version the first model call used. Making files is not enough. Follow the [full first-workspace walkthrough](ARP-design.md#first-workspace-and-first-run), with [sample files and exact schemas](workspace-samples/README.md).

## Find the right spec

The **Design** tab holds the shared rules. Open **Specs** for the separate product documents:

| Spec | What it covers |
|---|---|
| [Desktop app](ARP-Desktop-app-spec.md) | The local app and protected gateway. |
| [Web app](ARP-Web-app-spec.md) | Mission control and workspace settings. |
| [API](ARP-API-spec.md) | Requests from code and other systems. |
| [MCP](ARP-MCP-spec.md) | Tools and context shown to each agent. |
| [CLI](ARP-CLI-spec.md) | Commands for people and scripts. |
| [Brand](ARP-Brand-spec.md) | Product words, fonts, colors, and states. |
| [Schema](ARP-Schema-spec.md) | Records, keys, shared limits, and data protection. |
| [Build plan](ARP-Build-plan.md) | Design certification, build batches, and independent checks. |
