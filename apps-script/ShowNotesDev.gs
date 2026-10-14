/**
 * MMT Show Notes — DEV backend   (10.14 v3)
 *
 * A standalone Apps Script project. It does NOT touch the live dashboard
 * backend, the live Sheet, or any existing show notes workbook. Everything it
 * makes lives in its own Drive folder, "MMT Show Notes (dev)".
 *
 * IT UPDATES ITSELF. When the notes page needs a newer backend, it asks this
 * script to pull apps-script/ShowNotesDev.gs from the MMT-Inventory GitHub
 * repo, replace its own code, and redeploy at the same URL. It only ever
 * moves forward (higher BUILD_NO), and only from that one file.
 *
 * ONE-TIME SETUP (from a laptop) — after this, no more pasting:
 *   1. script.google.com/home/usersettings → "Google Apps Script API" → On.
 *   2. In this project: Project Settings (gear) → tick
 *      "Show 'appsscript.json' manifest file in editor". Open appsscript.json
 *      and replace it with apps-script/appsscript.json from the repo. Save.
 *   3. Replace the code file with this whole file. Save.
 *   4. In the toolbar's function menu pick "setup", click Run, and allow the
 *      permissions. The log should end with "Ready".
 *   5. Deploy → Manage deployments → ✎ → Version: "New version" → Deploy.
 *      (First time ever? Deploy → New deployment → Web app, Execute as Me,
 *      access Anyone, then paste the /exec URL into the page.)
 *
 * HOW THE DATA LOOKS IN SHEETS
 *   One spreadsheet per show, one tab per section. Each tab:
 *
 *     About    | description of this section      ← "fields": any label/value
 *     Scenes   | A1S5, A2S6                          rows above the table
 *     (blank)
 *     Item | Notes | Status | …any columns… | ID    ← header row (ID is last)
 *     one row per item
 *
 *   Fields and columns are whatever you make them. The header row is the one
 *   whose last filled cell says "ID". That column is hidden; it lets the page
 *   find a row again after you sort or insert rows in Sheets. Rows typed in
 *   Sheets get an ID the next time the page loads that show.
 */

var VERSION = '10.14 v3';
var BUILD_NO = 3;          // bump on every backend change; self-update only moves up
var API_LEVEL = 2;
var SOURCE_URLS = [
  'https://api.github.com/repos/musicmountainmcafee-eng/MMT-Inventory/contents/apps-script/ShowNotesDev.gs?ref=main',
  'https://raw.githubusercontent.com/musicmountainmcafee-eng/MMT-Inventory/main/apps-script/ShowNotesDev.gs'
];
var FOLDER_NAME = 'MMT Show Notes (dev)';
var INDEX_NAME = 'MMT Show Notes (dev) — Index';
var DEFAULT_COLUMNS = ['Item', 'Notes', 'Scenes', 'Where', 'Status'];
var DEFAULT_FIELDS = ['About', 'Scenes'];
var STATUSES = ['Idea', 'Planned', 'Building', 'Done', 'Cut'];
var STARTER_TABS = ['General', 'Build To-Do', 'Production Meetings'];

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
var READS = { ping: 1, listBooks: 1, selfUpdate: 1 };   // selfUpdate takes its own lock

function handle_(req) {
  var action = req.action || 'ping';
  var fn = ACTIONS[action];
  if (!fn) return { ok: false, error: 'Unknown action: ' + action + ' (is the Apps Script up to date?)' };
  var lock = null;
  try {
    if (!READS[action]) { lock = LockService.getScriptLock(); lock.waitLock(20000); }
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
  ping: function () { return { version: VERSION, api: API_LEVEL, build: BUILD_NO, selfUpdate: true }; },

  selfUpdate: function () { return selfUpdate_(); },

  listBooks: function () { return { books: readIndex_() }; },

  createBook: function (req) {
    var slug = String(req.slug || '').trim(), name = String(req.name || '').trim();
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

  // ── tabs ──
  // columns/fields: copy the layout of the tab you were on (optional).
  addTab: function (req) {
    var ss = openBook_(req.sheetId);
    var title = uniqueTitle_(ss, String(req.title || 'New tab').trim() || 'New tab');
    var at = req.index != null ? visiblePos_(ss, req.index) : ss.getSheets().length;
    var sh = ss.insertSheet(title, at);
    initTab_(sh, req.columns, req.fields);
    return { tab: readTab_(sh) };
  },

  renameTab: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var title = String(req.title || '').trim();
    if (!title) throw new Error('Title is empty');
    if (title !== sh.getName()) sh.setName(uniqueTitle_(sh.getParent(), title, sh));
    return { title: sh.getName() };
  },

  deleteTab: function (req) {
    var ss = openBook_(req.sheetId);
    if (ss.getSheets().length < 2) throw new Error("Can't delete the last tab");
    ss.deleteSheet(tabByGid_(ss, req.gid));
    return {};
  },

  moveTab: function (req) {
    var ss = openBook_(req.sheetId);
    var sh = tabByGid_(ss, req.gid);
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(visiblePos_(ss, req.index, sh) + 1);
    return {};
  },

  // ── fields (label/value rows above the table) ──
  setField: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var L = layout_(sh);
    var f = fieldRow_(sh, L, req.label);
    if (!f) f = insertField_(sh, L, req.label);
    sh.getRange(f, 2).setValue(cell_(req.value));
    return {};
  },

  renameField: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var L = layout_(sh);
    var f = fieldRow_(sh, L, req.from);
    var to = String(req.to || '').trim();
    if (!to) throw new Error('Field name is empty');
    if (f) sh.getRange(f, 1).setValue(cell_(to)); else insertField_(sh, L, to);
    return {};
  },

  deleteField: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var f = fieldRow_(sh, layout_(sh), req.label);
    if (f) { sh.deleteRow(f); refreeze_(sh); }
    return {};
  },

  // ── columns ──
  addColumn: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var L = layout_(sh);
    var name = uniqueCol_(L.columns, String(req.name || 'New column').trim() || 'New column');
    addColumn_(sh, L, name);
    if (req.index != null) moveColumn_(sh, layout_(sh), name, req.index);
    return { name: name };
  },

  renameColumn: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var L = layout_(sh);
    var c = colIndex_(L, req.from);
    if (c < 0) throw new Error('Column "' + req.from + '" not found');
    var others = L.columns.filter(function (x, i) { return i !== c; });
    var name = uniqueCol_(others, String(req.to || '').trim() || 'Column');
    sh.getRange(L.header, c + 1).setValue(cell_(name));
    if (/^status$/i.test(name) || /^status$/i.test(L.columns[c])) {
      var cols = L.columns.slice(); cols[c] = name;
      sh.getRange(L.header + 1, 1, Math.max(sh.getMaxRows() - L.header, 1), L.idCol).clearDataValidations();
      statusRule_(sh, L.header, cols);
    }
    return { name: name };
  },

  deleteColumn: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var L = layout_(sh);
    var c = colIndex_(L, req.name);
    if (c < 0) return {};
    if (L.columns.length < 2) throw new Error("Can't delete the last column");
    deleteColumn_(sh, L, c);
    return {};
  },

  moveColumn: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    moveColumn_(sh, layout_(sh), req.name, req.index);
    return {};
  },

  // ── rows ──
  // values: {columnName: text}. Only the columns sent are written, so two
  // edits to different cells of the same row can't overwrite each other.
  // New rows go before beforeId (if given) or at the end.
  saveItem: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var L = layout_(sh);
    var id = req.id || newId_();
    var values = req.values || {};
    L = ensureColumns_(sh, L, values);
    var row = findRow_(sh, L, id);
    if (!row) row = newRow_(sh, L, req.beforeId, id);
    Object.keys(values).forEach(function (k) {
      var c = colIndex_(L, k);
      if (c >= 0) sh.getRange(row, c + 1).setValue(cell_(values[k]));
    });
    return { id: id };
  },

  deleteItem: function (req) {
    var sh = tabByGid_(openBook_(req.sheetId), req.gid);
    var row = findRow_(sh, layout_(sh), req.id);
    if (row) sh.deleteRow(row);
    return { deleted: !!row };
  },

  // Reorder within a tab, or move to another tab (toGid). Lands before
  // beforeId, or at the end. Columns are matched by name; a column the
  // target doesn't have is added, so nothing is dropped.
  moveItem: function (req) {
    var ss = openBook_(req.sheetId);
    var from = tabByGid_(ss, req.gid);
    var Lf = layout_(from);
    var r = findRow_(from, Lf, req.id);
    if (!r) throw new Error('Row not found (it may have been deleted in Sheets)');
    var toGid = req.toGid == null ? req.gid : req.toGid;
    if (String(toGid) === String(req.gid)) {
      var dest = req.beforeId ? findRow_(from, Lf, req.beforeId) : Math.max(from.getLastRow(), Lf.header) + 1;
      if (!dest) dest = Math.max(from.getLastRow(), Lf.header) + 1;
      if (dest !== r && dest !== r + 1) from.moveRows(from.getRange(r, 1), dest);
      return {};
    }
    var to = tabByGid_(ss, toGid);
    var vals = from.getRange(r, 1, 1, Lf.idCol).getDisplayValues()[0];
    var values = {};
    Lf.columns.forEach(function (c, i) { if (vals[i] !== '') values[c] = vals[i]; });
    var Lt = ensureColumns_(to, layout_(to), values);
    var row = newRow_(to, Lt, req.beforeId, req.id);
    Object.keys(values).forEach(function (k) { to.getRange(row, colIndex_(Lt, k) + 1).setValue(cell_(values[k])); });
    from.deleteRow(r);
    return {};
  }
};

// ── layout ──────────────────────────────────────────────────────────────────
// header: row number of the header row. columns: names before ID.
// idCol: 1-based column of ID. fields: [{label, value, row}].
function layout_(sh) {
  var last = sh.getLastRow();
  var n = Math.min(Math.max(last, 1), 40);
  var w = Math.max(sh.getLastColumn(), 1);
  var v = sh.getRange(1, 1, n, w).getDisplayValues();
  for (var r = 0; r < v.length; r++) {
    var k = -1;
    for (var c = v[r].length - 1; c >= 0; c--) if (String(v[r][c]).trim() !== '') { k = c; break; }
    if (k > 0 && String(v[r][k]).trim().toUpperCase() === 'ID') {
      var fields = [];
      for (var f = 0; f < r; f++) {
        if (String(v[f][0]).trim()) fields.push({ label: String(v[f][0]).trim(), value: v[f][1] || '', row: f + 1 });
      }
      return { header: r + 1, idCol: k + 1, columns: v[r].slice(0, k).map(function (x, i) { return String(x).trim() || ('Column ' + (i + 1)); }), fields: fields };
    }
  }
  return null;
}

function initTab_(sh, columns, fields) {
  columns = (columns && columns.length ? columns : DEFAULT_COLUMNS).map(String);
  fields = (fields || DEFAULT_FIELDS).map(String);
  var nf = fields.length;
  var header = nf + 2;              // fields, one blank row, header
  var ncol = columns.length + 1;
  sh.getRange(1, 1, sh.getMaxRows(), Math.max(ncol - 1, 1)).setNumberFormat('@');
  if (nf) {
    sh.getRange(1, 1, nf, 1).setValues(fields.map(function (f) { return [cell_(f)]; }))
      .setFontWeight('bold').setFontColor('#57534e');
    sh.getRange(1, 2, nf, 1).setWrap(true);
  }
  sh.getRange(header, 1, 1, ncol).setValues([columns.map(cell_).concat(['ID'])])
    .setFontWeight('bold').setBackground('#eeedfb').setFontColor('#3a3390');
  sh.setFrozenRows(header);
  for (var c = 1; c < ncol; c++) sh.setColumnWidth(c, c === 1 ? 220 : (/notes/i.test(columns[c - 1]) ? 360 : 120));
  sh.getRange(header + 1, 1, Math.max(sh.getMaxRows() - header, 1), ncol).setVerticalAlignment('top').setWrap(true);
  statusRule_(sh, header, columns);
  sh.hideColumns(ncol);
  return sh;
}

function refreeze_(sh) { var L = layout_(sh); if (L) sh.setFrozenRows(L.header); }

function fieldRow_(sh, L, label) {
  if (!L) throw new Error('Tab "' + sh.getName() + '" is not in notes format');
  var want = String(label || '').trim().toLowerCase();
  var f = L.fields.filter(function (x) { return x.label.toLowerCase() === want; })[0];
  return f ? f.row : 0;
}

// New field goes after the last field (or at the top), keeping the blank row
// between fields and the table.
function insertField_(sh, L, label) {
  var after = L.fields.length ? L.fields[L.fields.length - 1].row : 0;
  if (after) sh.insertRowAfter(after); else sh.insertRowBefore(1);
  var row = after + 1;
  sh.getRange(row, 1).setValue(cell_(String(label).trim())).setFontWeight('bold').setFontColor('#57534e');
  sh.getRange(row, 2).setWrap(true);
  refreeze_(sh);
  return row;
}

function colIndex_(L, name) {
  var want = String(name || '').trim().toLowerCase();
  for (var i = 0; i < L.columns.length; i++) if (L.columns[i].toLowerCase() === want) return i;
  return -1;
}

function uniqueCol_(existing, name) {
  var low = existing.map(function (x) { return String(x).toLowerCase(); });
  var t = name, n = 2;
  while (low.indexOf(t.toLowerCase()) !== -1 || t.toUpperCase() === 'ID') t = name + ' ' + (n++);
  return t;
}

// Column edits rewrite only the table (header row and below). Whole-column
// operations would also shift the fields above the table, which share
// columns A and B with it.
//   spec: [{name, from}] — from is the old 0-based column, or -1 for new.
function rewriteTable_(sh, L, spec) {
  var last = Math.max(sh.getLastRow(), L.header);
  var n = last - L.header + 1;
  var old = sh.getRange(L.header, 1, n, L.idCol).getValues();
  var w = spec.length + 1;
  var rows = old.map(function (r, i) {
    var out = spec.map(function (c) { return i === 0 ? c.name : (c.from >= 0 ? r[c.from] : ''); });
    out.push(r[L.idCol - 1]);
    return out.map(function (v) { return typeof v === 'string' ? cell_(v) : v; });
  });
  var wide = Math.max(w, L.idCol);
  var data = Math.max(sh.getMaxRows() - L.header, 1);
  sh.getRange(L.header + 1, 1, data, wide).clearDataValidations();
  sh.getRange(L.header + 1, 1, data, w - 1).setNumberFormat('@');
  if (w < L.idCol) sh.getRange(L.header, w + 1, n, L.idCol - w).clearContent();
  sh.getRange(L.header, 1, n, w).setValues(rows);
  sh.getRange(L.header, 1, 1, w).setFontWeight('bold').setBackground('#eeedfb').setFontColor('#3a3390');
  if (w < L.idCol) sh.getRange(L.header, w + 1, 1, L.idCol - w).setBackground(null);
  sh.showColumns(1, wide);
  sh.hideColumns(w);
  statusRule_(sh, L.header, spec.map(function (c) { return c.name; }));
}

function specOf_(L) { return L.columns.map(function (c, i) { return { name: c, from: i }; }); }

function statusRule_(sh, header, columns) {
  var si = columns.map(function (x) { return String(x).toLowerCase(); }).indexOf('status');
  if (si < 0) return;
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(true).build();
  sh.getRange(header + 1, si + 1, Math.max(sh.getMaxRows() - header, 1), 1).setDataValidation(rule);
}

function addColumn_(sh, L, name) {
  var spec = specOf_(L);
  spec.push({ name: name, from: -1 });
  rewriteTable_(sh, L, spec);
  sh.setColumnWidth(spec.length, 140);
  return spec.length;
}

function deleteColumn_(sh, L, c) {
  rewriteTable_(sh, L, specOf_(L).filter(function (x, i) { return i !== c; }));
}

function ensureColumns_(sh, L, values) {
  if (!L) throw new Error('Tab "' + sh.getName() + '" is not in notes format');
  Object.keys(values).forEach(function (k) {
    if (colIndex_(L, k) < 0 && String(values[k]) !== '') { addColumn_(sh, L, k); L = layout_(sh); }
  });
  return L;
}

// index: final 0-based position among the columns.
function moveColumn_(sh, L, name, index) {
  var from = colIndex_(L, name);
  if (from < 0) throw new Error('Column "' + name + '" not found');
  var to = Math.max(0, Math.min(Number(index) || 0, L.columns.length - 1));
  if (to === from) return;
  var spec = specOf_(L);
  var moving = spec.splice(from, 1)[0];
  spec.splice(to, 0, moving);
  rewriteTable_(sh, L, spec);
}

function findRow_(sh, L, id) {
  if (!L) throw new Error('Tab "' + sh.getName() + '" is not in notes format');
  var last = sh.getLastRow();
  if (last <= L.header || !id) return 0;
  var ids = sh.getRange(L.header + 1, L.idCol, last - L.header, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return L.header + 1 + i;
  return 0;
}

function newRow_(sh, L, beforeId, id) {
  var before = beforeId ? findRow_(sh, L, beforeId) : 0;
  var row;
  if (before) { sh.insertRowBefore(before); row = before; }
  else row = Math.max(sh.getLastRow(), L.header) + 1;
  sh.getRange(row, L.idCol).setValue(id);
  return row;
}

function readTab_(sh) {
  var tab = { gid: sh.getSheetId(), title: sh.getName(), fields: [], columns: [], items: [], format: 'notes' };
  if (sh.getLastRow() === 0) initTab_(sh);   // a blank tab added in Sheets
  var L = layout_(sh);
  if (!L) {
    // Freeform tab typed in Sheets: hand back the text so nothing is hidden.
    var raw = sh.getRange(1, 1, sh.getLastRow(), Math.max(sh.getLastColumn(), 1)).getDisplayValues();
    tab.format = 'freeform';
    tab.lines = raw.map(function (r) { return r.filter(String).join(' · '); }).filter(String);
    return tab;
  }
  tab.fields = L.fields.map(function (f) { return { label: f.label, value: f.value }; });
  tab.columns = L.columns.slice();
  var last = sh.getLastRow();
  if (last > L.header) {
    var rows = sh.getRange(L.header + 1, 1, last - L.header, L.idCol).getDisplayValues();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], id = r[L.idCol - 1];
      var empty = !r.slice(0, L.idCol - 1).join('').trim();
      if (empty && !id) continue;
      if (!id) { id = newId_(); sh.getRange(L.header + 1 + i, L.idCol).setValue(id); }
      var v = {};
      tab.columns.forEach(function (c, j) { v[c] = r[j]; });
      tab.items.push({ id: id, v: v });
    }
  }
  return tab;
}

function tabByGid_(ss, gid) {
  var sh = ss.getSheets().filter(function (x) { return String(x.getSheetId()) === String(gid); })[0];
  if (!sh) throw new Error('Tab not found (it may have been deleted in Sheets)');
  return sh;
}

// Position among all sheets of the index-th visible sheet.
function visiblePos_(ss, index, moving) {
  var all = ss.getSheets();
  var vis = all.filter(function (x) { return !x.isSheetHidden() && x !== moving; });
  var i = Math.max(0, Math.min(Number(index) || 0, vis.length));
  if (i >= vis.length) return all.length - (moving ? 1 : 0);
  var target = vis[i];
  var pos = all.indexOf(target);
  if (moving && all.indexOf(moving) < pos) pos -= 1;
  return pos;
}

function uniqueTitle_(ss, title, self) {
  var names = ss.getSheets().filter(function (x) { return x !== self; }).map(function (x) { return x.getName().toLowerCase(); });
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
function cell_(v) {
  v = v == null ? '' : String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

// ── self-update ─────────────────────────────────────────────────────────────
// Pull the newest ShowNotesDev.gs from GitHub, swap it in as this project's
// code, save a version, and point every web-app deployment at it. Same URL,
// new code. Needs the Apps Script API turned on and the scopes in
// appsscript.json (see setup above).
function selfUpdate_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return { updated: false, reason: 'An update is already running' };
  try {
    var props = PropertiesService.getScriptProperties();
    var src = fetchSource_();
    var m = src.match(/var BUILD_NO = (\d+);/);
    var remote = m ? Number(m[1]) : 0;
    if (!remote) throw new Error('Downloaded file has no BUILD_NO; not updating');
    if (remote <= BUILD_NO) return { updated: false, reason: 'Already up to date', build: BUILD_NO };
    if (src.indexOf('function doGet(') === -1 || src.indexOf('function selfUpdate_(') === -1) {
      throw new Error('Downloaded file does not look like this backend; not updating');
    }
    // Refuse code that doesn't even parse, so a bad push can't break the backend.
    new Function(src);

    var id = ScriptApp.getScriptId();
    var base = 'https://script.googleapis.com/v1/projects/' + id;
    var content = scriptApi_('get', base + '/content');
    var files = (content.files || []).filter(function (f) { return f.type !== 'SERVER_JS'; });
    var codeName = ((content.files || []).filter(function (f) { return f.type === 'SERVER_JS'; })[0] || {}).name || 'Code';
    files.push({ name: codeName, type: 'SERVER_JS', source: src });
    scriptApi_('put', base + '/content', { scriptId: id, files: files });

    var ver = scriptApi_('post', base + '/versions', { description: 'Self-update to build ' + remote });
    var deps = (scriptApi_('get', base + '/deployments').deployments || []).filter(function (d) {
      return d.deploymentConfig && d.deploymentConfig.versionNumber &&
        (d.entryPoints || []).some(function (e) { return e.entryPointType === 'WEB_APP'; });
    });
    deps.forEach(function (d) {
      scriptApi_('put', base + '/deployments/' + d.deploymentId, { deploymentConfig: {
        scriptId: id, versionNumber: ver.versionNumber, manifestFileName: 'appsscript',
        description: 'Show Notes backend build ' + remote } });
    });
    props.setProperty('LAST_UPDATE', JSON.stringify({ from: BUILD_NO, to: remote, at: new Date().toISOString() }));
    return { updated: true, from: BUILD_NO, to: remote, version: ver.versionNumber, deployments: deps.length };
  } finally { lock.releaseLock(); }
}

function fetchSource_() {
  var last = '';
  for (var i = 0; i < SOURCE_URLS.length; i++) {
    try {
      var r = UrlFetchApp.fetch(SOURCE_URLS[i] + (SOURCE_URLS[i].indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now(), {
        muteHttpExceptions: true, headers: { Accept: 'application/vnd.github.raw' } });
      if (r.getResponseCode() === 200) return r.getContentText();
      last = 'HTTP ' + r.getResponseCode();
    } catch (e) { last = String(e.message || e); }
  }
  throw new Error("Couldn't download the update from GitHub (" + last + ')');
}

function scriptApi_(method, url, body) {
  var opt = { method: method, muteHttpExceptions: true, contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } };
  if (body) opt.payload = JSON.stringify(body);
  var r = UrlFetchApp.fetch(url, opt);
  var code = r.getResponseCode(), text = r.getContentText();
  if (code >= 300) {
    if (/has not been used|is disabled|SERVICE_DISABLED|User has not enabled the Apps Script API/i.test(text)) {
      throw new Error('Turn on "Google Apps Script API" at script.google.com/home/usersettings, then try again');
    }
    throw new Error('Apps Script API ' + code + ': ' + text.slice(0, 200));
  }
  return text ? JSON.parse(text) : {};
}

// Run once from the editor (pick "setup" in the toolbar, click Run). It asks
// for the permissions the backend needs and checks self-update can work.
function setup() {
  index_(); folder_();
  var id = ScriptApp.getScriptId();
  var deps = scriptApi_('get', 'https://script.googleapis.com/v1/projects/' + id + '/deployments').deployments || [];
  UrlFetchApp.fetch(SOURCE_URLS[1], { muteHttpExceptions: true });
  Logger.log('Found ' + deps.length + ' deployment(s). Ready: this backend can now update itself.');
}
