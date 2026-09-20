# Oxagen CLI specification

Proposed command interface. These examples describe the design, not an implemented release.

## Purpose and users

The CLI lets operators and scripts submit work, inspect runs, and read reports. It uses the same [API](ARP-API-spec.md), IAM, Policies, and agent Permissions & limits as the [web app](ARP-Web-app-spec.md). It cannot bypass those rules.

The CLI connects to the protected [desktop service](ARP-Desktop-app-spec.md) over authenticated local communication. That service holds device identity, checks the workspace, and scans data before it leaves the machine. Provider credentials never belong in CLI arguments, shell history, or agent-readable environment variables.

## Sign in and select a workspace

```bash
oxagen login
oxagen device enroll
oxagen workspace list
oxagen workspace use ws_support
oxagen harness register codex --name local-codex
oxagen repo link . --repository support-app --target local-codex
oxagen agent use agent_refunds --mode support
oxagen status --json
```

Register the harness before linking the checkout; the harness stays unbound until the link exists. Running `oxagen` with no arguments prints these steps in order with a one-line status for each, and every access, wait, or unavailable exit prints the one command that continues.

Sign-in opens a protected browser or device flow. Enrollment needs the caller's right to register that device. Store Oxagen session credentials in the operating system's protected credential store. Workspace and agent choices request a context. The service must verify each choice and bind it to the real repo and run. A config file, `--workspace` flag, environment variable, or changed folder cannot grant access. A revoked or stale binding blocks new work.

A remote runner needs its own approved gateway service and workload identity. The local CLI cannot certify a remote host merely by naming it. Noninteractive jobs use an explicit service principal and narrow grant, not a copied human login or provider key.

## Submit and steer work

Keep new work separate from messages to an existing run:

```bash
oxagen work submit --target target_codex --prompt-file task.md --json
oxagen work status work_123 --json
oxagen run steer run_456 --message-file steering.md
oxagen run steer run_456 --message-file steering.md --interrupt
oxagen run pause run_456
oxagen run status run_456 --wait paused --timeout 30s --json
oxagen run resume run_456 --boundary pause_789
oxagen run stop run_456
oxagen work cancel work_123
oxagen device list
oxagen device revoke dev_789
```

`run stop` asks for a confirmed stop; the run cannot resume, and the reply says so: “Stopped. This run cannot resume. Send new work to continue.” `work cancel` withdraws a request that has not started, or becomes a stop request for each started run. Both exist because the design and the brand rules separate Stop from Pause; a surface without a Stop control is incomplete. `device list` and `device revoke` manage enrolled devices with the same rights as the web app.

Exit code 3 carries a `reason` in JSON. A budget block is `BUDGET_EXCEEDED` with `binding_scope`, the scope that stopped the call, and the amounts held and remaining, so a script can tell a budget stop from an access denial.

The service reads prompt files through approved local file scope and scans them before submission. File names, attachments, and messages cannot bypass the scan. Prefer files or protected local input over sensitive command-line text. Do not echo raw content in debug output.

A successful submit means the request was accepted. Each target later reports whether work actually started. Steering without `--interrupt` applies at the next eligible execution boundary. An interrupt requests a pause; it does not prove that the agent has stopped. A timeout leaves the operation's last known state visible. It never turns a pending pause into a confirmed one.

Resume requires the confirmed boundary and current rights. Late responses remain evidence until separately admitted. See [steering](ARP-design.md#5-send-work-and-steer-it-from-one-place) and [confirmed pauses](ARP-design.md#6-pause-only-when-the-stop-is-confirmed).

## Inspect tools, rules, and results

Provide these proposed command groups:

| Commands | Purpose |
|---|---|
| `oxagen tools list`, `oxagen tools explain` | Show the active tool belt and why a tool is allowed or blocked. Use the same scoped catalog as MCP. |
| `oxagen context query` | Retrieve permitted context with source links and versions. |
| `oxagen policies list`, `oxagen policies explain` | Show applicable rules and effective limits. |
| `oxagen policies validate`, `oxagen policies publish` | Check a proposed revision, then publish it only with the required rights and review. |
| `oxagen data-protection status`, `oxagen data-protection inspect` | Show local scanner coverage or inspect a local input without sending it. Report safe findings, not matched secrets. |
| `oxagen budget status` | Show spent, reserved, and remaining amounts for allowed scopes. |
| `oxagen run logs`, `oxagen report show` | Read cleaned events and required work reports from the tenant's store. |
| `oxagen access request`, `oxagen access approve` | Request a named grant or decide a permitted approval. |
| `oxagen fork plan`, `oxagen fork create` | Review a saved boundary and create an allowed continuation. |

Tool listing does not authorize every tool argument. A refund still needs record rights, policy checks, and shared reservations. Custom tools use the same [MCP service](ARP-MCP-spec.md) and protected tool gates; the CLI offers no direct credential shortcut.

Stop, force-continue, fork creation, access grants, and policy publication are explicit commands. No general `--allow-all`, `--skip-policy`, or raw-provider mode exists. Automation may submit a preapproved decision only when its service principal has that exact right. Approval cannot override a hard prohibition.

## Scripts, failures, and compatibility

`--json` writes versioned structured output to standard output. Progress belongs on standard error and contains only safe data. Logs and saved output contain cleaned records. Interactive and noninteractive modes use the same authorization path. A script needing human approval returns a pending operation ID; it cannot invent consent.

Proposed exit codes are `0` for the requested state reached, `2` for invalid input, `3` for access or policy denial, `4` for pending approval or wait timeout, `5` for unavailable service or unsupported capability, and `6` for an unknown external outcome. Without a wait flag, `0` confirms command acceptance only. JSON always names the actual state. Scripts must inspect it before assuming completion.

Changing commands accept a stable idempotency key and expected version. Retries reuse the same key only for unchanged input. Reconcile uncertain external effects first. Event follow mode resumes from scoped cursors, deduplicates event IDs, and reports gaps.

The CLI negotiates protocol and adapter capabilities at connection time. A stopped local service, expired rule set, incomplete scan, unavailable private store, or unsupported harness blocks strict work with a safe explanation. Updating the CLI must not silently weaken the service's controls.

## First-workspace contract

Follow the [first workspace and first run walkthrough](ARP-design.md#first-workspace-and-first-run). It connects the web setup, enrolled service, `.oxagen` repo files, scoped MCP route, and first recorded model call. The [sample-file guide](workspace-samples/README.md) includes exact JSON schemas, commands and receipt fields. These are proposed formats, not live configuration for today’s app.

## Repository setup commands


These additions complete the flow around the commands already specified:

| Command | Contract |
| --- | --- |
| `oxagen quickstart` | Run login, enrollment, workspace selection or creation, harness detection, checkout link, repo init and sync, validation, and one read-only smoke task as one flow with safe defaults. It uses the same gates as the separate commands and stops at the first step it cannot complete, naming that step and the command that continues it. It cannot weaken a control or raise a limit. |
| `oxagen doctor` | Check the local service, device enrollment, workspace binding, harness adapter, scanner coverage, model route, policy freshness, and clock skew. Print one line per check with pass, warn, or fail and the fix. `--json` returns the same list. |
| `oxagen repo link PATH --repository REF --target TARGET` | Establish a verified checkout binding; return binding ID and settings revision. |
| `oxagen harness register KIND --name NAME` | Register the enrolled installed version and adapter after capability checks; return an unbound target ID. Linking the checkout is required before launch. |
| `oxagen repo init --path PATH --agent REF --mode REF` | Export allowed references and schemas; refuse to overwrite changed files without a reviewed plan. |
| `oxagen repo sync --path PATH --plan` | Show safe source/config differences, missing rights, and expected versions without applying changes. |
| `oxagen repo sync --path PATH --apply` | Apply a fresh, authorized plan to protected state; return the sync receipt and loaded manifest IDs. |
| `oxagen harness configure TARGET --mcp oxagen` | Configure the tested adapter's scoped MCP route without storing a token in repo files. |
| `oxagen repo validate --path PATH --strict --json` | Check bindings, exact loaded versions, policies, routes, scanner, tool belt, and capability profile. Return preflight status only. |

Extend `work.submit` CLI options with `--config` and `--work-order`. Add `--wait started --timeout` to `work status`. Allow target scoping on `tools list`. `repo sync --apply` accepts the plan ID, expected config version, and an idempotency key for scripts; interactive use shows and confirms the same fresh plan. Reuse a key only for unchanged input. An approval step, if required by policy, produces a pending operation; it never grants itself consent.

