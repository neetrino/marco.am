'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Delivery Terms page - describes shipping and delivery conditions
 */
export default function DeliveryTermsPage() {
  const { t } = useTranslation();
  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <h1 className="text-4xl font-bold text-gray-900">{t('delivery-terms.title')}</h1>

        <div className="mt-8 space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900">{t('delivery-terms.overview.title')}</h2>
            <p className="text-gray-600">
              {t('delivery-terms.overview.description')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900">{t('delivery-terms.processingTimes.title')}</h2>
            <ul className="list-disc list-inside text-gray-600 ml-4">
              <li>{t('delivery-terms.processingTimes.items.typical')}</li>
              <li>{t('delivery-terms.processingTimes.items.weekends')}</li>
              <li>{t('delivery-terms.processingTimes.items.preorder')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900">{t('delivery-terms.shippingOptions.title')}</h2>
            <p className="text-gray-600">{t('delivery-terms.shippingOptions.description')}</p>
            <ul className="list-disc list-inside text-gray-600 ml-4">
              <li>{t('delivery-terms.shippingOptions.options.standard')}</li>
              <li>{t('delivery-terms.shippingOptions.options.express')}</li>
              {t('delivery-terms.shippingOptions.options.pickup') && (
                <li>{t('delivery-terms.shippingOptions.options.pickup')}</li>
              )}
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900">{t('delivery-terms.shippingFees.title')}</h2>
            <ul className="list-disc list-inside text-gray-600 ml-4">
              <li>{t('delivery-terms.shippingFees.items.costs')}</li>
              <li>
                {t('delivery-terms.shippingFees.items.duties')}
              </li>
              {t('delivery-terms.shippingFees.items.promotional') && (
                <li>{t('delivery-terms.shippingFees.items.promotional')}</li>
              )}
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900">{t('delivery-terms.delaysDamageLoss.title')}</h2>
            {t('delivery-terms.delaysDamageLoss.descriptionBefore') && (
              <p className="text-gray-600">
                {t('delivery-terms.delaysDamageLoss.descriptionBefore')}
              </p>
            )}
            <ul className="list-disc list-inside text-gray-600 ml-4">
              <li>{t('delivery-terms.delaysDamageLoss.items.delays')}</li>
              <li>
                {t('delivery-terms.delaysDamageLoss.items.damage')}
              </li>
              <li>
                {t('delivery-terms.delaysDamageLoss.items.loss')}
              </li>
            </ul>
            {t('delivery-terms.delaysDamageLoss.descriptionAfter') && (
              <p className="text-gray-600">
                {t('delivery-terms.delaysDamageLoss.descriptionAfter')}
              </p>
            )}

            <h2 className="text-2xl font-semibold text-gray-900">{t('delivery-terms.contact.title')}</h2>
            <p className="text-gray-600">
              {t('delivery-terms.contact.description')}{' '}
              <a href="mailto:marcofurniture@mail.ru" className="text-marco-yellow hover:underline">
                marcofurniture@mail.ru
              </a>
              .
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

