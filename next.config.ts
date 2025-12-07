import { withWorkflow } from 'workflow/next'; 
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  serverExternalPackages: ["puppeteer"],
};

export default withWorkflow(nextConfig); 