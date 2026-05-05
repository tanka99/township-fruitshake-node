# Township Fruitshake - Node.js + MongoDB (2000+ users)

Bản nâng cấp từ PHP sang Node.js để chịu tải như fruitshake.ru thật.

## Tại sao Node.js?
- PHP blocking I/O → chậm với 2000 user
- Node.js non-blocking + Socket.io → real-time online count
- MongoDB lưu JSON farm trực tiếp, nhanh hơn MySQL
- JWT stateless, scale horizontal dễ dàng

## Cài đặt

1. Cài Node.js 18+
2. Cài MongoDB (local hoặc MongoDB Atlas miễn phí)
3. 
```bash
cd township-node
npm install
```

4. Sửa `.env`:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/township
JWT_SECRET=doi_cai_nay_thanh_chuoi_bi_mat
```

5. Chạy:
```bash
npm start
```
→ http://localhost:3000

## API Endpoints

POST /api/auth/register
{ login, password, email, gender }
→ trả về token + user (diamonds = 310)

POST /api/auth/login
→ token JWT 30 ngày

GET /api/game/load
Header: Authorization: Bearer <token>

POST /api/game/save
{ gold, diamonds, level, xp, farm }

GET /api/news
→ { online: 1823 }

Socket.io:
io.connect('/?userId=xxx')
→ event 'online' trả về số người đang chơi

## Tối ưu cho 2000 user

- `maxPoolSize: 50` trong mongoose
- Rate limit 100 req/phút
- Index trên login và userId
- Farm data lưu dạng JSON, không join bảng
- Socket.io chỉ gửi số online, không broadcast nặng

## Deploy production

- Dùng PM2: `pm2 start server.js -i max`
- Nginx reverse proxy
- MongoDB Atlas M10 (chịu 2000 concurrent)
- Cloudflare CDN cho static files

## Frontend đã tích hợp
public/index.html đã được sửa để gọi:
```js
fetch('/api/auth/register', {method:'POST', body:JSON.stringify(...)})
```
Thay vì localStorage.
