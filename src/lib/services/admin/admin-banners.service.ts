import { db } from "@white-shop/db";

export interface CreateBannerData {
  title?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  position?: number;
  active?: boolean;
}

export interface UpdateBannerData {
  title?: string | null;
  imageUrl?: string;
  linkUrl?: string | null;
  position?: number;
  active?: boolean;
}

class AdminBannersService {
  async list() {
    return db.banner.findMany({
      orderBy: { position: "asc" },
    });
  }

  async getById(id: string) {
    const banner = await db.banner.findUnique({
      where: { id },
    });
    if (!banner) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Not found",
        detail: "Banner not found",
      };
    }
    return banner;
  }

  async create(data: CreateBannerData) {
    return db.banner.create({
      data: {
        title: data.title ?? null,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl ?? null,
        position: data.position ?? 0,
        active: data.active ?? true,
      },
    });
  }

  async update(id: string, data: UpdateBannerData) {
    await this.getById(id);
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.active !== undefined) updateData.active = data.active;
    return db.banner.update({
      where: { id },
      data: updateData as Parameters<typeof db.banner.update>[0]["data"],
    });
  }

  async delete(id: string) {
    await this.getById(id);
    await db.banner.delete({ where: { id } });
    return { success: true };
  }
}

export const adminBannersService = new AdminBannersService();
