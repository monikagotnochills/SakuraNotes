import React, { useState, useRef } from "react";
import EmojiPicker from "./EmojiPicker";

export default function FormattingToolbar({ 
    textareaRef, 
    onInsert, // function(textToInsert, cursorOffset)
    onWrap, // function(prefix, suffix)
    showPreviewToggle, 
    isPreview, 
    onTogglePreview 
}) {
    const [showEmoji, setShowEmoji] = useState(false);
    const fileInputRef = useRef(null);

    const handleWrap = (prefix, suffix) => {
        onWrap(prefix, suffix);
    };

    const handleEmojiSelect = (emoji) => {
        onInsert(emoji);
        setShowEmoji(false);
    };

    const handleImageClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            onInsert(`\n![${file.name}](${ev.target.result})\n`);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // reset
    };

    const handleLink = () => {
        const url = prompt("Enter link URL:");
        if (url) {
            onWrap("[", `](${url})`);
        }
    };

    return (
        <div className="formatting-toolbar">
            <button className="btn-icon" onClick={() => handleWrap('**', '**')} title="Bold" style={{ fontWeight: 'bold' }}>B</button>
            <button className="btn-icon" onClick={() => handleWrap('*', '*')} title="Italic" style={{ fontStyle: 'italic' }}>I</button>
            <button className="btn-icon" onClick={() => handleWrap('# ', '')} title="Heading 1" style={{ fontSize: '13px', fontWeight: 'bold' }}>H1</button>
            <button className="btn-icon" onClick={() => handleWrap('## ', '')} title="Heading 2" style={{ fontSize: '12px', fontWeight: 'bold' }}>H2</button>
            <button className="btn-icon" onClick={() => handleWrap('`', '`')} title="Code" style={{ fontFamily: 'monospace' }}>{'<>'}</button>
            <button className="btn-icon" onClick={() => handleWrap('> ', '')} title="Quote" style={{ fontSize: '16px' }}>❝</button>
            <button className="btn-icon" onClick={handleLink} title="Link">🔗</button>
            
            <button className="btn-icon" onClick={handleImageClick} title="Image Attachment">🖼</button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
            
            <div style={{ position: 'relative' }}>
                <button className="btn-icon" onClick={() => setShowEmoji(!showEmoji)} title="Emoji">😊</button>
                {showEmoji && <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />}
            </div>

            {showPreviewToggle && (
                <>
                    <div style={{ borderLeft: '1px solid rgba(255,180,205,0.1)', height: '18px', margin: '0 8px' }} />
                    <div className="preview-toggle">
                        <button className={!isPreview ? "active" : ""} onClick={() => onTogglePreview(false)}>EDIT</button>
                        <button className={isPreview ? "active" : ""} onClick={() => onTogglePreview(true)}>PREVIEW</button>
                    </div>
                </>
            )}
        </div>
    );
}
