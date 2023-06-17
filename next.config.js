/** @type {import('next').NextConfig} */

const FFMPEG_PATH = "ffmpeg";

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_FFMPEG_URL: `/${FFMPEG_PATH}`,
  },
  headers() {
    return [
      {
        source: "/(.*)",
        locale: false,
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' blob:",
              "style-src 'unsafe-inline' 'self'",

              // the ffmpeg-wasm library requires "blob:" to work, even though that's not a good idea
              // on safari, it even requires 'unsafe-eval', so I begrudgingly added it as well
              `script-src 'self' blob: 'unsafe-eval'`,

              "form-action 'none'",
              "frame-ancestors 'none'",
            ].join(";"),
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp", // required for SharedArrayBuffer of the ffmpeg library
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin", // required for SharedArrayBuffer of the ffmpeg library
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "deny",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
