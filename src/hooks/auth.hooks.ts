import { AuthInterface } from '@/interfaces/auth.interface';
import { authState } from '@/state/auth.state';
import { useRecoilState } from 'recoil';

export function useAuthAction() {
  const [authDetails, setAuthDetails] = useRecoilState(authState);

  return {
    updateAuth,
    user: user(),
    logout,
  };

  function updateAuth(userInfo: AuthInterface) {
    setAuthDetails(userInfo);
  }

  function user() {
    return authDetails;
  }

  function logout() {
    setAuthDetails({
      id: '',
      walletAddress: '',
      token: '',
    });
  }
}
