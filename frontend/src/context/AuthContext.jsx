import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

export const AUTH_STORAGE_KEY = "mixon_auth_state_v1";

const AuthContext = createContext(null);

const normalizeRoleValue = (role) => {
  if (role == null) {
    return null;
  }

  if (typeof role === "number") {
    switch (role) {
      case 3:
        return "department";
      case 2:
        return "admin";
      case 1:
        return "manager";
      default:
        return "user";
    }
  }

  if (typeof role === "object" && "name" in role) {
    return normalizeRoleValue(role.name);
  }

  const value = role.toString().toLowerCase();
  if (value === "customer") {
    return "user";
  }
  return value;
};

const buildRoleSet = (roles, fallback) => {
  const result = [];
  const addRole = (role) => {
    const normalized = normalizeRoleValue(role);
    if (normalized && !result.includes(normalized)) {
      result.push(normalized);
    }
  };

  if (Array.isArray(roles)) {
    roles.forEach(addRole);
  } else {
    addRole(roles);
  }

  addRole(fallback);

  if (result.length === 0) {
    result.push("user");
  }

  return result;
};

const selectPrimaryRole = (roles) => {
  if (!roles?.length) {
    return "user";
  }

  if (roles.includes("admin")) {
    return "admin";
  }

  if (roles.includes("manager")) {
    return "manager";
  }

  if (roles.includes("department")) {
    return "department";
  }

  if (roles.includes("user")) {
    return "user";
  }

  return roles[0];
};

const ensureUserRoles = (user) => {
  if (!user) {
    return null;
  }

  const roles = buildRoleSet(user.roles, user.role);
  const primaryRole = selectPrimaryRole(roles);

  return {
    ...user,
    roles,
    role: primaryRole,
  };
};

const readPersistedAuth = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed) {
      return null;
    }

    return {
      ...parsed,
      user: ensureUserRoles(parsed.user),
    };
  } catch (error) {
    console.warn("Unable to parse auth storage", error);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => readPersistedAuth() ?? {
    token: null,
    tokenExpiresAt: null,
    user: null
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    } catch (error) {
      console.warn("Unable to persist auth state", error);
    }
  }, [authState]);

  const login = useCallback(({ token, tokenExpiresAt, user }) => {
    setAuthState({
      token: token ?? null,
      tokenExpiresAt: tokenExpiresAt ?? null,
      user: ensureUserRoles(user)
    });
  }, []);

  const logout = useCallback(() => {
    setAuthState({ token: null, tokenExpiresAt: null, user: null });
  }, []);

  const value = useMemo(() => {
    const expiresAt = authState.tokenExpiresAt ? new Date(authState.tokenExpiresAt).getTime() : null;
    const isExpired = expiresAt ? Date.now() > expiresAt : false;
    return {
      token: authState.token,
      tokenExpiresAt: authState.tokenExpiresAt,
      user: authState.user,
      isAuthenticated: Boolean(authState.token) && !isExpired,
      login,
      logout
    };
  }, [authState, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
