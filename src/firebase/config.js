// ============================================================================
//  CONFIGURAÇÃO DO FIREBASE  —  Família+
// ----------------------------------------------------------------------------
//  Cole aqui as chaves do SEU projeto Firebase (grátis).
//  Como obter (leva ~5 min):
//    1. Acesse https://console.firebase.google.com  e crie um projeto.
//    2. Menu  Build → Firestore Database → "Criar banco de dados"
//       (escolha "modo de produção" e a região "southamerica-east1").
//    3. No ícone de engrenagem (⚙) → "Configurações do projeto" →
//       role até "Seus apps" → clique no ícone </> (Web) → registre o app.
//    4. O Firebase mostra um objeto "firebaseConfig". Copie os valores
//       e cole abaixo, substituindo os "COLE_AQUI_...".
//    5. Em Firestore → aba "Regras", cole as regras que estão no README.
//
//  Enquanto os campos estiverem com "COLE_AQUI", o app funciona 100% offline
//  normalmente — a sincronização fica simplesmente desativada.
// ============================================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey:            'AIzaSyAzd7nZtU8stgFNtb8pUvcgChFl43J7fgU',
  authDomain:        'familia-plus-3b061.firebaseapp.com',
  projectId:         'familia-plus-3b061',
  storageBucket:     'familia-plus-3b061.firebasestorage.app',
  messagingSenderId: '1023450701057',
  appId:             '1:1023450701057:web:2d6896f7ace6e43ce2cf00',
};

// Sincronização só liga quando as chaves reais foram coladas.
export const firebaseEnabled =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('COLE_AQUI');

let _db = null;

export function getDb() {
  if (!firebaseEnabled) return null;
  if (_db) return _db;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // long polling: necessário p/ Firestore funcionar de forma estável no React Native
  _db = initializeFirestore(app, { experimentalForceLongPolling: true });
  return _db;
}
