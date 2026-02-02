-- List all pilot users with their roles
SELECT
  p.id,
  p.email,
  p.pilot_role,
  p.created_at,
  au.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;
