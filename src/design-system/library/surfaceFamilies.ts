/** Opt-in materials. Omitting family retains the original library surface. */
export const surfaceFamilies = [
  {
    id: "obsidian",
    label: "Obsidian",
    description:
      "Klidná hloubka. Saténový povrch, měkká hrana a soustředěný obsah.",
  },
  {
    id: "halo",
    label: "Halo",
    description:
      "Prostorové světlo. Ambientní odlesk, vrstvený materiál a jemný lift.",
  },
  {
    id: "studio",
    label: "Studio Outline",
    description:
      "Přesná struktura. Pevná obrysová hrana, kompaktní rádius a editorial členění.",
  },
] as const;
export type SurfaceFamily = (typeof surfaceFamilies)[number]["id"];
