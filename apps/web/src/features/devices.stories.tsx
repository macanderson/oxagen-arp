import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { devices } from "@oxagen-arp/fixtures";
import { Shell } from "@/components/shell";
import { Devices } from "./devices";

const meta = {
  title: "Screens/Devices",
  component: Devices,
  decorators: [(Story) => <Shell><Story /></Shell>],
  args: { devices, revoke: async () => undefined },
} satisfies Meta<typeof Devices>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Enrolled: Story = {};
export const Empty: Story = { args: { devices: [] } };
