# Apps Script copies

Reference copies of the Google Apps Script code behind the dashboard. The live
code is what's deployed in Apps Script; keep these in step when it changes.

| File | Apps Script project | Status |
|---|---|---|
| `MainSheet-Code.gs` | **MMT Warehouse** → Code.gs (web app ending `…BaBg/exec`) | Deployed 10.14 (editing together, who's here, big scripts split across cells) |
| `Inventory-Code.gs` | New separate project for the Inventory tab | Not deployed yet (`WRITES_ON = false` until ready) |
| `ShowNotesDev.gs` | Show notes (dev) | — |

To update the main one: paste `MainSheet-Code.gs` over Code.gs, save, then
Deploy → Manage deployments → pencil → Version: New version → Deploy
(not "New deployment", which changes the web address).
The page `copy-sheet-script.html` has a Copy button for the same code.
