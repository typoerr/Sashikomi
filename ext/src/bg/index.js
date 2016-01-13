import Dexie from 'dexie'

/* ==========================================
 * indexedDBのsetup
 * ===========================================*/
/* ---------------------------------------
 * Schema

 id: 1 // auto increment // index
 url: '', // index
 contents: [
  { node: 'element', content: 'text or markdown'},
 ]

 * id, またはurlで検索をするため、contentsにindexは貼っていない
 * -------------------------------------------*/

/* ------------------------------------------
 * Operation Sample

 db.transaction('rw', db.memos, function () {
   db.memos.add({ url: 'http://example.com',
      contents: [{ node: 'element', content: 'text or markdown' }]
   });
   db.memos.where('url').equals('http://example.com').each((item) => console.log(item));
 });

 *---------------------------------------------- */
let db = new Dexie('SashikomiDB');
db.version(1).stores({
  memos: "++id, url"
});

db.open();


/* =============================================
 * browserAction#onClick
 * ==============================================*/
chrome.browserAction.onClicked.addListener(function () {

  /*
   * TODO: inject.jsにmessageを送る(選択nodeを取得、editor挿入等をさせる)
   */
});


// TODO: inject.jsからのMessageをlistenして、DBのCRUD処理