import Link from "next/link";
import type { RunSummary } from "@oxagen-arp/kernel";
import { usd } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PresencePill, RunStatePill } from "@/components/ui/status-pill";
import { Freshness, Table, Td, Th } from "@/components/ui/table";

const harnessName = { codex: "Codex", claude_code: "Claude Code", custom: "Custom" } as const;

export function RunsTable({ runs, checkedAt }: { runs: RunSummary[]; checkedAt: string }) {
  if (runs.length === 0) {
    return <EmptyState title="No runs yet" body="Send work to start the first one." action={<Link href="/send"><Button variant="primary">Send work</Button></Link>} />;
  }
  return (
    <>
      <Table>
        <thead>
          <tr><Th>Run</Th><Th>State</Th><Th>Agent</Th><Th>Target</Th><Th className="text-right">Held</Th><Th className="text-right">Remaining</Th></tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id}>
              <Td><Link href={`/runs/${r.id}`} className="font-medium text-ink underline-offset-2 hover:underline">{r.title}</Link><div className="text-sm text-muted">{r.stateReason}</div></Td>
              <Td><RunStatePill state={r.state} /></Td>
              <Td>{r.agent.name} <span className="text-muted">v{r.agent.version}</span></Td>
              <Td><div className="flex items-center gap-2">{harnessName[r.target.harness]} <PresencePill presence={r.target.presence} /></div></Td>
              <Td className="tabular text-right">{usd(r.spend.held.minor)}</Td>
              <Td className="tabular text-right">{usd(r.spend.remaining.minor)}<div className="text-sm text-muted">{r.spend.bindingScope}</div></Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Freshness at={checkedAt} />
    </>
  );
}
