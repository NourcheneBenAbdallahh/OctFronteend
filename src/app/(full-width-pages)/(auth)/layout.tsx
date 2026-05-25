import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-950">
      <div className="relative h-screen w-full dark:bg-gray-950">
        {children}

        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}