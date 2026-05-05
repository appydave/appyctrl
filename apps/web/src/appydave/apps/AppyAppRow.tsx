import type { RegisteredApp } from "@t3tools/appydave-registry/registry";
import { SquarePenIcon } from "lucide-react";
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from "../../components/ui/sidebar";

type AppyAppRowProps = {
  app: RegisteredApp;
  onActivate: (id: string) => void;
  onEdit: (id: string) => void;
};

function deriveGlyph(app: RegisteredApp): string {
  const trimmed = app.glyph?.trim();
  if (trimmed && trimmed.length > 0) return trimmed;
  const firstChar = app.name.trim().charAt(0);
  return firstChar.length > 0 ? firstChar.toUpperCase() : "?";
}

export function AppyAppRow({ app, onActivate, onEdit }: AppyAppRowProps) {
  const glyph = deriveGlyph(app);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => onActivate(app.id)}>
        <span
          aria-hidden
          className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium uppercase text-muted-foreground"
        >
          {glyph}
        </span>
        <span className="truncate">{app.name}</span>
      </SidebarMenuButton>
      <SidebarMenuAction
        showOnHover
        aria-label={`Edit ${app.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onEdit(app.id);
        }}
      >
        <SquarePenIcon className="size-3.5" />
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}
