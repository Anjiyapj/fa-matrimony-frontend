/* ============================================================
   Single entry point for all data access.
   Connected directly to MongoDB backend via HTTP REST API.
   ============================================================ */
import { httpApi, ApiError } from './http';

export const USE_MOCK = false;
export const api = httpApi;
export { ApiError, httpApi };
export default httpApi;
