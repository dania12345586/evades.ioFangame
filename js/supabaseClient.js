// js/supabaseClient.js

const SUPABASE_URL = 'https://oirvrzqlyxgzurpxgjap.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcnZyenFseXhnenVycHhnamFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTYxNjgsImV4cCI6MjEwMTQ5MjE2OH0.pTLzwDudGv4syhNiUIL8LXzvEl43AE-3mmtXJABYAbM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- АУТЕНТИФИКАЦИЯ ----

async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) console.error('SignUp error:', error);
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) console.error('SignIn error:', error);
  return data;
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) console.error('SignOut error:', error);
}

async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

async function getSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session;
}

// ---- РАБОТА С ИГРОКАМИ ----

async function createPlayer(name, heroClass, userId = null) {
  const insertData = { name, hero: heroClass };
  if (userId) {
    // Если передан userId, используем его как id (для авторизованных)
    insertData.id = userId;
  }
  const { data, error } = await supabaseClient
    .from('players')
    .insert(insertData)
    .select()
    .single();
  if (error) console.error('Error creating player:', error);
  return data;
}

async function getPlayerByUserId(userId) {
  const { data, error } = await supabaseClient
    .from('players')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') console.error('Error fetching player:', error);
  return data;
}

// ---- КОМНАТЫ ----

async function joinRoom(playerId, roomId) {
  // 1. Увеличиваем счётчик игроков в комнате
  await supabaseClient.rpc('increment_room_players', { room_id: roomId, delta: 1 });

  // 2. Вставляем состояние игрока
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
  // Уменьшаем счётчик игроков
  await supabaseClient.rpc('increment_room_players', { room_id: roomId, delta: -1 });
  // Удаляем состояние игрока
  await supabaseClient
    .from('player_state')
    .delete()
    .eq('player_id', playerId);
}

// ---- СИНХРОНИЗАЦИЯ ПОЗИЦИЙ ----

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

// ---- ЧАТ (пока не используется, но можно добавить) ----

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

// ---- ДЕЛАЕМ ФУНКЦИИ ДОСТУПНЫМИ ГЛОБАЛЬНО ----
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;
window.getSession = getSession;
window.createPlayer = createPlayer;
window.getPlayerByUserId = getPlayerByUserId;
window.joinRoom = joinRoom;
window.leaveRoom = leaveRoom;
window.syncPosition = syncPosition;
window.subscribeToRoom = subscribeToRoom;
window.sendMessage = sendMessage;
window.subscribeToChat = subscribeToChat;