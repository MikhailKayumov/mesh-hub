import { SetMetadata } from '@nestjs/common';
import { ApiKeyScope } from '@/modules/api-keys/api-key.constants';

export const REQUIRED_SCOPE_KEY = 'requiredApiKeyScope';

export const RequiredScope = (scope: ApiKeyScope) => SetMetadata(REQUIRED_SCOPE_KEY, scope);
