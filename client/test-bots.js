import { io } from 'socket.io-client';

// Lấy tham số từ dòng lệnh
const roomCode = (process.argv[2] || '').trim().toUpperCase();
const botCount = Math.min(Math.max(parseInt(process.argv[3] || '1', 10) || 1, 1), 9);
const profileOffset = parseInt(process.argv[4] || '0', 10) || 0;
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
  { name: 'Bot Dekisugi 🎓', avatar: '🧑‍🎓', cardSkin: 'emerald', delay: 1000, motto: 'Chiến thuật tính bài của tớ là chuẩn xác.' },
  { name: 'Bot Doremi 🐱', avatar: '🐱', cardSkin: 'ruby', delay: 1250, motto: 'Anh Mon cố lên nhé!' },
  { name: 'Bot Jaiko 🎨', avatar: '👩‍🎨', cardSkin: 'gold', delay: 1400, motto: 'Tác phẩm UNO tuyệt đỉnh!' },
  { name: 'Bot Pikachu ⚡', avatar: '⚡', cardSkin: 'neon', delay: 1150, motto: 'Pika Pika! Đánh bài siêu tốc!' },
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
    this.isCatching = false;
    this.currentGameState = null;
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
      this.currentGameState = gameState;
      this.checkCatchUno(gameState);
      this.checkTurn(gameState);
    });

    this.socket.on('game:state-update', ({ gameState }) => {
      this.currentGameState = gameState;
      this.checkCatchUno(gameState);
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

    this.socket.on('player:uno-called', ({ playerId, playerName }) => {
      const who = playerId === this.myPlayerId ? this.name : (playerName || 'Đối thủ');
      console.log(`📢 [${who}] vừa HÔ UNO! 🔥`);
    });

    this.socket.on('player:uno-caught', ({ catcherName, victimName, penaltyCards }) => {
      console.log(`🚨 [${catcherName}] ĐÃ BẮT BÀI [${victimName}] QUÊN HÔ UNO! Nạn nhân bị phạt rút ${penaltyCards} lá!`);
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

  checkCatchUno(gameState) {
    if (!gameState || gameState.status !== 'active') return;

    // Tìm xem có đối thủ nào có đúng 1 lá bài mà chưa hô UNO không
    const missedOpponent = gameState.players.find(
      (p) => p.id !== this.myPlayerId && p.cards.length === 1 && !p.unoCalled
    );

    if (missedOpponent && !this.isCatching) {
      this.isCatching = true;
      // Thời gian phản xạ của Bot từ 1.2s đến 2.6s để tạo cơ hội cho người thật phản ứng
      const catchDelay = 1200 + Math.random() * 1400;
      setTimeout(() => {
        try {
          if (this.currentGameState) {
            const stillMissed = this.currentGameState.players.find(
              (p) => p.id === missedOpponent.id && p.cards.length === 1 && !p.unoCalled
            );
            if (stillMissed) {
              console.log(
                `[${this.name}] 🚨 PHÁT HIỆN [${missedOpponent.name}] QUÊN HÔ UNO! ĐANG BẮT BÀI!`
              );
              this.socket.emit('uno:catch', { targetPlayerId: missedOpponent.id });
            }
          }
        } finally {
          this.isCatching = false;
        }
      }, catchDelay);
    }
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
      if (this.name.includes('Nobita') && Math.random() < 0.3) {
        // Nobita lóng ngóng quên hô UNO trong 3 giây -> cơ hội cho người chơi bắt bài!
        console.log(`[${this.name}] 😅 Nobita luống cuống quên hô UNO...`);
        setTimeout(() => {
          if (this.currentGameState) {
            const p = this.currentGameState.players.find((pl) => pl.id === this.myPlayerId);
            if (p && !p.unoCalled && p.cards.length <= 2) {
              this.socket.emit('uno:call');
              console.log(`[${this.name}] 🚨 HÚ VÍA! ĐÃ KỊP HÔ UNO!`);
            }
          }
        }, 3000);
      } else {
        this.socket.emit('uno:call');
        console.log(`[${this.name}] 🚨 ĐÃ HÔ UNO! (Còn ${myCards.length} lá)`);
      }
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
  const profile = BOT_PROFILES[(profileOffset + i) % BOT_PROFILES.length];
  setTimeout(() => {
    const bot = new UnoBot(profile, roomCode);
    bot.start();
  }, i * 600);
}
