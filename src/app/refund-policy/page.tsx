'use client';

import { Card } from '@shop/ui';

/**
 * Refund Policy page - outlines return and refund rules
 */
export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Վերադարձի Քաղաքականություն</h1>

      <div className="space-y-8">
        <Card className="p-6 space-y-5">
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Վերադարձ</h2>
            <p className="text-gray-600">
              Եթե դուք դժգոհ եք ձեր գնումից, կարող եք այն վերադարձնել ապրանքը ստանալուց հետո 14 օրվա
              ընթացքում: Վերադարձի համար ապրանքը պետք է լինի չօգտագործված, նույն վիճակում, ինչում այն ստացել
              եք, և իր բնօրինակ փաթեթավորմամբ:
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Վերադարձի Գործընթաց</h2>
            <p className="text-gray-600">
              Երբ ձեր վերադարձը ստացվի և ստուգվի, մենք ձեզ կտեղեկացնենք ձեր փոխհատուցման հաստատման կամ
              մերժման մասին: Եթե հաստատվի, ձեր փոխհատուցումը կմշակվի, և գումարը ավտոմատ կփոխանցվի ձեր
              նախնական վճարման եղանակին՝ որոշակի օրերի ընթացքում:
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">Չվերադարձվող Ապրանքներ</h2>
            <p className="text-gray-600">
              Որոշ ապրանքներ ենթակա չեն վերադարձման, ներառյալ, բայց ոչ միայն՝
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Նվեր քարտեր</li>
              <li>Զեղչով ապրանքներ (եթե կիրառելի է)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Փոխանակումներ</h2>
            <p className="text-gray-600">
              Մենք փոխարինում ենք ապրանքները միայն այն դեպքում, եթե դրանք դեֆեկտավորված են կամ վնասված: Եթե
              ձեզ անհրաժեշտ է փոխանակել նույն ապրանքը, խնդրում ենք կապ հաստատել մեզ հետ՝ կայքում նշված
              տեղեկատվության միջոցով:
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Առաքման Վճարներ</h2>
            <p className="text-gray-600">
              Վերադարձի դեպքում առաքման ծախսերը կրում եք դուք, և դրանք վերադարձի ենթակա չեն: Եթե դուք
              ստանում եք փոխհատուցում, վերադարձի առաքման ծախսերը կհանվեն ձեր փոխհատուցումից:
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Ուշացած կամ Բացակայող Փոխհատուցումներ</h2>
            <p className="text-gray-600">
              Եթե դեռ փոխհատուցում չեք ստացել, նախ ստուգեք ձեր բանկային հաշիվը կրկին, այնուհետև կապ հաստատեք
              ձեր վարկային քարտի ընկերության հետ: Եթե դուք այս ամենը արել եք և դեռ չեք ստացել ձեր
              փոխհատուցումը, խնդրում ենք կապ հաստատել մեզ հետ:
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}


