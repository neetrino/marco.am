import { redirect } from 'next/navigation';

interface AddProductRedirectPageProps {
  searchParams: Promise<{ id?: string }>;
}

/** Legacy route — forwards to products sheet (?create=1 or ?edit=id). */
export default async function AddProductRedirectPage({ searchParams }: AddProductRedirectPageProps) {
  const { id } = await searchParams;

  if (id) {
    redirect(`/supersudo/products?edit=${encodeURIComponent(id)}`);
  }

  redirect('/supersudo/products?create=1');
}
