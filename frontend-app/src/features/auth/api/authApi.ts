export type RegisterRequest = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  role: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope?: string;
};

export type UpdateProfileRequest = {
  firstName: string;
  lastName: string;
  email?: string;
  address?: string;
};

export type ChangeCredentialsRequest = {
  currentPassword: string;
  newPassword?: string;
};

interface JwtPayload {
  sub? : string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: {
    [clientId: string]: {
      roles?: string[];
    };
  };
}


export function setTokens(resp: LoginResponse) {
  localStorage.setItem('access_token', resp.access_token);
  localStorage.setItem('refresh_token', resp.refresh_token);
  localStorage.setItem('token_type', resp.token_type ?? 'Bearer');
  if (resp.expires_in) {
    const expiresAt = Date.now() + resp.expires_in * 1000;
    localStorage.setItem('expires_at', String(expiresAt));
  }
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('expires_at');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getTokenType(): string {
  return localStorage.getItem('token_type') || 'Bearer';
}

async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getAccessToken();
  const tokenType = getTokenType();
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `${tokenType} ${token}`);
  return fetch(input, { ...init, headers });
}

export async function registerUser(body: RegisterRequest): Promise<string> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return text;
}



export function getRole(): string {
  return getUserInfoFromToken()?.role?.toUpperCase() || "";
}


export function getUserId(): string {
  return getUserInfoFromToken()?.id || ""
}


export async function loginUser(body: LoginRequest): Promise<LoginResponse> {

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  const data: LoginResponse = await res.json();
  clearTokens();
  setTokens(data);
  console.log(getUserInfoFromToken());

  return data;
}

export function parseJwt(token: string): unknown {
  try {
    const base64Url = token.split('.')[1]; // payload deo
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Invalid JWT", e);
    return null;
  }
}

export interface UserInfo {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: "guest" | "host";
}

export function getUserInfoFromToken(): UserInfo | null {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return null;
  }
  const expiresAtStr = localStorage.getItem("expires_at");
  const expiresAt = expiresAtStr ? Number(expiresAtStr) : 0;
  if (expiresAt && Date.now() > expiresAt) {
    clearTokens(); // očisti localStorage
    return null;
  }

  const payload = parseJwt(token) as JwtPayload | null;

  if (!payload) return null;

  const realmRoles = Array.isArray(payload.realm_access?.roles)
      ? payload.realm_access!.roles
      : [];

  const resourceRoles = payload.resource_access
      ? Object.values(payload.resource_access).flatMap((res) =>
          Array.isArray(res.roles) ? res.roles : []
      )
      : [];

  const allRoles: string[] = [...realmRoles, ...resourceRoles];
  const foundRole = allRoles.find((r) => r === "guest" || r === "host");

  return {
    id: payload.sub,
    email: payload.email || payload.preferred_username || undefined,
    firstName: payload.given_name,
    lastName: payload.family_name,
    role: foundRole as "guest" | "host" | undefined,
  };
}

export async function refreshToken(): Promise<LoginResponse> {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) throw new Error('No refresh token');
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) {
    const txt = await res.text();
    clearTokens();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const data: LoginResponse = await res.json();
  setTokens(data);
  return data;
}

export async function getProfile(): Promise<UpdateProfileRequest> {
  const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
    method: 'GET',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();

}

export async function updateProfile(body: UpdateProfileRequest): Promise<string> {
  const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || `HTTP ${res.status}`);
  return txt;
}

export async function changeCredentials(body: ChangeCredentialsRequest): Promise<string> {
  const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/auth/credentials`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || `HTTP ${res.status}`);
  return txt;
}

export function logout() {
  clearTokens();
}

export interface HostProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function getHostProfile(hostId: string): Promise<HostProfile> {
  const res = await authFetch(
      `${import.meta.env.VITE_API_URL}/api/auth/host/${hostId}`,
      {
        method: 'GET',
      }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }

  return res.json();
}
