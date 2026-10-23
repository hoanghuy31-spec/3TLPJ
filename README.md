# 🃏 3TLPJ - UNO

Game bài trực tuyến theo thời gian thực, giống UNO. Nhiều người chơi cùng tham gia qua mạng.

**Ghi chú quan trọng**: Dự án đang trong giai đoạn M0. Hiện tại đã có: tạo phòng, vào phòng, danh sách người chơi, chia bài. Các tính năng chơi bài thực tế (đánh bài, luân chuyển lượt, tính điểm) đang được phát triển ở M1 và M2.

## 1. Yêu Cầu Hệ Thống

Trước khi bắt đầu, máy bạn cần:

- **Node.js** phiên bản 18 trở lên
  - Kiểm tra: Mở PowerShell → gõ `node -v`
  - Nếu chưa có: https://nodejs.org → tải bản LTS
- **npm** phiên bản 9 trở lên (đi kèm Node.js)
  - Kiểm tra: `npm -v`
- **Git** (để làm việc nhóm)
  - Kiểm tra: `git -v`
  - Tải: https://git-scm.com

## 2. Khởi Động Nhanh (Windows PowerShell)

### Bước 1: Tải code về máy

```powershell
git clone https://github.com/hoanghuy31-spec/3TLPJ
```

### Bước 2: Cài đặt thư viện

```powershell
# Xóa node_modules cũ nếu có (để đảm bảo sạch)
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }

# Cài thư viện mới
npm install
```

Đợi khoảng 1-2 phút. Màn hình hiện "added X packages" là xong.

### Bước 3: Tạo file cấu hình

```powershell
# Tạo file .env từ .env.example
cp .env.example .env

# Kiểm tra file đã tạo
Get-Content .env
```

### Bước 4: Chạy chương trình

```powershell
npm run dev
```

Chờ khoảng 10 giây. Thấy dòng "SERVER" và "CLIENT" là thành công.

### Bước 5: Mở trình duyệt chơi thử

1. Mở trình duyệt (Chrome, Edge, Firefox)
2. Gõ địa chỉ: http://localhost:5173
3. Thấy trang "Card Game" → **Client đang chạy tốt!**
4. Mở thêm một tab nữa, gõ cùng địa chỉ
5. Tab 1: Click "Create Room" → nhập tên → click "Create"
6. Tab 2: Click "Join Room" → nhập cùng tên → nhập mã phòng → click "Join"
7. Cả 2 tab đều thấy danh sách người chơi → **Kết nối thành công!**

## 3. Cấu Trúc Thư Mục

```
2TLPJ/
├── client/                 # Giao diện web (React)
│   └── src/
│       ├── App.tsx        # Trang chính (Home ↔ Lobby)
│       ├── components/
│       │   ├── Home.tsx   # Trang chọn tạo/vào phòng
│       │   └── Lobby.tsx  # Phòng chờ, danh sách người chơi
│       └── socket.ts      # Kết nối Socket.IO với server
│
├── server/                 # Máy chủ game (Node.js + Express)
│   └── src/
│       ├── index.ts       # Khởi tạo server, xử lý Socket.IO
│       └── game/          # Logic game (bài, chia bài, luật chơi)
│           ├── deck.ts    # Tạo bộ bài 108 lá
│           ├── shuffle.ts # Xáo bài
│           ├── deal.ts    # Chia bài
│           └── rules.ts   # Luật chơi (đang phát triển)
│
├── shared/                 # Code dùng chung cho cả client và server
│   └── src/
│       ├── types.ts       # Kiểu dữ liệu (Card, Player, Room, ...)
│       └── constants.ts   # Hằng số (màu bài, sự kiện Socket.IO, ...)
│
├── docs/                   # Tài liệu dự án
│   ├── ARCHITECTURE.md    # Sơ đồ kiến trúc hệ thống
│   ├── CODE_MAP.md        # Luồng code chi tiết
│   ├── GAME_RULES.md      # Luật chơi (tham khảo)
│   └── TEST_PLAN.md       # Kế hoạch viết test
│
├── package.json           # Danh sách lệnh npm (dev, build, test, ...)
├── .env.example           # Mẫu cấu hình môi trường
├── ROADMAP.md             # Kế hoạch phát triển (M0 → M3)
└── CONTRIBUTING.md        # Hướng dẫn đóng góp code
```

**Cổng kết nối (Ports)**:
- **Server**: Chạy ở `http://localhost:3001`
- **Client**: Chạy ở `http://localhost:5173`

## 4. Các Lệnh Thường Dùng

Chạy tất cả trong thư mục gốc `2TLPJ/`:

| Lệnh | Chức năng |
|------|-----------|
| `npm run dev` | Chạy cả server và client (dùng để phát triển) |
| `npm run build` | Build tất cả gói (shared → server → client) |
| `npm test` | Chạy tất cả các bài test (46 tests hiện tại) |
| `npm run lint` | Kiểm tra lỗi code style |
| `npm run clean` | Xóa thư mục node_modules và dist |

**Các lệnh riêng cho từng phần** (ít dùng):

| Lệnh | Chức năng |
|------|-----------|
| `npm run dev --workspace=server` | Chỉ chạy server |
| `npm run dev --workspace=client` | Chỉ chạy client |
| `npm test --workspace=server` | Chỉ test phần server (46 tests) |
| `npm run build --workspace=shared` | Chỉ build phần shared |

## 5. Làm Việc Nhóm Với Git

### Khi bắt đầu ngày làm việc

```powershell
git checkout main
git pull origin main
npm install
```

### Khi nhận việc mới

```powershell
# Tạo branch mới cho công việc của bạn
git checkout -b feature/ten-chuc-nang
# hoặc
git checkout -b fix/ten-loi
```

### Khi xong một phần nhỏ

```powershell
# Xem thay đổi
git status
git diff

# Thêm file đã sửa
git add .
git commit -m "mô tả ngắn gọn việc đã làm"

# Đẩy lên GitHub
git push origin feature/ten-chuc-nang
```

### Khi muốn cập nhật code mới nhất

```powershell
git fetch origin
git rebase origin/main
```

## 6. Luồng Hoạt Động Của Code

```
┌─────────────────────────────────────────────────────────────────┐
│                         TRÌNH DUYỆT                             │
│                                                                 │
│   ┌─────────────┐      ┌─────────────┐                         │
│   │  Home.tsx   │──────│  Lobby.tsx  │                         │
│   │ (Trang đầu) │      │ (Phòng chờ) │                         │
│   └──────┬──────┘      └──────┬──────┘                         │
│          │                    │                                 │
│          └────────┬───────────┘                                 │
│                   ▼                                            │
│          ┌───────────────┐                                     │
│          │   App.tsx     │                                     │
│          │ (Quản lý kết  │                                     │
│          │  nối Socket)  │                                     │
│          └───────┬───────┘                                     │
│                  │ emit / on                                   │
│                  ▼                                             │
│          ┌───────────────┐                                     │
│          │  socket.ts    │ (Kết nối WebSocket)                  │
│          └───────┬───────┘                                     │
└──────────────────┼─────────────────────────────────────────────┘
                   │
                   │ http://localhost:3001
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER                                  │
│                                                                 │
│          ┌───────────────┐                                     │
│          │  index.ts    │ (Nhận sự kiện, xử lý)                │
│          └───────┬───────┘                                     │
│                  │                                             │
│          ┌──────▼──────┐                                       │
│          │   room.ts   │ (Tạo phòng, thêm người chơi)          │
│          └─────────────┘                                       │
│                                                                 │
│          ┌─────────────┐                                       │
│          │  game/      │ (Logic game)                          │
│          │  - deck.ts  │   Tạo bộ bài                          │
│          │  - shuffle   │   Xáo bài                             │
│          │  - deal.ts   │   Chia bài                            │
│          │  - rules.ts  │   Luật chơi                           │
│          └─────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

**Luồng cụ thể - Tạo phòng**:

1. User click "Create Room" → nhập tên
2. `App.tsx` gửi sự kiện: `socket.emit('room:create', { playerName })`
3. `server/index.ts` nhận được → tạo mã phòng 6 ký tự → lưu vào Map
4. Server gửi về: `socket.emit('room:created', { room })`
5. `App.tsx` nhận → chuyển sang trang Lobby
6. `Lobby.tsx` hiển thị danh sách người chơi

## 7. Bảng Thuật Ngữ

| Thuật ngữ | Giải thích |
|-----------|------------|
| **Client** | Trình duyệt web của người chơi (Chrome, Edge...) |
| **Server** | Máy tính chạy game, lưu trạng thái phòng, chia bài |
| **Socket.IO** | Thư viện giúp client và server nói chuyện real-time |
| **Workspace** | Cách gọi khác của "package" trong npm workspaces |
| **Room** | Phòng chơi, có mã 6 ký tự để người khác vào |
| **Deck** | Bộ bài đầy đủ 108 lá |
| **Shuffle** | Xáo bài ngẫu nhiên |
| **Deal** | Chia bài cho người chơi |
| **Card** | Một lá bài (id, color, value) |
| **Player** | Người chơi (id, name, isReady) |
| **Host** | Người tạo phòng |
| **Socket ID** | ID tạm thời của trình duyệt khi kết nối |

## 8. Lỗi Thường Gặp Trên Windows

### Lỗi "npm is not recognized"

**Nguyên nhân**: Biến PATH chưa có đường dẫn đến npm.

**Cách sửa**:
1. Tìm thư mục Node.js (thường `C:\Program Files\nodejs\`)
2. Mở Settings → System → About → Advanced system settings → Environment Variables
3. Trong System variables → tìm "Path" → Edit → New
4. Thêm `C:\Program Files\nodejs\`
5. Restart PowerShell

### Lỗi "port 3001 is already in use"

**Nguyên nhân**: Server cũ chưa tắt hoặc chương trình khác đang dùng port.

**Cách sửa**:
```powershell
# Tìm process đang dùng port 3001
netstat -ano | findstr 3001

# Ví dụ thấy PID 12345, gõ
taskkill /PID 12345 /F
```

### Lỗi "Cannot find module" khi chạy npm

**Nguyên nhân**: Thiếu thư viện hoặc chạy sai thư mục.

**Cách sửa**:
```powershell
# Kiểm tra đúng thư mục gốc
pwd
# Phải thấy "...\2TLPJ"

# Xóa node_modules cũ, cài lại
Remove-Item -Recurse -Force node_modules
npm install
```

### Lỗi "React Hooks" khi chạy client

**Nguyên nhân**: Thường do quên chạy `npm install` ở thư mục gốc.

**Cách sửa**:
```powershell
# Quay về thư mục gốc
cd ..
npm install
npm run dev
```

### Lỗi Git "fatal: not a git repository"

**Nguyên nhân**: Đang ở thư mục không phải project.

**Cách sửa**:
```powershell
# Kiểm tra
git status
# Phải thấy "On branch main" hoặc "On branch feature/..."

# Nếu không, vào lại thư mục project
cd đường-dẫn-đến-2TLPJ
```

## 9. Phân Chia Công Việc

### Theo Milestone (ROADMAP.md)

| Giai đoạn | Nội dung | Người phụ trách |
|-----------|----------|-----------------|
| **M0** (xong) | Cấu trúc project, tạo/vào phòng, chia bài | Đã hoàn thành |
| **M1** | Luật chơi (đánh bài, lượt chơi) | Cần làm |
| **M2** | Game hoàn chỉnh (UNO, điểm số) | Cần làm |
| **M3** | Thêm tính năng (chat, avatar, âm thanh) | Tương lai |

### Theo File/Thư Mục

| File/Thư mục | Mô tả | Ai nên đọc |
|--------------|-------|------------|
| `client/src/` | Giao diện React | Ai làm front-end |
| `server/src/` | Logic game, Socket.IO | Ai làm back-end |
| `server/src/game/` | Luật chơi, chia bài | Ai làm game logic |
| `shared/src/` | Kiểu dữ liệu dùng chung | Tất cả mọi người |

### Liên Kết Tài Liệu

| Tài liệu | Nội dung |
|----------|----------|
| [ROADMAP.md](ROADMAP.md) | Kế hoạch phát triển từng giai đoạn |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cách đặt tên branch, viết commit message |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Sơ đồ kiến trúc chi tiết |
| [docs/CODE_MAP.md](docs/CODE_MAP.md) | Luồng code từng bước |
| [docs/GAME_RULES.md](docs/GAME_RULES.md) | Luật chơi (đang phát triển) |
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | Kế hoạch viết test |
| [CHANGELOG.md](CHANGELOG.md) | Lịch sử thay đổi |

## 10. Ghi Chú Kỹ Thuật

### Cấu hình môi trường (.env)

```
# Server (port 3001)
PORT=3001
NODE_ENV=development

# Client (kết nối đến server)
VITE_SERVER_URL=http://localhost:3001
```

### Kiểm tra server có chạy không

```powershell
# Mở trình duyệt, gõ:
http://localhost:3001/health

# Thấy {"status":"ok"} → Server đang chạy!
```

### Chạy test riêng lẻ

```powershell
# Test phần game logic (deck, shuffle, deal)
npm test --workspace=server

# Test tất cả
npm test
```

---

## 🤝 Đội Ngũ

Dự án được phát triển bởi 3 thành viên.

## 📝 Đóng Góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết cách đóng góp code.

## 📄 Giấy Phép

MIT License - xem file [LICENSE](LICENSE).
