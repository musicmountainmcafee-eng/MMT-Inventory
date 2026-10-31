# MMT TD Dashboard: to-do list

## Live Oct 30 afternoon (Dashboard 10.30 v3 = 10.30 v4 dev: also no bottom box in the side menu; was 10.30 v2 = 10.30 v3 dev, Cue Sheet 10.30 v2 = 10.30 v1 dev)
- Home redesign (ChatGPT spec, two passes): counts strip; Mainstage + Children's Theatre cards side by side (photos on computer/iPad only); to-dos show 3 with Show more/less, ticked ones stay until you leave Home, + opens Quick Add; shopping one row on the phone; Coming up skips the featured shows; crew see only their cards; couldn't-load states.
- Before House → Presets: a folding section at the top of the set change plot; renamed in PDF/Excel/dashboard. Crew link still off on live.
- Known: unfolded foldable (~884 wide) scrolls sideways a little because of the top bar (live and dev alike).

## Live Oct 30: everything from dev (Dashboard 10.30 v1, Cue Sheet 10.30 v1); Apps Script 10.28 v3 pasted + deployed by Mac
- Show photos, loading pill, drop photo copy/download, one-change saves + lists on other devices within ~10 s, tidy-ups, cue sheet Editing-mode jump fix.
- Cue sheet live still has the crew link off (no Crew link export, PLOT_ID = '').
- Next: Home screen redesign from ChatGPT's spec, in two passes (1: responsive layout + production cards; 2: task preview + crew/permission states).

## Live Oct 29 night: sidebar reorganised (Dashboard 10.29 v4 = 10.29 v8 dev)
- Two show boxes: Mainstage (next Mainstage show) and Children's Theatre (next Children's show), each with its own picker (⇄), Show notes, Script & Cue Sheet, links. Checklists once, under Mainstage. Tap a box to fold it (remembered).
- Home, To Do, Shopping; Productions (starts closed); Stock & Storage (was Warehouse); Links on its own; Utilities (was More: Cleaning Log, To Do 2, Side Job Notes); Quick Add folds up.
- Phone menu: no Home/To Do (on the bottom bar), TV/Dark/Settings/Sync at the bottom, one group open at a time, 44px rows.
- Only the sidebar went live; the other dev items (photos, loading pill, drop photo buttons, one-change saves, tidy-ups) are still dev-only.

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

## Live Oct 29 evening (Dashboard 10.29 v3, Cue Sheet 10.29 v3)
- Script | Cue sheet toggle returns to where you were on each side; a new cue's "Cue sheet ›" waits for it and lands on it;
  script ⋯ menu labels readable (were white on white); phone set change moves as cards; cue sheet badges never split,
  phone search on its own line; set change editor no longer blank on an unfolded foldable. Also live today: off-page
  markers pulled back (10.29 v2), header overlap fix (10.29 v1). Tests: test_flipmem.py, test_offpage.py.
- Not yet covered: a new cue while the cue sheet is left in Editing mode (it doesn't refresh then).
- Open ideas from the script/cue sheet audit: floating cue editor on ~1000px laptops; "+ Add cue" only on the tapped row;
  Find results showing the cue line.

## Live Oct 29 (Cue Sheet 10.29 v1)
- Cue sheet shows every scene, even with no cues yet (hidden only while filtering/searching); scene bars show number and
  name ("Scene 1 · Painswick Orphanage..."), also in the printed/exported plot. Only this went live; the rest of dev waits.
  Test: test_emptyscenes.py.

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
- Near-live lists (Dashboard 10.28 v4 dev, Apps Script 10.28 v3): every save stamps a number (getListsRev); open dashboards
  ask every ~10 s and reload only a list whose number moved. Off in the background / offline / with the old script.
  Fixed on the way: a shopping tick waiting its 0.8 s before saving could be wiped by a refresh arriving in between.
- Was (Mac's answers): to-dos/shopping full fix (refresh on return + save one item at a time; Apps Script paste);
  Escape closes New List / Settings / notes-link pop-ups; Home early-draw errors (_hub, TV_SKIP_LISTS, docZoom);
  empty Add gives a hint; phone version tag over More; page titles match menu names; To Do 2 banner over its menu.
  Kept: To Do 2, Cleaning Log, Side Job Notes. Backstage iMac Firefox is very old: get its version (About Firefox).

## Car Thing (started Oct 28)
- Spotify Car Thing on bridgething firmware (not flashed yet; Mac flashes it on his Mac with Terbium). Wants it plugged into a
  computer at the SM desk. Mockup made (800x480): Timer screen (top buttons Back / Hold / -1 / +1, HOLD the knob 0.7 s to GO),
  Calls (turn to pick, press to send), To-dos (today's, press to tick); back button cycles screens.
- How it would work: a bridgething webapp (Vite, @bridgething/client). Timer control = the same relay commands the Stream Deck
  keys use (cmd:go, back, hold, plus, minus, call:...). Display = listen on the relay. To-dos = getTasks / taskOps via
  client.net.fetch. Can be installed from a catalog hosted on GitHub Pages. Develop against a TEST relay topic, not the real one.
- Unknowns until flashed: internet over USB from a computer (docs say internet normally comes through the phone app);
  exact knob/button events on the device.

## Next
- **Stage map (on dev Oct 31: stage-map.html 10.31 v1, Cue Sheet 10.31 v1 dev, Dashboard 10.31 v1 dev)**: top-down map on the uploaded MMT ground plan (both wings + backstage), scale set by tapping two points + a distance; one map for Presets then one per set change (pieces carry over, "MOVES" marks the change's pieces); stock platforms/stairs, flats/doors, furniture, catalogue, custom sizes; drag, rotate, off-the-map-from-here; a show can use its own plan. Opens from Presets "Map", each set change's "Map", and the script page's set change (Stage map). Saved in KV 'stageplan' + 'stagemap_<scriptId>'. Not yet: spike colours on pieces, printing the map in the plot PDF.
- **Built overnight Oct 31 on dev (Dashboard 10.31 v2 dev, Cue Sheet 10.31 v2 dev), Mac to check:** foldable top bar, timer pill on the script page, nightly preset check, Home flags, Plan strike, repeating + every-production to-dos. Choices made are listed under "Overnight choices" at the bottom.
- **Script cuts (mockup on dev, Oct 30: Dashboard 10.30 v5 dev, Cue Sheet 10.30 v2 dev)**: ✂ Cut, tap start, tap end (pages can be flipped between); saved as an annotation {type:'cut', page0,y0,page1,y1,note,by,at} on the start page; three looks to choose (greyed / red strike / folded, a per-device switch for now); cues inside flagged "in a cut" on the script and cue sheet; Move start/end; Restore lines. Not yet: cuts in the exported script PDF, the editor's cue list panel flag.
- **Live show timer at the top of the Script / Cue Sheet page** (asked Oct 30): the running act/countdown from the show timer,
  view only, in the page's top bar (both the script view and the cue sheet), the same feed as the dashboard's top-bar timer pill.
- Fix: unfolded foldable (~884 wide) scrolls sideways a little because of the top bar.
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
- Script revisions: carry cues over to a new version (rare).

- Back buttons in the installed app
- Day Tracker
- Renter accounts and portal
- Damage log
- Bulk label printing
- Paint overhaul

## Overnight choices (Oct 31)

## Foldable sideways scroll
- Between 769 and 1100 px wide (unfolded foldable, small tablet beside the menu) the top bar's buttons now wrap onto a second row instead of running off the edge.
- In that range the timer pill drops its words ("No show running") and keeps the dot + time. Tap still opens the timer menu.

## Timer pill on the Script / Cue Sheet page
- Sits in the script page's top bar, left of Find. Same feed as the dashboard's pill (act + running time / countdown, or the clock when no show).
- Under 1200 px wide it shows just the dot + time (no words) to keep the bar from crowding.
- Tapping it opens the same menu as the dashboard's (Full screen, History, turn off).
- Hidden for crew who can't see Home (same rule as the dashboard's pill).
- It's on the script page's bar, so it also shows while the cue sheet is open inside the script page. The stand-alone cue sheet page (cue-list.html opened by itself) doesn't have it.

## Nightly preset check (cue sheet, Presets)
- A **Check** button on the Presets bar (beside Map) turns on checking for that device. Presets opens and every row becomes a tick box. The button shows the count, e.g. "Check · 3/12", even when checking is off.
- One shared list per script per day. Whoever ticks, everyone sees it within about 10 s. Each tick shows who and when ("Kyle 7:12 PM").
- Anyone signed into the cue sheet can tick, including crew whose scripts are view only (you chose "anyone").
- It resets on its own at midnight: yesterday's ticks don't count. I picked midnight rather than "after the show" because the show timer doesn't say when a performance is over. A matinee and evening on the same day share one list. Use "Untick all" (two taps, so it can't happen by accident) to start over between them.
- Pieces marked "not on plot" in Presets are left off the checklist.
- A progress bar and "All set" message when everything's ticked.
- Saved in the Sheet's KV store (presetcheck_<script>), not in the cue data, so it can't clash with cue sheet edits.
- Not done: no reminder or Home flag if the check isn't finished (you didn't pick that flag).

## Home flags
- They sit on each show card (Mainstage and Children's), under the dates, as small amber tags: "3 cues on approx. spots" and "2 moves with no crew". Nothing shows when both are zero.
- Counted from the script linked to that show (Show page › script). A show with no script linked gets no flags.
- "Moves with no crew" counts each move that has a piece but an empty Who. A set change with no moves at all doesn't count.
- Tapping "approx. spots" opens that script and jumps to the first cue still on an approximate spot. Tapping "no crew" opens that show's cue sheet. I couldn't add a "nobody in Who" filter there without more work, so you'll still need to scroll for them.
- Checked again at most every 5 minutes while Home is open, quietly, without flashing the Loading pill.
- Only shown to people who can open the script or the cue sheet. The "approx." flag only shows to people who can open the script.

## Strike list (on request)
- A **Plan strike** button on each show's page (next to the show's dates). Only you (TD) see it, not crew.
- It reads the show's linked script and lists every piece named in its set changes as "Strike <piece>", all ticked. Untick any you don't want.
- You pick the to-do list (it remembers your last pick, and starts on a list with "Build" in its name if there is one). The due date defaults to the day after closing, and you can change it.
- Running it again doesn't double up: a "Strike <piece>" already open on that list is skipped.
- It doesn't make a new list. It adds to an existing one, because making lists from here could clash with list colours and order on the To Do page.

## Repeating to-dos
- Each to-do on the To Do page has a small ↻ button. It offers four choices: Doesn't repeat, Weekly on set days, Every Mainstage show day, or Every Children's show day, with day-of-week buttons.
- "Show days" means every day between a show's opening and closing, on the days you leave ticked, so untick your dark days (e.g. Mon, Tue). I don't have the real performance schedule, only opening and closing dates, so this was the closest match. After one run closes, it jumps to that stage's next run.
- When you tick a repeating to-do off (on To Do, Home or the wall TV), the next one is added straight away, due on the next matching day, with the same text and list. It repeats too. Unticking straight away takes that next one back off, so a slip doesn't leave a duplicate.
- A repeating to-do with no date gets its first date when you set the repeat.
- Repeat settings are saved in the Sheet's KV store (todo_repeats), not on the To-Do tab, because that tab only has List / Task / Done / Due / ID columns. In the Google Sheet itself, a repeating to-do looks like any other row.
- Not done: setting a repeat from Quick Add or Home. It's only on the To Do page for now.

## Every-production to-dos
- An **Every production…** button on the To Do page (only you see it). It has a Mainstage tab and a Children's Theatre tab. Each to-do has its text, a list, and timing like "2 days before tech starts", "0 days after opening" or "1 day after closing".
- "Tech starts" uses the same tech date the dashboard already uses: the Monday of the week 4 days before opening.
- Each one lands on its list **a week before it's due** (or right away if it's sooner), once per show. The show name is added to the end, e.g. "Fill hazers · James and the Giant Peach". A week ahead was my pick; tell me if you'd rather it appear on the day, or further out.
- Anything whose date passed more than a day ago is never added, so turning this on doesn't flood you with old ones.
- Only your (TD) devices add them, and they check the Sheet first, so two devices don't add the same one twice.
