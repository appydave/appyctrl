import { CheckIcon } from "lucide-react";

import { useTheme } from "../themes/useTheme";
import type { Theme } from "../themes/types";

type ThemeOption = {
  value: Theme;
  label: string;
  description: string;
  preview: { canvas: string; sidebar: string; card: string; accent: string; foreground: string };
};

const THEME_OPTIONS: ReadonlyArray<ThemeOption> = [
  {
    value: "light",
    label: "AppyDave Light",
    description: "Warm cream — easy on the eyes during long sessions.",
    preview: {
      canvas: "#ebe2ce",
      sidebar: "#e2d8c0",
      card: "#f5ebd9",
      accent: "#b8860b",
      foreground: "#3a2a1f",
    },
  },
  {
    value: "dark",
    label: "AppyDave Dark",
    description: "Warm dark — high contrast for focused build mode.",
    preview: {
      canvas: "#1a1515",
      sidebar: "#15110f",
      card: "#25201e",
      accent: "#ffde59",
      foreground: "#faf5ec",
    },
  },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-sm font-medium text-foreground">Appearance</h2>
        <p className="text-xs text-muted-foreground">
          Choose how AppyCtrl looks across the app. Switching takes effect immediately.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-2xl">
        {THEME_OPTIONS.map((option) => {
          const selected = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={selected}
              className={
                "group relative flex flex-col gap-3 rounded-2xl border p-3 text-left transition-colors " +
                (selected
                  ? "border-primary ring-2 ring-ring/40 bg-card"
                  : "border-border bg-card hover:border-primary/60")
              }
            >
              <ThemePreview preview={option.preview} />
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
                {selected ? (
                  <span
                    aria-hidden
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <CheckIcon className="size-3" />
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThemePreview({ preview }: { preview: ThemeOption["preview"] }) {
  return (
    <div
      aria-hidden
      className="relative h-20 w-full overflow-hidden rounded-lg border border-border/60"
      style={{ backgroundColor: preview.canvas }}
    >
      <div
        className="absolute inset-y-0 left-0 w-1/3"
        style={{ backgroundColor: preview.sidebar }}
      />
      <div
        className="absolute right-3 top-3 h-3 w-12 rounded"
        style={{ backgroundColor: preview.card, borderColor: preview.foreground }}
      />
      <div
        className="absolute right-3 bottom-3 h-2 w-8 rounded"
        style={{ backgroundColor: preview.accent }}
      />
      <div
        className="absolute left-3 top-3 h-2 w-10 rounded"
        style={{ backgroundColor: preview.foreground, opacity: 0.4 }}
      />
    </div>
  );
}
