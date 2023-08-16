import { SessionEntity } from '@entities/session/session.entity';

declare global {
  namespace Express {
    interface Request {
      accessToken?: string;
      session?: SessionEntity;
    }
  }
}
