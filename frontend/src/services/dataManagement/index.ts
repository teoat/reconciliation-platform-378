// Data Management Module
export * from './types';
export * from './utils';
import DataManagementServiceDefault from './service';
export { DataManagementServiceDefault as DataManagementService };

// Legacy export for backward compatibility
export default DataManagementServiceDefault;
