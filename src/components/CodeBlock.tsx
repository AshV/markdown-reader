import React, { useState } from 'react';
import { Copy, Check, Edit3, X } from 'lucide-react';

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  startLine?: number;
  endLine?: number;
  onUpdateBlock?: (startLine: number, endLine: number, newContent: string) => void;
  isInlineEditMode?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  className = '',
  startLine,
  endLine,
  onUpdateBlock,
  isInlineEditMode = false
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Extract raw text from children
  const extractText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (React.isValidElement(node) && (node.props as { children?: React.ReactNode }).children) {
      return extractText((node.props as { children?: React.ReactNode }).children);
    }
    return '';
  };

  const rawCode = extractText(children).replace(/\n$/, '');
  const [editValue, setEditValue] = useState(rawCode);

  // Extract language from className (e.g., 'language-typescript' -> 'typescript')
  const match = /language-(\w+)/.exec(className);
  const language = match ? match[1] : 'code';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSave = () => {
    if (startLine && endLine && onUpdateBlock) {
      const languageTag = match ? match[1] : '';
      const formattedBlock = `\`\`\`${languageTag}\n${editValue}\n\`\`\``;
      onUpdateBlock(startLine, endLine, formattedBlock);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(rawCode);
    setIsEditing(false);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <div className="code-block-actions">
          {onUpdateBlock && (isInlineEditMode || startLine) && (
            <button
              className={`code-action-btn ${isEditing ? 'active' : ''}`}
              onClick={() => {
                if (isEditing) handleCancel();
                else {
                  setEditValue(rawCode);
                  setIsEditing(true);
                }
              }}
              title={isEditing ? 'Cancel Edit' : 'Edit Code'}
            >
              {isEditing ? <X size={14} /> : <Edit3 size={14} />}
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          )}

          {isEditing && (
            <button className="code-action-btn primary" onClick={handleSave} title="Save Code">
              <Check size={14} />
              <span>Save</span>
            </button>
          )}

          <button className="code-action-btn" onClick={handleCopy} title="Copy code">
            {copied ? <Check size={14} color="var(--accent-hover)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="code-block-editor">
          <textarea
            className="code-textarea"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={Math.max(3, editValue.split('\n').length + 1)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleCancel();
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
            }}
          />
        </div>
      ) : (
        <pre className={className}>
          <code className={className}>{children}</code>
        </pre>
      )}
    </div>
  );
};
