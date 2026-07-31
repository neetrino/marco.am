import { redirect } from 'next/navigation';

/**
 * Backward-compatible alias for legacy footer links.
 * Keeps old /installment-terms URLs working by forwarding to privacy policy.
 */
export default function InstallmentTermsPage() {
  redirect('/privacy');
}
