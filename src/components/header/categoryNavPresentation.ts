import type { LucideIcon } from 'lucide-react';
import { Package } from 'lucide-react';
import type { LanguageCode } from '../../lib/language';

type LabelSet = {
  readonly hy: string;
  readonly en: string;
  readonly ru: string;
};

/** Figma 218:4894 — icons + titles; Figma 218:5785 — promo banner per category. */
const NAV_ROWS: ReadonlyArray<{
  readonly slugs: readonly string[];
  readonly figmaIconSrc: string;
  readonly labels: LabelSet;
  readonly descriptions: LabelSet;
  readonly promo: { readonly badge: LabelSet; readonly headline: LabelSet; readonly subline: LabelSet };
}> = [
  {
    slugs: [
      'electronics',
      'furniture-hardware',
      'furniture-accessories',
      'cabinet-hardware',
      'furniture-making',
      'kkhuyqi-patrastman',
    ],
    figmaIconSrc: '/images/category-nav/furniture-hardware.svg',
    labels: {
      hy: 'Կահույքի պատրաստման պարագաներ',
      en: 'Furniture manufacturing accessories',
      ru: 'Фурнитура и комплектующие для мебели',
    },
    descriptions: {
      hy: 'Բռնակներ, կախիչներ, մանրամասներ և այլ պարագաներ՝ կահույքի հավաքման և նորոգման համար։ Ընտրեք համապատասխան մոդելները մեր ընտրանքից։',
      en: 'Handles, hinges, fittings and hardware for assembling and renovating furniture. Pick the right parts from our range.',
      ru: 'Ручки, петли, фурнитура и крепёж для сборки и обновления мебели. Подберите нужные позиции в каталоге.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Մինչև 25% զեղչ կահույքի ֆուրնիտուրայի վրա',
        en: 'Up to 25% off furniture hardware & fittings',
        ru: 'До 25% на фурнитуру и комплектующие',
      },
      subline: {
        hy: 'Հուսալի մանրամասներ և աքսեսուարներ՝ ձեր նախագծերի համար։',
        en: 'Reliable parts and accessories for builds and upgrades.',
        ru: 'Надёжные детали и аксессуары для сборки и обновления.',
      },
    },
  },
  {
    slugs: ['furniture', 'clothing', 'kkhuyq', 'home-furniture'],
    figmaIconSrc: '/images/category-nav/furniture.svg',
    labels: {
      hy: 'Կահույք',
      en: 'Furniture',
      ru: 'Мебель',
    },
    descriptions: {
      hy: 'Պահարաններ, սեղաններ, մահճակալներ և միջնարանային լուծումներ՝ տան համար։ Գտեք մի ոճ, որը համապատասխանում է ձեր ինտերիերին։',
      en: 'Wardrobes, tables, beds and interior solutions for your home. Find a style that fits your space.',
      ru: 'Шкафы, столы, кровати и интерьерные решения для дома. Добавьте в каталог подходящие модели.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Մինչև 30% զեղչ հյուրասենյակի կահույքի համար',
        en: 'Seasonal refresh: up to 30% off living room furniture',
        ru: 'Скидки до 30% на мебель для гостиной',
      },
      subline: {
        hy: 'Վերաիմաստավորեք տարածքը մեր ընտրանքով՝ որակ, հարմարավետություն և ժամանակակից էլեգանտություն։',
        en: 'Redefine your space with our premium selection—quality comfort meets modern elegance.',
        ru: 'Обновите интерьер с нашей коллекцией: комфорт, качество и современный стиль.',
      },
    },
  },
  {
    slugs: ['shoes'],
    figmaIconSrc: '/images/category-nav/kitchen-appliances.svg',
    labels: {
      hy: 'Խոշոր կենցաղային տեխնիկա',
      en: 'Large home appliances',
      ru: 'Крупная бытовая техника',
    },
    descriptions: {
      hy: 'Լվացքի և սушիչ մեքենաներ, սառնարաններ և այլ խոշոր տեխնիկա՝ հուսալի աշխատանքի և երկար ծառայության ժամկետի համար։',
      en: 'Washing machines, dryers, refrigerators and other large appliances built for reliability and performance.',
      ru: 'Стиральные и сушильные машины, холодильники и другая крупная техника для быта.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Խոշոր տեխնիկա՝ էներգաարդյունավետ մոդելներ',
        en: 'Large appliances: energy‑smart picks for your home',
        ru: 'Крупная техника: энергоэффективные решения',
      },
      subline: {
        hy: 'Սառնարաններ, լվացքի մեքենաներ և ավելին՝ հուսալի բրենդներից։',
        en: 'Fridges, washers and more from brands you can trust.',
        ru: 'Холодильники, стиральные машины и другое от проверенных брендов.',
      },
    },
  },
  {
    slugs: [
      'home-and-garden',
      'home and garden',
      'home-&-garden',
      'home_garden',
      'home-garden',
      'homegarden',
      'garden',
    ],
    figmaIconSrc: '/images/category-nav/home-and-garden.svg',
    labels: {
      hy: 'Խոհանոցային տեխնիկա',
      en: 'Kitchen appliances',
      ru: 'Кухонная техника',
    },
    descriptions: {
      hy: 'Խոհանոցային տեխնիկա՝ հավաքման, ստեղծագործության և ամենօրյա պատրաստման համար։ Պրեմիում բրենդներ և մատչելի լուծումներ։',
      en: 'Appliances for cooking, baking and everyday prep. Premium brands and practical options.',
      ru: 'Техника для приготовления пищи и ежедневного ухода: премиальные и доступные решения.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Խոհանոցային նորույթներ՝ հատուկ գներ',
        en: 'Kitchen upgrades at special prices',
        ru: 'Новинки для кухни по специальным ценам',
      },
      subline: {
        hy: 'Պատրաստեք, թխեք և պահեք՝ մեկ տեղից։ Ընտրեք ձեր խոհանոցին համապատասխան տեխնիկա։',
        en: 'Cook, bake and store with gear that fits your kitchen workflow.',
        ru: 'Готовьте и храните продукты с техникой под ваш кухонный сценарий.',
      },
    },
  },
  {
    slugs: [
      'large-appliances',
      'major-appliances',
      'white-goods',
      'washing-machines',
      'khshor-kentsaghayin-tekhnika',
    ],
    figmaIconSrc: '/images/category-nav/large-appliances.png',
    labels: {
      hy: 'Խոշոր կենցաղային տեխնիկա',
      en: 'Large home appliances',
      ru: 'Крупная бытовая техника',
    },
    descriptions: {
      hy: 'Լվացքի և սушիչ մեքենաներ, սառնարաններ և այլ խոշոր տեխնիկա՝ հուսալի աշխատանքի և երկար ծառայության ժամկետի համար։',
      en: 'Washing machines, dryers, refrigerators and other large appliances built for reliability and performance.',
      ru: 'Стиральные и сушильные машины, холодильники и другая крупная техника для быта.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Խոշոր տեխնիկա՝ էներգաարդյունավետ մոդելներ',
        en: 'Large appliances: energy‑smart picks for your home',
        ru: 'Крупная техника: энергоэффективные решения',
      },
      subline: {
        hy: 'Սառնարաններ, լվացքի մեքենաներ և ավելին՝ հուսալի բրենդներից։',
        en: 'Fridges, washers and more from brands you can trust.',
        ru: 'Холодильники, стиральные машины и другое от проверенных брендов.',
      },
    },
  },
  {
    slugs: [
      'kitchen-appliances',
      'kitchen',
      'patuhanakan-tekhnika',
      'refrigerators',
    ],
    figmaIconSrc: '/images/category-nav/kitchen-appliances.svg',
    labels: {
      hy: 'Խոհանոցային տեխնիկա',
      en: 'Kitchen appliances',
      ru: 'Кухонная техника',
    },
    descriptions: {
      hy: 'Խոհանոցային տեխնիկա՝ հավաքման, ստեղծագործության և ամենօրյա պատրաստման համար։ Պրեմիում բրենդներ և մատչելի լուծումներ։',
      en: 'Appliances for cooking, baking and everyday prep. Premium brands and practical options.',
      ru: 'Техника для приготовления пищи и ежедневного ухода: премиальные и доступные решения.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Խոհանոցային նորույթներ՝ հատուկ գներ',
        en: 'Kitchen upgrades at special prices',
        ru: 'Новинки для кухни по специальным ценам',
      },
      subline: {
        hy: 'Պատրաստեք, թխեք և պահեք՝ մեկ տեղից։ Ընտրեք ձեր խոհանոցին համապատասխան տեխնիկա։',
        en: 'Cook, bake and store with gear that fits your kitchen workflow.',
        ru: 'Готовьте и храните продукты с техникой под ваш кухонный сценарий.',
      },
    },
  },
  {
    slugs: ['sports'],
    figmaIconSrc: '/images/category-nav/sports.svg',
    labels: {
      hy: 'Աուդիո և վիդեո համակարգեր',
      en: 'Audio and video systems',
      ru: 'Аудио- и видеотехника',
    },
    descriptions: {
      hy: 'Հեռուստացույցներ, սաունդբարեր, ակուստիկա և աքսեսուարներ՝ տեսնելու և լսելու համար հարմար հավաքածու։',
      en: 'TVs, soundbars, speakers and accessories for immersive home entertainment.',
      ru: 'Телевизоры, саундбары, акустика и аксессуары для домашнего кино и музыки.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Տեսա-աուդիո համակարգեր՝ կինոյի համար տանը',
        en: 'Audio & video: cinema‑quality at home',
        ru: 'Аудио и видео: кинотеатр у вас дома',
      },
      subline: {
        hy: 'Պարզ, հզոր ձայն և պատկեր՝ ֆիլմերի և խաղերի համար։',
        en: 'Crisp picture and powerful sound for movies, shows and games.',
        ru: 'Чёткая картина и мощный звук для фильмов и игр.',
      },
    },
  },
  {
    slugs: ['books'],
    figmaIconSrc: '/images/category-nav/books.svg',
    labels: {
      hy: 'Ջրի դիսպենսերներ',
      en: 'Water dispensers',
      ru: 'Кулеры и диспенсеры воды',
    },
    descriptions: {
      hy: 'Ջրի դիսպենսերներ և կուլերներ՝ մաքուր, հարմար հավաքածու տան և գրասենյակի համար։',
      en: 'Water dispensers and coolers for clean drinking water at home or in the office.',
      ru: 'Кулеры и диспенсеры для чистой питьевой воды дома и в офисе.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Մաքուր ջուր ամեն օր՝ հարմար դիսպենսերներով',
        en: 'Clean water every day—smart dispensers & coolers',
        ru: 'Чистая вода каждый день — кулеры и диспенсеры',
      },
      subline: {
        hy: 'Հարմար լուծումներ տան և աշխատանքային տարածքի համար։',
        en: 'Convenient solutions for home and workspace hydration.',
        ru: 'Удобные решения для дома и офиса.',
      },
    },
  },
  {
    slugs: ['accessories'],
    figmaIconSrc: '/images/category-nav/accessories.svg',
    labels: {
      hy: 'Կենցաղային տեխնիկա',
      en: 'Home appliances',
      ru: 'Мелкая бытовая техника',
    },
    descriptions: {
      hy: 'Մանր կենցաղային տեխնիկա՝ խոհանոցի, մաքրության և հարմարավետության համար։',
      en: 'Small appliances for the kitchen, cleaning and everyday convenience.',
      ru: 'Мелкая техника для кухни, уборки и повседневного комфорта.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Մանր տեխնիկա՝ ամենօրյա հարմարավետության համար',
        en: 'Small appliances for everyday ease',
        ru: 'Мелкая техника для повседневного комфорта',
      },
      subline: {
        hy: 'Խոհանոց, մաքրություն և ավելին՝ մեկ կտորով։',
        en: 'Kitchen helpers, cleaning tools and more in one place.',
        ru: 'Кухня, уборка и другое — всё в одном месте.',
      },
    },
  },
  {
    slugs: ['__extra-climate__'],
    figmaIconSrc: '/images/category-nav/climate-extra.svg',
    labels: {
      hy: 'Օդորակիչներ և տաքացուցիչներ',
      en: 'Air conditioners and heaters',
      ru: 'Кондиционеры и обогреватели',
    },
    descriptions: {
      hy: 'Կլիմայի կարգավորում՝ օդորակիչներ, տաքացուցիչներ և լուծումներ ամեն սեզոնի համար։',
      en: 'Climate control: air conditioners, heaters and solutions for year-round comfort.',
      ru: 'Климатическая техника: кондиционеры, обогреватели и комфорт в любой сезон.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Կլիմա ամբողջ տարվա համար՝ օդորակիչներ և տաքացուցիչներ',
        en: 'Climate comfort year‑round—AC & heaters',
        ru: 'Комфорт круглый год — кондиционеры и обогреватели',
      },
      subline: {
        hy: 'Պահեք իդեալական ջերմաստիճանը տանը ցանկացած եղանակին։',
        en: 'Keep the perfect temperature at home in any season.',
        ru: 'Поддерживайте комфортную температуру в любое время года.',
      },
    },
  },
  {
    slugs: [
      'audio-video',
      'tv-audio',
      'televisions',
      'audio-and-video',
      'audiovideo',
    ],
    figmaIconSrc: '/images/category-nav/audio-video.png',
    labels: {
      hy: 'Աուդիո և վիդեո համակարգեր',
      en: 'Audio and video systems',
      ru: 'Аудио- и видеотехника',
    },
    descriptions: {
      hy: 'Հեռուստացույցներ, սաունդբարեր, ակուստիկա և աքսեսուարներ՝ տեսնելու և լսելու համար հարմար հավաքածու։',
      en: 'TVs, soundbars, speakers and accessories for immersive home entertainment.',
      ru: 'Телевизоры, саундбары, акустика и аксессуары для домашнего кино и музыки.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Տեսա-աուդիո համակարգեր՝ կինոյի համար տանը',
        en: 'Audio & video: cinema‑quality at home',
        ru: 'Аудио и видео: кинотеатр у вас дома',
      },
      subline: {
        hy: 'Պարզ, հզոր ձայն և պատկեր՝ ֆիլմերի և խաղերի համար։',
        en: 'Crisp picture and powerful sound for movies, shows and games.',
        ru: 'Чёткая картина и мощный звук для фильмов и игр.',
      },
    },
  },
  {
    slugs: ['water-dispensers', 'water-coolers'],
    figmaIconSrc: '/images/category-nav/water-dispensers.png',
    labels: {
      hy: 'Ջրի դիսպենսերներ',
      en: 'Water dispensers',
      ru: 'Кулеры и диспенсеры воды',
    },
    descriptions: {
      hy: 'Ջրի դիսպենսերներ և կուլերներ՝ մաքուր, հարմար հավաքածու տան և գրասենյակի համար։',
      en: 'Water dispensers and coolers for clean drinking water at home or in the office.',
      ru: 'Кулеры и диспенсеры для чистой питьевой воды дома и в офисе.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Մաքուր ջուր ամեն օր՝ հարմար դիսպենսերներով',
        en: 'Clean water every day—smart dispensers & coolers',
        ru: 'Чистая вода каждый день — кулеры и диспенсеры',
      },
      subline: {
        hy: 'Հարմար լուծումներ տան և աշխատանքային տարածքի համար։',
        en: 'Convenient solutions for home and workspace hydration.',
        ru: 'Удобные решения для дома и офиса.',
      },
    },
  },
  {
    slugs: [
      'home-appliances',
      'small-appliances',
      'household-appliances',
      'kentsaghayin-tekhnika',
    ],
    figmaIconSrc: '/images/category-nav/home-appliances.png',
    labels: {
      hy: 'Կենցաղային տեխնիկա',
      en: 'Home appliances',
      ru: 'Мелкая бытовая техника',
    },
    descriptions: {
      hy: 'Մանր կենցաղային տեխնիկա՝ խոհանոցի, մաքրության և հարմարավետության համար։',
      en: 'Small appliances for the kitchen, cleaning and everyday convenience.',
      ru: 'Мелкая техника для кухни, уборки и повседневного комфорта.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Մանր տեխնիկա՝ ամենօրյա հարմարավետության համար',
        en: 'Small appliances for everyday ease',
        ru: 'Мелкая техника для повседневного комфорта',
      },
      subline: {
        hy: 'Խոհանոց, մաքրություն և ավելին՝ մեկ կտորով։',
        en: 'Kitchen helpers, cleaning tools and more in one place.',
        ru: 'Кухня, уборка и другое — всё в одном месте.',
      },
    },
  },
  {
    slugs: [
      'air-conditioners',
      'climate',
      'hvac',
      'heaters',
      'odorakichner',
    ],
    figmaIconSrc: '/images/category-nav/climate.png',
    labels: {
      hy: 'Օդորակիչներ և տաքացուցիչներ',
      en: 'Air conditioners and heaters',
      ru: 'Кондиционеры и обогреватели',
    },
    descriptions: {
      hy: 'Կլիմայի կարգավորում՝ օդորակիչներ, տաքացուցիչներ և լուծումներ ամեն սեզոնի համար։',
      en: 'Climate control: air conditioners, heaters and solutions for year-round comfort.',
      ru: 'Климатическая техника: кондиционеры, обогреватели и комфорт в любой сезон.',
    },
    promo: {
      badge: {
        hy: 'Սահմանափակ առաջարկ',
        en: 'Limited time offer',
        ru: 'Ограниченное предложение',
      },
      headline: {
        hy: 'Կլիմա ամբողջ տարվա համար՝ օդորակիչներ և տաքացուցիչներ',
        en: 'Climate comfort year‑round—AC & heaters',
        ru: 'Комфорт круглый год — кондиционеры и обогреватели',
      },
      subline: {
        hy: 'Պահեք իդեալական ջերմաստիճանը տանը ցանկացած եղանակին։',
        en: 'Keep the perfect temperature at home in any season.',
        ru: 'Поддерживайте комфортную температуру в любое время года.',
      },
    },
  },
];

const SLUG_TO_ROW = new Map<string, (typeof NAV_ROWS)[number]>();

function normalizeCategoryKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

for (const row of NAV_ROWS) {
  for (const s of row.slugs) {
    const lowered = s.toLowerCase();
    SLUG_TO_ROW.set(lowered, row);
    SLUG_TO_ROW.set(normalizeCategoryKey(lowered), row);
  }
}

const FALLBACK_DESCRIPTION: LabelSet = {
  hy: 'Դիտեք «{name}» բաժնում առկա ապրանքների ընտրանին և ընտրեք ձեր համար հարմարը։',
  en: 'Browse products in “{name}” and choose what fits you best.',
  ru: 'Смотрите товары в «{name}» и подберите подходящее.',
};

const FALLBACK_PROMO_BADGE: LabelSet = {
  hy: 'Սահմանափակ առաջարկ',
  en: 'Limited time offer',
  ru: 'Ограниченное предложение',
};

const FALLBACK_PROMO_HEADLINE: LabelSet = {
  hy: 'Բացահայտեք «{name}»',
  en: 'Discover {name}',
  ru: 'Откройте {name}',
};

function labelForLang(labels: LabelSet, lang: LanguageCode): string {
  if (lang === 'hy') {
    return labels.hy;
  }
  if (lang === 'ru') {
    return labels.ru;
  }
  if (lang === 'ka') {
    return labels.en;
  }
  return labels.en;
}

export type CategoryNavIcon =
  | { readonly kind: 'figma'; readonly src: string }
  | { readonly kind: 'lucide'; readonly Icon: LucideIcon };

export type CategoryNavPromo = {
  readonly badge: string;
  readonly headline: string;
  readonly subline: string;
};

export function resolveCategoryNavPresentation(
  slug: string,
  apiTitle: string,
  lang: LanguageCode
): {
  readonly title: string;
  readonly icon: CategoryNavIcon;
  readonly description: string;
  readonly promo: CategoryNavPromo;
} {
  const normalizedSlug = normalizeCategoryKey(slug);
  const normalizedTitle = normalizeCategoryKey(apiTitle);
  const row =
    SLUG_TO_ROW.get(slug.trim().toLowerCase()) ??
    SLUG_TO_ROW.get(normalizedSlug) ??
    SLUG_TO_ROW.get(normalizedTitle);
  if (!row) {
    const desc = labelForLang(FALLBACK_DESCRIPTION, lang).replace('{name}', apiTitle);
    return {
      title: apiTitle,
      icon: { kind: 'lucide', Icon: Package },
      description: desc,
      promo: {
        badge: labelForLang(FALLBACK_PROMO_BADGE, lang),
        headline: labelForLang(FALLBACK_PROMO_HEADLINE, lang).replace('{name}', apiTitle),
        subline: desc,
      },
    };
  }
  return {
    title: labelForLang(row.labels, lang),
    icon: { kind: 'figma', src: row.figmaIconSrc },
    description: labelForLang(row.descriptions, lang),
    promo: {
      badge: labelForLang(row.promo.badge, lang),
      headline: labelForLang(row.promo.headline, lang),
      subline: labelForLang(row.promo.subline, lang),
    },
  };
}
