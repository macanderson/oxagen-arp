import { respondFinding } from "@/actions";
import { ReadFailure } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { dataSource, viewer } from "@/data/source";
import { Coaching } from "@/features/coaching";

export default async function CoachingPage() {
  const ds = dataSource();
  const ctx = viewer();
  const [usage, findings] = await Promise.all([ds.usage(ctx), ds.findings(ctx)]);
  if (!usage.ok) return <ReadFailure read={usage} />;
  if (!findings.ok) return <ReadFailure read={findings} />;
  return (
    <>
      <PageHeader title="Operator coaching" deck="Where tokens and money go, and evidence-backed changes to try. Estimates stay separate from measured results." />
      <Coaching usage={usage.value.buckets} excludedRequests={usage.value.excludedRequests} findings={findings.value.items} measured={findings.value.measuredReductions} commands={{ respond: respondFinding }} />
    </>
  );
}
