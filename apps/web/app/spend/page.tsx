import { ReadFailure } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { dataSource, viewer } from "@/data/source";
import { Spend } from "@/features/spend";

export default async function SpendPage() {
  const budget = await dataSource().budget(viewer());
  if (!budget.ok) return <ReadFailure read={budget} />;
  return (
    <>
      <PageHeader title="Spend" deck="Settled, held, and remaining for every scope that binds your calls. Held funds are released only when a receipt settles them." />
      <Spend scopes={budget.value.scopes} tightest={budget.value.tightest} />
    </>
  );
}
