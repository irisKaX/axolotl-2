import type { IconName } from "../components/Icon";
export const groups: {
  id: string;
  label: string;
  items: { route: string; label: string; icon: IconName }[];
}[] = [
  {
    id: "osobni",
    label: "Můj workspace",
    items: [
      { route: "osobni-prostor/poznamky", label: "Poznámky", icon: "poznamky" },
    ],
  },
  {
    id: "media",
    label: "Média",
    items: [
      {
        route: "media/konvertor-obrazku",
        label: "Konvertor obrázků",
        icon: "konvertor-obrazku",
      },
      {
        route: "media/obrazky-z-webu",
        label: "Obrázky z webu",
        icon: "obrazky-z-webu",
      },
      { route: "media/pdf-scout", label: "PDF scout", icon: "pdf-scout" },
      { route: "media/screenshot", label: "Screenshot", icon: "screenshot" },
      { route: "media/qr", label: "QR", icon: "qr" },
    ],
  },
  {
    id: "kontrola",
    label: "Kontrola",
    items: [
      { route: "kontrola/metadata", label: "Metadata", icon: "metadata" },
      { route: "kontrola/nadpisy", label: "Nadpisy", icon: "nadpisy" },
      {
        route: "kontrola/strukturovana-data",
        label: "Strukturovaná data",
        icon: "strukturovana-data",
      },
      { route: "kontrola/obrazky", label: "Obrázky", icon: "obrazky" },
      {
        route: "kontrola/hledani-na-webu",
        label: "Hledání na webu",
        icon: "hledani-na-webu",
      },
    ],
  },
];
export const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "design-system": "Vzorník komponent",
  ...Object.fromEntries(
    groups.flatMap((group) =>
      group.items.map((item) => [item.route, item.label]),
    ),
  ),
};
export function currentRoute() {
  const route = location.hash.slice(1);
  return Object.hasOwn(routeLabels, route) ? route : "dashboard";
}
