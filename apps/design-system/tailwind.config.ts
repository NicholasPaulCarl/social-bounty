import webConfig from '../web/tailwind.config';
import type { Config } from 'tailwindcss';

const config: Config = {
  ...webConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
};

export default config;
