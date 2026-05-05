#!/usr/bin/env bash
# check-seams.sh — Audit upstream files we deliberately touch (seam files).
# Reports which of the known seam files differ from upstream/main, and whether
# every divergence has an [APPYDAVE-PATCH] annotation in the file.
#
# Exit codes:
#   0 — all seam diffs are accounted for (or no seam diffs exist)
#   1 — at least one seam file differs from upstream but has NO patch annotation
#   2 — git/upstream not configured

set -euo pipefail

# Resolve repo root regardless of where the script is invoked from.
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$REPO_ROOT" ] && { echo "✗ Not inside a git repository."; exit 2; }
cd "$REPO_ROOT"

# Verify upstream remote exists.
if ! git rev-parse --verify upstream/main >/dev/null 2>&1; then
  echo "✗ 'upstream/main' not found. Configure with:"
  echo "    git remote add upstream <upstream-url>"
  echo "    git fetch upstream"
  exit 2
fi

# The canonical seam files. Add to this list when extensibility-strategy.md changes.
SEAM_FILES=(
  "apps/web/src/main.tsx"
  "apps/web/src/router.ts"
  "apps/server/src/ws.ts"
  "apps/server/src/bootstrap.ts"
  "apps/desktop/src/main.ts"
  "apps/web/src/components/Sidebar.tsx"
  "apps/web/src/components/Sidebar.logic.ts"
  "apps/web/src/components/PlanSidebar.tsx"
  "apps/web/src/components/settings/SettingsSidebarNav.tsx"
)

echo "═══════════════════════════════════════════════════════════"
echo " Seam audit — upstream/main vs HEAD"
echo "═══════════════════════════════════════════════════════════"
echo

EXIT=0
TOUCHED=0
ACCOUNTED=0
UNACCOUNTED=0

for file in "${SEAM_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    printf "  ⚠️  missing      %s  (not in working tree — upstream may have moved it)\n" "$file"
    continue
  fi

  if git diff --quiet upstream/main HEAD -- "$file"; then
    printf "  ✅ unchanged    %s\n" "$file"
  else
    TOUCHED=$((TOUCHED + 1))
    if grep -q "\[APPYDAVE-PATCH" "$file"; then
      ANNOT=$(grep -o '\[APPYDAVE-PATCH[^]]*\]' "$file" | head -1)
      printf "  ✓  accounted   %s  %s\n" "$file" "$ANNOT"
      ACCOUNTED=$((ACCOUNTED + 1))
    else
      printf "  ✗  UNACCOUNTED %s  (no [APPYDAVE-PATCH] annotation)\n" "$file"
      UNACCOUNTED=$((UNACCOUNTED + 1))
      EXIT=1
    fi
  fi
done

echo
echo "─── Summary ───"
echo "  Seam files differing from upstream: $TOUCHED"
echo "  Accounted (have annotation):        $ACCOUNTED"
echo "  Unaccounted (no annotation):        $UNACCOUNTED"

if [ "$EXIT" -eq 0 ]; then
  echo
  echo "✅ All seam divergences are documented."
else
  echo
  echo "✗ At least one seam file diverges without an [APPYDAVE-PATCH] annotation."
  echo "  Either annotate the change and add it to .appydave/patches/manifest.md,"
  echo "  or revert it."
fi

exit $EXIT
