/** Thin accent line icons, 1.25px stroke per spec. Keys match services.icon. */
const PATHS: Record<string, string> = {
  "rough-in": "M4 20V8l8-4 8 4v12M9 20v-6h6v6M12 4v4",
  plaster: "M3 6h18v12H3zM3 12h18M9 6v6M15 12v6",
  tiling: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  gypsum: "M3 5h18v6H3zM6 11v3M12 11v3M18 11v3M3 19h18",
  paint: "M5 4h10v6H5zM10 10v4M8 14h4v6H8z",
  finishes: "M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9L12 15.9 6.8 19l1.4-5.9-4.6-4 6-.5z",
};

export function ServiceIcon({ name }: { name: string | null }) {
  const path = (name && PATHS[name]) || PATHS.finishes;
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
