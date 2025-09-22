/*
  # Add missing columns to feedback table

  1. Changes
    - Add `appversion` column to match the application's data structure
    - Add `deviceinfo` column to match the application's data structure
    - Add `useremail` column to match the application's data structure

  2. Security
    - No changes to existing RLS policies
    - Columns are nullable to maintain compatibility
*/

-- Add missing columns to feedback table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'appversion'
  ) THEN
    ALTER TABLE feedback ADD COLUMN appversion TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'deviceinfo'
  ) THEN
    ALTER TABLE feedback ADD COLUMN deviceinfo TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'useremail'
  ) THEN
    ALTER TABLE feedback ADD COLUMN useremail TEXT;
  END IF;
END $$;