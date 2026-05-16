# 🌸 Sakura Notes
https://sakura-notes.vercel.app/

## 📖 The Story

I was honestly just so incredibly bored with the current ecosystem of note-taking web apps. Everywhere you look, it's the same sterile, minimalist, boring black-and-white grids. I wanted something that actually feels *good* to use—something atmospheric, cinematic, and peaceful. 

So, I built **Sakura Notes**. 

Sakura Notes is a highly aesthetic, Japanese pixel-art inspired hybrid Markdown editor. It's designed to be a calming, immersive environment where you can actually enjoy the process of writing, complete with falling sakura petals, customizable lighting, and integrated lo-fi music.

---

## ✨ Features

- **Immersive Zen Mode**: Hide the UI and write distraction-free with falling sakura petals in the background.
- **Glassmorphism UI**: A stunning, frosted-glass design system that feels premium and responsive.
- **Dynamic Lighting Panel**: Adjust screen brightness and petal density on the fly without leaving the editor.
- **Rich Markdown Editor**: Write in markdown with an intuitive formatting toolbar, image attachments, and word count/read time metrics.
- **Haiku Mode**: A fun, built-in syllable counter to help you write perfect 5-7-5 haikus.
- **Note Locking & Encryption**: Secure your most private thoughts using Web Crypto API AES-GCM encryption.
- **Integrated Lo-Fi Player**: Built-in background music player with volume control and auto-play to keep you in the zone.

---

## 🛠 Tech Stack

Sakura Notes is built from the ground up to be blazing fast, client-side only, and visually stunning.

### Core Architecture
- **React 18** - Component-based UI architecture.
- **Vite & Node.js** - Lightning-fast frontend build tooling and local development environment.
- **HTML5 Canvas** - Used for the highly optimized, custom falling sakura petal physics engine.
- **Web Crypto API** - Native browser cryptography for secure, zero-knowledge note locking.

### UI & Aesthetics
- **Pure Custom CSS** - No Tailwind or bulky UI libraries. Completely bespoke CSS featuring fluid typography (`clamp`), dynamic viewport units (`100dvh` for flawless mobile rendering), and advanced CSS variables for theme management.
- **Glassmorphism Design System** - Utilizing `backdrop-filter: blur()` and layered transparency for a deep, cinematic aesthetic.

### Data & State
- **React Hooks** - Deeply integrated `useState`, `useEffect`, and `useMemo` for rapid state updates.
- **Local Storage API** - 100% client-side data persistence. Your notes never touch a server and belong entirely to you.

---

## 🚀 Getting Started

If you want to run this beautifully calming environment locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/monikagotnochills/SakuraNotes.git
   cd SakuraNotes
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173` to start writing in peace.

---

## 📱 Mobile Responsive

Sakura Notes was explicitly engineered to look flawless on mobile devices. It utilizes dynamic viewport units (`dvh`) to bypass intrusive mobile browser address bars, ensuring that the editor and lighting panels always fit your screen perfectly.

---

*Made to cure the boredom of modern web apps.* 🌸
