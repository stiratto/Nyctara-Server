export const configuration = () => ({
  secret_password: process.env.SECRET_PASSWORD,
  jwt_secret: process.env.JWT_SECRET,
  database: {
    database_url: process.env.DATABASE_URL,
  },
  amazon_s3: {
    bucket_name: process.env.BUCKET_NAME,
    bucket_region: process.env.BUCKET_REGION,
    access_key: process.env.ACCESS_KEY,
    secret_access_key: process.env.SECRET_ACCESS_KEY,
  },
  port: process.env.PORT,
  bold_api_key: process.env.BOLD_API_KEY,
  bold_api_url: process.env.BOLD_API_URL
});
