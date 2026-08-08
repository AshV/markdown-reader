import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { BookOpen, FileEdit, FileUp, Download, Sun, Moon, ClipboardPaste } from 'lucide-react';
import './App.css';

const DEFAULT_MARKDOWN = `# Hit Ctrl+V now 📋

_to Enjoy your distraction-free reading experience!_

### Optionally you can use the buttons in the top-right corner to

>**Open a file**: 

Click the **Open** button in the top right to select a local \`.md\` or \`.txt\` file from your computer.

>Or **Paste from clipboard** 📋

If haven't pressed Ctrl+V already. Click the **Paste** button to instantly view it here.

>You can **Edit directly** here ✍️

By switching to **Edit** mode using the toggle in the top right of this page.

>Maybe **Be a Batman** 🦇

By Clicking on **Moon** 🌙 in top right corner.

>Or prove that **You're not Drakula** 🧛

By Clicking on **Sun** 🌞 at exactly same place.

>Irrespective of that **Save your world(work)** 💾 eventually.

Built with ❤️ by [AshV](https://www.ashishvishwakarma.com/)`;

function App() {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') !== 'dark';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  // Handle global paste to update markdown
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if they are actively typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const text = e.clipboardData?.getData('text');
      if (text) {
        setMarkdown(text);
        setIsEditing(false); // Switch to reader mode on paste
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setMarkdown(content);
        setIsEditing(false); // Switch to view mode after opening
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be loaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMarkdown(text);
        setIsEditing(false); // Switch to reader mode on paste
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      alert('Could not paste from clipboard. Please ensure you have granted clipboard permissions.');
    }
  };

  return (
    <div className="app-container">
      <header className="toolbar glass-panel">
        <div className="toolbar-left">
          <div className="logo" style={{ marginRight: '1rem' }}>
            <img src={`${import.meta.env.BASE_URL}icon.png`} alt="MD Reader Logo" width="24" height="24" style={{ borderRadius: '4px' }} />
            <span>MD Reader</span>
          </div>
        </div>

        <div className="toolbar-right">
          <input
            type="file"
            accept=".md,.txt,text/markdown,text/plain"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="file-input"
          />
          <button className="btn" onClick={() => fileInputRef.current?.click()} title="Open File">
            <FileUp size={18} />
            <span>Open</span>
          </button>

          <button className="btn" onClick={handlePasteFromClipboard} title="Paste from Clipboard">
            <ClipboardPaste size={18} />
            <span>Paste</span>
          </button>

          <button className="btn" onClick={handleDownload} title="Save File">
            <Download size={18} />
            <span>Save</span>
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--panel-border)', margin: '0 8px' }}></div>

          <button
            className="btn active"
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? "Switch to Read Mode" : "Switch to Edit Mode"}
          >
            {isEditing ? (
              <>
                <BookOpen size={18} />
                <span>Read</span>
              </>
            ) : (
              <>
                <FileEdit size={18} />
                <span>Edit</span>
              </>
            )}
          </button>

          <button
            className="btn"
            onClick={() => setIsLightMode(!isLightMode)}
            title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
            style={{ padding: '0.5rem', borderRadius: '50%' }}
          >
            {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main className="content-area">
        {isEditing && (
          <div className="pane glass-panel">
            <textarea
              className="editor"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type or paste your Markdown here..."
              autoFocus
            />
          </div>
        )}
        <div className={`pane glass-panel preview-container ${isEditing ? 'hide-on-mobile' : ''}`}>
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
