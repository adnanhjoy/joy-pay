export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
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
});
