/**
 * MMT Show Notes — DEV backend   (10.14 v1)
 *
 * A standalone Apps Script project. It does NOT touch the live dashboard
 * backend, the live Sheet, or any existing show notes workbook. Everything it
 * makes lives in its own Drive folder, "MMT Show Notes (dev)".
 *
 * SETUP (once, from a laptop):
 *   1. script.google.com → New project. Name it "MMT Show Notes DEV".
 *   2. Delete the starter code, paste this whole file, save.
 *   3. Deploy → New deployment → type "Web app".
 *        Execute as: Me      Who has access: Anyone
 *   4. Authorize when asked (Drive + Sheets).
 *   5. Copy the Web app URL (ends in /exec) and paste it into the dev page's
 *      "Connect" box.
 *
 * HOW THE DATA LOOKS IN SHEETS
 *   One spreadsheet per show. One tab per section (a setting, a list, a
 *   meeting…). Every tab has the same shape, so it reads fine in Sheets and you
 *   can type straight into it there too:
 *
 *     A1  About    | B1  description of this section
 *     A2  Scenes   | B2  A1S5, A2S6
 *     (blank)
 *     A4  Item | Notes | Scenes | Where | Status | ID   ← header row
 *     A5… one row per item
 *
 *   The ID column is hidden; it lets the dashboard find a row again after you
 *   sort or insert rows in Sheets. Rows you type in Sheets get an ID the next
 *   time the page loads that show.
 */

var VERSION = '10.14 v1';
var FOLDER_NAME = 'MMT Show Notes (dev)';
var INDEX_NAME = 'MMT Show Notes (dev) — Index';
var HEADERS = ['Item', 'Notes', 'Scenes', 'Where', 'Status', 'ID'];
var STATUSES = ['Idea', 'Planned', 'Building', 'Done', 'Cut'];
var STARTER_TABS = ['General', 'Build To-Do', 'Production Meetings'];
var NCOL = HEADERS.length;

// ── entry points ────────────────────────────────────────────────────────────
function doGet(e) {
  var p = (e && e.parameter) || {};
  var req = {};
  if (p.payload) { try { req = JSON.parse(p.payload); } catch (err) { req = {}; } }
  if (p.action) req.action = p.action;
  return respond_(handle_(req), p.callback);
}

function doPost(e) {
  var req = {};
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  return respond_(handle_(req), null);
}

function respond_(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// getBook can write (it stamps IDs on rows typed in Sheets), so it locks too.
var READS = { ping: 1, listBooks: 1 };

function handle_(req) {
  var action = req.action || 'ping';
  var fn = ACTIONS[action];
  if (!fn) return { ok: false, error: 'Unknown action: ' + action };
  var lock = null;
  try {
    if (!READS[action]) {
      lock = LockService.getScriptLock();
      lock.waitLock(20000);
    }
    var out = fn(req) || {};
    out.ok = true;
    return out;
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  } finally {
    if (lock) { try { lock.releaseLock(); } catch (e2) {} }
  }
}

var ACTIONS = {
  ping: function () { return { version: VERSION }; },

  listBooks: function () { return { books: readIndex_() }; },

  createBook: function (req) {
    var slug = String(req.slug || '').trim();
    var name = String(req.name || '').trim();
    if (!slug || !name) throw new Error('slug and name are required');
    var existing = readIndex_().filter(function (b) { return b.slug === slug; })[0];
    if (existing) return { book: existing, existed: true };

    var ss = SpreadsheetApp.create(name + ' — Show Notes');
    DriveApp.getFileById(ss.getId()).moveTo(folder_());
    var first = ss.getSheets()[0];
    first.setName(STARTER_TABS[0]);
    initTab_(first);
    for (var i = 1; i < STARTER_TABS.length; i++) initTab_(ss.insertSheet(STARTER_TABS[i]));

    var book = { slug: slug, name: name, sheetId: ss.getId(), url: ss.getUrl(), created: new Date().toISOString() };
    index_().getSheets()[0].appendRow([book.slug, book.name, book.sheetId, book.url, book.created]);
    return { book: book };
  },

  getBook: function (req) {
    var ss = openBook_(req.sheetId);
    var tabs = ss.getSheets().filter(function (sh) { return !sh.isSheetHidden(); })
      .map(function (sh) { return readTab_(sh); });
    return { sheetId: ss.getId(), url: ss.getUrl(), name: ss.getName(), tabs: tabs };
  },

  addTab: function (req) {
    var ss = openBook_(req.sheetId);
    var title = uniqueTitle_(ss, String(req.title || 'New tab').trim() || 'New tab');
    var sh = ss.insertSheet(title, ss.getSheets().length);
    initTab_(sh);
    if (req.description || req.scenes) writeMeta_(sh, req.description, req.scenes);
    return { tab: readTab_(sh) };
  },

  renameTab: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var title = String(req.title || '').trim();
    if (!title) throw new Error('Title is empty');
    if (title !== sh.getName()) sh.setName(uniqueTitle_(sh.getParent(), title));
    return { title: sh.getName() };
  },

  deleteTab: function (req) {
    var ss = openBook_(req.sheetId);
    if (ss.getSheets().length < 2) throw new Error("Can't delete the last tab");
    ss.deleteSheet(tabByGid_(ss, req.gid));
    return {};
  },

  setTabMeta: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    writeMeta_(sh, req.description, req.scenes);
    return {};
  },

  // Insert or update one item, matched by ID.
  saveItem: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var it = req.item || {};
    if (!it.id) it.id = newId_();
    var h = headerRow_(sh);
    if (!h) throw new Error('Tab "' + sh.getName() + '" is not in notes format');
    var row = findRow_(sh, h, it.id);
    var vals = [[s_(it.item), s_(it.notes), s_(it.scenes), s_(it.where), s_(it.status), it.id]];
    if (row) sh.getRange(row, 1, 1, NCOL).setValues(vals);
    else sh.getRange(Math.max(sh.getLastRow(), h) + 1, 1, 1, NCOL).setValues(vals);
    return { id: it.id };
  },

  deleteItem: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var h = headerRow_(sh);
    var row = h && findRow_(sh, h, req.id);
    if (row) sh.deleteRow(row);
    return { deleted: !!row };
  },

  // Move an item to another tab (keeps its ID).
  moveItem: function (req) {
    var ss = openBook_(req.sheetId);
    var from = tabByGid_(ss, req.gid), to = tabByGid_(ss, req.toGid);
    var hf = headerRow_(from), ht = headerRow_(to);
    if (!ht) throw new Error('Target tab is not in notes format');
    var row = hf && findRow_(from, hf, req.id);
    if (!row) throw new Error('Item not found');
    var vals = from.getRange(row, 1, 1, NCOL).getValues();
    to.getRange(Math.max(to.getLastRow(), ht) + 1, 1, 1, NCOL).setValues(vals);
    from.deleteRow(row);
    return {};
  }
};

// ── tabs ────────────────────────────────────────────────────────────────────
function initTab_(sh) {
  // Plain-text format so "1/2" or "3-4" stay as typed instead of becoming dates.
  sh.getRange(1, 1, sh.getMaxRows(), NCOL - 1).setNumberFormat('@');
  sh.getRange(1, 1, 2, 2).setValues([['About', ''], ['Scenes', '']]);
  sh.getRange(1, 1, 2, 1).setFontWeight('bold').setFontColor('#57534e');
  try { sh.getRange(1, 2, 1, NCOL - 2).merge(); sh.getRange(2, 2, 1, NCOL - 2).merge(); } catch (e) {}
  sh.getRange(1, 2, 2, 1).setWrap(true);
  sh.getRange(4, 1, 1, NCOL).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#eeedfb').setFontColor('#3a3390');
  sh.setFrozenRows(4);
  sh.setColumnWidth(1, 220); sh.setColumnWidth(2, 360); sh.setColumnWidth(3, 110);
  sh.setColumnWidth(4, 90); sh.setColumnWidth(5, 90);
  sh.getRange(5, 1, Math.max(sh.getMaxRows() - 4, 1), 2).setWrap(true);
  sh.getRange(5, 1, Math.max(sh.getMaxRows() - 4, 1), NCOL).setVerticalAlignment('top');
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(true).build();
  sh.getRange(5, 5, Math.max(sh.getMaxRows() - 4, 1), 1).setDataValidation(rule);
  sh.hideColumns(NCOL);
  return sh;
}

// Header row = first row in the top 15 whose first and last cells read Item / ID.
function headerRow_(sh) {
  var n = Math.min(Math.max(sh.getLastRow(), 1), 15);
  var v = sh.getRange(1, 1, n, NCOL).getValues();
  for (var r = 0; r < v.length; r++) {
    if (String(v[r][0]).trim().toLowerCase() === 'item' && String(v[r][NCOL - 1]).trim().toUpperCase() === 'ID') return r + 1;
  }
  return 0;
}

function findRow_(sh, h, id) {
  var last = sh.getLastRow();
  if (last <= h || !id) return 0;
  var ids = sh.getRange(h + 1, NCOL, last - h, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return h + 1 + i;
  return 0;
}

function writeMeta_(sh, description, scenes) {
  var h = headerRow_(sh) || 4;
  if (h < 2) return;
  var labels = sh.getRange(1, 1, h - 1, 1).getValues();
  for (var r = 0; r < labels.length; r++) {
    var k = String(labels[r][0]).trim().toLowerCase();
    if (k === 'about' && description != null) sh.getRange(r + 1, 2).setValue(s_(description));
    if (k === 'scenes' && scenes != null) sh.getRange(r + 1, 2).setValue(s_(scenes));
  }
}

function readTab_(sh) {
  var tab = { gid: sh.getSheetId(), title: sh.getName(), description: '', scenes: '', items: [], format: 'notes' };
  var last = sh.getLastRow();
  if (last === 0) { initTab_(sh); return tab; }   // a blank tab added in Sheets
  var h = headerRow_(sh);
  if (!h) {
    // Freeform tab typed in Sheets: hand back the text so nothing is hidden.
    var raw = sh.getRange(1, 1, last, Math.max(sh.getLastColumn(), 1)).getDisplayValues();
    tab.format = 'freeform';
    tab.lines = raw.map(function (r) { return r.filter(String).join(' · '); }).filter(String);
    return tab;
  }
  var top = sh.getRange(1, 1, h - 1 || 1, 2).getDisplayValues();
  top.forEach(function (r) {
    var k = String(r[0]).trim().toLowerCase();
    if (k === 'about') tab.description = r[1];
    if (k === 'scenes') tab.scenes = r[1];
  });
  if (last > h) {
    var rows = sh.getRange(h + 1, 1, last - h, NCOL).getDisplayValues();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r.slice(0, NCOL - 1).join('').trim()) continue;
      var id = r[NCOL - 1];
      if (!id) {                       // typed in Sheets — give it an ID
        id = newId_();
        sh.getRange(h + 1 + i, NCOL).setValue(id);
      }
      tab.items.push({ id: id, item: r[0], notes: r[1], scenes: r[2], where: r[3], status: r[4] });
    }
  }
  return tab;
}

function tabByGid_(ss, gid) {
  var sh = ss.getSheets().filter(function (x) { return String(x.getSheetId()) === String(gid); })[0];
  if (!sh) throw new Error('Tab not found (it may have been deleted in Sheets)');
  return sh;
}

function uniqueTitle_(ss, title) {
  var names = ss.getSheets().map(function (x) { return x.getName().toLowerCase(); });
  var t = title.slice(0, 90), n = 2;
  while (names.indexOf(t.toLowerCase()) !== -1) t = title.slice(0, 85) + ' ' + (n++);
  return t;
}

// ── index & safety ──────────────────────────────────────────────────────────
// Only spreadsheets this script created can be opened. The web app is reachable
// by URL, so this keeps it from being used to read any other file in Drive.
function openBook_(sheetId) {
  var ok = readIndex_().some(function (b) { return b.sheetId === sheetId; });
  if (!ok) throw new Error('That notebook is not in the dev index');
  return SpreadsheetApp.openById(sheetId);
}

function readIndex_() {
  var sh = index_().getSheets()[0];
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 5).getDisplayValues()
    .filter(function (r) { return r[2]; })
    .map(function (r) { return { slug: r[0], name: r[1], sheetId: r[2], url: r[3], created: r[4] }; });
}

function index_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('INDEX_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var ss = SpreadsheetApp.create(INDEX_NAME);
  DriveApp.getFileById(ss.getId()).moveTo(folder_());
  var sh = ss.getSheets()[0];
  sh.setName('Notebooks');
  sh.getRange(1, 1, 1, 5).setValues([['Slug', 'Show', 'Sheet ID', 'URL', 'Created']]).setFontWeight('bold');
  sh.setFrozenRows(1);
  props.setProperty('INDEX_ID', ss.getId());
  return ss;
}

function folder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', f.getId());
  return f;
}

function newId_() { return 'n' + Utilities.getUuid().replace(/-/g, '').slice(0, 10); }
// Text going into a cell. A leading = + - @ would make Sheets parse it as a
// formula ("- big old wheelchair" → #ERROR!), so those get a ' prefix, which
// Sheets hides.
function s_(v) {
  v = v == null ? '' : String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
