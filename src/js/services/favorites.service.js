/**
 * Local Favorites — zero-network, offline-friendly saved places.
 * Keeps public browsing fast and works before login.
 */
const KEY = 'elmanzala-favorites-v1';

function read() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch (_) { return []; }
}

function write(ids) {
  try { localStorage.setItem(KEY, JSON.stringify([...new Set(ids)].slice(0, 100))); } catch (_) {}
}

export function isFavorite(placeId) {
  return Boolean(placeId && read().includes(String(placeId)));
}

export function toggleFavorite(placeId) {
  const id = String(placeId || '');
  if (!id) return false;
  const ids = read();
  const index = ids.indexOf(id);
  if (index >= 0) ids.splice(index, 1);
  else ids.unshift(id);
  write(ids);
  window.dispatchEvent(new CustomEvent('elman:favorite-changed', { detail: { placeId: id, favorite: index < 0 } }));
  return index < 0;
}

export function getFavoriteIds() {
  return read();
}
