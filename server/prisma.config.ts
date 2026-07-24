import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    async development() {
      return {
        url: process.env.DATABASE_URL!,
      };
    },
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
