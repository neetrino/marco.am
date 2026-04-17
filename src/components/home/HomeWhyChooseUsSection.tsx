'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, CreditCard, ShieldCheck, Truck } from 'lucide-react';

import type { WhyChooseUsIconKey } from '@/lib/schemas/why-choose-us.schema';
import type { WhyChooseUsPublicPayload } from '@/lib/services/why-choose-us.service';
import { useTranslation } from '@/lib/i18n-client';

import { HOME_PAGE_SECTION_SHELL_CLASS } from './home-page-section-shell.constants';

const ICONS: Record<WhyChooseUsIconKey, LucideIcon> = {
  warranty: ShieldCheck,
  fast_delivery: Truck,
  installment: CreditCard,
  original: BadgeCheck,
};

export type HomeWhyChooseUsSectionProps = {
  initialWhyChooseUs: WhyChooseUsPublicPayload;
};

export function HomeWhyChooseUsSection({
  initialWhyChooseUs,
}: HomeWhyChooseUsSectionProps) {
  const { lang } = useTranslation();
  const [data, setData] = useState<WhyChooseUsPublicPayload>(initialWhyChooseUs);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/v1/home/why-choose-us?locale=${encodeURIComponent(lang)}`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as WhyChooseUsPublicPayload;
        if (!cancelled) setData(json);
      } catch {
        // Keep SSR payload
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <section
      className={`${HOME_PAGE_SECTION_SHELL_CLASS} py-10 sm:py-14`}
      aria-labelledby="home-why-choose-us-heading"
    >
      <h2
        id="home-why-choose-us-heading"
        className="mb-6 text-center font-semibold text-marco-black text-xl tracking-tight sm:mb-8 sm:text-2xl"
      >
        {data.sectionTitle}
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {data.items.map((item) => {
          const Icon = ICONS[item.iconKey];
          return (
            <li
              key={item.id}
              className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-col sm:items-center sm:text-center"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-marco-yellow/30 text-marco-black"
                aria-hidden
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-marco-black text-base leading-snug">
                  {item.title}
                </h3>
                {item.body.trim() !== '' ? (
                  <p className="mt-1 text-marco-black/70 text-sm leading-relaxed">
                    {item.body}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
