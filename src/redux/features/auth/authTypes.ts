export interface AuthState {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
    username: string;
    email: string;
    role: string;
}