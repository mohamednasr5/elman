/**
 * interactive-hub.service.js
 * Client service for Interactive Services (محتاج خدمة, مين متاح الآن, تصويت القرى, وحجز المواعيد)
 */

import { tursoFetch } from '../core/db.js';

const hubCache = new Map();
const CACHE_TTL = 45000; // 45 seconds

function getCached(key) {
  const item = hubCache.get(key);
  if (item && (Date.now() - item.time < CACHE_TTL)) {
    return item.data;
  }
  return null;
}

function setCached(key, data) {
  hubCache.set(key, { data, time: Date.now() });
}

export function clearHubCache() {
  hubCache.clear();
}

export async function fetchServiceRequests(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.village) query.set('village', params.village);
  if (params.status) query.set('status', params.status);
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const url = qs ? `/api/service-requests?${qs}` : '/api/service-requests';

  if (!params.forceFresh) {
    const cached = getCached(url);
    if (cached) return cached;
  }

  try {
    const res = await tursoFetch(url);
    const data = Array.isArray(res?.data) ? res.data : [];
    setCached(url, data);
    return data;
  } catch (err) {
    console.warn('[InteractiveHub] fetchServiceRequests error:', err);
    return [];
  }
}

export async function createServiceRequest(payload) {
  clearHubCache();
  return await tursoFetch('/api/service-requests', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function closeServiceRequest(id) {
  clearHubCache();
  return await tursoFetch(`/api/service-requests/${encodeURIComponent(id)}/close`, {
    method: 'POST'
  });
}

export async function updateServiceRequest(id, payload) {
  clearHubCache();
  return await tursoFetch(`/api/service-requests/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteServiceRequest(id) {
  clearHubCache();
  return await tursoFetch(`/api/service-requests/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function fetchLiveCraftsmen(params = {}) {
  const query = new URLSearchParams();
  if (params.professionId) query.set('profession_id', params.professionId);
  if (params.village) query.set('village', params.village);
  if (params.all) query.set('all', '1');

  const qs = query.toString();
  const url = qs ? `/api/craftsmen/live?${qs}` : '/api/craftsmen/live';

  if (!params.forceFresh) {
    const cached = getCached(url);
    if (cached) return cached;
  }

  try {
    const res = await tursoFetch(url);
    const data = Array.isArray(res?.data) ? res.data : [];
    setCached(url, data);
    return data;
  } catch (err) {
    console.warn('[InteractiveHub] fetchLiveCraftsmen error:', err);
    return [];
  }
}

export async function toggleCraftsmanLive(payload) {
  return await tursoFetch('/api/craftsmen/live', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateCraftsmanLive(id, payload) {
  return await tursoFetch(`/api/craftsmen/live/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteCraftsmanLive(id) {
  return await tursoFetch(`/api/craftsmen/live/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}


export async function fetchVillagePolls(villageId) {
  try {
    const url = `/api/villages/polls?village=${encodeURIComponent(villageId || '')}`;
    const res = await tursoFetch(url);
    return res || { polls: [], totalVotes: 0 };
  } catch (err) {
    console.warn('[InteractiveHub] fetchVillagePolls error:', err);
    return { polls: [], totalVotes: 0 };
  }
}

export async function voteVillageService(villageId, serviceKey) {
  return await tursoFetch('/api/villages/vote', {
    method: 'POST',
    body: JSON.stringify({ villageId, serviceKey })
  });
}

export async function createAppointment(payload) {
  return await tursoFetch('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * التصويت بلايك أو ديسلايك على الصنايعي أو طلب الخدمة
 * @param {{ targetId: string, targetType: 'craftsman'|'service_request', voteType: 'like'|'dislike' }} payload
 */
export async function voteInteractiveItem({ targetId, targetType, voteType }) {
  return await tursoFetch('/api/interactive/vote', {
    method: 'POST',
    requiresAuth: true,
    body: JSON.stringify({ targetId, targetType, voteType })
  });
}

/**
 * إبلاغ عن شخص أو طلب غير جاد
 * @param {{ targetId: string, targetType: 'craftsman'|'service_request', reason: string }} payload
 */
export async function reportInteractiveItem({ targetId, targetType, reason }) {
  return await tursoFetch('/api/interactive/report', {
    method: 'POST',
    requiresAuth: true,
    body: JSON.stringify({ targetId, targetType, reason })
  });
}

