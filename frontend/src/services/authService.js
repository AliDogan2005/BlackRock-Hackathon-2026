const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const AUTH_STORAGE_KEYS = {
  token: "nexus.authToken",
  user: "nexus.authUser",
};

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function toUsernameCandidate(fullName, email) {
  const emailPrefix = (email || "").split("@")[0] || "";
  const base = (fullName || emailPrefix || "nexus_user")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "");

  if (base.length >= 3) {
    return base.slice(0, 50);
  }

  return `nexus_${Date.now()}`.slice(0, 50);
}

function parseFullName(fullName) {
  const parts = (fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] || null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

async function parseError(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const validationMessage = payload?.errors
    ? Object.values(payload.errors).filter(Boolean).join(" ")
    : "";
  const message = payload?.message || validationMessage || `Request failed (${response.status})`;

  throw new Error(message);
}

async function postJson(path, body) {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseError(response);
  }

  const payload = await response.json();

  if (!payload?.token) {
    throw new Error("Authentication token was not returned by the server.");
  }

  return payload;
}

export async function loginUser({ email, password }) {
  return postJson("/api/auth/login", {
    usernameOrEmail: String(email || "").trim(),
    password,
  });
}

export async function registerUser({ fullName, email, password, confirmPassword }) {
  const { firstName, lastName } = parseFullName(fullName);

  return postJson("/api/auth/register", {
    username: toUsernameCandidate(fullName, email),
    email: String(email || "").trim(),
    password,
    passwordConfirm: confirmPassword,
    firstName,
    lastName,
  });
}

export function persistAuth(authPayload) {
  const authUser = {
    userId: authPayload.userId,
    username: authPayload.username,
    email: authPayload.email,
  };

  localStorage.setItem(AUTH_STORAGE_KEYS.token, authPayload.token);
  localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(authUser));
}

export function clearPersistedAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.token);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
}

export function getPersistedToken() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.token);
}

export function getPersistedUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEYS.user);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function fetchUserProfile(userId, token) {
  const response = await fetch(buildUrl(`/api/users/${userId}`), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.json();
}

export async function updateUserDisplayName(displayName) {
  const user = getPersistedUser();
  const token = getPersistedToken();

  if (!user?.userId || !token) {
    throw new Error("No active session found. Please login again.");
  }

  const normalizedName = String(displayName || "").trim();
  if (!normalizedName) {
    throw new Error("Display name is required.");
  }

  const { firstName, lastName } = parseFullName(normalizedName);

  const response = await fetch(buildUrl(`/api/users/${user.userId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      firstName,
      lastName,
    }),
  });

  if (!response.ok) {
    await parseError(response);
  }

  const updated = await response.json();

  localStorage.setItem(
    AUTH_STORAGE_KEYS.user,
    JSON.stringify({
      userId: updated?.id ?? user.userId,
      username: updated?.username ?? user.username,
      email: updated?.email ?? user.email,
      firstName: updated?.firstName ?? firstName,
      lastName: updated?.lastName ?? lastName,
    })
  );

  return updated;
}
