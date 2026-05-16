import React, { useEffect, useRef } from "react";

function drawPetal(ctx, x, y, size, rotation, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;

  // Petal shape: two bezier curves forming an oval with a pointed tip
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(
    size * 0.5, -size * 0.8,   // control 1
    size * 1.0, -size * 0.8,   // control 2
    size * 1.0, 0              // end point (tip)
  );
  ctx.bezierCurveTo(
    size * 1.0, size * 0.5,
    size * 0.5, size * 0.6,
    0, 0
  );
  ctx.closePath();

  // Fill: petal has a gradient — lighter center, deeper edge
  const grad = ctx.createRadialGradient(
    size * 0.4, -size * 0.1, 0,
    size * 0.4, -size * 0.1, size * 1.1
  );
  grad.addColorStop(0, 'rgba(255, 220, 230, 0.9)');
  grad.addColorStop(0.6, 'rgba(255, 170, 195, 0.7)');
  grad.addColorStop(1, 'rgba(220, 100, 140, 0.3)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Petal vein — single thin line from base to tip
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.95, 0);
  ctx.strokeStyle = 'rgba(200, 100, 130, 0.2)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.restore();
}

class Petal {
  constructor(canvasWidth, canvasHeight, startAbove = true) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = Math.random() * canvasWidth;
    this.y = startAbove ? Math.random() * -canvasHeight : Math.random() * canvasHeight;
    this.size = 6 + Math.random() * 8;        // 6–14px
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.04;  // Slow, natural tumble
    this.speedY = 0.4 + Math.random() * 0.8;  // Gentle fall speed
    this.speedX = (Math.random() - 0.5) * 0.3; // Slight lateral drift
    this.swayAmplitude = 20 + Math.random() * 30;  // How wide the sway is
    this.swaySpeed = 0.008 + Math.random() * 0.012; // How fast the sway cycles
    this.swayOffset = Math.random() * Math.PI * 2;   // Phase offset
    this.opacity = 0.4 + Math.random() * 0.6;
    this.time = 0;
    this.depth = 0.4 + Math.random() * 0.6; // Parallax depth layer
  }

  update(windStrength = 0) {
    this.time += 1;
    this.y += this.speedY * this.depth;
    this.x += this.speedX + windStrength;
    // Sway: sinusoidal drift on X axis
    this.x += Math.sin(this.time * this.swaySpeed + this.swayOffset) * 0.3;
    this.rotation += this.rotationSpeed;
    // Depth-based opacity fade — closer petals slightly more opaque
    this.currentOpacity = this.opacity * (0.7 + this.depth * 0.3);

    // Reset if out of bounds
    if (this.y > this.canvasHeight + 50 || this.x < -100 || this.x > this.canvasWidth + 100) {
      this.y = -50 - Math.random() * 50;
      this.x = Math.random() * this.canvasWidth;
    }
  }

  draw(ctx) {
    drawPetal(ctx, this.x, this.y, this.size, this.rotation, this.currentOpacity);
  }
}

export default function CanvasBackground({ intensity = 120, zenMode = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;
    let DPR = window.devicePixelRatio || 1;
    
    let targetPetalCount = zenMode ? 40 : intensity;
    let currentPetalCount = targetPetalCount;
    let petals = [];
    let raf = null;

    let windStrength = 0;
    let windTarget = 0;
    let lastWindChange = performance.now();

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function init() {
      petals = Array.from({ length: targetPetalCount }, () => new Petal(width, height, false));
    }

    let t0 = performance.now();
    function step(t) {
      const dt = (t - t0) / 1000;
      
      // Skip huge delta times (e.g. tab backgrounded)
      if (dt > 0.1) {
        t0 = t;
        raf = requestAnimationFrame(step);
        return;
      }
      t0 = t;

      // Wind system update
      if (t - lastWindChange > 8000 + Math.random() * 7000) {
        windTarget = (Math.random() - 0.5) * 0.4;
        lastWindChange = t;
      }
      windStrength += (windTarget - windStrength) * 0.01;

      // Smoothly interpolate petal count
      targetPetalCount = zenMode ? 40 : intensity;
      if (currentPetalCount < targetPetalCount) {
        currentPetalCount += 1;
        petals.push(new Petal(width, height, true));
      } else if (currentPetalCount > targetPetalCount) {
        currentPetalCount -= 1;
        petals.pop();
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < petals.length; i++) {
        petals[i].update(windStrength);
        petals[i].draw(ctx);
      }

      raf = requestAnimationFrame(step);
    }

    resize();
    init();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [intensity, zenMode]);

  return <canvas id="sakura-canvas" ref={ref} aria-hidden />;
}
