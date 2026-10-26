import { guardAdmin, json } from "@/lib/auth";
import { readDb } from "@/lib/store";

export async function GET(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const db = await readDb();
  const inquiries = [...db.inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json({ inquiries, newInquiries: inquiries.filter((q) => q.status === "new").length });
}
