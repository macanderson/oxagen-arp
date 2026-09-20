import Link from "next/link";
import type { BudgetScope, RunSummary, WorkspaceSummary } from "@oxagen-arp/kernel";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Stat, usd } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RunStatePill } from "@/components/ui/status-pill";

// Workspace home: active work, blocked runs, spend, and what needs a person. Presentational: it
// takes data and renders; the page reads through the DataSource and hands values here, and so do
// the stories.
export function Home({ workspace, runs, budget, modelRouteCount }: { workspace: WorkspaceSummary; runs: RunSummary[]; budget: BudgetScope[]; modelRouteCount: number }) {
  const needsPerson = runs.filter((r) => ["blocked", "outcome_unknown", "waiting_for_device"].includes(r.state));
  const active = runs.filter((r) => ["running", "starting", "pausing", "pause_requested", "resuming"].includes(r.state));
  const tightest = [...budget].sort((a, b) => a.remaining.minor - b.remaining.minor)[0];
  if (modelRouteCount === 0) {
    return (
      <EmptyState
        title="No model route yet"
        body="Add a provider key to send work. The model proxy stores it; your device never sees it."
        action={<Link href="/policies/model-routes"><Button variant="primary">Add a model route</Button></Link>}
      />
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardTitle>Needs a person</CardTitle>
        {needsPerson.length === 0 ? (
          <p className="text-muted">Nothing is waiting on you.</p>
        ) : (
          <ul className="divide-y divide-line">
            {needsPerson.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
                <RunStatePill state={r.state} />
                <Link href={`/runs/${r.id}`} className="font-medium text-ink underline-offset-2 hover:underline">{r.title}</Link>
                <span className="text-sm text-muted">{r.stateReason}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardTitle>Spend, {workspace.name}</CardTitle>
        <div className="grid gap-2">
          {tightest ? <Stat label={`Tightest: ${tightest.label} (${tightest.period})`} value={usd(tightest.remaining.minor)} hint={`${usd(tightest.settled.minor)} settled · ${usd(tightest.held.minor)} held`} /> : null}
          <Link href="/spend" className="text-sm text-gold-text underline-offset-2 hover:underline">All scopes</Link>
        </div>
      </Card>
      <Card className="md:col-span-3">
        <CardTitle>Active work</CardTitle>
        {active.length === 0 ? (
          <EmptyState title="No active runs" body="Send work to start one." action={<Link href="/send"><Button variant="primary">Send work</Button></Link>} />
        ) : (
          <ul className="divide-y divide-line">
            {active.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
                <RunStatePill state={r.state} />
                <Link href={`/runs/${r.id}`} className="font-medium text-ink underline-offset-2 hover:underline">{r.title}</Link>
                <span className="text-sm text-muted">{r.agent.name} v{r.agent.version} · {r.target.harness === "claude_code" ? "Claude Code" : r.target.harness === "codex" ? "Codex" : "Custom"}</span>
                <span className="tabular ml-auto text-sm text-muted">{usd(r.spend.held.minor)} held</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
