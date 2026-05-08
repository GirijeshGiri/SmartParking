import { ParkingSlot } from './types';

export const INITIAL_SLOTS: ParkingSlot[] = [
  { id: 'A1', label: 'A-01', status: 'available', type: 'standard', pricePerHour: 40, floor: 1 },
  { id: 'A2', label: 'A-02', status: 'occupied', type: 'standard', pricePerHour: 40, floor: 1 },
  { id: 'A3', label: 'A-03', status: 'available', type: 'standard', pricePerHour: 40, floor: 1 },
  { id: 'A4', label: 'A-04', status: 'available', type: 'ev', pricePerHour: 60, floor: 1 },
  { id: 'B1', label: 'B-01', status: 'available', type: 'disabled', pricePerHour: 30, floor: 1 },
  { id: 'B2', label: 'B-02', status: 'reserved', type: 'standard', pricePerHour: 40, floor: 1 },
  { id: 'B3', label: 'B-03', status: 'available', type: 'standard', pricePerHour: 40, floor: 1 },
  { id: 'B4', label: 'B-04', status: 'occupied', type: 'ev', pricePerHour: 60, floor: 1 },
  { id: 'C1', label: 'C-01', status: 'available', type: 'standard', pricePerHour: 40, floor: 1 },
  { id: 'C2', label: 'C-02', status: 'available', type: 'standard', pricePerHour: 40, floor: 1 },
  { id: 'C3', label: 'C-03', status: 'occupied', type: 'standard', pricePerHour: 40, floor: 1 },
  { id: 'C4', label: 'C-04', status: 'available', type: 'standard', pricePerHour: 40, floor: 1 },
];
