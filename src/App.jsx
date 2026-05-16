import React, { useEffect, useMemo, useState, useRef } from "react";
import CanvasBackground from "./components/CanvasBackground";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Manual from "./components/Manual";
import MusicPlayer from "./components/MusicPlayer";
import useLocalStorage from "./hooks/useLocalStorage";

function createEmptyNote() {
    return {
        id: Date.now().toString(),
        title: "",
        content: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        tags: [],
        mood: "",
        locked: false,
        encrypted: null,
        timeCapsule: null,
        images: []
    };
}

function createEmptySection(title) {
    return {
        id: 'sec_' + Date.now().toString(),
        title,
        order: 1,
        collapsed: false,
        pages: []
    };
}

function createEmptyPage(title = "Untitled") {
    return {
        id: 'page_' + Date.now().toString(),
        title,
        body: "",
        images: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        author: "You"
    };
}

export default function App() {
    const [notes, setNotes] = useLocalStorage("sakura-notes.notes", [createEmptyNote()]);
    const [selectedId, setSelectedId] = useLocalStorage("sakura-notes.selected", notes[0]?.id ?? null);
    
    // Manual State
    const [manual, setManual] = useLocalStorage("sakura_manual", { sections: [] });
    const [selectedManualId, setSelectedManualId] = useLocalStorage("sakura_manual.selected", null);
    
    const [petalCount, setPetalCount] = useLocalStorage("sakura-notes.petalCount", 120);
    const [theme, setTheme] = useLocalStorage("sakura-notes.theme", "sakura");
    
    const [activeTab, setActiveTab] = useState("NOTES");
    const [zenMode, setZenMode] = useState(false);
    const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
    const [immersiveMode, setImmersiveMode] = useState(true);
    const [showImmersiveOverlay, setShowImmersiveOverlay] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showLighting, setShowLighting] = useState(false);

    useEffect(() => {
        // Ensure immersive state is set on the DOM immediately upon first load
        if (immersiveMode) {
            document.body.setAttribute('data-immersive', 'true');
        }
    }, []);

    const toggleImmersive = () => {
        if (!immersiveMode) {
            setImmersiveMode(true);
            setShowImmersiveOverlay(true);
            document.body.setAttribute('data-immersive', 'true');
        } else {
            exitImmersive();
        }
    };

    const exitImmersive = () => {
        setImmersiveMode(false);
        document.body.removeAttribute('data-immersive');
        setTimeout(() => setShowImmersiveOverlay(false), 280); // Wait for fade transition
    };

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape' && immersiveMode) {
                exitImmersive();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
                e.preventDefault();
                setQuickCaptureOpen((s) => !s);
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.code === "KeyZ" || e.key === "Z")) {
                e.preventDefault();
                setZenMode((s) => !s);
            }
            if ((e.ctrlKey || e.metaKey) && e.code === "KeyN") {
                e.preventDefault();
                if (activeTab === "NOTES") createNote();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [activeTab, immersiveMode]);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);

    // Derived state for Manual
    const selectedManualPage = useMemo(() => {
        for (const sec of manual.sections) {
            const page = sec.pages.find(p => p.id === selectedManualId);
            if (page) return { page, sectionTitle: sec.title };
        }
        return null;
    }, [manual, selectedManualId]);

    function createNote() {
        const n = createEmptyNote();
        setNotes((s) => [n, ...s]);
        setSelectedId(n.id);
        if (zenMode) setZenMode(false);
        if (mobileSidebarOpen) setMobileSidebarOpen(false);
    }

    function updateNote(updated) {
        setNotes((s) => s.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
    }

    function removeNote(id) {
        setNotes((s) => s.filter((n) => n.id !== id));
        if (selectedId === id) setSelectedId(null);
    }

    // Manual Handlers
    function createManualSection(title) {
        const sec = createEmptySection(title);
        setManual(prev => ({ ...prev, sections: [...prev.sections, sec] }));
    }

    function createManualPage(sectionId = null) {
        if (!sectionId && manual.sections.length === 0) {
            alert("Create a section first!");
            return;
        }
        const targetSecId = sectionId || manual.sections[0].id;
        const page = createEmptyPage();
        setManual(prev => ({
            ...prev,
            sections: prev.sections.map(sec => 
                sec.id === targetSecId ? { ...sec, pages: [...sec.pages, page] } : sec
            )
        }));
        setSelectedManualId(page.id);
        if (mobileSidebarOpen) setMobileSidebarOpen(false);
    }

    function updateManualPage(updatedPage) {
        setManual(prev => ({
            ...prev,
            sections: prev.sections.map(sec => ({
                ...sec,
                pages: sec.pages.map(p => p.id === updatedPage.id ? updatedPage : p)
            }))
        }));
    }

    function handleDragEnd(source, dest) {
        if (!source || !dest) return;
        
        setManual(prev => {
            const newSections = JSON.parse(JSON.stringify(prev.sections)); // deep copy

            if (source.type === 'section') {
                const srcIdx = newSections.findIndex(s => s.id === source.item.id);
                const destIdx = newSections.findIndex(s => s.id === dest.item.id);
                if (srcIdx < 0 || destIdx < 0) return prev;
                
                const [moved] = newSections.splice(srcIdx, 1);
                newSections.splice(destIdx, 0, moved);
            } 
            else if (source.type === 'page') {
                const srcSec = newSections.find(s => s.id === source.parentId);
                const destSec = newSections.find(s => s.id === dest.parentId);
                if (!srcSec || !destSec) return prev;

                const srcIdx = srcSec.pages.findIndex(p => p.id === source.item.id);
                const destIdx = destSec.pages.findIndex(p => p.id === dest.item.id);
                if (srcIdx < 0 || destIdx < 0) return prev;

                const [moved] = srcSec.pages.splice(srcIdx, 1);
                destSec.pages.splice(destIdx, 0, moved);
            }

            return { ...prev, sections: newSections };
        });
    }

    async function quickCapture(text) {
        if (!text.trim()) {
            setQuickCaptureOpen(false);
            return;
        }
        const n = createEmptyNote();
        n.content = text;
        n.title = text.split("\n")[0].slice(0, 60);
        setNotes((s) => [n, ...s]);
        setSelectedId(n.id);
        setActiveTab("NOTES");
        setQuickCaptureOpen(false);
    }

    return (
        <div className="app-root">
            <div id="bg-image" />
            <CanvasBackground intensity={petalCount} zenMode={zenMode} />
            <MusicPlayer />

            {showImmersiveOverlay && (
                <div id="immersive-overlay" className="immersive-overlay" onClick={exitImmersive}>
                    <div className="immersive-title">
                        <span className="immersive-kanji">桜</span>
                        <span className="immersive-name">SAKURA NOTES</span>
                        <span className="immersive-hint">click anywhere to return</span>
                    </div>
                </div>
            )}

            <div className={`ui-layer ${zenMode ? "zen" : ""} ${immersiveMode ? "immersive-active" : ""}`}>
                {/* Mobile overlay */}
                <div 
                    className={`mobile-overlay ${mobileSidebarOpen ? 'active' : ''}`} 
                    onClick={() => setMobileSidebarOpen(false)}
                />

                <Sidebar
                    isOpen={mobileSidebarOpen}
                    showLighting={showLighting}
                    setShowLighting={setShowLighting}
                    notes={notes}
                    selectedId={selectedId}
                    onSelect={(id) => { setSelectedId(id); setMobileSidebarOpen(false); }}
                    onCreate={createNote}
                    onDelete={removeNote}
                    petalCount={petalCount}
                    setPetalCount={setPetalCount}
                    theme={theme}
                    setTheme={setTheme}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    manualSections={manual.sections}
                    selectedManualId={selectedManualId}
                    onManualSelect={(id) => { setSelectedManualId(id); setMobileSidebarOpen(false); }}
                    onCreateManualSection={createManualSection}
                    onCreateManualPage={createManualPage}
                    onDragEnd={handleDragEnd}
                    immersiveMode={immersiveMode}
                    onToggleImmersive={toggleImmersive}
                />

                <main className={`content-area ${zenMode ? "zen" : ""}`} onClick={() => showLighting && setShowLighting(false)}>
                    <button className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>

                    {activeTab === "NOTES" ? (
                        <Editor
                            note={selectedNote}
                            onChange={updateNote}
                            onDelete={removeNote}
                            onTogglePin={(id) => {
                                setNotes((s) => {
                                    return s.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
                                });
                            }}
                            onCreate={createNote}
                            onSearchFocus={() => {
                                setMobileSidebarOpen(true);
                                setTimeout(() => document.querySelector('.search-bar input')?.focus(), 100);
                            }}
                            onToggleZenMode={() => setZenMode(!zenMode)}
                        />
                    ) : (
                        <Manual 
                            page={selectedManualPage?.page}
                            sectionTitle={selectedManualPage?.sectionTitle}
                            onChange={updateManualPage}
                        />
                    )}
                </main>
                
                <div className="zen-indicator">
                    ☁ {zenMode ? 40 : petalCount}
                </div>

                <div className={`quick-capture ${quickCaptureOpen ? "active" : ""}`}>
                    <QuickCapture 
                        onSave={quickCapture} 
                        onClose={() => setQuickCaptureOpen(false)} 
                        isActive={quickCaptureOpen}
                    />
                </div>
            </div>
        </div>
    );
}

function QuickCapture({ onSave, onClose, isActive }) {
    const [text, setText] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (isActive && inputRef.current) {
            inputRef.current.focus();
            setText("");
        }
    }, [isActive]);

    return (
        <div className="glass-modal quick-capture-panel">
            <textarea 
                ref={inputRef}
                className="quick-capture-textarea" 
                placeholder="Quick capture notes..." 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') onClose();
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onSave(text);
                }}
            />
            <div className="quick-capture-actions">
                <span className="hint-text">Esc to dismiss • Cmd+Enter to save</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={() => onSave(text)}>Save to Notes</button>
                </div>
            </div>
        </div>
    );
}
