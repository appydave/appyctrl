"use client";

import { useEffect, useId, useRef, useState } from "react";

import { type RegisteredApp, validateApp, validateUrl } from "@t3tools/appydave-registry/registry";

import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export type AppyAppModalProps = {
  mode: "add" | "edit";
  app?: RegisteredApp;
  open: boolean;
  onClose: () => void;
  onSave: (input: Omit<RegisteredApp, "id">) => void;
  onDelete?: (id: string) => void;
};

type FormState = {
  glyph: string;
  name: string;
  url: string;
  openExternal: boolean;
};

const EMPTY_FORM: FormState = {
  glyph: "",
  name: "",
  url: "",
  openExternal: false,
};

function fromApp(app: RegisteredApp | undefined): FormState {
  if (!app) return EMPTY_FORM;
  return {
    glyph: app.glyph ?? "",
    name: app.name,
    url: app.url,
    openExternal: app.openExternal,
  };
}

export function AppyAppModal({ mode, app, open, onClose, onSave, onDelete }: AppyAppModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const glyphId = useId();
  const nameId = useId();
  const urlId = useId();
  const externalId = useId();
  const urlErrorId = useId();
  const fieldErrorId = useId();

  const [form, setForm] = useState<FormState>(() => fromApp(app));
  const [submitError, setSubmitError] = useState<{
    field: "name" | "url" | "glyph";
    reason: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const urlRef = useRef<HTMLInputElement | null>(null);
  const glyphRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(fromApp(app));
    setSubmitError(null);
    setConfirmDelete(false);
    const t = window.setTimeout(() => nameRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, mode, app?.id]);

  const trimmedUrl = form.url.trim();
  const liveUrlValidation = trimmedUrl.length > 0 ? validateUrl(trimmedUrl) : null;
  const liveUrlError = liveUrlValidation && !liveUrlValidation.ok ? liveUrlValidation.reason : null;

  const submit = () => {
    const trimmedGlyph = form.glyph.trim();
    const input: Omit<RegisteredApp, "id"> = {
      name: form.name.trim(),
      url: form.url.trim(),
      openExternal: form.openExternal,
      ...(trimmedGlyph ? { glyph: trimmedGlyph } : {}),
    };
    const result = validateApp(input);
    if (!result.ok) {
      setSubmitError({ field: result.field, reason: result.reason });
      const refMap = { name: nameRef, url: urlRef, glyph: glyphRef } as const;
      refMap[result.field].current?.focus();
      return;
    }
    setSubmitError(null);
    onSave(input);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  const urlFieldError = liveUrlError ?? (submitError?.field === "url" ? submitError.reason : null);
  const nameFieldError = submitError?.field === "name" ? submitError.reason : null;
  const glyphFieldError = submitError?.field === "glyph" ? submitError.reason : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPopup aria-labelledby={titleId} aria-describedby={descriptionId} className="max-w-md">
        <DialogHeader>
          <DialogTitle id={titleId}>
            {mode === "add" ? "Add Application" : "Configure Application"}
          </DialogTitle>
          <DialogDescription id={descriptionId}>
            Register a web app to launch from the sidebar.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          onKeyDown={handleKeyDown}
          className="flex flex-col gap-4 px-6 pb-2"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={glyphId}>Glyph</Label>
            <div className="w-16">
              <Input
                id={glyphId}
                ref={glyphRef}
                value={form.glyph}
                maxLength={2}
                aria-label="Glyph"
                aria-invalid={glyphFieldError ? true : undefined}
                aria-describedby={glyphFieldError ? fieldErrorId : `${glyphId}-help`}
                onChange={(event) => setForm((prev) => ({ ...prev, glyph: event.target.value }))}
              />
            </div>
            {glyphFieldError ? (
              <span id={fieldErrorId} className="text-destructive text-xs">
                {glyphFieldError}
              </span>
            ) : (
              <span id={`${glyphId}-help`} className="text-muted-foreground text-xs">
                1–2 chars shown in sidebar.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              ref={nameRef}
              value={form.name}
              required
              placeholder="Claude.ai"
              aria-invalid={nameFieldError ? true : undefined}
              aria-describedby={nameFieldError ? fieldErrorId : undefined}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            {nameFieldError ? (
              <span id={fieldErrorId} className="text-destructive text-xs">
                {nameFieldError}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={urlId}>URL</Label>
            <Input
              id={urlId}
              ref={urlRef}
              value={form.url}
              required
              placeholder="https://example.com"
              aria-invalid={urlFieldError ? true : undefined}
              aria-describedby={urlFieldError ? urlErrorId : undefined}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, url: event.target.value }));
                if (submitError?.field === "url") setSubmitError(null);
              }}
            />
            {urlFieldError ? (
              <span id={urlErrorId} className="text-destructive text-xs">
                {urlFieldError}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={externalId} className="cursor-pointer">
              <Checkbox
                id={externalId}
                checked={form.openExternal}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    openExternal: checked === true,
                  }))
                }
              />
              <span>Open in external browser instead</span>
            </Label>
            <span className="text-muted-foreground pl-6.5 text-xs">
              Opens in a separate Chromium window instead of in the main panel.
            </span>
          </div>
        </form>

        <DialogFooter>
          {confirmDelete && mode === "edit" && app && onDelete ? (
            <>
              <span className="text-foreground mr-auto self-center text-sm">Are you sure?</span>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(app.id);
                  onClose();
                }}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              {mode === "edit" && onDelete ? (
                <Button
                  variant="destructive"
                  className="mr-auto"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </Button>
              ) : null}
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submit}>
                {mode === "add" ? "Add application" : "Save changes"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
