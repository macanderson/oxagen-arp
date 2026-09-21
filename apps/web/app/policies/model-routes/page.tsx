import { ReadFailure } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { dataSource, viewer } from "@/data/source";
import { ModelRoutes } from "@/features/model-routes";

export default async function ModelRoutesPage() {
  const routes = await dataSource().modelRoutes(viewer());
  if (!routes.ok) return <ReadFailure read={routes} />;
  return (
    <>
      <PageHeader title="Policies · Model routes" deck="The first setup step. Send work is disabled until one route exists." />
      <ModelRoutes routes={routes.value.items} />
    </>
  );
}
