import type { RegisteredApp } from "@t3tools/appydave-registry/registry";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { SidebarGroup, SidebarMenu } from "../../components/ui/sidebar";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../../components/ui/tooltip";
import { AppyAppModal } from "./AppyAppModal";
import { AppyAppRow } from "./AppyAppRow";
import { useAppRegistry } from "./useAppRegistry";

type ModalState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; app: RegisteredApp };

export function AppyAppsSection() {
  const { apps, add, update, delete: removeApp, getById } = useAppRegistry();
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const navigate = useNavigate();

  const closeModal = () => setModalState({ open: false });

  const openAddModal = () => setModalState({ open: true, mode: "add" });

  // [APPYDAVE-PATCH id="apps-section-activate" type="seam" added="2026-05-06"]
  const handleActivate = (id: string) => {
    const app = getById(id);
    if (!app) return;
    if (app.openExternal) {
      void window.desktopBridge?.openExternal(app.url);
    } else {
      void navigate({ to: "/apps/$id", params: { id } });
    }
  };

  const handleEdit = (id: string) => {
    const app = getById(id);
    if (!app) return;
    setModalState({ open: true, mode: "edit", app });
  };

  const handleSave = (input: Omit<RegisteredApp, "id">) => {
    if (!modalState.open) return;
    if (modalState.mode === "add") {
      add(input);
    } else {
      update(modalState.app.id, input);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    removeApp(id);
    closeModal();
  };

  const modalProps =
    modalState.open && modalState.mode === "edit"
      ? { mode: "edit" as const, app: modalState.app, open: true }
      : modalState.open
        ? { mode: "add" as const, open: true }
        : { mode: "add" as const, open: false };

  return (
    <SidebarGroup className="px-2 py-2">
      <div className="mb-1 flex items-center justify-between pl-2 pr-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Applications
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label="Add application"
                className="inline-flex size-5 cursor-pointer items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                onClick={openAddModal}
              />
            }
          >
            <PlusIcon className="size-3.5" />
          </TooltipTrigger>
          <TooltipPopup side="right">Add application</TooltipPopup>
        </Tooltip>
      </div>
      <SidebarMenu>
        {apps.map((app) => (
          <AppyAppRow key={app.id} app={app} onActivate={handleActivate} onEdit={handleEdit} />
        ))}
      </SidebarMenu>
      {apps.length === 0 && (
        <div className="px-2 pt-4 text-center text-xs text-muted-foreground/60">
          No applications yet
        </div>
      )}
      <AppyAppModal
        {...modalProps}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </SidebarGroup>
  );
}
