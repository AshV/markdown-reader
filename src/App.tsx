import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { BookOpen, FileEdit, FileUp, Download, Sparkles } from 'lucide-react';
import './App.css';

const DEFAULT_MARKDOWN = `# Welcome to Markdown Reader ✨

A stunning, highly-responsive Markdown reader web application.

## Features Supported

- **GitHub Flavored Markdown** via \`remark-gfm\`
- **Code Syntax Highlighting** via \`rehype-highlight\`
- **Math Equations** via \`remark-math\` & \`rehype-katex\`

### Code Example

\`\`\`javascript
function calculateAwesomeness(user) {
  return user.wantsAwesomeUI ? Infinity : 100;
}
\`\`\`

### Math Example

The beautiful equation:
$$ E = mc^2 $$

Or inline: $a^2 + b^2 = c^2$

### Tables

| Feature | Status |
|---------|--------|
| Reader  | Awesome|
| Editor  | Sleek  |

> "The best way to read markdown is with a beautiful UI." - Markdown Reader
`;

function App() {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="app-container">
      <header className="toolbar glass-panel">
        <div className="toolbar-left">
          <div className="logo">
            <Sparkles size={24} color="var(--accent-color)" />
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
          
          <button className="btn" onClick={handleDownload} title="Save File">
            <Download size={18} />
            <span>Save</span>
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--panel-border)', margin: '0 8px' }}></div>

          <button 
            className={`btn ${!isEditing ? 'active' : ''}`} 
            onClick={() => setIsEditing(false)}
          >
            <BookOpen size={18} />
            <span>Read</span>
          </button>
          <button 
            className={`btn ${isEditing ? 'active' : ''}`} 
            onClick={() => setIsEditing(true)}
          >
            <FileEdit size={18} />
            <span>Edit</span>
          </button>
        </div>
      </header>

      <main className="content-area">
        {isEditing ? (
          <div className="pane glass-panel">
            <textarea
              className="editor"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type or paste your Markdown here..."
              autoFocus
            />
          </div>
        ) : (
          <div className="pane glass-panel preview-container">
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
