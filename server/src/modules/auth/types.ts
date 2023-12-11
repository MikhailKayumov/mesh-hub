export interface JwtPayload {
  userId: string;
  userEmail: string;
  createdAt: number;
  iat: number;
  exp: number;
}
