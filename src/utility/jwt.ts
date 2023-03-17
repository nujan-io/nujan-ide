import { AppConfig } from '@/config/AppConfig';
import jwbt from 'jsonwebtoken';
import moment from 'moment';
import { NextApiRequest } from 'next';

export function generateAccessToken(data: any): string {
  return jwbt.sign({ data }, AppConfig.auth.accessTokenSecretKey, {
    expiresIn: AppConfig.auth.accessTokenDuration,
  });
}

export function verifyAccessToken(token: string): string | any {
  const decodedToken: any = jwbt.decode(token);

  // we need to invalid user before 10 minutes of token expiry
  if (
    decodedToken &&
    decodedToken?.exp &&
    decodedToken.exp < moment().add(10, 'minutes').unix()
  ) {
    return false;
  }

  return jwbt.verify(token, AppConfig.auth.accessTokenSecretKey);
}

export function authenticate(req: NextApiRequest) {
  const token = String(req.headers.authorization).replace('Bearer ', '');
  if (!req.headers.authorization || !token) {
    throw 'Auth token missing';
  }

  try {
    const resposne: any = verifyAccessToken(token);
    if (!resposne) {
      throw 'Invalid session';
    }
    return resposne.data;
  } catch (error) {
    throw 'Invalid session';
  }
}
