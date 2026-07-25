import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table as ShadTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  /** Replaces the default Export CSV button in the toolbar when provided. */
  toolbarAction?: React.ReactNode;
}

export function Table<T>({
  data,
  columns,
  filters = [],
  searchPlaceholder = 'Search...',
  searchKey,
  initialSort,
  exportFileName = 'export',
  toolbarAction,
}: TableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    initialSort || null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      if (value === '') delete next[key];
      else next[key] = value;
      return next;
    });
    setCurrentPage(1);
  };

  const processedData = useMemo(() => {
    let result = [...data];

    Object.entries(activeFilters).forEach(([key, value]) => {
      result = result.filter(item => {
        const itemVal = (item as Record<string, unknown>)[key];
        return String(itemVal).toLowerCase() === value.toLowerCase();
      });
    });

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        if (typeof searchKey === 'function') {
          return searchKey(item).toLowerCase().includes(query);
        } else if (searchKey) {
          const itemVal = (item as Record<string, unknown>)[searchKey as string];
          return String(itemVal).toLowerCase().includes(query);
        } else {
          return Object.values(item as Record<string, unknown>).some(val =>
            String(val).toLowerCase().includes(query)
          );
        }
      });
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const getVal = (obj: unknown, key: string): unknown =>
          key.includes('.')
            ? key.split('.').reduce((o, k) => (o as Record<string, unknown>)?.[k], obj)
            : (obj as Record<string, unknown>)[key];

        let valA = getVal(a, sortConfig.key);
        let valB = getVal(b, sortConfig.key);
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA! < valB!) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA! > valB!) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, activeFilters, searchQuery, searchKey, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage) || 1;

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleExport = () => {
    if (processedData.length === 0) return;
    const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(',');
    const rows = processedData.map(row => {
      return columns
        .map(col => {
          let value = '';
          if (col.accessor) {
            const rawVal = col.accessor.toString().includes('.')
              ? col.accessor
                  .toString()
                  .split('.')
                  .reduce((obj, key) => (obj as Record<string, unknown>)?.[key], row as unknown)
              : (row as Record<string, unknown>)[col.accessor as string];
            value = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
          }
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,﻿' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCellValue = (row: T, col: Column<T>) => {
    if (col.render) return col.render(row);
    if (col.accessor) {
      return col.accessor.toString().includes('.')
        ? col.accessor
            .toString()
            .split('.')
            .reduce((obj, key) => (obj as Record<string, unknown>)?.[key], row as unknown)
        : (row as Record<string, unknown>)[col.accessor as string];
    }
    return null;
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 p-4 border-b flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              className="pl-8 h-9 w-64"
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {filters.map(filter => (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] || ''}
              onValueChange={val => handleFilterChange(filter.key, val === '__all__' ? '' : val)}
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder={`All ${filter.label}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All {filter.label}</SelectItem>
                {filter.options.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {toolbarAction ?? (
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <ShadTable>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={col.sortable && col.accessor ? 'cursor-pointer select-none' : ''}
                  onClick={() => col.sortable && col.accessor && handleSort(col.accessor.toString())}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && col.accessor && (
                      <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {sortConfig !== null && sortConfig?.key === col.accessor?.toString() && (
                      <span className="text-primary text-xs">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-10 text-muted-foreground"
                >
                  No matching records found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx}>{getCellValue(row, col) as React.ReactNode}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </ShadTable>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
        <span>
          Showing{' '}
          <strong className="text-foreground">
            {Math.min(processedData.length, (currentPage - 1) * itemsPerPage + 1)}
          </strong>{' '}
          to{' '}
          <strong className="text-foreground">
            {Math.min(processedData.length, currentPage * itemsPerPage)}
          </strong>{' '}
          of <strong className="text-foreground">{processedData.length}</strong> records
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 font-medium text-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
