/**
 * Async Error Extraction Utilities (Deprecated Wrapper)
 *
 * These exports are kept for backward compatibility and delegate to the
 * single source of truth in `./common/errorHandling`.
 */
import type { ExtractedErrorInfo } from './common/errorHandling';
import {
  extractErrorFromFetchResponseAsync,
  extractErrorFromFetchCall,
  createFetchErrorHandler,
} from './common/errorHandling';

export type { ExtractedErrorInfo };
export { extractErrorFromFetchResponseAsync, extractErrorFromFetchCall, createFetchErrorHandler };
