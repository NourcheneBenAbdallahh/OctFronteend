import { graphqlRequest, type GraphqlRequestOptions } from "@/lib/graphqlClient";

export type UserRole = "ADMIN" | "STOCK" | "LOGISTIQUE" | "CONTRAT" | "FINANCE";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdminUsersPaginatorInfo = {
  count: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

const USER_FIELDS = `
  id
  name
  email
  role
  createdAt
  updatedAt
`;

/** Liste paginée + recherche texte / filtre par rôle (ADMIN uniquement côté API). */
export async function listAdminUsers(
  page: number,
  first: number,
  filters: { search?: string | null; role?: string | null },
  opts?: GraphqlRequestOptions
): Promise<{ data: AdminUser[]; paginatorInfo: AdminUsersPaginatorInfo }> {
  const query = `
    query AdminUsers($page: Int!, $first: Int!, $search: String, $role: String) {
      adminUsers(page: $page, first: $first, search: $search, role: $role) {
        data {
          ${USER_FIELDS}
        }
        paginatorInfo {
          count
          currentPage
          lastPage
          perPage
          total
        }
      }
    }
  `;
  const variables = {
    page,
    first,
    search:
      filters.search && filters.search.trim() !== ""
        ? filters.search.trim()
        : null,
    role:
      filters.role && filters.role.trim() !== ""
        ? filters.role.trim().toUpperCase()
        : null,
  };

  const data = await graphqlRequest<{
    adminUsers: {
      data: AdminUser[];
      paginatorInfo: AdminUsersPaginatorInfo;
    };
  }>(query, variables, opts);

  const bundle = data.adminUsers;
  const p = bundle?.paginatorInfo;
  return {
    data: bundle?.data ?? [],
    paginatorInfo: p ?? {
      count: 0,
      currentPage: page,
      lastPage: 1,
      perPage: first,
      total: 0,
    },
  };
}

export async function adminCreateUser(
  input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  },
  opts?: GraphqlRequestOptions
): Promise<AdminUser> {
  const mutation = `
    mutation AdminCreateUser($input: AdminCreateUserInput!) {
      adminCreateUser(input: $input) {
        ${USER_FIELDS}
      }
    }
  `;
  const data = await graphqlRequest<{ adminCreateUser: AdminUser }>(
    mutation,
    { input },
    opts
  );
  return data.adminCreateUser;
}

export async function adminUpdateUserRole(
  id: string | number,
  role: UserRole,
  opts?: GraphqlRequestOptions
): Promise<AdminUser> {
  const mutation = `
    mutation AdminUpdateUserRole($id: ID!, $role: String!) {
      adminUpdateUserRole(id: $id, role: $role) {
        ${USER_FIELDS}
      }
    }
  `;
  const data = await graphqlRequest<{ adminUpdateUserRole: AdminUser }>(
    mutation,
    { id, role },
    opts
  );
  return data.adminUpdateUserRole;
}

export async function adminDeleteUser(
  id: string | number,
  opts?: GraphqlRequestOptions
): Promise<boolean> {
  const mutation = `
    mutation AdminDeleteUser($id: ID!) {
      adminDeleteUser(id: $id)
    }
  `;
  const data = await graphqlRequest<{ adminDeleteUser: boolean }>(
    mutation,
    { id },
    opts
  );
  return data.adminDeleteUser;
}

export async function adminResetUserPassword(
  id: string | number,
  password: string,
  opts?: GraphqlRequestOptions
): Promise<AdminUser> {
  const mutation = `
    mutation AdminResetUserPassword($id: ID!, $password: String!) {
      adminResetUserPassword(id: $id, password: $password) {
        ${USER_FIELDS}
      }
    }
  `;
  const data = await graphqlRequest<{ adminResetUserPassword: AdminUser }>(
    mutation,
    { id, password },
    opts
  );
  return data.adminResetUserPassword;
}
