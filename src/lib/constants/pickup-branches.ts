import {
  getContactLocations,
  type ContactLocation,
  type ContactLocationId,
} from '../contact-locations';
import type { LanguageCode } from '../language';

export type PickupBranchId = ContactLocationId;

export type PickupBranch = {
  id: PickupBranchId;
  label: string;
};

const CONTACT_LOCATION_IDS: readonly ContactLocationId[] = ['yerevan', 'argavand', 'parakar'];

/** Store pickup branches — same locations as the Contact page. */
export function getPickupBranches(lang: LanguageCode): PickupBranch[] {
  return getContactLocations(lang).map((location: ContactLocation) => ({
    id: location.id,
    label: location.address,
  }));
}

export function getPickupBranchLabel(branchId: PickupBranchId, lang: LanguageCode): string {
  const location = getContactLocations(lang).find((entry) => entry.id === branchId);
  return location?.address ?? branchId;
}

export function isPickupBranchId(value: string): value is PickupBranchId {
  return (CONTACT_LOCATION_IDS as readonly string[]).includes(value);
}
