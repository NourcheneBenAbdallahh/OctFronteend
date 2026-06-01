"use client";

import { isDisplayablePhoto } from "@/lib/imageToDataUrl";

type Props = {
  photo?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  fallbackSrc?: string;
};

export default function UserPhotoAvatar({
  photo,
  name,
  size = 44,
  className = "",
  fallbackSrc = "/images/user/owner.png",
}: Props) {
  const initial = name?.trim().charAt(0)?.toUpperCase() || "?";

  if (isDisplayablePhoto(photo)) {
    return (
      <img
        src={photo}
        alt={name ?? "Photo de profil"}
        width={size}
        height={size}
        className={`object-cover ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  if (name?.trim()) {
    return (
      <span
        className={`flex items-center justify-center font-bold text-[#00A09D] ${className}`}
        style={{ width: size, height: size }}
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      src={fallbackSrc}
      alt={name ?? "Photo de profil"}
      width={size}
      height={size}
      className={`object-cover ${className}`}
    />
  );
}
