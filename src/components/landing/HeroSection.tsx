import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 gradient-hero overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Powered by AI
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Visualize a{' '}
              <span className="text-primary">decoração perfeita</span>{' '}
              antes de pintar
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Faça upload de uma foto do seu ambiente e use inteligência artificial 
              para testar cores de tintas reais de marcas como Suvinil, Coral e Sherwin-Williams.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="gradient-accent text-accent-foreground font-semibold text-lg px-8 py-6 rounded-xl shadow-medium hover:shadow-large transition-all duration-300 hover:scale-105"
              >
                Começar agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-xl"
                asChild
              >
                <Link to="/admin/login">
                  <Building2 className="w-5 h-5 mr-2" />
                  Área da Empresa
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              ✓ Grátis para usar &nbsp; ✓ Sem cadastro &nbsp; ✓ Resultados instantâneos
            </p>
          </div>

          {/* Hero visual */}
          <div className="relative lg:pl-8">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-large bg-card">
              {/* Before/After preview mockup */}
              <div className="absolute inset-0 grid grid-cols-2">
                <div className="bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center border-r border-border">
                  <div className="text-center p-4">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-muted-foreground/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" />
                      </svg>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">ANTES</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-primary/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" />
                      </svg>
                    </div>
                    <span className="text-xs text-primary font-medium">DEPOIS</span>
                  </div>
                </div>
              </div>
              
              {/* Slider handle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-card rounded-full shadow-medium flex items-center justify-center border-2 border-primary">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>

            {/* Floating color swatches */}
            <div className="absolute -top-4 -right-4 flex gap-1">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B6B] shadow-soft" />
              <div className="w-8 h-8 rounded-lg bg-[#40E0D0] shadow-soft" />
              <div className="w-8 h-8 rounded-lg bg-[#E4A82B] shadow-soft" />
            </div>

            {/* Brand badges */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
              <div className="bg-card px-3 py-1.5 rounded-lg shadow-soft text-xs font-medium text-muted-foreground">
                Suvinil
              </div>
              <div className="bg-card px-3 py-1.5 rounded-lg shadow-soft text-xs font-medium text-muted-foreground">
                Coral
              </div>
              <div className="bg-card px-3 py-1.5 rounded-lg shadow-soft text-xs font-medium text-muted-foreground">
                Sherwin-Williams
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
