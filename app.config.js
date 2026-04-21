const { config } = require('dotenv');
const { resolve } = require('path');

// Load .env from project root
config({ path: resolve(process.cwd(), '.env') });

module.exports = ({ config: expoConfig }) => {
  return {
    ...expoConfig,
    extra: {
      ...(expoConfig.extra || {}),
      SUPABASE_URL: process.env.SUPABASE_URL,
      PUBLISHABLE_KEY: process.env.PUBLISHABLE_KEY,
    },
  };
};
