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

  const email = "admin@digipedia.com";
  const password = "Admin@2026!";
  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Ensure it has ADMIN role and correct hash
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN", passwordHash: hash },
    });
    console.log(`Admin user updated: ${email}`);
  } else {
    await prisma.user.create({
      data: { email, passwordHash: hash, role: "ADMIN" },
    });
    console.log(`Admin user created: ${email}`);
  }

  console.log(`\nLogin credentials:\n  Email: ${email}\n  Password: ${password}`);
  await prisma.$disconnect();
  pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
