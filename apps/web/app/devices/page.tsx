import { revokeDevice } from "@/actions";
import { ReadFailure } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { dataSource, viewer } from "@/data/source";
import { Devices } from "@/features/devices";

export default async function DevicesPage() {
  const devices = await dataSource().devices(viewer());
  if (!devices.ok) return <ReadFailure read={devices} />;
  return (
    <>
      <PageHeader title="Devices" deck="Every enrolled device and the harness targets it hosts. Revoking a device stops its runs at their next gate." />
      <Devices devices={devices.value.items} revoke={revokeDevice} />
    </>
  );
}
