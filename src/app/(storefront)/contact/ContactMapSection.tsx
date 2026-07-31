'use client';

import { MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  mapsEmbedUrlForLocation,
  parseContactLocationHash,
  type ContactLocation,
  type ContactLocationId,
} from '@/lib/contact-locations';

type ContactMapAddressStripProps = {
  readonly locations: readonly ContactLocation[];
  readonly activeId: ContactLocationId;
  readonly onSelect: (id: ContactLocationId) => void;
  readonly sectionTitle: string;
};

function ContactMapAddressStrip({
  locations,
  activeId,
  onSelect,
  sectionTitle,
}: ContactMapAddressStripProps) {
  return (
    <div className="border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-5 sm:px-6">
      <div className="marco-header-container">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-soft)]">
          {sectionTitle}
        </p>
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          role="tablist"
          aria-label={sectionTitle}
        >
          {locations.map((loc) => {
            const active = activeId === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(loc.id)}
                className={`flex min-h-[3.25rem] items-start gap-2.5 rounded-2xl border px-4 py-3 text-left text-sm font-medium leading-snug transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-yellow/80 sm:text-[15px] ${
                  active
                    ? 'border-marco-yellow bg-marco-yellow/12 text-[var(--app-text)] shadow-sm ring-1 ring-marco-yellow/35 dark:bg-marco-yellow/14 dark:ring-marco-yellow/45'
                    : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]/80 text-[var(--app-text)] hover:border-marco-yellow/45 hover:bg-marco-yellow/[0.06] hover:shadow-sm dark:border-[var(--app-border-strong)] dark:bg-[var(--app-surface-muted)]/50 dark:hover:border-marco-yellow/40 dark:hover:bg-marco-yellow/[0.08]'
                }`}
              >
                <MapPin
                  className={`mt-0.5 h-[18px] w-[18px] shrink-0 stroke-[2] ${
                    active ? 'text-marco-yellow' : 'text-[var(--app-text-soft)]'
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">{loc.address}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type ContactMapSectionProps = {
  readonly locations: readonly ContactLocation[];
  readonly mapSectionTitle: string;
};

/** Map tabs + lazy iframe — client island; defers heavy Google embed until after first paint. */
export function ContactMapSection({ locations, mapSectionTitle }: ContactMapSectionProps) {
  const [mapFocusId, setMapFocusId] = useState<ContactLocationId | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncFromHash = () => {
      setMapFocusId(parseContactLocationHash(window.location.hash));
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIframeReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!parseContactLocationHash(window.location.hash)) {
      return;
    }
    const element = mapSectionRef.current;
    if (!element) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const headerOffset = 88;
    const visibleEnough =
      rect.top >= headerOffset - 32 && rect.top < window.innerHeight * 0.92;
    if (visibleEnough) {
      return;
    }
    const timer = window.setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [mapFocusId]);

  const activeMapId: ContactLocationId =
    mapFocusId ?? locations[0]?.id ?? 'yerevan';

  const mapLocation =
    (mapFocusId ? locations.find((location) => location.id === mapFocusId) : null) ??
    locations[0];

  const selectMapLocation = (id: ContactLocationId) => {
    window.location.hash = `loc-${id}`;
  };

  return (
    <div
      ref={mapSectionRef}
      id="contact-page-map"
      className="w-full scroll-mt-24 bg-[var(--app-bg-muted)]"
    >
      <ContactMapAddressStrip
        locations={locations}
        activeId={activeMapId}
        onSelect={selectMapLocation}
        sectionTitle={mapSectionTitle}
      />
      <div className="h-[min(480px,62vh)] min-h-[300px] w-full">
        {mapLocation && iframeReady ? (
          <iframe
            key={mapLocation.id}
            title={mapLocation.address}
            src={mapsEmbedUrlForLocation(mapLocation)}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full"
          />
        ) : null}
      </div>
    </div>
  );
}
