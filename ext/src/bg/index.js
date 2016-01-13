import Dexie from 'dexie'

/* ==========================================
 * indexedDBのsetup
 * ===========================================*/

/* -----------------------------------
  Schema
* ------------------------------------
 id: 1 // auto increment // index
 url: '', // index
 contents: [
  { node: 'element', content: 'text or markdown'},
 ]

 * id, またはurlで検索をするため、contentsにindexは貼っていない
*/

/*-----------------------------------
  Operation Sample
* -----------------------------------
 db.transaction('rw', db.memos, function () {
   db.memos.add({ url: 'http://example.com',
      contents: [{ node: 'element', content: 'text or markdown' }]
   });
   db.memos.where('url').equals('http://example.com').each((item) => console.log(item));
 });

*/

let db = new Dexie('SashikomiDB');
db.version(1).stores({
  memos: "++id, url"
});

db.open();


/* =============================================
 * browserAction#onClick
 * ==============================================*/
// TODO: inject.jsにmessageを送る(選択nodeを取得、editor挿入等をさせる)
chrome.browserAction.onClicked.addListener(function () {

});


/* =============================================
 * Message Passing(onMessage)
 * ==============================================*/
// TODO: inject.jsからのMessageをlistenして、DBのCRUD処理
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    //  switch (request.type) {
    //    case "hello":
    //      hello(request.text, sendResponse);
    //      break;
    //    case "night":
    //      night(request.text, sendResponse);
    //      break;
    //    default:
    //      console.log("Error: Unkown request.");
    //      console.log(request);
    //  }
  }
);

//function hello(name, callback) {
//  callback("Hello, " + name);
//}
//
//function night(name, callback) {
//  callback("Good night, " + name);
//}