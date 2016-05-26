import Dexie from 'dexie';
import util from '../util';

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
  const dexie = new Dexie('SashikomiDB');
  dexie.version(1).stores({ memos: "++id, url" });
  dexie.open();
  return dexie;
})();

/*
* 新規登録・更新
* --------------------------------------
* 新規登録の場合、 url, targetElm, contentTextをオブジェクトで渡す
* 更新の場合、id, url, targetElm, contentTextをオブジェクトで渡す
* _.pickで登録・更新に必要なdataを内部で決定するようしているため、Reactのstateをそのまま渡せる
* 返り値: Promise。thenの引数に新規登録・更新された1件のオブジェクトが渡る

ex)
store.save(new_memo)
  .then(data => console.log('success', data))
  .catch(err => console.log(err));
* */
export function save(obj) {
  const data = util.pick(obj, ['id', 'url', 'targetElmPath', 'contentText']);
  return db.transaction('rw', db.memos, () => db.memos.put(data).then(id => db.memos.get(id)));
}


/*
* Memoの削除
* -------------------------------------------------
* 引数: Object
* 返り値: Promise(undefined)
* catch()が発火しなければ削除が成功したものとする。
* 存在しないIDが渡されても例外は起きない。なにも起きない。

ex)
delete(obj)
  .then(store.db.memos.count(count => console.log(count)))
  .catch(err => console.log(err));
* */
export function remove(obj) {
  const id = obj.id || -1;
  return db.transaction('rw', db.memos, () => db.memos.delete(id));
}


/*
* URLによるMemoの検索
* -------------------------------------------------
* 引数: url
* 返り値: Promise(array)
* 存在しないURLの場合も空の配列が返る
* dataの有無判定をせず、content_scriptに配列を投げ、
* content_script側で配列分だけrenderするように使う
* hash fragmentの対応として既存データを壊さないようにするためにorで両方検索する
ex)
getMemosByUrl('http//:example.co.jp')
  .then(memos => {console.log(memos)})
  .catch(err => console.log(err));
* */
export function getMemosByUrl(url) {
  return db.transaction('rw', db.memos, () => {
    const urlWithoutHash = util.removeUrlHash(url);
    return db.memos.where('url')
      .equals(url)
      .or('url')
      .equals(urlWithoutHash)
      .toArray();
  });
}

/*
* InsertionErrorフラグを追加する
* --------------------------------------------
* 配列オブジェクトを受け取り1件毎にinsertionErrorフラグを立てる
* */
export function addInsertionErrorFlag(memos = []) {
  const invalidMemos = memos.map(memo => {
    const data = util.pick(memo, ['id', 'url', 'targetElmPath', 'contentText']);
    return Object.assign({}, data, { insertionError: true });
  });

  db.transaction('rw', db.memos, () => invalidMemos.forEach(memo => db.memos.put(memo)))
    .catch(err => console.log(err));
}

/*
* InsertErrorが付いたdataを検索
* ---------------------------------------------
* URLを受け取りInsertErrorが付いているdataを取得
* 返り値: Promise(array)
* */
export function getInsertionErrorData(url) {
  return getMemosByUrl(url)
    .then(memos => memos.filter(memo => memo.insertionError))
    .catch(e => console.log(e));
}
