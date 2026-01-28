// src/api.js
const BASE_URL = "http://localhost:8080/api";

function getToken() {
  return localStorage.getItem("token");
}

// ================= Lease Chat APIs =================
export async function getLeaseMessages(id) {
  const res = await fetch(`${BASE_URL}/leases/${id}/messages`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function postLeaseMessage(id, message) {
  const res = await fetch(`${BASE_URL}/leases/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message })
  });
  return handleResponse(res);
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ================= Helper =================
async function handleResponse(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || res.statusText || "Server error";
    throw new Error(errorMsg);
  }

  return data;
}

// ================= Auth APIs =================
export async function registerUser(data) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function loginUser(data) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ================= Admin APIs =================
export async function getAdminProperties() {
  const res = await fetch(`${BASE_URL}/admin/properties`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function getOwnerProperties(ownerId) {
  const res = await fetch(`${BASE_URL}/properties/owner/${ownerId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function toggleProperty(id) {
  const res = await fetch(`${BASE_URL}/properties/${id}/toggle`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

// ================= Property APIs =================
export async function getProperties(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${BASE_URL}/properties?${query}` : `${BASE_URL}/properties`;

  const res = await fetch(url, {
    headers: {
      ...authHeaders()
    }
  });

  return handleResponse(res);
}


export async function getProperty(id) {
  const res = await fetch(`${BASE_URL}/properties/${id}`);
  return handleResponse(res);
}

export async function createProperty(data, ownerId) {
  const res = await fetch(`${BASE_URL}/properties?ownerId=${ownerId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteProperty(id) {
  const res = await fetch(`${BASE_URL}/properties/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}


export async function updateProperty(id, data) {
  const res = await fetch(`${BASE_URL}/properties/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ================= Visit APIs =================
export async function bookVisit(propertyId, data) {
  const res = await fetch(`${BASE_URL}/visits/book?propertyId=${propertyId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getVisits() {
  const res = await fetch(`${BASE_URL}/visits`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function getVisitsByOwner(ownerId) {
  const res = await fetch(`${BASE_URL}/visits/owner/${ownerId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function getVisitsByTenant(email) {
  const url = new URL(`${BASE_URL}/visits/tenant`);
  url.searchParams.set('email', email);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function updateVisitStatus(id, value) {
  const url = new URL(`${BASE_URL}/visits/${id}/status`);
  url.searchParams.set('value', value);
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

// Owner requests reschedule with proposed datetime (ISO local like 2025-12-31T14:30)
export async function requestVisitReschedule(id, proposedDateTime) {
  const url = new URL(`${BASE_URL}/visits/${id}/reschedule`);
  url.searchParams.set('proposedDateTime', proposedDateTime);
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

// Tenant decides reschedule (ACCEPTED or DECLINED)
export async function decideVisitReschedule(id, decision) {
  const url = new URL(`${BASE_URL}/visits/${id}/reschedule/decision`);
  url.searchParams.set('decision', decision);
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

// Tenant updates their visit status (e.g., DONE or PENDING)
export async function tenantUpdateVisitStatus(id, value) {
  const url = new URL(`${BASE_URL}/visits/${id}/tenant-status`);
  url.searchParams.set('value', value);
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

// ================= Visit Chat APIs =================
export async function getVisitMessages(id) {
  const res = await fetch(`${BASE_URL}/visits/${id}/messages`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function postVisitMessage(id, message) {
  const res = await fetch(`${BASE_URL}/visits/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message })
  });
  return handleResponse(res);
}

// ================= Lease APIs =================
export async function createLease(propertyId, data) {
  const res = await fetch(`${BASE_URL}/leases?propertyId=${propertyId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getLeases() {
  const res = await fetch(`${BASE_URL}/leases`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function updateLeaseStatus(id, value) {
  const url = new URL(`${BASE_URL}/leases/${id}/status`);
  url.searchParams.set('value', value);
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}


// ================= Search API =================
export async function searchProperties(filters = {}) {
  const query = new URLSearchParams();
  
  if (filters.city) query.append('city', filters.city);
  if (filters.type) query.append('type', filters.type);
  if (filters.min) query.append('min', filters.min);
  if (filters.max) query.append('max', filters.max);
  
  const url = `${BASE_URL}/properties/search?${query.toString()}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

// ================= Image Upload API =================
export async function uploadPropertyImages(propertyId, files) {
  const formData = new FormData();
  for (const f of files) {
    formData.append('files', f);
  }

  const res = await fetch(`${BASE_URL}/properties/${propertyId}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return handleResponse(res);
}
