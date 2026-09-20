import type { BudgetScope } from "@oxagen-arp/kernel";
import { usd } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

// Spend: settled, held, remaining, per scope, with the binding scope named. Every applicable scope
// must allow a call; the tightest one is what a budget block names.
export function Spend({ scopes, tightest }: { scopes: BudgetScope[]; tightest: string }) {
  return (
    <Table>
      <thead><tr><Th>Scope</Th><Th>Period</Th><Th className="text-right">Cap</Th><Th className="text-right">Settled</Th><Th className="text-right">Held</Th><Th className="text-right">Remaining</Th></tr></thead>
      <tbody>
        {scopes.map((s) => (
          <tr key={`${s.scope}-${s.label}`} className={s.scope === tightest ? "bg-raised" : undefined}>
            <Td><span className="font-medium text-ink">{s.label}</span><div className="text-sm text-muted">{s.scope.replace("_", " ")}{s.scope === tightest ? " · binds next call" : ""}</div></Td>
            <Td>{s.period}</Td>
            <Td className="tabular text-right">{usd(s.cap.minor)}</Td>
            <Td className="tabular text-right">{usd(s.settled.minor)}</Td>
            <Td className="tabular text-right">{usd(s.held.minor)}</Td>
            <Td className="tabular text-right font-medium text-ink">{usd(s.remaining.minor)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
