import { SITE_CONTENT_STORAGE_VERSION } from "@/lib/constants/site-content";
import type { SiteContentStorage } from "@/lib/schemas/site-content.schema";

export const SITE_CONTENT_MAP_EMBED_ALLOWED_HOSTS = new Set([
  "www.google.com",
  "google.com",
  "maps.google.com",
  "www.openstreetmap.org",
  "openstreetmap.org",
]);

export const SITE_CONTENT_DEFAULT_STORAGE: SiteContentStorage = {
  version: SITE_CONTENT_STORAGE_VERSION,
  about: {
    heroImageUrl:
      "https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    subtitle: {
      hy: "ԷԼԵԳԱՆՏ ԴԻԶԱՅՆ",
      ru: "ЭЛЕГАНТНЫЙ ДИЗАЙН",
      en: "ELEGANT DESIGN",
    },
    title: {
      hy: "Մեր առցանց խանութի մասին",
      ru: "О нашем интернет-магазине",
      en: "About our online store",
    },
    paragraph1: {
      hy: "Մենք ուրախ ենք ողջունել ձեզ մեր առցանց խանութում: Մեր ընկերությունը ձգտում է ապահովել ձեզ լավագույն գնումների փորձ՝ լայն տեսականի բարձրորակ ապրանքներով և գերազանց սպասարկմամբ:",
      ru: "Мы рады приветствовать вас в нашем интернет-магазине. Наша компания стремится предоставить вам лучший опыт покупок с широким ассортиментом качественных товаров и отличным сервисом.",
      en: "We are delighted to welcome you to our online store. Our company strives to provide you with the best shopping experience with a wide range of quality products and excellent service.",
    },
    paragraph2: {
      hy: "Մեր առաքելությունը առցանց գնումները դարձնել պարզ, հարմար և հաճելի է: Մենք ուշադիր ընտրում ենք յուրաքանչյուր ապրանք՝ ապահովելու բարձր որակ և մեր հաճախորդների բավարարվածությունը:",
      ru: "Наша миссия - сделать онлайн-покупки простыми, удобными и приятными. Мы тщательно отбираем каждый товар, чтобы гарантировать высокое качество и удовлетворенность наших клиентов.",
      en: "Our mission is to make online shopping simple, convenient and enjoyable. We carefully select each product to ensure high quality and customer satisfaction.",
    },
    paragraph3: {
      hy: "Մենք հպարտ ենք, որ առաջարկում ենք ոչ միայն գերազանց ապրանքներ, այլև գերազանց հաճախորդների սպասարկում: Մեր թիմը միշտ պատրաստ է օգնել ձեզ գտնել հենց այն, ինչ փնտրում եք:",
      ru: "Мы гордимся тем, что предлагаем не только отличные продукты, но и превосходное обслуживание клиентов. Наша команда всегда готова помочь вам найти именно то, что вы ищете.",
      en: "We are proud to offer not only excellent products but also excellent customer service. Our team is always ready to help you find exactly what you are looking for.",
    },
    teamSubtitle: {
      hy: "ՄԵՐ ՄԱՍԻՆ",
      ru: "О НАС",
      en: "ABOUT US",
    },
    teamTitle: {
      hy: "Մեր թիմը",
      ru: "Наша команда",
      en: "Our team",
    },
    teamDescription: {
      hy: "Մեր թիմը բաղկացած է փորձառու մասնագետներից, ովքեր նվիրված են իրենց աշխատանքին և ձգտում են ապահովել լավագույն սպասարկում մեր հաճախորդների համար:",
      ru: "Наша команда состоит из опытных профессионалов, которые преданы своему делу и стремятся обеспечить лучший сервис для наших клиентов.",
      en: "Our team consists of experienced professionals who are dedicated to their work and strive to provide the best service for our customers.",
    },
  },
  contact: {
    phoneDisplay: {
      hy: "+374 XX XXX XXX",
      ru: "+374 XX XXX XXX",
      en: "+374 XX XXX XXX",
    },
    phoneTel: "+37400000000",
    email: "info@shop.am",
    address: {
      hy: "Աբովյան փող. 1/1, Երևան,\nՀայաստան",
      ru: "ул. Абовяна 1/1, Ереван,\nАрмения",
      en: "1/1 Abovyan St., Yerevan,\nArmenia",
    },
    workingHours: {
      weekdays: {
        hy: "Երկուշաբթի - Ուրբաթ: 9:00-20:00",
        ru: "Понедельник - Пятница: 9:00-20:00",
        en: "Monday - Friday: 9:00-20:00",
      },
      saturday: {
        hy: "Շաբաթ: 11:00 - 15:00",
        ru: "Суббота: 11:00 - 15:00",
        en: "Saturday: 11:00 - 15:00",
      },
    },
    callToUs: {
      title: {
        hy: "Զանգահարեք մեզ:",
        ru: "Позвоните нам:",
        en: "Call Us:",
      },
      description: {
        hy: "Մենք հասանելի ենք շաբաթվա 7 օր, օրվա 24 ժամ:",
        ru: "Мы доступны 24/7, 7 дней в неделю.",
        en: "We are available 24/7, 7 days a week.",
      },
    },
    writeToUs: {
      title: {
        hy: "Գրեք մեզ:",
        ru: "Напишите нам:",
        en: "Write to Us:",
      },
      description: {
        hy: "Լրացրեք մեր ձևը, և մենք կկապվենք ձեզ հետ 24 ժամվա ընթացքում:",
        ru: "Заполните нашу форму, и мы свяжемся с вами в течение 24 часов.",
        en: "Fill out our form and we will contact you within 24 hours.",
      },
      emailLabel: {
        hy: "Էլ. փոստ:",
        ru: "Электронная почта:",
        en: "Email:",
      },
    },
    headquarterTitle: {
      hy: "Գլխավոր գրասենյակ:",
      ru: "Главный офис:",
      en: "Headquarters:",
    },
    mapEmbed: {
      enabled: false,
      iframeSrc: undefined,
    },
    socialLinks: {},
  },
  brandPages: {
    sectionTitle: {
      hy: "Բրենդի մասին",
      ru: "О бренде",
      en: "About brand",
    },
    fallbackDescriptionTemplate: {
      hy: "{brandName}-ի պաշտոնական ապրանքներ և առաջարկներ",
      ru: "Официальные товары и предложения {brandName}",
      en: "Official products and offers by {brandName}",
    },
    ctaLabel: {
      hy: "Դիտել ապրանքները",
      ru: "Смотреть товары",
      en: "View products",
    },
    catalogPath: "/products",
  },
};
