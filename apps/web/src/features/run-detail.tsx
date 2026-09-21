"use client";
import { useState, useTransition } from "react";
import type { RunEvent, RunSummary } from "@oxagen-arp/kernel";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Stat, usd } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RunStatePill } from "@/components/ui/status-pill";

export type RunCommands = {
  pause: (runId: string) => Promise<unknown>;
  resume: (runId: string, pauseBoundaryId: string) => Promise<unknown>;
  stop: (runId: string) => Promise<unknown>;
  steer: (runId: string, message: string, interrupt: boolean) => Promise<unknown>;
};

const announce = (text: string) => {
  const el = typeof document === "undefined" ? null : document.getElementById("live-polite");
  if (el) el.textContent = text;
};

// Run detail: state with proof language, pause and stop as separate controls, steering with and
// without interrupt, evidence-only events with redaction marked. Commands come in as props so the
// story can render every state without a server.
export function RunDetail({ run, events, pauseBoundaryId, commands }: { run: RunSummary; events: RunEvent[]; pauseBoundaryId: string | null; commands: RunCommands }) {
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const canPause = ["running", "starting", "resuming"].includes(run.state);
  const canResume = run.state === "paused" && pauseBoundaryId !== null;
  const canStop = !["stopped", "completed", "cancelled", "expired", "stopping"].includes(run.state);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <RunStatePill state={run.state} />
          {run.stateReason ? <span className="text-body">{run.stateReason}</span> : null}
        </div>
        <p className="mt-2 text-sm text-muted">
          {run.state === "pausing" ? "Paused shows only after the desktop guard saves proof of the stop." : null}
          {run.state === "paused" ? `Paused at saved point ${pauseBoundaryId ?? ""}. New work is blocked.` : null}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {canPause ? <Button onClick={() => start(async () => { await commands.pause(run.id); announce("Pause requested."); })} disabled={pending}>Request pause</Button> : null}
          {canResume ? <Button variant="primary" onClick={() => start(async () => { await commands.resume(run.id, pauseBoundaryId ?? ""); announce("Resuming."); })} disabled={pending}>Resume</Button> : null}
          {canStop ? (
            <ConfirmDialog
              trigger="Stop"
              destructive
              title={`Stop “${run.title}”?`}
              body="This run cannot resume. Its evidence stays. Send new work to continue."
              confirmLabel="Stop this run"
              onConfirm={async () => { await commands.stop(run.id); announce("Stopped. This run cannot resume."); }}
            />
          ) : null}
        </div>
        <CardTitle className="mt-6">Steer</CardTitle>
        <label className="block text-sm text-muted" htmlFor="steer">Direction for the next boundary</label>
        <textarea id="steer" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-line bg-canvas p-3 text-body" placeholder="Focus on the login bug. Leave the payment code alone." />
        <div className="mt-2 flex gap-2">
          <Button variant="primary" disabled={pending || message.trim().length === 0} onClick={() => start(async () => { await commands.steer(run.id, message, false); announce("Steering delivered for the next boundary."); setMessage(""); })}>Steer at next boundary</Button>
          <Button disabled={pending || message.trim().length === 0} onClick={() => start(async () => { await commands.steer(run.id, message, true); announce("Interrupt requested; steering applies after a confirmed pause."); setMessage(""); })}>Interrupt and steer</Button>
        </div>
        <p className="mt-2 text-sm text-muted">“Delivered” means the message reached a model request. It does not mean the model obeyed it.</p>
      </Card>
      <Card>
        <CardTitle>Spend</CardTitle>
        <div className="grid gap-2">
          <Stat label="Settled" value={usd(run.spend.settled.minor)} />
          <Stat label="Held for work in flight" value={usd(run.spend.held.minor)} />
          <Stat label={`Remaining (${run.spend.bindingScope})`} value={usd(run.spend.remaining.minor)} />
        </div>
      </Card>
      <Card className="md:col-span-3">
        <CardTitle>Events</CardTitle>
        <ol className="divide-y divide-line">
          {events.map((e) => (
            <li key={e.seq} className="flex flex-wrap gap-3 py-2 text-sm">
              <span className="tabular w-28 text-muted">{new Date(e.at).toISOString().slice(11, 19)} UTC</span>
              <span className="w-28 font-medium text-ink">{e.kind.replace("_", " ")}</span>
              <span className="text-body">{e.summary}</span>
              {e.redacted ? <span className="text-muted">(data protection removed content)</span> : null}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
