# Apps Script copies

Reference copies of the Google Apps Script code behind the dashboard. The live
code is what's deployed in Apps Script; keep these in step when it changes.

| File | Apps Script project | Status |
|---|---|---|
| `MainSheet-Code.gs` | **MMT Warehouse** → Code.gs (web app ending `…BaBg/exec`) | 10.17 v1 (editing together, who's here, big scripts split across cells, safer writes; any long value — KVStore, ShowNotes, Shopping, TeamConfig, CustomLinks, Cleaning — continues into the next cells instead of failing at 50,000 characters) |
| `Inventory-Code.gs` | New separate project for the Inventory tab and the public catalog | Deployed 10.16, saving on (`WRITES_ON = true`). inv-3: catalog read (no availability for the public) + staff key. inv-4 (10.16): several photos per item with notes (`Item_Photos` tab). inv-5 (10.17): Drops — a `Drop Inventory` tab (one row per drop, IDs like D009), first-time import, kinds/categories/map settings in KVStore row `drops` |
| `ShowNotesDev.gs` | Show notes (dev) | — |

To update the main one: paste `MainSheet-Code.gs` over Code.gs, save, then
Deploy → Manage deployments → pencil → Version: New version → Deploy
(not "New deployment", which changes the web address).
The page `copy-sheet-script.html` has a Copy button for the same code.
