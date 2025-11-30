import React, { ReactNode } from 'react';
import { ColumnConfig, ColumnWidths } from '../hooks/useResizableColumns';

interface ResizableTableHeaderProps {
  columns: ColumnConfig[];
  columnWidths: ColumnWidths;
  onMouseDown: (columnKey: string, e: React.MouseEvent) => void;
  resizingColumn: string | null;
  className?: string;
  headerClassName?: string;
  renderHeaderContent?: (column: ColumnConfig) => ReactNode;
}

const ResizableTableHeader: React.FC<ResizableTableHeaderProps> = ({
  columns,
  columnWidths,
  onMouseDown,
  resizingColumn,
  className = 'bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200',
  headerClassName = 'px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider',
  renderHeaderContent,
}) => {
  return (
    <tr className={className}>
      {columns.map((column, index) => (
        <th
          key={column.key}
          className={`${headerClassName} ${column.key === 'select' || column.key === 'actions' ? 'text-center' : ''} relative`}
          style={{
            width: columnWidths[column.key] || column.defaultWidth || 150,
            minWidth: column.minWidth || 80,
            maxWidth: column.maxWidth,
          }}
        >
          <div className="flex items-center justify-between">
            {renderHeaderContent ? renderHeaderContent(column) : <span>{column.label}</span>}
            {index < columns.length - 1 && (
              <div
                className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-pink-400 transition-colors ${
                  resizingColumn === column.key ? 'bg-pink-500' : 'bg-transparent'
                }`}
                onMouseDown={(e) => onMouseDown(column.key, e)}
                style={{
                  userSelect: 'none',
                }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-4 -mr-2" />
              </div>
            )}
          </div>
        </th>
      ))}
    </tr>
  );
};

export default ResizableTableHeader;

