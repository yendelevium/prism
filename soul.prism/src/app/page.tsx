"use client";

import HeroSection from "@/components/homepage/HeroSection";
import FeaturesSection from "@/components/homepage/FeaturesSection";
import TracingPreview from "@/components/homepage/TracingPreview";
import WorkflowsPreview from "@/components/homepage/WorkflowsPreview";
import ChaosPreview from "@/components/homepage/ChaosPreview";
import AnalyticsPreview from "@/components/homepage/AnalyticsPreview";
import CTASection from "@/components/homepage/CTASection";
import Footer from "@/components/homepage/Footer";
import Navbar from "@/components/homepage/Navbar";

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
