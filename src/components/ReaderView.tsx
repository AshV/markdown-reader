import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import {
  Edit3,
  Check,
  Plus,
  Sparkles
} from 'lucide-react';
import {
  replaceLineRange,
  getLineRange,
  toggleCheckbox,
  insertMarkdownBlock,
  formatMarkdownSnippet
} from '../utils/markdownUtils';
import { FloatingToolbar } from './FloatingToolbar';
import { CodeBlock } from './CodeBlock';
import { TableBlock } from './TableBlock';
import { QuickInsertBar } from './QuickInsertBar';
import { InlineBlockEditor } from './InlineBlockEditor';

interface ReaderViewProps {
  markdown: string;
  onChangeMarkdown: (newMarkdown: string) => void;
  isInlineEditMode: boolean;
  onToggleInlineEditMode: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  markdown,
  onChangeMarkdown,
  isInlineEditMode,
  onToggleInlineEditMode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingBlockRange, setEditingBlockRange] = useState<{ startLine: number; endLine: number } | null>(null);
  const [activeHoverRange, setActiveHoverRange] = useState<{ startLine: number; endLine: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reset any active in-place block editors when switching back to pure reader mode
  useEffect(() => {
    if (!isInlineEditMode) {
      setEditingBlockRange(null);
      setActiveHoverRange(null);
    }
  }, [isInlineEditMode]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const handleUpdateBlock = useCallback(
    (startLine: number, endLine: number, newContent: string) => {
      const updated = replaceLineRange(markdown, startLine, endLine, newContent);
      onChangeMarkdown(updated);
      setEditingBlockRange(null);
      showToast('Block updated');
    },
    [markdown, onChangeMarkdown, showToast]
  );

  const handleDeleteBlock = useCallback(
    (startLine: number, endLine: number) => {
      const lines = markdown.split('\n');
      const before = lines.slice(0, Math.max(0, startLine - 1));
      const after = lines.slice(endLine);
      const updated = [...before, ...after].join('\n');
      onChangeMarkdown(updated);
      setEditingBlockRange(null);
      showToast('Block removed');
    },
    [markdown, onChangeMarkdown, showToast]
  );

  const handleStartEditingBlock = useCallback(
    (startLine: number, endLine: number) => {
      setEditingBlockRange({ startLine, endLine });
    },
    []
  );

  const handleCheckboxClick = useCallback(
    (targetLine?: number, index?: number) => {
      const updated = toggleCheckbox(markdown, targetLine, index);
      onChangeMarkdown(updated);
      if (isInlineEditMode) {
        showToast('Task toggled');
      }
    },
    [markdown, onChangeMarkdown, isInlineEditMode, showToast]
  );

  const handleInsertBlock = useCallback(
    (blockContent: string, afterLine?: number) => {
      const updated = insertMarkdownBlock(markdown, blockContent, afterLine);
      onChangeMarkdown(updated);
      showToast('New block added');
    },
    [markdown, onChangeMarkdown, showToast]
  );

  const handleFormatSelection = useCallback(
    (formatType: 'bold' | 'italic' | 'strike' | 'code' | 'h1' | 'h2' | 'quote' | 'link' | 'math') => {
      if (!isInlineEditMode) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      const formatted = formatMarkdownSnippet(formatType, selectedText);

      // If text exists in markdown, replace first exact occurrence
      if (markdown.includes(selectedText)) {
        const nextMarkdown = markdown.replace(selectedText, formatted);
        onChangeMarkdown(nextMarkdown);
        showToast(`Formatted as ${formatType}`);
      }
    },
    [isInlineEditMode, markdown, onChangeMarkdown, showToast]
  );

  // Generic Block wrapper for inline editing
  const renderEditableBlock = useCallback(
    (tag: string, node: any, children: React.ReactNode, className?: string) => {
      const Tag = tag as any;

      if (!isInlineEditMode) {
        return <Tag className={className}>{children}</Tag>;
      }

      const startLine = node?.position?.start?.line;
      const endLine = node?.position?.end?.line;
      const isCurrentlyEditing =
        editingBlockRange &&
        startLine &&
        endLine &&
        editingBlockRange.startLine === startLine &&
        editingBlockRange.endLine === endLine;

      if (isCurrentlyEditing) {
        const initialText = getLineRange(markdown, startLine, endLine);
        return (
          <InlineBlockEditor
            tag={tag}
            startLine={startLine}
            endLine={endLine}
            initialText={initialText}
            onSave={(newContent) => handleUpdateBlock(startLine, endLine, newContent)}
            onCancel={() => setEditingBlockRange(null)}
            onDelete={() => handleDeleteBlock(startLine, endLine)}
          />
        );
      }

      return (
        <div
          className="editable-block-container inline-mode-active"
          onMouseEnter={() => {
            if (startLine && endLine) {
              setActiveHoverRange({ startLine, endLine });
            }
          }}
          onMouseLeave={() => {
            setActiveHoverRange(null);
          }}
          onDoubleClick={(e) => {
            if (startLine && endLine) {
              e.stopPropagation();
              handleStartEditingBlock(startLine, endLine);
            }
          }}
        >
          <Tag className={className}>{children}</Tag>
          {startLine && endLine && (
            <div className="block-quick-actions">
              <button
                className="block-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEditingBlock(startLine, endLine);
                }}
                title="Edit block inline (or double-click)"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
              <button
                className="block-add-below-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInsertBlock('New paragraph text...\n', endLine);
                }}
                title="Insert block below"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      );
    },
    [isInlineEditMode, editingBlockRange, markdown, handleUpdateBlock, handleDeleteBlock, handleStartEditingBlock, handleInsertBlock]
  );

  const markdownComponents: Components = useMemo(() => {
    return {
      h1: ({ node, children, className }) => renderEditableBlock('h1', node, children, className),
      h2: ({ node, children, className }) => renderEditableBlock('h2', node, children, className),
      h3: ({ node, children, className }) => renderEditableBlock('h3', node, children, className),
      h4: ({ node, children, className }) => renderEditableBlock('h4', node, children, className),
      h5: ({ node, children, className }) => renderEditableBlock('h5', node, children, className),
      h6: ({ node, children, className }) => renderEditableBlock('h6', node, children, className),
      p: ({ node, children, className }) => renderEditableBlock('p', node, children, className),
      blockquote: ({ node, children, className }) =>
        renderEditableBlock('blockquote', node, children, className),

      // Task List Items & Interactive Checkboxes
      li: ({ node, children, className, ...props }) => {
        const startLine = node?.position?.start?.line;
        const isTaskItem =
          className?.includes('task-list-item') ||
          (node as any)?.checked !== undefined;

        if (isTaskItem) {
          const isChecked = Boolean((node as any)?.checked);

          const nonInputChildren = React.Children.toArray(children).filter((child) => {
            if (React.isValidElement(child)) {
              if (child.type === 'input' || (child.props as any)?.type === 'checkbox') {
                return false;
              }
            }
            return true;
          });

          return (
            <li className={`task-list-item ${isChecked ? 'task-item-completed' : ''} ${className || ''}`} {...props}>
              <button
                type="button"
                className={`interactive-task-checkbox ${isChecked ? 'checked' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCheckboxClick(startLine);
                }}
                title={isChecked ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {isChecked && <Check size={12} strokeWidth={3} color="#ffffff" />}
              </button>
              <span className="task-item-content">{nonInputChildren}</span>
            </li>
          );
        }

        return renderEditableBlock('li', node, children, className);
      },

      // Code Blocks
      code: ({ node, className, children, ...props }) => {
        const isInline = !className && typeof children === 'string';
        if (isInline) {
          return (
            <code className="inline-code" {...props}>
              {children}
            </code>
          );
        }

        const startLine = node?.position?.start?.line;
        const endLine = node?.position?.end?.line;

        return (
          <CodeBlock
            className={className}
            startLine={startLine}
            endLine={endLine}
            onUpdateBlock={handleUpdateBlock}
            isInlineEditMode={isInlineEditMode}
          >
            {children}
          </CodeBlock>
        );
      },

      // Interactive Tables
      table: ({ node, children }) => {
        const startLine = node?.position?.start?.line;
        const endLine = node?.position?.end?.line;
        const snippet = startLine && endLine ? getLineRange(markdown, startLine, endLine) : undefined;

        return (
          <TableBlock
            startLine={startLine}
            endLine={endLine}
            rawMarkdownSnippet={snippet}
            onUpdateBlock={handleUpdateBlock}
            isInlineEditMode={isInlineEditMode}
          >
            {children}
          </TableBlock>
        );
      }
    };
  }, [renderEditableBlock, handleCheckboxClick, handleUpdateBlock, isInlineEditMode, markdown]);

  return (
    <div className={`reader-view-container ${isInlineEditMode ? 'inline-editing-enabled' : 'pure-reader-mode'}`} ref={containerRef}>
      {/* Inline Mode Notification Banner - only shown when inline editing is active */}
      {isInlineEditMode && (
        <div className="reader-mode-banner glass-panel animate-fade-in">
          <div className="banner-left">
            <span className="mode-indicator-dot active" />
            <span className="mode-title">Inline Editing Active</span>
            <span className="mode-subtitle">Click or double-click any section to edit in place.</span>
          </div>
          <div className="banner-right">
            <button
              className="btn-pill active"
              onClick={onToggleInlineEditMode}
              title="Switch back to Reader Mode"
            >
              <Check size={14} />
              <span>Done Editing</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bubble Toolbar - only active during inline edit mode */}
      {isInlineEditMode && (
        <FloatingToolbar
          containerRef={containerRef}
          onFormatSelection={handleFormatSelection}
          onEditActiveBlock={() => {
            if (activeHoverRange) {
              handleStartEditingBlock(activeHoverRange.startLine, activeHoverRange.endLine);
            } else {
              const selection = window.getSelection();
              const text = selection ? selection.toString().trim() : '';
              if (text) {
                const lines = markdown.split('\n');
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].includes(text)) {
                    handleStartEditingBlock(i + 1, i + 1);
                    break;
                  }
                }
              }
            }
          }}
        />
      )}

      {/* Rendered Markdown Body / Empty State */}
      {!markdown.trim() ? (
        <div className="empty-state-view">
          <p className="empty-state-text">No content to display.</p>
          <p className="empty-state-subtext">
            Paste markdown (<strong>Ctrl+V</strong>), open a file, or click <strong>Inline Edit</strong> / <strong>Add Block</strong> below to start writing.
          </p>
        </div>
      ) : (
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
            components={markdownComponents}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      )}

      {/* Quick Insert Bar - only active during inline edit mode */}
      {isInlineEditMode && <QuickInsertBar onInsertBlock={handleInsertBlock} />}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification glass-panel animate-pop">
          <Sparkles size={16} color="var(--accent-hover)" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
