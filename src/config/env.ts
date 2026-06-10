export const ENV = {
  //API_URL: process.env.EXPO_PUBLIC_API_URL || '',
  MASSIVE_KEY: process.env.EXPO_PUBLIC_MASSIVE_KEY || '',
  // APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Marked',
  // PAYSTACK_KEY: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
};

// Debug environment variables (remove after testing)
// console.log('[ENV] EXPO_PUBLIC_MASSIVE_KEY:', process.env.EXPO_PUBLIC_MASSIVE_KEY);
// console.log('[ENV] Parsed ENV.MASSIVE_KEY:', ENV.MASSIVE_KEY);

// Warn if critical environment variables are missing
if (!ENV.MASSIVE_KEY) {
  console.warn(
    '[ENV] ⚠️  EXPO_PUBLIC_MASSIVE_KEY is not set. Market data will use fallback/seeded values. ' +
    'Get a free API key from https://massive.com and add it to your .env.local file'
  );
}

// if (!ENV.PAYSTACK_KEY) {
//   console.warn(
//     '[ENV] ⚠️  EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY is not set. Payment features may not work.'
//   );
// }