import { getPublishedPlaces } from '../../../core/db.js';
import { renderEnglishPlaceCard, renderEnglishPlaceCardSkeleton } from '../../components/en/PlaceCardEn.js';

const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const CITY = {
  manzala: { name:'El Manzala', ar:'المنزلة', tagline:'A local guide to El Manzala and its surrounding communities.', about:'El Manzala is a historic city in Dakahlia Governorate and a central destination for local services, businesses, healthcare, food, shopping and everyday needs. This guide brings the city information and local listings together in one place.', facts:[['Region','Dakahlia Governorate'],['Guide focus','Businesses, services and local places'],['Experience','Local discovery and practical information'],['Coverage','El Manzala and nearby communities']] },
  matariya: { name:'El Matariya', ar:'المطرية', tagline:'Discover El Matariya, its local life, services and places.', about:'El Matariya is a coastal city in Dakahlia Governorate closely connected with Lake Manzala and a long fishing tradition. Its local economy and daily life are shaped by the lake, fishing, trade and community services.', facts:[['Region','Dakahlia Governorate'],['Known for','Lake Manzala and fishing heritage'],['Guide focus','Businesses, services and local places'],['Experience','Local discovery and practical information']] }
};

export async function renderEnglishCityPage($container, cityKey = 'manzala') {
  const city = CITY[cityKey] || CITY.manzala;
  document.title = `${city.name} Guide | Dalil El Manzala & El Matariya`;
  $container.innerHTML = `<section class="en-city-hero"><div class="en-container"><div class="en-city-hero__eyebrow">Local City Guide</div><h1>${esc(city.name)}</h1><p>${esc(city.tagline)}</p></div></section><main class="en-container en-section"><section class="en-city-about"><article class="en-city-panel"><span class="en-kicker">About the city</span><h2>${esc(city.name)}</h2><p>${esc(city.about)}</p><p>Explore verified local listings, useful services and places across ${esc(city.name)} without leaving the English guide.</p></article><aside class="en-city-panel"><h3>At a glance</h3><div class="en-city-facts">${city.facts.map(([a,b])=>`<div class="en-city-fact"><strong>${esc(a)}</strong><span>${esc(b)}</span></div>`).join('')}</div></aside></section><section style="margin-top:48px"><div class="en-section-heading"><div><span class="en-kicker">Local directory</span><h2>Places in ${esc(city.name)}</h2></div><span id="en-city-count" class="en-muted">Loading listings…</span></div><div id="en-city-grid" class="en-place-grid">${Array.from({length:8},()=>renderEnglishPlaceCardSkeleton()).join('')}</div></section></main>`;
  let places=[];
  try { places = await getPublishedPlaces({limit:300}); } catch (_) {}
  const filtered = (places || []).filter(p => {
    const area = String(p.areaEn || p.area_en || p.area || '').toLowerCase();
    return area.includes(city.name.toLowerCase()) || area.includes(city.ar);
  });
  const count = document.getElementById('en-city-count');
  const grid = document.getElementById('en-city-grid');
  if (count) count.textContent = `${filtered.length} listings`;
  if (!grid) return;
  grid.innerHTML = filtered.length ? filtered.map(renderEnglishPlaceCard).join('') : `<div class="en-empty" style="grid-column:1/-1"><div class="en-empty__icon">📍</div><h3>No listings found yet</h3><p class="en-muted">There are no published English listings for this city yet.</p><a class="en-btn en-btn--primary" href="/en/places/">Browse all places</a></div>`;
}
