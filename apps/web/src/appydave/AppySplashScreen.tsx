import { AppyCtrlWordmark } from "./AppyCtrlWordmark";

export function AppySplashScreen() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background"
      aria-label="AppyCtrl splash screen"
    >
      <img alt="AppyDave" className="size-24 object-contain" src="/appydave-splash.png" />
      <AppyCtrlWordmark />
    </div>
  );
}
