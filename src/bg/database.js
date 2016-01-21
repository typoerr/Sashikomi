/* -----------------------------------
  Schema
* ------------------------------------

* memos:
* -------
  id: 1 // auto increment, index
  url: '', // index,
  contentId: 'uuid' // index, containerElmIdとしても利用する
  targetElm: 'element',
  contentText: 'text or markdown'
*/

/*------------------------------------
* Setup
* ------------------------------------*/

import Dexie from 'dexie'
export default function () {
  let db = new Dexie('SashikomiDB');
  db.version(1).stores({
    memos: "++id, url"
  });
  db.open();

  return db;
}
