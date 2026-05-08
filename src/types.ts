/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParkingSlot {
  id: string;
  label: string;
  status: 'available' | 'occupied' | 'reserved';
  type: 'standard' | 'ev' | 'disabled';
  pricePerHour: number;
  floor: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  ultrasonicStatus?: boolean;
  cameraStatus?: boolean;
  lastSensorUpdate?: string;
}

export interface Booking {
  id: string;
  slotId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  qrCode: string;
  status: 'active' | 'completed' | 'cancelled';
}
