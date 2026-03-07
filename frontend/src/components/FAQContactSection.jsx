import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    question: "What types of assets can be tokenized on NEXUS?",
    answer:
      "NEXUS supports real-world assets such as property portfolios, logistics fleets, and renewable infrastructure through compliant fractional tokenization flows.",
  },
  {
    question: "How is the Nexus Risk Score generated?",
    answer:
      "The score combines AI-driven analytics with human oversight, using market data, operational performance, and macro indicators to produce continuously updated risk insights.",
  },
  {
    question: "How quickly can I access liquidity?",
    answer:
      "Eligible positions can be converted through near real-time liquidity rails, subject to market depth, compliance checks, and settlement windows.",
  },
  {
    question: "Is NEXUS suitable for institutional teams?",
    answer:
      "Yes. NEXUS is built for both sophisticated retail users and institutional teams, with transparent reporting, controls, and risk intelligence tooling.",
  },
];

export default function FAQContactSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (index) => {
    setOpenIndex((current) => (current === index ? -1 : index));
  };

  return (
    <section id="faq" className="relative overflow-hidden bg-nexus-primary-beige px-6 py-20 text-nexus-primary-espresso sm:px-10 lg:px-16 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(26,18,11,0.07),transparent_36%),radial-gradient(circle_at_86%_80%,rgba(212,175,55,0.13),transparent_38%)]" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nexus-primary-espresso/70">
            Support Center
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-nexus-primary-espresso/80 sm:text-base">
            Explore key answers about tokenization, risk analytics, and liquidity on the NEXUS platform.
          </p>

          <div className="mt-8 space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index;

              return (
                <article
                  key={item.question}
                  className="overflow-hidden rounded-2xl border border-nexus-primary-espresso/14 bg-white/55"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    onClick={() => toggleAccordion(index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-semibold sm:text-base">
                      {item.question}
                    </span>
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border leading-none transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 border-nexus-primary-gold/55 bg-gradient-to-br from-[#f7e5a9] to-[#d4af37] text-[#1A120B] shadow-[0_6px_16px_rgba(212,175,55,0.28)]"
                          : "rotate-0 border-nexus-primary-espresso/22 bg-white/78 text-nexus-primary-espresso/72"
                      }`}
                    >
                      <ChevronDown className="h-4.5 w-4.5" strokeWidth={2.3} />
                    </span>
                  </button>

                  {isOpen ? (
                    <div
                      id={`faq-panel-${index}`}
                      className="relative border-t border-nexus-primary-espresso/10 px-5 py-4 text-sm leading-relaxed text-nexus-primary-espresso/85"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(212,175,55,0.12)_0%,transparent_38%),linear-gradient(38deg,rgba(26,18,11,0.06)_1px,transparent_1px)] [background-size:auto,54px_54px]" />
                      <p className="relative">{item.answer}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        <div id="contact" className="rounded-3xl border border-nexus-primary-espresso/12 bg-white/72 p-6 shadow-lg shadow-nexus-primary-espresso/6 sm:p-8">
          <h3 className="text-2xl font-bold">Contact Us</h3>
          <p className="mt-3 text-sm leading-relaxed text-nexus-primary-espresso/80">
            Need help with onboarding or portfolio setup? Our team will respond within one business day.
          </p>

          <form className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Jane Smith"
                className="w-full rounded-xl border border-nexus-primary-espresso/20 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-nexus-primary-espresso/45 focus:border-nexus-primary-gold focus:ring-2 focus:ring-nexus-primary-gold/25"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Work Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                className="w-full rounded-xl border border-nexus-primary-espresso/20 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-nexus-primary-espresso/45 focus:border-nexus-primary-gold focus:ring-2 focus:ring-nexus-primary-gold/25"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Tell us how we can help..."
                className="w-full resize-y rounded-xl border border-nexus-primary-espresso/20 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-nexus-primary-espresso/45 focus:border-nexus-primary-gold focus:ring-2 focus:ring-nexus-primary-gold/25"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-nexus-primary-gold px-6 py-2.5 text-sm font-semibold text-nexus-primary-espresso transition duration-300 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-primary-gold focus-visible:ring-offset-2 focus-visible:ring-offset-nexus-primary-beige"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
