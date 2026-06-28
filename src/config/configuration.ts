export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  baseUrl: process.env.JOYPAY_BASE_URL || 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  hmac: {
    toleranceSeconds: parseInt(process.env.HMAC_TOLERANCE_SECONDS ?? '300', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
    expiration: process.env.JWT_EXPIRATION || '1d',
  },
  payment: {
    sandbox: process.env.PAYMENT_SANDBOX !== 'false',
  },
  bkash: {
    sandbox: process.env.BKASH_SANDBOX !== 'false',
    appKey: process.env.BKASH_APP_KEY || '',
    appSecret: process.env.BKASH_APP_SECRET || '',
    username: process.env.BKASH_USERNAME || '',
    password: process.env.BKASH_PASSWORD || '',
  },
  nagad: {
    sandbox: process.env.NAGAD_SANDBOX !== 'false',
    merchantId: process.env.NAGAD_MERCHANT_ID || '',
    merchantPrivateKey: process.env.NAGAD_MERCHANT_PRIVATE_KEY || '',
    pgPublicKey: process.env.NAGAD_PG_PUBLIC_KEY || '',
  },
});
