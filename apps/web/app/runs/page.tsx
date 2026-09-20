import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReadFailure } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { dataSource, viewer } from "@/data/source";
import { RunsTable } from "@/features/runs-table";

export default async function RunsPage() {
  const runs = await dataSource().runs(viewer());
  if (!runs.ok) return <ReadFailure read={runs} />;
  return (
    <>
      <PageHeader title="Runs" deck="One row per run on one target. Held money is released only when a trusted receipt settles it." actions={<Link href="/send"><Button variant="primary">Send work</Button></Link>} />
      <RunsTable runs={runs.value.items} checkedAt={new Date().toISOString()} />
    </>
  );
}
