-- Make djchernick@gmail.com an influencer for testing
UPDATE profiles
SET pilot_role = 'influencer'
WHERE email = 'djchernick@gmail.com';

-- Verify
SELECT email, pilot_role FROM profiles WHERE email = 'djchernick@gmail.com';
