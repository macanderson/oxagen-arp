"use client";
import { useTransition } from "react";
import type { Finding, UsageBucket } from "@oxagen-arp/kernel";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, usd } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { Table, Td, Th } from "@/components/ui/table";

// Operator coaching (ARP-Performance-spec.md). Every card names the observed facts, the proposed change,
// the tradeoff, the price basis, and an estimated range that may be negative. Estimates sit apart from
// measured reductions. Overlapping findings share a group and their savings are never summed.
export type FindingCommands = { respond: (findingId: string, disposition: "accepted" | "dismissed" | "proposed_change", reason?: string) => Promise<unknown> };

const tokens = (n: number | null) => (n === null ? "unknown" : n.toLocaleString("en-US"));
const range = (f: Finding) => f.estimatedSavingMinor ? `${usd(f.estimatedSavingMinor.low)} to ${usd(f.estimatedSavingMinor.high)}` : "too little evidence to estimate";
const severityTone = { info: "pending", advice: "approval", warning: "urgent", violation: "denied" } as const;

export function Coaching({ usage, excludedRequests, findings, measured, commands }: {
  usage: UsageBucket[]; excludedRequests: number; findings: Finding[];
  measured: { comparisonId: string; label: string; sampleSize: number; reduction: { minor: number } }[];
  commands: FindingCommands;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle>Tokens and cache by agent</CardTitle>
        <Table>
          <thead><tr><Th>Agent</Th><Th className="text-right">Requests</Th><Th className="text-right">Input</Th><Th className="text-right">Cache read</Th><Th className="text-right">Cache write</Th><Th className="text-right">Output</Th><Th className="text-right">Token reuse</Th><Th className="text-right">Settled</Th><Th>Basis</Th></tr></thead>
          <tbody>
            {usage.map((b) => (
              <tr key={b.key}>
                <Td className="font-medium text-ink">{b.label}{b.requestsWithUnknownUsage > 0 ? <div className="text-sm text-muted">{b.requestsWithUnknownUsage} requests with unknown usage</div> : null}</Td>
                <Td className="tabular text-right">{b.requests}</Td>
                <Td className="tabular text-right">{tokens(b.inputTokens)}</Td>
                <Td className="tabular text-right">{tokens(b.cacheReadTokens)}</Td>
                <Td className="tabular text-right">{tokens(b.cacheWriteTokens)}</Td>
                <Td className="tabular text-right">{tokens(b.outputTokens)}</Td>
                <Td className="tabular text-right">{b.tokenReuseRate === null ? "not available" : `${Math.round(b.tokenReuseRate * 100)}%`}</Td>
                <Td className="tabular text-right">{usd(b.settled.minor)}</Td>
                <Td className="text-sm text-muted">{b.basis.replace("_", " ")}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-2 text-sm text-muted">Token reuse is known cache-read tokens over matching known input tokens; token counts are summed before dividing. {excludedRequests} requests with unknown usage are excluded. Tokens and dollars are separate measures; fewer tokens do not always mean a lower bill.</p>
      </Card>

      <Card>
        <CardTitle>Measured reductions</CardTitle>
        {measured.length === 0 ? <p className="text-muted">No comparison has run yet. A measured reduction needs matched runs and their own budget.</p> : (
          <ul className="divide-y divide-line">
            {measured.map((m) => (
              <li key={m.comparisonId} className="flex flex-wrap items-center gap-3 py-2">
                <StatusPill tone="verified" label="Measured" />
                <span className="text-body">{m.label}</span>
                <span className="tabular ml-auto font-medium text-ink">{usd(m.reduction.minor)} less</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <section aria-labelledby="findings-heading">
        <h2 id="findings-heading" className="mb-3 text-xl font-semibold">Suggestions from recorded work</h2>
        {findings.length === 0 ? <EmptyState title="Nothing to suggest yet" body="Coaching reads cleaned records after runs complete. Send work and come back." /> : null}
        <div className="grid gap-3">
          {findings.map((f) => (
            <Card key={f.id}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={severityTone[f.severity]} label={f.severity === "advice" ? "Advice" : f.severity === "warning" ? "Warning" : f.severity === "violation" ? "Violation" : "Info"} />
                <StatusPill tone={f.classification === "observed" ? "verified" : "pending"} label={f.classification === "observed" ? "Observed" : f.classification === "inferred" ? "Inferred" : "Incomplete"} />
                <h3 className="text-lg font-semibold">{f.title}</h3>
                {f.status !== "open" ? <span className="ml-auto text-sm text-muted">{f.status.replace("_", " ")}</span> : null}
              </div>
              <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <div><dt className="text-muted">What was observed</dt><dd className="text-body">{f.observed}</dd></div>
                <div><dt className="text-muted">Change to try</dt><dd className="text-body">{f.proposedChange}</dd></div>
                {f.tradeoff ? <div><dt className="text-muted">Tradeoff</dt><dd className="text-body">{f.tradeoff}</dd></div> : null}
                <div>
                  <dt className="text-muted">Estimated saving on the affected calls</dt>
                  <dd className="tabular text-body">{range(f)}</dd>
                  <dd className="text-muted">{f.priceBasis}{f.overlapGroup ? " · overlaps another suggestion; savings are not added together" : ""}</dd>
                </div>
              </dl>
              {f.assumptions.length > 0 ? <p className="mt-2 text-sm text-muted">Assumes: {f.assumptions.join("; ")}. Coverage {f.coverage}{f.confidence !== null ? `, confidence ${Math.round(f.confidence * 100)}%` : ""}.</p> : null}
              <p className="mt-1 text-sm text-muted">Evidence: {f.evidence.map((e) => e.readable ? `${e.kind.replace("_", " ")} ${e.ref}` : `${e.kind.replace("_", " ")} (not readable by you)`).join(", ")}. Opening evidence never reruns work.</p>
              {f.status === "open" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" disabled={pending} onClick={() => start(async () => { await commands.respond(f.id, "accepted"); })}>Use on the next run</Button>
                  <Button size="sm" disabled={pending} onClick={() => start(async () => { await commands.respond(f.id, "proposed_change"); })}>Draft a rule</Button>
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(async () => { await commands.respond(f.id, "dismissed", "Not applicable"); })}>Dismiss with a reason</Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">Advice changes nothing on its own. Using a suggestion, drafting a rule, or running a live comparison goes through the normal publication, access, and budget checks.</p>
      </section>
    </div>
  );
}
