# MMT TD Dashboard: to-do list

## On dev, waiting to go live
- **Box editing + jump links** (Cue Sheet / Dashboard 10.25 v1 dev). Waiting on a real-world try.
- **Changelog export** (Cue Sheet 10.25 v2 dev). The plot export asks "Mark this as sent?"; the next export starts with a "What's changed" page and a "Changes for you" box on each person's page.
- **Half-numbered changes print wrong** (live bug, fixed on dev): "SHIFT 6.5" prints as "#5" in the plot PDF and Excel export.

## Back burner
- **Crew link for the set change plot** (built on dev 10.25 v3: `cue-list-dev.html?plot=<script>`; Export > Crew link).
  Read-only plot with tabs along the bottom (Changes, Full plot, Before House, each person), no PIN, live.
  Keep the Export > Crew link button out of live until this is finished.
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
