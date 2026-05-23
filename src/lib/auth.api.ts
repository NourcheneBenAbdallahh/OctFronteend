import { graphqlRequest } from "@/lib/graphqlClient";
import { AuthPayload, LoginInput, RegisterInput, User } from "@/types/auth";

// GraphQL mutations & queries
const LOGIN_MUTATION = `
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    isFirstLogin
    user {
      id
      name
      email
      role
      isActive
      emailVerifiedAt
      telephone
      phoneVerifiedAt
    }
  }
}`;

const REGISTER_MUTATION = `
mutation Register($name: String!, $email: String!, $password: String!, $role: String) {
  register(name: $name, email: $email, password: $password, role: $role) {
    token
    user {
      id
      name
      email
      role
      isActive
      emailVerifiedAt
      telephone
      phoneVerifiedAt
    }
  }
}`;

const VERIFY_EMAIL_MUTATION = `
mutation VerifyEmail($token: String!) {
  verifyEmail(token: $token)
}`;

const RESEND_VERIFICATION_MUTATION = `
mutation ResendVerificationEmail {
  resendVerificationEmail
}`;

const SEND_PHONE_VERIFICATION_MUTATION = `
mutation SendPhoneVerificationCode($telephone: String!) {
  sendPhoneVerificationCode(telephone: $telephone)
}`;

const VERIFY_PHONE_MUTATION = `
mutation VerifyPhone($code: String!) {
  verifyPhone(code: $code)
}`;


const FORGOT_PASSWORD_MUTATION = `
mutation ForgotPassword($email: String!) {
  forgotPassword(email: $email)
}`;

const RESET_PASSWORD_MUTATION = `
mutation ResetPassword(
  $email: String!,
  $token: String!,
  $password: String!,
  $password_confirmation: String!
) {
  resetPassword(
    email: $email,
    token: $token,
    password: $password,
    password_confirmation: $password_confirmation
  )
}`;


const ME_QUERY = `
query Me {
  me {
    id
    name
    email
    role
    isActive
    emailVerifiedAt
    telephone
    phoneVerifiedAt
  }
}`;

const LOGOUT_MUTATION = `
mutation Logout {
  logout
}`;

export async function login(input: LoginInput): Promise<AuthPayload> {
  return graphqlRequest<{ login: AuthPayload }>(LOGIN_MUTATION, input, {
    skipAuth: true,
  }).then((d) => d.login);
}

export async function register(input: RegisterInput): Promise<AuthPayload> {
  return graphqlRequest<{ register: AuthPayload }>(REGISTER_MUTATION, input, {
    skipAuth: true,
  }).then((d) => d.register);
}

export async function verifyEmail(token: string): Promise<string> {
  return graphqlRequest<{ verifyEmail: string }>(
    VERIFY_EMAIL_MUTATION,
    { token },
    { skipAuth: true }
  ).then((d) => d.verifyEmail);
}

export async function resendVerificationEmail(token?: string): Promise<string> {
  return graphqlRequest<{ resendVerificationEmail: string }>(
    RESEND_VERIFICATION_MUTATION,
    {},
    { token }
  ).then((d) => d.resendVerificationEmail);
}

export async function sendPhoneVerificationCode(
  telephone: string,
  token?: string
): Promise<string> {
  return graphqlRequest<{ sendPhoneVerificationCode: string }>(
    SEND_PHONE_VERIFICATION_MUTATION,
    { telephone },
    { token }
  ).then((d) => d.sendPhoneVerificationCode);
}

export async function verifyPhone(code: string, token?: string): Promise<string> {
  return graphqlRequest<{ verifyPhone: string }>(
    VERIFY_PHONE_MUTATION,
    { code },
    { token }
  ).then((d) => d.verifyPhone);
}

export async function forgotPassword(email: string): Promise<string> {
  return graphqlRequest<{ forgotPassword: string }>(
    FORGOT_PASSWORD_MUTATION,
    { email },
    { skipAuth: true }
  ).then((d) => d.forgotPassword);
}

export async function resetPassword(input: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<string> {
  return graphqlRequest<{ resetPassword: string }>(RESET_PASSWORD_MUTATION, input, {
    skipAuth: true,
  }).then((d) => d.resetPassword);
}

export async function me(token?: string): Promise<User | null> {
  return graphqlRequest<{ me: User }>(ME_QUERY, {}, { token })
    .then((d) => d.me)
    .catch(() => null);
}

export async function logout(token?: string): Promise<boolean> {
  return graphqlRequest<{ logout: boolean }>(LOGOUT_MUTATION, {}, { token }).then((d) => d.logout);
}