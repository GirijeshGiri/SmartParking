
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    console.log('Testing Firestore connection to project:', firebaseConfig.projectId);
    const q = query(collection(db, 'slots'), limit(1));
    const snapshot = await getDocs(q);
    console.log('Success! Found', snapshot.size, 'slots');
    process.exit(0);
  } catch (error) {
    console.error('Firestore Test Failed:');
    console.error(error);
    process.exit(1);
  }
}

test();
