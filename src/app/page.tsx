"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import HeroEngine, { type AppStatus } from "@/components/HeroEngine";
import Footer from "@/components/Footer";
import DynamicNav from "@/components/DynamicNav";

// Dynamically import GSAP/Client-heavy components with SSR disabled
const Recommendations = dynamic(() => import("@/components/Recommendations"), {
  ssr: false,
  loading: () => <div className="h-screen bg-background" />,
});

const CustomCursor = dynamic(() => import("@/components/CustomCursor"), {
  ssr: false,
});

export default function Home() {
  const [appStatus, setAppStatus] = useState<AppStatus>("idle");

  return (
    <main className="relative bg-background">
      <CustomCursor />

      {/* Dynamic Navbar — reads live app status */}
      <DynamicNav status={appStatus} />

      <HeroEngine onStatusChange={setAppStatus} />

      <div className="relative z-10">
        <Recommendations />
      </div>

      <Footer />
    </main>
  );
}
