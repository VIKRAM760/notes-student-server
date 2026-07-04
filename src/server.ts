import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://student.reactdevacademy.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header (Postman, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(`Blocked by CORS: ${origin}`);

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});