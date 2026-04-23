import { ApiKeyEntity } from '@/database/entities/embed/api-key.entity';
import { OrgMemberEntity } from '@/database/entities/organizations/org-member.entity';
import { SessionEntity } from '@/database/entities/session/session.entity';
import { JwtPayload } from '@/modules/auth/types';

declare global {
  namespace Express {
    interface Request {
      session: SessionEntity | null;
      jwtPayload: JwtPayload;
      orgMember?: OrgMemberEntity | null;
      apiKey?: ApiKeyEntity | null;
    }
  }
}
