-- Trigger para crear fila en public.profiles al registrar un usuario en Auth.
-- Necesario en modo local (y recomendable en modo red si no existe en el dashboard).

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
