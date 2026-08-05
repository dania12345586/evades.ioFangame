// js/supabaseClient.js

const SUPABASE_URL = 'https://oirvrzqlyxgzurpxgjap.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcnZyenFseXhnenVycHhnamFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTYxNjgsImV4cCI6MjEwMTQ5MjE2OH0.pTLzwDudGv4syhNiUIL8LXzvEl43AE-3mmtXJABYAbM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- РЕГИСТРАЦИЯ ----
async function registerUser(username, password) {
  console.log('registerUser called with:', username, password);
  const { data, error } = await supabaseClient
    .from('users')
    .insert({ username, password })
    .select()
    .single();
  if (error) {
    console.error('Register error:', error);
    return { error };
  }
  console.log('Register success:', data);
  return { data };
}

// ---- ВХОД ----
async function loginUser(username, password) {
  console.log('loginUser called with:', username, password);
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .maybeSingle();

  if (error) {
    console.error('Login error:', error);
    return { error };
  }
  console.log('Login result:', data);
  return { data };
}

// ---- ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ ПО ID ----
async function getUserById(userId) {
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') console.error('Error fetching user:', error);
  return data;
}

// ---- ОБНОВЛЕНИЕ ГЕРОЯ ----
async function updateUserHero(userId, heroName) {
  const { data, error } = await supabaseClient
    .from('users')
    .update({ hero: heroName })
    .eq('id', userId)
    .select()
    .single();
  if (error) console.error('Error updating user hero:', error);
  return data;
}

// ---- КОМНАТЫ ----
async function joinRoom(playerId, roomId) {
  // Увеличиваем счётчик игроков в комнате
  await supabaseClient.rpc('increment_room_players', { room_id: roomId, delta: 1 });
  const { data, error } = await supabaseClient
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

async function leaveRoom(playerId, roomId) {
  await supabaseClient.rpc('increment_room_players', { room_id: roomId, delta: -1 });
  await supabaseClient
    .from('player_state')
    .delete()
    .eq('player_id', playerId);
}

// ---- СИНХРОНИЗАЦИЯ ----
let lastSyncTime = 0;
const SYNC_INTERVAL = 0.1;

async function syncPosition(playerId, x, y, hp, energy, isAlive) {
  const now = performance.now() / 1000;
  if (now - lastSyncTime < SYNC_INTERVAL) return;
  lastSyncTime = now;

  const { error } = await supabaseClient
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

// ---- ПОДПИСКИ ----
function subscribeToRoom(roomId, myPlayerId, onUpdate) {
  const channel = supabaseClient.channel(`room:${roomId}`);

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

// ---- ЧАТ ----
async function sendMessage(roomId, playerId, text) {
  const { error } = await supabaseClient
    .from('messages')
    .insert({
      room_id: roomId,
      player_id: playerId,
      text: text
    });
  if (error) console.error('Error sending message:', error);
}

function subscribeToChat(roomId, onMessage) {
  const channel = supabaseClient.channel(`chat:${roomId}`);

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

// ---- ГЛОБАЛЬНЫЙ ЭКСПОРТ ----
window.registerUser = registerUser;
window.loginUser = loginUser;
window.getUserById = getUserById;
window.updateUserHero = updateUserHero;
window.joinRoom = joinRoom;
window.leaveRoom = leaveRoom;
window.syncPosition = syncPosition;
window.subscribeToRoom = subscribeToRoom;
window.sendMessage = sendMessage;
window.subscribeToChat = subscribeToChat;