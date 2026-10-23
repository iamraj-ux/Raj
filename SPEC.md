## S1
S1: audit now, no code. Write AUDIT.md (≤40 lines: framework, deps, Firebase, existing features: DB categories, chat, People, WhatsApp, files, tasks, GitHub sync, lock, model routing, PDF Counter, QR) and CHECKLIST.md (every item in S2–S10 | status | files | test). Existing = Keep.

## S2
S2 TERMINAL (P1)
Cmd registry: {id, folder, title, steps[{purpose, prereq, cmd, env, expect, verify, recover}]}.
Folders: Firebase|GCloud|GitHub|App|DB|Sync|API|Integrations|WhatsApp|Install|Diagnostics|AI|Maintenance.
UI: searchable tree → sidebar of numbered steps, Copy per step. Flow copy→run→verify→next; never auto-run next; stop on fail/unverified.
Terminal: registered app commands, autocomplete, history, timestamp, exit code, timeout, auth check; no AI tokens; native function beats shell copy-paste. gcloud only via authorized Cloud Shell/backend (say so in UI). Mask secrets. Destructive → named Delete confirm.

## S3
S3 SECURITY (P1)
Auth, least privilege, Firestore rules (test allow + deny), keys/tokens server-side only.
Passcode: remove plain text everywhere; salted hash; changeable in Settings; current one keeps working.
lock.tries=5, wait=30s doubling, autolock=10min, no hints, masked input; Lock btn in Start + taskbar. UI lock only; real protection = auth + rules.

## S4
S4 STORAGE+SYNC (P1)
ai_chats/{+94phone}: exists → atomic append to messages[]; else create {phone, createdAt, updatedAt, messages:[first]}. msg={role, text, ts, lang, tags, app, status}. Near 1 MiB → new part doc.
Save before “sent”; offline queue + retry; revisions, conflict detect, restore.
One SYNC btn: all chats → Central DB (GitHub), new/changed only, no dupes, progress, lastSynced, RETRY_SYNC on fail. “Synced” only after GitHub confirms. First sync: verify repo private, else stop + warn.

## S5
S5 CONNECTORS+APPS (P1)
Registry: Drive, Gmail, Calendar, Contacts, Tasks, Keep(if supported), Firebase, GitHub, WhatsApp. Each: ops, OAuth, test, status, sync (import|export|1-way→2-way, conflicts to me), errors, disconnect/reconnect. Min scopes. Unsupported → say so.
Windows: WhatsApp, Gmail, Cloudinary, Firebase, GitHub, GCloud = status, linked contacts/tags, recent activity, quick actions, official site pages (new tab, verify each URL). Cloudinary: descriptions, ≤15 tags, metadata update, contact sync. Gmail: pick sender account → preview → confirm. Keep PDF Counter + QR Generator. APPGUIDE.md: per app what/where/fixes.

## S6
S6 WHATSAPP BUSINESS API (P2; code it even without creds)
Backend only; tokens server-side.
Out: recipient → template (outside 24h) → preview → confirm → send → real status. Opted-in/messaged contacts only. Replies manual.
In: HTTPS webhook: verify, signature, subscriptions, dedupe → secure store → Firebase inbox, search/filter, link contact + tags (unknown → Possible contact), notify.
Missing creds/account/URL/Meta approval → finish code, list exact missing items.

## S7
S7 FUNCTIONS+MODELS (P1)
Function registry: search_database get_record save_record update_record delete_record restore_record link_records search_contacts add_contact update_contact merge_contacts export_contacts get_tag_graph suggest_tags save_tags get_chat_context save_chat_message summarize_and_archive draft_whatsapp send_whatsapp draft_gmail send_gmail search_files write_description update_cloudinary_metadata sync_github sync_status report_status explain_selection diagnose_error create_task create_reminder get_weather get_time open_app open_url change_setting change_theme search_web analyze_database. Read = direct; write/send/delete/merge/overwrite = confirm. Log each call, no secrets.
Models (on top of existing routing): config/activate/deactivate/switch/multi; show provider, id, capabilities, status, real usage. None active → “Boss, this feature requires an AI model. Open Model Settings to activate a compatible model?” [Model Settings][Continue without AI][Cancel]. Task dashboard Stop/Cancel/Retry. quota.alerts=[75,90,100] real data only, estimates labeled. Never auto-switch, enable paid, or upgrade.

## S8a
S8a CONTACTS + TAGS + IMPORT/SEARCH/EDIT/EXPORT (P1) — REQUIRED FEATURES; do not omit any listed button or feature. [attach contacts.xlsx when available]
DATA INGESTION: Parse CSV per RFC 4180: quoted commas, escaped quotes, CRLF, UTF-8 BOM, and multiline quoted fields remain one record (e.g. a name containing a newline). Handle empty fields and malformed rows with clear row-level errors; never silently drop data. Support 1,000+ contacts efficiently with pagination/virtualization. Preserve original phone input while normalizing display/search/WhatsApp links; support Sri Lankan +94 and 0-prefixed 07X plus +44, +1, +63. Never guess unknown country codes; flag ambiguous values.
CONTACT SCHEMA: preserve original/source fields; support firstName, lastName, displayName, jobTitle, company/organization, addresses, phones[{label,number,normalized,isPrimary,whatsappEnabled}], emails[{label,email}], relationshipType, relatedContacts, socialProfiles[{platform,url}], image/profileImageUrl, imageCaption, imageTags, customTags, notes, relationshipHistory, lastContact, source, confidence, createdAt, updatedAt. Preserve emoji and Sinhala/Tamil names. Relationship choices: Family, Friend, Executive, Colleague/Work, Client, Business/Vendor, Government, Police/Legal, Healthcare/Medical/Doctor, Service, VIP, Other; permit custom types/tags and links to related contacts.
IMPORT: If contacts.xlsx or CSV is supplied, preview before import; never assume a fixed row count. Show source, total rows, valid rows, duplicate candidates, malformed rows and proposed changes. Flag problems and ask for approval; never auto-merge, auto-correct or overwrite existing records. Phone numbers stored as text. Show emergency numbers 110, 112, 115, 118, 119, 990 only if already present or explicitly provided; never fabricate contacts.
REAL-TIME SEARCH/FILTER: Instant multi-field search across first/last/display name, job title, company, address, every email/phone, relationship type, WhatsApp-enabled numbers, image/profile URL presence, custom tags and notes. Add tappable filter pills and a relationship dropdown/tag filter; multiple filters combine predictably and each can be removed. Suggestions/results must be tappable and open the matching contact/details. Keep responsive for 1,000+ records.
DETAIL VIEW + REQUIRED ACTION BUTTONS: Tapping a contact opens accessible modal/drawer with every available field. Implement real, individually testable actions: VIEW_DETAILS; COPY_NAME; COPY_NUMBER (primary number, toast success/failure); WhatsApp (open https://wa.me/<digits>, sanitized international number, no +/spaces; only use a country code when known); Email/Gmail (open Gmail compose URL with encoded recipient or mailto:); “Summarise with Natasha” / ASK_NATASHA (prepare prompt from details, relationship history and notes; show/copy it or call the real configured AI path; never claim summary generated unless it was); Edit; Delete. Delete requires explicit named confirmation; update list only after persistent deletion succeeds; offer Undo/Restore if supported. No dead, decorative or fake-success buttons.
ADD CONTACT ENTRY POINT — MANDATORY: Implement a visible, functional “+ Add Contact” button inside the existing dedicated Contacts app/section. If contacts live under Database, place it prominently in Database → Contacts. If both screens exist, both buttons must call the same shared create-contact workflow; do not create a duplicate Contacts app. Clicking the button must immediately open the real create form/modal. Include all supported contact fields and dynamic phone/email/social-profile rows, relationship type, custom labels/tags, related contacts, notes/history, and profile image. Provide Save Contact and Cancel. Validate required fields; prevent double submission; persist using the existing configured storage/database integration; after confirmed save, close the form and refresh the contact list/search so the new contact can immediately be viewed and edited. On failure, keep entered values and show the actual error; never fake success or create a mock contact. Test the complete click → fill → save → persistent read-back → view/edit flow and record results in CHECKLIST.md. CREATE/EDIT FORM + REQUIRED BUTTONS: Create and edit contacts with dynamic Add phone/Remove phone, Add email/Remove email, Add social profile/Remove social profile rows. Social profile selector: LinkedIn, GitHub, X/Twitter, Instagram, Facebook, Telegram, WhatsApp, Portfolio URL; each row stores platform + URL. Include relationship dropdown, custom tags, related-contact link selector, notes/history, and profile image upload with caption/tags. Cloudinary must use the already configured upload preset or existing secure backend endpoint; do not invent endpoints/presets or expose secrets. Bind profile image to returned secure_url only after successful upload. If configuration is missing, explain the exact missing setting and keep other form fields usable. Provide explicit Save Changes and Cancel buttons; validate and show errors; Cancel discards unsaved edits.
EXPORT + REQUIRED BUTTONS: Export All and Export Filtered actions must each produce real downloads in all six formats: (1) RFC 4180 CSV, correctly quote commas/quotes/newlines; (2) standalone HTML table; (3) Markdown table with escaped pipes/newlines; (4) plain-text key/value directory; (5) vCard 3.0 .vcf for iOS/Android with correct escaping and multiple phones/emails; (6) formatted JSON array. Preserve Unicode and all supported fields as appropriate. Show actionable errors when export fails.
SYNC + DATA SAFETY: retain existing Firebase/GitHub/Cloudinary integrations and current data model where possible; integrate contact CRUD/sync through configured real services, detect conflicts, prevent duplicates, and show real progress/status. Do not claim Saved/Uploaded/Synced until the operation confirms success. No mock data, fake upload, or fake sync. Patch existing UI and reuse shared components; preserve unrelated features, branding and layout.
ACCESSIBILITY + ACCEPTANCE TESTS: all buttons must have real actions, accessible names, keyboard/touch support, focus states and loading/disabled/error states. Test import with multiline quoted name, escaped quotes, +94/07X/+44/+1/+63 numbers, duplicate and malformed rows; search/filter; detail; copy; WhatsApp; email; Natasha summary prompt; add/edit/cancel/delete-confirm; Cloudinary configured and missing-config paths; six export formats; and 1,000+ records. Record each test in CHECKLIST.md. If any item is blocked, mark Blocked with exact reason; do not silently omit it.
## S8b
S8b SHELL (P2)
Windows: move/resize/min/max/close/snap/stack, positions saved. Top btns: Min, Max/Restore, Close, NewTab. Home top btn “Raj Expo Server” → same app in new tab. Mobile: fullscreen cards + switcher.
Taskbar: Start, running apps, quick icons (WA, Gmail, Cloudinary, Firebase, GitHub, GCloud), clock (Asia/Colombo), weather, bell, unread. Start: search, pinned, recent, Lock, Restart. Lock screen: clock, date, weather, notifs, unread counts only.
Context menu: right-click | long-press | Shift+F10. Mouse pad (pad.on=false desktop): move, tap=L, 2-tap=R, 2-finger scroll, pinch zoom, L/R btns, drag/resize/dock, speed, size. In-app cursor only (say so). Zoom btns + reset.

## S8c
S8c LOOK+SETTINGS+ALERTS (P2)
Settings app sections: General|Natasha|Profile|Display|Wallpaper|Animation|Sound|Notifications|Pad|Taskbar|Lock|Integrations|DB/Sync|Models|Language|A11y|Weather|Health|Debug|Backup. Search, reset-to-default, JSON export/import, synced, change log + UNDO, ASK_NATASHA per section. Merge with existing; no dupes. Factory reset not here.
Schema (key: options =default; UI generated):
theme: light|dark|hc|custom =dark; anim: off|min|std|fancy =std (reduced-motion → min); wallpaper.home/lock: still|live|upload =still (pause btn, contrast overlay, ≤3 flashes/s)
sound.master: 0-100 =70; per-event volume/mute/upload ≤5s; enable-sounds prompt (browser audio block)
toast.max =3; dnd =off; quietHours =off; debug =off; autolock =10; health.* =off
Notif types: info|success|warn|error|critical|reminder|message|weather|system; bell center + filters; unread counts. Time-left only if measurable, labeled estimate.

## S8d
S8d ABILITIES (P1/P2)
Chat: qFreq =2 follow-up Qs/reply; learned items = drafts (source, ts, confidence, label Boss said|Records|Inferred); “What do you know about me?” view.
search_web via Google Search grounding → short answer + OPEN/COPY source btns; research notes saved on approval. Doc chat (PDF/Word/text/image), say unread parts. analyze_database read-only. report_status real data. Ideas 1–3 with reason, suggest only.
Weather: provider + updated time, alerts. Reminders: recurring, snooze, sound, tags; class + payment. Health reminders OFF default; kickboxing log; health data never on lock screen/notifs; one gentle workload nudge.

## S8e
S8e FALLBACK+A11Y (P1)
Fallback = 1–3 human lines + ≤3 AID btns; one canonical action per intent (no Retry Search/Try Again/Refresh/Sync Again); clear fallback after success; raw errors only if debug =on. Use [Enter Date][Broaden Search] (not Search Related Records/Broaden Date). Destructive = named Delete btn.
Audit every button: mouse, touch, keyboard, screen reader, 200% zoom. Fix in shared Button.

## S9
S9 CLEAN-UP (run last; ask me first)
List fake/demo data (mock records, placeholder contacts, sample numbers, demo stats, fake connection states) for my review; imported contacts + real records protected.
Options: fakeOnly|chats|oneCategory|full (default smallest). Show delete/keep counts. Backup first (xlsx + json), verify it opens, else stop. Confirm: passcode + type RESET; btn “Delete all data”. Never delete code, GitHub history, Firebase config, branding. restorePoint =30d. Report real counts.

## S10
S10 VERIFY: test real behavior: commands, Firestore allow/deny, save, sync, retry, conflicts, webhook verify + dupes, send fail, model switch, task cancel, quota alerts, a11y. Report ≤1 page: files, verified, real results, blocked, my actions, costs needing approval. No evidence = not Verified.