import React, { useState } from 'react';
import {
  Plus,
  Heading1,
  Heading2,
  CheckSquare,
  Code,
  Table as TableIcon,
  Quote,
  Minus,
  Sigma,
  AlignLeft,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface QuickInsertBarProps {
  onInsertBlock: (blockContent: string) => void;
}

export const QuickInsertBar: React.FC<QuickInsertBarProps> = ({ onInsertBlock }) => {
  const [isOpen, setIsOpen] = useState(false);

  const insertOptions = [
    {
      label: 'Heading 1',
      icon: <Heading1 size={16} />,
      content: '# New Section Heading\n'
    },
    {
      label: 'Heading 2',
      icon: <Heading2 size={16} />,
      content: '## Sub-heading\n'
    },
    {
      label: 'Paragraph',
      icon: <AlignLeft size={16} />,
      content: 'Enter your new paragraph content here...\n'
    },
    {
      label: 'Task List',
      icon: <CheckSquare size={16} />,
      content: '- [ ] First task\n- [ ] Second task\n- [x] Completed task\n'
    },
    {
      label: 'Code Block',
      icon: <Code size={16} />,
      content: '```typescript\n// Write code here\nconsole.log("Hello, world!");\n```\n'
    },
    {
      label: 'Table',
      icon: <TableIcon size={16} />,
      content: '| Column 1 | Column 2 | Column 3 |\n| :--- | :---: | ---: |\n| Item 1 | Details | $10 |\n| Item 2 | Details | $20 |\n'
    },
    {
      label: 'Quote',
      icon: <Quote size={16} />,
      content: '> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra\n'
    },
    {
      label: 'Math (LaTeX)',
      icon: <Sigma size={16} />,
      content: '$$\nE = mc^2\n$$\n'
    },
    {
      label: 'Divider',
      icon: <Minus size={16} />,
      content: '---\n'
    }
  ];

  return (
    <div className="quick-insert-wrapper glass-panel">
      <button
        className="quick-insert-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Collapse Insert Menu" : "Insert Markdown Block"}
      >
        <Plus size={16} className={`insert-icon ${isOpen ? 'rotated' : ''}`} />
        <span>Add Block</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {isOpen && (
        <div className="quick-insert-grid animate-fade-in">
          {insertOptions.map((item, index) => (
            <button
              key={index}
              className="quick-insert-item"
              onClick={() => {
                onInsertBlock(item.content);
                setIsOpen(false);
              }}
            >
              <div className="quick-insert-icon">{item.icon}</div>
              <span className="quick-insert-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
