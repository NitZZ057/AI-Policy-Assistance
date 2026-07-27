import { useMemo, useState } from "react";
import { initialAuthForm } from "../constants/policy";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../constants/storage";

/* "Keep me signed in" picks the storage the session lands in: localStorage
   survives a browser restart, sessionStorage dies with the tab. */
function readStored(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
}

export function useAuth(apiBaseUrl) {
  const [token, setToken] = useState(() => readStored(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => {
    const stored = readStored(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [authLoading, setAuthLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  const persistAuth = (nextToken, nextUser, { persistent = rememberMe } = {}) => {
    const target = persistent ? localStorage : sessionStorage;
    const other = persistent ? sessionStorage : localStorage;

    other.removeItem(TOKEN_STORAGE_KEY);
    other.removeItem(USER_STORAGE_KEY);
    target.setItem(TOKEN_STORAGE_KEY, nextToken);
    target.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));

    setToken(nextToken);
    setUser(nextUser);
  };

  const clearAuth = () => {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem(TOKEN_STORAGE_KEY);
      store.removeItem(USER_STORAGE_KEY);
    }

    setToken("");
    setUser(null);
  };

  const updateAuthField = (key, value) => {
    setAuthForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleRememberMe = () => setRememberMe((current) => !current);

  const submitAuth = async () => {
    setAuthLoading(true);

    try {
      const endpoint = authMode === "register" ? "/register" : "/login";
      const payload =
        authMode === "register"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password,
            };

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.detail || "Unable to authenticate.");
      }

      persistAuth(data.token, data.user);
      setAuthForm(initialAuthForm);

      return authMode === "register" ? "Account created successfully." : "Logged in successfully.";
    } finally {
      setAuthLoading(false);
    }
  };

  const loginAsGuest = async () => {
    setGuestLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/guest`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.detail || "Unable to start a guest session.");
      }

      // A guest workspace is throwaway by design, so it never outlives the tab.
      persistAuth(data.token, data.user, { persistent: false });
      setAuthForm(initialAuthForm);

      return "Signed in as a guest.";
    } finally {
      setGuestLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${apiBaseUrl}/logout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } finally {
      clearAuth();
    }
  };

  return {
    authForm,
    authLoading,
    authMode,
    clearAuth,
    guestLoading,
    isAuthenticated,
    loginAsGuest,
    logout,
    rememberMe,
    setAuthMode,
    submitAuth,
    toggleRememberMe,
    token,
    updateAuthField,
    user,
  };
}
