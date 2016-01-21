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

class DB {
  constructor() {
    this.db = {};
    this.setup();
  }

  setup() {
    let db = new Dexie('SashikomiDB');
    db.version(1).stores({ memos: "++id, url" });
    db.open();

    this.db = db
  }

  putMemo(obj) {
    return this.db.transaction('rw', this.db.memos, () => {
      return this.db.memos.put(obj)
        .then(id => {
          return this.db.memos.get(id);
        })
    })
  }

  deleteMemo(id) {
    return this.db.transaction('rw', this.db.memos, () => {
      return this.db.memos.delete(id)
    })
  }

  getMemosByUrl(url) {
    return this.db.transaction('rw', this.db.memos, () => {
      return this.db.memos.where('url').equals(url).toArray()
    })
  }

}

export const db = new DB();
