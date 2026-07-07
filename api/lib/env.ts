export const env = {
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "3000"),
  databaseUrl: process.env.DATABASE_URL || "",
  appId: process.env.APP_ID || "",
  appSecret: process.env.APP_SECRET || "",
};
