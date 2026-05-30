import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
getAuth,
setPersistence,
browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
initializeFirestore,
persistentLocalCache,
persistentMultipleTabManager
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const firebaseConfig = {

  apiKey: "AIzaSyAVmx3h0aMvivJ3jAVSkyndK8buCnrRbEA",
  authDomain: "rotaleitura.firebaseapp.com",
  projectId: "rotaleitura",
  storageBucket: "rotaleitura.firebasestorage.app",
  messagingSenderId: "1084691059100",
  appId: "1:1084691059100:web:2ce8c10354da0cc191f859"

};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

await setPersistence(
auth,
browserLocalPersistence
);

export const db = initializeFirestore(app,{
localCache: persistentLocalCache({
tabManager: persistentMultipleTabManager()
})
});
