import React, { memo, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Filter } from 'lucide-react';
import { Download } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import Button from './Button';
import Input from './Input';

export interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onFilter?: () => void;
  loading?: boolean;
  showSearch?: boolean;
  showRefresh?: boolean;
  showExport?: boolean;
  showFilter?: boolean;
  className?: string;
}

const DataTableToolbar: React.FC<DataTableToolbarProps> = memo(
  ({
    searchValue,
    onSearchChange,
    onRefresh,
    onExport,
    onFilter,
    loading = false,
    showSearch = true,
    showRefresh = true,
    showExport = true,
    showFilter = true,
    className = '',
  }) => {
    // Memoize toolbar classes
    const toolbarClasses = useMemo(
      () => `flex items-center justify-between py-4 ${className}`,
      [className]
    );

    // Memoize search change handler
    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value);
      },
      [onSearchChange]
    );

    // Memoize search icon
    const searchIcon = useMemo(() => <Search className="w-4 h-4" />, []);

    // Memoize filter icon
    const filterIcon = useMemo(() => <Filter className="w-4 h-4" />, []);

    // Memoize refresh icon
    const refreshIcon = useMemo(() => <RefreshCw className="w-4 h-4" />, []);

    // Memoize export icon
    const exportIcon = useMemo(() => <Download className="w-4 h-4" />, []);

    return (
      <div className={toolbarClasses}>
        <div className="flex items-center space-x-4">
          {showSearch && (
            <div className="w-64">
              <Input
                placeholder="Search..."
                value={searchValue}
                onChange={handleSearchChange}
                leftIcon={searchIcon}
                fullWidth
              />
            </div>
          )}

          {showFilter && onFilter && (
            <Button variant="outline" size="sm" onClick={onFilter} leftIcon={filterIcon}>
              Filter
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {showRefresh && onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              loading={loading}
              leftIcon={refreshIcon}
            >
              Refresh
            </Button>
          )}

          {showExport && onExport && (
            <Button variant="outline" size="sm" onClick={onExport} leftIcon={exportIcon}>
              Export
            </Button>
          )}
        </div>
      </div>
    );
  }
);

export { DataTableToolbar };
export default DataTableToolbar;
