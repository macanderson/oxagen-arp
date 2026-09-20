import type { BudgetScope, DeviceSummary, ModelRoute } from "@oxagen-arp/kernel";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Stat, usd } from "@/components/ui/card";

// Send work. The prompt field exists only when a desktop guard is paired: prompts are checked on the
// person's computer before they leave it. Unpaired is a designed state, not an error, and the rest
// of the form stays usable so the person can pick agent, work order and targets first.
export function SendWork({ routes, devices, budget, paired, action }: {
  routes: ModelRoute[]; devices: DeviceSummary[]; budget: BudgetScope[]; paired: boolean;
  action?: (formData: FormData) => void | Promise<void>;
}) {
  const targets = devices.filter((d) => d.status === "enrolled").flatMap((d) => d.targets.map((t) => ({ ...t, device: d.name, presence: d.presence })));
  const tightest = [...budget].sort((a, b) => a.remaining.minor - b.remaining.minor)[0];
  const noRoute = routes.length === 0;
  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardTitle>Work request</CardTitle>
        <label className="block text-sm text-muted" htmlFor="workOrderId">Work order</label>
        <select id="workOrderId" name="workOrderId" className="mt-1 w-full rounded-xl border border-line bg-canvas p-2 text-body" defaultValue="wo_firstdocscheck">
          <option value="wo_firstdocscheck">First docs check · read only · $20 cap</option>
          <option value="wo_loginbug">Fix the login bug · writes allowed · $20 cap</option>
        </select>
        <fieldset className="mt-4">
          <legend className="text-sm text-muted">Targets</legend>
          {targets.length === 0 ? <p className="mt-1 text-body">No enrolled harness yet. Enroll a device and register a harness first.</p> : null}
          {targets.map((t) => (
            <label key={t.id} className="mt-2 flex items-center gap-2 text-body">
              <input type="checkbox" name="targetId" value={t.id} defaultChecked={t.presence === "online"} className="size-4" />
              {t.harness === "claude_code" ? "Claude Code" : t.harness === "codex" ? "Codex" : "Custom"} on {t.device}
              <span className="text-sm text-muted">· {t.controlLevel} · {t.presence}</span>
            </label>
          ))}
        </fieldset>
        {paired ? (
          <>
            <label className="mt-4 block text-sm text-muted" htmlFor="prompt">Prompt (checked on this computer before it leaves)</label>
            <textarea id="prompt" name="prompt" rows={4} required className="mt-1 w-full rounded-xl border border-line bg-canvas p-3 text-body" defaultValue="Read docs/start.md and report the test command it names. Do not change files." />
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-line p-4">
            <h3 className="font-semibold text-ink">Prompts are checked on your computer before they leave it.</h3>
            <p className="mt-1 text-body">Open Oxagen desktop and choose <strong>Pair browser</strong>, then enter this code.</p>
            <p className="tabular mt-2 font-mono text-2xl text-ink">482 913</p>
            <a href="#" className="mt-2 inline-block text-sm text-gold-text underline-offset-2 hover:underline">Not installed? Download</a>
          </div>
        )}
        <div className="mt-4">
          <Button type="submit" variant="primary" disabled={noRoute || !paired || targets.length === 0}>Send work</Button>
          {noRoute ? <p className="mt-2 text-sm text-denied">No model route yet. Add a provider key to send work.</p> : null}
        </div>
      </Card>
      <Card>
        <CardTitle>Before you send</CardTitle>
        <div className="grid gap-2">
          <Stat label="Model route" value={noRoute ? "None" : `${routes[0]?.provider} · ${routes[0]?.model}`} />
          {tightest ? <Stat label={`Tightest budget: ${tightest.label}`} value={usd(tightest.remaining.minor)} hint={`of ${usd(tightest.cap.minor)} ${tightest.period.toLowerCase()}`} /> : null}
          <Stat label="Local scan" value={paired ? "Ready" : "Not paired"} hint="Block secrets · replace personal data" />
        </div>
        <p className="mt-3 text-sm text-muted">Accepting a request is not a start. Each target reports when its run actually started.</p>
      </Card>
    </form>
  );
}
