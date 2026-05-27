declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number;
    [key: string]: unknown;
  }
  export function sign(payload: object, secret: string, options?: SignOptions): string;
  export function verify(token: string, secret: string): object;
}
