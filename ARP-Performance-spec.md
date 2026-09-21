# Token use, cache use, and agent performance

Oxagen must help people spend less time and money on agent work while keeping useful results. This is a core product requirement. It applies to enrolled harnesses and custom agents using the [Oxagen SDK](ARP-SDK-spec.md). These are proposed requirements, not shipped analytics or a working SDK.

## Follow the cost of each request

The local gateway builds and cleans the full request. The model gateway saves its send record and reads the provider's usage reply. The SDK adds facts about the agent's loop, tools, and files. Oxagen joins these facts by run, turn, action, attempt, and model exchange. It writes the safe records to the org's configured data plane.

![A governed request passes a full local scan and the model gateway before provider usage is saved as a safe linked record. Observed token, cache and cost facts and SDK events support a proposed change. The operator reviews it, may approve a later run, and measures the change. Estimated costs and savings remain separate from facts; metrics contain no prompt bodies or secrets.](diagrams/efficiency.svg)

*Proposed flow: scanned requests and safe usage records support suggestions. Operators review changes, and later runs measure the result.*

Count paid attempts even when the call fails, times out, is retried, is interrupted, or returns text that the run may not use. A cancelled reply can still carry a real bill. An estimate before sending helps show likely cost; only a trusted receipt can settle a charge. Keep unknown charges and budget holds until resolved.

Each usage record names the workspace, operator, agent identity and release, mode, harness or SDK adapter version, model route, requested model, reported model, request ID, and price version. Keep parent and child links so a team total counts each charge once. Attribute system work, such as summaries and coaching, to its own action and payer.

Streaming adapters must declare whether each usage message is a delta or a running total. Do not add running totals together. Deduplicate repeated replies. Retain corrections as new versions linked to the old record. A missing final reply means incomplete usage, not zero cost.

## Show tokens in and tokens out

A token is a small piece of text or other model input. Show what came in and what the model produced as separate counts.

| Measure | Required meaning |
| --- | --- |
| Total input | All input tokens processed for this request under the provider's counting rules. |
| Fresh input | Input neither read from a prompt cache nor charged as a new cache write, where that split is available. |
| Cache read | Input reused from the provider's prompt cache. It is part of input, not extra input. |
| Cache write | Input used to create or extend the prompt cache, split by billed duration or rate when reported. |
| Total output | All output tokens the provider reports for the request. |
| Reasoning or other output detail | Provider-reported subsets or separate charge classes. Record which they are. Do not add a subset to its parent. Do not claim access to hidden reasoning text. |
| Other units | Images, audio, video, search, tools, or other billed units when available. Keep their units and price rules. |
| Cost | Provider-reported, invoice-matched, calculated from a rate, or estimated. State which basis applies. |
| Coverage | Known, partial, estimated, unsupported, or not reported for each field. Missing fields remain null. |

Prompt caching concerns reused input. Do not label ordinary generated output as a cache hit. If a provider has an output-reuse or prediction feature, give it its own name and counting rule.

Use a versioned mapping for each provider, API, and model profile. Keep its documented field meanings and safe original usage values. Never silently guess a mapping for an unknown version.

For supported OpenAI Responses profiles, `input_tokens` is the total; `input_tokens_details.cached_tokens` and, when supplied, `cache_write_tokens` are input subsets. Subtract known disjoint subsets to find ordinary input. An absent write field must follow that profile's documented meaning. [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

For the documented Claude Messages profile, total input is `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`. Cache-write duration details break down the creation count; they are not extra tokens. [Claude prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

Adapter tests must cover these different shapes, missing fields, streaming totals, paid hidden output, multimodal input, and late usage corrections. Invalid splits must be flagged, not forced to add up. Prices come from the bound rate schedule or contract, not a permanent price table in the SDK.

## Explain the cache numbers

Show two different rates, with their denominators:

```text
Token reuse rate = known cache-read tokens / matching known total-input tokens
Request hit rate = requests with known cache reads above zero / requests with known cache status
```

For a group, sum the token counts before dividing. Do not average each run's percentage. Show the number of excluded requests, unknown usage, selected time range, and data age. When the denominator is zero, show “not available.”

Keep cache writes, cache reads, plain input, and output costs separate. Cache-write fees can make a short run cost more. Compare the full cost over the stated window, including writes, before claiming cache savings. Cache reuse is not a measure of useful work.

To explain a miss, compare the cleaned request's stable blocks, tool schema versions, model, route, cache settings, and known expiry rules. Show “prefix changed” as an observed fact when the records prove it. Show “may have expired” as a possible cause unless the provider confirms it. A matching prompt or a faster reply does not prove a hit.

Cache keys and diagnostics must preserve org, workspace, policy, and access boundaries. Do not reuse hidden context across customers to improve a metric. Local replacement values may be stable within an allowed run; they must not expose secrets or link them across orgs.

## Show where the input came from

Save a manifest of the cleaned model-visible request. Link each block to its source: operator text, workspace instructions, skill, tool schema, chat history, retrieved context, attachment, or tool result. Record the source version and the first action that introduced it.

Estimate block sizes with the selected model's tokenizer where available. Label tokenizer estimates and bytes separately from provider counts. Keep an “unassigned” share when framing or provider processing prevents an exact split. Do not pretend to know which file got a cache discount when the provider reports only a total.

Count a block again each time it is sent in a later request. The view should show both unique material and repeated exposure. A tool result may cost input tokens in many later turns. A large tool schema may cost tokens even when its tool is never called. A local file costs model tokens when its contents enter the request; its disk size alone is not token use.

Show output length, repeated output, and context growth too. Link retries and summaries to their costs. Record model time, time to first token, tool time, queue time, and human wait separately. Parallel work overlaps: summing child durations is not the run's elapsed time.

## Turn evidence into useful advice

Each finding must show the affected run or request, the observed facts, the proposed change, and who can act on it. Give a range for estimated USD and token savings, its price basis, assumptions, coverage, and confidence. Keep estimated savings separate from savings measured after a change.

Examples include repeated reads of an unchanged file, full logs added on every turn, stable instructions changing order, large unused tool descriptions, oversized outputs, duplicate paid retries, and calls that continue after an explicit stop condition. A repeated read may be needed after a file changes; “unused” context is often only a guess.

### A trace file example

The app may say: “This request included a 120,000-token trace. Try giving the local file path and asking the agent to read the 2,000-token error section first. Under the shown price assumptions, that would save about $0.354 in input cost on this request.”

That is an illustrative calculation, not a current provider price or a promise:

```text
Assumed fresh-input rate: $3 per million tokens
Full trace: 120,000 tokens × $3 / 1,000,000 = $0.360
Targeted result: 2,000 tokens × $3 / 1,000,000 = $0.006
Input difference: $0.354, before extra calls, tool fees, or output
```

Show a recommendation only when the file exists where the agent runs and a permitted tool can read it. Bind the read to the correct file version. Scan the tool result locally before it enters the model or remote records. A remote agent cannot use an operator's local path unless an approved route supplies that file.

A path alone does not save tokens if the agent then reads the whole file. Include the extra model call, tool output, tool fees, output tokens, cache reads and writes, and later repeated input when estimating net savings. Already-cached input may cost much less than the example assumes. The estimated saving can be zero or negative. If the alternative's scope is unknown, offer a token-size hint without a dollar claim.

### Keep advice from changing policy on its own

Offer “Inspect evidence,” “Use on the next run,” “Draft a rule,” and “Dismiss with a reason.” Any change to a prompt, tool belt, skill, or limit uses the normal publication and IAM checks. Advice never removes required policy text or grants a tool.

Group suggestions that affect the same tokens or calls. Do not add their savings twice. Monthly projections must state the assumed number of similar future runs. A synthetic replay is an estimate; it is not measured savings. A live comparison needs explicit opt-in, a budget, current access checks, and safe handling of tool effects. Record the cost of the comparison itself.

Measure whether a change helped with matched task groups, sample counts, quality or acceptance signals, latency, errors, and spend. Show source and limits for each measure. Lower token use or a higher cache percentage alone does not prove a better agent or operator. No witness or DoD system is required for these usage facts and loop checks.

## Find mistakes in custom agent loops

The SDK must record the order and cause of work, not just a final transcript. Events link model requests, model results, tool proposals, admitted calls, tool results, context additions, retries, child tasks, and completion proposals. The protected gateway records admission and actual sends. Self-reported SDK events keep their lower trust label.

| Check | What Oxagen can establish |
| --- | --- |
| Reused action or dispatch | A repeated delivery is deduplicated; distinct sends for one supposedly single action need review. |
| Broken tool pairing | A result has the wrong call ID, is consumed twice, or is missing at a boundary that requires it. |
| Unawaited work | Completion was proposed while required tool or child work remained open. Declared detached work is handled under its own scope. |
| Wrong resume state | Old-version evidence entered active context without a fresh checked adoption, or a request used a stale context version. A valid adopted view carries the current version and links to its adoption decision. |
| Lost or repeated steering | A delivered control never reached the required request, or was applied again without a new command. |
| Retry problems | A paid retry lacks a fresh admission, repeats an unknown write, or exceeds the declared attempt limit. |
| No progress | The same inputs, file versions, and failures recur without new evidence. This is a warning unless a stated rule is broken. |
| Stop handling | A new call follows a closed gate, or a completion proposal ignores a required pending action. |

Use causal links and the adapter's declared loop rules. Parallel calls may be correct. Some frameworks allow partial results, continuations, or detached tasks; the declared profile must state how those work. Event arrival order across machines is not execution order. Missing events lower confidence and may block a strict action; they do not prove misconduct.

A proven policy violation can trigger the core's existing stop or hold path. A performance hunch creates advice by default. These checks cannot prove the task's answer is correct or inspect an opaque harness's hidden state. The future plugin control interface stays a stub.

## Use the existing mission control screens

Use the Fleet, Spend, Operator coaching, and Run views of `apps/web`, which follow the oxagen-roadmap Mission Control v2 layout, as the product direction. Add a token breakdown and cache history to Run. Let Spend group by operator, agent, harness, SDK adapter, model, workspace, run, turn, and call. Give Operator coaching evidence-backed suggestions and a Loop issues view for developers.

Keep filters for reported, estimated, and unknown use. Separate agent work from Oxagen's own analysis cost. Show before/after results without ranking people by token count. A supervisor sees only permitted operators and records. Run text, source paths, and result details need their own read rights.

## Keep analysis private and affordable

Apply local data protection to usage payloads, request manifests, file names, findings, and exported traces. Safe numbers do not authorize access to the prompts behind them. No raw prompt, secret, local replacement map, or raw-content fingerprint enters metrics labels or remote analytics. Use org-scoped references to cleaned content for repeated-block analysis.

Use deterministic counters and rules before paid model analysis. Any model-based advice uses the same gateway, IAM, scan, and budget path, including behind the customer's firewall. Allow the org to turn it off. Sampling optional diagnostic detail must never drop required action or billing records. If the required record path is unavailable, strict admission blocks; optional coaching can lag.

Export allowed metrics and spans through a versioned OpenTelemetry mapping. Pin the mapping version so changing field names do not corrupt history. ARP remains the control and evidence contract; a telemetry exporter grants no execution rights. The GenAI conventions have their own maintained specification. [OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)

## Required records and release checks

The [schema additions](ARP-Schema-spec.md#usage-and-performance-records) define usage measurements, input blocks, loop events, and findings. The [API additions](ARP-API-spec.md#usage-and-sdk-contract-additions) define their access and reporting requirements. The API schema expansion and SDK conformance suite must be reviewed before these features ship; current generated OpenAPI files do not yet include every new contract.

Release checks must cover provider normalization, stream duplication, missing receipts, late costs, child-cost rollups, cache-rate denominators, overlap between savings suggestions, restricted evidence, raw-data rejection, and same-file/different-version reads. Deliberately broken agent loops must produce linked findings. Correct parallel loops must not be flagged merely for concurrency. A file-path suggestion must never claim that the path alone saves money.
