require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// Rate limit - chống spam cho 2000 user
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Quá nhiều request, thử lại sau'
});
app.use('/api/', limiter);

// MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/township', {
  maxPoolSize: 50
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('Mongo error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

app.get('/api/news', (req, res) => {
  res.json({
    title: 'Свежие новости',
    content: 'Итоги турнира (от 01.05.2026)!',
    date: 'от 01 май 20:00',
    online: io.engine.clientsCount
  });
});

// Socket.io - đếm online real-time
let onlineUsers = new Set();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) onlineUsers.add(userId);
  
  io.emit('online', onlineUsers.size);
  
  socket.on('disconnect', () => {
    if (userId) onlineUsers.delete(userId);
    io.emit('online', onlineUsers.size);
  });
  
  // Heartbeat mỗi 30s
  socket.on('ping', () => socket.emit('pong'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server chạy port ${PORT} - sẵn sàng 2000+ user`);
});
