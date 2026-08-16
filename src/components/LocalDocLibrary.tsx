import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, FolderOpen, Trash2, FileText, Clock, Plus } from 'lucide-react';
import {
  type SavedDoc,
  loadLibrary,
  persistLibrary,
  countWords,
  formatDate
} from '../utils/docLibrary';

interface LocalDocLibraryProps {
  currentContent: string;
  onOpen: (content: string) => void;
  onClose: () => void;
}

export const LocalDocLibrary: React.FC<LocalDocLibraryProps> = ({ currentContent, onOpen, onClose }) => {
  const [docs, setDocs] = useState<SavedDoc[]>(() => loadLibrary());
  const [saveName, setSaveName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [overwriteId, setOverwriteId] = useState<string | null>(null);

  useEffect(() => {
    setDocs(loadLibrary());
  }, []);

  const handleSave = useCallback(() => {
    const name = saveName.trim() || `Document ${new Date().toLocaleDateString()}`;
    const existing = docs.find(d => d.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setOverwriteId(existing.id);
      return;
    }
    const newDoc: SavedDoc = {
      id: crypto.randomUUID(),
      name,
      content: currentContent,
      savedAt: Date.now(),
      wordCount: countWords(currentContent),
    };
    const updated = [newDoc, ...docs];
    setDocs(updated);
    persistLibrary(updated);
    setSaveName('');
  }, [saveName, docs, currentContent]);

  const handleOverwriteConfirm = useCallback(() => {
    if (!overwriteId) return;
    const updated = docs.map(d =>
      d.id === overwriteId
        ? { ...d, content: currentContent, savedAt: Date.now(), wordCount: countWords(currentContent) }
        : d
    );
    setDocs(updated);
    persistLibrary(updated);
    setOverwriteId(null);
    setSaveName('');
  }, [overwriteId, docs, currentContent]);

  const handleDelete = useCallback((id: string) => {
    const updated = docs.filter(d => d.id !== id);
    setDocs(updated);
    persistLibrary(updated);
    setConfirmDeleteId(null);
  }, [docs]);

  const handleOpen = useCallback((doc: SavedDoc) => {
    if (currentContent.trim() && !window.confirm(`Replace current content with "${doc.name}"?`)) return;
    onOpen(doc.content);
    onClose();
  }, [currentContent, onOpen, onClose]);

  return (
    <div className="lib-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lib-panel glass-panel animate-fade-in">
        <div className="lib-header">
          <div className="lib-title">
            <FolderOpen size={18} />
            <span>Local Document Library</span>
            <span className="lib-count">{docs.length} doc{docs.length !== 1 ? 's' : ''}</span>
          </div>
          <button className="lib-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="lib-save-row">
          <div className="lib-save-input-wrap">
            <FileText size={14} className="lib-input-icon" />
            <input
              className="lib-name-input"
              type="text"
              placeholder="Document name (optional)"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              maxLength={80}
            />
          </div>
          <button
            className="lib-save-btn"
            onClick={handleSave}
            disabled={!currentContent.trim()}
            title="Save current document to library"
          >
            <Save size={14} />
            <span>Save Current</span>
          </button>
        </div>

        {overwriteId && (
          <div className="lib-confirm-bar">
            <span>A document with that name already exists. Overwrite it?</span>
            <div className="lib-confirm-actions">
              <button className="lib-btn-danger" onClick={handleOverwriteConfirm}>Overwrite</button>
              <button className="lib-btn-ghost" onClick={() => setOverwriteId(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="lib-list">
          {docs.length === 0 ? (
            <div className="lib-empty">
              <Plus size={32} strokeWidth={1.5} />
              <p>No saved documents yet.</p>
              <p className="lib-empty-sub">Save your current content above to get started.</p>
            </div>
          ) : (
            docs.map(doc => (
              <div key={doc.id} className="lib-item">
                <div className="lib-item-info">
                  <span className="lib-item-name">{doc.name}</span>
                  <div className="lib-item-meta">
                    <Clock size={11} />
                    <span>{formatDate(doc.savedAt)}</span>
                    <span className="lib-item-dot">·</span>
                    <span>{doc.wordCount} words</span>
                  </div>
                </div>

                <div className="lib-item-actions">
                  {confirmDeleteId === doc.id ? (
                    <>
                      <button className="lib-btn-danger" onClick={() => handleDelete(doc.id)}>Delete</button>
                      <button className="lib-btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button
                        className="lib-action-btn open"
                        onClick={() => handleOpen(doc)}
                        title="Open this document"
                      >
                        <FolderOpen size={13} />
                        <span>Open</span>
                      </button>
                      <button
                        className="lib-action-btn delete"
                        onClick={() => setConfirmDeleteId(doc.id)}
                        title="Delete this document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
