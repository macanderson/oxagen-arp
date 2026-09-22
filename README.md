# Oxagen ARP document pack

Open **Oxagen-ARP.html** in a browser. Reading, search, themes, code colors, and diagram zoom work offline. **Oxagen-ARP-TLDR.html** starts with the Short guide.

## Read and export

The top navigation has four items, in order: **Design**, **Short guide**, **Drawings**, and **Specs**. Specs opens Desktop app, Web app, API, MCP, CLI, Brand, Schema, and Build plan. Plugin capabilities are part of Design under ARP. There is no separate plugin protocol or prose-audit page.

**Save Markdown** exports the complete current view, including its tables and fenced code. **Full ZIP** saves the full ZIP when the archive sits beside the reader. Keep this folder together for linked API, SQL and sample files. Each HTML reader contains its document text, drawings, fonts and search code, but supporting file downloads still need those files.

Search with the Search button, `/`, or Cmd/Ctrl+K. Open a drawing for full-screen viewing. Use + or − to zoom, drag to pan, 0 or Fit to reset, and Esc to close. Each drawing can be saved as SVG. The theme button switches light and dark. Print this view prints the open document.

## Documents

- [Design](ARP-design.md): the shared architecture, governed actions, local protection, IAM, limits, records, graph and plugin capabilities.
- [Short guide](ARP-short-guide.md): basic concepts and the first-workspace journey.
- [Drawings](ARP-Drawings.md): captions, text descriptions and relative SVG links.
- [Desktop app](ARP-Desktop-app-spec.md): local setup, protected service and data checks.
- [Web app](ARP-Web-app-spec.md): mission control and workspace administration.
- [API](ARP-API-spec.md): programmatic contracts and endpoint documentation.
- [MCP](ARP-MCP-spec.md): each agent's allowed tool belt and context.
- [CLI](ARP-CLI-spec.md): proposed commands through the same gates.
- [Brand](ARP-Brand-spec.md): words, fonts, colors and component rules.
- [Schema](ARP-Schema-spec.md): concrete table catalog, constraints, isolation and operations.
- [Core SQL](ARP-core-schema.sql): representative subset, not the full production migration.
- [Build plan](ARP-Build-plan.md): prebuild certification, batches, independent review and release gates.
- [SDK](ARP-SDK-spec.md): register and run custom agents through the same gates, with loop diagnostics.
- [Usage and performance](ARP-Performance-spec.md): token and cache accounting, operator coaching, and cost savings that are estimates until measured.
- [Audit](AUDIT.md): the 2026-09-20 adversarial review, what was executed, what changed, and what is still open.

## Working code

The pack now carries a pnpm workspace that mirrors the macanderson/oxagen kernel-and-invoke pattern. Run `pnpm install`, then:

| Command | What it does |
|---|---|
| `pnpm --filter @oxagen-arp/web dev` | The mockup app: Next.js App Router, base-ui, Tailwind 4, shadcn-style kit, on fixture data. |
| `pnpm storybook` | Every screen state as a story, reading the same fixtures. |
| `pnpm --filter @oxagen-arp/api dev` | The REST binder: one generic dispatch route over the capability registry. |
| `pnpm --filter @oxagen-arp/mcp dev` | The MCP binder: `tools/list` and `tools/call` derived from the registry. |
| `pnpm --filter @oxagen-arp/cli dev -- run list --json` | The CLI binder: commands derived from the registry. |
| `pnpm test` and `pnpm typecheck` | Kernel, fixture, binder, and data-seam tests. |
| `pnpm check:parity:strict` | Every declared surface is served and no per-capability wrapper file exists. |

`packages/kernel` holds the capability contracts and `invoke()`; `packages/fixtures` is the only place fake data lives, and every fixture validates against its contract. `apps/web/src/data` is the seam: `ports.ts` lists the reads a page may make, `fixtures.ts` and `live.ts` implement it, and `source.ts` picks one from `OXAGEN_DATA_SOURCE`. Wiring the product means installing live handlers and flipping that variable; pages, stories, and ports do not change.

`.oxagen/` holds the workspace binding and 70 context records in the product's `context-record/v0.2` format (frontmatter markdown, one `.oxagen/rules/<lineage>.md` per record), the steering a builder needs when turning these plans into code. The customer account is an org (`org_id`) throughout the schema, the API, and the prose; the schema is `org` and the table is `org.organizations`.

`diagrams/` contains the 18 portable SVGs with embedded fonts. `diagram-source/` contains the original SVG source and captions. `reference/` holds the detailed ARP reference. `licenses/` contains font and code-highlighter licenses. Supporting API contracts, workspace examples and build-system files are included when referenced by the current specs. `SHA256SUMS.txt` covers every packaged file.

## Status

The product architecture is a greenfield proposal. It does not claim these Oxagen features are shipped. The build system documents its own tested scope separately. Product mockups and contracts require explicit certification before product implementation. No live product build or production deployment was performed for this document. The representative PostgreSQL SQL was executed on PostgreSQL 16 during the 2026-09-20 adversarial review; see [AUDIT.md](AUDIT.md) for what was tested and what changed. The HTML readers embed the document text as it stood before that review and have not been regenerated; the Markdown files are current.

## Brand source

The supplied hive, wordmark, colors and fonts come from `macanderson/oxagen-brand`, commit `fb62b40b38050a5aa7b717eb30039f0ea226291b`. The fonts are Space Grotesk, Geist, and Monaspace Neon. Product usage guidance is proposed. The source brand repository was not modified.
