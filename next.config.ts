import type { NextConfig } from "next";

/** The addresses of the live Joomla site that moved here (the product pages keep their addresses, e.g. /serlegek/premium-serleg). */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/impresszum.pdf", destination: "/docs/impresszum.pdf", permanent: true },
      { source: "/images/arlista.pdf", destination: "/docs/arlista.pdf", permanent: true },
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/webveset", destination: "/", permanent: true },
      { source: "/ajanlatkeres", destination: "/rendeles", permanent: true },
      { source: "/cart", destination: "/rendeles", permanent: true },
    ];
  },
};

export default nextConfig;
