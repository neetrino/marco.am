import type { HeaderSocialAccount } from './header-social-accounts.constants';

export type MessengerChatPlatform = 'telegram' | 'whatsapp' | 'viber';

type MessengerBranch = {
  readonly id: 'argavand' | 'yerevan' | 'avan';
  /** Digits only, country code included (no +). */
  readonly phoneDigits: string;
  readonly phoneDisplay: string;
  readonly labelKey: string;
};

/**
 * Branch phones for Telegram / WhatsApp / Viber pickers
 * (same order as product/content: Argavand → Alek Manukyan → Avan).
 */
const MESSENGER_BRANCHES: readonly MessengerBranch[] = [
  {
    id: 'argavand',
    phoneDigits: '37493580409',
    phoneDisplay: '+374 93 58 04 09',
    labelKey: 'contact.social.messengerBranches.argavand',
  },
  {
    id: 'yerevan',
    phoneDigits: '37493520406',
    phoneDisplay: '+374 93 52 04 06',
    labelKey: 'contact.social.messengerBranches.yerevan',
  },
  {
    id: 'avan',
    phoneDigits: '37441490406',
    phoneDisplay: '+374 41 49 04 06',
    labelKey: 'contact.social.messengerBranches.avan',
  },
];

export function messengerChatHref(platform: MessengerChatPlatform, phoneDigits: string): string {
  switch (platform) {
    case 'telegram':
      return `https://t.me/+${phoneDigits}`;
    case 'whatsapp':
      return `https://wa.me/${phoneDigits}`;
    case 'viber':
      return `viber://chat?number=${phoneDigits}`;
  }
}

/** Instagram-style account menu entries for a messenger platform. */
export function getMessengerBranchAccounts(
  platform: MessengerChatPlatform,
): readonly HeaderSocialAccount[] {
  return MESSENGER_BRANCHES.map((branch) => ({
    id: `${platform}-${branch.id}`,
    href: messengerChatHref(platform, branch.phoneDigits),
    labelKey: branch.labelKey,
    subtitle: branch.phoneDisplay,
  }));
}
