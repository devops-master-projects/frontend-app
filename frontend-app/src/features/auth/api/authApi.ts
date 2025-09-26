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

export async function registerUser(body: RegisterRequest): Promise<string> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text(); 
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  return text; 
}



export function getRole(): string {
  return "HOST";
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

  return res.json();

}
