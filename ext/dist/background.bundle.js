/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _message_listener = __webpack_require__(1);
	
	var _message_listener2 = _interopRequireDefault(_message_listener);
	
	var _store = __webpack_require__(2);
	
	var store = _interopRequireWildcard(_store);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/*========================================
	* Tab Action
	* ========================================*/
	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	  store.getMemosByUrl(tab.url).then(function (data) {
	    if (data.length) {
	      chrome.tabs.sendMessage(tabId, { type: 'TAB_ON_UPDATED', data: data, tabId: tabId });
	      chrome.pageAction.show(tabId);
	    }
	  }).catch(function (err) {
	    return console.log(err);
	  });
	});
	
	/* ============================================
	* Context Menu
	* ============================================*/
	chrome.contextMenus.create({
	  id: 'sashikomi_context_menu',
	  title: 'Sashikomi',
	  contexts: ['selection']
	});
	
	chrome.contextMenus.onClicked.addListener(function (info, tab) {
	  chrome.tabs.sendMessage(tab.id, { type: 'CONTEXT_MENU' });
	});
	
	/* =============================================
	 * PageAction
	 * ==============================================*/
	chrome.pageAction.onClicked.addListener(function (tab) {
	  chrome.pageAction.getTitle({ tabId: tab.id }, function (title) {
	    if (title.match(/error/)) {
	      sessionStorage.insetionErrorURL = tab.url;
	      chrome.tabs.create({ url: chrome.extension.getURL('insertion_error.html') });
	    }
	  });
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _store = __webpack_require__(2);
	
	var store = _interopRequireWildcard(_store);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	exports.default = function () {
	
	  chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
	    switch (req.type) {
	      case "PUT":
	        putMemo(req, sendResponse);
	        _validatePageAction(sender);
	        return true;
	        break;
	      case "DELETE":
	        deleteMemo(req, sendResponse);
	        _validatePageAction(sender);
	        return true;
	        break;
	      case "HAS_INSERTION_ERRORS":
	        changePageActionToErrorIcon(req, sender);
	        addFlag(req);
	        return true;
	        break;
	      case "GET_INSERTION_ERRORS":
	        getInsertionErrors(sendResponse);
	        return true;
	        break;
	      default:
	        console.log("Error: Unknown request.");
	        console.log(req);
	    }
	  });
	
	  function putMemo(req, res) {
	    store.save(req.data).then(function (data) {
	      return res({ status: 'success', data: data });
	    }).catch(function (err) {
	      return res({ status: 'error', errorMessage: err });
	    });
	  }
	
	  function deleteMemo(req, res) {
	    store.remove(req.data).then(res({ status: 'success' })).catch(res({ status: 'error' }));
	  }
	
	  function changePageActionToErrorIcon(req, sender) {
	    chrome.pageAction.setTitle({
	      tabId: sender.tab.id,
	      title: "Sashikomi has insertion error(" + req.data.length + ")"
	    });
	    chrome.pageAction.setIcon({
	      tabId: sender.tab.id,
	      path: "icons/icon19_error.png"
	    });
	  }
	
	  function addFlag(req) {
	    store.addInsertionErrorFlag(req.data);
	  }
	
	  function getInsertionErrors(res) {
	    var url = sessionStorage.insetionErrorURL;
	    store.getInsertionErrorData(url).then(function (data) {
	      res({ status: 'success', data: { url: url, errors: data } });
	    }).catch(function (e) {
	      return console.error(e);
	    });
	  }
	
	  function _validatePageAction(sender) {
	    /*
	    *  memoの数に応じて、page actionを操作
	    *  memoのurlでmemoのカウントを調べる
	    *  memoがあればpageAction.show
	    *  なければhide
	    *  putMemoとdeleteMemoのタイミングで実行
	    */
	    var url = sender.url;
	    var tabId = sender.tab.id;
	
	    store.getMemosByUrl(url).then(function (data) {
	      if (data.length) {
	        chrome.pageAction.show(tabId);
	      } else {
	        chrome.pageAction.hide(tabId);
	      }
	    });
	  }
	}();

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.db = undefined;
	exports.save = save;
	exports.remove = remove;
	exports.getMemosByUrl = getMemosByUrl;
	exports.addInsertionErrorFlag = addInsertionErrorFlag;
	exports.getInsertionErrorData = getInsertionErrorData;
	
	var _dexie = __webpack_require__(3);
	
	var _dexie2 = _interopRequireDefault(_dexie);
	
	var _util = __webpack_require__(6);
	
	var _util2 = _interopRequireDefault(_util);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
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
	var db = exports.db = function () {
	  var db = new _dexie2.default('SashikomiDB');
	  db.version(1).stores({ memos: "++id, url" });
	  db.open();
	  return db;
	}();
	
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
	function save(obj) {
	  var data = _util2.default.pick(obj, ['id', 'url', 'targetElmPath', 'contentText']);
	  return db.transaction('rw', db.memos, function () {
	    return db.memos.put(data).then(function (id) {
	      return db.memos.get(id);
	    });
	  });
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
	function remove(obj) {
	  var id = obj.id || -1;
	  return db.transaction('rw', db.memos, function () {
	    return db.memos.delete(id);
	  });
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
	function getMemosByUrl(url) {
	  return db.transaction('rw', db.memos, function () {
	    return db.memos.where('url').equals(url).toArray();
	  });
	}
	
	/*
	* InsertionErrorフラグを追加する
	* --------------------------------------------
	* 配列オブジェクトを受け取り1件毎に_insertionErrorフラグを立てる
	* */
	function addInsertionErrorFlag() {
	  var memos = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
	
	  var _memos = memos.map(function (memo) {
	    var _data = _util2.default.pick(memo, ['id', 'url', 'targetElmPath', 'contentText']);
	    return Object.assign({}, _data, { insertionError: true });
	  });
	
	  db.transaction('rw', db.memos, function () {
	    return _memos.forEach(function (memo) {
	      return db.memos.put(memo);
	    });
	  }).catch(function (err) {
	    return console.log(err);
	  });
	}
	
	/*
	* InsertErrorが付いたdataを検索
	* ---------------------------------------------
	* URLを受け取りInsertErrorが付いているdataを取得
	* 返り値: Promise(array)
	*
	* ex)
	store.getInsertionErrorData(sender.url)
	  .then(data => console.log(data));
	* */
	function getInsertionErrorData(url) {
	  return getMemosByUrl(url).then(function (memos) {
	    return memos.filter(function (memo) {
	      if (memo.insertionError) return memo;
	    });
	  }).catch(function (e) {
	    return console.log(e);
	  });
	}

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(setImmediate) {/* A Minimalistic Wrapper for IndexedDB
	   ====================================
	
	   By David Fahlander, david.fahlander@gmail.com
	
	   Version 1.2.0 - September 22, 2015.
	
	   Tested successfully on Chrome, Opera, Firefox, Edge, and IE.
	
	   Official Website: www.dexie.com
	
	   Licensed under the Apache License Version 2.0, January 2004, http://www.apache.org/licenses/
	*/
	(function (global, publish, undefined) {
	
	    "use strict";
	
	    function extend(obj, extension) {
	        if (typeof extension !== 'object') extension = extension(); // Allow to supply a function returning the extension. Useful for simplifying private scopes.
	        Object.keys(extension).forEach(function (key) {
	            obj[key] = extension[key];
	        });
	        return obj;
	    }
	
	    function derive(Child) {
	        return {
	            from: function (Parent) {
	                Child.prototype = Object.create(Parent.prototype);
	                Child.prototype.constructor = Child;
	                return {
	                    extend: function (extension) {
	                        extend(Child.prototype, typeof extension !== 'object' ? extension(Parent.prototype) : extension);
	                    }
	                };
	            }
	        };
	    }
	
	    function override(origFunc, overridedFactory) {
	        return overridedFactory(origFunc);
	    }
	
	    function Dexie(dbName, options) {
	        /// <param name="options" type="Object" optional="true">Specify only if you wich to control which addons that should run on this instance</param>
	        var addons = (options && options.addons) || Dexie.addons;
	        // Resolve all external dependencies:
	        var deps = Dexie.dependencies;
	        var indexedDB = deps.indexedDB,
	            IDBKeyRange = deps.IDBKeyRange,
	            IDBTransaction = deps.IDBTransaction;
	
	        var DOMError = deps.DOMError,
	            TypeError = deps.TypeError,
	            Error = deps.Error;
	
	        var globalSchema = this._dbSchema = {};
	        var versions = [];
	        var dbStoreNames = [];
	        var allTables = {};
	        var notInTransFallbackTables = {};
	        ///<var type="IDBDatabase" />
	        var idbdb = null; // Instance of IDBDatabase
	        var db_is_blocked = true;
	        var dbOpenError = null;
	        var isBeingOpened = false;
	        var READONLY = "readonly", READWRITE = "readwrite";
	        var db = this;
	        var pausedResumeables = [];
	        var autoSchema = true;
	        var hasNativeGetDatabaseNames = !!getNativeGetDatabaseNamesFn();
	
	        function init() {
	            // If browser (not node.js or other), subscribe to versionchange event and reload page
	            db.on("versionchange", function (ev) {
	                // Default behavior for versionchange event is to close database connection.
	                // Caller can override this behavior by doing db.on("versionchange", function(){ return false; });
	                // Let's not block the other window from making it's delete() or open() call.
	                db.close();
	                db.on('error').fire(new Error("Database version changed by other database connection."));
	                // In many web applications, it would be recommended to force window.reload()
	                // when this event occurs. Do do that, subscribe to the versionchange event
	                // and call window.location.reload(true);
	            });
	        }
	
	        //
	        //
	        //
	        // ------------------------- Versioning Framework---------------------------
	        //
	        //
	        //
	
	        this.version = function (versionNumber) {
	            /// <param name="versionNumber" type="Number"></param>
	            /// <returns type="Version"></returns>
	            if (idbdb) throw new Error("Cannot add version when database is open");
	            this.verno = Math.max(this.verno, versionNumber);
	            var versionInstance = versions.filter(function (v) { return v._cfg.version === versionNumber; })[0];
	            if (versionInstance) return versionInstance;
	            versionInstance = new Version(versionNumber);
	            versions.push(versionInstance);
	            versions.sort(lowerVersionFirst);
	            return versionInstance;
	        }; 
	
	        function Version(versionNumber) {
	            this._cfg = {
	                version: versionNumber,
	                storesSource: null,
	                dbschema: {},
	                tables: {},
	                contentUpgrade: null
	            }; 
	            this.stores({}); // Derive earlier schemas by default.
	        }
	
	        extend(Version.prototype, {
	            stores: function (stores) {
	                /// <summary>
	                ///   Defines the schema for a particular version
	                /// </summary>
	                /// <param name="stores" type="Object">
	                /// Example: <br/>
	                ///   {users: "id++,first,last,&amp;username,*email", <br/>
	                ///   passwords: "id++,&amp;username"}<br/>
	                /// <br/>
	                /// Syntax: {Table: "[primaryKey][++],[&amp;][*]index1,[&amp;][*]index2,..."}<br/><br/>
	                /// Special characters:<br/>
	                ///  "&amp;"  means unique key, <br/>
	                ///  "*"  means value is multiEntry, <br/>
	                ///  "++" means auto-increment and only applicable for primary key <br/>
	                /// </param>
	                this._cfg.storesSource = this._cfg.storesSource ? extend(this._cfg.storesSource, stores) : stores;
	
	                // Derive stores from earlier versions if they are not explicitely specified as null or a new syntax.
	                var storesSpec = {};
	                versions.forEach(function (version) { // 'versions' is always sorted by lowest version first.
	                    extend(storesSpec, version._cfg.storesSource);
	                });
	
	                var dbschema = (this._cfg.dbschema = {});
	                this._parseStoresSpec(storesSpec, dbschema);
	                // Update the latest schema to this version
	                // Update API
	                globalSchema = db._dbSchema = dbschema;
	                removeTablesApi([allTables, db, notInTransFallbackTables]);
	                setApiOnPlace([notInTransFallbackTables], tableNotInTransaction, Object.keys(dbschema), READWRITE, dbschema);
	                setApiOnPlace([allTables, db, this._cfg.tables], db._transPromiseFactory, Object.keys(dbschema), READWRITE, dbschema, true);
	                dbStoreNames = Object.keys(dbschema);
	                return this;
	            },
	            upgrade: function (upgradeFunction) {
	                /// <param name="upgradeFunction" optional="true">Function that performs upgrading actions.</param>
	                var self = this;
	                fakeAutoComplete(function () {
	                    upgradeFunction(db._createTransaction(READWRITE, Object.keys(self._cfg.dbschema), self._cfg.dbschema));// BUGBUG: No code completion for prev version's tables wont appear.
	                });
	                this._cfg.contentUpgrade = upgradeFunction;
	                return this;
	            },
	            _parseStoresSpec: function (stores, outSchema) {
	                Object.keys(stores).forEach(function (tableName) {
	                    if (stores[tableName] !== null) {
	                        var instanceTemplate = {};
	                        var indexes = parseIndexSyntax(stores[tableName]);
	                        var primKey = indexes.shift();
	                        if (primKey.multi) throw new Error("Primary key cannot be multi-valued");
	                        if (primKey.keyPath) setByKeyPath(instanceTemplate, primKey.keyPath, primKey.auto ? 0 : primKey.keyPath);
	                        indexes.forEach(function (idx) {
	                            if (idx.auto) throw new Error("Only primary key can be marked as autoIncrement (++)");
	                            if (!idx.keyPath) throw new Error("Index must have a name and cannot be an empty string");
	                            setByKeyPath(instanceTemplate, idx.keyPath, idx.compound ? idx.keyPath.map(function () { return ""; }) : "");
	                        });
	                        outSchema[tableName] = new TableSchema(tableName, primKey, indexes, instanceTemplate);
	                    }
	                });
	            }
	        });
	
	        function runUpgraders(oldVersion, idbtrans, reject, openReq) {
	            if (oldVersion === 0) {
	                //globalSchema = versions[versions.length - 1]._cfg.dbschema;
	                // Create tables:
	                Object.keys(globalSchema).forEach(function (tableName) {
	                    createTable(idbtrans, tableName, globalSchema[tableName].primKey, globalSchema[tableName].indexes);
	                });
	                // Populate data
	                var t = db._createTransaction(READWRITE, dbStoreNames, globalSchema);
	                t.idbtrans = idbtrans;
	                t.idbtrans.onerror = eventRejectHandler(reject, ["populating database"]);
	                t.on('error').subscribe(reject);
	                Promise.newPSD(function () {
	                    Promise.PSD.trans = t;
	                    try {
	                        db.on("populate").fire(t);
	                    } catch (err) {
	                        openReq.onerror = idbtrans.onerror = function (ev) { ev.preventDefault(); };  // Prohibit AbortError fire on db.on("error") in Firefox.
	                        try { idbtrans.abort(); } catch (e) { }
	                        idbtrans.db.close();
	                        reject(err);
	                    }
	                });
	            } else {
	                // Upgrade version to version, step-by-step from oldest to newest version.
	                // Each transaction object will contain the table set that was current in that version (but also not-yet-deleted tables from its previous version)
	                var queue = [];
	                var oldVersionStruct = versions.filter(function (version) { return version._cfg.version === oldVersion; })[0];
	                if (!oldVersionStruct) throw new Error("Dexie specification of currently installed DB version is missing");
	                globalSchema = db._dbSchema = oldVersionStruct._cfg.dbschema;
	                var anyContentUpgraderHasRun = false;
	
	                var versToRun = versions.filter(function (v) { return v._cfg.version > oldVersion; });
	                versToRun.forEach(function (version) {
	                    /// <param name="version" type="Version"></param>
	                    var oldSchema = globalSchema;
	                    var newSchema = version._cfg.dbschema;
	                    adjustToExistingIndexNames(oldSchema, idbtrans);
	                    adjustToExistingIndexNames(newSchema, idbtrans);
	                    globalSchema = db._dbSchema = newSchema;
	                    {
	                        var diff = getSchemaDiff(oldSchema, newSchema);
	                        diff.add.forEach(function (tuple) {
	                            queue.push(function (idbtrans, cb) {
	                                createTable(idbtrans, tuple[0], tuple[1].primKey, tuple[1].indexes);
	                                cb();
	                            });
	                        });
	                        diff.change.forEach(function (change) {
	                            if (change.recreate) {
	                                throw new Error("Not yet support for changing primary key");
	                            } else {
	                                queue.push(function (idbtrans, cb) {
	                                    var store = idbtrans.objectStore(change.name);
	                                    change.add.forEach(function (idx) {
	                                        addIndex(store, idx);
	                                    });
	                                    change.change.forEach(function (idx) {
	                                        store.deleteIndex(idx.name);
	                                        addIndex(store, idx);
	                                    });
	                                    change.del.forEach(function (idxName) {
	                                        store.deleteIndex(idxName);
	                                    });
	                                    cb();
	                                });
	                            }
	                        });
	                        if (version._cfg.contentUpgrade) {
	                            queue.push(function (idbtrans, cb) {
	                                anyContentUpgraderHasRun = true;
	                                var t = db._createTransaction(READWRITE, [].slice.call(idbtrans.db.objectStoreNames, 0), newSchema);
	                                t.idbtrans = idbtrans;
	                                var uncompletedRequests = 0;
	                                t._promise = override(t._promise, function (orig_promise) {
	                                    return function (mode, fn, writeLock) {
	                                        ++uncompletedRequests;
	                                        function proxy(fn) {
	                                            return function () {
	                                                fn.apply(this, arguments);
	                                                if (--uncompletedRequests === 0) cb(); // A called db operation has completed without starting a new operation. The flow is finished, now run next upgrader.
	                                            }
	                                        }
	                                        return orig_promise.call(this, mode, function (resolve, reject, trans) {
	                                            arguments[0] = proxy(resolve);
	                                            arguments[1] = proxy(reject);
	                                            fn.apply(this, arguments);
	                                        }, writeLock);
	                                    };
	                                });
	                                idbtrans.onerror = eventRejectHandler(reject, ["running upgrader function for version", version._cfg.version]);
	                                t.on('error').subscribe(reject);
	                                version._cfg.contentUpgrade(t);
	                                if (uncompletedRequests === 0) cb(); // contentUpgrade() didnt call any db operations at all.
	                            });
	                        }
	                        if (!anyContentUpgraderHasRun || !hasIEDeleteObjectStoreBug()) { // Dont delete old tables if ieBug is present and a content upgrader has run. Let tables be left in DB so far. This needs to be taken care of.
	                            queue.push(function (idbtrans, cb) {
	                                // Delete old tables
	                                deleteRemovedTables(newSchema, idbtrans);
	                                cb();
	                            });
	                        }
	                    }
	                });
	
	                // Now, create a queue execution engine
	                var runNextQueuedFunction = function () {
	                    try {
	                        if (queue.length)
	                            queue.shift()(idbtrans, runNextQueuedFunction);
	                        else
	                            createMissingTables(globalSchema, idbtrans); // At last, make sure to create any missing tables. (Needed by addons that add stores to DB without specifying version)
	                    } catch (err) {
	                        openReq.onerror = idbtrans.onerror = function (ev) { ev.preventDefault(); };  // Prohibit AbortError fire on db.on("error") in Firefox.
	                        try { idbtrans.abort(); } catch(e) {}
	                        idbtrans.db.close();
	                        reject(err);
	                    }
	                };
	                runNextQueuedFunction();
	            }
	        }
	
	        function getSchemaDiff(oldSchema, newSchema) {
	            var diff = {
	                del: [], // Array of table names
	                add: [], // Array of [tableName, newDefinition]
	                change: [] // Array of {name: tableName, recreate: newDefinition, del: delIndexNames, add: newIndexDefs, change: changedIndexDefs}
	            };
	            for (var table in oldSchema) {
	                if (!newSchema[table]) diff.del.push(table);
	            }
	            for (var table in newSchema) {
	                var oldDef = oldSchema[table],
	                    newDef = newSchema[table];
	                if (!oldDef) diff.add.push([table, newDef]);
	                else {
	                    var change = {
	                        name: table,
	                        def: newSchema[table],
	                        recreate: false,
	                        del: [],
	                        add: [],
	                        change: []
	                    };
	                    if (oldDef.primKey.src !== newDef.primKey.src) {
	                        // Primary key has changed. Remove and re-add table.
	                        change.recreate = true;
	                        diff.change.push(change);
	                    } else {
	                        var oldIndexes = oldDef.indexes.reduce(function (prev, current) { prev[current.name] = current; return prev; }, {});
	                        var newIndexes = newDef.indexes.reduce(function (prev, current) { prev[current.name] = current; return prev; }, {});
	                        for (var idxName in oldIndexes) {
	                            if (!newIndexes[idxName]) change.del.push(idxName);
	                        }
	                        for (var idxName in newIndexes) {
	                            var oldIdx = oldIndexes[idxName],
	                                newIdx = newIndexes[idxName];
	                            if (!oldIdx) change.add.push(newIdx);
	                            else if (oldIdx.src !== newIdx.src) change.change.push(newIdx);
	                        }
	                        if (change.recreate || change.del.length > 0 || change.add.length > 0 || change.change.length > 0) {
	                            diff.change.push(change);
	                        }
	                    }
	                }
	            }
	            return diff;
	        }
	
	        function createTable(idbtrans, tableName, primKey, indexes) {
	            /// <param name="idbtrans" type="IDBTransaction"></param>
	            var store = idbtrans.db.createObjectStore(tableName, primKey.keyPath ? { keyPath: primKey.keyPath, autoIncrement: primKey.auto } : { autoIncrement: primKey.auto });
	            indexes.forEach(function (idx) { addIndex(store, idx); });
	            return store;
	        }
	
	        function createMissingTables(newSchema, idbtrans) {
	            Object.keys(newSchema).forEach(function (tableName) {
	                if (!idbtrans.db.objectStoreNames.contains(tableName)) {
	                    createTable(idbtrans, tableName, newSchema[tableName].primKey, newSchema[tableName].indexes);
	                }
	            });
	        }
	
	        function deleteRemovedTables(newSchema, idbtrans) {
	            for (var i = 0; i < idbtrans.db.objectStoreNames.length; ++i) {
	                var storeName = idbtrans.db.objectStoreNames[i];
	                if (newSchema[storeName] === null || newSchema[storeName] === undefined) {
	                    idbtrans.db.deleteObjectStore(storeName);
	                }
	            }
	        }
	
	        function addIndex(store, idx) {
	            store.createIndex(idx.name, idx.keyPath, { unique: idx.unique, multiEntry: idx.multi });
	        }
	
	        //
	        //
	        //      Dexie Protected API
	        //
	        //
	
	        this._allTables = allTables;
	
	        this._tableFactory = function createTable(mode, tableSchema, transactionPromiseFactory) {
	            /// <param name="tableSchema" type="TableSchema"></param>
	            if (mode === READONLY)
	                return new Table(tableSchema.name, transactionPromiseFactory, tableSchema, Collection);
	            else
	                return new WriteableTable(tableSchema.name, transactionPromiseFactory, tableSchema);
	        }; 
	
	        this._createTransaction = function (mode, storeNames, dbschema, parentTransaction) {
	            return new Transaction(mode, storeNames, dbschema, parentTransaction);
	        }; 
	
	        function tableNotInTransaction(mode, storeNames) {
	            throw new Error("Table " + storeNames[0] + " not part of transaction. Original Scope Function Source: " + Dexie.Promise.PSD.trans.scopeFunc.toString());
	        }
	
	        this._transPromiseFactory = function transactionPromiseFactory(mode, storeNames, fn) { // Last argument is "writeLocked". But this doesnt apply to oneshot direct db operations, so we ignore it.
	            if (db_is_blocked && (!Promise.PSD || !Promise.PSD.letThrough)) {
	                // Database is paused. Wait til resumed.
	                var blockedPromise = new Promise(function (resolve, reject) {
	                    pausedResumeables.push({
	                        resume: function () {
	                            var p = db._transPromiseFactory(mode, storeNames, fn);
	                            blockedPromise.onuncatched = p.onuncatched;
	                            p.then(resolve, reject);
	                        }
	                    });
	                });
	                return blockedPromise;
	            } else {
	                var trans = db._createTransaction(mode, storeNames, globalSchema);
	                return trans._promise(mode, function (resolve, reject) {
	                    // An uncatched operation will bubble to this anonymous transaction. Make sure
	                    // to continue bubbling it up to db.on('error'):
	                    trans.error(function (err) {
	                        db.on('error').fire(err);
	                    });
	                    fn(function (value) {
	                        // Instead of resolving value directly, wait with resolving it until transaction has completed.
	                        // Otherwise the data would not be in the DB if requesting it in the then() operation.
	                        // Specifically, to ensure that the following expression will work:
	                        //
	                        //   db.friends.put({name: "Arne"}).then(function () {
	                        //       db.friends.where("name").equals("Arne").count(function(count) {
	                        //           assert (count === 1);
	                        //       });
	                        //   });
	                        //
	                        trans.complete(function () {
	                            resolve(value);
	                        });
	                    }, reject, trans);
	                });
	            }
	        }; 
	
	        this._whenReady = function (fn) {
	            if (!fake && db_is_blocked && (!Promise.PSD || !Promise.PSD.letThrough)) {
	                return new Promise(function (resolve, reject) {
	                    pausedResumeables.push({
	                        resume: function () {
	                            fn(resolve, reject);
	                        }
	                    });
	                });
	            }
	            return new Promise(fn);
	        }; 
	
	        //
	        //
	        //
	        //
	        //      Dexie API
	        //
	        //
	        //
	
	        this.verno = 0;
	
	        this.open = function () {
	            return new Promise(function (resolve, reject) {
	                if (fake) resolve(db);
	                if (idbdb || isBeingOpened) throw new Error("Database already opened or being opened");
	                var req, dbWasCreated = false;
	                function openError(err) {
	                    try { req.transaction.abort(); } catch (e) { }
	                    /*if (dbWasCreated) {
	                        // Workaround for issue with some browsers. Seem not to be needed though.
	                        // Unit test "Issue#100 - not all indexes are created" works without it on chrome,FF,opera and IE.
	                        idbdb.close();
	                        indexedDB.deleteDatabase(db.name); 
	                    }*/
	                    isBeingOpened = false;
	                    dbOpenError = err;
	                    db_is_blocked = false;
	                    reject(dbOpenError);
	                    pausedResumeables.forEach(function (resumable) {
	                        // Resume all stalled operations. They will fail once they wake up.
	                        resumable.resume();
	                    });
	                    pausedResumeables = [];
	                }
	                try {
	                    dbOpenError = null;
	                    isBeingOpened = true;
	
	                    // Make sure caller has specified at least one version
	                    if (versions.length > 0) autoSchema = false;
	
	                    // Multiply db.verno with 10 will be needed to workaround upgrading bug in IE: 
	                    // IE fails when deleting objectStore after reading from it.
	                    // A future version of Dexie.js will stopover an intermediate version to workaround this.
	                    // At that point, we want to be backward compatible. Could have been multiplied with 2, but by using 10, it is easier to map the number to the real version number.
	                    if (!indexedDB) throw new Error("indexedDB API not found. If using IE10+, make sure to run your code on a server URL (not locally). If using Safari, make sure to include indexedDB polyfill.");
	                    req = autoSchema ? indexedDB.open(dbName) : indexedDB.open(dbName, Math.round(db.verno * 10));
	                    if (!req) throw new Error("IndexedDB API not available"); // May happen in Safari private mode, see https://github.com/dfahlander/Dexie.js/issues/134 
	                    req.onerror = eventRejectHandler(openError, ["opening database", dbName]);
	                    req.onblocked = function (ev) {
	                        db.on("blocked").fire(ev);
	                    }; 
	                    req.onupgradeneeded = trycatch (function (e) {
	                        if (autoSchema && !db._allowEmptyDB) { // Unless an addon has specified db._allowEmptyDB, lets make the call fail.
	                            // Caller did not specify a version or schema. Doing that is only acceptable for opening alread existing databases.
	                            // If onupgradeneeded is called it means database did not exist. Reject the open() promise and make sure that we 
	                            // do not create a new database by accident here.
	                            req.onerror = function (event) { event.preventDefault(); }; // Prohibit onabort error from firing before we're done!
	                            req.transaction.abort(); // Abort transaction (would hope that this would make DB disappear but it doesnt.)
	                            // Close database and delete it.
	                            req.result.close();
	                            var delreq = indexedDB.deleteDatabase(dbName); // The upgrade transaction is atomic, and javascript is single threaded - meaning that there is no risk that we delete someone elses database here!
	                            delreq.onsuccess = delreq.onerror = function () {
	                                openError(new Error("Database '" + dbName + "' doesnt exist"));
	                            }; 
	                        } else {
	                            if (e.oldVersion === 0) dbWasCreated = true;
	                            req.transaction.onerror = eventRejectHandler(openError);
	                            var oldVer = e.oldVersion > Math.pow(2, 62) ? 0 : e.oldVersion; // Safari 8 fix.
	                            runUpgraders(oldVer / 10, req.transaction, openError, req);
	                        }
	                    }, openError);
	                    req.onsuccess = trycatch(function (e) {
	                        isBeingOpened = false;
	                        idbdb = req.result;
	                        if (autoSchema) readGlobalSchema();
	                        else if (idbdb.objectStoreNames.length > 0)
	                            adjustToExistingIndexNames(globalSchema, idbdb.transaction(safariMultiStoreFix(idbdb.objectStoreNames), READONLY));
	                        idbdb.onversionchange = db.on("versionchange").fire; // Not firing it here, just setting the function callback to any registered subscriber.
	                        if (!hasNativeGetDatabaseNames) {
	                            // Update localStorage with list of database names
	                            globalDatabaseList(function (databaseNames) {
	                                if (databaseNames.indexOf(dbName) === -1) return databaseNames.push(dbName);
	                            });
	                        }
	                        // Now, let any subscribers to the on("ready") fire BEFORE any other db operations resume!
	                        // If an the on("ready") subscriber returns a Promise, we will wait til promise completes or rejects before 
	                        Promise.newPSD(function () {
	                            Promise.PSD.letThrough = true; // Set a Promise-Specific Data property informing that onready is firing. This will make db._whenReady() let the subscribers use the DB but block all others (!). Quite cool ha?
	                            try {
	                                var res = db.on.ready.fire();
	                                if (res && typeof res.then === 'function') {
	                                    // If on('ready') returns a promise, wait for it to complete and then resume any pending operations.
	                                    res.then(resume, function (err) {
	                                        idbdb.close();
	                                        idbdb = null;
	                                        openError(err);
	                                    });
	                                } else {
	                                    asap(resume); // Cannot call resume directly because then the pauseResumables would inherit from our PSD scope.
	                                }
	                            } catch (e) {
	                                openError(e);
	                            }
	
	                            function resume() {
	                                db_is_blocked = false;
	                                pausedResumeables.forEach(function (resumable) {
	                                    // If anyone has made operations on a table instance before the db was opened, the operations will start executing now.
	                                    resumable.resume();
	                                });
	                                pausedResumeables = [];
	                                resolve(db);
	                            }
	                        });
	                    }, openError);
	                } catch (err) {
	                    openError(err);
	                }
	            });
	        }; 
	
	        this.close = function () {
	            if (idbdb) {
	                idbdb.close();
	                idbdb = null;
	                db_is_blocked = true;
	                dbOpenError = null;
	            }
	        }; 
	
	        this.delete = function () {
	            var args = arguments;
	            return new Promise(function (resolve, reject) {
	                if (args.length > 0) throw new Error("Arguments not allowed in db.delete()");
	                function doDelete() {
	                    db.close();
	                    var req = indexedDB.deleteDatabase(dbName);
	                    req.onsuccess = function () {
	                        if (!hasNativeGetDatabaseNames) {
	                            globalDatabaseList(function(databaseNames) {
	                                var pos = databaseNames.indexOf(dbName);
	                                if (pos >= 0) return databaseNames.splice(pos, 1);
	                            });
	                        }
	                        resolve();
	                    };
	                    req.onerror = eventRejectHandler(reject, ["deleting", dbName]);
	                    req.onblocked = function() {
	                        db.on("blocked").fire();
	                    };
	                }
	                if (isBeingOpened) {
	                    pausedResumeables.push({ resume: doDelete });
	                } else {
	                    doDelete();
	                }
	            });
	        }; 
	
	        this.backendDB = function () {
	            return idbdb;
	        }; 
	
	        this.isOpen = function () {
	            return idbdb !== null;
	        }; 
	        this.hasFailed = function () {
	            return dbOpenError !== null;
	        };
	        this.dynamicallyOpened = function() {
	            return autoSchema;
	        }
	
	        /*this.dbg = function (collection, counter) {
	            if (!this._dbgResult || !this._dbgResult[counter]) {
	                if (typeof collection === 'string') collection = this.table(collection).toCollection().limit(100);
	                if (!this._dbgResult) this._dbgResult = [];
	                var db = this;
	                new Promise(function () {
	                    Promise.PSD.letThrough = true;
	                    db._dbgResult[counter] = collection.toArray();
	                });
	            }
	            return this._dbgResult[counter]._value;
	        }*/
	
	        //
	        // Properties
	        //
	        this.name = dbName;
	
	        // db.tables - an array of all Table instances.
	        // TODO: Change so that tables is a simple member and make sure to update it whenever allTables changes.
	        Object.defineProperty(this, "tables", {
	            get: function () {
	                /// <returns type="Array" elementType="WriteableTable" />
	                return Object.keys(allTables).map(function (name) { return allTables[name]; });
	            }
	        });
	
	        //
	        // Events
	        //
	        this.on = events(this, "error", "populate", "blocked", { "ready": [promisableChain, nop], "versionchange": [reverseStoppableEventChain, nop] });
	
	        // Handle on('ready') specifically: If DB is already open, trigger the event immediately. Also, default to unsubscribe immediately after being triggered.
	        this.on.ready.subscribe = override(this.on.ready.subscribe, function (origSubscribe) {
	            return function (subscriber, bSticky) {
	                function proxy () {
	                    if (!bSticky) db.on.ready.unsubscribe(proxy);
	                    return subscriber.apply(this, arguments);
	                }
	                origSubscribe.call(this, proxy);
	                if (db.isOpen()) {
	                    if (db_is_blocked) {
	                        pausedResumeables.push({ resume: proxy });
	                    } else {
	                        proxy();
	                    }
	                }
	            };
	        });
	
	        fakeAutoComplete(function () {
	            db.on("populate").fire(db._createTransaction(READWRITE, dbStoreNames, globalSchema));
	            db.on("error").fire(new Error());
	        });
	
	        this.transaction = function (mode, tableInstances, scopeFunc) {
	            /// <summary>
	            /// 
	            /// </summary>
	            /// <param name="mode" type="String">"r" for readonly, or "rw" for readwrite</param>
	            /// <param name="tableInstances">Table instance, Array of Table instances, String or String Array of object stores to include in the transaction</param>
	            /// <param name="scopeFunc" type="Function">Function to execute with transaction</param>
	
	            // Let table arguments be all arguments between mode and last argument.
	            tableInstances = [].slice.call(arguments, 1, arguments.length - 1);
	            // Let scopeFunc be the last argument
	            scopeFunc = arguments[arguments.length - 1];
	            var parentTransaction = Promise.PSD && Promise.PSD.trans;
				// Check if parent transactions is bound to this db instance, and if caller wants to reuse it
	            if (!parentTransaction || parentTransaction.db !== db || mode.indexOf('!') !== -1) parentTransaction = null;
	            var onlyIfCompatible = mode.indexOf('?') !== -1;
	            mode = mode.replace('!', '').replace('?', '');
	            //
	            // Get storeNames from arguments. Either through given table instances, or through given table names.
	            //
	            var tables = Array.isArray(tableInstances[0]) ? tableInstances.reduce(function (a, b) { return a.concat(b); }) : tableInstances;
	            var error = null;
	            var storeNames = tables.map(function (tableInstance) {
	                if (typeof tableInstance === "string") {
	                    return tableInstance;
	                } else {
	                    if (!(tableInstance instanceof Table)) error = error || new TypeError("Invalid type. Arguments following mode must be instances of Table or String");
	                    return tableInstance.name;
	                }
	            });
	
	            //
	            // Resolve mode. Allow shortcuts "r" and "rw".
	            //
	            if (mode == "r" || mode == READONLY)
	                mode = READONLY;
	            else if (mode == "rw" || mode == READWRITE)
	                mode = READWRITE;
	            else
	                error = new Error("Invalid transaction mode: " + mode);
	
	            if (parentTransaction) {
	                // Basic checks
	                if (!error) {
	                    if (parentTransaction && parentTransaction.mode === READONLY && mode === READWRITE) {
	                        if (onlyIfCompatible) parentTransaction = null; // Spawn new transaction instead.
	                        else error = error || new Error("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
	                    }
	                    if (parentTransaction) {
	                        storeNames.forEach(function (storeName) {
	                            if (!parentTransaction.tables.hasOwnProperty(storeName)) {
	                                if (onlyIfCompatible) parentTransaction = null; // Spawn new transaction instead.
	                                else error = error || new Error("Table " + storeName + " not included in parent transaction. Parent Transaction function: " + parentTransaction.scopeFunc.toString());
	                            }
	                        });
	                    }
	                }
	            }
	            if (parentTransaction) {
	                // If this is a sub-transaction, lock the parent and then launch the sub-transaction.
	                return parentTransaction._promise(mode, enterTransactionScope, "lock");
	            } else {
	                // If this is a root-level transaction, wait til database is ready and then launch the transaction.
	                return db._whenReady(enterTransactionScope);
	            }
	            
	            function enterTransactionScope(resolve, reject) {
	                // Our transaction. To be set later.
	                var trans = null;
	
	                try {
	                    // Throw any error if any of the above checks failed.
	                    // Real error defined some lines up. We throw it here from within a Promise to reject Promise
	                    // rather than make caller need to both use try..catch and promise catching. The reason we still
	                    // throw here rather than do Promise.reject(error) is that we like to have the stack attached to the
	                    // error. Also because there is a catch() clause bound to this try() that will bubble the error
	                    // to the parent transaction.
	                    if (error) throw error;
	
	                    //
	                    // Create Transaction instance
	                    //
	                    trans = db._createTransaction(mode, storeNames, globalSchema, parentTransaction);
	
	                    // Provide arguments to the scope function (for backward compatibility)
	                    var tableArgs = storeNames.map(function (name) { return trans.tables[name]; });
	                    tableArgs.push(trans);
	
	                    // If transaction completes, resolve the Promise with the return value of scopeFunc.
	                    var returnValue;
	                    var uncompletedRequests = 0;
	
	                    // Create a new PSD frame to hold Promise.PSD.trans. Must not be bound to the current PSD frame since we want
	                    // it to pop before then() callback is called of our returned Promise.
	                    Promise.newPSD(function () {
	                        // Let the transaction instance be part of a Promise-specific data (PSD) value.
	                        Promise.PSD.trans = trans;
	                        trans.scopeFunc = scopeFunc; // For Error ("Table " + storeNames[0] + " not part of transaction") when it happens. This may help localizing the code that started a transaction used on another place.
	
	                        if (parentTransaction) {
	                            // Emulate transaction commit awareness for inner transaction (must 'commit' when the inner transaction has no more operations ongoing)
	                            trans.idbtrans = parentTransaction.idbtrans;
	                            trans._promise = override(trans._promise, function (orig) {
	                                return function (mode, fn, writeLock) {
	                                    ++uncompletedRequests;
	                                    function proxy(fn2) {
	                                        return function (val) {
	                                            var retval;
	                                            // _rootExec needed so that we do not loose any IDBTransaction in a setTimeout() call.
	                                            Promise._rootExec(function () {
	                                                retval = fn2(val);
	                                                // _tickFinalize makes sure to support lazy micro tasks executed in Promise._rootExec().
	                                                // We certainly do not want to copy the bad pattern from IndexedDB but instead allow
	                                                // execution of Promise.then() callbacks until the're all done.
	                                                Promise._tickFinalize(function () {
	                                                    if (--uncompletedRequests === 0 && trans.active) {
	                                                        trans.active = false;
	                                                        trans.on.complete.fire(); // A called db operation has completed without starting a new operation. The flow is finished
	                                                    }
	                                                });
	                                            });
	                                            return retval;
	                                        }
	                                    }
	                                    return orig.call(this, mode, function (resolve2, reject2, trans) {
	                                        return fn(proxy(resolve2), proxy(reject2), trans);
	                                    }, writeLock);
	                                };
	                            });
	                        }
	                        trans.complete(function () {
	                            resolve(returnValue);
	                        });
	                        // If transaction fails, reject the Promise and bubble to db if noone catched this rejection.
	                        trans.error(function (e) {
	                            if (trans.idbtrans) trans.idbtrans.onerror = preventDefault; // Prohibit AbortError from firing.
	                            try {trans.abort();} catch(e2){}
	                            if (parentTransaction) {
	                                parentTransaction.active = false;
	                                parentTransaction.on.error.fire(e); // Bubble to parent transaction
	                            }
	                            var catched = reject(e);
	                            if (!parentTransaction && !catched) {
	                                db.on.error.fire(e);// If not catched, bubble error to db.on("error").
	                            }
	                        });
	
	                        // Finally, call the scope function with our table and transaction arguments.
	                        Promise._rootExec(function() {
	                            returnValue = scopeFunc.apply(trans, tableArgs); // NOTE: returnValue is used in trans.on.complete() not as a returnValue to this func.
	                        });
	                    });
	                    if (!trans.idbtrans || (parentTransaction && uncompletedRequests === 0)) {
	                        trans._nop(); // Make sure transaction is being used so that it will resolve.
	                    }
	                } catch (e) {
	                    // If exception occur, abort the transaction and reject Promise.
	                    if (trans && trans.idbtrans) trans.idbtrans.onerror = preventDefault; // Prohibit AbortError from firing.
	                    if (trans) trans.abort();
	                    if (parentTransaction) parentTransaction.on.error.fire(e);
	                    asap(function () {
	                        // Need to use asap(=setImmediate/setTimeout) before calling reject because we are in the Promise constructor and reject() will always return false if so.
	                        if (!reject(e)) db.on("error").fire(e); // If not catched, bubble exception to db.on("error");
	                    });
	                }
	            }
	        }; 
	
	        this.table = function (tableName) {
	            /// <returns type="WriteableTable"></returns>
	            if (fake && autoSchema) return new WriteableTable(tableName);
	            if (!allTables.hasOwnProperty(tableName)) { throw new Error("Table does not exist"); return { AN_UNKNOWN_TABLE_NAME_WAS_SPECIFIED: 1 }; }
	            return allTables[tableName];
	        };
	
	        //
	        //
	        //
	        // Table Class
	        //
	        //
	        //
	        function Table(name, transactionPromiseFactory, tableSchema, collClass) {
	            /// <param name="name" type="String"></param>
	            this.name = name;
	            this.schema = tableSchema;
	            this.hook = allTables[name] ? allTables[name].hook : events(null, {
	                "creating": [hookCreatingChain, nop],
	                "reading": [pureFunctionChain, mirror],
	                "updating": [hookUpdatingChain, nop],
	                "deleting": [nonStoppableEventChain, nop]
	            });
	            this._tpf = transactionPromiseFactory;
	            this._collClass = collClass || Collection;
	        }
	
	        extend(Table.prototype, function () {
	            function failReadonly() {
	                throw new Error("Current Transaction is READONLY");
	            }
	            return {
	                //
	                // Table Protected Methods
	                //
	
	                _trans: function getTransaction(mode, fn, writeLocked) {
	                    return this._tpf(mode, [this.name], fn, writeLocked);
	                },
	                _idbstore: function getIDBObjectStore(mode, fn, writeLocked) {
	                    if (fake) return new Promise(fn); // Simplify the work for Intellisense/Code completion.
	                    var self = this;
	                    return this._tpf(mode, [this.name], function (resolve, reject, trans) {
	                        fn(resolve, reject, trans.idbtrans.objectStore(self.name), trans);
	                    }, writeLocked);
	                },
	
	                //
	                // Table Public Methods
	                //
	                get: function (key, cb) {
	                    var self = this;
	                    return this._idbstore(READONLY, function (resolve, reject, idbstore) {
	                        fake && resolve(self.schema.instanceTemplate);
	                        var req = idbstore.get(key);
	                        req.onerror = eventRejectHandler(reject, ["getting", key, "from", self.name]);
	                        req.onsuccess = function () {
	                            resolve(self.hook.reading.fire(req.result));
	                        };
	                    }).then(cb);
	                },
	                where: function (indexName) {
	                    return new WhereClause(this, indexName);
	                },
	                count: function (cb) {
	                    return this.toCollection().count(cb);
	                },
	                offset: function (offset) {
	                    return this.toCollection().offset(offset);
	                },
	                limit: function (numRows) {
	                    return this.toCollection().limit(numRows);
	                },
	                reverse: function () {
	                    return this.toCollection().reverse();
	                },
	                filter: function (filterFunction) {
	                    return this.toCollection().and(filterFunction);
	                },
	                each: function (fn) {
	                    var self = this;
	                    fake && fn(self.schema.instanceTemplate);
	                    return this._idbstore(READONLY, function (resolve, reject, idbstore) {
	                        var req = idbstore.openCursor();
	                        req.onerror = eventRejectHandler(reject, ["calling", "Table.each()", "on", self.name]);
	                        iterate(req, null, fn, resolve, reject, self.hook.reading.fire);
	                    });
	                },
	                toArray: function (cb) {
	                    var self = this;
	                    return this._idbstore(READONLY, function (resolve, reject, idbstore) {
	                        fake && resolve([self.schema.instanceTemplate]);
	                        var a = [];
	                        var req = idbstore.openCursor();
	                        req.onerror = eventRejectHandler(reject, ["calling", "Table.toArray()", "on", self.name]);
	                        iterate(req, null, function (item) { a.push(item); }, function () { resolve(a); }, reject, self.hook.reading.fire);
	                    }).then(cb);
	                },
	                orderBy: function (index) {
	                    return new this._collClass(new WhereClause(this, index));
	                },
	
	                toCollection: function () {
	                    return new this._collClass(new WhereClause(this));
	                },
	
	                mapToClass: function (constructor, structure) {
	                    /// <summary>
	                    ///     Map table to a javascript constructor function. Objects returned from the database will be instances of this class, making
	                    ///     it possible to the instanceOf operator as well as extending the class using constructor.prototype.method = function(){...}.
	                    /// </summary>
	                    /// <param name="constructor">Constructor function representing the class.</param>
	                    /// <param name="structure" optional="true">Helps IDE code completion by knowing the members that objects contain and not just the indexes. Also
	                    /// know what type each member has. Example: {name: String, emailAddresses: [String], password}</param>
	                    this.schema.mappedClass = constructor;
	                    var instanceTemplate = Object.create(constructor.prototype);
	                    if (structure) {
	                        // structure and instanceTemplate is for IDE code competion only while constructor.prototype is for actual inheritance.
	                        applyStructure(instanceTemplate, structure);
	                    }
	                    this.schema.instanceTemplate = instanceTemplate;
	
	                    // Now, subscribe to the when("reading") event to make all objects that come out from this table inherit from given class
	                    // no matter which method to use for reading (Table.get() or Table.where(...)... )
	                    var readHook = function (obj) {
	                        if (!obj) return obj; // No valid object. (Value is null). Return as is.
	                        // Create a new object that derives from constructor:
	                        var res = Object.create(constructor.prototype);
	                        // Clone members:
	                        for (var m in obj) if (obj.hasOwnProperty(m)) res[m] = obj[m];
	                        return res;
	                    };
	
	                    if (this.schema.readHook) {
	                        this.hook.reading.unsubscribe(this.schema.readHook);
	                    }
	                    this.schema.readHook = readHook;
	                    this.hook("reading", readHook);
	                    return constructor;
	                },
	                defineClass: function (structure) {
	                    /// <summary>
	                    ///     Define all members of the class that represents the table. This will help code completion of when objects are read from the database
	                    ///     as well as making it possible to extend the prototype of the returned constructor function.
	                    /// </summary>
	                    /// <param name="structure">Helps IDE code completion by knowing the members that objects contain and not just the indexes. Also
	                    /// know what type each member has. Example: {name: String, emailAddresses: [String], properties: {shoeSize: Number}}</param>
	                    return this.mapToClass(Dexie.defineClass(structure), structure);
	                },
	                add: failReadonly,
	                put: failReadonly,
	                'delete': failReadonly,
	                clear: failReadonly,
	                update: failReadonly
	            };
	        });
	
	        //
	        //
	        //
	        // WriteableTable Class (extends Table)
	        //
	        //
	        //
	        function WriteableTable(name, transactionPromiseFactory, tableSchema, collClass) {
	            Table.call(this, name, transactionPromiseFactory, tableSchema, collClass || WriteableCollection);
	        }
	
	        derive(WriteableTable).from(Table).extend(function () {
	            return {
	                add: function (obj, key) {
	                    /// <summary>
	                    ///   Add an object to the database. In case an object with same primary key already exists, the object will not be added.
	                    /// </summary>
	                    /// <param name="obj" type="Object">A javascript object to insert</param>
	                    /// <param name="key" optional="true">Primary key</param>
	                    var self = this,
	                        creatingHook = this.hook.creating.fire;
	                    return this._idbstore(READWRITE, function (resolve, reject, idbstore, trans) {
	                        var thisCtx = {};
	                        if (creatingHook !== nop) {
	                            var effectiveKey = key || (idbstore.keyPath ? getByKeyPath(obj, idbstore.keyPath) : undefined);
	                            var keyToUse = creatingHook.call(thisCtx, effectiveKey, obj, trans); // Allow subscribers to when("creating") to generate the key.
	                            if (effectiveKey === undefined && keyToUse !== undefined) {
	                                if (idbstore.keyPath)
	                                    setByKeyPath(obj, idbstore.keyPath, keyToUse);
	                                else
	                                    key = keyToUse;
	                            }
	                        }
	                        //try {
	                            var req = key ? idbstore.add(obj, key) : idbstore.add(obj);
	                            req.onerror = eventRejectHandler(function (e) {
	                                if (thisCtx.onerror) thisCtx.onerror(e);
	                                return reject(e);
	                            }, ["adding", obj, "into", self.name]);
	                            req.onsuccess = function (ev) {
	                                var keyPath = idbstore.keyPath;
	                                if (keyPath) setByKeyPath(obj, keyPath, ev.target.result);
	                                if (thisCtx.onsuccess) thisCtx.onsuccess(ev.target.result);
	                                resolve(req.result);
	                            };
	                        /*} catch (e) {
	                            trans.on("error").fire(e);
	                            trans.abort();
	                            reject(e);
	                        }*/
	                    });
	                },
	
	                put: function (obj, key) {
	                    /// <summary>
	                    ///   Add an object to the database but in case an object with same primary key alread exists, the existing one will get updated.
	                    /// </summary>
	                    /// <param name="obj" type="Object">A javascript object to insert or update</param>
	                    /// <param name="key" optional="true">Primary key</param>
	                    var self = this,
	                        creatingHook = this.hook.creating.fire,
	                        updatingHook = this.hook.updating.fire;
	                    if (creatingHook !== nop || updatingHook !== nop) {
	                        //
	                        // People listens to when("creating") or when("updating") events!
	                        // We must know whether the put operation results in an CREATE or UPDATE.
	                        //
	                        return this._trans(READWRITE, function (resolve, reject, trans) {
	                            // Since key is optional, make sure we get it from obj if not provided
	                            var effectiveKey = key || (self.schema.primKey.keyPath && getByKeyPath(obj, self.schema.primKey.keyPath));
	                            if (effectiveKey === undefined) {
	                                // No primary key. Must use add().
	                                trans.tables[self.name].add(obj).then(resolve, reject);
	                            } else {
	                                // Primary key exist. Lock transaction and try modifying existing. If nothing modified, call add().
	                                trans._lock(); // Needed because operation is splitted into modify() and add().
	                                // clone obj before this async call. If caller modifies obj the line after put(), the IDB spec requires that it should not affect operation.
	                                obj = deepClone(obj);
	                                trans.tables[self.name].where(":id").equals(effectiveKey).modify(function (value) {
	                                    // Replace extisting value with our object
	                                    // CRUD event firing handled in WriteableCollection.modify()
	                                    this.value = obj;
	                                }).then(function (count) {
	                                    if (count === 0) {
	                                        // Object's key was not found. Add the object instead.
	                                        // CRUD event firing will be done in add()
	                                        return trans.tables[self.name].add(obj, key); // Resolving with another Promise. Returned Promise will then resolve with the new key.
	                                    } else {
	                                        return effectiveKey; // Resolve with the provided key.
	                                    }
	                                }).finally(function () {
	                                    trans._unlock();
	                                }).then(resolve, reject);
	                            }
	                        });
	                    } else {
	                        // Use the standard IDB put() method.
	                        return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
	                            var req = key ? idbstore.put(obj, key) : idbstore.put(obj);
	                            req.onerror = eventRejectHandler(reject, ["putting", obj, "into", self.name]);
	                            req.onsuccess = function (ev) {
	                                var keyPath = idbstore.keyPath;
	                                if (keyPath) setByKeyPath(obj, keyPath, ev.target.result);
	                                resolve(req.result);
	                            };
	                        });
	                    }
	                },
	
	                'delete': function (key) {
	                    /// <param name="key">Primary key of the object to delete</param>
	                    if (this.hook.deleting.subscribers.length) {
	                        // People listens to when("deleting") event. Must implement delete using WriteableCollection.delete() that will
	                        // call the CRUD event. Only WriteableCollection.delete() will know whether an object was actually deleted.
	                        return this.where(":id").equals(key).delete();
	                    } else {
	                        // No one listens. Use standard IDB delete() method.
	                        return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
	                            var req = idbstore.delete(key);
	                            req.onerror = eventRejectHandler(reject, ["deleting", key, "from", idbstore.name]);
	                            req.onsuccess = function (ev) {
	                                resolve(req.result);
	                            };
	                        });
	                    }
	                },
	
	                clear: function () {
	                    if (this.hook.deleting.subscribers.length) {
	                        // People listens to when("deleting") event. Must implement delete using WriteableCollection.delete() that will
	                        // call the CRUD event. Only WriteableCollection.delete() will knows which objects that are actually deleted.
	                        return this.toCollection().delete();
	                    } else {
	                        return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
	                            var req = idbstore.clear();
	                            req.onerror = eventRejectHandler(reject, ["clearing", idbstore.name]);
	                            req.onsuccess = function (ev) {
	                                resolve(req.result);
	                            };
	                        });
	                    }
	                },
	
	                update: function (keyOrObject, modifications) {
	                    if (typeof modifications !== 'object' || Array.isArray(modifications)) throw new Error("db.update(keyOrObject, modifications). modifications must be an object.");
	                    if (typeof keyOrObject === 'object' && !Array.isArray(keyOrObject)) {
	                        // object to modify. Also modify given object with the modifications:
	                        Object.keys(modifications).forEach(function (keyPath) {
	                            setByKeyPath(keyOrObject, keyPath, modifications[keyPath]);
	                        });
	                        var key = getByKeyPath(keyOrObject, this.schema.primKey.keyPath);
	                        if (key === undefined) Promise.reject(new Error("Object does not contain its primary key"));
	                        return this.where(":id").equals(key).modify(modifications);
	                    } else {
	                        // key to modify
	                        return this.where(":id").equals(keyOrObject).modify(modifications);
	                    }
	                },
	            };
	        });
	
	        //
	        //
	        //
	        // Transaction Class
	        //
	        //
	        //
	        function Transaction(mode, storeNames, dbschema, parent) {
	            /// <summary>
	            ///    Transaction class. Represents a database transaction. All operations on db goes through a Transaction.
	            /// </summary>
	            /// <param name="mode" type="String">Any of "readwrite" or "readonly"</param>
	            /// <param name="storeNames" type="Array">Array of table names to operate on</param>
	            var self = this;
	            this.db = db;
	            this.mode = mode;
	            this.storeNames = storeNames;
	            this.idbtrans = null;
	            this.on = events(this, ["complete", "error"], "abort");
	            this._reculock = 0;
	            this._blockedFuncs = [];
	            this._psd = null;
	            this.active = true;
	            this._dbschema = dbschema;
	            if (parent) this.parent = parent;
	            this._tpf = transactionPromiseFactory;
	            this.tables = Object.create(notInTransFallbackTables); // ...so that all non-included tables exists as instances (possible to call table.name for example) but will fail as soon as trying to execute a query on it.
	
	            function transactionPromiseFactory(mode, storeNames, fn, writeLocked) {
	                // Creates a Promise instance and calls fn (resolve, reject, trans) where trans is the instance of this transaction object.
	                // Support for write-locking the transaction during the promise life time from creation to success/failure.
	                // This is actually not needed when just using single operations on IDB, since IDB implements this internally.
	                // However, when implementing a write operation as a series of operations on top of IDB(collection.delete() and collection.modify() for example),
	                // lock is indeed needed if Dexie APIshould behave in a consistent manner for the API user.
	                // Another example of this is if we want to support create/update/delete events,
	                // we need to implement put() using a series of other IDB operations but still need to lock the transaction all the way.
	                return self._promise(mode, fn, writeLocked);
	            }
	
	            for (var i = storeNames.length - 1; i !== -1; --i) {
	                var name = storeNames[i];
	                var table = db._tableFactory(mode, dbschema[name], transactionPromiseFactory);
	                this.tables[name] = table;
	                if (!this[name]) this[name] = table;
	            }
	        }
	
	        extend(Transaction.prototype, {
	            //
	            // Transaction Protected Methods (not required by API users, but needed internally and eventually by dexie extensions)
	            //
	
	            _lock: function () {
	                // Temporary set all requests into a pending queue if they are called before database is ready.
	                ++this._reculock; // Recursive read/write lock pattern using PSD (Promise Specific Data) instead of TLS (Thread Local Storage)
	                if (this._reculock === 1 && Promise.PSD) Promise.PSD.lockOwnerFor = this;
	                return this;
	            },
	            _unlock: function () {
	                if (--this._reculock === 0) {
	                    if (Promise.PSD) Promise.PSD.lockOwnerFor = null;
	                    while (this._blockedFuncs.length > 0 && !this._locked()) {
	                        var fn = this._blockedFuncs.shift();
	                        try { fn(); } catch (e) { }
	                    }
	                }
	                return this;
	            },
	            _locked: function () {
	                // Checks if any write-lock is applied on this transaction.
	                // To simplify the Dexie API for extension implementations, we support recursive locks.
	                // This is accomplished by using "Promise Specific Data" (PSD).
	                // PSD data is bound to a Promise and any child Promise emitted through then() or resolve( new Promise() ).
	                // Promise.PSD is local to code executing on top of the call stacks of any of any code executed by Promise():
	                //         * callback given to the Promise() constructor  (function (resolve, reject){...})
	                //         * callbacks given to then()/catch()/finally() methods (function (value){...})
	                // If creating a new independant Promise instance from within a Promise call stack, the new Promise will derive the PSD from the call stack of the parent Promise.
	                // Derivation is done so that the inner PSD __proto__ points to the outer PSD.
	                // Promise.PSD.lockOwnerFor will point to current transaction object if the currently executing PSD scope owns the lock.
	                return this._reculock && (!Promise.PSD || Promise.PSD.lockOwnerFor !== this);
	            },
	            _nop: function (cb) {
	                // An asyncronic no-operation that may call given callback when done doing nothing. An alternative to asap() if we must not lose the transaction.
	                this.tables[this.storeNames[0]].get(0).then(cb);
	            },
	            _promise: function (mode, fn, bWriteLock) {
	                var self = this;
	                return Promise.newPSD(function() {
	                    var p;
	                    // Read lock always
	                    if (!self._locked()) {
	                        p = self.active ? new Promise(function (resolve, reject) {
	                            if (!self.idbtrans && mode) {
	                                if (!idbdb) throw dbOpenError ? new Error("Database not open. Following error in populate, ready or upgrade function made Dexie.open() fail: " + dbOpenError) : new Error("Database not open");
	                                var idbtrans = self.idbtrans = idbdb.transaction(safariMultiStoreFix(self.storeNames), self.mode);
	                                idbtrans.onerror = function (e) {
	                                    self.on("error").fire(e && e.target.error);
	                                    e.preventDefault(); // Prohibit default bubbling to window.error
	                                    self.abort(); // Make sure transaction is aborted since we preventDefault.
	                                }; 
	                                idbtrans.onabort = function (e) {
	                                    // Workaround for issue #78 - low disk space on chrome.
	                                    // onabort is called but never onerror. Call onerror explicitely.
	                                    // Do this in a future tick so we allow default onerror to execute before doing the fallback.
	                                    asap(function () { self.on('error').fire(new Error("Transaction aborted for unknown reason")); });
	
	                                    self.active = false;
	                                    self.on("abort").fire(e);
	                                };
	                                idbtrans.oncomplete = function (e) {
	                                    self.active = false;
	                                    self.on("complete").fire(e);
	                                }; 
	                            }
	                            if (bWriteLock) self._lock(); // Write lock if write operation is requested
	                            try {
	                                fn(resolve, reject, self);
	                            } catch (e) {
	                                // Direct exception happened when doin operation.
	                                // We must immediately fire the error and abort the transaction.
	                                // When this happens we are still constructing the Promise so we don't yet know
	                                // whether the caller is about to catch() the error or not. Have to make
	                                // transaction fail. Catching such an error wont stop transaction from failing.
	                                // This is a limitation we have to live with.
	                                Dexie.ignoreTransaction(function () { self.on('error').fire(e); });
	                                self.abort();
	                                reject(e);
	                            }
	                        }) : Promise.reject(stack(new Error("Transaction is inactive. Original Scope Function Source: " + self.scopeFunc.toString())));
	                        if (self.active && bWriteLock) p.finally(function () {
	                            self._unlock();
	                        });
	                    } else {
	                        // Transaction is write-locked. Wait for mutex.
	                        p = new Promise(function (resolve, reject) {
	                            self._blockedFuncs.push(function () {
	                                self._promise(mode, fn, bWriteLock).then(resolve, reject);
	                            });
	                        });
	                    }
	                    p.onuncatched = function (e) {
	                        // Bubble to transaction. Even though IDB does this internally, it would just do it for error events and not for caught exceptions.
	                        Dexie.ignoreTransaction(function () { self.on("error").fire(e); });
	                        self.abort();
	                    };
	                    return p;
	                });
	            },
	
	            //
	            // Transaction Public Methods
	            //
	
	            complete: function (cb) {
	                return this.on("complete", cb);
	            },
	            error: function (cb) {
	                return this.on("error", cb);
	            },
	            abort: function () {
	                if (this.idbtrans && this.active) try { // TODO: if !this.idbtrans, enqueue an abort() operation.
	                    this.active = false;
	                    this.idbtrans.abort();
	                    this.on.error.fire(new Error("Transaction Aborted"));
	                } catch (e) { }
	            },
	            table: function (name) {
	                if (!this.tables.hasOwnProperty(name)) { throw new Error("Table " + name + " not in transaction"); return { AN_UNKNOWN_TABLE_NAME_WAS_SPECIFIED: 1 }; }
	                return this.tables[name];
	            }
	        });
	
	        //
	        //
	        //
	        // WhereClause
	        //
	        //
	        //
	        function WhereClause(table, index, orCollection) {
	            /// <param name="table" type="Table"></param>
	            /// <param name="index" type="String" optional="true"></param>
	            /// <param name="orCollection" type="Collection" optional="true"></param>
	            this._ctx = {
	                table: table,
	                index: index === ":id" ? null : index,
	                collClass: table._collClass,
	                or: orCollection
	            }; 
	        }
	
	        extend(WhereClause.prototype, function () {
	
	            // WhereClause private methods
	
	            function fail(collection, err) {
	                try { throw err; } catch (e) {
	                    collection._ctx.error = e;
	                }
	                return collection;
	            }
	
	            function getSetArgs(args) {
	                return Array.prototype.slice.call(args.length === 1 && Array.isArray(args[0]) ? args[0] : args);
	            }
	
	            function upperFactory(dir) {
	                return dir === "next" ? function (s) { return s.toUpperCase(); } : function (s) { return s.toLowerCase(); };
	            }
	            function lowerFactory(dir) {
	                return dir === "next" ? function (s) { return s.toLowerCase(); } : function (s) { return s.toUpperCase(); };
	            }
	            function nextCasing(key, lowerKey, upperNeedle, lowerNeedle, cmp, dir) {
	                var length = Math.min(key.length, lowerNeedle.length);
	                var llp = -1;
	                for (var i = 0; i < length; ++i) {
	                    var lwrKeyChar = lowerKey[i];
	                    if (lwrKeyChar !== lowerNeedle[i]) {
	                        if (cmp(key[i], upperNeedle[i]) < 0) return key.substr(0, i) + upperNeedle[i] + upperNeedle.substr(i + 1);
	                        if (cmp(key[i], lowerNeedle[i]) < 0) return key.substr(0, i) + lowerNeedle[i] + upperNeedle.substr(i + 1);
	                        if (llp >= 0) return key.substr(0, llp) + lowerKey[llp] + upperNeedle.substr(llp + 1);
	                        return null;
	                    }
	                    if (cmp(key[i], lwrKeyChar) < 0) llp = i;
	                }
	                if (length < lowerNeedle.length && dir === "next") return key + upperNeedle.substr(key.length);
	                if (length < key.length && dir === "prev") return key.substr(0, upperNeedle.length);
	                return (llp < 0 ? null : key.substr(0, llp) + lowerNeedle[llp] + upperNeedle.substr(llp + 1));
	            }
	
	            function addIgnoreCaseAlgorithm(c, match, needle) {
	                /// <param name="needle" type="String"></param>
	                var upper, lower, compare, upperNeedle, lowerNeedle, direction;
	                function initDirection(dir) {
	                    upper = upperFactory(dir);
	                    lower = lowerFactory(dir);
	                    compare = (dir === "next" ? ascending : descending);
	                    upperNeedle = upper(needle);
	                    lowerNeedle = lower(needle);
	                    direction = dir;
	                }
	                initDirection("next");
	                c._ondirectionchange = function (direction) {
	                    // This event onlys occur before filter is called the first time.
	                    initDirection(direction);
	                };
	                c._addAlgorithm(function (cursor, advance, resolve) {
	                    /// <param name="cursor" type="IDBCursor"></param>
	                    /// <param name="advance" type="Function"></param>
	                    /// <param name="resolve" type="Function"></param>
	                    var key = cursor.key;
	                    if (typeof key !== 'string') return false;
	                    var lowerKey = lower(key);
	                    if (match(lowerKey, lowerNeedle)) {
	                        advance(function () { cursor.continue(); });
	                        return true;
	                    } else {
	                        var nextNeedle = nextCasing(key, lowerKey, upperNeedle, lowerNeedle, compare, direction);
	                        if (nextNeedle) {
	                            advance(function () { cursor.continue(nextNeedle); });
	                        } else {
	                            advance(resolve);
	                        }
	                        return false;
	                    }
	                });
	            }
	
	            //
	            // WhereClause public methods
	            //
	            return {
	                between: function (lower, upper, includeLower, includeUpper) {
	                    /// <summary>
	                    ///     Filter out records whose where-field lays between given lower and upper values. Applies to Strings, Numbers and Dates.
	                    /// </summary>
	                    /// <param name="lower"></param>
	                    /// <param name="upper"></param>
	                    /// <param name="includeLower" optional="true">Whether items that equals lower should be included. Default true.</param>
	                    /// <param name="includeUpper" optional="true">Whether items that equals upper should be included. Default false.</param>
	                    /// <returns type="Collection"></returns>
	                    includeLower = includeLower !== false;   // Default to true
	                    includeUpper = includeUpper === true;    // Default to false
	                    if ((lower > upper) ||
	                        (lower === upper && (includeLower || includeUpper) && !(includeLower && includeUpper)))
	                        return new this._ctx.collClass(this, function() { return IDBKeyRange.only(lower); }).limit(0); // Workaround for idiotic W3C Specification that DataError must be thrown if lower > upper. The natural result would be to return an empty collection.
	                    return new this._ctx.collClass(this, function() { return IDBKeyRange.bound(lower, upper, !includeLower, !includeUpper); });
	                },
	                equals: function (value) {
	                    return new this._ctx.collClass(this, function() { return IDBKeyRange.only(value); });
	                },
	                above: function (value) {
	                    return new this._ctx.collClass(this, function() { return IDBKeyRange.lowerBound(value, true); });
	                },
	                aboveOrEqual: function (value) {
	                    return new this._ctx.collClass(this, function() { return IDBKeyRange.lowerBound(value); });
	                },
	                below: function (value) {
	                    return new this._ctx.collClass(this, function() { return IDBKeyRange.upperBound(value, true); });
	                },
	                belowOrEqual: function (value) {
	                    return new this._ctx.collClass(this, function() { return IDBKeyRange.upperBound(value); });
	                },
	                startsWith: function (str) {
	                    /// <param name="str" type="String"></param>
	                    if (typeof str !== 'string') return fail(new this._ctx.collClass(this), new TypeError("String expected"));
	                    return this.between(str, str + String.fromCharCode(65535), true, true);
	                },
	                startsWithIgnoreCase: function (str) {
	                    /// <param name="str" type="String"></param>
	                    if (typeof str !== 'string') return fail(new this._ctx.collClass(this), new TypeError("String expected"));
	                    if (str === "") return this.startsWith(str);
	                    var c = new this._ctx.collClass(this, function() { return IDBKeyRange.bound(str.toUpperCase(), str.toLowerCase() + String.fromCharCode(65535)); });
	                    addIgnoreCaseAlgorithm(c, function (a, b) { return a.indexOf(b) === 0; }, str);
	                    c._ondirectionchange = function () { fail(c, new Error("reverse() not supported with WhereClause.startsWithIgnoreCase()")); };
	                    return c;
	                },
	                equalsIgnoreCase: function (str) {
	                    /// <param name="str" type="String"></param>
	                    if (typeof str !== 'string') return fail(new this._ctx.collClass(this), new TypeError("String expected"));
	                    var c = new this._ctx.collClass(this, function() { return IDBKeyRange.bound(str.toUpperCase(), str.toLowerCase()); });
	                    addIgnoreCaseAlgorithm(c, function (a, b) { return a === b; }, str);
	                    return c;
	                },
	                anyOf: function (valueArray) {
	                    var ctx = this._ctx,
	                        schema = ctx.table.schema;
	                    var idxSpec = ctx.index ? schema.idxByName[ctx.index] : schema.primKey;
	                    var isCompound = idxSpec && idxSpec.compound;
	                    var set = getSetArgs(arguments);
	                    var compare = isCompound ? compoundCompare(ascending) : ascending;
	                    set.sort(compare);
	                    if (set.length === 0) return new this._ctx.collClass(this, function() { return IDBKeyRange.only(""); }).limit(0); // Return an empty collection.
	                    var c = new this._ctx.collClass(this, function () { return IDBKeyRange.bound(set[0], set[set.length - 1]); });
	                    
	                    c._ondirectionchange = function (direction) {
	                        compare = (direction === "next" ? ascending : descending);
	                        if (isCompound) compare = compoundCompare(compare);
	                        set.sort(compare);
	                    };
	                    var i = 0;
	                    c._addAlgorithm(function (cursor, advance, resolve) {
	                        var key = cursor.key;
	                        while (compare(key, set[i]) > 0) {
	                            // The cursor has passed beyond this key. Check next.
	                            ++i;
	                            if (i === set.length) {
	                                // There is no next. Stop searching.
	                                advance(resolve);
	                                return false;
	                            }
	                        }
	                        if (compare(key, set[i]) === 0) {
	                            // The current cursor value should be included and we should continue a single step in case next item has the same key or possibly our next key in set.
	                            advance(function () { cursor.continue(); });
	                            return true;
	                        } else {
	                            // cursor.key not yet at set[i]. Forward cursor to the next key to hunt for.
	                            advance(function () { cursor.continue(set[i]); });
	                            return false;
	                        }
	                    });
	                    return c;
	                },
	
	                notEqual: function(value) {
	                    return this.below(value).or(this._ctx.index).above(value);
	                },
	
	                noneOf: function(valueArray) {
	                    var ctx = this._ctx,
	                        schema = ctx.table.schema;
	                    var idxSpec = ctx.index ? schema.idxByName[ctx.index] : schema.primKey;
	                    var isCompound = idxSpec && idxSpec.compound;
	                    var set = getSetArgs(arguments);
	                    if (set.length === 0) return new this._ctx.collClass(this); // Return entire collection.
	                    var compare = isCompound ? compoundCompare(ascending) : ascending;
	                    set.sort(compare);
	                    // Transform ["a","b","c"] to a set of ranges for between/above/below: [[null,"a"], ["a","b"], ["b","c"], ["c",null]]
	                    var ranges = set.reduce(function (res, val) { return res ? res.concat([[res[res.length - 1][1], val]]) : [[null, val]]; }, null);
	                    ranges.push([set[set.length - 1], null]);
	                    // Transform range-sets to a big or() expression between ranges:
	                    var thiz = this, index = ctx.index;
	                    return ranges.reduce(function(collection, range) {
	                        return collection ?
	                            range[1] === null ?
	                                collection.or(index).above(range[0]) :
	                                collection.or(index).between(range[0], range[1], false, false)
	                            : thiz.below(range[1]);
	                    }, null);
	                },
	
	                startsWithAnyOf: function (valueArray) {
	                    var ctx = this._ctx,
	                        set = getSetArgs(arguments);
	
	                    if (!set.every(function (s) { return typeof s === 'string'; })) {
	                        return fail(new ctx.collClass(this), new TypeError("startsWithAnyOf() only works with strings"));
	                    }
	                    if (set.length === 0) return new ctx.collClass(this, function () { return IDBKeyRange.only(""); }).limit(0); // Return an empty collection.
	
	                    var setEnds = set.map(function (s) { return s + String.fromCharCode(65535); });
	                    
	                    var sortDirection = ascending;
	                    set.sort(sortDirection);
	                    var i = 0;
	                    function keyIsBeyondCurrentEntry(key) { return key > setEnds[i]; }
	                    function keyIsBeforeCurrentEntry(key) { return key < set[i]; }
	                    var checkKey = keyIsBeyondCurrentEntry;
	
	                    var c = new ctx.collClass(this, function () {
	                        return IDBKeyRange.bound(set[0], set[set.length - 1] + String.fromCharCode(65535));
	                    });
	                    
	                    c._ondirectionchange = function (direction) {
	                        if (direction === "next") {
	                            checkKey = keyIsBeyondCurrentEntry;
	                            sortDirection = ascending;
	                        } else {
	                            checkKey = keyIsBeforeCurrentEntry;
	                            sortDirection = descending;
	                        }
	                        set.sort(sortDirection);
	                        setEnds.sort(sortDirection);
	                    };
	
	                    c._addAlgorithm(function (cursor, advance, resolve) {
	                        var key = cursor.key;
	                        while (checkKey(key)) {
	                            // The cursor has passed beyond this key. Check next.
	                            ++i;
	                            if (i === set.length) {
	                                // There is no next. Stop searching.
	                                advance(resolve);
	                                return false;
	                            }
	                        }
	                        if (key >= set[i] && key <= setEnds[i]) {
	                            // The current cursor value should be included and we should continue a single step in case next item has the same key or possibly our next key in set.
	                            advance(function () { cursor.continue(); });
	                            return true;
	                        } else {
	                            // cursor.key not yet at set[i]. Forward cursor to the next key to hunt for.
	                            advance(function() {
	                                if (sortDirection === ascending) cursor.continue(set[i]);
	                                else cursor.continue(setEnds[i]);
	                            });
	                            return false;
	                        }
	                    });
	                    return c;
	                }
	            };
	        });
	
	
	
	
	        //
	        //
	        //
	        // Collection Class
	        //
	        //
	        //
	        function Collection(whereClause, keyRangeGenerator) {
	            /// <summary>
	            /// 
	            /// </summary>
	            /// <param name="whereClause" type="WhereClause">Where clause instance</param>
	            /// <param name="keyRangeGenerator" value="function(){ return IDBKeyRange.bound(0,1);}" optional="true"></param>
	            var keyRange = null, error = null;
	            if (keyRangeGenerator) try {
	                keyRange = keyRangeGenerator();
	            } catch (ex) {
	                error = ex;
	            }
	
	            var whereCtx = whereClause._ctx;
	            this._ctx = {
	                table: whereCtx.table,
	                index: whereCtx.index,
	                isPrimKey: (!whereCtx.index || (whereCtx.table.schema.primKey.keyPath && whereCtx.index === whereCtx.table.schema.primKey.name)),
	                range: keyRange,
	                op: "openCursor",
	                dir: "next",
	                unique: "",
	                algorithm: null,
	                filter: null,
	                isMatch: null,
	                offset: 0,
	                limit: Infinity,
	                error: error, // If set, any promise must be rejected with this error
	                or: whereCtx.or
	            };
	        }
	
	        extend(Collection.prototype, function () {
	
	            //
	            // Collection Private Functions
	            //
	
	            function addFilter(ctx, fn) {
	                ctx.filter = combine(ctx.filter, fn);
	            }
	
	            function addMatchFilter(ctx, fn) {
	                ctx.isMatch = combine(ctx.isMatch, fn);
	            }
	
	            function getIndexOrStore(ctx, store) {
	                if (ctx.isPrimKey) return store;
	                var indexSpec = ctx.table.schema.idxByName[ctx.index];
	                if (!indexSpec) throw new Error("KeyPath " + ctx.index + " on object store " + store.name + " is not indexed");
	                return ctx.isPrimKey ? store : store.index(indexSpec.name);
	            }
	
	            function openCursor(ctx, store) {
	                return getIndexOrStore(ctx, store)[ctx.op](ctx.range || null, ctx.dir + ctx.unique);
	            }
	
	            function iter(ctx, fn, resolve, reject, idbstore) {
	                if (!ctx.or) {
	                    iterate(openCursor(ctx, idbstore), combine(ctx.algorithm, ctx.filter), fn, resolve, reject, ctx.table.hook.reading.fire);
	                } else {
	                    (function () {
	                        var filter = ctx.filter;
	                        var set = {};
	                        var primKey = ctx.table.schema.primKey.keyPath;
	                        var resolved = 0;
	
	                        function resolveboth() {
	                            if (++resolved === 2) resolve(); // Seems like we just support or btwn max 2 expressions, but there are no limit because we do recursion.
	                        }
	
	                        function union(item, cursor, advance) {
	                            if (!filter || filter(cursor, advance, resolveboth, reject)) {
	                                var key = cursor.primaryKey.toString(); // Converts any Date to String, String to String, Number to String and Array to comma-separated string
	                                if (!set.hasOwnProperty(key)) {
	                                    set[key] = true;
	                                    fn(item, cursor, advance);
	                                }
	                            }
	                        }
	
	                        ctx.or._iterate(union, resolveboth, reject, idbstore);
	                        iterate(openCursor(ctx, idbstore), ctx.algorithm, union, resolveboth, reject, ctx.table.hook.reading.fire);
	                    })();
	                }
	            }
	            function getInstanceTemplate(ctx) {
	                return ctx.table.schema.instanceTemplate;
	            }
	
	
	            return {
	
	                //
	                // Collection Protected Functions
	                //
	
	                _read: function (fn, cb) {
	                    var ctx = this._ctx;
	                    if (ctx.error)
	                        return ctx.table._trans(null, function rejector(resolve, reject) { reject(ctx.error); });
	                    else
	                        return ctx.table._idbstore(READONLY, fn).then(cb);
	                },
	                _write: function (fn) {
	                    var ctx = this._ctx;
	                    if (ctx.error)
	                        return ctx.table._trans(null, function rejector(resolve, reject) { reject(ctx.error); });
	                    else
	                        return ctx.table._idbstore(READWRITE, fn, "locked"); // When doing write operations on collections, always lock the operation so that upcoming operations gets queued.
	                },
	                _addAlgorithm: function (fn) {
	                    var ctx = this._ctx;
	                    ctx.algorithm = combine(ctx.algorithm, fn);
	                },
	
	                _iterate: function (fn, resolve, reject, idbstore) {
	                    return iter(this._ctx, fn, resolve, reject, idbstore);
	                },
	
	                //
	                // Collection Public methods
	                //
	
	                each: function (fn) {
	                    var ctx = this._ctx;
	
	                    fake && fn(getInstanceTemplate(ctx));
	
	                    return this._read(function (resolve, reject, idbstore) {
	                        iter(ctx, fn, resolve, reject, idbstore);
	                    });
	                },
	
	                count: function (cb) {
	                    if (fake) return Promise.resolve(0).then(cb);
	                    var self = this,
	                        ctx = this._ctx;
	
	                    if (ctx.filter || ctx.algorithm || ctx.or) {
	                        // When filters are applied or 'ored' collections are used, we must count manually
	                        var count = 0;
	                        return this._read(function (resolve, reject, idbstore) {
	                            iter(ctx, function () { ++count; return false; }, function () { resolve(count); }, reject, idbstore);
	                        }, cb);
	                    } else {
	                        // Otherwise, we can use the count() method if the index.
	                        return this._read(function (resolve, reject, idbstore) {
	                            var idx = getIndexOrStore(ctx, idbstore);
	                            var req = (ctx.range ? idx.count(ctx.range) : idx.count());
	                            req.onerror = eventRejectHandler(reject, ["calling", "count()", "on", self.name]);
	                            req.onsuccess = function (e) {
	                                resolve(Math.min(e.target.result, Math.max(0, ctx.limit - ctx.offset)));
	                            };
	                        }, cb);
	                    }
	                },
	
	                sortBy: function (keyPath, cb) {
	                    /// <param name="keyPath" type="String"></param>
	                    var ctx = this._ctx;
	                    var parts = keyPath.split('.').reverse(),
	                        lastPart = parts[0],
	                        lastIndex = parts.length - 1;
	                    function getval(obj, i) {
	                        if (i) return getval(obj[parts[i]], i - 1);
	                        return obj[lastPart];
	                    }
	                    var order = this._ctx.dir === "next" ? 1 : -1;
	
	                    function sorter(a, b) {
	                        var aVal = getval(a, lastIndex),
	                            bVal = getval(b, lastIndex);
	                        return aVal < bVal ? -order : aVal > bVal ? order : 0;
	                    }
	                    return this.toArray(function (a) {
	                        return a.sort(sorter);
	                    }).then(cb);
	                },
	
	                toArray: function (cb) {
	                    var ctx = this._ctx;
	                    return this._read(function (resolve, reject, idbstore) {
	                        fake && resolve([getInstanceTemplate(ctx)]);
	                        var a = [];
	                        iter(ctx, function (item) { a.push(item); }, function arrayComplete() {
	                            resolve(a);
	                        }, reject, idbstore);
	                    }, cb);
	                },
	
	                offset: function (offset) {
	                    var ctx = this._ctx;
	                    if (offset <= 0) return this;
	                    ctx.offset += offset; // For count()
	                    if (!ctx.or && !ctx.algorithm && !ctx.filter) {
	                        addFilter(ctx, function offsetFilter(cursor, advance, resolve) {
	                            if (offset === 0) return true;
	                            if (offset === 1) { --offset; return false; }
	                            advance(function () { cursor.advance(offset); offset = 0; });
	                            return false;
	                        });
	                    } else {
	                        addFilter(ctx, function offsetFilter(cursor, advance, resolve) {
	                            return (--offset < 0);
	                        });
	                    }
	                    return this;
	                },
	
	                limit: function (numRows) {
	                    this._ctx.limit = Math.min(this._ctx.limit, numRows); // For count()
	                    addFilter(this._ctx, function (cursor, advance, resolve) {
	                        if (--numRows <= 0) advance(resolve); // Stop after this item has been included
	                        return numRows >= 0; // If numRows is already below 0, return false because then 0 was passed to numRows initially. Otherwise we wouldnt come here.
	                    });
	                    return this;
	                },
	
	                until: function (filterFunction, bIncludeStopEntry) {
	                    var ctx = this._ctx;
	                    fake && filterFunction(getInstanceTemplate(ctx));
	                    addFilter(this._ctx, function (cursor, advance, resolve) {
	                        if (filterFunction(cursor.value)) {
	                            advance(resolve);
	                            return bIncludeStopEntry;
	                        } else {
	                            return true;
	                        }
	                    });
	                    return this;
	                },
	
	                first: function (cb) {
	                    return this.limit(1).toArray(function (a) { return a[0]; }).then(cb);
	                },
	
	                last: function (cb) {
	                    return this.reverse().first(cb);
	                },
	
	                and: function (filterFunction) {
	                    /// <param name="jsFunctionFilter" type="Function">function(val){return true/false}</param>
	                    fake && filterFunction(getInstanceTemplate(this._ctx));
	                    addFilter(this._ctx, function (cursor) {
	                        return filterFunction(cursor.value);
	                    });
	                    addMatchFilter(this._ctx, filterFunction); // match filters not used in Dexie.js but can be used by 3rd part libraries to test a collection for a match without querying DB. Used by Dexie.Observable.
	                    return this;
	                },
	
	                or: function (indexName) {
	                    return new WhereClause(this._ctx.table, indexName, this);
	                },
	
	                reverse: function () {
	                    this._ctx.dir = (this._ctx.dir === "prev" ? "next" : "prev");
	                    if (this._ondirectionchange) this._ondirectionchange(this._ctx.dir);
	                    return this;
	                },
	
	                desc: function () {
	                    return this.reverse();
	                },
	
	                eachKey: function (cb) {
	                    var ctx = this._ctx;
	                    fake && cb(getByKeyPath(getInstanceTemplate(this._ctx), this._ctx.index ? this._ctx.table.schema.idxByName[this._ctx.index].keyPath : this._ctx.table.schema.primKey.keyPath));
	                    if (!ctx.isPrimKey) ctx.op = "openKeyCursor"; // Need the check because IDBObjectStore does not have "openKeyCursor()" while IDBIndex has.
	                    return this.each(function (val, cursor) { cb(cursor.key, cursor); });
	                },
	
	                eachUniqueKey: function (cb) {
	                    this._ctx.unique = "unique";
	                    return this.eachKey(cb);
	                },
	
	                keys: function (cb) {
	                    var ctx = this._ctx;
	                    if (!ctx.isPrimKey) ctx.op = "openKeyCursor"; // Need the check because IDBObjectStore does not have "openKeyCursor()" while IDBIndex has.
	                    var a = [];
	                    if (fake) return new Promise(this.eachKey.bind(this)).then(function(x) { return [x]; }).then(cb);
	                    return this.each(function (item, cursor) {
	                        a.push(cursor.key);
	                    }).then(function () {
	                        return a;
	                    }).then(cb);
	                },
	
	                uniqueKeys: function (cb) {
	                    this._ctx.unique = "unique";
	                    return this.keys(cb);
	                },
	
	                firstKey: function (cb) {
	                    return this.limit(1).keys(function (a) { return a[0]; }).then(cb);
	                },
	
	                lastKey: function (cb) {
	                    return this.reverse().firstKey(cb);
	                },
	
	
	                distinct: function () {
	                    var set = {};
	                    addFilter(this._ctx, function (cursor) {
	                        var strKey = cursor.primaryKey.toString(); // Converts any Date to String, String to String, Number to String and Array to comma-separated string
	                        var found = set.hasOwnProperty(strKey);
	                        set[strKey] = true;
	                        return !found;
	                    });
	                    return this;
	                }
	            };
	        });
	
	        //
	        //
	        // WriteableCollection Class
	        //
	        //
	        function WriteableCollection() {
	            Collection.apply(this, arguments);
	        }
	
	        derive(WriteableCollection).from(Collection).extend({
	
	            //
	            // WriteableCollection Public Methods
	            //
	
	            modify: function (changes) {
	                var self = this,
	                    ctx = this._ctx,
	                    hook = ctx.table.hook,
	                    updatingHook = hook.updating.fire,
	                    deletingHook = hook.deleting.fire;
	
	                fake && typeof changes === 'function' && changes.call({ value: ctx.table.schema.instanceTemplate }, ctx.table.schema.instanceTemplate);
	
	                return this._write(function (resolve, reject, idbstore, trans) {
	                    var modifyer;
	                    if (typeof changes === 'function') {
	                        // Changes is a function that may update, add or delete propterties or even require a deletion the object itself (delete this.item)
	                        if (updatingHook === nop && deletingHook === nop) {
	                            // Noone cares about what is being changed. Just let the modifier function be the given argument as is.
	                            modifyer = changes;
	                        } else {
	                            // People want to know exactly what is being modified or deleted.
	                            // Let modifyer be a proxy function that finds out what changes the caller is actually doing
	                            // and call the hooks accordingly!
	                            modifyer = function (item) {
	                                var origItem = deepClone(item); // Clone the item first so we can compare laters.
	                                if (changes.call(this, item) === false) return false; // Call the real modifyer function (If it returns false explicitely, it means it dont want to modify anyting on this object)
	                                if (!this.hasOwnProperty("value")) {
	                                    // The real modifyer function requests a deletion of the object. Inform the deletingHook that a deletion is taking place.
	                                    deletingHook.call(this, this.primKey, item, trans);
	                                } else {
	                                    // No deletion. Check what was changed
	                                    var objectDiff = getObjectDiff(origItem, this.value);
	                                    var additionalChanges = updatingHook.call(this, objectDiff, this.primKey, origItem, trans);
	                                    if (additionalChanges) {
	                                        // Hook want to apply additional modifications. Make sure to fullfill the will of the hook.
	                                        item = this.value;
	                                        Object.keys(additionalChanges).forEach(function (keyPath) {
	                                            setByKeyPath(item, keyPath, additionalChanges[keyPath]);  // Adding {keyPath: undefined} means that the keyPath should be deleted. Handled by setByKeyPath
	                                        });
	                                    }
	                                }
	                            }; 
	                        }
	                    } else if (updatingHook === nop) {
	                        // changes is a set of {keyPath: value} and no one is listening to the updating hook.
	                        var keyPaths = Object.keys(changes);
	                        var numKeys = keyPaths.length;
	                        modifyer = function (item) {
	                            var anythingModified = false;
	                            for (var i = 0; i < numKeys; ++i) {
	                                var keyPath = keyPaths[i], val = changes[keyPath];
	                                if (getByKeyPath(item, keyPath) !== val) {
	                                    setByKeyPath(item, keyPath, val); // Adding {keyPath: undefined} means that the keyPath should be deleted. Handled by setByKeyPath
	                                    anythingModified = true;
	                                }
	                            }
	                            return anythingModified;
	                        }; 
	                    } else {
	                        // changes is a set of {keyPath: value} and people are listening to the updating hook so we need to call it and
	                        // allow it to add additional modifications to make.
	                        var origChanges = changes;
	                        changes = shallowClone(origChanges); // Let's work with a clone of the changes keyPath/value set so that we can restore it in case a hook extends it.
	                        modifyer = function (item) {
	                            var anythingModified = false;
	                            var additionalChanges = updatingHook.call(this, changes, this.primKey, deepClone(item), trans);
	                            if (additionalChanges) extend(changes, additionalChanges);
	                            Object.keys(changes).forEach(function (keyPath) {
	                                var val = changes[keyPath];
	                                if (getByKeyPath(item, keyPath) !== val) {
	                                    setByKeyPath(item, keyPath, val);
	                                    anythingModified = true;
	                                }
	                            });
	                            if (additionalChanges) changes = shallowClone(origChanges); // Restore original changes for next iteration
	                            return anythingModified;
	                        }; 
	                    }
	
	                    var count = 0;
	                    var successCount = 0;
	                    var iterationComplete = false;
	                    var failures = [];
	                    var failKeys = [];
	                    var currentKey = null;
	
	                    function modifyItem(item, cursor, advance) {
	                        currentKey = cursor.primaryKey;
	                        var thisContext = { primKey: cursor.primaryKey, value: item };
	                        if (modifyer.call(thisContext, item) !== false) { // If a callback explicitely returns false, do not perform the update!
	                            var bDelete = !thisContext.hasOwnProperty("value");
	                            var req = (bDelete ? cursor.delete() : cursor.update(thisContext.value));
	                            ++count;
	                            req.onerror = eventRejectHandler(function (e) {
	                                failures.push(e);
	                                failKeys.push(thisContext.primKey);
	                                if (thisContext.onerror) thisContext.onerror(e);
	                                checkFinished();
	                                return true; // Catch these errors and let a final rejection decide whether or not to abort entire transaction
	                            }, bDelete ? ["deleting", item, "from", ctx.table.name] : ["modifying", item, "on", ctx.table.name]);
	                            req.onsuccess = function (ev) {
	                                if (thisContext.onsuccess) thisContext.onsuccess(thisContext.value);
	                                ++successCount;
	                                checkFinished();
	                            }; 
	                        } else if (thisContext.onsuccess) {
	                            // Hook will expect either onerror or onsuccess to always be called!
	                            thisContext.onsuccess(thisContext.value);
	                        }
	                    }
	
	                    function doReject(e) {
	                        if (e) {
	                            failures.push(e);
	                            failKeys.push(currentKey);
	                        }
	                        return reject(new ModifyError("Error modifying one or more objects", failures, successCount, failKeys));
	                    }
	
	                    function checkFinished() {
	                        if (iterationComplete && successCount + failures.length === count) {
	                            if (failures.length > 0)
	                                doReject();
	                            else
	                                resolve(successCount);
	                        }
	                    }
	                    self._iterate(modifyItem, function () {
	                        iterationComplete = true;
	                        checkFinished();
	                    }, doReject, idbstore);
	                });
	            },
	
	            'delete': function () {
	                return this.modify(function () { delete this.value; });
	            }
	        });
	
	
	        //
	        //
	        //
	        // ------------------------- Help functions ---------------------------
	        //
	        //
	        //
	
	        function lowerVersionFirst(a, b) {
	            return a._cfg.version - b._cfg.version;
	        }
	
	        function setApiOnPlace(objs, transactionPromiseFactory, tableNames, mode, dbschema, enableProhibitedDB) {
	            tableNames.forEach(function (tableName) {
	                var tableInstance = db._tableFactory(mode, dbschema[tableName], transactionPromiseFactory);
	                objs.forEach(function (obj) {
	                    if (!obj[tableName]) {
	                        if (enableProhibitedDB) {
	                            Object.defineProperty(obj, tableName, {
	                                configurable: true,
	                                enumerable: true,
	                                get: function () {
										var currentTrans = Promise.PSD && Promise.PSD.trans;
	                                    if (currentTrans && currentTrans.db === db) {
	                                        return currentTrans.tables[tableName];
	                                    }
	                                    return tableInstance;
	                                }
	                            });
	                        } else {
	                            obj[tableName] = tableInstance;
	                        }
	                    }
	                });
	            });
	        }
	
	        function removeTablesApi(objs) {
	            objs.forEach(function (obj) {
	                for (var key in obj) {
	                    if (obj[key] instanceof Table) delete obj[key];
	                }
	            });
	        }
	
	        function iterate(req, filter, fn, resolve, reject, readingHook) {
	            var psd = Promise.PSD;
	            readingHook = readingHook || mirror;
	            if (!req.onerror) req.onerror = eventRejectHandler(reject);
	            if (filter) {
	                req.onsuccess = trycatch(function filter_record(e) {
	                    var cursor = req.result;
	                    if (cursor) {
	                        var c = function () { cursor.continue(); };
	                        if (filter(cursor, function (advancer) { c = advancer; }, resolve, reject))
	                            fn(readingHook(cursor.value), cursor, function (advancer) { c = advancer; });
	                        c();
	                    } else {
	                        resolve();
	                    }
	                }, reject, psd);
	            } else {
	                req.onsuccess = trycatch(function filter_record(e) {
	                    var cursor = req.result;
	                    if (cursor) {
	                        var c = function () { cursor.continue(); };
	                        fn(readingHook(cursor.value), cursor, function (advancer) { c = advancer; });
	                        c();
	                    } else {
	                        resolve();
	                    }
	                }, reject, psd);
	            }
	        }
	
	        function parseIndexSyntax(indexes) {
	            /// <param name="indexes" type="String"></param>
	            /// <returns type="Array" elementType="IndexSpec"></returns>
	            var rv = [];
	            indexes.split(',').forEach(function (index) {
	                index = index.trim();
	                var name = index.replace("&", "").replace("++", "").replace("*", "");
	                var keyPath = (name.indexOf('[') !== 0 ? name : index.substring(index.indexOf('[') + 1, index.indexOf(']')).split('+'));
	
	                rv.push(new IndexSpec(
	                    name,
	                    keyPath || null,
	                    index.indexOf('&') !== -1,
	                    index.indexOf('*') !== -1,
	                    index.indexOf("++") !== -1,
	                    Array.isArray(keyPath),
	                    keyPath.indexOf('.') !== -1
	                ));
	            });
	            return rv;
	        }
	
	        function ascending(a, b) {
	            return a < b ? -1 : a > b ? 1 : 0;
	        }
	
	        function descending(a, b) {
	            return a < b ? 1 : a > b ? -1 : 0;
	        }
	
	        function compoundCompare(itemCompare) {
	            return function (a, b) {
	                var i = 0;
	                while (true) {
	                    var result = itemCompare(a[i], b[i]);
	                    if (result !== 0) return result;
	                    ++i;
	                    if (i === a.length || i === b.length)
	                        return itemCompare(a.length, b.length);
	                }
	            };
	        }
	
	        function combine(filter1, filter2) {
	            return filter1 ? filter2 ? function () { return filter1.apply(this, arguments) && filter2.apply(this, arguments); } : filter1 : filter2;
	        }
	
	        function hasIEDeleteObjectStoreBug() {
	            // Assume bug is present in IE10 and IE11 but dont expect it in next version of IE (IE12)
	            return navigator.userAgent.indexOf("Trident") >= 0 || navigator.userAgent.indexOf("MSIE") >= 0;
	        }
	
	        function readGlobalSchema() {
	            db.verno = idbdb.version / 10;
	            db._dbSchema = globalSchema = {};
	            dbStoreNames = [].slice.call(idbdb.objectStoreNames, 0);
	            if (dbStoreNames.length === 0) return; // Database contains no stores.
	            var trans = idbdb.transaction(safariMultiStoreFix(dbStoreNames), 'readonly');
	            dbStoreNames.forEach(function (storeName) {
	                var store = trans.objectStore(storeName),
	                    keyPath = store.keyPath,
	                    dotted = keyPath && typeof keyPath === 'string' && keyPath.indexOf('.') !== -1;
	                var primKey = new IndexSpec(keyPath, keyPath || "", false, false, !!store.autoIncrement, keyPath && typeof keyPath !== 'string', dotted);
	                var indexes = [];
	                for (var j = 0; j < store.indexNames.length; ++j) {
	                    var idbindex = store.index(store.indexNames[j]);
	                    keyPath = idbindex.keyPath;
	                    dotted = keyPath && typeof keyPath === 'string' && keyPath.indexOf('.') !== -1;
	                    var index = new IndexSpec(idbindex.name, keyPath, !!idbindex.unique, !!idbindex.multiEntry, false, keyPath && typeof keyPath !== 'string', dotted);
	                    indexes.push(index);
	                }
	                globalSchema[storeName] = new TableSchema(storeName, primKey, indexes, {});
	            });
	            setApiOnPlace([allTables], db._transPromiseFactory, Object.keys(globalSchema), READWRITE, globalSchema);
	        }
	
	        function adjustToExistingIndexNames(schema, idbtrans) {
	            /// <summary>
	            /// Issue #30 Problem with existing db - adjust to existing index names when migrating from non-dexie db
	            /// </summary>
	            /// <param name="schema" type="Object">Map between name and TableSchema</param>
	            /// <param name="idbtrans" type="IDBTransaction"></param>
	            var storeNames = idbtrans.db.objectStoreNames;
	            for (var i = 0; i < storeNames.length; ++i) {
	                var storeName = storeNames[i];
	                var store = idbtrans.objectStore(storeName);
	                for (var j = 0; j < store.indexNames.length; ++j) {
	                    var indexName = store.indexNames[j];
	                    var keyPath = store.index(indexName).keyPath;
	                    var dexieName = typeof keyPath === 'string' ? keyPath : "[" + [].slice.call(keyPath).join('+') + "]";
	                    if (schema[storeName]) {
	                        var indexSpec = schema[storeName].idxByName[dexieName];
	                        if (indexSpec) indexSpec.name = indexName;
	                    }
	                }
	            }
	        }
	
	        extend(this, {
	            Collection: Collection,
	            Table: Table,
	            Transaction: Transaction,
	            Version: Version,
	            WhereClause: WhereClause,
	            WriteableCollection: WriteableCollection,
	            WriteableTable: WriteableTable
	        });
	
	        init();
	
	        addons.forEach(function (fn) {
	            fn(db);
	        });
	    }
	
	    //
	    // Promise Class
	    //
	    // A variant of promise-light (https://github.com/taylorhakes/promise-light) by https://github.com/taylorhakes - an A+ and ECMASCRIPT 6 compliant Promise implementation.
	    //
	    // Modified by David Fahlander to be indexedDB compliant (See discussion: https://github.com/promises-aplus/promises-spec/issues/45) .
	    // This implementation will not use setTimeout or setImmediate when it's not needed. The behavior is 100% Promise/A+ compliant since
	    // the caller of new Promise() can be certain that the promise wont be triggered the lines after constructing the promise. We fix this by using the member variable constructing to check
	    // whether the object is being constructed when reject or resolve is called. If so, the use setTimeout/setImmediate to fulfill the promise, otherwise, we know that it's not needed.
	    //
	    // This topic was also discussed in the following thread: https://github.com/promises-aplus/promises-spec/issues/45 and this implementation solves that issue.
	    //
	    // Another feature with this Promise implementation is that reject will return false in case no one catched the reject call. This is used
	    // to stopPropagation() on the IDBRequest error event in case it was catched but not otherwise.
	    //
	    // Also, the event new Promise().onuncatched is called in case no one catches a reject call. This is used for us to manually bubble any request
	    // errors to the transaction. We must not rely on IndexedDB implementation to do this, because it only does so when the source of the rejection
	    // is an error event on a request, not in case an ordinary exception is thrown.
	    var Promise = (function () {
	
	        // The use of asap in handle() is remarked because we must NOT use setTimeout(fn,0) because it causes premature commit of indexedDB transactions - which is according to indexedDB specification.
	        var _slice = [].slice;
	        var _asap = typeof setImmediate === 'undefined' ? function(fn, arg1, arg2, argN) {
	            var args = arguments;
	            setTimeout(function() { fn.apply(global, _slice.call(args, 1)); }, 0); // If not FF13 and earlier failed, we could use this call here instead: setTimeout.call(this, [fn, 0].concat(arguments));
	        } : setImmediate; // IE10+ and node.
	
	        doFakeAutoComplete(function () {
	            // Simplify the job for VS Intellisense. This piece of code is one of the keys to the new marvellous intellisense support in Dexie.
	            _asap = asap = enqueueImmediate = function(fn) {
	                var args = arguments; setTimeout(function() { fn.apply(global, _slice.call(args, 1)); }, 0);
	            };
	        });
	
	        var asap = _asap,
	            isRootExecution = true;
	
	        var operationsQueue = [];
	        var tickFinalizers = [];
	        function enqueueImmediate(fn, args) {
	            operationsQueue.push([fn, _slice.call(arguments, 1)]);
	        }
	
	        function executeOperationsQueue() {
	            var queue = operationsQueue;
	            operationsQueue = [];
	            for (var i = 0, l = queue.length; i < l; ++i) {
	                var item = queue[i];
	                item[0].apply(global, item[1]);
	            }
	        }
	
	        //var PromiseID = 0;
	        function Promise(fn) {
	            if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
	            if (typeof fn !== 'function') throw new TypeError('not a function');
	            this._state = null; // null (=pending), false (=rejected) or true (=resolved)
	            this._value = null; // error or result
	            this._deferreds = [];
	            this._catched = false; // for onuncatched
	            //this._id = ++PromiseID;
	            var self = this;
	            var constructing = true;
	            this._PSD = Promise.PSD;
	
	            try {
	                doResolve(this, fn, function (data) {
	                    if (constructing)
	                        asap(resolve, self, data);
	                    else
	                        resolve(self, data);
	                }, function (reason) {
	                    if (constructing) {
	                        asap(reject, self, reason);
	                        return false;
	                    } else {
	                        return reject(self, reason);
	                    }
	                });
	            } finally {
	                constructing = false;
	            }
	        }
	
	        function handle(self, deferred) {
	            if (self._state === null) {
	                self._deferreds.push(deferred);
	                return;
	            }
	
	            var cb = self._state ? deferred.onFulfilled : deferred.onRejected;
	            if (cb === null) {
	                // This Deferred doesnt have a listener for the event being triggered (onFulfilled or onReject) so lets forward the event to any eventual listeners on the Promise instance returned by then() or catch()
	                return (self._state ? deferred.resolve : deferred.reject)(self._value);
	            }
	            var ret, isRootExec = isRootExecution;
	            isRootExecution = false;
	            asap = enqueueImmediate;
	            try {
	                var outerPSD = Promise.PSD;
	                Promise.PSD = self._PSD;
	                ret = cb(self._value);
	                if (!self._state && (!ret || typeof ret.then !== 'function' || ret._state !== false)) setCatched(self); // Caller did 'return Promise.reject(err);' - don't regard it as catched!
	                deferred.resolve(ret);
	            } catch (e) {
	                var catched = deferred.reject(e);
	                if (!catched && self.onuncatched) {
	                    try {
	                        self.onuncatched(e);
	                    } catch (e) {
	                    }
	                }
	            } finally {
	                Promise.PSD = outerPSD;
	                if (isRootExec) {
	                    do {
	                        while (operationsQueue.length > 0) executeOperationsQueue();
	                        var finalizer = tickFinalizers.pop();
	                        if (finalizer) try {finalizer();} catch(e){}
	                    } while (tickFinalizers.length > 0 || operationsQueue.length > 0);
	                    asap = _asap;
	                    isRootExecution = true;
	                }
	            }
	        }
	
	        function _rootExec(fn) {
	            var isRootExec = isRootExecution;
	            isRootExecution = false;
	            asap = enqueueImmediate;
	            try {
	                fn();
	            } finally {
	                if (isRootExec) {
	                    do {
	                        while (operationsQueue.length > 0) executeOperationsQueue();
	                        var finalizer = tickFinalizers.pop();
	                        if (finalizer) try { finalizer(); } catch (e) { }
	                    } while (tickFinalizers.length > 0 || operationsQueue.length > 0);
	                    asap = _asap;
	                    isRootExecution = true;
	                }
	            }
	        }
	
	        function setCatched(promise) {
	            promise._catched = true;
	            if (promise._parent) setCatched(promise._parent);
	        }
	
	        function resolve(promise, newValue) {
	            var outerPSD = Promise.PSD;
	            Promise.PSD = promise._PSD;
	            try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
	                if (newValue === promise) throw new TypeError('A promise cannot be resolved with itself.');
	                if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
	                    if (typeof newValue.then === 'function') {
	                        doResolve(promise, function (resolve, reject) {
	                            //newValue instanceof Promise ? newValue._then(resolve, reject) : newValue.then(resolve, reject);
	                            newValue.then(resolve, reject);
	                        }, function (data) {
	                            resolve(promise, data);
	                        }, function (reason) {
	                            reject(promise, reason);
	                        });
	                        return;
	                    }
	                }
	                promise._state = true;
	                promise._value = newValue;
	                finale.call(promise);
	            } catch (e) { reject(e); } finally {
	                Promise.PSD = outerPSD;
	            }
	        }
	
	        function reject(promise, newValue) {
	            var outerPSD = Promise.PSD;
	            Promise.PSD = promise._PSD;
	            promise._state = false;
	            promise._value = newValue;
	
	            finale.call(promise);
	            if (!promise._catched) {
	                try {
	                    if (promise.onuncatched)
	                        promise.onuncatched(promise._value);
	                    Promise.on.error.fire(promise._value);
	                } catch (e) {
	                }
	            }
	            Promise.PSD = outerPSD;
	            return promise._catched;
	        }
	
	        function finale() {
	            for (var i = 0, len = this._deferreds.length; i < len; i++) {
	                handle(this, this._deferreds[i]);
	            }
	            this._deferreds = [];
	        }
	
	        function Deferred(onFulfilled, onRejected, resolve, reject) {
	            this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
	            this.onRejected = typeof onRejected === 'function' ? onRejected : null;
	            this.resolve = resolve;
	            this.reject = reject;
	        }
	
	        /**
	         * Take a potentially misbehaving resolver function and make sure
	         * onFulfilled and onRejected are only called once.
	         *
	         * Makes no guarantees about asynchrony.
	         */
	        function doResolve(promise, fn, onFulfilled, onRejected) {
	            var done = false;
	            try {
	                fn(function Promise_resolve(value) {
	                    if (done) return;
	                    done = true;
	                    onFulfilled(value);
	                }, function Promise_reject(reason) {
	                    if (done) return promise._catched;
	                    done = true;
	                    return onRejected(reason);
	                });
	            } catch (ex) {
	                if (done) return;
	                return onRejected(ex);
	            }
	        }
	
	        Promise.on = events(null, "error");
	
	        Promise.all = function () {
	            var args = Array.prototype.slice.call(arguments.length === 1 && Array.isArray(arguments[0]) ? arguments[0] : arguments);
	
	            return new Promise(function (resolve, reject) {
	                if (args.length === 0) return resolve([]);
	                var remaining = args.length;
	                function res(i, val) {
	                    try {
	                        if (val && (typeof val === 'object' || typeof val === 'function')) {
	                            var then = val.then;
	                            if (typeof then === 'function') {
	                                then.call(val, function (val) { res(i, val); }, reject);
	                                return;
	                            }
	                        }
	                        args[i] = val;
	                        if (--remaining === 0) {
	                            resolve(args);
	                        }
	                    } catch (ex) {
	                        reject(ex);
	                    }
	                }
	                for (var i = 0; i < args.length; i++) {
	                    res(i, args[i]);
	                }
	            });
	        };
	
	        /* Prototype Methods */
	        Promise.prototype.then = function (onFulfilled, onRejected) {
	            var self = this;
	            var p = new Promise(function (resolve, reject) {
	                if (self._state === null)
	                    handle(self, new Deferred(onFulfilled, onRejected, resolve, reject));
	                else
	                    asap(handle, self, new Deferred(onFulfilled, onRejected, resolve, reject));
	            });
	            p._PSD = this._PSD;
	            p.onuncatched = this.onuncatched; // Needed when exception occurs in a then() clause of a successful parent promise. Want onuncatched to be called even in callbacks of callbacks of the original promise.
	            p._parent = this; // Used for recursively calling onuncatched event on self and all parents.
	            return p;
	        };
	
	        Promise.prototype._then = function (onFulfilled, onRejected) {
	            handle(this, new Deferred(onFulfilled, onRejected, nop,nop));
	        };
	
	        Promise.prototype['catch'] = function (onRejected) {
	            if (arguments.length === 1) return this.then(null, onRejected);
	            // First argument is the Error type to catch
	            var type = arguments[0], callback = arguments[1];
	            if (typeof type === 'function') return this.then(null, function (e) {
	                // Catching errors by its constructor type (similar to java / c++ / c#)
	                // Sample: promise.catch(TypeError, function (e) { ... });
	                if (e instanceof type) return callback(e); else return Promise.reject(e);
	            });
	            else return this.then(null, function (e) {
	                // Catching errors by the error.name property. Makes sense for indexedDB where error type
	                // is always DOMError but where e.name tells the actual error type.
	                // Sample: promise.catch('ConstraintError', function (e) { ... });
	                if (e && e.name === type) return callback(e); else return Promise.reject(e);
	            });
	        };
	
	        Promise.prototype['finally'] = function (onFinally) {
	            return this.then(function (value) {
	                onFinally();
	                return value;
	            }, function (err) {
	                onFinally();
	                return Promise.reject(err);
	            });
	        };
	
	        Promise.prototype.onuncatched = null; // Optional event triggered if promise is rejected but no one listened.
	
	        Promise.resolve = function (value) {
	            var p = new Promise(function () { });
	            p._state = true;
	            p._value = value;
	            return p;
	        };
	
	        Promise.reject = function (value) {
	            var p = new Promise(function () { });
	            p._state = false;
	            p._value = value;
	            return p;
	        };
	
	        Promise.race = function (values) {
	            return new Promise(function (resolve, reject) {
	                values.map(function (value) {
	                    value.then(resolve, reject);
	                });
	            });
	        };
	
	        Promise.PSD = null; // Promise Specific Data - a TLS Pattern (Thread Local Storage) for Promises. TODO: Rename Promise.PSD to Promise.data
	
	        Promise.newPSD = function (fn) {
	            // Create new PSD scope (Promise Specific Data)
	            var outerScope = Promise.PSD;
	            Promise.PSD = outerScope ? Object.create(outerScope) : {};
	            try {
	                return fn();
	            } finally {
	                Promise.PSD = outerScope;
	            }
	        };
	
	        Promise._rootExec = _rootExec;
	        Promise._tickFinalize = function(callback) {
	            if (isRootExecution) throw new Error("Not in a virtual tick");
	            tickFinalizers.push(callback);
	        };
	
	        return Promise;
	    })();
	
	
	    //
	    //
	    // ------ Exportable Help Functions -------
	    //
	    //
	
	    function nop() { }
	    function mirror(val) { return val; }
	
	    function pureFunctionChain(f1, f2) {
	        // Enables chained events that takes ONE argument and returns it to the next function in chain.
	        // This pattern is used in the hook("reading") event.
	        if (f1 === mirror) return f2;
	        return function (val) {
	            return f2(f1(val));
	        }; 
	    }
	
	    function callBoth(on1, on2) {
	        return function () {
	            on1.apply(this, arguments);
	            on2.apply(this, arguments);
	        }; 
	    }
	
	    function hookCreatingChain(f1, f2) {
	        // Enables chained events that takes several arguments and may modify first argument by making a modification and then returning the same instance.
	        // This pattern is used in the hook("creating") event.
	        if (f1 === nop) return f2;
	        return function () {
	            var res = f1.apply(this, arguments);
	            if (res !== undefined) arguments[0] = res;
	            var onsuccess = this.onsuccess, // In case event listener has set this.onsuccess
	                onerror = this.onerror;     // In case event listener has set this.onerror
	            delete this.onsuccess;
	            delete this.onerror;
	            var res2 = f2.apply(this, arguments);
	            if (onsuccess) this.onsuccess = this.onsuccess ? callBoth(onsuccess, this.onsuccess) : onsuccess;
	            if (onerror) this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
	            return res2 !== undefined ? res2 : res;
	        }; 
	    }
	
	    function hookUpdatingChain(f1, f2) {
	        if (f1 === nop) return f2;
	        return function () {
	            var res = f1.apply(this, arguments);
	            if (res !== undefined) extend(arguments[0], res); // If f1 returns new modifications, extend caller's modifications with the result before calling next in chain.
	            var onsuccess = this.onsuccess, // In case event listener has set this.onsuccess
	                onerror = this.onerror;     // In case event listener has set this.onerror
	            delete this.onsuccess;
	            delete this.onerror;
	            var res2 = f2.apply(this, arguments);
	            if (onsuccess) this.onsuccess = this.onsuccess ? callBoth(onsuccess, this.onsuccess) : onsuccess;
	            if (onerror) this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
	            return res === undefined ?
	                (res2 === undefined ? undefined : res2) :
	                (res2 === undefined ? res : extend(res, res2));
	        }; 
	    }
	
	    function stoppableEventChain(f1, f2) {
	        // Enables chained events that may return false to stop the event chain.
	        if (f1 === nop) return f2;
	        return function () {
	            if (f1.apply(this, arguments) === false) return false;
	            return f2.apply(this, arguments);
	        }; 
	    }
	
	    function reverseStoppableEventChain(f1, f2) {
	        if (f1 === nop) return f2;
	        return function () {
	            if (f2.apply(this, arguments) === false) return false;
	            return f1.apply(this, arguments);
	        }; 
	    }
	
	    function nonStoppableEventChain(f1, f2) {
	        if (f1 === nop) return f2;
	        return function () {
	            f1.apply(this, arguments);
	            f2.apply(this, arguments);
	        }; 
	    }
	
	    function promisableChain(f1, f2) {
	        if (f1 === nop) return f2;
	        return function () {
	            var res = f1.apply(this, arguments);
	            if (res && typeof res.then === 'function') {
	                var thiz = this, args = arguments;
	                return res.then(function () {
	                    return f2.apply(thiz, args);
	                });
	            }
	            return f2.apply(this, arguments);
	        }; 
	    }
	
	    function events(ctx, eventNames) {
	        var args = arguments;
	        var evs = {};
	        var rv = function (eventName, subscriber) {
	            if (subscriber) {
	                // Subscribe
	                var args = [].slice.call(arguments, 1);
	                var ev = evs[eventName];
	                ev.subscribe.apply(ev, args);
	                return ctx;
	            } else if (typeof (eventName) === 'string') {
	                // Return interface allowing to fire or unsubscribe from event
	                return evs[eventName];
	            }
	        }; 
	        rv.addEventType = add;
	
	        function add(eventName, chainFunction, defaultFunction) {
	            if (Array.isArray(eventName)) return addEventGroup(eventName);
	            if (typeof eventName === 'object') return addConfiguredEvents(eventName);
	            if (!chainFunction) chainFunction = stoppableEventChain;
	            if (!defaultFunction) defaultFunction = nop;
	
	            var context = {
	                subscribers: [],
	                fire: defaultFunction,
	                subscribe: function (cb) {
	                    context.subscribers.push(cb);
	                    context.fire = chainFunction(context.fire, cb);
	                },
	                unsubscribe: function (cb) {
	                    context.subscribers = context.subscribers.filter(function (fn) { return fn !== cb; });
	                    context.fire = context.subscribers.reduce(chainFunction, defaultFunction);
	                }
	            };
	            evs[eventName] = rv[eventName] = context;
	            return context;
	        }
	
	        function addConfiguredEvents(cfg) {
	            // events(this, {reading: [functionChain, nop]});
	            Object.keys(cfg).forEach(function (eventName) {
	                var args = cfg[eventName];
	                if (Array.isArray(args)) {
	                    add(eventName, cfg[eventName][0], cfg[eventName][1]);
	                } else if (args === 'asap') {
	                    // Rather than approaching event subscription using a functional approach, we here do it in a for-loop where subscriber is executed in its own stack
	                    // enabling that any exception that occur wont disturb the initiator and also not nescessary be catched and forgotten.
	                    var context = add(eventName, null, function fire() {
	                        var args = arguments;
	                        context.subscribers.forEach(function (fn) {
	                            asap(function fireEvent() {
	                                fn.apply(global, args);
	                            });
	                        });
	                    });
	                    context.subscribe = function (fn) {
	                        // Change how subscribe works to not replace the fire function but to just add the subscriber to subscribers
	                        if (context.subscribers.indexOf(fn) === -1)
	                            context.subscribers.push(fn);
	                    }; 
	                    context.unsubscribe = function (fn) {
	                        // Change how unsubscribe works for the same reason as above.
	                        var idxOfFn = context.subscribers.indexOf(fn);
	                        if (idxOfFn !== -1) context.subscribers.splice(idxOfFn, 1);
	                    }; 
	                } else throw new Error("Invalid event config");
	            });
	        }
	
	        function addEventGroup(eventGroup) {
	            // promise-based event group (i.e. we promise to call one and only one of the events in the pair, and to only call it once.
	            var done = false;
	            eventGroup.forEach(function (name) {
	                add(name).subscribe(checkDone);
	            });
	            function checkDone() {
	                if (done) return false;
	                done = true;
	            }
	        }
	
	        for (var i = 1, l = args.length; i < l; ++i) {
	            add(args[i]);
	        }
	
	        return rv;
	    }
	
	    function assert(b) {
	        if (!b) throw new Error("Assertion failed");
	    }
	
	    function asap(fn) {
	        if (global.setImmediate) setImmediate(fn); else setTimeout(fn, 0);
	    }
	
	    var fakeAutoComplete = function () { };// Will never be changed. We just fake for the IDE that we change it (see doFakeAutoComplete())
	    var fake = false; // Will never be changed. We just fake for the IDE that we change it (see doFakeAutoComplete())
	
	    function doFakeAutoComplete(fn) {
	        var to = setTimeout(fn, 1000);
	        clearTimeout(to);
	    }
	
	    function trycatch(fn, reject, psd) {
	        return function () {
	            var outerPSD = Promise.PSD; // Support Promise-specific data (PSD) in callback calls
	            Promise.PSD = psd;
	            try {
	                fn.apply(this, arguments);
	            } catch (e) {
	                reject(e);
	            } finally {
	                Promise.PSD = outerPSD;
	            }
	        };
	    }
	
	    function getByKeyPath(obj, keyPath) {
	        // http://www.w3.org/TR/IndexedDB/#steps-for-extracting-a-key-from-a-value-using-a-key-path
	        if (obj.hasOwnProperty(keyPath)) return obj[keyPath]; // This line is moved from last to first for optimization purpose.
	        if (!keyPath) return obj;
	        if (typeof keyPath !== 'string') {
	            var rv = [];
	            for (var i = 0, l = keyPath.length; i < l; ++i) {
	                var val = getByKeyPath(obj, keyPath[i]);
	                rv.push(val);
	            }
	            return rv;
	        }
	        var period = keyPath.indexOf('.');
	        if (period !== -1) {
	            var innerObj = obj[keyPath.substr(0, period)];
	            return innerObj === undefined ? undefined : getByKeyPath(innerObj, keyPath.substr(period + 1));
	        }
	        return undefined;
	    }
	
	    function setByKeyPath(obj, keyPath, value) {
	        if (!obj || keyPath === undefined) return;
	        if (typeof keyPath !== 'string' && 'length' in keyPath) {
	            assert(typeof value !== 'string' && 'length' in value);
	            for (var i = 0, l = keyPath.length; i < l; ++i) {
	                setByKeyPath(obj, keyPath[i], value[i]);
	            }
	        } else {
	            var period = keyPath.indexOf('.');
	            if (period !== -1) {
	                var currentKeyPath = keyPath.substr(0, period);
	                var remainingKeyPath = keyPath.substr(period + 1);
	                if (remainingKeyPath === "")
	                    if (value === undefined) delete obj[currentKeyPath]; else obj[currentKeyPath] = value;
	                else {
	                    var innerObj = obj[currentKeyPath];
	                    if (!innerObj) innerObj = (obj[currentKeyPath] = {});
	                    setByKeyPath(innerObj, remainingKeyPath, value);
	                }
	            } else {
	                if (value === undefined) delete obj[keyPath]; else obj[keyPath] = value;
	            }
	        }
	    }
	
	    function delByKeyPath(obj, keyPath) {
	        if (typeof keyPath === 'string')
	            setByKeyPath(obj, keyPath, undefined);
	        else if ('length' in keyPath)
	            [].map.call(keyPath, function(kp) {
	                 setByKeyPath(obj, kp, undefined);
	            });
	    }
	
	    function shallowClone(obj) {
	        var rv = {};
	        for (var m in obj) {
	            if (obj.hasOwnProperty(m)) rv[m] = obj[m];
	        }
	        return rv;
	    }
	
	    function deepClone(any) {
	        if (!any || typeof any !== 'object') return any;
	        var rv;
	        if (Array.isArray(any)) {
	            rv = [];
	            for (var i = 0, l = any.length; i < l; ++i) {
	                rv.push(deepClone(any[i]));
	            }
	        } else if (any instanceof Date) {
	            rv = new Date();
	            rv.setTime(any.getTime());
	        } else {
	            rv = any.constructor ? Object.create(any.constructor.prototype) : {};
	            for (var prop in any) {
	                if (any.hasOwnProperty(prop)) {
	                    rv[prop] = deepClone(any[prop]);
	                }
	            }
	        }
	        return rv;
	    }
	
	    function getObjectDiff(a, b) {
	        // This is a simplified version that will always return keypaths on the root level.
	        // If for example a and b differs by: (a.somePropsObject.x != b.somePropsObject.x), we will return that "somePropsObject" is changed
	        // and not "somePropsObject.x". This is acceptable and true but could be optimized to support nestled changes if that would give a
	        // big optimization benefit.
	        var rv = {};
	        for (var prop in a) if (a.hasOwnProperty(prop)) {
	            if (!b.hasOwnProperty(prop))
	                rv[prop] = undefined; // Property removed
	            else if (a[prop] !== b[prop] && JSON.stringify(a[prop]) != JSON.stringify(b[prop]))
	                rv[prop] = b[prop]; // Property changed
	        }
	        for (var prop in b) if (b.hasOwnProperty(prop) && !a.hasOwnProperty(prop)) {
	            rv[prop] = b[prop]; // Property added
	        }
	        return rv;
	    }
	
	    function parseType(type) {
	        if (typeof type === 'function') {
	            return new type();
	        } else if (Array.isArray(type)) {
	            return [parseType(type[0])];
	        } else if (type && typeof type === 'object') {
	            var rv = {};
	            applyStructure(rv, type);
	            return rv;
	        } else {
	            return type;
	        }
	    }
	
	    function applyStructure(obj, structure) {
	        Object.keys(structure).forEach(function (member) {
	            var value = parseType(structure[member]);
	            obj[member] = value;
	        });
	    }
	
	    function eventRejectHandler(reject, sentance) {
	        return function (event) {
	            var errObj = (event && event.target.error) || new Error();
	            if (sentance) {
	                var occurredWhen = " occurred when " + sentance.map(function (word) {
	                    switch (typeof (word)) {
	                        case 'function': return word();
	                        case 'string': return word;
	                        default: return JSON.stringify(word);
	                    }
	                }).join(" ");
	                if (errObj.name) {
	                    errObj.toString = function toString() {
	                        return errObj.name + occurredWhen + (errObj.message ? ". " + errObj.message : "");
	                        // Code below works for stacked exceptions, BUT! stack is never present in event errors (not in any of the browsers). So it's no use to include it!
	                        /*delete this.toString; // Prohibiting endless recursiveness in IE.
	                        if (errObj.stack) rv += (errObj.stack ? ". Stack: " + errObj.stack : "");
	                        this.toString = toString;
	                        return rv;*/
	                    };
	                } else {
	                    errObj = errObj + occurredWhen;
	                }
	            };
	            reject(errObj);
	
	            if (event) {// Old versions of IndexedDBShim doesnt provide an error event
	                // Stop error from propagating to IDBTransaction. Let us handle that manually instead.
	                if (event.stopPropagation) // IndexedDBShim doesnt support this
	                    event.stopPropagation();
	                if (event.preventDefault) // IndexedDBShim doesnt support this
	                    event.preventDefault();
	            }
	
	            return false;
	        };
	    }
	
	    function stack(error) {
	        try {
	            throw error;
	        } catch (e) {
	            return e;
	        }
	    }
	    function preventDefault(e) {
	        e.preventDefault();
	    }
	
	    function globalDatabaseList(cb) {
	        var val,
	            localStorage = Dexie.dependencies.localStorage;
	        if (!localStorage) return cb([]); // Envs without localStorage support
	        try {
	            val = JSON.parse(localStorage.getItem('Dexie.DatabaseNames') || "[]");
	        } catch (e) {
	            val = [];
	        }
	        if (cb(val)) {
	            localStorage.setItem('Dexie.DatabaseNames', JSON.stringify(val));
	        }
	    }
	
	    //
	    // IndexSpec struct
	    //
	    function IndexSpec(name, keyPath, unique, multi, auto, compound, dotted) {
	        /// <param name="name" type="String"></param>
	        /// <param name="keyPath" type="String"></param>
	        /// <param name="unique" type="Boolean"></param>
	        /// <param name="multi" type="Boolean"></param>
	        /// <param name="auto" type="Boolean"></param>
	        /// <param name="compound" type="Boolean"></param>
	        /// <param name="dotted" type="Boolean"></param>
	        this.name = name;
	        this.keyPath = keyPath;
	        this.unique = unique;
	        this.multi = multi;
	        this.auto = auto;
	        this.compound = compound;
	        this.dotted = dotted;
	        var keyPathSrc = typeof keyPath === 'string' ? keyPath : keyPath && ('[' + [].join.call(keyPath, '+') + ']');
	        this.src = (unique ? '&' : '') + (multi ? '*' : '') + (auto ? "++" : "") + keyPathSrc;
	    }
	
	    //
	    // TableSchema struct
	    //
	    function TableSchema(name, primKey, indexes, instanceTemplate) {
	        /// <param name="name" type="String"></param>
	        /// <param name="primKey" type="IndexSpec"></param>
	        /// <param name="indexes" type="Array" elementType="IndexSpec"></param>
	        /// <param name="instanceTemplate" type="Object"></param>
	        this.name = name;
	        this.primKey = primKey || new IndexSpec();
	        this.indexes = indexes || [new IndexSpec()];
	        this.instanceTemplate = instanceTemplate;
	        this.mappedClass = null;
	        this.idxByName = indexes.reduce(function (hashSet, index) {
	            hashSet[index.name] = index;
	            return hashSet;
	        }, {});
	    }
	
	    //
	    // ModifyError Class (extends Error)
	    //
	    function ModifyError(msg, failures, successCount, failedKeys) {
	        this.name = "ModifyError";
	        this.failures = failures;
	        this.failedKeys = failedKeys;
	        this.successCount = successCount;
	        this.message = failures.join('\n');
	    }
	    derive(ModifyError).from(Error);
	
	    //
	    // Static delete() method.
	    //
	    Dexie.delete = function (databaseName) {
	        var db = new Dexie(databaseName),
	            promise = db.delete();
	        promise.onblocked = function (fn) {
	            db.on("blocked", fn);
	            return this;
	        };
	        return promise;
	    };
	
	    //
	    // Static exists() method.
	    //
	    Dexie.exists = function(name) {
	        return new Dexie(name).open().then(function(db) {
	            db.close();
	            return true;
	        }, function() {
	            return false;
	        });
	    }
	
	    //
	    // Static method for retrieving a list of all existing databases at current host.
	    //
	    Dexie.getDatabaseNames = function (cb) {
	        return new Promise(function (resolve, reject) {
	            var getDatabaseNames = getNativeGetDatabaseNamesFn();
	            if (getDatabaseNames) { // In case getDatabaseNames() becomes standard, let's prepare to support it:
	                var req = getDatabaseNames();
	                req.onsuccess = function (event) {
	                    resolve([].slice.call(event.target.result, 0)); // Converst DOMStringList to Array<String>
	                }; 
	                req.onerror = eventRejectHandler(reject);
	            } else {
	                globalDatabaseList(function (val) {
	                    resolve(val);
	                    return false;
	                });
	            }
	        }).then(cb);
	    }; 
	
	    Dexie.defineClass = function (structure) {
	        /// <summary>
	        ///     Create a javascript constructor based on given template for which properties to expect in the class.
	        ///     Any property that is a constructor function will act as a type. So {name: String} will be equal to {name: new String()}.
	        /// </summary>
	        /// <param name="structure">Helps IDE code completion by knowing the members that objects contain and not just the indexes. Also
	        /// know what type each member has. Example: {name: String, emailAddresses: [String], properties: {shoeSize: Number}}</param>
	
	        // Default constructor able to copy given properties into this object.
	        function Class(properties) {
	            /// <param name="properties" type="Object" optional="true">Properties to initialize object with.
	            /// </param>
	            properties ? extend(this, properties) : fake && applyStructure(this, structure);
	        }
	        return Class;
	    }; 
	
	    Dexie.ignoreTransaction = function (scopeFunc) {
	        // In case caller is within a transaction but needs to create a separate transaction.
	        // Example of usage:
	        // 
	        // Let's say we have a logger function in our app. Other application-logic should be unaware of the
	        // logger function and not need to include the 'logentries' table in all transaction it performs.
	        // The logging should always be done in a separate transaction and not be dependant on the current
	        // running transaction context. Then you could use Dexie.ignoreTransaction() to run code that starts a new transaction.
	        //
	        //     Dexie.ignoreTransaction(function() {
	        //         db.logentries.add(newLogEntry);
	        //     });
	        //
	        // Unless using Dexie.ignoreTransaction(), the above example would try to reuse the current transaction
	        // in current Promise-scope.
	        //
	        // An alternative to Dexie.ignoreTransaction() would be setImmediate() or setTimeout(). The reason we still provide an
	        // API for this because
	        //  1) The intention of writing the statement could be unclear if using setImmediate() or setTimeout().
	        //  2) setTimeout() would wait unnescessary until firing. This is however not the case with setImmediate().
	        //  3) setImmediate() is not supported in the ES standard.
	        return Promise.newPSD(function () {
	            Promise.PSD.trans = null;
	            return scopeFunc();
	        });
	    };
	    Dexie.spawn = function () {
	        if (global.console) console.warn("Dexie.spawn() is deprecated. Use Dexie.ignoreTransaction() instead.");
	        return Dexie.ignoreTransaction.apply(this, arguments);
	    }
	
	    Dexie.vip = function (fn) {
	        // To be used by subscribers to the on('ready') event.
	        // This will let caller through to access DB even when it is blocked while the db.ready() subscribers are firing.
	        // This would have worked automatically if we were certain that the Provider was using Dexie.Promise for all asyncronic operations. The promise PSD
	        // from the provider.connect() call would then be derived all the way to when provider would call localDatabase.applyChanges(). But since
	        // the provider more likely is using non-promise async APIs or other thenable implementations, we cannot assume that.
	        // Note that this method is only useful for on('ready') subscribers that is returning a Promise from the event. If not using vip()
	        // the database could deadlock since it wont open until the returned Promise is resolved, and any non-VIPed operation started by
	        // the caller will not resolve until database is opened.
	        return Promise.newPSD(function () {
	            Promise.PSD.letThrough = true; // Make sure we are let through if still blocking db due to onready is firing.
	            return fn();
	        });
	    }; 
	
	    // Dexie.currentTransaction property. Only applicable for transactions entered using the new "transact()" method.
	    Object.defineProperty(Dexie, "currentTransaction", {
	        get: function () {
	            /// <returns type="Transaction"></returns>
	            return Promise.PSD && Promise.PSD.trans || null;
	        }
	    }); 
	
	    function safariMultiStoreFix(storeNames) {
	        return storeNames.length === 1 ? storeNames[0] : storeNames;
	    }
	
	    // Export our Promise implementation since it can be handy as a standalone Promise implementation
	    Dexie.Promise = Promise;
	    // Export our derive/extend/override methodology
	    Dexie.derive = derive;
	    Dexie.extend = extend;
	    Dexie.override = override;
	    // Export our events() function - can be handy as a toolkit
	    Dexie.events = events;
	    Dexie.getByKeyPath = getByKeyPath;
	    Dexie.setByKeyPath = setByKeyPath;
	    Dexie.delByKeyPath = delByKeyPath;
	    Dexie.shallowClone = shallowClone;
	    Dexie.deepClone = deepClone;
	    Dexie.addons = [];
	    Dexie.fakeAutoComplete = fakeAutoComplete;
	    Dexie.asap = asap;
	    // Export our static classes
	    Dexie.ModifyError = ModifyError;
	    Dexie.MultiModifyError = ModifyError; // Backward compatibility pre 0.9.8
	    Dexie.IndexSpec = IndexSpec;
	    Dexie.TableSchema = TableSchema;
	    //
	    // Dependencies
	    //
	    // These will automatically work in browsers with indexedDB support, or where an indexedDB polyfill has been included.
	    //
	    // In node.js, however, these properties must be set "manually" before instansiating a new Dexie(). For node.js, you need to require indexeddb-js or similar and then set these deps.
	    //
	    var idbshim = global.idbModules && global.idbModules.shimIndexedDB ? global.idbModules : {};
	    Dexie.dependencies = {
	        // Required:
	        // NOTE: The "_"-prefixed versions are for prioritizing IDB-shim on IOS8 before the native IDB in case the shim was included.
	        indexedDB: idbshim.shimIndexedDB || global.indexedDB || global.mozIndexedDB || global.webkitIndexedDB || global.msIndexedDB,
	        IDBKeyRange: idbshim.IDBKeyRange || global.IDBKeyRange || global.webkitIDBKeyRange,
	        IDBTransaction: idbshim.IDBTransaction || global.IDBTransaction || global.webkitIDBTransaction,
	        // Optional:
	        Error: global.Error || String,
	        SyntaxError: global.SyntaxError || String,
	        TypeError: global.TypeError || String,
	        DOMError: global.DOMError || String,
	        localStorage: ((typeof chrome !== "undefined" && chrome !== null ? chrome.storage : void 0) != null ? null : global.localStorage)
	    }; 
	
	    // API Version Number: Type Number, make sure to always set a version number that can be comparable correctly. Example: 0.9, 0.91, 0.92, 1.0, 1.01, 1.1, 1.2, 1.21, etc.
	    Dexie.version = 1.20;
	
	    function getNativeGetDatabaseNamesFn() {
	        var indexedDB = Dexie.dependencies.indexedDB;
	        var fn = indexedDB && (indexedDB.getDatabaseNames || indexedDB.webkitGetDatabaseNames);
	        return fn && fn.bind(indexedDB);
	    }
	
	    // Export Dexie to window or as a module depending on environment.
	    publish("Dexie", Dexie);
	
	    // Fool IDE to improve autocomplete. Tested with Visual Studio 2013 and 2015.
	    doFakeAutoComplete(function() {
	        Dexie.fakeAutoComplete = fakeAutoComplete = doFakeAutoComplete;
	        Dexie.fake = fake = true;
	    });
	}).apply(null,
	
	    // AMD:
	     true ?
	    [self || window, function (name, value) { !(__WEBPACK_AMD_DEFINE_RESULT__ = function () { return value; }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); }] :
	
	    // CommonJS:
	    typeof global !== 'undefined' && typeof module !== 'undefined' && module.exports ?
	    [global, function (name, value) { module.exports = value; }]
	
	    // Vanilla HTML and WebWorkers:
	    : [self || window, function (name, value) { (self || window)[name] = value; }]);
	
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4).setImmediate))

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(5).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;
	
	// DOM APIs, for completeness
	
	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };
	
	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};
	
	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};
	
	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};
	
	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);
	
	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};
	
	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);
	
	  immediateIds[id] = true;
	
	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });
	
	  return id;
	};
	
	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4).setImmediate, __webpack_require__(4).clearImmediate))

/***/ },
/* 5 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _lodash = __webpack_require__(7);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _lodash3 = __webpack_require__(10);
	
	var _lodash4 = _interopRequireDefault(_lodash3);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = {
	  pick: _lodash2.default,
	  omit: _lodash4.default,
	  uuid: function uuid() {
	    var uuid = "",
	        i,
	        random;
	    for (i = 0; i < 32; i++) {
	      random = Math.random() * 16 | 0;
	
	      if (i == 8 || i == 12 || i == 16 || i == 20) {
	        uuid += "-";
	      }
	      uuid += (i == 12 ? 4 : i == 16 ? random & 3 | 8 : random).toString(16);
	    }
	    return uuid;
	  }
	};

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	var baseFlatten = __webpack_require__(8),
	    rest = __webpack_require__(9);
	
	/**
	 * A specialized version of `_.reduce` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @param {boolean} [initFromArray] Specify using the first element of `array` as the initial value.
	 * @returns {*} Returns the accumulated value.
	 */
	function arrayReduce(array, iteratee, accumulator, initFromArray) {
	  var index = -1,
	      length = array.length;
	
	  if (initFromArray && length) {
	    accumulator = array[++index];
	  }
	  while (++index < length) {
	    accumulator = iteratee(accumulator, array[index], index, array);
	  }
	  return accumulator;
	}
	
	/**
	 * The base implementation of `_.pick` without support for individual
	 * property names.
	 *
	 * @private
	 * @param {Object} object The source object.
	 * @param {string[]} props The property names to pick.
	 * @returns {Object} Returns the new object.
	 */
	function basePick(object, props) {
	  object = Object(object);
	  return arrayReduce(props, function(result, key) {
	    if (key in object) {
	      result[key] = object[key];
	    }
	    return result;
	  }, {});
	}
	
	/**
	 * Creates an object composed of the picked `object` properties.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The source object.
	 * @param {...(string|string[])} [props] The property names to pick, specified
	 *  individually or in arrays.
	 * @returns {Object} Returns the new object.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': '2', 'c': 3 };
	 *
	 * _.pick(object, ['a', 'c']);
	 * // => { 'a': 1, 'c': 3 }
	 */
	var pick = rest(function(object, props) {
	  return object == null ? {} : basePick(object, baseFlatten(props));
	});
	
	module.exports = pick;


/***/ },
/* 8 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]';
	
	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;
	
	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}
	
	/** Used for built-in method references. */
	var objectProto = global.Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;
	
	/** Built-in value references. */
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;
	
	/**
	 * The base implementation of `_.flatten` with support for restricting flattening.
	 *
	 * @private
	 * @param {Array} array The array to flatten.
	 * @param {boolean} [isDeep] Specify a deep flatten.
	 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
	 * @param {Array} [result=[]] The initial result value.
	 * @returns {Array} Returns the new flattened array.
	 */
	function baseFlatten(array, isDeep, isStrict, result) {
	  result || (result = []);
	
	  var index = -1,
	      length = array.length;
	
	  while (++index < length) {
	    var value = array[index];
	    if (isArrayLikeObject(value) &&
	        (isStrict || isArray(value) || isArguments(value))) {
	      if (isDeep) {
	        // Recursively flatten arrays (susceptible to call stack limits).
	        baseFlatten(value, isDeep, isStrict, result);
	      } else {
	        arrayPush(result, value);
	      }
	    } else if (!isStrict) {
	      result[result.length] = value;
	    }
	  }
	  return result;
	}
	
	/**
	 * The base implementation of `_.property` without support for deep paths.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new function.
	 */
	function baseProperty(key) {
	  return function(object) {
	    return object == null ? undefined : object[key];
	  };
	}
	
	/**
	 * Gets the "length" property value of `object`.
	 *
	 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
	 * that affects Safari on at least iOS 8.1-8.3 ARM64.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {*} Returns the "length" value.
	 */
	var getLength = baseProperty('length');
	
	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	function isArguments(value) {
	  // Safari 8.1 incorrectly makes `arguments.callee` enumerable in strict mode.
	  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
	    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
	}
	
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @type Function
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;
	
	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @type Function
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null &&
	    !(typeof value == 'function' && isFunction(value)) && isLength(getLength(value));
	}
	
	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @type Function
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object, else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */
	function isArrayLikeObject(value) {
	  return isObjectLike(value) && isArrayLike(value);
	}
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8 which returns 'object' for typed array constructors, and
	  // PhantomJS 1.9 which returns 'function' for `NodeList` instances.
	  var tag = isObject(value) ? objectToString.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This function is loosely based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	/**
	 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  // Avoid a V8 JIT bug in Chrome 19-20.
	  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	
	module.exports = baseFlatten;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 9 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/** Used as the `TypeError` message for "Functions" methods. */
	var FUNC_ERROR_TEXT = 'Expected a function';
	
	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0,
	    MAX_INTEGER = 1.7976931348623157e+308,
	    NAN = 0 / 0;
	
	/** `Object#toString` result references. */
	var funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]';
	
	/** Used to match leading and trailing whitespace. */
	var reTrim = /^\s+|\s+$/g;
	
	/** Used to detect bad signed hexadecimal string values. */
	var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
	
	/** Used to detect binary string values. */
	var reIsBinary = /^0b[01]+$/i;
	
	/** Used to detect octal string values. */
	var reIsOctal = /^0o[0-7]+$/i;
	
	/** Built-in method references without a dependency on `global`. */
	var freeParseInt = parseInt;
	
	/**
	 * A faster alternative to `Function#apply`, this function invokes `func`
	 * with the `this` binding of `thisArg` and the arguments of `args`.
	 *
	 * @private
	 * @param {Function} func The function to invoke.
	 * @param {*} thisArg The `this` binding of `func`.
	 * @param {...*} [args] The arguments to invoke `func` with.
	 * @returns {*} Returns the result of `func`.
	 */
	function apply(func, thisArg, args) {
	  var length = args ? args.length : 0;
	  switch (length) {
	    case 0: return func.call(thisArg);
	    case 1: return func.call(thisArg, args[0]);
	    case 2: return func.call(thisArg, args[0], args[1]);
	    case 3: return func.call(thisArg, args[0], args[1], args[2]);
	  }
	  return func.apply(thisArg, args);
	}
	
	/** Used for built-in method references. */
	var objectProto = global.Object.prototype;
	
	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max;
	
	/**
	 * Creates a function that invokes `func` with the `this` binding of the
	 * created function and arguments from `start` and beyond provided as an array.
	 *
	 * **Note:** This method is based on the [rest parameter](https://mdn.io/rest_parameters).
	 *
	 * @static
	 * @memberOf _
	 * @category Function
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @returns {Function} Returns the new function.
	 * @example
	 *
	 * var say = _.rest(function(what, names) {
	 *   return what + ' ' + _.initial(names).join(', ') +
	 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
	 * });
	 *
	 * say('hello', 'fred', 'barney', 'pebbles');
	 * // => 'hello fred, barney, & pebbles'
	 */
	function rest(func, start) {
	  if (typeof func != 'function') {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  start = nativeMax(start === undefined ? (func.length - 1) : toInteger(start), 0);
	  return function() {
	    var args = arguments,
	        index = -1,
	        length = nativeMax(args.length - start, 0),
	        array = Array(length);
	
	    while (++index < length) {
	      array[index] = args[start + index];
	    }
	    switch (start) {
	      case 0: return func.call(this, array);
	      case 1: return func.call(this, args[0], array);
	      case 2: return func.call(this, args[0], args[1], array);
	    }
	    var otherArgs = Array(start + 1);
	    index = -1;
	    while (++index < start) {
	      otherArgs[index] = args[index];
	    }
	    otherArgs[start] = array;
	    return apply(func, this, otherArgs);
	  };
	}
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8 which returns 'object' for typed array constructors, and
	  // PhantomJS 1.9 which returns 'function' for `NodeList` instances.
	  var tag = isObject(value) ? objectToString.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}
	
	/**
	 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  // Avoid a V8 JIT bug in Chrome 19-20.
	  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	
	/**
	 * Converts `value` to an integer.
	 *
	 * **Note:** This function is loosely based on [`ToInteger`](http://www.ecma-international.org/ecma-262/6.0/#sec-tointeger).
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted integer.
	 * @example
	 *
	 * _.toInteger(3);
	 * // => 3
	 *
	 * _.toInteger(Number.MIN_VALUE);
	 * // => 0
	 *
	 * _.toInteger(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toInteger('3');
	 * // => 3
	 */
	function toInteger(value) {
	  if (!value) {
	    return value === 0 ? value : 0;
	  }
	  value = toNumber(value);
	  if (value === INFINITY || value === -INFINITY) {
	    var sign = (value < 0 ? -1 : 1);
	    return sign * MAX_INTEGER;
	  }
	  var remainder = value % 1;
	  return value === value ? (remainder ? value - remainder : value) : 0;
	}
	
	/**
	 * Converts `value` to a number.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {number} Returns the number.
	 * @example
	 *
	 * _.toNumber(3);
	 * // => 3
	 *
	 * _.toNumber(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toNumber(Infinity);
	 * // => Infinity
	 *
	 * _.toNumber('3');
	 * // => 3
	 */
	function toNumber(value) {
	  if (isObject(value)) {
	    var other = isFunction(value.valueOf) ? value.valueOf() : value;
	    value = isObject(other) ? (other + '') : other;
	  }
	  if (typeof value != 'string') {
	    return value === 0 ? value : +value;
	  }
	  value = value.replace(reTrim, '');
	  var isBinary = reIsBinary.test(value);
	  return (isBinary || reIsOctal.test(value))
	    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
	    : (reIsBadHex.test(value) ? NAN : +value);
	}
	
	module.exports = rest;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	var SetCache = __webpack_require__(11),
	    arrayIncludes = __webpack_require__(13),
	    arrayIncludesWith = __webpack_require__(14),
	    arrayMap = __webpack_require__(15),
	    baseFlatten = __webpack_require__(16),
	    cacheHas = __webpack_require__(17),
	    keysIn = __webpack_require__(18),
	    rest = __webpack_require__(19);
	
	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;
	
	/**
	 * A specialized version of `_.reduce` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @param {boolean} [initFromArray] Specify using the first element of `array` as the initial value.
	 * @returns {*} Returns the accumulated value.
	 */
	function arrayReduce(array, iteratee, accumulator, initFromArray) {
	  var index = -1,
	      length = array.length;
	
	  if (initFromArray && length) {
	    accumulator = array[++index];
	  }
	  while (++index < length) {
	    accumulator = iteratee(accumulator, array[index], index, array);
	  }
	  return accumulator;
	}
	
	/**
	 * The base implementation of `_.unary` without support for storing wrapper metadata.
	 *
	 * @private
	 * @param {Function} func The function to cap arguments for.
	 * @returns {Function} Returns the new function.
	 */
	function baseUnary(func) {
	  return function(value) {
	    return func(value);
	  };
	}
	
	/**
	 * The base implementation of methods like `_.difference` without support for
	 * excluding multiple arrays or iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Array} values The values to exclude.
	 * @param {Function} [iteratee] The iteratee invoked per element.
	 * @param {Function} [comparator] The comparator invoked per element.
	 * @returns {Array} Returns the new array of filtered values.
	 */
	function baseDifference(array, values, iteratee, comparator) {
	  var index = -1,
	      includes = arrayIncludes,
	      isCommon = true,
	      length = array.length,
	      result = [],
	      valuesLength = values.length;
	
	  if (!length) {
	    return result;
	  }
	  if (iteratee) {
	    values = arrayMap(values, baseUnary(iteratee));
	  }
	  if (comparator) {
	    includes = arrayIncludesWith;
	    isCommon = false;
	  }
	  else if (values.length >= LARGE_ARRAY_SIZE) {
	    includes = cacheHas;
	    isCommon = false;
	    values = new SetCache(values);
	  }
	  outer:
	  while (++index < length) {
	    var value = array[index],
	        computed = iteratee ? iteratee(value) : value;
	
	    if (isCommon && computed === computed) {
	      var valuesIndex = valuesLength;
	      while (valuesIndex--) {
	        if (values[valuesIndex] === computed) {
	          continue outer;
	        }
	      }
	      result.push(value);
	    }
	    else if (!includes(values, computed, comparator)) {
	      result.push(value);
	    }
	  }
	  return result;
	}
	
	/**
	 * The base implementation of `_.pick` without support for individual
	 * property names.
	 *
	 * @private
	 * @param {Object} object The source object.
	 * @param {string[]} props The property names to pick.
	 * @returns {Object} Returns the new object.
	 */
	function basePick(object, props) {
	  object = Object(object);
	  return arrayReduce(props, function(result, key) {
	    if (key in object) {
	      result[key] = object[key];
	    }
	    return result;
	  }, {});
	}
	
	/**
	 * The opposite of `_.pick`; this method creates an object composed of the
	 * own and inherited enumerable properties of `object` that are not omitted.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The source object.
	 * @param {...(string|string[])} [props] The property names to omit, specified
	 *  individually or in arrays..
	 * @returns {Object} Returns the new object.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': '2', 'c': 3 };
	 *
	 * _.omit(object, ['a', 'c']);
	 * // => { 'b': '2' }
	 */
	var omit = rest(function(object, props) {
	  if (object == null) {
	    return {};
	  }
	  props = arrayMap(baseFlatten(props), String);
	  return basePick(object, baseDifference(keysIn(object), props));
	});
	
	module.exports = omit;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	var MapCache = __webpack_require__(12);
	
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	
	/**
	 *
	 * Creates a set cache object to store unique values.
	 *
	 * @private
	 * @param {Array} [values] The values to cache.
	 */
	function SetCache(values) {
	  var index = -1,
	      length = values ? values.length : 0;
	
	  this.__data__ = new MapCache;
	  while (++index < length) {
	    this.push(values[index]);
	  }
	}
	
	/**
	 * Adds `value` to the set cache.
	 *
	 * @private
	 * @name push
	 * @memberOf SetCache
	 * @param {*} value The value to cache.
	 */
	function cachePush(value) {
	  var map = this.__data__;
	  if (isKeyable(value)) {
	    var data = map.__data__,
	        hash = typeof value == 'string' ? data.string : data.hash;
	
	    hash[value] = HASH_UNDEFINED;
	  }
	  else {
	    map.set(value, HASH_UNDEFINED);
	  }
	}
	
	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return type == 'number' || type == 'boolean' ||
	    (type == 'string' && value !== '__proto__') || value == null;
	}
	
	// Add functions to the `SetCache`.
	SetCache.prototype.push = cachePush;
	
	module.exports = SetCache;


/***/ },
/* 12 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	
	/** `Object#toString` result references. */
	var funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]';
	
	/** Used to match `RegExp` [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns). */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
	
	/** Used to detect host constructors (Safari > 5). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;
	
	/**
	 * Checks if `value` is a host object in IE < 9.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
	 */
	function isHostObject(value) {
	  // Many host objects are `Object` objects that can coerce to strings
	  // despite having improperly defined `toString` methods.
	  var result = false;
	  if (value != null && typeof value.toString != 'function') {
	    try {
	      result = !!(value + '');
	    } catch (e) {}
	  }
	  return result;
	}
	
	/** Used for built-in method references. */
	var arrayProto = global.Array.prototype,
	    objectProto = global.Object.prototype;
	
	/** Used to resolve the decompiled source of functions. */
	var funcToString = global.Function.prototype.toString;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;
	
	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);
	
	/** Built-in value references. */
	var splice = arrayProto.splice;
	
	/* Built-in method references that are verified to be native. */
	var Map = getNative(global, 'Map'),
	    nativeCreate = getNative(Object, 'create');
	
	/**
	 * Creates an hash object.
	 *
	 * @private
	 * @returns {Object} Returns the new hash object.
	 */
	function Hash() {}
	
	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(hash, key) {
	  return hashHas(hash, key) && delete hash[key];
	}
	
	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @param {Object} hash The hash to query.
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(hash, key) {
	  if (nativeCreate) {
	    var result = hash[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }
	  return hasOwnProperty.call(hash, key) ? hash[key] : undefined;
	}
	
	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @param {Object} hash The hash to query.
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(hash, key) {
	  return nativeCreate ? hash[key] !== undefined : hasOwnProperty.call(hash, key);
	}
	
	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 */
	function hashSet(hash, key, value) {
	  hash[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
	}
	
	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @param {Array} [values] The values to cache.
	 */
	function MapCache(values) {
	  var index = -1,
	      length = values ? values.length : 0;
	
	  this.clear();
	  while (++index < length) {
	    var entry = values[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	
	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapClear() {
	  this.__data__ = { 'hash': new Hash, 'map': Map ? new Map : [], 'string': new Hash };
	}
	
	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapDelete(key) {
	  var data = this.__data__;
	  if (isKeyable(key)) {
	    return hashDelete(typeof key == 'string' ? data.string : data.hash, key);
	  }
	  return Map ? data.map['delete'](key) : assocDelete(data.map, key);
	}
	
	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapGet(key) {
	  var data = this.__data__;
	  if (isKeyable(key)) {
	    return hashGet(typeof key == 'string' ? data.string : data.hash, key);
	  }
	  return Map ? data.map.get(key) : assocGet(data.map, key);
	}
	
	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapHas(key) {
	  var data = this.__data__;
	  if (isKeyable(key)) {
	    return hashHas(typeof key == 'string' ? data.string : data.hash, key);
	  }
	  return Map ? data.map.has(key) : assocHas(data.map, key);
	}
	
	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache object.
	 */
	function mapSet(key, value) {
	  var data = this.__data__;
	  if (isKeyable(key)) {
	    hashSet(typeof key == 'string' ? data.string : data.hash, key, value);
	  } else if (Map) {
	    data.map.set(key, value);
	  } else {
	    assocSet(data.map, key, value);
	  }
	  return this;
	}
	
	/**
	 * Removes `key` and its value from the associative array.
	 *
	 * @private
	 * @param {Array} array The array to query.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function assocDelete(array, key) {
	  var index = assocIndexOf(array, key);
	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = array.length - 1;
	  if (index == lastIndex) {
	    array.pop();
	  } else {
	    splice.call(array, index, 1);
	  }
	  return true;
	}
	
	/**
	 * Gets the associative array value for `key`.
	 *
	 * @private
	 * @param {Array} array The array to query.
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function assocGet(array, key) {
	  var index = assocIndexOf(array, key);
	  return index < 0 ? undefined : array[index][1];
	}
	
	/**
	 * Checks if an associative array value for `key` exists.
	 *
	 * @private
	 * @param {Array} array The array to query.
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function assocHas(array, key) {
	  return assocIndexOf(array, key) > -1;
	}
	
	/**
	 * Gets the index at which the first occurrence of `key` is found in `array`
	 * of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to search.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}
	
	/**
	 * Sets the associative array `key` to `value`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 */
	function assocSet(array, key, value) {
	  var index = assocIndexOf(array, key);
	  if (index < 0) {
	    array.push([key, value]);
	  } else {
	    array[index][1] = value;
	  }
	}
	
	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = object == null ? undefined : object[key];
	  return isNative(value) ? value : undefined;
	}
	
	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return type == 'number' || type == 'boolean' ||
	    (type == 'string' && value !== '__proto__') || value == null;
	}
	
	/**
	 * Performs a [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'user': 'fred' };
	 * var other = { 'user': 'fred' };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8 which returns 'object' for typed array constructors, and
	  // PhantomJS 1.9 which returns 'function' for `NodeList` instances.
	  var tag = isObject(value) ? objectToString.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}
	
	/**
	 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  // Avoid a V8 JIT bug in Chrome 19-20.
	  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	
	/**
	 * Checks if `value` is a native function.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
	 * @example
	 *
	 * _.isNative(Array.prototype.push);
	 * // => true
	 *
	 * _.isNative(_);
	 * // => false
	 */
	function isNative(value) {
	  if (value == null) {
	    return false;
	  }
	  if (isFunction(value)) {
	    return reIsNative.test(funcToString.call(value));
	  }
	  return isObjectLike(value) &&
	    (isHostObject(value) ? reIsNative : reIsHostCtor).test(value);
	}
	
	// Avoid inheriting from `Object.prototype` when possible.
	Hash.prototype = nativeCreate ? nativeCreate(null) : objectProto;
	
	// Add functions to the `MapCache`.
	MapCache.prototype.clear = mapClear;
	MapCache.prototype['delete'] = mapDelete;
	MapCache.prototype.get = mapGet;
	MapCache.prototype.has = mapHas;
	MapCache.prototype.set = mapSet;
	
	module.exports = MapCache;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 13 */
/***/ function(module, exports) {

	/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/**
	 * A specialized version of `_.includes` for arrays without support for
	 * specifying an index to search from.
	 *
	 * @private
	 * @param {Array} array The array to search.
	 * @param {*} target The value to search for.
	 * @returns {boolean} Returns `true` if `target` is found, else `false`.
	 */
	function arrayIncludes(array, value) {
	  return !!array.length && baseIndexOf(array, value, 0) > -1;
	}
	
	/**
	 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
	 *
	 * @private
	 * @param {Array} array The array to search.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseIndexOf(array, value, fromIndex) {
	  if (value !== value) {
	    return indexOfNaN(array, fromIndex);
	  }
	  var index = fromIndex - 1,
	      length = array.length;
	
	  while (++index < length) {
	    if (array[index] === value) {
	      return index;
	    }
	  }
	  return -1;
	}
	
	/**
	 * Gets the index at which the first occurrence of `NaN` is found in `array`.
	 *
	 * @private
	 * @param {Array} array The array to search.
	 * @param {number} fromIndex The index to search from.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {number} Returns the index of the matched `NaN`, else `-1`.
	 */
	function indexOfNaN(array, fromIndex, fromRight) {
	  var length = array.length,
	      index = fromIndex + (fromRight ? 0 : -1);
	
	  while ((fromRight ? index-- : ++index < length)) {
	    var other = array[index];
	    if (other !== other) {
	      return index;
	    }
	  }
	  return -1;
	}
	
	module.exports = arrayIncludes;


/***/ },
/* 14 */
/***/ function(module, exports) {

	/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/**
	 * A specialized version of `_.includesWith` for arrays without support for
	 * specifying an index to search from.
	 *
	 * @private
	 * @param {Array} array The array to search.
	 * @param {*} target The value to search for.
	 * @param {Function} comparator The comparator invoked per element.
	 * @returns {boolean} Returns `true` if `target` is found, else `false`.
	 */
	function arrayIncludesWith(array, value, comparator) {
	  var index = -1,
	      length = array.length;
	
	  while (++index < length) {
	    if (comparator(value, array[index])) {
	      return true;
	    }
	  }
	  return false;
	}
	
	module.exports = arrayIncludesWith;


/***/ },
/* 15 */
/***/ function(module, exports) {

	/**
	 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern modularize exports="npm" -o ./`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/**
	 * A specialized version of `_.map` for arrays without support for callback
	 * shorthands or `this` binding.
	 *
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function arrayMap(array, iteratee) {
	  var index = -1,
	      length = array.length,
	      result = Array(length);
	
	  while (++index < length) {
	    result[index] = iteratee(array[index], index, array);
	  }
	  return result;
	}
	
	module.exports = arrayMap;


/***/ },
/* 16 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]';
	
	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;
	
	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}
	
	/** Used for built-in method references. */
	var objectProto = global.Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;
	
	/** Built-in value references. */
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;
	
	/**
	 * The base implementation of `_.flatten` with support for restricting flattening.
	 *
	 * @private
	 * @param {Array} array The array to flatten.
	 * @param {boolean} [isDeep] Specify a deep flatten.
	 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
	 * @param {Array} [result=[]] The initial result value.
	 * @returns {Array} Returns the new flattened array.
	 */
	function baseFlatten(array, isDeep, isStrict, result) {
	  result || (result = []);
	
	  var index = -1,
	      length = array.length;
	
	  while (++index < length) {
	    var value = array[index];
	    if (isArrayLikeObject(value) &&
	        (isStrict || isArray(value) || isArguments(value))) {
	      if (isDeep) {
	        // Recursively flatten arrays (susceptible to call stack limits).
	        baseFlatten(value, isDeep, isStrict, result);
	      } else {
	        arrayPush(result, value);
	      }
	    } else if (!isStrict) {
	      result[result.length] = value;
	    }
	  }
	  return result;
	}
	
	/**
	 * The base implementation of `_.property` without support for deep paths.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new function.
	 */
	function baseProperty(key) {
	  return function(object) {
	    return object == null ? undefined : object[key];
	  };
	}
	
	/**
	 * Gets the "length" property value of `object`.
	 *
	 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
	 * that affects Safari on at least iOS 8.1-8.3 ARM64.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {*} Returns the "length" value.
	 */
	var getLength = baseProperty('length');
	
	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	function isArguments(value) {
	  // Safari 8.1 incorrectly makes `arguments.callee` enumerable in strict mode.
	  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
	    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
	}
	
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @type Function
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;
	
	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @type Function
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null &&
	    !(typeof value == 'function' && isFunction(value)) && isLength(getLength(value));
	}
	
	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @type Function
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object, else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */
	function isArrayLikeObject(value) {
	  return isObjectLike(value) && isArrayLike(value);
	}
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8 which returns 'object' for typed array constructors, and
	  // PhantomJS 1.9 which returns 'function' for `NodeList` instances.
	  var tag = isObject(value) ? objectToString.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This function is loosely based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	/**
	 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  // Avoid a V8 JIT bug in Chrome 19-20.
	  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	
	module.exports = baseFlatten;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 17 */
/***/ function(module, exports) {

	/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	
	/**
	 * Checks if `value` is in `cache`.
	 *
	 * @private
	 * @param {Object} cache The set cache to search.
	 * @param {*} value The value to search for.
	 * @returns {number} Returns `true` if `value` is found, else `false`.
	 */
	function cacheHas(cache, value) {
	  var map = cache.__data__;
	  if (isKeyable(value)) {
	    var data = map.__data__,
	        hash = typeof value == 'string' ? data.string : data.hash;
	
	    return hash[value] === HASH_UNDEFINED;
	  }
	  return map.has(value);
	}
	
	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return type == 'number' || type == 'boolean' ||
	    (type == 'string' && value !== '__proto__') || value == null;
	}
	
	module.exports = cacheHas;


/***/ },
/* 18 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    stringTag = '[object String]';
	
	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;
	
	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */
	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);
	
	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}
	
	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return value > -1 && value % 1 == 0 && value < length;
	}
	
	/**
	 * Converts `iterator` to an array.
	 *
	 * @private
	 * @param {Object} iterator The iterator to convert.
	 * @returns {Array} Returns the converted array.
	 */
	function iteratorToArray(iterator) {
	  var data,
	      result = [];
	
	  while (!(data = iterator.next()).done) {
	    result.push(data.value);
	  }
	  return result;
	}
	
	/** Used for built-in method references. */
	var objectProto = global.Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;
	
	/** Built-in value references. */
	var Reflect = global.Reflect,
	    enumerate = Reflect ? Reflect.enumerate : undefined,
	    propertyIsEnumerable = objectProto.propertyIsEnumerable;
	
	/**
	 * The base implementation of `_.keysIn` which doesn't skip the constructor
	 * property of prototypes or treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeysIn(object) {
	  object = object == null ? object : Object(object);
	
	  var result = [];
	  for (var key in object) {
	    result.push(key);
	  }
	  return result;
	}
	
	// Fallback for IE < 9 with es6-shim.
	if (enumerate && !propertyIsEnumerable.call({ 'valueOf': 1 }, 'valueOf')) {
	  baseKeysIn = function(object) {
	    return iteratorToArray(enumerate(object));
	  };
	}
	
	/**
	 * The base implementation of `_.property` without support for deep paths.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new function.
	 */
	function baseProperty(key) {
	  return function(object) {
	    return object == null ? undefined : object[key];
	  };
	}
	
	/**
	 * Gets the "length" property value of `object`.
	 *
	 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
	 * that affects Safari on at least iOS 8.1-8.3 ARM64.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {*} Returns the "length" value.
	 */
	var getLength = baseProperty('length');
	
	/**
	 * Creates an array of index keys for `object` values of arrays,
	 * `arguments` objects, and strings, otherwise `null` is returned.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array|null} Returns index keys, else `null`.
	 */
	function indexKeys(object) {
	  var length = object ? object.length : undefined;
	  return (isLength(length) && (isArray(object) || isString(object) || isArguments(object)))
	    ? baseTimes(length, String)
	    : null;
	}
	
	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;
	
	  return value === proto;
	}
	
	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	function isArguments(value) {
	  // Safari 8.1 incorrectly makes `arguments.callee` enumerable in strict mode.
	  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
	    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
	}
	
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @type Function
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;
	
	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @type Function
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null &&
	    !(typeof value == 'function' && isFunction(value)) && isLength(getLength(value));
	}
	
	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @type Function
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object, else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */
	function isArrayLikeObject(value) {
	  return isObjectLike(value) && isArrayLike(value);
	}
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8 which returns 'object' for typed array constructors, and
	  // PhantomJS 1.9 which returns 'function' for `NodeList` instances.
	  var tag = isObject(value) ? objectToString.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This function is loosely based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	/**
	 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  // Avoid a V8 JIT bug in Chrome 19-20.
	  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	
	/**
	 * Checks if `value` is classified as a `String` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isString('abc');
	 * // => true
	 *
	 * _.isString(1);
	 * // => false
	 */
	function isString(value) {
	  return typeof value == 'string' ||
	    (!isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag);
	}
	
	/**
	 * Creates an array of the own and inherited enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keysIn(new Foo);
	 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	 */
	function keysIn(object) {
	  var index = -1,
	      isProto = isPrototype(object),
	      props = baseKeysIn(object),
	      propsLength = props.length,
	      indexes = indexKeys(object),
	      skipIndexes = !!indexes,
	      result = indexes || [],
	      length = result.length;
	
	  while (++index < propsLength) {
	    var key = props[index];
	    if (!(skipIndexes && (key == 'length' || isIndex(key, length))) &&
	        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	module.exports = keysIn;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 19 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/** Used as the `TypeError` message for "Functions" methods. */
	var FUNC_ERROR_TEXT = 'Expected a function';
	
	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0,
	    MAX_INTEGER = 1.7976931348623157e+308,
	    NAN = 0 / 0;
	
	/** `Object#toString` result references. */
	var funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]';
	
	/** Used to match leading and trailing whitespace. */
	var reTrim = /^\s+|\s+$/g;
	
	/** Used to detect bad signed hexadecimal string values. */
	var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
	
	/** Used to detect binary string values. */
	var reIsBinary = /^0b[01]+$/i;
	
	/** Used to detect octal string values. */
	var reIsOctal = /^0o[0-7]+$/i;
	
	/** Built-in method references without a dependency on `global`. */
	var freeParseInt = parseInt;
	
	/**
	 * A faster alternative to `Function#apply`, this function invokes `func`
	 * with the `this` binding of `thisArg` and the arguments of `args`.
	 *
	 * @private
	 * @param {Function} func The function to invoke.
	 * @param {*} thisArg The `this` binding of `func`.
	 * @param {...*} [args] The arguments to invoke `func` with.
	 * @returns {*} Returns the result of `func`.
	 */
	function apply(func, thisArg, args) {
	  var length = args ? args.length : 0;
	  switch (length) {
	    case 0: return func.call(thisArg);
	    case 1: return func.call(thisArg, args[0]);
	    case 2: return func.call(thisArg, args[0], args[1]);
	    case 3: return func.call(thisArg, args[0], args[1], args[2]);
	  }
	  return func.apply(thisArg, args);
	}
	
	/** Used for built-in method references. */
	var objectProto = global.Object.prototype;
	
	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max;
	
	/**
	 * Creates a function that invokes `func` with the `this` binding of the
	 * created function and arguments from `start` and beyond provided as an array.
	 *
	 * **Note:** This method is based on the [rest parameter](https://mdn.io/rest_parameters).
	 *
	 * @static
	 * @memberOf _
	 * @category Function
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @returns {Function} Returns the new function.
	 * @example
	 *
	 * var say = _.rest(function(what, names) {
	 *   return what + ' ' + _.initial(names).join(', ') +
	 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
	 * });
	 *
	 * say('hello', 'fred', 'barney', 'pebbles');
	 * // => 'hello fred, barney, & pebbles'
	 */
	function rest(func, start) {
	  if (typeof func != 'function') {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  start = nativeMax(start === undefined ? (func.length - 1) : toInteger(start), 0);
	  return function() {
	    var args = arguments,
	        index = -1,
	        length = nativeMax(args.length - start, 0),
	        array = Array(length);
	
	    while (++index < length) {
	      array[index] = args[start + index];
	    }
	    switch (start) {
	      case 0: return func.call(this, array);
	      case 1: return func.call(this, args[0], array);
	      case 2: return func.call(this, args[0], args[1], array);
	    }
	    var otherArgs = Array(start + 1);
	    index = -1;
	    while (++index < start) {
	      otherArgs[index] = args[index];
	    }
	    otherArgs[start] = array;
	    return apply(func, this, otherArgs);
	  };
	}
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8 which returns 'object' for typed array constructors, and
	  // PhantomJS 1.9 which returns 'function' for `NodeList` instances.
	  var tag = isObject(value) ? objectToString.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}
	
	/**
	 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  // Avoid a V8 JIT bug in Chrome 19-20.
	  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	
	/**
	 * Converts `value` to an integer.
	 *
	 * **Note:** This function is loosely based on [`ToInteger`](http://www.ecma-international.org/ecma-262/6.0/#sec-tointeger).
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted integer.
	 * @example
	 *
	 * _.toInteger(3);
	 * // => 3
	 *
	 * _.toInteger(Number.MIN_VALUE);
	 * // => 0
	 *
	 * _.toInteger(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toInteger('3');
	 * // => 3
	 */
	function toInteger(value) {
	  if (!value) {
	    return value === 0 ? value : 0;
	  }
	  value = toNumber(value);
	  if (value === INFINITY || value === -INFINITY) {
	    var sign = (value < 0 ? -1 : 1);
	    return sign * MAX_INTEGER;
	  }
	  var remainder = value % 1;
	  return value === value ? (remainder ? value - remainder : value) : 0;
	}
	
	/**
	 * Converts `value` to a number.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {number} Returns the number.
	 * @example
	 *
	 * _.toNumber(3);
	 * // => 3
	 *
	 * _.toNumber(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toNumber(Infinity);
	 * // => Infinity
	 *
	 * _.toNumber('3');
	 * // => 3
	 */
	function toNumber(value) {
	  if (isObject(value)) {
	    var other = isFunction(value.valueOf) ? value.valueOf() : value;
	    value = isObject(other) ? (other + '') : other;
	  }
	  if (typeof value != 'string') {
	    return value === 0 ? value : +value;
	  }
	  value = value.replace(reTrim, '');
	  var isBinary = reIsBinary.test(value);
	  return (isBinary || reIsOctal.test(value))
	    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
	    : (reIsBadHex.test(value) ? NAN : +value);
	}
	
	module.exports = rest;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMDFmMzFkMWJmMDkwY2QwZGU3OWQiLCJ3ZWJwYWNrOi8vLy4vc3JjL2JnL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9iZy9tZXNzYWdlX2xpc3RlbmVyLmpzIiwid2VicGFjazovLy8uL3NyYy9iZy9zdG9yZS5qcyIsIndlYnBhY2s6Ly8vLi9+L2RleGllL2Rpc3QvbGF0ZXN0L0RleGllLmpzIiwid2VicGFjazovLy8od2VicGFjaykvfi9ub2RlLWxpYnMtYnJvd3Nlci9+L3RpbWVycy1icm93c2VyaWZ5L21haW4uanMiLCJ3ZWJwYWNrOi8vLyh3ZWJwYWNrKS9+L25vZGUtbGlicy1icm93c2VyL34vcHJvY2Vzcy9icm93c2VyLmpzIiwid2VicGFjazovLy8uL3NyYy91dGlsLmpzIiwid2VicGFjazovLy8uL34vbG9kYXNoLnBpY2svaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gucGljay9+L2xvZGFzaC5fYmFzZWZsYXR0ZW4vaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gucGljay9+L2xvZGFzaC5yZXN0L2luZGV4LmpzIiwid2VicGFjazovLy8uL34vbG9kYXNoLm9taXQvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fc2V0Y2FjaGUvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fc2V0Y2FjaGUvfi9sb2Rhc2guX21hcGNhY2hlL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vbG9kYXNoLm9taXQvfi9sb2Rhc2guX2FycmF5aW5jbHVkZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fYXJyYXlpbmNsdWRlc3dpdGgvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fYXJyYXltYXAvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fYmFzZWZsYXR0ZW4vaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fY2FjaGVoYXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5rZXlzaW4vaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5yZXN0L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7S0NyQ1ksS0FBSzs7Ozs7Ozs7O0FBS2pCLE9BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEtBQUssRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFO0FBQ2xFLFFBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUN6QixJQUFJLENBQUMsY0FBSSxFQUFJO0FBQ1osU0FBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ2YsYUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7QUFDckYsYUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7TUFDL0I7SUFDRixDQUFDLENBQ0QsS0FBSyxDQUFDLGFBQUc7WUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztJQUFBLENBQUM7RUFDbEMsQ0FBQzs7Ozs7QUFNRixPQUFNLENBQUMsWUFB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEVBQUU7QUFDYixjQUFhLFFBQVE7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsRUFBRTtBQUNiLGNBQWEsUUFBUTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsRUFBRTtBQUNiLGNBQWEsUUFBUTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsRUFBRTtBQUNiLGNBQWEsUUFBUTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsRUFBRTtBQUNiLGNBQWEsUUFBUTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxFQUFFO0FBQ2IsY0FBYSxRQUFRO0FBQ3JCO0FBQ0E7QUFDQSxpQkFBZ0I7QUFDaEI7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QTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEVBQUU7QUFDYixjQUFhLFFBQVE7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxFQUFFO0FBQ2IsY0FBYSxRQUFRO0FBQ3JCO0FBQ0E7QUFDQSxpQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxFQUFFO0FBQ2IsY0FBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxFQUFFO0FBQ2IsY0FBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBIiwiZmlsZSI6ImJhY2tncm91bmQuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCAwMWYzMWQxYmYwOTBjZDBkZTc5ZFxuICoqLyIsImltcG9ydCBtZXNzYWdlX2xpc3RlbmVyIGZyb20gJy4vbWVzc2FnZV9saXN0ZW5lcidcbmltcG9ydCAqIGFzIHN0b3JlIGZyb20gJy4vc3RvcmUnXG5cbi8qPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuKiBUYWIgQWN0aW9uXG4qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuY2hyb21lLnRhYnMub25VcGRhdGVkLmFkZExpc3RlbmVyKGZ1bmN0aW9uICh0YWJJZCwgY2hhbmdlSW5mbywgdGFiKSB7XG4gIHN0b3JlLmdldE1lbW9zQnlVcmwodGFiLnVybClcbiAgICAudGhlbihkYXRhID0+IHtcbiAgICAgIGlmIChkYXRhLmxlbmd0aCkge1xuICAgICAgICBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwgeyB0eXBlOiAnVEFCX09OX1VQREFURUQnLCBkYXRhOiBkYXRhLCB0YWJJZDogdGFiSWQgfSk7XG4gICAgICAgIGNocm9tZS5wYWdlQWN0aW9uLnNob3codGFiSWQpO1xuICAgICAgfVxuICAgIH0pXG4gICAgLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKVxufSk7XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiogQ29udGV4dCBNZW51XG4qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cbmNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcbiAgaWQ6ICdzYXNoaWtvbWlfY29udGV4dF9tZW51JyxcbiAgdGl0bGU6ICdTYXNoaWtvbWknLFxuICBjb250ZXh0czogWydzZWxlY3Rpb24nXVxufSk7XG5cbmNocm9tZS5jb250ZXh0TWVudXMub25DbGlja2VkLmFkZExpc3RlbmVyKGZ1bmN0aW9uIChpbmZvLCB0YWIpIHtcbiAgY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UodGFiLmlkLCB7IHR5cGU6ICdDT05URVhUX01FTlUnIH0pO1xufSk7XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBQYWdlQWN0aW9uXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cbmNocm9tZS5wYWdlQWN0aW9uLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcih0YWIgPT4ge1xuICBjaHJvbWUucGFnZUFjdGlvbi5nZXRUaXRsZSh7IHRhYklkOiB0YWIuaWQgfSwgZnVuY3Rpb24gKHRpdGxlKSB7XG4gICAgaWYgKHRpdGxlLm1hdGNoKC9lcnJvci8pKSB7XG4gICAgICBzZXNzaW9uU3RvcmFnZS5pbnNldGlvbkVycm9yVVJMID0gdGFiLnVybDtcbiAgICAgIGNocm9tZS50YWJzLmNyZWF0ZSh7IHVybDogY2hyb21lLmV4dGVuc2lvbi5nZXRVUkwoJ2luc2VydGlvbl9lcnJvci5odG1sJykgfSk7XG4gICAgfVxuICB9KTtcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvYmcvaW5kZXguanNcbiAqKi8iLCJpbXBvcnQgKiBhcyBzdG9yZSBmcm9tICcuL3N0b3JlJ1xuZXhwb3J0IGRlZmF1bHQgKGZ1bmN0aW9uICgpIHtcblxuICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoXG4gICAgZnVuY3Rpb24gKHJlcSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpIHtcbiAgICAgIHN3aXRjaCAocmVxLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIlBVVFwiOlxuICAgICAgICAgIHB1dE1lbW8ocmVxLCBzZW5kUmVzcG9uc2UpO1xuICAgICAgICAgIF92YWxpZGF0ZVBhZ2VBY3Rpb24oc2VuZGVyKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIkRFTEVURVwiOlxuICAgICAgICAgIGRlbGV0ZU1lbW8ocmVxLCBzZW5kUmVzcG9uc2UpO1xuICAgICAgICAgIF92YWxpZGF0ZVBhZ2VBY3Rpb24oc2VuZGVyKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIkhBU19JTlNFUlRJT05fRVJST1JTXCI6XG4gICAgICAgICAgY2hhbmdlUGFnZUFjdGlvblRvRXJyb3JJY29uKHJlcSwgc2VuZGVyKTtcbiAgICAgICAgICBhZGRGbGFnKHJlcSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJHRVRfSU5TRVJUSU9OX0VSUk9SU1wiOlxuICAgICAgICAgIGdldEluc2VydGlvbkVycm9ycyhzZW5kUmVzcG9uc2UpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3I6IFVua25vd24gcmVxdWVzdC5cIik7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICAgIH1cbiAgICB9XG4gICk7XG5cblxuICBmdW5jdGlvbiBwdXRNZW1vKHJlcSwgcmVzKSB7XG4gICAgc3RvcmUuc2F2ZShyZXEuZGF0YSlcbiAgICAgIC50aGVuKGRhdGEgPT5yZXMoeyBzdGF0dXM6ICdzdWNjZXNzJywgZGF0YTogZGF0YSB9KSlcbiAgICAgIC5jYXRjaChlcnIgPT4gcmVzKHsgc3RhdHVzOiAnZXJyb3InLCBlcnJvck1lc3NhZ2U6IGVyciB9KSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWxldGVNZW1vKHJlcSwgcmVzKSB7XG4gICAgc3RvcmUucmVtb3ZlKHJlcS5kYXRhKVxuICAgICAgLnRoZW4ocmVzKHsgc3RhdHVzOiAnc3VjY2VzcycgfSkpXG4gICAgICAuY2F0Y2gocmVzKHsgc3RhdHVzOiAnZXJyb3InIH0pKVxuICB9XG5cbiAgZnVuY3Rpb24gY2hhbmdlUGFnZUFjdGlvblRvRXJyb3JJY29uKHJlcSwgc2VuZGVyKSB7XG4gICAgY2hyb21lLnBhZ2VBY3Rpb24uc2V0VGl0bGUoe1xuICAgICAgdGFiSWQ6IHNlbmRlci50YWIuaWQsXG4gICAgICB0aXRsZTogYFNhc2hpa29taSBoYXMgaW5zZXJ0aW9uIGVycm9yKCR7cmVxLmRhdGEubGVuZ3RofSlgXG4gICAgfSk7XG4gICAgY2hyb21lLnBhZ2VBY3Rpb24uc2V0SWNvbih7XG4gICAgICB0YWJJZDogc2VuZGVyLnRhYi5pZCxcbiAgICAgIHBhdGg6IFwiaWNvbnMvaWNvbjE5X2Vycm9yLnBuZ1wiXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZEZsYWcocmVxKSB7XG4gICAgc3RvcmUuYWRkSW5zZXJ0aW9uRXJyb3JGbGFnKHJlcS5kYXRhKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SW5zZXJ0aW9uRXJyb3JzKHJlcykge1xuICAgIGxldCB1cmwgPSBzZXNzaW9uU3RvcmFnZS5pbnNldGlvbkVycm9yVVJMO1xuICAgIHN0b3JlLmdldEluc2VydGlvbkVycm9yRGF0YSh1cmwpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgcmVzKHsgc3RhdHVzOiAnc3VjY2VzcycsIGRhdGE6IHsgdXJsOiB1cmwsIGVycm9yczogZGF0YSB9IH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGUgPT4gY29uc29sZS5lcnJvcihlKSlcbiAgfVxuXG5cbiAgZnVuY3Rpb24gX3ZhbGlkYXRlUGFnZUFjdGlvbihzZW5kZXIpIHtcbiAgICAvKlxuICAgICogIG1lbW/jga7mlbDjgavlv5zjgZjjgabjgIFwYWdlIGFjdGlvbuOCkuaTjeS9nFxuICAgICogIG1lbW/jga51cmzjgadtZW1v44Gu44Kr44Km44Oz44OI44KS6Kq/44G544KLXG4gICAgKiAgbWVtb+OBjOOBguOCjOOBsHBhZ2VBY3Rpb24uc2hvd1xuICAgICogIOOBquOBkeOCjOOBsGhpZGVcbiAgICAqICBwdXRNZW1v44GoZGVsZXRlTWVtb+OBruOCv+OCpOODn+ODs+OCsOOBp+Wun+ihjFxuICAgICovXG4gICAgbGV0IHVybCA9IHNlbmRlci51cmw7XG4gICAgbGV0IHRhYklkID0gc2VuZGVyLnRhYi5pZDtcblxuICAgIHN0b3JlLmdldE1lbW9zQnlVcmwodXJsKVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGlmIChkYXRhLmxlbmd0aCkge1xuICAgICAgICAgIGNocm9tZS5wYWdlQWN0aW9uLnNob3codGFiSWQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2hyb21lLnBhZ2VBY3Rpb24uaGlkZSh0YWJJZClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgfVxufSkoKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9iZy9tZXNzYWdlX2xpc3RlbmVyLmpzXG4gKiovIiwiaW1wb3J0IERleGllIGZyb20gJ2RleGllJ1xuaW1wb3J0IF8gZnJvbSAnLi4vdXRpbCdcblxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgU2NoZW1hXG4qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4qIG1lbW9zOlxuKiAtLS0tLS0tXG4gIGlkOiAxIC8vIGF1dG8gaW5jcmVtZW50LCBpbmRleFxuICB1cmw6ICcnLCAvLyBpbmRleCxcbiAgdGFyZ2V0RWxtUGF0aDogJ2VsZW1lbnQnLFxuICBjb250ZW50VGV4dDogJ3RleHQgb3IgbWFya2Rvd24nXG4qL1xuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuKiBTZXR1cFxuKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuZXhwb3J0IGNvbnN0IGRiID0gKCgpID0+IHtcbiAgbGV0IGRiID0gbmV3IERleGllKCdTYXNoaWtvbWlEQicpO1xuICBkYi52ZXJzaW9uKDEpLnN0b3Jlcyh7IG1lbW9zOiBcIisraWQsIHVybFwiIH0pO1xuICBkYi5vcGVuKCk7XG4gIHJldHVybiBkYlxufSkoKTtcblxuLypcbiog5paw6KaP55m76Yyy44O75pu05pawXG4qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4qIOaWsOimj+eZu+mMsuOBruWgtOWQiOOAgSB1cmwsIHRhcmdldEVsbSwgY29udGVudFRleHTjgpLjgqrjg5bjgrjjgqfjgq/jg4jjgafmuKHjgZlcbiog5pu05paw44Gu5aC05ZCI44CBaWQsIHVybCwgdGFyZ2V0RWxtLCBjb250ZW50VGV4dOOCkuOCquODluOCuOOCp+OCr+ODiOOBp+a4oeOBmVxuKiBfLnBpY2vjgafnmbvpjLLjg7vmm7TmlrDjgavlv4XopoHjgapkYXRh44KS5YaF6YOo44Gn5rG65a6a44GZ44KL44KI44GG44GX44Gm44GE44KL44Gf44KB44CBUmVhY3Tjga5zdGF0ZeOCkuOBneOBruOBvuOBvua4oeOBm+OCi1xuKiDov5TjgorlgKQ6IFByb21pc2XjgIJ0aGVu44Gu5byV5pWw44Gr5paw6KaP55m76Yyy44O75pu05paw44GV44KM44GfMeS7tuOBruOCquODluOCuOOCp+OCr+ODiOOBjOa4oeOCi1xuXG5leClcbnN0b3JlLiRwdXQobmV3X21lbW8pXG4gIC50aGVuKGRhdGEgPT4gY29uc29sZS5sb2coJ3N1Y2Nlc3MnLCBkYXRhKSlcbiAgLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKTtcbiogKi9cbmV4cG9ydCBmdW5jdGlvbiBzYXZlKG9iaikge1xuICBsZXQgZGF0YSA9IF8ucGljayhvYmosIFsnaWQnLCAndXJsJywgJ3RhcmdldEVsbVBhdGgnLCAnY29udGVudFRleHQnXSk7XG4gIHJldHVybiBkYi50cmFuc2FjdGlvbigncncnLCBkYi5tZW1vcywgKCkgPT4ge1xuICAgIHJldHVybiBkYi5tZW1vcy5wdXQoZGF0YSlcbiAgICAgIC50aGVuKGlkID0+IGRiLm1lbW9zLmdldChpZCkpXG4gIH0pXG59XG5cblxuLypcbiogTWVtb+OBruWJiumZpFxuKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4qIOW8leaVsDogT2JqZWN0XG4qIOi/lOOCiuWApDogUHJvbWlzZSh1bmRlZmluZWQpXG4qIGNhdGNoKCnjgYznmbrngavjgZfjgarjgZHjgozjgbDliYrpmaTjgYzmiJDlip/jgZfjgZ/jgoLjga7jgajjgZnjgovjgIJcbiog5a2Y5Zyo44GX44Gq44GESUTjgYzmuKHjgZXjgozjgabjgoLkvovlpJbjga/otbfjgY3jgarjgYTjgILjgarjgavjgoLotbfjgY3jgarjgYTjgIJcblxuZXgpXG4kZGVsZXRlKDIpXG4gIC50aGVuKHN0b3JlLmRiLm1lbW9zLmNvdW50KGNvdW50ID0+IGNvbnNvbGUubG9nKGNvdW50KSkpXG4gIC5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyKSk7XG4qICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlKG9iaikge1xuICBsZXQgaWQgPSBvYmouaWQgfHwgLTE7XG4gIHJldHVybiBkYi50cmFuc2FjdGlvbigncncnLCBkYi5tZW1vcywgKCkgPT4ge1xuICAgIHJldHVybiBkYi5tZW1vcy5kZWxldGUoaWQpXG4gIH0pXG59XG5cblxuLypcbiogVVJM44Gr44KI44KLTWVtb+OBruaknOe0olxuKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4qIOW8leaVsDogdXJsXG4qIOi/lOOCiuWApDogUHJvbWlzZShhcnJheSlcbiog5a2Y5Zyo44GX44Gq44GEVVJM44Gu5aC05ZCI44KC56m644Gu6YWN5YiX44GM6L+U44KLXG4qIGRhdGHjga7mnInnhKHliKTlrprjgpLjgZvjgZrjgIFjb250ZW50X3NjcmlwdOOBq+mFjeWIl+OCkuaKleOBkuOAgVxuKiBjb250ZW50X3NjcmlwdOWGheOBp+mFjeWIl+WIhuOBoOOBkXJlbmRlcuOBmeOCi+OCiOOBhuOBq+S9v+OBhlxuXG5leClcbiRnZXRNZW1vc0J5VXJsKCdodHRwLy86ZXhhbXBsZS5jby5qcCcpXG4gIC50aGVuKG1lbW9zID0+IHtjb25zb2xlLmxvZyhtZW1vcyl9KVxuICAuY2F0Y2goZXJyID0+IGNvbnNvbGUubG9nKGVycikpO1xuKiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE1lbW9zQnlVcmwodXJsKSB7XG4gIHJldHVybiBkYi50cmFuc2FjdGlvbigncncnLCBkYi5tZW1vcywgKCkgPT4ge1xuICAgIHJldHVybiBkYi5tZW1vcy53aGVyZSgndXJsJykuZXF1YWxzKHVybCkudG9BcnJheSgpXG4gIH0pXG59XG5cbi8qXG4qIEluc2VydGlvbkVycm9y44OV44Op44Kw44KS6L+95Yqg44GZ44KLXG4qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4qIOmFjeWIl+OCquODluOCuOOCp+OCr+ODiOOCkuWPl+OBkeWPluOCijHku7bmr47jgatfaW5zZXJ0aW9uRXJyb3Ljg5Xjg6njgrDjgpLnq4vjgabjgotcbiogKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRJbnNlcnRpb25FcnJvckZsYWcobWVtb3MgPSBbXSkge1xuICBsZXQgX21lbW9zID0gbWVtb3MubWFwKG1lbW8gPT4ge1xuICAgIGxldCBfZGF0YSA9IF8ucGljayhtZW1vLCBbJ2lkJywgJ3VybCcsICd0YXJnZXRFbG1QYXRoJywgJ2NvbnRlbnRUZXh0J10pO1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBfZGF0YSwgeyBpbnNlcnRpb25FcnJvcjogdHJ1ZSB9KTtcbiAgfSk7XG5cbiAgZGIudHJhbnNhY3Rpb24oJ3J3JywgZGIubWVtb3MsICgpID0+IF9tZW1vcy5mb3JFYWNoKG1lbW8gPT4gZGIubWVtb3MucHV0KG1lbW8pKSlcbiAgICAuY2F0Y2goZXJyID0+IGNvbnNvbGUubG9nKGVycikpXG59XG5cbi8qXG4qIEluc2VydEVycm9y44GM5LuY44GE44GfZGF0YeOCkuaknOe0olxuKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiogVVJM44KS5Y+X44GR5Y+W44KKSW5zZXJ0RXJyb3LjgYzku5jjgYTjgabjgYTjgotkYXRh44KS5Y+W5b6XXG4qIOi/lOOCiuWApDogUHJvbWlzZShhcnJheSlcbipcbiogZXgpXG5zdG9yZS5nZXRJbnNlcnRpb25FcnJvckRhdGEoc2VuZGVyLnVybClcbiAgLnRoZW4oZGF0YSA9PiBjb25zb2xlLmxvZyhkYXRhKSk7XG4qICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5zZXJ0aW9uRXJyb3JEYXRhKHVybCkge1xuICByZXR1cm4gZ2V0TWVtb3NCeVVybCh1cmwpXG4gICAgLnRoZW4obWVtb3MgPT4ge1xuICAgICAgcmV0dXJuIG1lbW9zLmZpbHRlcihtZW1vID0+IHtcbiAgICAgICAgaWYgKG1lbW8uaW5zZXJ0aW9uRXJyb3IpIHJldHVybiBtZW1vXG4gICAgICB9KVxuICAgIH0pXG4gICAgLmNhdGNoKGUgPT4gY29uc29sZS5sb2coZSkpXG59XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvYmcvc3RvcmUuanNcbiAqKi8iLCIvKiBBIE1pbmltYWxpc3RpYyBXcmFwcGVyIGZvciBJbmRleGVkREJcbiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICBCeSBEYXZpZCBGYWhsYW5kZXIsIGRhdmlkLmZhaGxhbmRlckBnbWFpbC5jb21cblxuICAgVmVyc2lvbiAxLjIuMCAtIFNlcHRlbWJlciAyMiwgMjAxNS5cblxuICAgVGVzdGVkIHN1Y2Nlc3NmdWxseSBvbiBDaHJvbWUsIE9wZXJhLCBGaXJlZm94LCBFZGdlLCBhbmQgSUUuXG5cbiAgIE9mZmljaWFsIFdlYnNpdGU6IHd3dy5kZXhpZS5jb21cblxuICAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlIFZlcnNpb24gMi4wLCBKYW51YXJ5IDIwMDQsIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9cbiovXG4oZnVuY3Rpb24gKGdsb2JhbCwgcHVibGlzaCwgdW5kZWZpbmVkKSB7XG5cbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIGZ1bmN0aW9uIGV4dGVuZChvYmosIGV4dGVuc2lvbikge1xuICAgICAgICBpZiAodHlwZW9mIGV4dGVuc2lvbiAhPT0gJ29iamVjdCcpIGV4dGVuc2lvbiA9IGV4dGVuc2lvbigpOyAvLyBBbGxvdyB0byBzdXBwbHkgYSBmdW5jdGlvbiByZXR1cm5pbmcgdGhlIGV4dGVuc2lvbi4gVXNlZnVsIGZvciBzaW1wbGlmeWluZyBwcml2YXRlIHNjb3Blcy5cbiAgICAgICAgT2JqZWN0LmtleXMoZXh0ZW5zaW9uKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gZXh0ZW5zaW9uW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlcml2ZShDaGlsZCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJvbTogZnVuY3Rpb24gKFBhcmVudCkge1xuICAgICAgICAgICAgICAgIENoaWxkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGFyZW50LnByb3RvdHlwZSk7XG4gICAgICAgICAgICAgICAgQ2hpbGQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ2hpbGQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5kOiBmdW5jdGlvbiAoZXh0ZW5zaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleHRlbmQoQ2hpbGQucHJvdG90eXBlLCB0eXBlb2YgZXh0ZW5zaW9uICE9PSAnb2JqZWN0JyA/IGV4dGVuc2lvbihQYXJlbnQucHJvdG90eXBlKSA6IGV4dGVuc2lvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG92ZXJyaWRlKG9yaWdGdW5jLCBvdmVycmlkZWRGYWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBvdmVycmlkZWRGYWN0b3J5KG9yaWdGdW5jKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBEZXhpZShkYk5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwib3B0aW9uc1wiIHR5cGU9XCJPYmplY3RcIiBvcHRpb25hbD1cInRydWVcIj5TcGVjaWZ5IG9ubHkgaWYgeW91IHdpY2ggdG8gY29udHJvbCB3aGljaCBhZGRvbnMgdGhhdCBzaG91bGQgcnVuIG9uIHRoaXMgaW5zdGFuY2U8L3BhcmFtPlxuICAgICAgICB2YXIgYWRkb25zID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5hZGRvbnMpIHx8IERleGllLmFkZG9ucztcbiAgICAgICAgLy8gUmVzb2x2ZSBhbGwgZXh0ZXJuYWwgZGVwZW5kZW5jaWVzOlxuICAgICAgICB2YXIgZGVwcyA9IERleGllLmRlcGVuZGVuY2llcztcbiAgICAgICAgdmFyIGluZGV4ZWREQiA9IGRlcHMuaW5kZXhlZERCLFxuICAgICAgICAgICAgSURCS2V5UmFuZ2UgPSBkZXBzLklEQktleVJhbmdlLFxuICAgICAgICAgICAgSURCVHJhbnNhY3Rpb24gPSBkZXBzLklEQlRyYW5zYWN0aW9uO1xuXG4gICAgICAgIHZhciBET01FcnJvciA9IGRlcHMuRE9NRXJyb3IsXG4gICAgICAgICAgICBUeXBlRXJyb3IgPSBkZXBzLlR5cGVFcnJvcixcbiAgICAgICAgICAgIEVycm9yID0gZGVwcy5FcnJvcjtcblxuICAgICAgICB2YXIgZ2xvYmFsU2NoZW1hID0gdGhpcy5fZGJTY2hlbWEgPSB7fTtcbiAgICAgICAgdmFyIHZlcnNpb25zID0gW107XG4gICAgICAgIHZhciBkYlN0b3JlTmFtZXMgPSBbXTtcbiAgICAgICAgdmFyIGFsbFRhYmxlcyA9IHt9O1xuICAgICAgICB2YXIgbm90SW5UcmFuc0ZhbGxiYWNrVGFibGVzID0ge307XG4gICAgICAgIC8vLzx2YXIgdHlwZT1cIklEQkRhdGFiYXNlXCIgLz5cbiAgICAgICAgdmFyIGlkYmRiID0gbnVsbDsgLy8gSW5zdGFuY2Ugb2YgSURCRGF0YWJhc2VcbiAgICAgICAgdmFyIGRiX2lzX2Jsb2NrZWQgPSB0cnVlO1xuICAgICAgICB2YXIgZGJPcGVuRXJyb3IgPSBudWxsO1xuICAgICAgICB2YXIgaXNCZWluZ09wZW5lZCA9IGZhbHNlO1xuICAgICAgICB2YXIgUkVBRE9OTFkgPSBcInJlYWRvbmx5XCIsIFJFQURXUklURSA9IFwicmVhZHdyaXRlXCI7XG4gICAgICAgIHZhciBkYiA9IHRoaXM7XG4gICAgICAgIHZhciBwYXVzZWRSZXN1bWVhYmxlcyA9IFtdO1xuICAgICAgICB2YXIgYXV0b1NjaGVtYSA9IHRydWU7XG4gICAgICAgIHZhciBoYXNOYXRpdmVHZXREYXRhYmFzZU5hbWVzID0gISFnZXROYXRpdmVHZXREYXRhYmFzZU5hbWVzRm4oKTtcblxuICAgICAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICAgICAgLy8gSWYgYnJvd3NlciAobm90IG5vZGUuanMgb3Igb3RoZXIpLCBzdWJzY3JpYmUgdG8gdmVyc2lvbmNoYW5nZSBldmVudCBhbmQgcmVsb2FkIHBhZ2VcbiAgICAgICAgICAgIGRiLm9uKFwidmVyc2lvbmNoYW5nZVwiLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IGJlaGF2aW9yIGZvciB2ZXJzaW9uY2hhbmdlIGV2ZW50IGlzIHRvIGNsb3NlIGRhdGFiYXNlIGNvbm5lY3Rpb24uXG4gICAgICAgICAgICAgICAgLy8gQ2FsbGVyIGNhbiBvdmVycmlkZSB0aGlzIGJlaGF2aW9yIGJ5IGRvaW5nIGRiLm9uKFwidmVyc2lvbmNoYW5nZVwiLCBmdW5jdGlvbigpeyByZXR1cm4gZmFsc2U7IH0pO1xuICAgICAgICAgICAgICAgIC8vIExldCdzIG5vdCBibG9jayB0aGUgb3RoZXIgd2luZG93IGZyb20gbWFraW5nIGl0J3MgZGVsZXRlKCkgb3Igb3BlbigpIGNhbGwuXG4gICAgICAgICAgICAgICAgZGIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBkYi5vbignZXJyb3InKS5maXJlKG5ldyBFcnJvcihcIkRhdGFiYXNlIHZlcnNpb24gY2hhbmdlZCBieSBvdGhlciBkYXRhYmFzZSBjb25uZWN0aW9uLlwiKSk7XG4gICAgICAgICAgICAgICAgLy8gSW4gbWFueSB3ZWIgYXBwbGljYXRpb25zLCBpdCB3b3VsZCBiZSByZWNvbW1lbmRlZCB0byBmb3JjZSB3aW5kb3cucmVsb2FkKClcbiAgICAgICAgICAgICAgICAvLyB3aGVuIHRoaXMgZXZlbnQgb2NjdXJzLiBEbyBkbyB0aGF0LCBzdWJzY3JpYmUgdG8gdGhlIHZlcnNpb25jaGFuZ2UgZXZlbnRcbiAgICAgICAgICAgICAgICAvLyBhbmQgY2FsbCB3aW5kb3cubG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFZlcnNpb25pbmcgRnJhbWV3b3JrLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG5cbiAgICAgICAgdGhpcy52ZXJzaW9uID0gZnVuY3Rpb24gKHZlcnNpb25OdW1iZXIpIHtcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInZlcnNpb25OdW1iZXJcIiB0eXBlPVwiTnVtYmVyXCI+PC9wYXJhbT5cbiAgICAgICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwiVmVyc2lvblwiPjwvcmV0dXJucz5cbiAgICAgICAgICAgIGlmIChpZGJkYikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGFkZCB2ZXJzaW9uIHdoZW4gZGF0YWJhc2UgaXMgb3BlblwiKTtcbiAgICAgICAgICAgIHRoaXMudmVybm8gPSBNYXRoLm1heCh0aGlzLnZlcm5vLCB2ZXJzaW9uTnVtYmVyKTtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uSW5zdGFuY2UgPSB2ZXJzaW9ucy5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYuX2NmZy52ZXJzaW9uID09PSB2ZXJzaW9uTnVtYmVyOyB9KVswXTtcbiAgICAgICAgICAgIGlmICh2ZXJzaW9uSW5zdGFuY2UpIHJldHVybiB2ZXJzaW9uSW5zdGFuY2U7XG4gICAgICAgICAgICB2ZXJzaW9uSW5zdGFuY2UgPSBuZXcgVmVyc2lvbih2ZXJzaW9uTnVtYmVyKTtcbiAgICAgICAgICAgIHZlcnNpb25zLnB1c2godmVyc2lvbkluc3RhbmNlKTtcbiAgICAgICAgICAgIHZlcnNpb25zLnNvcnQobG93ZXJWZXJzaW9uRmlyc3QpO1xuICAgICAgICAgICAgcmV0dXJuIHZlcnNpb25JbnN0YW5jZTtcbiAgICAgICAgfTsgXG5cbiAgICAgICAgZnVuY3Rpb24gVmVyc2lvbih2ZXJzaW9uTnVtYmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9jZmcgPSB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdmVyc2lvbk51bWJlcixcbiAgICAgICAgICAgICAgICBzdG9yZXNTb3VyY2U6IG51bGwsXG4gICAgICAgICAgICAgICAgZGJzY2hlbWE6IHt9LFxuICAgICAgICAgICAgICAgIHRhYmxlczoge30sXG4gICAgICAgICAgICAgICAgY29udGVudFVwZ3JhZGU6IG51bGxcbiAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgdGhpcy5zdG9yZXMoe30pOyAvLyBEZXJpdmUgZWFybGllciBzY2hlbWFzIGJ5IGRlZmF1bHQuXG4gICAgICAgIH1cblxuICAgICAgICBleHRlbmQoVmVyc2lvbi5wcm90b3R5cGUsIHtcbiAgICAgICAgICAgIHN0b3JlczogZnVuY3Rpb24gKHN0b3Jlcykge1xuICAgICAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgICAgICAgICAvLy8gICBEZWZpbmVzIHRoZSBzY2hlbWEgZm9yIGEgcGFydGljdWxhciB2ZXJzaW9uXG4gICAgICAgICAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJzdG9yZXNcIiB0eXBlPVwiT2JqZWN0XCI+XG4gICAgICAgICAgICAgICAgLy8vIEV4YW1wbGU6IDxici8+XG4gICAgICAgICAgICAgICAgLy8vICAge3VzZXJzOiBcImlkKyssZmlyc3QsbGFzdCwmYW1wO3VzZXJuYW1lLCplbWFpbFwiLCA8YnIvPlxuICAgICAgICAgICAgICAgIC8vLyAgIHBhc3N3b3JkczogXCJpZCsrLCZhbXA7dXNlcm5hbWVcIn08YnIvPlxuICAgICAgICAgICAgICAgIC8vLyA8YnIvPlxuICAgICAgICAgICAgICAgIC8vLyBTeW50YXg6IHtUYWJsZTogXCJbcHJpbWFyeUtleV1bKytdLFsmYW1wO11bKl1pbmRleDEsWyZhbXA7XVsqXWluZGV4MiwuLi5cIn08YnIvPjxici8+XG4gICAgICAgICAgICAgICAgLy8vIFNwZWNpYWwgY2hhcmFjdGVyczo8YnIvPlxuICAgICAgICAgICAgICAgIC8vLyAgXCImYW1wO1wiICBtZWFucyB1bmlxdWUga2V5LCA8YnIvPlxuICAgICAgICAgICAgICAgIC8vLyAgXCIqXCIgIG1lYW5zIHZhbHVlIGlzIG11bHRpRW50cnksIDxici8+XG4gICAgICAgICAgICAgICAgLy8vICBcIisrXCIgbWVhbnMgYXV0by1pbmNyZW1lbnQgYW5kIG9ubHkgYXBwbGljYWJsZSBmb3IgcHJpbWFyeSBrZXkgPGJyLz5cbiAgICAgICAgICAgICAgICAvLy8gPC9wYXJhbT5cbiAgICAgICAgICAgICAgICB0aGlzLl9jZmcuc3RvcmVzU291cmNlID0gdGhpcy5fY2ZnLnN0b3Jlc1NvdXJjZSA/IGV4dGVuZCh0aGlzLl9jZmcuc3RvcmVzU291cmNlLCBzdG9yZXMpIDogc3RvcmVzO1xuXG4gICAgICAgICAgICAgICAgLy8gRGVyaXZlIHN0b3JlcyBmcm9tIGVhcmxpZXIgdmVyc2lvbnMgaWYgdGhleSBhcmUgbm90IGV4cGxpY2l0ZWx5IHNwZWNpZmllZCBhcyBudWxsIG9yIGEgbmV3IHN5bnRheC5cbiAgICAgICAgICAgICAgICB2YXIgc3RvcmVzU3BlYyA9IHt9O1xuICAgICAgICAgICAgICAgIHZlcnNpb25zLmZvckVhY2goZnVuY3Rpb24gKHZlcnNpb24pIHsgLy8gJ3ZlcnNpb25zJyBpcyBhbHdheXMgc29ydGVkIGJ5IGxvd2VzdCB2ZXJzaW9uIGZpcnN0LlxuICAgICAgICAgICAgICAgICAgICBleHRlbmQoc3RvcmVzU3BlYywgdmVyc2lvbi5fY2ZnLnN0b3Jlc1NvdXJjZSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZGJzY2hlbWEgPSAodGhpcy5fY2ZnLmRic2NoZW1hID0ge30pO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcnNlU3RvcmVzU3BlYyhzdG9yZXNTcGVjLCBkYnNjaGVtYSk7XG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBsYXRlc3Qgc2NoZW1hIHRvIHRoaXMgdmVyc2lvblxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBBUElcbiAgICAgICAgICAgICAgICBnbG9iYWxTY2hlbWEgPSBkYi5fZGJTY2hlbWEgPSBkYnNjaGVtYTtcbiAgICAgICAgICAgICAgICByZW1vdmVUYWJsZXNBcGkoW2FsbFRhYmxlcywgZGIsIG5vdEluVHJhbnNGYWxsYmFja1RhYmxlc10pO1xuICAgICAgICAgICAgICAgIHNldEFwaU9uUGxhY2UoW25vdEluVHJhbnNGYWxsYmFja1RhYmxlc10sIHRhYmxlTm90SW5UcmFuc2FjdGlvbiwgT2JqZWN0LmtleXMoZGJzY2hlbWEpLCBSRUFEV1JJVEUsIGRic2NoZW1hKTtcbiAgICAgICAgICAgICAgICBzZXRBcGlPblBsYWNlKFthbGxUYWJsZXMsIGRiLCB0aGlzLl9jZmcudGFibGVzXSwgZGIuX3RyYW5zUHJvbWlzZUZhY3RvcnksIE9iamVjdC5rZXlzKGRic2NoZW1hKSwgUkVBRFdSSVRFLCBkYnNjaGVtYSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgZGJTdG9yZU5hbWVzID0gT2JqZWN0LmtleXMoZGJzY2hlbWEpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwZ3JhZGU6IGZ1bmN0aW9uICh1cGdyYWRlRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJ1cGdyYWRlRnVuY3Rpb25cIiBvcHRpb25hbD1cInRydWVcIj5GdW5jdGlvbiB0aGF0IHBlcmZvcm1zIHVwZ3JhZGluZyBhY3Rpb25zLjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGZha2VBdXRvQ29tcGxldGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB1cGdyYWRlRnVuY3Rpb24oZGIuX2NyZWF0ZVRyYW5zYWN0aW9uKFJFQURXUklURSwgT2JqZWN0LmtleXMoc2VsZi5fY2ZnLmRic2NoZW1hKSwgc2VsZi5fY2ZnLmRic2NoZW1hKSk7Ly8gQlVHQlVHOiBObyBjb2RlIGNvbXBsZXRpb24gZm9yIHByZXYgdmVyc2lvbidzIHRhYmxlcyB3b250IGFwcGVhci5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jZmcuY29udGVudFVwZ3JhZGUgPSB1cGdyYWRlRnVuY3Rpb247XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX3BhcnNlU3RvcmVzU3BlYzogZnVuY3Rpb24gKHN0b3Jlcywgb3V0U2NoZW1hKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoc3RvcmVzKS5mb3JFYWNoKGZ1bmN0aW9uICh0YWJsZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3Jlc1t0YWJsZU5hbWVdICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5zdGFuY2VUZW1wbGF0ZSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ZXMgPSBwYXJzZUluZGV4U3ludGF4KHN0b3Jlc1t0YWJsZU5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmltS2V5ID0gaW5kZXhlcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByaW1LZXkubXVsdGkpIHRocm93IG5ldyBFcnJvcihcIlByaW1hcnkga2V5IGNhbm5vdCBiZSBtdWx0aS12YWx1ZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJpbUtleS5rZXlQYXRoKSBzZXRCeUtleVBhdGgoaW5zdGFuY2VUZW1wbGF0ZSwgcHJpbUtleS5rZXlQYXRoLCBwcmltS2V5LmF1dG8gPyAwIDogcHJpbUtleS5rZXlQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ZXMuZm9yRWFjaChmdW5jdGlvbiAoaWR4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlkeC5hdXRvKSB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IHByaW1hcnkga2V5IGNhbiBiZSBtYXJrZWQgYXMgYXV0b0luY3JlbWVudCAoKyspXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaWR4LmtleVBhdGgpIHRocm93IG5ldyBFcnJvcihcIkluZGV4IG11c3QgaGF2ZSBhIG5hbWUgYW5kIGNhbm5vdCBiZSBhbiBlbXB0eSBzdHJpbmdcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QnlLZXlQYXRoKGluc3RhbmNlVGVtcGxhdGUsIGlkeC5rZXlQYXRoLCBpZHguY29tcG91bmQgPyBpZHgua2V5UGF0aC5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gXCJcIjsgfSkgOiBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0U2NoZW1hW3RhYmxlTmFtZV0gPSBuZXcgVGFibGVTY2hlbWEodGFibGVOYW1lLCBwcmltS2V5LCBpbmRleGVzLCBpbnN0YW5jZVRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBydW5VcGdyYWRlcnMob2xkVmVyc2lvbiwgaWRidHJhbnMsIHJlamVjdCwgb3BlblJlcSkge1xuICAgICAgICAgICAgaWYgKG9sZFZlcnNpb24gPT09IDApIHtcbiAgICAgICAgICAgICAgICAvL2dsb2JhbFNjaGVtYSA9IHZlcnNpb25zW3ZlcnNpb25zLmxlbmd0aCAtIDFdLl9jZmcuZGJzY2hlbWE7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRhYmxlczpcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhnbG9iYWxTY2hlbWEpLmZvckVhY2goZnVuY3Rpb24gKHRhYmxlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjcmVhdGVUYWJsZShpZGJ0cmFucywgdGFibGVOYW1lLCBnbG9iYWxTY2hlbWFbdGFibGVOYW1lXS5wcmltS2V5LCBnbG9iYWxTY2hlbWFbdGFibGVOYW1lXS5pbmRleGVzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyBQb3B1bGF0ZSBkYXRhXG4gICAgICAgICAgICAgICAgdmFyIHQgPSBkYi5fY3JlYXRlVHJhbnNhY3Rpb24oUkVBRFdSSVRFLCBkYlN0b3JlTmFtZXMsIGdsb2JhbFNjaGVtYSk7XG4gICAgICAgICAgICAgICAgdC5pZGJ0cmFucyA9IGlkYnRyYW5zO1xuICAgICAgICAgICAgICAgIHQuaWRidHJhbnMub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIFtcInBvcHVsYXRpbmcgZGF0YWJhc2VcIl0pO1xuICAgICAgICAgICAgICAgIHQub24oJ2Vycm9yJykuc3Vic2NyaWJlKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgUHJvbWlzZS5uZXdQU0QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBQcm9taXNlLlBTRC50cmFucyA9IHQ7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYi5vbihcInBvcHVsYXRlXCIpLmZpcmUodCk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlblJlcS5vbmVycm9yID0gaWRidHJhbnMub25lcnJvciA9IGZ1bmN0aW9uIChldikgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyB9OyAgLy8gUHJvaGliaXQgQWJvcnRFcnJvciBmaXJlIG9uIGRiLm9uKFwiZXJyb3JcIikgaW4gRmlyZWZveC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7IGlkYnRyYW5zLmFib3J0KCk7IH0gY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWRidHJhbnMuZGIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFVwZ3JhZGUgdmVyc2lvbiB0byB2ZXJzaW9uLCBzdGVwLWJ5LXN0ZXAgZnJvbSBvbGRlc3QgdG8gbmV3ZXN0IHZlcnNpb24uXG4gICAgICAgICAgICAgICAgLy8gRWFjaCB0cmFuc2FjdGlvbiBvYmplY3Qgd2lsbCBjb250YWluIHRoZSB0YWJsZSBzZXQgdGhhdCB3YXMgY3VycmVudCBpbiB0aGF0IHZlcnNpb24gKGJ1dCBhbHNvIG5vdC15ZXQtZGVsZXRlZCB0YWJsZXMgZnJvbSBpdHMgcHJldmlvdXMgdmVyc2lvbilcbiAgICAgICAgICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgb2xkVmVyc2lvblN0cnVjdCA9IHZlcnNpb25zLmZpbHRlcihmdW5jdGlvbiAodmVyc2lvbikgeyByZXR1cm4gdmVyc2lvbi5fY2ZnLnZlcnNpb24gPT09IG9sZFZlcnNpb247IH0pWzBdO1xuICAgICAgICAgICAgICAgIGlmICghb2xkVmVyc2lvblN0cnVjdCkgdGhyb3cgbmV3IEVycm9yKFwiRGV4aWUgc3BlY2lmaWNhdGlvbiBvZiBjdXJyZW50bHkgaW5zdGFsbGVkIERCIHZlcnNpb24gaXMgbWlzc2luZ1wiKTtcbiAgICAgICAgICAgICAgICBnbG9iYWxTY2hlbWEgPSBkYi5fZGJTY2hlbWEgPSBvbGRWZXJzaW9uU3RydWN0Ll9jZmcuZGJzY2hlbWE7XG4gICAgICAgICAgICAgICAgdmFyIGFueUNvbnRlbnRVcGdyYWRlckhhc1J1biA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgdmFyIHZlcnNUb1J1biA9IHZlcnNpb25zLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdi5fY2ZnLnZlcnNpb24gPiBvbGRWZXJzaW9uOyB9KTtcbiAgICAgICAgICAgICAgICB2ZXJzVG9SdW4uZm9yRWFjaChmdW5jdGlvbiAodmVyc2lvbikge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJ2ZXJzaW9uXCIgdHlwZT1cIlZlcnNpb25cIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkU2NoZW1hID0gZ2xvYmFsU2NoZW1hO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3U2NoZW1hID0gdmVyc2lvbi5fY2ZnLmRic2NoZW1hO1xuICAgICAgICAgICAgICAgICAgICBhZGp1c3RUb0V4aXN0aW5nSW5kZXhOYW1lcyhvbGRTY2hlbWEsIGlkYnRyYW5zKTtcbiAgICAgICAgICAgICAgICAgICAgYWRqdXN0VG9FeGlzdGluZ0luZGV4TmFtZXMobmV3U2NoZW1hLCBpZGJ0cmFucyk7XG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbFNjaGVtYSA9IGRiLl9kYlNjaGVtYSA9IG5ld1NjaGVtYTtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBnZXRTY2hlbWFEaWZmKG9sZFNjaGVtYSwgbmV3U2NoZW1hKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYuYWRkLmZvckVhY2goZnVuY3Rpb24gKHR1cGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUucHVzaChmdW5jdGlvbiAoaWRidHJhbnMsIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZVRhYmxlKGlkYnRyYW5zLCB0dXBsZVswXSwgdHVwbGVbMV0ucHJpbUtleSwgdHVwbGVbMV0uaW5kZXhlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYuY2hhbmdlLmZvckVhY2goZnVuY3Rpb24gKGNoYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2UucmVjcmVhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IHlldCBzdXBwb3J0IGZvciBjaGFuZ2luZyBwcmltYXJ5IGtleVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKGZ1bmN0aW9uIChpZGJ0cmFucywgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IGlkYnRyYW5zLm9iamVjdFN0b3JlKGNoYW5nZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZS5hZGQuZm9yRWFjaChmdW5jdGlvbiAoaWR4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkSW5kZXgoc3RvcmUsIGlkeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZS5jaGFuZ2UuZm9yRWFjaChmdW5jdGlvbiAoaWR4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmUuZGVsZXRlSW5kZXgoaWR4Lm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEluZGV4KHN0b3JlLCBpZHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2UuZGVsLmZvckVhY2goZnVuY3Rpb24gKGlkeE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yZS5kZWxldGVJbmRleChpZHhOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmVyc2lvbi5fY2ZnLmNvbnRlbnRVcGdyYWRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUucHVzaChmdW5jdGlvbiAoaWRidHJhbnMsIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFueUNvbnRlbnRVcGdyYWRlckhhc1J1biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ID0gZGIuX2NyZWF0ZVRyYW5zYWN0aW9uKFJFQURXUklURSwgW10uc2xpY2UuY2FsbChpZGJ0cmFucy5kYi5vYmplY3RTdG9yZU5hbWVzLCAwKSwgbmV3U2NoZW1hKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdC5pZGJ0cmFucyA9IGlkYnRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdW5jb21wbGV0ZWRSZXF1ZXN0cyA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQuX3Byb21pc2UgPSBvdmVycmlkZSh0Ll9wcm9taXNlLCBmdW5jdGlvbiAob3JpZ19wcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG1vZGUsIGZuLCB3cml0ZUxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArK3VuY29tcGxldGVkUmVxdWVzdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcHJveHkoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoLS11bmNvbXBsZXRlZFJlcXVlc3RzID09PSAwKSBjYigpOyAvLyBBIGNhbGxlZCBkYiBvcGVyYXRpb24gaGFzIGNvbXBsZXRlZCB3aXRob3V0IHN0YXJ0aW5nIGEgbmV3IG9wZXJhdGlvbi4gVGhlIGZsb3cgaXMgZmluaXNoZWQsIG5vdyBydW4gbmV4dCB1cGdyYWRlci5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3JpZ19wcm9taXNlLmNhbGwodGhpcywgbW9kZSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgdHJhbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzWzBdID0gcHJveHkocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50c1sxXSA9IHByb3h5KHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgd3JpdGVMb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGJ0cmFucy5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgW1wicnVubmluZyB1cGdyYWRlciBmdW5jdGlvbiBmb3IgdmVyc2lvblwiLCB2ZXJzaW9uLl9jZmcudmVyc2lvbl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0Lm9uKCdlcnJvcicpLnN1YnNjcmliZShyZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uLl9jZmcuY29udGVudFVwZ3JhZGUodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bmNvbXBsZXRlZFJlcXVlc3RzID09PSAwKSBjYigpOyAvLyBjb250ZW50VXBncmFkZSgpIGRpZG50IGNhbGwgYW55IGRiIG9wZXJhdGlvbnMgYXQgYWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhbnlDb250ZW50VXBncmFkZXJIYXNSdW4gfHwgIWhhc0lFRGVsZXRlT2JqZWN0U3RvcmVCdWcoKSkgeyAvLyBEb250IGRlbGV0ZSBvbGQgdGFibGVzIGlmIGllQnVnIGlzIHByZXNlbnQgYW5kIGEgY29udGVudCB1cGdyYWRlciBoYXMgcnVuLiBMZXQgdGFibGVzIGJlIGxlZnQgaW4gREIgc28gZmFyLiBUaGlzIG5lZWRzIHRvIGJlIHRha2VuIGNhcmUgb2YuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUucHVzaChmdW5jdGlvbiAoaWRidHJhbnMsIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlbGV0ZSBvbGQgdGFibGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZVJlbW92ZWRUYWJsZXMobmV3U2NoZW1hLCBpZGJ0cmFucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIE5vdywgY3JlYXRlIGEgcXVldWUgZXhlY3V0aW9uIGVuZ2luZVxuICAgICAgICAgICAgICAgIHZhciBydW5OZXh0UXVldWVkRnVuY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnNoaWZ0KCkoaWRidHJhbnMsIHJ1bk5leHRRdWV1ZWRGdW5jdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlTWlzc2luZ1RhYmxlcyhnbG9iYWxTY2hlbWEsIGlkYnRyYW5zKTsgLy8gQXQgbGFzdCwgbWFrZSBzdXJlIHRvIGNyZWF0ZSBhbnkgbWlzc2luZyB0YWJsZXMuIChOZWVkZWQgYnkgYWRkb25zIHRoYXQgYWRkIHN0b3JlcyB0byBEQiB3aXRob3V0IHNwZWNpZnlpbmcgdmVyc2lvbilcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuUmVxLm9uZXJyb3IgPSBpZGJ0cmFucy5vbmVycm9yID0gZnVuY3Rpb24gKGV2KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH07ICAvLyBQcm9oaWJpdCBBYm9ydEVycm9yIGZpcmUgb24gZGIub24oXCJlcnJvclwiKSBpbiBGaXJlZm94LlxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHsgaWRidHJhbnMuYWJvcnQoKTsgfSBjYXRjaChlKSB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgaWRidHJhbnMuZGIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBydW5OZXh0UXVldWVkRnVuY3Rpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldFNjaGVtYURpZmYob2xkU2NoZW1hLCBuZXdTY2hlbWEpIHtcbiAgICAgICAgICAgIHZhciBkaWZmID0ge1xuICAgICAgICAgICAgICAgIGRlbDogW10sIC8vIEFycmF5IG9mIHRhYmxlIG5hbWVzXG4gICAgICAgICAgICAgICAgYWRkOiBbXSwgLy8gQXJyYXkgb2YgW3RhYmxlTmFtZSwgbmV3RGVmaW5pdGlvbl1cbiAgICAgICAgICAgICAgICBjaGFuZ2U6IFtdIC8vIEFycmF5IG9mIHtuYW1lOiB0YWJsZU5hbWUsIHJlY3JlYXRlOiBuZXdEZWZpbml0aW9uLCBkZWw6IGRlbEluZGV4TmFtZXMsIGFkZDogbmV3SW5kZXhEZWZzLCBjaGFuZ2U6IGNoYW5nZWRJbmRleERlZnN9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZm9yICh2YXIgdGFibGUgaW4gb2xkU2NoZW1hKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFuZXdTY2hlbWFbdGFibGVdKSBkaWZmLmRlbC5wdXNoKHRhYmxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIHRhYmxlIGluIG5ld1NjaGVtYSkge1xuICAgICAgICAgICAgICAgIHZhciBvbGREZWYgPSBvbGRTY2hlbWFbdGFibGVdLFxuICAgICAgICAgICAgICAgICAgICBuZXdEZWYgPSBuZXdTY2hlbWFbdGFibGVdO1xuICAgICAgICAgICAgICAgIGlmICghb2xkRGVmKSBkaWZmLmFkZC5wdXNoKFt0YWJsZSwgbmV3RGVmXSk7XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGFuZ2UgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0YWJsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZjogbmV3U2NoZW1hW3RhYmxlXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY3JlYXRlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbDogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGQ6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlOiBbXVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkRGVmLnByaW1LZXkuc3JjICE9PSBuZXdEZWYucHJpbUtleS5zcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByaW1hcnkga2V5IGhhcyBjaGFuZ2VkLiBSZW1vdmUgYW5kIHJlLWFkZCB0YWJsZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZS5yZWNyZWF0ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmLmNoYW5nZS5wdXNoKGNoYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkSW5kZXhlcyA9IG9sZERlZi5pbmRleGVzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VycmVudCkgeyBwcmV2W2N1cnJlbnQubmFtZV0gPSBjdXJyZW50OyByZXR1cm4gcHJldjsgfSwge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0luZGV4ZXMgPSBuZXdEZWYuaW5kZXhlcy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cnJlbnQpIHsgcHJldltjdXJyZW50Lm5hbWVdID0gY3VycmVudDsgcmV0dXJuIHByZXY7IH0sIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeE5hbWUgaW4gb2xkSW5kZXhlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbmV3SW5kZXhlc1tpZHhOYW1lXSkgY2hhbmdlLmRlbC5wdXNoKGlkeE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaWR4TmFtZSBpbiBuZXdJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9sZElkeCA9IG9sZEluZGV4ZXNbaWR4TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0lkeCA9IG5ld0luZGV4ZXNbaWR4TmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvbGRJZHgpIGNoYW5nZS5hZGQucHVzaChuZXdJZHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9sZElkeC5zcmMgIT09IG5ld0lkeC5zcmMpIGNoYW5nZS5jaGFuZ2UucHVzaChuZXdJZHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZS5yZWNyZWF0ZSB8fCBjaGFuZ2UuZGVsLmxlbmd0aCA+IDAgfHwgY2hhbmdlLmFkZC5sZW5ndGggPiAwIHx8IGNoYW5nZS5jaGFuZ2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYuY2hhbmdlLnB1c2goY2hhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkaWZmO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlVGFibGUoaWRidHJhbnMsIHRhYmxlTmFtZSwgcHJpbUtleSwgaW5kZXhlcykge1xuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiaWRidHJhbnNcIiB0eXBlPVwiSURCVHJhbnNhY3Rpb25cIj48L3BhcmFtPlxuICAgICAgICAgICAgdmFyIHN0b3JlID0gaWRidHJhbnMuZGIuY3JlYXRlT2JqZWN0U3RvcmUodGFibGVOYW1lLCBwcmltS2V5LmtleVBhdGggPyB7IGtleVBhdGg6IHByaW1LZXkua2V5UGF0aCwgYXV0b0luY3JlbWVudDogcHJpbUtleS5hdXRvIH0gOiB7IGF1dG9JbmNyZW1lbnQ6IHByaW1LZXkuYXV0byB9KTtcbiAgICAgICAgICAgIGluZGV4ZXMuZm9yRWFjaChmdW5jdGlvbiAoaWR4KSB7IGFkZEluZGV4KHN0b3JlLCBpZHgpOyB9KTtcbiAgICAgICAgICAgIHJldHVybiBzdG9yZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZU1pc3NpbmdUYWJsZXMobmV3U2NoZW1hLCBpZGJ0cmFucykge1xuICAgICAgICAgICAgT2JqZWN0LmtleXMobmV3U2NoZW1hKS5mb3JFYWNoKGZ1bmN0aW9uICh0YWJsZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlkYnRyYW5zLmRiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnModGFibGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBjcmVhdGVUYWJsZShpZGJ0cmFucywgdGFibGVOYW1lLCBuZXdTY2hlbWFbdGFibGVOYW1lXS5wcmltS2V5LCBuZXdTY2hlbWFbdGFibGVOYW1lXS5pbmRleGVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRlbGV0ZVJlbW92ZWRUYWJsZXMobmV3U2NoZW1hLCBpZGJ0cmFucykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpZGJ0cmFucy5kYi5vYmplY3RTdG9yZU5hbWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlTmFtZSA9IGlkYnRyYW5zLmRiLm9iamVjdFN0b3JlTmFtZXNbaV07XG4gICAgICAgICAgICAgICAgaWYgKG5ld1NjaGVtYVtzdG9yZU5hbWVdID09PSBudWxsIHx8IG5ld1NjaGVtYVtzdG9yZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWRidHJhbnMuZGIuZGVsZXRlT2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZGRJbmRleChzdG9yZSwgaWR4KSB7XG4gICAgICAgICAgICBzdG9yZS5jcmVhdGVJbmRleChpZHgubmFtZSwgaWR4LmtleVBhdGgsIHsgdW5pcXVlOiBpZHgudW5pcXVlLCBtdWx0aUVudHJ5OiBpZHgubXVsdGkgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgIERleGllIFByb3RlY3RlZCBBUElcbiAgICAgICAgLy9cbiAgICAgICAgLy9cblxuICAgICAgICB0aGlzLl9hbGxUYWJsZXMgPSBhbGxUYWJsZXM7XG5cbiAgICAgICAgdGhpcy5fdGFibGVGYWN0b3J5ID0gZnVuY3Rpb24gY3JlYXRlVGFibGUobW9kZSwgdGFibGVTY2hlbWEsIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnkpIHtcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInRhYmxlU2NoZW1hXCIgdHlwZT1cIlRhYmxlU2NoZW1hXCI+PC9wYXJhbT5cbiAgICAgICAgICAgIGlmIChtb2RlID09PSBSRUFET05MWSlcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRhYmxlKHRhYmxlU2NoZW1hLm5hbWUsIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnksIHRhYmxlU2NoZW1hLCBDb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFdyaXRlYWJsZVRhYmxlKHRhYmxlU2NoZW1hLm5hbWUsIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnksIHRhYmxlU2NoZW1hKTtcbiAgICAgICAgfTsgXG5cbiAgICAgICAgdGhpcy5fY3JlYXRlVHJhbnNhY3Rpb24gPSBmdW5jdGlvbiAobW9kZSwgc3RvcmVOYW1lcywgZGJzY2hlbWEsIHBhcmVudFRyYW5zYWN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKG1vZGUsIHN0b3JlTmFtZXMsIGRic2NoZW1hLCBwYXJlbnRUcmFuc2FjdGlvbik7XG4gICAgICAgIH07IFxuXG4gICAgICAgIGZ1bmN0aW9uIHRhYmxlTm90SW5UcmFuc2FjdGlvbihtb2RlLCBzdG9yZU5hbWVzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUYWJsZSBcIiArIHN0b3JlTmFtZXNbMF0gKyBcIiBub3QgcGFydCBvZiB0cmFuc2FjdGlvbi4gT3JpZ2luYWwgU2NvcGUgRnVuY3Rpb24gU291cmNlOiBcIiArIERleGllLlByb21pc2UuUFNELnRyYW5zLnNjb3BlRnVuYy50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3RyYW5zUHJvbWlzZUZhY3RvcnkgPSBmdW5jdGlvbiB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5KG1vZGUsIHN0b3JlTmFtZXMsIGZuKSB7IC8vIExhc3QgYXJndW1lbnQgaXMgXCJ3cml0ZUxvY2tlZFwiLiBCdXQgdGhpcyBkb2VzbnQgYXBwbHkgdG8gb25lc2hvdCBkaXJlY3QgZGIgb3BlcmF0aW9ucywgc28gd2UgaWdub3JlIGl0LlxuICAgICAgICAgICAgaWYgKGRiX2lzX2Jsb2NrZWQgJiYgKCFQcm9taXNlLlBTRCB8fCAhUHJvbWlzZS5QU0QubGV0VGhyb3VnaCkpIHtcbiAgICAgICAgICAgICAgICAvLyBEYXRhYmFzZSBpcyBwYXVzZWQuIFdhaXQgdGlsIHJlc3VtZWQuXG4gICAgICAgICAgICAgICAgdmFyIGJsb2NrZWRQcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBwYXVzZWRSZXN1bWVhYmxlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwID0gZGIuX3RyYW5zUHJvbWlzZUZhY3RvcnkobW9kZSwgc3RvcmVOYW1lcywgZm4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrZWRQcm9taXNlLm9udW5jYXRjaGVkID0gcC5vbnVuY2F0Y2hlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJsb2NrZWRQcm9taXNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgdHJhbnMgPSBkYi5fY3JlYXRlVHJhbnNhY3Rpb24obW9kZSwgc3RvcmVOYW1lcywgZ2xvYmFsU2NoZW1hKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnMuX3Byb21pc2UobW9kZSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBbiB1bmNhdGNoZWQgb3BlcmF0aW9uIHdpbGwgYnViYmxlIHRvIHRoaXMgYW5vbnltb3VzIHRyYW5zYWN0aW9uLiBNYWtlIHN1cmVcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gY29udGludWUgYnViYmxpbmcgaXQgdXAgdG8gZGIub24oJ2Vycm9yJyk6XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zLmVycm9yKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRiLm9uKCdlcnJvcicpLmZpcmUoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGZuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW5zdGVhZCBvZiByZXNvbHZpbmcgdmFsdWUgZGlyZWN0bHksIHdhaXQgd2l0aCByZXNvbHZpbmcgaXQgdW50aWwgdHJhbnNhY3Rpb24gaGFzIGNvbXBsZXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSB0aGUgZGF0YSB3b3VsZCBub3QgYmUgaW4gdGhlIERCIGlmIHJlcXVlc3RpbmcgaXQgaW4gdGhlIHRoZW4oKSBvcGVyYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTcGVjaWZpY2FsbHksIHRvIGVuc3VyZSB0aGF0IHRoZSBmb2xsb3dpbmcgZXhwcmVzc2lvbiB3aWxsIHdvcms6XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICBkYi5mcmllbmRzLnB1dCh7bmFtZTogXCJBcm5lXCJ9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgIGRiLmZyaWVuZHMud2hlcmUoXCJuYW1lXCIpLmVxdWFscyhcIkFybmVcIikuY291bnQoZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICBhc3NlcnQgKGNvdW50ID09PSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5jb21wbGV0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0LCB0cmFucyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07IFxuXG4gICAgICAgIHRoaXMuX3doZW5SZWFkeSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgaWYgKCFmYWtlICYmIGRiX2lzX2Jsb2NrZWQgJiYgKCFQcm9taXNlLlBTRCB8fCAhUHJvbWlzZS5QU0QubGV0VGhyb3VnaCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBwYXVzZWRSZXN1bWVhYmxlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZuKTtcbiAgICAgICAgfTsgXG5cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgICBEZXhpZSBBUElcbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cblxuICAgICAgICB0aGlzLnZlcm5vID0gMDtcblxuICAgICAgICB0aGlzLm9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIGlmIChmYWtlKSByZXNvbHZlKGRiKTtcbiAgICAgICAgICAgICAgICBpZiAoaWRiZGIgfHwgaXNCZWluZ09wZW5lZCkgdGhyb3cgbmV3IEVycm9yKFwiRGF0YWJhc2UgYWxyZWFkeSBvcGVuZWQgb3IgYmVpbmcgb3BlbmVkXCIpO1xuICAgICAgICAgICAgICAgIHZhciByZXEsIGRiV2FzQ3JlYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG9wZW5FcnJvcihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHsgcmVxLnRyYW5zYWN0aW9uLmFib3J0KCk7IH0gY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgICAgICAgICAvKmlmIChkYldhc0NyZWF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdvcmthcm91bmQgZm9yIGlzc3VlIHdpdGggc29tZSBicm93c2Vycy4gU2VlbSBub3QgdG8gYmUgbmVlZGVkIHRob3VnaC5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVuaXQgdGVzdCBcIklzc3VlIzEwMCAtIG5vdCBhbGwgaW5kZXhlcyBhcmUgY3JlYXRlZFwiIHdvcmtzIHdpdGhvdXQgaXQgb24gY2hyb21lLEZGLG9wZXJhIGFuZCBJRS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlkYmRiLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoZGIubmFtZSk7IFxuICAgICAgICAgICAgICAgICAgICB9Ki9cbiAgICAgICAgICAgICAgICAgICAgaXNCZWluZ09wZW5lZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBkYk9wZW5FcnJvciA9IGVycjtcbiAgICAgICAgICAgICAgICAgICAgZGJfaXNfYmxvY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZGJPcGVuRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBwYXVzZWRSZXN1bWVhYmxlcy5mb3JFYWNoKGZ1bmN0aW9uIChyZXN1bWFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc3VtZSBhbGwgc3RhbGxlZCBvcGVyYXRpb25zLiBUaGV5IHdpbGwgZmFpbCBvbmNlIHRoZXkgd2FrZSB1cC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VtYWJsZS5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHBhdXNlZFJlc3VtZWFibGVzID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGRiT3BlbkVycm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaXNCZWluZ09wZW5lZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIGNhbGxlciBoYXMgc3BlY2lmaWVkIGF0IGxlYXN0IG9uZSB2ZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgIGlmICh2ZXJzaW9ucy5sZW5ndGggPiAwKSBhdXRvU2NoZW1hID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTXVsdGlwbHkgZGIudmVybm8gd2l0aCAxMCB3aWxsIGJlIG5lZWRlZCB0byB3b3JrYXJvdW5kIHVwZ3JhZGluZyBidWcgaW4gSUU6IFxuICAgICAgICAgICAgICAgICAgICAvLyBJRSBmYWlscyB3aGVuIGRlbGV0aW5nIG9iamVjdFN0b3JlIGFmdGVyIHJlYWRpbmcgZnJvbSBpdC5cbiAgICAgICAgICAgICAgICAgICAgLy8gQSBmdXR1cmUgdmVyc2lvbiBvZiBEZXhpZS5qcyB3aWxsIHN0b3BvdmVyIGFuIGludGVybWVkaWF0ZSB2ZXJzaW9uIHRvIHdvcmthcm91bmQgdGhpcy5cbiAgICAgICAgICAgICAgICAgICAgLy8gQXQgdGhhdCBwb2ludCwgd2Ugd2FudCB0byBiZSBiYWNrd2FyZCBjb21wYXRpYmxlLiBDb3VsZCBoYXZlIGJlZW4gbXVsdGlwbGllZCB3aXRoIDIsIGJ1dCBieSB1c2luZyAxMCwgaXQgaXMgZWFzaWVyIHRvIG1hcCB0aGUgbnVtYmVyIHRvIHRoZSByZWFsIHZlcnNpb24gbnVtYmVyLlxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZGV4ZWREQikgdGhyb3cgbmV3IEVycm9yKFwiaW5kZXhlZERCIEFQSSBub3QgZm91bmQuIElmIHVzaW5nIElFMTArLCBtYWtlIHN1cmUgdG8gcnVuIHlvdXIgY29kZSBvbiBhIHNlcnZlciBVUkwgKG5vdCBsb2NhbGx5KS4gSWYgdXNpbmcgU2FmYXJpLCBtYWtlIHN1cmUgdG8gaW5jbHVkZSBpbmRleGVkREIgcG9seWZpbGwuXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXEgPSBhdXRvU2NoZW1hID8gaW5kZXhlZERCLm9wZW4oZGJOYW1lKSA6IGluZGV4ZWREQi5vcGVuKGRiTmFtZSwgTWF0aC5yb3VuZChkYi52ZXJubyAqIDEwKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVxKSB0aHJvdyBuZXcgRXJyb3IoXCJJbmRleGVkREIgQVBJIG5vdCBhdmFpbGFibGVcIik7IC8vIE1heSBoYXBwZW4gaW4gU2FmYXJpIHByaXZhdGUgbW9kZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9kZmFobGFuZGVyL0RleGllLmpzL2lzc3Vlcy8xMzQgXG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKG9wZW5FcnJvciwgW1wib3BlbmluZyBkYXRhYmFzZVwiLCBkYk5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uYmxvY2tlZCA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGIub24oXCJibG9ja2VkXCIpLmZpcmUoZXYpO1xuICAgICAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9udXBncmFkZW5lZWRlZCA9IHRyeWNhdGNoIChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dG9TY2hlbWEgJiYgIWRiLl9hbGxvd0VtcHR5REIpIHsgLy8gVW5sZXNzIGFuIGFkZG9uIGhhcyBzcGVjaWZpZWQgZGIuX2FsbG93RW1wdHlEQiwgbGV0cyBtYWtlIHRoZSBjYWxsIGZhaWwuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbGVyIGRpZCBub3Qgc3BlY2lmeSBhIHZlcnNpb24gb3Igc2NoZW1hLiBEb2luZyB0aGF0IGlzIG9ubHkgYWNjZXB0YWJsZSBmb3Igb3BlbmluZyBhbHJlYWQgZXhpc3RpbmcgZGF0YWJhc2VzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIG9udXBncmFkZW5lZWRlZCBpcyBjYWxsZWQgaXQgbWVhbnMgZGF0YWJhc2UgZGlkIG5vdCBleGlzdC4gUmVqZWN0IHRoZSBvcGVuKCkgcHJvbWlzZSBhbmQgbWFrZSBzdXJlIHRoYXQgd2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG8gbm90IGNyZWF0ZSBhIG5ldyBkYXRhYmFzZSBieSBhY2NpZGVudCBoZXJlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKGV2ZW50KSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IH07IC8vIFByb2hpYml0IG9uYWJvcnQgZXJyb3IgZnJvbSBmaXJpbmcgYmVmb3JlIHdlJ3JlIGRvbmUhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLnRyYW5zYWN0aW9uLmFib3J0KCk7IC8vIEFib3J0IHRyYW5zYWN0aW9uICh3b3VsZCBob3BlIHRoYXQgdGhpcyB3b3VsZCBtYWtlIERCIGRpc2FwcGVhciBidXQgaXQgZG9lc250LilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbG9zZSBkYXRhYmFzZSBhbmQgZGVsZXRlIGl0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5yZXN1bHQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVscmVxID0gaW5kZXhlZERCLmRlbGV0ZURhdGFiYXNlKGRiTmFtZSk7IC8vIFRoZSB1cGdyYWRlIHRyYW5zYWN0aW9uIGlzIGF0b21pYywgYW5kIGphdmFzY3JpcHQgaXMgc2luZ2xlIHRocmVhZGVkIC0gbWVhbmluZyB0aGF0IHRoZXJlIGlzIG5vIHJpc2sgdGhhdCB3ZSBkZWxldGUgc29tZW9uZSBlbHNlcyBkYXRhYmFzZSBoZXJlIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHJlcS5vbnN1Y2Nlc3MgPSBkZWxyZXEub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkVycm9yKG5ldyBFcnJvcihcIkRhdGFiYXNlICdcIiArIGRiTmFtZSArIFwiJyBkb2VzbnQgZXhpc3RcIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5vbGRWZXJzaW9uID09PSAwKSBkYldhc0NyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS50cmFuc2FjdGlvbi5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKG9wZW5FcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZlciA9IGUub2xkVmVyc2lvbiA+IE1hdGgucG93KDIsIDYyKSA/IDAgOiBlLm9sZFZlcnNpb247IC8vIFNhZmFyaSA4IGZpeC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW5VcGdyYWRlcnMob2xkVmVyIC8gMTAsIHJlcS50cmFuc2FjdGlvbiwgb3BlbkVycm9yLCByZXEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBvcGVuRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gdHJ5Y2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQmVpbmdPcGVuZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkYmRiID0gcmVxLnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRvU2NoZW1hKSByZWFkR2xvYmFsU2NoZW1hKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChpZGJkYi5vYmplY3RTdG9yZU5hbWVzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRqdXN0VG9FeGlzdGluZ0luZGV4TmFtZXMoZ2xvYmFsU2NoZW1hLCBpZGJkYi50cmFuc2FjdGlvbihzYWZhcmlNdWx0aVN0b3JlRml4KGlkYmRiLm9iamVjdFN0b3JlTmFtZXMpLCBSRUFET05MWSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWRiZGIub252ZXJzaW9uY2hhbmdlID0gZGIub24oXCJ2ZXJzaW9uY2hhbmdlXCIpLmZpcmU7IC8vIE5vdCBmaXJpbmcgaXQgaGVyZSwganVzdCBzZXR0aW5nIHRoZSBmdW5jdGlvbiBjYWxsYmFjayB0byBhbnkgcmVnaXN0ZXJlZCBzdWJzY3JpYmVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNOYXRpdmVHZXREYXRhYmFzZU5hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIGxvY2FsU3RvcmFnZSB3aXRoIGxpc3Qgb2YgZGF0YWJhc2UgbmFtZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbG9iYWxEYXRhYmFzZUxpc3QoZnVuY3Rpb24gKGRhdGFiYXNlTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFiYXNlTmFtZXMuaW5kZXhPZihkYk5hbWUpID09PSAtMSkgcmV0dXJuIGRhdGFiYXNlTmFtZXMucHVzaChkYk5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm93LCBsZXQgYW55IHN1YnNjcmliZXJzIHRvIHRoZSBvbihcInJlYWR5XCIpIGZpcmUgQkVGT1JFIGFueSBvdGhlciBkYiBvcGVyYXRpb25zIHJlc3VtZSFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGFuIHRoZSBvbihcInJlYWR5XCIpIHN1YnNjcmliZXIgcmV0dXJucyBhIFByb21pc2UsIHdlIHdpbGwgd2FpdCB0aWwgcHJvbWlzZSBjb21wbGV0ZXMgb3IgcmVqZWN0cyBiZWZvcmUgXG4gICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLm5ld1BTRChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5QU0QubGV0VGhyb3VnaCA9IHRydWU7IC8vIFNldCBhIFByb21pc2UtU3BlY2lmaWMgRGF0YSBwcm9wZXJ0eSBpbmZvcm1pbmcgdGhhdCBvbnJlYWR5IGlzIGZpcmluZy4gVGhpcyB3aWxsIG1ha2UgZGIuX3doZW5SZWFkeSgpIGxldCB0aGUgc3Vic2NyaWJlcnMgdXNlIHRoZSBEQiBidXQgYmxvY2sgYWxsIG90aGVycyAoISkuIFF1aXRlIGNvb2wgaGE/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcyA9IGRiLm9uLnJlYWR5LmZpcmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlcyAmJiB0eXBlb2YgcmVzLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIG9uKCdyZWFkeScpIHJldHVybnMgYSBwcm9taXNlLCB3YWl0IGZvciBpdCB0byBjb21wbGV0ZSBhbmQgdGhlbiByZXN1bWUgYW55IHBlbmRpbmcgb3BlcmF0aW9ucy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy50aGVuKHJlc3VtZSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkYmRiLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRiZGIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5FcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc2FwKHJlc3VtZSk7IC8vIENhbm5vdCBjYWxsIHJlc3VtZSBkaXJlY3RseSBiZWNhdXNlIHRoZW4gdGhlIHBhdXNlUmVzdW1hYmxlcyB3b3VsZCBpbmhlcml0IGZyb20gb3VyIFBTRCBzY29wZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlc3VtZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGJfaXNfYmxvY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXVzZWRSZXN1bWVhYmxlcy5mb3JFYWNoKGZ1bmN0aW9uIChyZXN1bWFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGFueW9uZSBoYXMgbWFkZSBvcGVyYXRpb25zIG9uIGEgdGFibGUgaW5zdGFuY2UgYmVmb3JlIHRoZSBkYiB3YXMgb3BlbmVkLCB0aGUgb3BlcmF0aW9ucyB3aWxsIHN0YXJ0IGV4ZWN1dGluZyBub3cuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bWFibGUucmVzdW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXVzZWRSZXN1bWVhYmxlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgb3BlbkVycm9yKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgb3BlbkVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07IFxuXG4gICAgICAgIHRoaXMuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoaWRiZGIpIHtcbiAgICAgICAgICAgICAgICBpZGJkYi5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIGlkYmRiID0gbnVsbDtcbiAgICAgICAgICAgICAgICBkYl9pc19ibG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBkYk9wZW5FcnJvciA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07IFxuXG4gICAgICAgIHRoaXMuZGVsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50cyBub3QgYWxsb3dlZCBpbiBkYi5kZWxldGUoKVwiKTtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBkb0RlbGV0ZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlcSA9IGluZGV4ZWREQi5kZWxldGVEYXRhYmFzZShkYk5hbWUpO1xuICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNOYXRpdmVHZXREYXRhYmFzZU5hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsRGF0YWJhc2VMaXN0KGZ1bmN0aW9uKGRhdGFiYXNlTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBvcyA9IGRhdGFiYXNlTmFtZXMuaW5kZXhPZihkYk5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9zID49IDApIHJldHVybiBkYXRhYmFzZU5hbWVzLnNwbGljZShwb3MsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIFtcImRlbGV0aW5nXCIsIGRiTmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICByZXEub25ibG9ja2VkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYi5vbihcImJsb2NrZWRcIikuZmlyZSgpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaXNCZWluZ09wZW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBwYXVzZWRSZXN1bWVhYmxlcy5wdXNoKHsgcmVzdW1lOiBkb0RlbGV0ZSB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkb0RlbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9OyBcblxuICAgICAgICB0aGlzLmJhY2tlbmREQiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpZGJkYjtcbiAgICAgICAgfTsgXG5cbiAgICAgICAgdGhpcy5pc09wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaWRiZGIgIT09IG51bGw7XG4gICAgICAgIH07IFxuICAgICAgICB0aGlzLmhhc0ZhaWxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkYk9wZW5FcnJvciAhPT0gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5keW5hbWljYWxseU9wZW5lZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGF1dG9TY2hlbWE7XG4gICAgICAgIH1cblxuICAgICAgICAvKnRoaXMuZGJnID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvdW50ZXIpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fZGJnUmVzdWx0IHx8ICF0aGlzLl9kYmdSZXN1bHRbY291bnRlcl0pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbGxlY3Rpb24gPT09ICdzdHJpbmcnKSBjb2xsZWN0aW9uID0gdGhpcy50YWJsZShjb2xsZWN0aW9uKS50b0NvbGxlY3Rpb24oKS5saW1pdCgxMDApO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fZGJnUmVzdWx0KSB0aGlzLl9kYmdSZXN1bHQgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgZGIgPSB0aGlzO1xuICAgICAgICAgICAgICAgIG5ldyBQcm9taXNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5QU0QubGV0VGhyb3VnaCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGRiLl9kYmdSZXN1bHRbY291bnRlcl0gPSBjb2xsZWN0aW9uLnRvQXJyYXkoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYmdSZXN1bHRbY291bnRlcl0uX3ZhbHVlO1xuICAgICAgICB9Ki9cblxuICAgICAgICAvL1xuICAgICAgICAvLyBQcm9wZXJ0aWVzXG4gICAgICAgIC8vXG4gICAgICAgIHRoaXMubmFtZSA9IGRiTmFtZTtcblxuICAgICAgICAvLyBkYi50YWJsZXMgLSBhbiBhcnJheSBvZiBhbGwgVGFibGUgaW5zdGFuY2VzLlxuICAgICAgICAvLyBUT0RPOiBDaGFuZ2Ugc28gdGhhdCB0YWJsZXMgaXMgYSBzaW1wbGUgbWVtYmVyIGFuZCBtYWtlIHN1cmUgdG8gdXBkYXRlIGl0IHdoZW5ldmVyIGFsbFRhYmxlcyBjaGFuZ2VzLlxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJ0YWJsZXNcIiwge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJBcnJheVwiIGVsZW1lbnRUeXBlPVwiV3JpdGVhYmxlVGFibGVcIiAvPlxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhhbGxUYWJsZXMpLm1hcChmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gYWxsVGFibGVzW25hbWVdOyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRXZlbnRzXG4gICAgICAgIC8vXG4gICAgICAgIHRoaXMub24gPSBldmVudHModGhpcywgXCJlcnJvclwiLCBcInBvcHVsYXRlXCIsIFwiYmxvY2tlZFwiLCB7IFwicmVhZHlcIjogW3Byb21pc2FibGVDaGFpbiwgbm9wXSwgXCJ2ZXJzaW9uY2hhbmdlXCI6IFtyZXZlcnNlU3RvcHBhYmxlRXZlbnRDaGFpbiwgbm9wXSB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgb24oJ3JlYWR5Jykgc3BlY2lmaWNhbGx5OiBJZiBEQiBpcyBhbHJlYWR5IG9wZW4sIHRyaWdnZXIgdGhlIGV2ZW50IGltbWVkaWF0ZWx5LiBBbHNvLCBkZWZhdWx0IHRvIHVuc3Vic2NyaWJlIGltbWVkaWF0ZWx5IGFmdGVyIGJlaW5nIHRyaWdnZXJlZC5cbiAgICAgICAgdGhpcy5vbi5yZWFkeS5zdWJzY3JpYmUgPSBvdmVycmlkZSh0aGlzLm9uLnJlYWR5LnN1YnNjcmliZSwgZnVuY3Rpb24gKG9yaWdTdWJzY3JpYmUpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoc3Vic2NyaWJlciwgYlN0aWNreSkge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHByb3h5ICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFiU3RpY2t5KSBkYi5vbi5yZWFkeS51bnN1YnNjcmliZShwcm94eSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpYmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9yaWdTdWJzY3JpYmUuY2FsbCh0aGlzLCBwcm94eSk7XG4gICAgICAgICAgICAgICAgaWYgKGRiLmlzT3BlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYl9pc19ibG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXVzZWRSZXN1bWVhYmxlcy5wdXNoKHsgcmVzdW1lOiBwcm94eSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3h5KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICBmYWtlQXV0b0NvbXBsZXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRiLm9uKFwicG9wdWxhdGVcIikuZmlyZShkYi5fY3JlYXRlVHJhbnNhY3Rpb24oUkVBRFdSSVRFLCBkYlN0b3JlTmFtZXMsIGdsb2JhbFNjaGVtYSkpO1xuICAgICAgICAgICAgZGIub24oXCJlcnJvclwiKS5maXJlKG5ldyBFcnJvcigpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbiA9IGZ1bmN0aW9uIChtb2RlLCB0YWJsZUluc3RhbmNlcywgc2NvcGVGdW5jKSB7XG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgICAgICAvLy8gXG4gICAgICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwibW9kZVwiIHR5cGU9XCJTdHJpbmdcIj5cInJcIiBmb3IgcmVhZG9ubHksIG9yIFwicndcIiBmb3IgcmVhZHdyaXRlPC9wYXJhbT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInRhYmxlSW5zdGFuY2VzXCI+VGFibGUgaW5zdGFuY2UsIEFycmF5IG9mIFRhYmxlIGluc3RhbmNlcywgU3RyaW5nIG9yIFN0cmluZyBBcnJheSBvZiBvYmplY3Qgc3RvcmVzIHRvIGluY2x1ZGUgaW4gdGhlIHRyYW5zYWN0aW9uPC9wYXJhbT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInNjb3BlRnVuY1wiIHR5cGU9XCJGdW5jdGlvblwiPkZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2l0aCB0cmFuc2FjdGlvbjwvcGFyYW0+XG5cbiAgICAgICAgICAgIC8vIExldCB0YWJsZSBhcmd1bWVudHMgYmUgYWxsIGFyZ3VtZW50cyBiZXR3ZWVuIG1vZGUgYW5kIGxhc3QgYXJndW1lbnQuXG4gICAgICAgICAgICB0YWJsZUluc3RhbmNlcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxLCBhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAvLyBMZXQgc2NvcGVGdW5jIGJlIHRoZSBsYXN0IGFyZ3VtZW50XG4gICAgICAgICAgICBzY29wZUZ1bmMgPSBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgdmFyIHBhcmVudFRyYW5zYWN0aW9uID0gUHJvbWlzZS5QU0QgJiYgUHJvbWlzZS5QU0QudHJhbnM7XG5cdFx0XHQvLyBDaGVjayBpZiBwYXJlbnQgdHJhbnNhY3Rpb25zIGlzIGJvdW5kIHRvIHRoaXMgZGIgaW5zdGFuY2UsIGFuZCBpZiBjYWxsZXIgd2FudHMgdG8gcmV1c2UgaXRcbiAgICAgICAgICAgIGlmICghcGFyZW50VHJhbnNhY3Rpb24gfHwgcGFyZW50VHJhbnNhY3Rpb24uZGIgIT09IGRiIHx8IG1vZGUuaW5kZXhPZignIScpICE9PSAtMSkgcGFyZW50VHJhbnNhY3Rpb24gPSBudWxsO1xuICAgICAgICAgICAgdmFyIG9ubHlJZkNvbXBhdGlibGUgPSBtb2RlLmluZGV4T2YoJz8nKSAhPT0gLTE7XG4gICAgICAgICAgICBtb2RlID0gbW9kZS5yZXBsYWNlKCchJywgJycpLnJlcGxhY2UoJz8nLCAnJyk7XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gR2V0IHN0b3JlTmFtZXMgZnJvbSBhcmd1bWVudHMuIEVpdGhlciB0aHJvdWdoIGdpdmVuIHRhYmxlIGluc3RhbmNlcywgb3IgdGhyb3VnaCBnaXZlbiB0YWJsZSBuYW1lcy5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB2YXIgdGFibGVzID0gQXJyYXkuaXNBcnJheSh0YWJsZUluc3RhbmNlc1swXSkgPyB0YWJsZUluc3RhbmNlcy5yZWR1Y2UoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuY29uY2F0KGIpOyB9KSA6IHRhYmxlSW5zdGFuY2VzO1xuICAgICAgICAgICAgdmFyIGVycm9yID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBzdG9yZU5hbWVzID0gdGFibGVzLm1hcChmdW5jdGlvbiAodGFibGVJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGFibGVJbnN0YW5jZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFibGVJbnN0YW5jZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoISh0YWJsZUluc3RhbmNlIGluc3RhbmNlb2YgVGFibGUpKSBlcnJvciA9IGVycm9yIHx8IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIHR5cGUuIEFyZ3VtZW50cyBmb2xsb3dpbmcgbW9kZSBtdXN0IGJlIGluc3RhbmNlcyBvZiBUYWJsZSBvciBTdHJpbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0YWJsZUluc3RhbmNlLm5hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBSZXNvbHZlIG1vZGUuIEFsbG93IHNob3J0Y3V0cyBcInJcIiBhbmQgXCJyd1wiLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIGlmIChtb2RlID09IFwiclwiIHx8IG1vZGUgPT0gUkVBRE9OTFkpXG4gICAgICAgICAgICAgICAgbW9kZSA9IFJFQURPTkxZO1xuICAgICAgICAgICAgZWxzZSBpZiAobW9kZSA9PSBcInJ3XCIgfHwgbW9kZSA9PSBSRUFEV1JJVEUpXG4gICAgICAgICAgICAgICAgbW9kZSA9IFJFQURXUklURTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihcIkludmFsaWQgdHJhbnNhY3Rpb24gbW9kZTogXCIgKyBtb2RlKTtcblxuICAgICAgICAgICAgaWYgKHBhcmVudFRyYW5zYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gQmFzaWMgY2hlY2tzXG4gICAgICAgICAgICAgICAgaWYgKCFlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50VHJhbnNhY3Rpb24gJiYgcGFyZW50VHJhbnNhY3Rpb24ubW9kZSA9PT0gUkVBRE9OTFkgJiYgbW9kZSA9PT0gUkVBRFdSSVRFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob25seUlmQ29tcGF0aWJsZSkgcGFyZW50VHJhbnNhY3Rpb24gPSBudWxsOyAvLyBTcGF3biBuZXcgdHJhbnNhY3Rpb24gaW5zdGVhZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgZXJyb3IgPSBlcnJvciB8fCBuZXcgRXJyb3IoXCJDYW5ub3QgZW50ZXIgYSBzdWItdHJhbnNhY3Rpb24gd2l0aCBSRUFEV1JJVEUgbW9kZSB3aGVuIHBhcmVudCB0cmFuc2FjdGlvbiBpcyBSRUFET05MWVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50VHJhbnNhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JlTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAoc3RvcmVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJlbnRUcmFuc2FjdGlvbi50YWJsZXMuaGFzT3duUHJvcGVydHkoc3RvcmVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob25seUlmQ29tcGF0aWJsZSkgcGFyZW50VHJhbnNhY3Rpb24gPSBudWxsOyAvLyBTcGF3biBuZXcgdHJhbnNhY3Rpb24gaW5zdGVhZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBlcnJvciA9IGVycm9yIHx8IG5ldyBFcnJvcihcIlRhYmxlIFwiICsgc3RvcmVOYW1lICsgXCIgbm90IGluY2x1ZGVkIGluIHBhcmVudCB0cmFuc2FjdGlvbi4gUGFyZW50IFRyYW5zYWN0aW9uIGZ1bmN0aW9uOiBcIiArIHBhcmVudFRyYW5zYWN0aW9uLnNjb3BlRnVuYy50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYXJlbnRUcmFuc2FjdGlvbikge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBzdWItdHJhbnNhY3Rpb24sIGxvY2sgdGhlIHBhcmVudCBhbmQgdGhlbiBsYXVuY2ggdGhlIHN1Yi10cmFuc2FjdGlvbi5cbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50VHJhbnNhY3Rpb24uX3Byb21pc2UobW9kZSwgZW50ZXJUcmFuc2FjdGlvblNjb3BlLCBcImxvY2tcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSByb290LWxldmVsIHRyYW5zYWN0aW9uLCB3YWl0IHRpbCBkYXRhYmFzZSBpcyByZWFkeSBhbmQgdGhlbiBsYXVuY2ggdGhlIHRyYW5zYWN0aW9uLlxuICAgICAgICAgICAgICAgIHJldHVybiBkYi5fd2hlblJlYWR5KGVudGVyVHJhbnNhY3Rpb25TY29wZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZ1bmN0aW9uIGVudGVyVHJhbnNhY3Rpb25TY29wZShyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAvLyBPdXIgdHJhbnNhY3Rpb24uIFRvIGJlIHNldCBsYXRlci5cbiAgICAgICAgICAgICAgICB2YXIgdHJhbnMgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhyb3cgYW55IGVycm9yIGlmIGFueSBvZiB0aGUgYWJvdmUgY2hlY2tzIGZhaWxlZC5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmVhbCBlcnJvciBkZWZpbmVkIHNvbWUgbGluZXMgdXAuIFdlIHRocm93IGl0IGhlcmUgZnJvbSB3aXRoaW4gYSBQcm9taXNlIHRvIHJlamVjdCBQcm9taXNlXG4gICAgICAgICAgICAgICAgICAgIC8vIHJhdGhlciB0aGFuIG1ha2UgY2FsbGVyIG5lZWQgdG8gYm90aCB1c2UgdHJ5Li5jYXRjaCBhbmQgcHJvbWlzZSBjYXRjaGluZy4gVGhlIHJlYXNvbiB3ZSBzdGlsbFxuICAgICAgICAgICAgICAgICAgICAvLyB0aHJvdyBoZXJlIHJhdGhlciB0aGFuIGRvIFByb21pc2UucmVqZWN0KGVycm9yKSBpcyB0aGF0IHdlIGxpa2UgdG8gaGF2ZSB0aGUgc3RhY2sgYXR0YWNoZWQgdG8gdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIGVycm9yLiBBbHNvIGJlY2F1c2UgdGhlcmUgaXMgYSBjYXRjaCgpIGNsYXVzZSBib3VuZCB0byB0aGlzIHRyeSgpIHRoYXQgd2lsbCBidWJibGUgdGhlIGVycm9yXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIHRoZSBwYXJlbnQgdHJhbnNhY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIFRyYW5zYWN0aW9uIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zID0gZGIuX2NyZWF0ZVRyYW5zYWN0aW9uKG1vZGUsIHN0b3JlTmFtZXMsIGdsb2JhbFNjaGVtYSwgcGFyZW50VHJhbnNhY3Rpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFByb3ZpZGUgYXJndW1lbnRzIHRvIHRoZSBzY29wZSBmdW5jdGlvbiAoZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkpXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YWJsZUFyZ3MgPSBzdG9yZU5hbWVzLm1hcChmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gdHJhbnMudGFibGVzW25hbWVdOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGFibGVBcmdzLnB1c2godHJhbnMpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRyYW5zYWN0aW9uIGNvbXBsZXRlcywgcmVzb2x2ZSB0aGUgUHJvbWlzZSB3aXRoIHRoZSByZXR1cm4gdmFsdWUgb2Ygc2NvcGVGdW5jLlxuICAgICAgICAgICAgICAgICAgICB2YXIgcmV0dXJuVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1bmNvbXBsZXRlZFJlcXVlc3RzID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgUFNEIGZyYW1lIHRvIGhvbGQgUHJvbWlzZS5QU0QudHJhbnMuIE11c3Qgbm90IGJlIGJvdW5kIHRvIHRoZSBjdXJyZW50IFBTRCBmcmFtZSBzaW5jZSB3ZSB3YW50XG4gICAgICAgICAgICAgICAgICAgIC8vIGl0IHRvIHBvcCBiZWZvcmUgdGhlbigpIGNhbGxiYWNrIGlzIGNhbGxlZCBvZiBvdXIgcmV0dXJuZWQgUHJvbWlzZS5cbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5uZXdQU0QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGV0IHRoZSB0cmFuc2FjdGlvbiBpbnN0YW5jZSBiZSBwYXJ0IG9mIGEgUHJvbWlzZS1zcGVjaWZpYyBkYXRhIChQU0QpIHZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5QU0QudHJhbnMgPSB0cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLnNjb3BlRnVuYyA9IHNjb3BlRnVuYzsgLy8gRm9yIEVycm9yIChcIlRhYmxlIFwiICsgc3RvcmVOYW1lc1swXSArIFwiIG5vdCBwYXJ0IG9mIHRyYW5zYWN0aW9uXCIpIHdoZW4gaXQgaGFwcGVucy4gVGhpcyBtYXkgaGVscCBsb2NhbGl6aW5nIHRoZSBjb2RlIHRoYXQgc3RhcnRlZCBhIHRyYW5zYWN0aW9uIHVzZWQgb24gYW5vdGhlciBwbGFjZS5cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudFRyYW5zYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW11bGF0ZSB0cmFuc2FjdGlvbiBjb21taXQgYXdhcmVuZXNzIGZvciBpbm5lciB0cmFuc2FjdGlvbiAobXVzdCAnY29tbWl0JyB3aGVuIHRoZSBpbm5lciB0cmFuc2FjdGlvbiBoYXMgbm8gbW9yZSBvcGVyYXRpb25zIG9uZ29pbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuaWRidHJhbnMgPSBwYXJlbnRUcmFuc2FjdGlvbi5pZGJ0cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5fcHJvbWlzZSA9IG92ZXJyaWRlKHRyYW5zLl9wcm9taXNlLCBmdW5jdGlvbiAob3JpZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG1vZGUsIGZuLCB3cml0ZUxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrdW5jb21wbGV0ZWRSZXF1ZXN0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHByb3h5KGZuMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXR2YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIF9yb290RXhlYyBuZWVkZWQgc28gdGhhdCB3ZSBkbyBub3QgbG9vc2UgYW55IElEQlRyYW5zYWN0aW9uIGluIGEgc2V0VGltZW91dCgpIGNhbGwuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuX3Jvb3RFeGVjKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHZhbCA9IGZuMih2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gX3RpY2tGaW5hbGl6ZSBtYWtlcyBzdXJlIHRvIHN1cHBvcnQgbGF6eSBtaWNybyB0YXNrcyBleGVjdXRlZCBpbiBQcm9taXNlLl9yb290RXhlYygpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgY2VydGFpbmx5IGRvIG5vdCB3YW50IHRvIGNvcHkgdGhlIGJhZCBwYXR0ZXJuIGZyb20gSW5kZXhlZERCIGJ1dCBpbnN0ZWFkIGFsbG93XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBleGVjdXRpb24gb2YgUHJvbWlzZS50aGVuKCkgY2FsbGJhY2tzIHVudGlsIHRoZSdyZSBhbGwgZG9uZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuX3RpY2tGaW5hbGl6ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tdW5jb21wbGV0ZWRSZXF1ZXN0cyA9PT0gMCAmJiB0cmFucy5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLm9uLmNvbXBsZXRlLmZpcmUoKTsgLy8gQSBjYWxsZWQgZGIgb3BlcmF0aW9uIGhhcyBjb21wbGV0ZWQgd2l0aG91dCBzdGFydGluZyBhIG5ldyBvcGVyYXRpb24uIFRoZSBmbG93IGlzIGZpbmlzaGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcmlnLmNhbGwodGhpcywgbW9kZSwgZnVuY3Rpb24gKHJlc29sdmUyLCByZWplY3QyLCB0cmFucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihwcm94eShyZXNvbHZlMiksIHByb3h5KHJlamVjdDIpLCB0cmFucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB3cml0ZUxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuY29tcGxldGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmV0dXJuVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0cmFuc2FjdGlvbiBmYWlscywgcmVqZWN0IHRoZSBQcm9taXNlIGFuZCBidWJibGUgdG8gZGIgaWYgbm9vbmUgY2F0Y2hlZCB0aGlzIHJlamVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLmVycm9yKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zLmlkYnRyYW5zKSB0cmFucy5pZGJ0cmFucy5vbmVycm9yID0gcHJldmVudERlZmF1bHQ7IC8vIFByb2hpYml0IEFib3J0RXJyb3IgZnJvbSBmaXJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHt0cmFucy5hYm9ydCgpO30gY2F0Y2goZTIpe31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50VHJhbnNhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VHJhbnNhY3Rpb24uYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFRyYW5zYWN0aW9uLm9uLmVycm9yLmZpcmUoZSk7IC8vIEJ1YmJsZSB0byBwYXJlbnQgdHJhbnNhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhdGNoZWQgPSByZWplY3QoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJlbnRUcmFuc2FjdGlvbiAmJiAhY2F0Y2hlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYi5vbi5lcnJvci5maXJlKGUpOy8vIElmIG5vdCBjYXRjaGVkLCBidWJibGUgZXJyb3IgdG8gZGIub24oXCJlcnJvclwiKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmluYWxseSwgY2FsbCB0aGUgc2NvcGUgZnVuY3Rpb24gd2l0aCBvdXIgdGFibGUgYW5kIHRyYW5zYWN0aW9uIGFyZ3VtZW50cy5cbiAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuX3Jvb3RFeGVjKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gc2NvcGVGdW5jLmFwcGx5KHRyYW5zLCB0YWJsZUFyZ3MpOyAvLyBOT1RFOiByZXR1cm5WYWx1ZSBpcyB1c2VkIGluIHRyYW5zLm9uLmNvbXBsZXRlKCkgbm90IGFzIGEgcmV0dXJuVmFsdWUgdG8gdGhpcyBmdW5jLlxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRyYW5zLmlkYnRyYW5zIHx8IChwYXJlbnRUcmFuc2FjdGlvbiAmJiB1bmNvbXBsZXRlZFJlcXVlc3RzID09PSAwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuX25vcCgpOyAvLyBNYWtlIHN1cmUgdHJhbnNhY3Rpb24gaXMgYmVpbmcgdXNlZCBzbyB0aGF0IGl0IHdpbGwgcmVzb2x2ZS5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgZXhjZXB0aW9uIG9jY3VyLCBhYm9ydCB0aGUgdHJhbnNhY3Rpb24gYW5kIHJlamVjdCBQcm9taXNlLlxuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnMgJiYgdHJhbnMuaWRidHJhbnMpIHRyYW5zLmlkYnRyYW5zLm9uZXJyb3IgPSBwcmV2ZW50RGVmYXVsdDsgLy8gUHJvaGliaXQgQWJvcnRFcnJvciBmcm9tIGZpcmluZy5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zKSB0cmFucy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50VHJhbnNhY3Rpb24pIHBhcmVudFRyYW5zYWN0aW9uLm9uLmVycm9yLmZpcmUoZSk7XG4gICAgICAgICAgICAgICAgICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTmVlZCB0byB1c2UgYXNhcCg9c2V0SW1tZWRpYXRlL3NldFRpbWVvdXQpIGJlZm9yZSBjYWxsaW5nIHJlamVjdCBiZWNhdXNlIHdlIGFyZSBpbiB0aGUgUHJvbWlzZSBjb25zdHJ1Y3RvciBhbmQgcmVqZWN0KCkgd2lsbCBhbHdheXMgcmV0dXJuIGZhbHNlIGlmIHNvLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZWplY3QoZSkpIGRiLm9uKFwiZXJyb3JcIikuZmlyZShlKTsgLy8gSWYgbm90IGNhdGNoZWQsIGJ1YmJsZSBleGNlcHRpb24gdG8gZGIub24oXCJlcnJvclwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9OyBcblxuICAgICAgICB0aGlzLnRhYmxlID0gZnVuY3Rpb24gKHRhYmxlTmFtZSkge1xuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJXcml0ZWFibGVUYWJsZVwiPjwvcmV0dXJucz5cbiAgICAgICAgICAgIGlmIChmYWtlICYmIGF1dG9TY2hlbWEpIHJldHVybiBuZXcgV3JpdGVhYmxlVGFibGUodGFibGVOYW1lKTtcbiAgICAgICAgICAgIGlmICghYWxsVGFibGVzLmhhc093blByb3BlcnR5KHRhYmxlTmFtZSkpIHsgdGhyb3cgbmV3IEVycm9yKFwiVGFibGUgZG9lcyBub3QgZXhpc3RcIik7IHJldHVybiB7IEFOX1VOS05PV05fVEFCTEVfTkFNRV9XQVNfU1BFQ0lGSUVEOiAxIH07IH1cbiAgICAgICAgICAgIHJldHVybiBhbGxUYWJsZXNbdGFibGVOYW1lXTtcbiAgICAgICAgfTtcblxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyBUYWJsZSBDbGFzc1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICBmdW5jdGlvbiBUYWJsZShuYW1lLCB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5LCB0YWJsZVNjaGVtYSwgY29sbENsYXNzKSB7XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJuYW1lXCIgdHlwZT1cIlN0cmluZ1wiPjwvcGFyYW0+XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgdGhpcy5zY2hlbWEgPSB0YWJsZVNjaGVtYTtcbiAgICAgICAgICAgIHRoaXMuaG9vayA9IGFsbFRhYmxlc1tuYW1lXSA/IGFsbFRhYmxlc1tuYW1lXS5ob29rIDogZXZlbnRzKG51bGwsIHtcbiAgICAgICAgICAgICAgICBcImNyZWF0aW5nXCI6IFtob29rQ3JlYXRpbmdDaGFpbiwgbm9wXSxcbiAgICAgICAgICAgICAgICBcInJlYWRpbmdcIjogW3B1cmVGdW5jdGlvbkNoYWluLCBtaXJyb3JdLFxuICAgICAgICAgICAgICAgIFwidXBkYXRpbmdcIjogW2hvb2tVcGRhdGluZ0NoYWluLCBub3BdLFxuICAgICAgICAgICAgICAgIFwiZGVsZXRpbmdcIjogW25vblN0b3BwYWJsZUV2ZW50Q2hhaW4sIG5vcF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fdHBmID0gdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeTtcbiAgICAgICAgICAgIHRoaXMuX2NvbGxDbGFzcyA9IGNvbGxDbGFzcyB8fCBDb2xsZWN0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgZXh0ZW5kKFRhYmxlLnByb3RvdHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gZmFpbFJlYWRvbmx5KCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkN1cnJlbnQgVHJhbnNhY3Rpb24gaXMgUkVBRE9OTFlcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gVGFibGUgUHJvdGVjdGVkIE1ldGhvZHNcbiAgICAgICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAgICAgX3RyYW5zOiBmdW5jdGlvbiBnZXRUcmFuc2FjdGlvbihtb2RlLCBmbiwgd3JpdGVMb2NrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RwZihtb2RlLCBbdGhpcy5uYW1lXSwgZm4sIHdyaXRlTG9ja2VkKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9pZGJzdG9yZTogZnVuY3Rpb24gZ2V0SURCT2JqZWN0U3RvcmUobW9kZSwgZm4sIHdyaXRlTG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmYWtlKSByZXR1cm4gbmV3IFByb21pc2UoZm4pOyAvLyBTaW1wbGlmeSB0aGUgd29yayBmb3IgSW50ZWxsaXNlbnNlL0NvZGUgY29tcGxldGlvbi5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fdHBmKG1vZGUsIFt0aGlzLm5hbWVdLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCB0cmFucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm4ocmVzb2x2ZSwgcmVqZWN0LCB0cmFucy5pZGJ0cmFucy5vYmplY3RTdG9yZShzZWxmLm5hbWUpLCB0cmFucyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHdyaXRlTG9ja2VkKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBUYWJsZSBQdWJsaWMgTWV0aG9kc1xuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoa2V5LCBjYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pZGJzdG9yZShSRUFET05MWSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZha2UgJiYgcmVzb2x2ZShzZWxmLnNjaGVtYS5pbnN0YW5jZVRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXEgPSBpZGJzdG9yZS5nZXQoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgW1wiZ2V0dGluZ1wiLCBrZXksIFwiZnJvbVwiLCBzZWxmLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzZWxmLmhvb2sucmVhZGluZy5maXJlKHJlcS5yZXN1bHQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oY2IpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgd2hlcmU6IGZ1bmN0aW9uIChpbmRleE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBXaGVyZUNsYXVzZSh0aGlzLCBpbmRleE5hbWUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY291bnQ6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50b0NvbGxlY3Rpb24oKS5jb3VudChjYik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9Db2xsZWN0aW9uKCkub2Zmc2V0KG9mZnNldCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBsaW1pdDogZnVuY3Rpb24gKG51bVJvd3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9Db2xsZWN0aW9uKCkubGltaXQobnVtUm93cyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXZlcnNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvQ29sbGVjdGlvbigpLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZpbHRlcjogZnVuY3Rpb24gKGZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvQ29sbGVjdGlvbigpLmFuZChmaWx0ZXJGdW5jdGlvbik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlYWNoOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBmYWtlICYmIGZuKHNlbGYuc2NoZW1hLmluc3RhbmNlVGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faWRic3RvcmUoUkVBRE9OTFksIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVxID0gaWRic3RvcmUub3BlbkN1cnNvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBbXCJjYWxsaW5nXCIsIFwiVGFibGUuZWFjaCgpXCIsIFwib25cIiwgc2VsZi5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRlKHJlcSwgbnVsbCwgZm4sIHJlc29sdmUsIHJlamVjdCwgc2VsZi5ob29rLnJlYWRpbmcuZmlyZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdG9BcnJheTogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lkYnN0b3JlKFJFQURPTkxZLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmFrZSAmJiByZXNvbHZlKFtzZWxmLnNjaGVtYS5pbnN0YW5jZVRlbXBsYXRlXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcSA9IGlkYnN0b3JlLm9wZW5DdXJzb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgW1wiY2FsbGluZ1wiLCBcIlRhYmxlLnRvQXJyYXkoKVwiLCBcIm9uXCIsIHNlbGYubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZShyZXEsIG51bGwsIGZ1bmN0aW9uIChpdGVtKSB7IGEucHVzaChpdGVtKTsgfSwgZnVuY3Rpb24gKCkgeyByZXNvbHZlKGEpOyB9LCByZWplY3QsIHNlbGYuaG9vay5yZWFkaW5nLmZpcmUpO1xuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9yZGVyQnk6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuX2NvbGxDbGFzcyhuZXcgV2hlcmVDbGF1c2UodGhpcywgaW5kZXgpKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgdG9Db2xsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5fY29sbENsYXNzKG5ldyBXaGVyZUNsYXVzZSh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIG1hcFRvQ2xhc3M6IGZ1bmN0aW9uIChjb25zdHJ1Y3Rvciwgc3RydWN0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgLy8vICAgICBNYXAgdGFibGUgdG8gYSBqYXZhc2NyaXB0IGNvbnN0cnVjdG9yIGZ1bmN0aW9uLiBPYmplY3RzIHJldHVybmVkIGZyb20gdGhlIGRhdGFiYXNlIHdpbGwgYmUgaW5zdGFuY2VzIG9mIHRoaXMgY2xhc3MsIG1ha2luZ1xuICAgICAgICAgICAgICAgICAgICAvLy8gICAgIGl0IHBvc3NpYmxlIHRvIHRoZSBpbnN0YW5jZU9mIG9wZXJhdG9yIGFzIHdlbGwgYXMgZXh0ZW5kaW5nIHRoZSBjbGFzcyB1c2luZyBjb25zdHJ1Y3Rvci5wcm90b3R5cGUubWV0aG9kID0gZnVuY3Rpb24oKXsuLi59LlxuICAgICAgICAgICAgICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjb25zdHJ1Y3RvclwiPkNvbnN0cnVjdG9yIGZ1bmN0aW9uIHJlcHJlc2VudGluZyB0aGUgY2xhc3MuPC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwic3RydWN0dXJlXCIgb3B0aW9uYWw9XCJ0cnVlXCI+SGVscHMgSURFIGNvZGUgY29tcGxldGlvbiBieSBrbm93aW5nIHRoZSBtZW1iZXJzIHRoYXQgb2JqZWN0cyBjb250YWluIGFuZCBub3QganVzdCB0aGUgaW5kZXhlcy4gQWxzb1xuICAgICAgICAgICAgICAgICAgICAvLy8ga25vdyB3aGF0IHR5cGUgZWFjaCBtZW1iZXIgaGFzLiBFeGFtcGxlOiB7bmFtZTogU3RyaW5nLCBlbWFpbEFkZHJlc3NlczogW1N0cmluZ10sIHBhc3N3b3JkfTwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NoZW1hLm1hcHBlZENsYXNzID0gY29uc3RydWN0b3I7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnN0YW5jZVRlbXBsYXRlID0gT2JqZWN0LmNyZWF0ZShjb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RydWN0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzdHJ1Y3R1cmUgYW5kIGluc3RhbmNlVGVtcGxhdGUgaXMgZm9yIElERSBjb2RlIGNvbXBldGlvbiBvbmx5IHdoaWxlIGNvbnN0cnVjdG9yLnByb3RvdHlwZSBpcyBmb3IgYWN0dWFsIGluaGVyaXRhbmNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTdHJ1Y3R1cmUoaW5zdGFuY2VUZW1wbGF0ZSwgc3RydWN0dXJlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjaGVtYS5pbnN0YW5jZVRlbXBsYXRlID0gaW5zdGFuY2VUZW1wbGF0ZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBOb3csIHN1YnNjcmliZSB0byB0aGUgd2hlbihcInJlYWRpbmdcIikgZXZlbnQgdG8gbWFrZSBhbGwgb2JqZWN0cyB0aGF0IGNvbWUgb3V0IGZyb20gdGhpcyB0YWJsZSBpbmhlcml0IGZyb20gZ2l2ZW4gY2xhc3NcbiAgICAgICAgICAgICAgICAgICAgLy8gbm8gbWF0dGVyIHdoaWNoIG1ldGhvZCB0byB1c2UgZm9yIHJlYWRpbmcgKFRhYmxlLmdldCgpIG9yIFRhYmxlLndoZXJlKC4uLikuLi4gKVxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVhZEhvb2sgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9iaikgcmV0dXJuIG9iajsgLy8gTm8gdmFsaWQgb2JqZWN0LiAoVmFsdWUgaXMgbnVsbCkuIFJldHVybiBhcyBpcy5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBvYmplY3QgdGhhdCBkZXJpdmVzIGZyb20gY29uc3RydWN0b3I6XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzID0gT2JqZWN0LmNyZWF0ZShjb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xvbmUgbWVtYmVyczpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG0gaW4gb2JqKSBpZiAob2JqLmhhc093blByb3BlcnR5KG0pKSByZXNbbV0gPSBvYmpbbV07XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNjaGVtYS5yZWFkSG9vaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ob29rLnJlYWRpbmcudW5zdWJzY3JpYmUodGhpcy5zY2hlbWEucmVhZEhvb2spO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NoZW1hLnJlYWRIb29rID0gcmVhZEhvb2s7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaG9vayhcInJlYWRpbmdcIiwgcmVhZEhvb2spO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29uc3RydWN0b3I7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBkZWZpbmVDbGFzczogZnVuY3Rpb24gKHN0cnVjdHVyZSkge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgIC8vLyAgICAgRGVmaW5lIGFsbCBtZW1iZXJzIG9mIHRoZSBjbGFzcyB0aGF0IHJlcHJlc2VudHMgdGhlIHRhYmxlLiBUaGlzIHdpbGwgaGVscCBjb2RlIGNvbXBsZXRpb24gb2Ygd2hlbiBvYmplY3RzIGFyZSByZWFkIGZyb20gdGhlIGRhdGFiYXNlXG4gICAgICAgICAgICAgICAgICAgIC8vLyAgICAgYXMgd2VsbCBhcyBtYWtpbmcgaXQgcG9zc2libGUgdG8gZXh0ZW5kIHRoZSBwcm90b3R5cGUgb2YgdGhlIHJldHVybmVkIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJzdHJ1Y3R1cmVcIj5IZWxwcyBJREUgY29kZSBjb21wbGV0aW9uIGJ5IGtub3dpbmcgdGhlIG1lbWJlcnMgdGhhdCBvYmplY3RzIGNvbnRhaW4gYW5kIG5vdCBqdXN0IHRoZSBpbmRleGVzLiBBbHNvXG4gICAgICAgICAgICAgICAgICAgIC8vLyBrbm93IHdoYXQgdHlwZSBlYWNoIG1lbWJlciBoYXMuIEV4YW1wbGU6IHtuYW1lOiBTdHJpbmcsIGVtYWlsQWRkcmVzc2VzOiBbU3RyaW5nXSwgcHJvcGVydGllczoge3Nob2VTaXplOiBOdW1iZXJ9fTwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcFRvQ2xhc3MoRGV4aWUuZGVmaW5lQ2xhc3Moc3RydWN0dXJlKSwgc3RydWN0dXJlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFkZDogZmFpbFJlYWRvbmx5LFxuICAgICAgICAgICAgICAgIHB1dDogZmFpbFJlYWRvbmx5LFxuICAgICAgICAgICAgICAgICdkZWxldGUnOiBmYWlsUmVhZG9ubHksXG4gICAgICAgICAgICAgICAgY2xlYXI6IGZhaWxSZWFkb25seSxcbiAgICAgICAgICAgICAgICB1cGRhdGU6IGZhaWxSZWFkb25seVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV3JpdGVhYmxlVGFibGUgQ2xhc3MgKGV4dGVuZHMgVGFibGUpXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIGZ1bmN0aW9uIFdyaXRlYWJsZVRhYmxlKG5hbWUsIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnksIHRhYmxlU2NoZW1hLCBjb2xsQ2xhc3MpIHtcbiAgICAgICAgICAgIFRhYmxlLmNhbGwodGhpcywgbmFtZSwgdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeSwgdGFibGVTY2hlbWEsIGNvbGxDbGFzcyB8fCBXcml0ZWFibGVDb2xsZWN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlcml2ZShXcml0ZWFibGVUYWJsZSkuZnJvbShUYWJsZSkuZXh0ZW5kKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgYWRkOiBmdW5jdGlvbiAob2JqLCBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAvLy8gICBBZGQgYW4gb2JqZWN0IHRvIHRoZSBkYXRhYmFzZS4gSW4gY2FzZSBhbiBvYmplY3Qgd2l0aCBzYW1lIHByaW1hcnkga2V5IGFscmVhZHkgZXhpc3RzLCB0aGUgb2JqZWN0IHdpbGwgbm90IGJlIGFkZGVkLlxuICAgICAgICAgICAgICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJvYmpcIiB0eXBlPVwiT2JqZWN0XCI+QSBqYXZhc2NyaXB0IG9iamVjdCB0byBpbnNlcnQ8L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJrZXlcIiBvcHRpb25hbD1cInRydWVcIj5QcmltYXJ5IGtleTwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0aW5nSG9vayA9IHRoaXMuaG9vay5jcmVhdGluZy5maXJlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faWRic3RvcmUoUkVBRFdSSVRFLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSwgdHJhbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzQ3R4ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3JlYXRpbmdIb29rICE9PSBub3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWZmZWN0aXZlS2V5ID0ga2V5IHx8IChpZGJzdG9yZS5rZXlQYXRoID8gZ2V0QnlLZXlQYXRoKG9iaiwgaWRic3RvcmUua2V5UGF0aCkgOiB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXlUb1VzZSA9IGNyZWF0aW5nSG9vay5jYWxsKHRoaXNDdHgsIGVmZmVjdGl2ZUtleSwgb2JqLCB0cmFucyk7IC8vIEFsbG93IHN1YnNjcmliZXJzIHRvIHdoZW4oXCJjcmVhdGluZ1wiKSB0byBnZW5lcmF0ZSB0aGUga2V5LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZmZlY3RpdmVLZXkgPT09IHVuZGVmaW5lZCAmJiBrZXlUb1VzZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZGJzdG9yZS5rZXlQYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QnlLZXlQYXRoKG9iaiwgaWRic3RvcmUua2V5UGF0aCwga2V5VG9Vc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXkgPSBrZXlUb1VzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcSA9IGtleSA/IGlkYnN0b3JlLmFkZChvYmosIGtleSkgOiBpZGJzdG9yZS5hZGQob2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpc0N0eC5vbmVycm9yKSB0aGlzQ3R4Lm9uZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgW1wiYWRkaW5nXCIsIG9iaiwgXCJpbnRvXCIsIHNlbGYubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleVBhdGggPSBpZGJzdG9yZS5rZXlQYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5UGF0aCkgc2V0QnlLZXlQYXRoKG9iaiwga2V5UGF0aCwgZXYudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzQ3R4Lm9uc3VjY2VzcykgdGhpc0N0eC5vbnN1Y2Nlc3MoZXYudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLm9uKFwiZXJyb3JcIikuZmlyZShlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgcHV0OiBmdW5jdGlvbiAob2JqLCBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAvLy8gICBBZGQgYW4gb2JqZWN0IHRvIHRoZSBkYXRhYmFzZSBidXQgaW4gY2FzZSBhbiBvYmplY3Qgd2l0aCBzYW1lIHByaW1hcnkga2V5IGFscmVhZCBleGlzdHMsIHRoZSBleGlzdGluZyBvbmUgd2lsbCBnZXQgdXBkYXRlZC5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwib2JqXCIgdHlwZT1cIk9iamVjdFwiPkEgamF2YXNjcmlwdCBvYmplY3QgdG8gaW5zZXJ0IG9yIHVwZGF0ZTwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImtleVwiIG9wdGlvbmFsPVwidHJ1ZVwiPlByaW1hcnkga2V5PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRpbmdIb29rID0gdGhpcy5ob29rLmNyZWF0aW5nLmZpcmUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGluZ0hvb2sgPSB0aGlzLmhvb2sudXBkYXRpbmcuZmlyZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNyZWF0aW5nSG9vayAhPT0gbm9wIHx8IHVwZGF0aW5nSG9vayAhPT0gbm9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGVvcGxlIGxpc3RlbnMgdG8gd2hlbihcImNyZWF0aW5nXCIpIG9yIHdoZW4oXCJ1cGRhdGluZ1wiKSBldmVudHMhXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBtdXN0IGtub3cgd2hldGhlciB0aGUgcHV0IG9wZXJhdGlvbiByZXN1bHRzIGluIGFuIENSRUFURSBvciBVUERBVEUuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RyYW5zKFJFQURXUklURSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgdHJhbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaW5jZSBrZXkgaXMgb3B0aW9uYWwsIG1ha2Ugc3VyZSB3ZSBnZXQgaXQgZnJvbSBvYmogaWYgbm90IHByb3ZpZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVmZmVjdGl2ZUtleSA9IGtleSB8fCAoc2VsZi5zY2hlbWEucHJpbUtleS5rZXlQYXRoICYmIGdldEJ5S2V5UGF0aChvYmosIHNlbGYuc2NoZW1hLnByaW1LZXkua2V5UGF0aCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZmZlY3RpdmVLZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBwcmltYXJ5IGtleS4gTXVzdCB1c2UgYWRkKCkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLnRhYmxlc1tzZWxmLm5hbWVdLmFkZChvYmopLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmltYXJ5IGtleSBleGlzdC4gTG9jayB0cmFuc2FjdGlvbiBhbmQgdHJ5IG1vZGlmeWluZyBleGlzdGluZy4gSWYgbm90aGluZyBtb2RpZmllZCwgY2FsbCBhZGQoKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuX2xvY2soKTsgLy8gTmVlZGVkIGJlY2F1c2Ugb3BlcmF0aW9uIGlzIHNwbGl0dGVkIGludG8gbW9kaWZ5KCkgYW5kIGFkZCgpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjbG9uZSBvYmogYmVmb3JlIHRoaXMgYXN5bmMgY2FsbC4gSWYgY2FsbGVyIG1vZGlmaWVzIG9iaiB0aGUgbGluZSBhZnRlciBwdXQoKSwgdGhlIElEQiBzcGVjIHJlcXVpcmVzIHRoYXQgaXQgc2hvdWxkIG5vdCBhZmZlY3Qgb3BlcmF0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmogPSBkZWVwQ2xvbmUob2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMudGFibGVzW3NlbGYubmFtZV0ud2hlcmUoXCI6aWRcIikuZXF1YWxzKGVmZmVjdGl2ZUtleSkubW9kaWZ5KGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVwbGFjZSBleHRpc3RpbmcgdmFsdWUgd2l0aCBvdXIgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDUlVEIGV2ZW50IGZpcmluZyBoYW5kbGVkIGluIFdyaXRlYWJsZUNvbGxlY3Rpb24ubW9kaWZ5KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBvYmo7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPYmplY3QncyBrZXkgd2FzIG5vdCBmb3VuZC4gQWRkIHRoZSBvYmplY3QgaW5zdGVhZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDUlVEIGV2ZW50IGZpcmluZyB3aWxsIGJlIGRvbmUgaW4gYWRkKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnMudGFibGVzW3NlbGYubmFtZV0uYWRkKG9iaiwga2V5KTsgLy8gUmVzb2x2aW5nIHdpdGggYW5vdGhlciBQcm9taXNlLiBSZXR1cm5lZCBQcm9taXNlIHdpbGwgdGhlbiByZXNvbHZlIHdpdGggdGhlIG5ldyBrZXkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlZmZlY3RpdmVLZXk7IC8vIFJlc29sdmUgd2l0aCB0aGUgcHJvdmlkZWQga2V5LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5maW5hbGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLl91bmxvY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIHRoZSBzdGFuZGFyZCBJREIgcHV0KCkgbWV0aG9kLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lkYnN0b3JlKFJFQURXUklURSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVxID0ga2V5ID8gaWRic3RvcmUucHV0KG9iaiwga2V5KSA6IGlkYnN0b3JlLnB1dChvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgW1wicHV0dGluZ1wiLCBvYmosIFwiaW50b1wiLCBzZWxmLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXlQYXRoID0gaWRic3RvcmUua2V5UGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleVBhdGgpIHNldEJ5S2V5UGF0aChvYmosIGtleVBhdGgsIGV2LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAnZGVsZXRlJzogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJrZXlcIj5QcmltYXJ5IGtleSBvZiB0aGUgb2JqZWN0IHRvIGRlbGV0ZTwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhvb2suZGVsZXRpbmcuc3Vic2NyaWJlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQZW9wbGUgbGlzdGVucyB0byB3aGVuKFwiZGVsZXRpbmdcIikgZXZlbnQuIE11c3QgaW1wbGVtZW50IGRlbGV0ZSB1c2luZyBXcml0ZWFibGVDb2xsZWN0aW9uLmRlbGV0ZSgpIHRoYXQgd2lsbFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FsbCB0aGUgQ1JVRCBldmVudC4gT25seSBXcml0ZWFibGVDb2xsZWN0aW9uLmRlbGV0ZSgpIHdpbGwga25vdyB3aGV0aGVyIGFuIG9iamVjdCB3YXMgYWN0dWFsbHkgZGVsZXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndoZXJlKFwiOmlkXCIpLmVxdWFscyhrZXkpLmRlbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm8gb25lIGxpc3RlbnMuIFVzZSBzdGFuZGFyZCBJREIgZGVsZXRlKCkgbWV0aG9kLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lkYnN0b3JlKFJFQURXUklURSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVxID0gaWRic3RvcmUuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBbXCJkZWxldGluZ1wiLCBrZXksIFwiZnJvbVwiLCBpZGJzdG9yZS5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBjbGVhcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5ob29rLmRlbGV0aW5nLnN1YnNjcmliZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGVvcGxlIGxpc3RlbnMgdG8gd2hlbihcImRlbGV0aW5nXCIpIGV2ZW50LiBNdXN0IGltcGxlbWVudCBkZWxldGUgdXNpbmcgV3JpdGVhYmxlQ29sbGVjdGlvbi5kZWxldGUoKSB0aGF0IHdpbGxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbGwgdGhlIENSVUQgZXZlbnQuIE9ubHkgV3JpdGVhYmxlQ29sbGVjdGlvbi5kZWxldGUoKSB3aWxsIGtub3dzIHdoaWNoIG9iamVjdHMgdGhhdCBhcmUgYWN0dWFsbHkgZGVsZXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvQ29sbGVjdGlvbigpLmRlbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lkYnN0b3JlKFJFQURXUklURSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVxID0gaWRic3RvcmUuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIFtcImNsZWFyaW5nXCIsIGlkYnN0b3JlLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKGtleU9yT2JqZWN0LCBtb2RpZmljYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbW9kaWZpY2F0aW9ucyAhPT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShtb2RpZmljYXRpb25zKSkgdGhyb3cgbmV3IEVycm9yKFwiZGIudXBkYXRlKGtleU9yT2JqZWN0LCBtb2RpZmljYXRpb25zKS4gbW9kaWZpY2F0aW9ucyBtdXN0IGJlIGFuIG9iamVjdC5cIik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Yga2V5T3JPYmplY3QgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGtleU9yT2JqZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0IHRvIG1vZGlmeS4gQWxzbyBtb2RpZnkgZ2l2ZW4gb2JqZWN0IHdpdGggdGhlIG1vZGlmaWNhdGlvbnM6XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhtb2RpZmljYXRpb25zKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXlQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QnlLZXlQYXRoKGtleU9yT2JqZWN0LCBrZXlQYXRoLCBtb2RpZmljYXRpb25zW2tleVBhdGhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IGdldEJ5S2V5UGF0aChrZXlPck9iamVjdCwgdGhpcy5zY2hlbWEucHJpbUtleS5rZXlQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiT2JqZWN0IGRvZXMgbm90IGNvbnRhaW4gaXRzIHByaW1hcnkga2V5XCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndoZXJlKFwiOmlkXCIpLmVxdWFscyhrZXkpLm1vZGlmeShtb2RpZmljYXRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGtleSB0byBtb2RpZnlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndoZXJlKFwiOmlkXCIpLmVxdWFscyhrZXlPck9iamVjdCkubW9kaWZ5KG1vZGlmaWNhdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRyYW5zYWN0aW9uIENsYXNzXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIGZ1bmN0aW9uIFRyYW5zYWN0aW9uKG1vZGUsIHN0b3JlTmFtZXMsIGRic2NoZW1hLCBwYXJlbnQpIHtcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgICAgIC8vLyAgICBUcmFuc2FjdGlvbiBjbGFzcy4gUmVwcmVzZW50cyBhIGRhdGFiYXNlIHRyYW5zYWN0aW9uLiBBbGwgb3BlcmF0aW9ucyBvbiBkYiBnb2VzIHRocm91Z2ggYSBUcmFuc2FjdGlvbi5cbiAgICAgICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJtb2RlXCIgdHlwZT1cIlN0cmluZ1wiPkFueSBvZiBcInJlYWR3cml0ZVwiIG9yIFwicmVhZG9ubHlcIjwvcGFyYW0+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJzdG9yZU5hbWVzXCIgdHlwZT1cIkFycmF5XCI+QXJyYXkgb2YgdGFibGUgbmFtZXMgdG8gb3BlcmF0ZSBvbjwvcGFyYW0+XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLmRiID0gZGI7XG4gICAgICAgICAgICB0aGlzLm1vZGUgPSBtb2RlO1xuICAgICAgICAgICAgdGhpcy5zdG9yZU5hbWVzID0gc3RvcmVOYW1lcztcbiAgICAgICAgICAgIHRoaXMuaWRidHJhbnMgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5vbiA9IGV2ZW50cyh0aGlzLCBbXCJjb21wbGV0ZVwiLCBcImVycm9yXCJdLCBcImFib3J0XCIpO1xuICAgICAgICAgICAgdGhpcy5fcmVjdWxvY2sgPSAwO1xuICAgICAgICAgICAgdGhpcy5fYmxvY2tlZEZ1bmNzID0gW107XG4gICAgICAgICAgICB0aGlzLl9wc2QgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fZGJzY2hlbWEgPSBkYnNjaGVtYTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgdGhpcy5fdHBmID0gdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeTtcbiAgICAgICAgICAgIHRoaXMudGFibGVzID0gT2JqZWN0LmNyZWF0ZShub3RJblRyYW5zRmFsbGJhY2tUYWJsZXMpOyAvLyAuLi5zbyB0aGF0IGFsbCBub24taW5jbHVkZWQgdGFibGVzIGV4aXN0cyBhcyBpbnN0YW5jZXMgKHBvc3NpYmxlIHRvIGNhbGwgdGFibGUubmFtZSBmb3IgZXhhbXBsZSkgYnV0IHdpbGwgZmFpbCBhcyBzb29uIGFzIHRyeWluZyB0byBleGVjdXRlIGEgcXVlcnkgb24gaXQuXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnkobW9kZSwgc3RvcmVOYW1lcywgZm4sIHdyaXRlTG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlcyBhIFByb21pc2UgaW5zdGFuY2UgYW5kIGNhbGxzIGZuIChyZXNvbHZlLCByZWplY3QsIHRyYW5zKSB3aGVyZSB0cmFucyBpcyB0aGUgaW5zdGFuY2Ugb2YgdGhpcyB0cmFuc2FjdGlvbiBvYmplY3QuXG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydCBmb3Igd3JpdGUtbG9ja2luZyB0aGUgdHJhbnNhY3Rpb24gZHVyaW5nIHRoZSBwcm9taXNlIGxpZmUgdGltZSBmcm9tIGNyZWF0aW9uIHRvIHN1Y2Nlc3MvZmFpbHVyZS5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGFjdHVhbGx5IG5vdCBuZWVkZWQgd2hlbiBqdXN0IHVzaW5nIHNpbmdsZSBvcGVyYXRpb25zIG9uIElEQiwgc2luY2UgSURCIGltcGxlbWVudHMgdGhpcyBpbnRlcm5hbGx5LlxuICAgICAgICAgICAgICAgIC8vIEhvd2V2ZXIsIHdoZW4gaW1wbGVtZW50aW5nIGEgd3JpdGUgb3BlcmF0aW9uIGFzIGEgc2VyaWVzIG9mIG9wZXJhdGlvbnMgb24gdG9wIG9mIElEQihjb2xsZWN0aW9uLmRlbGV0ZSgpIGFuZCBjb2xsZWN0aW9uLm1vZGlmeSgpIGZvciBleGFtcGxlKSxcbiAgICAgICAgICAgICAgICAvLyBsb2NrIGlzIGluZGVlZCBuZWVkZWQgaWYgRGV4aWUgQVBJc2hvdWxkIGJlaGF2ZSBpbiBhIGNvbnNpc3RlbnQgbWFubmVyIGZvciB0aGUgQVBJIHVzZXIuXG4gICAgICAgICAgICAgICAgLy8gQW5vdGhlciBleGFtcGxlIG9mIHRoaXMgaXMgaWYgd2Ugd2FudCB0byBzdXBwb3J0IGNyZWF0ZS91cGRhdGUvZGVsZXRlIGV2ZW50cyxcbiAgICAgICAgICAgICAgICAvLyB3ZSBuZWVkIHRvIGltcGxlbWVudCBwdXQoKSB1c2luZyBhIHNlcmllcyBvZiBvdGhlciBJREIgb3BlcmF0aW9ucyBidXQgc3RpbGwgbmVlZCB0byBsb2NrIHRoZSB0cmFuc2FjdGlvbiBhbGwgdGhlIHdheS5cbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5fcHJvbWlzZShtb2RlLCBmbiwgd3JpdGVMb2NrZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gc3RvcmVOYW1lcy5sZW5ndGggLSAxOyBpICE9PSAtMTsgLS1pKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBzdG9yZU5hbWVzW2ldO1xuICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IGRiLl90YWJsZUZhY3RvcnkobW9kZSwgZGJzY2hlbWFbbmFtZV0sIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnkpO1xuICAgICAgICAgICAgICAgIHRoaXMudGFibGVzW25hbWVdID0gdGFibGU7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzW25hbWVdKSB0aGlzW25hbWVdID0gdGFibGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHRlbmQoVHJhbnNhY3Rpb24ucHJvdG90eXBlLCB7XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gVHJhbnNhY3Rpb24gUHJvdGVjdGVkIE1ldGhvZHMgKG5vdCByZXF1aXJlZCBieSBBUEkgdXNlcnMsIGJ1dCBuZWVkZWQgaW50ZXJuYWxseSBhbmQgZXZlbnR1YWxseSBieSBkZXhpZSBleHRlbnNpb25zKVxuICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgX2xvY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBUZW1wb3Jhcnkgc2V0IGFsbCByZXF1ZXN0cyBpbnRvIGEgcGVuZGluZyBxdWV1ZSBpZiB0aGV5IGFyZSBjYWxsZWQgYmVmb3JlIGRhdGFiYXNlIGlzIHJlYWR5LlxuICAgICAgICAgICAgICAgICsrdGhpcy5fcmVjdWxvY2s7IC8vIFJlY3Vyc2l2ZSByZWFkL3dyaXRlIGxvY2sgcGF0dGVybiB1c2luZyBQU0QgKFByb21pc2UgU3BlY2lmaWMgRGF0YSkgaW5zdGVhZCBvZiBUTFMgKFRocmVhZCBMb2NhbCBTdG9yYWdlKVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9yZWN1bG9jayA9PT0gMSAmJiBQcm9taXNlLlBTRCkgUHJvbWlzZS5QU0QubG9ja093bmVyRm9yID0gdGhpcztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfdW5sb2NrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKC0tdGhpcy5fcmVjdWxvY2sgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFByb21pc2UuUFNEKSBQcm9taXNlLlBTRC5sb2NrT3duZXJGb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5fYmxvY2tlZEZ1bmNzLmxlbmd0aCA+IDAgJiYgIXRoaXMuX2xvY2tlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSB0aGlzLl9ibG9ja2VkRnVuY3Muc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7IGZuKCk7IH0gY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9sb2NrZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBDaGVja3MgaWYgYW55IHdyaXRlLWxvY2sgaXMgYXBwbGllZCBvbiB0aGlzIHRyYW5zYWN0aW9uLlxuICAgICAgICAgICAgICAgIC8vIFRvIHNpbXBsaWZ5IHRoZSBEZXhpZSBBUEkgZm9yIGV4dGVuc2lvbiBpbXBsZW1lbnRhdGlvbnMsIHdlIHN1cHBvcnQgcmVjdXJzaXZlIGxvY2tzLlxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYWNjb21wbGlzaGVkIGJ5IHVzaW5nIFwiUHJvbWlzZSBTcGVjaWZpYyBEYXRhXCIgKFBTRCkuXG4gICAgICAgICAgICAgICAgLy8gUFNEIGRhdGEgaXMgYm91bmQgdG8gYSBQcm9taXNlIGFuZCBhbnkgY2hpbGQgUHJvbWlzZSBlbWl0dGVkIHRocm91Z2ggdGhlbigpIG9yIHJlc29sdmUoIG5ldyBQcm9taXNlKCkgKS5cbiAgICAgICAgICAgICAgICAvLyBQcm9taXNlLlBTRCBpcyBsb2NhbCB0byBjb2RlIGV4ZWN1dGluZyBvbiB0b3Agb2YgdGhlIGNhbGwgc3RhY2tzIG9mIGFueSBvZiBhbnkgY29kZSBleGVjdXRlZCBieSBQcm9taXNlKCk6XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAqIGNhbGxiYWNrIGdpdmVuIHRvIHRoZSBQcm9taXNlKCkgY29uc3RydWN0b3IgIChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KXsuLi59KVxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgKiBjYWxsYmFja3MgZ2l2ZW4gdG8gdGhlbigpL2NhdGNoKCkvZmluYWxseSgpIG1ldGhvZHMgKGZ1bmN0aW9uICh2YWx1ZSl7Li4ufSlcbiAgICAgICAgICAgICAgICAvLyBJZiBjcmVhdGluZyBhIG5ldyBpbmRlcGVuZGFudCBQcm9taXNlIGluc3RhbmNlIGZyb20gd2l0aGluIGEgUHJvbWlzZSBjYWxsIHN0YWNrLCB0aGUgbmV3IFByb21pc2Ugd2lsbCBkZXJpdmUgdGhlIFBTRCBmcm9tIHRoZSBjYWxsIHN0YWNrIG9mIHRoZSBwYXJlbnQgUHJvbWlzZS5cbiAgICAgICAgICAgICAgICAvLyBEZXJpdmF0aW9uIGlzIGRvbmUgc28gdGhhdCB0aGUgaW5uZXIgUFNEIF9fcHJvdG9fXyBwb2ludHMgdG8gdGhlIG91dGVyIFBTRC5cbiAgICAgICAgICAgICAgICAvLyBQcm9taXNlLlBTRC5sb2NrT3duZXJGb3Igd2lsbCBwb2ludCB0byBjdXJyZW50IHRyYW5zYWN0aW9uIG9iamVjdCBpZiB0aGUgY3VycmVudGx5IGV4ZWN1dGluZyBQU0Qgc2NvcGUgb3ducyB0aGUgbG9jay5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjdWxvY2sgJiYgKCFQcm9taXNlLlBTRCB8fCBQcm9taXNlLlBTRC5sb2NrT3duZXJGb3IgIT09IHRoaXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9ub3A6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgIC8vIEFuIGFzeW5jcm9uaWMgbm8tb3BlcmF0aW9uIHRoYXQgbWF5IGNhbGwgZ2l2ZW4gY2FsbGJhY2sgd2hlbiBkb25lIGRvaW5nIG5vdGhpbmcuIEFuIGFsdGVybmF0aXZlIHRvIGFzYXAoKSBpZiB3ZSBtdXN0IG5vdCBsb3NlIHRoZSB0cmFuc2FjdGlvbi5cbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlc1t0aGlzLnN0b3JlTmFtZXNbMF1dLmdldCgwKS50aGVuKGNiKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfcHJvbWlzZTogZnVuY3Rpb24gKG1vZGUsIGZuLCBiV3JpdGVMb2NrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLm5ld1BTRChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHA7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlYWQgbG9jayBhbHdheXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWxmLl9sb2NrZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHNlbGYuYWN0aXZlID8gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi5pZGJ0cmFucyAmJiBtb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaWRiZGIpIHRocm93IGRiT3BlbkVycm9yID8gbmV3IEVycm9yKFwiRGF0YWJhc2Ugbm90IG9wZW4uIEZvbGxvd2luZyBlcnJvciBpbiBwb3B1bGF0ZSwgcmVhZHkgb3IgdXBncmFkZSBmdW5jdGlvbiBtYWRlIERleGllLm9wZW4oKSBmYWlsOiBcIiArIGRiT3BlbkVycm9yKSA6IG5ldyBFcnJvcihcIkRhdGFiYXNlIG5vdCBvcGVuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWRidHJhbnMgPSBzZWxmLmlkYnRyYW5zID0gaWRiZGIudHJhbnNhY3Rpb24oc2FmYXJpTXVsdGlTdG9yZUZpeChzZWxmLnN0b3JlTmFtZXMpLCBzZWxmLm1vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGJ0cmFucy5vbmVycm9yID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub24oXCJlcnJvclwiKS5maXJlKGUgJiYgZS50YXJnZXQuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyBQcm9oaWJpdCBkZWZhdWx0IGJ1YmJsaW5nIHRvIHdpbmRvdy5lcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hYm9ydCgpOyAvLyBNYWtlIHN1cmUgdHJhbnNhY3Rpb24gaXMgYWJvcnRlZCBzaW5jZSB3ZSBwcmV2ZW50RGVmYXVsdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkYnRyYW5zLm9uYWJvcnQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgaXNzdWUgIzc4IC0gbG93IGRpc2sgc3BhY2Ugb24gY2hyb21lLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25hYm9ydCBpcyBjYWxsZWQgYnV0IG5ldmVyIG9uZXJyb3IuIENhbGwgb25lcnJvciBleHBsaWNpdGVseS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvIHRoaXMgaW4gYSBmdXR1cmUgdGljayBzbyB3ZSBhbGxvdyBkZWZhdWx0IG9uZXJyb3IgdG8gZXhlY3V0ZSBiZWZvcmUgZG9pbmcgdGhlIGZhbGxiYWNrLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNhcChmdW5jdGlvbiAoKSB7IHNlbGYub24oJ2Vycm9yJykuZmlyZShuZXcgRXJyb3IoXCJUcmFuc2FjdGlvbiBhYm9ydGVkIGZvciB1bmtub3duIHJlYXNvblwiKSk7IH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbihcImFib3J0XCIpLmZpcmUoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkYnRyYW5zLm9uY29tcGxldGUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub24oXCJjb21wbGV0ZVwiKS5maXJlKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJXcml0ZUxvY2spIHNlbGYuX2xvY2soKTsgLy8gV3JpdGUgbG9jayBpZiB3cml0ZSBvcGVyYXRpb24gaXMgcmVxdWVzdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4ocmVzb2x2ZSwgcmVqZWN0LCBzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERpcmVjdCBleGNlcHRpb24gaGFwcGVuZWQgd2hlbiBkb2luIG9wZXJhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgbXVzdCBpbW1lZGlhdGVseSBmaXJlIHRoZSBlcnJvciBhbmQgYWJvcnQgdGhlIHRyYW5zYWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIHRoaXMgaGFwcGVucyB3ZSBhcmUgc3RpbGwgY29uc3RydWN0aW5nIHRoZSBQcm9taXNlIHNvIHdlIGRvbid0IHlldCBrbm93XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdoZXRoZXIgdGhlIGNhbGxlciBpcyBhYm91dCB0byBjYXRjaCgpIHRoZSBlcnJvciBvciBub3QuIEhhdmUgdG8gbWFrZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0cmFuc2FjdGlvbiBmYWlsLiBDYXRjaGluZyBzdWNoIGFuIGVycm9yIHdvbnQgc3RvcCB0cmFuc2FjdGlvbiBmcm9tIGZhaWxpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsaW1pdGF0aW9uIHdlIGhhdmUgdG8gbGl2ZSB3aXRoLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZXhpZS5pZ25vcmVUcmFuc2FjdGlvbihmdW5jdGlvbiAoKSB7IHNlbGYub24oJ2Vycm9yJykuZmlyZShlKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pIDogUHJvbWlzZS5yZWplY3Qoc3RhY2sobmV3IEVycm9yKFwiVHJhbnNhY3Rpb24gaXMgaW5hY3RpdmUuIE9yaWdpbmFsIFNjb3BlIEZ1bmN0aW9uIFNvdXJjZTogXCIgKyBzZWxmLnNjb3BlRnVuYy50b1N0cmluZygpKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuYWN0aXZlICYmIGJXcml0ZUxvY2spIHAuZmluYWxseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fdW5sb2NrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyYW5zYWN0aW9uIGlzIHdyaXRlLWxvY2tlZC4gV2FpdCBmb3IgbXV0ZXguXG4gICAgICAgICAgICAgICAgICAgICAgICBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2Jsb2NrZWRGdW5jcy5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fcHJvbWlzZShtb2RlLCBmbiwgYldyaXRlTG9jaykudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcC5vbnVuY2F0Y2hlZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCdWJibGUgdG8gdHJhbnNhY3Rpb24uIEV2ZW4gdGhvdWdoIElEQiBkb2VzIHRoaXMgaW50ZXJuYWxseSwgaXQgd291bGQganVzdCBkbyBpdCBmb3IgZXJyb3IgZXZlbnRzIGFuZCBub3QgZm9yIGNhdWdodCBleGNlcHRpb25zLlxuICAgICAgICAgICAgICAgICAgICAgICAgRGV4aWUuaWdub3JlVHJhbnNhY3Rpb24oZnVuY3Rpb24gKCkgeyBzZWxmLm9uKFwiZXJyb3JcIikuZmlyZShlKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRyYW5zYWN0aW9uIFB1YmxpYyBNZXRob2RzXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub24oXCJjb21wbGV0ZVwiLCBjYik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9uKFwiZXJyb3JcIiwgY2IpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFib3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaWRidHJhbnMgJiYgdGhpcy5hY3RpdmUpIHRyeSB7IC8vIFRPRE86IGlmICF0aGlzLmlkYnRyYW5zLCBlbnF1ZXVlIGFuIGFib3J0KCkgb3BlcmF0aW9uLlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlkYnRyYW5zLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub24uZXJyb3IuZmlyZShuZXcgRXJyb3IoXCJUcmFuc2FjdGlvbiBBYm9ydGVkXCIpKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0YWJsZTogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudGFibGVzLmhhc093blByb3BlcnR5KG5hbWUpKSB7IHRocm93IG5ldyBFcnJvcihcIlRhYmxlIFwiICsgbmFtZSArIFwiIG5vdCBpbiB0cmFuc2FjdGlvblwiKTsgcmV0dXJuIHsgQU5fVU5LTk9XTl9UQUJMRV9OQU1FX1dBU19TUEVDSUZJRUQ6IDEgfTsgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRhYmxlc1tuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV2hlcmVDbGF1c2VcbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgZnVuY3Rpb24gV2hlcmVDbGF1c2UodGFibGUsIGluZGV4LCBvckNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInRhYmxlXCIgdHlwZT1cIlRhYmxlXCI+PC9wYXJhbT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImluZGV4XCIgdHlwZT1cIlN0cmluZ1wiIG9wdGlvbmFsPVwidHJ1ZVwiPjwvcGFyYW0+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJvckNvbGxlY3Rpb25cIiB0eXBlPVwiQ29sbGVjdGlvblwiIG9wdGlvbmFsPVwidHJ1ZVwiPjwvcGFyYW0+XG4gICAgICAgICAgICB0aGlzLl9jdHggPSB7XG4gICAgICAgICAgICAgICAgdGFibGU6IHRhYmxlLFxuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCA9PT0gXCI6aWRcIiA/IG51bGwgOiBpbmRleCxcbiAgICAgICAgICAgICAgICBjb2xsQ2xhc3M6IHRhYmxlLl9jb2xsQ2xhc3MsXG4gICAgICAgICAgICAgICAgb3I6IG9yQ29sbGVjdGlvblxuICAgICAgICAgICAgfTsgXG4gICAgICAgIH1cblxuICAgICAgICBleHRlbmQoV2hlcmVDbGF1c2UucHJvdG90eXBlLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIC8vIFdoZXJlQ2xhdXNlIHByaXZhdGUgbWV0aG9kc1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBmYWlsKGNvbGxlY3Rpb24sIGVycikge1xuICAgICAgICAgICAgICAgIHRyeSB7IHRocm93IGVycjsgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLl9jdHguZXJyb3IgPSBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0U2V0QXJncyhhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYXJnc1swXSkgPyBhcmdzWzBdIDogYXJncyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHVwcGVyRmFjdG9yeShkaXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyID09PSBcIm5leHRcIiA/IGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnRvVXBwZXJDYXNlKCk7IH0gOiBmdW5jdGlvbiAocykgeyByZXR1cm4gcy50b0xvd2VyQ2FzZSgpOyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gbG93ZXJGYWN0b3J5KGRpcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXIgPT09IFwibmV4dFwiID8gZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudG9Mb3dlckNhc2UoKTsgfSA6IGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnRvVXBwZXJDYXNlKCk7IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBuZXh0Q2FzaW5nKGtleSwgbG93ZXJLZXksIHVwcGVyTmVlZGxlLCBsb3dlck5lZWRsZSwgY21wLCBkaXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oa2V5Lmxlbmd0aCwgbG93ZXJOZWVkbGUubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB2YXIgbGxwID0gLTE7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbHdyS2V5Q2hhciA9IGxvd2VyS2V5W2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAobHdyS2V5Q2hhciAhPT0gbG93ZXJOZWVkbGVbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbXAoa2V5W2ldLCB1cHBlck5lZWRsZVtpXSkgPCAwKSByZXR1cm4ga2V5LnN1YnN0cigwLCBpKSArIHVwcGVyTmVlZGxlW2ldICsgdXBwZXJOZWVkbGUuc3Vic3RyKGkgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbXAoa2V5W2ldLCBsb3dlck5lZWRsZVtpXSkgPCAwKSByZXR1cm4ga2V5LnN1YnN0cigwLCBpKSArIGxvd2VyTmVlZGxlW2ldICsgdXBwZXJOZWVkbGUuc3Vic3RyKGkgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsbHAgPj0gMCkgcmV0dXJuIGtleS5zdWJzdHIoMCwgbGxwKSArIGxvd2VyS2V5W2xscF0gKyB1cHBlck5lZWRsZS5zdWJzdHIobGxwICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY21wKGtleVtpXSwgbHdyS2V5Q2hhcikgPCAwKSBsbHAgPSBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobGVuZ3RoIDwgbG93ZXJOZWVkbGUubGVuZ3RoICYmIGRpciA9PT0gXCJuZXh0XCIpIHJldHVybiBrZXkgKyB1cHBlck5lZWRsZS5zdWJzdHIoa2V5Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgaWYgKGxlbmd0aCA8IGtleS5sZW5ndGggJiYgZGlyID09PSBcInByZXZcIikgcmV0dXJuIGtleS5zdWJzdHIoMCwgdXBwZXJOZWVkbGUubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGxscCA8IDAgPyBudWxsIDoga2V5LnN1YnN0cigwLCBsbHApICsgbG93ZXJOZWVkbGVbbGxwXSArIHVwcGVyTmVlZGxlLnN1YnN0cihsbHAgKyAxKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZElnbm9yZUNhc2VBbGdvcml0aG0oYywgbWF0Y2gsIG5lZWRsZSkge1xuICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm5lZWRsZVwiIHR5cGU9XCJTdHJpbmdcIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgIHZhciB1cHBlciwgbG93ZXIsIGNvbXBhcmUsIHVwcGVyTmVlZGxlLCBsb3dlck5lZWRsZSwgZGlyZWN0aW9uO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGluaXREaXJlY3Rpb24oZGlyKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwcGVyID0gdXBwZXJGYWN0b3J5KGRpcik7XG4gICAgICAgICAgICAgICAgICAgIGxvd2VyID0gbG93ZXJGYWN0b3J5KGRpcik7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmUgPSAoZGlyID09PSBcIm5leHRcIiA/IGFzY2VuZGluZyA6IGRlc2NlbmRpbmcpO1xuICAgICAgICAgICAgICAgICAgICB1cHBlck5lZWRsZSA9IHVwcGVyKG5lZWRsZSk7XG4gICAgICAgICAgICAgICAgICAgIGxvd2VyTmVlZGxlID0gbG93ZXIobmVlZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZGlyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbml0RGlyZWN0aW9uKFwibmV4dFwiKTtcbiAgICAgICAgICAgICAgICBjLl9vbmRpcmVjdGlvbmNoYW5nZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBldmVudCBvbmx5cyBvY2N1ciBiZWZvcmUgZmlsdGVyIGlzIGNhbGxlZCB0aGUgZmlyc3QgdGltZS5cbiAgICAgICAgICAgICAgICAgICAgaW5pdERpcmVjdGlvbihkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYy5fYWRkQWxnb3JpdGhtKGZ1bmN0aW9uIChjdXJzb3IsIGFkdmFuY2UsIHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY3Vyc29yXCIgdHlwZT1cIklEQkN1cnNvclwiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImFkdmFuY2VcIiB0eXBlPVwiRnVuY3Rpb25cIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJyZXNvbHZlXCIgdHlwZT1cIkZ1bmN0aW9uXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IGN1cnNvci5rZXk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbG93ZXJLZXkgPSBsb3dlcihrZXkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2gobG93ZXJLZXksIGxvd2VyTmVlZGxlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShmdW5jdGlvbiAoKSB7IGN1cnNvci5jb250aW51ZSgpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5leHROZWVkbGUgPSBuZXh0Q2FzaW5nKGtleSwgbG93ZXJLZXksIHVwcGVyTmVlZGxlLCBsb3dlck5lZWRsZSwgY29tcGFyZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXh0TmVlZGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShmdW5jdGlvbiAoKSB7IGN1cnNvci5jb250aW51ZShuZXh0TmVlZGxlKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFdoZXJlQ2xhdXNlIHB1YmxpYyBtZXRob2RzXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBiZXR3ZWVuOiBmdW5jdGlvbiAobG93ZXIsIHVwcGVyLCBpbmNsdWRlTG93ZXIsIGluY2x1ZGVVcHBlcikge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgIC8vLyAgICAgRmlsdGVyIG91dCByZWNvcmRzIHdob3NlIHdoZXJlLWZpZWxkIGxheXMgYmV0d2VlbiBnaXZlbiBsb3dlciBhbmQgdXBwZXIgdmFsdWVzLiBBcHBsaWVzIHRvIFN0cmluZ3MsIE51bWJlcnMgYW5kIERhdGVzLlxuICAgICAgICAgICAgICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJsb3dlclwiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInVwcGVyXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiaW5jbHVkZUxvd2VyXCIgb3B0aW9uYWw9XCJ0cnVlXCI+V2hldGhlciBpdGVtcyB0aGF0IGVxdWFscyBsb3dlciBzaG91bGQgYmUgaW5jbHVkZWQuIERlZmF1bHQgdHJ1ZS48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJpbmNsdWRlVXBwZXJcIiBvcHRpb25hbD1cInRydWVcIj5XaGV0aGVyIGl0ZW1zIHRoYXQgZXF1YWxzIHVwcGVyIHNob3VsZCBiZSBpbmNsdWRlZC4gRGVmYXVsdCBmYWxzZS48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cIkNvbGxlY3Rpb25cIj48L3JldHVybnM+XG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVMb3dlciA9IGluY2x1ZGVMb3dlciAhPT0gZmFsc2U7ICAgLy8gRGVmYXVsdCB0byB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVVcHBlciA9IGluY2x1ZGVVcHBlciA9PT0gdHJ1ZTsgICAgLy8gRGVmYXVsdCB0byBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiAoKGxvd2VyID4gdXBwZXIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAobG93ZXIgPT09IHVwcGVyICYmIChpbmNsdWRlTG93ZXIgfHwgaW5jbHVkZVVwcGVyKSAmJiAhKGluY2x1ZGVMb3dlciAmJiBpbmNsdWRlVXBwZXIpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbigpIHsgcmV0dXJuIElEQktleVJhbmdlLm9ubHkobG93ZXIpOyB9KS5saW1pdCgwKTsgLy8gV29ya2Fyb3VuZCBmb3IgaWRpb3RpYyBXM0MgU3BlY2lmaWNhdGlvbiB0aGF0IERhdGFFcnJvciBtdXN0IGJlIHRocm93biBpZiBsb3dlciA+IHVwcGVyLiBUaGUgbmF0dXJhbCByZXN1bHQgd291bGQgYmUgdG8gcmV0dXJuIGFuIGVtcHR5IGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbigpIHsgcmV0dXJuIElEQktleVJhbmdlLmJvdW5kKGxvd2VyLCB1cHBlciwgIWluY2x1ZGVMb3dlciwgIWluY2x1ZGVVcHBlcik7IH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXF1YWxzOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uKCkgeyByZXR1cm4gSURCS2V5UmFuZ2Uub25seSh2YWx1ZSk7IH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYWJvdmU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBJREJLZXlSYW5nZS5sb3dlckJvdW5kKHZhbHVlLCB0cnVlKTsgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhYm92ZU9yRXF1YWw6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBJREJLZXlSYW5nZS5sb3dlckJvdW5kKHZhbHVlKTsgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBiZWxvdzogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbigpIHsgcmV0dXJuIElEQktleVJhbmdlLnVwcGVyQm91bmQodmFsdWUsIHRydWUpOyB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGJlbG93T3JFcXVhbDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbigpIHsgcmV0dXJuIElEQktleVJhbmdlLnVwcGVyQm91bmQodmFsdWUpOyB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHN0YXJ0c1dpdGg6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwic3RyXCIgdHlwZT1cIlN0cmluZ1wiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhaWwobmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcyksIG5ldyBUeXBlRXJyb3IoXCJTdHJpbmcgZXhwZWN0ZWRcIikpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5iZXR3ZWVuKHN0ciwgc3RyICsgU3RyaW5nLmZyb21DaGFyQ29kZSg2NTUzNSksIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc3RhcnRzV2l0aElnbm9yZUNhc2U6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwic3RyXCIgdHlwZT1cIlN0cmluZ1wiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhaWwobmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcyksIG5ldyBUeXBlRXJyb3IoXCJTdHJpbmcgZXhwZWN0ZWRcIikpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyID09PSBcIlwiKSByZXR1cm4gdGhpcy5zdGFydHNXaXRoKHN0cik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBJREJLZXlSYW5nZS5ib3VuZChzdHIudG9VcHBlckNhc2UoKSwgc3RyLnRvTG93ZXJDYXNlKCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1NTM1KSk7IH0pO1xuICAgICAgICAgICAgICAgICAgICBhZGRJZ25vcmVDYXNlQWxnb3JpdGhtKGMsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLmluZGV4T2YoYikgPT09IDA7IH0sIHN0cik7XG4gICAgICAgICAgICAgICAgICAgIGMuX29uZGlyZWN0aW9uY2hhbmdlID0gZnVuY3Rpb24gKCkgeyBmYWlsKGMsIG5ldyBFcnJvcihcInJldmVyc2UoKSBub3Qgc3VwcG9ydGVkIHdpdGggV2hlcmVDbGF1c2Uuc3RhcnRzV2l0aElnbm9yZUNhc2UoKVwiKSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXF1YWxzSWdub3JlQ2FzZTogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJzdHJcIiB0eXBlPVwiU3RyaW5nXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFpbChuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzKSwgbmV3IFR5cGVFcnJvcihcIlN0cmluZyBleHBlY3RlZFwiKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBJREJLZXlSYW5nZS5ib3VuZChzdHIudG9VcHBlckNhc2UoKSwgc3RyLnRvTG93ZXJDYXNlKCkpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSWdub3JlQ2FzZUFsZ29yaXRobShjLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA9PT0gYjsgfSwgc3RyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhbnlPZjogZnVuY3Rpb24gKHZhbHVlQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYSA9IGN0eC50YWJsZS5zY2hlbWE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZHhTcGVjID0gY3R4LmluZGV4ID8gc2NoZW1hLmlkeEJ5TmFtZVtjdHguaW5kZXhdIDogc2NoZW1hLnByaW1LZXk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc0NvbXBvdW5kID0gaWR4U3BlYyAmJiBpZHhTcGVjLmNvbXBvdW5kO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2V0ID0gZ2V0U2V0QXJncyhhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcGFyZSA9IGlzQ29tcG91bmQgPyBjb21wb3VuZENvbXBhcmUoYXNjZW5kaW5nKSA6IGFzY2VuZGluZztcbiAgICAgICAgICAgICAgICAgICAgc2V0LnNvcnQoY29tcGFyZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXQubGVuZ3RoID09PSAwKSByZXR1cm4gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBJREJLZXlSYW5nZS5vbmx5KFwiXCIpOyB9KS5saW1pdCgwKTsgLy8gUmV0dXJuIGFuIGVtcHR5IGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24gKCkgeyByZXR1cm4gSURCS2V5UmFuZ2UuYm91bmQoc2V0WzBdLCBzZXRbc2V0Lmxlbmd0aCAtIDFdKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjLl9vbmRpcmVjdGlvbmNoYW5nZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBhcmUgPSAoZGlyZWN0aW9uID09PSBcIm5leHRcIiA/IGFzY2VuZGluZyA6IGRlc2NlbmRpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQ29tcG91bmQpIGNvbXBhcmUgPSBjb21wb3VuZENvbXBhcmUoY29tcGFyZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQuc29ydChjb21wYXJlKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgICAgICAgICAgICBjLl9hZGRBbGdvcml0aG0oZnVuY3Rpb24gKGN1cnNvciwgYWR2YW5jZSwgcmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IGN1cnNvci5rZXk7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY29tcGFyZShrZXksIHNldFtpXSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGN1cnNvciBoYXMgcGFzc2VkIGJleW9uZCB0aGlzIGtleS4gQ2hlY2sgbmV4dC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK2k7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IHNldC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gbmV4dC4gU3RvcCBzZWFyY2hpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGFyZShrZXksIHNldFtpXSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY3VycmVudCBjdXJzb3IgdmFsdWUgc2hvdWxkIGJlIGluY2x1ZGVkIGFuZCB3ZSBzaG91bGQgY29udGludWUgYSBzaW5nbGUgc3RlcCBpbiBjYXNlIG5leHQgaXRlbSBoYXMgdGhlIHNhbWUga2V5IG9yIHBvc3NpYmx5IG91ciBuZXh0IGtleSBpbiBzZXQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShmdW5jdGlvbiAoKSB7IGN1cnNvci5jb250aW51ZSgpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3Vyc29yLmtleSBub3QgeWV0IGF0IHNldFtpXS4gRm9yd2FyZCBjdXJzb3IgdG8gdGhlIG5leHQga2V5IHRvIGh1bnQgZm9yLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoZnVuY3Rpb24gKCkgeyBjdXJzb3IuY29udGludWUoc2V0W2ldKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGM7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIG5vdEVxdWFsOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5iZWxvdyh2YWx1ZSkub3IodGhpcy5fY3R4LmluZGV4KS5hYm92ZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIG5vbmVPZjogZnVuY3Rpb24odmFsdWVBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NoZW1hID0gY3R4LnRhYmxlLnNjaGVtYTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkeFNwZWMgPSBjdHguaW5kZXggPyBzY2hlbWEuaWR4QnlOYW1lW2N0eC5pbmRleF0gOiBzY2hlbWEucHJpbUtleTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzQ29tcG91bmQgPSBpZHhTcGVjICYmIGlkeFNwZWMuY29tcG91bmQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXQgPSBnZXRTZXRBcmdzKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXQubGVuZ3RoID09PSAwKSByZXR1cm4gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcyk7IC8vIFJldHVybiBlbnRpcmUgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBhcmUgPSBpc0NvbXBvdW5kID8gY29tcG91bmRDb21wYXJlKGFzY2VuZGluZykgOiBhc2NlbmRpbmc7XG4gICAgICAgICAgICAgICAgICAgIHNldC5zb3J0KGNvbXBhcmUpO1xuICAgICAgICAgICAgICAgICAgICAvLyBUcmFuc2Zvcm0gW1wiYVwiLFwiYlwiLFwiY1wiXSB0byBhIHNldCBvZiByYW5nZXMgZm9yIGJldHdlZW4vYWJvdmUvYmVsb3c6IFtbbnVsbCxcImFcIl0sIFtcImFcIixcImJcIl0sIFtcImJcIixcImNcIl0sIFtcImNcIixudWxsXV1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHJhbmdlcyA9IHNldC5yZWR1Y2UoZnVuY3Rpb24gKHJlcywgdmFsKSB7IHJldHVybiByZXMgPyByZXMuY29uY2F0KFtbcmVzW3Jlcy5sZW5ndGggLSAxXVsxXSwgdmFsXV0pIDogW1tudWxsLCB2YWxdXTsgfSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJhbmdlcy5wdXNoKFtzZXRbc2V0Lmxlbmd0aCAtIDFdLCBudWxsXSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRyYW5zZm9ybSByYW5nZS1zZXRzIHRvIGEgYmlnIG9yKCkgZXhwcmVzc2lvbiBiZXR3ZWVuIHJhbmdlczpcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXogPSB0aGlzLCBpbmRleCA9IGN0eC5pbmRleDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhbmdlcy5yZWR1Y2UoZnVuY3Rpb24oY29sbGVjdGlvbiwgcmFuZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZVsxXSA9PT0gbnVsbCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24ub3IoaW5kZXgpLmFib3ZlKHJhbmdlWzBdKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24ub3IoaW5kZXgpLmJldHdlZW4ocmFuZ2VbMF0sIHJhbmdlWzFdLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGl6LmJlbG93KHJhbmdlWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHN0YXJ0c1dpdGhBbnlPZjogZnVuY3Rpb24gKHZhbHVlQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldCA9IGdldFNldEFyZ3MoYXJndW1lbnRzKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNldC5ldmVyeShmdW5jdGlvbiAocykgeyByZXR1cm4gdHlwZW9mIHMgPT09ICdzdHJpbmcnOyB9KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhaWwobmV3IGN0eC5jb2xsQ2xhc3ModGhpcyksIG5ldyBUeXBlRXJyb3IoXCJzdGFydHNXaXRoQW55T2YoKSBvbmx5IHdvcmtzIHdpdGggc3RyaW5nc1wiKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNldC5sZW5ndGggPT09IDApIHJldHVybiBuZXcgY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbiAoKSB7IHJldHVybiBJREJLZXlSYW5nZS5vbmx5KFwiXCIpOyB9KS5saW1pdCgwKTsgLy8gUmV0dXJuIGFuIGVtcHR5IGNvbGxlY3Rpb24uXG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNldEVuZHMgPSBzZXQubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzICsgU3RyaW5nLmZyb21DaGFyQ29kZSg2NTUzNSk7IH0pO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNvcnREaXJlY3Rpb24gPSBhc2NlbmRpbmc7XG4gICAgICAgICAgICAgICAgICAgIHNldC5zb3J0KHNvcnREaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGtleUlzQmV5b25kQ3VycmVudEVudHJ5KGtleSkgeyByZXR1cm4ga2V5ID4gc2V0RW5kc1tpXTsgfVxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBrZXlJc0JlZm9yZUN1cnJlbnRFbnRyeShrZXkpIHsgcmV0dXJuIGtleSA8IHNldFtpXTsgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hlY2tLZXkgPSBrZXlJc0JleW9uZEN1cnJlbnRFbnRyeTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IG5ldyBjdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBJREJLZXlSYW5nZS5ib3VuZChzZXRbMF0sIHNldFtzZXQubGVuZ3RoIC0gMV0gKyBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1NTM1KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgYy5fb25kaXJlY3Rpb25jaGFuZ2UgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uID09PSBcIm5leHRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrS2V5ID0ga2V5SXNCZXlvbmRDdXJyZW50RW50cnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ydERpcmVjdGlvbiA9IGFzY2VuZGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tLZXkgPSBrZXlJc0JlZm9yZUN1cnJlbnRFbnRyeTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0RGlyZWN0aW9uID0gZGVzY2VuZGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNldC5zb3J0KHNvcnREaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0RW5kcy5zb3J0KHNvcnREaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIGMuX2FkZEFsZ29yaXRobShmdW5jdGlvbiAoY3Vyc29yLCBhZHZhbmNlLCByZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gY3Vyc29yLmtleTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChjaGVja0tleShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGN1cnNvciBoYXMgcGFzc2VkIGJleW9uZCB0aGlzIGtleS4gQ2hlY2sgbmV4dC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK2k7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IHNldC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gbmV4dC4gU3RvcCBzZWFyY2hpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID49IHNldFtpXSAmJiBrZXkgPD0gc2V0RW5kc1tpXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjdXJyZW50IGN1cnNvciB2YWx1ZSBzaG91bGQgYmUgaW5jbHVkZWQgYW5kIHdlIHNob3VsZCBjb250aW51ZSBhIHNpbmdsZSBzdGVwIGluIGNhc2UgbmV4dCBpdGVtIGhhcyB0aGUgc2FtZSBrZXkgb3IgcG9zc2libHkgb3VyIG5leHQga2V5IGluIHNldC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKGZ1bmN0aW9uICgpIHsgY3Vyc29yLmNvbnRpbnVlKCk7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjdXJzb3Iua2V5IG5vdCB5ZXQgYXQgc2V0W2ldLiBGb3J3YXJkIGN1cnNvciB0byB0aGUgbmV4dCBrZXkgdG8gaHVudCBmb3IuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvcnREaXJlY3Rpb24gPT09IGFzY2VuZGluZykgY3Vyc29yLmNvbnRpbnVlKHNldFtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgY3Vyc29yLmNvbnRpbnVlKHNldEVuZHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG5cblxuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vIENvbGxlY3Rpb24gQ2xhc3NcbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgZnVuY3Rpb24gQ29sbGVjdGlvbih3aGVyZUNsYXVzZSwga2V5UmFuZ2VHZW5lcmF0b3IpIHtcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgICAgIC8vLyBcbiAgICAgICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJ3aGVyZUNsYXVzZVwiIHR5cGU9XCJXaGVyZUNsYXVzZVwiPldoZXJlIGNsYXVzZSBpbnN0YW5jZTwvcGFyYW0+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJrZXlSYW5nZUdlbmVyYXRvclwiIHZhbHVlPVwiZnVuY3Rpb24oKXsgcmV0dXJuIElEQktleVJhbmdlLmJvdW5kKDAsMSk7fVwiIG9wdGlvbmFsPVwidHJ1ZVwiPjwvcGFyYW0+XG4gICAgICAgICAgICB2YXIga2V5UmFuZ2UgPSBudWxsLCBlcnJvciA9IG51bGw7XG4gICAgICAgICAgICBpZiAoa2V5UmFuZ2VHZW5lcmF0b3IpIHRyeSB7XG4gICAgICAgICAgICAgICAga2V5UmFuZ2UgPSBrZXlSYW5nZUdlbmVyYXRvcigpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBlcnJvciA9IGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgd2hlcmVDdHggPSB3aGVyZUNsYXVzZS5fY3R4O1xuICAgICAgICAgICAgdGhpcy5fY3R4ID0ge1xuICAgICAgICAgICAgICAgIHRhYmxlOiB3aGVyZUN0eC50YWJsZSxcbiAgICAgICAgICAgICAgICBpbmRleDogd2hlcmVDdHguaW5kZXgsXG4gICAgICAgICAgICAgICAgaXNQcmltS2V5OiAoIXdoZXJlQ3R4LmluZGV4IHx8ICh3aGVyZUN0eC50YWJsZS5zY2hlbWEucHJpbUtleS5rZXlQYXRoICYmIHdoZXJlQ3R4LmluZGV4ID09PSB3aGVyZUN0eC50YWJsZS5zY2hlbWEucHJpbUtleS5uYW1lKSksXG4gICAgICAgICAgICAgICAgcmFuZ2U6IGtleVJhbmdlLFxuICAgICAgICAgICAgICAgIG9wOiBcIm9wZW5DdXJzb3JcIixcbiAgICAgICAgICAgICAgICBkaXI6IFwibmV4dFwiLFxuICAgICAgICAgICAgICAgIHVuaXF1ZTogXCJcIixcbiAgICAgICAgICAgICAgICBhbGdvcml0aG06IG51bGwsXG4gICAgICAgICAgICAgICAgZmlsdGVyOiBudWxsLFxuICAgICAgICAgICAgICAgIGlzTWF0Y2g6IG51bGwsXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiAwLFxuICAgICAgICAgICAgICAgIGxpbWl0OiBJbmZpbml0eSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IsIC8vIElmIHNldCwgYW55IHByb21pc2UgbXVzdCBiZSByZWplY3RlZCB3aXRoIHRoaXMgZXJyb3JcbiAgICAgICAgICAgICAgICBvcjogd2hlcmVDdHgub3JcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBleHRlbmQoQ29sbGVjdGlvbi5wcm90b3R5cGUsIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIENvbGxlY3Rpb24gUHJpdmF0ZSBGdW5jdGlvbnNcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZEZpbHRlcihjdHgsIGZuKSB7XG4gICAgICAgICAgICAgICAgY3R4LmZpbHRlciA9IGNvbWJpbmUoY3R4LmZpbHRlciwgZm4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBhZGRNYXRjaEZpbHRlcihjdHgsIGZuKSB7XG4gICAgICAgICAgICAgICAgY3R4LmlzTWF0Y2ggPSBjb21iaW5lKGN0eC5pc01hdGNoLCBmbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEluZGV4T3JTdG9yZShjdHgsIHN0b3JlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN0eC5pc1ByaW1LZXkpIHJldHVybiBzdG9yZTtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXhTcGVjID0gY3R4LnRhYmxlLnNjaGVtYS5pZHhCeU5hbWVbY3R4LmluZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZGV4U3BlYykgdGhyb3cgbmV3IEVycm9yKFwiS2V5UGF0aCBcIiArIGN0eC5pbmRleCArIFwiIG9uIG9iamVjdCBzdG9yZSBcIiArIHN0b3JlLm5hbWUgKyBcIiBpcyBub3QgaW5kZXhlZFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3R4LmlzUHJpbUtleSA/IHN0b3JlIDogc3RvcmUuaW5kZXgoaW5kZXhTcGVjLm5hbWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBvcGVuQ3Vyc29yKGN0eCwgc3RvcmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0SW5kZXhPclN0b3JlKGN0eCwgc3RvcmUpW2N0eC5vcF0oY3R4LnJhbmdlIHx8IG51bGwsIGN0eC5kaXIgKyBjdHgudW5pcXVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaXRlcihjdHgsIGZuLCByZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjdHgub3IpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZShvcGVuQ3Vyc29yKGN0eCwgaWRic3RvcmUpLCBjb21iaW5lKGN0eC5hbGdvcml0aG0sIGN0eC5maWx0ZXIpLCBmbiwgcmVzb2x2ZSwgcmVqZWN0LCBjdHgudGFibGUuaG9vay5yZWFkaW5nLmZpcmUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmlsdGVyID0gY3R4LmZpbHRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZXQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmltS2V5ID0gY3R4LnRhYmxlLnNjaGVtYS5wcmltS2V5LmtleVBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzb2x2ZWQgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiByZXNvbHZlYm90aCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKytyZXNvbHZlZCA9PT0gMikgcmVzb2x2ZSgpOyAvLyBTZWVtcyBsaWtlIHdlIGp1c3Qgc3VwcG9ydCBvciBidHduIG1heCAyIGV4cHJlc3Npb25zLCBidXQgdGhlcmUgYXJlIG5vIGxpbWl0IGJlY2F1c2Ugd2UgZG8gcmVjdXJzaW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiB1bmlvbihpdGVtLCBjdXJzb3IsIGFkdmFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbHRlciB8fCBmaWx0ZXIoY3Vyc29yLCBhZHZhbmNlLCByZXNvbHZlYm90aCwgcmVqZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gY3Vyc29yLnByaW1hcnlLZXkudG9TdHJpbmcoKTsgLy8gQ29udmVydHMgYW55IERhdGUgdG8gU3RyaW5nLCBTdHJpbmcgdG8gU3RyaW5nLCBOdW1iZXIgdG8gU3RyaW5nIGFuZCBBcnJheSB0byBjb21tYS1zZXBhcmF0ZWQgc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2V0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFtrZXldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuKGl0ZW0sIGN1cnNvciwgYWR2YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5vci5faXRlcmF0ZSh1bmlvbiwgcmVzb2x2ZWJvdGgsIHJlamVjdCwgaWRic3RvcmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZShvcGVuQ3Vyc29yKGN0eCwgaWRic3RvcmUpLCBjdHguYWxnb3JpdGhtLCB1bmlvbiwgcmVzb2x2ZWJvdGgsIHJlamVjdCwgY3R4LnRhYmxlLmhvb2sucmVhZGluZy5maXJlKTtcbiAgICAgICAgICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRJbnN0YW5jZVRlbXBsYXRlKGN0eCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjdHgudGFibGUuc2NoZW1hLmluc3RhbmNlVGVtcGxhdGU7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gQ29sbGVjdGlvbiBQcm90ZWN0ZWQgRnVuY3Rpb25zXG4gICAgICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgICAgIF9yZWFkOiBmdW5jdGlvbiAoZm4sIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHguZXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3R4LnRhYmxlLl90cmFucyhudWxsLCBmdW5jdGlvbiByZWplY3RvcihyZXNvbHZlLCByZWplY3QpIHsgcmVqZWN0KGN0eC5lcnJvcik7IH0pO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3R4LnRhYmxlLl9pZGJzdG9yZShSRUFET05MWSwgZm4pLnRoZW4oY2IpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX3dyaXRlOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0eC5lcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHgudGFibGUuX3RyYW5zKG51bGwsIGZ1bmN0aW9uIHJlamVjdG9yKHJlc29sdmUsIHJlamVjdCkgeyByZWplY3QoY3R4LmVycm9yKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHgudGFibGUuX2lkYnN0b3JlKFJFQURXUklURSwgZm4sIFwibG9ja2VkXCIpOyAvLyBXaGVuIGRvaW5nIHdyaXRlIG9wZXJhdGlvbnMgb24gY29sbGVjdGlvbnMsIGFsd2F5cyBsb2NrIHRoZSBvcGVyYXRpb24gc28gdGhhdCB1cGNvbWluZyBvcGVyYXRpb25zIGdldHMgcXVldWVkLlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2FkZEFsZ29yaXRobTogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5hbGdvcml0aG0gPSBjb21iaW5lKGN0eC5hbGdvcml0aG0sIGZuKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgX2l0ZXJhdGU6IGZ1bmN0aW9uIChmbiwgcmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlcih0aGlzLl9jdHgsIGZuLCByZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBDb2xsZWN0aW9uIFB1YmxpYyBtZXRob2RzXG4gICAgICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgICAgIGVhY2g6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuXG4gICAgICAgICAgICAgICAgICAgIGZha2UgJiYgZm4oZ2V0SW5zdGFuY2VUZW1wbGF0ZShjdHgpKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVhZChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcihjdHgsIGZuLCByZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGNvdW50OiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZha2UpIHJldHVybiBQcm9taXNlLnJlc29sdmUoMCkudGhlbihjYik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2N0eDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY3R4LmZpbHRlciB8fCBjdHguYWxnb3JpdGhtIHx8IGN0eC5vcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiBmaWx0ZXJzIGFyZSBhcHBsaWVkIG9yICdvcmVkJyBjb2xsZWN0aW9ucyBhcmUgdXNlZCwgd2UgbXVzdCBjb3VudCBtYW51YWxseVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWFkKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlcihjdHgsIGZ1bmN0aW9uICgpIHsgKytjb3VudDsgcmV0dXJuIGZhbHNlOyB9LCBmdW5jdGlvbiAoKSB7IHJlc29sdmUoY291bnQpOyB9LCByZWplY3QsIGlkYnN0b3JlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGNiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgd2UgY2FuIHVzZSB0aGUgY291bnQoKSBtZXRob2QgaWYgdGhlIGluZGV4LlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWQoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWR4ID0gZ2V0SW5kZXhPclN0b3JlKGN0eCwgaWRic3RvcmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXEgPSAoY3R4LnJhbmdlID8gaWR4LmNvdW50KGN0eC5yYW5nZSkgOiBpZHguY291bnQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBbXCJjYWxsaW5nXCIsIFwiY291bnQoKVwiLCBcIm9uXCIsIHNlbGYubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKE1hdGgubWluKGUudGFyZ2V0LnJlc3VsdCwgTWF0aC5tYXgoMCwgY3R4LmxpbWl0IC0gY3R4Lm9mZnNldCkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgY2IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHNvcnRCeTogZnVuY3Rpb24gKGtleVBhdGgsIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImtleVBhdGhcIiB0eXBlPVwiU3RyaW5nXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnRzID0ga2V5UGF0aC5zcGxpdCgnLicpLnJldmVyc2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RQYXJ0ID0gcGFydHNbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXggPSBwYXJ0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXR2YWwob2JqLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSkgcmV0dXJuIGdldHZhbChvYmpbcGFydHNbaV1dLCBpIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqW2xhc3RQYXJ0XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgb3JkZXIgPSB0aGlzLl9jdHguZGlyID09PSBcIm5leHRcIiA/IDEgOiAtMTtcblxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBzb3J0ZXIoYSwgYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFWYWwgPSBnZXR2YWwoYSwgbGFzdEluZGV4KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiVmFsID0gZ2V0dmFsKGIsIGxhc3RJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYVZhbCA8IGJWYWwgPyAtb3JkZXIgOiBhVmFsID4gYlZhbCA/IG9yZGVyIDogMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50b0FycmF5KGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5zb3J0KHNvcnRlcik7XG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oY2IpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICB0b0FycmF5OiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWQoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZha2UgJiYgcmVzb2x2ZShbZ2V0SW5zdGFuY2VUZW1wbGF0ZShjdHgpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcihjdHgsIGZ1bmN0aW9uIChpdGVtKSB7IGEucHVzaChpdGVtKTsgfSwgZnVuY3Rpb24gYXJyYXlDb21wbGV0ZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0LCBpZGJzdG9yZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgPD0gMCkgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5vZmZzZXQgKz0gb2Zmc2V0OyAvLyBGb3IgY291bnQoKVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWN0eC5vciAmJiAhY3R4LmFsZ29yaXRobSAmJiAhY3R4LmZpbHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkRmlsdGVyKGN0eCwgZnVuY3Rpb24gb2Zmc2V0RmlsdGVyKGN1cnNvciwgYWR2YW5jZSwgcmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgPT09IDApIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgPT09IDEpIHsgLS1vZmZzZXQ7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoZnVuY3Rpb24gKCkgeyBjdXJzb3IuYWR2YW5jZShvZmZzZXQpOyBvZmZzZXQgPSAwOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEZpbHRlcihjdHgsIGZ1bmN0aW9uIG9mZnNldEZpbHRlcihjdXJzb3IsIGFkdmFuY2UsIHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKC0tb2Zmc2V0IDwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbGltaXQ6IGZ1bmN0aW9uIChudW1Sb3dzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N0eC5saW1pdCA9IE1hdGgubWluKHRoaXMuX2N0eC5saW1pdCwgbnVtUm93cyk7IC8vIEZvciBjb3VudCgpXG4gICAgICAgICAgICAgICAgICAgIGFkZEZpbHRlcih0aGlzLl9jdHgsIGZ1bmN0aW9uIChjdXJzb3IsIGFkdmFuY2UsIHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgtLW51bVJvd3MgPD0gMCkgYWR2YW5jZShyZXNvbHZlKTsgLy8gU3RvcCBhZnRlciB0aGlzIGl0ZW0gaGFzIGJlZW4gaW5jbHVkZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudW1Sb3dzID49IDA7IC8vIElmIG51bVJvd3MgaXMgYWxyZWFkeSBiZWxvdyAwLCByZXR1cm4gZmFsc2UgYmVjYXVzZSB0aGVuIDAgd2FzIHBhc3NlZCB0byBudW1Sb3dzIGluaXRpYWxseS4gT3RoZXJ3aXNlIHdlIHdvdWxkbnQgY29tZSBoZXJlLlxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHVudGlsOiBmdW5jdGlvbiAoZmlsdGVyRnVuY3Rpb24sIGJJbmNsdWRlU3RvcEVudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgICAgICAgICAgICAgIGZha2UgJiYgZmlsdGVyRnVuY3Rpb24oZ2V0SW5zdGFuY2VUZW1wbGF0ZShjdHgpKTtcbiAgICAgICAgICAgICAgICAgICAgYWRkRmlsdGVyKHRoaXMuX2N0eCwgZnVuY3Rpb24gKGN1cnNvciwgYWR2YW5jZSwgcmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbHRlckZ1bmN0aW9uKGN1cnNvci52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBiSW5jbHVkZVN0b3BFbnRyeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgZmlyc3Q6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5saW1pdCgxKS50b0FycmF5KGZ1bmN0aW9uIChhKSB7IHJldHVybiBhWzBdOyB9KS50aGVuKGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbGFzdDogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJldmVyc2UoKS5maXJzdChjYik7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGFuZDogZnVuY3Rpb24gKGZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImpzRnVuY3Rpb25GaWx0ZXJcIiB0eXBlPVwiRnVuY3Rpb25cIj5mdW5jdGlvbih2YWwpe3JldHVybiB0cnVlL2ZhbHNlfTwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIGZha2UgJiYgZmlsdGVyRnVuY3Rpb24oZ2V0SW5zdGFuY2VUZW1wbGF0ZSh0aGlzLl9jdHgpKTtcbiAgICAgICAgICAgICAgICAgICAgYWRkRmlsdGVyKHRoaXMuX2N0eCwgZnVuY3Rpb24gKGN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlckZ1bmN0aW9uKGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBhZGRNYXRjaEZpbHRlcih0aGlzLl9jdHgsIGZpbHRlckZ1bmN0aW9uKTsgLy8gbWF0Y2ggZmlsdGVycyBub3QgdXNlZCBpbiBEZXhpZS5qcyBidXQgY2FuIGJlIHVzZWQgYnkgM3JkIHBhcnQgbGlicmFyaWVzIHRvIHRlc3QgYSBjb2xsZWN0aW9uIGZvciBhIG1hdGNoIHdpdGhvdXQgcXVlcnlpbmcgREIuIFVzZWQgYnkgRGV4aWUuT2JzZXJ2YWJsZS5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIG9yOiBmdW5jdGlvbiAoaW5kZXhOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgV2hlcmVDbGF1c2UodGhpcy5fY3R4LnRhYmxlLCBpbmRleE5hbWUsIHRoaXMpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICByZXZlcnNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N0eC5kaXIgPSAodGhpcy5fY3R4LmRpciA9PT0gXCJwcmV2XCIgPyBcIm5leHRcIiA6IFwicHJldlwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX29uZGlyZWN0aW9uY2hhbmdlKSB0aGlzLl9vbmRpcmVjdGlvbmNoYW5nZSh0aGlzLl9jdHguZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGRlc2M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBlYWNoS2V5OiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcbiAgICAgICAgICAgICAgICAgICAgZmFrZSAmJiBjYihnZXRCeUtleVBhdGgoZ2V0SW5zdGFuY2VUZW1wbGF0ZSh0aGlzLl9jdHgpLCB0aGlzLl9jdHguaW5kZXggPyB0aGlzLl9jdHgudGFibGUuc2NoZW1hLmlkeEJ5TmFtZVt0aGlzLl9jdHguaW5kZXhdLmtleVBhdGggOiB0aGlzLl9jdHgudGFibGUuc2NoZW1hLnByaW1LZXkua2V5UGF0aCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN0eC5pc1ByaW1LZXkpIGN0eC5vcCA9IFwib3BlbktleUN1cnNvclwiOyAvLyBOZWVkIHRoZSBjaGVjayBiZWNhdXNlIElEQk9iamVjdFN0b3JlIGRvZXMgbm90IGhhdmUgXCJvcGVuS2V5Q3Vyc29yKClcIiB3aGlsZSBJREJJbmRleCBoYXMuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKHZhbCwgY3Vyc29yKSB7IGNiKGN1cnNvci5rZXksIGN1cnNvcik7IH0pO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBlYWNoVW5pcXVlS2V5OiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3R4LnVuaXF1ZSA9IFwidW5pcXVlXCI7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2hLZXkoY2IpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBrZXlzOiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHguaXNQcmltS2V5KSBjdHgub3AgPSBcIm9wZW5LZXlDdXJzb3JcIjsgLy8gTmVlZCB0aGUgY2hlY2sgYmVjYXVzZSBJREJPYmplY3RTdG9yZSBkb2VzIG5vdCBoYXZlIFwib3BlbktleUN1cnNvcigpXCIgd2hpbGUgSURCSW5kZXggaGFzLlxuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmFrZSkgcmV0dXJuIG5ldyBQcm9taXNlKHRoaXMuZWFjaEtleS5iaW5kKHRoaXMpKS50aGVuKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIFt4XTsgfSkudGhlbihjYik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKGl0ZW0sIGN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYS5wdXNoKGN1cnNvci5rZXkpO1xuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgdW5pcXVlS2V5czogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N0eC51bmlxdWUgPSBcInVuaXF1ZVwiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5rZXlzKGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgZmlyc3RLZXk6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5saW1pdCgxKS5rZXlzKGZ1bmN0aW9uIChhKSB7IHJldHVybiBhWzBdOyB9KS50aGVuKGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbGFzdEtleTogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJldmVyc2UoKS5maXJzdEtleShjYik7XG4gICAgICAgICAgICAgICAgfSxcblxuXG4gICAgICAgICAgICAgICAgZGlzdGluY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNldCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBhZGRGaWx0ZXIodGhpcy5fY3R4LCBmdW5jdGlvbiAoY3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RyS2V5ID0gY3Vyc29yLnByaW1hcnlLZXkudG9TdHJpbmcoKTsgLy8gQ29udmVydHMgYW55IERhdGUgdG8gU3RyaW5nLCBTdHJpbmcgdG8gU3RyaW5nLCBOdW1iZXIgdG8gU3RyaW5nIGFuZCBBcnJheSB0byBjb21tYS1zZXBhcmF0ZWQgc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZm91bmQgPSBzZXQuaGFzT3duUHJvcGVydHkoc3RyS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFtzdHJLZXldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhZm91bmQ7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyBXcml0ZWFibGVDb2xsZWN0aW9uIENsYXNzXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIGZ1bmN0aW9uIFdyaXRlYWJsZUNvbGxlY3Rpb24oKSB7XG4gICAgICAgICAgICBDb2xsZWN0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cblxuICAgICAgICBkZXJpdmUoV3JpdGVhYmxlQ29sbGVjdGlvbikuZnJvbShDb2xsZWN0aW9uKS5leHRlbmQoe1xuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gV3JpdGVhYmxlQ29sbGVjdGlvbiBQdWJsaWMgTWV0aG9kc1xuICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgbW9kaWZ5OiBmdW5jdGlvbiAoY2hhbmdlcykge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fY3R4LFxuICAgICAgICAgICAgICAgICAgICBob29rID0gY3R4LnRhYmxlLmhvb2ssXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0aW5nSG9vayA9IGhvb2sudXBkYXRpbmcuZmlyZSxcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRpbmdIb29rID0gaG9vay5kZWxldGluZy5maXJlO1xuXG4gICAgICAgICAgICAgICAgZmFrZSAmJiB0eXBlb2YgY2hhbmdlcyA9PT0gJ2Z1bmN0aW9uJyAmJiBjaGFuZ2VzLmNhbGwoeyB2YWx1ZTogY3R4LnRhYmxlLnNjaGVtYS5pbnN0YW5jZVRlbXBsYXRlIH0sIGN0eC50YWJsZS5zY2hlbWEuaW5zdGFuY2VUZW1wbGF0ZSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fd3JpdGUoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUsIHRyYW5zKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtb2RpZnllcjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGFuZ2VzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGFuZ2VzIGlzIGEgZnVuY3Rpb24gdGhhdCBtYXkgdXBkYXRlLCBhZGQgb3IgZGVsZXRlIHByb3B0ZXJ0aWVzIG9yIGV2ZW4gcmVxdWlyZSBhIGRlbGV0aW9uIHRoZSBvYmplY3QgaXRzZWxmIChkZWxldGUgdGhpcy5pdGVtKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVwZGF0aW5nSG9vayA9PT0gbm9wICYmIGRlbGV0aW5nSG9vayA9PT0gbm9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9vbmUgY2FyZXMgYWJvdXQgd2hhdCBpcyBiZWluZyBjaGFuZ2VkLiBKdXN0IGxldCB0aGUgbW9kaWZpZXIgZnVuY3Rpb24gYmUgdGhlIGdpdmVuIGFyZ3VtZW50IGFzIGlzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmeWVyID0gY2hhbmdlcztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGVvcGxlIHdhbnQgdG8ga25vdyBleGFjdGx5IHdoYXQgaXMgYmVpbmcgbW9kaWZpZWQgb3IgZGVsZXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMZXQgbW9kaWZ5ZXIgYmUgYSBwcm94eSBmdW5jdGlvbiB0aGF0IGZpbmRzIG91dCB3aGF0IGNoYW5nZXMgdGhlIGNhbGxlciBpcyBhY3R1YWxseSBkb2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuZCBjYWxsIHRoZSBob29rcyBhY2NvcmRpbmdseSFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RpZnllciA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvcmlnSXRlbSA9IGRlZXBDbG9uZShpdGVtKTsgLy8gQ2xvbmUgdGhlIGl0ZW0gZmlyc3Qgc28gd2UgY2FuIGNvbXBhcmUgbGF0ZXJzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlcy5jYWxsKHRoaXMsIGl0ZW0pID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlOyAvLyBDYWxsIHRoZSByZWFsIG1vZGlmeWVyIGZ1bmN0aW9uIChJZiBpdCByZXR1cm5zIGZhbHNlIGV4cGxpY2l0ZWx5LCBpdCBtZWFucyBpdCBkb250IHdhbnQgdG8gbW9kaWZ5IGFueXRpbmcgb24gdGhpcyBvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eShcInZhbHVlXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgcmVhbCBtb2RpZnllciBmdW5jdGlvbiByZXF1ZXN0cyBhIGRlbGV0aW9uIG9mIHRoZSBvYmplY3QuIEluZm9ybSB0aGUgZGVsZXRpbmdIb29rIHRoYXQgYSBkZWxldGlvbiBpcyB0YWtpbmcgcGxhY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGluZ0hvb2suY2FsbCh0aGlzLCB0aGlzLnByaW1LZXksIGl0ZW0sIHRyYW5zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIGRlbGV0aW9uLiBDaGVjayB3aGF0IHdhcyBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2JqZWN0RGlmZiA9IGdldE9iamVjdERpZmYob3JpZ0l0ZW0sIHRoaXMudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFkZGl0aW9uYWxDaGFuZ2VzID0gdXBkYXRpbmdIb29rLmNhbGwodGhpcywgb2JqZWN0RGlmZiwgdGhpcy5wcmltS2V5LCBvcmlnSXRlbSwgdHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGl0aW9uYWxDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG9vayB3YW50IHRvIGFwcGx5IGFkZGl0aW9uYWwgbW9kaWZpY2F0aW9ucy4gTWFrZSBzdXJlIHRvIGZ1bGxmaWxsIHRoZSB3aWxsIG9mIHRoZSBob29rLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGFkZGl0aW9uYWxDaGFuZ2VzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXlQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEJ5S2V5UGF0aChpdGVtLCBrZXlQYXRoLCBhZGRpdGlvbmFsQ2hhbmdlc1trZXlQYXRoXSk7ICAvLyBBZGRpbmcge2tleVBhdGg6IHVuZGVmaW5lZH0gbWVhbnMgdGhhdCB0aGUga2V5UGF0aCBzaG91bGQgYmUgZGVsZXRlZC4gSGFuZGxlZCBieSBzZXRCeUtleVBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVwZGF0aW5nSG9vayA9PT0gbm9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGFuZ2VzIGlzIGEgc2V0IG9mIHtrZXlQYXRoOiB2YWx1ZX0gYW5kIG5vIG9uZSBpcyBsaXN0ZW5pbmcgdG8gdGhlIHVwZGF0aW5nIGhvb2suXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5UGF0aHMgPSBPYmplY3Qua2V5cyhjaGFuZ2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBudW1LZXlzID0ga2V5UGF0aHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZ5ZXIgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbnl0aGluZ01vZGlmaWVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1LZXlzOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleVBhdGggPSBrZXlQYXRoc1tpXSwgdmFsID0gY2hhbmdlc1trZXlQYXRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldEJ5S2V5UGF0aChpdGVtLCBrZXlQYXRoKSAhPT0gdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRCeUtleVBhdGgoaXRlbSwga2V5UGF0aCwgdmFsKTsgLy8gQWRkaW5nIHtrZXlQYXRoOiB1bmRlZmluZWR9IG1lYW5zIHRoYXQgdGhlIGtleVBhdGggc2hvdWxkIGJlIGRlbGV0ZWQuIEhhbmRsZWQgYnkgc2V0QnlLZXlQYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnl0aGluZ01vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYW55dGhpbmdNb2RpZmllZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hhbmdlcyBpcyBhIHNldCBvZiB7a2V5UGF0aDogdmFsdWV9IGFuZCBwZW9wbGUgYXJlIGxpc3RlbmluZyB0byB0aGUgdXBkYXRpbmcgaG9vayBzbyB3ZSBuZWVkIHRvIGNhbGwgaXQgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhbGxvdyBpdCB0byBhZGQgYWRkaXRpb25hbCBtb2RpZmljYXRpb25zIHRvIG1ha2UuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3JpZ0NoYW5nZXMgPSBjaGFuZ2VzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcyA9IHNoYWxsb3dDbG9uZShvcmlnQ2hhbmdlcyk7IC8vIExldCdzIHdvcmsgd2l0aCBhIGNsb25lIG9mIHRoZSBjaGFuZ2VzIGtleVBhdGgvdmFsdWUgc2V0IHNvIHRoYXQgd2UgY2FuIHJlc3RvcmUgaXQgaW4gY2FzZSBhIGhvb2sgZXh0ZW5kcyBpdC5cbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmeWVyID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW55dGhpbmdNb2RpZmllZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsQ2hhbmdlcyA9IHVwZGF0aW5nSG9vay5jYWxsKHRoaXMsIGNoYW5nZXMsIHRoaXMucHJpbUtleSwgZGVlcENsb25lKGl0ZW0pLCB0cmFucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGl0aW9uYWxDaGFuZ2VzKSBleHRlbmQoY2hhbmdlcywgYWRkaXRpb25hbENoYW5nZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNoYW5nZXMpLmZvckVhY2goZnVuY3Rpb24gKGtleVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IGNoYW5nZXNba2V5UGF0aF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXRCeUtleVBhdGgoaXRlbSwga2V5UGF0aCkgIT09IHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QnlLZXlQYXRoKGl0ZW0sIGtleVBhdGgsIHZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnl0aGluZ01vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZGRpdGlvbmFsQ2hhbmdlcykgY2hhbmdlcyA9IHNoYWxsb3dDbG9uZShvcmlnQ2hhbmdlcyk7IC8vIFJlc3RvcmUgb3JpZ2luYWwgY2hhbmdlcyBmb3IgbmV4dCBpdGVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYW55dGhpbmdNb2RpZmllZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1Y2Nlc3NDb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVyYXRpb25Db21wbGV0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmFpbHVyZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZhaWxLZXlzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50S2V5ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBtb2RpZnlJdGVtKGl0ZW0sIGN1cnNvciwgYWR2YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEtleSA9IGN1cnNvci5wcmltYXJ5S2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNDb250ZXh0ID0geyBwcmltS2V5OiBjdXJzb3IucHJpbWFyeUtleSwgdmFsdWU6IGl0ZW0gfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtb2RpZnllci5jYWxsKHRoaXNDb250ZXh0LCBpdGVtKSAhPT0gZmFsc2UpIHsgLy8gSWYgYSBjYWxsYmFjayBleHBsaWNpdGVseSByZXR1cm5zIGZhbHNlLCBkbyBub3QgcGVyZm9ybSB0aGUgdXBkYXRlIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBiRGVsZXRlID0gIXRoaXNDb250ZXh0Lmhhc093blByb3BlcnR5KFwidmFsdWVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcSA9IChiRGVsZXRlID8gY3Vyc29yLmRlbGV0ZSgpIDogY3Vyc29yLnVwZGF0ZSh0aGlzQ29udGV4dC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrY291bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFpbHVyZXMucHVzaChlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFpbEtleXMucHVzaCh0aGlzQ29udGV4dC5wcmltS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXNDb250ZXh0Lm9uZXJyb3IpIHRoaXNDb250ZXh0Lm9uZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrRmluaXNoZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIENhdGNoIHRoZXNlIGVycm9ycyBhbmQgbGV0IGEgZmluYWwgcmVqZWN0aW9uIGRlY2lkZSB3aGV0aGVyIG9yIG5vdCB0byBhYm9ydCBlbnRpcmUgdHJhbnNhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBiRGVsZXRlID8gW1wiZGVsZXRpbmdcIiwgaXRlbSwgXCJmcm9tXCIsIGN0eC50YWJsZS5uYW1lXSA6IFtcIm1vZGlmeWluZ1wiLCBpdGVtLCBcIm9uXCIsIGN0eC50YWJsZS5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpc0NvbnRleHQub25zdWNjZXNzKSB0aGlzQ29udGV4dC5vbnN1Y2Nlc3ModGhpc0NvbnRleHQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArK3N1Y2Nlc3NDb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tGaW5pc2hlZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzQ29udGV4dC5vbnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIb29rIHdpbGwgZXhwZWN0IGVpdGhlciBvbmVycm9yIG9yIG9uc3VjY2VzcyB0byBhbHdheXMgYmUgY2FsbGVkIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNDb250ZXh0Lm9uc3VjY2Vzcyh0aGlzQ29udGV4dC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBkb1JlamVjdChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWx1cmVzLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFpbEtleXMucHVzaChjdXJyZW50S2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IE1vZGlmeUVycm9yKFwiRXJyb3IgbW9kaWZ5aW5nIG9uZSBvciBtb3JlIG9iamVjdHNcIiwgZmFpbHVyZXMsIHN1Y2Nlc3NDb3VudCwgZmFpbEtleXMpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNoZWNrRmluaXNoZWQoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlcmF0aW9uQ29tcGxldGUgJiYgc3VjY2Vzc0NvdW50ICsgZmFpbHVyZXMubGVuZ3RoID09PSBjb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmYWlsdXJlcy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb1JlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzdWNjZXNzQ291bnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2l0ZXJhdGUobW9kaWZ5SXRlbSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0aW9uQ29tcGxldGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tGaW5pc2hlZCgpO1xuICAgICAgICAgICAgICAgICAgICB9LCBkb1JlamVjdCwgaWRic3RvcmUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgJ2RlbGV0ZSc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tb2RpZnkoZnVuY3Rpb24gKCkgeyBkZWxldGUgdGhpcy52YWx1ZTsgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBIZWxwIGZ1bmN0aW9ucyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cblxuICAgICAgICBmdW5jdGlvbiBsb3dlclZlcnNpb25GaXJzdChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5fY2ZnLnZlcnNpb24gLSBiLl9jZmcudmVyc2lvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNldEFwaU9uUGxhY2Uob2JqcywgdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeSwgdGFibGVOYW1lcywgbW9kZSwgZGJzY2hlbWEsIGVuYWJsZVByb2hpYml0ZWREQikge1xuICAgICAgICAgICAgdGFibGVOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uICh0YWJsZU5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFibGVJbnN0YW5jZSA9IGRiLl90YWJsZUZhY3RvcnkobW9kZSwgZGJzY2hlbWFbdGFibGVOYW1lXSwgdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeSk7XG4gICAgICAgICAgICAgICAgb2Jqcy5mb3JFYWNoKGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmpbdGFibGVOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVuYWJsZVByb2hpYml0ZWREQikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIHRhYmxlTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFyIGN1cnJlbnRUcmFucyA9IFByb21pc2UuUFNEICYmIFByb21pc2UuUFNELnRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRUcmFucyAmJiBjdXJyZW50VHJhbnMuZGIgPT09IGRiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUcmFucy50YWJsZXNbdGFibGVOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0YWJsZUluc3RhbmNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ialt0YWJsZU5hbWVdID0gdGFibGVJbnN0YW5jZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZW1vdmVUYWJsZXNBcGkob2Jqcykge1xuICAgICAgICAgICAgb2Jqcy5mb3JFYWNoKGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmpba2V5XSBpbnN0YW5jZW9mIFRhYmxlKSBkZWxldGUgb2JqW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBpdGVyYXRlKHJlcSwgZmlsdGVyLCBmbiwgcmVzb2x2ZSwgcmVqZWN0LCByZWFkaW5nSG9vaykge1xuICAgICAgICAgICAgdmFyIHBzZCA9IFByb21pc2UuUFNEO1xuICAgICAgICAgICAgcmVhZGluZ0hvb2sgPSByZWFkaW5nSG9vayB8fCBtaXJyb3I7XG4gICAgICAgICAgICBpZiAoIXJlcS5vbmVycm9yKSByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QpO1xuICAgICAgICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSB0cnljYXRjaChmdW5jdGlvbiBmaWx0ZXJfcmVjb3JkKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnNvciA9IHJlcS5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjID0gZnVuY3Rpb24gKCkgeyBjdXJzb3IuY29udGludWUoKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXIoY3Vyc29yLCBmdW5jdGlvbiAoYWR2YW5jZXIpIHsgYyA9IGFkdmFuY2VyOyB9LCByZXNvbHZlLCByZWplY3QpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuKHJlYWRpbmdIb29rKGN1cnNvci52YWx1ZSksIGN1cnNvciwgZnVuY3Rpb24gKGFkdmFuY2VyKSB7IGMgPSBhZHZhbmNlcjsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCByZWplY3QsIHBzZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSB0cnljYXRjaChmdW5jdGlvbiBmaWx0ZXJfcmVjb3JkKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnNvciA9IHJlcS5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjID0gZnVuY3Rpb24gKCkgeyBjdXJzb3IuY29udGludWUoKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuKHJlYWRpbmdIb29rKGN1cnNvci52YWx1ZSksIGN1cnNvciwgZnVuY3Rpb24gKGFkdmFuY2VyKSB7IGMgPSBhZHZhbmNlcjsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCByZWplY3QsIHBzZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwYXJzZUluZGV4U3ludGF4KGluZGV4ZXMpIHtcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImluZGV4ZXNcIiB0eXBlPVwiU3RyaW5nXCI+PC9wYXJhbT5cbiAgICAgICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwiQXJyYXlcIiBlbGVtZW50VHlwZT1cIkluZGV4U3BlY1wiPjwvcmV0dXJucz5cbiAgICAgICAgICAgIHZhciBydiA9IFtdO1xuICAgICAgICAgICAgaW5kZXhlcy5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpbmRleC50cmltKCk7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBpbmRleC5yZXBsYWNlKFwiJlwiLCBcIlwiKS5yZXBsYWNlKFwiKytcIiwgXCJcIikucmVwbGFjZShcIipcIiwgXCJcIik7XG4gICAgICAgICAgICAgICAgdmFyIGtleVBhdGggPSAobmFtZS5pbmRleE9mKCdbJykgIT09IDAgPyBuYW1lIDogaW5kZXguc3Vic3RyaW5nKGluZGV4LmluZGV4T2YoJ1snKSArIDEsIGluZGV4LmluZGV4T2YoJ10nKSkuc3BsaXQoJysnKSk7XG5cbiAgICAgICAgICAgICAgICBydi5wdXNoKG5ldyBJbmRleFNwZWMoXG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGtleVBhdGggfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXguaW5kZXhPZignJicpICE9PSAtMSxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXguaW5kZXhPZignKicpICE9PSAtMSxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXguaW5kZXhPZihcIisrXCIpICE9PSAtMSxcbiAgICAgICAgICAgICAgICAgICAgQXJyYXkuaXNBcnJheShrZXlQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAga2V5UGF0aC5pbmRleE9mKCcuJykgIT09IC0xXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBydjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFzY2VuZGluZyhhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IDA7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkZXNjZW5kaW5nKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IDEgOiBhID4gYiA/IC0xIDogMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXBvdW5kQ29tcGFyZShpdGVtQ29tcGFyZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBpdGVtQ29tcGFyZShhW2ldLCBiW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gMCkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgKytpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PT0gYS5sZW5ndGggfHwgaSA9PT0gYi5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbUNvbXBhcmUoYS5sZW5ndGgsIGIubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY29tYmluZShmaWx0ZXIxLCBmaWx0ZXIyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyMSA/IGZpbHRlcjIgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBmaWx0ZXIxLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgJiYgZmlsdGVyMi5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IDogZmlsdGVyMSA6IGZpbHRlcjI7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBoYXNJRURlbGV0ZU9iamVjdFN0b3JlQnVnKCkge1xuICAgICAgICAgICAgLy8gQXNzdW1lIGJ1ZyBpcyBwcmVzZW50IGluIElFMTAgYW5kIElFMTEgYnV0IGRvbnQgZXhwZWN0IGl0IGluIG5leHQgdmVyc2lvbiBvZiBJRSAoSUUxMilcbiAgICAgICAgICAgIHJldHVybiBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJUcmlkZW50XCIpID49IDAgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiTVNJRVwiKSA+PSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVhZEdsb2JhbFNjaGVtYSgpIHtcbiAgICAgICAgICAgIGRiLnZlcm5vID0gaWRiZGIudmVyc2lvbiAvIDEwO1xuICAgICAgICAgICAgZGIuX2RiU2NoZW1hID0gZ2xvYmFsU2NoZW1hID0ge307XG4gICAgICAgICAgICBkYlN0b3JlTmFtZXMgPSBbXS5zbGljZS5jYWxsKGlkYmRiLm9iamVjdFN0b3JlTmFtZXMsIDApO1xuICAgICAgICAgICAgaWYgKGRiU3RvcmVOYW1lcy5sZW5ndGggPT09IDApIHJldHVybjsgLy8gRGF0YWJhc2UgY29udGFpbnMgbm8gc3RvcmVzLlxuICAgICAgICAgICAgdmFyIHRyYW5zID0gaWRiZGIudHJhbnNhY3Rpb24oc2FmYXJpTXVsdGlTdG9yZUZpeChkYlN0b3JlTmFtZXMpLCAncmVhZG9ubHknKTtcbiAgICAgICAgICAgIGRiU3RvcmVOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChzdG9yZU5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSB0cmFucy5vYmplY3RTdG9yZShzdG9yZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBrZXlQYXRoID0gc3RvcmUua2V5UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZG90dGVkID0ga2V5UGF0aCAmJiB0eXBlb2Yga2V5UGF0aCA9PT0gJ3N0cmluZycgJiYga2V5UGF0aC5pbmRleE9mKCcuJykgIT09IC0xO1xuICAgICAgICAgICAgICAgIHZhciBwcmltS2V5ID0gbmV3IEluZGV4U3BlYyhrZXlQYXRoLCBrZXlQYXRoIHx8IFwiXCIsIGZhbHNlLCBmYWxzZSwgISFzdG9yZS5hdXRvSW5jcmVtZW50LCBrZXlQYXRoICYmIHR5cGVvZiBrZXlQYXRoICE9PSAnc3RyaW5nJywgZG90dGVkKTtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXhlcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3RvcmUuaW5kZXhOYW1lcy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaWRiaW5kZXggPSBzdG9yZS5pbmRleChzdG9yZS5pbmRleE5hbWVzW2pdKTtcbiAgICAgICAgICAgICAgICAgICAga2V5UGF0aCA9IGlkYmluZGV4LmtleVBhdGg7XG4gICAgICAgICAgICAgICAgICAgIGRvdHRlZCA9IGtleVBhdGggJiYgdHlwZW9mIGtleVBhdGggPT09ICdzdHJpbmcnICYmIGtleVBhdGguaW5kZXhPZignLicpICE9PSAtMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gbmV3IEluZGV4U3BlYyhpZGJpbmRleC5uYW1lLCBrZXlQYXRoLCAhIWlkYmluZGV4LnVuaXF1ZSwgISFpZGJpbmRleC5tdWx0aUVudHJ5LCBmYWxzZSwga2V5UGF0aCAmJiB0eXBlb2Yga2V5UGF0aCAhPT0gJ3N0cmluZycsIGRvdHRlZCk7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ZXMucHVzaChpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGdsb2JhbFNjaGVtYVtzdG9yZU5hbWVdID0gbmV3IFRhYmxlU2NoZW1hKHN0b3JlTmFtZSwgcHJpbUtleSwgaW5kZXhlcywge30pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZXRBcGlPblBsYWNlKFthbGxUYWJsZXNdLCBkYi5fdHJhbnNQcm9taXNlRmFjdG9yeSwgT2JqZWN0LmtleXMoZ2xvYmFsU2NoZW1hKSwgUkVBRFdSSVRFLCBnbG9iYWxTY2hlbWEpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWRqdXN0VG9FeGlzdGluZ0luZGV4TmFtZXMoc2NoZW1hLCBpZGJ0cmFucykge1xuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAgICAgLy8vIElzc3VlICMzMCBQcm9ibGVtIHdpdGggZXhpc3RpbmcgZGIgLSBhZGp1c3QgdG8gZXhpc3RpbmcgaW5kZXggbmFtZXMgd2hlbiBtaWdyYXRpbmcgZnJvbSBub24tZGV4aWUgZGJcbiAgICAgICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJzY2hlbWFcIiB0eXBlPVwiT2JqZWN0XCI+TWFwIGJldHdlZW4gbmFtZSBhbmQgVGFibGVTY2hlbWE8L3BhcmFtPlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiaWRidHJhbnNcIiB0eXBlPVwiSURCVHJhbnNhY3Rpb25cIj48L3BhcmFtPlxuICAgICAgICAgICAgdmFyIHN0b3JlTmFtZXMgPSBpZGJ0cmFucy5kYi5vYmplY3RTdG9yZU5hbWVzO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdG9yZU5hbWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlTmFtZSA9IHN0b3JlTmFtZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gaWRidHJhbnMub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHN0b3JlLmluZGV4TmFtZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4TmFtZSA9IHN0b3JlLmluZGV4TmFtZXNbal07XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXlQYXRoID0gc3RvcmUuaW5kZXgoaW5kZXhOYW1lKS5rZXlQYXRoO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGV4aWVOYW1lID0gdHlwZW9mIGtleVBhdGggPT09ICdzdHJpbmcnID8ga2V5UGF0aCA6IFwiW1wiICsgW10uc2xpY2UuY2FsbChrZXlQYXRoKS5qb2luKCcrJykgKyBcIl1cIjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjaGVtYVtzdG9yZU5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXhTcGVjID0gc2NoZW1hW3N0b3JlTmFtZV0uaWR4QnlOYW1lW2RleGllTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhTcGVjKSBpbmRleFNwZWMubmFtZSA9IGluZGV4TmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4dGVuZCh0aGlzLCB7XG4gICAgICAgICAgICBDb2xsZWN0aW9uOiBDb2xsZWN0aW9uLFxuICAgICAgICAgICAgVGFibGU6IFRhYmxlLFxuICAgICAgICAgICAgVHJhbnNhY3Rpb246IFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgVmVyc2lvbjogVmVyc2lvbixcbiAgICAgICAgICAgIFdoZXJlQ2xhdXNlOiBXaGVyZUNsYXVzZSxcbiAgICAgICAgICAgIFdyaXRlYWJsZUNvbGxlY3Rpb246IFdyaXRlYWJsZUNvbGxlY3Rpb24sXG4gICAgICAgICAgICBXcml0ZWFibGVUYWJsZTogV3JpdGVhYmxlVGFibGVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaW5pdCgpO1xuXG4gICAgICAgIGFkZG9ucy5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgZm4oZGIpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIFByb21pc2UgQ2xhc3NcbiAgICAvL1xuICAgIC8vIEEgdmFyaWFudCBvZiBwcm9taXNlLWxpZ2h0IChodHRwczovL2dpdGh1Yi5jb20vdGF5bG9yaGFrZXMvcHJvbWlzZS1saWdodCkgYnkgaHR0cHM6Ly9naXRodWIuY29tL3RheWxvcmhha2VzIC0gYW4gQSsgYW5kIEVDTUFTQ1JJUFQgNiBjb21wbGlhbnQgUHJvbWlzZSBpbXBsZW1lbnRhdGlvbi5cbiAgICAvL1xuICAgIC8vIE1vZGlmaWVkIGJ5IERhdmlkIEZhaGxhbmRlciB0byBiZSBpbmRleGVkREIgY29tcGxpYW50IChTZWUgZGlzY3Vzc2lvbjogaHR0cHM6Ly9naXRodWIuY29tL3Byb21pc2VzLWFwbHVzL3Byb21pc2VzLXNwZWMvaXNzdWVzLzQ1KSAuXG4gICAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiB3aWxsIG5vdCB1c2Ugc2V0VGltZW91dCBvciBzZXRJbW1lZGlhdGUgd2hlbiBpdCdzIG5vdCBuZWVkZWQuIFRoZSBiZWhhdmlvciBpcyAxMDAlIFByb21pc2UvQSsgY29tcGxpYW50IHNpbmNlXG4gICAgLy8gdGhlIGNhbGxlciBvZiBuZXcgUHJvbWlzZSgpIGNhbiBiZSBjZXJ0YWluIHRoYXQgdGhlIHByb21pc2Ugd29udCBiZSB0cmlnZ2VyZWQgdGhlIGxpbmVzIGFmdGVyIGNvbnN0cnVjdGluZyB0aGUgcHJvbWlzZS4gV2UgZml4IHRoaXMgYnkgdXNpbmcgdGhlIG1lbWJlciB2YXJpYWJsZSBjb25zdHJ1Y3RpbmcgdG8gY2hlY2tcbiAgICAvLyB3aGV0aGVyIHRoZSBvYmplY3QgaXMgYmVpbmcgY29uc3RydWN0ZWQgd2hlbiByZWplY3Qgb3IgcmVzb2x2ZSBpcyBjYWxsZWQuIElmIHNvLCB0aGUgdXNlIHNldFRpbWVvdXQvc2V0SW1tZWRpYXRlIHRvIGZ1bGZpbGwgdGhlIHByb21pc2UsIG90aGVyd2lzZSwgd2Uga25vdyB0aGF0IGl0J3Mgbm90IG5lZWRlZC5cbiAgICAvL1xuICAgIC8vIFRoaXMgdG9waWMgd2FzIGFsc28gZGlzY3Vzc2VkIGluIHRoZSBmb2xsb3dpbmcgdGhyZWFkOiBodHRwczovL2dpdGh1Yi5jb20vcHJvbWlzZXMtYXBsdXMvcHJvbWlzZXMtc3BlYy9pc3N1ZXMvNDUgYW5kIHRoaXMgaW1wbGVtZW50YXRpb24gc29sdmVzIHRoYXQgaXNzdWUuXG4gICAgLy9cbiAgICAvLyBBbm90aGVyIGZlYXR1cmUgd2l0aCB0aGlzIFByb21pc2UgaW1wbGVtZW50YXRpb24gaXMgdGhhdCByZWplY3Qgd2lsbCByZXR1cm4gZmFsc2UgaW4gY2FzZSBubyBvbmUgY2F0Y2hlZCB0aGUgcmVqZWN0IGNhbGwuIFRoaXMgaXMgdXNlZFxuICAgIC8vIHRvIHN0b3BQcm9wYWdhdGlvbigpIG9uIHRoZSBJREJSZXF1ZXN0IGVycm9yIGV2ZW50IGluIGNhc2UgaXQgd2FzIGNhdGNoZWQgYnV0IG5vdCBvdGhlcndpc2UuXG4gICAgLy9cbiAgICAvLyBBbHNvLCB0aGUgZXZlbnQgbmV3IFByb21pc2UoKS5vbnVuY2F0Y2hlZCBpcyBjYWxsZWQgaW4gY2FzZSBubyBvbmUgY2F0Y2hlcyBhIHJlamVjdCBjYWxsLiBUaGlzIGlzIHVzZWQgZm9yIHVzIHRvIG1hbnVhbGx5IGJ1YmJsZSBhbnkgcmVxdWVzdFxuICAgIC8vIGVycm9ycyB0byB0aGUgdHJhbnNhY3Rpb24uIFdlIG11c3Qgbm90IHJlbHkgb24gSW5kZXhlZERCIGltcGxlbWVudGF0aW9uIHRvIGRvIHRoaXMsIGJlY2F1c2UgaXQgb25seSBkb2VzIHNvIHdoZW4gdGhlIHNvdXJjZSBvZiB0aGUgcmVqZWN0aW9uXG4gICAgLy8gaXMgYW4gZXJyb3IgZXZlbnQgb24gYSByZXF1ZXN0LCBub3QgaW4gY2FzZSBhbiBvcmRpbmFyeSBleGNlcHRpb24gaXMgdGhyb3duLlxuICAgIHZhciBQcm9taXNlID0gKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvLyBUaGUgdXNlIG9mIGFzYXAgaW4gaGFuZGxlKCkgaXMgcmVtYXJrZWQgYmVjYXVzZSB3ZSBtdXN0IE5PVCB1c2Ugc2V0VGltZW91dChmbiwwKSBiZWNhdXNlIGl0IGNhdXNlcyBwcmVtYXR1cmUgY29tbWl0IG9mIGluZGV4ZWREQiB0cmFuc2FjdGlvbnMgLSB3aGljaCBpcyBhY2NvcmRpbmcgdG8gaW5kZXhlZERCIHNwZWNpZmljYXRpb24uXG4gICAgICAgIHZhciBfc2xpY2UgPSBbXS5zbGljZTtcbiAgICAgICAgdmFyIF9hc2FwID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ3VuZGVmaW5lZCcgPyBmdW5jdGlvbihmbiwgYXJnMSwgYXJnMiwgYXJnTikge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBmbi5hcHBseShnbG9iYWwsIF9zbGljZS5jYWxsKGFyZ3MsIDEpKTsgfSwgMCk7IC8vIElmIG5vdCBGRjEzIGFuZCBlYXJsaWVyIGZhaWxlZCwgd2UgY291bGQgdXNlIHRoaXMgY2FsbCBoZXJlIGluc3RlYWQ6IHNldFRpbWVvdXQuY2FsbCh0aGlzLCBbZm4sIDBdLmNvbmNhdChhcmd1bWVudHMpKTtcbiAgICAgICAgfSA6IHNldEltbWVkaWF0ZTsgLy8gSUUxMCsgYW5kIG5vZGUuXG5cbiAgICAgICAgZG9GYWtlQXV0b0NvbXBsZXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIFNpbXBsaWZ5IHRoZSBqb2IgZm9yIFZTIEludGVsbGlzZW5zZS4gVGhpcyBwaWVjZSBvZiBjb2RlIGlzIG9uZSBvZiB0aGUga2V5cyB0byB0aGUgbmV3IG1hcnZlbGxvdXMgaW50ZWxsaXNlbnNlIHN1cHBvcnQgaW4gRGV4aWUuXG4gICAgICAgICAgICBfYXNhcCA9IGFzYXAgPSBlbnF1ZXVlSW1tZWRpYXRlID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50czsgc2V0VGltZW91dChmdW5jdGlvbigpIHsgZm4uYXBwbHkoZ2xvYmFsLCBfc2xpY2UuY2FsbChhcmdzLCAxKSk7IH0sIDApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGFzYXAgPSBfYXNhcCxcbiAgICAgICAgICAgIGlzUm9vdEV4ZWN1dGlvbiA9IHRydWU7XG5cbiAgICAgICAgdmFyIG9wZXJhdGlvbnNRdWV1ZSA9IFtdO1xuICAgICAgICB2YXIgdGlja0ZpbmFsaXplcnMgPSBbXTtcbiAgICAgICAgZnVuY3Rpb24gZW5xdWV1ZUltbWVkaWF0ZShmbiwgYXJncykge1xuICAgICAgICAgICAgb3BlcmF0aW9uc1F1ZXVlLnB1c2goW2ZuLCBfc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBleGVjdXRlT3BlcmF0aW9uc1F1ZXVlKCkge1xuICAgICAgICAgICAgdmFyIHF1ZXVlID0gb3BlcmF0aW9uc1F1ZXVlO1xuICAgICAgICAgICAgb3BlcmF0aW9uc1F1ZXVlID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHF1ZXVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gcXVldWVbaV07XG4gICAgICAgICAgICAgICAgaXRlbVswXS5hcHBseShnbG9iYWwsIGl0ZW1bMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy92YXIgUHJvbWlzZUlEID0gMDtcbiAgICAgICAgZnVuY3Rpb24gUHJvbWlzZShmbikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzICE9PSAnb2JqZWN0JykgdGhyb3cgbmV3IFR5cGVFcnJvcignUHJvbWlzZXMgbXVzdCBiZSBjb25zdHJ1Y3RlZCB2aWEgbmV3Jyk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdub3QgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBudWxsOyAvLyBudWxsICg9cGVuZGluZyksIGZhbHNlICg9cmVqZWN0ZWQpIG9yIHRydWUgKD1yZXNvbHZlZClcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gbnVsbDsgLy8gZXJyb3Igb3IgcmVzdWx0XG4gICAgICAgICAgICB0aGlzLl9kZWZlcnJlZHMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX2NhdGNoZWQgPSBmYWxzZTsgLy8gZm9yIG9udW5jYXRjaGVkXG4gICAgICAgICAgICAvL3RoaXMuX2lkID0gKytQcm9taXNlSUQ7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgY29uc3RydWN0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX1BTRCA9IFByb21pc2UuUFNEO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGRvUmVzb2x2ZSh0aGlzLCBmbiwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnN0cnVjdGluZylcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzYXAocmVzb2x2ZSwgc2VsZiwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc2VsZiwgZGF0YSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uc3RydWN0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhc2FwKHJlamVjdCwgc2VsZiwgcmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3Qoc2VsZiwgcmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBjb25zdHJ1Y3RpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZShzZWxmLCBkZWZlcnJlZCkge1xuICAgICAgICAgICAgaWYgKHNlbGYuX3N0YXRlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fZGVmZXJyZWRzLnB1c2goZGVmZXJyZWQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNiID0gc2VsZi5fc3RhdGUgPyBkZWZlcnJlZC5vbkZ1bGZpbGxlZCA6IGRlZmVycmVkLm9uUmVqZWN0ZWQ7XG4gICAgICAgICAgICBpZiAoY2IgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIERlZmVycmVkIGRvZXNudCBoYXZlIGEgbGlzdGVuZXIgZm9yIHRoZSBldmVudCBiZWluZyB0cmlnZ2VyZWQgKG9uRnVsZmlsbGVkIG9yIG9uUmVqZWN0KSBzbyBsZXRzIGZvcndhcmQgdGhlIGV2ZW50IHRvIGFueSBldmVudHVhbCBsaXN0ZW5lcnMgb24gdGhlIFByb21pc2UgaW5zdGFuY2UgcmV0dXJuZWQgYnkgdGhlbigpIG9yIGNhdGNoKClcbiAgICAgICAgICAgICAgICByZXR1cm4gKHNlbGYuX3N0YXRlID8gZGVmZXJyZWQucmVzb2x2ZSA6IGRlZmVycmVkLnJlamVjdCkoc2VsZi5fdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJldCwgaXNSb290RXhlYyA9IGlzUm9vdEV4ZWN1dGlvbjtcbiAgICAgICAgICAgIGlzUm9vdEV4ZWN1dGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgYXNhcCA9IGVucXVldWVJbW1lZGlhdGU7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBvdXRlclBTRCA9IFByb21pc2UuUFNEO1xuICAgICAgICAgICAgICAgIFByb21pc2UuUFNEID0gc2VsZi5fUFNEO1xuICAgICAgICAgICAgICAgIHJldCA9IGNiKHNlbGYuX3ZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuX3N0YXRlICYmICghcmV0IHx8IHR5cGVvZiByZXQudGhlbiAhPT0gJ2Z1bmN0aW9uJyB8fCByZXQuX3N0YXRlICE9PSBmYWxzZSkpIHNldENhdGNoZWQoc2VsZik7IC8vIENhbGxlciBkaWQgJ3JldHVybiBQcm9taXNlLnJlamVjdChlcnIpOycgLSBkb24ndCByZWdhcmQgaXQgYXMgY2F0Y2hlZCFcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJldCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhdGNoZWQgPSBkZWZlcnJlZC5yZWplY3QoZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFjYXRjaGVkICYmIHNlbGYub251bmNhdGNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub251bmNhdGNoZWQoZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgUHJvbWlzZS5QU0QgPSBvdXRlclBTRDtcbiAgICAgICAgICAgICAgICBpZiAoaXNSb290RXhlYykge1xuICAgICAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAob3BlcmF0aW9uc1F1ZXVlLmxlbmd0aCA+IDApIGV4ZWN1dGVPcGVyYXRpb25zUXVldWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaW5hbGl6ZXIgPSB0aWNrRmluYWxpemVycy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaW5hbGl6ZXIpIHRyeSB7ZmluYWxpemVyKCk7fSBjYXRjaChlKXt9XG4gICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKHRpY2tGaW5hbGl6ZXJzLmxlbmd0aCA+IDAgfHwgb3BlcmF0aW9uc1F1ZXVlLmxlbmd0aCA+IDApO1xuICAgICAgICAgICAgICAgICAgICBhc2FwID0gX2FzYXA7XG4gICAgICAgICAgICAgICAgICAgIGlzUm9vdEV4ZWN1dGlvbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX3Jvb3RFeGVjKGZuKSB7XG4gICAgICAgICAgICB2YXIgaXNSb290RXhlYyA9IGlzUm9vdEV4ZWN1dGlvbjtcbiAgICAgICAgICAgIGlzUm9vdEV4ZWN1dGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgYXNhcCA9IGVucXVldWVJbW1lZGlhdGU7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmIChpc1Jvb3RFeGVjKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChvcGVyYXRpb25zUXVldWUubGVuZ3RoID4gMCkgZXhlY3V0ZU9wZXJhdGlvbnNRdWV1ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbmFsaXplciA9IHRpY2tGaW5hbGl6ZXJzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbmFsaXplcikgdHJ5IHsgZmluYWxpemVyKCk7IH0gY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgICAgICAgICB9IHdoaWxlICh0aWNrRmluYWxpemVycy5sZW5ndGggPiAwIHx8IG9wZXJhdGlvbnNRdWV1ZS5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICAgICAgYXNhcCA9IF9hc2FwO1xuICAgICAgICAgICAgICAgICAgICBpc1Jvb3RFeGVjdXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNldENhdGNoZWQocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZS5fY2F0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAocHJvbWlzZS5fcGFyZW50KSBzZXRDYXRjaGVkKHByb21pc2UuX3BhcmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZXNvbHZlKHByb21pc2UsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgb3V0ZXJQU0QgPSBQcm9taXNlLlBTRDtcbiAgICAgICAgICAgIFByb21pc2UuUFNEID0gcHJvbWlzZS5fUFNEO1xuICAgICAgICAgICAgdHJ5IHsgLy9Qcm9taXNlIFJlc29sdXRpb24gUHJvY2VkdXJlOiBodHRwczovL2dpdGh1Yi5jb20vcHJvbWlzZXMtYXBsdXMvcHJvbWlzZXMtc3BlYyN0aGUtcHJvbWlzZS1yZXNvbHV0aW9uLXByb2NlZHVyZVxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gcHJvbWlzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQSBwcm9taXNlIGNhbm5vdCBiZSByZXNvbHZlZCB3aXRoIGl0c2VsZi4nKTtcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgJiYgKHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIG5ld1ZhbHVlID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG5ld1ZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvUmVzb2x2ZShwcm9taXNlLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9uZXdWYWx1ZSBpbnN0YW5jZW9mIFByb21pc2UgPyBuZXdWYWx1ZS5fdGhlbihyZXNvbHZlLCByZWplY3QpIDogbmV3VmFsdWUudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShwcm9taXNlLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByb21pc2UuX3N0YXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwcm9taXNlLl92YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGZpbmFsZS5jYWxsKHByb21pc2UpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgUHJvbWlzZS5QU0QgPSBvdXRlclBTRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdChwcm9taXNlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdmFyIG91dGVyUFNEID0gUHJvbWlzZS5QU0Q7XG4gICAgICAgICAgICBQcm9taXNlLlBTRCA9IHByb21pc2UuX1BTRDtcbiAgICAgICAgICAgIHByb21pc2UuX3N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICBwcm9taXNlLl92YWx1ZSA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICBmaW5hbGUuY2FsbChwcm9taXNlKTtcbiAgICAgICAgICAgIGlmICghcHJvbWlzZS5fY2F0Y2hlZCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9taXNlLm9udW5jYXRjaGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5vbnVuY2F0Y2hlZChwcm9taXNlLl92YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIFByb21pc2Uub24uZXJyb3IuZmlyZShwcm9taXNlLl92YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFByb21pc2UuUFNEID0gb3V0ZXJQU0Q7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZS5fY2F0Y2hlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGZpbmFsZSgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLl9kZWZlcnJlZHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBoYW5kbGUodGhpcywgdGhpcy5fZGVmZXJyZWRzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2RlZmVycmVkcyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gRGVmZXJyZWQob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgdGhpcy5vbkZ1bGZpbGxlZCA9IHR5cGVvZiBvbkZ1bGZpbGxlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uRnVsZmlsbGVkIDogbnVsbDtcbiAgICAgICAgICAgIHRoaXMub25SZWplY3RlZCA9IHR5cGVvZiBvblJlamVjdGVkID09PSAnZnVuY3Rpb24nID8gb25SZWplY3RlZCA6IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgICAgICAgdGhpcy5yZWplY3QgPSByZWplY3Q7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogVGFrZSBhIHBvdGVudGlhbGx5IG1pc2JlaGF2aW5nIHJlc29sdmVyIGZ1bmN0aW9uIGFuZCBtYWtlIHN1cmVcbiAgICAgICAgICogb25GdWxmaWxsZWQgYW5kIG9uUmVqZWN0ZWQgYXJlIG9ubHkgY2FsbGVkIG9uY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIE1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgYXN5bmNocm9ueS5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGRvUmVzb2x2ZShwcm9taXNlLCBmbiwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgIHZhciBkb25lID0gZmFsc2U7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZuKGZ1bmN0aW9uIFByb21pc2VfcmVzb2x2ZSh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9uZSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgb25GdWxmaWxsZWQodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIFByb21pc2VfcmVqZWN0KHJlYXNvbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9uZSkgcmV0dXJuIHByb21pc2UuX2NhdGNoZWQ7XG4gICAgICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb25SZWplY3RlZChyZWFzb24pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9uZSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHJldHVybiBvblJlamVjdGVkKGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIFByb21pc2Uub24gPSBldmVudHMobnVsbCwgXCJlcnJvclwiKTtcblxuICAgICAgICBQcm9taXNlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiBBcnJheS5pc0FycmF5KGFyZ3VtZW50c1swXSkgPyBhcmd1bWVudHNbMF0gOiBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJlc29sdmUoW10pO1xuICAgICAgICAgICAgICAgIHZhciByZW1haW5pbmcgPSBhcmdzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiByZXMoaSwgdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsICYmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGVuID0gdmFsLnRoZW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4uY2FsbCh2YWwsIGZ1bmN0aW9uICh2YWwpIHsgcmVzKGksIHZhbCk7IH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzW2ldID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyhpLCBhcmdzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKiBQcm90b3R5cGUgTWV0aG9kcyAqL1xuICAgICAgICBQcm9taXNlLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24gKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5fc3RhdGUgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZShzZWxmLCBuZXcgRGVmZXJyZWQob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlc29sdmUsIHJlamVjdCkpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYXNhcChoYW5kbGUsIHNlbGYsIG5ldyBEZWZlcnJlZChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzb2x2ZSwgcmVqZWN0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHAuX1BTRCA9IHRoaXMuX1BTRDtcbiAgICAgICAgICAgIHAub251bmNhdGNoZWQgPSB0aGlzLm9udW5jYXRjaGVkOyAvLyBOZWVkZWQgd2hlbiBleGNlcHRpb24gb2NjdXJzIGluIGEgdGhlbigpIGNsYXVzZSBvZiBhIHN1Y2Nlc3NmdWwgcGFyZW50IHByb21pc2UuIFdhbnQgb251bmNhdGNoZWQgdG8gYmUgY2FsbGVkIGV2ZW4gaW4gY2FsbGJhY2tzIG9mIGNhbGxiYWNrcyBvZiB0aGUgb3JpZ2luYWwgcHJvbWlzZS5cbiAgICAgICAgICAgIHAuX3BhcmVudCA9IHRoaXM7IC8vIFVzZWQgZm9yIHJlY3Vyc2l2ZWx5IGNhbGxpbmcgb251bmNhdGNoZWQgZXZlbnQgb24gc2VsZiBhbmQgYWxsIHBhcmVudHMuXG4gICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgfTtcblxuICAgICAgICBQcm9taXNlLnByb3RvdHlwZS5fdGhlbiA9IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICAgICAgICAgICAgaGFuZGxlKHRoaXMsIG5ldyBEZWZlcnJlZChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgbm9wLG5vcCkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIFByb21pc2UucHJvdG90eXBlWydjYXRjaCddID0gZnVuY3Rpb24gKG9uUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0ZWQpO1xuICAgICAgICAgICAgLy8gRmlyc3QgYXJndW1lbnQgaXMgdGhlIEVycm9yIHR5cGUgdG8gY2F0Y2hcbiAgICAgICAgICAgIHZhciB0eXBlID0gYXJndW1lbnRzWzBdLCBjYWxsYmFjayA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHRoaXMudGhlbihudWxsLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIC8vIENhdGNoaW5nIGVycm9ycyBieSBpdHMgY29uc3RydWN0b3IgdHlwZSAoc2ltaWxhciB0byBqYXZhIC8gYysrIC8gYyMpXG4gICAgICAgICAgICAgICAgLy8gU2FtcGxlOiBwcm9taXNlLmNhdGNoKFR5cGVFcnJvciwgZnVuY3Rpb24gKGUpIHsgLi4uIH0pO1xuICAgICAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgdHlwZSkgcmV0dXJuIGNhbGxiYWNrKGUpOyBlbHNlIHJldHVybiBQcm9taXNlLnJlamVjdChlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZWxzZSByZXR1cm4gdGhpcy50aGVuKG51bGwsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2F0Y2hpbmcgZXJyb3JzIGJ5IHRoZSBlcnJvci5uYW1lIHByb3BlcnR5LiBNYWtlcyBzZW5zZSBmb3IgaW5kZXhlZERCIHdoZXJlIGVycm9yIHR5cGVcbiAgICAgICAgICAgICAgICAvLyBpcyBhbHdheXMgRE9NRXJyb3IgYnV0IHdoZXJlIGUubmFtZSB0ZWxscyB0aGUgYWN0dWFsIGVycm9yIHR5cGUuXG4gICAgICAgICAgICAgICAgLy8gU2FtcGxlOiBwcm9taXNlLmNhdGNoKCdDb25zdHJhaW50RXJyb3InLCBmdW5jdGlvbiAoZSkgeyAuLi4gfSk7XG4gICAgICAgICAgICAgICAgaWYgKGUgJiYgZS5uYW1lID09PSB0eXBlKSByZXR1cm4gY2FsbGJhY2soZSk7IGVsc2UgcmV0dXJuIFByb21pc2UucmVqZWN0KGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGVbJ2ZpbmFsbHknXSA9IGZ1bmN0aW9uIChvbkZpbmFsbHkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgb25GaW5hbGx5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIG9uRmluYWxseSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUub251bmNhdGNoZWQgPSBudWxsOyAvLyBPcHRpb25hbCBldmVudCB0cmlnZ2VyZWQgaWYgcHJvbWlzZSBpcyByZWplY3RlZCBidXQgbm8gb25lIGxpc3RlbmVkLlxuXG4gICAgICAgIFByb21pc2UucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAoKSB7IH0pO1xuICAgICAgICAgICAgcC5fc3RhdGUgPSB0cnVlO1xuICAgICAgICAgICAgcC5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICB9O1xuXG4gICAgICAgIFByb21pc2UucmVqZWN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgICAgICBwLl9zdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgcC5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICB9O1xuXG4gICAgICAgIFByb21pc2UucmFjZSA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzLm1hcChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgUHJvbWlzZS5QU0QgPSBudWxsOyAvLyBQcm9taXNlIFNwZWNpZmljIERhdGEgLSBhIFRMUyBQYXR0ZXJuIChUaHJlYWQgTG9jYWwgU3RvcmFnZSkgZm9yIFByb21pc2VzLiBUT0RPOiBSZW5hbWUgUHJvbWlzZS5QU0QgdG8gUHJvbWlzZS5kYXRhXG5cbiAgICAgICAgUHJvbWlzZS5uZXdQU0QgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBuZXcgUFNEIHNjb3BlIChQcm9taXNlIFNwZWNpZmljIERhdGEpXG4gICAgICAgICAgICB2YXIgb3V0ZXJTY29wZSA9IFByb21pc2UuUFNEO1xuICAgICAgICAgICAgUHJvbWlzZS5QU0QgPSBvdXRlclNjb3BlID8gT2JqZWN0LmNyZWF0ZShvdXRlclNjb3BlKSA6IHt9O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4oKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgUHJvbWlzZS5QU0QgPSBvdXRlclNjb3BlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIFByb21pc2UuX3Jvb3RFeGVjID0gX3Jvb3RFeGVjO1xuICAgICAgICBQcm9taXNlLl90aWNrRmluYWxpemUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGlzUm9vdEV4ZWN1dGlvbikgdGhyb3cgbmV3IEVycm9yKFwiTm90IGluIGEgdmlydHVhbCB0aWNrXCIpO1xuICAgICAgICAgICAgdGlja0ZpbmFsaXplcnMucHVzaChjYWxsYmFjayk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2U7XG4gICAgfSkoKTtcblxuXG4gICAgLy9cbiAgICAvL1xuICAgIC8vIC0tLS0tLSBFeHBvcnRhYmxlIEhlbHAgRnVuY3Rpb25zIC0tLS0tLS1cbiAgICAvL1xuICAgIC8vXG5cbiAgICBmdW5jdGlvbiBub3AoKSB7IH1cbiAgICBmdW5jdGlvbiBtaXJyb3IodmFsKSB7IHJldHVybiB2YWw7IH1cblxuICAgIGZ1bmN0aW9uIHB1cmVGdW5jdGlvbkNoYWluKGYxLCBmMikge1xuICAgICAgICAvLyBFbmFibGVzIGNoYWluZWQgZXZlbnRzIHRoYXQgdGFrZXMgT05FIGFyZ3VtZW50IGFuZCByZXR1cm5zIGl0IHRvIHRoZSBuZXh0IGZ1bmN0aW9uIGluIGNoYWluLlxuICAgICAgICAvLyBUaGlzIHBhdHRlcm4gaXMgdXNlZCBpbiB0aGUgaG9vayhcInJlYWRpbmdcIikgZXZlbnQuXG4gICAgICAgIGlmIChmMSA9PT0gbWlycm9yKSByZXR1cm4gZjI7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gZjIoZjEodmFsKSk7XG4gICAgICAgIH07IFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbGxCb3RoKG9uMSwgb24yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBvbjEuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIG9uMi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9OyBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBob29rQ3JlYXRpbmdDaGFpbihmMSwgZjIpIHtcbiAgICAgICAgLy8gRW5hYmxlcyBjaGFpbmVkIGV2ZW50cyB0aGF0IHRha2VzIHNldmVyYWwgYXJndW1lbnRzIGFuZCBtYXkgbW9kaWZ5IGZpcnN0IGFyZ3VtZW50IGJ5IG1ha2luZyBhIG1vZGlmaWNhdGlvbiBhbmQgdGhlbiByZXR1cm5pbmcgdGhlIHNhbWUgaW5zdGFuY2UuXG4gICAgICAgIC8vIFRoaXMgcGF0dGVybiBpcyB1c2VkIGluIHRoZSBob29rKFwiY3JlYXRpbmdcIikgZXZlbnQuXG4gICAgICAgIGlmIChmMSA9PT0gbm9wKSByZXR1cm4gZjI7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gZjEuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmIChyZXMgIT09IHVuZGVmaW5lZCkgYXJndW1lbnRzWzBdID0gcmVzO1xuICAgICAgICAgICAgdmFyIG9uc3VjY2VzcyA9IHRoaXMub25zdWNjZXNzLCAvLyBJbiBjYXNlIGV2ZW50IGxpc3RlbmVyIGhhcyBzZXQgdGhpcy5vbnN1Y2Nlc3NcbiAgICAgICAgICAgICAgICBvbmVycm9yID0gdGhpcy5vbmVycm9yOyAgICAgLy8gSW4gY2FzZSBldmVudCBsaXN0ZW5lciBoYXMgc2V0IHRoaXMub25lcnJvclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMub25zdWNjZXNzO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub25lcnJvcjtcbiAgICAgICAgICAgIHZhciByZXMyID0gZjIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmIChvbnN1Y2Nlc3MpIHRoaXMub25zdWNjZXNzID0gdGhpcy5vbnN1Y2Nlc3MgPyBjYWxsQm90aChvbnN1Y2Nlc3MsIHRoaXMub25zdWNjZXNzKSA6IG9uc3VjY2VzcztcbiAgICAgICAgICAgIGlmIChvbmVycm9yKSB0aGlzLm9uZXJyb3IgPSB0aGlzLm9uZXJyb3IgPyBjYWxsQm90aChvbmVycm9yLCB0aGlzLm9uZXJyb3IpIDogb25lcnJvcjtcbiAgICAgICAgICAgIHJldHVybiByZXMyICE9PSB1bmRlZmluZWQgPyByZXMyIDogcmVzO1xuICAgICAgICB9OyBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBob29rVXBkYXRpbmdDaGFpbihmMSwgZjIpIHtcbiAgICAgICAgaWYgKGYxID09PSBub3ApIHJldHVybiBmMjtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSBmMS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkKSBleHRlbmQoYXJndW1lbnRzWzBdLCByZXMpOyAvLyBJZiBmMSByZXR1cm5zIG5ldyBtb2RpZmljYXRpb25zLCBleHRlbmQgY2FsbGVyJ3MgbW9kaWZpY2F0aW9ucyB3aXRoIHRoZSByZXN1bHQgYmVmb3JlIGNhbGxpbmcgbmV4dCBpbiBjaGFpbi5cbiAgICAgICAgICAgIHZhciBvbnN1Y2Nlc3MgPSB0aGlzLm9uc3VjY2VzcywgLy8gSW4gY2FzZSBldmVudCBsaXN0ZW5lciBoYXMgc2V0IHRoaXMub25zdWNjZXNzXG4gICAgICAgICAgICAgICAgb25lcnJvciA9IHRoaXMub25lcnJvcjsgICAgIC8vIEluIGNhc2UgZXZlbnQgbGlzdGVuZXIgaGFzIHNldCB0aGlzLm9uZXJyb3JcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9uc3VjY2VzcztcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9uZXJyb3I7XG4gICAgICAgICAgICB2YXIgcmVzMiA9IGYyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAob25zdWNjZXNzKSB0aGlzLm9uc3VjY2VzcyA9IHRoaXMub25zdWNjZXNzID8gY2FsbEJvdGgob25zdWNjZXNzLCB0aGlzLm9uc3VjY2VzcykgOiBvbnN1Y2Nlc3M7XG4gICAgICAgICAgICBpZiAob25lcnJvcikgdGhpcy5vbmVycm9yID0gdGhpcy5vbmVycm9yID8gY2FsbEJvdGgob25lcnJvciwgdGhpcy5vbmVycm9yKSA6IG9uZXJyb3I7XG4gICAgICAgICAgICByZXR1cm4gcmVzID09PSB1bmRlZmluZWQgP1xuICAgICAgICAgICAgICAgIChyZXMyID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiByZXMyKSA6XG4gICAgICAgICAgICAgICAgKHJlczIgPT09IHVuZGVmaW5lZCA/IHJlcyA6IGV4dGVuZChyZXMsIHJlczIpKTtcbiAgICAgICAgfTsgXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RvcHBhYmxlRXZlbnRDaGFpbihmMSwgZjIpIHtcbiAgICAgICAgLy8gRW5hYmxlcyBjaGFpbmVkIGV2ZW50cyB0aGF0IG1heSByZXR1cm4gZmFsc2UgdG8gc3RvcCB0aGUgZXZlbnQgY2hhaW4uXG4gICAgICAgIGlmIChmMSA9PT0gbm9wKSByZXR1cm4gZjI7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoZjEuYXBwbHkodGhpcywgYXJndW1lbnRzKSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmMi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9OyBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXZlcnNlU3RvcHBhYmxlRXZlbnRDaGFpbihmMSwgZjIpIHtcbiAgICAgICAgaWYgKGYxID09PSBub3ApIHJldHVybiBmMjtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChmMi5hcHBseSh0aGlzLCBhcmd1bWVudHMpID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGYxLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07IFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vblN0b3BwYWJsZUV2ZW50Q2hhaW4oZjEsIGYyKSB7XG4gICAgICAgIGlmIChmMSA9PT0gbm9wKSByZXR1cm4gZjI7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmMS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgZjIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTsgXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvbWlzYWJsZUNoYWluKGYxLCBmMikge1xuICAgICAgICBpZiAoZjEgPT09IG5vcCkgcmV0dXJuIGYyO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IGYxLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAocmVzICYmIHR5cGVvZiByZXMudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHZhciB0aGl6ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZjIuYXBwbHkodGhpeiwgYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZjIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTsgXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXZlbnRzKGN0eCwgZXZlbnROYW1lcykge1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgdmFyIGV2cyA9IHt9O1xuICAgICAgICB2YXIgcnYgPSBmdW5jdGlvbiAoZXZlbnROYW1lLCBzdWJzY3JpYmVyKSB7XG4gICAgICAgICAgICBpZiAoc3Vic2NyaWJlcikge1xuICAgICAgICAgICAgICAgIC8vIFN1YnNjcmliZVxuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICAgICAgICAgIHZhciBldiA9IGV2c1tldmVudE5hbWVdO1xuICAgICAgICAgICAgICAgIGV2LnN1YnNjcmliZS5hcHBseShldiwgYXJncyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN0eDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIChldmVudE5hbWUpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIC8vIFJldHVybiBpbnRlcmZhY2UgYWxsb3dpbmcgdG8gZmlyZSBvciB1bnN1YnNjcmliZSBmcm9tIGV2ZW50XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2c1tldmVudE5hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9OyBcbiAgICAgICAgcnYuYWRkRXZlbnRUeXBlID0gYWRkO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFkZChldmVudE5hbWUsIGNoYWluRnVuY3Rpb24sIGRlZmF1bHRGdW5jdGlvbikge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZXZlbnROYW1lKSkgcmV0dXJuIGFkZEV2ZW50R3JvdXAoZXZlbnROYW1lKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXZlbnROYW1lID09PSAnb2JqZWN0JykgcmV0dXJuIGFkZENvbmZpZ3VyZWRFdmVudHMoZXZlbnROYW1lKTtcbiAgICAgICAgICAgIGlmICghY2hhaW5GdW5jdGlvbikgY2hhaW5GdW5jdGlvbiA9IHN0b3BwYWJsZUV2ZW50Q2hhaW47XG4gICAgICAgICAgICBpZiAoIWRlZmF1bHRGdW5jdGlvbikgZGVmYXVsdEZ1bmN0aW9uID0gbm9wO1xuXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHtcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmVyczogW10sXG4gICAgICAgICAgICAgICAgZmlyZTogZGVmYXVsdEZ1bmN0aW9uLFxuICAgICAgICAgICAgICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc3Vic2NyaWJlcnMucHVzaChjYik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZmlyZSA9IGNoYWluRnVuY3Rpb24oY29udGV4dC5maXJlLCBjYik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB1bnN1YnNjcmliZTogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc3Vic2NyaWJlcnMgPSBjb250ZXh0LnN1YnNjcmliZXJzLmZpbHRlcihmdW5jdGlvbiAoZm4pIHsgcmV0dXJuIGZuICE9PSBjYjsgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZmlyZSA9IGNvbnRleHQuc3Vic2NyaWJlcnMucmVkdWNlKGNoYWluRnVuY3Rpb24sIGRlZmF1bHRGdW5jdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGV2c1tldmVudE5hbWVdID0gcnZbZXZlbnROYW1lXSA9IGNvbnRleHQ7XG4gICAgICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFkZENvbmZpZ3VyZWRFdmVudHMoY2ZnKSB7XG4gICAgICAgICAgICAvLyBldmVudHModGhpcywge3JlYWRpbmc6IFtmdW5jdGlvbkNoYWluLCBub3BdfSk7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhjZmcpLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gY2ZnW2V2ZW50TmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXJncykpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkKGV2ZW50TmFtZSwgY2ZnW2V2ZW50TmFtZV1bMF0sIGNmZ1tldmVudE5hbWVdWzFdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3MgPT09ICdhc2FwJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBSYXRoZXIgdGhhbiBhcHByb2FjaGluZyBldmVudCBzdWJzY3JpcHRpb24gdXNpbmcgYSBmdW5jdGlvbmFsIGFwcHJvYWNoLCB3ZSBoZXJlIGRvIGl0IGluIGEgZm9yLWxvb3Agd2hlcmUgc3Vic2NyaWJlciBpcyBleGVjdXRlZCBpbiBpdHMgb3duIHN0YWNrXG4gICAgICAgICAgICAgICAgICAgIC8vIGVuYWJsaW5nIHRoYXQgYW55IGV4Y2VwdGlvbiB0aGF0IG9jY3VyIHdvbnQgZGlzdHVyYiB0aGUgaW5pdGlhdG9yIGFuZCBhbHNvIG5vdCBuZXNjZXNzYXJ5IGJlIGNhdGNoZWQgYW5kIGZvcmdvdHRlbi5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBhZGQoZXZlbnROYW1lLCBudWxsLCBmdW5jdGlvbiBmaXJlKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnN1YnNjcmliZXJzLmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNhcChmdW5jdGlvbiBmaXJlRXZlbnQoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuLmFwcGx5KGdsb2JhbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGFuZ2UgaG93IHN1YnNjcmliZSB3b3JrcyB0byBub3QgcmVwbGFjZSB0aGUgZmlyZSBmdW5jdGlvbiBidXQgdG8ganVzdCBhZGQgdGhlIHN1YnNjcmliZXIgdG8gc3Vic2NyaWJlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0LnN1YnNjcmliZXJzLmluZGV4T2YoZm4pID09PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnN1YnNjcmliZXJzLnB1c2goZm4pO1xuICAgICAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC51bnN1YnNjcmliZSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hhbmdlIGhvdyB1bnN1YnNjcmliZSB3b3JrcyBmb3IgdGhlIHNhbWUgcmVhc29uIGFzIGFib3ZlLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkeE9mRm4gPSBjb250ZXh0LnN1YnNjcmliZXJzLmluZGV4T2YoZm4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlkeE9mRm4gIT09IC0xKSBjb250ZXh0LnN1YnNjcmliZXJzLnNwbGljZShpZHhPZkZuLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZXZlbnQgY29uZmlnXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZGRFdmVudEdyb3VwKGV2ZW50R3JvdXApIHtcbiAgICAgICAgICAgIC8vIHByb21pc2UtYmFzZWQgZXZlbnQgZ3JvdXAgKGkuZS4gd2UgcHJvbWlzZSB0byBjYWxsIG9uZSBhbmQgb25seSBvbmUgb2YgdGhlIGV2ZW50cyBpbiB0aGUgcGFpciwgYW5kIHRvIG9ubHkgY2FsbCBpdCBvbmNlLlxuICAgICAgICAgICAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGV2ZW50R3JvdXAuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGFkZChuYW1lKS5zdWJzY3JpYmUoY2hlY2tEb25lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2hlY2tEb25lKCkge1xuICAgICAgICAgICAgICAgIGlmIChkb25lKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMSwgbCA9IGFyZ3MubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICBhZGQoYXJnc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcnY7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXNzZXJ0KGIpIHtcbiAgICAgICAgaWYgKCFiKSB0aHJvdyBuZXcgRXJyb3IoXCJBc3NlcnRpb24gZmFpbGVkXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzYXAoZm4pIHtcbiAgICAgICAgaWYgKGdsb2JhbC5zZXRJbW1lZGlhdGUpIHNldEltbWVkaWF0ZShmbik7IGVsc2Ugc2V0VGltZW91dChmbiwgMCk7XG4gICAgfVxuXG4gICAgdmFyIGZha2VBdXRvQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7IH07Ly8gV2lsbCBuZXZlciBiZSBjaGFuZ2VkLiBXZSBqdXN0IGZha2UgZm9yIHRoZSBJREUgdGhhdCB3ZSBjaGFuZ2UgaXQgKHNlZSBkb0Zha2VBdXRvQ29tcGxldGUoKSlcbiAgICB2YXIgZmFrZSA9IGZhbHNlOyAvLyBXaWxsIG5ldmVyIGJlIGNoYW5nZWQuIFdlIGp1c3QgZmFrZSBmb3IgdGhlIElERSB0aGF0IHdlIGNoYW5nZSBpdCAoc2VlIGRvRmFrZUF1dG9Db21wbGV0ZSgpKVxuXG4gICAgZnVuY3Rpb24gZG9GYWtlQXV0b0NvbXBsZXRlKGZuKSB7XG4gICAgICAgIHZhciB0byA9IHNldFRpbWVvdXQoZm4sIDEwMDApO1xuICAgICAgICBjbGVhclRpbWVvdXQodG8pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRyeWNhdGNoKGZuLCByZWplY3QsIHBzZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG91dGVyUFNEID0gUHJvbWlzZS5QU0Q7IC8vIFN1cHBvcnQgUHJvbWlzZS1zcGVjaWZpYyBkYXRhIChQU0QpIGluIGNhbGxiYWNrIGNhbGxzXG4gICAgICAgICAgICBQcm9taXNlLlBTRCA9IHBzZDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIFByb21pc2UuUFNEID0gb3V0ZXJQU0Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0QnlLZXlQYXRoKG9iaiwga2V5UGF0aCkge1xuICAgICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9JbmRleGVkREIvI3N0ZXBzLWZvci1leHRyYWN0aW5nLWEta2V5LWZyb20tYS12YWx1ZS11c2luZy1hLWtleS1wYXRoXG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5UGF0aCkpIHJldHVybiBvYmpba2V5UGF0aF07IC8vIFRoaXMgbGluZSBpcyBtb3ZlZCBmcm9tIGxhc3QgdG8gZmlyc3QgZm9yIG9wdGltaXphdGlvbiBwdXJwb3NlLlxuICAgICAgICBpZiAoIWtleVBhdGgpIHJldHVybiBvYmo7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5UGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHZhciBydiA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBrZXlQYXRoLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBnZXRCeUtleVBhdGgob2JqLCBrZXlQYXRoW2ldKTtcbiAgICAgICAgICAgICAgICBydi5wdXNoKHZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnY7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBlcmlvZCA9IGtleVBhdGguaW5kZXhPZignLicpO1xuICAgICAgICBpZiAocGVyaW9kICE9PSAtMSkge1xuICAgICAgICAgICAgdmFyIGlubmVyT2JqID0gb2JqW2tleVBhdGguc3Vic3RyKDAsIHBlcmlvZCldO1xuICAgICAgICAgICAgcmV0dXJuIGlubmVyT2JqID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBnZXRCeUtleVBhdGgoaW5uZXJPYmosIGtleVBhdGguc3Vic3RyKHBlcmlvZCArIDEpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEJ5S2V5UGF0aChvYmosIGtleVBhdGgsIHZhbHVlKSB7XG4gICAgICAgIGlmICghb2JqIHx8IGtleVBhdGggPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgICAgICBpZiAodHlwZW9mIGtleVBhdGggIT09ICdzdHJpbmcnICYmICdsZW5ndGgnIGluIGtleVBhdGgpIHtcbiAgICAgICAgICAgIGFzc2VydCh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnICYmICdsZW5ndGgnIGluIHZhbHVlKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0ga2V5UGF0aC5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICBzZXRCeUtleVBhdGgob2JqLCBrZXlQYXRoW2ldLCB2YWx1ZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgcGVyaW9kID0ga2V5UGF0aC5pbmRleE9mKCcuJyk7XG4gICAgICAgICAgICBpZiAocGVyaW9kICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50S2V5UGF0aCA9IGtleVBhdGguc3Vic3RyKDAsIHBlcmlvZCk7XG4gICAgICAgICAgICAgICAgdmFyIHJlbWFpbmluZ0tleVBhdGggPSBrZXlQYXRoLnN1YnN0cihwZXJpb2QgKyAxKTtcbiAgICAgICAgICAgICAgICBpZiAocmVtYWluaW5nS2V5UGF0aCA9PT0gXCJcIilcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIGRlbGV0ZSBvYmpbY3VycmVudEtleVBhdGhdOyBlbHNlIG9ialtjdXJyZW50S2V5UGF0aF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlubmVyT2JqID0gb2JqW2N1cnJlbnRLZXlQYXRoXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbm5lck9iaikgaW5uZXJPYmogPSAob2JqW2N1cnJlbnRLZXlQYXRoXSA9IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgc2V0QnlLZXlQYXRoKGlubmVyT2JqLCByZW1haW5pbmdLZXlQYXRoLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgZGVsZXRlIG9ialtrZXlQYXRoXTsgZWxzZSBvYmpba2V5UGF0aF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlbEJ5S2V5UGF0aChvYmosIGtleVBhdGgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXlQYXRoID09PSAnc3RyaW5nJylcbiAgICAgICAgICAgIHNldEJ5S2V5UGF0aChvYmosIGtleVBhdGgsIHVuZGVmaW5lZCk7XG4gICAgICAgIGVsc2UgaWYgKCdsZW5ndGgnIGluIGtleVBhdGgpXG4gICAgICAgICAgICBbXS5tYXAuY2FsbChrZXlQYXRoLCBmdW5jdGlvbihrcCkge1xuICAgICAgICAgICAgICAgICBzZXRCeUtleVBhdGgob2JqLCBrcCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNoYWxsb3dDbG9uZShvYmopIHtcbiAgICAgICAgdmFyIHJ2ID0ge307XG4gICAgICAgIGZvciAodmFyIG0gaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KG0pKSBydlttXSA9IG9ialttXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnY7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVlcENsb25lKGFueSkge1xuICAgICAgICBpZiAoIWFueSB8fCB0eXBlb2YgYW55ICE9PSAnb2JqZWN0JykgcmV0dXJuIGFueTtcbiAgICAgICAgdmFyIHJ2O1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhbnkpKSB7XG4gICAgICAgICAgICBydiA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhbnkubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICAgICAgcnYucHVzaChkZWVwQ2xvbmUoYW55W2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoYW55IGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgICAgcnYgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgcnYuc2V0VGltZShhbnkuZ2V0VGltZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJ2ID0gYW55LmNvbnN0cnVjdG9yID8gT2JqZWN0LmNyZWF0ZShhbnkuY29uc3RydWN0b3IucHJvdG90eXBlKSA6IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhbnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW55Lmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ2W3Byb3BdID0gZGVlcENsb25lKGFueVtwcm9wXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRPYmplY3REaWZmKGEsIGIpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIHNpbXBsaWZpZWQgdmVyc2lvbiB0aGF0IHdpbGwgYWx3YXlzIHJldHVybiBrZXlwYXRocyBvbiB0aGUgcm9vdCBsZXZlbC5cbiAgICAgICAgLy8gSWYgZm9yIGV4YW1wbGUgYSBhbmQgYiBkaWZmZXJzIGJ5OiAoYS5zb21lUHJvcHNPYmplY3QueCAhPSBiLnNvbWVQcm9wc09iamVjdC54KSwgd2Ugd2lsbCByZXR1cm4gdGhhdCBcInNvbWVQcm9wc09iamVjdFwiIGlzIGNoYW5nZWRcbiAgICAgICAgLy8gYW5kIG5vdCBcInNvbWVQcm9wc09iamVjdC54XCIuIFRoaXMgaXMgYWNjZXB0YWJsZSBhbmQgdHJ1ZSBidXQgY291bGQgYmUgb3B0aW1pemVkIHRvIHN1cHBvcnQgbmVzdGxlZCBjaGFuZ2VzIGlmIHRoYXQgd291bGQgZ2l2ZSBhXG4gICAgICAgIC8vIGJpZyBvcHRpbWl6YXRpb24gYmVuZWZpdC5cbiAgICAgICAgdmFyIHJ2ID0ge307XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gYSkgaWYgKGEuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgIGlmICghYi5oYXNPd25Qcm9wZXJ0eShwcm9wKSlcbiAgICAgICAgICAgICAgICBydltwcm9wXSA9IHVuZGVmaW5lZDsgLy8gUHJvcGVydHkgcmVtb3ZlZFxuICAgICAgICAgICAgZWxzZSBpZiAoYVtwcm9wXSAhPT0gYltwcm9wXSAmJiBKU09OLnN0cmluZ2lmeShhW3Byb3BdKSAhPSBKU09OLnN0cmluZ2lmeShiW3Byb3BdKSlcbiAgICAgICAgICAgICAgICBydltwcm9wXSA9IGJbcHJvcF07IC8vIFByb3BlcnR5IGNoYW5nZWRcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBwcm9wIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHByb3ApICYmICFhLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICBydltwcm9wXSA9IGJbcHJvcF07IC8vIFByb3BlcnR5IGFkZGVkXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlVHlwZSh0eXBlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyB0eXBlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0eXBlKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtwYXJzZVR5cGUodHlwZVswXSldO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgJiYgdHlwZW9mIHR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB2YXIgcnYgPSB7fTtcbiAgICAgICAgICAgIGFwcGx5U3RydWN0dXJlKHJ2LCB0eXBlKTtcbiAgICAgICAgICAgIHJldHVybiBydjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXBwbHlTdHJ1Y3R1cmUob2JqLCBzdHJ1Y3R1cmUpIHtcbiAgICAgICAgT2JqZWN0LmtleXMoc3RydWN0dXJlKS5mb3JFYWNoKGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcnNlVHlwZShzdHJ1Y3R1cmVbbWVtYmVyXSk7XG4gICAgICAgICAgICBvYmpbbWVtYmVyXSA9IHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBzZW50YW5jZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgZXJyT2JqID0gKGV2ZW50ICYmIGV2ZW50LnRhcmdldC5lcnJvcikgfHwgbmV3IEVycm9yKCk7XG4gICAgICAgICAgICBpZiAoc2VudGFuY2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2NjdXJyZWRXaGVuID0gXCIgb2NjdXJyZWQgd2hlbiBcIiArIHNlbnRhbmNlLm1hcChmdW5jdGlvbiAod29yZCkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGVvZiAod29yZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzogcmV0dXJuIHdvcmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6IHJldHVybiB3b3JkO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIEpTT04uc3RyaW5naWZ5KHdvcmQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkuam9pbihcIiBcIik7XG4gICAgICAgICAgICAgICAgaWYgKGVyck9iai5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGVyck9iai50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVyck9iai5uYW1lICsgb2NjdXJyZWRXaGVuICsgKGVyck9iai5tZXNzYWdlID8gXCIuIFwiICsgZXJyT2JqLm1lc3NhZ2UgOiBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvZGUgYmVsb3cgd29ya3MgZm9yIHN0YWNrZWQgZXhjZXB0aW9ucywgQlVUISBzdGFjayBpcyBuZXZlciBwcmVzZW50IGluIGV2ZW50IGVycm9ycyAobm90IGluIGFueSBvZiB0aGUgYnJvd3NlcnMpLiBTbyBpdCdzIG5vIHVzZSB0byBpbmNsdWRlIGl0IVxuICAgICAgICAgICAgICAgICAgICAgICAgLypkZWxldGUgdGhpcy50b1N0cmluZzsgLy8gUHJvaGliaXRpbmcgZW5kbGVzcyByZWN1cnNpdmVuZXNzIGluIElFLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyck9iai5zdGFjaykgcnYgKz0gKGVyck9iai5zdGFjayA/IFwiLiBTdGFjazogXCIgKyBlcnJPYmouc3RhY2sgOiBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9TdHJpbmcgPSB0b1N0cmluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBydjsqL1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVyck9iaiA9IGVyck9iaiArIG9jY3VycmVkV2hlbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVqZWN0KGVyck9iaik7XG5cbiAgICAgICAgICAgIGlmIChldmVudCkgey8vIE9sZCB2ZXJzaW9ucyBvZiBJbmRleGVkREJTaGltIGRvZXNudCBwcm92aWRlIGFuIGVycm9yIGV2ZW50XG4gICAgICAgICAgICAgICAgLy8gU3RvcCBlcnJvciBmcm9tIHByb3BhZ2F0aW5nIHRvIElEQlRyYW5zYWN0aW9uLiBMZXQgdXMgaGFuZGxlIHRoYXQgbWFudWFsbHkgaW5zdGVhZC5cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSAvLyBJbmRleGVkREJTaGltIGRvZXNudCBzdXBwb3J0IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSAvLyBJbmRleGVkREJTaGltIGRvZXNudCBzdXBwb3J0IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YWNrKGVycm9yKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcHJldmVudERlZmF1bHQoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2xvYmFsRGF0YWJhc2VMaXN0KGNiKSB7XG4gICAgICAgIHZhciB2YWwsXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UgPSBEZXhpZS5kZXBlbmRlbmNpZXMubG9jYWxTdG9yYWdlO1xuICAgICAgICBpZiAoIWxvY2FsU3RvcmFnZSkgcmV0dXJuIGNiKFtdKTsgLy8gRW52cyB3aXRob3V0IGxvY2FsU3RvcmFnZSBzdXBwb3J0XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YWwgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdEZXhpZS5EYXRhYmFzZU5hbWVzJykgfHwgXCJbXVwiKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdmFsID0gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNiKHZhbCkpIHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdEZXhpZS5EYXRhYmFzZU5hbWVzJywgSlNPTi5zdHJpbmdpZnkodmFsKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIEluZGV4U3BlYyBzdHJ1Y3RcbiAgICAvL1xuICAgIGZ1bmN0aW9uIEluZGV4U3BlYyhuYW1lLCBrZXlQYXRoLCB1bmlxdWUsIG11bHRpLCBhdXRvLCBjb21wb3VuZCwgZG90dGVkKSB7XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm5hbWVcIiB0eXBlPVwiU3RyaW5nXCI+PC9wYXJhbT5cbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwia2V5UGF0aFwiIHR5cGU9XCJTdHJpbmdcIj48L3BhcmFtPlxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJ1bmlxdWVcIiB0eXBlPVwiQm9vbGVhblwiPjwvcGFyYW0+XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm11bHRpXCIgdHlwZT1cIkJvb2xlYW5cIj48L3BhcmFtPlxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJhdXRvXCIgdHlwZT1cIkJvb2xlYW5cIj48L3BhcmFtPlxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjb21wb3VuZFwiIHR5cGU9XCJCb29sZWFuXCI+PC9wYXJhbT5cbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiZG90dGVkXCIgdHlwZT1cIkJvb2xlYW5cIj48L3BhcmFtPlxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmtleVBhdGggPSBrZXlQYXRoO1xuICAgICAgICB0aGlzLnVuaXF1ZSA9IHVuaXF1ZTtcbiAgICAgICAgdGhpcy5tdWx0aSA9IG11bHRpO1xuICAgICAgICB0aGlzLmF1dG8gPSBhdXRvO1xuICAgICAgICB0aGlzLmNvbXBvdW5kID0gY29tcG91bmQ7XG4gICAgICAgIHRoaXMuZG90dGVkID0gZG90dGVkO1xuICAgICAgICB2YXIga2V5UGF0aFNyYyA9IHR5cGVvZiBrZXlQYXRoID09PSAnc3RyaW5nJyA/IGtleVBhdGggOiBrZXlQYXRoICYmICgnWycgKyBbXS5qb2luLmNhbGwoa2V5UGF0aCwgJysnKSArICddJyk7XG4gICAgICAgIHRoaXMuc3JjID0gKHVuaXF1ZSA/ICcmJyA6ICcnKSArIChtdWx0aSA/ICcqJyA6ICcnKSArIChhdXRvID8gXCIrK1wiIDogXCJcIikgKyBrZXlQYXRoU3JjO1xuICAgIH1cblxuICAgIC8vXG4gICAgLy8gVGFibGVTY2hlbWEgc3RydWN0XG4gICAgLy9cbiAgICBmdW5jdGlvbiBUYWJsZVNjaGVtYShuYW1lLCBwcmltS2V5LCBpbmRleGVzLCBpbnN0YW5jZVRlbXBsYXRlKSB7XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm5hbWVcIiB0eXBlPVwiU3RyaW5nXCI+PC9wYXJhbT5cbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwicHJpbUtleVwiIHR5cGU9XCJJbmRleFNwZWNcIj48L3BhcmFtPlxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJpbmRleGVzXCIgdHlwZT1cIkFycmF5XCIgZWxlbWVudFR5cGU9XCJJbmRleFNwZWNcIj48L3BhcmFtPlxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJpbnN0YW5jZVRlbXBsYXRlXCIgdHlwZT1cIk9iamVjdFwiPjwvcGFyYW0+XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMucHJpbUtleSA9IHByaW1LZXkgfHwgbmV3IEluZGV4U3BlYygpO1xuICAgICAgICB0aGlzLmluZGV4ZXMgPSBpbmRleGVzIHx8IFtuZXcgSW5kZXhTcGVjKCldO1xuICAgICAgICB0aGlzLmluc3RhbmNlVGVtcGxhdGUgPSBpbnN0YW5jZVRlbXBsYXRlO1xuICAgICAgICB0aGlzLm1hcHBlZENsYXNzID0gbnVsbDtcbiAgICAgICAgdGhpcy5pZHhCeU5hbWUgPSBpbmRleGVzLnJlZHVjZShmdW5jdGlvbiAoaGFzaFNldCwgaW5kZXgpIHtcbiAgICAgICAgICAgIGhhc2hTZXRbaW5kZXgubmFtZV0gPSBpbmRleDtcbiAgICAgICAgICAgIHJldHVybiBoYXNoU2V0O1xuICAgICAgICB9LCB7fSk7XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBNb2RpZnlFcnJvciBDbGFzcyAoZXh0ZW5kcyBFcnJvcilcbiAgICAvL1xuICAgIGZ1bmN0aW9uIE1vZGlmeUVycm9yKG1zZywgZmFpbHVyZXMsIHN1Y2Nlc3NDb3VudCwgZmFpbGVkS2V5cykge1xuICAgICAgICB0aGlzLm5hbWUgPSBcIk1vZGlmeUVycm9yXCI7XG4gICAgICAgIHRoaXMuZmFpbHVyZXMgPSBmYWlsdXJlcztcbiAgICAgICAgdGhpcy5mYWlsZWRLZXlzID0gZmFpbGVkS2V5cztcbiAgICAgICAgdGhpcy5zdWNjZXNzQ291bnQgPSBzdWNjZXNzQ291bnQ7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IGZhaWx1cmVzLmpvaW4oJ1xcbicpO1xuICAgIH1cbiAgICBkZXJpdmUoTW9kaWZ5RXJyb3IpLmZyb20oRXJyb3IpO1xuXG4gICAgLy9cbiAgICAvLyBTdGF0aWMgZGVsZXRlKCkgbWV0aG9kLlxuICAgIC8vXG4gICAgRGV4aWUuZGVsZXRlID0gZnVuY3Rpb24gKGRhdGFiYXNlTmFtZSkge1xuICAgICAgICB2YXIgZGIgPSBuZXcgRGV4aWUoZGF0YWJhc2VOYW1lKSxcbiAgICAgICAgICAgIHByb21pc2UgPSBkYi5kZWxldGUoKTtcbiAgICAgICAgcHJvbWlzZS5vbmJsb2NrZWQgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgIGRiLm9uKFwiYmxvY2tlZFwiLCBmbik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfTtcblxuICAgIC8vXG4gICAgLy8gU3RhdGljIGV4aXN0cygpIG1ldGhvZC5cbiAgICAvL1xuICAgIERleGllLmV4aXN0cyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEZXhpZShuYW1lKS5vcGVuKCkudGhlbihmdW5jdGlvbihkYikge1xuICAgICAgICAgICAgZGIuY2xvc2UoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBTdGF0aWMgbWV0aG9kIGZvciByZXRyaWV2aW5nIGEgbGlzdCBvZiBhbGwgZXhpc3RpbmcgZGF0YWJhc2VzIGF0IGN1cnJlbnQgaG9zdC5cbiAgICAvL1xuICAgIERleGllLmdldERhdGFiYXNlTmFtZXMgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIHZhciBnZXREYXRhYmFzZU5hbWVzID0gZ2V0TmF0aXZlR2V0RGF0YWJhc2VOYW1lc0ZuKCk7XG4gICAgICAgICAgICBpZiAoZ2V0RGF0YWJhc2VOYW1lcykgeyAvLyBJbiBjYXNlIGdldERhdGFiYXNlTmFtZXMoKSBiZWNvbWVzIHN0YW5kYXJkLCBsZXQncyBwcmVwYXJlIHRvIHN1cHBvcnQgaXQ6XG4gICAgICAgICAgICAgICAgdmFyIHJlcSA9IGdldERhdGFiYXNlTmFtZXMoKTtcbiAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW10uc2xpY2UuY2FsbChldmVudC50YXJnZXQucmVzdWx0LCAwKSk7IC8vIENvbnZlcnN0IERPTVN0cmluZ0xpc3QgdG8gQXJyYXk8U3RyaW5nPlxuICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdsb2JhbERhdGFiYXNlTGlzdChmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGNiKTtcbiAgICB9OyBcblxuICAgIERleGllLmRlZmluZUNsYXNzID0gZnVuY3Rpb24gKHN0cnVjdHVyZSkge1xuICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgIC8vLyAgICAgQ3JlYXRlIGEgamF2YXNjcmlwdCBjb25zdHJ1Y3RvciBiYXNlZCBvbiBnaXZlbiB0ZW1wbGF0ZSBmb3Igd2hpY2ggcHJvcGVydGllcyB0byBleHBlY3QgaW4gdGhlIGNsYXNzLlxuICAgICAgICAvLy8gICAgIEFueSBwcm9wZXJ0eSB0aGF0IGlzIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gd2lsbCBhY3QgYXMgYSB0eXBlLiBTbyB7bmFtZTogU3RyaW5nfSB3aWxsIGJlIGVxdWFsIHRvIHtuYW1lOiBuZXcgU3RyaW5nKCl9LlxuICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJzdHJ1Y3R1cmVcIj5IZWxwcyBJREUgY29kZSBjb21wbGV0aW9uIGJ5IGtub3dpbmcgdGhlIG1lbWJlcnMgdGhhdCBvYmplY3RzIGNvbnRhaW4gYW5kIG5vdCBqdXN0IHRoZSBpbmRleGVzLiBBbHNvXG4gICAgICAgIC8vLyBrbm93IHdoYXQgdHlwZSBlYWNoIG1lbWJlciBoYXMuIEV4YW1wbGU6IHtuYW1lOiBTdHJpbmcsIGVtYWlsQWRkcmVzc2VzOiBbU3RyaW5nXSwgcHJvcGVydGllczoge3Nob2VTaXplOiBOdW1iZXJ9fTwvcGFyYW0+XG5cbiAgICAgICAgLy8gRGVmYXVsdCBjb25zdHJ1Y3RvciBhYmxlIHRvIGNvcHkgZ2l2ZW4gcHJvcGVydGllcyBpbnRvIHRoaXMgb2JqZWN0LlxuICAgICAgICBmdW5jdGlvbiBDbGFzcyhwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJwcm9wZXJ0aWVzXCIgdHlwZT1cIk9iamVjdFwiIG9wdGlvbmFsPVwidHJ1ZVwiPlByb3BlcnRpZXMgdG8gaW5pdGlhbGl6ZSBvYmplY3Qgd2l0aC5cbiAgICAgICAgICAgIC8vLyA8L3BhcmFtPlxuICAgICAgICAgICAgcHJvcGVydGllcyA/IGV4dGVuZCh0aGlzLCBwcm9wZXJ0aWVzKSA6IGZha2UgJiYgYXBwbHlTdHJ1Y3R1cmUodGhpcywgc3RydWN0dXJlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ2xhc3M7XG4gICAgfTsgXG5cbiAgICBEZXhpZS5pZ25vcmVUcmFuc2FjdGlvbiA9IGZ1bmN0aW9uIChzY29wZUZ1bmMpIHtcbiAgICAgICAgLy8gSW4gY2FzZSBjYWxsZXIgaXMgd2l0aGluIGEgdHJhbnNhY3Rpb24gYnV0IG5lZWRzIHRvIGNyZWF0ZSBhIHNlcGFyYXRlIHRyYW5zYWN0aW9uLlxuICAgICAgICAvLyBFeGFtcGxlIG9mIHVzYWdlOlxuICAgICAgICAvLyBcbiAgICAgICAgLy8gTGV0J3Mgc2F5IHdlIGhhdmUgYSBsb2dnZXIgZnVuY3Rpb24gaW4gb3VyIGFwcC4gT3RoZXIgYXBwbGljYXRpb24tbG9naWMgc2hvdWxkIGJlIHVuYXdhcmUgb2YgdGhlXG4gICAgICAgIC8vIGxvZ2dlciBmdW5jdGlvbiBhbmQgbm90IG5lZWQgdG8gaW5jbHVkZSB0aGUgJ2xvZ2VudHJpZXMnIHRhYmxlIGluIGFsbCB0cmFuc2FjdGlvbiBpdCBwZXJmb3Jtcy5cbiAgICAgICAgLy8gVGhlIGxvZ2dpbmcgc2hvdWxkIGFsd2F5cyBiZSBkb25lIGluIGEgc2VwYXJhdGUgdHJhbnNhY3Rpb24gYW5kIG5vdCBiZSBkZXBlbmRhbnQgb24gdGhlIGN1cnJlbnRcbiAgICAgICAgLy8gcnVubmluZyB0cmFuc2FjdGlvbiBjb250ZXh0LiBUaGVuIHlvdSBjb3VsZCB1c2UgRGV4aWUuaWdub3JlVHJhbnNhY3Rpb24oKSB0byBydW4gY29kZSB0aGF0IHN0YXJ0cyBhIG5ldyB0cmFuc2FjdGlvbi5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgIERleGllLmlnbm9yZVRyYW5zYWN0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyAgICAgICAgIGRiLmxvZ2VudHJpZXMuYWRkKG5ld0xvZ0VudHJ5KTtcbiAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAvL1xuICAgICAgICAvLyBVbmxlc3MgdXNpbmcgRGV4aWUuaWdub3JlVHJhbnNhY3Rpb24oKSwgdGhlIGFib3ZlIGV4YW1wbGUgd291bGQgdHJ5IHRvIHJldXNlIHRoZSBjdXJyZW50IHRyYW5zYWN0aW9uXG4gICAgICAgIC8vIGluIGN1cnJlbnQgUHJvbWlzZS1zY29wZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW4gYWx0ZXJuYXRpdmUgdG8gRGV4aWUuaWdub3JlVHJhbnNhY3Rpb24oKSB3b3VsZCBiZSBzZXRJbW1lZGlhdGUoKSBvciBzZXRUaW1lb3V0KCkuIFRoZSByZWFzb24gd2Ugc3RpbGwgcHJvdmlkZSBhblxuICAgICAgICAvLyBBUEkgZm9yIHRoaXMgYmVjYXVzZVxuICAgICAgICAvLyAgMSkgVGhlIGludGVudGlvbiBvZiB3cml0aW5nIHRoZSBzdGF0ZW1lbnQgY291bGQgYmUgdW5jbGVhciBpZiB1c2luZyBzZXRJbW1lZGlhdGUoKSBvciBzZXRUaW1lb3V0KCkuXG4gICAgICAgIC8vICAyKSBzZXRUaW1lb3V0KCkgd291bGQgd2FpdCB1bm5lc2Nlc3NhcnkgdW50aWwgZmlyaW5nLiBUaGlzIGlzIGhvd2V2ZXIgbm90IHRoZSBjYXNlIHdpdGggc2V0SW1tZWRpYXRlKCkuXG4gICAgICAgIC8vICAzKSBzZXRJbW1lZGlhdGUoKSBpcyBub3Qgc3VwcG9ydGVkIGluIHRoZSBFUyBzdGFuZGFyZC5cbiAgICAgICAgcmV0dXJuIFByb21pc2UubmV3UFNEKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFByb21pc2UuUFNELnRyYW5zID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiBzY29wZUZ1bmMoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBEZXhpZS5zcGF3biA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGdsb2JhbC5jb25zb2xlKSBjb25zb2xlLndhcm4oXCJEZXhpZS5zcGF3bigpIGlzIGRlcHJlY2F0ZWQuIFVzZSBEZXhpZS5pZ25vcmVUcmFuc2FjdGlvbigpIGluc3RlYWQuXCIpO1xuICAgICAgICByZXR1cm4gRGV4aWUuaWdub3JlVHJhbnNhY3Rpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBEZXhpZS52aXAgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgLy8gVG8gYmUgdXNlZCBieSBzdWJzY3JpYmVycyB0byB0aGUgb24oJ3JlYWR5JykgZXZlbnQuXG4gICAgICAgIC8vIFRoaXMgd2lsbCBsZXQgY2FsbGVyIHRocm91Z2ggdG8gYWNjZXNzIERCIGV2ZW4gd2hlbiBpdCBpcyBibG9ja2VkIHdoaWxlIHRoZSBkYi5yZWFkeSgpIHN1YnNjcmliZXJzIGFyZSBmaXJpbmcuXG4gICAgICAgIC8vIFRoaXMgd291bGQgaGF2ZSB3b3JrZWQgYXV0b21hdGljYWxseSBpZiB3ZSB3ZXJlIGNlcnRhaW4gdGhhdCB0aGUgUHJvdmlkZXIgd2FzIHVzaW5nIERleGllLlByb21pc2UgZm9yIGFsbCBhc3luY3JvbmljIG9wZXJhdGlvbnMuIFRoZSBwcm9taXNlIFBTRFxuICAgICAgICAvLyBmcm9tIHRoZSBwcm92aWRlci5jb25uZWN0KCkgY2FsbCB3b3VsZCB0aGVuIGJlIGRlcml2ZWQgYWxsIHRoZSB3YXkgdG8gd2hlbiBwcm92aWRlciB3b3VsZCBjYWxsIGxvY2FsRGF0YWJhc2UuYXBwbHlDaGFuZ2VzKCkuIEJ1dCBzaW5jZVxuICAgICAgICAvLyB0aGUgcHJvdmlkZXIgbW9yZSBsaWtlbHkgaXMgdXNpbmcgbm9uLXByb21pc2UgYXN5bmMgQVBJcyBvciBvdGhlciB0aGVuYWJsZSBpbXBsZW1lbnRhdGlvbnMsIHdlIGNhbm5vdCBhc3N1bWUgdGhhdC5cbiAgICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgbWV0aG9kIGlzIG9ubHkgdXNlZnVsIGZvciBvbigncmVhZHknKSBzdWJzY3JpYmVycyB0aGF0IGlzIHJldHVybmluZyBhIFByb21pc2UgZnJvbSB0aGUgZXZlbnQuIElmIG5vdCB1c2luZyB2aXAoKVxuICAgICAgICAvLyB0aGUgZGF0YWJhc2UgY291bGQgZGVhZGxvY2sgc2luY2UgaXQgd29udCBvcGVuIHVudGlsIHRoZSByZXR1cm5lZCBQcm9taXNlIGlzIHJlc29sdmVkLCBhbmQgYW55IG5vbi1WSVBlZCBvcGVyYXRpb24gc3RhcnRlZCBieVxuICAgICAgICAvLyB0aGUgY2FsbGVyIHdpbGwgbm90IHJlc29sdmUgdW50aWwgZGF0YWJhc2UgaXMgb3BlbmVkLlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5uZXdQU0QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgUHJvbWlzZS5QU0QubGV0VGhyb3VnaCA9IHRydWU7IC8vIE1ha2Ugc3VyZSB3ZSBhcmUgbGV0IHRocm91Z2ggaWYgc3RpbGwgYmxvY2tpbmcgZGIgZHVlIHRvIG9ucmVhZHkgaXMgZmlyaW5nLlxuICAgICAgICAgICAgcmV0dXJuIGZuKCk7XG4gICAgICAgIH0pO1xuICAgIH07IFxuXG4gICAgLy8gRGV4aWUuY3VycmVudFRyYW5zYWN0aW9uIHByb3BlcnR5LiBPbmx5IGFwcGxpY2FibGUgZm9yIHRyYW5zYWN0aW9ucyBlbnRlcmVkIHVzaW5nIHRoZSBuZXcgXCJ0cmFuc2FjdCgpXCIgbWV0aG9kLlxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEZXhpZSwgXCJjdXJyZW50VHJhbnNhY3Rpb25cIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwiVHJhbnNhY3Rpb25cIj48L3JldHVybnM+XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5QU0QgJiYgUHJvbWlzZS5QU0QudHJhbnMgfHwgbnVsbDtcbiAgICAgICAgfVxuICAgIH0pOyBcblxuICAgIGZ1bmN0aW9uIHNhZmFyaU11bHRpU3RvcmVGaXgoc3RvcmVOYW1lcykge1xuICAgICAgICByZXR1cm4gc3RvcmVOYW1lcy5sZW5ndGggPT09IDEgPyBzdG9yZU5hbWVzWzBdIDogc3RvcmVOYW1lcztcbiAgICB9XG5cbiAgICAvLyBFeHBvcnQgb3VyIFByb21pc2UgaW1wbGVtZW50YXRpb24gc2luY2UgaXQgY2FuIGJlIGhhbmR5IGFzIGEgc3RhbmRhbG9uZSBQcm9taXNlIGltcGxlbWVudGF0aW9uXG4gICAgRGV4aWUuUHJvbWlzZSA9IFByb21pc2U7XG4gICAgLy8gRXhwb3J0IG91ciBkZXJpdmUvZXh0ZW5kL292ZXJyaWRlIG1ldGhvZG9sb2d5XG4gICAgRGV4aWUuZGVyaXZlID0gZGVyaXZlO1xuICAgIERleGllLmV4dGVuZCA9IGV4dGVuZDtcbiAgICBEZXhpZS5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICAgIC8vIEV4cG9ydCBvdXIgZXZlbnRzKCkgZnVuY3Rpb24gLSBjYW4gYmUgaGFuZHkgYXMgYSB0b29sa2l0XG4gICAgRGV4aWUuZXZlbnRzID0gZXZlbnRzO1xuICAgIERleGllLmdldEJ5S2V5UGF0aCA9IGdldEJ5S2V5UGF0aDtcbiAgICBEZXhpZS5zZXRCeUtleVBhdGggPSBzZXRCeUtleVBhdGg7XG4gICAgRGV4aWUuZGVsQnlLZXlQYXRoID0gZGVsQnlLZXlQYXRoO1xuICAgIERleGllLnNoYWxsb3dDbG9uZSA9IHNoYWxsb3dDbG9uZTtcbiAgICBEZXhpZS5kZWVwQ2xvbmUgPSBkZWVwQ2xvbmU7XG4gICAgRGV4aWUuYWRkb25zID0gW107XG4gICAgRGV4aWUuZmFrZUF1dG9Db21wbGV0ZSA9IGZha2VBdXRvQ29tcGxldGU7XG4gICAgRGV4aWUuYXNhcCA9IGFzYXA7XG4gICAgLy8gRXhwb3J0IG91ciBzdGF0aWMgY2xhc3Nlc1xuICAgIERleGllLk1vZGlmeUVycm9yID0gTW9kaWZ5RXJyb3I7XG4gICAgRGV4aWUuTXVsdGlNb2RpZnlFcnJvciA9IE1vZGlmeUVycm9yOyAvLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5IHByZSAwLjkuOFxuICAgIERleGllLkluZGV4U3BlYyA9IEluZGV4U3BlYztcbiAgICBEZXhpZS5UYWJsZVNjaGVtYSA9IFRhYmxlU2NoZW1hO1xuICAgIC8vXG4gICAgLy8gRGVwZW5kZW5jaWVzXG4gICAgLy9cbiAgICAvLyBUaGVzZSB3aWxsIGF1dG9tYXRpY2FsbHkgd29yayBpbiBicm93c2VycyB3aXRoIGluZGV4ZWREQiBzdXBwb3J0LCBvciB3aGVyZSBhbiBpbmRleGVkREIgcG9seWZpbGwgaGFzIGJlZW4gaW5jbHVkZWQuXG4gICAgLy9cbiAgICAvLyBJbiBub2RlLmpzLCBob3dldmVyLCB0aGVzZSBwcm9wZXJ0aWVzIG11c3QgYmUgc2V0IFwibWFudWFsbHlcIiBiZWZvcmUgaW5zdGFuc2lhdGluZyBhIG5ldyBEZXhpZSgpLiBGb3Igbm9kZS5qcywgeW91IG5lZWQgdG8gcmVxdWlyZSBpbmRleGVkZGItanMgb3Igc2ltaWxhciBhbmQgdGhlbiBzZXQgdGhlc2UgZGVwcy5cbiAgICAvL1xuICAgIHZhciBpZGJzaGltID0gZ2xvYmFsLmlkYk1vZHVsZXMgJiYgZ2xvYmFsLmlkYk1vZHVsZXMuc2hpbUluZGV4ZWREQiA/IGdsb2JhbC5pZGJNb2R1bGVzIDoge307XG4gICAgRGV4aWUuZGVwZW5kZW5jaWVzID0ge1xuICAgICAgICAvLyBSZXF1aXJlZDpcbiAgICAgICAgLy8gTk9URTogVGhlIFwiX1wiLXByZWZpeGVkIHZlcnNpb25zIGFyZSBmb3IgcHJpb3JpdGl6aW5nIElEQi1zaGltIG9uIElPUzggYmVmb3JlIHRoZSBuYXRpdmUgSURCIGluIGNhc2UgdGhlIHNoaW0gd2FzIGluY2x1ZGVkLlxuICAgICAgICBpbmRleGVkREI6IGlkYnNoaW0uc2hpbUluZGV4ZWREQiB8fCBnbG9iYWwuaW5kZXhlZERCIHx8IGdsb2JhbC5tb3pJbmRleGVkREIgfHwgZ2xvYmFsLndlYmtpdEluZGV4ZWREQiB8fCBnbG9iYWwubXNJbmRleGVkREIsXG4gICAgICAgIElEQktleVJhbmdlOiBpZGJzaGltLklEQktleVJhbmdlIHx8IGdsb2JhbC5JREJLZXlSYW5nZSB8fCBnbG9iYWwud2Via2l0SURCS2V5UmFuZ2UsXG4gICAgICAgIElEQlRyYW5zYWN0aW9uOiBpZGJzaGltLklEQlRyYW5zYWN0aW9uIHx8IGdsb2JhbC5JREJUcmFuc2FjdGlvbiB8fCBnbG9iYWwud2Via2l0SURCVHJhbnNhY3Rpb24sXG4gICAgICAgIC8vIE9wdGlvbmFsOlxuICAgICAgICBFcnJvcjogZ2xvYmFsLkVycm9yIHx8IFN0cmluZyxcbiAgICAgICAgU3ludGF4RXJyb3I6IGdsb2JhbC5TeW50YXhFcnJvciB8fCBTdHJpbmcsXG4gICAgICAgIFR5cGVFcnJvcjogZ2xvYmFsLlR5cGVFcnJvciB8fCBTdHJpbmcsXG4gICAgICAgIERPTUVycm9yOiBnbG9iYWwuRE9NRXJyb3IgfHwgU3RyaW5nLFxuICAgICAgICBsb2NhbFN0b3JhZ2U6ICgodHlwZW9mIGNocm9tZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjaHJvbWUgIT09IG51bGwgPyBjaHJvbWUuc3RvcmFnZSA6IHZvaWQgMCkgIT0gbnVsbCA/IG51bGwgOiBnbG9iYWwubG9jYWxTdG9yYWdlKVxuICAgIH07IFxuXG4gICAgLy8gQVBJIFZlcnNpb24gTnVtYmVyOiBUeXBlIE51bWJlciwgbWFrZSBzdXJlIHRvIGFsd2F5cyBzZXQgYSB2ZXJzaW9uIG51bWJlciB0aGF0IGNhbiBiZSBjb21wYXJhYmxlIGNvcnJlY3RseS4gRXhhbXBsZTogMC45LCAwLjkxLCAwLjkyLCAxLjAsIDEuMDEsIDEuMSwgMS4yLCAxLjIxLCBldGMuXG4gICAgRGV4aWUudmVyc2lvbiA9IDEuMjA7XG5cbiAgICBmdW5jdGlvbiBnZXROYXRpdmVHZXREYXRhYmFzZU5hbWVzRm4oKSB7XG4gICAgICAgIHZhciBpbmRleGVkREIgPSBEZXhpZS5kZXBlbmRlbmNpZXMuaW5kZXhlZERCO1xuICAgICAgICB2YXIgZm4gPSBpbmRleGVkREIgJiYgKGluZGV4ZWREQi5nZXREYXRhYmFzZU5hbWVzIHx8IGluZGV4ZWREQi53ZWJraXRHZXREYXRhYmFzZU5hbWVzKTtcbiAgICAgICAgcmV0dXJuIGZuICYmIGZuLmJpbmQoaW5kZXhlZERCKTtcbiAgICB9XG5cbiAgICAvLyBFeHBvcnQgRGV4aWUgdG8gd2luZG93IG9yIGFzIGEgbW9kdWxlIGRlcGVuZGluZyBvbiBlbnZpcm9ubWVudC5cbiAgICBwdWJsaXNoKFwiRGV4aWVcIiwgRGV4aWUpO1xuXG4gICAgLy8gRm9vbCBJREUgdG8gaW1wcm92ZSBhdXRvY29tcGxldGUuIFRlc3RlZCB3aXRoIFZpc3VhbCBTdHVkaW8gMjAxMyBhbmQgMjAxNS5cbiAgICBkb0Zha2VBdXRvQ29tcGxldGUoZnVuY3Rpb24oKSB7XG4gICAgICAgIERleGllLmZha2VBdXRvQ29tcGxldGUgPSBmYWtlQXV0b0NvbXBsZXRlID0gZG9GYWtlQXV0b0NvbXBsZXRlO1xuICAgICAgICBEZXhpZS5mYWtlID0gZmFrZSA9IHRydWU7XG4gICAgfSk7XG59KS5hcHBseShudWxsLFxuXG4gICAgLy8gQU1EOlxuICAgIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/XG4gICAgW3NlbGYgfHwgd2luZG93LCBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHsgZGVmaW5lKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbHVlOyB9KTsgfV0gOlxuXG4gICAgLy8gQ29tbW9uSlM6XG4gICAgdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMgP1xuICAgIFtnbG9iYWwsIGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkgeyBtb2R1bGUuZXhwb3J0cyA9IHZhbHVlOyB9XVxuXG4gICAgLy8gVmFuaWxsYSBIVE1MIGFuZCBXZWJXb3JrZXJzOlxuICAgIDogW3NlbGYgfHwgd2luZG93LCBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHsgKHNlbGYgfHwgd2luZG93KVtuYW1lXSA9IHZhbHVlOyB9XSk7XG5cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2RleGllL2Rpc3QvbGF0ZXN0L0RleGllLmpzXG4gKiogbW9kdWxlIGlkID0gM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIG5leHRUaWNrID0gcmVxdWlyZSgncHJvY2Vzcy9icm93c2VyLmpzJykubmV4dFRpY2s7XG52YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaW1tZWRpYXRlSWRzID0ge307XG52YXIgbmV4dEltbWVkaWF0ZUlkID0gMDtcblxuLy8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcbn07XG5leHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xufTtcbmV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cbmV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHsgdGltZW91dC5jbG9zZSgpOyB9O1xuXG5mdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG4gIHRoaXMuX2lkID0gaWQ7XG4gIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xufVxuVGltZW91dC5wcm90b3R5cGUudW5yZWYgPSBUaW1lb3V0LnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHt9O1xuVGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xufTtcblxuLy8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5leHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcbn07XG5cbmV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcbn07XG5cbmV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcbiAgaWYgKG1zZWNzID49IDApIHtcbiAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG4gICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcbiAgICB9LCBtc2Vjcyk7XG4gIH1cbn07XG5cbi8vIFRoYXQncyBub3QgaG93IG5vZGUuanMgaW1wbGVtZW50cyBpdCBidXQgdGhlIGV4cG9zZWQgYXBpIGlzIHRoZSBzYW1lLlxuZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBmdW5jdGlvbihmbikge1xuICB2YXIgaWQgPSBuZXh0SW1tZWRpYXRlSWQrKztcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGZhbHNlIDogc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIGltbWVkaWF0ZUlkc1tpZF0gPSB0cnVlO1xuXG4gIG5leHRUaWNrKGZ1bmN0aW9uIG9uTmV4dFRpY2soKSB7XG4gICAgaWYgKGltbWVkaWF0ZUlkc1tpZF0pIHtcbiAgICAgIC8vIGZuLmNhbGwoKSBpcyBmYXN0ZXIgc28gd2Ugb3B0aW1pemUgZm9yIHRoZSBjb21tb24gdXNlLWNhc2VcbiAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vY2FsbC1hcHBseS1zZWd1XG4gICAgICBpZiAoYXJncykge1xuICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuLmNhbGwobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyBQcmV2ZW50IGlkcyBmcm9tIGxlYWtpbmdcbiAgICAgIGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUoaWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGlkO1xufTtcblxuZXhwb3J0cy5jbGVhckltbWVkaWF0ZSA9IHR5cGVvZiBjbGVhckltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gY2xlYXJJbW1lZGlhdGUgOiBmdW5jdGlvbihpZCkge1xuICBkZWxldGUgaW1tZWRpYXRlSWRzW2lkXTtcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAod2VicGFjaykvfi9ub2RlLWxpYnMtYnJvd3Nlci9+L3RpbWVycy1icm93c2VyaWZ5L21haW4uanNcbiAqKiBtb2R1bGUgaWQgPSA0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogKHdlYnBhY2spL34vbm9kZS1saWJzLWJyb3dzZXIvfi9wcm9jZXNzL2Jyb3dzZXIuanNcbiAqKiBtb2R1bGUgaWQgPSA1XG4gKiogbW9kdWxlIGNodW5rcyA9IDAgMSAyXG4gKiovIiwiaW1wb3J0IHBpY2sgZnJvbSAnbG9kYXNoLnBpY2snXG5pbXBvcnQgb21pdCBmcm9tICdsb2Rhc2gub21pdCdcbmV4cG9ydCBkZWZhdWx0IHtcbiAgcGljazogcGljayxcbiAgb21pdDogb21pdCxcbiAgdXVpZDogKCkgPT4ge1xuICAgIHZhciB1dWlkID0gXCJcIiwgaSwgcmFuZG9tO1xuICAgIGZvciAoaSA9IDA7IGkgPCAzMjsgaSsrKSB7XG4gICAgICByYW5kb20gPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwO1xuXG4gICAgICBpZiAoaSA9PSA4IHx8IGkgPT0gMTIgfHwgaSA9PSAxNiB8fCBpID09IDIwKSB7XG4gICAgICAgIHV1aWQgKz0gXCItXCJcbiAgICAgIH1cbiAgICAgIHV1aWQgKz0gKGkgPT0gMTIgPyA0IDogKGkgPT0gMTYgPyAocmFuZG9tICYgMyB8IDgpIDogcmFuZG9tKSkudG9TdHJpbmcoMTYpO1xuICAgIH1cbiAgICByZXR1cm4gdXVpZDtcbiAgfVxufVxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3V0aWwuanNcbiAqKi8iLCIvKipcbiAqIGxvZGFzaCA0LjAuMCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUZsYXR0ZW4gPSByZXF1aXJlKCdsb2Rhc2guX2Jhc2VmbGF0dGVuJyksXG4gICAgcmVzdCA9IHJlcXVpcmUoJ2xvZGFzaC5yZXN0Jyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLnJlZHVjZWAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yXG4gKiBpdGVyYXRlZSBzaG9ydGhhbmRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW2FjY3VtdWxhdG9yXSBUaGUgaW5pdGlhbCB2YWx1ZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2luaXRGcm9tQXJyYXldIFNwZWNpZnkgdXNpbmcgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYGFycmF5YCBhcyB0aGUgaW5pdGlhbCB2YWx1ZS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gYXJyYXlSZWR1Y2UoYXJyYXksIGl0ZXJhdGVlLCBhY2N1bXVsYXRvciwgaW5pdEZyb21BcnJheSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICBpZiAoaW5pdEZyb21BcnJheSAmJiBsZW5ndGgpIHtcbiAgICBhY2N1bXVsYXRvciA9IGFycmF5WysraW5kZXhdO1xuICB9XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgYWNjdW11bGF0b3IgPSBpdGVyYXRlZShhY2N1bXVsYXRvciwgYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpO1xuICB9XG4gIHJldHVybiBhY2N1bXVsYXRvcjtcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5waWNrYCB3aXRob3V0IHN1cHBvcnQgZm9yIGluZGl2aWR1YWxcbiAqIHByb3BlcnR5IG5hbWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHtzdHJpbmdbXX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIHBpY2suXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBiYXNlUGljayhvYmplY3QsIHByb3BzKSB7XG4gIG9iamVjdCA9IE9iamVjdChvYmplY3QpO1xuICByZXR1cm4gYXJyYXlSZWR1Y2UocHJvcHMsIGZ1bmN0aW9uKHJlc3VsdCwga2V5KSB7XG4gICAgaWYgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgIHJlc3VsdFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sIHt9KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIG9iamVjdCBjb21wb3NlZCBvZiB0aGUgcGlja2VkIGBvYmplY3RgIHByb3BlcnRpZXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIHNvdXJjZSBvYmplY3QuXG4gKiBAcGFyYW0gey4uLihzdHJpbmd8c3RyaW5nW10pfSBbcHJvcHNdIFRoZSBwcm9wZXJ0eSBuYW1lcyB0byBwaWNrLCBzcGVjaWZpZWRcbiAqICBpbmRpdmlkdWFsbHkgb3IgaW4gYXJyYXlzLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbmV3IG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ2EnOiAxLCAnYic6ICcyJywgJ2MnOiAzIH07XG4gKlxuICogXy5waWNrKG9iamVjdCwgWydhJywgJ2MnXSk7XG4gKiAvLyA9PiB7ICdhJzogMSwgJ2MnOiAzIH1cbiAqL1xudmFyIHBpY2sgPSByZXN0KGZ1bmN0aW9uKG9iamVjdCwgcHJvcHMpIHtcbiAgcmV0dXJuIG9iamVjdCA9PSBudWxsID8ge30gOiBiYXNlUGljayhvYmplY3QsIGJhc2VGbGF0dGVuKHByb3BzKSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBwaWNrO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLnBpY2svaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSA3XG4gKiogbW9kdWxlIGNodW5rcyA9IDAgMSAyXG4gKiovIiwiLyoqXG4gKiBsb2Rhc2ggNC4wLjAgKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTYgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxNiBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBNQVhfU0FGRV9JTlRFR0VSID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFyZ3NUYWcgPSAnW29iamVjdCBBcmd1bWVudHNdJyxcbiAgICBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nO1xuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGVsZW1lbnRzIG9mIGB2YWx1ZXNgIHRvIGBhcnJheWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBtb2RpZnkuXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZXMgVGhlIHZhbHVlcyB0byBhcHBlbmQuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYGFycmF5YC5cbiAqL1xuZnVuY3Rpb24gYXJyYXlQdXNoKGFycmF5LCB2YWx1ZXMpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSB2YWx1ZXMubGVuZ3RoLFxuICAgICAgb2Zmc2V0ID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgYXJyYXlbb2Zmc2V0ICsgaW5kZXhdID0gdmFsdWVzW2luZGV4XTtcbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IGdsb2JhbC5PYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBwcm9wZXJ0eUlzRW51bWVyYWJsZSA9IG9iamVjdFByb3RvLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZsYXR0ZW5gIHdpdGggc3VwcG9ydCBmb3IgcmVzdHJpY3RpbmcgZmxhdHRlbmluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGZsYXR0ZW4uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0RlZXBdIFNwZWNpZnkgYSBkZWVwIGZsYXR0ZW4uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1N0cmljdF0gUmVzdHJpY3QgZmxhdHRlbmluZyB0byBhcnJheXMtbGlrZSBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3Jlc3VsdD1bXV0gVGhlIGluaXRpYWwgcmVzdWx0IHZhbHVlLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgZmxhdHRlbmVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBiYXNlRmxhdHRlbihhcnJheSwgaXNEZWVwLCBpc1N0cmljdCwgcmVzdWx0KSB7XG4gIHJlc3VsdCB8fCAocmVzdWx0ID0gW10pO1xuXG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuICAgIGlmIChpc0FycmF5TGlrZU9iamVjdCh2YWx1ZSkgJiZcbiAgICAgICAgKGlzU3RyaWN0IHx8IGlzQXJyYXkodmFsdWUpIHx8IGlzQXJndW1lbnRzKHZhbHVlKSkpIHtcbiAgICAgIGlmIChpc0RlZXApIHtcbiAgICAgICAgLy8gUmVjdXJzaXZlbHkgZmxhdHRlbiBhcnJheXMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKS5cbiAgICAgICAgYmFzZUZsYXR0ZW4odmFsdWUsIGlzRGVlcCwgaXNTdHJpY3QsIHJlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcnJheVB1c2gocmVzdWx0LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghaXNTdHJpY3QpIHtcbiAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnByb3BlcnR5YCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZXAgcGF0aHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VQcm9wZXJ0eShrZXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICB9O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIFwibGVuZ3RoXCIgcHJvcGVydHkgdmFsdWUgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBhdm9pZCBhIFtKSVQgYnVnXShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTQyNzkyKVxuICogdGhhdCBhZmZlY3RzIFNhZmFyaSBvbiBhdCBsZWFzdCBpT1MgOC4xLTguMyBBUk02NC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIFwibGVuZ3RoXCIgdmFsdWUuXG4gKi9cbnZhciBnZXRMZW5ndGggPSBiYXNlUHJvcGVydHkoJ2xlbmd0aCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGxpa2VseSBhbiBgYXJndW1lbnRzYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcmd1bWVudHMoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhbMSwgMiwgM10pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcbiAgLy8gU2FmYXJpIDguMSBpbmNvcnJlY3RseSBtYWtlcyBgYXJndW1lbnRzLmNhbGxlZWAgZW51bWVyYWJsZSBpbiBzdHJpY3QgbW9kZS5cbiAgcmV0dXJuIGlzQXJyYXlMaWtlT2JqZWN0KHZhbHVlKSAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY2FsbGVlJykgJiZcbiAgICAoIXByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwodmFsdWUsICdjYWxsZWUnKSB8fCBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBhcmdzVGFnKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBBcnJheWAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5KGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXkoJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXkoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLiBBIHZhbHVlIGlzIGNvbnNpZGVyZWQgYXJyYXktbGlrZSBpZiBpdCdzXG4gKiBub3QgYSBmdW5jdGlvbiBhbmQgaGFzIGEgYHZhbHVlLmxlbmd0aGAgdGhhdCdzIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIG9yXG4gKiBlcXVhbCB0byBgMGAgYW5kIGxlc3MgdGhhbiBvciBlcXVhbCB0byBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKCdhYmMnKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FycmF5TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJlxuICAgICEodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicgJiYgaXNGdW5jdGlvbih2YWx1ZSkpICYmIGlzTGVuZ3RoKGdldExlbmd0aCh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8uaXNBcnJheUxpa2VgIGV4Y2VwdCB0aGF0IGl0IGFsc28gY2hlY2tzIGlmIGB2YWx1ZWBcbiAqIGlzIGFuIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHR5cGUgRnVuY3Rpb25cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIGFycmF5LWxpa2Ugb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheUxpa2VPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlT2JqZWN0KGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2VPYmplY3QoJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXlMaWtlT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FycmF5TGlrZU9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0FycmF5TGlrZSh2YWx1ZSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oXyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Z1bmN0aW9uKC9hYmMvKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgLy8gVGhlIHVzZSBvZiBgT2JqZWN0I3RvU3RyaW5nYCBhdm9pZHMgaXNzdWVzIHdpdGggdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gIC8vIGluIFNhZmFyaSA4IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9ycywgYW5kXG4gIC8vIFBoYW50b21KUyAxLjkgd2hpY2ggcmV0dXJucyAnZnVuY3Rpb24nIGZvciBgTm9kZUxpc3RgIGluc3RhbmNlcy5cbiAgdmFyIHRhZyA9IGlzT2JqZWN0KHZhbHVlKSA/IG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIHJldHVybiB0YWcgPT0gZnVuY1RhZyB8fCB0YWcgPT0gZ2VuVGFnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBsZW5ndGguXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgbG9vc2VseSBiYXNlZCBvbiBbYFRvTGVuZ3RoYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9sZW5ndGgpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGxlbmd0aCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTGVuZ3RoKDMpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNMZW5ndGgoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoSW5maW5pdHkpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzTGVuZ3RoKCczJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0xlbmd0aCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPD0gTUFYX1NBRkVfSU5URUdFUjtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgW2xhbmd1YWdlIHR5cGVdKGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDgpIG9mIGBPYmplY3RgLlxuICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxuICAvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTEgZm9yIG1vcmUgZGV0YWlscy5cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRmxhdHRlbjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5waWNrL34vbG9kYXNoLl9iYXNlZmxhdHRlbi9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMCAxIDJcbiAqKi8iLCIvKipcbiAqIGxvZGFzaCA0LjAuMCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBJTkZJTklUWSA9IDEgLyAwLFxuICAgIE1BWF9JTlRFR0VSID0gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDgsXG4gICAgTkFOID0gMCAvIDA7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nO1xuXG4vKiogVXNlZCB0byBtYXRjaCBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlLiAqL1xudmFyIHJlVHJpbSA9IC9eXFxzK3xcXHMrJC9nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmFkIHNpZ25lZCBoZXhhZGVjaW1hbCBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNCYWRIZXggPSAvXlstK10weFswLTlhLWZdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGJpbmFyeSBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNCaW5hcnkgPSAvXjBiWzAxXSskL2k7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBvY3RhbCBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNPY3RhbCA9IC9eMG9bMC03XSskL2k7XG5cbi8qKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyB3aXRob3V0IGEgZGVwZW5kZW5jeSBvbiBgZ2xvYmFsYC4gKi9cbnZhciBmcmVlUGFyc2VJbnQgPSBwYXJzZUludDtcblxuLyoqXG4gKiBBIGZhc3RlciBhbHRlcm5hdGl2ZSB0byBgRnVuY3Rpb24jYXBwbHlgLCB0aGlzIGZ1bmN0aW9uIGludm9rZXMgYGZ1bmNgXG4gKiB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiBgdGhpc0FyZ2AgYW5kIHRoZSBhcmd1bWVudHMgb2YgYGFyZ3NgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBpbnZva2UuXG4gKiBAcGFyYW0geyp9IHRoaXNBcmcgVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAqIEBwYXJhbSB7Li4uKn0gW2FyZ3NdIFRoZSBhcmd1bWVudHMgdG8gaW52b2tlIGBmdW5jYCB3aXRoLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHJlc3VsdCBvZiBgZnVuY2AuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5KGZ1bmMsIHRoaXNBcmcsIGFyZ3MpIHtcbiAgdmFyIGxlbmd0aCA9IGFyZ3MgPyBhcmdzLmxlbmd0aCA6IDA7XG4gIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcpO1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCBhcmdzWzBdKTtcbiAgICBjYXNlIDI6IHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYXJnc1swXSwgYXJnc1sxXSk7XG4gICAgY2FzZSAzOiByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0pO1xuICB9XG4gIHJldHVybiBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xufVxuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBnbG9iYWwuT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGludm9rZXMgYGZ1bmNgIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZVxuICogY3JlYXRlZCBmdW5jdGlvbiBhbmQgYXJndW1lbnRzIGZyb20gYHN0YXJ0YCBhbmQgYmV5b25kIHByb3ZpZGVkIGFzIGFuIGFycmF5LlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBiYXNlZCBvbiB0aGUgW3Jlc3QgcGFyYW1ldGVyXShodHRwczovL21kbi5pby9yZXN0X3BhcmFtZXRlcnMpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGFwcGx5IGEgcmVzdCBwYXJhbWV0ZXIgdG8uXG4gKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0PWZ1bmMubGVuZ3RoLTFdIFRoZSBzdGFydCBwb3NpdGlvbiBvZiB0aGUgcmVzdCBwYXJhbWV0ZXIuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIHNheSA9IF8ucmVzdChmdW5jdGlvbih3aGF0LCBuYW1lcykge1xuICogICByZXR1cm4gd2hhdCArICcgJyArIF8uaW5pdGlhbChuYW1lcykuam9pbignLCAnKSArXG4gKiAgICAgKF8uc2l6ZShuYW1lcykgPiAxID8gJywgJiAnIDogJycpICsgXy5sYXN0KG5hbWVzKTtcbiAqIH0pO1xuICpcbiAqIHNheSgnaGVsbG8nLCAnZnJlZCcsICdiYXJuZXknLCAncGViYmxlcycpO1xuICogLy8gPT4gJ2hlbGxvIGZyZWQsIGJhcm5leSwgJiBwZWJibGVzJ1xuICovXG5mdW5jdGlvbiByZXN0KGZ1bmMsIHN0YXJ0KSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHN0YXJ0ID0gbmF0aXZlTWF4KHN0YXJ0ID09PSB1bmRlZmluZWQgPyAoZnVuYy5sZW5ndGggLSAxKSA6IHRvSW50ZWdlcihzdGFydCksIDApO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IG5hdGl2ZU1heChhcmdzLmxlbmd0aCAtIHN0YXJ0LCAwKSxcbiAgICAgICAgYXJyYXkgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGFycmF5W2luZGV4XSA9IGFyZ3Nbc3RhcnQgKyBpbmRleF07XG4gICAgfVxuICAgIHN3aXRjaCAoc3RhcnQpIHtcbiAgICAgIGNhc2UgMDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBhcnJheSk7XG4gICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJnc1swXSwgYXJyYXkpO1xuICAgICAgY2FzZSAyOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFyZ3NbMF0sIGFyZ3NbMV0sIGFycmF5KTtcbiAgICB9XG4gICAgdmFyIG90aGVyQXJncyA9IEFycmF5KHN0YXJ0ICsgMSk7XG4gICAgaW5kZXggPSAtMTtcbiAgICB3aGlsZSAoKytpbmRleCA8IHN0YXJ0KSB7XG4gICAgICBvdGhlckFyZ3NbaW5kZXhdID0gYXJnc1tpbmRleF07XG4gICAgfVxuICAgIG90aGVyQXJnc1tzdGFydF0gPSBhcnJheTtcbiAgICByZXR1cm4gYXBwbHkoZnVuYywgdGhpcywgb3RoZXJBcmdzKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDggd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JzLCBhbmRcbiAgLy8gUGhhbnRvbUpTIDEuOSB3aGljaCByZXR1cm5zICdmdW5jdGlvbicgZm9yIGBOb2RlTGlzdGAgaW5zdGFuY2VzLlxuICB2YXIgdGFnID0gaXNPYmplY3QodmFsdWUpID8gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlIFtsYW5ndWFnZSB0eXBlXShodHRwczovL2VzNS5naXRodWIuaW8vI3g4KSBvZiBgT2JqZWN0YC5cbiAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgLy8gQXZvaWQgYSBWOCBKSVQgYnVnIGluIENocm9tZSAxOS0yMC5cbiAgLy8gU2VlIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxIGZvciBtb3JlIGRldGFpbHMuXG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gISF2YWx1ZSAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYW4gaW50ZWdlci5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyBsb29zZWx5IGJhc2VkIG9uIFtgVG9JbnRlZ2VyYF0oaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLXRvaW50ZWdlcikuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgY29udmVydGVkIGludGVnZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9JbnRlZ2VyKDMpO1xuICogLy8gPT4gM1xuICpcbiAqIF8udG9JbnRlZ2VyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gMFxuICpcbiAqIF8udG9JbnRlZ2VyKEluZmluaXR5KTtcbiAqIC8vID0+IDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4XG4gKlxuICogXy50b0ludGVnZXIoJzMnKTtcbiAqIC8vID0+IDNcbiAqL1xuZnVuY3Rpb24gdG9JbnRlZ2VyKHZhbHVlKSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6IDA7XG4gIH1cbiAgdmFsdWUgPSB0b051bWJlcih2YWx1ZSk7XG4gIGlmICh2YWx1ZSA9PT0gSU5GSU5JVFkgfHwgdmFsdWUgPT09IC1JTkZJTklUWSkge1xuICAgIHZhciBzaWduID0gKHZhbHVlIDwgMCA/IC0xIDogMSk7XG4gICAgcmV0dXJuIHNpZ24gKiBNQVhfSU5URUdFUjtcbiAgfVxuICB2YXIgcmVtYWluZGVyID0gdmFsdWUgJSAxO1xuICByZXR1cm4gdmFsdWUgPT09IHZhbHVlID8gKHJlbWFpbmRlciA/IHZhbHVlIC0gcmVtYWluZGVyIDogdmFsdWUpIDogMDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIG51bWJlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b051bWJlcigzKTtcbiAqIC8vID0+IDNcbiAqXG4gKiBfLnRvTnVtYmVyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gNWUtMzI0XG4gKlxuICogXy50b051bWJlcihJbmZpbml0eSk7XG4gKiAvLyA9PiBJbmZpbml0eVxuICpcbiAqIF8udG9OdW1iZXIoJzMnKTtcbiAqIC8vID0+IDNcbiAqL1xuZnVuY3Rpb24gdG9OdW1iZXIodmFsdWUpIHtcbiAgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHZhciBvdGhlciA9IGlzRnVuY3Rpb24odmFsdWUudmFsdWVPZikgPyB2YWx1ZS52YWx1ZU9mKCkgOiB2YWx1ZTtcbiAgICB2YWx1ZSA9IGlzT2JqZWN0KG90aGVyKSA/IChvdGhlciArICcnKSA6IG90aGVyO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6ICt2YWx1ZTtcbiAgfVxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UocmVUcmltLCAnJyk7XG4gIHZhciBpc0JpbmFyeSA9IHJlSXNCaW5hcnkudGVzdCh2YWx1ZSk7XG4gIHJldHVybiAoaXNCaW5hcnkgfHwgcmVJc09jdGFsLnRlc3QodmFsdWUpKVxuICAgID8gZnJlZVBhcnNlSW50KHZhbHVlLnNsaWNlKDIpLCBpc0JpbmFyeSA/IDIgOiA4KVxuICAgIDogKHJlSXNCYWRIZXgudGVzdCh2YWx1ZSkgPyBOQU4gOiArdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlc3Q7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9sb2Rhc2gucGljay9+L2xvZGFzaC5yZXN0L2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gOVxuICoqIG1vZHVsZSBjaHVua3MgPSAwIDEgMlxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBTZXRDYWNoZSA9IHJlcXVpcmUoJ2xvZGFzaC5fc2V0Y2FjaGUnKSxcbiAgICBhcnJheUluY2x1ZGVzID0gcmVxdWlyZSgnbG9kYXNoLl9hcnJheWluY2x1ZGVzJyksXG4gICAgYXJyYXlJbmNsdWRlc1dpdGggPSByZXF1aXJlKCdsb2Rhc2guX2FycmF5aW5jbHVkZXN3aXRoJyksXG4gICAgYXJyYXlNYXAgPSByZXF1aXJlKCdsb2Rhc2guX2FycmF5bWFwJyksXG4gICAgYmFzZUZsYXR0ZW4gPSByZXF1aXJlKCdsb2Rhc2guX2Jhc2VmbGF0dGVuJyksXG4gICAgY2FjaGVIYXMgPSByZXF1aXJlKCdsb2Rhc2guX2NhY2hlaGFzJyksXG4gICAga2V5c0luID0gcmVxdWlyZSgnbG9kYXNoLmtleXNpbicpLFxuICAgIHJlc3QgPSByZXF1aXJlKCdsb2Rhc2gucmVzdCcpO1xuXG4vKiogVXNlZCBhcyB0aGUgc2l6ZSB0byBlbmFibGUgbGFyZ2UgYXJyYXkgb3B0aW1pemF0aW9ucy4gKi9cbnZhciBMQVJHRV9BUlJBWV9TSVpFID0gMjAwO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5yZWR1Y2VgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvclxuICogaXRlcmF0ZWUgc2hvcnRoYW5kcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0geyp9IFthY2N1bXVsYXRvcl0gVGhlIGluaXRpYWwgdmFsdWUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpbml0RnJvbUFycmF5XSBTcGVjaWZ5IHVzaW5nIHRoZSBmaXJzdCBlbGVtZW50IG9mIGBhcnJheWAgYXMgdGhlIGluaXRpYWwgdmFsdWUuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgYWNjdW11bGF0ZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGFycmF5UmVkdWNlKGFycmF5LCBpdGVyYXRlZSwgYWNjdW11bGF0b3IsIGluaXRGcm9tQXJyYXkpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgaWYgKGluaXRGcm9tQXJyYXkgJiYgbGVuZ3RoKSB7XG4gICAgYWNjdW11bGF0b3IgPSBhcnJheVsrK2luZGV4XTtcbiAgfVxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGFjY3VtdWxhdG9yID0gaXRlcmF0ZWUoYWNjdW11bGF0b3IsIGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KTtcbiAgfVxuICByZXR1cm4gYWNjdW11bGF0b3I7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udW5hcnlgIHdpdGhvdXQgc3VwcG9ydCBmb3Igc3RvcmluZyB3cmFwcGVyIG1ldGFkYXRhLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjYXAgYXJndW1lbnRzIGZvci5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlVW5hcnkoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gZnVuYyh2YWx1ZSk7XG4gIH07XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgbWV0aG9kcyBsaWtlIGBfLmRpZmZlcmVuY2VgIHdpdGhvdXQgc3VwcG9ydCBmb3JcbiAqIGV4Y2x1ZGluZyBtdWx0aXBsZSBhcnJheXMgb3IgaXRlcmF0ZWUgc2hvcnRoYW5kcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGluc3BlY3QuXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZXMgVGhlIHZhbHVlcyB0byBleGNsdWRlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2l0ZXJhdGVlXSBUaGUgaXRlcmF0ZWUgaW52b2tlZCBwZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjb21wYXJhdG9yXSBUaGUgY29tcGFyYXRvciBpbnZva2VkIHBlciBlbGVtZW50LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgYXJyYXkgb2YgZmlsdGVyZWQgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBiYXNlRGlmZmVyZW5jZShhcnJheSwgdmFsdWVzLCBpdGVyYXRlZSwgY29tcGFyYXRvcikge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGluY2x1ZGVzID0gYXJyYXlJbmNsdWRlcyxcbiAgICAgIGlzQ29tbW9uID0gdHJ1ZSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgIHJlc3VsdCA9IFtdLFxuICAgICAgdmFsdWVzTGVuZ3RoID0gdmFsdWVzLmxlbmd0aDtcblxuICBpZiAoIWxlbmd0aCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgaWYgKGl0ZXJhdGVlKSB7XG4gICAgdmFsdWVzID0gYXJyYXlNYXAodmFsdWVzLCBiYXNlVW5hcnkoaXRlcmF0ZWUpKTtcbiAgfVxuICBpZiAoY29tcGFyYXRvcikge1xuICAgIGluY2x1ZGVzID0gYXJyYXlJbmNsdWRlc1dpdGg7XG4gICAgaXNDb21tb24gPSBmYWxzZTtcbiAgfVxuICBlbHNlIGlmICh2YWx1ZXMubGVuZ3RoID49IExBUkdFX0FSUkFZX1NJWkUpIHtcbiAgICBpbmNsdWRlcyA9IGNhY2hlSGFzO1xuICAgIGlzQ29tbW9uID0gZmFsc2U7XG4gICAgdmFsdWVzID0gbmV3IFNldENhY2hlKHZhbHVlcyk7XG4gIH1cbiAgb3V0ZXI6XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdLFxuICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlID8gaXRlcmF0ZWUodmFsdWUpIDogdmFsdWU7XG5cbiAgICBpZiAoaXNDb21tb24gJiYgY29tcHV0ZWQgPT09IGNvbXB1dGVkKSB7XG4gICAgICB2YXIgdmFsdWVzSW5kZXggPSB2YWx1ZXNMZW5ndGg7XG4gICAgICB3aGlsZSAodmFsdWVzSW5kZXgtLSkge1xuICAgICAgICBpZiAodmFsdWVzW3ZhbHVlc0luZGV4XSA9PT0gY29tcHV0ZWQpIHtcbiAgICAgICAgICBjb250aW51ZSBvdXRlcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIGlmICghaW5jbHVkZXModmFsdWVzLCBjb21wdXRlZCwgY29tcGFyYXRvcikpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5waWNrYCB3aXRob3V0IHN1cHBvcnQgZm9yIGluZGl2aWR1YWxcbiAqIHByb3BlcnR5IG5hbWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHtzdHJpbmdbXX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIHBpY2suXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBiYXNlUGljayhvYmplY3QsIHByb3BzKSB7XG4gIG9iamVjdCA9IE9iamVjdChvYmplY3QpO1xuICByZXR1cm4gYXJyYXlSZWR1Y2UocHJvcHMsIGZ1bmN0aW9uKHJlc3VsdCwga2V5KSB7XG4gICAgaWYgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgIHJlc3VsdFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sIHt9KTtcbn1cblxuLyoqXG4gKiBUaGUgb3Bwb3NpdGUgb2YgYF8ucGlja2A7IHRoaXMgbWV0aG9kIGNyZWF0ZXMgYW4gb2JqZWN0IGNvbXBvc2VkIG9mIHRoZVxuICogb3duIGFuZCBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIGBvYmplY3RgIHRoYXQgYXJlIG5vdCBvbWl0dGVkLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHsuLi4oc3RyaW5nfHN0cmluZ1tdKX0gW3Byb3BzXSBUaGUgcHJvcGVydHkgbmFtZXMgdG8gb21pdCwgc3BlY2lmaWVkXG4gKiAgaW5kaXZpZHVhbGx5IG9yIGluIGFycmF5cy4uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IDEsICdiJzogJzInLCAnYyc6IDMgfTtcbiAqXG4gKiBfLm9taXQob2JqZWN0LCBbJ2EnLCAnYyddKTtcbiAqIC8vID0+IHsgJ2InOiAnMicgfVxuICovXG52YXIgb21pdCA9IHJlc3QoZnVuY3Rpb24ob2JqZWN0LCBwcm9wcykge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICByZXR1cm4ge307XG4gIH1cbiAgcHJvcHMgPSBhcnJheU1hcChiYXNlRmxhdHRlbihwcm9wcyksIFN0cmluZyk7XG4gIHJldHVybiBiYXNlUGljayhvYmplY3QsIGJhc2VEaWZmZXJlbmNlKGtleXNJbihvYmplY3QpLCBwcm9wcykpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gb21pdDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5vbWl0L2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMCAxIDJcbiAqKi8iLCIvKipcbiAqIGxvZGFzaCA0LjAuMCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgTWFwQ2FjaGUgPSByZXF1aXJlKCdsb2Rhc2guX21hcGNhY2hlJyk7XG5cbi8qKiBVc2VkIHRvIHN0YW5kLWluIGZvciBgdW5kZWZpbmVkYCBoYXNoIHZhbHVlcy4gKi9cbnZhciBIQVNIX1VOREVGSU5FRCA9ICdfX2xvZGFzaF9oYXNoX3VuZGVmaW5lZF9fJztcblxuLyoqXG4gKlxuICogQ3JlYXRlcyBhIHNldCBjYWNoZSBvYmplY3QgdG8gc3RvcmUgdW5pcXVlIHZhbHVlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gW3ZhbHVlc10gVGhlIHZhbHVlcyB0byBjYWNoZS5cbiAqL1xuZnVuY3Rpb24gU2V0Q2FjaGUodmFsdWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gdmFsdWVzID8gdmFsdWVzLmxlbmd0aCA6IDA7XG5cbiAgdGhpcy5fX2RhdGFfXyA9IG5ldyBNYXBDYWNoZTtcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB0aGlzLnB1c2godmFsdWVzW2luZGV4XSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIGB2YWx1ZWAgdG8gdGhlIHNldCBjYWNoZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgcHVzaFxuICogQG1lbWJlck9mIFNldENhY2hlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjYWNoZS5cbiAqL1xuZnVuY3Rpb24gY2FjaGVQdXNoKHZhbHVlKSB7XG4gIHZhciBtYXAgPSB0aGlzLl9fZGF0YV9fO1xuICBpZiAoaXNLZXlhYmxlKHZhbHVlKSkge1xuICAgIHZhciBkYXRhID0gbWFwLl9fZGF0YV9fLFxuICAgICAgICBoYXNoID0gdHlwZW9mIHZhbHVlID09ICdzdHJpbmcnID8gZGF0YS5zdHJpbmcgOiBkYXRhLmhhc2g7XG5cbiAgICBoYXNoW3ZhbHVlXSA9IEhBU0hfVU5ERUZJTkVEO1xuICB9XG4gIGVsc2Uge1xuICAgIG1hcC5zZXQodmFsdWUsIEhBU0hfVU5ERUZJTkVEKTtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlIGZvciB1c2UgYXMgdW5pcXVlIG9iamVjdCBrZXkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgc3VpdGFibGUsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNLZXlhYmxlKHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gdHlwZSA9PSAnbnVtYmVyJyB8fCB0eXBlID09ICdib29sZWFuJyB8fFxuICAgICh0eXBlID09ICdzdHJpbmcnICYmIHZhbHVlICE9PSAnX19wcm90b19fJykgfHwgdmFsdWUgPT0gbnVsbDtcbn1cblxuLy8gQWRkIGZ1bmN0aW9ucyB0byB0aGUgYFNldENhY2hlYC5cblNldENhY2hlLnByb3RvdHlwZS5wdXNoID0gY2FjaGVQdXNoO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldENhY2hlO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLm9taXQvfi9sb2Rhc2guX3NldGNhY2hlL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMCAxIDJcbiAqKi8iLCIvKipcbiAqIGxvZGFzaCA0LjAuMCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIHRvIHN0YW5kLWluIGZvciBgdW5kZWZpbmVkYCBoYXNoIHZhbHVlcy4gKi9cbnZhciBIQVNIX1VOREVGSU5FRCA9ICdfX2xvZGFzaF9oYXNoX3VuZGVmaW5lZF9fJztcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXSc7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGBSZWdFeHBgIFtzeW50YXggY2hhcmFjdGVyc10oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtcGF0dGVybnMpLiAqL1xudmFyIHJlUmVnRXhwQ2hhciA9IC9bXFxcXF4kLiorPygpW1xcXXt9fF0vZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGhvc3QgY29uc3RydWN0b3JzIChTYWZhcmkgPiA1KS4gKi9cbnZhciByZUlzSG9zdEN0b3IgPSAvXlxcW29iamVjdCAuKz9Db25zdHJ1Y3RvclxcXSQvO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgaG9zdCBvYmplY3QgaW4gSUUgPCA5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgaG9zdCBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNIb3N0T2JqZWN0KHZhbHVlKSB7XG4gIC8vIE1hbnkgaG9zdCBvYmplY3RzIGFyZSBgT2JqZWN0YCBvYmplY3RzIHRoYXQgY2FuIGNvZXJjZSB0byBzdHJpbmdzXG4gIC8vIGRlc3BpdGUgaGF2aW5nIGltcHJvcGVybHkgZGVmaW5lZCBgdG9TdHJpbmdgIG1ldGhvZHMuXG4gIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgaWYgKHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlLnRvU3RyaW5nICE9ICdmdW5jdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gISEodmFsdWUgKyAnJyk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgYXJyYXlQcm90byA9IGdsb2JhbC5BcnJheS5wcm90b3R5cGUsXG4gICAgb2JqZWN0UHJvdG8gPSBnbG9iYWwuT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgZGVjb21waWxlZCBzb3VyY2Ugb2YgZnVuY3Rpb25zLiAqL1xudmFyIGZ1bmNUb1N0cmluZyA9IGdsb2JhbC5GdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBpZiBhIG1ldGhvZCBpcyBuYXRpdmUuICovXG52YXIgcmVJc05hdGl2ZSA9IFJlZ0V4cCgnXicgK1xuICBmdW5jVG9TdHJpbmcuY2FsbChoYXNPd25Qcm9wZXJ0eSkucmVwbGFjZShyZVJlZ0V4cENoYXIsICdcXFxcJCYnKVxuICAucmVwbGFjZSgvaGFzT3duUHJvcGVydHl8KGZ1bmN0aW9uKS4qPyg/PVxcXFxcXCgpfCBmb3IgLis/KD89XFxcXFxcXSkvZywgJyQxLio/JykgKyAnJCdcbik7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIHNwbGljZSA9IGFycmF5UHJvdG8uc3BsaWNlO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyB0aGF0IGFyZSB2ZXJpZmllZCB0byBiZSBuYXRpdmUuICovXG52YXIgTWFwID0gZ2V0TmF0aXZlKGdsb2JhbCwgJ01hcCcpLFxuICAgIG5hdGl2ZUNyZWF0ZSA9IGdldE5hdGl2ZShPYmplY3QsICdjcmVhdGUnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGhhc2ggb2JqZWN0LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgaGFzaCBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIEhhc2goKSB7fVxuXG4vKipcbiAqIFJlbW92ZXMgYGtleWAgYW5kIGl0cyB2YWx1ZSBmcm9tIHRoZSBoYXNoLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gaGFzaCBUaGUgaGFzaCB0byBtb2RpZnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHJlbW92ZS5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZW50cnkgd2FzIHJlbW92ZWQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaGFzaERlbGV0ZShoYXNoLCBrZXkpIHtcbiAgcmV0dXJuIGhhc2hIYXMoaGFzaCwga2V5KSAmJiBkZWxldGUgaGFzaFtrZXldO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGhhc2ggdmFsdWUgZm9yIGBrZXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gaGFzaCBUaGUgaGFzaCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gZ2V0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGVudHJ5IHZhbHVlLlxuICovXG5mdW5jdGlvbiBoYXNoR2V0KGhhc2gsIGtleSkge1xuICBpZiAobmF0aXZlQ3JlYXRlKSB7XG4gICAgdmFyIHJlc3VsdCA9IGhhc2hba2V5XTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSBIQVNIX1VOREVGSU5FRCA/IHVuZGVmaW5lZCA6IHJlc3VsdDtcbiAgfVxuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChoYXNoLCBrZXkpID8gaGFzaFtrZXldIDogdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBhIGhhc2ggdmFsdWUgZm9yIGBrZXlgIGV4aXN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IGhhc2ggVGhlIGhhc2ggdG8gcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIGVudHJ5IHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGFuIGVudHJ5IGZvciBga2V5YCBleGlzdHMsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaGFzaEhhcyhoYXNoLCBrZXkpIHtcbiAgcmV0dXJuIG5hdGl2ZUNyZWF0ZSA/IGhhc2hba2V5XSAhPT0gdW5kZWZpbmVkIDogaGFzT3duUHJvcGVydHkuY2FsbChoYXNoLCBrZXkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGhhc2ggYGtleWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IGhhc2ggVGhlIGhhc2ggdG8gbW9kaWZ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQuXG4gKi9cbmZ1bmN0aW9uIGhhc2hTZXQoaGFzaCwga2V5LCB2YWx1ZSkge1xuICBoYXNoW2tleV0gPSAobmF0aXZlQ3JlYXRlICYmIHZhbHVlID09PSB1bmRlZmluZWQpID8gSEFTSF9VTkRFRklORUQgOiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWFwIGNhY2hlIG9iamVjdCB0byBzdG9yZSBrZXktdmFsdWUgcGFpcnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IFt2YWx1ZXNdIFRoZSB2YWx1ZXMgdG8gY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIE1hcENhY2hlKHZhbHVlcykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHZhbHVlcyA/IHZhbHVlcy5sZW5ndGggOiAwO1xuXG4gIHRoaXMuY2xlYXIoKTtcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIgZW50cnkgPSB2YWx1ZXNbaW5kZXhdO1xuICAgIHRoaXMuc2V0KGVudHJ5WzBdLCBlbnRyeVsxXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBrZXktdmFsdWUgZW50cmllcyBmcm9tIHRoZSBtYXAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGNsZWFyXG4gKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAqL1xuZnVuY3Rpb24gbWFwQ2xlYXIoKSB7XG4gIHRoaXMuX19kYXRhX18gPSB7ICdoYXNoJzogbmV3IEhhc2gsICdtYXAnOiBNYXAgPyBuZXcgTWFwIDogW10sICdzdHJpbmcnOiBuZXcgSGFzaCB9O1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYGtleWAgYW5kIGl0cyB2YWx1ZSBmcm9tIHRoZSBtYXAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGRlbGV0ZVxuICogQG1lbWJlck9mIE1hcENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHJlbW92ZS5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZW50cnkgd2FzIHJlbW92ZWQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gbWFwRGVsZXRlKGtleSkge1xuICB2YXIgZGF0YSA9IHRoaXMuX19kYXRhX187XG4gIGlmIChpc0tleWFibGUoa2V5KSkge1xuICAgIHJldHVybiBoYXNoRGVsZXRlKHR5cGVvZiBrZXkgPT0gJ3N0cmluZycgPyBkYXRhLnN0cmluZyA6IGRhdGEuaGFzaCwga2V5KTtcbiAgfVxuICByZXR1cm4gTWFwID8gZGF0YS5tYXBbJ2RlbGV0ZSddKGtleSkgOiBhc3NvY0RlbGV0ZShkYXRhLm1hcCwga2V5KTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBtYXAgdmFsdWUgZm9yIGBrZXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBnZXRcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZW50cnkgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIG1hcEdldChrZXkpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICBpZiAoaXNLZXlhYmxlKGtleSkpIHtcbiAgICByZXR1cm4gaGFzaEdldCh0eXBlb2Yga2V5ID09ICdzdHJpbmcnID8gZGF0YS5zdHJpbmcgOiBkYXRhLmhhc2gsIGtleSk7XG4gIH1cbiAgcmV0dXJuIE1hcCA/IGRhdGEubWFwLmdldChrZXkpIDogYXNzb2NHZXQoZGF0YS5tYXAsIGtleSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgbWFwIHZhbHVlIGZvciBga2V5YCBleGlzdHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGhhc1xuICogQG1lbWJlck9mIE1hcENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIGVudHJ5IHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGFuIGVudHJ5IGZvciBga2V5YCBleGlzdHMsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gbWFwSGFzKGtleSkge1xuICB2YXIgZGF0YSA9IHRoaXMuX19kYXRhX187XG4gIGlmIChpc0tleWFibGUoa2V5KSkge1xuICAgIHJldHVybiBoYXNoSGFzKHR5cGVvZiBrZXkgPT0gJ3N0cmluZycgPyBkYXRhLnN0cmluZyA6IGRhdGEuaGFzaCwga2V5KTtcbiAgfVxuICByZXR1cm4gTWFwID8gZGF0YS5tYXAuaGFzKGtleSkgOiBhc3NvY0hhcyhkYXRhLm1hcCwga2V5KTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBtYXAgYGtleWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgc2V0XG4gKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gc2V0LlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbWFwIGNhY2hlIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gbWFwU2V0KGtleSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICBpZiAoaXNLZXlhYmxlKGtleSkpIHtcbiAgICBoYXNoU2V0KHR5cGVvZiBrZXkgPT0gJ3N0cmluZycgPyBkYXRhLnN0cmluZyA6IGRhdGEuaGFzaCwga2V5LCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoTWFwKSB7XG4gICAgZGF0YS5tYXAuc2V0KGtleSwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIGFzc29jU2V0KGRhdGEubWFwLCBrZXksIHZhbHVlKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGBrZXlgIGFuZCBpdHMgdmFsdWUgZnJvbSB0aGUgYXNzb2NpYXRpdmUgYXJyYXkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBhc3NvY0RlbGV0ZShhcnJheSwga2V5KSB7XG4gIHZhciBpbmRleCA9IGFzc29jSW5kZXhPZihhcnJheSwga2V5KTtcbiAgaWYgKGluZGV4IDwgMCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgbGFzdEluZGV4ID0gYXJyYXkubGVuZ3RoIC0gMTtcbiAgaWYgKGluZGV4ID09IGxhc3RJbmRleCkge1xuICAgIGFycmF5LnBvcCgpO1xuICB9IGVsc2Uge1xuICAgIHNwbGljZS5jYWxsKGFycmF5LCBpbmRleCwgMSk7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgYXNzb2NpYXRpdmUgYXJyYXkgdmFsdWUgZm9yIGBrZXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gYXNzb2NHZXQoYXJyYXksIGtleSkge1xuICB2YXIgaW5kZXggPSBhc3NvY0luZGV4T2YoYXJyYXksIGtleSk7XG4gIHJldHVybiBpbmRleCA8IDAgPyB1bmRlZmluZWQgOiBhcnJheVtpbmRleF1bMV07XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGFuIGFzc29jaWF0aXZlIGFycmF5IHZhbHVlIGZvciBga2V5YCBleGlzdHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZW50cnkgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW4gZW50cnkgZm9yIGBrZXlgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBhc3NvY0hhcyhhcnJheSwga2V5KSB7XG4gIHJldHVybiBhc3NvY0luZGV4T2YoYXJyYXksIGtleSkgPiAtMTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBga2V5YCBpcyBmb3VuZCBpbiBgYXJyYXlgXG4gKiBvZiBrZXktdmFsdWUgcGFpcnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBzZWFyY2guXG4gKiBAcGFyYW0geyp9IGtleSBUaGUga2V5IHRvIHNlYXJjaCBmb3IuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCB2YWx1ZSwgZWxzZSBgLTFgLlxuICovXG5mdW5jdGlvbiBhc3NvY0luZGV4T2YoYXJyYXksIGtleSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICBpZiAoZXEoYXJyYXlbbGVuZ3RoXVswXSwga2V5KSkge1xuICAgICAgcmV0dXJuIGxlbmd0aDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGFzc29jaWF0aXZlIGFycmF5IGBrZXlgIHRvIGB2YWx1ZWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBtb2RpZnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHNldC5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAqL1xuZnVuY3Rpb24gYXNzb2NTZXQoYXJyYXksIGtleSwgdmFsdWUpIHtcbiAgdmFyIGluZGV4ID0gYXNzb2NJbmRleE9mKGFycmF5LCBrZXkpO1xuICBpZiAoaW5kZXggPCAwKSB7XG4gICAgYXJyYXkucHVzaChba2V5LCB2YWx1ZV0pO1xuICB9IGVsc2Uge1xuICAgIGFycmF5W2luZGV4XVsxXSA9IHZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbmF0aXZlIGZ1bmN0aW9uIGF0IGBrZXlgIG9mIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIG1ldGhvZCB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZnVuY3Rpb24gaWYgaXQncyBuYXRpdmUsIGVsc2UgYHVuZGVmaW5lZGAuXG4gKi9cbmZ1bmN0aW9uIGdldE5hdGl2ZShvYmplY3QsIGtleSkge1xuICB2YXIgdmFsdWUgPSBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICByZXR1cm4gaXNOYXRpdmUodmFsdWUpID8gdmFsdWUgOiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgc3VpdGFibGUgZm9yIHVzZSBhcyB1bmlxdWUgb2JqZWN0IGtleS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0tleWFibGUodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiB0eXBlID09ICdudW1iZXInIHx8IHR5cGUgPT0gJ2Jvb2xlYW4nIHx8XG4gICAgKHR5cGUgPT0gJ3N0cmluZycgJiYgdmFsdWUgIT09ICdfX3Byb3RvX18nKSB8fCB2YWx1ZSA9PSBudWxsO1xufVxuXG4vKipcbiAqIFBlcmZvcm1zIGEgW2BTYW1lVmFsdWVaZXJvYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtc2FtZXZhbHVlemVybylcbiAqIGNvbXBhcmlzb24gYmV0d2VlbiB0d28gdmFsdWVzIHRvIGRldGVybWluZSBpZiB0aGV5IGFyZSBlcXVpdmFsZW50LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7Kn0gb3RoZXIgVGhlIG90aGVyIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAndXNlcic6ICdmcmVkJyB9O1xuICogdmFyIG90aGVyID0geyAndXNlcic6ICdmcmVkJyB9O1xuICpcbiAqIF8uZXEob2JqZWN0LCBvYmplY3QpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uZXEob2JqZWN0LCBvdGhlcik7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uZXEoJ2EnLCAnYScpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uZXEoJ2EnLCBPYmplY3QoJ2EnKSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uZXEoTmFOLCBOYU4pO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBlcSh2YWx1ZSwgb3RoZXIpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBvdGhlciB8fCAodmFsdWUgIT09IHZhbHVlICYmIG90aGVyICE9PSBvdGhlcik7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oXyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Z1bmN0aW9uKC9hYmMvKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgLy8gVGhlIHVzZSBvZiBgT2JqZWN0I3RvU3RyaW5nYCBhdm9pZHMgaXNzdWVzIHdpdGggdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gIC8vIGluIFNhZmFyaSA4IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9ycywgYW5kXG4gIC8vIFBoYW50b21KUyAxLjkgd2hpY2ggcmV0dXJucyAnZnVuY3Rpb24nIGZvciBgTm9kZUxpc3RgIGluc3RhbmNlcy5cbiAgdmFyIHRhZyA9IGlzT2JqZWN0KHZhbHVlKSA/IG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIHJldHVybiB0YWcgPT0gZnVuY1RhZyB8fCB0YWcgPT0gZ2VuVGFnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBbbGFuZ3VhZ2UgdHlwZV0oaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4OCkgb2YgYE9iamVjdGAuXG4gKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIEF2b2lkIGEgVjggSklUIGJ1ZyBpbiBDaHJvbWUgMTktMjAuXG4gIC8vIFNlZSBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MSBmb3IgbW9yZSBkZXRhaWxzLlxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbiwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTmF0aXZlKEFycmF5LnByb3RvdHlwZS5wdXNoKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzTmF0aXZlKF8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNOYXRpdmUodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgcmV0dXJuIHJlSXNOYXRpdmUudGVzdChmdW5jVG9TdHJpbmcuY2FsbCh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmXG4gICAgKGlzSG9zdE9iamVjdCh2YWx1ZSkgPyByZUlzTmF0aXZlIDogcmVJc0hvc3RDdG9yKS50ZXN0KHZhbHVlKTtcbn1cblxuLy8gQXZvaWQgaW5oZXJpdGluZyBmcm9tIGBPYmplY3QucHJvdG90eXBlYCB3aGVuIHBvc3NpYmxlLlxuSGFzaC5wcm90b3R5cGUgPSBuYXRpdmVDcmVhdGUgPyBuYXRpdmVDcmVhdGUobnVsbCkgOiBvYmplY3RQcm90bztcblxuLy8gQWRkIGZ1bmN0aW9ucyB0byB0aGUgYE1hcENhY2hlYC5cbk1hcENhY2hlLnByb3RvdHlwZS5jbGVhciA9IG1hcENsZWFyO1xuTWFwQ2FjaGUucHJvdG90eXBlWydkZWxldGUnXSA9IG1hcERlbGV0ZTtcbk1hcENhY2hlLnByb3RvdHlwZS5nZXQgPSBtYXBHZXQ7XG5NYXBDYWNoZS5wcm90b3R5cGUuaGFzID0gbWFwSGFzO1xuTWFwQ2FjaGUucHJvdG90eXBlLnNldCA9IG1hcFNldDtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXBDYWNoZTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5vbWl0L34vbG9kYXNoLl9zZXRjYWNoZS9+L2xvZGFzaC5fbWFwY2FjaGUvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwIDEgMlxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uaW5jbHVkZXNgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvclxuICogc3BlY2lmeWluZyBhbiBpbmRleCB0byBzZWFyY2ggZnJvbS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAqIEBwYXJhbSB7Kn0gdGFyZ2V0IFRoZSB2YWx1ZSB0byBzZWFyY2ggZm9yLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB0YXJnZXRgIGlzIGZvdW5kLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5SW5jbHVkZXMoYXJyYXksIHZhbHVlKSB7XG4gIHJldHVybiAhIWFycmF5Lmxlbmd0aCAmJiBiYXNlSW5kZXhPZihhcnJheSwgdmFsdWUsIDApID4gLTE7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaW5kZXhPZmAgd2l0aG91dCBgZnJvbUluZGV4YCBib3VuZHMgY2hlY2tzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmcm9tSW5kZXggVGhlIGluZGV4IHRvIHNlYXJjaCBmcm9tLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoZWQgdmFsdWUsIGVsc2UgYC0xYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUluZGV4T2YoYXJyYXksIHZhbHVlLCBmcm9tSW5kZXgpIHtcbiAgaWYgKHZhbHVlICE9PSB2YWx1ZSkge1xuICAgIHJldHVybiBpbmRleE9mTmFOKGFycmF5LCBmcm9tSW5kZXgpO1xuICB9XG4gIHZhciBpbmRleCA9IGZyb21JbmRleCAtIDEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBpZiAoYXJyYXlbaW5kZXhdID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgaW5kZXggYXQgd2hpY2ggdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYE5hTmAgaXMgZm91bmQgaW4gYGFycmF5YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmcm9tSW5kZXggVGhlIGluZGV4IHRvIHNlYXJjaCBmcm9tLlxuICogQHBhcmFtIHtib29sZWFufSBbZnJvbVJpZ2h0XSBTcGVjaWZ5IGl0ZXJhdGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCBgTmFOYCwgZWxzZSBgLTFgLlxuICovXG5mdW5jdGlvbiBpbmRleE9mTmFOKGFycmF5LCBmcm9tSW5kZXgsIGZyb21SaWdodCkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuICAgICAgaW5kZXggPSBmcm9tSW5kZXggKyAoZnJvbVJpZ2h0ID8gMCA6IC0xKTtcblxuICB3aGlsZSAoKGZyb21SaWdodCA/IGluZGV4LS0gOiArK2luZGV4IDwgbGVuZ3RoKSkge1xuICAgIHZhciBvdGhlciA9IGFycmF5W2luZGV4XTtcbiAgICBpZiAob3RoZXIgIT09IG90aGVyKSB7XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUluY2x1ZGVzO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLm9taXQvfi9sb2Rhc2guX2FycmF5aW5jbHVkZXMvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwIDEgMlxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uaW5jbHVkZXNXaXRoYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3JcbiAqIHNwZWNpZnlpbmcgYW4gaW5kZXggdG8gc2VhcmNoIGZyb20uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBzZWFyY2guXG4gKiBAcGFyYW0geyp9IHRhcmdldCBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgVGhlIGNvbXBhcmF0b3IgaW52b2tlZCBwZXIgZWxlbWVudC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdGFyZ2V0YCBpcyBmb3VuZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBhcnJheUluY2x1ZGVzV2l0aChhcnJheSwgdmFsdWUsIGNvbXBhcmF0b3IpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBpZiAoY29tcGFyYXRvcih2YWx1ZSwgYXJyYXlbaW5kZXhdKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUluY2x1ZGVzV2l0aDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5vbWl0L34vbG9kYXNoLl9hcnJheWluY2x1ZGVzd2l0aC9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDE0XG4gKiogbW9kdWxlIGNodW5rcyA9IDAgMSAyXG4gKiovIiwiLyoqXG4gKiBsb2Rhc2ggMy4wLjAgKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2Rlcm4gbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE1IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjcuMCA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTUgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8ubWFwYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgb3IgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgbWFwcGVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBhcnJheU1hcChhcnJheSwgaXRlcmF0ZWUpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgcmVzdWx0W2luZGV4XSA9IGl0ZXJhdGVlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5TWFwO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLm9taXQvfi9sb2Rhc2guX2FycmF5bWFwL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMCAxIDJcbiAqKi8iLCIvKipcbiAqIGxvZGFzaCA0LjAuMCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJnc1RhZyA9ICdbb2JqZWN0IEFyZ3VtZW50c10nLFxuICAgIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXSc7XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgZWxlbWVudHMgb2YgYHZhbHVlc2AgdG8gYGFycmF5YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIG1vZGlmeS5cbiAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlcyBUaGUgdmFsdWVzIHRvIGFwcGVuZC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBgYXJyYXlgLlxuICovXG5mdW5jdGlvbiBhcnJheVB1c2goYXJyYXksIHZhbHVlcykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHZhbHVlcy5sZW5ndGgsXG4gICAgICBvZmZzZXQgPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBhcnJheVtvZmZzZXQgKyBpbmRleF0gPSB2YWx1ZXNbaW5kZXhdO1xuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gZ2xvYmFsLk9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIHByb3BlcnR5SXNFbnVtZXJhYmxlID0gb2JqZWN0UHJvdG8ucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZmxhdHRlbmAgd2l0aCBzdXBwb3J0IGZvciByZXN0cmljdGluZyBmbGF0dGVuaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gZmxhdHRlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRGVlcF0gU3BlY2lmeSBhIGRlZXAgZmxhdHRlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU3RyaWN0XSBSZXN0cmljdCBmbGF0dGVuaW5nIHRvIGFycmF5cy1saWtlIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbcmVzdWx0PVtdXSBUaGUgaW5pdGlhbCByZXN1bHQgdmFsdWUuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBmbGF0dGVuZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGJhc2VGbGF0dGVuKGFycmF5LCBpc0RlZXAsIGlzU3RyaWN0LCByZXN1bHQpIHtcbiAgcmVzdWx0IHx8IChyZXN1bHQgPSBbXSk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIgdmFsdWUgPSBhcnJheVtpbmRleF07XG4gICAgaWYgKGlzQXJyYXlMaWtlT2JqZWN0KHZhbHVlKSAmJlxuICAgICAgICAoaXNTdHJpY3QgfHwgaXNBcnJheSh2YWx1ZSkgfHwgaXNBcmd1bWVudHModmFsdWUpKSkge1xuICAgICAgaWYgKGlzRGVlcCkge1xuICAgICAgICAvLyBSZWN1cnNpdmVseSBmbGF0dGVuIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgICAgICBiYXNlRmxhdHRlbih2YWx1ZSwgaXNEZWVwLCBpc1N0cmljdCwgcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFycmF5UHVzaChyZXN1bHQsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFpc1N0cmljdCkge1xuICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ucHJvcGVydHlgIHdpdGhvdXQgc3VwcG9ydCBmb3IgZGVlcCBwYXRocy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZVByb3BlcnR5KGtleSkge1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W2tleV07XG4gIH07XG59XG5cbi8qKlxuICogR2V0cyB0aGUgXCJsZW5ndGhcIiBwcm9wZXJ0eSB2YWx1ZSBvZiBgb2JqZWN0YC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIGF2b2lkIGEgW0pJVCBidWddKGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNDI3OTIpXG4gKiB0aGF0IGFmZmVjdHMgU2FmYXJpIG9uIGF0IGxlYXN0IGlPUyA4LjEtOC4zIEFSTTY0LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgXCJsZW5ndGhcIiB2YWx1ZS5cbiAqL1xudmFyIGdldExlbmd0aCA9IGJhc2VQcm9wZXJ0eSgnbGVuZ3RoJyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGFuIGBhcmd1bWVudHNgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuICAvLyBTYWZhcmkgOC4xIGluY29ycmVjdGx5IG1ha2VzIGBhcmd1bWVudHMuY2FsbGVlYCBlbnVtZXJhYmxlIGluIHN0cmljdCBtb2RlLlxuICByZXR1cm4gaXNBcnJheUxpa2VPYmplY3QodmFsdWUpICYmIGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdjYWxsZWUnKSAmJlxuICAgICghcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpIHx8IG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpID09IGFyZ3NUYWcpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYEFycmF5YCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXkoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheSgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UuIEEgdmFsdWUgaXMgY29uc2lkZXJlZCBhcnJheS1saWtlIGlmIGl0J3NcbiAqIG5vdCBhIGZ1bmN0aW9uIGFuZCBoYXMgYSBgdmFsdWUubGVuZ3RoYCB0aGF0J3MgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gb3JcbiAqIGVxdWFsIHRvIGAwYCBhbmQgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoJ2FiYycpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmXG4gICAgISh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJiBpc0Z1bmN0aW9uKHZhbHVlKSkgJiYgaXNMZW5ndGgoZ2V0TGVuZ3RoKHZhbHVlKSk7XG59XG5cbi8qKlxuICogVGhpcyBtZXRob2QgaXMgbGlrZSBgXy5pc0FycmF5TGlrZWAgZXhjZXB0IHRoYXQgaXQgYWxzbyBjaGVja3MgaWYgYHZhbHVlYFxuICogaXMgYW4gb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXktbGlrZSBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5TGlrZU9iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2VPYmplY3QoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZU9iamVjdCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheUxpa2VPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzQXJyYXlMaWtlKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDggd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JzLCBhbmRcbiAgLy8gUGhhbnRvbUpTIDEuOSB3aGljaCByZXR1cm5zICdmdW5jdGlvbicgZm9yIGBOb2RlTGlzdGAgaW5zdGFuY2VzLlxuICB2YXIgdGFnID0gaXNPYmplY3QodmFsdWUpID8gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyBsb29zZWx5IGJhc2VkIG9uIFtgVG9MZW5ndGhgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy10b2xlbmd0aCkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgbGVuZ3RoLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNMZW5ndGgoMyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0xlbmd0aChOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0xlbmd0aChJbmZpbml0eSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoJzMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTGVuZ3RoKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiYgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBbbGFuZ3VhZ2UgdHlwZV0oaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4OCkgb2YgYE9iamVjdGAuXG4gKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIEF2b2lkIGEgVjggSklUIGJ1ZyBpbiBDaHJvbWUgMTktMjAuXG4gIC8vIFNlZSBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MSBmb3IgbW9yZSBkZXRhaWxzLlxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGbGF0dGVuO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLm9taXQvfi9sb2Rhc2guX2Jhc2VmbGF0dGVuL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMCAxIDJcbiAqKi8iLCIvKipcbiAqIGxvZGFzaCA0LjAuMCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIHRvIHN0YW5kLWluIGZvciBgdW5kZWZpbmVkYCBoYXNoIHZhbHVlcy4gKi9cbnZhciBIQVNIX1VOREVGSU5FRCA9ICdfX2xvZGFzaF9oYXNoX3VuZGVmaW5lZF9fJztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBpbiBgY2FjaGVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gY2FjaGUgVGhlIHNldCBjYWNoZSB0byBzZWFyY2guXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZWFyY2ggZm9yLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBmb3VuZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBjYWNoZUhhcyhjYWNoZSwgdmFsdWUpIHtcbiAgdmFyIG1hcCA9IGNhY2hlLl9fZGF0YV9fO1xuICBpZiAoaXNLZXlhYmxlKHZhbHVlKSkge1xuICAgIHZhciBkYXRhID0gbWFwLl9fZGF0YV9fLFxuICAgICAgICBoYXNoID0gdHlwZW9mIHZhbHVlID09ICdzdHJpbmcnID8gZGF0YS5zdHJpbmcgOiBkYXRhLmhhc2g7XG5cbiAgICByZXR1cm4gaGFzaFt2YWx1ZV0gPT09IEhBU0hfVU5ERUZJTkVEO1xuICB9XG4gIHJldHVybiBtYXAuaGFzKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSBmb3IgdXNlIGFzIHVuaXF1ZSBvYmplY3Qga2V5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzS2V5YWJsZSh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuIHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnYm9vbGVhbicgfHxcbiAgICAodHlwZSA9PSAnc3RyaW5nJyAmJiB2YWx1ZSAhPT0gJ19fcHJvdG9fXycpIHx8IHZhbHVlID09IG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FjaGVIYXM7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fY2FjaGVoYXMvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxN1xuICoqIG1vZHVsZSBjaHVua3MgPSAwIDEgMlxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhcmdzVGFnID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgZ2VuVGFnID0gJ1tvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dJyxcbiAgICBzdHJpbmdUYWcgPSAnW29iamVjdCBTdHJpbmddJztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IHVuc2lnbmVkIGludGVnZXIgdmFsdWVzLiAqL1xudmFyIHJlSXNVaW50ID0gL14oPzowfFsxLTldXFxkKikkLztcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy50aW1lc2Agd2l0aG91dCBzdXBwb3J0IGZvciBpdGVyYXRlZSBzaG9ydGhhbmRzXG4gKiBvciBtYXggYXJyYXkgbGVuZ3RoIGNoZWNrcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IG4gVGhlIG51bWJlciBvZiB0aW1lcyB0byBpbnZva2UgYGl0ZXJhdGVlYC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIGJhc2VUaW1lcyhuLCBpdGVyYXRlZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHJlc3VsdCA9IEFycmF5KG4pO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbikge1xuICAgIHJlc3VsdFtpbmRleF0gPSBpdGVyYXRlZShpbmRleCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGFycmF5LWxpa2UgaW5kZXguXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHBhcmFtIHtudW1iZXJ9IFtsZW5ndGg9TUFYX1NBRkVfSU5URUdFUl0gVGhlIHVwcGVyIGJvdW5kcyBvZiBhIHZhbGlkIGluZGV4LlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBpbmRleCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0luZGV4KHZhbHVlLCBsZW5ndGgpIHtcbiAgdmFsdWUgPSAodHlwZW9mIHZhbHVlID09ICdudW1iZXInIHx8IHJlSXNVaW50LnRlc3QodmFsdWUpKSA/ICt2YWx1ZSA6IC0xO1xuICBsZW5ndGggPSBsZW5ndGggPT0gbnVsbCA/IE1BWF9TQUZFX0lOVEVHRVIgOiBsZW5ndGg7XG4gIHJldHVybiB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDwgbGVuZ3RoO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGBpdGVyYXRvcmAgdG8gYW4gYXJyYXkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBpdGVyYXRvciBUaGUgaXRlcmF0b3IgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY29udmVydGVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBpdGVyYXRvclRvQXJyYXkoaXRlcmF0b3IpIHtcbiAgdmFyIGRhdGEsXG4gICAgICByZXN1bHQgPSBbXTtcblxuICB3aGlsZSAoIShkYXRhID0gaXRlcmF0b3IubmV4dCgpKS5kb25lKSB7XG4gICAgcmVzdWx0LnB1c2goZGF0YS52YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gZ2xvYmFsLk9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIFJlZmxlY3QgPSBnbG9iYWwuUmVmbGVjdCxcbiAgICBlbnVtZXJhdGUgPSBSZWZsZWN0ID8gUmVmbGVjdC5lbnVtZXJhdGUgOiB1bmRlZmluZWQsXG4gICAgcHJvcGVydHlJc0VudW1lcmFibGUgPSBvYmplY3RQcm90by5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5rZXlzSW5gIHdoaWNoIGRvZXNuJ3Qgc2tpcCB0aGUgY29uc3RydWN0b3JcbiAqIHByb3BlcnR5IG9mIHByb3RvdHlwZXMgb3IgdHJlYXQgc3BhcnNlIGFycmF5cyBhcyBkZW5zZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqL1xuZnVuY3Rpb24gYmFzZUtleXNJbihvYmplY3QpIHtcbiAgb2JqZWN0ID0gb2JqZWN0ID09IG51bGwgPyBvYmplY3QgOiBPYmplY3Qob2JqZWN0KTtcblxuICB2YXIgcmVzdWx0ID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICByZXN1bHQucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEZhbGxiYWNrIGZvciBJRSA8IDkgd2l0aCBlczYtc2hpbS5cbmlmIChlbnVtZXJhdGUgJiYgIXByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwoeyAndmFsdWVPZic6IDEgfSwgJ3ZhbHVlT2YnKSkge1xuICBiYXNlS2V5c0luID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIGl0ZXJhdG9yVG9BcnJheShlbnVtZXJhdGUob2JqZWN0KSk7XG4gIH07XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ucHJvcGVydHlgIHdpdGhvdXQgc3VwcG9ydCBmb3IgZGVlcCBwYXRocy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZVByb3BlcnR5KGtleSkge1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W2tleV07XG4gIH07XG59XG5cbi8qKlxuICogR2V0cyB0aGUgXCJsZW5ndGhcIiBwcm9wZXJ0eSB2YWx1ZSBvZiBgb2JqZWN0YC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIGF2b2lkIGEgW0pJVCBidWddKGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNDI3OTIpXG4gKiB0aGF0IGFmZmVjdHMgU2FmYXJpIG9uIGF0IGxlYXN0IGlPUyA4LjEtOC4zIEFSTTY0LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgXCJsZW5ndGhcIiB2YWx1ZS5cbiAqL1xudmFyIGdldExlbmd0aCA9IGJhc2VQcm9wZXJ0eSgnbGVuZ3RoJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiBpbmRleCBrZXlzIGZvciBgb2JqZWN0YCB2YWx1ZXMgb2YgYXJyYXlzLFxuICogYGFyZ3VtZW50c2Agb2JqZWN0cywgYW5kIHN0cmluZ3MsIG90aGVyd2lzZSBgbnVsbGAgaXMgcmV0dXJuZWQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheXxudWxsfSBSZXR1cm5zIGluZGV4IGtleXMsIGVsc2UgYG51bGxgLlxuICovXG5mdW5jdGlvbiBpbmRleEtleXMob2JqZWN0KSB7XG4gIHZhciBsZW5ndGggPSBvYmplY3QgPyBvYmplY3QubGVuZ3RoIDogdW5kZWZpbmVkO1xuICByZXR1cm4gKGlzTGVuZ3RoKGxlbmd0aCkgJiYgKGlzQXJyYXkob2JqZWN0KSB8fCBpc1N0cmluZyhvYmplY3QpIHx8IGlzQXJndW1lbnRzKG9iamVjdCkpKVxuICAgID8gYmFzZVRpbWVzKGxlbmd0aCwgU3RyaW5nKVxuICAgIDogbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBsaWtlbHkgYSBwcm90b3R5cGUgb2JqZWN0LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgcHJvdG90eXBlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzUHJvdG90eXBlKHZhbHVlKSB7XG4gIHZhciBDdG9yID0gdmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IsXG4gICAgICBwcm90byA9ICh0eXBlb2YgQ3RvciA9PSAnZnVuY3Rpb24nICYmIEN0b3IucHJvdG90eXBlKSB8fCBvYmplY3RQcm90bztcblxuICByZXR1cm4gdmFsdWUgPT09IHByb3RvO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGxpa2VseSBhbiBgYXJndW1lbnRzYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcmd1bWVudHMoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhbMSwgMiwgM10pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcbiAgLy8gU2FmYXJpIDguMSBpbmNvcnJlY3RseSBtYWtlcyBgYXJndW1lbnRzLmNhbGxlZWAgZW51bWVyYWJsZSBpbiBzdHJpY3QgbW9kZS5cbiAgcmV0dXJuIGlzQXJyYXlMaWtlT2JqZWN0KHZhbHVlKSAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY2FsbGVlJykgJiZcbiAgICAoIXByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwodmFsdWUsICdjYWxsZWUnKSB8fCBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBhcmdzVGFnKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBBcnJheWAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5KGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXkoJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXkoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLiBBIHZhbHVlIGlzIGNvbnNpZGVyZWQgYXJyYXktbGlrZSBpZiBpdCdzXG4gKiBub3QgYSBmdW5jdGlvbiBhbmQgaGFzIGEgYHZhbHVlLmxlbmd0aGAgdGhhdCdzIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIG9yXG4gKiBlcXVhbCB0byBgMGAgYW5kIGxlc3MgdGhhbiBvciBlcXVhbCB0byBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKCdhYmMnKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FycmF5TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJlxuICAgICEodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicgJiYgaXNGdW5jdGlvbih2YWx1ZSkpICYmIGlzTGVuZ3RoKGdldExlbmd0aCh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8uaXNBcnJheUxpa2VgIGV4Y2VwdCB0aGF0IGl0IGFsc28gY2hlY2tzIGlmIGB2YWx1ZWBcbiAqIGlzIGFuIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHR5cGUgRnVuY3Rpb25cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIGFycmF5LWxpa2Ugb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheUxpa2VPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlT2JqZWN0KGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2VPYmplY3QoJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXlMaWtlT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FycmF5TGlrZU9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0FycmF5TGlrZSh2YWx1ZSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oXyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Z1bmN0aW9uKC9hYmMvKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgLy8gVGhlIHVzZSBvZiBgT2JqZWN0I3RvU3RyaW5nYCBhdm9pZHMgaXNzdWVzIHdpdGggdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gIC8vIGluIFNhZmFyaSA4IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9ycywgYW5kXG4gIC8vIFBoYW50b21KUyAxLjkgd2hpY2ggcmV0dXJucyAnZnVuY3Rpb24nIGZvciBgTm9kZUxpc3RgIGluc3RhbmNlcy5cbiAgdmFyIHRhZyA9IGlzT2JqZWN0KHZhbHVlKSA/IG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIHJldHVybiB0YWcgPT0gZnVuY1RhZyB8fCB0YWcgPT0gZ2VuVGFnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBsZW5ndGguXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgbG9vc2VseSBiYXNlZCBvbiBbYFRvTGVuZ3RoYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9sZW5ndGgpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGxlbmd0aCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTGVuZ3RoKDMpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNMZW5ndGgoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoSW5maW5pdHkpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzTGVuZ3RoKCczJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0xlbmd0aCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPD0gTUFYX1NBRkVfSU5URUdFUjtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgW2xhbmd1YWdlIHR5cGVdKGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDgpIG9mIGBPYmplY3RgLlxuICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxuICAvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTEgZm9yIG1vcmUgZGV0YWlscy5cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYFN0cmluZ2AgcHJpbWl0aXZlIG9yIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc1N0cmluZygnYWJjJyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1N0cmluZygxKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycgfHxcbiAgICAoIWlzQXJyYXkodmFsdWUpICYmIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gc3RyaW5nVGFnKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIHRoZSBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBOb24tb2JqZWN0IHZhbHVlcyBhcmUgY29lcmNlZCB0byBvYmplY3RzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiAgIHRoaXMuYiA9IDI7XG4gKiB9XG4gKlxuICogRm9vLnByb3RvdHlwZS5jID0gMztcbiAqXG4gKiBfLmtleXNJbihuZXcgRm9vKTtcbiAqIC8vID0+IFsnYScsICdiJywgJ2MnXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICovXG5mdW5jdGlvbiBrZXlzSW4ob2JqZWN0KSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgaXNQcm90byA9IGlzUHJvdG90eXBlKG9iamVjdCksXG4gICAgICBwcm9wcyA9IGJhc2VLZXlzSW4ob2JqZWN0KSxcbiAgICAgIHByb3BzTGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgaW5kZXhlcyA9IGluZGV4S2V5cyhvYmplY3QpLFxuICAgICAgc2tpcEluZGV4ZXMgPSAhIWluZGV4ZXMsXG4gICAgICByZXN1bHQgPSBpbmRleGVzIHx8IFtdLFxuICAgICAgbGVuZ3RoID0gcmVzdWx0Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IHByb3BzTGVuZ3RoKSB7XG4gICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICBpZiAoIShza2lwSW5kZXhlcyAmJiAoa2V5ID09ICdsZW5ndGgnIHx8IGlzSW5kZXgoa2V5LCBsZW5ndGgpKSkgJiZcbiAgICAgICAgIShrZXkgPT0gJ2NvbnN0cnVjdG9yJyAmJiAoaXNQcm90byB8fCAhaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpKSkge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzSW47XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5rZXlzaW4vaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwIDEgMlxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIElORklOSVRZID0gMSAvIDAsXG4gICAgTUFYX0lOVEVHRVIgPSAxLjc5NzY5MzEzNDg2MjMxNTdlKzMwOCxcbiAgICBOQU4gPSAwIC8gMDtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXSc7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGBnbG9iYWxgLiAqL1xudmFyIGZyZWVQYXJzZUludCA9IHBhcnNlSW50O1xuXG4vKipcbiAqIEEgZmFzdGVyIGFsdGVybmF0aXZlIHRvIGBGdW5jdGlvbiNhcHBseWAsIHRoaXMgZnVuY3Rpb24gaW52b2tlcyBgZnVuY2BcbiAqIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIGB0aGlzQXJnYCBhbmQgdGhlIGFyZ3VtZW50cyBvZiBgYXJnc2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGludm9rZS5cbiAqIEBwYXJhbSB7Kn0gdGhpc0FyZyBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGZ1bmNgLlxuICogQHBhcmFtIHsuLi4qfSBbYXJnc10gVGhlIGFyZ3VtZW50cyB0byBpbnZva2UgYGZ1bmNgIHdpdGguXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgcmVzdWx0IG9mIGBmdW5jYC5cbiAqL1xuZnVuY3Rpb24gYXBwbHkoZnVuYywgdGhpc0FyZywgYXJncykge1xuICB2YXIgbGVuZ3RoID0gYXJncyA/IGFyZ3MubGVuZ3RoIDogMDtcbiAgc3dpdGNoIChsZW5ndGgpIHtcbiAgICBjYXNlIDA6IHJldHVybiBmdW5jLmNhbGwodGhpc0FyZyk7XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGFyZ3NbMF0pO1xuICAgIGNhc2UgMjogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCBhcmdzWzBdLCBhcmdzWzFdKTtcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSk7XG4gIH1cbiAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG59XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IGdsb2JhbC5PYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXg7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBgZnVuY2Agd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlXG4gKiBjcmVhdGVkIGZ1bmN0aW9uIGFuZCBhcmd1bWVudHMgZnJvbSBgc3RhcnRgIGFuZCBiZXlvbmQgcHJvdmlkZWQgYXMgYW4gYXJyYXkuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGlzIGJhc2VkIG9uIHRoZSBbcmVzdCBwYXJhbWV0ZXJdKGh0dHBzOi8vbWRuLmlvL3Jlc3RfcGFyYW1ldGVycykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYXBwbHkgYSByZXN0IHBhcmFtZXRlciB0by5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnQ9ZnVuYy5sZW5ndGgtMV0gVGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoZSByZXN0IHBhcmFtZXRlci5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgc2F5ID0gXy5yZXN0KGZ1bmN0aW9uKHdoYXQsIG5hbWVzKSB7XG4gKiAgIHJldHVybiB3aGF0ICsgJyAnICsgXy5pbml0aWFsKG5hbWVzKS5qb2luKCcsICcpICtcbiAqICAgICAoXy5zaXplKG5hbWVzKSA+IDEgPyAnLCAmICcgOiAnJykgKyBfLmxhc3QobmFtZXMpO1xuICogfSk7XG4gKlxuICogc2F5KCdoZWxsbycsICdmcmVkJywgJ2Jhcm5leScsICdwZWJibGVzJyk7XG4gKiAvLyA9PiAnaGVsbG8gZnJlZCwgYmFybmV5LCAmIHBlYmJsZXMnXG4gKi9cbmZ1bmN0aW9uIHJlc3QoZnVuYywgc3RhcnQpIHtcbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgc3RhcnQgPSBuYXRpdmVNYXgoc3RhcnQgPT09IHVuZGVmaW5lZCA/IChmdW5jLmxlbmd0aCAtIDEpIDogdG9JbnRlZ2VyKHN0YXJ0KSwgMCk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gbmF0aXZlTWF4KGFyZ3MubGVuZ3RoIC0gc3RhcnQsIDApLFxuICAgICAgICBhcnJheSA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgYXJyYXlbaW5kZXhdID0gYXJnc1tzdGFydCArIGluZGV4XTtcbiAgICB9XG4gICAgc3dpdGNoIChzdGFydCkge1xuICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFycmF5KTtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBhcmdzWzBdLCBhcnJheSk7XG4gICAgICBjYXNlIDI6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJnc1swXSwgYXJnc1sxXSwgYXJyYXkpO1xuICAgIH1cbiAgICB2YXIgb3RoZXJBcmdzID0gQXJyYXkoc3RhcnQgKyAxKTtcbiAgICBpbmRleCA9IC0xO1xuICAgIHdoaWxlICgrK2luZGV4IDwgc3RhcnQpIHtcbiAgICAgIG90aGVyQXJnc1tpbmRleF0gPSBhcmdzW2luZGV4XTtcbiAgICB9XG4gICAgb3RoZXJBcmdzW3N0YXJ0XSA9IGFycmF5O1xuICAgIHJldHVybiBhcHBseShmdW5jLCB0aGlzLCBvdGhlckFyZ3MpO1xuICB9O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOCB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvcnMsIGFuZFxuICAvLyBQaGFudG9tSlMgMS45IHdoaWNoIHJldHVybnMgJ2Z1bmN0aW9uJyBmb3IgYE5vZGVMaXN0YCBpbnN0YW5jZXMuXG4gIHZhciB0YWcgPSBpc09iamVjdCh2YWx1ZSkgPyBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICByZXR1cm4gdGFnID09IGZ1bmNUYWcgfHwgdGFnID09IGdlblRhZztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgW2xhbmd1YWdlIHR5cGVdKGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDgpIG9mIGBPYmplY3RgLlxuICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxuICAvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTEgZm9yIG1vcmUgZGV0YWlscy5cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhbiBpbnRlZ2VyLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIGxvb3NlbHkgYmFzZWQgb24gW2BUb0ludGVnZXJgXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9pbnRlZ2VyKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgaW50ZWdlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b0ludGVnZXIoMyk7XG4gKiAvLyA9PiAzXG4gKlxuICogXy50b0ludGVnZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiAwXG4gKlxuICogXy50b0ludGVnZXIoSW5maW5pdHkpO1xuICogLy8gPT4gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDhcbiAqXG4gKiBfLnRvSW50ZWdlcignMycpO1xuICogLy8gPT4gM1xuICovXG5mdW5jdGlvbiB0b0ludGVnZXIodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogMDtcbiAgfVxuICB2YWx1ZSA9IHRvTnVtYmVyKHZhbHVlKTtcbiAgaWYgKHZhbHVlID09PSBJTkZJTklUWSB8fCB2YWx1ZSA9PT0gLUlORklOSVRZKSB7XG4gICAgdmFyIHNpZ24gPSAodmFsdWUgPCAwID8gLTEgOiAxKTtcbiAgICByZXR1cm4gc2lnbiAqIE1BWF9JTlRFR0VSO1xuICB9XG4gIHZhciByZW1haW5kZXIgPSB2YWx1ZSAlIDE7XG4gIHJldHVybiB2YWx1ZSA9PT0gdmFsdWUgPyAocmVtYWluZGVyID8gdmFsdWUgLSByZW1haW5kZXIgOiB2YWx1ZSkgOiAwO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBudW1iZXIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMpO1xuICogLy8gPT4gM1xuICpcbiAqIF8udG9OdW1iZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvTnVtYmVyKEluZmluaXR5KTtcbiAqIC8vID0+IEluZmluaXR5XG4gKlxuICogXy50b051bWJlcignMycpO1xuICogLy8gPT4gM1xuICovXG5mdW5jdGlvbiB0b051bWJlcih2YWx1ZSkge1xuICBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdmFyIG90aGVyID0gaXNGdW5jdGlvbih2YWx1ZS52YWx1ZU9mKSA/IHZhbHVlLnZhbHVlT2YoKSA6IHZhbHVlO1xuICAgIHZhbHVlID0gaXNPYmplY3Qob3RoZXIpID8gKG90aGVyICsgJycpIDogb3RoZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogK3ZhbHVlO1xuICB9XG4gIHZhbHVlID0gdmFsdWUucmVwbGFjZShyZVRyaW0sICcnKTtcbiAgdmFyIGlzQmluYXJ5ID0gcmVJc0JpbmFyeS50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIChpc0JpbmFyeSB8fCByZUlzT2N0YWwudGVzdCh2YWx1ZSkpXG4gICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgOiAocmVJc0JhZEhleC50ZXN0KHZhbHVlKSA/IE5BTiA6ICt2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVzdDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5vbWl0L34vbG9kYXNoLnJlc3QvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxOVxuICoqIG1vZHVsZSBjaHVua3MgPSAwIDEgMlxuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=