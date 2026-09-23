import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustStrip from "@/components/landing/TrustStrip";
import HowItWorks from "@/components/landing/HowItWorks";
import PaymentDemo from "@/components/landing/PaymentDemo";
import Dashboard from "@/components/landing/Dashboard";
import RecurringPayments from "@/components/landing/RecurringPayments";
import CampaignsQR from "@/components/landing/CampaignsQR";
import Organizations from "@/components/landing/Organizations";
import TrustSecurity from "@/components/landing/TrustSecurity";
import Pricing from "@/components/landing/Pricing";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream overflow-x-clip">
      <Navbar />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <PaymentDemo />
      <Dashboard />
      <RecurringPayments />
      <CampaignsQR />
      <Organizations />
      <TrustSecurity />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
