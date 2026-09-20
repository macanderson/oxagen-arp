# Oxagen brand specification

This is a proposed brand system for the product described here. The supplied Oxagen mark, fonts, and base colors are retained. The product wording, UI rules, and status uses below are design decisions for this proposal. They are not claims about a shipped app or a certification.

## Purpose and audience

Oxagen is mission control for people who run and oversee agents. Its proposed job is to give those agents clear identities, tools, context, and limits, then keep a useful record of their work. Use this plain description before terms such as agent control plane.

Operators need to know what is running and what needs them. Team supervisors need to see shared spend, results, and blocked work. Security and platform teams need clear access rules and proof of which controls applied. Partners need a stable contract. A screen should help one of these people make a clear choice.

Do not imply that an observed run is enforced. Do not call a request complete because it was queued. Do not claim perfect secret detection, safe behavior, savings, or SOC 2 certification without the right evidence. Mark proposed and future features where they appear.

## Names and words

Use **Oxagen** in prose. Keep the supplied **oxagen** wordmark lowercase. Do not redraw, stretch, recolor individual parts, or replace it with a typed name.

| Name | Meaning |
|---|---|
| Org | The customer account. The noun is org, the schema is `org`, the table is `org.organizations`, and identifiers use `org_id`. Where older prose says company or customer, it means the org. |
| Workspace | A named scope for people, agents, repos, rules, and records inside an organization. |
| Policies | Reusable rules set by the organization. |
| Permissions & limits | What an agent may do, and the bounds on those actions. |
| Work order | A saved, reusable assignment record with scope and any tighter limits. |
| Work request | One submission of a work order to one or more targets. It is not a run. |
| Run | One execution of a work request on one target. |
| Governed action | One action checked and controlled by Oxagen. |
| Operator | A person who runs agents. |
| Team supervisor | A person who oversees operators. This is the only use of the word supervisor. |
| Desktop guard | The protected local service that guards a run on a device. Older prose says local Supervisor, local guard, protected service, or desktop gateway; use desktop guard. |
| Browser pairing | The authenticated link between a browser and the desktop guard on the same computer. Older prose says local bridge. |
| Model proxy | The org-side gateway that checks model calls and holds provider keys. Older prose says model gateway. |
| Persona | The named agent definition and version an agent runs as, such as Support builder v12. A mode narrows it, such as code or review. |
| Role | A set of rights in access control. Never use role for a persona or a job. |
| Tool belt | The tools available to an agent in its current context. Two words in prose, `tool_belt` in identifiers. |
| Knowledge graph | A map of related records, with sources, versions, and access rules. |

Do not use assignment, job, or task as user-facing nouns for work; use work order, work request, or run. Run and target states share one vocabulary on every surface: queued, waiting for a device, waiting for capacity, starting, started, running, pause requested, pausing, paused, resuming, blocked, expired, cancelled, stopped, and outcome unknown. Governed action states are proposed, approval needed, allowed, sent, running, completed, failed, denied, expired, cancelled, and outcome unknown. The API and schema enums map to these labels one to one; no surface adds a synonym.

Keep internal approval tokens out of normal product choices. Show a policy reason or an approval request instead. Technical references may use exact protocol and database names.

## Voice and decision messages

Write in short, direct sentences. Name the actor and the action. Use sentence case for headings. Explain a new term before using it. Avoid slogans, vague claims, and fear. A status message should say what happened, why, and what can happen next.

| Situation | Example copy |
|---|---|
| Refund blocked | “This refund exceeds the customer’s daily limit. $25 remains.” |
| Approval needed | “A $40 exception needs approval from the workspace approver.” |
| Pause pending | “Pausing. One tool is still running.” |
| Pause confirmed | “Paused at step 42. New work is blocked.” |
| Local scan failed | “This file could not be checked. Nothing was uploaded.” |
| Unknown refund result | “The payment service has not confirmed the refund. Its allowance is still held.” |
| Stale report | “CI status was last checked at 14:32 UTC.” |

Show only reasons and amounts the viewer may read. Never quote a removed secret in an error. “Allowed” means the rules allowed the action. It does not mean the action was harmless or that it finished.

## Visual identity

Use a calm layout with clear type, space, and strong labels. Dark mode uses obsidian. Light mode uses white. Gold identifies Oxagen and draws limited attention. It never means passed, allowed, failed, or safe.

The reader’s gold scroll line and code accents are deliberate uses requested for this artifact. Product screens should usually have one gold primary action. Keep large backgrounds neutral. Avoid gradients behind dense records and diagrams.

The mark and base system come from the supplied [Oxagen brand kit](https://github.com/macanderson/oxagen-brand/tree/fb62b40b38050a5aa7b717eb30039f0ea226291b). Keep at least one hive-width of clear space around a standalone mark. Treat that spacing and the UI rules here as proposed usage guidance.

## Typography

| Role | Font | Size and weight |
|---|---|---|
| Product page title | Space Grotesk | 30px / 700; 1.15 line height |
| Section heading | Space Grotesk | 24px / 600; 1.2 line height |
| Subheading | Space Grotesk | 20px / 600; 1.3 line height |
| App body and forms | Geist | 16px / 400; 1.5 line height |
| Dense tables and labels | Geist | 14px / 400 or 500; 1.5 line height |
| Document body | Geist | 18px / 400; 1.65 line height |
| Code, IDs, paths, amounts | Monaspace Neon | 13–14px / 400; 1.6 line height |

Use tabular numbers for amounts. Align money at the decimal point. Long IDs may wrap or offer a copy action; never hide the full value needed to verify a record. Font fallbacks must work without a network. Keep the font licenses in distributed assets.

**Heading sample:** Governed work. Clear records.



**Body sample:** The workspace rules apply to every governed action.



**Code sample:** state: pausing · held: USD 25.00

## Base colors

| Role | Dark mode | Light mode |
|---|---|---|
| Canvas | `#09090B` | `#FFFFFF` |
| Panel | `#18181B` | `#FFFFFF` |
| Raised row | `#27272A` | `#F4F4F5` |
| Main text | `#FFFFFF` | `#09090B` |
| Body text | `#E4E4E7` | `#27272A` |
| Secondary text | `#A1A1AA` | `#62626B` |
| Quiet divider | `#27272A` | `#E4E4E7` |
| Brand gold | `#D4AF37` | `#D4AF37` as decoration |
| Gold text accent | `#F1CE65` | `#8A7223` |

Quiet dividers are decorative. They must not be the only visible boundary of an input or control. Use text, shape, and a stronger outline where the boundary carries meaning. Check contrast against the actual surface, including panels and hover states.

## Status colors and shapes

Every state needs a word and an icon or shape. Color is a second cue. This proposal uses the kit’s colors with the following meanings. Failed text uses the lighter destructive red on dark surfaces for readable small text.

| State | Dark text | Light text | Required cue |
|---|---|---|---|
| Allowed | `#57A97C` | `#2F7D52` | Check icon and “Allowed” |
| Needs approval | `#5B93D6` | `#2E6BA8` | Person icon and “Approval needed” |
| Denied | `#D98A6C` | `#9B4526` | Stop icon and “Denied” |
| Failed | `#E8776D` | `#992F28` | Cross icon and a named failed check |
| Urgent attention | `#E86A80` | `#AE2540` | Alert icon and a plain reason |
| Verified receipt | `#3FA2A2` | `#1F7676` | Receipt icon and the exact claim checked |
| Queued, pending, unknown | `#A1A1AA` | `#62626B` | Distinct label; dashed border for pending |
| Paused or held | Main text | Main text | Double border and the exact held state |

A verified receipt is not proof that all work is correct. Completion needs the shared completion rules. Keep “pausing” and “paused” distinct. Unknown is not failure, and stale is not current.

These status text pairs were calculated above 4.5:1 on every named surface in their theme: canvas, panel, and raised row. The 2026-09-20 review found the earlier dark Denied, Failed, and Urgent values below 4.5:1 on raised rows, where status text most often sits, and replaced them. The light gold text accent is 4.23:1 on a light raised row, so gold text may not sit on a raised row in light mode. Recheck each real use. WCAG’s normal-text minimum is 4.5:1; large text has a separate 3:1 threshold. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

## Layout and components

Use a 4px spacing unit, with 8, 12, 16, 24, 32, and 48px steps. Cards use a 12px radius. Reading pages use a 1120px maximum width and a narrower text column. Dense work views may be wider. Do not force a long table into tiny type.

Buttons need clear verbs. Separate Stop from Pause. Show confirmation only when the action needs it; the dialog must name the affected scope. Approval cards show the exact proposed action, policy, amount, expiry, and approver. Rules show draft, published, and active-on-target states separately.

Use keyboard focus rings with at least a 2px visible outline and clear space around it. Design primary touch controls at least 44px high. Check pointer targets against WCAG’s 24px minimum and its spacing exceptions. Do not rely on hover for essential facts. [W3C target guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

Dialogs have a title, close control, focus handling, and Escape support. Drawings open full screen and offer zoom, fit, pan, and a text description. Respect reduced motion. Tables name their columns and explain freshness. Screen readers must hear updates without being flooded by every stream chunk.

## Apply it across the product

| Surface | Use of the system |
|---|---|
| [Desktop](ARP-Desktop-app-spec.md) | Plain device and guard status; local scan previews never upload originals. |
| [Web](ARP-Web-app-spec.md) | Clear scope, effective limits, remaining amounts, action reasons, and record freshness. |
| [API](ARP-API-spec.md) | Stable field names, safe error codes, plain messages, and machine-readable status. |
| [MCP](ARP-MCP-spec.md) | Clear tool descriptions, exact scope, safe errors, and no hidden authority in prose. |
| [CLI](ARP-CLI-spec.md) | Readable text by default, JSON for scripts, no color-only meaning, and `NO_COLOR` support. |

Keep one versioned token package and one term list for all surfaces. Review changes with sample screens in both themes, keyboard and zoom checks, and plain-message examples. Brand approval never changes an IAM grant or a policy decision.
