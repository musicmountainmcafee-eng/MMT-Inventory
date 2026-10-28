# MMT TD Dashboard: to-do list

## Live Oct 27: name + initials per login (Dashboard 10.27 v4, Cue Sheet 10.27 v2)
- Tap your own bubble > change: name and initials for everyone signed in as that login (TD, Kyle...), any device.
  Stored in KV presence_names {login: {name, initials}}; empty = login name. Sent as "KB|Name · Device".
  Tests: test_rename.py. Backup: backup/2026-10-27-before-names-live.

## Live Oct 27: who's here bubbles (Dashboard 10.27 v3, Cue Sheet 10.27 v1)
- Google Drive-style: everyone in the same script shows as a coloured circle with initials at the top of the script page
  and the cue sheet (yours always last, even when alone; 4 others then +N). Tap: name, device, where they are, Go there;
  your own: "Only you are here right now" + change name. Name = login name + device ("Kyle · iPad"); server unchanged.
  Old chip row hidden; cue outlines kept. Not shown twice inside the script page's cue sheet. Tests: test_faces.py.
- Backup: backup/2026-10-27-before-faces-live.

## Live as of Oct 27 (Dashboard 10.27 v2, Cue Sheet 10.26 v3)
- 10.27 v2: logo removed from the top of the menu (took too much space); compact "MMT Dashboard" title back.
- Script + Cue sheet redesign, steps 2–8 (plan and feature checklist: "Script + Cue Sheet Redesign: Feature Checklist" doc):
  - Script | Cue sheet switch in the same tab, centered in the header on both pages; the cue sheet is kept loaded inside the
    script page (cue-list?embed=1) so flipping is instant; Both = side by side on screens >=1280px, selection follows.
  - Cue sheet header: Export, Layout, Photos, Theme, Awake, Settings in ⋯; Type and Who drop-downs; Before House row.
  - Script page header: Dark look and Spike map in ⋯; phone run views in ⋯; phone Mark + Undo float in the corner
    with a tray of cue types; computer/iPad set change moves edited as cards in the side panel.
  - One dark setting for the script's Dark look and the cue sheet theme.
- New black-and-white look across the whole dashboard, script page and cue sheet (Inter font, black header, pill buttons,
  icons, rounded cards). Light theme only; dark mode, cue sheet Dark/Red themes and the script's Dark look keep their colors.
- Fixed: cue sheet "Script ›" did nothing on phone/iPad.
- Not yet tried on the backstage iMac's old Firefox or on Mac's own devices; fix anything that turns up.
- Backup of the pages before this release: branch backup/2026-10-26-before-golive-redesign.
- Cue Sheet 10.26 v2 (Oct 26): long cue numbers (PRE-SHOW) fit the # column; inside the script page the cue sheet's
  View only/Editing and ⋯ share the filter row.

## Live Oct 26 (Cue Sheet 10.26 v3), Mac checking it on real plots
- **Paste set changes** (same as Cue Sheet 10.26 v4 dev): ⋯ > Paste set changes… Paste rows from Excel / Google Sheets (header row
  included; title rows above it are ignored; CSV works too). Columns matched by header name (#, Shift #, Sc, Cue, Line, Pg,
  Piece/Item, Action/Move, Wing/From, To, Who/Crew, Spike, Notes/Comments, Scene); each can be changed by hand. A row with no
  number joins the change above; a one-cell row is a scene heading; a Scene column makes scene bars. "SL 2 → SR 1" splits into
  wing/to. Preview before anything is added. A change number already on the sheet is flagged: Skip (default) or Update
  (replaces its moves, and its cue line if pasted). New ones go in through the "+ Add cue" queue as approx. markers on their
  page. Editing only; view-only crew don't see it.
  v4: plots with no change numbers (Mac's ACC plot: Cue, Pg, Who, Character, Stage Side, Movement, Notes): a new page,
  a cue line, or a blank row starts a new change; Movement -> Piece, Stage Side -> Wing; the same move by several people
  becomes one move with all their names; a scene heading at the very end keeps the last page.

## Earlier (Oct 25, 10.25 v1)
- Box editing + jump links; changelog export ("Mark this as sent?", What's changed page, Changes for you); #6.5 plot numbering fix.

## Live Oct 26 (Dashboard 10.26 v2)
- Script page: placing a scene puts the cursor in its scene name box (computer/iPad side panel; phone editor).
- Script page Normal / Cards / Step: thin line between a set change's moves; heavier line (Normal) or 2px outline
  (Cards, Step) between cues.

## Live Oct 26: dashboard layout (Dashboard 10.26 v3 = 10.26 v6 dev)
- Picked by Mac one piece at a time (layout-picks.html): to-dos first on Home; phone bar Home · Show notes · Script · To Do · More;
  menu = current show on top + shorter groups with More; current show = next Mainstage show not yet opened (moves on the day
  after opening night), picker to override (per device, "Automatic" to go back); show timer small in the top bar; phone
  header one row.
- Menu: [Current show ▾] Show notes, Script & Cue Sheet, Pre-Show Checklists (+ Cue Sheet for crew who have it without
  Scripts) | Home, To Do (count), Shopping | Season: All Shows (was Notes), All Scripts (was Scripts), Show Calendar |
  Storage: Set Piece Catalogue, Reference Photos | More: Storage Map, Drops, Cleaning Log, To Do 2, Side Job Notes | Links.
  Nothing removed. More opens by itself on one of its pages; remembers open/closed.
- Home: Today card (overdue, due today, this week; tick off; add with list + date) | current show card (Show notes /
  Create notes, Script, Cue sheet) | Also going (or Coming up) | Shopping. Timer pill: full screen, history, on/off.
- Phone: header Search + Lock; TV, Dark, Settings, Sync at the top of the menu.
- Tests: test_menu.py, test_home2.py (fake data). Backup: backup/2026-10-26-before-layout.

## Live Oct 26: links (Dashboard 10.26 v5 = 10.26 v7 dev)
- Links list left the bottom of the menu; Links page in More, grouped automatically (Mail, Drive & Docs, Forms, Ordering,
  Tools) by address; a group can be picked per link (stored as links[].group in the Sheet; automatic ones store nothing).
  Built-ins (Public Catalogue, Staff Portal, Notes & Tasks) not shown; pages still exist. Crew: Links goes with Home, as before.
- A show's own links: added on its show page (Links card), stored in KV showhub shows.<slug>.links [{name,url}];
  the current show's appear under it in the menu and as small buttons on Home's show card.
- Tests: test_links.py.

## Live Oct 27: sidebar redesign (Dashboard 10.27 v1 = 10.27 v2 dev)
- From Mac's picture: real MMT logo at the top (mmt-logo-white.png, made from "MMT Logo.png"); folding groups
  Productions ▾ (current show picker + its pages + links, All Shows, All Scripts, Show Calendar; open by default),
  Warehouse ▾ (Set Piece Catalogue, Drops, Storage Map, Reference Photos), More ▾ (Cleaning Log, To Do 2, Links, Side Job
  Notes); each remembers open/closed and opens by itself on one of its pages. Home, To Do, Shopping stay at the top level.
- Quick Add: New to-do, Shopping item (small forms, same saves as To Do / Shopping), Set piece (catalogue's Add form),
  Reference photo (Reference Photos with the camera open, current show filled in). Crew only see what they may.
- Bottom: Today card (date + weather at the theatre, Open-Meteo, 30 min cache) and Open show timer (full screen).
- Black and white kept. Sidebar widened 220 -> 248px. Current show sits above the groups (Mac's pick, 10.27 v2 dev).
- Tests: test_sidebar2.py (+ test_menu, test_links updated).

## On dev (Oct 28): Dashboard 10.27 v7 dev, Cue Sheet 10.27 v4 dev, Apps Script 10.28 v1 (needs pasting + redeploy)
- Show photos from musicmountaintheatre.org (Wix) + the Showpass ticket pages it links to, matched by show name
  (getShowPhotos, cached 6 h on the server, 12 h on each device). Home show card, Also going, All Shows cards, show page
  Photo card (Use another picture / Use the website's / No photo / Refresh; showhub shows.<slug>.photo).
- Loading pill: "Loading…" near the top whenever a page waits on the Sheet (jsonp and fetch GETs); background checks
  (who's here, new edits) don't count. Inventory/Drops first-visit spinner now covers fetch loads too.
- Drops / Set pieces: Copy photo, Download (phone: Save / share), All N photos; per-photo buttons in the photo list.
- Fixed: Home show card errored on first draw (icons defined too late).
- Tests: test_photos.py.

## Audit (Oct 28) — part 1 done
- Old pages turned into "This page has moved" signposts (nothing saves from them; code in backup/2026-10-28-before-signposts):
  dashboard, team, tasks, staff, drops, timer-v2.31/3.0/3.1/3.2/3.3-backup. Removed: script-copy, app-1, cues, next-notes.
  Kept as is: capture, capture-dev, timer-dev (capture-dev loads it), marquee-hole-spacer, notes-dev, spike-map.
  Settings' "Open team dashboard" link removed. Offline cache v8 (drops cached copies).
- On dev (Dashboard 10.28 v3 dev) + Apps Script 10.28 v2 (paste pending, same paste as the show photos):
  - To-dos and shopping save one change at a time (taskOps / shopOps; the page works out what changed since its last copy
    from the Sheet). The answer brings the up-to-date lists back. Lists refresh when the app comes back to the front
    (15 s+) and every 2 min. Old script: falls back to the whole-list save, retries in 6 h. Tests: test_ops.py + node ops_gs_test.js.
  - Escape closes New List / Settings / notes link; Home draws with no errors; empty Add says "Type ... first";
    phone version tag above the bottom bar; page titles = menu names; To Do 2 menu above its banner. Test: test_tidy.py.
- Was (Mac's answers): to-dos/shopping full fix (refresh on return + save one item at a time; Apps Script paste);
  Escape closes New List / Settings / notes-link pop-ups; Home early-draw errors (_hub, TV_SKIP_LISTS, docZoom);
  empty Add gives a hint; phone version tag over More; page titles match menu names; To Do 2 banner over its menu.
  Kept: To Do 2, Cleaning Log, Side Job Notes. Backstage iMac Firefox is very old: get its version (About Firefox).

## Next
- Mac at his computer: paste Apps Script 10.28 v1 (copy-sheet-script.html) + New version, then check show photos on dev.
- Drops tab (Mac working on it Oct 28).
- Full audit of the dashboard: what works, what doesn't (after 3 pm Oct 28, when Mac has more usage).
  Already noticed: Home show card's links are read before the show list loads on first draw (caught, redraws).

## Ideas
- Dark look on the script page still uses purple accents; could go black and white too.

## Back burner
- **Crew link for the set change plot** (built on dev 10.25 v3: `cue-list-dev.html?plot=<script>`; Export > Crew link).
  Read-only plot with tabs along the bottom (Changes, Full plot, Before House, each person), no PIN, live.
  Turned off on the live page (no Export button; `?plot=` does nothing there). Still works on cue-list-dev.html.
  Before handing it to a 70-person cast:
  - Fewer backend calls: 2–3 on open instead of 5; refresh every ~3 min with random jitter; pause after ~30 min idle.
    (Apps Script allows ~30 simultaneous executions per account; a burst of openings could briefly block TD saves.)
  - "Find your name" search instead of one tab per person; remember the choice; "You're not on any set changes" for cast with none.

## Waiting on an answer
- (answered Oct 27) Page numbers: PDF pages are fine; the odd script needs its own numbers -> see Later.
- (answered Oct 27) Script revisions: doesn't happen much -> Later.

## Later
- Script page numbers for the odd script whose printed numbers differ from the PDF (per-script setting).
- Photos on every show card.
- Script revisions: carry cues over to a new version (rare).
- Loading spinner
- Back buttons in the installed app
- Day Tracker
- Renter accounts and portal
- Damage log
- Bulk label printing
- Paint overhaul
