/*
* TODO: trans関数を定義
* */

/* -----------------------------------
  Schema
* ------------------------------------

* locations:
* -------
  id: 1 // auto increment, index
  url: '', // index

* contents:
* -----------
  id: 1, // Hidden auto-incremented primary key
  locationsId : 1 // index, for relation
  contentId: 'uuid' // index, containerElmIdとしても利用する
  targetElm: 'element',
  contentText: 'text or markdown'
*/

import Dexie from 'dexie'
export default function () {
  let db = new Dexie('SashikomiDB');
  db.version(1).stores({
    locations_table: "++id, url",
    contents_table: "++, locationId, contentId"
  });
  db.open();

  return db;
}

//
//export default class {
//  constructor(dbName) {
//    this.dbName = dbName;
//    this.table = {};
//    this.db = this.setup();
//  }
//
//  setup() {
//    const db = new Dexie(this.dbName);
//    db.version(1).stores({
//      memos: '++, url'
//    });
//
//    return db
//  }
//
//  trans(tables, callback) {
//    this.db.open();
//    return this.db.transaction('rw', tables, () => callback())
//  }
//
//  static uuid() {
//    var uuid = "", i, random;
//    for (i = 0; i < 32; i++) {
//      random = Math.random() * 16 | 0;
//
//      if (i == 8 || i == 12 || i == 16 || i == 20) {
//        uuid += "-"
//      }
//      uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
//    }
//    return uuid;
//  }
//}

//export default (() => {
//  const db = new Dexie('SashikomiDB');
//  db.version(1).stores({ memos: "++,url" });
//
//  const trans = (callback) => {
//    db.open();
//    return
//  };


//db.transaction('rw', db.memos, function () {
//  db.memos.get(3).then(function(item) {
//    console.log(item)
//  })
//});
//
//db.transaction('rw', db.memos, function () {
//  db.memos.put({url: 'http://va.com'}).then(function () {
//
//    console.log('called');
//  }).catch(function(err) {
//    console.log(err)
//  })
//});

//})();

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

