import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { parseMarkdownTable, serializeMarkdownTable, type ParsedTable } from '../utils/markdownUtils';

interface TableBlockProps {
  children?: React.ReactNode;
  startLine?: number;
  endLine?: number;
  rawMarkdownSnippet?: string;
  onUpdateBlock?: (startLine: number, endLine: number, newContent: string) => void;
  isInlineEditMode?: boolean;
}

export const TableBlock: React.FC<TableBlockProps> = ({
  children,
  startLine,
  endLine,
  rawMarkdownSnippet,
  onUpdateBlock,
  isInlineEditMode = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tableData, setTableData] = useState<ParsedTable | null>(() => {
    if (rawMarkdownSnippet) {
      return parseMarkdownTable(rawMarkdownSnippet);
    }
    return null;
  });

  const handleStartEdit = () => {
    if (rawMarkdownSnippet) {
      const parsed = parseMarkdownTable(rawMarkdownSnippet);
      if (parsed) {
        setTableData(parsed);
        setIsEditing(true);
        return;
      }
    }
    setIsEditing(true);
  };

  const handleCellChange = (
    type: 'header' | 'row',
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    if (!tableData) return;
    const next = { ...tableData };
    if (type === 'header') {
      const nextHeaders = [...next.headers];
      nextHeaders[colIndex] = value;
      next.headers = nextHeaders;
    } else {
      const nextRows = next.rows.map((r, rIdx) => {
        if (rIdx !== rowIndex) return r;
        const newRow = [...r];
        newRow[colIndex] = value;
        return newRow;
      });
      next.rows = nextRows;
    }
    setTableData(next);
  };

  const handleAddRow = () => {
    if (!tableData) return;
    const colCount = Math.max(tableData.headers.length, 1);
    const newRow = Array(colCount).fill('New Cell');
    setTableData({
      ...tableData,
      rows: [...tableData.rows, newRow]
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (!tableData) return;
    setTableData({
      ...tableData,
      rows: tableData.rows.filter((_, idx) => idx !== rowIndex)
    });
  };

  const handleAddColumn = () => {
    if (!tableData) return;
    setTableData({
      ...tableData,
      headers: [...tableData.headers, `Column ${tableData.headers.length + 1}`],
      alignments: [...tableData.alignments, null],
      rows: tableData.rows.map(row => [...row, ''])
    });
  };

  const handleSave = () => {
    if (tableData && startLine && endLine && onUpdateBlock) {
      const serialized = serializeMarkdownTable(tableData);
      onUpdateBlock(startLine, endLine, serialized);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (rawMarkdownSnippet) {
      setTableData(parseMarkdownTable(rawMarkdownSnippet));
    }
    setIsEditing(false);
  };

  return (
    <div className="table-block-wrapper">
      {(isInlineEditMode || isEditing) && (
        <div className="table-toolbar">
          <span className="table-badge">Table Editor</span>
          <div className="table-toolbar-actions">
            {isEditing ? (
              <>
                <button className="table-btn" onClick={handleAddRow} title="Add Row">
                  <Plus size={13} /> Row
                </button>
                <button className="table-btn" onClick={handleAddColumn} title="Add Column">
                  <Plus size={13} /> Column
                </button>
                <button className="table-btn primary" onClick={handleSave} title="Save Table">
                  <Check size={13} /> Save
                </button>
                <button className="table-btn" onClick={handleCancel} title="Cancel">
                  <X size={13} />
                </button>
              </>
            ) : (
              <button className="table-btn" onClick={handleStartEdit} title="Edit Table Cells">
                <Edit3 size={13} /> Edit Table
              </button>
            )}
          </div>
        </div>
      )}

      {isEditing && tableData ? (
        <div className="table-responsive">
          <table className="editable-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                {tableData.headers.map((header, colIdx) => (
                  <th key={colIdx}>
                    <input
                      type="text"
                      className="table-cell-input header-cell"
                      value={header}
                      onChange={(e) => handleCellChange('header', 0, colIdx, e.target.value)}
                    />
                  </th>
                ))}
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="row-number">{rowIdx + 1}</td>
                  {row.map((cell, colIdx) => (
                    <td key={colIdx}>
                      <input
                        type="text"
                        className="table-cell-input"
                        value={cell}
                        onChange={(e) => handleCellChange('row', rowIdx, colIdx, e.target.value)}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      className="row-delete-btn"
                      onClick={() => handleDeleteRow(rowIdx)}
                      title="Delete Row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-responsive">
          <table>{children}</table>
        </div>
      )}
    </div>
  );
};
