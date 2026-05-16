import React, { useEffect, useRef, useState } from "react";
import FormattingToolbar from "./FormattingToolbar";
import { marked } from "marked";

function blobToDataUrl(blob) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(blob);
    });
}

function exportMarkdown(page) {
    const blob = new Blob([page.body], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Manual({ page, sectionTitle, onChange }) {
    const [localPage, setLocalPage] = useState(null);
    const [saveState, setSaveState] = useState('saved');
    const [isPreview, setIsPreview] = useState(false);
    const saveTimer = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        setLocalPage(page);
        setSaveState('saved');
        setIsPreview(false);
        if (saveTimer.current) clearTimeout(saveTimer.current);
    }, [page?.id]);

    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                triggerSave();
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [localPage]);

    if (!page || !localPage) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📖</div>
                <div className="empty-state-title">MANUAL BUILDER</div>
                <div style={{ color: 'var(--ink-secondary)', fontSize: '15px' }}>Select a manual page or create one.</div>
            </div>
        );
    }

    const markUnsaved = (updatedPage) => {
        setLocalPage(updatedPage);
        if (saveState !== 'unsaved') setSaveState('unsaved');
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => triggerSave(updatedPage), 3000);
    };

    const triggerSave = (pageToSave = localPage) => {
        if (!pageToSave) return;
        onChange({ ...pageToSave, updatedAt: Date.now() });
        setSaveState('saved-flash');
        setTimeout(() => setSaveState('saved'), 2000);
    };

    // Extract Headings for TOC
    const headings = [];
    if (isPreview && localPage.body) {
        const regex = /^(#{1,3})\s+(.*)$/gm;
        let match;
        while ((match = regex.exec(localPage.body)) !== null) {
            headings.push({ level: match[1].length, text: match[2] });
        }
    }

    const readTime = Math.max(1, Math.ceil((localPage.body || "").split(/\s+/).filter(Boolean).length / 200));

    const handlePaste = async (e) => {
        const items = Array.from(e.clipboardData.items || []);
        const imageItem = items.find(i => i.type.startsWith('image/'));
        if (!imageItem) return;
        e.preventDefault();
        const blob = imageItem.getAsFile();
        const dataUrl = await blobToDataUrl(blob);
        insertAtCursor(`\n![image](${dataUrl})\n`);
    };

    const insertAtCursor = (text) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentVal = textarea.value;
        const newVal = currentVal.slice(0, start) + text + currentVal.slice(end);
        markUnsaved({ ...localPage, body: newVal });
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
        }, 0);
    };

    const wrapAtCursor = (prefix, suffix) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentVal = textarea.value;
        const selectedText = currentVal.substring(start, end);
        const newVal = currentVal.slice(0, start) + prefix + selectedText + suffix + currentVal.slice(end);
        markUnsaved({ ...localPage, body: newVal });
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = start + prefix.length;
            textarea.selectionEnd = end + prefix.length;
        }, 0);
    };

    return (
        <div className="content-container" style={{ position: 'relative' }}>
            {isPreview && headings.length >= 3 && (
                <div className="manual-toc">
                    <div className="toc-label">TABLE OF CONTENTS</div>
                    {headings.map((h, i) => (
                        <span key={i} className={`toc-item ${h.level > 1 ? 'h2' : ''}`}>{h.text}</span>
                    ))}
                </div>
            )}

            <div className="editor-header" style={{ paddingBottom: '0' }}>
                <div style={{ fontSize: '11px', color: 'var(--sakura-300)', fontFamily: 'var(--font-ui)', marginBottom: '8px' }}>
                    {sectionTitle} {'>'} {localPage.title || "Untitled"}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                        className="note-title-input" 
                        value={localPage.title || ""} 
                        onChange={e => markUnsaved({ ...localPage, title: e.target.value })} 
                        placeholder="Page Title"
                        style={{ fontSize: '28px', flex: 1 }}
                    />
                    <button className="btn-ghost" onClick={() => exportMarkdown(localPage)} style={{ fontSize: '10px' }}>
                        ↓ EXPORT
                    </button>
                </div>
                
                <div className="editor-metadata" style={{ marginTop: '8px', paddingBottom: '12px' }}>
                    <span>Last edited: {new Date(localPage.updatedAt).toLocaleDateString()}</span>
                    <span>{localPage.author || 'You'}</span>
                    <span>{readTime} min read</span>
                    
                    <div style={{ flex: 1 }} />
                    <button 
                        className={`btn-save ${saveState === 'unsaved' ? 'unsaved' : ''}`}
                        style={{ opacity: saveState === 'saved' ? 0.45 : 1 }}
                        onClick={() => triggerSave()}
                    >
                        {saveState === 'saved-flash' ? '✓ SAVED' : 'SAVE'}
                    </button>
                </div>
            </div>

            <FormattingToolbar 
                textareaRef={textareaRef} 
                onInsert={insertAtCursor} 
                onWrap={wrapAtCursor} 
                showPreviewToggle={true}
                isPreview={isPreview}
                onTogglePreview={setIsPreview}
            />

            <div style={{ position: 'relative', display: 'flex', flex: 1 }}>
                {isPreview ? (
                    <div 
                        className="manual-preview" 
                        style={{ padding: '0 40px 100px 0', flex: 1, overflowY: 'auto' }}
                        dangerouslySetInnerHTML={{ __html: marked.parse(localPage.body || "") }} 
                    />
                ) : (
                    <textarea 
                        ref={textareaRef}
                        className="editor-body-textarea" 
                        value={localPage.body || ""} 
                        onChange={e => markUnsaved({ ...localPage, body: e.target.value })} 
                        onPaste={handlePaste}
                        placeholder="Write documentation..."
                        spellCheck="false"
                        style={{ paddingRight: '40px' }}
                    />
                )}
            </div>
        </div>
    );
}
