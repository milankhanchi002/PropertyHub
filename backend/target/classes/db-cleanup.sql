-- PropertyHub Database Cleanup Script
-- Removes role-based elements no longer needed in simplified user architecture

-- 1. Remove role column from users table (since we now have single user type)
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- 2. The following tables are still needed and should be kept:
--    - users (user accounts)
--    - properties (property listings) 
--    - visits (scheduled visits)
--    - leases (lease agreements)
--    - property_images (uploaded images)
--    - visit_messages (visit chat messages)
--    - lease_messages (lease chat messages)

-- 3. No tables need to be dropped as all are still useful

-- 4. Clean up any orphaned data (optional but recommended)
DELETE FROM property_images WHERE property_id NOT IN (SELECT id FROM properties);
DELETE FROM visit_messages WHERE visit_id NOT IN (SELECT id FROM visits);
DELETE FROM lease_messages WHERE lease_id NOT IN (SELECT id FROM leases);
DELETE FROM visits WHERE property_id NOT IN (SELECT id FROM properties);
DELETE FROM leases WHERE property_id NOT IN (SELECT id FROM properties);

-- 5. Update sequence if needed (PostgreSQL specific)
-- This ensures auto-increment works correctly after cleanup
SELECT setval(pg_get_serial_sequence('users_id_seq'), COALESCE(MAX(id), 1)) FROM users;

-- Cleanup completed successfully!
-- Your database now matches the simplified user architecture.
