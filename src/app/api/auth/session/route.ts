import { isAdmin, json } from "@/lib/auth";
import { readDb } from "@/lib/store";

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return json({ admin: false });
  const db = await readDb();
  return json({ admin: true, newInquiries: db.inquiries.filter((q) => q.status === "new").length });
}
