import { notFound } from "next/navigation";
import { pauseRun, resumeRun, steerRun, stopRun } from "@/actions";
import { ReadFailure } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { dataSource, viewer } from "@/data/source";
import { RunDetail } from "@/features/run-detail";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const read = await dataSource().run(viewer(), { runId: id });
  if (!read.ok) {
    if (read.reason === "error" && read.status === 422) notFound();
    return <ReadFailure read={read} />;
  }
  const { run, events, pauseBoundaryId } = read.value;
  return (
    <>
      <PageHeader title={run.title} deck={`${run.agent.name} v${run.agent.version} · work request ${run.workRequestId}`} />
      <RunDetail run={run} events={events} pauseBoundaryId={pauseBoundaryId} commands={{ pause: pauseRun, resume: resumeRun, stop: stopRun, steer: steerRun }} />
    </>
  );
}
