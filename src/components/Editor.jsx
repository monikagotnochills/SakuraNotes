import React, { useEffect, useRef, useState } from "react";
import { encryptWithPassword, decryptWithPassword } from "../utils/crypto";
import FormattingToolbar from "./FormattingToolbar";

function blobToDataUrl(blob) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(blob);
    });
}

export default function Editor({ note, onChange, onDelete, onTogglePin, onCreate, onSearchFocus, onToggleZenMode }) {
    const [haikuMode, setHaikuMode] = useState(false);
    
    // Local state for auto-save logic
    const [localNote, setLocalNote] = useState(null);
    const [saveState, setSaveState] = useState('saved'); // 'saved', 'unsaved', 'saved-flash'
    const saveTimer = useRef(null);
    const textareaRef = useRef(null);

    // Sync localNote when switching notes
    useEffect(() => {
        setLocalNote(note);
        setSaveState('saved');
        if (saveTimer.current) clearTimeout(saveTimer.current);
    }, [note?.id]); // Only reset when ID changes, not on every prop change

    // Keyboard shortcut for saving
    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                triggerSave();
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [localNote]);

    if (!note || !localNote) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">桜</div>
                <div className="empty-state-title">SAKURA NOTES</div>
                <div style={{ color: 'var(--ink-secondary)', fontSize: '15px' }}>Select a note or create one.</div>
                <div className="empty-state-hints">
                    <button className="kbd-btn" onClick={onCreate}>
                        <span className="kbd-pill">Ctrl+N</span> New Note
                    </button>
                    <button className="kbd-btn" onClick={onSearchFocus}>
                        <span className="kbd-pill">/</span> Search
                    </button>
                    <button className="kbd-btn" onClick={onToggleZenMode}>
                        <span className="kbd-pill">Ctrl+Shift+Z</span> Zen Mode
                    </button>
                </div>
            </div>
        );
    }

    const markUnsaved = (updatedNote) => {
        setLocalNote(updatedNote);
        if (saveState !== 'unsaved') setSaveState('unsaved');
        
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            triggerSave(updatedNote);
        }, 3000);
    };

    const triggerSave = (noteToSave = localNote) => {
        if (!noteToSave) return;
        onChange({ ...noteToSave, updatedAt: Date.now() });
        setSaveState('saved-flash');
        setTimeout(() => setSaveState('saved'), 2000);
    };

    async function handleLock() {
        if (localNote.locked && localNote.encrypted) {
            const pass = prompt("Enter password to unlock");
            if (!pass) return;
            try {
                const plain = await decryptWithPassword(localNote.encrypted, pass);
                markUnsaved({ ...localNote, content: plain, locked: false, encrypted: null });
            } catch (e) {
                alert('Wrong password or decrypt error');
            }
            return;
        }

        const pass = prompt("Set a password to lock this note (will be used to encrypt)");
        if (!pass) return;
        try {
            const bundle = await encryptWithPassword(localNote.content || "", pass);
            markUnsaved({ ...localNote, content: "", locked: true, encrypted: bundle });
        } catch (e) {
            console.error(e);
            alert('Encryption failed');
        }
    }

    // Time formatter for metadata
    const formatDate = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const wordCount = (localNote.content || "").trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    // Haiku parsing
    const lines = (localNote.content || "").split('\n');
    const getSyllables = (text) => {
        const s = text.toLowerCase().replace(/[^a-z\s]/g, '');
        if (!s.trim()) return 0;
        const parts = s.split(/\s+/).map(word => {
            let w = word.replace(/e$/, '');
            const m = w.match(/[aeiouy]{1,2}/g);
            return m ? m.length : 1;
        });
        return parts.reduce((a, b) => a + b, 0);
    };

    // Paste handler for images
    const handlePaste = async (e) => {
        const items = Array.from(e.clipboardData.items || []);
        const imageItem = items.find(i => i.type.startsWith('image/'));
        if (!imageItem) return;

        e.preventDefault();
        const blob = imageItem.getAsFile();
        const dataUrl = await blobToDataUrl(blob);
        const newAttachments = [...(localNote.attachments || []), dataUrl];
        markUnsaved({ ...localNote, attachments: newAttachments });
    };

    const insertAtCursor = (text) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentVal = textarea.value;
        const newVal = currentVal.slice(0, start) + text + currentVal.slice(end);
        
        markUnsaved({ ...localNote, content: newVal });
        
        // Wait for render, then restore cursor
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
        
        markUnsaved({ ...localNote, content: newVal });
        
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = start + prefix.length;
            textarea.selectionEnd = end + prefix.length;
        }, 0);
    };

    // Extract legacy inline images and combine with attachments
    const extractImages = (content) => {
        const regex = /!\[.*?\]\((data:image\/.*?;base64,.*?)\)/g;
        const matches = [];
        let match;
        while ((match = regex.exec(content || "")) !== null) {
            matches.push(match[1]);
        }
        return matches;
    };
    const images = [...extractImages(localNote.content), ...(localNote.attachments || [])];

    const removeAttachment = (index) => {
        const legacyCount = extractImages(localNote.content).length;
        if (index < legacyCount) {
            let matchIndex = 0;
            const newContent = (localNote.content || "").replace(/!\[.*?\]\((data:image\/.*?;base64,.*?)\)/g, (match) => {
                if (matchIndex === index) {
                    matchIndex++;
                    return ""; // Remove the legacy image markdown!
                }
                matchIndex++;
                return match;
            });
            markUnsaved({ ...localNote, content: newContent });
            return;
        }
        const attachIndex = index - legacyCount;
        const newAttachments = [...(localNote.attachments || [])];
        newAttachments.splice(attachIndex, 1);
        markUnsaved({ ...localNote, attachments: newAttachments });
    };

    return (
        <div className="content-container">
            <div className="editor-header">
                <input 
                    className="note-title-input" 
                    value={localNote.title || ""} 
                    onChange={e => markUnsaved({ ...localNote, title: e.target.value })} 
                    placeholder="Untitled Note"
                />
                
                <div className="editor-metadata">
                    {localNote.tags && localNote.tags.length > 0 && (
                        <span>Tags: {localNote.tags.map(t => <span key={t} className="tag">{t}</span>)}</span>
                    )}
                    {localNote.mood && <span>Mood: {localNote.mood}</span>}
                    <span>{wordCount} words</span>
                    <span>{readTime} min read</span>
                    <span>{formatDate(localNote.updatedAt || localNote.createdAt)}</span>
                    
                    <div style={{ flex: 1 }} />
                    <button className="btn-ghost" onClick={() => setHaikuMode(!haikuMode)} style={{ padding: '2px 8px', fontSize: '10px' }}>
                        {haikuMode ? 'Haiku: ON' : 'Haiku: OFF'}
                    </button>
                    
                    <button 
                        className={`btn-save ${saveState === 'unsaved' ? 'unsaved' : ''}`}
                        style={{ opacity: saveState === 'saved' ? 0.45 : 1 }}
                        onClick={() => triggerSave()}
                    >
                        {saveState === 'saved-flash' ? '✓ SAVED' : 'SAVE'}
                    </button>

                    <button className="btn-icon" onClick={() => onTogglePin(localNote.id)} title="Pin">📌</button>
                    <button className="btn-icon" onClick={handleLock} title="Lock">🔒</button>
                    <button className="btn-icon" onClick={() => onDelete(localNote.id)} title="Delete">🗑️</button>
                </div>
                <hr className="editor-divider" />
            </div>

            <FormattingToolbar 
                textareaRef={textareaRef} 
                onInsert={insertAtCursor} 
                onWrap={wrapAtCursor} 
                onAddAttachment={(dataUrl) => {
                    const newAttachments = [...(localNote.attachments || []), dataUrl];
                    markUnsaved({ ...localNote, attachments: newAttachments });
                }}
            />

            {images.length > 0 && (
                <div className="image-preview-strip">
                    {images.map((src, i) => (
                        <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                            <img src={src} className="image-thumb" title="Attached Image" alt="thumb" />
                            <button 
                                className="btn-icon" 
                                style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(255,0,0,0.8)', color: 'white', padding: '2px', width: '20px', height: '20px', fontSize: '10px' }}
                                onClick={() => removeAttachment(i)}
                                title="Remove Image"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ position: 'relative', display: 'flex' }}>
                <textarea 
                    ref={textareaRef}
                    className="editor-body-textarea" 
                    value={localNote.content || ""} 
                    onChange={e => markUnsaved({ ...localNote, content: e.target.value })} 
                    onPaste={handlePaste}
                    placeholder="Start writing..."
                    spellCheck="false"
                />
                
                {haikuMode && (
                    <div style={{ position: 'absolute', right: 0, top: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column' }}>
                        {lines.map((line, i) => {
                            const syl = getSyllables(line);
                            const expected = i === 0 ? 5 : i === 1 ? 7 : i === 2 ? 5 : 0;
                            const isMatch = syl === expected && expected !== 0;
                            return (
                                <div key={i} className="haiku-line" style={{ height: '27.75px', paddingLeft: '16px' }}>
                                    {line.trim() && (
                                        <span className="haiku-badge" style={{ 
                                            color: isMatch ? 'var(--sakura-400)' : 'var(--ink-tertiary)',
                                            borderLeft: isMatch ? '2px solid var(--sakura-400)' : 'none',
                                            paddingLeft: '4px'
                                        }}>
                                            [{syl}]
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
