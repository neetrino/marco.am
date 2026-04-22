import { SITE_LEGAL_PAGES_STORAGE_VERSION } from "@/lib/constants/site-legal-pages";
import type { SiteLegalPagesStorage } from "@/lib/schemas/site-legal-pages.schema";

const DEFAULT_LAST_UPDATED_ISO = "2026-04-18T00:00:00.000Z";

export const SITE_LEGAL_PAGES_DEFAULT_STORAGE: SiteLegalPagesStorage = {
  version: SITE_LEGAL_PAGES_STORAGE_VERSION,
  pages: {
    privacy: {
      title: {
        hy: "Գաղտնիության քաղաքականություն",
        ru: "Политика конфиденциальности",
        en: "Privacy Policy",
      },
      summary: {
        hy: "Ինչպես ենք հավաքում, օգտագործում և պաշտպանում ձեր տվյալները։",
        ru: "Как мы собираем, используем и защищаем ваши данные.",
        en: "How we collect, use, and protect your data.",
      },
      contentHtml: {
        hy: "<h2>1. Հավաքվող տվյալներ</h2><p>Մենք հավաքում ենք պատվերի մշակման համար անհրաժեշտ տվյալներ՝ անուն, հեռախոս, էլ. հասցե, առաքման հասցե, վճարման կարգավիճակ:</p><h2>2. Օգտագործում</h2><p>Տվյալներն օգտագործվում են պատվերի իրականացում, հաճախորդների սպասարկում, վերադարձի գործընթաց և իրավական պահանջների կատարում նպատակներով:</p><h2>3. Պահպանում և պաշտպանություն</h2><p>Տվյալները պահվում են սահմանափակ հասանելիությամբ համակարգերում, կիրառվում են կազմակերպչական և տեխնիկական անվտանգության միջոցներ:</p><h2>4. Իրավունքներ</h2><p>Դուք կարող եք պահանջել ձեր տվյալների հասանելիություն, ուղղում կամ ջնջում՝ կապվելով մեզ հետ marcofurniture@mail.ru հասցեով:</p>",
        ru: "<h2>1. Какие данные мы собираем</h2><p>Мы собираем данные, необходимые для обработки заказа: имя, телефон, e-mail, адрес доставки, статус оплаты.</p><h2>2. Как мы используем данные</h2><p>Данные используются для выполнения заказа, клиентской поддержки, возвратов и соблюдения требований законодательства.</p><h2>3. Хранение и защита</h2><p>Данные хранятся в системах с ограниченным доступом; применяются организационные и технические меры безопасности.</p><h2>4. Права пользователя</h2><p>Вы можете запросить доступ, исправление или удаление ваших данных, написав на marcofurniture@mail.ru.</p>",
        en: "<h2>1. Data we collect</h2><p>We collect information required to process your order: name, phone, email, shipping address, and payment status.</p><h2>2. How we use data</h2><p>We use your data for order fulfillment, customer support, returns handling, and compliance with legal obligations.</p><h2>3. Storage and security</h2><p>Data is stored in restricted-access systems and protected with organizational and technical safeguards.</p><h2>4. Your rights</h2><p>You may request access, correction, or deletion of your data by contacting marcofurniture@mail.ru.</p>",
      },
      lastUpdatedIso: DEFAULT_LAST_UPDATED_ISO,
    },
    terms: {
      title: {
        hy: "Ծառայությունների պայմաններ",
        ru: "Условия использования",
        en: "Terms of Service",
      },
      summary: {
        hy: "Կայքի և ծառայությունների օգտագործման պայմանները։",
        ru: "Условия использования сайта и сервисов.",
        en: "Terms and conditions for using the site and services.",
      },
      contentHtml: {
        hy: "<h2>1. Ընդհանուր դրույթներ</h2><p>Կայքից օգտվելով՝ դուք համաձայնում եք սույն պայմաններին: Եթե համաձայն չեք, խնդրում ենք չօգտվել ծառայությունից:</p><h2>2. Պատվերներ և վճարումներ</h2><p>Պատվերի ընդունումը հաստատվում է համակարգի կամ օպերատորի կողմից: Գները կարող են թարմացվել առանց նախնական ծանուցման:</p><h2>3. Ապրանքների հասանելիություն</h2><p>Ապրանքի հասանելիությունը և առաքման ժամկետները կարող են փոխվել պահեստային վիճակից կախված:</p><h2>4. Պատասխանատվության սահմանափակում</h2><p>Մենք պատասխանատվություն չենք կրում անուղղակի վնասների համար, եթե այլ բան նախատեսված չէ կիրառելի օրենքով:</p>",
        ru: "<h2>1. Общие положения</h2><p>Используя сайт, вы принимаете настоящие условия. Если вы не согласны, пожалуйста, не используйте сервис.</p><h2>2. Заказы и оплата</h2><p>Принятие заказа подтверждается системой или оператором. Цены могут обновляться без предварительного уведомления.</p><h2>3. Наличие товаров</h2><p>Наличие товаров и сроки доставки могут меняться в зависимости от складских остатков.</p><h2>4. Ограничение ответственности</h2><p>Мы не несем ответственности за косвенные убытки, кроме случаев, прямо предусмотренных применимым правом.</p>",
        en: "<h2>1. General terms</h2><p>By using the site, you agree to these terms. If you do not agree, please do not use the service.</p><h2>2. Orders and payments</h2><p>Order acceptance is confirmed by the system or an operator. Prices may be updated without prior notice.</p><h2>3. Product availability</h2><p>Availability and delivery timelines may change depending on stock levels.</p><h2>4. Limitation of liability</h2><p>We are not liable for indirect damages unless required by applicable law.</p>",
      },
      lastUpdatedIso: DEFAULT_LAST_UPDATED_ISO,
    },
    refund: {
      title: {
        hy: "Վերադարձի և փոխհատուցման քաղաքականություն",
        ru: "Политика возврата и возмещения",
        en: "Refund Policy",
      },
      summary: {
        hy: "Վերադարձի իրավասություն, քայլեր և գումարի վերադարձի ժամկետներ։",
        ru: "Условия возврата, этапы и сроки возмещения.",
        en: "Eligibility, process, and timelines for refunds.",
      },
      contentHtml: {
        hy: "<h2>1. Վերադարձի ժամկետ</h2><p>Վերադարձի հայտը ներկայացվում է ապրանքը ստանալուց հետո 14 օրվա ընթացքում, եթե այլ պայմանագրային կարգ չկա:</p><h2>2. Պայմաններ</h2><p>Ապրանքը պետք է լինի օգտագործված չլինի, պահպանված լինի ամբողջական փաթեթավորումը և գնման ապացույցը:</p><h2>3. Գումարի վերադարձ</h2><p>Հաստատված վերադարձների դեպքում գումարը վերադարձվում է նույն վճարման մեթոդով մինչև 10 աշխատանքային օրվա ընթացքում:</p><h2>4. Բացառություններ</h2><p>Անհատական պատվերներ, հիգիենիկ և օրենքով սահմանված որոշ ապրանքներ վերադարձման ենթակա չեն:</p>",
        ru: "<h2>1. Срок возврата</h2><p>Заявка на возврат подается в течение 14 дней с момента получения товара, если иное не установлено договором.</p><h2>2. Условия</h2><p>Товар должен быть без следов использования, в полной комплектации и с подтверждением покупки.</p><h2>3. Возмещение</h2><p>После подтверждения возврата средства возвращаются тем же способом оплаты в течение до 10 рабочих дней.</p><h2>4. Исключения</h2><p>Индивидуальные заказы, гигиенические и отдельные категории товаров по закону не подлежат возврату.</p>",
        en: "<h2>1. Return window</h2><p>Return requests must be submitted within 14 days after delivery unless otherwise required by contract.</p><h2>2. Conditions</h2><p>Items must be unused, in full original packaging, and accompanied by proof of purchase.</p><h2>3. Refund timing</h2><p>Approved refunds are issued to the original payment method within up to 10 business days.</p><h2>4. Exclusions</h2><p>Custom orders, hygiene-sensitive products, and other legally excluded categories are not refundable.</p>",
      },
      lastUpdatedIso: DEFAULT_LAST_UPDATED_ISO,
    },
    "delivery-policy": {
      title: {
        hy: "Առաքման քաղաքականություն",
        ru: "Политика доставки",
        en: "Delivery Policy",
      },
      summary: {
        hy: "Առաքման գոտիներ, ժամկետներ, գներ և բացառություններ։",
        ru: "Зоны доставки, сроки, стоимость и исключения.",
        en: "Delivery zones, timelines, fees, and exclusions.",
      },
      contentHtml: {
        hy: "<h2>1. Առաքման գոտիներ</h2><p>Առաքումն իրականացվում է Հայաստանի Հանրապետության տարածքում, ինչպես նաև ընտրված միջազգային ուղղություններով:</p><h2>2. Ժամկետներ</h2><p>Սովորական առաքումը կատարվում է 1-5 աշխատանքային օրվա ընթացքում՝ կախված հասցեից և ապրանքի հասանելիությունից:</p><h2>3. Առաքման արժեք</h2><p>Առաքման արժեքը հաշվարկվում է checkout-ի ընթացքում՝ հասցեի, քաշի և ընտրված մեթոդի հիման վրա:</p><h2>4. Ուշացումներ և պատասխանատվություն</h2><p>Տրանսպորտային կամ force majeure պայմաններում հնարավոր են ուշացումներ, որոնց մասին մենք հնարավորինս շուտ տեղեկացնում ենք:</p>",
        ru: "<h2>1. Зоны доставки</h2><p>Доставка осуществляется по территории Республики Армения, а также по отдельным международным направлениям.</p><h2>2. Сроки</h2><p>Стандартная доставка занимает 1-5 рабочих дней в зависимости от адреса и наличия товара.</p><h2>3. Стоимость доставки</h2><p>Стоимость рассчитывается на этапе checkout с учетом адреса, веса и выбранного способа доставки.</p><h2>4. Задержки и ответственность</h2><p>Возможны задержки из-за логистики или форс-мажора; мы информируем клиента при первой возможности.</p>",
        en: "<h2>1. Delivery coverage</h2><p>We deliver across Armenia and selected international destinations.</p><h2>2. Delivery timelines</h2><p>Standard delivery is typically completed within 1-5 business days depending on destination and stock availability.</p><h2>3. Delivery fees</h2><p>Fees are calculated at checkout based on destination, package weight, and selected method.</p><h2>4. Delays and liability</h2><p>Delays may occur due to logistics constraints or force majeure; we notify customers as soon as possible.</p>",
      },
      lastUpdatedIso: DEFAULT_LAST_UPDATED_ISO,
    },
  },
};
