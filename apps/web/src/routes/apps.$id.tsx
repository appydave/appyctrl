import { createFileRoute } from "@tanstack/react-router";

import { useAppRegistry } from "../appydave/apps/useAppRegistry";
import { WebviewPane } from "../appydave/apps/WebviewPane";

export const Route = createFileRoute("/apps/$id")({
  component: AppsIdPage,
});

function AppsIdPage() {
  const { id } = Route.useParams();
  const { getById } = useAppRegistry();
  const app = getById(id);

  if (!app) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        App not found
      </div>
    );
  }

  return <WebviewPane app={app} />;
}
