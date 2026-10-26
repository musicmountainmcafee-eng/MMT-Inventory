# MMT TD Dashboard: to-do list

## Live as of Oct 26 (Dashboard 10.26 v1, Cue Sheet 10.26 v1)
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

## Earlier (Oct 25, 10.25 v1)
- Box editing + jump links; changelog export ("Mark this as sent?", What's changed page, Changes for you); #6.5 plot numbering fix.

## Paused: dashboard layout reorganize (Oct 26)
- Mac's answers: today's to-dos first; phone use is mostly the show notes doc, then to-dos, finding things, script/cue sheet;
  rarely uses To Do 2, Cleaning Log, Drops, Storage Map; every show's scope differs a lot.
- Two mockups made (layout-options.html, sent in chat): A = by type of task, tidier (Today home, 10-item menu, More);
  B = show-first (current show picker, show page tabs, to-dos per show; needs a Show field on to-dos = new Sheet column).
- Next: Mac picks A, B or a mix.

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
