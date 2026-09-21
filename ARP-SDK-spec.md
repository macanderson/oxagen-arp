# Oxagen SDK specification

This is a proposed contract for custom agents. It is not a shipped SDK. The examples show intended behavior, not code that can run today. No package, endpoint, or language binding gains support until it passes the shared tests.

The main JavaScript and TypeScript API should be this simple:

```javascript
const result = await oxagen.register({your_agent}).run("prompt");
```

`your_agent` is a variable holding the customer's agent and its supported adapter. It is not source code sent to Oxagen. Registration uses the configured, authorized workspace, operator, agent release, persona, mode, and work order. It does not infer permission from the object's name.

## 1. Purpose

A customer can build its own agent loop and enroll it in Oxagen. The loop may choose a model, ask for tools, read results, and take another step. Oxagen checks each governed action, records what happened, and helps the builder find waste and loop errors.

Use the same records, IAM, workspace rules, budgets, and local data protection as other harnesses. Custom code does not receive a weaker path. The [API specification](ARP-API-spec.md) defines shared control operations. The [schema specification](ARP-Schema-spec.md) defines stored records.

The SDK has three jobs: connect custom code to the protected local service, make safe loop behavior easier, and record facts the gateways cannot see alone. A package in the agent process cannot prove that the agent has no other route.

## 2. Languages and one shared contract

Every SDK operation is a capability in `packages/kernel`, invoked on the `api` surface through the REST binder or on the local IPC route. The SDK never carries policy; it is a typed client over the same registry the CLI and MCP binders derive from, so a capability added to the registry is available to the SDK without an SDK release.

JavaScript and TypeScript are first-class clients with the fluent API above. Plan equivalent bindings for Python, Go, Java/Kotlin, C#/.NET, Rust, Ruby, PHP, Swift, and C/C++. Generate transport types from the same versioned schemas. Add natural async and stream handling for each language. Do not copy policy decisions into each SDK.

Each release states its protocol version, tested service versions, supported model routes, stream modes, tool routes, and control limits. A language may ship later without changing the wire contract. Publish a support table based on tests, not a list of planned languages.

Provide a low-level client and a loop helper. The low-level client lets a builder keep its own loop. The helper tracks calls, results, pending work, and control boundaries. Both use the same gates. A provider adapter may preserve provider-specific fields when approved; a shared type must not silently discard them.

### Register and run

`register({your_agent})` returns a `RegisteredAgent` handle at once. Trusted setup may happen later. `await registered.ready()` completes enrollment and checks capabilities without starting the agent. `run()` waits for that same setup before accepting work. Setup failure prevents the custom agent from running.

Default to strict mode. An explicit observation-only option may record a weaker integration if workspace policy allows it. The handle and every run must expose that lower control level. Never downgrade strict mode to make registration succeed.

The adapter declares how it intercepts model calls, tool calls, context, streams, children, retries, and control boundaries. A raw function that makes hidden calls is not enough. Supply a tested framework adapter or implement the custom adapter contract. Strict registration rejects missing interception or local scan coverage, even if the callable itself runs correctly.

The adapter runs customer logic with a checked execution context. All model, tool, and context operations use that context or a certified intercepted path. Registration cannot make arbitrary opaque code safe; the protected host service and runner must also block bypass.

Use this longer form when a caller needs files, progress, or cancellation:

```javascript
const registered = oxagen.register({your_agent});
await registered.ready();

const run = registered.run("Inspect the failure in this trace", {
  attachments: [oxagen.localFile("./trace.txt")],
  idempotencyKey: savedJobKey
});

const accepted = await run.accepted();
const result = await run;
```

The path is a local input reference, not a raw cloud upload. The registered service opens it only within allowed file access, scans supported content, and prepares cleaned copies. The prompt, filename, path, attachment contents, and resulting request all follow workspace data rules. No browser or SDK upload may happen first.

`run()` returns an awaitable `RunHandle` immediately. Local work may be pending while the service checks and accepts the request. These proposed methods define its behavior:

| Run handle operation | Contract |
|---|---|
| `accepted()` | Resolves with the saved operation and target references; rejects typed setup or admission errors. Acceptance does not prove dispatch. |
| `events({cursor})` | Returns an async stream of cleaned, authorized events with stable IDs. Supports resume and duplicate delivery; a gap requires a fresh snapshot. |
| `status()` | Reads the authoritative state and coverage. It does not guess from a closed socket. |
| `steer(message, {interrupt})` | Cleans and submits direction; returns per-run delivery receipts. Interrupt first requires a confirmed pause. |
| `pause({reason})` / `resume({reason})` | Requests the core control transition. The command receipt is separate from proof of paused or running state. Resume checks current rights and the saved boundary. |
| `cancel({reason})` | Requests stop and returns the saved command reference. Cancellation is complete only when the core confirms stopped. |
| `result()` or `await run` | Waits for the same terminal result: completed, stopped, or failed. Returns cleaned output, report references, usage coverage, and unresolved cost facts. |

Paused, blocked, and uncertain work remain pending; these states are visible through events and status. Admission rejection is a typed error. A lost local connection returns a transport error with the saved operation reference when known; it does not mark the remote run failed. Reattach to that operation before deciding whether to submit again.

Calling `run()` again creates new work unless the caller supplies the same saved idempotency key and unchanged input. Each handle keeps one stable key for its transport retries. Dropping a handle or ending event consumption does not cancel the run. A result wait may be detached without requesting stop.

An adapter exception records a safe failure. If dispatched actions still have unknown effects, the core holds the run for reconciliation before claiming it has stopped. The result may report unresolved charges even after safe stop; a stopped model request may still be billed.

## 3. Enroll the custom target

1. An allowed person or service enrolls the protected service on the host where raw data lives.
2. Register the custom runtime as a harness target. Record its build, adapter version, owner, capacity, and tested controls.
3. Bind the checkout to the workspace and linked repo. For a non-repo job, use an explicitly supported job profile; do not invent a checkout.
4. Select an approved agent release, persona, mode, operator, work order, model route, and tool belt.
5. Negotiate required controls. Start only when current identity, scan policy, routes, storage, and funds pass.

The desktop service may run without a window on a server or in CI. Its location follows the data, including a customer's private network. See the [desktop specification](ARP-Desktop-app-spec.md).

The trusted binding names the org, workspace, operator principal, agent principal, persona version, agent release, mode, target, run, work order, and authority epoch. The epoch is the current version of the run's right to act. The SDK cannot grant rights by sending different IDs.

Keep private service keys and provider credentials outside the agent process. Give the client only the narrow connection it needs. The service authenticates its caller and rechecks scope on each request. A copied config file or run ID is not an enrollment proof.

Use the existing `harness_targets`, `checkout_bindings`, `runs`, `persona_usage_segments`, and `run_start_receipts` records. A work acceptance reply is not proof that a model call started.

## 4. Use a real gateway

Every model call goes through the protected local scanner and the org model proxy. Every tool call goes through a protected tool route. This includes title generation, summaries, retries, fallbacks, child agents, and paid analysis of runs.

An SDK wrapper alone is an observed integration. Strict mode also needs a protected runner that blocks direct model traffic, unchecked tools, other credentials, and unguarded child processes. If a required route cannot be guarded or disabled, strict startup fails. Do not silently fall back to a direct provider client.

The local service builds and scans the full outgoing request after context and tool schemas are added. It scans prompts, history, files, tool data, and metadata under workspace rules. Only cleaned bytes reach a model or remote records. The proxy validates the exact `ScanReceipt`; a client flag saying “scanned” proves nothing.

Replies and tool results pass the local scan before remote record keeping or dependent work. Never place raw content in SDK logs, errors, analytics, crash reports, or tracing spans. Opaque local handles may refer to raw files; those handles must not upload them through another route.

## 5. Proposed logical API

These names describe language-neutral helpers. They are not new HTTP routes. Bind them to the existing API operations and protected local IPC after their schemas and tests are approved.

| Helper | Behavior |
|---|---|
| `connect_local` | Authenticate to the enrolled local service; read its tested capability profile. |
| `attach_assignment` | Attach to one authorized assignment and its trusted run binding. |
| `open_turn` | Record cleaned input and return a turn handle; do not accept caller-set authority. |
| `boundary` | Synchronize control messages before the next step; apply steering or hold for control. |
| `model.generate` | Assemble, inspect, authorize, reserve, send, record, and return a checked model response. |
| `tools.invoke` | Resolve the exact tool binding and arguments; check current rights before execution. |
| `batch.open` / `batch.join` | Declare a bounded group of parallel steps and wait for its fixed members. |
| `context.consume` | Record which permitted result or excerpt entered the next request. |
| `loop.note` | Add a cleaned, client-reported fact such as a retry reason or selected branch. |
| `completion.propose` | Ask the core to close the turn; return its actual pending or completed state. |
| `reconcile` | Check an uncertain earlier action before any retry that could repeat an effect. |

The helper does not expose reusable “allow” tokens or ask the application to approve itself. Trusted services own `action.authorize` and `action.dispatch`. Model requests bind the final bytes, context version, route, tool menu, price version, cost hold, action, attempt, and current epoch.

Every changing operation has a stable idempotency key. Existing records also carry the expected revision. Repeating the same key and bytes returns the same operation. Changed bytes are a conflict, not a new hidden retry.

## 6. A small custom loop

This pseudocode has no library dependency. Names below are proposed helpers, not a runnable SDK. The service owns scanning, permission checks, funds, dispatch, evidence storage, and control ordering.

```text
client = connect_local(enrolled_service)
run = client.attach_assignment(assignment_reference)
turn = run.open_turn(local_input_handle)

while true:
    step = turn.boundary()
    if step.is_held_or_stopped:
        return step.operation_reference

    reply = turn.model.generate(
        route = run.approved_route,
        context = turn.current_context,
        tools = run.current_tool_belt,
        output_limit = run.allowed_output_limit,
        idempotency_key = turn.next_step_key()
    )

    if reply.outcome_is_unknown:
        return turn.reconcile(reply.attempt_reference)
    if reply.is_denied_or_interrupted:
        return reply.operation_reference

    if reply.has_tool_proposals:
        batch = turn.batch.open(reply.tool_proposals)
        for proposal in batch.fixed_members:
            batch.submit(turn.tools.invoke(proposal))
        results = batch.join()
        turn.context.consume(results.accepted_views)
        continue

    return turn.completion.propose(reply.accepted_result)
```

`boundary` is a convenience, not the only lock. The trusted service rechecks the control inbox at admission so a message arriving after that helper call cannot slip past it. Tool proposals from old context do not run ahead of due steering. Each batch member needs its own checks; parallelism does not share an approval.

The helper limits loop steps, elapsed time, parallel work, retries, and spend as policy requires. Those limits also apply at trusted gates. Reaching a limit holds or stops new work with a recorded reason; it cannot prove the task succeeded.

## 7. Streaming and control

Expose only stream parts the local scanner has cleared and the current run may accept. The scanner may need to buffer more than one chunk, or the whole reply. Do not show raw chunks while a later scan catches up. Record the resulting delay.

Keep the provider's stream order, safe chunk IDs, terminal status, usage source, and missing ranges. A dropped stream is not a successful completion. Tool-call parts must form a valid, complete proposal before any tool may execute.

Pause and cancellation are requests. A pause reports `pausing` until the core saves a confirmed boundary. Cancellation reports stop requested until the core confirms stopped. Account for the custom loop, parallel members, children, queued work, and file writers. A stopped connection or finished callback is not enough.

Late replies stay linked to their old attempt as evidence. They may settle a charge, but cannot enter resumed context or trigger tools automatically. An explicit checked adoption may create a new permitted view under the current authority; keep the old evidence and the adoption decision linked. Any adopted tool proposal still needs fresh action checks. Resume uses fresh authority. The SDK rejects old handles and checks the saved boundary before releasing new work. Follow the [pause and late-reply rules](ARP-design.md#6-pause-only-when-the-stop-is-confirmed).

## 8. Token and prompt-cache accounting

Record usage for each model exchange and each paid attempt. Roll it up by run, operator, agent, persona, work order, workspace, model, and route. Count a child charge once. Preserve time period, data age, source, and missing coverage.

| Measure | Required meaning |
|---|---|
| Input tokens | The provider's input total, normalized by a pinned adapter mapping. Mark local estimates separately. |
| Output tokens | Reported output total, with the provider's definition of included reasoning or other tokens. |
| Cache reads | Input served from a prompt cache, only where the provider reports or a trusted route proves it. |
| Cache writes | Input written to cache, including supported duration or price class; do not call it a hit. |
| Uncached input | Derive only when totals and cache classes are known, compatible, and non-overlapping. |
| Other charged units | Images, audio, requests, storage, hosted tools, or other units, with their own rate class. |
| Request composition | Estimated shares for user input, history, steering, skills, files, schemas, and tool results. |
| Cost | Held maximum, estimated cost, confirmed charge, adjustment, and unresolved amount as separate facts. |

Cached input is often included in a provider's input total. The adapter must declare that relationship; do not add it again. Reasoning may be included in output. Cache-read and cache-write classes may need separate mapping. Store the safe source receipt and mapping version so a reader can check the total.

Unknown means unknown, not zero. A missing cache field does not prove a miss. A zero-cost local read does not make the next model input free. A cache request or matching prefix does not prove the provider reused it. Provider-hidden work is outside capture unless reported.

Define token reuse as known cache-read tokens divided by matching known total-input tokens. Show both numbers, coverage, and mapping. An eligible-input rate, if shown, is a separate metric with a declared provider-specific denominator. Exclude unknown calls with an explicit count or show a range. Do not average per-call percentages when their token counts differ. See the [performance specification](ARP-Performance-spec.md) for all shared measures and savings rules.

Save request composition from the exact cleaned payload. Use source spans and pinned tokenizer estimates where available. Explain overlap and unattributed overhead. Do not claim that separate fragment counts always sum to provider tokens. The provider's receipt remains the usage evidence for settlement.

Link to existing `model_exchanges`, `model_response_receipts`, `model_usage_receipts`, `model_usage_lines`, `model_price_rates`, and budget records. Counts and charts never authorize spending. Funds must be held before dispatch using the existing [budget rules](ARP-design.md#16-enforce-dollar-budgets-before-spending).

## 9. Record the loop as a graph of steps

Record which input caused a step, which result it used, and which next steps depend on it. Parallel work forms branches that later join. Event arrival order alone does not prove one action caused another.

Use existing `run_events`, `spans`, `action_attempts`, `tool_executions`, `stream_chunks`, and `provenance_links` where their meaning fits. The service sets trusted sequence and actor fields. The SDK may supply a local event key; retries cannot add another copy of the same event.

The proposed diagnostic profile adds typed links for “requested by,” “consumed by,” “retry of,” “member of batch,” and “waits for.” A span parent is not enough to express every dependency. Pin link direction, source, allowed cycles, and scope in the final schema. Ordinary causal links must not form a cycle.

Record model/tool proposal IDs, complete result IDs, attempt number, retry reason, context revision, consumed-result view, branch choice, batch membership, wait start/end, control state, and terminal outcome. Any free text or payload follows local scanning first.

Distinguish gateway-observed facts, protected-runner facts, and client-reported facts. “The program said it read this result” is weaker than a composition receipt proving those bytes reached the model. Missing client events lower diagnostic coverage; they must not be filled in as measured facts.

## 10. Find observable loop errors

Loop diagnostics check the recorded order and contracts. They do not judge the agent's private thoughts or prove that a business task was correct.

| Finding | Evidence needed and limit |
|---|---|
| A tool result never reached the next request | Accepted result plus the actual next composition; account for intentional filtering and redaction. |
| A tool result used the wrong call ID | The proposal/result mapping and provider-specific message contract. |
| A result was consumed twice | Identical result identity in contexts where the declared loop contract forbids reuse. |
| A write was retried while its outcome was unknown | Both attempts, connector retry rules, and missing reconciliation. |
| A step used stale context or authority | Bound revisions and the relevant saved change or control fence. |
| Parallel work was treated as finished too early | Fixed batch membership, joined members, and unresolved effects; timestamps alone are insufficient. |
| A loop repeated unchanged work | Repeated cleaned inputs and source versions; label possible waste unless there is a violated rule. |
| A model response was cut off or only partly parsed | Terminal status, complete parser input, and provider mapping; missing data stays unknown. |
| A declared stop rule did not take effect | Published rule and later admitted steps; do not infer task success from passing tests alone. |

State each finding as observed, inferred, or incomplete. Include rule version, affected events, coverage, confidence where useful, and a repair suggestion. Avoid an unexplained “correctness score.” Missing events may show a recording gap, not a broken agent.

Diagnostics do not change tools, policies, skills, or context on their own. An operator may turn a suggestion into a reviewed change. A known dispatch violation can trigger an existing control policy; the trusted gate enforces that policy, not the analytics chart.

## 11. Help operators and builders spend less

Show the evidence behind coaching. Useful examples include repeated file reads, the same large tool result sent many times, unused tool schemas, repeated retries, changed stable prefixes, and extra calls after a declared stop rule. State what was measured and what remains a guess.

For each suggestion, show the affected calls, source versions, token counts, cache facts, price basis, proposed change, and likely tradeoff. A shorter prompt may omit needed facts, cause extra reads, or reduce cache reuse. Compare the whole changed path before calling it a saving.

Example: an operator pastes a long local trace into each request. Suggest giving its allowed file path and asking the agent to read the needed range. This only helps if that target can read the file through its tool belt. A file path on another machine is not usable context.

An illustrative estimate might replace 20,000 pasted input tokens with a 100-token file reference and a 2,000-token excerpt. That is 17,900 fewer input tokens for that comparison, before any extra calls, tool cost, cache effects, or changed answer. These are example counts, not a measured saving or a promised outcome.

Calculate dollars from the changed call set and its pinned prices. Do not multiply every removed token by the uncached rate if the original prompt was cached. Include cache-write cost, changed cache duration, output changes, extra reads, and any fixed fees. Label estimates and ranges; a paid before/after trial needs its own approved budget.

Keep “estimated opportunity” separate from “measured reduction.” A measured reduction names the comparison, conditions, changed usage, and data limits. It does not prove the advice caused a better result. Advice should help the operator make a choice, not rank people from token counts alone.

## 12. Proposed additions and acceptance tests

The diagnostic and normalized-usage fields in this document are a proposed extension. They do not silently add fields to today's OpenAPI or SQL draft. Before implementation, add versioned schemas, API operations, permissions, migrations, and test vectors to the shared contract.

Proposed records are `ModelUsageObservation`, `RequestCompositionBreakdown`, `LoopDependency`, and `RunFinding`. They reference existing exchanges, attempts, events, cleaned artifacts, and source revisions. They do not replace usage receipts, grants, budget accounts, or authoritative run state.

Each record needs org/workspace scope, record-level rights, source and mapping versions, observed/recorded times, missing-data status, and append-only corrections. Findings also need the rule, evidence links, measured/estimated classification, suggested action, and user disposition. The org's configured data plane stores them; RLS and the same IAM layer protect details and rollups.

Each language binding must pass the same cases: denied tool never executes; direct routes are blocked in strict mode; raw data never escapes; changed bytes require a new check; simultaneous calls cannot exceed a shared cap; retries do not duplicate an action; streams preserve safe order; cache totals do not double-count; unknown usage stays unknown; and an unadopted late reply cannot steer resumed work.

Test custom loops with a missing result, wrong tool ID, duplicate callback, parallel branches that finish out of order, truncated stream, failed scan, stale epoch, unknown write outcome, and pause during a batch. Diagnostics must report only supported findings and mark evidence gaps.

Include fixed coaching examples where path-based input saves tokens, saves none, or costs more after retrieval and cache changes. The report must give the right conclusion in all three. Use fake model replies and prices for these tests; no paid provider call is needed.

This scope adds custom-agent integration, accounting, and loop diagnostics. It adds no witness, oracle, or definition-of-done feature. The separate [plugin interface](ARP-design.md#17-plugin-controls-in-the-turn-loop) remains a stub. A clean SDK test run does not certify every customer loop or every harness.
