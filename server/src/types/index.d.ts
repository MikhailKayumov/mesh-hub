import { SessionEntity } from '@/database/entities/session/session.entity';
import { JwtPayload } from '@/modules/auth/types';

declare global {
  namespace Express {
    interface Request {
      session: SessionEntity | null;
      jwtPayload: JwtPayload;
    }
  }
}
