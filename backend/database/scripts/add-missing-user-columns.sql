-- Add Missing User Columns
-- This script adds columns to the users table that are defined in the User entity
-- but missing from the enterprise schema

-- Add email_verified column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Add phone_verified column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

-- Add marketing_opt_in column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT false;

-- Add is_active column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add last_login_at column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add role column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER';

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS IDX_users_email_verified ON users (email_verified);
CREATE INDEX IF NOT EXISTS IDX_users_is_active ON users (is_active);
CREATE INDEX IF NOT EXISTS IDX_users_role ON users (role);

-- Display success message
SELECT 'Successfully added missing columns to users table' AS status;

