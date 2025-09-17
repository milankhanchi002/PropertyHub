// src/api.js
const BASE_URL = "http://localhost:8080/api";

function getToken() {
  return localStorage.getItem("token");
}

// ================= Helper (No changes needed) =================
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

// ================= Auth APIs (No changes needed) =================
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

// ================= Admin APIs (No changes needed) =================
export async function getAdminProperties() {
  const res = await fetch(`${BASE_URL}/admin/properties`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function toggleProperty(id) {
  const res = await fetch(`${BASE_URL}/admin/properties/${id}/toggle`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

// ================= Property APIs (Updates below) =================
export async function getProperties(params = {}) {
  // Clear any empty parameters to avoid things like 'city=' in the URL
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== '')
  );

  const query = new URLSearchParams(cleanParams).toString();

  // ✅ CHANGED: Pointing to the correct '/search' endpoint for filtering.
  const url = query ? `${BASE_URL}/properties/search?${query}` : `${BASE_URL}/properties/search`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  return handleResponse(res);
}

export async function getProperty(id) {
  const res = await fetch(`${BASE_URL}/properties/${id}`, {
    // ✅ ADDED: Authorization header for consistency and security.
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });
  return handleResponse(res);
}

// --- No changes to the functions below ---

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

// ================= Visit APIs (No changes needed) =================
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

// ================= Booking / Payment APIs (No changes needed) =================
export async function createBooking(userId, propertyId) {
  const res = await fetch(`${BASE_URL}/bookings/leases?userId=${userId}&propertyId=${propertyId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function getBookings() {
  const res = await fetch(`${BASE_URL}/bookings`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function makePayment(leaseId, amountCents) {
  const res = await fetch(`${BASE_URL}/payments?leaseId=${leaseId}&amountCents=${amountCents}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}