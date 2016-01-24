import Dexie from 'dexie'
import _ from '../util'

/* -----------------------------------
  Schema
* ------------------------------------

* memos:
* -------
  id: 1 // auto increment, index
  url: '', // index,
  targetElmPath: 'element',
  contentText: 'text or markdown'
*/

/*------------------------------------
* Setup
* ------------------------------------*/
export const db = (() => {
  let db = new Dexie('SashikomiDB');
  db.version(1).stores({ memos: "++id, url" });
  db.open();
  return db
})();

/*
* 新規登録・更新
* --------------------------------------
* 新規登録の場合、 url, targetElm, contentTextをオブジェクトで渡す
* 更新の場合、id, url, targetElm, contentTextをオブジェクトで渡す
* _.pickで登録・更新に必要なdataを内部で決定するようしているため、Reactのstateをそのまま渡せる
* 返り値: Promise。thenの引数に新規登録・更新された1件のオブジェクトが渡る

ex)
store.$put(new_memo)
  .then(data => console.log('success', data))
  .catch(err => console.log(err));
* */
export function save(obj) {
  let data = _.pick(obj, ['id', 'url', 'targetElmPath', 'contentText']);
  return db.transaction('rw', db.memos, () => {
    return db.memos.put(data)
      .then(id => db.memos.get(id))
  })
}


/*
* Memoの削除
* -------------------------------------------------
* 引数: Object
* 返り値: Promise(undefined)
* catch()が発火しなければ削除が成功したものとする。
* 存在しないIDが渡されても例外は起きない。なにも起きない。

ex)
$delete(2)
  .then(store.db.memos.count(count => console.log(count)))
  .catch(err => console.log(err));
* */
export function remove(obj) {
  let id = obj.id || -1;
  return db.transaction('rw', db.memos, () => {
    return db.memos.delete(id)
  })
}


/*
* URLによるMemoの検索
* -------------------------------------------------
* 引数: url
* 返り値: Promise(array)
* 存在しないURLの場合も空の配列が返る
* dataの有無判定をせず、content_scriptに配列を投げ、
* content_script内で配列分だけrenderするように使う

ex)
$getMemosByUrl('http//:example.co.jp')
  .then(memos => {console.log(memos)})
  .catch(err => console.log(err));
* */
export function getMemosByUrl(url) {
  return db.transaction('rw', db.memos, () => {
    return db.memos.where('url').equals(url).toArray()
  })
}
