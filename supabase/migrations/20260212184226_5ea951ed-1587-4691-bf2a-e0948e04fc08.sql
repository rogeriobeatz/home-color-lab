
-- Fix: Prevent users from self-assigning roles to companies they don't own
-- Only allow inserting a role if the company has NO existing roles (i.e., during company creation)
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can insert own role for new companies"
ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.company_id = user_roles.company_id
  )
);
