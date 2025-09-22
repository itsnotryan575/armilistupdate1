/*
  # Fix anonymous feedback submission policy

  1. Security Updates
    - Drop existing restrictive INSERT policy
    - Create new policy allowing anonymous users to submit feedback
    - Ensure anon role can insert feedback without authentication

  2. Changes
    - Remove old "Allow anonymous feedback submission" policy
    - Add new "Anyone can submit feedback" policy with proper anon role permissions
*/

-- Drop the existing policy that's causing issues
DROP POLICY IF EXISTS "Allow anonymous feedback submission" ON feedback;

-- Create a new policy that explicitly allows anonymous users to submit feedback
CREATE POLICY "Anyone can submit feedback"
  ON feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure the existing read policy is correct for authenticated users
DROP POLICY IF EXISTS "Authenticated users can read all feedback" ON feedback;
CREATE POLICY "Authenticated users can read all feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure the existing update policy is correct for authenticated users
DROP POLICY IF EXISTS "Authenticated users can update feedback status" ON feedback;
CREATE POLICY "Authenticated users can update feedback status"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);