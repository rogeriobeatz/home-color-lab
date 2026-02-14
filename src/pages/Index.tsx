import { useState } from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';
import { PricingSection } from '@/components/landing/PricingSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { EditorView } from '@/components/editor/EditorView';

type View = 'landing' | 'editor';

const Index = () => {
  const [view, setView] = useState<View>('landing');

  const handleGetStarted = () => {
    setView('editor');
  };

  const handleBackToLanding = () => {
    setView('landing');
  };

  if (view === 'editor') {
    return <EditorView onBack={handleBackToLanding} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onGetStarted={handleGetStarted} />
      <HowItWorks />
      <Features />
      <PricingSection />
      <CTASection onGetStarted={handleGetStarted} />
      <Footer />
    </div>
  );
};

export default Index;
