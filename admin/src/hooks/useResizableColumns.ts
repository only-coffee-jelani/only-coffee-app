import { useState, useCallback, useRef, useEffect } from 'react';

export interface ColumnConfig {
  key: string;
  label: string;
  minWidth?: number;
  defaultWidth?: number;
  maxWidth?: number;
}

export interface ColumnWidths {
  [key: string]: number;
}

export const useResizableColumns = (columns: ColumnConfig[], storageKey?: string) => {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    // Try to load from localStorage if storageKey is provided
    if (storageKey) {
      const saved = localStorage.getItem(`resizable-columns-${storageKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved column widths', e);
        }
      }
    }
    
    // Initialize with default widths
    const initialWidths: ColumnWidths = {};
    columns.forEach(col => {
      initialWidths[col.key] = col.defaultWidth || 150;
    });
    return initialWidths;
  });

  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Save to localStorage when widths change
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`resizable-columns-${storageKey}`, JSON.stringify(columnWidths));
    }
  }, [columnWidths, storageKey]);

  const handleMouseDown = useCallback((columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingColumn(columnKey);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[columnKey] || 150;
  }, [columnWidths]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return;

    const column = columns.find(col => col.key === resizingColumn);
    if (!column) return;

    const diff = e.clientX - startXRef.current;
    let newWidth = startWidthRef.current + diff;

    // Apply min/max constraints
    if (column.minWidth && newWidth < column.minWidth) {
      newWidth = column.minWidth;
    }
    if (column.maxWidth && newWidth > column.maxWidth) {
      newWidth = column.maxWidth;
    }

    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth,
    }));
  }, [resizingColumn, columns]);

  const handleMouseUp = useCallback(() => {
    setResizingColumn(null);
  }, []);

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp]);

  const resetWidths = useCallback(() => {
    const initialWidths: ColumnWidths = {};
    columns.forEach(col => {
      initialWidths[col.key] = col.defaultWidth || 150;
    });
    setColumnWidths(initialWidths);
    if (storageKey) {
      localStorage.removeItem(`resizable-columns-${storageKey}`);
    }
  }, [columns, storageKey]);

  return {
    columnWidths,
    handleMouseDown,
    resizingColumn,
    resetWidths,
  };
};

