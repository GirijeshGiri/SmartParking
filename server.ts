import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

/**
 * Background worker to release slots when bookings expire
 */
async function checkExpiredBookings() {
  console.log('[Worker] Checking for expired bookings...');
  try {
    const now = new Date();
    const q = query(collection(db, 'bookings'), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    
    let expiredCount = 0;
    for (const bookingDoc of snapshot.docs) {
      const data = bookingDoc.data();
      // Handle both ISO string and Firestore Timestamp for robustness
      const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp);
      
      const startTime = timestamp.getTime();
      const durationMs = data.hours * 60 * 60 * 1000;
      const expiryTime = startTime + durationMs;
      
      if (now.getTime() > expiryTime) {
        // 1. Mark booking as completed
        await updateDoc(doc(db, 'bookings', bookingDoc.id), { 
          status: 'completed',
          updatedAt: now.toISOString()
        });
        
        // 2. Release the slot
        await updateDoc(doc(db, 'slots', data.slotId), { 
          status: 'available',
          finalStatus: 'available',
          lastSensorUpdate: now.toISOString()
        });
        
        console.log(`[Worker] Expired booking ${bookingDoc.id} for slot ${data.slotId}`);
        expiredCount++;
      }
    }
    if (expiredCount > 0) console.log(`[Worker] Successfully expired ${expiredCount} bookings.`);
  } catch (error) {
    console.error('[Worker] Error checking expired bookings:', error);
  }
}

// Run every 60 seconds
setInterval(checkExpiredBookings, 60000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes (Optional: manually trigger cleanup)
  app.post('/api/maintenance/cleanup', async (req, res) => {
    await checkExpiredBookings();
    res.json({ status: 'success', message: 'Cleanup triggered' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
