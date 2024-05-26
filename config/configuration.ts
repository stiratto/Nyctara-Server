export default () => ({
    secret_password: "1596321jdmm",
    database: {
      database_url: process.env.DATABASE_URL, 
    },
    amazon_s3: {
        bucket_name: process.env.BUCKET_NAME,
        bucket_region: process.env.BUCKET_REGION,
        access_key: process.env.ACCESS_KEY,
        secret_access_key: process.env.SECRET_ACCESS_KEY,
    }
  });