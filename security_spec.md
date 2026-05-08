# Security Specification for SmartParkAI

## Data Invariants
1. **Slots**: Must have a valid floor (1-3) and status (available/booked/occupied/reserved).
2. **Bookings**: Every booking must be attached to an authenticated user (`userId`).
3. **Immutability**: Once a booking is created, the `userId` and `slotId` cannot be changed.
4. **Temporal Integrity**: `bookingTime` must be a valid ISO string or server timestamp.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempt to create a booking with someone else's `userId`.
2. **Slot Poisoning**: Attempt to set a slot status to a non-enum value.
3. **Shadow Update**: Attempt to add sensitive fields like `isVerifed: true` to a user profile.
4. **System Field Injection**: Attempt to manually override `gateVerified` as a user.
5. **Path Poisoning**: Inject 2KB junk strings into slot document IDs.
6. **Relational Bypass**: Book a slot that doesn't exist.
7. **Size Attack**: Post a comment/metadata string exceeding 1MB.
8. **Auth Leak**: Read another user's booking details.
9. **State Shortcut**: Move a slot from 'available' directly to 'occupied' skipping 'reserved/booked'.
10. **QR Hijack**: Modify the `qrCode` field on an existing booking.
11. **Floor Injection**: Set a slot floor to 999.
12. **Anonymous Write**: Attempt to book as an unauthenticated guest.

## Test Runner (Logic Definitions)
The rules will be verified using these logical boundaries.
