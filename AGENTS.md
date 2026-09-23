# The Mind Museum - AGENTS Context

Welcome! This file provides essential context, architectural decisions, and design guidelines for AI agents working on "The Mind Museum" codebase.

## 🏗️ Architecture & Tech Stack

This project is a monolithic full-stack application leveraging the latest Angular ecosystem features alongside a lightweight Node/Express backend.

**Frontend:**
- **Framework:** Angular 22 (Standalone Components exclusively).
- **Styling:** Tailwind CSS v4 (Flat `.css` files, utilizing PostCSS via `.postcssrc.json`).
- **State Management:** Reactive services with RxJS and Angular Signals (if applicable).
- **Game Engines:** Phaser 4 (2D physics/rendering) and Three.js (3D rendering), embedded within Angular components using HTML5 Canvas refs.
- **Drag & Drop:** `@angular/cdk/drag-drop` (used in Algorithmic Alchemist).

**Backend (BFF / API Layer):**
- **Server:** Node.js + Express (located in `src/server.ts`).
- **SSR:** Angular Universal / Server-Side Rendering (`@angular/ssr`).
- **Database:** Local SQLite via `better-sqlite3`.

---

## 🎨 Design System: Premium Glassmorphism

The application has been unified under a dark-mode "Premium Glassmorphism" design language. **All new UI components MUST adhere to these guidelines:**

1. **Backgrounds:** Deep slate/navy colors (`bg-slate-950`). Use blurred, pulsing glowing orbs in the background (`bg-cyan-900/10 blur-[100px] animate-pulse`).
2. **Containers (Cards/Wrappers):** 
   - Base: `bg-slate-900/40 backdrop-blur-xl border border-slate-700/40`
   - Borders: Use thin, semi-transparent borders to catch the light.
   - Shadow: Heavy, soft shadows `shadow-[0_8px_32px_rgba(0,0,0,0.4)]`.
3. **Typography:**
   - Primary text is light (`text-slate-200`).
   - Headers should often use gradient text: `text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400`.
4. **Interactive Elements:**
   - Buttons should scale up slightly on hover (`transition-all hover:scale-105`).
   - Active/Hover states should intensify borders and drop shadows (`hover:shadow-cyan-500/25`).
5. **No Custom CSS Structural Rules:**
   - Do NOT write structural `.css` classes (e.g., `.container { display: flex; }`). Rely 100% on Tailwind utility classes in the HTML templates.
   - Use component `.css` files ONLY for complex animations (`@keyframes`) or strict third-party overrides (e.g., specific CDK drag classes).

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── components/
│   │   ├── games/                  # The interactive exhibits (Terminal Velocity, Algorithmic Alchemist, Logic Gate Defender, etc.)
│   │   ├── game-dashboard/         # Main menu to select games
│   │   ├── analytics-dashboard/    # Dashboard displaying player telemetry/stats
│   │   ├── lobby/                  # Welcome/Entry screen
│   │   └── profile-selector/       # User profile creation/selection
│   ├── services/
│   │   └── player-state.service.ts # Service bridging frontend telemetry with backend Express API
│   ├── app.routes.ts               # Application routing table
│   └── app.config.ts               # App configuration (Hydration, HttpClient, Providers)
├── server.ts                       # Express backend + SSR Engine + SQLite Database initialization
├── styles.css                      # Global Tailwind @theme imports
└── index.html                      # Root HTML
```

---

## 🛠️ Key Agent Rules & Gotchas

1. **Angular SSR Errors (`NG0205`, `Document is not defined`):**
   - The application uses SSR. When injecting DOM-specific logic (e.g., Phaser, Three.js, Canvas APIs), you **MUST** wrap the initialization in a platform check using `isPlatformBrowser(this.platformId)`.
   - Never access `window` or `document` directly in a constructor or `ngOnInit` without a platform check. Use `ngAfterViewInit`.
2. **Game Component Layouts:**
   - Game screens are explicitly designed to be **Full-Screen and Immersive**.
   - They use a fixed Tailwind wrapper: `<div class="fixed inset-4 md:inset-8 ... z-40">`.
   - Do not add standard navbar headers to the games. Use minimalist floating action buttons (FABs) pinned to the corners (e.g., `absolute top-6 left-6 z-50`) for actions like "Back" or "Reset".
3. **Routing Links:**
   - Standalone components using `routerLink` MUST explicitly import `RouterModule` in their `@Component({ imports: [...] })` array. Failure to do so will result in silent failures where buttons are unclickable.
4. **Building & Caching:**
   - The Angular CLI aggressively caches builds. If you modify core architectural files like `.postcssrc.json` or `angular.json`, ensure you advise the user to explicitly restart their development server.
