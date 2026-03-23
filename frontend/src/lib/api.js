export function createApiClient({ apiBaseUrl, getToken, onUnauthorized }) {
  return async function apiRequest(path, options = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        onUnauthorized?.();
      }

      throw new Error(data.message || "Request failed.");
    }

    return data;
  };
}
