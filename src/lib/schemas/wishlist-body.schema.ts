import { z } from "zod";

export const wishlistAddBodySchema = z.object({
  productId: z.string().min(1),
});
