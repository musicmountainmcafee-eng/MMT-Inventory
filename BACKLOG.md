# MMT TD Dashboard: to-do list

## Live as of Oct 26 (Dashboard 10.26 v5, Cue Sheet 10.26 v3)
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
- Page numbering setting: is the offset between PDF page and script page constant?
- Script revisions: should cues carry over to a new script version?

## Later
- Loading spinner
- Back buttons in the installed app
- Day Tracker
- Renter accounts and portal
- Damage log
- Bulk label printing
- Paint overhaul
