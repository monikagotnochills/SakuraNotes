import React, { useState, useEffect } from "react";

export default function NoteCard({ note, selected, onClick, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Time formatter
  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} d ago`;
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    // Wait for the animation to finish before actually deleting
    setTimeout(() => {
      onDelete();
    }, 220); // 220ms is the base transition speed in CSS
  };

  const isNew = Date.now() - note.createdAt < 1000;

  return (
    <div 
      className={`note-item ${selected ? "active" : ""} ${isNew ? "new" : ""} ${isDeleting ? "deleting" : ""}`} 
      onClick={onClick}
    >
      <div className="note-item-top">
        {note.locked && <span className="note-item-mood">🔒</span>}
        {note.timeCapsule && <span className="note-item-mood">⏳</span>}
        {note.mood && <span className="note-item-mood">{note.mood}</span>}
        <span className="note-item-title">{note.title || "Untitled"}</span>
      </div>
      <div className="note-item-preview">
        {note.tags && note.tags.length > 0 && <span style={{marginRight: '6px'}}>[{note.tags[0]}]</span>}
        {(note.content || "").split('\n')[0].slice(0, 40) || "No content..."}
        <span style={{ float: 'right', paddingRight: '4px' }}>{timeAgo(note.updatedAt || note.createdAt)}</span>
      </div>
    </div>
  );
}
