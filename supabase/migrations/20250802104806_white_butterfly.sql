/*
  # Fix feedback table RLS policy

  1. Security Updates
    - Update RLS policy to allow anonymous users to submit feedback
    - Ensure public feedback submission works properly
    - Maintain security for reading and updating feedback

  2. Changes
    - Modify INSERT policy to allow both anonymous and authenticated users
    - Keep existing SELECT and UPDATE policies for authenticated users only
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;

-- Create a new INSERT policy that explicitly allows anonymous users
CREATE POLICY "Allow anonymous feedback submission"
  ON feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure the SELECT policy exists for authenticated users
DROP POLICY IF EXISTS "Authenticated users can read all feedback" ON feedback;
CREATE POLICY "Authenticated users can read all feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure the UPDATE policy exists for authenticated users
DROP POLICY IF EXISTS "Authenticated users can update feedback status" ON feedback;
CREATE POLICY "Authenticated users can update feedback status"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);