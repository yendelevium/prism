"use client";

import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TracingPreview from "@/components/landing/TracingPreview";
import WorkflowsPreview from "@/components/landing/WorkflowsPreview";
import ChaosPreview from "@/components/landing/ChaosPreview";
import AnalyticsPreview from "@/components/landing/AnalyticsPreview";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TracingPreview />
        <div className="bg-secondary/5">
          <WorkflowsPreview />
        </div>
        <ChaosPreview />
        <div className="bg-secondary/5">
          <AnalyticsPreview />
        </div>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
