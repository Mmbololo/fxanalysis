const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

require("dotenv").config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({ where: { email: "admin@digipedia.com" } });
  if (!user) {
    console.log("User NOT found in database!");
  } else {
    console.log("User found:", { id: user.id, email: user.email, role: user.role, hasHash: !!user.passwordHash });
    const match = await bcrypt.compare("Admin@2026!", user.passwordHash);
    console.log("Password 'Admin@2026!' matches hash:", match);
  }

  await prisma.$disconnect();
  pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
