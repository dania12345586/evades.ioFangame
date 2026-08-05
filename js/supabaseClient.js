// js/supabaseClient.js

// === НАСТРОЙКА ПОДКЛЮЧЕНИЯ ===
const SUPABASE_URL = 'https://oirvrzqlyxgzurpxgjap.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcnZyenFseXhnenVycHhnamFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTYxNjgsImV4cCI6MjEwMTQ5MjE2OH0.pTLzwDudGv4syhNiUIL8LXzvEl43AE-3mmtXJABYAbM';

// Инициализация клиента
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === ФУНКЦИИ ДЛЯ МУЛЬТИПЛЕЕРА ===

// 1. Создать игрока
async function createPlayer(name, heroClass) {
  const { data, error } = await supabase
    .from('players')
    .insert({ name: name, hero: heroClass })
    .select()
    .single();
  if (error) console.error('Error creating player:', error);
  return data;
}

// 2. Создать комнату
async function createRoom(roomName) {
  const { data, error } = await supabase
    .from('rooms')
    .insert({ name: roomName, max_players: 10 })
    .select()
    .single();
  if (error) console.error('Error creating room:', error);
  return data;
}

// 3. Войти в комнату
async function joinRoom(playerId, roomId) {
  const { data, error } = await supabase
    .from('player_state')
    .insert({
      player_id: playerId,
      room_id: roomId,
      x: 105,
      y: 400,
      hp: 100,
      energy: 30,
      is_alive: true
    });
  if (error) console.error('Error joining room:', error);
  return data;
}

// 4. Синхронизация позиции (не чаще 10 раз/сек)
let lastSyncTime = 0;
const SYNC_INTERVAL = 0.1;

async function syncPosition(playerId, x, y, hp, energy, isAlive) {
  const now = performance.now() / 1000;
  if (now - lastSyncTime < SYNC_INTERVAL) return;
  lastSyncTime = now;

  const { error } = await supabase
    .from('player_state')
    .update({
      x: x,
      y: y,
      hp: hp || 100,
      energy: energy || 30,
      is_alive: isAlive !== undefined ? isAlive : true,
      updated_at: new Date()
    })
    .eq('player_id', playerId);
  if (error) console.error('Error syncing position:', error);
}

// 5. Подписка на других игроков в комнате
function subscribeToRoom(roomId, myPlayerId, onUpdate) {
  const channel = supabase.channel(`room:${roomId}`);

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'player_state',
      filter: `room_id=eq.${roomId} AND player_id=neq.${myPlayerId}`
    },
    (payload) => {
      const { player_id, x, y, hp, is_alive } = payload.new;
      onUpdate(player_id, x, y, hp, is_alive);
    }
  ).subscribe();

  return channel;
}

// 6. Отправить сообщение в чат
async function sendMessage(roomId, playerId, text) {
  const { error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      player_id: playerId,
      text: text
    });
  if (error) console.error('Error sending message:', error);
}

// 7. Подписка на сообщения чата
function subscribeToChat(roomId, onMessage) {
  const channel = supabase.channel(`chat:${roomId}`);

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`
    },
    (payload) => {
      onMessage(payload.new.player_id, payload.new.text);
    }
  ).subscribe();

  return channel;
}

// Экспортируем функции, если используешь модули (пока не нужно)
// window.createPlayer = createPlayer;
// window.joinRoom = joinRoom;
// window.syncPosition = syncPosition;
// window.subscribeToRoom = subscribeToRoom;
// window.sendMessage = sendMessage;
// window.subscribeToChat = subscribeToChat;