-- Fix any old 'admin' roles to 'super_admin'
UPDATE public.user_profiles
SET role = 'super_admin'
WHERE role = 'admin';

-- Ensure the first user is super_admin just in case
INSERT INTO public.user_profiles (id, role, full_name, created_at)
SELECT id, 'super_admin', email, NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ORDER BY created_at ASC
LIMIT 1;
