require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// LowDB - lưu JSON, không cần MongoDB
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { users: [], farms: [] });
db.read().then(() => console.log('✅ DB ready'));

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const limiter = rateLimit({ windowMs: 60000, max: 200 });
app.use('/api/', limiter);

const JWT_SECRET = process.env.JWT_SECRET || 'township_demo_2026';

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({success:false});
  try { req.userId = jwt.verify(token, JWT_SECRET).id; next(); }
  catch { res.status(401).json({success:false}); }
};

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  await db.read();
  const { login, password, email, gender } = req.body;
  if (db.data.users.find(u => u.login === login)) {
    return res.json({success:false, message:'Tên đã tồn tại'});
  }
  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), login, passwordHash: hash, email, gender, gold:315, diamonds:310, level:1, xp:9, createdAt:new Date() };
  db.data.users.push(user);
  db.data.farms.push({ userId:user.id, farmData:{ wheatPlanted:6, wheatFinishAt:Date.now()+111000, barn:6, warehouse:9, chickenCoop:0, plots:5 } });
  await db.write();
  const token = jwt.sign({id:user.id}, JWT_SECRET, {expiresIn:'30d'});
  res.json({success:true, token, user:{login:user.login, gold:user.gold, diamonds:user.diamonds, level:1, xp:9}});
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  await db.read();
  const { login, password } = req.body;
  const user = db.data.users.find(u => u.login === login);
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.json({success:false, message:'Sai mật khẩu'});
  }
  const token = jwt.sign({id:user.id}, JWT_SECRET, {expiresIn:'30d'});
  res.json({success:true, token, user:{login:user.login, gold:user.gold, diamonds:user.diamonds, level:user.level, xp:user.xp}});
});

// LOAD
app.get('/api/game/load', auth, async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.userId);
  const farm = db.data.farms.find(f => f.userId === req.userId);
  res.json({success:true, user:{gold:user.gold, diamonds:user.diamonds, level:user.level, xp:user.xp}, farm:farm.farmData});
});

// SAVE
app.post('/api/game/save', auth, async (req, res) => {
  await db.read();
  const { gold, diamonds, level, xp, farm } = req.body;
  const user = db.data.users.find(u => u.id === req.userId);
  Object.assign(user, {gold, diamonds, level, xp});
  const f = db.data.farms.find(f => f.userId === req.userId);
  f.farmData = farm;
  await db.write();
  res.json({success:true});
});

app.get('/api/news', (req, res) => {
  res.json({title:'Свежие новости', content:'Итоги турнира (от 01.05.2026)!', date:'от 01 май 20:00', online: io.engine.clientsCount});
});

// Socket online
let online = new Set();
io.on('connection', socket => {
  const uid = socket.handshake.query.userId;
  if(uid) online.add(uid);
  io.emit('online', online.size);
  socket.on('disconnect', () => { if(uid) online.delete(uid); io.emit('online', online.size); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Demo chạy port ${PORT} - không cần MongoDB`));
