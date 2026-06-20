import { BrandsDirectory } from './BrandsDirectory';

/** Static shell; the brand grid is fetched client-side from the cached public API. */
export default function BrandsPage() {
  return <BrandsDirectory />;
}
