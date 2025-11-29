// Password Policy Constants (Better Auth SSOT)
export const PASSWORD_POLICY = {
  BCRYPT_COST: Number(import.meta.env.VITE_BCRYPT_COST) || 12,
  MIN_LENGTH: Number(import.meta.env.VITE_PASSWORD_MIN_LENGTH) || 8,
  MAX_LENGTH: Number(import.meta.env.VITE_PASSWORD_MAX_LENGTH) || 128,
  EXPIRATION_DAYS: Number(import.meta.env.VITE_PASSWORD_EXPIRATION_DAYS) || 90,
  INITIAL_EXPIRATION_DAYS: Number(import.meta.env.VITE_PASSWORD_INITIAL_EXPIRATION_DAYS) || 7,
  HISTORY_LIMIT: Number(import.meta.env.VITE_PASSWORD_HISTORY_LIMIT) || 5,
  WARNING_DAYS: Number(import.meta.env.VITE_PASSWORD_WARNING_DAYS) || 7,
};
