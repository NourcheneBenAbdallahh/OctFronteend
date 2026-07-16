"use client";

import AdminRouteGuard from "@/components/access/AdminRouteGuard";
import StockChatbot from "@/components/chatBot/StockChatbot";
import AlertToastStack from "@/components/notifications/AlertToastStack";
import { LiveAlertsProvider } from "@/context/LiveAlertsContext";
import { useSidebar } from "@/context/SidebarContext";
import { canUseStockAi } from "@/lib/access";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useAuthStore } from "@/store/useAuthStore";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRole = useAuthStore((s) => s.user?.role);
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <AdminRouteGuard>
      <LiveAlertsProvider>
      <div className="min-h-screen min-w-0 bg-gray-50 dark:bg-gray-950 xl:flex">
        <AppSidebar />
        <Backdrop />
        <div
          className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader />
          <div className="mx-auto w-full min-w-0 max-w-(--breakpoint-2xl) p-4 md:p-6">
            {children}
          </div>
          {canUseStockAi(userRole) ? <StockChatbot /> : null}
        </div>
      </div>
      <AlertToastStack />
      </LiveAlertsProvider>
    </AdminRouteGuard>
  );
}
