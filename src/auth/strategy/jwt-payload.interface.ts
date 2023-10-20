export interface JwtPayload {
  userId: number;
  userEmail: string;
  iat?: number;
  exp?: number;
}
