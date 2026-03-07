export default function WhatIsNexusSection() {
  const pillars = [
    {
      title: "Fractional Property Ownership",
      subtitle: "The Saving Phase",
      description:
        "Save by the square meter. Access geographical real estate tokens starting with small amounts. Build equity in high-growth regions without the need for a massive down payment.",
      accent: "bg-nexus-primary-gold",
      badge: "Human + Machine",
    },
    {
      title: "Macro & Sentiment Scoring",
      subtitle: "The Intelligence Phase",
      description:
        "Institutional-grade risk management. Our AI engine combines global macro regimes with local municipal news to provide real-time buy/sell signals and risk scores.",
      accent: "bg-nexus-secondary-growth",
      badge: "Machine Intelligence",
    },
    {
      title: "Direct Deed Conversion",
      subtitle: "The Goal Phase",
      description:
        "No credit checks, no interest rates. Once you reach your token threshold, convert your digital portfolio directly into physical homeownership through our partner network.",
      accent: "bg-nexus-primary-espresso",
      badge: "Human Decision",
    },
  ];

  return (
    <section id="market" className="relative overflow-hidden bg-nexus-primary-beige px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-nexus-secondary-growth">
            What Is NEXUS
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-nexus-primary-espresso sm:text-4xl lg:text-5xl">
            Human Conviction. Machine Precision.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-nexus-primary-espresso/80 sm:text-lg">
            NEXUS combines expert financial judgment with intelligent automation to redefine how real-world assets are accessed, evaluated, and traded.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="group relative rounded-2xl border border-nexus-primary-espresso/10 bg-white/70 p-6 shadow-lg shadow-nexus-primary-espresso/5 backdrop-blur-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-nexus-primary-espresso/15"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className={`h-2.5 w-12 rounded-full ${pillar.accent}`} />
                <span className="rounded-full border border-nexus-primary-espresso/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-nexus-primary-espresso/70">
                  {pillar.badge}
                </span>
              </div>

              <h3 className="text-xl font-bold text-nexus-primary-espresso">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm font-medium text-nexus-secondary-growth">
                {pillar.subtitle}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-nexus-primary-espresso/80">
                {pillar.description}
              </p>

              <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-nexus-primary-espresso/20 to-transparent" />

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-nexus-primary-espresso/60">
                <span className="inline-block h-2 w-2 rounded-full bg-nexus-primary-gold" />
                <span>Human + Machine Synergy</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
