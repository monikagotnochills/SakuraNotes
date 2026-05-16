import React, { useEffect, useRef, useState } from "react";

export default function MusicPlayer() {
    const [panelOpen, setPanelOpen] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    
    // Read from localStorage synchronously during init
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('sakura_music_volume');
        return saved ? parseFloat(saved) : 0.35;
    });

    const audioRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        // Look for music.mp3 in the public folder
        audioRef.current = new Audio('/music.mp3');
        audioRef.current.loop = true;
        audioRef.current.preload = 'metadata';
        audioRef.current.volume = volume;
        audioRef.current.muted = muted;

        // Cleanup
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    // Global one-click autoplay listener
    useEffect(() => {
        const startAudio = () => {
            if (audioRef.current && audioRef.current.paused && !muted) {
                audioRef.current.play()
                    .then(() => setPlaying(true))
                    .catch(e => console.error("Autoplay prevented", e));
            }
            // Remove listener after first interaction
            document.removeEventListener('click', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };

        document.addEventListener('click', startAudio);
        document.addEventListener('touchstart', startAudio);

        return () => {
            document.removeEventListener('click', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };
    }, [muted]);

    // Sync volume to audio element
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            localStorage.setItem('sakura_music_volume', volume.toString());
        }
    }, [volume]);

    // Sync muted state
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = muted;
        }
    }, [muted]);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(e) {
            if (panelOpen && containerRef.current && !containerRef.current.contains(e.target)) {
                setPanelOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [panelOpen]);

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            audioRef.current.play().then(() => setPlaying(true)).catch(e => console.error("Play prevented", e));
        } else {
            audioRef.current.pause();
            setPlaying(false);
        }
    };

    const handleRestart = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0;
        if (audioRef.current.paused) {
            audioRef.current.play().then(() => setPlaying(true)).catch(e => console.error("Play prevented", e));
        }
    };

    const handleMuteToggle = () => {
        setMuted(!muted);
    };

    const handleVolumeChange = (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        setVolume(val);
        if (muted && val > 0) {
            setMuted(false);
        }
    };

    const pct = Math.round(volume * 100);

    return (
        <div ref={containerRef}>
            <button 
                className={`music-btn ${playing ? 'playing' : ''} ${muted ? 'muted' : ''}`} 
                onClick={() => setPanelOpen(!panelOpen)}
                title="Music controls"
                aria-label="Music controls"
            >
                {muted ? (
                    <span style={{ fontSize: '18px' }}>🔇</span>
                ) : (
                    <svg className="music-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                    </svg>
                )}
            </button>

            <div className={`music-panel ${panelOpen ? 'open' : ''}`}>
                <div className="music-track-info">
                    <div className={`music-disc ${playing ? 'spinning' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,200,220,0.6)">
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </div>
                    <div>
                        <div className="music-track-name">Bamboo Flute · Guzheng · Erhu</div>
                        <div className="music-track-artist">Japanese Instrumental</div>
                    </div>
                </div>

                <div className="music-controls-row">
                    <button className="music-ctrl-btn" title="Restart" onClick={handleRestart}>⏮</button>
                    <button className="music-play-btn" onClick={handlePlayPause}>
                        {playing ? '⏸' : '▶'}
                    </button>
                    <button className="music-ctrl-btn" title="Mute" onClick={handleMuteToggle}>
                        {muted ? '🔇' : '🔊'}
                    </button>
                </div>

                <div className="music-volume-row">
                    <span className="volume-icon">{muted ? '🔇' : '🔈'}</span>
                    <input 
                        type="range" 
                        className="volume-slider" 
                        min="0" max="100" step="1" 
                        value={pct} 
                        onChange={handleVolumeChange}
                        style={{ '--vol-pct': `${pct}%` }}
                    />
                    <span className="volume-pct-label">{pct}%</span>
                </div>

                <div className="music-loop-row">
                    <span className="music-loop-label">LOOP</span>
                    <span className="music-loop-badge">∞ ON</span>
                </div>
            </div>
        </div>
    );
}
