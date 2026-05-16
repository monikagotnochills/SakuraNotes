import React, { useMemo, useState } from "react";
import NoteCard from "./NoteCard";
import LightingPanel from "./LightingPanel";

export default function Sidebar({ 
    isOpen,
    showLighting, setShowLighting,
    notes, selectedId, onSelect, onCreate, onDelete, 
    petalCount, setPetalCount, theme, setTheme,
    activeTab, onTabChange,
    manualSections = [], onManualSelect, selectedManualId,
    onCreateManualSection, onCreateManualPage, onDragEnd,
    immersiveMode, onToggleImmersive
}) {
    const [filter, setFilter] = useState("");

    const filtered = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return notes;
        return notes.filter((n) => (n.title + " " + (n.content || "")).toLowerCase().includes(q));
    }, [notes, filter]);

    const pinnedNotes = filtered.filter(n => n.pinned);
    const recentNotes = filtered.filter(n => !n.pinned && !n.archived);

    // Drag and Drop for Manual
    const [draggedItem, setDraggedItem] = useState(null);

    const handleDragStart = (e, item, type, parentId = null) => {
        e.dataTransfer.effectAllowed = "move";
        setDraggedItem({ item, type, parentId });
    };

    const handleDrop = (e, targetItem, type, parentId = null) => {
        e.preventDefault();
        if (!draggedItem) return;
        if (draggedItem.type === type && draggedItem.item.id !== targetItem.id) {
            onDragEnd(draggedItem, { item: targetItem, type, parentId });
        }
        setDraggedItem(null);
    };

    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [isAddingSection, setIsAddingSection] = useState(false);

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="brand">桜 SAKURA NOTES</h1>
                <button 
                    className="btn-icon" 
                    title={activeTab === 'NOTES' ? "New Note" : "New Page"} 
                    onClick={activeTab === 'NOTES' ? onCreate : () => onCreateManualPage()}
                    style={{ background: 'var(--sakura-500)', color: '#fff', width: '28px', height: '28px', fontSize: '18px', padding: 0, border: 'none', borderRadius: 'var(--radius-sm)' }}
                >
                    +
                </button>
            </div>

            <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input 
                    className="input-field" 
                    placeholder={activeTab === 'NOTES' ? "Search notes..." : "Search manuals..."} 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)} 
                    style={{ paddingLeft: '32px' }}
                />
            </div>

            <div style={{ display: 'flex', padding: '12px 16px', gap: '8px' }}>
                <button 
                    className={activeTab === "NOTES" ? "btn-primary" : "btn-ghost"} 
                    style={{ padding: '4px 12px', fontSize: '11px', flex: 1 }}
                    onClick={() => onTabChange("NOTES")}
                >
                    NOTES
                </button>
                <button 
                    className={activeTab === "MANUAL" ? "btn-primary" : "btn-ghost"} 
                    style={{ padding: '4px 12px', fontSize: '11px', flex: 1 }}
                    onClick={() => onTabChange("MANUAL")}
                >
                    MANUAL
                </button>
            </div>

            <div className="notes-list" style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === "NOTES" ? (
                    <>
                        {pinnedNotes.length > 0 && (
                            <>
                                <div className="notes-list-section">PINNED</div>
                                {pinnedNotes.map((n) => (
                                    <NoteCard key={n.id} note={n} selected={n.id === selectedId} onClick={() => onSelect(n.id)} onDelete={() => onDelete(n.id)} />
                                ))}
                            </>
                        )}
                        <div className="notes-list-section">RECENT</div>
                        {recentNotes.length === 0 ? (
                            <div className="empty-state" style={{ height: 'auto', padding: '32px 16px' }}>
                                <span className="empty-state-icon" style={{ fontSize: '32px' }}>🌸</span>
                                <div style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>No notes yet.<br/>Start writing. Press N.</div>
                            </div>
                        ) : (
                            recentNotes.map((n) => (
                                <NoteCard key={n.id} note={n} selected={n.id === selectedId} onClick={() => onSelect(n.id)} onDelete={() => onDelete(n.id)} />
                            ))
                        )}
                    </>
                ) : (
                    <div style={{ padding: '0 16px' }}>
                        <div className="notes-list-section" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            SECTIONS
                        </div>
                        {manualSections.map((sec) => (
                            <div 
                                key={sec.id} 
                                className="section-row"
                                draggable
                                onDragStart={(e) => handleDragStart(e, sec, 'section')}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, sec, 'section')}
                                style={{ marginBottom: '12px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sakura-300)', fontSize: '12px', fontWeight: 'bold', fontFamily: 'var(--font-ui)', marginBottom: '4px' }}>
                                    <span className="drag-handle">⠿</span>
                                    <span>▶ {sec.title}</span>
                                    <button className="btn-icon" style={{ marginLeft: 'auto', fontSize: '14px', width: '20px', height: '20px', opacity: 0, transition: 'opacity 120ms' }} 
                                        onClick={() => onCreateManualPage(sec.id)} title="Add Page">
                                        +
                                    </button>
                                </div>
                                <div style={{ paddingLeft: '16px' }}>
                                    {sec.pages.map(page => (
                                        <div 
                                            key={page.id} 
                                            className="manual-page-row"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, page, 'page', sec.id)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, page, 'page', sec.id)}
                                            style={{ 
                                                display: 'flex', alignItems: 'center', gap: '6px', 
                                                color: selectedManualId === page.id ? 'var(--sakura-400)' : 'var(--ink-secondary)',
                                                fontSize: '13px', padding: '4px 0', cursor: 'pointer' 
                                            }}
                                            onClick={() => onManualSelect(page.id)}
                                        >
                                            <span className="drag-handle" style={{ fontSize: '10px' }}>⠿</span>
                                            <span>▷ {page.title || "Untitled"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        {isAddingSection ? (
                            <input 
                                className="new-section-input" 
                                autoFocus
                                placeholder="Section title..." 
                                value={newSectionTitle}
                                onChange={e => setNewSectionTitle(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && newSectionTitle.trim()) {
                                        onCreateManualSection(newSectionTitle.trim());
                                        setNewSectionTitle("");
                                        setIsAddingSection(false);
                                    }
                                    if (e.key === 'Escape') setIsAddingSection(false);
                                }}
                                onBlur={() => setIsAddingSection(false)}
                            />
                        ) : (
                            <button className="btn-ghost" style={{ fontSize: '11px', width: '100%', marginTop: '8px' }} onClick={() => setIsAddingSection(true)}>
                                + Add Section
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="sidebar-bottom-toolbar">
                <button className="btn-icon" title={activeTab === 'NOTES' ? "New Note (N)" : "New Page"} onClick={activeTab === 'NOTES' ? onCreate : () => onCreateManualPage()}>
                    +
                </button>
                
                <div style={{ position: 'relative' }}>
                    <button className={`glass-toggle-btn ${immersiveMode ? 'glass-off' : ''}`} title="Immersive Mode" onClick={onToggleImmersive}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z M12 4v16 M4 12h16"/></svg>
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
                    <button className="btn-icon" style={{ fontSize: '14px' }} title="Lighting Controls" onClick={() => setShowLighting(!showLighting)}>
                        ⚙
                    </button>
                    {showLighting && <LightingPanel onClose={() => setShowLighting(false)} />}
                    <input 
                        type="range" 
                        min="40" 
                        max="300" 
                        value={petalCount} 
                        onChange={(e) => setPetalCount(Number(e.target.value))} 
                        style={{ width: '60px' }}
                        title="Petal Density"
                    />
                </div>
            </div>
        </aside>
    );
}
