'use client';

import { Card } from '@shop/ui';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

/**
 * FAQ page — content from locale files (en / hy / ru).
 */
export default function FAQPage() {
  const { t } = useTranslation();

  const faqs = [
    {
      category: t('faq.categories.ordersShipping.title'),
      questions: [
        {
          q: t('faq.categories.ordersShipping.questions.shippingTime.q'),
          a: t('faq.categories.ordersShipping.questions.shippingTime.a'),
        },
        {
          q: t('faq.categories.ordersShipping.questions.internationalShipping.q'),
          a: t('faq.categories.ordersShipping.questions.internationalShipping.a'),
        },
        {
          q: t('faq.categories.ordersShipping.questions.trackOrder.q'),
          a: t('faq.categories.ordersShipping.questions.trackOrder.a'),
        },
        {
          q: t('faq.categories.ordersShipping.questions.damagedOrder.q'),
          a: t('faq.categories.ordersShipping.questions.damagedOrder.a'),
        },
      ],
    },
    {
      category: t('faq.categories.returnsRefunds.title'),
      questions: [
        {
          q: t('faq.categories.returnsRefunds.questions.returnPolicy.q'),
          a: t('faq.categories.returnsRefunds.questions.returnPolicy.a'),
        },
        {
          q: t('faq.categories.returnsRefunds.questions.howToReturn.q'),
          a: t('faq.categories.returnsRefunds.questions.howToReturn.a'),
        },
        {
          q: t('faq.categories.returnsRefunds.questions.refundTime.q'),
          a: t('faq.categories.returnsRefunds.questions.refundTime.a'),
        },
        {
          q: t('faq.categories.returnsRefunds.questions.returnShipping.q'),
          a: t('faq.categories.returnsRefunds.questions.returnShipping.a'),
        },
      ],
    },
    {
      category: t('faq.categories.payment.title'),
      questions: [
        {
          q: t('faq.categories.payment.questions.paymentMethods.q'),
          a: t('faq.categories.payment.questions.paymentMethods.a'),
        },
        {
          q: t('faq.categories.payment.questions.paymentSecurity.q'),
          a: t('faq.categories.payment.questions.paymentSecurity.a'),
        },
        {
          q: t('faq.categories.payment.questions.multiplePayment.q'),
          a: t('faq.categories.payment.questions.multiplePayment.a'),
        },
      ],
    },
    {
      category: t('faq.categories.accountPrivacy.title'),
      questions: [
        {
          q: t('faq.categories.accountPrivacy.questions.createAccount.q'),
          a: t('faq.categories.accountPrivacy.questions.createAccount.a'),
        },
        {
          q: t('faq.categories.accountPrivacy.questions.resetPassword.q'),
          a: t('faq.categories.accountPrivacy.questions.resetPassword.a'),
        },
        {
          q: t('faq.categories.accountPrivacy.questions.privacyProtection.q'),
          a: t('faq.categories.accountPrivacy.questions.privacyProtection.a'),
        },
      ],
    },
    {
      category: t('faq.categories.products.title'),
      questions: [
        {
          q: t('faq.categories.products.questions.authenticProducts.q'),
          a: t('faq.categories.products.questions.authenticProducts.a'),
        },
        {
          q: t('faq.categories.products.questions.outOfStock.q'),
          a: t('faq.categories.products.questions.outOfStock.a'),
        },
        {
          q: t('faq.categories.products.questions.warranties.q'),
          a: t('faq.categories.products.questions.warranties.a'),
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('faq.title')}</h1>
      <p className="text-gray-600 mb-8">{t('faq.description')}</p>

      <div className="space-y-8">
        {faqs.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.category}</h2>
            <div className="space-y-6">
              {section.questions.map((faq, faqIndex) => (
                <div key={faqIndex} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Card className="p-6 bg-blue-50">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('faq.stillHaveQuestions.title')}</h2>
          <p className="text-gray-600 mb-4">{t('faq.stillHaveQuestions.description')}</p>
          <div className="flex flex-col items-start gap-2">
            <Link href="/contact" className="text-marco-yellow font-medium hover:underline">
              {t('faq.stillHaveQuestions.contactUs')}
            </Link>
            <Link href="/support" className="text-marco-yellow font-medium hover:underline">
              {t('faq.stillHaveQuestions.getSupport')}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
