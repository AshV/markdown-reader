import { useState, useRef, useEffect, useMemo, useCallback, type ChangeEvent } from 'react';
import {
  FileUp,
  Download,
  Sun,
  Moon,
  ClipboardPaste,
  Columns,
  Edit3,
  BookOpen,
  Trash2,
  GripVertical,
  Library
} from 'lucide-react';
import { ReaderView } from './components/ReaderView';
import { LocalDocLibrary } from './components/LocalDocLibrary';
import { getDocumentStats } from './utils/markdownUtils';
import './App.css';

const SESSION_KEY = 'md-reader-content';

function App() {
  const [markdown, setMarkdown] = useState<string>(() => {
    return sessionStorage.getItem(SESSION_KEY) ?? '';
  });
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'light';
  });
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const markdownRef = useRef(markdown);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => { markdownRef.current = markdown; }, [markdown]);

  // Persist to sessionStorage on every change
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, markdown);
  }, [markdown]);

  // ── Theme ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  // ── Split-view resizer ────────────────────────────────────────────────
  const handleResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !contentAreaRef.current) return;
      const rect = contentAreaRef.current.getBoundingClientRect();
      const rawPercent = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(Math.max(rawPercent, 20), 80));
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const stats = useMemo(() => getDocumentStats(markdown), [markdown]);

  // ── Download as .md ───────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [markdown]);

  // ── Split mode toggle ─────────────────────────────────────────────────
  const handleToggleSplitMode = useCallback(() => {
    setIsSplitMode((prev) => {
      const next = !prev;
      if (next) setIsInlineEditMode(false);
      return next;
    });
  }, []);

  // ── Global paste & keyboard shortcuts ────────────────────────────────
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const text = e.clipboardData?.getData('text');
      if (text) {
        if (markdownRef.current.trim() && !window.confirm('Replace existing content with clipboard text?')) return;
        setMarkdown(text);
        setIsInlineEditMode(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownload();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e' && !e.shiftKey) {
        if (!isInput && !isSplitMode) {
          e.preventDefault();
          setIsInlineEditMode((prev) => !prev);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDownload, isSplitMode]);

  // ── File upload ───────────────────────────────────────────────────────
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (markdown.trim() && !window.confirm(`Replace existing content with "${file.name}"?`)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setMarkdown(content);
        setIsInlineEditMode(false);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Paste from clipboard button ───────────────────────────────────────
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (markdown.trim() && !window.confirm('Replace existing content with clipboard text?')) return;
        setMarkdown(text);
        setIsInlineEditMode(false);
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      alert('Could not paste from clipboard. Please ensure you have granted clipboard permissions.');
    }
  };

  // ── Clear content ─────────────────────────────────────────────────────
  const handleClearContent = () => {
    if (markdown && window.confirm('Clear all content?')) {
      setMarkdown('');
    }
  };

  // ── Logo click → Read mode ────────────────────────────────────────────
  const handleLogoClick = useCallback(() => {
    setIsInlineEditMode(false);
    setIsSplitMode(false);
  }, []);

  return (
    <div className="app-container">
      {/* Top Navigation Toolbar */}
      <header className="toolbar glass-panel">
        <div className="toolbar-left">
          <button
            className="logo logo-btn"
            onClick={handleLogoClick}
            title="Back to Reader Mode"
          >
            <img
              src={`${import.meta.env.BASE_URL}icon.png`}
              alt="MD Reader Logo"
              width="26"
              height="26"
              style={{ borderRadius: '6px' }}
            />
            <span className="logo-text">MD Reader</span>
          </button>
        </div>

        <div className="toolbar-right">
          <input
            type="file"
            accept=".md,.txt,text/markdown,text/plain"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="file-input"
          />

          <button className="btn" onClick={() => fileInputRef.current?.click()} title="Open File (Ctrl+O)">
            <FileUp size={16} />
            <span>Open</span>
          </button>

          <button className="btn" onClick={handlePasteFromClipboard} title="Paste from Clipboard (Ctrl+V)">
            <ClipboardPaste size={16} />
            <span>Paste</span>
          </button>

          <button className="btn" onClick={handleDownload} title="Download as .md file (Ctrl+S)">
            <Download size={16} />
            <span>Save</span>
          </button>

          {/* Local Document Library */}
          <button
            className={`btn ${isLibraryOpen ? 'active' : ''}`}
            onClick={() => setIsLibraryOpen(true)}
            title="Open local document library"
          >
            <Library size={16} />
            <span>Library</span>
          </button>

          <div className="toolbar-separator" />

          {/* Inline Edit Mode Toggle - Hidden while in Split View */}
          {!isSplitMode && (
            <button
              className={`btn ${isInlineEditMode ? 'active' : ''}`}
              onClick={() => setIsInlineEditMode(!isInlineEditMode)}
              title={isInlineEditMode ? 'Switch to Read Mode (Ctrl+E)' : 'Switch to Inline Edit Mode (Ctrl+E)'}
            >
              {isInlineEditMode ? (
                <>
                  <BookOpen size={16} />
                  <span>Read</span>
                </>
              ) : (
                <>
                  <Edit3 size={16} />
                  <span>Inline Edit</span>
                </>
              )}
            </button>
          )}

          {/* Split Raw Editor Toggle */}
          <button
            className={`btn ${isSplitMode ? 'active' : ''}`}
            onClick={handleToggleSplitMode}
            title={isSplitMode ? 'Close Split Raw Editor' : 'Open Split Raw Editor'}
          >
            <Columns size={16} />
            <span>Split View</span>
          </button>

          <div className="toolbar-separator" />

          <button
            className="btn icon-only"
            onClick={handleClearContent}
            title="Clear Content"
          >
            <Trash2 size={16} />
          </button>

          <button
            className="btn icon-only"
            onClick={() => setIsLightMode(!isLightMode)}
            title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="content-area" ref={contentAreaRef}>
        {isSplitMode && (
          <>
            <div
              className="pane glass-panel raw-editor-pane animate-fade-in"
              style={{ width: `${splitPercent}%`, flex: 'none' }}
            >
              <div className="raw-editor-header">
                <span>Raw Markdown Source</span>
                <span className="raw-stats">{stats.lines} lines</span>
              </div>
              <textarea
                className="editor"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Type or paste your Markdown here..."
                autoFocus
              />
            </div>

            {/* Drag resizer */}
            <div
              className="split-resizer"
              onMouseDown={handleResizerMouseDown}
              title="Drag to resize"
            >
              <GripVertical size={14} />
            </div>
          </>
        )}

        <div className={`pane glass-panel preview-pane ${isSplitMode ? 'split-active' : ''}`}>
          <ReaderView
            markdown={markdown}
            onChangeMarkdown={setMarkdown}
            isInlineEditMode={isSplitMode ? false : isInlineEditMode}
            onToggleInlineEditMode={() => setIsInlineEditMode(!isInlineEditMode)}
          />
        </div>
      </main>

      {/* Bottom Status & Statistics Bar */}
      <footer className="statusbar glass-panel">
        <div className="statusbar-left">
          <span className="status-item">
            <strong>{stats.words}</strong> words
          </span>
          <span className="status-item">
            <strong>{stats.chars}</strong> chars
          </span>
          <span className="status-item">
            <strong>~{stats.readingTimeMinutes} min</strong> read
          </span>
        </div>

        <div className="statusbar-right">
          {isSplitMode ? (
            <span className="status-hint">
              💻 <strong>Split View:</strong> Edit raw markdown on the left, live preview on the right
            </span>
          ) : isInlineEditMode ? (
            <span className="status-hint">
              ✏️ <strong>Inline Edit Active:</strong> Hover over any block to edit, or select text to format
            </span>
          ) : (
            <span className="status-hint">
              📖 <strong>Reader Mode:</strong> Click <strong>Inline Edit</strong> in toolbar or press <strong>Ctrl+E</strong> to edit
            </span>
          )}
        </div>
      </footer>

      {/* Local Document Library Panel */}
      {isLibraryOpen && (
        <LocalDocLibrary
          currentContent={markdown}
          onOpen={(content) => {
            setMarkdown(content);
            setIsInlineEditMode(false);
          }}
          onClose={() => setIsLibraryOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
