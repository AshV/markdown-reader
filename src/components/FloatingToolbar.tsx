import React, { useEffect, useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Quote,
  Copy,
  Check,
  Edit3,
  X
} from 'lucide-react';

interface FloatingToolbarProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onFormatSelection: (formatType: 'bold' | 'italic' | 'strike' | 'code' | 'h1' | 'h2' | 'quote' | 'link' | 'math') => void;
  onEditActiveBlock?: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  containerRef,
  onFormatSelection,
  onEditActiveBlock
}) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Don't close if interacting inside the floating toolbar
      if (
        toolbarRef.current &&
        document.activeElement &&
        toolbarRef.current.contains(document.activeElement)
      ) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current) {
        if (!showLinkInput) {
          setPosition(null);
          setSelectedText('');
        }
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        if (!showLinkInput) {
          setPosition(null);
          setSelectedText('');
        }
        return;
      }

      // Check if selection is within the reader container
      const range = selection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        if (!showLinkInput) {
          setPosition(null);
        }
        return;
      }

      const rect = range.getBoundingClientRect();
      setSelectedText(text);

      // Position toolbar above the selection
      const top = Math.max(10, rect.top - 50 + window.scrollY);
      const left = Math.max(10, rect.left + rect.width / 2);

      setPosition({ top, left });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [containerRef, showLinkInput]);

  const handleCopy = async () => {
    if (!selectedText) return;
    try {
      await navigator.clipboard.writeText(selectedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  const handleApplyLink = () => {
    if (linkUrl) {
      onFormatSelection('link');
      setShowLinkInput(false);
      setLinkUrl('');
      setPosition(null);
    }
  };

  if (!position) return null;

  return (
    <div
      ref={toolbarRef}
      className="floating-toolbar glass-panel animate-pop"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 100
      }}
      onMouseDown={(e) => {
        // Prevent losing selection on click
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
        }
      }}
    >
      {showLinkInput ? (
        <div className="toolbar-link-input-group">
          <input
            type="url"
            className="toolbar-input"
            placeholder="Enter URL (e.g. https://...)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyLink();
              if (e.key === 'Escape') setShowLinkInput(false);
            }}
            autoFocus
          />
          <button className="tool-btn" onClick={handleApplyLink} title="Apply Link">
            <Check size={14} />
          </button>
          <button className="tool-btn" onClick={() => setShowLinkInput(false)} title="Cancel">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="toolbar-actions">
          <button
            className="tool-btn"
            onClick={() => onFormatSelection('bold')}
            title="Bold (**text**)"
          >
            <Bold size={15} />
          </button>
          <button
            className="tool-btn"
            onClick={() => onFormatSelection('italic')}
            title="Italic (*text*)"
          >
            <Italic size={15} />
          </button>
          <button
            className="tool-btn"
            onClick={() => onFormatSelection('strike')}
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough size={15} />
          </button>
          <button
            className="tool-btn"
            onClick={() => onFormatSelection('code')}
            title="Inline Code (`code`)"
          >
            <Code size={15} />
          </button>
          <button
            className="tool-btn"
            onClick={() => setShowLinkInput(true)}
            title="Insert Link"
          >
            <LinkIcon size={15} />
          </button>

          <div className="tool-divider" />

          <button
            className="tool-btn"
            onClick={() => onFormatSelection('h1')}
            title="Heading 1"
          >
            <Heading1 size={15} />
          </button>
          <button
            className="tool-btn"
            onClick={() => onFormatSelection('h2')}
            title="Heading 2"
          >
            <Heading2 size={15} />
          </button>
          <button
            className="tool-btn"
            onClick={() => onFormatSelection('quote')}
            title="Quote (> text)"
          >
            <Quote size={15} />
          </button>

          <div className="tool-divider" />

          <button
            className="tool-btn"
            onClick={handleCopy}
            title={isCopied ? "Copied!" : "Copy selected text"}
          >
            {isCopied ? <Check size={15} color="var(--accent-hover)" /> : <Copy size={15} />}
          </button>

          {onEditActiveBlock && (
            <button
              className="tool-btn highlight"
              onClick={() => {
                onEditActiveBlock();
                setPosition(null);
              }}
              title="Edit this block in-place"
            >
              <Edit3 size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
