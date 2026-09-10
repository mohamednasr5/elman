/**
 * interactive-hub.service.js
 * Client service for Interactive Services (محتاج خدمة, مين متاح الآن, تصويت القرى, وحجز المواعيد)
 */

import { tursoFetch } from '../core/db.js';

export async function fetchServiceRequests(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.village) query.set('village', params.village);
  if (params.status) query.set('status', params.status);
  if (params.limit) query.set('limit', String(params.limit));

  try {
    const res = await tursoFetch(/api/service-requests?);
    return Array.isArray(res?.data) ? res.data : [];
  } catch (err) {
    console.warn('[InteractiveHub] fetchServiceRequests error:', err);
    return [];
  }
}

export async function createServiceRequest(payload) {
  return await tursoFetch('/api/service-requests', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function closeServiceRequest(id) {
  return await tursoFetch(/api/service-requests//close, {
    method: 'POST'
  });
}

export async function fetchLiveCraftsmen(params = {}) {
  const query = new URLSearchParams();
  if (params.professionId) query.set('profession_id', params.professionId);
  if (params.village) query.set('village', params.village);

  try {
    const res = await tursoFetch(/api/craftsmen/live?);
    return Array.isArray(res?.data) ? res.data : [];
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

export async function fetchVillagePolls(villageId) {
  try {
    const res = await tursoFetch(/api/villages/polls?village=);
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
