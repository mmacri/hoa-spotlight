-- Update the password for the admin user
-- Note: This sets a temporary password that should be changed after first login
UPDATE auth.users 
SET 
  encrypted_password = crypt('VMware11', gen_salt('bf')),
  updated_at = now()
WHERE email = 'mikemacri@gmail.com';