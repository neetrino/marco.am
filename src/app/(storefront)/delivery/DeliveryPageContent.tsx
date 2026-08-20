'use client';

import { Card } from '@shop/ui';
import { useEffect, useState } from 'react';
import { phoneToTelHref } from '../../../lib/contact-locations';
import { useTranslation } from '../../../lib/i18n-client';
import { getStoredLanguage } from '../../../lib/language';
import { loadTranslation } from '../../../lib/i18n';
import enDelivery from '../../../locales/en/delivery.json';

const DELIVERY_CONTACT_EMAIL = 'marcogroupelectronics@gmail.com';
const DELIVERY_CONTACT_PHONE = '+374 60 500 406';

type DeliveryJson = typeof enDelivery;
type ReturnPolicyCopy = DeliveryJson['returnPolicy'];

export function DeliveryPageContent() {
  const { t } = useTranslation();
  const [policy, setPolicy] = useState<ReturnPolicyCopy>(enDelivery.returnPolicy);

  useEffect(() => {
    const loadPolicy = () => {
      const data = loadTranslation(getStoredLanguage(), 'delivery') as DeliveryJson | null;
      if (data?.returnPolicy) setPolicy(data.returnPolicy);
    };
    loadPolicy();
    window.addEventListener('language-updated', loadPolicy);
    return () => window.removeEventListener('language-updated', loadPolicy);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('delivery.title')}</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('delivery.deliveryInformation.title')}</h2>
          <div className="space-y-4 text-gray-700">
            <p className="text-gray-600">{t('delivery.deliveryInformation.intro')}</p>
            <p className="text-gray-600">{t('delivery.deliveryInformation.timeframe')}</p>
            <p className="text-gray-600">{t('delivery.deliveryInformation.freeWithin')}</p>
            <p className="text-gray-600">{t('delivery.deliveryInformation.extraKm')}</p>
          </div>
        </Card>

        <ReturnPolicyCard policy={policy} />
        <DeliveryContactCard />
      </div>
    </div>
  );
}

function ReturnPolicyCard({ policy }: { policy: ReturnPolicyCopy }) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">{policy.title}</h2>
      <div className="space-y-4 text-gray-700">
        <ReturnPolicyList intro={policy.eligibility.intro} items={policy.eligibility.items} />
        <ReturnPolicyList title={policy.howToStart.title} items={policy.howToStart.items} />
        <ReturnPolicyList title={policy.refundMethod.title} items={policy.refundMethod.items} />
        <ReturnPolicyList title={policy.nonRefundable.title} items={policy.nonRefundable.items} />
      </div>
    </Card>
  );
}

function ReturnPolicyList({
  title,
  intro,
  items,
}: {
  title?: string;
  intro?: string;
  items: string[];
}) {
  return (
    <div>
      {title ? <h3 className="font-semibold text-gray-900 mb-2">{title}</h3> : null}
      {intro ? <p className="text-gray-600 mb-2">{intro}</p> : null}
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function DeliveryContactCard() {
  const { t } = useTranslation();

  return (
    <Card className="p-6">
      <p className="text-gray-600 mb-4">{t('delivery.contact.description')}</p>
      <div className="space-y-2 text-gray-700">
        <p>
          <span className="font-semibold">{t('delivery.contact.email')}</span>{' '}
          <a href={`mailto:${DELIVERY_CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
            {DELIVERY_CONTACT_EMAIL}
          </a>
        </p>
        <p>
          <span className="font-semibold">{t('delivery.contact.phone')}</span>{' '}
          <a href={phoneToTelHref(DELIVERY_CONTACT_PHONE)} className="text-blue-600 hover:underline">
            {DELIVERY_CONTACT_PHONE}
          </a>
        </p>
        <p>
          <span className="font-semibold">{t('delivery.contact.hours')}</span>{' '}
          {t('delivery.contact.hoursWeekdays')}
        </p>
        <p>{t('delivery.contact.hoursSunday')}</p>
      </div>
    </Card>
  );
}
