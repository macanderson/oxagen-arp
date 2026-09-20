"use client";
import { useTransition } from "react";
import type { DeviceSummary } from "@oxagen-arp/kernel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PresencePill, StatusPill } from "@/components/ui/status-pill";
import { Table, Td, Th } from "@/components/ui/table";

const platform = { macos: "macOS", windows: "Windows", linux: "Linux", remote: "Remote" } as const;

export function Devices({ devices, revoke }: { devices: DeviceSummary[]; revoke?: (deviceId: string) => Promise<unknown> }) {
  const [, start] = useTransition();
  if (devices.length === 0) return <EmptyState title="No devices enrolled" body="Install the desktop app and run oxagen device enroll. The desktop guard keeps its keys outside any checkout." />;
  return (
    <Table>
      <thead><tr><Th>Device</Th><Th>Status</Th><Th>Presence</Th><Th>Harnesses</Th><Th>Last seen</Th><Th></Th></tr></thead>
      <tbody>
        {devices.map((d) => (
          <tr key={d.id}>
            <Td><span className="font-medium text-ink">{d.name}</span><div className="text-sm text-muted">{platform[d.platform]}</div></Td>
            <Td><StatusPill tone={d.status === "enrolled" ? "allowed" : d.status === "revoked" ? "denied" : "pending"} label={d.status === "enrolled" ? "Enrolled" : d.status === "revoked" ? "Revoked" : "Suspended"} /></Td>
            <Td><PresencePill presence={d.presence} /></Td>
            <Td>{d.targets.length === 0 ? <span className="text-muted">None</span> : d.targets.map((t) => (
              <div key={t.id}>{t.harness === "claude_code" ? "Claude Code" : t.harness === "codex" ? "Codex" : "Custom"} <span className="text-sm text-muted">· {t.controlLevel}</span></div>
            ))}</Td>
            <Td className="tabular">{d.lastSeenAt ? new Date(d.lastSeenAt).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "Never"}</Td>
            <Td>{d.status === "enrolled" && revoke ? (
              <ConfirmDialog trigger="Revoke" destructive title={`Revoke ${d.name}?`} body="Runs it still holds stop at their next gate. Enrolling again creates a new device; nothing is copied." confirmLabel="Revoke device" onConfirm={() => start(async () => { await revoke(d.id); })} />
            ) : null}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
