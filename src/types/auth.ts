export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  emailVerifiedAt?: string | null;
};

export type AuthPayload = {
  token: string;
  user: User;
};

// Input pour login
export type LoginInput = {
  email: string;
  password: string;
};

// Input pour register
export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: string; 
};

// Réponse pour verify email
export type VerifyEmailResponse = string;

// Réponse pour resend email
export type ResendVerificationResponse = string;

// Réponse pour logout
export type LogoutResponse = boolean;