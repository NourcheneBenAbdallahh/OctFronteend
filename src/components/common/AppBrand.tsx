import Image from "next/image";
import { APP_NAME, APP_SHORT_NAME, APP_TAGLINE, LOGO_PATH } from "@/lib/branding";

type AppBrandProps = {
  /** Sidebar repliée : logo seul, centré */
  compact?: boolean;
  /** Taille renforcée pour la zone logo de la sidebar */
  size?: "default" | "lg";
  className?: string;
};

export default function AppBrand({
  compact = false,
  size = "default",
  className = "",
}: AppBrandProps) {
  const isLarge = size === "lg";
  const logoSize = isLarge ? 72 : 56;
  const logoClass = isLarge
    ? "h-16 w-16 shrink-0 object-contain object-left lg:h-[4.5rem] lg:w-[4.5rem]"
    : "h-12 w-12 shrink-0 object-contain object-left lg:h-14 lg:w-14";

  const logo = (
    <Image
      src={LOGO_PATH}
      alt={APP_NAME}
      width={logoSize}
      height={logoSize}
      className={logoClass}
      priority
    />
  );

  if (compact) {
    return (
      <div className={`flex items-center justify-center ${className}`}>{logo}</div>
    );
  }

  return (
    <div className={`flex min-w-0 items-center ${isLarge ? "gap-4" : "gap-3"} ${className}`}>
      {logo}
      <div className={`flex min-w-0 flex-col leading-tight ${isLarge ? "gap-1" : "gap-0.5"}`}>
        <span
          className={`font-black tracking-tight text-[#00A09D] dark:text-emerald-400 ${
            isLarge ? "text-xl lg:text-2xl" : "text-base"
          }`}
        >
          {APP_SHORT_NAME}
        </span>
        <span
          className={`font-semibold leading-snug text-gray-600 dark:text-gray-400 ${
            isLarge ? "text-xs lg:text-sm" : "text-[11px]"
          }`}
        >
          {APP_TAGLINE}
        </span>
      </div>
    </div>
  );
}
