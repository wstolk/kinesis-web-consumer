/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    // Disabled instrumentation hook - not needed for this app
    // experimental: {
    //     instrumentationHook: true
    // }
};

export default nextConfig;
