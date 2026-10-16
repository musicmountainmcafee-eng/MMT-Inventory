# Notes for working on this repo

- Every page carries a version tag at the bottom right (`<div id="build-tag">`,
  format `M.DD vN`, e.g. `10.14 v2`). Bump it on every change to that page, and
  give every new page one. The owner checks it to know a device has the latest copy
  (the service worker serves the cached page first, so a reload or two is needed).
- Never touch real data: test against fake backends only. All data lives in the
  Google Sheet and must stay legible there.
- Backups: before pushing a change, push the commit it builds on as a
  branch `backup/YYYY-MM-DD-before-<what>`
  (`git push origin <sha>:refs/heads/backup/...`; tag pushes are blocked here).
  GitHub Pages only serves the main branch, so backups are never live pages.
  Never keep old copies of pages in the site itself: an old page left online
  can still save over current data. Restore = check out the backup's files
  and push them to main as a new commit.
