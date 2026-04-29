import { NextRequest } from "next/server";
import { processIdramCallback } from "@/lib/services/payment-idram.service";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  return processIdramCallback(formData);
}
