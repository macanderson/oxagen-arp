"use client";
import Link from "next/link";
import { useTransition } from "react";
import type { RunSummary } from "@oxagen-arp/kernel";
import { usd } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PresencePill, RunStatePill } from "@/components/ui/status-pill";
import { Freshness, Table, Td, Th } from "@/components/ui/table";

const harnessName = { codex: "Codex", claude_code: "Claude Code", custom: "Custom" } as const;

/** Only a run that has not started can be withdrawn. A started run is stopped from its own page. */
const notStarted = ["queued", "waiting_for_device", "waiting_for_capacity"];

export function RunsTable({ runs, checkedAt, cancel }: { runs: RunSummary[]; checkedAt: string; cancel?: (workRequestId: string) => Promise<unknown> }) {
  const [, start] = useTransition();
  if (runs.length === 0) {
    return <EmptyState title="No runs yet" body="Send work to start the first one." action={<Link href="/send"><Button variant="primary">Send work</Button></Link>} />;
  }
  return (
    <>
      <Table>
        <thead>
          <tr><Th>Run</Th><Th>State</Th><Th>Agent</Th><Th>Target</Th><Th className="text-right">Held</Th><Th className="text-right">Remaining</Th><Th></Th></tr>
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
              <Td>{notStarted.includes(r.state) && cancel ? (
                <ConfirmDialog
                  trigger="Cancel"
                  destructive
                  title={`Withdraw “${r.title}”?`}
                  body={`This withdraws work request ${r.workRequestId} on every target it queued. Held money is released. Send the work again to retry.`}
                  confirmLabel="Withdraw the request"
                  onConfirm={() => start(async () => { await cancel(r.workRequestId); })}
                />
              ) : null}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Freshness at={checkedAt} />
    </>
  );
}
