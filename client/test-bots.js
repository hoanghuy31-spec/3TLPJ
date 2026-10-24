import { io } from 'socket.io-client';

// Lấy tham số từ dòng lệnh
const roomCode = (process.argv[2] || '').trim().toUpperCase();
const botCount = Math.min(Math.max(parseInt(process.argv[3] || '3', 10) || 3, 1), 3);
const serverUrl = process.env.VITE_SERVER_URL || 'http://localhost:3001';

if (!roomCode) {
  console.log('❌ Vui lòng cung cấp mã phòng!');
  console.log('👉 Cách dùng: node client/test-bots.js <MÃ_PHÒNG> [số_bot: 1-3]');
  console.log('👉 Ví dụ:    node client/test-bots.js ABC123 2');
  process.exit(1);
}

console.log(`=======================================================`);
console.log(`🤖 Đang khởi tạo ${botCount} Bot AI Thông Minh cho phòng [${roomCode}]...`);
console.log(`🌐 Server: ${serverUrl}`);
console.log(`=======================================================`);

const BOT_PROFILES = [
  { name: 'Bot Doraemon 🤖', avatar: '🤖', cardSkin: 'cyber', delay: 1100, motto: 'Tớ có bảo bối đổi màu đây!' },
  { name: 'Bot Nobita 👓', avatar: '🧑', cardSkin: 'classic', delay: 1500, motto: 'Đừng đánh Draw 4 vào tớ nhé...' },
  { name: 'Bot Xuka 🎀', avatar: '👧', cardSkin: 'galaxy', delay: 1200, motto: 'Mọi người chơi vui vẻ nha!' },
  { name: 'Bot Chaien 🎤', avatar: '🦁', cardSkin: 'luxury', delay: 1700, motto: 'Đỡ lấy lá Draw 2 của đại ca!' },
  { name: 'Bot Xeko 🦊', avatar: '🦊', cardSkin: 'obsidian', delay: 1300, motto: 'Xem lá Skip của ta đây!' },
];

class UnoBot {
  constructor(profile, roomCode) {
    this.name = profile.name;
    this.avatar = profile.avatar;
    this.cardSkin = profile.cardSkin;
    this.delay = profile.delay;
    this.motto = profile.motto;
    this.roomCode = roomCode;
    this.socket = null;
    this.myPlayerId = null;
    this.isThinking = false;
  }

  start() {
    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log(`[${this.name}] Đã kết nối Socket! Đang xin vào phòng ${this.roomCode}...`);
      this.socket.emit('room:join', {
        roomCode: this.roomCode,
        playerName: this.name,
        avatar: this.avatar,
        cardSkin: this.cardSkin,
      });
    });

    this.socket.on('room:joined', ({ room, playerId }) => {
      this.myPlayerId = playerId;
      console.log(`[${this.name}] ✅ Đã vào phòng ${room.id} (PlayerID: ${playerId.substring(0, 6)}) - Khẩu hiệu: "${this.motto}"`);

      // Giả lập người thật: chờ 0.8s rồi bấm Sẵn sàng (Ready)
      setTimeout(() => {
        this.socket.emit('room:ready', { ready: true });
        console.log(`[${this.name}] ✨ Đã bấm SẴN SÀNG (READY)!`);
      }, 700 + Math.random() * 500);
    });

    this.socket.on('room:error', ({ message }) => {
      console.error(`[${this.name}] ❌ Lỗi phòng: ${message}`);
    });

    this.socket.on('game:error', ({ message }) => {
      console.warn(`[${this.name}] ⚠️ Thông báo game: ${message}`);
    });

    this.socket.on('game:started', ({ gameState }) => {
      console.log(`[${this.name}] 🎮 Ván bài đã bắt đầu! Đang xem xét lượt chơi...`);
      this.checkTurn(gameState);
    });

    this.socket.on('game:state-update', ({ gameState }) => {
      this.checkTurn(gameState);
    });

    this.socket.on('turn:changed', ({ currentPlayerIndex, playerId }) => {
      if (playerId === this.myPlayerId) {
        console.log(`[${this.name}] 🔔 ĐẾN LƯỢT CỦA BẠN (Vị trí: ${currentPlayerIndex})!`);
      }
    });

    this.socket.on('card:played', ({ playerId, card }) => {
      if (playerId !== this.myPlayerId) {
        console.log(`[${this.name}] 👁️ Đối thủ vừa đánh: [${card.color.toUpperCase()} ${card.value}]`);
      }
    });

    this.socket.on('player:uno-called', ({ playerId }) => {
      const who = playerId === this.myPlayerId ? this.name : 'Đối thủ';
      console.log(`📢 ${who} vừa HÔ UNO! 🔥`);
    });

    this.socket.on('game:ended', ({ winner }) => {
      console.log(`=======================================================`);
      if (winner.id === this.myPlayerId) {
        console.log(`🎉 [${this.name}]: HAHA TÔI ĐÃ THẮNG VÁN NÀY! 🏆 "${this.motto}"`);
      } else {
        console.log(`👏 [${this.name}]: Chúc mừng [${winner.name}] đã chiến thắng!`);
      }
      console.log(`=======================================================`);
    });

    this.socket.on('disconnect', () => {
      console.log(`[${this.name}] Đã ngắt kết nối.`);
    });
  }

  checkTurn(gameState) {
    if (!gameState || gameState.status !== 'active') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== this.myPlayerId) return;

    if (this.isThinking) return;
    this.isThinking = true;

    // Giả lập thời gian suy nghĩ của người thật
    const thinkTime = this.delay + Math.floor(Math.random() * 500);
    setTimeout(() => {
      try {
        this.executeMove(gameState);
      } finally {
        this.isThinking = false;
      }
    }, thinkTime);
  }

  executeMove(gameState) {
    const myPlayer = gameState.players.find((p) => p.id === this.myPlayerId);
    if (!myPlayer) return;

    const myCards = myPlayer.cards || [];
    const topCard =
      gameState.discardPile[gameState.discardPile.length - 1] || gameState.lastPlayedCard;
    const currentColor = gameState.currentColor;

    // 1. Tự động hô UNO khi còn 1 hoặc 2 lá
    if (myCards.length <= 2 && !myPlayer.unoCalled) {
      this.socket.emit('uno:call');
      console.log(`[${this.name}] 🚨 ĐÃ HÔ UNO! (Còn ${myCards.length} lá)`);
    }

    // 2. Tìm tất cả các lá bài hợp lệ
    const playableCards = myCards.filter((card) => {
      if (card.color === 'black') return true; // Wild hoặc Wild Draw 4
      if (card.color === currentColor) return true; // Trùng màu
      if (topCard && card.value === topCard.value) return true; // Trùng số/giá trị
      return false;
    });

    // 3. Nếu có bài đánh được
    if (playableCards.length > 0) {
      // Chiến thuật: ưu tiên lá thường/chức năng trước, lá Wild để dành sau
      let cardToPlay = playableCards.find((c) => c.color !== 'black');
      if (!cardToPlay) {
        cardToPlay = playableCards[0];
      }

      let chosenColor = undefined;
      if (cardToPlay.color === 'black') {
        // Đếm xem bot có nhiều màu nào nhất trên tay để chọn màu đó
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
        for (const c of myCards) {
          if (colorCounts[c.color] !== undefined) {
            colorCounts[c.color]++;
          }
        }
        let bestColor = 'red';
        let maxCount = -1;
        for (const [col, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count;
            bestColor = col;
          }
        }
        chosenColor = bestColor;
      }

      const colorDesc = chosenColor ? ` (Đổi sang màu: ${chosenColor.toUpperCase()})` : '';
      console.log(
        `[${this.name}] 🃏 ĐÁNH LÁ: [${cardToPlay.color.toUpperCase()} ${cardToPlay.value}]${colorDesc} (Còn ${
          myCards.length - 1
        } lá)`
      );

      this.socket.emit('card:play', {
        cardId: cardToPlay.id,
        chosenColor,
      });
    } else {
      // 4. Không có bài đánh -> Rút 1 lá
      console.log(
        `[${this.name}] 📥 Không có bài hợp lệ (Màu đang chơi: ${currentColor}), đang rút bài... (Hiện có ${myCards.length} lá)`
      );
      this.socket.emit('card:draw');
    }
  }
}

// Khởi chạy các bot với khoảng cách 500ms
for (let i = 0; i < botCount; i++) {
  const profile = BOT_PROFILES[i % BOT_PROFILES.length];
  setTimeout(() => {
    const bot = new UnoBot(profile, roomCode);
    bot.start();
  }, i * 600);
}
