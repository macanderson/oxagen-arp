import { redirect } from "next/navigation";
import { submitWork } from "@/actions";
import { ReadFailure } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { dataSource, viewer } from "@/data/source";
import { SendWork } from "@/features/send-work";

export default async function SendPage({ searchParams }: { searchParams: Promise<{ paired?: string }> }) {
  const ds = dataSource();
  const ctx = viewer();
  const { paired } = await searchParams;
  const [routes, devices, budget] = await Promise.all([ds.modelRoutes(ctx), ds.devices(ctx), ds.budget(ctx)]);
  if (!routes.ok) return <ReadFailure read={routes} />;
  if (!devices.ok) return <ReadFailure read={devices} />;
  if (!budget.ok) return <ReadFailure read={budget} />;
  async function action(formData: FormData) {
    "use server";
    const r = await submitWork(formData);
    if (r.ok) redirect("/runs");
  }
  return (
    <>
      <PageHeader title="Send work" deck="Pick a work order and targets. Each target gets its own run and reports its own start." />
      <SendWork routes={routes.value.items} devices={devices.value.items} budget={budget.value.scopes} paired={paired !== "0"} action={action} />
    </>
  );
}
