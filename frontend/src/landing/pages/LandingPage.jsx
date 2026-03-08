import Navbar from "@/landing/components/landing/Navbar";
import HeroSection from "@/landing/components/landing/HeroSection";
import ProblemSection from "@/landing/components/landing/ProblemSection";
import HowItWorksSection from "@/landing/components/landing/HowItWorksSection";
import FeaturesSection from "@/landing/components/landing/FeaturesSection";
import SystemPreview from "@/landing/components/landing/SystemPreview";
import CTASection from "@/landing/components/landing/CTASection";
import Footer from "@/landing/components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <SystemPreview />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;

