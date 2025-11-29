// types/data.ts

/**
 * Generic data structure with flexible key-value pairs
 * 
 * @property id - Unique identifier
 * @property [key: string] - Additional properties with unknown values
 */
export interface Data {
  id: string;
  [key: string]: unknown;
}
