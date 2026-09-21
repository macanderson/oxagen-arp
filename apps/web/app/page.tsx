import { ReadFailure } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { dataSource, viewer } from "@/data/source";
import { Home } from "@/features/home";

export default async function HomePage() {
  const ds = dataSource();
  const ctx = viewer();
  const [workspaces, runs, budget, routes] = await Promise.all([ds.workspaces(ctx), ds.runs(ctx), ds.budget(ctx), ds.modelRoutes(ctx)]);
  if (!workspaces.ok) return <ReadFailure read={workspaces} />;
  if (!runs.ok) return <ReadFailure read={runs} />;
  if (!budget.ok) return <ReadFailure read={budget} />;
  if (!routes.ok) return <ReadFailure read={routes} />;
  const workspace = workspaces.value.items.find((w) => w.id === ctx.workspaceId) ?? workspaces.value.items[0];
  if (!workspace) return <ReadFailure read={{ ok: false, reason: "error", code: "no_workspace", status: 404 }} />;
  return (
    <>
      <PageHeader title={workspace.name} deck="Active work, what needs a person, and spend." />
      <Home workspace={workspace} runs={runs.value.items} budget={budget.value.scopes} modelRouteCount={routes.value.items.length} />
    </>
  );
}
