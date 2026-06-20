import { z } from "zod";

export const compareAddBodySchema = z.object({
  productId: z.string().min(1),
});
