const PHOTO_FOLDER_ID = '1lHOzK17bJfXGHfCeVaopghbrjUKIs61Ur2r5aYy8naYKcTjyB0uiv-XNVKsQpFWo02AlSMtG';
const SPREADSHEET_ID = '1ZC6eyjym1wLtPNG9G_rNFP_Txke1-VJtt7mrPsL0WOA';

// ⚠️ EDIT THIS — your email for daily overdue/due-today task notifications:
const NOTIFICATION_EMAIL = 'musicmountainmcafee@gmail.com';

// Optional — Drive folder for uploaded PDF scripts. Leave '' to auto-create:
const SCRIPTS_FOLDER_ID = '';

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST ROUTING
// ═══════════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'checkInOut')   return checkInOut(data);
    if (data.action === 'addAsset')     return addAsset(data);
    if (data.action === 'editAsset')    return editAsset(data);
    if (data.action === 'getHistory')   return getHistory();
    if (data.action === 'savePaint')    return savePaint(data);
    if (data.action === 'deletePaint')  return deletePaint(data);
    if (data.action === 'saveTasks')    return saveTasks(data);
    if (data.action === 'saveTask')     return saveTask(data);
    if (data.action === 'saveShopping') return saveShopping(e, data);
    if (data.action === 'saveTeamConfig') return saveTeamConfig(e, data);
    if (data.action === 'saveDrops')     return saveDrops(e, data);
    if (data.action === 'saveLinks')     return saveLinks(e, data);
    if (data.action === 'saveCueData')   return saveCueData(e, data);
    if (data.action === 'uploadScript')  return uploadScript(data);
    if (data.action === 'uploadDropPhoto') return uploadDropPhoto(data);
    if (data.action === 'uploadRefPhoto') return uploadRefPhoto(data);
    if (data.action === 'saveShowNote') return saveShowNote(data);
    if (data.action === 'saveCleaning') return saveCleaning(e, data);
    if (data.action === 'saveKV')       return saveKV(data);
    return response({ success: false, error: 'Unknown action' });
  } catch(err) {
    return response({ success: false, error: err.message });
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;

  function wrap(result) {
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + result.getContent() + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return result;
  }

  if (action === 'getNextId')     return wrap(getNextId());
  if (action === 'getPaints')     return wrap(getPaints());
  if (action === 'getTasks')      return wrap(getTasks(e));
  if (action === 'createDoc')     return wrap(createShowDoc(e));
  if (action === 'getHistory')    return wrap(getHistory());
  if (action === 'getShopping')   return wrap(getShopping());
  if (action === 'saveShopping')  return wrap(saveShopping(e, null));
  if (action === 'getTeamConfig') return wrap(getTeamConfig());
  if (action === 'saveTeamConfig') return wrap(saveTeamConfig(e, null));
  if (action === 'getDrops')      return wrap(getDrops());
  if (action === 'saveDrops')     return wrap(saveDrops(e, null));
  if (action === 'getLinks')      return wrap(getLinks());
  if (action === 'saveLinks')     return wrap(saveLinks(e, null));
  if (action === 'listScripts')   return wrap(listScripts());
  if (action === 'loadScript')    return wrap(loadScript(e));
  if (action === 'getDriveImage') return getDriveImage(e);
  if (action === 'searchDrive')   return wrap(searchDrive(e));
  if (action === 'importScript')  return wrap(importScript(e));
  if (action === 'getCleaning')    return wrap(getCleaning());
  if (action === 'saveCleaning')   return wrap(saveCleaning(e, null));
  if (action === 'readDropsSheet')  return wrap(readDropsSheet(e));
  if (action === 'listFolderPhotos') return wrap(listFolderPhotos(e));
  if (action === 'getCueData')    return wrap(getCueData(e));
  if (action === 'getCueRev')     return wrap(getCueRev(e));
  if (action === 'saveCueData')   return wrap(saveCueData(e, null));
  if (action === 'saveShowNote') return wrap(saveShowNote(e.parameter));
  if (action === 'getKV')         return wrap(getKV(e));
  if (action === 'saveKV')        return wrap(saveKV(e.parameter));
  if (action === 'saveTask')      return wrap(saveTask(e.parameter));
  if (action === 'saveTasksGet') {
    try {
      const data = JSON.parse(decodeURIComponent(e.parameter.data));
      return wrap(saveTasks(data));
    } catch(err) {
      return wrap(response({ success: false, error: err.message }));
    }
  }
  return wrap(response({ success: true, message: 'MMT Script running' }));
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════

function getNextId() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Inventory');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const colAssetId = headers.indexOf('Asset ID');
  let max = 0;
  for (let i = 1; i < rows.length; i++) {
    const val = String(rows[i][colAssetId] || '');
    const match = val.match(/^S(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1]));
  }
  return response({ success: true, nextId: 'S' + String(max + 1).padStart(4, '0') });
}

function addAsset(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Inventory');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  const assetId = data.assetId;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('Asset ID')] === assetId)
      return response({ success: false, error: 'Asset ID already exists.' });
  }

  let targetRow = -1;
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][headers.indexOf('Asset ID')] && !rows[i][headers.indexOf('Name')]) {
      targetRow = i + 1; break;
    }
  }
  if (targetRow === -1) targetRow = rows.length + 1;

  const rowNum = targetRow;
  const numCols = headers.length;
  const newRow = new Array(numCols).fill('');

  headers.forEach((h, i) => {
    const header = h.trim();
    if (header === 'Asset ID')          newRow[i] = data.assetId;
    if (header === 'Tag ID')            newRow[i] = data.tagId;
    if (header === 'Name')              newRow[i] = data.name;
    if (header === 'Category')          newRow[i] = data.category;
    if (header === 'Subcatagorey')      newRow[i] = data.subcategory || '';
    if (header === 'Storage Location')  newRow[i] = data.location || '';
    if (header === 'Status')            newRow[i] = 'IN';
    if (header === 'Rental Value')      newRow[i] = data.rentalValue || '';
    if (header === 'Replacement Value') newRow[i] = data.replacementValue || '';
    if (header === 'Notes')             newRow[i] = data.notes || '';
    if (header === 'Quantity')          newRow[i] = data.quantity || 1;
    if (header === 'Subcat Code')       newRow[i] = data.subcatCode || '';
    if (header === 'Photo')             newRow[i] = data.photoUrl || '';
    if (header === 'Photo Preview')     newRow[i] = data.photoUrl || '';
    if (header === 'Label Text')        newRow[i] = data.tagId + '\n' + data.name + '\n────────\n' + (data.location || '');
  });

  sheet.getRange(rowNum, 1, 1, numCols).setValues([newRow]);

  try {
    const newAssets = ss.getSheetByName('New_Assets');
    if (newAssets) newAssets.appendRow([
      new Date(), data.name, data.category, data.subcategory,
      data.location, data.replacementValue, data.notes,
      data.photoUrl || '', data.quantity || 1, data.rentalValue
    ]);
  } catch(e) {}

  return response({ success: true, assetId: data.assetId, tagId: data.tagId, photoUrl: data.photoUrl });
}

function editAsset(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Inventory');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  const assetId = data.assetId;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('Asset ID')] === assetId) {
      const r = i + 1;
      headers.forEach((h, col) => {
        const header = h.trim();
        if (header === 'Name')              sheet.getRange(r, col+1).setValue(data.name);
        if (header === 'Category')          sheet.getRange(r, col+1).setValue(data.category);
        if (header === 'Subcatagorey')      sheet.getRange(r, col+1).setValue(data.subcategory || '');
        if (header === 'Storage Location')  sheet.getRange(r, col+1).setValue(data.location);
        if (header === 'Rental Value')      sheet.getRange(r, col+1).setValue(data.rentalValue || '');
        if (header === 'Replacement Value') sheet.getRange(r, col+1).setValue(data.replacementValue || '');
        if (header === 'Notes')             sheet.getRange(r, col+1).setValue(data.notes || '');
        if (header === 'Photo')             sheet.getRange(r, col+1).setValue(data.photoUrl || '');
        if (header === 'Photo Preview')     sheet.getRange(r, col+1).setValue(data.photoUrl || '');
      });
      return response({ success: true });
    }
  }
  return response({ success: false, error: 'Asset not found' });
}

function checkInOut(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Inventory');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const col = (name) => headers.indexOf(name);
  const { assetIds, status: newStatus, who='', dueBack='', type='', staffName='', condition='', notes='', conditionNote='' } = data;
  const today = new Date().toLocaleDateString('en-US');
  const updated = [], notFound = [];
  assetIds.forEach(assetId => {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][col('Asset ID')] === assetId) {
        const r = i + 1;
        sheet.getRange(r, col('Status') + 1).setValue(newStatus);
        sheet.getRange(r, col('Current show') + 1).setValue(newStatus === 'OUT' ? who : '');
        sheet.getRange(r, col('due back') + 1).setValue(newStatus === 'OUT' ? dueBack : '');
        sheet.getRange(r, col('Type') + 1).setValue(newStatus === 'OUT' ? type : '');
        if (newStatus === 'OUT') {
          sheet.getRange(r, col('Laat Used Date') + 1).setValue(today);
          sheet.getRange(r, col('Last Used Show') + 1).setValue(who);
        }
        // Append condition note to Notes field on check-in
        if (newStatus === 'IN' && conditionNote) {
          const existingNotes = rows[i][col('Notes')] || '';
          const newNotes = existingNotes ? existingNotes + '\n' + conditionNote : conditionNote;
          sheet.getRange(r, col('Notes') + 1).setValue(newNotes);
        }
        updated.push(assetId); found = true; break;
      }
    }
    if (!found) notFound.push(assetId);
  });
  try {
    const log = ss.getSheetByName('Form_Responses');
    if (log) assetIds.forEach(assetId => log.appendRow([
      new Date(), assetId, newStatus, who, dueBack, condition, staffName, type, notes
    ]));
  } catch(e) {}
  return response({ success: true, updated, notFound });
}

function getHistory() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Form_Responses');
  const rows = sheet.getDataRange().getValues();
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0] || !rows[i][1]) continue;
    data.push({
      timestamp: rows[i][0].toString(),
      assetId: rows[i][1],
      action: rows[i][2],
      who: rows[i][3],
      dueDate: rows[i][4],
      condition: rows[i][5],
      staff: rows[i][6],
      type: rows[i][7],
    });
  }
  return response({ success: true, history: data.reverse() });
}

// ═══════════════════════════════════════════════════════════════════════════
// PAINT LIBRARY
// ═══════════════════════════════════════════════════════════════════════════

function getPaints() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Paint_Library');
  if (!sheet) return response({ success: true, paints: [] });
  const rows = sheet.getDataRange().getValues();
  const paints = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    paints.push({
      id: rows[i][0].toString(),
      name: rows[i][1] || '',
      brand: rows[i][2] || '',
      code: rows[i][3] || '',
      hex: rows[i][4] || '',
      notes: rows[i][5] || '',
      shows: rows[i][6] ? rows[i][6].split('|') : [],
      addedDate: rows[i][7] || '',
    });
  }
  return response({ success: true, paints });
}

function savePaint(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Paint_Library');
  if (!sheet) return response({ success: false, error: 'Paint_Library sheet not found' });
  const rows = sheet.getDataRange().getValues();
  const showsStr = (data.shows || []).join('|');

  if (data.id) {
    // Update existing
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0].toString() === data.id.toString()) {
        const r = i + 1;
        sheet.getRange(r, 1, 1, 8).setValues([[
          data.id, data.name, data.brand, data.code || '',
          data.hex || '', data.notes || '', showsStr, data.addedDate || ''
        ]]);
        return response({ success: true });
      }
    }
  }
  // Add new
  const newId = Date.now().toString();
  const dateStr = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  sheet.appendRow([newId, data.name, data.brand, data.code || '', data.hex || '', data.notes || '', showsStr, dateStr]);
  return response({ success: true, id: newId });
}

function deletePaint(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Paint_Library');
  if (!sheet) return response({ success: false, error: 'Paint_Library sheet not found' });
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return response({ success: true });
    }
  }
  return response({ success: false, error: 'Paint not found' });
}

// ═══════════════════════════════════════════════════════════════════════════
// TASKS & SHOW NOTES
// ═══════════════════════════════════════════════════════════════════════════

function getTasks(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const colors = ['#534AB7','#f5a623','#3B6D11','#185FA5','#9b59b6','#1abc9c','#e67e22','#e91e63'];

  // Read Tasks_Data tab
  const taskSheet = ss.getSheetByName('Tasks');
  const lists = [], tasks = {};
  if (taskSheet) {
    const taskRows = taskSheet.getDataRange().getValues();
    for (let i = 1; i < taskRows.length; i++) {
      const listName = taskRows[i][0];
      if (!listName) continue;
      if (!lists.find(l => l.name === listName))
        lists.push({ name: listName, color: colors[lists.length % colors.length] });
      if (!tasks[listName]) tasks[listName] = [];
      const taskText = taskRows[i][1];
      if (taskText) {
        tasks[listName].push({
          id: taskRows[i][4] || (Date.now() + '_' + i),
          text: taskText,
          done: (String(taskRows[i][2] || '')).toUpperCase() === 'TRUE',
          due: taskRows[i][3] || null,
          notify: (String(taskRows[i][5] || '')).toUpperCase() === 'TRUE',
        });
      }
    }
  }

  // Read Show_Notes tab
  const showNotes = {};
  const notesSheet = ss.getSheetByName('ShowNotes');
  if (notesSheet) {
    const noteRows = notesSheet.getDataRange().getValues();
    for (let i = 1; i < noteRows.length; i++) {
      if (noteRows[i][0]) showNotes[noteRows[i][0]] = noteRows[i][1];
    }
  }

  return response({ success: true, lists, tasks, showNotes });
}

function saveTasks(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Tasks');
  if (!sheet) {
    sheet = ss.insertSheet('Tasks');
    sheet.getRange('A1:F1').setValues([['List', 'Task', 'Done', 'Due', 'ID', 'Notify']]);
  }

  // Clear existing data (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 6).clearContent();

  // Write all tasks
  const rows = [];
  const lists = data.lists || [];
  const tasks = data.tasks || {};
  lists.forEach(list => {
    const items = tasks[list.name] || [];
    if (items.length === 0) {
      // Write list name with no task so the list persists
      rows.push([list.name, '', '', '', '', '']);
    } else {
      items.forEach(t => {
        rows.push([list.name, t.text, t.done ? 'TRUE' : 'FALSE', t.due || '', t.id || '', t.notify ? 'TRUE' : '']);
      });
    }
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }

  return response({ success: true });
}

function saveTask(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Tasks');
  if (!sheet) {
    sheet = ss.insertSheet('Tasks');
    sheet.getRange('A1:F1').setValues([['List', 'Task', 'Done', 'Due', 'ID', 'Notify']]);
  }

  const list = data.list;
  const text = data.text;
  const done = data.done === 'true' || data.done === true ? 'TRUE' : 'FALSE';
  const due = data.due || '';
  const id = data.id || Date.now().toString();
  const notify = data.notify === 'true' || data.notify === true ? 'TRUE' : '';

  sheet.appendRow([list, text, done, due, id, notify]);
  return response({ success: true, id });
}

// Read the Show Notes template link (Settings) and resolve it to a Drive file ID.
function _getNotesTemplateId() {
  try {
    const sheet = _kvSheet();
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === 'notesTemplateLink') {
        let v = rows[i][1];
        try { v = JSON.parse(v); } catch (e) {}
        return v ? resolveDriveId(v) : '';
      }
    }
  } catch (err) {}
  return '';
}

function createShowDoc(e) {
  const showName = e.parameter.showName;
  const key = e.parameter.key;
  if (!showName) return response({ success: false, error: 'No show name provided' });

  const docName = showName + ' — Show Notes';
  let url;

  // If a template doc has been set in Settings, copy it instead of building a plain default.
  const templateId = _getNotesTemplateId();
  if (templateId) {
    try {
      const templateFile = DriveApp.getFileById(templateId);
      const copy = templateFile.makeCopy(docName);
      url = copy.getUrl();
    } catch (err) {
      // Template unreachable (deleted / no access) — fall back to the plain default below.
      url = null;
    }
  }

  if (!url) {
    const doc = DocumentApp.create(docName);
    const body = doc.getBody();
    body.appendParagraph(showName).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph('Show Notes');
    body.appendParagraph('');
    body.appendParagraph('To Do').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph('');
    doc.saveAndClose();
    url = doc.getUrl();
  }

  // Save the doc URL to Show_Notes tab
  if (key) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('ShowNotes');
    if (!sheet) {
      sheet = ss.insertSheet('ShowNotes');
      sheet.getRange('A1:B1').setValues([['Key', 'DocURL']]);
    }

    // Check if key already exists
    const rows = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(url);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, url]);
    }
  }

  return response({ success: true, url });
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOPPING LISTS
// ═══════════════════════════════════════════════════════════════════════════

// ── Generic key-value store (one row per key, JSON value) ────────────────────
function _kvSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('KVStore');
  if (!sheet) {
    sheet = ss.insertSheet('KVStore');
    sheet.getRange('A1:B1').setValues([['Key', 'Value']]);
  }
  return sheet;
}

function getKV(e) {
  const key = e.parameter.key;
  const sheet = _kvSheet();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      let v = rows[i][1];
      try { v = JSON.parse(v); } catch (err) {}
      return response({ success: true, value: v });
    }
  }
  return response({ success: true, value: null });
}

function saveKV(data) {
  const key = data.key;
  if (!key) return response({ success: false, error: 'No key' });
  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return response({ success: false, error: 'Busy, try again' }); }
  try { return _saveKV(key, data.value); } finally { lock.releaseLock(); }
}
function _saveKV(key, value) {
  if (typeof value !== 'string') value = JSON.stringify(value);
  if (value.length > 49000) return response({ success: false, error: 'Too big for one cell (' + value.length + ' characters)' });
  const sheet = _kvSheet();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return response({ success: true });
    }
  }
  sheet.appendRow([key, value]);
  return response({ success: true });
}

function saveShowNote(data) {
  const key = data.key;
  const value = data.value;
  if (!key) return response({ success: false, error: 'No key provided' });

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('ShowNotes');
  if (!sheet) {
    sheet = ss.insertSheet('ShowNotes');
    sheet.getRange('A1:B1').setValues([['Key', 'DocURL']]);
  }

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return response({ success: true });
    }
  }
  sheet.appendRow([key, value]);
  return response({ success: true });
}

function getShopping() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Shopping');
  if (!sheet) {
    sheet = ss.insertSheet('Shopping');
    sheet.getRange('A1').setValue('Data');
    sheet.getRange('A2').setValue('{}');
  }
  const raw = sheet.getRange('A2').getValue();
  let data = {};
  try { data = JSON.parse(raw || '{}'); } catch(e) { data = {}; }
  return response({ success: true, shopping: data });
}

function getTeamConfig() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('TeamConfig');
  if (!sheet) {
    sheet = ss.insertSheet('TeamConfig');
    sheet.getRange('A1').setValue('Data');
    sheet.getRange('A2').setValue(JSON.stringify({
      visibleLists: ['Building', 'Tech To-Do', 'TO DO', 'Home Depot', 'Maintenance', 'Long Term Projects'],
      crewNames: ['Alex', 'Ben', 'Chris', 'Dana', 'Jamie', 'Jordan', 'Morgan', 'Riley', 'Sam', 'Taylor']
    }));
  }
  const raw = sheet.getRange('A2').getValue();
  let data = {};
  try { data = JSON.parse(raw || '{}'); } catch(e) { data = {}; }
  return response({ success: true, teamConfig: data });
}

function saveTeamConfig(e, body) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('TeamConfig');
  if (!sheet) {
    sheet = ss.insertSheet('TeamConfig');
    sheet.getRange('A1').setValue('Data');
  }
  let data = {};
  if (body && body.teamConfig) {
    data = body.teamConfig;
  } else if (e && e.parameter && e.parameter.teamConfig) {
    try { data = JSON.parse(e.parameter.teamConfig); } catch(err) { data = {}; }
  }
  sheet.getRange('A2').setValue(JSON.stringify(data));
  return response({ success: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// DROPS CATALOG
// ═══════════════════════════════════════════════════════════════════════════

function getDrops() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Drops');
  if (!sheet) {
    sheet = ss.insertSheet('Drops');
    sheet.getRange('A1:H1').setValues([['Number', 'Name', 'Category', 'Type', 'Size', 'Photo', 'Notes', 'ID']]);
  }
  const rows = sheet.getDataRange().getValues();
  const drops = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0] && !rows[i][1]) continue;
    drops.push({
      number: String(rows[i][0] || ''),
      name: rows[i][1] || '',
      category: rows[i][2] || '',
      type: rows[i][3] || '',
      size: rows[i][4] || '',
      photo: rows[i][5] || '',
      notes: rows[i][6] || '',
      id: rows[i][7] || (Date.now() + '_' + i),
    });
  }
  return response({ success: true, drops: drops });
}

function saveDrops(e, body) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Drops');
  if (!sheet) {
    sheet = ss.insertSheet('Drops');
    sheet.getRange('A1:H1').setValues([['Number', 'Name', 'Category', 'Type', 'Size', 'Photo', 'Notes', 'ID']]);
  }

  let data = [];
  if (body && body.drops) {
    data = body.drops;
  } else if (e && e.parameter && e.parameter.drops) {
    try { data = JSON.parse(e.parameter.drops); } catch(err) { data = []; }
  }

  // Clear existing data (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 8).clearContent();

  // Write rows
  if (data.length > 0) {
    const rows = data.map(d => [
      d.number || '', d.name || '', d.category || '', d.type || '',
      d.size || '', d.photo || '', d.notes || '', d.id || ''
    ]);
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }

  return response({ success: true });
}


function getLinks() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("CustomLinks");
  if (!sheet) {
    sheet = ss.insertSheet("CustomLinks");
    sheet.getRange("A1").setValue("Data");
    sheet.getRange("A2").setValue("[]");
  }
  const raw = sheet.getRange("A2").getValue();
  let data = [];
  try { data = JSON.parse(raw || "[]"); } catch(e) { data = []; }
  return response({ success: true, links: data });
}

function saveLinks(e, body) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("CustomLinks");
  if (!sheet) {
    sheet = ss.insertSheet("CustomLinks");
    sheet.getRange("A1").setValue("Data");
  }
  let data = [];
  if (body && body.links) { data = body.links; }
  else if (e && e.parameter && e.parameter.links) {
    try { data = JSON.parse(e.parameter.links); } catch(err) { data = []; }
  }
  sheet.getRange("A2").setValue(JSON.stringify(data));
  return response({ success: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// CLEANING LOG  (scheduled items + date-stamped log)
// ═══════════════════════════════════════════════════════════════════════════
// Stored as two JSON blobs in a single "Cleaning" sheet:
//   A2 = items  [{ id, name, area, intervalDays, lastCleaned }]
//   B2 = log    [{ id, item, area, who, notes, date }]

function getCleaning() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("Cleaning");
  if (!sheet) {
    sheet = ss.insertSheet("Cleaning");
    sheet.getRange("A1").setValue("Items");
    sheet.getRange("B1").setValue("Log");
    sheet.getRange("A2").setValue("[]");
    sheet.getRange("B2").setValue("[]");
  }
  let items = [], log = [];
  try { items = JSON.parse(sheet.getRange("A2").getValue() || "[]"); } catch(e) { items = []; }
  try { log = JSON.parse(sheet.getRange("B2").getValue() || "[]"); } catch(e) { log = []; }
  return response({ success: true, items: items, log: log });
}

function saveCleaning(e, body) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("Cleaning");
  if (!sheet) {
    sheet = ss.insertSheet("Cleaning");
    sheet.getRange("A1").setValue("Items");
    sheet.getRange("B1").setValue("Log");
  }
  let items = null, log = null;
  if (body) {
    if (body.items !== undefined) items = body.items;
    if (body.log !== undefined) log = body.log;
  } else if (e && e.parameter) {
    if (e.parameter.items !== undefined) { try { items = JSON.parse(e.parameter.items); } catch(err) { items = []; } }
    if (e.parameter.log !== undefined) { try { log = JSON.parse(e.parameter.log); } catch(err) { log = []; } }
  }
  if (items !== null) sheet.getRange("A2").setValue(JSON.stringify(items));
  if (log !== null) sheet.getRange("B2").setValue(JSON.stringify(log));
  return response({ success: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKDROP IMPORT WIZARD  (read sheet text + list folder photos; you approve)
// ═══════════════════════════════════════════════════════════════════════════

// Read the TEXT rows from a pasted Drive sheet (in-cell images can't be read, so
// we only pull text columns — name, number, category, type, size, notes).
function readDropsSheet(e) {
  var raw = e.parameter.sheet || e.parameter.id || '';
  var id = resolveDriveId(raw);
  if (!id) return response({ success: false, error: 'Could not read a sheet ID from that link.' });

  var wb;
  try { wb = SpreadsheetApp.openById(id); }
  catch (err) { return response({ success: false, error: 'Cannot open that sheet — check it is shared with this account.' }); }

  // Use the first sheet (or one named like "drops"/"backdrops" if present)
  var sheets = wb.getSheets();
  var target = sheets[0];
  for (var s = 0; s < sheets.length; s++) {
    var nm = sheets[s].getName().toLowerCase();
    if (nm.indexOf('drop') >= 0 || nm.indexOf('backdrop') >= 0) { target = sheets[s]; break; }
  }

  var rows = target.getDataRange().getValues();
  if (rows.length < 2) return response({ success: true, drops: [], skipped: 0, sheetName: target.getName() });

  var headers = rows[0].map(function(h) { return String(h).toLowerCase().trim(); });
  function findCol(patterns) {
    for (var i = 0; i < headers.length; i++) {
      for (var p = 0; p < patterns.length; p++) {
        if (patterns[p].test(headers[i])) return i;
      }
    }
    return -1;
  }
  var colNum   = findCol([/^#$/, /number/, /drop\s*#/, /drop\s*num/, /^num$/]);
  var colName  = findCol([/^name$/, /drop\s*name/, /title/, /description/]);
  var colCat   = findCol([/categ/, /^cat$/, /group/]);
  var colType  = findCol([/type/, /material/, /fabric/]);
  var colSize  = findCol([/size/, /dimension/]);
  var colNotes = findCol([/note/, /comment/, /detail/]);

  // Fallbacks if headers are unclear
  if (colNum === -1 && colName === -1 && headers.length >= 2) { colNum = 0; colName = 1; }
  if (colName === -1) colName = (colNum === 0 ? 1 : 0);

  var drops = [], skipped = 0;
  for (var i = 1; i < rows.length; i++) {
    var name = colName >= 0 ? String(rows[i][colName] || '').trim() : '';
    var num  = colNum  >= 0 ? String(rows[i][colNum]  || '').trim() : '';
    // Skip blank/junk rows
    if (!name && !num) { skipped++; continue; }
    if (name.toLowerCase() === 'drop' || /^drop\s*\d*$/i.test(name) && !num) { skipped++; continue; }
    drops.push({
      number:   num.replace(/[^\d]/g, '') || num,
      name:     name || ('Drop ' + num),
      category: colCat   >= 0 ? String(rows[i][colCat]   || '').trim() : '',
      type:     colType  >= 0 ? String(rows[i][colType]  || '').trim() : '',
      size:     colSize  >= 0 ? String(rows[i][colSize]  || '').trim() : '',
      notes:    colNotes >= 0 ? String(rows[i][colNotes] || '').trim() : '',
      row: i + 1
    });
  }
  return response({ success: true, drops: drops, skipped: skipped, sheetName: target.getName() });
}

// List all image files in a pasted Drive folder (and subfolders) as pickable thumbnails.
function listFolderPhotos(e) {
  var raw = e.parameter.folder || e.parameter.id || '';
  var id = resolveDriveId(raw);
  if (!id) return response({ success: false, error: 'Could not read a folder ID from that link.' });

  var folder;
  try { folder = DriveApp.getFolderById(id); }
  catch (err) { return response({ success: false, error: 'Cannot open that folder — check it is shared with this account. (' + err.message + ')' }); }

  var photos = [];
  var totalFiles = 0, nonImage = 0;
  var MAX = 600; // safety cap
  function scan(f) {
    var files = f.getFiles();
    while (files.hasNext() && photos.length < MAX) {
      var file = files.next();
      totalFiles++;
      var mime = '';
      try { mime = file.getMimeType(); } catch (err) {}
      if (mime.indexOf('image/') !== 0) { nonImage++; continue; }
      var fid = file.getId();
      photos.push({
        id: fid,
        name: file.getName(),
        url: 'https://drive.google.com/thumbnail?id=' + fid + '&sz=w1000',
        thumb: 'https://drive.google.com/thumbnail?id=' + fid + '&sz=w300'
      });
    }
    var subs = f.getFolders();
    while (subs.hasNext() && photos.length < MAX) scan(subs.next());
  }
  scan(folder);
  photos.sort(function(a, b) { return a.name.localeCompare(b.name); });
  return response({
    success: true, photos: photos, count: photos.length,
    folderName: folder.getName(), totalFiles: totalFiles, nonImage: nonImage
  });
}

function uploadDropPhoto(data) {
  try {
    var folder;
    try {
      folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
    } catch(e) {
      folder = DriveApp.getRootFolder();
    }
    var blob = Utilities.newBlob(Utilities.base64Decode(data.base64), data.mimeType || 'image/jpeg', data.fileName || 'drop-photo.jpg');
    var file = folder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(shareErr) {}
    var url = 'https://lh3.googleusercontent.com/d/' + file.getId();
    return response({ success: true, url: url, fileId: file.getId() });
  } catch(err) {
    return response({ success: false, error: err.message });
  }
}

// Reference photos: store the image file, return a stable thumbnail URL.
function uploadRefPhoto(data) {
  try {
    var folder;
    try { folder = DriveApp.getFolderById(PHOTO_FOLDER_ID); }
    catch(e) { folder = DriveApp.getRootFolder(); }
    var blob = Utilities.newBlob(Utilities.base64Decode(data.base64), data.mimeType || 'image/jpeg', data.fileName || 'ref-photo.jpg');
    var file = folder.createFile(blob);
    // Sharing can fail (e.g. shared-drive / permission limits) — don't let it kill the upload.
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(shareErr) {}
    var fid = file.getId();
    return response({
      success: true,
      fileId: fid,
      url: 'https://drive.google.com/thumbnail?id=' + fid + '&sz=w1200',
      thumb: 'https://drive.google.com/thumbnail?id=' + fid + '&sz=w400'
    });
  } catch(err) {
    return response({ success: false, error: err.message });
  }
}

// ── ONE-TIME IMPORT: Run this manually from Apps Script to import existing drops ──
// Select "importDropsFromFolder" from the function dropdown and click Run.
// It scans your MMT Backdrops Drive folder and creates entries from the photos.
function importDropsFromFolder() {
  const DROPS_FOLDER_ID = '1F6ERLa9AyPuTO3Udq80qxZ-PgxJKfW1K';

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Drops');
  if (!sheet) {
    sheet = ss.insertSheet('Drops');
    sheet.getRange('A1:H1').setValues([['Number', 'Name', 'Category', 'Type', 'Size', 'Photo', 'Notes', 'ID']]);
  }

  // Load existing drops from rows
  let existing = [];
  var allRows = sheet.getDataRange().getValues();
  for (var r = 1; r < allRows.length; r++) {
    if (!allRows[r][0] && !allRows[r][1]) continue;
    existing.push({
      number: String(allRows[r][0] || ''), name: allRows[r][1] || '', category: allRows[r][2] || '',
      type: allRows[r][3] || '', size: allRows[r][4] || '', photo: allRows[r][5] || '',
      notes: allRows[r][6] || '', id: allRows[r][7] || '',
    });
  }

  const folder = DriveApp.getFolderById(DROPS_FOLDER_ID);

  // Step 1: Collect ALL photos from folder and all subfolders
  const photoMap = {}; // filename (no ext) -> photo URL
  function scanPhotos(f) {
    var files = f.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      if (!file.getMimeType().startsWith('image/')) continue;
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
      var url = 'https://lh3.googleusercontent.com/d/' + file.getId();
      var fname = file.getName().replace(/\.[^.]+$/, '').toLowerCase().trim();
      photoMap[fname] = url;
      photoMap[file.getId()] = url;
    }
    var subs = f.getFolders();
    while (subs.hasNext()) { scanPhotos(subs.next()); }
  }
  scanPhotos(folder);
  Logger.log('Found ' + Object.keys(photoMap).length / 2 + ' photos');

  // Step 2: Find and read any spreadsheets in the folder
  var spreadsheets = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  var sheetDrops = [];
  while (spreadsheets.hasNext()) {
    var ssFile = spreadsheets.next();
    Logger.log('Found spreadsheet: ' + ssFile.getName());
    var workbook = SpreadsheetApp.openById(ssFile.getId());
    var sheets = workbook.getSheets();
    sheets.forEach(function(s) {
      var rows = s.getDataRange().getValues();
      if (rows.length < 2) return;
      var headers = rows[0].map(function(h) { return String(h).toLowerCase().trim(); });

      // Try to find relevant columns
      var colNum = -1, colName = -1, colCat = -1, colType = -1, colSize = -1, colNotes = -1, colPhoto = -1;
      headers.forEach(function(h, i) {
        if (h.match(/^#$|number|drop.?#|drop.?num|num/i)) colNum = i;
        if (h.match(/^name$|drop.?name|title|description/i)) colName = i;
        if (h.match(/cat|category|group/i)) colCat = i;
        if (h.match(/type|material|fabric/i)) colType = i;
        if (h.match(/size|dimension/i)) colSize = i;
        if (h.match(/note|comment|detail/i)) colNotes = i;
        if (h.match(/photo|image|pic|url/i)) colPhoto = i;
      });

      // If we can't find name or number columns, try first two columns
      if (colNum === -1 && colName === -1) {
        if (headers.length >= 2) { colNum = 0; colName = 1; }
        else return;
      }
      if (colName === -1) colName = colNum === 0 ? 1 : 0;

      Logger.log('Sheet "' + s.getName() + '": num=' + colNum + ' name=' + colName + ' cat=' + colCat + ' type=' + colType);

      for (var i = 1; i < rows.length; i++) {
        var name = colName >= 0 ? String(rows[i][colName] || '').trim() : '';
        var num = colNum >= 0 ? String(rows[i][colNum] || '').trim() : '';

        // Skip blank rows — must have a real name (not just a number)
        if (!name || name.toLowerCase() === 'drop' || name.match(/^drop\s*\d*$/i)) continue;
        if (!name && !num) continue;

        // Clean up number - extract just digits
        var numClean = num.replace(/[^\d]/g, '');

        // Only use photo if explicitly in a photo column — no fuzzy matching
        var photo = '';
        if (colPhoto >= 0 && rows[i][colPhoto]) {
          photo = String(rows[i][colPhoto]).trim();
        }

        sheetDrops.push({
          number: numClean || '',
          name: name || ('Drop ' + numClean),
          category: colCat >= 0 ? String(rows[i][colCat] || '').trim() : '',
          type: colType >= 0 ? String(rows[i][colType] || '').trim() : '',
          size: colSize >= 0 ? String(rows[i][colSize] || '').trim() : '',
          notes: colNotes >= 0 ? String(rows[i][colNotes] || '').trim() : '',
          photo: photo,
        });
      }
    });
  }
  Logger.log('Found ' + sheetDrops.length + ' drops from spreadsheet(s)');

  // Step 3: Merge - spreadsheet data takes priority, add photo-only drops too
  var existingNumbers = existing.map(function(d) { return d.number; }).filter(Boolean);
  var count = 0;

  // Add/update from spreadsheet
  sheetDrops.forEach(function(sd) {
    // Check if this drop already exists by number
    var found = false;
    if (sd.number) {
      for (var i = 0; i < existing.length; i++) {
        if (existing[i].number === sd.number) {
          // Update existing with spreadsheet data (but keep existing photo if spreadsheet has none)
          if (sd.name) existing[i].name = sd.name;
          if (sd.category) existing[i].category = sd.category;
          if (sd.type) existing[i].type = sd.type;
          if (sd.size) existing[i].size = sd.size;
          if (sd.notes && sd.notes !== existing[i].notes) existing[i].notes = sd.notes;
          if (sd.photo && !existing[i].photo) existing[i].photo = sd.photo;
          found = true; break;
        }
      }
    }
    if (!found) {
      existing.push({
        id: Date.now().toString() + '_' + count,
        number: sd.number,
        name: sd.name,
        category: sd.category,
        type: sd.type,
        size: sd.size,
        photo: sd.photo,
        notes: sd.notes,
      });
      count++;
    }
  });

  // Sort numerically
  existing.sort(function(a, b) { return (parseInt(a.number) || 999) - (parseInt(b.number) || 999); });

  // Save as rows
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 8).clearContent();
  if (!sheet.getRange('A1').getValue()) {
    sheet.getRange('A1:H1').setValues([['Number', 'Name', 'Category', 'Type', 'Size', 'Photo', 'Notes', 'ID']]);
  }
  if (existing.length > 0) {
    var rows = existing.map(function(d) {
      return [d.number || '', d.name || '', d.category || '', d.type || '', d.size || '', d.photo || '', d.notes || '', d.id || ''];
    });
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
  Logger.log('Import complete. Added/updated ' + count + ' drops. Total: ' + existing.length);
}

function saveShopping(e, body) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Shopping');
  if (!sheet) {
    sheet = ss.insertSheet('Shopping');
    sheet.getRange('A1').setValue('Data');
  }

  let data = {};
  // Handle both GET (JSONP) and POST
  if (body && body.shopping) {
    data = body.shopping;
  } else if (e && e.parameter && e.parameter.shopping) {
    try { data = JSON.parse(e.parameter.shopping); } catch(err) { data = {}; }
  }

  sheet.getRange('A2').setValue(JSON.stringify(data));
  return response({ success: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// SCRIPTS & CUES
// ═══════════════════════════════════════════════════════════════════════════

function getScriptsFolder() {
  if (SCRIPTS_FOLDER_ID) return DriveApp.getFolderById(SCRIPTS_FOLDER_ID);
  // Auto-create a folder
  var folders = DriveApp.getFoldersByName('MMT Scripts');
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder('MMT Scripts');
}

function listScripts() {
  var folder = getScriptsFolder();
  var files = folder.getFilesByType(MimeType.PDF);
  var scripts = [];
  while (files.hasNext()) {
    var f = files.next();
    scripts.push({ id: f.getId(), name: f.getName().replace(/\.pdf$/i, ''), date: f.getLastUpdated().toLocaleDateString() });
  }
  return response({ success: true, scripts: scripts, folderId: folder.getId() });
}

function loadScript(e) {
  var fileId = e.parameter.fileId;
  if (!fileId) return response({ success: false, error: 'No fileId' });
  var file = DriveApp.getFileById(fileId);
  var bytes = file.getBlob().getBytes();
  var base64 = Utilities.base64Encode(bytes);
  return response({ success: true, data: base64, name: file.getName() });
}

// Search the whole Drive (including files shared with you) for PDFs by name.
// Lets you open large scripts that already live in Drive — no upload needed.
function searchDrive(e) {
  var q = (e.parameter.q || '').trim();
  if (!q) return response({ success: true, results: [] });

  // Escape single quotes for the Drive query string
  var safe = q.replace(/'/g, "\\'");
  // Match PDFs whose name contains the query, not trashed
  var query = "mimeType = 'application/pdf' and title contains '" + safe + "' and trashed = false";

  var results = [];
  try {
    var files = DriveApp.searchFiles(query);
    var count = 0;
    while (files.hasNext() && count < 25) {
      var f = files.next();
      var folderName = '';
      try {
        var parents = f.getParents();
        if (parents.hasNext()) folderName = parents.next().getName();
      } catch (err) {}
      results.push({
        id: f.getId(),
        name: f.getName().replace(/\.pdf$/i, ''),
        folder: folderName,
        date: f.getLastUpdated().toLocaleDateString(),
        owner: (function(){ try { return f.getOwner() ? f.getOwner().getName() : ''; } catch(err){ return ''; } })()
      });
      count++;
    }
  } catch (err) {
    return response({ success: false, error: err.message });
  }
  return response({ success: true, results: results });
}

// Pull a Drive file ID out of a pasted share link (or return the raw ID if already one).
function resolveDriveId(raw) {
  if (!raw) return '';
  raw = String(raw).trim();
  // Common Drive URL shapes:
  //   /file/d/<id>/   /d/<id>   ?id=<id>   /drive/folders/<id>   /folders/<id>   bare <id>
  var m = raw.match(/\/folders\/([a-zA-Z0-9_-]{20,})/) ||
          raw.match(/\/d\/([a-zA-Z0-9_-]{20,})/) ||
          raw.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) ||
          raw.match(/\/folderview\?id=([a-zA-Z0-9_-]{20,})/) ||
          raw.match(/^([a-zA-Z0-9_-]{20,})$/) ||
          raw.match(/([a-zA-Z0-9_-]{25,})/); // last resort: any long id-like token
  return m ? m[1] : '';
}

// Copy a Drive PDF (from search or a pasted link) into the MMT Scripts folder.
// Server-side copy — the file bytes never pass through the browser, so size is no issue.
// Returns the NEW file's ID, which becomes the working copy for layered markup.
function importScript(e) {
  var rawId = e.parameter.fileId || e.parameter.link || '';
  var fileId = resolveDriveId(rawId);
  if (!fileId) return response({ success: false, error: 'Could not read a Drive file ID from that.' });

  var source;
  try {
    source = DriveApp.getFileById(fileId);
  } catch (err) {
    return response({ success: false, error: 'Cannot open that file — check it is shared with this account.' });
  }

  // Must be a PDF
  var mime = '';
  try { mime = source.getMimeType(); } catch (err) {}
  if (mime && mime !== 'application/pdf') {
    return response({ success: false, error: 'That file is not a PDF.' });
  }

  var folder = getScriptsFolder();
  var baseName = source.getName().replace(/\.pdf$/i, '');

  // If a copy with this name already exists in MMT Scripts, reuse it (don't duplicate)
  var existing = folder.getFilesByName(source.getName());
  if (existing.hasNext()) {
    var ex = existing.next();
    return response({ success: true, fileId: ex.getId(), name: baseName, reused: true });
  }

  var copy = source.makeCopy(source.getName(), folder);
  return response({ success: true, fileId: copy.getId(), name: baseName, reused: false });
}

function uploadScript(data) {
  var folder = getScriptsFolder();
  var blob = Utilities.newBlob(Utilities.base64Decode(data.base64), 'application/pdf', data.fileName || 'script.pdf');
  var file = folder.createFile(blob);
  return response({ success: true, fileId: file.getId(), name: file.getName() });
}

// ── CUE DATA ────────────────────────────────────────────────────────────────
// One row per script in the CueData tab: A = script ID, B onward = the
// script's data as JSON, split into pieces of up to 45,000 characters so a
// script is never limited by the 50,000-character cell limit.
//
// Saves are safe with several devices at once:
//   • one save at a time (a lock), so two can't interleave;
//   • a save says which version it was based on (baseRev). If someone else
//     saved since, it's refused and the newer copy is sent back; the device
//     merges and tries again. Nothing is ever written over newer work.
//   • the version number is set here, not by the devices;
//   • every 10 minutes the version being replaced is copied to the
//     CueBackup tab (last 40 per script, so several hours of work).
// A save with no baseRev comes from an old copy of a page and is refused, so
// an old tab left open somewhere can't overwrite anyone's work.
var CUE_CHUNK = 45000;
var CUE_BACKUPS_KEEP = 40;      // per script
var CUE_BACKUP_EVERY = 600;     // seconds between backups of one script

function _cueSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'CueData') sheet.getRange('A1:B1').setValues([['ScriptID', 'Data (continues across columns)']]);
    else sheet.getRange('A1:D1').setValues([['Saved', 'ScriptID', 'Version', 'Data (continues across columns)']]);
  }
  return sheet;
}
// Find a script's row: { row (1-based) or -1, json string or '' }.
function _cueRead(sheet, scriptId) {
  var last = sheet.getLastRow(), width = Math.max(sheet.getLastColumn(), 2);
  if (last < 2) return { row: -1, json: '' };
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(scriptId)) {
      var vals = sheet.getRange(i + 2, 2, 1, width - 1).getValues()[0];
      var json = '';
      for (var c = 0; c < vals.length; c++) { if (vals[c] === '' || vals[c] == null) break; json += String(vals[c]); }
      return { row: i + 2, json: json };
    }
  }
  return { row: -1, json: '' };
}
// Pieces never start with a character the Sheet would read as a formula or
// strip (= + - @ ' or a space), and never end in a space.
function _cueChunks(json) {
  var out = [], i = 0, bad = "=+-@' \t";
  while (i < json.length) {
    var end = Math.min(i + CUE_CHUNK, json.length);
    while (end < json.length && end > i + 1 && (bad.indexOf(json.charAt(end)) >= 0 || json.charAt(end - 1) === ' ')) end--;
    out.push(json.substring(i, end));
    i = end;
  }
  return out.length ? out : [''];
}
function _cueWrite(sheet, row, scriptId, json) {
  var parts = _cueChunks(json);
  if (row < 0) { row = sheet.getLastRow() + 1; sheet.getRange(row, 1).setNumberFormat('@').setValue(String(scriptId)); }
  var width = sheet.getLastColumn();
  // Clear anything past the new end first, so a shorter save can't leave a
  // stale tail behind.
  if (width > parts.length + 1) sheet.getRange(row, parts.length + 2, 1, width - parts.length - 1).clearContent();
  var rng = sheet.getRange(row, 2, 1, parts.length);
  rng.setNumberFormat('@');            // plain text: the Sheet must not reinterpret it
  rng.setValues([parts]);
  return row;
}
function _cueRevOf(json) {
  if (!json) return 0;
  try { var d = JSON.parse(json); return (d && d._rev) || 0; } catch (err) { return -1; }
}

function getCueData(e) {
  var scriptId = e.parameter.scriptId;
  if (!scriptId) return response({ success: false, error: 'No scriptId' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('CueData');
  if (!sheet) return response({ success: true, cueData: null, rev: 0, safeSaves: true });
  var r = _cueRead(sheet, scriptId);
  if (!r.json) return response({ success: true, cueData: null, rev: 0, safeSaves: true });
  try {
    var data = JSON.parse(r.json);
    try { CacheService.getScriptCache().put('cuerev_' + scriptId, String(data._rev || 0), 21600); } catch (err) {}
    return response({ success: true, cueData: data, rev: data._rev || 0, safeSaves: true });
  } catch (err) {
    return response({ success: false, error: 'The saved data for this script could not be read: ' + err.message });
  }
}

// The cheap "anything new?" check devices make every few seconds. It also
// says who else has this script open and what they're editing (kept a few
// seconds in the cache only, never in the Sheet).
function getCueRev(e) {
  var scriptId = e.parameter.scriptId;
  if (!scriptId) return response({ success: false, error: 'No scriptId' });
  var cache = CacheService.getScriptCache();
  var hit = cache.get('cuerev_' + scriptId), rev;
  if (hit !== null) rev = Number(hit);
  else {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('CueData');
    rev = sheet ? _cueRevOf(_cueRead(sheet, scriptId).json) : 0;
    cache.put('cuerev_' + scriptId, String(rev), 21600);
  }
  var people = [];
  try { people = _cuePresence(cache, scriptId, e.parameter); } catch (err) {}
  return response({ success: true, rev: rev, safeSaves: true, people: people, now: Date.now() });
}
function _cuePresence(cache, scriptId, p) {
  var me = String(p.me || '').slice(0, 40);
  if (!me) return [];
  var idxKey = 'presidx_' + scriptId, idx = [];
  try { idx = JSON.parse(cache.get(idxKey) || '[]') || []; } catch (err) {}
  var key = function (d) { return 'pres_' + scriptId + '_' + d; };
  if (p.bye) cache.remove(key(me));
  else cache.put(key(me), JSON.stringify({ id: me, name: String(p.name || '').slice(0, 30), where: String(p.where || '').slice(0, 200), page: String(p.page || '').slice(0, 40), t: Date.now() }), 30);
  if (idx.indexOf(me) < 0 && !p.bye) { idx.push(me); idx = idx.slice(-20); cache.put(idxKey, JSON.stringify(idx), 21600); }
  var got = cache.getAll(idx.map(key)), out = [], now = Date.now();
  Object.keys(got).forEach(function (k) {
    try { var x = JSON.parse(got[k]); if (x && x.id !== me && now - x.t < 15000) out.push(x); } catch (err) {}
  });
  return out;
}

function saveCueData(e, body) {
  var scriptId, cueData, baseRev;
  if (body && body.scriptId) { scriptId = body.scriptId; cueData = body.cueData; baseRev = body.baseRev; }
  else if (e && e.parameter) { scriptId = e.parameter.scriptId; baseRev = e.parameter.baseRev; try { cueData = JSON.parse(e.parameter.cueData); } catch(err) {} }
  if (!scriptId) return response({ success: false, error: 'No scriptId' });
  if (!cueData || typeof cueData !== 'object') return response({ success: false, error: 'No data' });
  if (baseRev === undefined || baseRev === null || baseRev === '') {
    // From an old copy of a page. Not applied, but kept in CueBackup so
    // nothing typed there is lost.
    try {
      var ss0 = SpreadsheetApp.openById(SPREADSHEET_ID);
      _cueBackup(ss0, scriptId, 'old page, not applied', JSON.stringify(cueData));
    } catch (err) {}
    return response({ success: false, reload: true, error: 'This page is an old version. Reload it to save.' });
  }
  baseRev = Number(baseRev);

  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); }
  catch (err) { return response({ success: false, busy: true, error: 'The Sheet is busy, trying again.' }); }
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = _cueSheet(ss, 'CueData');
    var cur = _cueRead(sheet, scriptId);
    var curRev = _cueRevOf(cur.json);
    if (curRev < 0) return response({ success: false, error: 'The saved copy could not be read, so nothing was written. Nothing is lost.' });
    if (curRev !== baseRev) {
      // Someone saved since this device last read. Send the newer copy back.
      return response({ success: false, conflict: true, rev: curRev, cueData: cur.json ? JSON.parse(cur.json) : null });
    }
    var newRev = curRev + 1;
    // A short list of the last saves (by the id each device gives its save),
    // so a device whose answer got lost can tell its save went in.
    var log = [];
    try { log = (cur.json && JSON.parse(cur.json)._log) || []; } catch (err) {}
    if (body && body.saveId) log.push({ id: String(body.saveId).slice(0, 40), rev: newRev });
    cueData._log = log.slice(-30);
    cueData._rev = newRev;
    cueData._savedAt = new Date().toISOString();
    var json = JSON.stringify(cueData);
    // Keep the version being replaced.
    // Keep the version being replaced, at most once every 10 minutes per
    // script (saves come every few seconds while people work).
    if (cur.json) {
      try {
        var cache = CacheService.getScriptCache(), bkKey = 'cuebk_' + scriptId;
        if (!cache.get(bkKey)) { _cueBackup(ss, scriptId, curRev, cur.json); cache.put(bkKey, '1', CUE_BACKUP_EVERY); }
      } catch (err) {}
    }
    _cueWrite(sheet, cur.row, scriptId, json);
    SpreadsheetApp.flush();
    // Read it back: only say saved once the Sheet really has it.
    var check = _cueRead(sheet, scriptId);
    if (check.json !== json) {
      // Put the previous version straight back, so what's stored is never half a save.
      if (cur.json) { try { _cueWrite(sheet, check.row, scriptId, cur.json); SpreadsheetApp.flush(); } catch (err) {} }
      return response({ success: false, error: 'The Sheet did not keep the save. Trying again.' });
    }
    CacheService.getScriptCache().put('cuerev_' + scriptId, String(newRev), 21600);
    return response({ success: true, rev: newRev, savedAt: cueData._savedAt });
  } catch (err) {
    return response({ success: false, error: 'Not saved: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

function _cueBackup(ss, scriptId, label, json) {
  var bk = _cueSheet(ss, 'CueBackup');
  var parts = _cueChunks(json);
  var row = bk.getLastRow() + 1;
  bk.getRange(row, 1, 1, 3).setValues([[new Date(), scriptId, label]]);
  var rng = bk.getRange(row, 4, 1, parts.length);
  rng.setNumberFormat('@');
  rng.setValues([parts]);
  _cuePruneBackups(bk, scriptId);
}
function _cuePruneBackups(bk, scriptId) {
  var last = bk.getLastRow();
  if (last < 2) return;
  var ids = bk.getRange(2, 2, last - 1, 1).getValues();
  var rows = [];
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(scriptId)) rows.push(i + 2);
  var extra = rows.length - CUE_BACKUPS_KEEP;
  for (var k = extra - 1; k >= 0; k--) bk.deleteRow(rows[k]);   // oldest first, bottom-up
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════
// To enable: in Apps Script, go to Triggers (clock icon on left) →
// + Add Trigger → choose "checkNotifications" → Time-driven →
// Day timer → 7am to 8am (or whenever you want) → Save

function checkNotifications() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Tasks');
  if (!sheet) return;

  // Fixed recipient — no Session.getEffectiveUser (that needs an extra
  // permission the script wasn't granted). MailApp only needs send_mail.
  const email = 'musicmountainmcafee@gmail.com';
  const rows = sheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = [];
  const dueToday = [];
  const notifyToday = [];

  for (let i = 1; i < rows.length; i++) {
    const list = rows[i][0];
    const task = rows[i][1];
    const done = String(rows[i][2] || '').toUpperCase() === 'TRUE';
    const dueStr = rows[i][3];
    const notify = String(rows[i][5] || '').toUpperCase() === 'TRUE';

    if (!task || done || !dueStr) continue;

    const due = new Date(dueStr);
    if (isNaN(due)) continue;
    due.setHours(0, 0, 0, 0);

    if (due < today) {
      const daysLate = Math.round((today - due) / 86400000);
      overdue.push({ list, task, daysLate });
    } else if (due.getTime() === today.getTime()) {
      dueToday.push({ list, task });
      if (notify) notifyToday.push({ list, task });
    }
  }

  // Build email
  if (overdue.length === 0 && dueToday.length === 0) return; // Nothing to report

  let subject = 'MMT Tasks: ';
  const parts = [];
  if (overdue.length) parts.push(overdue.length + ' overdue');
  if (dueToday.length) parts.push(dueToday.length + ' due today');
  subject += parts.join(', ');

  let body = 'Good morning! Here\'s your MMT task update:\n\n';

  if (overdue.length) {
    body += '🔴 OVERDUE (' + overdue.length + '):\n';
    overdue.sort((a, b) => b.daysLate - a.daysLate);
    overdue.forEach(t => {
      body += '  • [' + t.list + '] ' + t.task + ' — ' + t.daysLate + ' day' + (t.daysLate !== 1 ? 's' : '') + ' late\n';
    });
    body += '\n';
  }

  if (dueToday.length) {
    body += '📅 DUE TODAY (' + dueToday.length + '):\n';
    dueToday.forEach(t => {
      body += '  • [' + t.list + '] ' + t.task + '\n';
    });
    body += '\n';
  }

  body += '—\nMMT TD Dashboard\nhttps://musicmountainmcafee-eng.github.io/MMT-Inventory/app.html';

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body,
  });
}

// ── TEST: run this manually from Apps Script to confirm emails work. ──
// Select "testNotificationEmail" from the function dropdown → Run. It sends a
// test email to your account right now, regardless of whether any tasks are due.
function testNotificationEmail() {
  const email = 'musicmountainmcafee@gmail.com';
  MailApp.sendEmail({
    to: email,
    subject: 'MMT Dashboard — test email ✓',
    body: 'This is a test from your MMT Dashboard.\n\nIf you got this, email notifications are working. The daily task summary will arrive each morning once the trigger is set up.\n\n—\nMMT TD Dashboard'
  });
  Logger.log('Test email sent to: ' + email);
}

function getDriveImage(e) {
  try {
    var file = DriveApp.getFileById(e.parameter.fileId);
    var blob = file.getBlob();
    var base64 = Utilities.base64Encode(blob.getBytes());
    return ContentService.createTextOutput(
      (e.parameter.callback || 'callback') + '(' + JSON.stringify({
        success: true, base64: base64, mimeType: blob.getContentType()
      }) + ')'
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  } catch (err) {
    return ContentService.createTextOutput(
      (e.parameter.callback || 'callback') + '(' + JSON.stringify({ success: false, error: err.message }) + ')'
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}