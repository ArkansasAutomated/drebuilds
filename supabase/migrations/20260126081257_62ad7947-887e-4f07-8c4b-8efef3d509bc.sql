-- Add admin management policy for whop_users
CREATE POLICY "Admins can manage all Whop users"
ON public.whop_users
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add UPDATE policy for users to update their own data
CREATE POLICY "Users can update their own Whop data"
ON public.whop_users
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add DELETE policy for users to delete their own Whop linkage
CREATE POLICY "Users can delete their own Whop data"
ON public.whop_users
FOR DELETE
TO authenticated
USING (user_id = auth.uid());