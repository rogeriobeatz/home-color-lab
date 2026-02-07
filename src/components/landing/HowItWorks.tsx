import { Upload, Sparkles, Palette, Download } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Envie sua foto',
    description: 'Tire uma foto do seu ambiente ou faça upload de uma imagem',
  },
  {
    icon: Sparkles,
    title: 'IA identifica',
    description: 'Nossa inteligência artificial reconhece paredes, teto e piso automaticamente',
  },
  {
    icon: Palette,
    title: 'Escolha cores',
    description: 'Explore catálogos reais de marcas como Suvinil, Coral e Sherwin-Williams',
  },
  {
    icon: Download,
    title: 'Exporte o resultado',
    description: 'Baixe a imagem ou gere um relatório PDF profissional',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-secondary/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Como funciona
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Em poucos minutos, visualize como ficará a decoração dos seus sonhos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center text-center group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-border" />
              )}
              
              {/* Step number */}
              <div className="relative z-10 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-card shadow-medium flex items-center justify-center group-hover:shadow-large transition-shadow duration-300">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-sm font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
