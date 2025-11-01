import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  created_at: string;
}

interface Session {
  id: number;
  session_id: string;
  user_id: number;
  created_at: string;
  expires_at: string;
}

// Authentication middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId) {
    return res.status(401).json({ error: 'No session provided' });
  }

  const session = db.prepare('SELECT * FROM sessions WHERE session_id = ? AND expires_at > datetime(\'now\')').get(sessionId) as Session | undefined;
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  (req as any).userId = session.user_id;
  next();
};

// Auth routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as User | undefined;
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create session
  const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  db.prepare('INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, user.id, expiresAt);

  res.json({ sessionId, user: { id: user.id, username: user.username, role: user.role } });
});

app.post('/api/logout', requireAuth, (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  db.prepare('DELETE FROM sessions WHERE session_id = ?').run(sessionId);
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/status', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get((req as any).userId) as User | undefined;
  res.json({ authenticated: true, user });
});

// Payments routes
app.get('/api/payments', (req, res) => {
  const payments = db.prepare('SELECT * FROM payments ORDER BY date').all();
  res.json(payments);
});

app.put('/api/payments/:date', requireAuth, (req, res) => {
  const { date } = req.params;
  const { status } = req.body;

  if (!['paid', 'due', 'nothing'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = db.prepare('UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ?').run(status, date);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  const updatedPayment = db.prepare('SELECT * FROM payments WHERE date = ?').get(date);
  res.json(updatedPayment);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});