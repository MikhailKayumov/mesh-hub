# API Reference

All API communication is handled through **RTK Query**, injected into a single `Api` instance. This document covers the cache tag system, all endpoint modules, request/response DTOs, and the token auto-refresh flow.

> **Backend context:** The NestJS server exposes these endpoints from the following modules: `auth`, `user`, `models-3d`, `resources`. Server source lives in `../server/src/modules/`.

---

## Base Configuration

**File:** `src/app/api/base.ts`

| Setting | Value |
|---|---|
| `reducerPath` | `'@mesh_hub/api'` |
| `baseUrl` | `import.meta.env.VITE_APP_API_URL ?? '/'` |
| `credentials` | `'include'` (cookie-based sessions) |
| `timeout` | `30 000 ms` |

---

## Cache Tags (`ApiTags`)

**File:** `src/app/api/tags.ts`

| Key | Value | Note |
|---|---|---|
| `Reset` | `'Reset'` | Global invalidation sentinel — forces `currentUser` and `model3D` to refetch |
| `CurrentUser` | `'CurrentUser'` | Current authenticated user data |
| `CGSoft` | `'CGSoft'` | CG software reference list |
| `Categories` | `'Categories'` | 3D model categories list |
| `Get3DModels` | `'Get3DModels'` | Public paginated model list |
| `Get3DModel` | `'Get3DModels'` | ⚠ Same value as `Get3DModels` — used for per-ID tag `{ type, id }` |
| `CurrentUser3DModels` | `'CurrentUser3DModels'` | Current user's uploaded models list |
| `CurrentUser3DModel` | `'CurrentUser3DModel'` | (reserved, not currently used in provides) |

### Tag Provider / Invalidator Map

| Endpoint | Provides | Invalidates |
|---|---|---|
| `currentUser` | `Reset`, `CurrentUser` | — |
| `currentUserSessions` | `CurrentUser` | — |
| `model3D` | `Reset`, `{ type: Get3DModel, id }` | — |
| `models3D` | `Get3DModels` | — |
| `currentUser3DModels` | `Reset`, `CurrentUser3DModels` | — |
| `cgSoft` | `Reset`, `CGSoft` | — |
| `categories` | `Reset`, `Categories` | — |
| `register` / `login` / `logout` | — | `CurrentUser`, `Get3DModel` |
| `closeCurrentUserSession` | — | `CurrentUser` |
| `closeCurrentUserSessions` | — | `CurrentUser`, `Get3DModel` |
| `updateCurrentUser` | — | `CurrentUser`, `CGSoft` |
| `updateCurrentUserAvatar` | — | `CurrentUser` |
| `updateModel3D` | — | `Reset`, `Get3DModels`, `{ type: Get3DModel, id }` |
| `upload3DModel` / `delete3DModel` / `saveThumbnailFromBase64` | — | `CurrentUser3DModels`, `Get3DModels` |

> **`Reset` tag:** Invalidating it causes all queries that provide `Reset` to refetch simultaneously. Use it only for hard resets (e.g. after closing all sessions).

---

## Auth API

**File:** `src/app/api/auth.ts`
**Server module:** `auth`

| Hook | Method | URL | Request DTO | Response DTO |
|---|---|---|---|---|
| `useRegisterMutation` | `POST` | `auth/signup` | `SignupRequestDto` | `SessionResponseDto` |
| `useLoginMutation` | `POST` | `auth/login` | `LoginRequestDto` | `SessionResponseDto` |
| `useLogoutMutation` | `POST` | `auth/logout` | — | `void` |
| `useCurrentUserSessionsQuery` | `GET` | `auth/current-user-sessions` | `PaginationDto<never>` | `PaginationResponseDto<SessionResponseDto>` |
| `useCloseCurrentUserSessionMutation` | `DELETE` | `auth/current-user-sessions/:id` | `string` (id) | `void` |
| `useCloseCurrentUserSessionsMutation` | `DELETE` | `auth/current-user-sessions` | — | `void` |

---

## User API

**File:** `src/app/api/user.ts`
**Server module:** `user`

| Hook | Method | URL | Request DTO | Response DTO |
|---|---|---|---|---|
| `useCurrentUserQuery` | `GET` | `user/current` | — | `UserCurrentResponseDto` |
| `useUpdateCurrentUserMutation` | `PATCH` | `user/current` | `UserCurrentUpdateRequestDto` | `void` |
| `useUpdateCurrentUserAvatarMutation` | `POST` | `user/current/avatar` | `{ file?: Blob }` | `void` |
| `useResetPasswordMutation` | `PATCH` | `user/reset-password` | `{ email: string }` | `void` |
| `useNewPasswordMutation` | `PATCH` | `user/new-password` | `UserNewPasswordRequestDto` | `void` |
| `useChangePasswordMutation` | `PATCH` | `user/change-password` | `UserChangePasswordRequestDto` | `void` |

---

## Models 3D API

**File:** `src/app/api/models-3d.ts`
**Server module:** `models-3d`

| Hook | Method | URL | Request | Response |
|---|---|---|---|---|
| `useModels3DQuery` | `GET` | `models-3d` | `PaginationDto<any>` | `PaginationResponseDto<Model3DResponseDto>` |
| `useModel3DQuery` | `GET` | `models-3d/:id` | `string` (id) | `Model3DResponseDto` |
| `useUpdateModel3DMutation` | `PATCH` | `models-3d/:id` | `{ id, body: Model3DUpdateRequestDto }` | `Model3DResponseDto` |
| `useCurrentUser3DModelsQuery` | `GET` | `models-3d/current-user` | `PaginationDto<any>` | `PaginationResponseDto<Model3DResponseDto>` |
| `useUpload3DModelMutation` | `POST` | `models-3d/upload` | `FormData` | `{ modelId: string }` |
| `useDelete3DModelMutation` | `DELETE` | `models-3d/:id` | `string` (id) | `void` |
| `useSaveThumbnailFromBase64Mutation` | `POST` | `models-3d/:id/save-thumbnail-base64` | `{ id, thumbnail: string }` | `void` |

---

## Resources API

**File:** `src/app/api/resources.ts`
**Server module:** `resources`

| Hook | Method | URL | Request | Response |
|---|---|---|---|---|
| `useCgSoftQuery` | `GET` | `resources/cg-soft/all` | — | `CgSoftResponse[]` |
| `useCategoriesQuery` | `GET` | `resources/category/all` | — | `CategoryResponse[]` |

These are reference data endpoints (CG software list, model categories). Both provide the `Reset` tag, so they refetch on hard resets.

---

## Data Transfer Objects (DTOs)

**File:** `src/app/api/dto.ts`

### Pagination

```ts
interface PaginationDto<T = any> {
  skip?: number;
  size?: number;
  sort?: string[];
  body?: T;
}

interface PaginationResponseDto<T = any> {
  data: T[];
  skip: number;
  size: number;
  sort: PaginationDtoSortItem[];  // { field: string; by: 'ASC' | 'DESC' }
  totalCount: number;
  hasMore: boolean;
}
```

### Auth

```ts
interface SignupRequestDto {
  email: string;
  firstName: string;
  lastName?: string;
  password: string;
  confirmPassword: string;
}

interface LoginRequestDto {
  email: string;
  password: string;
}

interface SessionResponseDto {
  id: string;
  ip: string;
  createdAt: string;
  updatedAt?: string;
  expireAt: string;
  userAgent?: string;
}
```

### User

```ts
interface UserCurrentResponseDto {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  isConfirmed: boolean;
  meta: UserMetaResponseDto;
}

interface UserMetaResponseDto {
  id: string;
  avatar?: string;
  aboutYourself?: string;
  favoriteSoft?: CgSoftResponse[];
}

interface UserCurrentUpdateRequestDto {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  aboutYourself?: string;
  favoriteSoft?: CgSoftRequest[];
}
```

### 3D Models

```ts
interface Model3DResponseDto {
  id: string;
  createdAt: string;
  updatedAt?: string;
  isOwner: boolean;
  ownerAvatar?: string;
  ownerName: string;
  name: string;
  isVisible: boolean;
  file: Model3DFileResponseDto;  // { id, name, size, extension, createdAt, updatedAt }
  description?: Record<string, any>;
  thumbnail?: string;
  categories?: CategoryResponse[];
}

interface Model3DUpdateRequestDto {
  name?: string;
  isVisible?: boolean;
  description?: object;
  categories?: CategoryRequest[];
}
```

### Errors

```ts
interface HttpException {
  status: number;
  type?: string;
  message: string;
  error: string;
  data?: any;
}

interface ValidationHttpException<Property = string> {
  status: 400;
  type: 'ValidationError';
  message: 'Ошибка валидации';
  error: 'Bad Request';
  data: { property: Property; errors: string[] }[];
}
```

---

## Token Auto-Refresh Flow

The base query in `src/app/api/base.ts` handles session refresh automatically using `async-mutex` to prevent concurrent refresh races.

```
Any RTK Query request
  │
  ▼
Execute base fetch
  │
  ├─ Success → return result
  │
  └─ Error (401 or network error)
       │
       ├─ Mutex already locked by another refresh?
       │    └─ Wait for unlock → retry original request → return result
       │
       └─ Mutex is free → acquire lock
            │
            ▼
          POST auth/refresh
            │
            ├─ Success → dispatch setSession(newId)
            │               → retry original request → return result
            │
            └─ Failure → dispatch setSession(null)  ← clears session state
            │
            └─ Release mutex (always, in finally)
```

**Key properties:**
- Only one refresh attempt runs at a time across all in-flight requests
- If a second request arrives during an ongoing refresh, it waits then retries with the new session cookie
- On refresh failure the `user.session` slice is set to `null`, which allows the UI to show an unauthenticated state

