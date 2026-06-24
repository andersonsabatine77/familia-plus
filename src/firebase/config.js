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
  apiKey:            'COLE_AQUI_apiKey',
  authDomain:        'COLE_AQUI_authDomain',
  projectId:         'COLE_AQUI_projectId',
  storageBucket:     'COLE_AQUI_storageBucket',
  messagingSenderId: 'COLE_AQUI_messagingSenderId',
  appId:             'COLE_AQUI_appId',
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
