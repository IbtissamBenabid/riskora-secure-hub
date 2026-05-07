
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_role_is(app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_can_access_project(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon;
