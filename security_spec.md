# Security Specification: Sistema de Reservas TBS

## 1. Data Invariants

1. **Agenda Readability**: Any visitor can read `/reservations` and `/slot_locks` so the public schedule can be viewed without login.
2. **PII Protection**: Public reservation documents must NEVER contain email or phone numbers.
3. **Contact Card Isolation**: `/user_contacts/{userId}` can ONLY be read by authenticated users (`request.auth != null`), never unauthenticated visitors.
4. **User Profile Ownership**: `/users/{userId}` can ONLY be read or written by the authenticated user whose UID matches `{userId}`, or by an administrator.
5. **Reservation Ownership**: A standard user can only create a reservation where `incoming().userId == request.auth.uid`. A standard user can only cancel or update their own reservation.
6. **Administrator Privilege**: Administrators (bootstrapped emails `marcio.magalhaes.432@gmail.com` and `marxiosmagal@gmail.com`, or in `/admins/{adminId}`) can update or cancel any reservation, manage `/system_settings/config`, and register new admins.
7. **Slot Integrity**: Slot locks are updated atomically during reservation booking or cancellation.
8. **Immutable Fields**: `id`, `userId`, `createdAt` cannot be altered once created.
9. **Status Transition Integrity**: Reservations can only be set to `pendente`, `confirmada`, or `cancelada`. Non-admins cannot force approval if approval is required.
10. **Bounded Input**: String length constraints (names <= 100, purpose <= 500, phone <= 20) are strictly enforced.

## 2. The Dirty Dozen Payloads

1. **DD-1 (Spoofed Creator UID)**: Non-admin user `user_attacker` tries to create a reservation with `userId: "victim_uid"`. Expect: PERMISSION_DENIED.
2. **DD-2 (Unauthenticated Public Contact Read)**: Unauthenticated visitor attempts to read `/user_contacts/{userId}` to harvest WhatsApp numbers. Expect: PERMISSION_DENIED.
3. **DD-3 (Unauthenticated Reservation Write)**: Unauthenticated visitor attempts to create a reservation document directly. Expect: PERMISSION_DENIED.
4. **DD-4 (PII Leak in User Profile)**: User `attacker` tries to read `/users/victim_uid`. Expect: PERMISSION_DENIED.
5. **DD-5 (Ghost Fields Injection)**: Payload includes unauthorized fields like `isAdmin: true` or `shadowField: "xyz"` in reservation. Expect: PERMISSION_DENIED.
6. **DD-6 (Tampering Other's Reservation)**: User `attacker` attempts to cancel or modify a reservation owned by `victim_uid`. Expect: PERMISSION_DENIED.
7. **DD-7 (Non-Admin Modifying Settings)**: Standard authenticated user attempts to update `/system_settings/config` to change access password. Expect: PERMISSION_DENIED.
8. **DD-8 (Non-Admin Adding Admin Document)**: Standard authenticated user attempts to write to `/admins/{newAdminId}`. Expect: PERMISSION_DENIED.
9. **DD-9 (Invalid Resource Enum)**: Reservation created with `resource: "unauthorized_server_room"`. Expect: PERMISSION_DENIED.
10. **DD-10 (Oversized Payload / Denial-of-Wallet)**: Reservation created with `purpose` string exceeding 500 characters or junk strings. Expect: PERMISSION_DENIED.
11. **DD-11 (Immutable Field Mutation)**: User attempts to update `userId` or `createdAt` on an existing reservation. Expect: PERMISSION_DENIED.
12. **DD-12 (Malicious Slot Lock Hijack)**: Unauthenticated or non-matching user attempts to directly overwrite `/slot_locks/{id}`. Expect: PERMISSION_DENIED.
