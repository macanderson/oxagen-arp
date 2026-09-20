import type { ModelRoute } from "@oxagen-arp/kernel";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Table, Td, Th } from "@/components/ui/table";

// Policies → Model routes: the first setup step. The model proxy stores the key; the device never
// sees it. This is the step the reviewed walkthrough was missing.
export function ModelRoutes({ routes }: { routes: ModelRoute[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2">
        {routes.length === 0 ? (
          <Card><CardTitle>No model route yet</CardTitle><p className="text-body">Add a provider key to send work. Until then, Send work is disabled.</p></Card>
        ) : (
          <Table>
            <thead><tr><Th>Provider</Th><Th>Model</Th><Th>Placement</Th><Th>Status</Th></tr></thead>
            <tbody>{routes.map((r) => (
              <tr key={r.id}><Td className="font-medium text-ink">{r.provider === "oxagen_managed" ? "Oxagen managed" : r.provider}</Td><Td className="font-mono text-sm">{r.model}</Td><Td>{r.placement}</Td>
                <Td><StatusPill tone={r.status === "active" ? "allowed" : r.status === "unhealthy" ? "urgent" : "pending"} label={r.status === "active" ? "Active" : r.status === "unhealthy" ? "Unhealthy" : "Disabled"} /></Td></tr>
            ))}</tbody>
          </Table>
        )}
      </div>
      <Card>
        <CardTitle>Add a model route</CardTitle>
        <form className="grid gap-2">
          <label className="text-sm text-muted" htmlFor="provider">Provider</label>
          <select id="provider" className="rounded-xl border border-line bg-canvas p-2 text-body"><option>Anthropic</option><option>OpenAI</option><option>Oxagen managed</option></select>
          <label className="text-sm text-muted" htmlFor="key">Provider key</label>
          <input id="key" type="password" autoComplete="off" className="rounded-xl border border-line bg-canvas p-2 text-body" placeholder="Stored by the model proxy, never on a device" />
          <Button variant="primary" type="button" className="mt-2">Add route</Button>
          <p className="text-sm text-muted">Keys are held by the model proxy. Agents, repo files, and this browser never receive them.</p>
        </form>
      </Card>
    </div>
  );
}
