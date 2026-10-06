import type { NextConfig } from "next";

const config: NextConfig = {
  // The site shipped as two static .html entry points. Anything already
  // pointing at the old URLs keeps working.
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      // The thesis is withdrawn from the site (its page lives in
      // archive/thesis); old links land on the home page instead.
      { source: "/thesis.html", destination: "/", permanent: false },
      { source: "/thesis", destination: "/", permanent: false },
    ];
  },
};

export default config;
