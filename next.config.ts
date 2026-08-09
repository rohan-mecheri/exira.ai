import type { NextConfig } from "next";

const config: NextConfig = {
  // The site shipped as two static .html entry points. Anything already
  // pointing at the old URLs keeps working.
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/thesis.html", destination: "/thesis", permanent: true },
    ];
  },
};

export default config;
