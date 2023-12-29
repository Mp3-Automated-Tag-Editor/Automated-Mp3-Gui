/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
}

module.exports = nextConfig

// module.exports = {
//   async redirects() {
//     return [
//       {
//         source: '/',
//         destination: '/dashboard',
//         permanent: true,
//       },
//     ]
//   },
// }
