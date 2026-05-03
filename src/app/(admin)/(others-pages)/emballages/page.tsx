// src/app/(admin)/(others-pages)/emballages/page.tsx
"use client";

import { Suspense } from "react";
import EmballagesClient from "./EmballagesClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Chargement…</div>}>
      <EmballagesClient />
    </Suspense>
  );
}