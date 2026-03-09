import { ThemeProvider } from "@/context/ThemeContext";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white dark:bg-gray-900 overflow-hidden">
      <ThemeProvider>
        <div className="relative w-full h-screen dark:bg-gray-900">
          
          {children}

          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
          
        </div>
      </ThemeProvider>
    </div>
  );
}