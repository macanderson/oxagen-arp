import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { runEvents, runs } from "@oxagen-arp/fixtures";
import { Shell } from "@/components/shell";
import { RunDetail, type RunCommands } from "./run-detail";

const commands: RunCommands = {
  pause: async () => undefined, resume: async () => undefined, stop: async () => undefined, steer: async () => undefined,
};
const run = (id: string) => runs.find((r) => r.id === id)!;

const meta = {
  title: "Screens/Run",
  component: RunDetail,
  decorators: [(Story) => <Shell><Story /></Shell>],
  args: { run: run("run_firstdocs"), events: runEvents.run_firstdocs ?? [], pauseBoundaryId: null, commands },
} satisfies Meta<typeof RunDetail>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};
export const Pausing: Story = { args: { run: run("run_loginbug"), events: runEvents.run_loginbug ?? [] } };
export const Paused: Story = { args: { run: { ...run("run_loginbug"), state: "paused", stateReason: null }, events: runEvents.run_loginbug ?? [], pauseBoundaryId: "pse_42" } };
export const WaitingForDevice: Story = { args: { run: run("run_refundreview"), events: [] } };
export const BudgetBlocked: Story = { args: { run: run("run_budgetblock"), events: [] } };
export const OutcomeUnknown: Story = { args: { run: { ...run("run_loginbug"), state: "outcome_unknown", stateReason: "Abandoned. Unresolved effects are recorded as unknown; every hold is kept." }, events: [] } };
export const Completed: Story = { args: { run: run("run_done"), events: [] } };
