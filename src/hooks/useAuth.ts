import { useAppSelector } from "./useAppSelector";

export const useAuth = () => {
  const user = useAppSelector(
    state => state.auth.user
  );

  const token = useAppSelector(
    state => state.auth.token
  );

  return {
    user,
    token,
    isAuthenticated: !!token,
  };
};