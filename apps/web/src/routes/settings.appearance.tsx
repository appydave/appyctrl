import { createFileRoute } from "@tanstack/react-router";

import { AppearanceSettings } from "../appydave/settings/AppearanceSettings";

export const Route = createFileRoute("/settings/appearance")({
  component: AppearanceSettings,
});
