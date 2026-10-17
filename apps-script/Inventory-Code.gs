/**
 * MMT Inventory — the dashboard's Inventory tab talks to this script.
 *
 * It opens the warehouse Sheet by its ID and works on these tabs only:
 *   Inventory       one row per item (read; check in/out and edits change
 *                   only the cells named below, never whole rows)
 *   Form_Responses  the check in/out log (a row is added per item, per move)
 *   New_Assets      a row is added when an item is added (same as before)
 *   Paint_Library   the paint colors
 *   Prefix_Table    read only: category prefixes and subcategory codes
 *   KVStore         only its "catalog" row: the public catalog's settings
 *                   (whether rental prices show)
 *
 * The public catalog (index.html) asks for action=catalog and gets only what
 * the public may see. Everything else needs the staff key (the dashboard PIN),
 * which the dashboard and the catalog's staff view send with each request.
 * Columns are found by their header text, so nothing has to move, and no
 * column is ever added, removed or renamed.
 *
 * SAFETY SWITCH: while WRITES_ON is false this script only reads. Check that
 * the dashboard shows your inventory correctly, then set it to true, save,
 * and Deploy > Manage deployments > edit > Version: New version > Deploy.
 */
const SHEET_ID  = '1ZC6eyjym1wLtPNG9G_rNFP_Txke1-VJtt7mrPsL0WOA';
const WRITES_ON = true;   // saving is on (switched on 10.16)
const VERSION   = 'inv-4';
// The dashboard PIN. Change it here and in the dashboard together.
const STAFF_KEY = '1483';

const TAB = { inv: 'Inventory', log: 'Form_Responses', added: 'New_Assets', paint: 'Paint_Library', prefix: 'Prefix_Table', photos: 'Item_Photos' };

// The Inventory headers this script uses, by job. Each lists the spellings it
// accepts (case and spaces at the ends don't matter).
const INV_COLS = {
  assetId:     ['Asset ID'],
  tagId:       ['Tag ID'],
  name:        ['Name'],
  quantity:    ['Quantity'],
  photo:       ['Photo'],
  category:    ['Category'],
  subcategory: ['Subcatagorey', 'Subcategory', 'Sub Category'],
  location:    ['Storage Location'],
  status:      ['Status'],
  dueBack:     ['due back', 'Due Back'],
  type:        ['Type'],
  currentShow: ['Current show'],
  rental:      ['Rental Value'],
  replacement: ['Replacement Value'],
  notes:       ['Notes'],
  lastDate:    ['Laat Used Date', 'Last Used Date'],
  lastShow:    ['Last Used Show'],
  labelText:   ['Label Text'],
  subcatCode:  ['Subcat Code'],
};
const LOG_COLS = {
  when:      ['Timestamp'],
  assetId:   ['Asset ID'],
  action:    ['Action'],
  who:       ['Show/Renter'],
  dueBack:   ['Due Date'],
  condition: ['Condition Notes'],
  staff:     ['Your Name'],
  type:      ['Type'],
  photo:     ['Photo (Optional)', 'Photo'],
};
const PAINT_COLS = {
  id: ['ID'], name: ['Name'], brand: ['Brand'], code: ['Code'], hex: ['Hex'],
  notes: ['Notes'], shows: ['Shows'], added: ['Added Date'],
};

// ── Entry points ────────────────────────────────────────────────────────────
function doGet(e) {
  const p = (e && e.parameter) || {};
  const cb = p.callback;
  try {
    const ss = book();
    let res;
    if (p.action === 'catalog') return out(withVer(catalog(ss, staffOk(p))), cb);
    if (p.action && !staffOk(p)) return out(withVer({ success: false, needKey: true, error: 'Staff PIN needed.' }), cb);
    switch (p.action) {
      case 'all':       res = { success: true, items: readItems(ss), history: readHistory(ss), paints: readPaints(ss), prefixes: readPrefixes(ss), nextId: nextAssetId(ss) }; break;
      case 'inventory': res = { success: true, items: readItems(ss) }; break;
      case 'history':   res = { success: true, history: readHistory(ss) }; break;
      case 'paints':    res = { success: true, paints: readPaints(ss) }; break;
      case 'nextId':    res = { success: true, nextId: nextAssetId(ss) }; break;
      default:          res = { success: true, message: 'MMT Inventory running' };
    }
    return out(withVer(res), cb);
  } catch (err) {
    return out({ success: false, error: String(err && err.message || err) }, cb);
  }
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); }
  catch (err) { return out({ success: false, error: 'Bad request' }); }
  if (!staffOk(data)) return out({ success: false, needKey: true, error: 'Staff PIN needed.' });
  if (data.action === 'catalogSet') return out(catalogSet(data));   // a setting, not inventory: allowed while WRITES_ON is false
  if (!WRITES_ON) return out({ success: false, readOnly: true, error: 'Saving is switched off in the inventory script (WRITES_ON = false).' });
  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); }
  catch (err) { return out({ success: false, error: 'The Sheet is busy, try again in a moment.' }); }
  try {
    const ss = book();
    switch (data.action) {
      case 'checkInOut':  return out(checkInOut(ss, data));
      case 'addAsset':    return out(addAsset(ss, data));
      case 'editAsset':   return out(editAsset(ss, data));
      case 'savePaint':   return out(savePaint(ss, data));
      case 'deletePaint': return out(deletePaint(ss, data));
      case 'setPhotos':   return out(setPhotos(ss, data));
    }
    return out({ success: false, error: 'Unknown action' });
  } catch (err) {
    return out({ success: false, error: String(err && err.message || err) });
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

// ── Catalog ─────────────────────────────────────────────────────────────────
function staffOk(p) { return !STAFF_KEY || String((p && p.key) || '') === STAFF_KEY; }
function withVer(res) { res.writesOn = WRITES_ON; res.version = VERSION; return res; }

// Settings live in the KVStore tab, row "catalog", as readable JSON.
function catalogSettings(ss) {
  const sh = ss.getSheetByName('KVStore');
  const def = { showRental: false };
  if (!sh) return def;
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) if (str(v[i][0]) === 'catalog') {
    try { return Object.assign(def, JSON.parse(v[i][1])); } catch (err) { return def; }
  }
  return def;
}

// The public get what a renter may see; staff get everything.
function catalog(ss, staff) {
  const settings = catalogSettings(ss);
  const items = readItems(ss).map(it => {
    if (staff) return it;
    const pub = { assetId: it.assetId, tagId: it.tagId, name: it.name, quantity: it.quantity, photo: it.photo,
      category: it.category, subcategory: it.subcategory };   // availability is for staff only
    if (it.photos) pub.photos = it.photos.map(p => ({ url: p.url }));   // photo notes are for staff only
    if (settings.showRental) pub.rental = it.rental;
    return pub;
  });
  return { success: true, staff, settings, items };
}

function catalogSet(d) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return { success: false, error: 'The Sheet is busy, try again in a moment.' }; }
  try {
    const ss = book();
    const sh = ss.getSheetByName('KVStore');
    if (!sh) return { success: false, error: 'The Sheet has no "KVStore" tab.' };
    const cur = catalogSettings(ss);
    if (typeof d.showRental === 'boolean') cur.showRental = d.showRental;
    const json = JSON.stringify(cur);
    const v = sh.getDataRange().getValues();
    let row = -1;
    for (let i = 1; i < v.length; i++) if (str(v[i][0]) === 'catalog') { row = i + 1; break; }
    if (row < 0) sh.appendRow(['catalog', json]); else sh.getRange(row, 2).setValue(json);
    SpreadsheetApp.flush();
    return { success: true, settings: cur };
  } finally { lock.releaseLock(); }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function book() { return SpreadsheetApp.openById(SHEET_ID); }

function out(obj, cb) {
  const s = JSON.stringify(obj);
  if (cb && /^[A-Za-z_$][\w$.]*$/.test(cb))
    return ContentService.createTextOutput(cb + '(' + s + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}

function tab(ss, name, required) {
  const sh = ss.getSheetByName(name);
  if (!sh && required) throw new Error('The Sheet has no "' + name + '" tab.');
  return sh;
}

// { job: columnIndex (0-based) or -1 }
function colMap(headers, spec) {
  const norm = headers.map(h => String(h || '').trim().toLowerCase());
  const m = {};
  Object.keys(spec).forEach(k => {
    m[k] = -1;
    for (const name of spec[k]) {
      const i = norm.indexOf(name.toLowerCase());
      if (i > -1) { m[k] = i; break; }
    }
  });
  return m;
}

function tz(ss) { return ss.getSpreadsheetTimeZone() || 'America/New_York'; }
function isDate(v) { return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v); }
function dayStr(ss, v) {
  if (isDate(v)) return Utilities.formatDate(v, tz(ss), 'yyyy-MM-dd');
  return String(v == null ? '' : v).trim();
}
function stampStr(ss, v) {
  if (isDate(v)) return Utilities.formatDate(v, tz(ss), "yyyy-MM-dd'T'HH:mm:ss");
  return String(v == null ? '' : v).trim();
}
function str(v) { return String(v == null ? '' : v).trim(); }
function idKey(v) { return str(v).toUpperCase(); }

// '2026-10-23' -> a real date, so the Sheet shows and sorts it as one.
function toDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(s));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : str(s);
}

// ── Reads ───────────────────────────────────────────────────────────────────
function invTable(ss) {
  const sh = tab(ss, TAB.inv, true);
  const values = sh.getDataRange().getValues();
  const c = colMap(values[0] || [], INV_COLS);
  if (c.assetId < 0 || c.name < 0) throw new Error('Inventory tab is missing its "Asset ID" or "Name" header.');
  return { sh, values, c };
}

function rowToItem(ss, r, c, rowNum) {
  const g = k => (c[k] > -1 ? r[c[k]] : '');
  return {
    row: rowNum,
    assetId: str(g('assetId')), tagId: str(g('tagId')), name: str(g('name')),
    quantity: str(g('quantity')), photo: str(g('photo')),
    category: str(g('category')), subcategory: str(g('subcategory')), location: str(g('location')),
    status: str(g('status')).toUpperCase(), dueBack: dayStr(ss, g('dueBack')), type: str(g('type')),
    currentShow: str(g('currentShow')), rental: str(g('rental')), replacement: str(g('replacement')),
    notes: str(g('notes')), lastDate: dayStr(ss, g('lastDate')), lastShow: str(g('lastShow')),
  };
}

function readItems(ss) {
  const { values, c } = invTable(ss);
  const items = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!str(r[c.assetId]) && !str(r[c.name])) continue;   // blank rows
    items.push(rowToItem(ss, r, c, i + 1));
  }
  const photos = readPhotos(ss);
  items.forEach(it => { const p = photos[idKey(it.assetId)]; if (p) it.photos = p; });
  return items;
}

// ── Photos: one row per photo in the Item_Photos tab ────────────────────────
// Columns: Asset ID, Photo, Note, Order, Added. The first photo is the cover,
// which also stays in the Inventory tab's Photo column.
const PHOTO_HEAD = ['Asset ID', 'Photo', 'Note', 'Order', 'Added'];
function readPhotos(ss) {
  const sh = tab(ss, TAB.photos, false);
  const map = {};
  if (!sh) return map;
  const v = sh.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < v.length; i++) {
    const id = idKey(v[i][0]), url = str(v[i][1]);
    if (id && url) rows.push({ id, url, note: str(v[i][2]), order: Number(v[i][3]) || 0, i });
  }
  rows.sort((a, b) => a.order - b.order || a.i - b.i);
  rows.forEach(r => (map[r.id] = map[r.id] || []).push({ url: r.url, note: r.note }));
  return map;
}
function photoSig(list) { return JSON.stringify((list || []).map(p => [str(p.url), str(p.note)])); }

// Replaces one item's photos. "base" is the list the editor started from;
// if someone changed the photos meanwhile, nothing is saved and theirs come back.
function setPhotos(ss, d) {
  const { sh, values, c } = invTable(ss);
  const i = findRow(values, c, d.assetId);
  if (i < 0) return { success: false, error: 'Item not found: ' + d.assetId };
  const key = idKey(d.assetId);
  const cover = str(values[i][c.photo]);
  const now = readPhotos(ss)[key] || (cover ? [{ url: cover, note: '' }] : []);
  if (Array.isArray(d.base) && photoSig(d.base) !== photoSig(now))
    return { success: false, conflict: true, photos: now, error: 'Someone else changed these photos meanwhile. Their photos were kept; yours were not saved.' };
  const list = (Array.isArray(d.photos) ? d.photos : []).map(p => ({ url: str(p && p.url), note: str(p && p.note) }))
    .filter(p => /^https:\/\//.test(p.url)).slice(0, 30);
  let ph = tab(ss, TAB.photos, false);
  if (!ph) { ph = ss.insertSheet(TAB.photos); ph.appendRow(PHOTO_HEAD); }
  const pv = ph.getDataRange().getValues();
  const added = {};
  for (let r = pv.length - 1; r >= 1; r--) if (idKey(pv[r][0]) === key) { added[str(pv[r][1])] = pv[r][4]; ph.deleteRow(r + 1); }
  const stamp = stampStr(ss, new Date());
  list.forEach((p, n) => ph.appendRow([str(values[i][c.assetId]), p.url, p.note, n + 1, added[p.url] ? stampStr(ss, added[p.url]) : stamp]));
  const newCover = list.length ? list[0].url : '';
  if (c.photo > -1 && newCover !== cover) setCell(sh, i + 1, c.photo, newCover);
  SpreadsheetApp.flush();
  const fresh = invTable(ss);
  const item = rowToItem(ss, fresh.values[i], fresh.c, i + 1);
  if (list.length) item.photos = list;
  return { success: true, item };
}

function readHistory(ss) {
  const sh = tab(ss, TAB.log, false);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  const c = colMap(values[0] || [], LOG_COLS);
  const g = (r, k) => (c[k] > -1 ? r[c[k]] : '');
  const outRows = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!str(g(r, 'assetId'))) continue;
    const a = str(g(r, 'action')).toUpperCase();
    outRows.push({
      when: stampStr(ss, g(r, 'when')), assetId: str(g(r, 'assetId')),
      action: a.indexOf('OUT') > -1 ? 'OUT' : a.indexOf('IN') > -1 ? 'IN' : a,
      who: str(g(r, 'who')), dueBack: dayStr(ss, g(r, 'dueBack')), condition: str(g(r, 'condition')),
      staff: str(g(r, 'staff')), type: str(g(r, 'type')),
    });
  }
  return outRows;
}

function readPaints(ss) {
  const sh = tab(ss, TAB.paint, false);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  const c = colMap(values[0] || [], PAINT_COLS);
  const g = (r, k) => (c[k] > -1 ? r[c[k]] : '');
  const res = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!str(g(r, 'id')) && !str(g(r, 'name'))) continue;
    res.push({ id: str(g(r, 'id')), name: str(g(r, 'name')), brand: str(g(r, 'brand')), code: str(g(r, 'code')),
      hex: str(g(r, 'hex')), notes: str(g(r, 'notes')), shows: str(g(r, 'shows')).split('|').map(s => s.trim()).filter(Boolean),
      added: dayStr(ss, g(r, 'added')) });
  }
  return res;
}

// Category → prefix ("Chairs" → "CH-") and subcategory → code ("Sweeney Todd" → "SWT").
function readPrefixes(ss) {
  const res = { categories: {}, subcats: {} };
  const sh = tab(ss, TAB.prefix, false);
  if (!sh) return res;
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    const cat = str(r[0]), pre = str(r[1]);
    if (cat && pre && !/\(/.test(cat)) res.categories[cat] = pre;
    const sub = str(r[3]), auto = str(r[4]), over = str(r[5]);
    if (sub) res.subcats[sub.toLowerCase()] = (over || auto).toUpperCase();
  }
  return res;
}

// Next free ID. IDs already used in the log count too, so a new item never
// picks up an old (deleted) item's history.
function nextAssetId(ss) {
  const { values, c } = invTable(ss);
  let max = 0;
  const see = v => { const m = /^S(\d+)$/i.exec(str(v)); if (m) max = Math.max(max, parseInt(m[1], 10)); };
  for (let i = 1; i < values.length; i++) see(values[i][c.assetId]);
  const log = tab(ss, TAB.log, false);
  if (log) {
    const lv = log.getDataRange().getValues();
    const lc = colMap(lv[0] || [], LOG_COLS);
    if (lc.assetId > -1) for (let i = 1; i < lv.length; i++) see(lv[i][lc.assetId]);
  }
  return 'S' + String(max + 1).padStart(4, '0');
}

// Same rule the dashboard has always used, for a subcategory not in Prefix_Table.
function subcatCodeFor(prefixes, subcat) {
  const s = str(subcat);
  if (!s) return '';
  if (prefixes.subcats[s.toLowerCase()]) return prefixes.subcats[s.toLowerCase()];
  const words = s.split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0].substring(0, 2) + words.slice(1).map(w => w[0]).join('')).toUpperCase();
}

function labelText(tagId, name, location) {
  return tagId + '\n' + name + '\n────────\n' + (location || '');
}

function findRow(values, c, assetId) {
  const k = idKey(assetId);
  for (let i = 1; i < values.length; i++) if (idKey(values[i][c.assetId]) === k) return i;
  return -1;
}

function setCell(sh, rowNum, colIdx, value) {
  if (colIdx > -1) sh.getRange(rowNum, colIdx + 1).setValue(value);
}

function appendByHeaders(sh, spec, obj) {
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const c = colMap(headers, spec);
  const row = new Array(headers.length).fill('');
  Object.keys(obj).forEach(k => { if (c[k] > -1) row[c[k]] = obj[k]; });
  sh.appendRow(row);
}

// ── Writes ──────────────────────────────────────────────────────────────────
// Check items out or in. Each item is changed only if it's in the state the
// person saw (out → in, in → out), so two phones can't fight over one item.
function checkInOut(ss, d) {
  const status = str(d.status).toUpperCase();
  if (status !== 'IN' && status !== 'OUT') return { success: false, error: 'status must be IN or OUT' };
  const ids = (d.assetIds || []).map(str).filter(Boolean);
  if (!ids.length) return { success: false, error: 'No items' };
  const { sh, values, c } = invTable(ss);
  const log = tab(ss, TAB.log, false);
  // A move saved on a phone with no signal carries the time it was made.
  const sentAt = new Date();
  const made = d.at ? new Date(d.at) : null;
  const now = made && !isNaN(made) && made <= sentAt && sentAt - made < 14 * 864e5 ? made : sentAt;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const who = str(d.who), type = str(d.type), staff = str(d.staffName);
  const condition = str(d.condition), note = str(d.note);
  const conditionText = status === 'IN' ? [condition, note].filter(Boolean).join(': ') : note;
  const updated = [], skipped = [], notFound = [];

  ids.forEach(id => {
    const i = findRow(values, c, id);
    if (i < 0) { notFound.push(id); return; }
    const r = values[i], rowNum = i + 1;
    const cur = str(r[c.status]).toUpperCase();
    if (cur === status && !d.force) { skipped.push({ assetId: id, status: cur, who: str(c.currentShow > -1 ? r[c.currentShow] : '') }); return; }
    setCell(sh, rowNum, c.status, status);
    if (status === 'OUT') {
      setCell(sh, rowNum, c.currentShow, who);
      setCell(sh, rowNum, c.dueBack, toDate(d.dueBack));
      setCell(sh, rowNum, c.type, type);
      setCell(sh, rowNum, c.lastDate, today);
      setCell(sh, rowNum, c.lastShow, who);
    } else {
      setCell(sh, rowNum, c.currentShow, '');
      setCell(sh, rowNum, c.dueBack, '');
      setCell(sh, rowNum, c.type, '');
      // Anything other than a plain "Good" goes on the item's notes, dated.
      if ((condition && condition !== 'Good') || note) {
        const stamp = '[' + Utilities.formatDate(now, tz(ss), 'MMM d, yyyy') + '] ' + conditionText;
        const prev = str(c.notes > -1 ? r[c.notes] : '');
        const next = prev ? prev + '\n' + stamp : stamp;
        // A cell holds 50,000 characters; a full Notes cell must not block the check-in.
        // The note is in the history (Form_Responses) either way.
        if (next.length <= 45000) setCell(sh, rowNum, c.notes, next);
      }
    }
    if (log) appendByHeaders(log, LOG_COLS, {
      when: now, assetId: str(r[c.assetId]), action: status,
      who: status === 'OUT' ? who : str(c.currentShow > -1 ? r[c.currentShow] : ''),
      dueBack: status === 'OUT' ? toDate(d.dueBack) : '', condition: conditionText, staff, type: status === 'OUT' ? type : '',
    });
    updated.push(id);
  });
  SpreadsheetApp.flush();
  const fresh = invTable(ss);
  const items = updated.map(id => { const i = findRow(fresh.values, fresh.c, id); return rowToItem(ss, fresh.values[i], fresh.c, i + 1); });
  return { success: true, updated, skipped, notFound, items };
}

function addAsset(ss, d) {
  const name = str(d.name), category = str(d.category), location = str(d.location);
  if (!name) return { success: false, error: 'Name is required' };
  if (!category) return { success: false, error: 'Category is required' };
  const { sh, values, c } = invTable(ss);
  const prefixes = readPrefixes(ss);
  const assetId = nextAssetId(ss);
  const subcategory = str(d.subcategory);
  const subcatCode = subcatCodeFor(prefixes, subcategory);
  const prefix = prefixes.categories[category] || '';
  const tagId = prefix + (subcatCode ? subcatCode + '-' : '') + assetId;

  // First row with no Asset ID and no Name, same as before; else a new row.
  let rowNum = -1;
  for (let i = 1; i < values.length; i++) {
    if (!str(values[i][c.assetId]) && !str(values[i][c.name])) { rowNum = i + 1; break; }
  }
  if (rowNum < 0) rowNum = values.length + 1;

  // Cell by cell, so formulas in other columns (Photo Preview, QR) stay put.
  const set = (k, v) => setCell(sh, rowNum, c[k], v);
  set('assetId', assetId); set('tagId', tagId); set('name', name);
  set('category', category); set('subcategory', subcategory); set('location', location);
  set('status', 'IN'); set('quantity', Number(d.quantity) || 1);
  set('rental', str(d.rentalValue)); set('replacement', str(d.replacementValue));
  set('notes', str(d.notes)); set('photo', str(d.photoUrl));
  set('subcatCode', subcatCode); set('labelText', labelText(tagId, name, location));

  const added = tab(ss, TAB.added, false);
  if (added) added.appendRow([new Date(), name, category, subcategory, location, str(d.replacementValue), str(d.notes), str(d.photoUrl), Number(d.quantity) || 1, str(d.rentalValue)]);
  SpreadsheetApp.flush();
  const fresh = invTable(ss);
  return { success: true, assetId, tagId, item: rowToItem(ss, fresh.values[rowNum - 1], fresh.c, rowNum) };
}

// Edit an item's details. `base` is what the editor started from: a field
// someone else changed in the meantime is left alone and reported back.
function editAsset(ss, d) {
  const { sh, values, c } = invTable(ss);
  const i = findRow(values, c, d.assetId);
  if (i < 0) return { success: false, error: 'Item not found: ' + d.assetId };
  const r = values[i], rowNum = i + 1;
  const now = rowToItem(ss, r, c, rowNum);
  const fields = d.fields || {}, base = d.base || {};
  const allowed = ['name', 'category', 'subcategory', 'location', 'quantity', 'rental', 'replacement', 'notes', 'photo'];
  const changed = [], conflicts = [];
  allowed.forEach(k => {
    if (!(k in fields)) return;
    const v = str(fields[k]);
    if (v === now[k]) return;
    if (k in base && str(base[k]) !== now[k]) { conflicts.push({ field: k, theirs: now[k] }); return; }
    setCell(sh, rowNum, c[k], k === 'quantity' ? (Number(v) || v) : v);
    now[k] = v; changed.push(k);
  });
  if (changed.some(k => k === 'name' || k === 'location'))
    setCell(sh, rowNum, c.labelText, labelText(now.tagId, now.name, now.location));
  SpreadsheetApp.flush();
  const fresh = invTable(ss);
  return { success: true, changed, conflicts, item: rowToItem(ss, fresh.values[i], fresh.c, rowNum) };
}

function savePaint(ss, d) {
  const sh = tab(ss, TAB.paint, true);
  const values = sh.getDataRange().getValues();
  const c = colMap(values[0] || [], PAINT_COLS);
  const shows = (d.shows || []).map(str).filter(Boolean).join('|');
  const rec = { name: str(d.name), brand: str(d.brand), code: str(d.code), hex: str(d.hex), notes: str(d.notes), shows };
  if (!rec.name) return { success: false, error: 'Name is required' };
  if (d.id) {
    for (let i = 1; i < values.length; i++) {
      if (str(values[i][c.id]) === str(d.id)) {
        Object.keys(rec).forEach(k => setCell(sh, i + 1, c[k], rec[k]));
        return { success: true, id: str(d.id) };
      }
    }
  }
  const id = String(Date.now());
  rec.id = id;
  rec.added = Utilities.formatDate(new Date(), tz(ss), 'MMM d, yyyy');
  appendByHeaders(sh, PAINT_COLS, rec);
  return { success: true, id };
}

function deletePaint(ss, d) {
  const sh = tab(ss, TAB.paint, true);
  const values = sh.getDataRange().getValues();
  const c = colMap(values[0] || [], PAINT_COLS);
  for (let i = 1; i < values.length; i++) {
    if (str(values[i][c.id]) === str(d.id)) { sh.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false, error: 'Color not found' };
}
