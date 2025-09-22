/*
  # Disable RLS for feedback table

  This migration temporarily disables Row Level Security for the feedback table
  to allow anonymous users to submit feedback without authentication issues.

  1. Changes
     - Disable RLS on feedback table
     - Remove all existing policies

  Note: This allows public access to submit feedback, which is the intended behavior
  for a feedback system where users should be able to submit without signing up.
*/

-- Disable Row Level Security for the feedback table
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Allow anonymous feedback submission" ON feedback;
DROP POLICY IF EXISTS "Allow feedback submission" ON feedback;
DROP POLICY IF EXISTS "Allow feedback reading" ON feedback;
DROP POLICY IF EXISTS "Allow feedback updates" ON feedback;
DROP POLICY IF EXISTS "Authenticated users can read all feedback" ON feedback;
DROP POLICY IF EXISTS "Authenticated users can update feedback status" ON feedback;
DROP POLICY IF EXISTS "Allow public feedback insert" ON feedback;