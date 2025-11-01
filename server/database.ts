import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'nothing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

// Insert default admin user if not exists
const insertAdmin = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, role)
  VALUES (?, ?, ?)
`);
insertAdmin.run('admin', 'admin@partha', 'admin');

// Insert default payments if not exists
const insertPayment = db.prepare(`
  INSERT OR IGNORE INTO payments (date, amount, status)
  VALUES (?, ?, ?)
`);

const startDate = new Date(2025, 9, 31); // October 31, 2025
const paymentAmount = 300;
let currentDate = new Date(startDate);
const endDate = new Date(2028, 11, 31); // December 31, 2028

while (currentDate <= endDate) {
  const dateStr = currentDate.toISOString().split('T')[0];
  insertPayment.run(dateStr, paymentAmount, 'nothing');
  currentDate.setDate(currentDate.getDate() + 14); // Add 2 weeks
}

export default db;