# MMT TD Dashboard: to-do list

## Live as of Oct 25 (Dashboard 10.25 v1, Cue Sheet 10.25 v1)
- Box editing + jump links; changelog export ("Mark this as sent?", What's changed page, Changes for you); #6.5 plot numbering fix.

## In progress
- **Script + Cue sheet redesign, step by step** (plan and feature checklist: "Script + Cue Sheet Redesign: Feature Checklist" doc;
  before/after screenshots checked: all 25 script page + 19 cue sheet features kept).
  Decisions: run views in header on computer / ⋯ on phone; one dark mode setting for both; Awake in ⋯; phone opens the view you came from.
  - Step 2 (Script | Cue sheet switch, same tab, same cue): on dev (Dashboard 10.25 v3 dev, Cue Sheet 10.25 v4 dev). Waiting for Mac to try it.
  - Step 3 (cue sheet header: Export, Layout, Photos, Theme, Awake, Settings into ⋯; phone lock is icons; phone header one row + switch): on dev (Cue Sheet 10.25 v5 dev).
  - Mac chose to keep steps 2+ on dev and go live with several together.
  - Step 4 (script page header: Dark look into ⋯; Spike map only in ⋯; phone run views in ⋯; phone header one row + switch;
    ⋯ Cue sheet / Set change plot / Before House flip in the same tab; Back returns to the script at the cue): on dev (Dashboard 10.25 v4 dev).
  - Step 5 (phone script page: no tool row; Mark + Undo float in the corner, page arrows bottom left; Mark opens a tray
    with every cue type, Undo and Done; computer and iPad unchanged): on dev (Dashboard 10.25 v5 dev).
  - Step 6 (cue sheet: Type and Who drop-downs with counts beside Find and Page; Before House is a row at the top,
    "All cues" row to go back; old tabs and chip strip hidden): on dev (Cue Sheet 10.25 v6 dev).
  - Step 7 (computer and iPad script page: a set change's moves are edited as cards in the side panel under its details;
    no drawer over the script; cue list keeps a third of the panel; phones keep the drawer): on dev (Dashboard 10.25 v6 dev).
  - Step 8 (cue sheet kept loaded inside the script page (cue-list?embed=1): Script | Cue sheet flips instantly with no reload;
    Both = side by side on screens >=1280px, selection follows; Dark look and cue sheet theme are one setting;
    standalone cue sheet still opens the script page): on dev (Dashboard 10.25 v7 dev, Cue Sheet 10.25 v7 dev).
  - Layout steps 2–8 done on dev. Switch is centered in the header on both pages (10.25 v8 dev).
  - NEW LOOK on dev (Dashboard + Cue Sheet 10.26 v1 dev): black and white, Inter font, black header, white for what's on,
    pill buttons, icons on every main button and menu item (drawn with CSS masks), cue sheet as white cards with black scene bars.
    Colors apply to the light theme / normal script look; cue sheet Dark and Red themes and the script page's Dark look keep their
    colors (Dark look still uses its purple accents). Script page + cue sheet only; the rest of the dashboard comes later.
  - Next: Mac tries everything on dev, then take live together.

## Bugs
- **Cue sheet "Script ›" does nothing on phone/iPad** (live 10.25 v1). Fixed on dev by step 2 (same-tab switch); goes live with it.

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
