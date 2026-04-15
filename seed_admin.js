const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function main() {
  const db = new sqlite3.Database('./dev.db');
  
  const email = 'admin@example.com';
  const role = 'ADMIN';
  const plainPassword = 'admin';
  const hash = await bcrypt.hash(plainPassword, 10);
  const id = crypto.randomUUID();
  const dateStr = new Date().toISOString();

  db.run(`INSERT INTO User (id, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`, 
    [id, email, hash, role, dateStr, dateStr], 
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            console.log("Admin user already exists!");
        } else {
            console.error(err);
        }
      } else {
        console.log("Admin seeded! Email: admin@example.com | Password: admin");
      }
      db.close();
      process.exit(0);
    });
}
main();
