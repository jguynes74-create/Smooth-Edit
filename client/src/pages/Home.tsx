import Header from "@/components/Header";
import HeroUpload from "@/components/HeroUpload";
import Dashboard from "@/components/Dashboard";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <HeroUpload />
      <Dashboard />
      <Features />
      <Pricing />
      <Testimonials />
      <Footer />
    </div>
  );
}
