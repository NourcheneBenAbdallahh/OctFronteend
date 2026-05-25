"use client";

import AdminRouteGuard from "@/components/access/AdminRouteGuard";
import StockChatbot from "@/components/chatBot/StockChatbot";
import AppInteractiveTour from "@/components/onboarding/AppInteractiveTour";
import FirstLoginOnboardingModal from "@/components/onboarding/FirstLoginOnboardingModal";
import { useSidebar } from "@/context/SidebarContext";
import { canUseStockAi } from "@/lib/access";
import { useFirstLoginOnboarding } from "@/hooks/useFirstLoginOnboarding";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useAuthStore } from "@/store/useAuthStore";
import React, { useCallback, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRole = useAuthStore((s) => s.user?.role);
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isOpen: showOnboarding, close: closeOnboarding } = useFirstLoginOnboarding();
  const [interactiveTourActive, setInteractiveTourActive] = useState(false);

  const startInteractiveTour = useCallback(() => {
    setInteractiveTourActive(true);
  }, []);

  const endInteractiveTour = useCallback(() => {
    setInteractiveTourActive(false);
  }, []);

  React.useEffect(() => {
    const onRelaunch = () => setInteractiveTourActive(true);
    window.addEventListener("oct-start-app-tour", onRelaunch);
    return () => window.removeEventListener("oct-start-app-tour", onRelaunch);
  }, []);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 xl:flex">
        <AppSidebar />
        <Backdrop />
        <div
          className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader />
          <div
            className="mx-auto w-full min-w-0 max-w-(--breakpoint-2xl) p-4 md:p-6"
            data-tour="page-content"
          >
            {children}
          </div>
          {canUseStockAi(userRole) ? <StockChatbot /> : null}
        </div>
      </div>
      <FirstLoginOnboardingModal
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        onStartInteractiveTour={startInteractiveTour}
      />
      <AppInteractiveTour
        active={interactiveTourActive}
        onDone={endInteractiveTour}
      />
    </AdminRouteGuard>
  );
}
