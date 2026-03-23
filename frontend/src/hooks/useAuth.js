import { useMemo, useState } from "react";
import { initialAuthForm } from "../constants/policy";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../constants/storage";

export function useAuth(apiBaseUrl) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [authLoading, setAuthLoading] = useState(false);

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  const persistAuth = (nextToken, nextUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken("");
    setUser(null);
  };

  const updateAuthField = (key, value) => {
    setAuthForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submitAuth = async () => {
    setAuthLoading(true);

    try {
      const endpoint = authMode === "register" ? "/api/register" : "/api/login";
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
        throw new Error(data.message || "Unable to authenticate.");
      }

      persistAuth(data.token, data.user);
      setAuthForm(initialAuthForm);

      return authMode === "register" ? "Account created successfully." : "Logged in successfully.";
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${apiBaseUrl}/api/logout`, {
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
    isAuthenticated,
    logout,
    setAuthMode,
    submitAuth,
    token,
    updateAuthField,
    user,
  };
}
