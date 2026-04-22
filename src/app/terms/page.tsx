'use client';

import { Card } from '@shop/ui';

/**
 * Terms of Service page - displays terms and conditions
 */
export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Օգտագործման Պայմաններ</h1>

      <div className="space-y-8">
        <Card className="p-6 space-y-5">
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Ներածություն</h2>
            <p className="text-gray-600">
              Այս Օգտագործման Պայմանները կարգավորում են Marco կայքի օգտագործումը: Կայքը մուտք գործելով և
              օգտագործելով՝ դուք համաձայնվում եք ենթարկվել այս պայմաններին: Եթե համաձայն չեք այս պայմաններից
              որևէ մեկի հետ, խնդրում ենք չօգտագործել մեր կայքը:
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Կայքի Օգտագործում</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>
                <span className="font-semibold text-gray-900">Պատշաճ տարիքը:</span> Դուք պետք է լինեք
                առնվազն 18 տարեկան, որպեսզի կարողանաք կատարել գնումներ մեր կայքից:
              </li>
              <li>
                <span className="font-semibold text-gray-900">Հաշվի Պատասխանատվություն:</span> Դուք
                պատասխանատու եք ձեր հաշվի տվյալների գաղտնիության պահպանման համար և ձեր հաշվից կատարվող
                բոլոր գործողությունների համար:
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Ապրանքի Տեղեկատվություն</h2>
            <p className="text-gray-600">
              Մենք անում ենք ամեն ինչ՝ ապրանքների ճշգրիտ նկարագրություններ, պատկերներ և գներ ներկայացնելու
              համար: Սակայն, մենք չենք երաշխավորում, որ կայքի ապրանքների նկարագրությունները կամ այլ
              բովանդակությունը չեն պարունակում սխալներ: Եթե մեր կայքում առաջարկվող ապրանքը չի
              համապատասխանում նկարագրությանը, ապա այն վերադարձնելն է միակ լուծումը:
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Պատվերներ և Վճարում</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>
                <span className="font-semibold text-gray-900">Պատվերի Ընդունում:</span> Մենք իրավունք ունենք
                մերժելու կամ չեղարկելու ցանկացած պատվեր՝ մեր հայեցողությամբ:
              </li>
              <li>
                <span className="font-semibold text-gray-900">Գնագոյացում:</span> Գները ենթակա են
                փոփոխության առանց նախնական ծանուցման: Պատվերի համար կիրառվող գինը կլինի գնումի պահին
                գործող գինը:
              </li>
              <li>
                <span className="font-semibold text-gray-900">Վճարման Մեթոդներ:</span> Մենք ընդունում ենք
                տարբեր վճարման մեթոդներ, և վճարումը պետք է ստացվի, մինչև պատվերը կուղարկվի:
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Առաքում և Մատակարարում</h2>
            <p className="text-gray-600">
              Մենք ամեն ինչ կանենք, որ ձեր պատվերը մատակարարվի կանխատեսված ժամկետում: Սակայն, հնարավոր են
              ուշացումներ, և մենք չենք կրում պատասխանատվություն նման ուշացումների համար:
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Վերադարձ և Փոխհատուցում</h2>
            <p className="text-gray-600">
              Խնդրում ենք դիմել մեր Վերադարձի Քաղաքականությանը՝ ապրանքները վերադարձնելու և փոխհատուցում
              ստանալու գործընթացի համար:
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Պատասխանատվության Սահմանափակում</h2>
            <p className="text-gray-600">
              Մեր պատասխանատվությունը սահմանափակվում է ձեր կողմից պատվիրված ապրանքի գնով: Մենք չենք կրում
              պատասխանատվություն որևէ անուղղակի, պատահական կամ հետևանքային վնասների համար, որոնք առաջացել
              են կայքի օգտագործման արդյունքում:
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Կառավարող Իրավունք</h2>
            <p className="text-gray-600">
              Այս Օգտագործման Պայմանները կարգավորվում են Հայաստանի Հանրապետության օրենքներով: Այս
              պայմաններից առաջացած ցանկացած վեճ կքննարկվի Հայաստանի Հանրապետության դատարանների իրավասության
              ներքո:
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Առաքում և Մատակարարում</h2>
            <p className="text-gray-600">
              Մենք պարտավորվում ենք ձեր պատվերը մատակարարել արագ և ապահով կերպով: Առաքման ժամկետները
              կախված են ընտրած ապրանքից և առաքման վայրից: Սովորաբար, պատվերները մատակարարվում են 3-5
              աշխատանքային օրվա ընթացքում:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>
                <span className="font-semibold text-gray-900">Առաքման տարբերակներ:</span> Առաքումն
                իրականացվում է մեր գործընկեր առաքման ծառայությունների միջոցով:
              </li>
              <li>
                <span className="font-semibold text-gray-900">Ուշացումներ:</span> Չնայած մեր ջանքերին,
                հնարավոր են ուշացումներ եղանակային պայմանների պատճառով:
              </li>
              <li>
                Առաքումը կատարվում է անվճար մինչև 20 կմ, իսկ 20կմ-ից հետո 1կմ-ի արժեքը կազմում 150 դրամ։
              </li>
            </ul>
            <p className="text-gray-600">
              Խնդրում ենք կապ հաստատել մեր հաճախորդների սպասարկման թիմի հետ՝ առաքման հարցերով կամ այլ
              մանրամասների համար:
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}

