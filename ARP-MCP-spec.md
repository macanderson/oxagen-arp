# Oxagen MCP service specification

Design proposal. This service is specified here; it is not claimed to be built. MCP means Model Context Protocol: a shared way for an agent app to find and call tools.

## 1. Purpose and callers

One logical Oxagen MCP endpoint gives each caller its allowed tool belt. Codex, Claude Code, custom agents, and approved connector agents can use it. Tools may run in Oxagen or through a checked connector inside a customer’s network.

The endpoint serves only approved Oxagen-managed bindings. That means Oxagen controls the route and checks; customers can still own and host the code. A listed tool is a possible choice, not permission to run every call.

![Oxagen stores a versioned agent definition with allowed and denied tool lists. The effective toolbelt keeps only tools allowed by that definition, the approved mode, workspace, operator rights, current policy, and current run grant. Deny wins and unknown tools are denied. One logical Oxagen MCP endpoint authenticates each request and returns this agent and workspace’s allowed managed catalog. In the support-agent example, lookup_customer is shown and process_refund is denied. Every tools/call is checked again for trusted identity, tool assignment, inputs, approvals, access to each record, current policy, run state, and budget. A protected run guard also checks registered native, shell, file, other MCP, and hosted tool paths. Only an exact governed action with a saved decision, reserved cost, and current authorization may run. A hidden or stale tool name does not grant permission. MCP alone cannot block other tool paths. Strict mode refuses a harness setup whose required tool paths cannot be guarded or disabled.](diagrams/authorization.svg)

*The agent definition sets allowed and denied tools. The active mode and workspace can narrow that list. One authenticated Oxagen MCP endpoint shows allowed catalog tools. A separate protected guard also checks native tools and other MCP tools before they act.*

## 2. Bind every request to its caller

Each request must carry a short-lived grant meant for this endpoint. Oxagen verifies the org, workspace, human or agent identity, agent release, mode, run, and current authority version. The model cannot select these rights by changing tool arguments.

Humans and agents use the same IAM and RBAC system: identity checks, roles, and rights to each record. Agents keep their own identities and accountable operators. A permitted tool still cannot read a forbidden customer record.

Client access to Oxagen and Oxagen’s access to a backend are separate. Never forward the client’s token upstream. [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)

## 3. Discover the current tool belt

`tools/list` returns only tools this request may discover. The agent definition, active mode, workspace, delegation, run grant, and current policies all limit that list. Applicable denies win.

The service must not keep a shared “current user” or “current agent” on a connection. MCP allows the list to vary with the authorization on each request. [MCP tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)

Use private caches. Bind pages and opaque cursors to the caller’s access context and catalog revision. Expire stale cursors. Change notices refresh the menu; missing a notice never restores revoked rights. [MCP caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)

## 4. Check each call before it acts

`tools/call` gets fresh checks even if the client skipped discovery. Oxagen resolves the stable tool binding, reviewed version, input-schema digest, and approved backend. Trusted adapter records tie these to the menu shown in the model request. A name alone cannot prove which implementation was chosen.

Before dispatch, check current identity, tool and target-record rights, run state, business rules, required approvals, and spend. Reserve all applicable shared limits before any effect. For example, a refund must fit the order, customer, and workspace limits together.

The resulting governed action covers one exact request. Its internal authorization is used once. Changed inputs, stale bindings, unknown modes, revoked access, or missing checks block execution. A person is asked only when a rule requires it.

## 5. Find context through the shared graph

Context discovery uses the required knowledge graph and shared Context Gateway. The graph links allowed records; source systems remain in charge of their facts, versions, and access rules. Check each returned field, link, search result, and count.

MCP exposes these routes through supported standard features or reviewed tool wrappers. Context Graph Protocol is the internal provider-exchange contract, not a replacement MCP wire format. Proposed Oxagen service names are not new standard MCP methods. See the [context design](ARP-design.md#12-knowledge-graph-memory-and-context).

## 6. Protect data and close other routes

Before remote disclosure, the protected [desktop gateway](ARP-Desktop-app-spec.md) scans the full outgoing request, including history, tool data, headers, and attachments. It blocks, redacts, or replaces content under workspace rules. Only the cleaned form may reach providers or Oxagen records.

A `ScanReceipt` binds that exact cleaned request to the scan-policy version. The receiving gate checks it. Missing, stale, or mismatched proof blocks the send.

MCP does not itself block native shell tools, another MCP server, direct uploads, or model traffic. The separate protected guard must block or mediate those routes. Strict mode refuses an unguarded route. MCP grants do not include provider model keys or backend credentials.

## 7. Report outcomes without guessing

Return safe results: completed, denied, awaiting required input, failed, or outcome unknown. These are proposed Oxagen action states, mapped to each supported MCP profile. Do not reveal hidden tool names or protected records in errors.

Streaming progress is not proof of success. A timeout, broken stream, or cancel request does not prove a refund failed. Keep its reservation and reconcile with the trusted connector before a retry could repeat the effect. Save cleaned decisions and receipts. Late replies follow the run’s pause and evidence rules.

## 8. Versions, controls, and related surfaces

Pin and test the MCP 2026-07-28 profile. Keep older profiles in separate adapters with their own standard fields and capability checks. Do not silently claim support for a harness that cannot preserve required bindings or guards.

Future plugins need explicit rights for every control request; MCP access grants no extra control. The [web app](ARP-Web-app-spec.md) manages setup, the [CLI](ARP-CLI-spec.md) supports operators, and the [API](ARP-API-spec.md) carries checked control requests. See [chapter 23](ARP-design.md#23-technical-reference-in-plain-words) for exact proposed records and schemas.

## First-workspace contract

Follow the [first workspace and first run walkthrough](ARP-design.md#first-workspace-and-first-run). It connects the web setup, enrolled service, `.oxagen` repo files, scoped MCP route, and first recorded model call. The [sample-file guide](workspace-samples/README.md) includes exact JSON schemas, commands and receipt fields. These are proposed formats, not live configuration for today’s app.
