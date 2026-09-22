---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.parity-gate-strict-in-ci
record_id: rec_arp_parity_gate_strict_in_ci_1f73af4dab96
record_hash: sha256:56e638397850ce6d6462a432269c8a74fb49b43dd944f4fd9de06f1d336dce1b
kind: procedure
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: .github/workflows/parity.yml
steering:
  force: must
---

Run pnpm check:parity:strict before committing any change under packages/kernel or apps; the Surfaces workflow runs it with typecheck, tests, the app build, and the Storybook build on every pull request.
