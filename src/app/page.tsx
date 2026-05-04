"use client";

import { useUser } from "@clerk/nextjs";
import { LandingPage } from "@/components/LandingPage";
import { Dashboard } from "@/components/Dashboard";

function HomeContent() {
  const { isLoaded, isSignedIn } = useUser();
  const showDashboard = isLoaded && isSignedIn;

  if (showDashboard) {
    return <Dashboard />;
  }

  return <LandingPage />;
}

export default function Home() {
  return <HomeContent />;
}
