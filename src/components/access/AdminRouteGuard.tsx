"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  canAccessPath,
  defaultHomePath,
  shouldBypassRouteAccess,
} from "@/lib/access";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (shouldBypassRouteAccess(pathname)) return;
    if (!token || !user?.role) return;
    if (!canAccessPath(pathname, user.role)) {
      router.replace(defaultHomePath(user.role));
    }
  }, [pathname, router, token, user]);

  return <>{children}</>;
}
