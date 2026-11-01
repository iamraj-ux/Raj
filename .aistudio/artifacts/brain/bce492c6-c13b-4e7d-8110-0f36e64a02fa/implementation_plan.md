# Implementation Plan: Default OS Desktop & Live Wallpaper Architecture

## Overview
This plan configures the application to start in a clean, high-performance desktop mode:
1. **Unobstructed Free View**: All app windows are closed on startup, revealing the full desktop view.
2. **Start Menu & Server External Viewer**: The Start button is renamed/labeled **Raj Expo Digitals**, featuring a dedicated **Server external viewer** action that launches the app in a new tab in full screen.
3. **Clean Touch & Pointer**: Complete removal of touch pads, mouse settings, and virtual cursor overlays.
4. **Flagship Live Wallpaper**: "Raj Expo Digitals" live animated wallpaper set as the default background, featuring dynamic glowing particle matrix and cosmic energy rings.
5. **App Window Frosted Blur**: Every window/modal features a frosted glass blurred background (`backdrop-blur-3xl` with translucent glass borders).
6. **Transitions & Animations**: Smooth Framer Motion spring transitions for Home Screen launch, window opening/closing, interactive touch ripples on screen click, and a top animated status ticker ("Processing", "Loading", "Opening", "Waiting", "Warning", "Error", "Completed", "Natasha's Notifications").
7. **Environment Stability**: Fix Vite HMR WebSocket connection handling and error suppression as required by the runtime environment constraints.

---

## 1. Start Menu & "Server external viewer"
- **Location**: Taskbar bottom-left Start button (`Raj Expo Digitals ^`).
- **Menu Popover**: Clicking toggles a sleek frosted glass Start Menu.
- **Top Action**: A prominent button labeled **"Server external viewer"** with an external link icon.
  - Action: Triggers `window.open(window.location.href, '_blank')` to launch the application full screen in a new browser tab.
- **App Launcher Grid**: Clean access to all registered applications (Contacts, Server Activity, Central Database, Prompt Studio, PDF Counter, etc.).

---

## 2. Default Startup State & Frosted Window Blurs
- **Zero Open Windows on Startup**: `openAppIds` initializes empty, ensuring an unobstructed view of the desktop.
- **Frosted Window Styling**: Every modal/window container (`DraggableResizableWindow`, `DailyOverviewClockModal`, `PromptTokenCounterModal`, etc.) utilizes high-clarity backdrop filters (`backdrop-blur-3xl bg-slate-950/80 border border-white/20`).

---

## 3. Removal of Touchpad & Mouse Settings
- Completely remove the `CircularTouchpad` overlay and virtual cursor pointer from `App.tsx` and `DesktopWorkspace.tsx`.
- Remove the touchpad/mouse controller icon and settings button from the Taskbar dock.

---

## 4. "Raj Expo Digitals" Live Wallpaper as Default Background
- Register `'raj-expo-digitals-live'` in `COSMIC_WALLPAPERS` in `services/wallpaperSettingsService.ts`.
- Set `'raj-expo-digitals-live'` as the initial default in `DEFAULT_SETTINGS`.
- In `components/CosmicWallpaperCanvas.tsx`, implement a bespoke animated shader with:
  - Concentric rotating cyan/blue ionization rings.
  - Floating stardust particles and cyber grid matrix.
  - Central ambient energy glow and breathing Raj Expo Digitals watermark.

---

## 5. Transition Effects (Launch, Open, Close)
- **Home Screen Entry**: Smooth fade and subtle scale-in on first mount (`initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}`).
- **Window Open / Close**: Consistent Framer Motion spring physics with exit animations across all modals (`initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }}`).

---

## 6. Interactive Touch Pop-ups & Top Animated Status Ticker
- **Screen Touch Ripples**: Global pointer event listener creating vibrant expanding neon ripples and micro-particles at the exact click/touch coordinates.
- **Top Status Ticker**: Floating pill badge at the top-center of the screen that animates dynamically when system state changes:
  - `⚡ Natasha Online`
  - `🔄 Syncing Central DB...`
  - `📂 Opening [App Name]...`
  - `✅ Operation Completed`
  - `⚠️ System Warning`
  - `🔔 Natasha's Notifications`
- **Interactive Pop-up Badges**: Animated scaling effects on weather icons, notification counters, and brand logos.

---

## 7. Vite HMR WebSocket Fix
- Update `server.ts` to pass `{ server: { middlewareMode: true, hmr: false } }`.
- Update `vite.config.ts` to set `server.hmr = false`.
- In `index.html`, add a global error listener to silently suppress WebSocket module runner transport errors per runtime guidelines.

---

## Verification Plan
1. **Compilation**: Run `compile_applet` and `lint_applet` to confirm zero TypeScript or bundling errors.
2. **Visual & Behavior Audit**:
   - Verify all windows start closed on page load.
   - Verify Start Menu opens and contains "Server external viewer".
   - Verify clicking "Server external viewer" invokes `window.open` for a new tab.
   - Verify "Raj Expo Digitals" live wallpaper is active by default.
   - Verify touch ripple animations spawn on screen clicks.
   - Verify top animated ticker updates with system states.
   - Verify touchpads and mouse settings are cleanly removed.
