import {io} from 'socket.io-client';

// get room code from command line arguments
const roomCode = process.argv[2];

if (!roomCode) {
  console.log(
      '❌ forgot to provide room code! Ví dụ: node test-bots.js ABCDEF');
  process.exit(1);
}

console.log(`🤖 Đang thả 3 con bot vào phòng ${roomCode}...`);

// make 3 bots join the room and ready up
for (let i = 1; i <= 3; i++) {
  const socket =
      io('http://localhost:3001');  // change this to your server URL if needed

  socket.on('connect', () => {
    // bot join the room with a unique name
    socket.emit(
        'room:join', {roomCode: roomCode, playerName: `Bot Đẹp Trai ${i}`});

    // wait for 1 second before sending ready signal to simulate human behavior
    setTimeout(() => {
      socket.emit('room:ready', {ready: true});
      console.log(`✅ Bot ${i} đã tham gia và sẵn sàng!`);
    }, 1000);
  });
}