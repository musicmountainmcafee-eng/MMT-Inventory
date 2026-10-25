# MMT TD Dashboard: to-do list

## Live as of Oct 25 (Dashboard 10.25 v1, Cue Sheet 10.25 v1)
- Box editing + jump links; changelog export ("Mark this as sent?", What's changed page, Changes for you); #6.5 plot numbering fix.

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
