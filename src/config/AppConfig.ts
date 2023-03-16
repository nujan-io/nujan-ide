export const AppConfig = {
  name: 'Nujan',
  seo: {
    title: 'Nujan IDE',
  },
  network: 'testnet',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000',
  loginPath: '/',
};
