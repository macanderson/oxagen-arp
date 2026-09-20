# Oxagen desktop app specification

This is a proposed app, not a claim of shipped features. The desktop app is the local gate for managed agents. Its window helps people set up and follow work. Its protected service checks work even when the window and browser are closed.

## Clickable design candidate

Open the [high-fidelity desktop mockups](certification/Oxagen-desktop-mockups.html). They use fictional data, linked flows, both themes and selectable failure states. They make no real requests. The [full screen inventory](certification/Mockups.md) is also Markdown. These files are available for review; they are not certified or implemented product screens.

## Purpose and supported setups

Support macOS, Windows, and Linux with separate, tested builds. Each strict setup must prove that its guard, file rules, and network rules work. Installing an icon or changing a model URL is not enough. A setup that cannot block bypasses must say so and cannot launch strict work.

The protected service runs outside the agent's control. Every model call passes through its local scan, then the tenant's model proxy. Adapters and hooks carry steering and turn events. The guard also checks local and remote tool paths. Keys stay outside agent code.

A remote worker needs the same protected service on the host where its raw data lives. It may run without a desktop window. A hostile device admin remains outside the promise unless the customer controls that device through a managed setup.

## Enroll and connect a harness

1. Sign in through the customer's identity system.
2. Enroll the device and choose an allowed workspace.
3. Bind the local repo to that workspace's approved repo record.
4. Select a supported harness, agent identity, and mode.
5. Check the platform, adapter, current rules, and data route.
6. Open the gates only after those checks pass.

Use the same IAM rights as the web app. A repo path or edited remote URL cannot pick a weaker workspace. Show the device, operator, agent, workspace, and control level together. An old session may attach only if the adapter can prove control; otherwise start a new guarded session.

## Clean the whole request locally

Workspace **Policies → Data protection** chooses block, redact, or replace. Replace may use a stable safe name within a run. The lookup map stays local and protected. Organization rules remain the ceiling.

Scan prompts, attachments, names, paths, history, steering, context, tool schemas, arguments, results, and metadata. Read supported images and documents locally. Scan archive members too. Unsupported, encrypted, damaged, or partly read input blocks sending. Bound file size, nesting, time, and memory. No remote scanner or remote model receives raw data to decide whether it is safe.

The web app must pair with an authenticated local bridge before accepting raw prompts or files. Check the caller and browser origin. Disable raw uploads, autosave, page replay, and analytics on these inputs. A local address alone does not prove who called it.

Build the complete model request locally after context is added, then scan again. The tenant proxy may add protected sign-in headers, but no new model-visible content. Any such change requires another local scan and access check.

Create immutable cleaned files. Provider file and cache IDs must resolve to those approved copies. Do not upload a raw file first. Do not release raw stream chunks while a scan catches up.

![Raw prompt text, full history, tool inputs and results, tool schemas, files, images, attachments, URLs, and request headers enter the protected local desktop gateway. The service is separate from the app UI and protected from the controlled agent. The workspace scanner checks the full assembled outgoing request and every required attachment. Workspace rules may block the send, redact content, or replace sensitive values. If required content cannot be checked, the send is blocked. The blocked path does not upload raw content or raw evidence. The allowed path carries only the cleaned full request and a minimal ScanReceipt without raw text. This receipt binds the exact cleaned request digest and workspace scan-policy version. The tenant gateway checks the receipt and blocks missing, stale, or mismatched receipts. Changed requests are rechecked under current access and policy. Only this cleaned form reaches the tenant gateway, approved model or tool, and sanitized Oxagen evidence records. The same path applies to outgoing reports and telemetry. No raw request, raw evidence, or replacement mapping may take a separate cloud path.](diagrams/data_protection.svg)

*A protected desktop gateway scans the full assembled request under workspace rules. It may block, redact, or replace content. Only the cleaned form can reach tenant gateways, approved models, or Oxagen records. The app UI and harness cannot use a raw-to-cloud route.*

## Authorize the governed action

A signed `ScanReceipt` names the workspace, scanner and policy versions, exact cleaned request, files, destination, and expiry. It proves which scanner checked those bytes; it does not prove perfect detection.

Count tokens and reserve funds from the cleaned request. The governed action must pass current IAM, policy, tool, and budget checks. The proxy checks the receipt against the actual send. Changed bytes, stale rules, or new scope require fresh checks. An agent-supplied “scanned” flag grants nothing.

## Show safe records and clear failures

Save only cleaned content to the tenant's chosen store. Relay model replies through the local scan before remote evidence storage or dependent work. Apply this rule to errors, tool results, diffs, reports, and callbacks too. Keep safe usage facts and mark missing evidence.

Raw copies stay in short-lived local memory by default. Source files stay where they were. No raw logs, crash dumps, sync queues, or secret hashes. Any local quarantine is separate, encrypted, permissioned, time-limited, and off by default. State device memory limits honestly; do not promise perfect erasure. Saved evidence can replay the actual cleaned model input, but cannot recover removed originals.

| Screen | Required behavior |
| --- | --- |
| Workspaces | Show repo links, effective rules, scan coverage, and storage destination. |
| Runs | Show queued, active, pausing, confirmed paused, blocked, and uncertain states. |
| Data protection | Preview cleaned content locally; show safe reasons without quoting secrets. |
| Access | Request scoped rights without placing keys in chat. |
| Health | Show stale policy, failed scans, lost links, pending records, and updates. |

## Fail closed and recover

Missing rules, failed checks, or service failure close the gates. Offline does not mean paused. Resume only after the required pause boundary and new checks. On restart, reconcile past sends before retrying them.

Accept signed updates and switch versions safely. An update failure must not open a bypass. Leaving a workspace revokes its grants and clears transient state. Managed removal must first stop or isolate work.

See [the shared gateway rules](ARP-design.md#3-desktop-gateway-and-local-data-protection), [web controls](ARP-Web-app-spec.md), [API contract](ARP-API-spec.md), [MCP tools](ARP-MCP-spec.md), and [CLI](ARP-CLI-spec.md).

## First-workspace contract

Follow the [first workspace and first run walkthrough](ARP-design.md#first-workspace-and-first-run). It connects the web setup, enrolled service, `.oxagen` repo files, scoped MCP route, and first recorded model call. The [sample-file guide](workspace-samples/README.md) includes exact JSON schemas, commands and receipt fields. These are proposed formats, not live configuration for today’s app.
