/**
 * Classes Tailwind réutilisables pour le thème clair / sombre.
 * Préférer ces constantes dans les nouveaux composants.
 */
export const ui = {
  page: "min-h-screen bg-gray-50 dark:bg-gray-950",
  surface: "bg-white dark:bg-gray-900",
  surfaceMuted: "bg-gray-50 dark:bg-gray-800/80",
  surfaceElevated: "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800",
  textPrimary: "text-[#1C2434] dark:text-gray-50",
  textSecondary: "text-gray-600 dark:text-gray-300",
  textMuted: "text-gray-500 dark:text-gray-400",
  textAccent: "text-[#00A09D] dark:text-brand-400",
  border: "border-gray-100 dark:border-gray-800",
  borderStrong: "border-gray-200 dark:border-gray-700",
  input:
    "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-[#1C2434] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500",
  btnSecondary:
    "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-[#1C2434] dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800",
  btnPrimary:
    "bg-[#1C2434] dark:bg-brand-500 text-white hover:bg-black dark:hover:bg-brand-600",
  overlay: "bg-[#1C2434]/20 dark:bg-black/50 backdrop-blur-sm",
  drawer: "bg-white dark:bg-gray-900 shadow-[-20px_0_50px_rgba(0,0,0,0.15)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.4)]",
} as const;
