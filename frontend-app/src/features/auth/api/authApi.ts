export type RegisterRequest = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  role: string;
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
  return "GUEST";
}
