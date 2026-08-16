import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Trash2 } from 'lucide-react';

interface InlineBlockEditorProps {
  tag: string;
  startLine: number;
  endLine: number;
  initialText: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export const InlineBlockEditor: React.FC<InlineBlockEditorProps> = React.memo(({
  tag,
  startLine,
  endLine,
  initialText,
  onSave,
  onCancel,
  onDelete
}) => {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = `${Math.max(70, textareaRef.current.scrollHeight)}px`;
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const target = e.target;
    if (target.scrollHeight > target.clientHeight) {
      target.style.height = `${target.scrollHeight}px`;
    }
  };

  return (
    <div className="inline-block-editor glass-panel">
      <div className="inline-block-editor-header">
        <span className="block-type-tag">
          Editing {tag.toUpperCase()} (Lines {startLine}-{endLine})
        </span>
        <div className="block-editor-actions">
          <button
            className="tool-btn highlight"
            onClick={() => onSave(text)}
            title="Save (Ctrl+Enter)"
          >
            <Check size={14} />
            <span>Save</span>
          </button>
          <button className="tool-btn" onClick={onCancel} title="Cancel (Esc)">
            <X size={14} />
            <span>Cancel</span>
          </button>
          <button className="tool-btn danger" onClick={onDelete} title="Delete Block">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="inline-block-textarea"
        value={text}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onCancel();
          }
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || tag.startsWith('h'))) {
            e.preventDefault();
            onSave(text);
          }
        }}
        autoFocus
      />
      <div className="block-editor-footer">
        <small>
          Tip: Press <strong>{tag.startsWith('h') ? 'Enter' : 'Ctrl+Enter'}</strong> to save,{' '}
          <strong>Esc</strong> to cancel
        </small>
      </div>
    </div>
  );
});
