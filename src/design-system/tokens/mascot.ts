// Existing V3 illustration palette, shared by documentation and the animated mark.
export const mascotPalette = [
  ["Deep Night Indigo", "#0E0B35", "Tmavé prostředí"],
  ["Royal Violet Night", "#371265", "Vedlejší prostředí"],
  ["Plum Glow", "#853681", "Tmavý akcent"],
  ["Soft Skin Blush", "#E4B6D6", "Pokožka"],
  ["Neon Frill Pink", "#F7B5D5", "Světlá vlákna žaber"],
  ["Vibrant Frill Pink", "#DE79C2", "Výrazná růžová žaber"],
  ["Hoodie Lilac", "#B384CE", "Mikina"],
  ["Accent Lilac", "#A67CD7", "Odlesky látky"],
  ["Cargo Plum", "#63438F", "Kalhoty a stín látky"],
  ["Soft Off-White", "#F3ECF7", "Tenisky"],
] as const;

export const mascotVariables = Object.fromEntries(mascotPalette.map(([name, color]) => [`--mascot-${name.toLowerCase().replaceAll(" ", "-")}`, color]));
