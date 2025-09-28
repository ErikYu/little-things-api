export interface AppleSignInDto {
  identityToken: string;
}

export interface RefreshTokenDto {
  refresh_token: string;
}

export interface SignupDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
