"use client";

import { Suspense } from "react";
import UnitesMesureClient from "./UnitesMesureClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Chargement…</div>}>
      <UnitesMesureClient />
    </Suspense>
  );
}
