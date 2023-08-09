import { User } from '~/api/user/types';

export interface Session {
  sessionId: string;
  token: string;
  user?: User;
}

export interface LoginDto {
  email: string;
  password: string;
}
