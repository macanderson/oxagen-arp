---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.sdk-is-a-kernel-client
record_id: rec_arp_sdk_is_a_kernel_client_ba6a167a24c4
record_hash: sha256:df67f2a8da26e6a6e3a729f10957815f5c6609b90df45d925b7cbfebf13243be
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-SDK-spec.md
steering:
  force: must
---

The SDK is a typed client over the kernel registry whose entry point is oxagen.register(agent).run(prompt); it carries no policy, every model and tool call it makes passes the desktop guard and model proxy, and a wrapper around opaque code is an observed integration, never strict.
