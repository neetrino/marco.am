export interface QuickSettingsCategory {
  id: string;
  title: string;
  parentId: string | null;
}

export interface QuickSettingsBrand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface QuickSettingsProductRow {
  id: string;
  title: string;
  image?: string | null;
  price?: number;
  discountPercent?: number;
}
