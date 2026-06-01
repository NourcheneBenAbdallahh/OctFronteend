import Image from "next/image";
import { APP_NAME, LOGO_PATH } from "@/lib/branding";

type AppBrandProps = {
  /** Sidebar repliée : icône seule */
  compact?: boolean;
  className?: string;
};

export default function AppBrand({ compact = false, className = "" }: AppBrandProps) {
  if (compact) {
    return (
      <Image
        src={LOGO_PATH}
        alt={APP_NAME}
        width={44}
        height={44}
        className={`h-11 w-11 shrink-0 object-contain object-center ${className}`}
        priority
      />
    );
  }

  return (
    <Image
      src={LOGO_PATH}
      alt={APP_NAME}
      width={220}
      height={64}
      className={`h-16 w-auto max-w-[220px] shrink-0 object-contain object-center ${className}`}
      priority
    />
  );
}
