import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor?: keyof T | string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface FilterOption {
  label: string;
  value: string;
}

interface TableFilter {
  key: string;
  label: string;
  options: FilterOption[];
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  filters?: TableFilter[];
  searchPlaceholder?: string;
  searchKey?: keyof T | ((row: T) => string);
  initialSort?: { key: string; direction: 'asc' | 'desc' };
  exportFileName?: string;
}

export function Table<T>({
  data,
  columns,
  filters = [],
  searchPlaceholder = 'Search...',
  searchKey,
  initialSort,
  exportFileName = 'export'
}: TableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(initialSort || null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filters change
  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      if (value === '') delete next[key];
      else next[key] = value;
      return next;
    });
    setCurrentPage(1);
  };

  // Filter and search data
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Apply dropdown filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      result = result.filter(item => {
        const itemVal = (item as any)[key];
        return String(itemVal).toLowerCase() === value.toLowerCase();
      });
    });

    // 2. Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        if (typeof searchKey === 'function') {
          return searchKey(item).toLowerCase().includes(query);
        } else if (searchKey) {
          const itemVal = (item as any)[searchKey];
          return String(itemVal).toLowerCase().includes(query);
        } else {
          // Default: check all fields
          return Object.values(item as any).some(val => 
            String(val).toLowerCase().includes(query)
          );
        }
      });
    }

    // 3. Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let valA = sortConfig.key.includes('.') 
          ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a as any)
          : (a as any)[sortConfig.key];
        let valB = sortConfig.key.includes('.') 
          ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b as any)
          : (b as any)[sortConfig.key];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, activeFilters, searchQuery, searchKey, sortConfig]);

  // Paginated slices
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage) || 1;

  // Sorting handler
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null; // Reset sort
      }
      return { key, direction: 'asc' };
    });
  };

  // CSV Exporter
  const handleExport = () => {
    if (processedData.length === 0) return;

    // Get headers
    const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(',');
    
    // Get rows
    const rows = processedData.map(row => {
      return columns.map(col => {
        let value = '';
        if (col.accessor) {
          const rawVal = col.accessor.toString().includes('.')
            ? col.accessor.toString().split('.').reduce((obj, key) => obj?.[key], row as any)
            : (row as any)[col.accessor as any];
          value = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
        } else {
          // If no accessor, simulate text extraction from custom renderer
          value = '';
        }
        return `"${value.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-container">
      {/* Table search & filter actions */}
      <div className="table-header-bar">
        <div style={{ display: 'flex', gap: '12px', flexGrow: 1, maxWidth: '500px' }}>
          <div className="search-container" style={{ width: '100%', maxWidth: '320px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Render filters */}
          {filters.map(filter => (
            <select
              key={filter.key}
              className="select-filter"
              value={activeFilters[filter.key] || ''}
              onChange={e => handleFilterChange(filter.key, e.target.value)}
            >
              <option value="">All {filter.label}</option>
              {filter.options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        <button className="btn btn-secondary" onClick={handleExport} style={{ gap: '6px' }}>
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Main Table Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table className="enterprise-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && col.accessor && handleSort(col.accessor.toString())}
                  style={{ cursor: col.sortable && col.accessor ? 'pointer' : 'default' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {col.header}
                    {col.sortable && col.accessor && sortConfig?.key === col.accessor.toString() && (
                      <span style={{ fontSize: '10px' }}>
                        {sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col, colIdx) => {
                    const cellContent = col.render 
                      ? col.render(row) 
                      : col.accessor 
                        ? col.accessor.toString().includes('.')
                          ? col.accessor.toString().split('.').reduce((obj, key) => obj?.[key], row as any)
                          : (row as any)[col.accessor as any]
                        : null;
                    return <td key={colIdx}>{cellContent}</td>;
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination */}
      <div className="pagination-bar">
        <div className="pagination-text">
          Showing <b>{Math.min(processedData.length, (currentPage - 1) * itemsPerPage + 1)}</b> to{' '}
          <b>{Math.min(processedData.length, currentPage * itemsPerPage)}</b> of{' '}
          <b>{processedData.length}</b> records
        </div>

        <div className="pagination-btns">
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px' }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px' }}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
