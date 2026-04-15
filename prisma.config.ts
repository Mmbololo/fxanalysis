import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "postgresql://postgres.apcrxfvfyxealpmqcvwb:%23D1g1p3d1%402026%21@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
  },
});
