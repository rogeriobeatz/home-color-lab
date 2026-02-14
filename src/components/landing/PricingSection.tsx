import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const features = [
  'Simulador de ambientes com IA',
  'Catálogos de tintas personalizados',
  'Página personalizada para seus clientes',
  'Relatório PDF profissional',
  'Upload de logotipo e cores da marca',
  'Suporte por e-mail',
];

export function PricingSection() {
  return (
    <section className="py-20 px-4 bg-secondary/30" id="pricing">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Plano simples, sem surpresas
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tudo o que você precisa para oferecer uma experiência única aos seus clientes.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="relative bg-card rounded-3xl border-2 border-primary shadow-large overflow-hidden">
            {/* Badge */}
            <div className="absolute top-0 right-0 gradient-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
              Recomendado
            </div>

            <div className="p-8 text-center">
              <h3 className="font-display text-xl font-bold text-foreground mb-2">Profissional</h3>
              <p className="text-muted-foreground text-sm mb-6">Para lojas de tintas e pintores</p>

              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-sm text-muted-foreground">R$</span>
                <span className="font-display text-5xl font-bold text-foreground">59</span>
                <span className="text-2xl font-bold text-foreground">,90</span>
                <span className="text-muted-foreground text-sm">/mês</span>
              </div>

              <p className="text-xs text-muted-foreground mb-8">Cancele a qualquer momento</p>

              <ul className="space-y-3 text-left mb-8">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button size="lg" className="w-full gradient-accent text-accent-foreground font-semibold text-lg py-6 rounded-xl" asChild>
                <Link to="/admin/login">
                  Começar agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
