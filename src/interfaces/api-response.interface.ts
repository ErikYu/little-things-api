export interface ApiResponse<T = any> {
  success: boolean;
  msg: string | string[];
  data: T;
  code?: number;
}
