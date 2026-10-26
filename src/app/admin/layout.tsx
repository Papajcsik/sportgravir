import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin belépés",
  description: "Belépés a Sport Gravír webáruház kezeléséhez.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
