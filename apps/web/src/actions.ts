"use server";
// Server actions are the app's commands. Each one is one DataSource port, so a command reaches the
// kernel the same way a read does, with an idempotency key minted once per intent.
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { dataSource, viewer } from "@/data/source";

export async function pauseRun(runId: string) {
  const r = await dataSource().pauseRun(viewer(), { runId, idempotencyKey: randomUUID() });
  revalidatePath(`/runs/${runId}`);
  return r;
}
export async function resumeRun(runId: string, pauseBoundaryId: string) {
  const r = await dataSource().resumeRun(viewer(), { runId, pauseBoundaryId, idempotencyKey: randomUUID() });
  revalidatePath(`/runs/${runId}`);
  return r;
}
export async function stopRun(runId: string) {
  const r = await dataSource().stopRun(viewer(), { runId, idempotencyKey: randomUUID() });
  revalidatePath(`/runs/${runId}`);
  return r;
}
export async function steerRun(runId: string, message: string, interrupt: boolean) {
  const r = await dataSource().steerRun(viewer(), { runId, message, interrupt, idempotencyKey: randomUUID() });
  revalidatePath(`/runs/${runId}`);
  return r;
}
export async function submitWork(formData: FormData) {
  const targetIds = formData.getAll("targetId").map(String);
  const r = await dataSource().submitWork(viewer(), {
    workOrderId: String(formData.get("workOrderId") ?? "wo_firstdocscheck"),
    targetIds,
    prompt: String(formData.get("prompt") ?? ""),
    idempotencyKey: randomUUID(),
  });
  revalidatePath("/runs");
  return r;
}
export async function respondFinding(findingId: string, disposition: "accepted" | "dismissed" | "proposed_change", reason?: string) {
  const r = await dataSource().respondFinding(viewer(), { findingId, disposition, ...(reason ? { reason } : {}), idempotencyKey: randomUUID() });
  revalidatePath("/coaching");
  return r;
}
export async function cancelWork(workRequestId: string) {
  const r = await dataSource().cancelWork(viewer(), { workRequestId, idempotencyKey: randomUUID() });
  revalidatePath("/runs");
  return r;
}
export async function revokeDevice(deviceId: string) {
  const r = await dataSource().revokeDevice(viewer(), { deviceId, idempotencyKey: randomUUID() });
  revalidatePath("/devices");
  return r;
}
