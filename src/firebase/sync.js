// ============================================================================
//  SINCRONIZAÇÃO EM NUVEM  —  Família+  (Firestore)
// ----------------------------------------------------------------------------
//  Modelo: cada "família" é um documento em  families/{codigo}.
//  Os 6 blocos de dados do app viram campos desse documento. Quem tiver o
//  mesmo código compartilha tudo em tempo real, nos dois sentidos.
//
//  Sem login: o "código da família" é a senha. Use um código que só vocês
//  conheçam — quem tiver o código tem acesso aos dados daquela família.
// ============================================================================

import {
  doc, getDoc, setDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { getDb, firebaseEnabled } from './config';

// Campos sincronizados (espelham as seções do DataContext).
export const SYNC_SECTIONS = [
  'finances', 'children', 'shopping', 'calendar', 'family', 'settings', 'defaultMarket',
];

const COLLECTION = 'families';

// Gera um código curto e legível (sem caracteres ambíguos: 0/O, 1/I).
export function generateFamilyCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function normalizeCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

// Firestore rejeita `undefined`; o round-trip JSON limpa e garante objeto puro.
function sanitize(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function docRef(code) {
  const db = getDb();
  return doc(db, COLLECTION, normalizeCode(code));
}

// Monta o objeto completo a partir do estado atual do app.
function buildPayload(allData) {
  const payload = { updatedAt: serverTimestamp() };
  for (const section of SYNC_SECTIONS) {
    payload[section] = sanitize(allData[section]);
  }
  return payload;
}

// Cria uma nova família com os dados atuais do aparelho. Tenta até achar
// um código livre. Retorna o código criado.
export async function createFamily(allData) {
  if (!firebaseEnabled) throw new Error('Firebase não configurado.');
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateFamilyCode();
    const ref = docRef(code);
    const snap = await getDoc(ref);
    if (snap.exists()) continue; // colisão rara — tenta outro
    await setDoc(ref, buildPayload(allData));
    return code;
  }
  throw new Error('Não foi possível gerar um código. Tente novamente.');
}

// Entra numa família existente. Retorna os dados remotos (para adotar no app).
export async function joinFamily(code) {
  if (!firebaseEnabled) throw new Error('Firebase não configurado.');
  const ref = docRef(code);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('Código não encontrado. Confira as letras.');
  }
  return snap.data();
}

// Envia UMA seção alterada para a nuvem (merge: não apaga as outras).
export async function pushSection(code, section, data) {
  if (!firebaseEnabled || !code) return;
  if (!SYNC_SECTIONS.includes(section)) return;
  const ref = docRef(code);
  await setDoc(
    ref,
    { [section]: sanitize(data), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// Escuta mudanças em tempo real. onRemote(data) é chamado quando OUTRO
// aparelho altera algo (ignora os ecos das próprias escritas locais).
// Retorna a função de cancelar a escuta.
export function subscribeFamily(code, { onRemote, onError } = {}) {
  if (!firebaseEnabled || !code) return () => {};
  const ref = docRef(code);
  return onSnapshot(
    ref,
    (snap) => {
      // hasPendingWrites = escrita local ainda não confirmada → é eco, ignora.
      if (snap.metadata.hasPendingWrites) return;
      if (!snap.exists()) return;
      onRemote && onRemote(snap.data());
    },
    (err) => { onError && onError(err); },
  );
}
