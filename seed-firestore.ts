
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const slots = [
  { id: 'A1', label: 'A-01', status: 'available', type: 'standard', pricePerHour: 40, floor: 1, slotNumber: 1, finalStatus: 'available' },
  { id: 'A2', label: 'A-02', status: 'occupied', type: 'standard', pricePerHour: 40, floor: 1, slotNumber: 2, finalStatus: 'occupied' },
  { id: 'A3', label: 'A-03', status: 'available', type: 'standard', pricePerHour: 40, floor: 1, slotNumber: 3, finalStatus: 'available' },
  { id: 'A4', label: 'A-04', status: 'available', type: 'ev', pricePerHour: 60, floor: 1, slotNumber: 4, finalStatus: 'available' },
  { id: 'B1', label: 'B-01', status: 'available', type: 'disabled', pricePerHour: 30, floor: 2, slotNumber: 1, finalStatus: 'available' },
  { id: 'B2', label: 'B-02', status: 'reserved', type: 'standard', pricePerHour: 40, floor: 2, slotNumber: 2, finalStatus: 'reserved' },
  { id: 'B3', label: 'B-03', status: 'available', type: 'standard', pricePerHour: 40, floor: 2, slotNumber: 3, finalStatus: 'available' },
  { id: 'B4', label: 'B-04', status: 'occupied', type: 'ev', pricePerHour: 60, floor: 2, slotNumber: 4, finalStatus: 'occupied' },
  { id: 'C1', label: 'C-01', status: 'available', type: 'standard', pricePerHour: 40, floor: 3, slotNumber: 1, finalStatus: 'available' },
  { id: 'C2', label: 'C-02', status: 'available', type: 'standard', pricePerHour: 40, floor: 3, slotNumber: 2, finalStatus: 'available' },
  { id: 'C3', label: 'C-03', status: 'occupied', type: 'standard', pricePerHour: 40, floor: 3, slotNumber: 3, finalStatus: 'occupied' },
  { id: 'C4', label: 'C-04', status: 'available', type: 'standard', pricePerHour: 40, floor: 3, slotNumber: 4, finalStatus: 'available' },
];

async function seed() {
  console.log('Seeding slots...');
  const batch = writeBatch(db);
  
  for (const slotData of slots) {
    const { id, ...data } = slotData;
    const ref = doc(db, 'slots', id);
    batch.set(ref, {
      ...data,
      ultrasonicStatus: data.status === 'occupied',
      cameraStatus: data.status === 'occupied',
      coordinates: { x: Math.random() * 100, y: Math.random() * 100 }
    });
  }

  // Seed display data
  for (let f = 1; f <= 3; f++) {
    const floorSlots = slots.filter(s => s.floor === f);
    const available = floorSlots.filter(s => s.status === 'available').length;
    batch.set(doc(db, 'display', f.toString()), {
      floor: f,
      totalSlots: floorSlots.length,
      availableSlots: available,
      updatedAt: new Date().toISOString()
    });
  }

  await batch.commit();
  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
