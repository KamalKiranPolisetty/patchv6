import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import LandingClient from "@/components/LandingClient";

export default function HomePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="min-h-full bg-[#FAFAF8]" />}>
        <LandingClient />
      </Suspense>
    </AppShell>
  );
}
