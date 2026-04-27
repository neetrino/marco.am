import { Montserrat } from 'next/font/google';

/** Featured products strip title — matches prior `FeaturedProductsTabs` subset. */
export const montserratFeatured = Montserrat({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
});

/** Special offers section — matches prior `HomeSpecialOffersSection` subset. */
export const montserratSpecial = Montserrat({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700', '900'],
  display: 'swap',
});
