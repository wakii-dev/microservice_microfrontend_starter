// API client dùng chung shell — base đọc từ build-time env (conventions/05 rule 3 + 07 CORS):
//   dev native: http://localhost:8090 (auth-mock trực tiếp, CORS dev mở)
//   prod qua gateway: '' (same-origin)
import { ApiClient, tokenStorage } from '@boilerplate/fe-shared';

export const api = new ApiClient({ baseUrl: __API_BASE_URL__, tokenStorage });
