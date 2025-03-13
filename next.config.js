/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https://cdn.jsdelivr.net",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
              "img-src 'self' blob: data:",
              "media-src 'self' blob:",
              "connect-src 'self' https://storage.googleapis.com https://tfhub.dev https://www.kaggle.com https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
              "worker-src 'self' blob:"
            ].join('; ')
          }
        ]
      }
    ];
  },
  webpack: (config, { isServer }) => {
    // Handle tfjs-node in webpack
    if (isServer) {
      config.externals.push('@tensorflow/tfjs-node');
    }
    return config;
  },
};

module.exports = nextConfig;