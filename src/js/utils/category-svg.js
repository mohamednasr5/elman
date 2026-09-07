// src/js/utils/category-svg.js
// Centralized SVG generator for categories (both known and auto‑generated)
// Uses the existing createSvgIcon() helper from professions-data.js for handcrafted types.
// Auto‑generation is deterministic: the slug is hashed to pick a color palette and a base shape.

import { createSvgIcon } from "./professions-data.js";

// --- Handcrafted SVG mappings for known slugs ---------------------------------
// For each known category slug we map to a specific SVG type (if one exists) or
// directly return an inline SVG. The types correspond to the ones defined in
// createSvgIcon() (e.g., 'decor-main', 'plumbing-main', etc.).
// If a slug is not listed here the fallback generator will create a simple
// coloured circle with a generic animation.
export const CATEGORY_SVG_MAP = {
  // Business categories (from CATEGORY_EMOJIS in home.js)
  pharmacy: createSvgIcon("pharmacy-main", { size: 48, color: "#E74C3C" }),
  supermarket: createSvgIcon("supermarket-main", { size: 48, color: "#27AE60" }),
  paint: createSvgIcon("paint-main", { size: 48, color: "#9B59B6" }),
  herbs: createSvgIcon("herbs-main", { size: 48, color: "#27AE60" }),
  doctor: createSvgIcon("doctor-main", { size: 48, color: "#2980B9" }),
  plumbing: createSvgIcon("plumbing-main", { size: 48, color: "#52596E" }),
  plumber: createSvgIcon("plumbing-main", { size: 48, color: "#2980B9" }),
  carpenter: createSvgIcon("carpenter-main", { size: 48, color: "#E67E22" }),
  tiler: createSvgIcon("tiler-main", { size: 48, color: "#9B59B6" }),
  painter: createSvgIcon("painter-main", { size: 48, color: "#F1C40F" }),
  electrician: createSvgIcon("electrical-main", { size: 48, color: "#F39C12" }),
  "ac-technician": createSvgIcon("hvac-main", { size: 48, color: "#3498DB" }),
  blacksmith: createSvgIcon("blacksmith-main", { size: 48, color: "#52596E" }),
  alumital: createSvgIcon("alumital-main", { size: 48, color: "#95A5A6" }),
  mechanic: createSvgIcon("automotive-main", { size: 48, color: "#E74C3C" }),
  upholsterer: createSvgIcon("upholsterer-main", { size: 48, color: "#9B59B6" }),
  feed: createSvgIcon("feed-main", { size: 48, color: "#F39C12" }),
  poultry: createSvgIcon("poultry-main", { size: 48, color: "#F39C12" }),
  bakery: createSvgIcon("bakery-main", { size: 48, color: "#E67E22" }),
  vegetables: createSvgIcon("vegetables-main", { size: 48, color: "#27AE60" }),
  antiques: createSvgIcon("antiques-main", { size: 48, color: "#95A5A6" }),
  electronics: createSvgIcon("electronics-main", { size: 48, color: "#2980B9" }),
  carpet: createSvgIcon("carpet-main", { size: 48, color: "#9B59B6" }),
  mattress: createSvgIcon("mattress-main", { size: 48, color: "#3498DB" }),
  china: createSvgIcon("china-main", { size: 48, color: "#E74C3C" }),
  electrical: createSvgIcon("electrical-main", { size: 48, color: "#F1C40F" }),
  roastery: createSvgIcon("roastery-main", { size: 48, color: "#654321" }),
  phones: createSvgIcon("phones-main", { size: 48, color: "#2563EB" }),
  // Craft categories (from PROFESSION_CATEGORIES)
  "decor-finishing": createSvgIcon("decor-main", { size: 48, color: "#28A745" }),
  "plumbing-drainage": createSvgIcon("plumbing-main", { size: 48, color: "#007BFF" }),
  electrical: createSvgIcon("electrical-main", { size: 48, color: "#FFC107" }),
  "hvac-refrigeration": createSvgIcon("hvac-main", { size: 48, color: "#17A2B8" }),
  "carpentry-furniture": createSvgIcon("carpenter-main", { size: 48, color: "#6F42C1" }),
  "building-construction": createSvgIcon("construction-main", { size: 48, color: "#DC3545" }),
  "automotive-vehicles": createSvgIcon("automotive-main", { size: 48, color: "#343A40" }),
  "blacksmith-alumital": createSvgIcon("blacksmith-main", { size: 48, color: "#20C997" }),
  "cleaning-home-services": createSvgIcon("cleaning-main", { size: 48, color: "#FD7E14" }),
  "agriculture-gardening": createSvgIcon("garden-main", { size: 48, color: "#28A745" }),
  "home-appliances-maintenance": createSvgIcon("appliance-main", { size: 48, color: "#0D6EFD" }),
  tailoring: createSvgIcon("tailoring-main", { size: 48, color: "#D63384" }),
  barber: createSvgIcon("beauty-main", { size: 48, color: "#E83E8C" }),
  transportation: createSvgIcon("transport-main", { size: 48, color: "#6C757D" }),
  misc: createSvgIcon("misc-main", { size: 48, color: "#ADB5BD" })
};

// --- Deterministic auto‑generation ------------------------------------------
const COLOR_PALETTES = [
  "#E74C3C", "#27AE60", "#9B59B6", "#2980B9", "#F1C40F", "#3498DB",
  "#E67E22", "#95A5A6", "#DC2626", "#D97706", "#1E293B", "#6F42C1"
];

function hashString(str) {
  // Simple deterministic hash – not cryptographic, just for colour selection
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32‑bit integer
  }
  return Math.abs(hash);
}

function pickPalette(slug) {
  const idx = hashString(slug) % COLOR_PALETTES.length;
  return COLOR_PALETTES[idx];
}

function pickShape(slug) {
  const lower = slug.toLowerCase();
  if (/doctor|clinic|medical|pharmacy/.test(lower)) return "stethoscope";
  if (/food|restaurant|bakery|cafe|juice|drink/.test(lower)) return "fork";
  if (/tech|computer|phone|electronics/.test(lower)) return "circuit";
  if (/car|vehicle|mechanic|repair/.test(lower)) return "car";
  if (/garden|plant|agri|herb/.test(lower)) return "leaf";
  if (/clean|home|service/.test(lower)) return "wrench";
  // default generic shape
  return "circle";
}

function shapePath(shape) {
  // Very simple path definitions – you can replace with more detailed SVGs.
  switch (shape) {
    case "stethoscope":
      return "M10 2a2 2 0 0 1 2 2v2h2V4a2 2 0 1 1 4 0v2h2V4a2 2 0 1 1 4 0v4a4 4 0 0 1-8 0V6h-2v2a4 4 0 0 1-8 0V4a2 2 0 0 1 2-2z";
    case "fork":
      return "M4 2v12M8 2v12M12 2v12M4 8h8";
    case "circuit":
      return "M2 6h4v4H2V6zm6 0h4v4H8V6zm6 0h4v4h-4V6z";
    case "car":
      return "M2 12h12l2-4H2zM4 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z";
    case "leaf":
      return "M6 2C4 4 2 6 2 10c0 4 4 8 8 8s8-4 8-8c0-4-2-6-4-8";
    case "wrench":
      return "M2 12l4-4 2 2-4 4-2-2zm8-8l4 4-2 2-4-4 2-2z";
    default:
      return "M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2z"; // simple circle
  }
}

export function getCategorySvg(slug, sizeOrOptions = 48) {
  const size = typeof sizeOrOptions === "number" ? sizeOrOptions : sizeOrOptions.size || 48;
  // 1️⃣ Hand‑crafted map
  if (CATEGORY_SVG_MAP[slug]) {
    // Hand‑crafted entries already include the size we want – replace size if needed
    return CATEGORY_SVG_MAP[slug].replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
  }
  // 2️⃣ Auto‑generated fallback
  const colour = pickPalette(slug);
  const shape = pickShape(slug);
  const path = shapePath(shape);
  const className = `cat-auto-${hashString(slug) % 12}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${colour}" class="${className}" xmlns="http://www.w3.org/2000/svg"><path d="${path}"/></svg>`;
}
