import React, { useEffect, useState } from "react";

export default function LightingPanel({ onClose }) {
    const [blur, setBlur] = useState(24);
    const [opacity, setOpacity] = useState(0.72);
    const [saturation, setSaturation] = useState(1.6);
    const [glow, setGlow] = useState(0.08);
    const [brightness, setBrightness] = useState(0.85);

    const updateVars = (b, o, s, g, br) => {
        const root = document.documentElement;
        // The spec asks to update specific things, mostly standardizing around these:
        // root.style.setProperty('--glass-blur', b + 'px');
        // Actually, we should just update CSS variables and let the CSS handle it, OR manually update.
        // Spec says:
        // blurSlider.addEventListener('input', e => {
        //   document.documentElement.style.setProperty('--glass-blur', e.target.value + 'px');
        //   document.querySelector('.sidebar').style.backdropFilter = `blur(${e.target.value}px) saturate(${satVal}) brightness(${brightVal})`;
        // });
        
        // It's cleaner to inject a dynamic style tag or set CSS variables that our components use.
        // Let's set global variables on root and use them.
        root.style.setProperty('--glass-blur', `${b}px`);
        root.style.setProperty('--glass-opacity', o);
        root.style.setProperty('--glass-sat', s);
        root.style.setProperty('--glass-glow', g);
        root.style.setProperty('--glass-bright', br);

        // We apply them directly to elements if needed, or better, we can just apply them to .sidebar and .content-area in a useEffect
        const sidebars = document.querySelectorAll('.sidebar, .glass-modal, .quick-capture-panel');
        sidebars.forEach(el => {
            el.style.backdropFilter = `blur(${b}px) saturate(${s}) brightness(${br})`;
            el.style.backgroundColor = `rgba(16, 6, 11, ${o})`;
            el.style.borderColor = `rgba(255, 180, 205, ${g})`;
        });
        const contents = document.querySelectorAll('.content-area');
        contents.forEach(el => {
            el.style.backdropFilter = `blur(${b}px) saturate(${s}) brightness(${br})`;
            el.style.backgroundColor = `rgba(20, 8, 14, ${o * 0.8})`; // slightly more transparent
        });
    };

    useEffect(() => {
        updateVars(blur, opacity, saturation, glow, brightness);
    }, [blur, opacity, saturation, glow, brightness]);

    const handleReset = () => {
        setBlur(24);
        setOpacity(0.72);
        setSaturation(1.6);
        setGlow(0.08);
        setBrightness(0.85);
    };

    return (
        <div className="lighting-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-ui)', color: 'var(--sakura-300)', fontWeight: 'bold' }}>LIGHTING CONTROLS</span>
                <button className="btn-icon" style={{ width: '20px', height: '20px', fontSize: '14px' }} onClick={onClose}>×</button>
            </div>

            <label>BLUR INTENSITY [{blur}px]</label>
            <input type="range" className="lighting-slider" min="0" max="60" value={blur} onChange={e => setBlur(Number(e.target.value))} />

            <label>PANEL OPACITY [{opacity.toFixed(2)}]</label>
            <input type="range" className="lighting-slider" min="0" max="1" step="0.01" value={opacity} onChange={e => setOpacity(Number(e.target.value))} />

            <label>SATURATION [{saturation.toFixed(1)}x]</label>
            <input type="range" className="lighting-slider" min="1" max="3" step="0.1" value={saturation} onChange={e => setSaturation(Number(e.target.value))} />

            <label>BORDER GLOW [{glow.toFixed(2)}]</label>
            <input type="range" className="lighting-slider" min="0" max="0.4" step="0.01" value={glow} onChange={e => setGlow(Number(e.target.value))} />

            <label>BRIGHTNESS [{brightness.toFixed(2)}]</label>
            <input type="range" className="lighting-slider" min="0.5" max="1.2" step="0.01" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />

            <button 
                className="btn-ghost" 
                style={{ width: '100%', fontSize: '10px', marginTop: '8px', border: '1px solid rgba(255,180,205,0.1)' }}
                onClick={handleReset}
            >
                [ RESET ]
            </button>
        </div>
    );
}
