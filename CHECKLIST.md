# CHECKLIST (run order top→bottom)
| # | Stage / Item | Pri | Status | Files | Test |
|---|---|---|---|---|---|
| 1 | **S1 Audit**: Write AUDIT.md (≤40 lines) & CHECKLIST.md | P1 | Verified | AUDIT.md, CHECKLIST.md | Audit verified, 0 code touched |
| 2 | **S3.1 Auth & Rules**: Firestore least privilege rules (allow + deny) | P1 | Verified | firestore.rules, server.ts | Root deny, least privilege isOwner(), ai_chats |
| 3 | **S3.2 Passcode Security**: Salted hash, remove plain text, Settings change | P1 | Verified | services/securityService.ts, components/AccountConfigModal.tsx | Salted SHA-256, 0 plain-text, changePasscode |
| 4 | **S3.3 Screen Lock**: 5 tries, 30s doubling wait, 10m autolock, masked | P1 | Verified | components/Lockscreen.tsx, App.tsx | Lockout doubling test, 10min timer, Start & Dock |
| 5 | **S4 Storage + Sync**: ai_chats/{+94phone}, part doc at 1MiB, GitHub SYNC | P1 | Verified | services/chatStorageService.ts, components/NatashaChat.tsx | 26/26 passed (phone keying, save-before-sent, 920KiB rollover, sync) |
| 6 | **S7 Functions + models**: 36 registered functions, quota alerts, model switch | P1 | NotStarted | services/functionRegistry.ts, services/modelRoutingService.ts | Function registry, quota triggers |
| 7 | **S8a Contacts + tags**: CSV parser, 12-param filter, +Add Contact, 6 exports | P1 | Implemented | services/contactDirectoryService.ts, components/PeopleDatabaseModal.tsx | 867 contacts parsed, 12 filters, 6 exports |
| 8 | **S2 Terminal**: Searchable tree, 13 folders, copy→run flow, exit codes | P1 | NotStarted | components/TerminalModal.tsx, services/commandRegistry.ts | Command runner, mask secrets |
| 9 | **S5 Connectors + apps**: Drive, Gmail, Calendar, Contacts, Tasks, WhatsApp | P1 | NotStarted | services/connectorRegistry.ts, components/ConnectorModal.tsx | Scopes check, disconnect/reconnect |
| 10 | **S5.1 Cloudinary workspace**: Files & Text tabs, ≤15 tags, AI prompt, sync | P1 | NotStarted | components/CloudinaryCloudDatabaseModal.tsx | File/text tab, tag suggestion, sync |
| 11 | **S8d Abilities**: Natasha 2 follow-ups, draft observations, grounding, weather | P1 | NotStarted | services/natashaConversationEngine.ts | Follow-up Qs, Google grounding |
| 12 | **S6 WhatsApp Business API**: Meta templates, webhook verify, inbox sync | P2 | NotStarted | services/whatsappBusinessService.ts, server.ts | Webhook signature, inbox sync |
| 13 | **S8b Shell**: Windows move/resize/snap, Taskbar, Asia/Colombo clock | P2 | NotStarted | components/TaskbarDock.tsx, components/VirtualMousepad.tsx | Positions saved, touchpad |
| 14 | **S8b.1 Desktop + Start + Taskbar + Universal Modify**: Shortcuts, folders, Modify | P2 | NotStarted | components/UniversalModifyModal.tsx, components/StartMenu.tsx | Context menu, shortcut persistence, prompt |
| 15 | **S8c Look + settings**: 20 sections, themes, sounds, alerts | P2 | NotStarted | components/SettingsModal.tsx, services/settingsService.ts | JSON export/import, sound levels |
| 16 | **S8e Fallback + a11y pass**: 1–3 human lines, ≤3 AID btns, WCAG 2.2 AA | P1 | NotStarted | components/FallbackHandler.tsx, components/Button.tsx | Canonical actions, 44px targets |
| 17 | **S9 Clean-up (ask me first)**: List fake data, backup xlsx+json, RESET confirm | last | NotStarted | services/cleanupService.ts | Explicit approval prompt |
| 18 | **S10 Verify & Report**: Real behavior test, allow/deny, webhook, ≤1p report | last | NotStarted | AUDIT.md | Comprehensive verify summary |