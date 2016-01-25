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
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
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
	    }
	  }).catch(function (err) {
	    return console.log(err);
	  });
	});
	
	// dbg
	//store.save({
	//  url: "https://github.com/dfahlander/Dexie.js/wiki/Collection",
	//  contentText: 'test',
	//  targetElmPath: '.foo'
	//});
	
	/* ============================================
	* Context Menu
	* ============================================*/
	
	exports.default = function () {
	  chrome.contextMenus.create({
	    id: 'sashikomi_context_menu',
	    title: 'Sashikomi',
	    contexts: ['selection']
	  });
	
	  chrome.contextMenus.onClicked.addListener(function (info, tab) {
	    chrome.tabs.sendMessage(tab.id, { type: 'CONTEXT_MENU' });
	  });
	}();
	
	/* =============================================
	 * browserAction
	 * ==============================================*/
	
	chrome.browserAction.onClicked.addListener(function () {
	  chrome.tabs.create({ url: chrome.extension.getURL('insertion_error.html') });
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
	        return true;
	        break;
	      case "DELETE":
	        deleteMemo(req, sendResponse);
	        return true;
	        break;
	      case "INSERTION_ERROR":
	        updateBrowserActionBadge(req);
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
	
	  function updateBrowserActionBadge(req) {
	    chrome.browserAction.setBadgeText({
	      text: req.data.length.toString(),
	      tabId: req.tabId
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMzgwNjRjZTcyNzYxYjEyMzRhYzYiLCJ3ZWJwYWNrOi8vLy4vc3JjL2JnL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9iZy9tZXNzYWdlX2xpc3RlbmVyLmpzIiwid2VicGFjazovLy8uL3NyYy9iZy9zdG9yZS5qcyIsIndlYnBhY2s6Ly8vLi9+L2RleGllL2Rpc3QvbGF0ZXN0L0RleGllLmpzIiwid2VicGFjazovLy8od2VicGFjaykvfi9ub2RlLWxpYnMtYnJvd3Nlci9+L3RpbWVycy1icm93c2VyaWZ5L21haW4uanMiLCJ3ZWJwYWNrOi8vLyh3ZWJwYWNrKS9+L25vZGUtbGlicy1icm93c2VyL34vcHJvY2Vzcy9icm93c2VyLmpzIiwid2VicGFjazovLy8uL3NyYy91dGlsLmpzIiwid2VicGFjazovLy8uL34vbG9kYXNoLnBpY2svaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gucGljay9+L2xvZGFzaC5fYmFzZWZsYXR0ZW4vaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gucGljay9+L2xvZGFzaC5yZXN0L2luZGV4LmpzIiwid2VicGFjazovLy8uL34vbG9kYXNoLm9taXQvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fc2V0Y2FjaGUvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fc2V0Y2FjaGUvfi9sb2Rhc2guX21hcGNhY2hlL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vbG9kYXNoLm9taXQvfi9sb2Rhc2guX2FycmF5aW5jbHVkZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fYXJyYXlpbmNsdWRlc3dpdGgvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fYXJyYXltYXAvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fYmFzZWZsYXR0ZW4vaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fY2FjaGVoYXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5rZXlzaW4vaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5yZXN0L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tDckNZLEtBQUs7Ozs7Ozs7OztBQUtqQixPQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsVUFBVSxLQUFLLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRTtBQUNsRSxRQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FDekIsSUFBSSxDQUFDLGNBQUksRUFBSTtBQUNaLFNBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNmLGFBQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO01BQ3RGO0lBQ0YsQ0FBQyxDQUNELEtBQUssQ0FBQyxhQUFHO1lBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7SUFBQSxDQUFDO0VBQ2xDLENBQUM7Ozs7Ozs7Ozs7OztBQUFDO21CQVlhLFlBQVk7QUFDMUIsU0FBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7QUFDekIs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LGNBQWEsUUFBUTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsRUFBRTtBQUNiLGNBQWEsUUFBUTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxFQUFFO0FBQ2IsY0FBYSxRQUFRO0FBQ3JCO0FBQ0E7QUFDQSxpQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsRUFBRTtBQUNiLGNBQWEsUUFBUTtBQUNyQjtBQUNBO0FBQ0EscUJBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxFQUFFO0FBQ2IsY0FBYSxRQUFRO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsTUFBTTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7Ozs7OztBQzViQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxTQUFTO0FBQ3BCLFlBQVcsRUFBRTtBQUNiLFlBQVcsS0FBSztBQUNoQixjQUFhLEVBQUU7QUFDZjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsU0FBUztBQUNwQixZQUFXLE9BQU87QUFDbEIsY0FBYSxTQUFTO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsRUFBRTtBQUNiLGNBQWEsUUFBUTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEVBQUU7QUFDYixjQUFhLFFBQVE7QUFDckI7QUFDQTtBQUNBLGlCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEVBQUU7QUFDYixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEVBQUU7QUFDYixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEiLCJmaWxlIjoiYmFja2dyb3VuZC5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDM4MDY0Y2U3Mjc2MWIxMjM0YWM2XG4gKiovIiwiaW1wb3J0IG1lc3NhZ2VfbGlzdGVuZXIgZnJvbSAnLi9tZXNzYWdlX2xpc3RlbmVyJ1xuaW1wb3J0ICogYXMgc3RvcmUgZnJvbSAnLi9zdG9yZSdcblxuLyo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4qIFRhYiBBY3Rpb25cbiogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG5jaHJvbWUudGFicy5vblVwZGF0ZWQuYWRkTGlzdGVuZXIoZnVuY3Rpb24gKHRhYklkLCBjaGFuZ2VJbmZvLCB0YWIpIHtcbiAgc3RvcmUuZ2V0TWVtb3NCeVVybCh0YWIudXJsKVxuICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgaWYgKGRhdGEubGVuZ3RoKSB7XG4gICAgICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRhYklkLCB7IHR5cGU6ICdUQUJfT05fVVBEQVRFRCcsIGRhdGE6IGRhdGEsIHRhYklkOiB0YWJJZCB9KTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyKSlcbn0pO1xuXG4vLyBkYmdcbi8vc3RvcmUuc2F2ZSh7XG4vLyAgdXJsOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9kZmFobGFuZGVyL0RleGllLmpzL3dpa2kvQ29sbGVjdGlvblwiLFxuLy8gIGNvbnRlbnRUZXh0OiAndGVzdCcsXG4vLyAgdGFyZ2V0RWxtUGF0aDogJy5mb28nXG4vL30pO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuKiBDb250ZXh0IE1lbnVcbiogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuZXhwb3J0IGRlZmF1bHQgKGZ1bmN0aW9uICgpIHtcbiAgY2hyb21lLmNvbnRleHRNZW51cy5jcmVhdGUoe1xuICAgIGlkOiAnc2FzaGlrb21pX2NvbnRleHRfbWVudScsXG4gICAgdGl0bGU6ICdTYXNoaWtvbWknLFxuICAgIGNvbnRleHRzOiBbJ3NlbGVjdGlvbiddXG4gIH0pO1xuXG4gIGNocm9tZS5jb250ZXh0TWVudXMub25DbGlja2VkLmFkZExpc3RlbmVyKGZ1bmN0aW9uIChpbmZvLCB0YWIpIHtcbiAgICBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWIuaWQsIHsgdHlwZTogJ0NPTlRFWFRfTUVOVScgfSk7XG4gIH0pO1xufSkoKTtcblxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIGJyb3dzZXJBY3Rpb25cbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuY2hyb21lLmJyb3dzZXJBY3Rpb24ub25DbGlja2VkLmFkZExpc3RlbmVyKCgpID0+IHtcbiAgY2hyb21lLnRhYnMuY3JlYXRlKHsgdXJsOiBjaHJvbWUuZXh0ZW5zaW9uLmdldFVSTCgnaW5zZXJ0aW9uX2Vycm9yLmh0bWwnKSB9KTtcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvYmcvaW5kZXguanNcbiAqKi8iLCJpbXBvcnQgKiBhcyBzdG9yZSBmcm9tICcuL3N0b3JlJ1xuZXhwb3J0IGRlZmF1bHQgKGZ1bmN0aW9uICgpIHtcblxuICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoXG4gICAgZnVuY3Rpb24gKHJlcSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpIHtcblxuICAgICAgc3dpdGNoIChyZXEudHlwZSkge1xuICAgICAgICBjYXNlIFwiUFVUXCI6XG4gICAgICAgICAgcHV0TWVtbyhyZXEsIHNlbmRSZXNwb25zZSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJERUxFVEVcIjpcbiAgICAgICAgICBkZWxldGVNZW1vKHJlcSwgc2VuZFJlc3BvbnNlKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIklOU0VSVElPTl9FUlJPUlwiOlxuICAgICAgICAgIHVwZGF0ZUJyb3dzZXJBY3Rpb25CYWRnZShyZXEpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3I6IFVua25vd24gcmVxdWVzdC5cIik7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICAgIH1cbiAgICB9XG4gICk7XG5cblxuICBmdW5jdGlvbiBwdXRNZW1vKHJlcSwgcmVzKSB7XG4gICAgc3RvcmUuc2F2ZShyZXEuZGF0YSlcbiAgICAgIC50aGVuKGRhdGEgPT5yZXMoeyBzdGF0dXM6ICdzdWNjZXNzJywgZGF0YTogZGF0YSB9KSlcbiAgICAgIC5jYXRjaChlcnIgPT4gcmVzKHsgc3RhdHVzOiAnZXJyb3InLCBlcnJvck1lc3NhZ2U6IGVyciB9KSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWxldGVNZW1vKHJlcSwgcmVzKSB7XG4gICAgc3RvcmUucmVtb3ZlKHJlcS5kYXRhKVxuICAgICAgLnRoZW4ocmVzKHsgc3RhdHVzOiAnc3VjY2VzcycgfSkpXG4gICAgICAuY2F0Y2gocmVzKHsgc3RhdHVzOiAnZXJyb3InIH0pKVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQnJvd3NlckFjdGlvbkJhZGdlKHJlcSkge1xuICAgIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7XG4gICAgICB0ZXh0OiByZXEuZGF0YS5sZW5ndGgudG9TdHJpbmcoKSxcbiAgICAgIHRhYklkOiByZXEudGFiSWRcbiAgICB9KTtcbiAgfVxufSkoKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9iZy9tZXNzYWdlX2xpc3RlbmVyLmpzXG4gKiovIiwiaW1wb3J0IERleGllIGZyb20gJ2RleGllJ1xuaW1wb3J0IF8gZnJvbSAnLi4vdXRpbCdcblxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgU2NoZW1hXG4qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4qIG1lbW9zOlxuKiAtLS0tLS0tXG4gIGlkOiAxIC8vIGF1dG8gaW5jcmVtZW50LCBpbmRleFxuICB1cmw6ICcnLCAvLyBpbmRleCxcbiAgdGFyZ2V0RWxtUGF0aDogJ2VsZW1lbnQnLFxuICBjb250ZW50VGV4dDogJ3RleHQgb3IgbWFya2Rvd24nXG4qL1xuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuKiBTZXR1cFxuKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuZXhwb3J0IGNvbnN0IGRiID0gKCgpID0+IHtcbiAgbGV0IGRiID0gbmV3IERleGllKCdTYXNoaWtvbWlEQicpO1xuICBkYi52ZXJzaW9uKDEpLnN0b3Jlcyh7IG1lbW9zOiBcIisraWQsIHVybFwiIH0pO1xuICBkYi5vcGVuKCk7XG4gIHJldHVybiBkYlxufSkoKTtcblxuLypcbiog5paw6KaP55m76Yyy44O75pu05pawXG4qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4qIOaWsOimj+eZu+mMsuOBruWgtOWQiOOAgSB1cmwsIHRhcmdldEVsbSwgY29udGVudFRleHTjgpLjgqrjg5bjgrjjgqfjgq/jg4jjgafmuKHjgZlcbiog5pu05paw44Gu5aC05ZCI44CBaWQsIHVybCwgdGFyZ2V0RWxtLCBjb250ZW50VGV4dOOCkuOCquODluOCuOOCp+OCr+ODiOOBp+a4oeOBmVxuKiBfLnBpY2vjgafnmbvpjLLjg7vmm7TmlrDjgavlv4XopoHjgapkYXRh44KS5YaF6YOo44Gn5rG65a6a44GZ44KL44KI44GG44GX44Gm44GE44KL44Gf44KB44CBUmVhY3Tjga5zdGF0ZeOCkuOBneOBruOBvuOBvua4oeOBm+OCi1xuKiDov5TjgorlgKQ6IFByb21pc2XjgIJ0aGVu44Gu5byV5pWw44Gr5paw6KaP55m76Yyy44O75pu05paw44GV44KM44GfMeS7tuOBruOCquODluOCuOOCp+OCr+ODiOOBjOa4oeOCi1xuXG5leClcbnN0b3JlLiRwdXQobmV3X21lbW8pXG4gIC50aGVuKGRhdGEgPT4gY29uc29sZS5sb2coJ3N1Y2Nlc3MnLCBkYXRhKSlcbiAgLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKTtcbiogKi9cbmV4cG9ydCBmdW5jdGlvbiBzYXZlKG9iaikge1xuICBsZXQgZGF0YSA9IF8ucGljayhvYmosIFsnaWQnLCAndXJsJywgJ3RhcmdldEVsbVBhdGgnLCAnY29udGVudFRleHQnXSk7XG4gIHJldHVybiBkYi50cmFuc2FjdGlvbigncncnLCBkYi5tZW1vcywgKCkgPT4ge1xuICAgIHJldHVybiBkYi5tZW1vcy5wdXQoZGF0YSlcbiAgICAgIC50aGVuKGlkID0+IGRiLm1lbW9zLmdldChpZCkpXG4gIH0pXG59XG5cblxuLypcbiogTWVtb+OBruWJiumZpFxuKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4qIOW8leaVsDogT2JqZWN0XG4qIOi/lOOCiuWApDogUHJvbWlzZSh1bmRlZmluZWQpXG4qIGNhdGNoKCnjgYznmbrngavjgZfjgarjgZHjgozjgbDliYrpmaTjgYzmiJDlip/jgZfjgZ/jgoLjga7jgajjgZnjgovjgIJcbiog5a2Y5Zyo44GX44Gq44GESUTjgYzmuKHjgZXjgozjgabjgoLkvovlpJbjga/otbfjgY3jgarjgYTjgILjgarjgavjgoLotbfjgY3jgarjgYTjgIJcblxuZXgpXG4kZGVsZXRlKDIpXG4gIC50aGVuKHN0b3JlLmRiLm1lbW9zLmNvdW50KGNvdW50ID0+IGNvbnNvbGUubG9nKGNvdW50KSkpXG4gIC5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyKSk7XG4qICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlKG9iaikge1xuICBsZXQgaWQgPSBvYmouaWQgfHwgLTE7XG4gIHJldHVybiBkYi50cmFuc2FjdGlvbigncncnLCBkYi5tZW1vcywgKCkgPT4ge1xuICAgIHJldHVybiBkYi5tZW1vcy5kZWxldGUoaWQpXG4gIH0pXG59XG5cblxuLypcbiogVVJM44Gr44KI44KLTWVtb+OBruaknOe0olxuKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4qIOW8leaVsDogdXJsXG4qIOi/lOOCiuWApDogUHJvbWlzZShhcnJheSlcbiog5a2Y5Zyo44GX44Gq44GEVVJM44Gu5aC05ZCI44KC56m644Gu6YWN5YiX44GM6L+U44KLXG4qIGRhdGHjga7mnInnhKHliKTlrprjgpLjgZvjgZrjgIFjb250ZW50X3NjcmlwdOOBq+mFjeWIl+OCkuaKleOBkuOAgVxuKiBjb250ZW50X3NjcmlwdOWGheOBp+mFjeWIl+WIhuOBoOOBkXJlbmRlcuOBmeOCi+OCiOOBhuOBq+S9v+OBhlxuXG5leClcbiRnZXRNZW1vc0J5VXJsKCdodHRwLy86ZXhhbXBsZS5jby5qcCcpXG4gIC50aGVuKG1lbW9zID0+IHtjb25zb2xlLmxvZyhtZW1vcyl9KVxuICAuY2F0Y2goZXJyID0+IGNvbnNvbGUubG9nKGVycikpO1xuKiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE1lbW9zQnlVcmwodXJsKSB7XG4gIHJldHVybiBkYi50cmFuc2FjdGlvbigncncnLCBkYi5tZW1vcywgKCkgPT4ge1xuICAgIHJldHVybiBkYi5tZW1vcy53aGVyZSgndXJsJykuZXF1YWxzKHVybCkudG9BcnJheSgpXG4gIH0pXG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9iZy9zdG9yZS5qc1xuICoqLyIsIi8qIEEgTWluaW1hbGlzdGljIFdyYXBwZXIgZm9yIEluZGV4ZWREQlxuICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgIEJ5IERhdmlkIEZhaGxhbmRlciwgZGF2aWQuZmFobGFuZGVyQGdtYWlsLmNvbVxuXG4gICBWZXJzaW9uIDEuMi4wIC0gU2VwdGVtYmVyIDIyLCAyMDE1LlxuXG4gICBUZXN0ZWQgc3VjY2Vzc2Z1bGx5IG9uIENocm9tZSwgT3BlcmEsIEZpcmVmb3gsIEVkZ2UsIGFuZCBJRS5cblxuICAgT2ZmaWNpYWwgV2Vic2l0ZTogd3d3LmRleGllLmNvbVxuXG4gICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UgVmVyc2lvbiAyLjAsIEphbnVhcnkgMjAwNCwgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL1xuKi9cbihmdW5jdGlvbiAoZ2xvYmFsLCBwdWJsaXNoLCB1bmRlZmluZWQpIHtcblxuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgZnVuY3Rpb24gZXh0ZW5kKG9iaiwgZXh0ZW5zaW9uKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZXh0ZW5zaW9uICE9PSAnb2JqZWN0JykgZXh0ZW5zaW9uID0gZXh0ZW5zaW9uKCk7IC8vIEFsbG93IHRvIHN1cHBseSBhIGZ1bmN0aW9uIHJldHVybmluZyB0aGUgZXh0ZW5zaW9uLiBVc2VmdWwgZm9yIHNpbXBsaWZ5aW5nIHByaXZhdGUgc2NvcGVzLlxuICAgICAgICBPYmplY3Qua2V5cyhleHRlbnNpb24pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgb2JqW2tleV0gPSBleHRlbnNpb25ba2V5XTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVyaXZlKENoaWxkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcm9tOiBmdW5jdGlvbiAoUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgQ2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQYXJlbnQucHJvdG90eXBlKTtcbiAgICAgICAgICAgICAgICBDaGlsZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDaGlsZDtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBleHRlbmQ6IGZ1bmN0aW9uIChleHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuZChDaGlsZC5wcm90b3R5cGUsIHR5cGVvZiBleHRlbnNpb24gIT09ICdvYmplY3QnID8gZXh0ZW5zaW9uKFBhcmVudC5wcm90b3R5cGUpIDogZXh0ZW5zaW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb3ZlcnJpZGUob3JpZ0Z1bmMsIG92ZXJyaWRlZEZhY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIG92ZXJyaWRlZEZhY3Rvcnkob3JpZ0Z1bmMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIERleGllKGRiTmFtZSwgb3B0aW9ucykge1xuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJvcHRpb25zXCIgdHlwZT1cIk9iamVjdFwiIG9wdGlvbmFsPVwidHJ1ZVwiPlNwZWNpZnkgb25seSBpZiB5b3Ugd2ljaCB0byBjb250cm9sIHdoaWNoIGFkZG9ucyB0aGF0IHNob3VsZCBydW4gb24gdGhpcyBpbnN0YW5jZTwvcGFyYW0+XG4gICAgICAgIHZhciBhZGRvbnMgPSAob3B0aW9ucyAmJiBvcHRpb25zLmFkZG9ucykgfHwgRGV4aWUuYWRkb25zO1xuICAgICAgICAvLyBSZXNvbHZlIGFsbCBleHRlcm5hbCBkZXBlbmRlbmNpZXM6XG4gICAgICAgIHZhciBkZXBzID0gRGV4aWUuZGVwZW5kZW5jaWVzO1xuICAgICAgICB2YXIgaW5kZXhlZERCID0gZGVwcy5pbmRleGVkREIsXG4gICAgICAgICAgICBJREJLZXlSYW5nZSA9IGRlcHMuSURCS2V5UmFuZ2UsXG4gICAgICAgICAgICBJREJUcmFuc2FjdGlvbiA9IGRlcHMuSURCVHJhbnNhY3Rpb247XG5cbiAgICAgICAgdmFyIERPTUVycm9yID0gZGVwcy5ET01FcnJvcixcbiAgICAgICAgICAgIFR5cGVFcnJvciA9IGRlcHMuVHlwZUVycm9yLFxuICAgICAgICAgICAgRXJyb3IgPSBkZXBzLkVycm9yO1xuXG4gICAgICAgIHZhciBnbG9iYWxTY2hlbWEgPSB0aGlzLl9kYlNjaGVtYSA9IHt9O1xuICAgICAgICB2YXIgdmVyc2lvbnMgPSBbXTtcbiAgICAgICAgdmFyIGRiU3RvcmVOYW1lcyA9IFtdO1xuICAgICAgICB2YXIgYWxsVGFibGVzID0ge307XG4gICAgICAgIHZhciBub3RJblRyYW5zRmFsbGJhY2tUYWJsZXMgPSB7fTtcbiAgICAgICAgLy8vPHZhciB0eXBlPVwiSURCRGF0YWJhc2VcIiAvPlxuICAgICAgICB2YXIgaWRiZGIgPSBudWxsOyAvLyBJbnN0YW5jZSBvZiBJREJEYXRhYmFzZVxuICAgICAgICB2YXIgZGJfaXNfYmxvY2tlZCA9IHRydWU7XG4gICAgICAgIHZhciBkYk9wZW5FcnJvciA9IG51bGw7XG4gICAgICAgIHZhciBpc0JlaW5nT3BlbmVkID0gZmFsc2U7XG4gICAgICAgIHZhciBSRUFET05MWSA9IFwicmVhZG9ubHlcIiwgUkVBRFdSSVRFID0gXCJyZWFkd3JpdGVcIjtcbiAgICAgICAgdmFyIGRiID0gdGhpcztcbiAgICAgICAgdmFyIHBhdXNlZFJlc3VtZWFibGVzID0gW107XG4gICAgICAgIHZhciBhdXRvU2NoZW1hID0gdHJ1ZTtcbiAgICAgICAgdmFyIGhhc05hdGl2ZUdldERhdGFiYXNlTmFtZXMgPSAhIWdldE5hdGl2ZUdldERhdGFiYXNlTmFtZXNGbigpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgICAgICAvLyBJZiBicm93c2VyIChub3Qgbm9kZS5qcyBvciBvdGhlciksIHN1YnNjcmliZSB0byB2ZXJzaW9uY2hhbmdlIGV2ZW50IGFuZCByZWxvYWQgcGFnZVxuICAgICAgICAgICAgZGIub24oXCJ2ZXJzaW9uY2hhbmdlXCIsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgYmVoYXZpb3IgZm9yIHZlcnNpb25jaGFuZ2UgZXZlbnQgaXMgdG8gY2xvc2UgZGF0YWJhc2UgY29ubmVjdGlvbi5cbiAgICAgICAgICAgICAgICAvLyBDYWxsZXIgY2FuIG92ZXJyaWRlIHRoaXMgYmVoYXZpb3IgYnkgZG9pbmcgZGIub24oXCJ2ZXJzaW9uY2hhbmdlXCIsIGZ1bmN0aW9uKCl7IHJldHVybiBmYWxzZTsgfSk7XG4gICAgICAgICAgICAgICAgLy8gTGV0J3Mgbm90IGJsb2NrIHRoZSBvdGhlciB3aW5kb3cgZnJvbSBtYWtpbmcgaXQncyBkZWxldGUoKSBvciBvcGVuKCkgY2FsbC5cbiAgICAgICAgICAgICAgICBkYi5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIGRiLm9uKCdlcnJvcicpLmZpcmUobmV3IEVycm9yKFwiRGF0YWJhc2UgdmVyc2lvbiBjaGFuZ2VkIGJ5IG90aGVyIGRhdGFiYXNlIGNvbm5lY3Rpb24uXCIpKTtcbiAgICAgICAgICAgICAgICAvLyBJbiBtYW55IHdlYiBhcHBsaWNhdGlvbnMsIGl0IHdvdWxkIGJlIHJlY29tbWVuZGVkIHRvIGZvcmNlIHdpbmRvdy5yZWxvYWQoKVxuICAgICAgICAgICAgICAgIC8vIHdoZW4gdGhpcyBldmVudCBvY2N1cnMuIERvIGRvIHRoYXQsIHN1YnNjcmliZSB0byB0aGUgdmVyc2lvbmNoYW5nZSBldmVudFxuICAgICAgICAgICAgICAgIC8vIGFuZCBjYWxsIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gVmVyc2lvbmluZyBGcmFtZXdvcmstLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cblxuICAgICAgICB0aGlzLnZlcnNpb24gPSBmdW5jdGlvbiAodmVyc2lvbk51bWJlcikge1xuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwidmVyc2lvbk51bWJlclwiIHR5cGU9XCJOdW1iZXJcIj48L3BhcmFtPlxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJWZXJzaW9uXCI+PC9yZXR1cm5zPlxuICAgICAgICAgICAgaWYgKGlkYmRiKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgYWRkIHZlcnNpb24gd2hlbiBkYXRhYmFzZSBpcyBvcGVuXCIpO1xuICAgICAgICAgICAgdGhpcy52ZXJubyA9IE1hdGgubWF4KHRoaXMudmVybm8sIHZlcnNpb25OdW1iZXIpO1xuICAgICAgICAgICAgdmFyIHZlcnNpb25JbnN0YW5jZSA9IHZlcnNpb25zLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdi5fY2ZnLnZlcnNpb24gPT09IHZlcnNpb25OdW1iZXI7IH0pWzBdO1xuICAgICAgICAgICAgaWYgKHZlcnNpb25JbnN0YW5jZSkgcmV0dXJuIHZlcnNpb25JbnN0YW5jZTtcbiAgICAgICAgICAgIHZlcnNpb25JbnN0YW5jZSA9IG5ldyBWZXJzaW9uKHZlcnNpb25OdW1iZXIpO1xuICAgICAgICAgICAgdmVyc2lvbnMucHVzaCh2ZXJzaW9uSW5zdGFuY2UpO1xuICAgICAgICAgICAgdmVyc2lvbnMuc29ydChsb3dlclZlcnNpb25GaXJzdCk7XG4gICAgICAgICAgICByZXR1cm4gdmVyc2lvbkluc3RhbmNlO1xuICAgICAgICB9OyBcblxuICAgICAgICBmdW5jdGlvbiBWZXJzaW9uKHZlcnNpb25OdW1iZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2NmZyA9IHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiB2ZXJzaW9uTnVtYmVyLFxuICAgICAgICAgICAgICAgIHN0b3Jlc1NvdXJjZTogbnVsbCxcbiAgICAgICAgICAgICAgICBkYnNjaGVtYToge30sXG4gICAgICAgICAgICAgICAgdGFibGVzOiB7fSxcbiAgICAgICAgICAgICAgICBjb250ZW50VXBncmFkZTogbnVsbFxuICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICB0aGlzLnN0b3Jlcyh7fSk7IC8vIERlcml2ZSBlYXJsaWVyIHNjaGVtYXMgYnkgZGVmYXVsdC5cbiAgICAgICAgfVxuXG4gICAgICAgIGV4dGVuZChWZXJzaW9uLnByb3RvdHlwZSwge1xuICAgICAgICAgICAgc3RvcmVzOiBmdW5jdGlvbiAoc3RvcmVzKSB7XG4gICAgICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAgICAgICAgIC8vLyAgIERlZmluZXMgdGhlIHNjaGVtYSBmb3IgYSBwYXJ0aWN1bGFyIHZlcnNpb25cbiAgICAgICAgICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInN0b3Jlc1wiIHR5cGU9XCJPYmplY3RcIj5cbiAgICAgICAgICAgICAgICAvLy8gRXhhbXBsZTogPGJyLz5cbiAgICAgICAgICAgICAgICAvLy8gICB7dXNlcnM6IFwiaWQrKyxmaXJzdCxsYXN0LCZhbXA7dXNlcm5hbWUsKmVtYWlsXCIsIDxici8+XG4gICAgICAgICAgICAgICAgLy8vICAgcGFzc3dvcmRzOiBcImlkKyssJmFtcDt1c2VybmFtZVwifTxici8+XG4gICAgICAgICAgICAgICAgLy8vIDxici8+XG4gICAgICAgICAgICAgICAgLy8vIFN5bnRheDoge1RhYmxlOiBcIltwcmltYXJ5S2V5XVsrK10sWyZhbXA7XVsqXWluZGV4MSxbJmFtcDtdWypdaW5kZXgyLC4uLlwifTxici8+PGJyLz5cbiAgICAgICAgICAgICAgICAvLy8gU3BlY2lhbCBjaGFyYWN0ZXJzOjxici8+XG4gICAgICAgICAgICAgICAgLy8vICBcIiZhbXA7XCIgIG1lYW5zIHVuaXF1ZSBrZXksIDxici8+XG4gICAgICAgICAgICAgICAgLy8vICBcIipcIiAgbWVhbnMgdmFsdWUgaXMgbXVsdGlFbnRyeSwgPGJyLz5cbiAgICAgICAgICAgICAgICAvLy8gIFwiKytcIiBtZWFucyBhdXRvLWluY3JlbWVudCBhbmQgb25seSBhcHBsaWNhYmxlIGZvciBwcmltYXJ5IGtleSA8YnIvPlxuICAgICAgICAgICAgICAgIC8vLyA8L3BhcmFtPlxuICAgICAgICAgICAgICAgIHRoaXMuX2NmZy5zdG9yZXNTb3VyY2UgPSB0aGlzLl9jZmcuc3RvcmVzU291cmNlID8gZXh0ZW5kKHRoaXMuX2NmZy5zdG9yZXNTb3VyY2UsIHN0b3JlcykgOiBzdG9yZXM7XG5cbiAgICAgICAgICAgICAgICAvLyBEZXJpdmUgc3RvcmVzIGZyb20gZWFybGllciB2ZXJzaW9ucyBpZiB0aGV5IGFyZSBub3QgZXhwbGljaXRlbHkgc3BlY2lmaWVkIGFzIG51bGwgb3IgYSBuZXcgc3ludGF4LlxuICAgICAgICAgICAgICAgIHZhciBzdG9yZXNTcGVjID0ge307XG4gICAgICAgICAgICAgICAgdmVyc2lvbnMuZm9yRWFjaChmdW5jdGlvbiAodmVyc2lvbikgeyAvLyAndmVyc2lvbnMnIGlzIGFsd2F5cyBzb3J0ZWQgYnkgbG93ZXN0IHZlcnNpb24gZmlyc3QuXG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZChzdG9yZXNTcGVjLCB2ZXJzaW9uLl9jZmcuc3RvcmVzU291cmNlKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHZhciBkYnNjaGVtYSA9ICh0aGlzLl9jZmcuZGJzY2hlbWEgPSB7fSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyc2VTdG9yZXNTcGVjKHN0b3Jlc1NwZWMsIGRic2NoZW1hKTtcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGxhdGVzdCBzY2hlbWEgdG8gdGhpcyB2ZXJzaW9uXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIEFQSVxuICAgICAgICAgICAgICAgIGdsb2JhbFNjaGVtYSA9IGRiLl9kYlNjaGVtYSA9IGRic2NoZW1hO1xuICAgICAgICAgICAgICAgIHJlbW92ZVRhYmxlc0FwaShbYWxsVGFibGVzLCBkYiwgbm90SW5UcmFuc0ZhbGxiYWNrVGFibGVzXSk7XG4gICAgICAgICAgICAgICAgc2V0QXBpT25QbGFjZShbbm90SW5UcmFuc0ZhbGxiYWNrVGFibGVzXSwgdGFibGVOb3RJblRyYW5zYWN0aW9uLCBPYmplY3Qua2V5cyhkYnNjaGVtYSksIFJFQURXUklURSwgZGJzY2hlbWEpO1xuICAgICAgICAgICAgICAgIHNldEFwaU9uUGxhY2UoW2FsbFRhYmxlcywgZGIsIHRoaXMuX2NmZy50YWJsZXNdLCBkYi5fdHJhbnNQcm9taXNlRmFjdG9yeSwgT2JqZWN0LmtleXMoZGJzY2hlbWEpLCBSRUFEV1JJVEUsIGRic2NoZW1hLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBkYlN0b3JlTmFtZXMgPSBPYmplY3Qua2V5cyhkYnNjaGVtYSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBncmFkZTogZnVuY3Rpb24gKHVwZ3JhZGVGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInVwZ3JhZGVGdW5jdGlvblwiIG9wdGlvbmFsPVwidHJ1ZVwiPkZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdXBncmFkaW5nIGFjdGlvbnMuPC9wYXJhbT5cbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgZmFrZUF1dG9Db21wbGV0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZ3JhZGVGdW5jdGlvbihkYi5fY3JlYXRlVHJhbnNhY3Rpb24oUkVBRFdSSVRFLCBPYmplY3Qua2V5cyhzZWxmLl9jZmcuZGJzY2hlbWEpLCBzZWxmLl9jZmcuZGJzY2hlbWEpKTsvLyBCVUdCVUc6IE5vIGNvZGUgY29tcGxldGlvbiBmb3IgcHJldiB2ZXJzaW9uJ3MgdGFibGVzIHdvbnQgYXBwZWFyLlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NmZy5jb250ZW50VXBncmFkZSA9IHVwZ3JhZGVGdW5jdGlvbjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfcGFyc2VTdG9yZXNTcGVjOiBmdW5jdGlvbiAoc3RvcmVzLCBvdXRTY2hlbWEpIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhzdG9yZXMpLmZvckVhY2goZnVuY3Rpb24gKHRhYmxlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcmVzW3RhYmxlTmFtZV0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnN0YW5jZVRlbXBsYXRlID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXhlcyA9IHBhcnNlSW5kZXhTeW50YXgoc3RvcmVzW3RhYmxlTmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByaW1LZXkgPSBpbmRleGVzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJpbUtleS5tdWx0aSkgdGhyb3cgbmV3IEVycm9yKFwiUHJpbWFyeSBrZXkgY2Fubm90IGJlIG11bHRpLXZhbHVlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmltS2V5LmtleVBhdGgpIHNldEJ5S2V5UGF0aChpbnN0YW5jZVRlbXBsYXRlLCBwcmltS2V5LmtleVBhdGgsIHByaW1LZXkuYXV0byA/IDAgOiBwcmltS2V5LmtleVBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhlcy5mb3JFYWNoKGZ1bmN0aW9uIChpZHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaWR4LmF1dG8pIHRocm93IG5ldyBFcnJvcihcIk9ubHkgcHJpbWFyeSBrZXkgY2FuIGJlIG1hcmtlZCBhcyBhdXRvSW5jcmVtZW50ICgrKylcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpZHgua2V5UGF0aCkgdGhyb3cgbmV3IEVycm9yKFwiSW5kZXggbXVzdCBoYXZlIGEgbmFtZSBhbmQgY2Fubm90IGJlIGFuIGVtcHR5IHN0cmluZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRCeUtleVBhdGgoaW5zdGFuY2VUZW1wbGF0ZSwgaWR4LmtleVBhdGgsIGlkeC5jb21wb3VuZCA/IGlkeC5rZXlQYXRoLm1hcChmdW5jdGlvbiAoKSB7IHJldHVybiBcIlwiOyB9KSA6IFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRTY2hlbWFbdGFibGVOYW1lXSA9IG5ldyBUYWJsZVNjaGVtYSh0YWJsZU5hbWUsIHByaW1LZXksIGluZGV4ZXMsIGluc3RhbmNlVGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIHJ1blVwZ3JhZGVycyhvbGRWZXJzaW9uLCBpZGJ0cmFucywgcmVqZWN0LCBvcGVuUmVxKSB7XG4gICAgICAgICAgICBpZiAob2xkVmVyc2lvbiA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vZ2xvYmFsU2NoZW1hID0gdmVyc2lvbnNbdmVyc2lvbnMubGVuZ3RoIC0gMV0uX2NmZy5kYnNjaGVtYTtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGFibGVzOlxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGdsb2JhbFNjaGVtYSkuZm9yRWFjaChmdW5jdGlvbiAodGFibGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZVRhYmxlKGlkYnRyYW5zLCB0YWJsZU5hbWUsIGdsb2JhbFNjaGVtYVt0YWJsZU5hbWVdLnByaW1LZXksIGdsb2JhbFNjaGVtYVt0YWJsZU5hbWVdLmluZGV4ZXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIFBvcHVsYXRlIGRhdGFcbiAgICAgICAgICAgICAgICB2YXIgdCA9IGRiLl9jcmVhdGVUcmFuc2FjdGlvbihSRUFEV1JJVEUsIGRiU3RvcmVOYW1lcywgZ2xvYmFsU2NoZW1hKTtcbiAgICAgICAgICAgICAgICB0LmlkYnRyYW5zID0gaWRidHJhbnM7XG4gICAgICAgICAgICAgICAgdC5pZGJ0cmFucy5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgW1wicG9wdWxhdGluZyBkYXRhYmFzZVwiXSk7XG4gICAgICAgICAgICAgICAgdC5vbignZXJyb3InKS5zdWJzY3JpYmUocmVqZWN0KTtcbiAgICAgICAgICAgICAgICBQcm9taXNlLm5ld1BTRChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIFByb21pc2UuUFNELnRyYW5zID0gdDtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRiLm9uKFwicG9wdWxhdGVcIikuZmlyZSh0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuUmVxLm9uZXJyb3IgPSBpZGJ0cmFucy5vbmVycm9yID0gZnVuY3Rpb24gKGV2KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH07ICAvLyBQcm9oaWJpdCBBYm9ydEVycm9yIGZpcmUgb24gZGIub24oXCJlcnJvclwiKSBpbiBGaXJlZm94LlxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHsgaWRidHJhbnMuYWJvcnQoKTsgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZGJ0cmFucy5kYi5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVXBncmFkZSB2ZXJzaW9uIHRvIHZlcnNpb24sIHN0ZXAtYnktc3RlcCBmcm9tIG9sZGVzdCB0byBuZXdlc3QgdmVyc2lvbi5cbiAgICAgICAgICAgICAgICAvLyBFYWNoIHRyYW5zYWN0aW9uIG9iamVjdCB3aWxsIGNvbnRhaW4gdGhlIHRhYmxlIHNldCB0aGF0IHdhcyBjdXJyZW50IGluIHRoYXQgdmVyc2lvbiAoYnV0IGFsc28gbm90LXlldC1kZWxldGVkIHRhYmxlcyBmcm9tIGl0cyBwcmV2aW91cyB2ZXJzaW9uKVxuICAgICAgICAgICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBvbGRWZXJzaW9uU3RydWN0ID0gdmVyc2lvbnMuZmlsdGVyKGZ1bmN0aW9uICh2ZXJzaW9uKSB7IHJldHVybiB2ZXJzaW9uLl9jZmcudmVyc2lvbiA9PT0gb2xkVmVyc2lvbjsgfSlbMF07XG4gICAgICAgICAgICAgICAgaWYgKCFvbGRWZXJzaW9uU3RydWN0KSB0aHJvdyBuZXcgRXJyb3IoXCJEZXhpZSBzcGVjaWZpY2F0aW9uIG9mIGN1cnJlbnRseSBpbnN0YWxsZWQgREIgdmVyc2lvbiBpcyBtaXNzaW5nXCIpO1xuICAgICAgICAgICAgICAgIGdsb2JhbFNjaGVtYSA9IGRiLl9kYlNjaGVtYSA9IG9sZFZlcnNpb25TdHJ1Y3QuX2NmZy5kYnNjaGVtYTtcbiAgICAgICAgICAgICAgICB2YXIgYW55Q29udGVudFVwZ3JhZGVySGFzUnVuID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICB2YXIgdmVyc1RvUnVuID0gdmVyc2lvbnMuZmlsdGVyKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2Ll9jZmcudmVyc2lvbiA+IG9sZFZlcnNpb247IH0pO1xuICAgICAgICAgICAgICAgIHZlcnNUb1J1bi5mb3JFYWNoKGZ1bmN0aW9uICh2ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInZlcnNpb25cIiB0eXBlPVwiVmVyc2lvblwiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRTY2hlbWEgPSBnbG9iYWxTY2hlbWE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdTY2hlbWEgPSB2ZXJzaW9uLl9jZmcuZGJzY2hlbWE7XG4gICAgICAgICAgICAgICAgICAgIGFkanVzdFRvRXhpc3RpbmdJbmRleE5hbWVzKG9sZFNjaGVtYSwgaWRidHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICBhZGp1c3RUb0V4aXN0aW5nSW5kZXhOYW1lcyhuZXdTY2hlbWEsIGlkYnRyYW5zKTtcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsU2NoZW1hID0gZGIuX2RiU2NoZW1hID0gbmV3U2NoZW1hO1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IGdldFNjaGVtYURpZmYob2xkU2NoZW1hLCBuZXdTY2hlbWEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZi5hZGQuZm9yRWFjaChmdW5jdGlvbiAodHVwbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKGZ1bmN0aW9uIChpZGJ0cmFucywgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlVGFibGUoaWRidHJhbnMsIHR1cGxlWzBdLCB0dXBsZVsxXS5wcmltS2V5LCB0dXBsZVsxXS5pbmRleGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZi5jaGFuZ2UuZm9yRWFjaChmdW5jdGlvbiAoY2hhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZS5yZWNyZWF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgeWV0IHN1cHBvcnQgZm9yIGNoYW5naW5nIHByaW1hcnkga2V5XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goZnVuY3Rpb24gKGlkYnRyYW5zLCBjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gaWRidHJhbnMub2JqZWN0U3RvcmUoY2hhbmdlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlLmFkZC5mb3JFYWNoKGZ1bmN0aW9uIChpZHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRJbmRleChzdG9yZSwgaWR4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlLmNoYW5nZS5mb3JFYWNoKGZ1bmN0aW9uIChpZHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yZS5kZWxldGVJbmRleChpZHgubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkSW5kZXgoc3RvcmUsIGlkeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZS5kZWwuZm9yRWFjaChmdW5jdGlvbiAoaWR4TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JlLmRlbGV0ZUluZGV4KGlkeE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ZXJzaW9uLl9jZmcuY29udGVudFVwZ3JhZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKGZ1bmN0aW9uIChpZGJ0cmFucywgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW55Q29udGVudFVwZ3JhZGVySGFzUnVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSBkYi5fY3JlYXRlVHJhbnNhY3Rpb24oUkVBRFdSSVRFLCBbXS5zbGljZS5jYWxsKGlkYnRyYW5zLmRiLm9iamVjdFN0b3JlTmFtZXMsIDApLCBuZXdTY2hlbWEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmlkYnRyYW5zID0gaWRidHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1bmNvbXBsZXRlZFJlcXVlc3RzID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdC5fcHJvbWlzZSA9IG92ZXJyaWRlKHQuX3Byb21pc2UsIGZ1bmN0aW9uIChvcmlnX3Byb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAobW9kZSwgZm4sIHdyaXRlTG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrdW5jb21wbGV0ZWRSZXF1ZXN0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBwcm94eShmbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgtLXVuY29tcGxldGVkUmVxdWVzdHMgPT09IDApIGNiKCk7IC8vIEEgY2FsbGVkIGRiIG9wZXJhdGlvbiBoYXMgY29tcGxldGVkIHdpdGhvdXQgc3RhcnRpbmcgYSBuZXcgb3BlcmF0aW9uLiBUaGUgZmxvdyBpcyBmaW5pc2hlZCwgbm93IHJ1biBuZXh0IHVwZ3JhZGVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcmlnX3Byb21pc2UuY2FsbCh0aGlzLCBtb2RlLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCB0cmFucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHNbMF0gPSBwcm94eShyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzWzFdID0gcHJveHkocmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB3cml0ZUxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkYnRyYW5zLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBbXCJydW5uaW5nIHVwZ3JhZGVyIGZ1bmN0aW9uIGZvciB2ZXJzaW9uXCIsIHZlcnNpb24uX2NmZy52ZXJzaW9uXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQub24oJ2Vycm9yJykuc3Vic2NyaWJlKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb24uX2NmZy5jb250ZW50VXBncmFkZSh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVuY29tcGxldGVkUmVxdWVzdHMgPT09IDApIGNiKCk7IC8vIGNvbnRlbnRVcGdyYWRlKCkgZGlkbnQgY2FsbCBhbnkgZGIgb3BlcmF0aW9ucyBhdCBhbGwuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFueUNvbnRlbnRVcGdyYWRlckhhc1J1biB8fCAhaGFzSUVEZWxldGVPYmplY3RTdG9yZUJ1ZygpKSB7IC8vIERvbnQgZGVsZXRlIG9sZCB0YWJsZXMgaWYgaWVCdWcgaXMgcHJlc2VudCBhbmQgYSBjb250ZW50IHVwZ3JhZGVyIGhhcyBydW4uIExldCB0YWJsZXMgYmUgbGVmdCBpbiBEQiBzbyBmYXIuIFRoaXMgbmVlZHMgdG8gYmUgdGFrZW4gY2FyZSBvZi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKGZ1bmN0aW9uIChpZGJ0cmFucywgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGVsZXRlIG9sZCB0YWJsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlUmVtb3ZlZFRhYmxlcyhuZXdTY2hlbWEsIGlkYnRyYW5zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gTm93LCBjcmVhdGUgYSBxdWV1ZSBleGVjdXRpb24gZW5naW5lXG4gICAgICAgICAgICAgICAgdmFyIHJ1bk5leHRRdWV1ZWRGdW5jdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUuc2hpZnQoKShpZGJ0cmFucywgcnVuTmV4dFF1ZXVlZEZ1bmN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVNaXNzaW5nVGFibGVzKGdsb2JhbFNjaGVtYSwgaWRidHJhbnMpOyAvLyBBdCBsYXN0LCBtYWtlIHN1cmUgdG8gY3JlYXRlIGFueSBtaXNzaW5nIHRhYmxlcy4gKE5lZWRlZCBieSBhZGRvbnMgdGhhdCBhZGQgc3RvcmVzIHRvIERCIHdpdGhvdXQgc3BlY2lmeWluZyB2ZXJzaW9uKVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5SZXEub25lcnJvciA9IGlkYnRyYW5zLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXYpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfTsgIC8vIFByb2hpYml0IEFib3J0RXJyb3IgZmlyZSBvbiBkYi5vbihcImVycm9yXCIpIGluIEZpcmVmb3guXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkgeyBpZGJ0cmFucy5hYm9ydCgpOyB9IGNhdGNoKGUpIHt9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZGJ0cmFucy5kYi5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJ1bk5leHRRdWV1ZWRGdW5jdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0U2NoZW1hRGlmZihvbGRTY2hlbWEsIG5ld1NjaGVtYSkge1xuICAgICAgICAgICAgdmFyIGRpZmYgPSB7XG4gICAgICAgICAgICAgICAgZGVsOiBbXSwgLy8gQXJyYXkgb2YgdGFibGUgbmFtZXNcbiAgICAgICAgICAgICAgICBhZGQ6IFtdLCAvLyBBcnJheSBvZiBbdGFibGVOYW1lLCBuZXdEZWZpbml0aW9uXVxuICAgICAgICAgICAgICAgIGNoYW5nZTogW10gLy8gQXJyYXkgb2Yge25hbWU6IHRhYmxlTmFtZSwgcmVjcmVhdGU6IG5ld0RlZmluaXRpb24sIGRlbDogZGVsSW5kZXhOYW1lcywgYWRkOiBuZXdJbmRleERlZnMsIGNoYW5nZTogY2hhbmdlZEluZGV4RGVmc31cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBmb3IgKHZhciB0YWJsZSBpbiBvbGRTY2hlbWEpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW5ld1NjaGVtYVt0YWJsZV0pIGRpZmYuZGVsLnB1c2godGFibGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgdGFibGUgaW4gbmV3U2NoZW1hKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZERlZiA9IG9sZFNjaGVtYVt0YWJsZV0sXG4gICAgICAgICAgICAgICAgICAgIG5ld0RlZiA9IG5ld1NjaGVtYVt0YWJsZV07XG4gICAgICAgICAgICAgICAgaWYgKCFvbGREZWYpIGRpZmYuYWRkLnB1c2goW3RhYmxlLCBuZXdEZWZdKTtcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoYW5nZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRhYmxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmOiBuZXdTY2hlbWFbdGFibGVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVjcmVhdGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZDogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2U6IFtdXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGREZWYucHJpbUtleS5zcmMgIT09IG5ld0RlZi5wcmltS2V5LnNyYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJpbWFyeSBrZXkgaGFzIGNoYW5nZWQuIFJlbW92ZSBhbmQgcmUtYWRkIHRhYmxlLlxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlLnJlY3JlYXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZmYuY2hhbmdlLnB1c2goY2hhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRJbmRleGVzID0gb2xkRGVmLmluZGV4ZXMucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXJyZW50KSB7IHByZXZbY3VycmVudC5uYW1lXSA9IGN1cnJlbnQ7IHJldHVybiBwcmV2OyB9LCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3SW5kZXhlcyA9IG5ld0RlZi5pbmRleGVzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VycmVudCkgeyBwcmV2W2N1cnJlbnQubmFtZV0gPSBjdXJyZW50OyByZXR1cm4gcHJldjsgfSwge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaWR4TmFtZSBpbiBvbGRJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXdJbmRleGVzW2lkeE5hbWVdKSBjaGFuZ2UuZGVsLnB1c2goaWR4TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpZHhOYW1lIGluIG5ld0luZGV4ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkSWR4ID0gb2xkSW5kZXhlc1tpZHhOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SWR4ID0gbmV3SW5kZXhlc1tpZHhOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9sZElkeCkgY2hhbmdlLmFkZC5wdXNoKG5ld0lkeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob2xkSWR4LnNyYyAhPT0gbmV3SWR4LnNyYykgY2hhbmdlLmNoYW5nZS5wdXNoKG5ld0lkeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlLnJlY3JlYXRlIHx8IGNoYW5nZS5kZWwubGVuZ3RoID4gMCB8fCBjaGFuZ2UuYWRkLmxlbmd0aCA+IDAgfHwgY2hhbmdlLmNoYW5nZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZi5jaGFuZ2UucHVzaChjaGFuZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRpZmY7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVUYWJsZShpZGJ0cmFucywgdGFibGVOYW1lLCBwcmltS2V5LCBpbmRleGVzKSB7XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJpZGJ0cmFuc1wiIHR5cGU9XCJJREJUcmFuc2FjdGlvblwiPjwvcGFyYW0+XG4gICAgICAgICAgICB2YXIgc3RvcmUgPSBpZGJ0cmFucy5kYi5jcmVhdGVPYmplY3RTdG9yZSh0YWJsZU5hbWUsIHByaW1LZXkua2V5UGF0aCA/IHsga2V5UGF0aDogcHJpbUtleS5rZXlQYXRoLCBhdXRvSW5jcmVtZW50OiBwcmltS2V5LmF1dG8gfSA6IHsgYXV0b0luY3JlbWVudDogcHJpbUtleS5hdXRvIH0pO1xuICAgICAgICAgICAgaW5kZXhlcy5mb3JFYWNoKGZ1bmN0aW9uIChpZHgpIHsgYWRkSW5kZXgoc3RvcmUsIGlkeCk7IH0pO1xuICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTWlzc2luZ1RhYmxlcyhuZXdTY2hlbWEsIGlkYnRyYW5zKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhuZXdTY2hlbWEpLmZvckVhY2goZnVuY3Rpb24gKHRhYmxlTmFtZSkge1xuICAgICAgICAgICAgICAgIGlmICghaWRidHJhbnMuZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyh0YWJsZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZVRhYmxlKGlkYnRyYW5zLCB0YWJsZU5hbWUsIG5ld1NjaGVtYVt0YWJsZU5hbWVdLnByaW1LZXksIG5ld1NjaGVtYVt0YWJsZU5hbWVdLmluZGV4ZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZGVsZXRlUmVtb3ZlZFRhYmxlcyhuZXdTY2hlbWEsIGlkYnRyYW5zKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGlkYnRyYW5zLmRiLm9iamVjdFN0b3JlTmFtZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcmVOYW1lID0gaWRidHJhbnMuZGIub2JqZWN0U3RvcmVOYW1lc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAobmV3U2NoZW1hW3N0b3JlTmFtZV0gPT09IG51bGwgfHwgbmV3U2NoZW1hW3N0b3JlTmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBpZGJ0cmFucy5kYi5kZWxldGVPYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFkZEluZGV4KHN0b3JlLCBpZHgpIHtcbiAgICAgICAgICAgIHN0b3JlLmNyZWF0ZUluZGV4KGlkeC5uYW1lLCBpZHgua2V5UGF0aCwgeyB1bmlxdWU6IGlkeC51bmlxdWUsIG11bHRpRW50cnk6IGlkeC5tdWx0aSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgICAgRGV4aWUgUHJvdGVjdGVkIEFQSVxuICAgICAgICAvL1xuICAgICAgICAvL1xuXG4gICAgICAgIHRoaXMuX2FsbFRhYmxlcyA9IGFsbFRhYmxlcztcblxuICAgICAgICB0aGlzLl90YWJsZUZhY3RvcnkgPSBmdW5jdGlvbiBjcmVhdGVUYWJsZShtb2RlLCB0YWJsZVNjaGVtYSwgdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeSkge1xuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwidGFibGVTY2hlbWFcIiB0eXBlPVwiVGFibGVTY2hlbWFcIj48L3BhcmFtPlxuICAgICAgICAgICAgaWYgKG1vZGUgPT09IFJFQURPTkxZKVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVGFibGUodGFibGVTY2hlbWEubmFtZSwgdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeSwgdGFibGVTY2hlbWEsIENvbGxlY3Rpb24pO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgV3JpdGVhYmxlVGFibGUodGFibGVTY2hlbWEubmFtZSwgdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeSwgdGFibGVTY2hlbWEpO1xuICAgICAgICB9OyBcblxuICAgICAgICB0aGlzLl9jcmVhdGVUcmFuc2FjdGlvbiA9IGZ1bmN0aW9uIChtb2RlLCBzdG9yZU5hbWVzLCBkYnNjaGVtYSwgcGFyZW50VHJhbnNhY3Rpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24obW9kZSwgc3RvcmVOYW1lcywgZGJzY2hlbWEsIHBhcmVudFRyYW5zYWN0aW9uKTtcbiAgICAgICAgfTsgXG5cbiAgICAgICAgZnVuY3Rpb24gdGFibGVOb3RJblRyYW5zYWN0aW9uKG1vZGUsIHN0b3JlTmFtZXMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRhYmxlIFwiICsgc3RvcmVOYW1lc1swXSArIFwiIG5vdCBwYXJ0IG9mIHRyYW5zYWN0aW9uLiBPcmlnaW5hbCBTY29wZSBGdW5jdGlvbiBTb3VyY2U6IFwiICsgRGV4aWUuUHJvbWlzZS5QU0QudHJhbnMuc2NvcGVGdW5jLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fdHJhbnNQcm9taXNlRmFjdG9yeSA9IGZ1bmN0aW9uIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnkobW9kZSwgc3RvcmVOYW1lcywgZm4pIHsgLy8gTGFzdCBhcmd1bWVudCBpcyBcIndyaXRlTG9ja2VkXCIuIEJ1dCB0aGlzIGRvZXNudCBhcHBseSB0byBvbmVzaG90IGRpcmVjdCBkYiBvcGVyYXRpb25zLCBzbyB3ZSBpZ25vcmUgaXQuXG4gICAgICAgICAgICBpZiAoZGJfaXNfYmxvY2tlZCAmJiAoIVByb21pc2UuUFNEIHx8ICFQcm9taXNlLlBTRC5sZXRUaHJvdWdoKSkge1xuICAgICAgICAgICAgICAgIC8vIERhdGFiYXNlIGlzIHBhdXNlZC4gV2FpdCB0aWwgcmVzdW1lZC5cbiAgICAgICAgICAgICAgICB2YXIgYmxvY2tlZFByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdXNlZFJlc3VtZWFibGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBkYi5fdHJhbnNQcm9taXNlRmFjdG9yeShtb2RlLCBzdG9yZU5hbWVzLCBmbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tlZFByb21pc2Uub251bmNhdGNoZWQgPSBwLm9udW5jYXRjaGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYmxvY2tlZFByb21pc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciB0cmFucyA9IGRiLl9jcmVhdGVUcmFuc2FjdGlvbihtb2RlLCBzdG9yZU5hbWVzLCBnbG9iYWxTY2hlbWEpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cmFucy5fcHJvbWlzZShtb2RlLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFuIHVuY2F0Y2hlZCBvcGVyYXRpb24gd2lsbCBidWJibGUgdG8gdGhpcyBhbm9ueW1vdXMgdHJhbnNhY3Rpb24uIE1ha2Ugc3VyZVxuICAgICAgICAgICAgICAgICAgICAvLyB0byBjb250aW51ZSBidWJibGluZyBpdCB1cCB0byBkYi5vbignZXJyb3InKTpcbiAgICAgICAgICAgICAgICAgICAgdHJhbnMuZXJyb3IoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGIub24oJ2Vycm9yJykuZmlyZShlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZm4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnN0ZWFkIG9mIHJlc29sdmluZyB2YWx1ZSBkaXJlY3RseSwgd2FpdCB3aXRoIHJlc29sdmluZyBpdCB1bnRpbCB0cmFuc2FjdGlvbiBoYXMgY29tcGxldGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHRoZSBkYXRhIHdvdWxkIG5vdCBiZSBpbiB0aGUgREIgaWYgcmVxdWVzdGluZyBpdCBpbiB0aGUgdGhlbigpIG9wZXJhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNwZWNpZmljYWxseSwgdG8gZW5zdXJlIHRoYXQgdGhlIGZvbGxvd2luZyBleHByZXNzaW9uIHdpbGwgd29yazpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgIGRiLmZyaWVuZHMucHV0KHtuYW1lOiBcIkFybmVcIn0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgZGIuZnJpZW5kcy53aGVyZShcIm5hbWVcIikuZXF1YWxzKFwiQXJuZVwiKS5jb3VudChmdW5jdGlvbihjb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgIGFzc2VydCAoY291bnQgPT09IDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLmNvbXBsZXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QsIHRyYW5zKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTsgXG5cbiAgICAgICAgdGhpcy5fd2hlblJlYWR5ID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBpZiAoIWZha2UgJiYgZGJfaXNfYmxvY2tlZCAmJiAoIVByb21pc2UuUFNEIHx8ICFQcm9taXNlLlBTRC5sZXRUaHJvdWdoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdXNlZFJlc3VtZWFibGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZm4pO1xuICAgICAgICB9OyBcblxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgIERleGllIEFQSVxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuXG4gICAgICAgIHRoaXMudmVybm8gPSAwO1xuXG4gICAgICAgIHRoaXMub3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGZha2UpIHJlc29sdmUoZGIpO1xuICAgICAgICAgICAgICAgIGlmIChpZGJkYiB8fCBpc0JlaW5nT3BlbmVkKSB0aHJvdyBuZXcgRXJyb3IoXCJEYXRhYmFzZSBhbHJlYWR5IG9wZW5lZCBvciBiZWluZyBvcGVuZWRcIik7XG4gICAgICAgICAgICAgICAgdmFyIHJlcSwgZGJXYXNDcmVhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gb3BlbkVycm9yKGVycikge1xuICAgICAgICAgICAgICAgICAgICB0cnkgeyByZXEudHJhbnNhY3Rpb24uYWJvcnQoKTsgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICAgICAgICAgIC8qaWYgKGRiV2FzQ3JlYXRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgaXNzdWUgd2l0aCBzb21lIGJyb3dzZXJzLiBTZWVtIG5vdCB0byBiZSBuZWVkZWQgdGhvdWdoLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVW5pdCB0ZXN0IFwiSXNzdWUjMTAwIC0gbm90IGFsbCBpbmRleGVzIGFyZSBjcmVhdGVkXCIgd29ya3Mgd2l0aG91dCBpdCBvbiBjaHJvbWUsRkYsb3BlcmEgYW5kIElFLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWRiZGIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ZWREQi5kZWxldGVEYXRhYmFzZShkYi5uYW1lKTsgXG4gICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICBpc0JlaW5nT3BlbmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGRiT3BlbkVycm9yID0gZXJyO1xuICAgICAgICAgICAgICAgICAgICBkYl9pc19ibG9ja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChkYk9wZW5FcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHBhdXNlZFJlc3VtZWFibGVzLmZvckVhY2goZnVuY3Rpb24gKHJlc3VtYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVzdW1lIGFsbCBzdGFsbGVkIG9wZXJhdGlvbnMuIFRoZXkgd2lsbCBmYWlsIG9uY2UgdGhleSB3YWtlIHVwLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdW1hYmxlLnJlc3VtZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcGF1c2VkUmVzdW1lYWJsZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgZGJPcGVuRXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpc0JlaW5nT3BlbmVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgY2FsbGVyIGhhcyBzcGVjaWZpZWQgYXQgbGVhc3Qgb25lIHZlcnNpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZlcnNpb25zLmxlbmd0aCA+IDApIGF1dG9TY2hlbWEgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBNdWx0aXBseSBkYi52ZXJubyB3aXRoIDEwIHdpbGwgYmUgbmVlZGVkIHRvIHdvcmthcm91bmQgdXBncmFkaW5nIGJ1ZyBpbiBJRTogXG4gICAgICAgICAgICAgICAgICAgIC8vIElFIGZhaWxzIHdoZW4gZGVsZXRpbmcgb2JqZWN0U3RvcmUgYWZ0ZXIgcmVhZGluZyBmcm9tIGl0LlxuICAgICAgICAgICAgICAgICAgICAvLyBBIGZ1dHVyZSB2ZXJzaW9uIG9mIERleGllLmpzIHdpbGwgc3RvcG92ZXIgYW4gaW50ZXJtZWRpYXRlIHZlcnNpb24gdG8gd29ya2Fyb3VuZCB0aGlzLlxuICAgICAgICAgICAgICAgICAgICAvLyBBdCB0aGF0IHBvaW50LCB3ZSB3YW50IHRvIGJlIGJhY2t3YXJkIGNvbXBhdGlibGUuIENvdWxkIGhhdmUgYmVlbiBtdWx0aXBsaWVkIHdpdGggMiwgYnV0IGJ5IHVzaW5nIDEwLCBpdCBpcyBlYXNpZXIgdG8gbWFwIHRoZSBudW1iZXIgdG8gdGhlIHJlYWwgdmVyc2lvbiBudW1iZXIuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5kZXhlZERCKSB0aHJvdyBuZXcgRXJyb3IoXCJpbmRleGVkREIgQVBJIG5vdCBmb3VuZC4gSWYgdXNpbmcgSUUxMCssIG1ha2Ugc3VyZSB0byBydW4geW91ciBjb2RlIG9uIGEgc2VydmVyIFVSTCAobm90IGxvY2FsbHkpLiBJZiB1c2luZyBTYWZhcmksIG1ha2Ugc3VyZSB0byBpbmNsdWRlIGluZGV4ZWREQiBwb2x5ZmlsbC5cIik7XG4gICAgICAgICAgICAgICAgICAgIHJlcSA9IGF1dG9TY2hlbWEgPyBpbmRleGVkREIub3BlbihkYk5hbWUpIDogaW5kZXhlZERCLm9wZW4oZGJOYW1lLCBNYXRoLnJvdW5kKGRiLnZlcm5vICogMTApKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXEpIHRocm93IG5ldyBFcnJvcihcIkluZGV4ZWREQiBBUEkgbm90IGF2YWlsYWJsZVwiKTsgLy8gTWF5IGhhcHBlbiBpbiBTYWZhcmkgcHJpdmF0ZSBtb2RlLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2RmYWhsYW5kZXIvRGV4aWUuanMvaXNzdWVzLzEzNCBcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIob3BlbkVycm9yLCBbXCJvcGVuaW5nIGRhdGFiYXNlXCIsIGRiTmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICByZXEub25ibG9ja2VkID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYi5vbihcImJsb2NrZWRcIikuZmlyZShldik7XG4gICAgICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgICAgICByZXEub251cGdyYWRlbmVlZGVkID0gdHJ5Y2F0Y2ggKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXV0b1NjaGVtYSAmJiAhZGIuX2FsbG93RW1wdHlEQikgeyAvLyBVbmxlc3MgYW4gYWRkb24gaGFzIHNwZWNpZmllZCBkYi5fYWxsb3dFbXB0eURCLCBsZXRzIG1ha2UgdGhlIGNhbGwgZmFpbC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsZXIgZGlkIG5vdCBzcGVjaWZ5IGEgdmVyc2lvbiBvciBzY2hlbWEuIERvaW5nIHRoYXQgaXMgb25seSBhY2NlcHRhYmxlIGZvciBvcGVuaW5nIGFscmVhZCBleGlzdGluZyBkYXRhYmFzZXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgb251cGdyYWRlbmVlZGVkIGlzIGNhbGxlZCBpdCBtZWFucyBkYXRhYmFzZSBkaWQgbm90IGV4aXN0LiBSZWplY3QgdGhlIG9wZW4oKSBwcm9taXNlIGFuZCBtYWtlIHN1cmUgdGhhdCB3ZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkbyBub3QgY3JlYXRlIGEgbmV3IGRhdGFiYXNlIGJ5IGFjY2lkZW50IGhlcmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZlbnQpIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgfTsgLy8gUHJvaGliaXQgb25hYm9ydCBlcnJvciBmcm9tIGZpcmluZyBiZWZvcmUgd2UncmUgZG9uZSFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEudHJhbnNhY3Rpb24uYWJvcnQoKTsgLy8gQWJvcnQgdHJhbnNhY3Rpb24gKHdvdWxkIGhvcGUgdGhhdCB0aGlzIHdvdWxkIG1ha2UgREIgZGlzYXBwZWFyIGJ1dCBpdCBkb2VzbnQuKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsb3NlIGRhdGFiYXNlIGFuZCBkZWxldGUgaXQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLnJlc3VsdC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWxyZXEgPSBpbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoZGJOYW1lKTsgLy8gVGhlIHVwZ3JhZGUgdHJhbnNhY3Rpb24gaXMgYXRvbWljLCBhbmQgamF2YXNjcmlwdCBpcyBzaW5nbGUgdGhyZWFkZWQgLSBtZWFuaW5nIHRoYXQgdGhlcmUgaXMgbm8gcmlzayB0aGF0IHdlIGRlbGV0ZSBzb21lb25lIGVsc2VzIGRhdGFiYXNlIGhlcmUhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVscmVxLm9uc3VjY2VzcyA9IGRlbHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRXJyb3IobmV3IEVycm9yKFwiRGF0YWJhc2UgJ1wiICsgZGJOYW1lICsgXCInIGRvZXNudCBleGlzdFwiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLm9sZFZlcnNpb24gPT09IDApIGRiV2FzQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLnRyYW5zYWN0aW9uLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIob3BlbkVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkVmVyID0gZS5vbGRWZXJzaW9uID4gTWF0aC5wb3coMiwgNjIpID8gMCA6IGUub2xkVmVyc2lvbjsgLy8gU2FmYXJpIDggZml4LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1blVwZ3JhZGVycyhvbGRWZXIgLyAxMCwgcmVxLnRyYW5zYWN0aW9uLCBvcGVuRXJyb3IsIHJlcSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIG9wZW5FcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSB0cnljYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNCZWluZ09wZW5lZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWRiZGIgPSByZXEucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dG9TY2hlbWEpIHJlYWRHbG9iYWxTY2hlbWEoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGlkYmRiLm9iamVjdFN0b3JlTmFtZXMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3RUb0V4aXN0aW5nSW5kZXhOYW1lcyhnbG9iYWxTY2hlbWEsIGlkYmRiLnRyYW5zYWN0aW9uKHNhZmFyaU11bHRpU3RvcmVGaXgoaWRiZGIub2JqZWN0U3RvcmVOYW1lcyksIFJFQURPTkxZKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZGJkYi5vbnZlcnNpb25jaGFuZ2UgPSBkYi5vbihcInZlcnNpb25jaGFuZ2VcIikuZmlyZTsgLy8gTm90IGZpcmluZyBpdCBoZXJlLCBqdXN0IHNldHRpbmcgdGhlIGZ1bmN0aW9uIGNhbGxiYWNrIHRvIGFueSByZWdpc3RlcmVkIHN1YnNjcmliZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc05hdGl2ZUdldERhdGFiYXNlTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgbG9jYWxTdG9yYWdlIHdpdGggbGlzdCBvZiBkYXRhYmFzZSBuYW1lc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsb2JhbERhdGFiYXNlTGlzdChmdW5jdGlvbiAoZGF0YWJhc2VOYW1lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YWJhc2VOYW1lcy5pbmRleE9mKGRiTmFtZSkgPT09IC0xKSByZXR1cm4gZGF0YWJhc2VOYW1lcy5wdXNoKGRiTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOb3csIGxldCBhbnkgc3Vic2NyaWJlcnMgdG8gdGhlIG9uKFwicmVhZHlcIikgZmlyZSBCRUZPUkUgYW55IG90aGVyIGRiIG9wZXJhdGlvbnMgcmVzdW1lIVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgYW4gdGhlIG9uKFwicmVhZHlcIikgc3Vic2NyaWJlciByZXR1cm5zIGEgUHJvbWlzZSwgd2Ugd2lsbCB3YWl0IHRpbCBwcm9taXNlIGNvbXBsZXRlcyBvciByZWplY3RzIGJlZm9yZSBcbiAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UubmV3UFNEKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLlBTRC5sZXRUaHJvdWdoID0gdHJ1ZTsgLy8gU2V0IGEgUHJvbWlzZS1TcGVjaWZpYyBEYXRhIHByb3BlcnR5IGluZm9ybWluZyB0aGF0IG9ucmVhZHkgaXMgZmlyaW5nLiBUaGlzIHdpbGwgbWFrZSBkYi5fd2hlblJlYWR5KCkgbGV0IHRoZSBzdWJzY3JpYmVycyB1c2UgdGhlIERCIGJ1dCBibG9jayBhbGwgb3RoZXJzICghKS4gUXVpdGUgY29vbCBoYT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzID0gZGIub24ucmVhZHkuZmlyZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzICYmIHR5cGVvZiByZXMudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgb24oJ3JlYWR5JykgcmV0dXJucyBhIHByb21pc2UsIHdhaXQgZm9yIGl0IHRvIGNvbXBsZXRlIGFuZCB0aGVuIHJlc3VtZSBhbnkgcGVuZGluZyBvcGVyYXRpb25zLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnRoZW4ocmVzdW1lLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRiZGIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGJkYiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzYXAocmVzdW1lKTsgLy8gQ2Fubm90IGNhbGwgcmVzdW1lIGRpcmVjdGx5IGJlY2F1c2UgdGhlbiB0aGUgcGF1c2VSZXN1bWFibGVzIHdvdWxkIGluaGVyaXQgZnJvbSBvdXIgUFNEIHNjb3BlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVzdW1lKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYl9pc19ibG9ja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdXNlZFJlc3VtZWFibGVzLmZvckVhY2goZnVuY3Rpb24gKHJlc3VtYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgYW55b25lIGhhcyBtYWRlIG9wZXJhdGlvbnMgb24gYSB0YWJsZSBpbnN0YW5jZSBiZWZvcmUgdGhlIGRiIHdhcyBvcGVuZWQsIHRoZSBvcGVyYXRpb25zIHdpbGwgc3RhcnQgZXhlY3V0aW5nIG5vdy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VtYWJsZS5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdXNlZFJlc3VtZWFibGVzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCBvcGVuRXJyb3IpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBvcGVuRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTsgXG5cbiAgICAgICAgdGhpcy5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChpZGJkYikge1xuICAgICAgICAgICAgICAgIGlkYmRiLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgaWRiZGIgPSBudWxsO1xuICAgICAgICAgICAgICAgIGRiX2lzX2Jsb2NrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGRiT3BlbkVycm9yID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTsgXG5cbiAgICAgICAgdGhpcy5kZWxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gMCkgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnRzIG5vdCBhbGxvd2VkIGluIGRiLmRlbGV0ZSgpXCIpO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGRvRGVsZXRlKCkge1xuICAgICAgICAgICAgICAgICAgICBkYi5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVxID0gaW5kZXhlZERCLmRlbGV0ZURhdGFiYXNlKGRiTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc05hdGl2ZUdldERhdGFiYXNlTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbG9iYWxEYXRhYmFzZUxpc3QoZnVuY3Rpb24oZGF0YWJhc2VOYW1lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcG9zID0gZGF0YWJhc2VOYW1lcy5pbmRleE9mKGRiTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb3MgPj0gMCkgcmV0dXJuIGRhdGFiYXNlTmFtZXMuc3BsaWNlKHBvcywgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgW1wiZGVsZXRpbmdcIiwgZGJOYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbmJsb2NrZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRiLm9uKFwiYmxvY2tlZFwiKS5maXJlKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpc0JlaW5nT3BlbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdXNlZFJlc3VtZWFibGVzLnB1c2goeyByZXN1bWU6IGRvRGVsZXRlIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRvRGVsZXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07IFxuXG4gICAgICAgIHRoaXMuYmFja2VuZERCID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGlkYmRiO1xuICAgICAgICB9OyBcblxuICAgICAgICB0aGlzLmlzT3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpZGJkYiAhPT0gbnVsbDtcbiAgICAgICAgfTsgXG4gICAgICAgIHRoaXMuaGFzRmFpbGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRiT3BlbkVycm9yICE9PSBudWxsO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmR5bmFtaWNhbGx5T3BlbmVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gYXV0b1NjaGVtYTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qdGhpcy5kYmcgPSBmdW5jdGlvbiAoY29sbGVjdGlvbiwgY291bnRlcikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9kYmdSZXN1bHQgfHwgIXRoaXMuX2RiZ1Jlc3VsdFtjb3VudGVyXSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29sbGVjdGlvbiA9PT0gJ3N0cmluZycpIGNvbGxlY3Rpb24gPSB0aGlzLnRhYmxlKGNvbGxlY3Rpb24pLnRvQ29sbGVjdGlvbigpLmxpbWl0KDEwMCk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9kYmdSZXN1bHQpIHRoaXMuX2RiZ1Jlc3VsdCA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBkYiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgbmV3IFByb21pc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBQcm9taXNlLlBTRC5sZXRUaHJvdWdoID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZGIuX2RiZ1Jlc3VsdFtjb3VudGVyXSA9IGNvbGxlY3Rpb24udG9BcnJheSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RiZ1Jlc3VsdFtjb3VudGVyXS5fdmFsdWU7XG4gICAgICAgIH0qL1xuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFByb3BlcnRpZXNcbiAgICAgICAgLy9cbiAgICAgICAgdGhpcy5uYW1lID0gZGJOYW1lO1xuXG4gICAgICAgIC8vIGRiLnRhYmxlcyAtIGFuIGFycmF5IG9mIGFsbCBUYWJsZSBpbnN0YW5jZXMuXG4gICAgICAgIC8vIFRPRE86IENoYW5nZSBzbyB0aGF0IHRhYmxlcyBpcyBhIHNpbXBsZSBtZW1iZXIgYW5kIG1ha2Ugc3VyZSB0byB1cGRhdGUgaXQgd2hlbmV2ZXIgYWxsVGFibGVzIGNoYW5nZXMuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInRhYmxlc1wiLCB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cIkFycmF5XCIgZWxlbWVudFR5cGU9XCJXcml0ZWFibGVUYWJsZVwiIC8+XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGFsbFRhYmxlcykubWFwKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBhbGxUYWJsZXNbbmFtZV07IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvL1xuICAgICAgICAvLyBFdmVudHNcbiAgICAgICAgLy9cbiAgICAgICAgdGhpcy5vbiA9IGV2ZW50cyh0aGlzLCBcImVycm9yXCIsIFwicG9wdWxhdGVcIiwgXCJibG9ja2VkXCIsIHsgXCJyZWFkeVwiOiBbcHJvbWlzYWJsZUNoYWluLCBub3BdLCBcInZlcnNpb25jaGFuZ2VcIjogW3JldmVyc2VTdG9wcGFibGVFdmVudENoYWluLCBub3BdIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZSBvbigncmVhZHknKSBzcGVjaWZpY2FsbHk6IElmIERCIGlzIGFscmVhZHkgb3BlbiwgdHJpZ2dlciB0aGUgZXZlbnQgaW1tZWRpYXRlbHkuIEFsc28sIGRlZmF1bHQgdG8gdW5zdWJzY3JpYmUgaW1tZWRpYXRlbHkgYWZ0ZXIgYmVpbmcgdHJpZ2dlcmVkLlxuICAgICAgICB0aGlzLm9uLnJlYWR5LnN1YnNjcmliZSA9IG92ZXJyaWRlKHRoaXMub24ucmVhZHkuc3Vic2NyaWJlLCBmdW5jdGlvbiAob3JpZ1N1YnNjcmliZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdWJzY3JpYmVyLCBiU3RpY2t5KSB7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcHJveHkgKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJTdGlja3kpIGRiLm9uLnJlYWR5LnVuc3Vic2NyaWJlKHByb3h5KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1YnNjcmliZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3JpZ1N1YnNjcmliZS5jYWxsKHRoaXMsIHByb3h5KTtcbiAgICAgICAgICAgICAgICBpZiAoZGIuaXNPcGVuKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRiX2lzX2Jsb2NrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdXNlZFJlc3VtZWFibGVzLnB1c2goeyByZXN1bWU6IHByb3h5IH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJveHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZha2VBdXRvQ29tcGxldGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZGIub24oXCJwb3B1bGF0ZVwiKS5maXJlKGRiLl9jcmVhdGVUcmFuc2FjdGlvbihSRUFEV1JJVEUsIGRiU3RvcmVOYW1lcywgZ2xvYmFsU2NoZW1hKSk7XG4gICAgICAgICAgICBkYi5vbihcImVycm9yXCIpLmZpcmUobmV3IEVycm9yKCkpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9uID0gZnVuY3Rpb24gKG1vZGUsIHRhYmxlSW5zdGFuY2VzLCBzY29wZUZ1bmMpIHtcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgICAgIC8vLyBcbiAgICAgICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJtb2RlXCIgdHlwZT1cIlN0cmluZ1wiPlwiclwiIGZvciByZWFkb25seSwgb3IgXCJyd1wiIGZvciByZWFkd3JpdGU8L3BhcmFtPlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwidGFibGVJbnN0YW5jZXNcIj5UYWJsZSBpbnN0YW5jZSwgQXJyYXkgb2YgVGFibGUgaW5zdGFuY2VzLCBTdHJpbmcgb3IgU3RyaW5nIEFycmF5IG9mIG9iamVjdCBzdG9yZXMgdG8gaW5jbHVkZSBpbiB0aGUgdHJhbnNhY3Rpb248L3BhcmFtPlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwic2NvcGVGdW5jXCIgdHlwZT1cIkZ1bmN0aW9uXCI+RnVuY3Rpb24gdG8gZXhlY3V0ZSB3aXRoIHRyYW5zYWN0aW9uPC9wYXJhbT5cblxuICAgICAgICAgICAgLy8gTGV0IHRhYmxlIGFyZ3VtZW50cyBiZSBhbGwgYXJndW1lbnRzIGJldHdlZW4gbW9kZSBhbmQgbGFzdCBhcmd1bWVudC5cbiAgICAgICAgICAgIHRhYmxlSW5zdGFuY2VzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEsIGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIC8vIExldCBzY29wZUZ1bmMgYmUgdGhlIGxhc3QgYXJndW1lbnRcbiAgICAgICAgICAgIHNjb3BlRnVuYyA9IGFyZ3VtZW50c1thcmd1bWVudHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICB2YXIgcGFyZW50VHJhbnNhY3Rpb24gPSBQcm9taXNlLlBTRCAmJiBQcm9taXNlLlBTRC50cmFucztcblx0XHRcdC8vIENoZWNrIGlmIHBhcmVudCB0cmFuc2FjdGlvbnMgaXMgYm91bmQgdG8gdGhpcyBkYiBpbnN0YW5jZSwgYW5kIGlmIGNhbGxlciB3YW50cyB0byByZXVzZSBpdFxuICAgICAgICAgICAgaWYgKCFwYXJlbnRUcmFuc2FjdGlvbiB8fCBwYXJlbnRUcmFuc2FjdGlvbi5kYiAhPT0gZGIgfHwgbW9kZS5pbmRleE9mKCchJykgIT09IC0xKSBwYXJlbnRUcmFuc2FjdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB2YXIgb25seUlmQ29tcGF0aWJsZSA9IG1vZGUuaW5kZXhPZignPycpICE9PSAtMTtcbiAgICAgICAgICAgIG1vZGUgPSBtb2RlLnJlcGxhY2UoJyEnLCAnJykucmVwbGFjZSgnPycsICcnKTtcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBHZXQgc3RvcmVOYW1lcyBmcm9tIGFyZ3VtZW50cy4gRWl0aGVyIHRocm91Z2ggZ2l2ZW4gdGFibGUgaW5zdGFuY2VzLCBvciB0aHJvdWdoIGdpdmVuIHRhYmxlIG5hbWVzLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIHZhciB0YWJsZXMgPSBBcnJheS5pc0FycmF5KHRhYmxlSW5zdGFuY2VzWzBdKSA/IHRhYmxlSW5zdGFuY2VzLnJlZHVjZShmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5jb25jYXQoYik7IH0pIDogdGFibGVJbnN0YW5jZXM7XG4gICAgICAgICAgICB2YXIgZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgdmFyIHN0b3JlTmFtZXMgPSB0YWJsZXMubWFwKGZ1bmN0aW9uICh0YWJsZUluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0YWJsZUluc3RhbmNlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0YWJsZUluc3RhbmNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKHRhYmxlSW5zdGFuY2UgaW5zdGFuY2VvZiBUYWJsZSkpIGVycm9yID0gZXJyb3IgfHwgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgdHlwZS4gQXJndW1lbnRzIGZvbGxvd2luZyBtb2RlIG11c3QgYmUgaW5zdGFuY2VzIG9mIFRhYmxlIG9yIFN0cmluZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhYmxlSW5zdGFuY2UubmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFJlc29sdmUgbW9kZS4gQWxsb3cgc2hvcnRjdXRzIFwiclwiIGFuZCBcInJ3XCIuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgaWYgKG1vZGUgPT0gXCJyXCIgfHwgbW9kZSA9PSBSRUFET05MWSlcbiAgICAgICAgICAgICAgICBtb2RlID0gUkVBRE9OTFk7XG4gICAgICAgICAgICBlbHNlIGlmIChtb2RlID09IFwicndcIiB8fCBtb2RlID09IFJFQURXUklURSlcbiAgICAgICAgICAgICAgICBtb2RlID0gUkVBRFdSSVRFO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKFwiSW52YWxpZCB0cmFuc2FjdGlvbiBtb2RlOiBcIiArIG1vZGUpO1xuXG4gICAgICAgICAgICBpZiAocGFyZW50VHJhbnNhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAvLyBCYXNpYyBjaGVja3NcbiAgICAgICAgICAgICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnRUcmFuc2FjdGlvbiAmJiBwYXJlbnRUcmFuc2FjdGlvbi5tb2RlID09PSBSRUFET05MWSAmJiBtb2RlID09PSBSRUFEV1JJVEUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbmx5SWZDb21wYXRpYmxlKSBwYXJlbnRUcmFuc2FjdGlvbiA9IG51bGw7IC8vIFNwYXduIG5ldyB0cmFuc2FjdGlvbiBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBlcnJvciA9IGVycm9yIHx8IG5ldyBFcnJvcihcIkNhbm5vdCBlbnRlciBhIHN1Yi10cmFuc2FjdGlvbiB3aXRoIFJFQURXUklURSBtb2RlIHdoZW4gcGFyZW50IHRyYW5zYWN0aW9uIGlzIFJFQURPTkxZXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnRUcmFuc2FjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmVOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChzdG9yZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmVudFRyYW5zYWN0aW9uLnRhYmxlcy5oYXNPd25Qcm9wZXJ0eShzdG9yZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbmx5SWZDb21wYXRpYmxlKSBwYXJlbnRUcmFuc2FjdGlvbiA9IG51bGw7IC8vIFNwYXduIG5ldyB0cmFuc2FjdGlvbiBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGVycm9yID0gZXJyb3IgfHwgbmV3IEVycm9yKFwiVGFibGUgXCIgKyBzdG9yZU5hbWUgKyBcIiBub3QgaW5jbHVkZWQgaW4gcGFyZW50IHRyYW5zYWN0aW9uLiBQYXJlbnQgVHJhbnNhY3Rpb24gZnVuY3Rpb246IFwiICsgcGFyZW50VHJhbnNhY3Rpb24uc2NvcGVGdW5jLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhcmVudFRyYW5zYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHN1Yi10cmFuc2FjdGlvbiwgbG9jayB0aGUgcGFyZW50IGFuZCB0aGVuIGxhdW5jaCB0aGUgc3ViLXRyYW5zYWN0aW9uLlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnRUcmFuc2FjdGlvbi5fcHJvbWlzZShtb2RlLCBlbnRlclRyYW5zYWN0aW9uU2NvcGUsIFwibG9ja1wiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHJvb3QtbGV2ZWwgdHJhbnNhY3Rpb24sIHdhaXQgdGlsIGRhdGFiYXNlIGlzIHJlYWR5IGFuZCB0aGVuIGxhdW5jaCB0aGUgdHJhbnNhY3Rpb24uXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLl93aGVuUmVhZHkoZW50ZXJUcmFuc2FjdGlvblNjb3BlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZnVuY3Rpb24gZW50ZXJUcmFuc2FjdGlvblNjb3BlKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIC8vIE91ciB0cmFuc2FjdGlvbi4gVG8gYmUgc2V0IGxhdGVyLlxuICAgICAgICAgICAgICAgIHZhciB0cmFucyA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaHJvdyBhbnkgZXJyb3IgaWYgYW55IG9mIHRoZSBhYm92ZSBjaGVja3MgZmFpbGVkLlxuICAgICAgICAgICAgICAgICAgICAvLyBSZWFsIGVycm9yIGRlZmluZWQgc29tZSBsaW5lcyB1cC4gV2UgdGhyb3cgaXQgaGVyZSBmcm9tIHdpdGhpbiBhIFByb21pc2UgdG8gcmVqZWN0IFByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgLy8gcmF0aGVyIHRoYW4gbWFrZSBjYWxsZXIgbmVlZCB0byBib3RoIHVzZSB0cnkuLmNhdGNoIGFuZCBwcm9taXNlIGNhdGNoaW5nLiBUaGUgcmVhc29uIHdlIHN0aWxsXG4gICAgICAgICAgICAgICAgICAgIC8vIHRocm93IGhlcmUgcmF0aGVyIHRoYW4gZG8gUHJvbWlzZS5yZWplY3QoZXJyb3IpIGlzIHRoYXQgd2UgbGlrZSB0byBoYXZlIHRoZSBzdGFjayBhdHRhY2hlZCB0byB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gZXJyb3IuIEFsc28gYmVjYXVzZSB0aGVyZSBpcyBhIGNhdGNoKCkgY2xhdXNlIGJvdW5kIHRvIHRoaXMgdHJ5KCkgdGhhdCB3aWxsIGJ1YmJsZSB0aGUgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gdGhlIHBhcmVudCB0cmFuc2FjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcjtcblxuICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgVHJhbnNhY3Rpb24gaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgdHJhbnMgPSBkYi5fY3JlYXRlVHJhbnNhY3Rpb24obW9kZSwgc3RvcmVOYW1lcywgZ2xvYmFsU2NoZW1hLCBwYXJlbnRUcmFuc2FjdGlvbik7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUHJvdmlkZSBhcmd1bWVudHMgdG8gdGhlIHNjb3BlIGZ1bmN0aW9uIChmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSlcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhYmxlQXJncyA9IHN0b3JlTmFtZXMubWFwKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiB0cmFucy50YWJsZXNbbmFtZV07IH0pO1xuICAgICAgICAgICAgICAgICAgICB0YWJsZUFyZ3MucHVzaCh0cmFucyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdHJhbnNhY3Rpb24gY29tcGxldGVzLCByZXNvbHZlIHRoZSBQcm9taXNlIHdpdGggdGhlIHJldHVybiB2YWx1ZSBvZiBzY29wZUZ1bmMuXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXR1cm5WYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVuY29tcGxldGVkUmVxdWVzdHMgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBQU0QgZnJhbWUgdG8gaG9sZCBQcm9taXNlLlBTRC50cmFucy4gTXVzdCBub3QgYmUgYm91bmQgdG8gdGhlIGN1cnJlbnQgUFNEIGZyYW1lIHNpbmNlIHdlIHdhbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgdG8gcG9wIGJlZm9yZSB0aGVuKCkgY2FsbGJhY2sgaXMgY2FsbGVkIG9mIG91ciByZXR1cm5lZCBQcm9taXNlLlxuICAgICAgICAgICAgICAgICAgICBQcm9taXNlLm5ld1BTRChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBMZXQgdGhlIHRyYW5zYWN0aW9uIGluc3RhbmNlIGJlIHBhcnQgb2YgYSBQcm9taXNlLXNwZWNpZmljIGRhdGEgKFBTRCkgdmFsdWUuXG4gICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLlBTRC50cmFucyA9IHRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuc2NvcGVGdW5jID0gc2NvcGVGdW5jOyAvLyBGb3IgRXJyb3IgKFwiVGFibGUgXCIgKyBzdG9yZU5hbWVzWzBdICsgXCIgbm90IHBhcnQgb2YgdHJhbnNhY3Rpb25cIikgd2hlbiBpdCBoYXBwZW5zLiBUaGlzIG1heSBoZWxwIGxvY2FsaXppbmcgdGhlIGNvZGUgdGhhdCBzdGFydGVkIGEgdHJhbnNhY3Rpb24gdXNlZCBvbiBhbm90aGVyIHBsYWNlLlxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50VHJhbnNhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFbXVsYXRlIHRyYW5zYWN0aW9uIGNvbW1pdCBhd2FyZW5lc3MgZm9yIGlubmVyIHRyYW5zYWN0aW9uIChtdXN0ICdjb21taXQnIHdoZW4gdGhlIGlubmVyIHRyYW5zYWN0aW9uIGhhcyBubyBtb3JlIG9wZXJhdGlvbnMgb25nb2luZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5pZGJ0cmFucyA9IHBhcmVudFRyYW5zYWN0aW9uLmlkYnRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLl9wcm9taXNlID0gb3ZlcnJpZGUodHJhbnMuX3Byb21pc2UsIGZ1bmN0aW9uIChvcmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAobW9kZSwgZm4sIHdyaXRlTG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyt1bmNvbXBsZXRlZFJlcXVlc3RzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcHJveHkoZm4yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJldHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gX3Jvb3RFeGVjIG5lZWRlZCBzbyB0aGF0IHdlIGRvIG5vdCBsb29zZSBhbnkgSURCVHJhbnNhY3Rpb24gaW4gYSBzZXRUaW1lb3V0KCkgY2FsbC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5fcm9vdEV4ZWMoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dmFsID0gZm4yKHZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBfdGlja0ZpbmFsaXplIG1ha2VzIHN1cmUgdG8gc3VwcG9ydCBsYXp5IG1pY3JvIHRhc2tzIGV4ZWN1dGVkIGluIFByb21pc2UuX3Jvb3RFeGVjKCkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBjZXJ0YWlubHkgZG8gbm90IHdhbnQgdG8gY29weSB0aGUgYmFkIHBhdHRlcm4gZnJvbSBJbmRleGVkREIgYnV0IGluc3RlYWQgYWxsb3dcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4ZWN1dGlvbiBvZiBQcm9taXNlLnRoZW4oKSBjYWxsYmFja3MgdW50aWwgdGhlJ3JlIGFsbCBkb25lLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5fdGlja0ZpbmFsaXplKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoLS11bmNvbXBsZXRlZFJlcXVlc3RzID09PSAwICYmIHRyYW5zLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMub24uY29tcGxldGUuZmlyZSgpOyAvLyBBIGNhbGxlZCBkYiBvcGVyYXRpb24gaGFzIGNvbXBsZXRlZCB3aXRob3V0IHN0YXJ0aW5nIGEgbmV3IG9wZXJhdGlvbi4gVGhlIGZsb3cgaXMgZmluaXNoZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9yaWcuY2FsbCh0aGlzLCBtb2RlLCBmdW5jdGlvbiAocmVzb2x2ZTIsIHJlamVjdDIsIHRyYW5zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuKHByb3h5KHJlc29sdmUyKSwgcHJveHkocmVqZWN0MiksIHRyYW5zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHdyaXRlTG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5jb21wbGV0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXR1cm5WYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRyYW5zYWN0aW9uIGZhaWxzLCByZWplY3QgdGhlIFByb21pc2UgYW5kIGJ1YmJsZSB0byBkYiBpZiBub29uZSBjYXRjaGVkIHRoaXMgcmVqZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuZXJyb3IoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnMuaWRidHJhbnMpIHRyYW5zLmlkYnRyYW5zLm9uZXJyb3IgPSBwcmV2ZW50RGVmYXVsdDsgLy8gUHJvaGliaXQgQWJvcnRFcnJvciBmcm9tIGZpcmluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge3RyYW5zLmFib3J0KCk7fSBjYXRjaChlMil7fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnRUcmFuc2FjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRUcmFuc2FjdGlvbi5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VHJhbnNhY3Rpb24ub24uZXJyb3IuZmlyZShlKTsgLy8gQnViYmxlIHRvIHBhcmVudCB0cmFuc2FjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2F0Y2hlZCA9IHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmVudFRyYW5zYWN0aW9uICYmICFjYXRjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRiLm9uLmVycm9yLmZpcmUoZSk7Ly8gSWYgbm90IGNhdGNoZWQsIGJ1YmJsZSBlcnJvciB0byBkYi5vbihcImVycm9yXCIpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5hbGx5LCBjYWxsIHRoZSBzY29wZSBmdW5jdGlvbiB3aXRoIG91ciB0YWJsZSBhbmQgdHJhbnNhY3Rpb24gYXJndW1lbnRzLlxuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5fcm9vdEV4ZWMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBzY29wZUZ1bmMuYXBwbHkodHJhbnMsIHRhYmxlQXJncyk7IC8vIE5PVEU6IHJldHVyblZhbHVlIGlzIHVzZWQgaW4gdHJhbnMub24uY29tcGxldGUoKSBub3QgYXMgYSByZXR1cm5WYWx1ZSB0byB0aGlzIGZ1bmMuXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHJhbnMuaWRidHJhbnMgfHwgKHBhcmVudFRyYW5zYWN0aW9uICYmIHVuY29tcGxldGVkUmVxdWVzdHMgPT09IDApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5fbm9wKCk7IC8vIE1ha2Ugc3VyZSB0cmFuc2FjdGlvbiBpcyBiZWluZyB1c2VkIHNvIHRoYXQgaXQgd2lsbCByZXNvbHZlLlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBleGNlcHRpb24gb2NjdXIsIGFib3J0IHRoZSB0cmFuc2FjdGlvbiBhbmQgcmVqZWN0IFByb21pc2UuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFucyAmJiB0cmFucy5pZGJ0cmFucykgdHJhbnMuaWRidHJhbnMub25lcnJvciA9IHByZXZlbnREZWZhdWx0OyAvLyBQcm9oaWJpdCBBYm9ydEVycm9yIGZyb20gZmlyaW5nLlxuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnMpIHRyYW5zLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnRUcmFuc2FjdGlvbikgcGFyZW50VHJhbnNhY3Rpb24ub24uZXJyb3IuZmlyZShlKTtcbiAgICAgICAgICAgICAgICAgICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOZWVkIHRvIHVzZSBhc2FwKD1zZXRJbW1lZGlhdGUvc2V0VGltZW91dCkgYmVmb3JlIGNhbGxpbmcgcmVqZWN0IGJlY2F1c2Ugd2UgYXJlIGluIHRoZSBQcm9taXNlIGNvbnN0cnVjdG9yIGFuZCByZWplY3QoKSB3aWxsIGFsd2F5cyByZXR1cm4gZmFsc2UgaWYgc28uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlamVjdChlKSkgZGIub24oXCJlcnJvclwiKS5maXJlKGUpOyAvLyBJZiBub3QgY2F0Y2hlZCwgYnViYmxlIGV4Y2VwdGlvbiB0byBkYi5vbihcImVycm9yXCIpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07IFxuXG4gICAgICAgIHRoaXMudGFibGUgPSBmdW5jdGlvbiAodGFibGVOYW1lKSB7XG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cIldyaXRlYWJsZVRhYmxlXCI+PC9yZXR1cm5zPlxuICAgICAgICAgICAgaWYgKGZha2UgJiYgYXV0b1NjaGVtYSkgcmV0dXJuIG5ldyBXcml0ZWFibGVUYWJsZSh0YWJsZU5hbWUpO1xuICAgICAgICAgICAgaWYgKCFhbGxUYWJsZXMuaGFzT3duUHJvcGVydHkodGFibGVOYW1lKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJUYWJsZSBkb2VzIG5vdCBleGlzdFwiKTsgcmV0dXJuIHsgQU5fVU5LTk9XTl9UQUJMRV9OQU1FX1dBU19TUEVDSUZJRUQ6IDEgfTsgfVxuICAgICAgICAgICAgcmV0dXJuIGFsbFRhYmxlc1t0YWJsZU5hbWVdO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRhYmxlIENsYXNzXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIGZ1bmN0aW9uIFRhYmxlKG5hbWUsIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnksIHRhYmxlU2NoZW1hLCBjb2xsQ2xhc3MpIHtcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm5hbWVcIiB0eXBlPVwiU3RyaW5nXCI+PC9wYXJhbT5cbiAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICB0aGlzLnNjaGVtYSA9IHRhYmxlU2NoZW1hO1xuICAgICAgICAgICAgdGhpcy5ob29rID0gYWxsVGFibGVzW25hbWVdID8gYWxsVGFibGVzW25hbWVdLmhvb2sgOiBldmVudHMobnVsbCwge1xuICAgICAgICAgICAgICAgIFwiY3JlYXRpbmdcIjogW2hvb2tDcmVhdGluZ0NoYWluLCBub3BdLFxuICAgICAgICAgICAgICAgIFwicmVhZGluZ1wiOiBbcHVyZUZ1bmN0aW9uQ2hhaW4sIG1pcnJvcl0sXG4gICAgICAgICAgICAgICAgXCJ1cGRhdGluZ1wiOiBbaG9va1VwZGF0aW5nQ2hhaW4sIG5vcF0sXG4gICAgICAgICAgICAgICAgXCJkZWxldGluZ1wiOiBbbm9uU3RvcHBhYmxlRXZlbnRDaGFpbiwgbm9wXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl90cGYgPSB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5O1xuICAgICAgICAgICAgdGhpcy5fY29sbENsYXNzID0gY29sbENsYXNzIHx8IENvbGxlY3Rpb247XG4gICAgICAgIH1cblxuICAgICAgICBleHRlbmQoVGFibGUucHJvdG90eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBmYWlsUmVhZG9ubHkoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3VycmVudCBUcmFuc2FjdGlvbiBpcyBSRUFET05MWVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBUYWJsZSBQcm90ZWN0ZWQgTWV0aG9kc1xuICAgICAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgICAgICBfdHJhbnM6IGZ1bmN0aW9uIGdldFRyYW5zYWN0aW9uKG1vZGUsIGZuLCB3cml0ZUxvY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fdHBmKG1vZGUsIFt0aGlzLm5hbWVdLCBmbiwgd3JpdGVMb2NrZWQpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2lkYnN0b3JlOiBmdW5jdGlvbiBnZXRJREJPYmplY3RTdG9yZShtb2RlLCBmbiwgd3JpdGVMb2NrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZha2UpIHJldHVybiBuZXcgUHJvbWlzZShmbik7IC8vIFNpbXBsaWZ5IHRoZSB3b3JrIGZvciBJbnRlbGxpc2Vuc2UvQ29kZSBjb21wbGV0aW9uLlxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl90cGYobW9kZSwgW3RoaXMubmFtZV0sIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIHRyYW5zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbihyZXNvbHZlLCByZWplY3QsIHRyYW5zLmlkYnRyYW5zLm9iamVjdFN0b3JlKHNlbGYubmFtZSksIHRyYW5zKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgd3JpdGVMb2NrZWQpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8vIFRhYmxlIFB1YmxpYyBNZXRob2RzXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXksIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lkYnN0b3JlKFJFQURPTkxZLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmFrZSAmJiByZXNvbHZlKHNlbGYuc2NoZW1hLmluc3RhbmNlVGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcSA9IGlkYnN0b3JlLmdldChrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBbXCJnZXR0aW5nXCIsIGtleSwgXCJmcm9tXCIsIHNlbGYubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNlbGYuaG9vay5yZWFkaW5nLmZpcmUocmVxLnJlc3VsdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSkudGhlbihjYik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3aGVyZTogZnVuY3Rpb24gKGluZGV4TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFdoZXJlQ2xhdXNlKHRoaXMsIGluZGV4TmFtZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb3VudDogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvQ29sbGVjdGlvbigpLmNvdW50KGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9mZnNldDogZnVuY3Rpb24gKG9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50b0NvbGxlY3Rpb24oKS5vZmZzZXQob2Zmc2V0KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGxpbWl0OiBmdW5jdGlvbiAobnVtUm93cykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50b0NvbGxlY3Rpb24oKS5saW1pdChudW1Sb3dzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJldmVyc2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9Db2xsZWN0aW9uKCkucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmlsdGVyOiBmdW5jdGlvbiAoZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9Db2xsZWN0aW9uKCkuYW5kKGZpbHRlckZ1bmN0aW9uKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVhY2g6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGZha2UgJiYgZm4oc2VsZi5zY2hlbWEuaW5zdGFuY2VUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pZGJzdG9yZShSRUFET05MWSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXEgPSBpZGJzdG9yZS5vcGVuQ3Vyc29yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIFtcImNhbGxpbmdcIiwgXCJUYWJsZS5lYWNoKClcIiwgXCJvblwiLCBzZWxmLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGUocmVxLCBudWxsLCBmbiwgcmVzb2x2ZSwgcmVqZWN0LCBzZWxmLmhvb2sucmVhZGluZy5maXJlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0b0FycmF5OiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faWRic3RvcmUoUkVBRE9OTFksIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmYWtlICYmIHJlc29sdmUoW3NlbGYuc2NoZW1hLmluc3RhbmNlVGVtcGxhdGVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVxID0gaWRic3RvcmUub3BlbkN1cnNvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBbXCJjYWxsaW5nXCIsIFwiVGFibGUudG9BcnJheSgpXCIsIFwib25cIiwgc2VsZi5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRlKHJlcSwgbnVsbCwgZnVuY3Rpb24gKGl0ZW0pIHsgYS5wdXNoKGl0ZW0pOyB9LCBmdW5jdGlvbiAoKSB7IHJlc29sdmUoYSk7IH0sIHJlamVjdCwgc2VsZi5ob29rLnJlYWRpbmcuZmlyZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oY2IpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3JkZXJCeTogZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5fY29sbENsYXNzKG5ldyBXaGVyZUNsYXVzZSh0aGlzLCBpbmRleCkpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICB0b0NvbGxlY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLl9jb2xsQ2xhc3MobmV3IFdoZXJlQ2xhdXNlKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbWFwVG9DbGFzczogZnVuY3Rpb24gKGNvbnN0cnVjdG9yLCBzdHJ1Y3R1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAvLy8gICAgIE1hcCB0YWJsZSB0byBhIGphdmFzY3JpcHQgY29uc3RydWN0b3IgZnVuY3Rpb24uIE9iamVjdHMgcmV0dXJuZWQgZnJvbSB0aGUgZGF0YWJhc2Ugd2lsbCBiZSBpbnN0YW5jZXMgb2YgdGhpcyBjbGFzcywgbWFraW5nXG4gICAgICAgICAgICAgICAgICAgIC8vLyAgICAgaXQgcG9zc2libGUgdG8gdGhlIGluc3RhbmNlT2Ygb3BlcmF0b3IgYXMgd2VsbCBhcyBleHRlbmRpbmcgdGhlIGNsYXNzIHVzaW5nIGNvbnN0cnVjdG9yLnByb3RvdHlwZS5tZXRob2QgPSBmdW5jdGlvbigpey4uLn0uXG4gICAgICAgICAgICAgICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNvbnN0cnVjdG9yXCI+Q29uc3RydWN0b3IgZnVuY3Rpb24gcmVwcmVzZW50aW5nIHRoZSBjbGFzcy48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJzdHJ1Y3R1cmVcIiBvcHRpb25hbD1cInRydWVcIj5IZWxwcyBJREUgY29kZSBjb21wbGV0aW9uIGJ5IGtub3dpbmcgdGhlIG1lbWJlcnMgdGhhdCBvYmplY3RzIGNvbnRhaW4gYW5kIG5vdCBqdXN0IHRoZSBpbmRleGVzLiBBbHNvXG4gICAgICAgICAgICAgICAgICAgIC8vLyBrbm93IHdoYXQgdHlwZSBlYWNoIG1lbWJlciBoYXMuIEV4YW1wbGU6IHtuYW1lOiBTdHJpbmcsIGVtYWlsQWRkcmVzc2VzOiBbU3RyaW5nXSwgcGFzc3dvcmR9PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2hlbWEubWFwcGVkQ2xhc3MgPSBjb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluc3RhbmNlVGVtcGxhdGUgPSBPYmplY3QuY3JlYXRlKGNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJ1Y3R1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN0cnVjdHVyZSBhbmQgaW5zdGFuY2VUZW1wbGF0ZSBpcyBmb3IgSURFIGNvZGUgY29tcGV0aW9uIG9ubHkgd2hpbGUgY29uc3RydWN0b3IucHJvdG90eXBlIGlzIGZvciBhY3R1YWwgaW5oZXJpdGFuY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVN0cnVjdHVyZShpbnN0YW5jZVRlbXBsYXRlLCBzdHJ1Y3R1cmUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NoZW1hLmluc3RhbmNlVGVtcGxhdGUgPSBpbnN0YW5jZVRlbXBsYXRlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vdywgc3Vic2NyaWJlIHRvIHRoZSB3aGVuKFwicmVhZGluZ1wiKSBldmVudCB0byBtYWtlIGFsbCBvYmplY3RzIHRoYXQgY29tZSBvdXQgZnJvbSB0aGlzIHRhYmxlIGluaGVyaXQgZnJvbSBnaXZlbiBjbGFzc1xuICAgICAgICAgICAgICAgICAgICAvLyBubyBtYXR0ZXIgd2hpY2ggbWV0aG9kIHRvIHVzZSBmb3IgcmVhZGluZyAoVGFibGUuZ2V0KCkgb3IgVGFibGUud2hlcmUoLi4uKS4uLiApXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWFkSG9vayA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb2JqKSByZXR1cm4gb2JqOyAvLyBObyB2YWxpZCBvYmplY3QuIChWYWx1ZSBpcyBudWxsKS4gUmV0dXJuIGFzIGlzLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IG9iamVjdCB0aGF0IGRlcml2ZXMgZnJvbSBjb25zdHJ1Y3RvcjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXMgPSBPYmplY3QuY3JlYXRlKGNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDbG9uZSBtZW1iZXJzOlxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSBpbiBvYmopIGlmIChvYmouaGFzT3duUHJvcGVydHkobSkpIHJlc1ttXSA9IG9ialttXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2NoZW1hLnJlYWRIb29rKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhvb2sucmVhZGluZy51bnN1YnNjcmliZSh0aGlzLnNjaGVtYS5yZWFkSG9vayk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2hlbWEucmVhZEhvb2sgPSByZWFkSG9vaztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ob29rKFwicmVhZGluZ1wiLCByZWFkSG9vayk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRlZmluZUNsYXNzOiBmdW5jdGlvbiAoc3RydWN0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgLy8vICAgICBEZWZpbmUgYWxsIG1lbWJlcnMgb2YgdGhlIGNsYXNzIHRoYXQgcmVwcmVzZW50cyB0aGUgdGFibGUuIFRoaXMgd2lsbCBoZWxwIGNvZGUgY29tcGxldGlvbiBvZiB3aGVuIG9iamVjdHMgYXJlIHJlYWQgZnJvbSB0aGUgZGF0YWJhc2VcbiAgICAgICAgICAgICAgICAgICAgLy8vICAgICBhcyB3ZWxsIGFzIG1ha2luZyBpdCBwb3NzaWJsZSB0byBleHRlbmQgdGhlIHByb3RvdHlwZSBvZiB0aGUgcmV0dXJuZWQgY29uc3RydWN0b3IgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInN0cnVjdHVyZVwiPkhlbHBzIElERSBjb2RlIGNvbXBsZXRpb24gYnkga25vd2luZyB0aGUgbWVtYmVycyB0aGF0IG9iamVjdHMgY29udGFpbiBhbmQgbm90IGp1c3QgdGhlIGluZGV4ZXMuIEFsc29cbiAgICAgICAgICAgICAgICAgICAgLy8vIGtub3cgd2hhdCB0eXBlIGVhY2ggbWVtYmVyIGhhcy4gRXhhbXBsZToge25hbWU6IFN0cmluZywgZW1haWxBZGRyZXNzZXM6IFtTdHJpbmddLCBwcm9wZXJ0aWVzOiB7c2hvZVNpemU6IE51bWJlcn19PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFwVG9DbGFzcyhEZXhpZS5kZWZpbmVDbGFzcyhzdHJ1Y3R1cmUpLCBzdHJ1Y3R1cmUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYWRkOiBmYWlsUmVhZG9ubHksXG4gICAgICAgICAgICAgICAgcHV0OiBmYWlsUmVhZG9ubHksXG4gICAgICAgICAgICAgICAgJ2RlbGV0ZSc6IGZhaWxSZWFkb25seSxcbiAgICAgICAgICAgICAgICBjbGVhcjogZmFpbFJlYWRvbmx5LFxuICAgICAgICAgICAgICAgIHVwZGF0ZTogZmFpbFJlYWRvbmx5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyBXcml0ZWFibGVUYWJsZSBDbGFzcyAoZXh0ZW5kcyBUYWJsZSlcbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgZnVuY3Rpb24gV3JpdGVhYmxlVGFibGUobmFtZSwgdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeSwgdGFibGVTY2hlbWEsIGNvbGxDbGFzcykge1xuICAgICAgICAgICAgVGFibGUuY2FsbCh0aGlzLCBuYW1lLCB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5LCB0YWJsZVNjaGVtYSwgY29sbENsYXNzIHx8IFdyaXRlYWJsZUNvbGxlY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVyaXZlKFdyaXRlYWJsZVRhYmxlKS5mcm9tKFRhYmxlKS5leHRlbmQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhZGQ6IGZ1bmN0aW9uIChvYmosIGtleSkge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgIC8vLyAgIEFkZCBhbiBvYmplY3QgdG8gdGhlIGRhdGFiYXNlLiBJbiBjYXNlIGFuIG9iamVjdCB3aXRoIHNhbWUgcHJpbWFyeSBrZXkgYWxyZWFkeSBleGlzdHMsIHRoZSBvYmplY3Qgd2lsbCBub3QgYmUgYWRkZWQuXG4gICAgICAgICAgICAgICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm9ialwiIHR5cGU9XCJPYmplY3RcIj5BIGphdmFzY3JpcHQgb2JqZWN0IHRvIGluc2VydDwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImtleVwiIG9wdGlvbmFsPVwidHJ1ZVwiPlByaW1hcnkga2V5PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRpbmdIb29rID0gdGhpcy5ob29rLmNyZWF0aW5nLmZpcmU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pZGJzdG9yZShSRUFEV1JJVEUsIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlLCB0cmFucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNDdHggPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjcmVhdGluZ0hvb2sgIT09IG5vcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlZmZlY3RpdmVLZXkgPSBrZXkgfHwgKGlkYnN0b3JlLmtleVBhdGggPyBnZXRCeUtleVBhdGgob2JqLCBpZGJzdG9yZS5rZXlQYXRoKSA6IHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleVRvVXNlID0gY3JlYXRpbmdIb29rLmNhbGwodGhpc0N0eCwgZWZmZWN0aXZlS2V5LCBvYmosIHRyYW5zKTsgLy8gQWxsb3cgc3Vic2NyaWJlcnMgdG8gd2hlbihcImNyZWF0aW5nXCIpIHRvIGdlbmVyYXRlIHRoZSBrZXkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVmZmVjdGl2ZUtleSA9PT0gdW5kZWZpbmVkICYmIGtleVRvVXNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlkYnN0b3JlLmtleVBhdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRCeUtleVBhdGgob2JqLCBpZGJzdG9yZS5rZXlQYXRoLCBrZXlUb1VzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9IGtleVRvVXNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVxID0ga2V5ID8gaWRic3RvcmUuYWRkKG9iaiwga2V5KSA6IGlkYnN0b3JlLmFkZChvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzQ3R4Lm9uZXJyb3IpIHRoaXNDdHgub25lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBbXCJhZGRpbmdcIiwgb2JqLCBcImludG9cIiwgc2VsZi5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5UGF0aCA9IGlkYnN0b3JlLmtleVBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXlQYXRoKSBzZXRCeUtleVBhdGgob2JqLCBrZXlQYXRoLCBldi50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXNDdHgub25zdWNjZXNzKSB0aGlzQ3R4Lm9uc3VjY2Vzcyhldi50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgLyp9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMub24oXCJlcnJvclwiKS5maXJlKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSovXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBwdXQ6IGZ1bmN0aW9uIChvYmosIGtleSkge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgIC8vLyAgIEFkZCBhbiBvYmplY3QgdG8gdGhlIGRhdGFiYXNlIGJ1dCBpbiBjYXNlIGFuIG9iamVjdCB3aXRoIHNhbWUgcHJpbWFyeSBrZXkgYWxyZWFkIGV4aXN0cywgdGhlIGV4aXN0aW5nIG9uZSB3aWxsIGdldCB1cGRhdGVkLlxuICAgICAgICAgICAgICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJvYmpcIiB0eXBlPVwiT2JqZWN0XCI+QSBqYXZhc2NyaXB0IG9iamVjdCB0byBpbnNlcnQgb3IgdXBkYXRlPC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwia2V5XCIgb3B0aW9uYWw9XCJ0cnVlXCI+UHJpbWFyeSBrZXk8L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGluZ0hvb2sgPSB0aGlzLmhvb2suY3JlYXRpbmcuZmlyZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0aW5nSG9vayA9IHRoaXMuaG9vay51cGRhdGluZy5maXJlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3JlYXRpbmdIb29rICE9PSBub3AgfHwgdXBkYXRpbmdIb29rICE9PSBub3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQZW9wbGUgbGlzdGVucyB0byB3aGVuKFwiY3JlYXRpbmdcIikgb3Igd2hlbihcInVwZGF0aW5nXCIpIGV2ZW50cyFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIG11c3Qga25vdyB3aGV0aGVyIHRoZSBwdXQgb3BlcmF0aW9uIHJlc3VsdHMgaW4gYW4gQ1JFQVRFIG9yIFVQREFURS5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fdHJhbnMoUkVBRFdSSVRFLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCB0cmFucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpbmNlIGtleSBpcyBvcHRpb25hbCwgbWFrZSBzdXJlIHdlIGdldCBpdCBmcm9tIG9iaiBpZiBub3QgcHJvdmlkZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWZmZWN0aXZlS2V5ID0ga2V5IHx8IChzZWxmLnNjaGVtYS5wcmltS2V5LmtleVBhdGggJiYgZ2V0QnlLZXlQYXRoKG9iaiwgc2VsZi5zY2hlbWEucHJpbUtleS5rZXlQYXRoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVmZmVjdGl2ZUtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIHByaW1hcnkga2V5LiBNdXN0IHVzZSBhZGQoKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMudGFibGVzW3NlbGYubmFtZV0uYWRkKG9iaikudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByaW1hcnkga2V5IGV4aXN0LiBMb2NrIHRyYW5zYWN0aW9uIGFuZCB0cnkgbW9kaWZ5aW5nIGV4aXN0aW5nLiBJZiBub3RoaW5nIG1vZGlmaWVkLCBjYWxsIGFkZCgpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5fbG9jaygpOyAvLyBOZWVkZWQgYmVjYXVzZSBvcGVyYXRpb24gaXMgc3BsaXR0ZWQgaW50byBtb2RpZnkoKSBhbmQgYWRkKCkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNsb25lIG9iaiBiZWZvcmUgdGhpcyBhc3luYyBjYWxsLiBJZiBjYWxsZXIgbW9kaWZpZXMgb2JqIHRoZSBsaW5lIGFmdGVyIHB1dCgpLCB0aGUgSURCIHNwZWMgcmVxdWlyZXMgdGhhdCBpdCBzaG91bGQgbm90IGFmZmVjdCBvcGVyYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IGRlZXBDbG9uZShvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFucy50YWJsZXNbc2VsZi5uYW1lXS53aGVyZShcIjppZFwiKS5lcXVhbHMoZWZmZWN0aXZlS2V5KS5tb2RpZnkoZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXBsYWNlIGV4dGlzdGluZyB2YWx1ZSB3aXRoIG91ciBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENSVUQgZXZlbnQgZmlyaW5nIGhhbmRsZWQgaW4gV3JpdGVhYmxlQ29sbGVjdGlvbi5tb2RpZnkoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IG9iajtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9iamVjdCdzIGtleSB3YXMgbm90IGZvdW5kLiBBZGQgdGhlIG9iamVjdCBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENSVUQgZXZlbnQgZmlyaW5nIHdpbGwgYmUgZG9uZSBpbiBhZGQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmFucy50YWJsZXNbc2VsZi5uYW1lXS5hZGQob2JqLCBrZXkpOyAvLyBSZXNvbHZpbmcgd2l0aCBhbm90aGVyIFByb21pc2UuIFJldHVybmVkIFByb21pc2Ugd2lsbCB0aGVuIHJlc29sdmUgd2l0aCB0aGUgbmV3IGtleS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVmZmVjdGl2ZUtleTsgLy8gUmVzb2x2ZSB3aXRoIHRoZSBwcm92aWRlZCBrZXkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuX3VubG9jaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIHN0YW5kYXJkIElEQiBwdXQoKSBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faWRic3RvcmUoUkVBRFdSSVRFLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXEgPSBrZXkgPyBpZGJzdG9yZS5wdXQob2JqLCBrZXkpIDogaWRic3RvcmUucHV0KG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBbXCJwdXR0aW5nXCIsIG9iaiwgXCJpbnRvXCIsIHNlbGYubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleVBhdGggPSBpZGJzdG9yZS5rZXlQYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5UGF0aCkgc2V0QnlLZXlQYXRoKG9iaiwga2V5UGF0aCwgZXYudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICdkZWxldGUnOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImtleVwiPlByaW1hcnkga2V5IG9mIHRoZSBvYmplY3QgdG8gZGVsZXRlPC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaG9vay5kZWxldGluZy5zdWJzY3JpYmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBlb3BsZSBsaXN0ZW5zIHRvIHdoZW4oXCJkZWxldGluZ1wiKSBldmVudC4gTXVzdCBpbXBsZW1lbnQgZGVsZXRlIHVzaW5nIFdyaXRlYWJsZUNvbGxlY3Rpb24uZGVsZXRlKCkgdGhhdCB3aWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWxsIHRoZSBDUlVEIGV2ZW50LiBPbmx5IFdyaXRlYWJsZUNvbGxlY3Rpb24uZGVsZXRlKCkgd2lsbCBrbm93IHdoZXRoZXIgYW4gb2JqZWN0IHdhcyBhY3R1YWxseSBkZWxldGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2hlcmUoXCI6aWRcIikuZXF1YWxzKGtleSkuZGVsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBvbmUgbGlzdGVucy4gVXNlIHN0YW5kYXJkIElEQiBkZWxldGUoKSBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faWRic3RvcmUoUkVBRFdSSVRFLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXEgPSBpZGJzdG9yZS5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIFtcImRlbGV0aW5nXCIsIGtleSwgXCJmcm9tXCIsIGlkYnN0b3JlLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGNsZWFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhvb2suZGVsZXRpbmcuc3Vic2NyaWJlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQZW9wbGUgbGlzdGVucyB0byB3aGVuKFwiZGVsZXRpbmdcIikgZXZlbnQuIE11c3QgaW1wbGVtZW50IGRlbGV0ZSB1c2luZyBXcml0ZWFibGVDb2xsZWN0aW9uLmRlbGV0ZSgpIHRoYXQgd2lsbFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FsbCB0aGUgQ1JVRCBldmVudC4gT25seSBXcml0ZWFibGVDb2xsZWN0aW9uLmRlbGV0ZSgpIHdpbGwga25vd3Mgd2hpY2ggb2JqZWN0cyB0aGF0IGFyZSBhY3R1YWxseSBkZWxldGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9Db2xsZWN0aW9uKCkuZGVsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faWRic3RvcmUoUkVBRFdSSVRFLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXEgPSBpZGJzdG9yZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgW1wiY2xlYXJpbmdcIiwgaWRic3RvcmUubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgdXBkYXRlOiBmdW5jdGlvbiAoa2V5T3JPYmplY3QsIG1vZGlmaWNhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtb2RpZmljYXRpb25zICE9PSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KG1vZGlmaWNhdGlvbnMpKSB0aHJvdyBuZXcgRXJyb3IoXCJkYi51cGRhdGUoa2V5T3JPYmplY3QsIG1vZGlmaWNhdGlvbnMpLiBtb2RpZmljYXRpb25zIG11c3QgYmUgYW4gb2JqZWN0LlwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXlPck9iamVjdCA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoa2V5T3JPYmplY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvYmplY3QgdG8gbW9kaWZ5LiBBbHNvIG1vZGlmeSBnaXZlbiBvYmplY3Qgd2l0aCB0aGUgbW9kaWZpY2F0aW9uczpcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKG1vZGlmaWNhdGlvbnMpLmZvckVhY2goZnVuY3Rpb24gKGtleVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRCeUtleVBhdGgoa2V5T3JPYmplY3QsIGtleVBhdGgsIG1vZGlmaWNhdGlvbnNba2V5UGF0aF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gZ2V0QnlLZXlQYXRoKGtleU9yT2JqZWN0LCB0aGlzLnNjaGVtYS5wcmltS2V5LmtleVBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJPYmplY3QgZG9lcyBub3QgY29udGFpbiBpdHMgcHJpbWFyeSBrZXlcIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2hlcmUoXCI6aWRcIikuZXF1YWxzKGtleSkubW9kaWZ5KG1vZGlmaWNhdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8ga2V5IHRvIG1vZGlmeVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2hlcmUoXCI6aWRcIikuZXF1YWxzKGtleU9yT2JqZWN0KS5tb2RpZnkobW9kaWZpY2F0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVHJhbnNhY3Rpb24gQ2xhc3NcbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgZnVuY3Rpb24gVHJhbnNhY3Rpb24obW9kZSwgc3RvcmVOYW1lcywgZGJzY2hlbWEsIHBhcmVudCkge1xuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAgICAgLy8vICAgIFRyYW5zYWN0aW9uIGNsYXNzLiBSZXByZXNlbnRzIGEgZGF0YWJhc2UgdHJhbnNhY3Rpb24uIEFsbCBvcGVyYXRpb25zIG9uIGRiIGdvZXMgdGhyb3VnaCBhIFRyYW5zYWN0aW9uLlxuICAgICAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm1vZGVcIiB0eXBlPVwiU3RyaW5nXCI+QW55IG9mIFwicmVhZHdyaXRlXCIgb3IgXCJyZWFkb25seVwiPC9wYXJhbT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInN0b3JlTmFtZXNcIiB0eXBlPVwiQXJyYXlcIj5BcnJheSBvZiB0YWJsZSBuYW1lcyB0byBvcGVyYXRlIG9uPC9wYXJhbT5cbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgICAgIHRoaXMubW9kZSA9IG1vZGU7XG4gICAgICAgICAgICB0aGlzLnN0b3JlTmFtZXMgPSBzdG9yZU5hbWVzO1xuICAgICAgICAgICAgdGhpcy5pZGJ0cmFucyA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLm9uID0gZXZlbnRzKHRoaXMsIFtcImNvbXBsZXRlXCIsIFwiZXJyb3JcIl0sIFwiYWJvcnRcIik7XG4gICAgICAgICAgICB0aGlzLl9yZWN1bG9jayA9IDA7XG4gICAgICAgICAgICB0aGlzLl9ibG9ja2VkRnVuY3MgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3BzZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9kYnNjaGVtYSA9IGRic2NoZW1hO1xuICAgICAgICAgICAgaWYgKHBhcmVudCkgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgICAgICB0aGlzLl90cGYgPSB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5O1xuICAgICAgICAgICAgdGhpcy50YWJsZXMgPSBPYmplY3QuY3JlYXRlKG5vdEluVHJhbnNGYWxsYmFja1RhYmxlcyk7IC8vIC4uLnNvIHRoYXQgYWxsIG5vbi1pbmNsdWRlZCB0YWJsZXMgZXhpc3RzIGFzIGluc3RhbmNlcyAocG9zc2libGUgdG8gY2FsbCB0YWJsZS5uYW1lIGZvciBleGFtcGxlKSBidXQgd2lsbCBmYWlsIGFzIHNvb24gYXMgdHJ5aW5nIHRvIGV4ZWN1dGUgYSBxdWVyeSBvbiBpdC5cblxuICAgICAgICAgICAgZnVuY3Rpb24gdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeShtb2RlLCBzdG9yZU5hbWVzLCBmbiwgd3JpdGVMb2NrZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGVzIGEgUHJvbWlzZSBpbnN0YW5jZSBhbmQgY2FsbHMgZm4gKHJlc29sdmUsIHJlamVjdCwgdHJhbnMpIHdoZXJlIHRyYW5zIGlzIHRoZSBpbnN0YW5jZSBvZiB0aGlzIHRyYW5zYWN0aW9uIG9iamVjdC5cbiAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IGZvciB3cml0ZS1sb2NraW5nIHRoZSB0cmFuc2FjdGlvbiBkdXJpbmcgdGhlIHByb21pc2UgbGlmZSB0aW1lIGZyb20gY3JlYXRpb24gdG8gc3VjY2Vzcy9mYWlsdXJlLlxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYWN0dWFsbHkgbm90IG5lZWRlZCB3aGVuIGp1c3QgdXNpbmcgc2luZ2xlIG9wZXJhdGlvbnMgb24gSURCLCBzaW5jZSBJREIgaW1wbGVtZW50cyB0aGlzIGludGVybmFsbHkuXG4gICAgICAgICAgICAgICAgLy8gSG93ZXZlciwgd2hlbiBpbXBsZW1lbnRpbmcgYSB3cml0ZSBvcGVyYXRpb24gYXMgYSBzZXJpZXMgb2Ygb3BlcmF0aW9ucyBvbiB0b3Agb2YgSURCKGNvbGxlY3Rpb24uZGVsZXRlKCkgYW5kIGNvbGxlY3Rpb24ubW9kaWZ5KCkgZm9yIGV4YW1wbGUpLFxuICAgICAgICAgICAgICAgIC8vIGxvY2sgaXMgaW5kZWVkIG5lZWRlZCBpZiBEZXhpZSBBUElzaG91bGQgYmVoYXZlIGluIGEgY29uc2lzdGVudCBtYW5uZXIgZm9yIHRoZSBBUEkgdXNlci5cbiAgICAgICAgICAgICAgICAvLyBBbm90aGVyIGV4YW1wbGUgb2YgdGhpcyBpcyBpZiB3ZSB3YW50IHRvIHN1cHBvcnQgY3JlYXRlL3VwZGF0ZS9kZWxldGUgZXZlbnRzLFxuICAgICAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gaW1wbGVtZW50IHB1dCgpIHVzaW5nIGEgc2VyaWVzIG9mIG90aGVyIElEQiBvcGVyYXRpb25zIGJ1dCBzdGlsbCBuZWVkIHRvIGxvY2sgdGhlIHRyYW5zYWN0aW9uIGFsbCB0aGUgd2F5LlxuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLl9wcm9taXNlKG1vZGUsIGZuLCB3cml0ZUxvY2tlZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBzdG9yZU5hbWVzLmxlbmd0aCAtIDE7IGkgIT09IC0xOyAtLWkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IHN0b3JlTmFtZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHRhYmxlID0gZGIuX3RhYmxlRmFjdG9yeShtb2RlLCBkYnNjaGVtYVtuYW1lXSwgdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeSk7XG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZXNbbmFtZV0gPSB0YWJsZTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXNbbmFtZV0pIHRoaXNbbmFtZV0gPSB0YWJsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4dGVuZChUcmFuc2FjdGlvbi5wcm90b3R5cGUsIHtcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUcmFuc2FjdGlvbiBQcm90ZWN0ZWQgTWV0aG9kcyAobm90IHJlcXVpcmVkIGJ5IEFQSSB1c2VycywgYnV0IG5lZWRlZCBpbnRlcm5hbGx5IGFuZCBldmVudHVhbGx5IGJ5IGRleGllIGV4dGVuc2lvbnMpXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICBfbG9jazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIFRlbXBvcmFyeSBzZXQgYWxsIHJlcXVlc3RzIGludG8gYSBwZW5kaW5nIHF1ZXVlIGlmIHRoZXkgYXJlIGNhbGxlZCBiZWZvcmUgZGF0YWJhc2UgaXMgcmVhZHkuXG4gICAgICAgICAgICAgICAgKyt0aGlzLl9yZWN1bG9jazsgLy8gUmVjdXJzaXZlIHJlYWQvd3JpdGUgbG9jayBwYXR0ZXJuIHVzaW5nIFBTRCAoUHJvbWlzZSBTcGVjaWZpYyBEYXRhKSBpbnN0ZWFkIG9mIFRMUyAoVGhyZWFkIExvY2FsIFN0b3JhZ2UpXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3JlY3Vsb2NrID09PSAxICYmIFByb21pc2UuUFNEKSBQcm9taXNlLlBTRC5sb2NrT3duZXJGb3IgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF91bmxvY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoLS10aGlzLl9yZWN1bG9jayA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoUHJvbWlzZS5QU0QpIFByb21pc2UuUFNELmxvY2tPd25lckZvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLl9ibG9ja2VkRnVuY3MubGVuZ3RoID4gMCAmJiAhdGhpcy5fbG9ja2VkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHRoaXMuX2Jsb2NrZWRGdW5jcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHsgZm4oKTsgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX2xvY2tlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIENoZWNrcyBpZiBhbnkgd3JpdGUtbG9jayBpcyBhcHBsaWVkIG9uIHRoaXMgdHJhbnNhY3Rpb24uXG4gICAgICAgICAgICAgICAgLy8gVG8gc2ltcGxpZnkgdGhlIERleGllIEFQSSBmb3IgZXh0ZW5zaW9uIGltcGxlbWVudGF0aW9ucywgd2Ugc3VwcG9ydCByZWN1cnNpdmUgbG9ja3MuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhY2NvbXBsaXNoZWQgYnkgdXNpbmcgXCJQcm9taXNlIFNwZWNpZmljIERhdGFcIiAoUFNEKS5cbiAgICAgICAgICAgICAgICAvLyBQU0QgZGF0YSBpcyBib3VuZCB0byBhIFByb21pc2UgYW5kIGFueSBjaGlsZCBQcm9taXNlIGVtaXR0ZWQgdGhyb3VnaCB0aGVuKCkgb3IgcmVzb2x2ZSggbmV3IFByb21pc2UoKSApLlxuICAgICAgICAgICAgICAgIC8vIFByb21pc2UuUFNEIGlzIGxvY2FsIHRvIGNvZGUgZXhlY3V0aW5nIG9uIHRvcCBvZiB0aGUgY2FsbCBzdGFja3Mgb2YgYW55IG9mIGFueSBjb2RlIGV4ZWN1dGVkIGJ5IFByb21pc2UoKTpcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICogY2FsbGJhY2sgZ2l2ZW4gdG8gdGhlIFByb21pc2UoKSBjb25zdHJ1Y3RvciAgKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3Qpey4uLn0pXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAqIGNhbGxiYWNrcyBnaXZlbiB0byB0aGVuKCkvY2F0Y2goKS9maW5hbGx5KCkgbWV0aG9kcyAoZnVuY3Rpb24gKHZhbHVlKXsuLi59KVxuICAgICAgICAgICAgICAgIC8vIElmIGNyZWF0aW5nIGEgbmV3IGluZGVwZW5kYW50IFByb21pc2UgaW5zdGFuY2UgZnJvbSB3aXRoaW4gYSBQcm9taXNlIGNhbGwgc3RhY2ssIHRoZSBuZXcgUHJvbWlzZSB3aWxsIGRlcml2ZSB0aGUgUFNEIGZyb20gdGhlIGNhbGwgc3RhY2sgb2YgdGhlIHBhcmVudCBQcm9taXNlLlxuICAgICAgICAgICAgICAgIC8vIERlcml2YXRpb24gaXMgZG9uZSBzbyB0aGF0IHRoZSBpbm5lciBQU0QgX19wcm90b19fIHBvaW50cyB0byB0aGUgb3V0ZXIgUFNELlxuICAgICAgICAgICAgICAgIC8vIFByb21pc2UuUFNELmxvY2tPd25lckZvciB3aWxsIHBvaW50IHRvIGN1cnJlbnQgdHJhbnNhY3Rpb24gb2JqZWN0IGlmIHRoZSBjdXJyZW50bHkgZXhlY3V0aW5nIFBTRCBzY29wZSBvd25zIHRoZSBsb2NrLlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWN1bG9jayAmJiAoIVByb21pc2UuUFNEIHx8IFByb21pc2UuUFNELmxvY2tPd25lckZvciAhPT0gdGhpcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX25vcDogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgLy8gQW4gYXN5bmNyb25pYyBuby1vcGVyYXRpb24gdGhhdCBtYXkgY2FsbCBnaXZlbiBjYWxsYmFjayB3aGVuIGRvbmUgZG9pbmcgbm90aGluZy4gQW4gYWx0ZXJuYXRpdmUgdG8gYXNhcCgpIGlmIHdlIG11c3Qgbm90IGxvc2UgdGhlIHRyYW5zYWN0aW9uLlxuICAgICAgICAgICAgICAgIHRoaXMudGFibGVzW3RoaXMuc3RvcmVOYW1lc1swXV0uZ2V0KDApLnRoZW4oY2IpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9wcm9taXNlOiBmdW5jdGlvbiAobW9kZSwgZm4sIGJXcml0ZUxvY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UubmV3UFNEKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcDtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVhZCBsb2NrIGFsd2F5c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbGYuX2xvY2tlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwID0gc2VsZi5hY3RpdmUgPyBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWxmLmlkYnRyYW5zICYmIG1vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpZGJkYikgdGhyb3cgZGJPcGVuRXJyb3IgPyBuZXcgRXJyb3IoXCJEYXRhYmFzZSBub3Qgb3Blbi4gRm9sbG93aW5nIGVycm9yIGluIHBvcHVsYXRlLCByZWFkeSBvciB1cGdyYWRlIGZ1bmN0aW9uIG1hZGUgRGV4aWUub3BlbigpIGZhaWw6IFwiICsgZGJPcGVuRXJyb3IpIDogbmV3IEVycm9yKFwiRGF0YWJhc2Ugbm90IG9wZW5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZGJ0cmFucyA9IHNlbGYuaWRidHJhbnMgPSBpZGJkYi50cmFuc2FjdGlvbihzYWZhcmlNdWx0aVN0b3JlRml4KHNlbGYuc3RvcmVOYW1lcyksIHNlbGYubW9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkYnRyYW5zLm9uZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbihcImVycm9yXCIpLmZpcmUoZSAmJiBlLnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7IC8vIFByb2hpYml0IGRlZmF1bHQgYnViYmxpbmcgdG8gd2luZG93LmVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmFib3J0KCk7IC8vIE1ha2Ugc3VyZSB0cmFuc2FjdGlvbiBpcyBhYm9ydGVkIHNpbmNlIHdlIHByZXZlbnREZWZhdWx0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRidHJhbnMub25hYm9ydCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXb3JrYXJvdW5kIGZvciBpc3N1ZSAjNzggLSBsb3cgZGlzayBzcGFjZSBvbiBjaHJvbWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmFib3J0IGlzIGNhbGxlZCBidXQgbmV2ZXIgb25lcnJvci4gQ2FsbCBvbmVycm9yIGV4cGxpY2l0ZWx5LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG8gdGhpcyBpbiBhIGZ1dHVyZSB0aWNrIHNvIHdlIGFsbG93IGRlZmF1bHQgb25lcnJvciB0byBleGVjdXRlIGJlZm9yZSBkb2luZyB0aGUgZmFsbGJhY2suXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc2FwKGZ1bmN0aW9uICgpIHsgc2VsZi5vbignZXJyb3InKS5maXJlKG5ldyBFcnJvcihcIlRyYW5zYWN0aW9uIGFib3J0ZWQgZm9yIHVua25vd24gcmVhc29uXCIpKTsgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9uKFwiYWJvcnRcIikuZmlyZShlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRidHJhbnMub25jb21wbGV0ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbihcImNvbXBsZXRlXCIpLmZpcmUoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYldyaXRlTG9jaykgc2VsZi5fbG9jaygpOyAvLyBXcml0ZSBsb2NrIGlmIHdyaXRlIG9wZXJhdGlvbiBpcyByZXF1ZXN0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbihyZXNvbHZlLCByZWplY3QsIHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlyZWN0IGV4Y2VwdGlvbiBoYXBwZW5lZCB3aGVuIGRvaW4gb3BlcmF0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBtdXN0IGltbWVkaWF0ZWx5IGZpcmUgdGhlIGVycm9yIGFuZCBhYm9ydCB0aGUgdHJhbnNhY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gdGhpcyBoYXBwZW5zIHdlIGFyZSBzdGlsbCBjb25zdHJ1Y3RpbmcgdGhlIFByb21pc2Ugc28gd2UgZG9uJ3QgeWV0IGtub3dcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2hldGhlciB0aGUgY2FsbGVyIGlzIGFib3V0IHRvIGNhdGNoKCkgdGhlIGVycm9yIG9yIG5vdC4gSGF2ZSB0byBtYWtlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRyYW5zYWN0aW9uIGZhaWwuIENhdGNoaW5nIHN1Y2ggYW4gZXJyb3Igd29udCBzdG9wIHRyYW5zYWN0aW9uIGZyb20gZmFpbGluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIGxpbWl0YXRpb24gd2UgaGF2ZSB0byBsaXZlIHdpdGguXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERleGllLmlnbm9yZVRyYW5zYWN0aW9uKGZ1bmN0aW9uICgpIHsgc2VsZi5vbignZXJyb3InKS5maXJlKGUpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkgOiBQcm9taXNlLnJlamVjdChzdGFjayhuZXcgRXJyb3IoXCJUcmFuc2FjdGlvbiBpcyBpbmFjdGl2ZS4gT3JpZ2luYWwgU2NvcGUgRnVuY3Rpb24gU291cmNlOiBcIiArIHNlbGYuc2NvcGVGdW5jLnRvU3RyaW5nKCkpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5hY3RpdmUgJiYgYldyaXRlTG9jaykgcC5maW5hbGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl91bmxvY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJhbnNhY3Rpb24gaXMgd3JpdGUtbG9ja2VkLiBXYWl0IGZvciBtdXRleC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fYmxvY2tlZEZ1bmNzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9wcm9taXNlKG1vZGUsIGZuLCBiV3JpdGVMb2NrKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwLm9udW5jYXRjaGVkID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJ1YmJsZSB0byB0cmFuc2FjdGlvbi4gRXZlbiB0aG91Z2ggSURCIGRvZXMgdGhpcyBpbnRlcm5hbGx5LCBpdCB3b3VsZCBqdXN0IGRvIGl0IGZvciBlcnJvciBldmVudHMgYW5kIG5vdCBmb3IgY2F1Z2h0IGV4Y2VwdGlvbnMuXG4gICAgICAgICAgICAgICAgICAgICAgICBEZXhpZS5pZ25vcmVUcmFuc2FjdGlvbihmdW5jdGlvbiAoKSB7IHNlbGYub24oXCJlcnJvclwiKS5maXJlKGUpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gVHJhbnNhY3Rpb24gUHVibGljIE1ldGhvZHNcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vbihcImNvbXBsZXRlXCIsIGNiKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub24oXCJlcnJvclwiLCBjYik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWJvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pZGJ0cmFucyAmJiB0aGlzLmFjdGl2ZSkgdHJ5IHsgLy8gVE9ETzogaWYgIXRoaXMuaWRidHJhbnMsIGVucXVldWUgYW4gYWJvcnQoKSBvcGVyYXRpb24uXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaWRidHJhbnMuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbi5lcnJvci5maXJlKG5ldyBFcnJvcihcIlRyYW5zYWN0aW9uIEFib3J0ZWRcIikpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRhYmxlOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy50YWJsZXMuaGFzT3duUHJvcGVydHkobmFtZSkpIHsgdGhyb3cgbmV3IEVycm9yKFwiVGFibGUgXCIgKyBuYW1lICsgXCIgbm90IGluIHRyYW5zYWN0aW9uXCIpOyByZXR1cm4geyBBTl9VTktOT1dOX1RBQkxFX05BTUVfV0FTX1NQRUNJRklFRDogMSB9OyB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGFibGVzW25hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyBXaGVyZUNsYXVzZVxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICBmdW5jdGlvbiBXaGVyZUNsYXVzZSh0YWJsZSwgaW5kZXgsIG9yQ29sbGVjdGlvbikge1xuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwidGFibGVcIiB0eXBlPVwiVGFibGVcIj48L3BhcmFtPlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiaW5kZXhcIiB0eXBlPVwiU3RyaW5nXCIgb3B0aW9uYWw9XCJ0cnVlXCI+PC9wYXJhbT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm9yQ29sbGVjdGlvblwiIHR5cGU9XCJDb2xsZWN0aW9uXCIgb3B0aW9uYWw9XCJ0cnVlXCI+PC9wYXJhbT5cbiAgICAgICAgICAgIHRoaXMuX2N0eCA9IHtcbiAgICAgICAgICAgICAgICB0YWJsZTogdGFibGUsXG4gICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4ID09PSBcIjppZFwiID8gbnVsbCA6IGluZGV4LFxuICAgICAgICAgICAgICAgIGNvbGxDbGFzczogdGFibGUuX2NvbGxDbGFzcyxcbiAgICAgICAgICAgICAgICBvcjogb3JDb2xsZWN0aW9uXG4gICAgICAgICAgICB9OyBcbiAgICAgICAgfVxuXG4gICAgICAgIGV4dGVuZChXaGVyZUNsYXVzZS5wcm90b3R5cGUsIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgLy8gV2hlcmVDbGF1c2UgcHJpdmF0ZSBtZXRob2RzXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGZhaWwoY29sbGVjdGlvbiwgZXJyKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgdGhyb3cgZXJyOyB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uX2N0eC5lcnJvciA9IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRTZXRBcmdzKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShhcmdzWzBdKSA/IGFyZ3NbMF0gOiBhcmdzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdXBwZXJGYWN0b3J5KGRpcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXIgPT09IFwibmV4dFwiID8gZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudG9VcHBlckNhc2UoKTsgfSA6IGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnRvTG93ZXJDYXNlKCk7IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBsb3dlckZhY3RvcnkoZGlyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpciA9PT0gXCJuZXh0XCIgPyBmdW5jdGlvbiAocykgeyByZXR1cm4gcy50b0xvd2VyQ2FzZSgpOyB9IDogZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudG9VcHBlckNhc2UoKTsgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIG5leHRDYXNpbmcoa2V5LCBsb3dlcktleSwgdXBwZXJOZWVkbGUsIGxvd2VyTmVlZGxlLCBjbXAsIGRpcikge1xuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBNYXRoLm1pbihrZXkubGVuZ3RoLCBsb3dlck5lZWRsZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHZhciBsbHAgPSAtMTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsd3JLZXlDaGFyID0gbG93ZXJLZXlbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChsd3JLZXlDaGFyICE9PSBsb3dlck5lZWRsZVtpXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNtcChrZXlbaV0sIHVwcGVyTmVlZGxlW2ldKSA8IDApIHJldHVybiBrZXkuc3Vic3RyKDAsIGkpICsgdXBwZXJOZWVkbGVbaV0gKyB1cHBlck5lZWRsZS5zdWJzdHIoaSArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNtcChrZXlbaV0sIGxvd2VyTmVlZGxlW2ldKSA8IDApIHJldHVybiBrZXkuc3Vic3RyKDAsIGkpICsgbG93ZXJOZWVkbGVbaV0gKyB1cHBlck5lZWRsZS5zdWJzdHIoaSArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxscCA+PSAwKSByZXR1cm4ga2V5LnN1YnN0cigwLCBsbHApICsgbG93ZXJLZXlbbGxwXSArIHVwcGVyTmVlZGxlLnN1YnN0cihsbHAgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbXAoa2V5W2ldLCBsd3JLZXlDaGFyKSA8IDApIGxscCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsZW5ndGggPCBsb3dlck5lZWRsZS5sZW5ndGggJiYgZGlyID09PSBcIm5leHRcIikgcmV0dXJuIGtleSArIHVwcGVyTmVlZGxlLnN1YnN0cihrZXkubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBpZiAobGVuZ3RoIDwga2V5Lmxlbmd0aCAmJiBkaXIgPT09IFwicHJldlwiKSByZXR1cm4ga2V5LnN1YnN0cigwLCB1cHBlck5lZWRsZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiAobGxwIDwgMCA/IG51bGwgOiBrZXkuc3Vic3RyKDAsIGxscCkgKyBsb3dlck5lZWRsZVtsbHBdICsgdXBwZXJOZWVkbGUuc3Vic3RyKGxscCArIDEpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkSWdub3JlQ2FzZUFsZ29yaXRobShjLCBtYXRjaCwgbmVlZGxlKSB7XG4gICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwibmVlZGxlXCIgdHlwZT1cIlN0cmluZ1wiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgdmFyIHVwcGVyLCBsb3dlciwgY29tcGFyZSwgdXBwZXJOZWVkbGUsIGxvd2VyTmVlZGxlLCBkaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdERpcmVjdGlvbihkaXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdXBwZXIgPSB1cHBlckZhY3RvcnkoZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgbG93ZXIgPSBsb3dlckZhY3RvcnkoZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyZSA9IChkaXIgPT09IFwibmV4dFwiID8gYXNjZW5kaW5nIDogZGVzY2VuZGluZyk7XG4gICAgICAgICAgICAgICAgICAgIHVwcGVyTmVlZGxlID0gdXBwZXIobmVlZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgbG93ZXJOZWVkbGUgPSBsb3dlcihuZWVkbGUpO1xuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBkaXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluaXREaXJlY3Rpb24oXCJuZXh0XCIpO1xuICAgICAgICAgICAgICAgIGMuX29uZGlyZWN0aW9uY2hhbmdlID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGV2ZW50IG9ubHlzIG9jY3VyIGJlZm9yZSBmaWx0ZXIgaXMgY2FsbGVkIHRoZSBmaXJzdCB0aW1lLlxuICAgICAgICAgICAgICAgICAgICBpbml0RGlyZWN0aW9uKGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjLl9hZGRBbGdvcml0aG0oZnVuY3Rpb24gKGN1cnNvciwgYWR2YW5jZSwgcmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjdXJzb3JcIiB0eXBlPVwiSURCQ3Vyc29yXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiYWR2YW5jZVwiIHR5cGU9XCJGdW5jdGlvblwiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInJlc29sdmVcIiB0eXBlPVwiRnVuY3Rpb25cIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gY3Vyc29yLmtleTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsb3dlcktleSA9IGxvd2VyKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaChsb3dlcktleSwgbG93ZXJOZWVkbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKGZ1bmN0aW9uICgpIHsgY3Vyc29yLmNvbnRpbnVlKCk7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dE5lZWRsZSA9IG5leHRDYXNpbmcoa2V5LCBsb3dlcktleSwgdXBwZXJOZWVkbGUsIGxvd2VyTmVlZGxlLCBjb21wYXJlLCBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHROZWVkbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKGZ1bmN0aW9uICgpIHsgY3Vyc29yLmNvbnRpbnVlKG5leHROZWVkbGUpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gV2hlcmVDbGF1c2UgcHVibGljIG1ldGhvZHNcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGJldHdlZW46IGZ1bmN0aW9uIChsb3dlciwgdXBwZXIsIGluY2x1ZGVMb3dlciwgaW5jbHVkZVVwcGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgLy8vICAgICBGaWx0ZXIgb3V0IHJlY29yZHMgd2hvc2Ugd2hlcmUtZmllbGQgbGF5cyBiZXR3ZWVuIGdpdmVuIGxvd2VyIGFuZCB1cHBlciB2YWx1ZXMuIEFwcGxpZXMgdG8gU3RyaW5ncywgTnVtYmVycyBhbmQgRGF0ZXMuXG4gICAgICAgICAgICAgICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImxvd2VyXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwidXBwZXJcIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJpbmNsdWRlTG93ZXJcIiBvcHRpb25hbD1cInRydWVcIj5XaGV0aGVyIGl0ZW1zIHRoYXQgZXF1YWxzIGxvd2VyIHNob3VsZCBiZSBpbmNsdWRlZC4gRGVmYXVsdCB0cnVlLjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImluY2x1ZGVVcHBlclwiIG9wdGlvbmFsPVwidHJ1ZVwiPldoZXRoZXIgaXRlbXMgdGhhdCBlcXVhbHMgdXBwZXIgc2hvdWxkIGJlIGluY2x1ZGVkLiBEZWZhdWx0IGZhbHNlLjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwiQ29sbGVjdGlvblwiPjwvcmV0dXJucz5cbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUxvd2VyID0gaW5jbHVkZUxvd2VyICE9PSBmYWxzZTsgICAvLyBEZWZhdWx0IHRvIHRydWVcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZVVwcGVyID0gaW5jbHVkZVVwcGVyID09PSB0cnVlOyAgICAvLyBEZWZhdWx0IHRvIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmICgobG93ZXIgPiB1cHBlcikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChsb3dlciA9PT0gdXBwZXIgJiYgKGluY2x1ZGVMb3dlciB8fCBpbmNsdWRlVXBwZXIpICYmICEoaW5jbHVkZUxvd2VyICYmIGluY2x1ZGVVcHBlcikpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uKCkgeyByZXR1cm4gSURCS2V5UmFuZ2Uub25seShsb3dlcik7IH0pLmxpbWl0KDApOyAvLyBXb3JrYXJvdW5kIGZvciBpZGlvdGljIFczQyBTcGVjaWZpY2F0aW9uIHRoYXQgRGF0YUVycm9yIG11c3QgYmUgdGhyb3duIGlmIGxvd2VyID4gdXBwZXIuIFRoZSBuYXR1cmFsIHJlc3VsdCB3b3VsZCBiZSB0byByZXR1cm4gYW4gZW1wdHkgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uKCkgeyByZXR1cm4gSURCS2V5UmFuZ2UuYm91bmQobG93ZXIsIHVwcGVyLCAhaW5jbHVkZUxvd2VyLCAhaW5jbHVkZVVwcGVyKTsgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBJREJLZXlSYW5nZS5vbmx5KHZhbHVlKTsgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhYm92ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbigpIHsgcmV0dXJuIElEQktleVJhbmdlLmxvd2VyQm91bmQodmFsdWUsIHRydWUpOyB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFib3ZlT3JFcXVhbDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbigpIHsgcmV0dXJuIElEQktleVJhbmdlLmxvd2VyQm91bmQodmFsdWUpOyB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGJlbG93OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uKCkgeyByZXR1cm4gSURCS2V5UmFuZ2UudXBwZXJCb3VuZCh2YWx1ZSwgdHJ1ZSk7IH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYmVsb3dPckVxdWFsOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uKCkgeyByZXR1cm4gSURCS2V5UmFuZ2UudXBwZXJCb3VuZCh2YWx1ZSk7IH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc3RhcnRzV2l0aDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJzdHJcIiB0eXBlPVwiU3RyaW5nXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFpbChuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzKSwgbmV3IFR5cGVFcnJvcihcIlN0cmluZyBleHBlY3RlZFwiKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJldHdlZW4oc3RyLCBzdHIgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1NTM1KSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdGFydHNXaXRoSWdub3JlQ2FzZTogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJzdHJcIiB0eXBlPVwiU3RyaW5nXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFpbChuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzKSwgbmV3IFR5cGVFcnJvcihcIlN0cmluZyBleHBlY3RlZFwiKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHIgPT09IFwiXCIpIHJldHVybiB0aGlzLnN0YXJ0c1dpdGgoc3RyKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbigpIHsgcmV0dXJuIElEQktleVJhbmdlLmJvdW5kKHN0ci50b1VwcGVyQ2FzZSgpLCBzdHIudG9Mb3dlckNhc2UoKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoNjU1MzUpKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElnbm9yZUNhc2VBbGdvcml0aG0oYywgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuaW5kZXhPZihiKSA9PT0gMDsgfSwgc3RyKTtcbiAgICAgICAgICAgICAgICAgICAgYy5fb25kaXJlY3Rpb25jaGFuZ2UgPSBmdW5jdGlvbiAoKSB7IGZhaWwoYywgbmV3IEVycm9yKFwicmV2ZXJzZSgpIG5vdCBzdXBwb3J0ZWQgd2l0aCBXaGVyZUNsYXVzZS5zdGFydHNXaXRoSWdub3JlQ2FzZSgpXCIpKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcXVhbHNJZ25vcmVDYXNlOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInN0clwiIHR5cGU9XCJTdHJpbmdcIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHJldHVybiBmYWlsKG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMpLCBuZXcgVHlwZUVycm9yKFwiU3RyaW5nIGV4cGVjdGVkXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbigpIHsgcmV0dXJuIElEQktleVJhbmdlLmJvdW5kKHN0ci50b1VwcGVyQ2FzZSgpLCBzdHIudG9Mb3dlckNhc2UoKSk7IH0pO1xuICAgICAgICAgICAgICAgICAgICBhZGRJZ25vcmVDYXNlQWxnb3JpdGhtKGMsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID09PSBiOyB9LCBzdHIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFueU9mOiBmdW5jdGlvbiAodmFsdWVBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NoZW1hID0gY3R4LnRhYmxlLnNjaGVtYTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkeFNwZWMgPSBjdHguaW5kZXggPyBzY2hlbWEuaWR4QnlOYW1lW2N0eC5pbmRleF0gOiBzY2hlbWEucHJpbUtleTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzQ29tcG91bmQgPSBpZHhTcGVjICYmIGlkeFNwZWMuY29tcG91bmQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXQgPSBnZXRTZXRBcmdzKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wYXJlID0gaXNDb21wb3VuZCA/IGNvbXBvdW5kQ29tcGFyZShhc2NlbmRpbmcpIDogYXNjZW5kaW5nO1xuICAgICAgICAgICAgICAgICAgICBzZXQuc29ydChjb21wYXJlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNldC5sZW5ndGggPT09IDApIHJldHVybiBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbigpIHsgcmV0dXJuIElEQktleVJhbmdlLm9ubHkoXCJcIik7IH0pLmxpbWl0KDApOyAvLyBSZXR1cm4gYW4gZW1wdHkgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbiAoKSB7IHJldHVybiBJREJLZXlSYW5nZS5ib3VuZChzZXRbMF0sIHNldFtzZXQubGVuZ3RoIC0gMV0pOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGMuX29uZGlyZWN0aW9uY2hhbmdlID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGFyZSA9IChkaXJlY3Rpb24gPT09IFwibmV4dFwiID8gYXNjZW5kaW5nIDogZGVzY2VuZGluZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNDb21wb3VuZCkgY29tcGFyZSA9IGNvbXBvdW5kQ29tcGFyZShjb21wYXJlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldC5zb3J0KGNvbXBhcmUpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGMuX2FkZEFsZ29yaXRobShmdW5jdGlvbiAoY3Vyc29yLCBhZHZhbmNlLCByZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gY3Vyc29yLmtleTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChjb21wYXJlKGtleSwgc2V0W2ldKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY3Vyc29yIGhhcyBwYXNzZWQgYmV5b25kIHRoaXMga2V5LiBDaGVjayBuZXh0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsraTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PT0gc2V0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBuZXh0LiBTdG9wIHNlYXJjaGluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wYXJlKGtleSwgc2V0W2ldKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjdXJyZW50IGN1cnNvciB2YWx1ZSBzaG91bGQgYmUgaW5jbHVkZWQgYW5kIHdlIHNob3VsZCBjb250aW51ZSBhIHNpbmdsZSBzdGVwIGluIGNhc2UgbmV4dCBpdGVtIGhhcyB0aGUgc2FtZSBrZXkgb3IgcG9zc2libHkgb3VyIG5leHQga2V5IGluIHNldC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKGZ1bmN0aW9uICgpIHsgY3Vyc29yLmNvbnRpbnVlKCk7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjdXJzb3Iua2V5IG5vdCB5ZXQgYXQgc2V0W2ldLiBGb3J3YXJkIGN1cnNvciB0byB0aGUgbmV4dCBrZXkgdG8gaHVudCBmb3IuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShmdW5jdGlvbiAoKSB7IGN1cnNvci5jb250aW51ZShzZXRbaV0pOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbm90RXF1YWw6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJlbG93KHZhbHVlKS5vcih0aGlzLl9jdHguaW5kZXgpLmFib3ZlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbm9uZU9mOiBmdW5jdGlvbih2YWx1ZUFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHgsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2hlbWEgPSBjdHgudGFibGUuc2NoZW1hO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaWR4U3BlYyA9IGN0eC5pbmRleCA/IHNjaGVtYS5pZHhCeU5hbWVbY3R4LmluZGV4XSA6IHNjaGVtYS5wcmltS2V5O1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNDb21wb3VuZCA9IGlkeFNwZWMgJiYgaWR4U3BlYy5jb21wb3VuZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNldCA9IGdldFNldEFyZ3MoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNldC5sZW5ndGggPT09IDApIHJldHVybiBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzKTsgLy8gUmV0dXJuIGVudGlyZSBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcGFyZSA9IGlzQ29tcG91bmQgPyBjb21wb3VuZENvbXBhcmUoYXNjZW5kaW5nKSA6IGFzY2VuZGluZztcbiAgICAgICAgICAgICAgICAgICAgc2V0LnNvcnQoY29tcGFyZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRyYW5zZm9ybSBbXCJhXCIsXCJiXCIsXCJjXCJdIHRvIGEgc2V0IG9mIHJhbmdlcyBmb3IgYmV0d2Vlbi9hYm92ZS9iZWxvdzogW1tudWxsLFwiYVwiXSwgW1wiYVwiLFwiYlwiXSwgW1wiYlwiLFwiY1wiXSwgW1wiY1wiLG51bGxdXVxuICAgICAgICAgICAgICAgICAgICB2YXIgcmFuZ2VzID0gc2V0LnJlZHVjZShmdW5jdGlvbiAocmVzLCB2YWwpIHsgcmV0dXJuIHJlcyA/IHJlcy5jb25jYXQoW1tyZXNbcmVzLmxlbmd0aCAtIDFdWzFdLCB2YWxdXSkgOiBbW251bGwsIHZhbF1dOyB9LCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2VzLnB1c2goW3NldFtzZXQubGVuZ3RoIC0gMV0sIG51bGxdKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJhbnNmb3JtIHJhbmdlLXNldHMgdG8gYSBiaWcgb3IoKSBleHByZXNzaW9uIGJldHdlZW4gcmFuZ2VzOlxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhpeiA9IHRoaXMsIGluZGV4ID0gY3R4LmluZGV4O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmFuZ2VzLnJlZHVjZShmdW5jdGlvbihjb2xsZWN0aW9uLCByYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb24gP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlWzFdID09PSBudWxsID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5vcihpbmRleCkuYWJvdmUocmFuZ2VbMF0pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5vcihpbmRleCkuYmV0d2VlbihyYW5nZVswXSwgcmFuZ2VbMV0sIGZhbHNlLCBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXouYmVsb3cocmFuZ2VbMV0pO1xuICAgICAgICAgICAgICAgICAgICB9LCBudWxsKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgc3RhcnRzV2l0aEFueU9mOiBmdW5jdGlvbiAodmFsdWVBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0ID0gZ2V0U2V0QXJncyhhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2V0LmV2ZXJ5KGZ1bmN0aW9uIChzKSB7IHJldHVybiB0eXBlb2YgcyA9PT0gJ3N0cmluZyc7IH0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFpbChuZXcgY3R4LmNvbGxDbGFzcyh0aGlzKSwgbmV3IFR5cGVFcnJvcihcInN0YXJ0c1dpdGhBbnlPZigpIG9ubHkgd29ya3Mgd2l0aCBzdHJpbmdzXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc2V0Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIG5ldyBjdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIElEQktleVJhbmdlLm9ubHkoXCJcIik7IH0pLmxpbWl0KDApOyAvLyBSZXR1cm4gYW4gZW1wdHkgY29sbGVjdGlvbi5cblxuICAgICAgICAgICAgICAgICAgICB2YXIgc2V0RW5kcyA9IHNldC5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1NTM1KTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB2YXIgc29ydERpcmVjdGlvbiA9IGFzY2VuZGluZztcbiAgICAgICAgICAgICAgICAgICAgc2V0LnNvcnQoc29ydERpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24ga2V5SXNCZXlvbmRDdXJyZW50RW50cnkoa2V5KSB7IHJldHVybiBrZXkgPiBzZXRFbmRzW2ldOyB9XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGtleUlzQmVmb3JlQ3VycmVudEVudHJ5KGtleSkgeyByZXR1cm4ga2V5IDwgc2V0W2ldOyB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGVja0tleSA9IGtleUlzQmV5b25kQ3VycmVudEVudHJ5O1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gbmV3IGN0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIElEQktleVJhbmdlLmJvdW5kKHNldFswXSwgc2V0W3NldC5sZW5ndGggLSAxXSArIFN0cmluZy5mcm9tQ2hhckNvZGUoNjU1MzUpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjLl9vbmRpcmVjdGlvbmNoYW5nZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IFwibmV4dFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tLZXkgPSBrZXlJc0JleW9uZEN1cnJlbnRFbnRyeTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0RGlyZWN0aW9uID0gYXNjZW5kaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja0tleSA9IGtleUlzQmVmb3JlQ3VycmVudEVudHJ5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnREaXJlY3Rpb24gPSBkZXNjZW5kaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0LnNvcnQoc29ydERpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRFbmRzLnNvcnQoc29ydERpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgYy5fYWRkQWxnb3JpdGhtKGZ1bmN0aW9uIChjdXJzb3IsIGFkdmFuY2UsIHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBjdXJzb3Iua2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNoZWNrS2V5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY3Vyc29yIGhhcyBwYXNzZWQgYmV5b25kIHRoaXMga2V5LiBDaGVjayBuZXh0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsraTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PT0gc2V0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBuZXh0LiBTdG9wIHNlYXJjaGluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPj0gc2V0W2ldICYmIGtleSA8PSBzZXRFbmRzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGN1cnJlbnQgY3Vyc29yIHZhbHVlIHNob3VsZCBiZSBpbmNsdWRlZCBhbmQgd2Ugc2hvdWxkIGNvbnRpbnVlIGEgc2luZ2xlIHN0ZXAgaW4gY2FzZSBuZXh0IGl0ZW0gaGFzIHRoZSBzYW1lIGtleSBvciBwb3NzaWJseSBvdXIgbmV4dCBrZXkgaW4gc2V0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoZnVuY3Rpb24gKCkgeyBjdXJzb3IuY29udGludWUoKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGN1cnNvci5rZXkgbm90IHlldCBhdCBzZXRbaV0uIEZvcndhcmQgY3Vyc29yIHRvIHRoZSBuZXh0IGtleSB0byBodW50IGZvci5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc29ydERpcmVjdGlvbiA9PT0gYXNjZW5kaW5nKSBjdXJzb3IuY29udGludWUoc2V0W2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBjdXJzb3IuY29udGludWUoc2V0RW5kc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cblxuXG5cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQ29sbGVjdGlvbiBDbGFzc1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICBmdW5jdGlvbiBDb2xsZWN0aW9uKHdoZXJlQ2xhdXNlLCBrZXlSYW5nZUdlbmVyYXRvcikge1xuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAgICAgLy8vIFxuICAgICAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIndoZXJlQ2xhdXNlXCIgdHlwZT1cIldoZXJlQ2xhdXNlXCI+V2hlcmUgY2xhdXNlIGluc3RhbmNlPC9wYXJhbT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImtleVJhbmdlR2VuZXJhdG9yXCIgdmFsdWU9XCJmdW5jdGlvbigpeyByZXR1cm4gSURCS2V5UmFuZ2UuYm91bmQoMCwxKTt9XCIgb3B0aW9uYWw9XCJ0cnVlXCI+PC9wYXJhbT5cbiAgICAgICAgICAgIHZhciBrZXlSYW5nZSA9IG51bGwsIGVycm9yID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChrZXlSYW5nZUdlbmVyYXRvcikgdHJ5IHtcbiAgICAgICAgICAgICAgICBrZXlSYW5nZSA9IGtleVJhbmdlR2VuZXJhdG9yKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgIGVycm9yID0gZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB3aGVyZUN0eCA9IHdoZXJlQ2xhdXNlLl9jdHg7XG4gICAgICAgICAgICB0aGlzLl9jdHggPSB7XG4gICAgICAgICAgICAgICAgdGFibGU6IHdoZXJlQ3R4LnRhYmxlLFxuICAgICAgICAgICAgICAgIGluZGV4OiB3aGVyZUN0eC5pbmRleCxcbiAgICAgICAgICAgICAgICBpc1ByaW1LZXk6ICghd2hlcmVDdHguaW5kZXggfHwgKHdoZXJlQ3R4LnRhYmxlLnNjaGVtYS5wcmltS2V5LmtleVBhdGggJiYgd2hlcmVDdHguaW5kZXggPT09IHdoZXJlQ3R4LnRhYmxlLnNjaGVtYS5wcmltS2V5Lm5hbWUpKSxcbiAgICAgICAgICAgICAgICByYW5nZToga2V5UmFuZ2UsXG4gICAgICAgICAgICAgICAgb3A6IFwib3BlbkN1cnNvclwiLFxuICAgICAgICAgICAgICAgIGRpcjogXCJuZXh0XCIsXG4gICAgICAgICAgICAgICAgdW5pcXVlOiBcIlwiLFxuICAgICAgICAgICAgICAgIGFsZ29yaXRobTogbnVsbCxcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IG51bGwsXG4gICAgICAgICAgICAgICAgaXNNYXRjaDogbnVsbCxcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IDAsXG4gICAgICAgICAgICAgICAgbGltaXQ6IEluZmluaXR5LFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciwgLy8gSWYgc2V0LCBhbnkgcHJvbWlzZSBtdXN0IGJlIHJlamVjdGVkIHdpdGggdGhpcyBlcnJvclxuICAgICAgICAgICAgICAgIG9yOiB3aGVyZUN0eC5vclxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4dGVuZChDb2xsZWN0aW9uLnByb3RvdHlwZSwgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQ29sbGVjdGlvbiBQcml2YXRlIEZ1bmN0aW9uc1xuICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkRmlsdGVyKGN0eCwgZm4pIHtcbiAgICAgICAgICAgICAgICBjdHguZmlsdGVyID0gY29tYmluZShjdHguZmlsdGVyLCBmbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZE1hdGNoRmlsdGVyKGN0eCwgZm4pIHtcbiAgICAgICAgICAgICAgICBjdHguaXNNYXRjaCA9IGNvbWJpbmUoY3R4LmlzTWF0Y2gsIGZuKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0SW5kZXhPclN0b3JlKGN0eCwgc3RvcmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3R4LmlzUHJpbUtleSkgcmV0dXJuIHN0b3JlO1xuICAgICAgICAgICAgICAgIHZhciBpbmRleFNwZWMgPSBjdHgudGFibGUuc2NoZW1hLmlkeEJ5TmFtZVtjdHguaW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmICghaW5kZXhTcGVjKSB0aHJvdyBuZXcgRXJyb3IoXCJLZXlQYXRoIFwiICsgY3R4LmluZGV4ICsgXCIgb24gb2JqZWN0IHN0b3JlIFwiICsgc3RvcmUubmFtZSArIFwiIGlzIG5vdCBpbmRleGVkXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjdHguaXNQcmltS2V5ID8gc3RvcmUgOiBzdG9yZS5pbmRleChpbmRleFNwZWMubmFtZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG9wZW5DdXJzb3IoY3R4LCBzdG9yZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRJbmRleE9yU3RvcmUoY3R4LCBzdG9yZSlbY3R4Lm9wXShjdHgucmFuZ2UgfHwgbnVsbCwgY3R4LmRpciArIGN0eC51bmlxdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpdGVyKGN0eCwgZm4sIHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWN0eC5vcikge1xuICAgICAgICAgICAgICAgICAgICBpdGVyYXRlKG9wZW5DdXJzb3IoY3R4LCBpZGJzdG9yZSksIGNvbWJpbmUoY3R4LmFsZ29yaXRobSwgY3R4LmZpbHRlciksIGZuLCByZXNvbHZlLCByZWplY3QsIGN0eC50YWJsZS5ob29rLnJlYWRpbmcuZmlyZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaWx0ZXIgPSBjdHguZmlsdGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNldCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByaW1LZXkgPSBjdHgudGFibGUuc2NoZW1hLnByaW1LZXkua2V5UGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNvbHZlZCA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlc29sdmVib3RoKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgrK3Jlc29sdmVkID09PSAyKSByZXNvbHZlKCk7IC8vIFNlZW1zIGxpa2Ugd2UganVzdCBzdXBwb3J0IG9yIGJ0d24gbWF4IDIgZXhwcmVzc2lvbnMsIGJ1dCB0aGVyZSBhcmUgbm8gbGltaXQgYmVjYXVzZSB3ZSBkbyByZWN1cnNpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHVuaW9uKGl0ZW0sIGN1cnNvciwgYWR2YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmlsdGVyIHx8IGZpbHRlcihjdXJzb3IsIGFkdmFuY2UsIHJlc29sdmVib3RoLCByZWplY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBjdXJzb3IucHJpbWFyeUtleS50b1N0cmluZygpOyAvLyBDb252ZXJ0cyBhbnkgRGF0ZSB0byBTdHJpbmcsIFN0cmluZyB0byBTdHJpbmcsIE51bWJlciB0byBTdHJpbmcgYW5kIEFycmF5IHRvIGNvbW1hLXNlcGFyYXRlZCBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzZXQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0W2tleV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4oaXRlbSwgY3Vyc29yLCBhZHZhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4Lm9yLl9pdGVyYXRlKHVuaW9uLCByZXNvbHZlYm90aCwgcmVqZWN0LCBpZGJzdG9yZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRlKG9wZW5DdXJzb3IoY3R4LCBpZGJzdG9yZSksIGN0eC5hbGdvcml0aG0sIHVuaW9uLCByZXNvbHZlYm90aCwgcmVqZWN0LCBjdHgudGFibGUuaG9vay5yZWFkaW5nLmZpcmUpO1xuICAgICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEluc3RhbmNlVGVtcGxhdGUoY3R4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN0eC50YWJsZS5zY2hlbWEuaW5zdGFuY2VUZW1wbGF0ZTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICByZXR1cm4ge1xuXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBDb2xsZWN0aW9uIFByb3RlY3RlZCBGdW5jdGlvbnNcbiAgICAgICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAgICAgX3JlYWQ6IGZ1bmN0aW9uIChmbiwgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0eC5lcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHgudGFibGUuX3RyYW5zKG51bGwsIGZ1bmN0aW9uIHJlamVjdG9yKHJlc29sdmUsIHJlamVjdCkgeyByZWplY3QoY3R4LmVycm9yKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHgudGFibGUuX2lkYnN0b3JlKFJFQURPTkxZLCBmbikudGhlbihjYik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfd3JpdGU6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3R4LmVycm9yKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN0eC50YWJsZS5fdHJhbnMobnVsbCwgZnVuY3Rpb24gcmVqZWN0b3IocmVzb2x2ZSwgcmVqZWN0KSB7IHJlamVjdChjdHguZXJyb3IpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN0eC50YWJsZS5faWRic3RvcmUoUkVBRFdSSVRFLCBmbiwgXCJsb2NrZWRcIik7IC8vIFdoZW4gZG9pbmcgd3JpdGUgb3BlcmF0aW9ucyBvbiBjb2xsZWN0aW9ucywgYWx3YXlzIGxvY2sgdGhlIG9wZXJhdGlvbiBzbyB0aGF0IHVwY29taW5nIG9wZXJhdGlvbnMgZ2V0cyBxdWV1ZWQuXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfYWRkQWxnb3JpdGhtOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFsZ29yaXRobSA9IGNvbWJpbmUoY3R4LmFsZ29yaXRobSwgZm4pO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBfaXRlcmF0ZTogZnVuY3Rpb24gKGZuLCByZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyKHRoaXMuX2N0eCwgZm4sIHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8vIENvbGxlY3Rpb24gUHVibGljIG1ldGhvZHNcbiAgICAgICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAgICAgZWFjaDogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG5cbiAgICAgICAgICAgICAgICAgICAgZmFrZSAmJiBmbihnZXRJbnN0YW5jZVRlbXBsYXRlKGN0eCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWFkKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyKGN0eCwgZm4sIHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgY291bnQ6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmFrZSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgwKS50aGVuKGNiKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4ID0gdGhpcy5fY3R4O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHguZmlsdGVyIHx8IGN0eC5hbGdvcml0aG0gfHwgY3R4Lm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIGZpbHRlcnMgYXJlIGFwcGxpZWQgb3IgJ29yZWQnIGNvbGxlY3Rpb25zIGFyZSB1c2VkLCB3ZSBtdXN0IGNvdW50IG1hbnVhbGx5XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWQoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVyKGN0eCwgZnVuY3Rpb24gKCkgeyArK2NvdW50OyByZXR1cm4gZmFsc2U7IH0sIGZ1bmN0aW9uICgpIHsgcmVzb2x2ZShjb3VudCk7IH0sIHJlamVjdCwgaWRic3RvcmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgY2IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCB3ZSBjYW4gdXNlIHRoZSBjb3VudCgpIG1ldGhvZCBpZiB0aGUgaW5kZXguXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVhZChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZHggPSBnZXRJbmRleE9yU3RvcmUoY3R4LCBpZGJzdG9yZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcSA9IChjdHgucmFuZ2UgPyBpZHguY291bnQoY3R4LnJhbmdlKSA6IGlkeC5jb3VudCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIFtcImNhbGxpbmdcIiwgXCJjb3VudCgpXCIsIFwib25cIiwgc2VsZi5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoTWF0aC5taW4oZS50YXJnZXQucmVzdWx0LCBNYXRoLm1heCgwLCBjdHgubGltaXQgLSBjdHgub2Zmc2V0KSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBjYik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgc29ydEJ5OiBmdW5jdGlvbiAoa2V5UGF0aCwgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwia2V5UGF0aFwiIHR5cGU9XCJTdHJpbmdcIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFydHMgPSBrZXlQYXRoLnNwbGl0KCcuJykucmV2ZXJzZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFBhcnQgPSBwYXJ0c1swXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RJbmRleCA9IHBhcnRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldHZhbChvYmosIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpKSByZXR1cm4gZ2V0dmFsKG9ialtwYXJ0c1tpXV0sIGkgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmpbbGFzdFBhcnRdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBvcmRlciA9IHRoaXMuX2N0eC5kaXIgPT09IFwibmV4dFwiID8gMSA6IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHNvcnRlcihhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYVZhbCA9IGdldHZhbChhLCBsYXN0SW5kZXgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJWYWwgPSBnZXR2YWwoYiwgbGFzdEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhVmFsIDwgYlZhbCA/IC1vcmRlciA6IGFWYWwgPiBiVmFsID8gb3JkZXIgOiAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvQXJyYXkoZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhLnNvcnQoc29ydGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfSkudGhlbihjYik7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHRvQXJyYXk6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVhZChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmFrZSAmJiByZXNvbHZlKFtnZXRJbnN0YW5jZVRlbXBsYXRlKGN0eCldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyKGN0eCwgZnVuY3Rpb24gKGl0ZW0pIHsgYS5wdXNoKGl0ZW0pOyB9LCBmdW5jdGlvbiBhcnJheUNvbXBsZXRlKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QsIGlkYnN0b3JlKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgY2IpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBvZmZzZXQ6IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9mZnNldCA8PSAwKSByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3R4Lm9mZnNldCArPSBvZmZzZXQ7IC8vIEZvciBjb3VudCgpXG4gICAgICAgICAgICAgICAgICAgIGlmICghY3R4Lm9yICYmICFjdHguYWxnb3JpdGhtICYmICFjdHguZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRGaWx0ZXIoY3R4LCBmdW5jdGlvbiBvZmZzZXRGaWx0ZXIoY3Vyc29yLCBhZHZhbmNlLCByZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9mZnNldCA9PT0gMCkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9mZnNldCA9PT0gMSkgeyAtLW9mZnNldDsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShmdW5jdGlvbiAoKSB7IGN1cnNvci5hZHZhbmNlKG9mZnNldCk7IG9mZnNldCA9IDA7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkRmlsdGVyKGN0eCwgZnVuY3Rpb24gb2Zmc2V0RmlsdGVyKGN1cnNvciwgYWR2YW5jZSwgcmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoLS1vZmZzZXQgPCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBsaW1pdDogZnVuY3Rpb24gKG51bVJvd3MpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3R4LmxpbWl0ID0gTWF0aC5taW4odGhpcy5fY3R4LmxpbWl0LCBudW1Sb3dzKTsgLy8gRm9yIGNvdW50KClcbiAgICAgICAgICAgICAgICAgICAgYWRkRmlsdGVyKHRoaXMuX2N0eCwgZnVuY3Rpb24gKGN1cnNvciwgYWR2YW5jZSwgcmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tbnVtUm93cyA8PSAwKSBhZHZhbmNlKHJlc29sdmUpOyAvLyBTdG9wIGFmdGVyIHRoaXMgaXRlbSBoYXMgYmVlbiBpbmNsdWRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bVJvd3MgPj0gMDsgLy8gSWYgbnVtUm93cyBpcyBhbHJlYWR5IGJlbG93IDAsIHJldHVybiBmYWxzZSBiZWNhdXNlIHRoZW4gMCB3YXMgcGFzc2VkIHRvIG51bVJvd3MgaW5pdGlhbGx5LiBPdGhlcndpc2Ugd2Ugd291bGRudCBjb21lIGhlcmUuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgdW50aWw6IGZ1bmN0aW9uIChmaWx0ZXJGdW5jdGlvbiwgYkluY2x1ZGVTdG9wRW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcbiAgICAgICAgICAgICAgICAgICAgZmFrZSAmJiBmaWx0ZXJGdW5jdGlvbihnZXRJbnN0YW5jZVRlbXBsYXRlKGN0eCkpO1xuICAgICAgICAgICAgICAgICAgICBhZGRGaWx0ZXIodGhpcy5fY3R4LCBmdW5jdGlvbiAoY3Vyc29yLCBhZHZhbmNlLCByZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVyRnVuY3Rpb24oY3Vyc29yLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJJbmNsdWRlU3RvcEVudHJ5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBmaXJzdDogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpbWl0KDEpLnRvQXJyYXkoZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGFbMF07IH0pLnRoZW4oY2IpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBsYXN0OiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmV2ZXJzZSgpLmZpcnN0KGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgYW5kOiBmdW5jdGlvbiAoZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwianNGdW5jdGlvbkZpbHRlclwiIHR5cGU9XCJGdW5jdGlvblwiPmZ1bmN0aW9uKHZhbCl7cmV0dXJuIHRydWUvZmFsc2V9PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgZmFrZSAmJiBmaWx0ZXJGdW5jdGlvbihnZXRJbnN0YW5jZVRlbXBsYXRlKHRoaXMuX2N0eCkpO1xuICAgICAgICAgICAgICAgICAgICBhZGRGaWx0ZXIodGhpcy5fY3R4LCBmdW5jdGlvbiAoY3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyRnVuY3Rpb24oY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGFkZE1hdGNoRmlsdGVyKHRoaXMuX2N0eCwgZmlsdGVyRnVuY3Rpb24pOyAvLyBtYXRjaCBmaWx0ZXJzIG5vdCB1c2VkIGluIERleGllLmpzIGJ1dCBjYW4gYmUgdXNlZCBieSAzcmQgcGFydCBsaWJyYXJpZXMgdG8gdGVzdCBhIGNvbGxlY3Rpb24gZm9yIGEgbWF0Y2ggd2l0aG91dCBxdWVyeWluZyBEQi4gVXNlZCBieSBEZXhpZS5PYnNlcnZhYmxlLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgb3I6IGZ1bmN0aW9uIChpbmRleE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBXaGVyZUNsYXVzZSh0aGlzLl9jdHgudGFibGUsIGluZGV4TmFtZSwgdGhpcyk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHJldmVyc2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3R4LmRpciA9ICh0aGlzLl9jdHguZGlyID09PSBcInByZXZcIiA/IFwibmV4dFwiIDogXCJwcmV2XCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fb25kaXJlY3Rpb25jaGFuZ2UpIHRoaXMuX29uZGlyZWN0aW9uY2hhbmdlKHRoaXMuX2N0eC5kaXIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgZGVzYzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGVhY2hLZXk6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICAgICAgICAgICAgICBmYWtlICYmIGNiKGdldEJ5S2V5UGF0aChnZXRJbnN0YW5jZVRlbXBsYXRlKHRoaXMuX2N0eCksIHRoaXMuX2N0eC5pbmRleCA/IHRoaXMuX2N0eC50YWJsZS5zY2hlbWEuaWR4QnlOYW1lW3RoaXMuX2N0eC5pbmRleF0ua2V5UGF0aCA6IHRoaXMuX2N0eC50YWJsZS5zY2hlbWEucHJpbUtleS5rZXlQYXRoKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3R4LmlzUHJpbUtleSkgY3R4Lm9wID0gXCJvcGVuS2V5Q3Vyc29yXCI7IC8vIE5lZWQgdGhlIGNoZWNrIGJlY2F1c2UgSURCT2JqZWN0U3RvcmUgZG9lcyBub3QgaGF2ZSBcIm9wZW5LZXlDdXJzb3IoKVwiIHdoaWxlIElEQkluZGV4IGhhcy5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAodmFsLCBjdXJzb3IpIHsgY2IoY3Vyc29yLmtleSwgY3Vyc29yKTsgfSk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGVhY2hVbmlxdWVLZXk6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdHgudW5pcXVlID0gXCJ1bmlxdWVcIjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaEtleShjYik7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGtleXM6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN0eC5pc1ByaW1LZXkpIGN0eC5vcCA9IFwib3BlbktleUN1cnNvclwiOyAvLyBOZWVkIHRoZSBjaGVjayBiZWNhdXNlIElEQk9iamVjdFN0b3JlIGRvZXMgbm90IGhhdmUgXCJvcGVuS2V5Q3Vyc29yKClcIiB3aGlsZSBJREJJbmRleCBoYXMuXG4gICAgICAgICAgICAgICAgICAgIHZhciBhID0gW107XG4gICAgICAgICAgICAgICAgICAgIGlmIChmYWtlKSByZXR1cm4gbmV3IFByb21pc2UodGhpcy5lYWNoS2V5LmJpbmQodGhpcykpLnRoZW4oZnVuY3Rpb24oeCkgeyByZXR1cm4gW3hdOyB9KS50aGVuKGNiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoaXRlbSwgY3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhLnB1c2goY3Vyc29yLmtleSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oY2IpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICB1bmlxdWVLZXlzOiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3R4LnVuaXF1ZSA9IFwidW5pcXVlXCI7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmtleXMoY2IpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBmaXJzdEtleTogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpbWl0KDEpLmtleXMoZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGFbMF07IH0pLnRoZW4oY2IpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBsYXN0S2V5OiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmV2ZXJzZSgpLmZpcnN0S2V5KGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuXG5cbiAgICAgICAgICAgICAgICBkaXN0aW5jdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2V0ID0ge307XG4gICAgICAgICAgICAgICAgICAgIGFkZEZpbHRlcih0aGlzLl9jdHgsIGZ1bmN0aW9uIChjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdHJLZXkgPSBjdXJzb3IucHJpbWFyeUtleS50b1N0cmluZygpOyAvLyBDb252ZXJ0cyBhbnkgRGF0ZSB0byBTdHJpbmcsIFN0cmluZyB0byBTdHJpbmcsIE51bWJlciB0byBTdHJpbmcgYW5kIEFycmF5IHRvIGNvbW1hLXNlcGFyYXRlZCBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IHNldC5oYXNPd25Qcm9wZXJ0eShzdHJLZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0W3N0cktleV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFmb3VuZDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFdyaXRlYWJsZUNvbGxlY3Rpb24gQ2xhc3NcbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgZnVuY3Rpb24gV3JpdGVhYmxlQ29sbGVjdGlvbigpIHtcbiAgICAgICAgICAgIENvbGxlY3Rpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlcml2ZShXcml0ZWFibGVDb2xsZWN0aW9uKS5mcm9tKENvbGxlY3Rpb24pLmV4dGVuZCh7XG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBXcml0ZWFibGVDb2xsZWN0aW9uIFB1YmxpYyBNZXRob2RzXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICBtb2RpZnk6IGZ1bmN0aW9uIChjaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9jdHgsXG4gICAgICAgICAgICAgICAgICAgIGhvb2sgPSBjdHgudGFibGUuaG9vayxcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRpbmdIb29rID0gaG9vay51cGRhdGluZy5maXJlLFxuICAgICAgICAgICAgICAgICAgICBkZWxldGluZ0hvb2sgPSBob29rLmRlbGV0aW5nLmZpcmU7XG5cbiAgICAgICAgICAgICAgICBmYWtlICYmIHR5cGVvZiBjaGFuZ2VzID09PSAnZnVuY3Rpb24nICYmIGNoYW5nZXMuY2FsbCh7IHZhbHVlOiBjdHgudGFibGUuc2NoZW1hLmluc3RhbmNlVGVtcGxhdGUgfSwgY3R4LnRhYmxlLnNjaGVtYS5pbnN0YW5jZVRlbXBsYXRlKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93cml0ZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSwgdHJhbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vZGlmeWVyO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNoYW5nZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZXMgaXMgYSBmdW5jdGlvbiB0aGF0IG1heSB1cGRhdGUsIGFkZCBvciBkZWxldGUgcHJvcHRlcnRpZXMgb3IgZXZlbiByZXF1aXJlIGEgZGVsZXRpb24gdGhlIG9iamVjdCBpdHNlbGYgKGRlbGV0ZSB0aGlzLml0ZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXBkYXRpbmdIb29rID09PSBub3AgJiYgZGVsZXRpbmdIb29rID09PSBub3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb29uZSBjYXJlcyBhYm91dCB3aGF0IGlzIGJlaW5nIGNoYW5nZWQuIEp1c3QgbGV0IHRoZSBtb2RpZmllciBmdW5jdGlvbiBiZSB0aGUgZ2l2ZW4gYXJndW1lbnQgYXMgaXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZ5ZXIgPSBjaGFuZ2VzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQZW9wbGUgd2FudCB0byBrbm93IGV4YWN0bHkgd2hhdCBpcyBiZWluZyBtb2RpZmllZCBvciBkZWxldGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExldCBtb2RpZnllciBiZSBhIHByb3h5IGZ1bmN0aW9uIHRoYXQgZmluZHMgb3V0IHdoYXQgY2hhbmdlcyB0aGUgY2FsbGVyIGlzIGFjdHVhbGx5IGRvaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW5kIGNhbGwgdGhlIGhvb2tzIGFjY29yZGluZ2x5IVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmeWVyID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9yaWdJdGVtID0gZGVlcENsb25lKGl0ZW0pOyAvLyBDbG9uZSB0aGUgaXRlbSBmaXJzdCBzbyB3ZSBjYW4gY29tcGFyZSBsYXRlcnMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VzLmNhbGwodGhpcywgaXRlbSkgPT09IGZhbHNlKSByZXR1cm4gZmFsc2U7IC8vIENhbGwgdGhlIHJlYWwgbW9kaWZ5ZXIgZnVuY3Rpb24gKElmIGl0IHJldHVybnMgZmFsc2UgZXhwbGljaXRlbHksIGl0IG1lYW5zIGl0IGRvbnQgd2FudCB0byBtb2RpZnkgYW55dGluZyBvbiB0aGlzIG9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmhhc093blByb3BlcnR5KFwidmFsdWVcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSByZWFsIG1vZGlmeWVyIGZ1bmN0aW9uIHJlcXVlc3RzIGEgZGVsZXRpb24gb2YgdGhlIG9iamVjdC4gSW5mb3JtIHRoZSBkZWxldGluZ0hvb2sgdGhhdCBhIGRlbGV0aW9uIGlzIHRha2luZyBwbGFjZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0aW5nSG9vay5jYWxsKHRoaXMsIHRoaXMucHJpbUtleSwgaXRlbSwgdHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm8gZGVsZXRpb24uIENoZWNrIHdoYXQgd2FzIGNoYW5nZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvYmplY3REaWZmID0gZ2V0T2JqZWN0RGlmZihvcmlnSXRlbSwgdGhpcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWRkaXRpb25hbENoYW5nZXMgPSB1cGRhdGluZ0hvb2suY2FsbCh0aGlzLCBvYmplY3REaWZmLCB0aGlzLnByaW1LZXksIG9yaWdJdGVtLCB0cmFucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRkaXRpb25hbENoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIb29rIHdhbnQgdG8gYXBwbHkgYWRkaXRpb25hbCBtb2RpZmljYXRpb25zLiBNYWtlIHN1cmUgdG8gZnVsbGZpbGwgdGhlIHdpbGwgb2YgdGhlIGhvb2suXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoYWRkaXRpb25hbENoYW5nZXMpLmZvckVhY2goZnVuY3Rpb24gKGtleVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QnlLZXlQYXRoKGl0ZW0sIGtleVBhdGgsIGFkZGl0aW9uYWxDaGFuZ2VzW2tleVBhdGhdKTsgIC8vIEFkZGluZyB7a2V5UGF0aDogdW5kZWZpbmVkfSBtZWFucyB0aGF0IHRoZSBrZXlQYXRoIHNob3VsZCBiZSBkZWxldGVkLiBIYW5kbGVkIGJ5IHNldEJ5S2V5UGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodXBkYXRpbmdIb29rID09PSBub3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoYW5nZXMgaXMgYSBzZXQgb2Yge2tleVBhdGg6IHZhbHVlfSBhbmQgbm8gb25lIGlzIGxpc3RlbmluZyB0byB0aGUgdXBkYXRpbmcgaG9vay5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXlQYXRocyA9IE9iamVjdC5rZXlzKGNoYW5nZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG51bUtleXMgPSBrZXlQYXRocy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RpZnllciA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFueXRoaW5nTW9kaWZpZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bUtleXM7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5UGF0aCA9IGtleVBhdGhzW2ldLCB2YWwgPSBjaGFuZ2VzW2tleVBhdGhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0QnlLZXlQYXRoKGl0ZW0sIGtleVBhdGgpICE9PSB2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEJ5S2V5UGF0aChpdGVtLCBrZXlQYXRoLCB2YWwpOyAvLyBBZGRpbmcge2tleVBhdGg6IHVuZGVmaW5lZH0gbWVhbnMgdGhhdCB0aGUga2V5UGF0aCBzaG91bGQgYmUgZGVsZXRlZC4gSGFuZGxlZCBieSBzZXRCeUtleVBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFueXRoaW5nTW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhbnl0aGluZ01vZGlmaWVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGFuZ2VzIGlzIGEgc2V0IG9mIHtrZXlQYXRoOiB2YWx1ZX0gYW5kIHBlb3BsZSBhcmUgbGlzdGVuaW5nIHRvIHRoZSB1cGRhdGluZyBob29rIHNvIHdlIG5lZWQgdG8gY2FsbCBpdCBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsbG93IGl0IHRvIGFkZCBhZGRpdGlvbmFsIG1vZGlmaWNhdGlvbnMgdG8gbWFrZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvcmlnQ2hhbmdlcyA9IGNoYW5nZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzID0gc2hhbGxvd0Nsb25lKG9yaWdDaGFuZ2VzKTsgLy8gTGV0J3Mgd29yayB3aXRoIGEgY2xvbmUgb2YgdGhlIGNoYW5nZXMga2V5UGF0aC92YWx1ZSBzZXQgc28gdGhhdCB3ZSBjYW4gcmVzdG9yZSBpdCBpbiBjYXNlIGEgaG9vayBleHRlbmRzIGl0LlxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZ5ZXIgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbnl0aGluZ01vZGlmaWVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFkZGl0aW9uYWxDaGFuZ2VzID0gdXBkYXRpbmdIb29rLmNhbGwodGhpcywgY2hhbmdlcywgdGhpcy5wcmltS2V5LCBkZWVwQ2xvbmUoaXRlbSksIHRyYW5zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRkaXRpb25hbENoYW5nZXMpIGV4dGVuZChjaGFuZ2VzLCBhZGRpdGlvbmFsQ2hhbmdlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY2hhbmdlcykuZm9yRWFjaChmdW5jdGlvbiAoa2V5UGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsID0gY2hhbmdlc1trZXlQYXRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldEJ5S2V5UGF0aChpdGVtLCBrZXlQYXRoKSAhPT0gdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRCeUtleVBhdGgoaXRlbSwga2V5UGF0aCwgdmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFueXRoaW5nTW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGl0aW9uYWxDaGFuZ2VzKSBjaGFuZ2VzID0gc2hhbGxvd0Nsb25lKG9yaWdDaGFuZ2VzKTsgLy8gUmVzdG9yZSBvcmlnaW5hbCBjaGFuZ2VzIGZvciBuZXh0IGl0ZXJhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhbnl0aGluZ01vZGlmaWVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3VjY2Vzc0NvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZXJhdGlvbkNvbXBsZXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmYWlsdXJlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmFpbEtleXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRLZXkgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG1vZGlmeUl0ZW0oaXRlbSwgY3Vyc29yLCBhZHZhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50S2V5ID0gY3Vyc29yLnByaW1hcnlLZXk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc0NvbnRleHQgPSB7IHByaW1LZXk6IGN1cnNvci5wcmltYXJ5S2V5LCB2YWx1ZTogaXRlbSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vZGlmeWVyLmNhbGwodGhpc0NvbnRleHQsIGl0ZW0pICE9PSBmYWxzZSkgeyAvLyBJZiBhIGNhbGxiYWNrIGV4cGxpY2l0ZWx5IHJldHVybnMgZmFsc2UsIGRvIG5vdCBwZXJmb3JtIHRoZSB1cGRhdGUhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJEZWxldGUgPSAhdGhpc0NvbnRleHQuaGFzT3duUHJvcGVydHkoXCJ2YWx1ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVxID0gKGJEZWxldGUgPyBjdXJzb3IuZGVsZXRlKCkgOiBjdXJzb3IudXBkYXRlKHRoaXNDb250ZXh0LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytjb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsdXJlcy5wdXNoKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsS2V5cy5wdXNoKHRoaXNDb250ZXh0LnByaW1LZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpc0NvbnRleHQub25lcnJvcikgdGhpc0NvbnRleHQub25lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tGaW5pc2hlZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gQ2F0Y2ggdGhlc2UgZXJyb3JzIGFuZCBsZXQgYSBmaW5hbCByZWplY3Rpb24gZGVjaWRlIHdoZXRoZXIgb3Igbm90IHRvIGFib3J0IGVudGlyZSB0cmFuc2FjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGJEZWxldGUgPyBbXCJkZWxldGluZ1wiLCBpdGVtLCBcImZyb21cIiwgY3R4LnRhYmxlLm5hbWVdIDogW1wibW9kaWZ5aW5nXCIsIGl0ZW0sIFwib25cIiwgY3R4LnRhYmxlLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzQ29udGV4dC5vbnN1Y2Nlc3MpIHRoaXNDb250ZXh0Lm9uc3VjY2Vzcyh0aGlzQ29udGV4dC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrc3VjY2Vzc0NvdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja0ZpbmlzaGVkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXNDb250ZXh0Lm9uc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhvb2sgd2lsbCBleHBlY3QgZWl0aGVyIG9uZXJyb3Igb3Igb25zdWNjZXNzIHRvIGFsd2F5cyBiZSBjYWxsZWQhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc0NvbnRleHQub25zdWNjZXNzKHRoaXNDb250ZXh0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGRvUmVqZWN0KGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFpbHVyZXMucHVzaChlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsS2V5cy5wdXNoKGN1cnJlbnRLZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgTW9kaWZ5RXJyb3IoXCJFcnJvciBtb2RpZnlpbmcgb25lIG9yIG1vcmUgb2JqZWN0c1wiLCBmYWlsdXJlcywgc3VjY2Vzc0NvdW50LCBmYWlsS2V5cykpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gY2hlY2tGaW5pc2hlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVyYXRpb25Db21wbGV0ZSAmJiBzdWNjZXNzQ291bnQgKyBmYWlsdXJlcy5sZW5ndGggPT09IGNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZhaWx1cmVzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvUmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHN1Y2Nlc3NDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5faXRlcmF0ZShtb2RpZnlJdGVtLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRpb25Db21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja0ZpbmlzaGVkKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGRvUmVqZWN0LCBpZGJzdG9yZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAnZGVsZXRlJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1vZGlmeShmdW5jdGlvbiAoKSB7IGRlbGV0ZSB0aGlzLnZhbHVlOyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEhlbHAgZnVuY3Rpb25zIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuXG4gICAgICAgIGZ1bmN0aW9uIGxvd2VyVmVyc2lvbkZpcnN0KGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhLl9jZmcudmVyc2lvbiAtIGIuX2NmZy52ZXJzaW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0QXBpT25QbGFjZShvYmpzLCB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5LCB0YWJsZU5hbWVzLCBtb2RlLCBkYnNjaGVtYSwgZW5hYmxlUHJvaGliaXRlZERCKSB7XG4gICAgICAgICAgICB0YWJsZU5hbWVzLmZvckVhY2goZnVuY3Rpb24gKHRhYmxlTmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciB0YWJsZUluc3RhbmNlID0gZGIuX3RhYmxlRmFjdG9yeShtb2RlLCBkYnNjaGVtYVt0YWJsZU5hbWVdLCB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5KTtcbiAgICAgICAgICAgICAgICBvYmpzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW9ialt0YWJsZU5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5hYmxlUHJvaGliaXRlZERCKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgdGFibGVOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR2YXIgY3VycmVudFRyYW5zID0gUHJvbWlzZS5QU0QgJiYgUHJvbWlzZS5QU0QudHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFRyYW5zICYmIGN1cnJlbnRUcmFucy5kYiA9PT0gZGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudFRyYW5zLnRhYmxlc1t0YWJsZU5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhYmxlSW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqW3RhYmxlTmFtZV0gPSB0YWJsZUluc3RhbmNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZVRhYmxlc0FwaShvYmpzKSB7XG4gICAgICAgICAgICBvYmpzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9ialtrZXldIGluc3RhbmNlb2YgVGFibGUpIGRlbGV0ZSBvYmpba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGl0ZXJhdGUocmVxLCBmaWx0ZXIsIGZuLCByZXNvbHZlLCByZWplY3QsIHJlYWRpbmdIb29rKSB7XG4gICAgICAgICAgICB2YXIgcHNkID0gUHJvbWlzZS5QU0Q7XG4gICAgICAgICAgICByZWFkaW5nSG9vayA9IHJlYWRpbmdIb29rIHx8IG1pcnJvcjtcbiAgICAgICAgICAgIGlmICghcmVxLm9uZXJyb3IpIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCk7XG4gICAgICAgICAgICBpZiAoZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IHRyeWNhdGNoKGZ1bmN0aW9uIGZpbHRlcl9yZWNvcmQoZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyc29yID0gcmVxLnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBmdW5jdGlvbiAoKSB7IGN1cnNvci5jb250aW51ZSgpOyB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbHRlcihjdXJzb3IsIGZ1bmN0aW9uIChhZHZhbmNlcikgeyBjID0gYWR2YW5jZXI7IH0sIHJlc29sdmUsIHJlamVjdCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4ocmVhZGluZ0hvb2soY3Vyc29yLnZhbHVlKSwgY3Vyc29yLCBmdW5jdGlvbiAoYWR2YW5jZXIpIHsgYyA9IGFkdmFuY2VyOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIHJlamVjdCwgcHNkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IHRyeWNhdGNoKGZ1bmN0aW9uIGZpbHRlcl9yZWNvcmQoZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyc29yID0gcmVxLnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBmdW5jdGlvbiAoKSB7IGN1cnNvci5jb250aW51ZSgpOyB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm4ocmVhZGluZ0hvb2soY3Vyc29yLnZhbHVlKSwgY3Vyc29yLCBmdW5jdGlvbiAoYWR2YW5jZXIpIHsgYyA9IGFkdmFuY2VyOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIHJlamVjdCwgcHNkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlSW5kZXhTeW50YXgoaW5kZXhlcykge1xuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiaW5kZXhlc1wiIHR5cGU9XCJTdHJpbmdcIj48L3BhcmFtPlxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJBcnJheVwiIGVsZW1lbnRUeXBlPVwiSW5kZXhTcGVjXCI+PC9yZXR1cm5zPlxuICAgICAgICAgICAgdmFyIHJ2ID0gW107XG4gICAgICAgICAgICBpbmRleGVzLnNwbGl0KCcsJykuZm9yRWFjaChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGluZGV4LnRyaW0oKTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IGluZGV4LnJlcGxhY2UoXCImXCIsIFwiXCIpLnJlcGxhY2UoXCIrK1wiLCBcIlwiKS5yZXBsYWNlKFwiKlwiLCBcIlwiKTtcbiAgICAgICAgICAgICAgICB2YXIga2V5UGF0aCA9IChuYW1lLmluZGV4T2YoJ1snKSAhPT0gMCA/IG5hbWUgOiBpbmRleC5zdWJzdHJpbmcoaW5kZXguaW5kZXhPZignWycpICsgMSwgaW5kZXguaW5kZXhPZignXScpKS5zcGxpdCgnKycpKTtcblxuICAgICAgICAgICAgICAgIHJ2LnB1c2gobmV3IEluZGV4U3BlYyhcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAga2V5UGF0aCB8fCBudWxsLFxuICAgICAgICAgICAgICAgICAgICBpbmRleC5pbmRleE9mKCcmJykgIT09IC0xLFxuICAgICAgICAgICAgICAgICAgICBpbmRleC5pbmRleE9mKCcqJykgIT09IC0xLFxuICAgICAgICAgICAgICAgICAgICBpbmRleC5pbmRleE9mKFwiKytcIikgIT09IC0xLFxuICAgICAgICAgICAgICAgICAgICBBcnJheS5pc0FycmF5KGtleVBhdGgpLFxuICAgICAgICAgICAgICAgICAgICBrZXlQYXRoLmluZGV4T2YoJy4nKSAhPT0gLTFcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYXNjZW5kaW5nKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRlc2NlbmRpbmcoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgPCBiID8gMSA6IGEgPiBiID8gLTEgOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcG91bmRDb21wYXJlKGl0ZW1Db21wYXJlKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGl0ZW1Db21wYXJlKGFbaV0sIGJbaV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSAwKSByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICArK2k7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09PSBhLmxlbmd0aCB8fCBpID09PSBiLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtQ29tcGFyZShhLmxlbmd0aCwgYi5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21iaW5lKGZpbHRlcjEsIGZpbHRlcjIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXIxID8gZmlsdGVyMiA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZpbHRlcjEuYXBwbHkodGhpcywgYXJndW1lbnRzKSAmJiBmaWx0ZXIyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gOiBmaWx0ZXIxIDogZmlsdGVyMjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhhc0lFRGVsZXRlT2JqZWN0U3RvcmVCdWcoKSB7XG4gICAgICAgICAgICAvLyBBc3N1bWUgYnVnIGlzIHByZXNlbnQgaW4gSUUxMCBhbmQgSUUxMSBidXQgZG9udCBleHBlY3QgaXQgaW4gbmV4dCB2ZXJzaW9uIG9mIElFIChJRTEyKVxuICAgICAgICAgICAgcmV0dXJuIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIlRyaWRlbnRcIikgPj0gMCB8fCBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJNU0lFXCIpID49IDA7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZWFkR2xvYmFsU2NoZW1hKCkge1xuICAgICAgICAgICAgZGIudmVybm8gPSBpZGJkYi52ZXJzaW9uIC8gMTA7XG4gICAgICAgICAgICBkYi5fZGJTY2hlbWEgPSBnbG9iYWxTY2hlbWEgPSB7fTtcbiAgICAgICAgICAgIGRiU3RvcmVOYW1lcyA9IFtdLnNsaWNlLmNhbGwoaWRiZGIub2JqZWN0U3RvcmVOYW1lcywgMCk7XG4gICAgICAgICAgICBpZiAoZGJTdG9yZU5hbWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuOyAvLyBEYXRhYmFzZSBjb250YWlucyBubyBzdG9yZXMuXG4gICAgICAgICAgICB2YXIgdHJhbnMgPSBpZGJkYi50cmFuc2FjdGlvbihzYWZhcmlNdWx0aVN0b3JlRml4KGRiU3RvcmVOYW1lcyksICdyZWFkb25seScpO1xuICAgICAgICAgICAgZGJTdG9yZU5hbWVzLmZvckVhY2goZnVuY3Rpb24gKHN0b3JlTmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IHRyYW5zLm9iamVjdFN0b3JlKHN0b3JlTmFtZSksXG4gICAgICAgICAgICAgICAgICAgIGtleVBhdGggPSBzdG9yZS5rZXlQYXRoLFxuICAgICAgICAgICAgICAgICAgICBkb3R0ZWQgPSBrZXlQYXRoICYmIHR5cGVvZiBrZXlQYXRoID09PSAnc3RyaW5nJyAmJiBrZXlQYXRoLmluZGV4T2YoJy4nKSAhPT0gLTE7XG4gICAgICAgICAgICAgICAgdmFyIHByaW1LZXkgPSBuZXcgSW5kZXhTcGVjKGtleVBhdGgsIGtleVBhdGggfHwgXCJcIiwgZmFsc2UsIGZhbHNlLCAhIXN0b3JlLmF1dG9JbmNyZW1lbnQsIGtleVBhdGggJiYgdHlwZW9mIGtleVBhdGggIT09ICdzdHJpbmcnLCBkb3R0ZWQpO1xuICAgICAgICAgICAgICAgIHZhciBpbmRleGVzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzdG9yZS5pbmRleE5hbWVzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZGJpbmRleCA9IHN0b3JlLmluZGV4KHN0b3JlLmluZGV4TmFtZXNbal0pO1xuICAgICAgICAgICAgICAgICAgICBrZXlQYXRoID0gaWRiaW5kZXgua2V5UGF0aDtcbiAgICAgICAgICAgICAgICAgICAgZG90dGVkID0ga2V5UGF0aCAmJiB0eXBlb2Yga2V5UGF0aCA9PT0gJ3N0cmluZycgJiYga2V5UGF0aC5pbmRleE9mKCcuJykgIT09IC0xO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBuZXcgSW5kZXhTcGVjKGlkYmluZGV4Lm5hbWUsIGtleVBhdGgsICEhaWRiaW5kZXgudW5pcXVlLCAhIWlkYmluZGV4Lm11bHRpRW50cnksIGZhbHNlLCBrZXlQYXRoICYmIHR5cGVvZiBrZXlQYXRoICE9PSAnc3RyaW5nJywgZG90dGVkKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhlcy5wdXNoKGluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZ2xvYmFsU2NoZW1hW3N0b3JlTmFtZV0gPSBuZXcgVGFibGVTY2hlbWEoc3RvcmVOYW1lLCBwcmltS2V5LCBpbmRleGVzLCB7fSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNldEFwaU9uUGxhY2UoW2FsbFRhYmxlc10sIGRiLl90cmFuc1Byb21pc2VGYWN0b3J5LCBPYmplY3Qua2V5cyhnbG9iYWxTY2hlbWEpLCBSRUFEV1JJVEUsIGdsb2JhbFNjaGVtYSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZGp1c3RUb0V4aXN0aW5nSW5kZXhOYW1lcyhzY2hlbWEsIGlkYnRyYW5zKSB7XG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgICAgICAvLy8gSXNzdWUgIzMwIFByb2JsZW0gd2l0aCBleGlzdGluZyBkYiAtIGFkanVzdCB0byBleGlzdGluZyBpbmRleCBuYW1lcyB3aGVuIG1pZ3JhdGluZyBmcm9tIG5vbi1kZXhpZSBkYlxuICAgICAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInNjaGVtYVwiIHR5cGU9XCJPYmplY3RcIj5NYXAgYmV0d2VlbiBuYW1lIGFuZCBUYWJsZVNjaGVtYTwvcGFyYW0+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJpZGJ0cmFuc1wiIHR5cGU9XCJJREJUcmFuc2FjdGlvblwiPjwvcGFyYW0+XG4gICAgICAgICAgICB2YXIgc3RvcmVOYW1lcyA9IGlkYnRyYW5zLmRiLm9iamVjdFN0b3JlTmFtZXM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0b3JlTmFtZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcmVOYW1lID0gc3RvcmVOYW1lc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSBpZGJ0cmFucy5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3RvcmUuaW5kZXhOYW1lcy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXhOYW1lID0gc3RvcmUuaW5kZXhOYW1lc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleVBhdGggPSBzdG9yZS5pbmRleChpbmRleE5hbWUpLmtleVBhdGg7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXhpZU5hbWUgPSB0eXBlb2Yga2V5UGF0aCA9PT0gJ3N0cmluZycgPyBrZXlQYXRoIDogXCJbXCIgKyBbXS5zbGljZS5jYWxsKGtleVBhdGgpLmpvaW4oJysnKSArIFwiXVwiO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NoZW1hW3N0b3JlTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleFNwZWMgPSBzY2hlbWFbc3RvcmVOYW1lXS5pZHhCeU5hbWVbZGV4aWVOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleFNwZWMpIGluZGV4U3BlYy5uYW1lID0gaW5kZXhOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXh0ZW5kKHRoaXMsIHtcbiAgICAgICAgICAgIENvbGxlY3Rpb246IENvbGxlY3Rpb24sXG4gICAgICAgICAgICBUYWJsZTogVGFibGUsXG4gICAgICAgICAgICBUcmFuc2FjdGlvbjogVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBWZXJzaW9uOiBWZXJzaW9uLFxuICAgICAgICAgICAgV2hlcmVDbGF1c2U6IFdoZXJlQ2xhdXNlLFxuICAgICAgICAgICAgV3JpdGVhYmxlQ29sbGVjdGlvbjogV3JpdGVhYmxlQ29sbGVjdGlvbixcbiAgICAgICAgICAgIFdyaXRlYWJsZVRhYmxlOiBXcml0ZWFibGVUYWJsZVxuICAgICAgICB9KTtcblxuICAgICAgICBpbml0KCk7XG5cbiAgICAgICAgYWRkb25zLmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBmbihkYik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vXG4gICAgLy8gUHJvbWlzZSBDbGFzc1xuICAgIC8vXG4gICAgLy8gQSB2YXJpYW50IG9mIHByb21pc2UtbGlnaHQgKGh0dHBzOi8vZ2l0aHViLmNvbS90YXlsb3JoYWtlcy9wcm9taXNlLWxpZ2h0KSBieSBodHRwczovL2dpdGh1Yi5jb20vdGF5bG9yaGFrZXMgLSBhbiBBKyBhbmQgRUNNQVNDUklQVCA2IGNvbXBsaWFudCBQcm9taXNlIGltcGxlbWVudGF0aW9uLlxuICAgIC8vXG4gICAgLy8gTW9kaWZpZWQgYnkgRGF2aWQgRmFobGFuZGVyIHRvIGJlIGluZGV4ZWREQiBjb21wbGlhbnQgKFNlZSBkaXNjdXNzaW9uOiBodHRwczovL2dpdGh1Yi5jb20vcHJvbWlzZXMtYXBsdXMvcHJvbWlzZXMtc3BlYy9pc3N1ZXMvNDUpIC5cbiAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIHdpbGwgbm90IHVzZSBzZXRUaW1lb3V0IG9yIHNldEltbWVkaWF0ZSB3aGVuIGl0J3Mgbm90IG5lZWRlZC4gVGhlIGJlaGF2aW9yIGlzIDEwMCUgUHJvbWlzZS9BKyBjb21wbGlhbnQgc2luY2VcbiAgICAvLyB0aGUgY2FsbGVyIG9mIG5ldyBQcm9taXNlKCkgY2FuIGJlIGNlcnRhaW4gdGhhdCB0aGUgcHJvbWlzZSB3b250IGJlIHRyaWdnZXJlZCB0aGUgbGluZXMgYWZ0ZXIgY29uc3RydWN0aW5nIHRoZSBwcm9taXNlLiBXZSBmaXggdGhpcyBieSB1c2luZyB0aGUgbWVtYmVyIHZhcmlhYmxlIGNvbnN0cnVjdGluZyB0byBjaGVja1xuICAgIC8vIHdoZXRoZXIgdGhlIG9iamVjdCBpcyBiZWluZyBjb25zdHJ1Y3RlZCB3aGVuIHJlamVjdCBvciByZXNvbHZlIGlzIGNhbGxlZC4gSWYgc28sIHRoZSB1c2Ugc2V0VGltZW91dC9zZXRJbW1lZGlhdGUgdG8gZnVsZmlsbCB0aGUgcHJvbWlzZSwgb3RoZXJ3aXNlLCB3ZSBrbm93IHRoYXQgaXQncyBub3QgbmVlZGVkLlxuICAgIC8vXG4gICAgLy8gVGhpcyB0b3BpYyB3YXMgYWxzbyBkaXNjdXNzZWQgaW4gdGhlIGZvbGxvd2luZyB0aHJlYWQ6IGh0dHBzOi8vZ2l0aHViLmNvbS9wcm9taXNlcy1hcGx1cy9wcm9taXNlcy1zcGVjL2lzc3Vlcy80NSBhbmQgdGhpcyBpbXBsZW1lbnRhdGlvbiBzb2x2ZXMgdGhhdCBpc3N1ZS5cbiAgICAvL1xuICAgIC8vIEFub3RoZXIgZmVhdHVyZSB3aXRoIHRoaXMgUHJvbWlzZSBpbXBsZW1lbnRhdGlvbiBpcyB0aGF0IHJlamVjdCB3aWxsIHJldHVybiBmYWxzZSBpbiBjYXNlIG5vIG9uZSBjYXRjaGVkIHRoZSByZWplY3QgY2FsbC4gVGhpcyBpcyB1c2VkXG4gICAgLy8gdG8gc3RvcFByb3BhZ2F0aW9uKCkgb24gdGhlIElEQlJlcXVlc3QgZXJyb3IgZXZlbnQgaW4gY2FzZSBpdCB3YXMgY2F0Y2hlZCBidXQgbm90IG90aGVyd2lzZS5cbiAgICAvL1xuICAgIC8vIEFsc28sIHRoZSBldmVudCBuZXcgUHJvbWlzZSgpLm9udW5jYXRjaGVkIGlzIGNhbGxlZCBpbiBjYXNlIG5vIG9uZSBjYXRjaGVzIGEgcmVqZWN0IGNhbGwuIFRoaXMgaXMgdXNlZCBmb3IgdXMgdG8gbWFudWFsbHkgYnViYmxlIGFueSByZXF1ZXN0XG4gICAgLy8gZXJyb3JzIHRvIHRoZSB0cmFuc2FjdGlvbi4gV2UgbXVzdCBub3QgcmVseSBvbiBJbmRleGVkREIgaW1wbGVtZW50YXRpb24gdG8gZG8gdGhpcywgYmVjYXVzZSBpdCBvbmx5IGRvZXMgc28gd2hlbiB0aGUgc291cmNlIG9mIHRoZSByZWplY3Rpb25cbiAgICAvLyBpcyBhbiBlcnJvciBldmVudCBvbiBhIHJlcXVlc3QsIG5vdCBpbiBjYXNlIGFuIG9yZGluYXJ5IGV4Y2VwdGlvbiBpcyB0aHJvd24uXG4gICAgdmFyIFByb21pc2UgPSAoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8vIFRoZSB1c2Ugb2YgYXNhcCBpbiBoYW5kbGUoKSBpcyByZW1hcmtlZCBiZWNhdXNlIHdlIG11c3QgTk9UIHVzZSBzZXRUaW1lb3V0KGZuLDApIGJlY2F1c2UgaXQgY2F1c2VzIHByZW1hdHVyZSBjb21taXQgb2YgaW5kZXhlZERCIHRyYW5zYWN0aW9ucyAtIHdoaWNoIGlzIGFjY29yZGluZyB0byBpbmRleGVkREIgc3BlY2lmaWNhdGlvbi5cbiAgICAgICAgdmFyIF9zbGljZSA9IFtdLnNsaWNlO1xuICAgICAgICB2YXIgX2FzYXAgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAndW5kZWZpbmVkJyA/IGZ1bmN0aW9uKGZuLCBhcmcxLCBhcmcyLCBhcmdOKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGZuLmFwcGx5KGdsb2JhbCwgX3NsaWNlLmNhbGwoYXJncywgMSkpOyB9LCAwKTsgLy8gSWYgbm90IEZGMTMgYW5kIGVhcmxpZXIgZmFpbGVkLCB3ZSBjb3VsZCB1c2UgdGhpcyBjYWxsIGhlcmUgaW5zdGVhZDogc2V0VGltZW91dC5jYWxsKHRoaXMsIFtmbiwgMF0uY29uY2F0KGFyZ3VtZW50cykpO1xuICAgICAgICB9IDogc2V0SW1tZWRpYXRlOyAvLyBJRTEwKyBhbmQgbm9kZS5cblxuICAgICAgICBkb0Zha2VBdXRvQ29tcGxldGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gU2ltcGxpZnkgdGhlIGpvYiBmb3IgVlMgSW50ZWxsaXNlbnNlLiBUaGlzIHBpZWNlIG9mIGNvZGUgaXMgb25lIG9mIHRoZSBrZXlzIHRvIHRoZSBuZXcgbWFydmVsbG91cyBpbnRlbGxpc2Vuc2Ugc3VwcG9ydCBpbiBEZXhpZS5cbiAgICAgICAgICAgIF9hc2FwID0gYXNhcCA9IGVucXVldWVJbW1lZGlhdGUgPSBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzOyBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBmbi5hcHBseShnbG9iYWwsIF9zbGljZS5jYWxsKGFyZ3MsIDEpKTsgfSwgMCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgYXNhcCA9IF9hc2FwLFxuICAgICAgICAgICAgaXNSb290RXhlY3V0aW9uID0gdHJ1ZTtcblxuICAgICAgICB2YXIgb3BlcmF0aW9uc1F1ZXVlID0gW107XG4gICAgICAgIHZhciB0aWNrRmluYWxpemVycyA9IFtdO1xuICAgICAgICBmdW5jdGlvbiBlbnF1ZXVlSW1tZWRpYXRlKGZuLCBhcmdzKSB7XG4gICAgICAgICAgICBvcGVyYXRpb25zUXVldWUucHVzaChbZm4sIF9zbGljZS5jYWxsKGFyZ3VtZW50cywgMSldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGV4ZWN1dGVPcGVyYXRpb25zUXVldWUoKSB7XG4gICAgICAgICAgICB2YXIgcXVldWUgPSBvcGVyYXRpb25zUXVldWU7XG4gICAgICAgICAgICBvcGVyYXRpb25zUXVldWUgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcXVldWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBxdWV1ZVtpXTtcbiAgICAgICAgICAgICAgICBpdGVtWzBdLmFwcGx5KGdsb2JhbCwgaXRlbVsxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL3ZhciBQcm9taXNlSUQgPSAwO1xuICAgICAgICBmdW5jdGlvbiBQcm9taXNlKGZuKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdvYmplY3QnKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdQcm9taXNlcyBtdXN0IGJlIGNvbnN0cnVjdGVkIHZpYSBuZXcnKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ25vdCBhIGZ1bmN0aW9uJyk7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IG51bGw7IC8vIG51bGwgKD1wZW5kaW5nKSwgZmFsc2UgKD1yZWplY3RlZCkgb3IgdHJ1ZSAoPXJlc29sdmVkKVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBudWxsOyAvLyBlcnJvciBvciByZXN1bHRcbiAgICAgICAgICAgIHRoaXMuX2RlZmVycmVkcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fY2F0Y2hlZCA9IGZhbHNlOyAvLyBmb3Igb251bmNhdGNoZWRcbiAgICAgICAgICAgIC8vdGhpcy5faWQgPSArK1Byb21pc2VJRDtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciBjb25zdHJ1Y3RpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fUFNEID0gUHJvbWlzZS5QU0Q7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZG9SZXNvbHZlKHRoaXMsIGZuLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uc3RydWN0aW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgYXNhcChyZXNvbHZlLCBzZWxmLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzZWxmLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25zdHJ1Y3RpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzYXAocmVqZWN0LCBzZWxmLCByZWFzb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChzZWxmLCByZWFzb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGNvbnN0cnVjdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlKHNlbGYsIGRlZmVycmVkKSB7XG4gICAgICAgICAgICBpZiAoc2VsZi5fc3RhdGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9kZWZlcnJlZHMucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY2IgPSBzZWxmLl9zdGF0ZSA/IGRlZmVycmVkLm9uRnVsZmlsbGVkIDogZGVmZXJyZWQub25SZWplY3RlZDtcbiAgICAgICAgICAgIGlmIChjYiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgRGVmZXJyZWQgZG9lc250IGhhdmUgYSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGJlaW5nIHRyaWdnZXJlZCAob25GdWxmaWxsZWQgb3Igb25SZWplY3QpIHNvIGxldHMgZm9yd2FyZCB0aGUgZXZlbnQgdG8gYW55IGV2ZW50dWFsIGxpc3RlbmVycyBvbiB0aGUgUHJvbWlzZSBpbnN0YW5jZSByZXR1cm5lZCBieSB0aGVuKCkgb3IgY2F0Y2goKVxuICAgICAgICAgICAgICAgIHJldHVybiAoc2VsZi5fc3RhdGUgPyBkZWZlcnJlZC5yZXNvbHZlIDogZGVmZXJyZWQucmVqZWN0KShzZWxmLl92YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmV0LCBpc1Jvb3RFeGVjID0gaXNSb290RXhlY3V0aW9uO1xuICAgICAgICAgICAgaXNSb290RXhlY3V0aW9uID0gZmFsc2U7XG4gICAgICAgICAgICBhc2FwID0gZW5xdWV1ZUltbWVkaWF0ZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIG91dGVyUFNEID0gUHJvbWlzZS5QU0Q7XG4gICAgICAgICAgICAgICAgUHJvbWlzZS5QU0QgPSBzZWxmLl9QU0Q7XG4gICAgICAgICAgICAgICAgcmV0ID0gY2Ioc2VsZi5fdmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmICghc2VsZi5fc3RhdGUgJiYgKCFyZXQgfHwgdHlwZW9mIHJldC50aGVuICE9PSAnZnVuY3Rpb24nIHx8IHJldC5fc3RhdGUgIT09IGZhbHNlKSkgc2V0Q2F0Y2hlZChzZWxmKTsgLy8gQ2FsbGVyIGRpZCAncmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7JyAtIGRvbid0IHJlZ2FyZCBpdCBhcyBjYXRjaGVkIVxuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmV0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2F0Y2hlZCA9IGRlZmVycmVkLnJlamVjdChlKTtcbiAgICAgICAgICAgICAgICBpZiAoIWNhdGNoZWQgJiYgc2VsZi5vbnVuY2F0Y2hlZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbnVuY2F0Y2hlZChlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBQcm9taXNlLlBTRCA9IG91dGVyUFNEO1xuICAgICAgICAgICAgICAgIGlmIChpc1Jvb3RFeGVjKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChvcGVyYXRpb25zUXVldWUubGVuZ3RoID4gMCkgZXhlY3V0ZU9wZXJhdGlvbnNRdWV1ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbmFsaXplciA9IHRpY2tGaW5hbGl6ZXJzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbmFsaXplcikgdHJ5IHtmaW5hbGl6ZXIoKTt9IGNhdGNoKGUpe31cbiAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAodGlja0ZpbmFsaXplcnMubGVuZ3RoID4gMCB8fCBvcGVyYXRpb25zUXVldWUubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgICAgIGFzYXAgPSBfYXNhcDtcbiAgICAgICAgICAgICAgICAgICAgaXNSb290RXhlY3V0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfcm9vdEV4ZWMoZm4pIHtcbiAgICAgICAgICAgIHZhciBpc1Jvb3RFeGVjID0gaXNSb290RXhlY3V0aW9uO1xuICAgICAgICAgICAgaXNSb290RXhlY3V0aW9uID0gZmFsc2U7XG4gICAgICAgICAgICBhc2FwID0gZW5xdWV1ZUltbWVkaWF0ZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzUm9vdEV4ZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG9wZXJhdGlvbnNRdWV1ZS5sZW5ndGggPiAwKSBleGVjdXRlT3BlcmF0aW9uc1F1ZXVlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmluYWxpemVyID0gdGlja0ZpbmFsaXplcnMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmluYWxpemVyKSB0cnkgeyBmaW5hbGl6ZXIoKTsgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKHRpY2tGaW5hbGl6ZXJzLmxlbmd0aCA+IDAgfHwgb3BlcmF0aW9uc1F1ZXVlLmxlbmd0aCA+IDApO1xuICAgICAgICAgICAgICAgICAgICBhc2FwID0gX2FzYXA7XG4gICAgICAgICAgICAgICAgICAgIGlzUm9vdEV4ZWN1dGlvbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0Q2F0Y2hlZChwcm9taXNlKSB7XG4gICAgICAgICAgICBwcm9taXNlLl9jYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChwcm9taXNlLl9wYXJlbnQpIHNldENhdGNoZWQocHJvbWlzZS5fcGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJlc29sdmUocHJvbWlzZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBvdXRlclBTRCA9IFByb21pc2UuUFNEO1xuICAgICAgICAgICAgUHJvbWlzZS5QU0QgPSBwcm9taXNlLl9QU0Q7XG4gICAgICAgICAgICB0cnkgeyAvL1Byb21pc2UgUmVzb2x1dGlvbiBQcm9jZWR1cmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9wcm9taXNlcy1hcGx1cy9wcm9taXNlcy1zcGVjI3RoZS1wcm9taXNlLXJlc29sdXRpb24tcHJvY2VkdXJlXG4gICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBwcm9taXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBIHByb21pc2UgY2Fubm90IGJlIHJlc29sdmVkIHdpdGggaXRzZWxmLicpO1xuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAmJiAodHlwZW9mIG5ld1ZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgbmV3VmFsdWUgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbmV3VmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9SZXNvbHZlKHByb21pc2UsIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL25ld1ZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSA/IG5ld1ZhbHVlLl90aGVuKHJlc29sdmUsIHJlamVjdCkgOiBuZXdWYWx1ZS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHByb21pc2UsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJvbWlzZS5fc3RhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByb21pc2UuX3ZhbHVlID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgZmluYWxlLmNhbGwocHJvbWlzZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBQcm9taXNlLlBTRCA9IG91dGVyUFNEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0KHByb21pc2UsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgb3V0ZXJQU0QgPSBQcm9taXNlLlBTRDtcbiAgICAgICAgICAgIFByb21pc2UuUFNEID0gcHJvbWlzZS5fUFNEO1xuICAgICAgICAgICAgcHJvbWlzZS5fc3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIHByb21pc2UuX3ZhbHVlID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgIGZpbmFsZS5jYWxsKHByb21pc2UpO1xuICAgICAgICAgICAgaWYgKCFwcm9taXNlLl9jYXRjaGVkKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb21pc2Uub251bmNhdGNoZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlLm9udW5jYXRjaGVkKHByb21pc2UuX3ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5vbi5lcnJvci5maXJlKHByb21pc2UuX3ZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgUHJvbWlzZS5QU0QgPSBvdXRlclBTRDtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLl9jYXRjaGVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZmluYWxlKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX2RlZmVycmVkcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGhhbmRsZSh0aGlzLCB0aGlzLl9kZWZlcnJlZHNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZGVmZXJyZWRzID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBEZWZlcnJlZChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICB0aGlzLm9uRnVsZmlsbGVkID0gdHlwZW9mIG9uRnVsZmlsbGVkID09PSAnZnVuY3Rpb24nID8gb25GdWxmaWxsZWQgOiBudWxsO1xuICAgICAgICAgICAgdGhpcy5vblJlamVjdGVkID0gdHlwZW9mIG9uUmVqZWN0ZWQgPT09ICdmdW5jdGlvbicgPyBvblJlamVjdGVkIDogbnVsbDtcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgICAgICB0aGlzLnJlamVjdCA9IHJlamVjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUYWtlIGEgcG90ZW50aWFsbHkgbWlzYmVoYXZpbmcgcmVzb2x2ZXIgZnVuY3Rpb24gYW5kIG1ha2Ugc3VyZVxuICAgICAgICAgKiBvbkZ1bGZpbGxlZCBhbmQgb25SZWplY3RlZCBhcmUgb25seSBjYWxsZWQgb25jZS5cbiAgICAgICAgICpcbiAgICAgICAgICogTWFrZXMgbm8gZ3VhcmFudGVlcyBhYm91dCBhc3luY2hyb255LlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZG9SZXNvbHZlKHByb21pc2UsIGZuLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICAgICAgICAgICAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm4oZnVuY3Rpb24gUHJvbWlzZV9yZXNvbHZlKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb25lKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBvbkZ1bGZpbGxlZCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gUHJvbWlzZV9yZWplY3QocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb25lKSByZXR1cm4gcHJvbWlzZS5fY2F0Y2hlZDtcbiAgICAgICAgICAgICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvblJlamVjdGVkKHJlYXNvbik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgIGlmIChkb25lKSByZXR1cm47XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9uUmVqZWN0ZWQoZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgUHJvbWlzZS5vbiA9IGV2ZW50cyhudWxsLCBcImVycm9yXCIpO1xuXG4gICAgICAgIFByb21pc2UuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYXJndW1lbnRzWzBdKSA/IGFyZ3VtZW50c1swXSA6IGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSByZXR1cm4gcmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgICAgdmFyIHJlbWFpbmluZyA9IGFyZ3MubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlcyhpLCB2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwgJiYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZW4gPSB2YWwudGhlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbi5jYWxsKHZhbCwgZnVuY3Rpb24gKHZhbCkgeyByZXMoaSwgdmFsKTsgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbaV0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzKGksIGFyZ3NbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qIFByb3RvdHlwZSBNZXRob2RzICovXG4gICAgICAgIFByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiAob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLl9zdGF0ZSA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlKHNlbGYsIG5ldyBEZWZlcnJlZChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzb2x2ZSwgcmVqZWN0KSk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBhc2FwKGhhbmRsZSwgc2VsZiwgbmV3IERlZmVycmVkKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXNvbHZlLCByZWplY3QpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcC5fUFNEID0gdGhpcy5fUFNEO1xuICAgICAgICAgICAgcC5vbnVuY2F0Y2hlZCA9IHRoaXMub251bmNhdGNoZWQ7IC8vIE5lZWRlZCB3aGVuIGV4Y2VwdGlvbiBvY2N1cnMgaW4gYSB0aGVuKCkgY2xhdXNlIG9mIGEgc3VjY2Vzc2Z1bCBwYXJlbnQgcHJvbWlzZS4gV2FudCBvbnVuY2F0Y2hlZCB0byBiZSBjYWxsZWQgZXZlbiBpbiBjYWxsYmFja3Mgb2YgY2FsbGJhY2tzIG9mIHRoZSBvcmlnaW5hbCBwcm9taXNlLlxuICAgICAgICAgICAgcC5fcGFyZW50ID0gdGhpczsgLy8gVXNlZCBmb3IgcmVjdXJzaXZlbHkgY2FsbGluZyBvbnVuY2F0Y2hlZCBldmVudCBvbiBzZWxmIGFuZCBhbGwgcGFyZW50cy5cbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICB9O1xuXG4gICAgICAgIFByb21pc2UucHJvdG90eXBlLl90aGVuID0gZnVuY3Rpb24gKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gICAgICAgICAgICBoYW5kbGUodGhpcywgbmV3IERlZmVycmVkKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCBub3Asbm9wKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGVbJ2NhdGNoJ10gPSBmdW5jdGlvbiAob25SZWplY3RlZCkge1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3RlZCk7XG4gICAgICAgICAgICAvLyBGaXJzdCBhcmd1bWVudCBpcyB0aGUgRXJyb3IgdHlwZSB0byBjYXRjaFxuICAgICAgICAgICAgdmFyIHR5cGUgPSBhcmd1bWVudHNbMF0sIGNhbGxiYWNrID0gYXJndW1lbnRzWzFdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlID09PSAnZnVuY3Rpb24nKSByZXR1cm4gdGhpcy50aGVuKG51bGwsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2F0Y2hpbmcgZXJyb3JzIGJ5IGl0cyBjb25zdHJ1Y3RvciB0eXBlIChzaW1pbGFyIHRvIGphdmEgLyBjKysgLyBjIylcbiAgICAgICAgICAgICAgICAvLyBTYW1wbGU6IHByb21pc2UuY2F0Y2goVHlwZUVycm9yLCBmdW5jdGlvbiAoZSkgeyAuLi4gfSk7XG4gICAgICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiB0eXBlKSByZXR1cm4gY2FsbGJhY2soZSk7IGVsc2UgcmV0dXJuIFByb21pc2UucmVqZWN0KGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBlbHNlIHJldHVybiB0aGlzLnRoZW4obnVsbCwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBDYXRjaGluZyBlcnJvcnMgYnkgdGhlIGVycm9yLm5hbWUgcHJvcGVydHkuIE1ha2VzIHNlbnNlIGZvciBpbmRleGVkREIgd2hlcmUgZXJyb3IgdHlwZVxuICAgICAgICAgICAgICAgIC8vIGlzIGFsd2F5cyBET01FcnJvciBidXQgd2hlcmUgZS5uYW1lIHRlbGxzIHRoZSBhY3R1YWwgZXJyb3IgdHlwZS5cbiAgICAgICAgICAgICAgICAvLyBTYW1wbGU6IHByb21pc2UuY2F0Y2goJ0NvbnN0cmFpbnRFcnJvcicsIGZ1bmN0aW9uIChlKSB7IC4uLiB9KTtcbiAgICAgICAgICAgICAgICBpZiAoZSAmJiBlLm5hbWUgPT09IHR5cGUpIHJldHVybiBjYWxsYmFjayhlKTsgZWxzZSByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBQcm9taXNlLnByb3RvdHlwZVsnZmluYWxseSddID0gZnVuY3Rpb24gKG9uRmluYWxseSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBvbkZpbmFsbHkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgb25GaW5hbGx5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBQcm9taXNlLnByb3RvdHlwZS5vbnVuY2F0Y2hlZCA9IG51bGw7IC8vIE9wdGlvbmFsIGV2ZW50IHRyaWdnZXJlZCBpZiBwcm9taXNlIGlzIHJlamVjdGVkIGJ1dCBubyBvbmUgbGlzdGVuZWQuXG5cbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgICAgICBwLl9zdGF0ZSA9IHRydWU7XG4gICAgICAgICAgICBwLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgIH07XG5cbiAgICAgICAgUHJvbWlzZS5yZWplY3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKCkgeyB9KTtcbiAgICAgICAgICAgIHAuX3N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICBwLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgIH07XG5cbiAgICAgICAgUHJvbWlzZS5yYWNlID0gZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXMubWFwKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBQcm9taXNlLlBTRCA9IG51bGw7IC8vIFByb21pc2UgU3BlY2lmaWMgRGF0YSAtIGEgVExTIFBhdHRlcm4gKFRocmVhZCBMb2NhbCBTdG9yYWdlKSBmb3IgUHJvbWlzZXMuIFRPRE86IFJlbmFtZSBQcm9taXNlLlBTRCB0byBQcm9taXNlLmRhdGFcblxuICAgICAgICBQcm9taXNlLm5ld1BTRCA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIG5ldyBQU0Qgc2NvcGUgKFByb21pc2UgU3BlY2lmaWMgRGF0YSlcbiAgICAgICAgICAgIHZhciBvdXRlclNjb3BlID0gUHJvbWlzZS5QU0Q7XG4gICAgICAgICAgICBQcm9taXNlLlBTRCA9IG91dGVyU2NvcGUgPyBPYmplY3QuY3JlYXRlKG91dGVyU2NvcGUpIDoge307XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbigpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBQcm9taXNlLlBTRCA9IG91dGVyU2NvcGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgUHJvbWlzZS5fcm9vdEV4ZWMgPSBfcm9vdEV4ZWM7XG4gICAgICAgIFByb21pc2UuX3RpY2tGaW5hbGl6ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoaXNSb290RXhlY3V0aW9uKSB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW4gYSB2aXJ0dWFsIHRpY2tcIik7XG4gICAgICAgICAgICB0aWNrRmluYWxpemVycy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZTtcbiAgICB9KSgpO1xuXG5cbiAgICAvL1xuICAgIC8vXG4gICAgLy8gLS0tLS0tIEV4cG9ydGFibGUgSGVscCBGdW5jdGlvbnMgLS0tLS0tLVxuICAgIC8vXG4gICAgLy9cblxuICAgIGZ1bmN0aW9uIG5vcCgpIHsgfVxuICAgIGZ1bmN0aW9uIG1pcnJvcih2YWwpIHsgcmV0dXJuIHZhbDsgfVxuXG4gICAgZnVuY3Rpb24gcHVyZUZ1bmN0aW9uQ2hhaW4oZjEsIGYyKSB7XG4gICAgICAgIC8vIEVuYWJsZXMgY2hhaW5lZCBldmVudHMgdGhhdCB0YWtlcyBPTkUgYXJndW1lbnQgYW5kIHJldHVybnMgaXQgdG8gdGhlIG5leHQgZnVuY3Rpb24gaW4gY2hhaW4uXG4gICAgICAgIC8vIFRoaXMgcGF0dGVybiBpcyB1c2VkIGluIHRoZSBob29rKFwicmVhZGluZ1wiKSBldmVudC5cbiAgICAgICAgaWYgKGYxID09PSBtaXJyb3IpIHJldHVybiBmMjtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiBmMihmMSh2YWwpKTtcbiAgICAgICAgfTsgXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FsbEJvdGgob24xLCBvbjIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG9uMS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgb24yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07IFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhvb2tDcmVhdGluZ0NoYWluKGYxLCBmMikge1xuICAgICAgICAvLyBFbmFibGVzIGNoYWluZWQgZXZlbnRzIHRoYXQgdGFrZXMgc2V2ZXJhbCBhcmd1bWVudHMgYW5kIG1heSBtb2RpZnkgZmlyc3QgYXJndW1lbnQgYnkgbWFraW5nIGEgbW9kaWZpY2F0aW9uIGFuZCB0aGVuIHJldHVybmluZyB0aGUgc2FtZSBpbnN0YW5jZS5cbiAgICAgICAgLy8gVGhpcyBwYXR0ZXJuIGlzIHVzZWQgaW4gdGhlIGhvb2soXCJjcmVhdGluZ1wiKSBldmVudC5cbiAgICAgICAgaWYgKGYxID09PSBub3ApIHJldHVybiBmMjtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSBmMS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkKSBhcmd1bWVudHNbMF0gPSByZXM7XG4gICAgICAgICAgICB2YXIgb25zdWNjZXNzID0gdGhpcy5vbnN1Y2Nlc3MsIC8vIEluIGNhc2UgZXZlbnQgbGlzdGVuZXIgaGFzIHNldCB0aGlzLm9uc3VjY2Vzc1xuICAgICAgICAgICAgICAgIG9uZXJyb3IgPSB0aGlzLm9uZXJyb3I7ICAgICAvLyBJbiBjYXNlIGV2ZW50IGxpc3RlbmVyIGhhcyBzZXQgdGhpcy5vbmVycm9yXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vbnN1Y2Nlc3M7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vbmVycm9yO1xuICAgICAgICAgICAgdmFyIHJlczIgPSBmMi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKG9uc3VjY2VzcykgdGhpcy5vbnN1Y2Nlc3MgPSB0aGlzLm9uc3VjY2VzcyA/IGNhbGxCb3RoKG9uc3VjY2VzcywgdGhpcy5vbnN1Y2Nlc3MpIDogb25zdWNjZXNzO1xuICAgICAgICAgICAgaWYgKG9uZXJyb3IpIHRoaXMub25lcnJvciA9IHRoaXMub25lcnJvciA/IGNhbGxCb3RoKG9uZXJyb3IsIHRoaXMub25lcnJvcikgOiBvbmVycm9yO1xuICAgICAgICAgICAgcmV0dXJuIHJlczIgIT09IHVuZGVmaW5lZCA/IHJlczIgOiByZXM7XG4gICAgICAgIH07IFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhvb2tVcGRhdGluZ0NoYWluKGYxLCBmMikge1xuICAgICAgICBpZiAoZjEgPT09IG5vcCkgcmV0dXJuIGYyO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IGYxLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAocmVzICE9PSB1bmRlZmluZWQpIGV4dGVuZChhcmd1bWVudHNbMF0sIHJlcyk7IC8vIElmIGYxIHJldHVybnMgbmV3IG1vZGlmaWNhdGlvbnMsIGV4dGVuZCBjYWxsZXIncyBtb2RpZmljYXRpb25zIHdpdGggdGhlIHJlc3VsdCBiZWZvcmUgY2FsbGluZyBuZXh0IGluIGNoYWluLlxuICAgICAgICAgICAgdmFyIG9uc3VjY2VzcyA9IHRoaXMub25zdWNjZXNzLCAvLyBJbiBjYXNlIGV2ZW50IGxpc3RlbmVyIGhhcyBzZXQgdGhpcy5vbnN1Y2Nlc3NcbiAgICAgICAgICAgICAgICBvbmVycm9yID0gdGhpcy5vbmVycm9yOyAgICAgLy8gSW4gY2FzZSBldmVudCBsaXN0ZW5lciBoYXMgc2V0IHRoaXMub25lcnJvclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMub25zdWNjZXNzO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub25lcnJvcjtcbiAgICAgICAgICAgIHZhciByZXMyID0gZjIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmIChvbnN1Y2Nlc3MpIHRoaXMub25zdWNjZXNzID0gdGhpcy5vbnN1Y2Nlc3MgPyBjYWxsQm90aChvbnN1Y2Nlc3MsIHRoaXMub25zdWNjZXNzKSA6IG9uc3VjY2VzcztcbiAgICAgICAgICAgIGlmIChvbmVycm9yKSB0aGlzLm9uZXJyb3IgPSB0aGlzLm9uZXJyb3IgPyBjYWxsQm90aChvbmVycm9yLCB0aGlzLm9uZXJyb3IpIDogb25lcnJvcjtcbiAgICAgICAgICAgIHJldHVybiByZXMgPT09IHVuZGVmaW5lZCA/XG4gICAgICAgICAgICAgICAgKHJlczIgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHJlczIpIDpcbiAgICAgICAgICAgICAgICAocmVzMiA9PT0gdW5kZWZpbmVkID8gcmVzIDogZXh0ZW5kKHJlcywgcmVzMikpO1xuICAgICAgICB9OyBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdG9wcGFibGVFdmVudENoYWluKGYxLCBmMikge1xuICAgICAgICAvLyBFbmFibGVzIGNoYWluZWQgZXZlbnRzIHRoYXQgbWF5IHJldHVybiBmYWxzZSB0byBzdG9wIHRoZSBldmVudCBjaGFpbi5cbiAgICAgICAgaWYgKGYxID09PSBub3ApIHJldHVybiBmMjtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChmMS5hcHBseSh0aGlzLCBhcmd1bWVudHMpID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGYyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07IFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJldmVyc2VTdG9wcGFibGVFdmVudENoYWluKGYxLCBmMikge1xuICAgICAgICBpZiAoZjEgPT09IG5vcCkgcmV0dXJuIGYyO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGYyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgPT09IGZhbHNlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZjEuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTsgXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9uU3RvcHBhYmxlRXZlbnRDaGFpbihmMSwgZjIpIHtcbiAgICAgICAgaWYgKGYxID09PSBub3ApIHJldHVybiBmMjtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGYxLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmMi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9OyBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9taXNhYmxlQ2hhaW4oZjEsIGYyKSB7XG4gICAgICAgIGlmIChmMSA9PT0gbm9wKSByZXR1cm4gZjI7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gZjEuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmIChyZXMgJiYgdHlwZW9mIHJlcy50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoaXogPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmMi5hcHBseSh0aGl6LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmMi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9OyBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBldmVudHMoY3R4LCBldmVudE5hbWVzKSB7XG4gICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICB2YXIgZXZzID0ge307XG4gICAgICAgIHZhciBydiA9IGZ1bmN0aW9uIChldmVudE5hbWUsIHN1YnNjcmliZXIpIHtcbiAgICAgICAgICAgIGlmIChzdWJzY3JpYmVyKSB7XG4gICAgICAgICAgICAgICAgLy8gU3Vic2NyaWJlXG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICAgICAgdmFyIGV2ID0gZXZzW2V2ZW50TmFtZV07XG4gICAgICAgICAgICAgICAgZXYuc3Vic2NyaWJlLmFwcGx5KGV2LCBhcmdzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3R4O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKGV2ZW50TmFtZSkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgLy8gUmV0dXJuIGludGVyZmFjZSBhbGxvd2luZyB0byBmaXJlIG9yIHVuc3Vic2NyaWJlIGZyb20gZXZlbnRcbiAgICAgICAgICAgICAgICByZXR1cm4gZXZzW2V2ZW50TmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07IFxuICAgICAgICBydi5hZGRFdmVudFR5cGUgPSBhZGQ7XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkKGV2ZW50TmFtZSwgY2hhaW5GdW5jdGlvbiwgZGVmYXVsdEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShldmVudE5hbWUpKSByZXR1cm4gYWRkRXZlbnRHcm91cChldmVudE5hbWUpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBldmVudE5hbWUgPT09ICdvYmplY3QnKSByZXR1cm4gYWRkQ29uZmlndXJlZEV2ZW50cyhldmVudE5hbWUpO1xuICAgICAgICAgICAgaWYgKCFjaGFpbkZ1bmN0aW9uKSBjaGFpbkZ1bmN0aW9uID0gc3RvcHBhYmxlRXZlbnRDaGFpbjtcbiAgICAgICAgICAgIGlmICghZGVmYXVsdEZ1bmN0aW9uKSBkZWZhdWx0RnVuY3Rpb24gPSBub3A7XG5cbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0ge1xuICAgICAgICAgICAgICAgIHN1YnNjcmliZXJzOiBbXSxcbiAgICAgICAgICAgICAgICBmaXJlOiBkZWZhdWx0RnVuY3Rpb24sXG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlOiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5zdWJzY3JpYmVycy5wdXNoKGNiKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5maXJlID0gY2hhaW5GdW5jdGlvbihjb250ZXh0LmZpcmUsIGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHVuc3Vic2NyaWJlOiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5zdWJzY3JpYmVycyA9IGNvbnRleHQuc3Vic2NyaWJlcnMuZmlsdGVyKGZ1bmN0aW9uIChmbikgeyByZXR1cm4gZm4gIT09IGNiOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5maXJlID0gY29udGV4dC5zdWJzY3JpYmVycy5yZWR1Y2UoY2hhaW5GdW5jdGlvbiwgZGVmYXVsdEZ1bmN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZXZzW2V2ZW50TmFtZV0gPSBydltldmVudE5hbWVdID0gY29udGV4dDtcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkQ29uZmlndXJlZEV2ZW50cyhjZmcpIHtcbiAgICAgICAgICAgIC8vIGV2ZW50cyh0aGlzLCB7cmVhZGluZzogW2Z1bmN0aW9uQ2hhaW4sIG5vcF19KTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGNmZykuZm9yRWFjaChmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBjZmdbZXZlbnROYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhcmdzKSkge1xuICAgICAgICAgICAgICAgICAgICBhZGQoZXZlbnROYW1lLCBjZmdbZXZlbnROYW1lXVswXSwgY2ZnW2V2ZW50TmFtZV1bMV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJncyA9PT0gJ2FzYXAnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJhdGhlciB0aGFuIGFwcHJvYWNoaW5nIGV2ZW50IHN1YnNjcmlwdGlvbiB1c2luZyBhIGZ1bmN0aW9uYWwgYXBwcm9hY2gsIHdlIGhlcmUgZG8gaXQgaW4gYSBmb3ItbG9vcCB3aGVyZSBzdWJzY3JpYmVyIGlzIGV4ZWN1dGVkIGluIGl0cyBvd24gc3RhY2tcbiAgICAgICAgICAgICAgICAgICAgLy8gZW5hYmxpbmcgdGhhdCBhbnkgZXhjZXB0aW9uIHRoYXQgb2NjdXIgd29udCBkaXN0dXJiIHRoZSBpbml0aWF0b3IgYW5kIGFsc28gbm90IG5lc2Nlc3NhcnkgYmUgY2F0Y2hlZCBhbmQgZm9yZ290dGVuLlxuICAgICAgICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IGFkZChldmVudE5hbWUsIG51bGwsIGZ1bmN0aW9uIGZpcmUoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc3Vic2NyaWJlcnMuZm9yRWFjaChmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc2FwKGZ1bmN0aW9uIGZpcmVFdmVudCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4uYXBwbHkoZ2xvYmFsLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZSBob3cgc3Vic2NyaWJlIHdvcmtzIHRvIG5vdCByZXBsYWNlIHRoZSBmaXJlIGZ1bmN0aW9uIGJ1dCB0byBqdXN0IGFkZCB0aGUgc3Vic2NyaWJlciB0byBzdWJzY3JpYmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRleHQuc3Vic2NyaWJlcnMuaW5kZXhPZihmbikgPT09IC0xKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc3Vic2NyaWJlcnMucHVzaChmbik7XG4gICAgICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGFuZ2UgaG93IHVuc3Vic2NyaWJlIHdvcmtzIGZvciB0aGUgc2FtZSByZWFzb24gYXMgYWJvdmUuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWR4T2ZGbiA9IGNvbnRleHQuc3Vic2NyaWJlcnMuaW5kZXhPZihmbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaWR4T2ZGbiAhPT0gLTEpIGNvbnRleHQuc3Vic2NyaWJlcnMuc3BsaWNlKGlkeE9mRm4sIDEpO1xuICAgICAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBldmVudCBjb25maWdcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFkZEV2ZW50R3JvdXAoZXZlbnRHcm91cCkge1xuICAgICAgICAgICAgLy8gcHJvbWlzZS1iYXNlZCBldmVudCBncm91cCAoaS5lLiB3ZSBwcm9taXNlIHRvIGNhbGwgb25lIGFuZCBvbmx5IG9uZSBvZiB0aGUgZXZlbnRzIGluIHRoZSBwYWlyLCBhbmQgdG8gb25seSBjYWxsIGl0IG9uY2UuXG4gICAgICAgICAgICB2YXIgZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgZXZlbnRHcm91cC5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgYWRkKG5hbWUpLnN1YnNjcmliZShjaGVja0RvbmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmdW5jdGlvbiBjaGVja0RvbmUoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvbmUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAxLCBsID0gYXJncy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgIGFkZChhcmdzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBydjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhc3NlcnQoYikge1xuICAgICAgICBpZiAoIWIpIHRocm93IG5ldyBFcnJvcihcIkFzc2VydGlvbiBmYWlsZWRcIik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXNhcChmbikge1xuICAgICAgICBpZiAoZ2xvYmFsLnNldEltbWVkaWF0ZSkgc2V0SW1tZWRpYXRlKGZuKTsgZWxzZSBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9XG5cbiAgICB2YXIgZmFrZUF1dG9Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHsgfTsvLyBXaWxsIG5ldmVyIGJlIGNoYW5nZWQuIFdlIGp1c3QgZmFrZSBmb3IgdGhlIElERSB0aGF0IHdlIGNoYW5nZSBpdCAoc2VlIGRvRmFrZUF1dG9Db21wbGV0ZSgpKVxuICAgIHZhciBmYWtlID0gZmFsc2U7IC8vIFdpbGwgbmV2ZXIgYmUgY2hhbmdlZC4gV2UganVzdCBmYWtlIGZvciB0aGUgSURFIHRoYXQgd2UgY2hhbmdlIGl0IChzZWUgZG9GYWtlQXV0b0NvbXBsZXRlKCkpXG5cbiAgICBmdW5jdGlvbiBkb0Zha2VBdXRvQ29tcGxldGUoZm4pIHtcbiAgICAgICAgdmFyIHRvID0gc2V0VGltZW91dChmbiwgMTAwMCk7XG4gICAgICAgIGNsZWFyVGltZW91dCh0byk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJ5Y2F0Y2goZm4sIHJlamVjdCwgcHNkKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgb3V0ZXJQU0QgPSBQcm9taXNlLlBTRDsgLy8gU3VwcG9ydCBQcm9taXNlLXNwZWNpZmljIGRhdGEgKFBTRCkgaW4gY2FsbGJhY2sgY2FsbHNcbiAgICAgICAgICAgIFByb21pc2UuUFNEID0gcHNkO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgUHJvbWlzZS5QU0QgPSBvdXRlclBTRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRCeUtleVBhdGgob2JqLCBrZXlQYXRoKSB7XG4gICAgICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0luZGV4ZWREQi8jc3RlcHMtZm9yLWV4dHJhY3RpbmctYS1rZXktZnJvbS1hLXZhbHVlLXVzaW5nLWEta2V5LXBhdGhcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXlQYXRoKSkgcmV0dXJuIG9ialtrZXlQYXRoXTsgLy8gVGhpcyBsaW5lIGlzIG1vdmVkIGZyb20gbGFzdCB0byBmaXJzdCBmb3Igb3B0aW1pemF0aW9uIHB1cnBvc2UuXG4gICAgICAgIGlmICgha2V5UGF0aCkgcmV0dXJuIG9iajtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXlQYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdmFyIHJ2ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGtleVBhdGgubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGdldEJ5S2V5UGF0aChvYmosIGtleVBhdGhbaV0pO1xuICAgICAgICAgICAgICAgIHJ2LnB1c2godmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGVyaW9kID0ga2V5UGF0aC5pbmRleE9mKCcuJyk7XG4gICAgICAgIGlmIChwZXJpb2QgIT09IC0xKSB7XG4gICAgICAgICAgICB2YXIgaW5uZXJPYmogPSBvYmpba2V5UGF0aC5zdWJzdHIoMCwgcGVyaW9kKV07XG4gICAgICAgICAgICByZXR1cm4gaW5uZXJPYmogPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGdldEJ5S2V5UGF0aChpbm5lck9iaiwga2V5UGF0aC5zdWJzdHIocGVyaW9kICsgMSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0QnlLZXlQYXRoKG9iaiwga2V5UGF0aCwgdmFsdWUpIHtcbiAgICAgICAgaWYgKCFvYmogfHwga2V5UGF0aCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgICAgIGlmICh0eXBlb2Yga2V5UGF0aCAhPT0gJ3N0cmluZycgJiYgJ2xlbmd0aCcgaW4ga2V5UGF0aCkge1xuICAgICAgICAgICAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgJiYgJ2xlbmd0aCcgaW4gdmFsdWUpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBrZXlQYXRoLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgIHNldEJ5S2V5UGF0aChvYmosIGtleVBhdGhbaV0sIHZhbHVlW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwZXJpb2QgPSBrZXlQYXRoLmluZGV4T2YoJy4nKTtcbiAgICAgICAgICAgIGlmIChwZXJpb2QgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRLZXlQYXRoID0ga2V5UGF0aC5zdWJzdHIoMCwgcGVyaW9kKTtcbiAgICAgICAgICAgICAgICB2YXIgcmVtYWluaW5nS2V5UGF0aCA9IGtleVBhdGguc3Vic3RyKHBlcmlvZCArIDEpO1xuICAgICAgICAgICAgICAgIGlmIChyZW1haW5pbmdLZXlQYXRoID09PSBcIlwiKVxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgZGVsZXRlIG9ialtjdXJyZW50S2V5UGF0aF07IGVsc2Ugb2JqW2N1cnJlbnRLZXlQYXRoXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5uZXJPYmogPSBvYmpbY3VycmVudEtleVBhdGhdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlubmVyT2JqKSBpbm5lck9iaiA9IChvYmpbY3VycmVudEtleVBhdGhdID0ge30pO1xuICAgICAgICAgICAgICAgICAgICBzZXRCeUtleVBhdGgoaW5uZXJPYmosIHJlbWFpbmluZ0tleVBhdGgsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSBkZWxldGUgb2JqW2tleVBhdGhdOyBlbHNlIG9ialtrZXlQYXRoXSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVsQnlLZXlQYXRoKG9iaiwga2V5UGF0aCkge1xuICAgICAgICBpZiAodHlwZW9mIGtleVBhdGggPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgc2V0QnlLZXlQYXRoKG9iaiwga2V5UGF0aCwgdW5kZWZpbmVkKTtcbiAgICAgICAgZWxzZSBpZiAoJ2xlbmd0aCcgaW4ga2V5UGF0aClcbiAgICAgICAgICAgIFtdLm1hcC5jYWxsKGtleVBhdGgsIGZ1bmN0aW9uKGtwKSB7XG4gICAgICAgICAgICAgICAgIHNldEJ5S2V5UGF0aChvYmosIGtwLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hhbGxvd0Nsb25lKG9iaikge1xuICAgICAgICB2YXIgcnYgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgbSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkobSkpIHJ2W21dID0gb2JqW21dO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWVwQ2xvbmUoYW55KSB7XG4gICAgICAgIGlmICghYW55IHx8IHR5cGVvZiBhbnkgIT09ICdvYmplY3QnKSByZXR1cm4gYW55O1xuICAgICAgICB2YXIgcnY7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGFueSkpIHtcbiAgICAgICAgICAgIHJ2ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGFueS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICBydi5wdXNoKGRlZXBDbG9uZShhbnlbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChhbnkgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgICBydiA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBydi5zZXRUaW1lKGFueS5nZXRUaW1lKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcnYgPSBhbnkuY29uc3RydWN0b3IgPyBPYmplY3QuY3JlYXRlKGFueS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpIDoge307XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGFueSkge1xuICAgICAgICAgICAgICAgIGlmIChhbnkuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcnZbcHJvcF0gPSBkZWVwQ2xvbmUoYW55W3Byb3BdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE9iamVjdERpZmYoYSwgYikge1xuICAgICAgICAvLyBUaGlzIGlzIGEgc2ltcGxpZmllZCB2ZXJzaW9uIHRoYXQgd2lsbCBhbHdheXMgcmV0dXJuIGtleXBhdGhzIG9uIHRoZSByb290IGxldmVsLlxuICAgICAgICAvLyBJZiBmb3IgZXhhbXBsZSBhIGFuZCBiIGRpZmZlcnMgYnk6IChhLnNvbWVQcm9wc09iamVjdC54ICE9IGIuc29tZVByb3BzT2JqZWN0LngpLCB3ZSB3aWxsIHJldHVybiB0aGF0IFwic29tZVByb3BzT2JqZWN0XCIgaXMgY2hhbmdlZFxuICAgICAgICAvLyBhbmQgbm90IFwic29tZVByb3BzT2JqZWN0LnhcIi4gVGhpcyBpcyBhY2NlcHRhYmxlIGFuZCB0cnVlIGJ1dCBjb3VsZCBiZSBvcHRpbWl6ZWQgdG8gc3VwcG9ydCBuZXN0bGVkIGNoYW5nZXMgaWYgdGhhdCB3b3VsZCBnaXZlIGFcbiAgICAgICAgLy8gYmlnIG9wdGltaXphdGlvbiBiZW5lZml0LlxuICAgICAgICB2YXIgcnYgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhKSBpZiAoYS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgaWYgKCFiLmhhc093blByb3BlcnR5KHByb3ApKVxuICAgICAgICAgICAgICAgIHJ2W3Byb3BdID0gdW5kZWZpbmVkOyAvLyBQcm9wZXJ0eSByZW1vdmVkXG4gICAgICAgICAgICBlbHNlIGlmIChhW3Byb3BdICE9PSBiW3Byb3BdICYmIEpTT04uc3RyaW5naWZ5KGFbcHJvcF0pICE9IEpTT04uc3RyaW5naWZ5KGJbcHJvcF0pKVxuICAgICAgICAgICAgICAgIHJ2W3Byb3BdID0gYltwcm9wXTsgLy8gUHJvcGVydHkgY2hhbmdlZFxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocHJvcCkgJiYgIWEuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgIHJ2W3Byb3BdID0gYltwcm9wXTsgLy8gUHJvcGVydHkgYWRkZWRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnY7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VUeXBlKHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHR5cGUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gW3BhcnNlVHlwZSh0eXBlWzBdKV07XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSAmJiB0eXBlb2YgdHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHZhciBydiA9IHt9O1xuICAgICAgICAgICAgYXBwbHlTdHJ1Y3R1cmUocnYsIHR5cGUpO1xuICAgICAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcHBseVN0cnVjdHVyZShvYmosIHN0cnVjdHVyZSkge1xuICAgICAgICBPYmplY3Qua2V5cyhzdHJ1Y3R1cmUpLmZvckVhY2goZnVuY3Rpb24gKG1lbWJlcikge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gcGFyc2VUeXBlKHN0cnVjdHVyZVttZW1iZXJdKTtcbiAgICAgICAgICAgIG9ialttZW1iZXJdID0gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIHNlbnRhbmNlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBlcnJPYmogPSAoZXZlbnQgJiYgZXZlbnQudGFyZ2V0LmVycm9yKSB8fCBuZXcgRXJyb3IoKTtcbiAgICAgICAgICAgIGlmIChzZW50YW5jZSkge1xuICAgICAgICAgICAgICAgIHZhciBvY2N1cnJlZFdoZW4gPSBcIiBvY2N1cnJlZCB3aGVuIFwiICsgc2VudGFuY2UubWFwKGZ1bmN0aW9uICh3b3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZW9mICh3b3JkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOiByZXR1cm4gd29yZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzogcmV0dXJuIHdvcmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gSlNPTi5zdHJpbmdpZnkod29yZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KS5qb2luKFwiIFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoZXJyT2JqLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyT2JqLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyT2JqLm5hbWUgKyBvY2N1cnJlZFdoZW4gKyAoZXJyT2JqLm1lc3NhZ2UgPyBcIi4gXCIgKyBlcnJPYmoubWVzc2FnZSA6IFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29kZSBiZWxvdyB3b3JrcyBmb3Igc3RhY2tlZCBleGNlcHRpb25zLCBCVVQhIHN0YWNrIGlzIG5ldmVyIHByZXNlbnQgaW4gZXZlbnQgZXJyb3JzIChub3QgaW4gYW55IG9mIHRoZSBicm93c2VycykuIFNvIGl0J3Mgbm8gdXNlIHRvIGluY2x1ZGUgaXQhXG4gICAgICAgICAgICAgICAgICAgICAgICAvKmRlbGV0ZSB0aGlzLnRvU3RyaW5nOyAvLyBQcm9oaWJpdGluZyBlbmRsZXNzIHJlY3Vyc2l2ZW5lc3MgaW4gSUUuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyT2JqLnN0YWNrKSBydiArPSAoZXJyT2JqLnN0YWNrID8gXCIuIFN0YWNrOiBcIiArIGVyck9iai5zdGFjayA6IFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b1N0cmluZyA9IHRvU3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ2OyovXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyT2JqID0gZXJyT2JqICsgb2NjdXJyZWRXaGVuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWplY3QoZXJyT2JqKTtcblxuICAgICAgICAgICAgaWYgKGV2ZW50KSB7Ly8gT2xkIHZlcnNpb25zIG9mIEluZGV4ZWREQlNoaW0gZG9lc250IHByb3ZpZGUgYW4gZXJyb3IgZXZlbnRcbiAgICAgICAgICAgICAgICAvLyBTdG9wIGVycm9yIGZyb20gcHJvcGFnYXRpbmcgdG8gSURCVHJhbnNhY3Rpb24uIExldCB1cyBoYW5kbGUgdGhhdCBtYW51YWxseSBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgIGlmIChldmVudC5zdG9wUHJvcGFnYXRpb24pIC8vIEluZGV4ZWREQlNoaW0gZG9lc250IHN1cHBvcnQgdGhpc1xuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIC8vIEluZGV4ZWREQlNoaW0gZG9lc250IHN1cHBvcnQgdGhpc1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RhY2soZXJyb3IpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnbG9iYWxEYXRhYmFzZUxpc3QoY2IpIHtcbiAgICAgICAgdmFyIHZhbCxcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZSA9IERleGllLmRlcGVuZGVuY2llcy5sb2NhbFN0b3JhZ2U7XG4gICAgICAgIGlmICghbG9jYWxTdG9yYWdlKSByZXR1cm4gY2IoW10pOyAvLyBFbnZzIHdpdGhvdXQgbG9jYWxTdG9yYWdlIHN1cHBvcnRcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhbCA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0RleGllLkRhdGFiYXNlTmFtZXMnKSB8fCBcIltdXCIpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB2YWwgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2IodmFsKSkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ0RleGllLkRhdGFiYXNlTmFtZXMnLCBKU09OLnN0cmluZ2lmeSh2YWwpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vXG4gICAgLy8gSW5kZXhTcGVjIHN0cnVjdFxuICAgIC8vXG4gICAgZnVuY3Rpb24gSW5kZXhTcGVjKG5hbWUsIGtleVBhdGgsIHVuaXF1ZSwgbXVsdGksIGF1dG8sIGNvbXBvdW5kLCBkb3R0ZWQpIHtcbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwibmFtZVwiIHR5cGU9XCJTdHJpbmdcIj48L3BhcmFtPlxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJrZXlQYXRoXCIgdHlwZT1cIlN0cmluZ1wiPjwvcGFyYW0+XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInVuaXF1ZVwiIHR5cGU9XCJCb29sZWFuXCI+PC9wYXJhbT5cbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwibXVsdGlcIiB0eXBlPVwiQm9vbGVhblwiPjwvcGFyYW0+XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImF1dG9cIiB0eXBlPVwiQm9vbGVhblwiPjwvcGFyYW0+XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNvbXBvdW5kXCIgdHlwZT1cIkJvb2xlYW5cIj48L3BhcmFtPlxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJkb3R0ZWRcIiB0eXBlPVwiQm9vbGVhblwiPjwvcGFyYW0+XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMua2V5UGF0aCA9IGtleVBhdGg7XG4gICAgICAgIHRoaXMudW5pcXVlID0gdW5pcXVlO1xuICAgICAgICB0aGlzLm11bHRpID0gbXVsdGk7XG4gICAgICAgIHRoaXMuYXV0byA9IGF1dG87XG4gICAgICAgIHRoaXMuY29tcG91bmQgPSBjb21wb3VuZDtcbiAgICAgICAgdGhpcy5kb3R0ZWQgPSBkb3R0ZWQ7XG4gICAgICAgIHZhciBrZXlQYXRoU3JjID0gdHlwZW9mIGtleVBhdGggPT09ICdzdHJpbmcnID8ga2V5UGF0aCA6IGtleVBhdGggJiYgKCdbJyArIFtdLmpvaW4uY2FsbChrZXlQYXRoLCAnKycpICsgJ10nKTtcbiAgICAgICAgdGhpcy5zcmMgPSAodW5pcXVlID8gJyYnIDogJycpICsgKG11bHRpID8gJyonIDogJycpICsgKGF1dG8gPyBcIisrXCIgOiBcIlwiKSArIGtleVBhdGhTcmM7XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBUYWJsZVNjaGVtYSBzdHJ1Y3RcbiAgICAvL1xuICAgIGZ1bmN0aW9uIFRhYmxlU2NoZW1hKG5hbWUsIHByaW1LZXksIGluZGV4ZXMsIGluc3RhbmNlVGVtcGxhdGUpIHtcbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwibmFtZVwiIHR5cGU9XCJTdHJpbmdcIj48L3BhcmFtPlxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJwcmltS2V5XCIgdHlwZT1cIkluZGV4U3BlY1wiPjwvcGFyYW0+XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImluZGV4ZXNcIiB0eXBlPVwiQXJyYXlcIiBlbGVtZW50VHlwZT1cIkluZGV4U3BlY1wiPjwvcGFyYW0+XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImluc3RhbmNlVGVtcGxhdGVcIiB0eXBlPVwiT2JqZWN0XCI+PC9wYXJhbT5cbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5wcmltS2V5ID0gcHJpbUtleSB8fCBuZXcgSW5kZXhTcGVjKCk7XG4gICAgICAgIHRoaXMuaW5kZXhlcyA9IGluZGV4ZXMgfHwgW25ldyBJbmRleFNwZWMoKV07XG4gICAgICAgIHRoaXMuaW5zdGFuY2VUZW1wbGF0ZSA9IGluc3RhbmNlVGVtcGxhdGU7XG4gICAgICAgIHRoaXMubWFwcGVkQ2xhc3MgPSBudWxsO1xuICAgICAgICB0aGlzLmlkeEJ5TmFtZSA9IGluZGV4ZXMucmVkdWNlKGZ1bmN0aW9uIChoYXNoU2V0LCBpbmRleCkge1xuICAgICAgICAgICAgaGFzaFNldFtpbmRleC5uYW1lXSA9IGluZGV4O1xuICAgICAgICAgICAgcmV0dXJuIGhhc2hTZXQ7XG4gICAgICAgIH0sIHt9KTtcbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIE1vZGlmeUVycm9yIENsYXNzIChleHRlbmRzIEVycm9yKVxuICAgIC8vXG4gICAgZnVuY3Rpb24gTW9kaWZ5RXJyb3IobXNnLCBmYWlsdXJlcywgc3VjY2Vzc0NvdW50LCBmYWlsZWRLZXlzKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiTW9kaWZ5RXJyb3JcIjtcbiAgICAgICAgdGhpcy5mYWlsdXJlcyA9IGZhaWx1cmVzO1xuICAgICAgICB0aGlzLmZhaWxlZEtleXMgPSBmYWlsZWRLZXlzO1xuICAgICAgICB0aGlzLnN1Y2Nlc3NDb3VudCA9IHN1Y2Nlc3NDb3VudDtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gZmFpbHVyZXMuam9pbignXFxuJyk7XG4gICAgfVxuICAgIGRlcml2ZShNb2RpZnlFcnJvcikuZnJvbShFcnJvcik7XG5cbiAgICAvL1xuICAgIC8vIFN0YXRpYyBkZWxldGUoKSBtZXRob2QuXG4gICAgLy9cbiAgICBEZXhpZS5kZWxldGUgPSBmdW5jdGlvbiAoZGF0YWJhc2VOYW1lKSB7XG4gICAgICAgIHZhciBkYiA9IG5ldyBEZXhpZShkYXRhYmFzZU5hbWUpLFxuICAgICAgICAgICAgcHJvbWlzZSA9IGRiLmRlbGV0ZSgpO1xuICAgICAgICBwcm9taXNlLm9uYmxvY2tlZCA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgZGIub24oXCJibG9ja2VkXCIsIGZuKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICAvLyBTdGF0aWMgZXhpc3RzKCkgbWV0aG9kLlxuICAgIC8vXG4gICAgRGV4aWUuZXhpc3RzID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gbmV3IERleGllKG5hbWUpLm9wZW4oKS50aGVuKGZ1bmN0aW9uKGRiKSB7XG4gICAgICAgICAgICBkYi5jbG9zZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIFN0YXRpYyBtZXRob2QgZm9yIHJldHJpZXZpbmcgYSBsaXN0IG9mIGFsbCBleGlzdGluZyBkYXRhYmFzZXMgYXQgY3VycmVudCBob3N0LlxuICAgIC8vXG4gICAgRGV4aWUuZ2V0RGF0YWJhc2VOYW1lcyA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgdmFyIGdldERhdGFiYXNlTmFtZXMgPSBnZXROYXRpdmVHZXREYXRhYmFzZU5hbWVzRm4oKTtcbiAgICAgICAgICAgIGlmIChnZXREYXRhYmFzZU5hbWVzKSB7IC8vIEluIGNhc2UgZ2V0RGF0YWJhc2VOYW1lcygpIGJlY29tZXMgc3RhbmRhcmQsIGxldCdzIHByZXBhcmUgdG8gc3VwcG9ydCBpdDpcbiAgICAgICAgICAgICAgICB2YXIgcmVxID0gZ2V0RGF0YWJhc2VOYW1lcygpO1xuICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbXS5zbGljZS5jYWxsKGV2ZW50LnRhcmdldC5yZXN1bHQsIDApKTsgLy8gQ29udmVyc3QgRE9NU3RyaW5nTGlzdCB0byBBcnJheTxTdHJpbmc+XG4gICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2xvYmFsRGF0YWJhc2VMaXN0KGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2YWwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oY2IpO1xuICAgIH07IFxuXG4gICAgRGV4aWUuZGVmaW5lQ2xhc3MgPSBmdW5jdGlvbiAoc3RydWN0dXJlKSB7XG4gICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgLy8vICAgICBDcmVhdGUgYSBqYXZhc2NyaXB0IGNvbnN0cnVjdG9yIGJhc2VkIG9uIGdpdmVuIHRlbXBsYXRlIGZvciB3aGljaCBwcm9wZXJ0aWVzIHRvIGV4cGVjdCBpbiB0aGUgY2xhc3MuXG4gICAgICAgIC8vLyAgICAgQW55IHByb3BlcnR5IHRoYXQgaXMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiB3aWxsIGFjdCBhcyBhIHR5cGUuIFNvIHtuYW1lOiBTdHJpbmd9IHdpbGwgYmUgZXF1YWwgdG8ge25hbWU6IG5ldyBTdHJpbmcoKX0uXG4gICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInN0cnVjdHVyZVwiPkhlbHBzIElERSBjb2RlIGNvbXBsZXRpb24gYnkga25vd2luZyB0aGUgbWVtYmVycyB0aGF0IG9iamVjdHMgY29udGFpbiBhbmQgbm90IGp1c3QgdGhlIGluZGV4ZXMuIEFsc29cbiAgICAgICAgLy8vIGtub3cgd2hhdCB0eXBlIGVhY2ggbWVtYmVyIGhhcy4gRXhhbXBsZToge25hbWU6IFN0cmluZywgZW1haWxBZGRyZXNzZXM6IFtTdHJpbmddLCBwcm9wZXJ0aWVzOiB7c2hvZVNpemU6IE51bWJlcn19PC9wYXJhbT5cblxuICAgICAgICAvLyBEZWZhdWx0IGNvbnN0cnVjdG9yIGFibGUgdG8gY29weSBnaXZlbiBwcm9wZXJ0aWVzIGludG8gdGhpcyBvYmplY3QuXG4gICAgICAgIGZ1bmN0aW9uIENsYXNzKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInByb3BlcnRpZXNcIiB0eXBlPVwiT2JqZWN0XCIgb3B0aW9uYWw9XCJ0cnVlXCI+UHJvcGVydGllcyB0byBpbml0aWFsaXplIG9iamVjdCB3aXRoLlxuICAgICAgICAgICAgLy8vIDwvcGFyYW0+XG4gICAgICAgICAgICBwcm9wZXJ0aWVzID8gZXh0ZW5kKHRoaXMsIHByb3BlcnRpZXMpIDogZmFrZSAmJiBhcHBseVN0cnVjdHVyZSh0aGlzLCBzdHJ1Y3R1cmUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDbGFzcztcbiAgICB9OyBcblxuICAgIERleGllLmlnbm9yZVRyYW5zYWN0aW9uID0gZnVuY3Rpb24gKHNjb3BlRnVuYykge1xuICAgICAgICAvLyBJbiBjYXNlIGNhbGxlciBpcyB3aXRoaW4gYSB0cmFuc2FjdGlvbiBidXQgbmVlZHMgdG8gY3JlYXRlIGEgc2VwYXJhdGUgdHJhbnNhY3Rpb24uXG4gICAgICAgIC8vIEV4YW1wbGUgb2YgdXNhZ2U6XG4gICAgICAgIC8vIFxuICAgICAgICAvLyBMZXQncyBzYXkgd2UgaGF2ZSBhIGxvZ2dlciBmdW5jdGlvbiBpbiBvdXIgYXBwLiBPdGhlciBhcHBsaWNhdGlvbi1sb2dpYyBzaG91bGQgYmUgdW5hd2FyZSBvZiB0aGVcbiAgICAgICAgLy8gbG9nZ2VyIGZ1bmN0aW9uIGFuZCBub3QgbmVlZCB0byBpbmNsdWRlIHRoZSAnbG9nZW50cmllcycgdGFibGUgaW4gYWxsIHRyYW5zYWN0aW9uIGl0IHBlcmZvcm1zLlxuICAgICAgICAvLyBUaGUgbG9nZ2luZyBzaG91bGQgYWx3YXlzIGJlIGRvbmUgaW4gYSBzZXBhcmF0ZSB0cmFuc2FjdGlvbiBhbmQgbm90IGJlIGRlcGVuZGFudCBvbiB0aGUgY3VycmVudFxuICAgICAgICAvLyBydW5uaW5nIHRyYW5zYWN0aW9uIGNvbnRleHQuIFRoZW4geW91IGNvdWxkIHVzZSBEZXhpZS5pZ25vcmVUcmFuc2FjdGlvbigpIHRvIHJ1biBjb2RlIHRoYXQgc3RhcnRzIGEgbmV3IHRyYW5zYWN0aW9uLlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgRGV4aWUuaWdub3JlVHJhbnNhY3Rpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAgICAgZGIubG9nZW50cmllcy5hZGQobmV3TG9nRW50cnkpO1xuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIFVubGVzcyB1c2luZyBEZXhpZS5pZ25vcmVUcmFuc2FjdGlvbigpLCB0aGUgYWJvdmUgZXhhbXBsZSB3b3VsZCB0cnkgdG8gcmV1c2UgdGhlIGN1cnJlbnQgdHJhbnNhY3Rpb25cbiAgICAgICAgLy8gaW4gY3VycmVudCBQcm9taXNlLXNjb3BlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBBbiBhbHRlcm5hdGl2ZSB0byBEZXhpZS5pZ25vcmVUcmFuc2FjdGlvbigpIHdvdWxkIGJlIHNldEltbWVkaWF0ZSgpIG9yIHNldFRpbWVvdXQoKS4gVGhlIHJlYXNvbiB3ZSBzdGlsbCBwcm92aWRlIGFuXG4gICAgICAgIC8vIEFQSSBmb3IgdGhpcyBiZWNhdXNlXG4gICAgICAgIC8vICAxKSBUaGUgaW50ZW50aW9uIG9mIHdyaXRpbmcgdGhlIHN0YXRlbWVudCBjb3VsZCBiZSB1bmNsZWFyIGlmIHVzaW5nIHNldEltbWVkaWF0ZSgpIG9yIHNldFRpbWVvdXQoKS5cbiAgICAgICAgLy8gIDIpIHNldFRpbWVvdXQoKSB3b3VsZCB3YWl0IHVubmVzY2Vzc2FyeSB1bnRpbCBmaXJpbmcuIFRoaXMgaXMgaG93ZXZlciBub3QgdGhlIGNhc2Ugd2l0aCBzZXRJbW1lZGlhdGUoKS5cbiAgICAgICAgLy8gIDMpIHNldEltbWVkaWF0ZSgpIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhlIEVTIHN0YW5kYXJkLlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5uZXdQU0QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgUHJvbWlzZS5QU0QudHJhbnMgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHNjb3BlRnVuYygpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIERleGllLnNwYXduID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZ2xvYmFsLmNvbnNvbGUpIGNvbnNvbGUud2FybihcIkRleGllLnNwYXduKCkgaXMgZGVwcmVjYXRlZC4gVXNlIERleGllLmlnbm9yZVRyYW5zYWN0aW9uKCkgaW5zdGVhZC5cIik7XG4gICAgICAgIHJldHVybiBEZXhpZS5pZ25vcmVUcmFuc2FjdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIERleGllLnZpcCA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAvLyBUbyBiZSB1c2VkIGJ5IHN1YnNjcmliZXJzIHRvIHRoZSBvbigncmVhZHknKSBldmVudC5cbiAgICAgICAgLy8gVGhpcyB3aWxsIGxldCBjYWxsZXIgdGhyb3VnaCB0byBhY2Nlc3MgREIgZXZlbiB3aGVuIGl0IGlzIGJsb2NrZWQgd2hpbGUgdGhlIGRiLnJlYWR5KCkgc3Vic2NyaWJlcnMgYXJlIGZpcmluZy5cbiAgICAgICAgLy8gVGhpcyB3b3VsZCBoYXZlIHdvcmtlZCBhdXRvbWF0aWNhbGx5IGlmIHdlIHdlcmUgY2VydGFpbiB0aGF0IHRoZSBQcm92aWRlciB3YXMgdXNpbmcgRGV4aWUuUHJvbWlzZSBmb3IgYWxsIGFzeW5jcm9uaWMgb3BlcmF0aW9ucy4gVGhlIHByb21pc2UgUFNEXG4gICAgICAgIC8vIGZyb20gdGhlIHByb3ZpZGVyLmNvbm5lY3QoKSBjYWxsIHdvdWxkIHRoZW4gYmUgZGVyaXZlZCBhbGwgdGhlIHdheSB0byB3aGVuIHByb3ZpZGVyIHdvdWxkIGNhbGwgbG9jYWxEYXRhYmFzZS5hcHBseUNoYW5nZXMoKS4gQnV0IHNpbmNlXG4gICAgICAgIC8vIHRoZSBwcm92aWRlciBtb3JlIGxpa2VseSBpcyB1c2luZyBub24tcHJvbWlzZSBhc3luYyBBUElzIG9yIG90aGVyIHRoZW5hYmxlIGltcGxlbWVudGF0aW9ucywgd2UgY2Fubm90IGFzc3VtZSB0aGF0LlxuICAgICAgICAvLyBOb3RlIHRoYXQgdGhpcyBtZXRob2QgaXMgb25seSB1c2VmdWwgZm9yIG9uKCdyZWFkeScpIHN1YnNjcmliZXJzIHRoYXQgaXMgcmV0dXJuaW5nIGEgUHJvbWlzZSBmcm9tIHRoZSBldmVudC4gSWYgbm90IHVzaW5nIHZpcCgpXG4gICAgICAgIC8vIHRoZSBkYXRhYmFzZSBjb3VsZCBkZWFkbG9jayBzaW5jZSBpdCB3b250IG9wZW4gdW50aWwgdGhlIHJldHVybmVkIFByb21pc2UgaXMgcmVzb2x2ZWQsIGFuZCBhbnkgbm9uLVZJUGVkIG9wZXJhdGlvbiBzdGFydGVkIGJ5XG4gICAgICAgIC8vIHRoZSBjYWxsZXIgd2lsbCBub3QgcmVzb2x2ZSB1bnRpbCBkYXRhYmFzZSBpcyBvcGVuZWQuXG4gICAgICAgIHJldHVybiBQcm9taXNlLm5ld1BTRChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBQcm9taXNlLlBTRC5sZXRUaHJvdWdoID0gdHJ1ZTsgLy8gTWFrZSBzdXJlIHdlIGFyZSBsZXQgdGhyb3VnaCBpZiBzdGlsbCBibG9ja2luZyBkYiBkdWUgdG8gb25yZWFkeSBpcyBmaXJpbmcuXG4gICAgICAgICAgICByZXR1cm4gZm4oKTtcbiAgICAgICAgfSk7XG4gICAgfTsgXG5cbiAgICAvLyBEZXhpZS5jdXJyZW50VHJhbnNhY3Rpb24gcHJvcGVydHkuIE9ubHkgYXBwbGljYWJsZSBmb3IgdHJhbnNhY3Rpb25zIGVudGVyZWQgdXNpbmcgdGhlIG5ldyBcInRyYW5zYWN0KClcIiBtZXRob2QuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KERleGllLCBcImN1cnJlbnRUcmFuc2FjdGlvblwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJUcmFuc2FjdGlvblwiPjwvcmV0dXJucz5cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLlBTRCAmJiBQcm9taXNlLlBTRC50cmFucyB8fCBudWxsO1xuICAgICAgICB9XG4gICAgfSk7IFxuXG4gICAgZnVuY3Rpb24gc2FmYXJpTXVsdGlTdG9yZUZpeChzdG9yZU5hbWVzKSB7XG4gICAgICAgIHJldHVybiBzdG9yZU5hbWVzLmxlbmd0aCA9PT0gMSA/IHN0b3JlTmFtZXNbMF0gOiBzdG9yZU5hbWVzO1xuICAgIH1cblxuICAgIC8vIEV4cG9ydCBvdXIgUHJvbWlzZSBpbXBsZW1lbnRhdGlvbiBzaW5jZSBpdCBjYW4gYmUgaGFuZHkgYXMgYSBzdGFuZGFsb25lIFByb21pc2UgaW1wbGVtZW50YXRpb25cbiAgICBEZXhpZS5Qcm9taXNlID0gUHJvbWlzZTtcbiAgICAvLyBFeHBvcnQgb3VyIGRlcml2ZS9leHRlbmQvb3ZlcnJpZGUgbWV0aG9kb2xvZ3lcbiAgICBEZXhpZS5kZXJpdmUgPSBkZXJpdmU7XG4gICAgRGV4aWUuZXh0ZW5kID0gZXh0ZW5kO1xuICAgIERleGllLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gICAgLy8gRXhwb3J0IG91ciBldmVudHMoKSBmdW5jdGlvbiAtIGNhbiBiZSBoYW5keSBhcyBhIHRvb2xraXRcbiAgICBEZXhpZS5ldmVudHMgPSBldmVudHM7XG4gICAgRGV4aWUuZ2V0QnlLZXlQYXRoID0gZ2V0QnlLZXlQYXRoO1xuICAgIERleGllLnNldEJ5S2V5UGF0aCA9IHNldEJ5S2V5UGF0aDtcbiAgICBEZXhpZS5kZWxCeUtleVBhdGggPSBkZWxCeUtleVBhdGg7XG4gICAgRGV4aWUuc2hhbGxvd0Nsb25lID0gc2hhbGxvd0Nsb25lO1xuICAgIERleGllLmRlZXBDbG9uZSA9IGRlZXBDbG9uZTtcbiAgICBEZXhpZS5hZGRvbnMgPSBbXTtcbiAgICBEZXhpZS5mYWtlQXV0b0NvbXBsZXRlID0gZmFrZUF1dG9Db21wbGV0ZTtcbiAgICBEZXhpZS5hc2FwID0gYXNhcDtcbiAgICAvLyBFeHBvcnQgb3VyIHN0YXRpYyBjbGFzc2VzXG4gICAgRGV4aWUuTW9kaWZ5RXJyb3IgPSBNb2RpZnlFcnJvcjtcbiAgICBEZXhpZS5NdWx0aU1vZGlmeUVycm9yID0gTW9kaWZ5RXJyb3I7IC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHkgcHJlIDAuOS44XG4gICAgRGV4aWUuSW5kZXhTcGVjID0gSW5kZXhTcGVjO1xuICAgIERleGllLlRhYmxlU2NoZW1hID0gVGFibGVTY2hlbWE7XG4gICAgLy9cbiAgICAvLyBEZXBlbmRlbmNpZXNcbiAgICAvL1xuICAgIC8vIFRoZXNlIHdpbGwgYXV0b21hdGljYWxseSB3b3JrIGluIGJyb3dzZXJzIHdpdGggaW5kZXhlZERCIHN1cHBvcnQsIG9yIHdoZXJlIGFuIGluZGV4ZWREQiBwb2x5ZmlsbCBoYXMgYmVlbiBpbmNsdWRlZC5cbiAgICAvL1xuICAgIC8vIEluIG5vZGUuanMsIGhvd2V2ZXIsIHRoZXNlIHByb3BlcnRpZXMgbXVzdCBiZSBzZXQgXCJtYW51YWxseVwiIGJlZm9yZSBpbnN0YW5zaWF0aW5nIGEgbmV3IERleGllKCkuIEZvciBub2RlLmpzLCB5b3UgbmVlZCB0byByZXF1aXJlIGluZGV4ZWRkYi1qcyBvciBzaW1pbGFyIGFuZCB0aGVuIHNldCB0aGVzZSBkZXBzLlxuICAgIC8vXG4gICAgdmFyIGlkYnNoaW0gPSBnbG9iYWwuaWRiTW9kdWxlcyAmJiBnbG9iYWwuaWRiTW9kdWxlcy5zaGltSW5kZXhlZERCID8gZ2xvYmFsLmlkYk1vZHVsZXMgOiB7fTtcbiAgICBEZXhpZS5kZXBlbmRlbmNpZXMgPSB7XG4gICAgICAgIC8vIFJlcXVpcmVkOlxuICAgICAgICAvLyBOT1RFOiBUaGUgXCJfXCItcHJlZml4ZWQgdmVyc2lvbnMgYXJlIGZvciBwcmlvcml0aXppbmcgSURCLXNoaW0gb24gSU9TOCBiZWZvcmUgdGhlIG5hdGl2ZSBJREIgaW4gY2FzZSB0aGUgc2hpbSB3YXMgaW5jbHVkZWQuXG4gICAgICAgIGluZGV4ZWREQjogaWRic2hpbS5zaGltSW5kZXhlZERCIHx8IGdsb2JhbC5pbmRleGVkREIgfHwgZ2xvYmFsLm1vekluZGV4ZWREQiB8fCBnbG9iYWwud2Via2l0SW5kZXhlZERCIHx8IGdsb2JhbC5tc0luZGV4ZWREQixcbiAgICAgICAgSURCS2V5UmFuZ2U6IGlkYnNoaW0uSURCS2V5UmFuZ2UgfHwgZ2xvYmFsLklEQktleVJhbmdlIHx8IGdsb2JhbC53ZWJraXRJREJLZXlSYW5nZSxcbiAgICAgICAgSURCVHJhbnNhY3Rpb246IGlkYnNoaW0uSURCVHJhbnNhY3Rpb24gfHwgZ2xvYmFsLklEQlRyYW5zYWN0aW9uIHx8IGdsb2JhbC53ZWJraXRJREJUcmFuc2FjdGlvbixcbiAgICAgICAgLy8gT3B0aW9uYWw6XG4gICAgICAgIEVycm9yOiBnbG9iYWwuRXJyb3IgfHwgU3RyaW5nLFxuICAgICAgICBTeW50YXhFcnJvcjogZ2xvYmFsLlN5bnRheEVycm9yIHx8IFN0cmluZyxcbiAgICAgICAgVHlwZUVycm9yOiBnbG9iYWwuVHlwZUVycm9yIHx8IFN0cmluZyxcbiAgICAgICAgRE9NRXJyb3I6IGdsb2JhbC5ET01FcnJvciB8fCBTdHJpbmcsXG4gICAgICAgIGxvY2FsU3RvcmFnZTogKCh0eXBlb2YgY2hyb21lICE9PSBcInVuZGVmaW5lZFwiICYmIGNocm9tZSAhPT0gbnVsbCA/IGNocm9tZS5zdG9yYWdlIDogdm9pZCAwKSAhPSBudWxsID8gbnVsbCA6IGdsb2JhbC5sb2NhbFN0b3JhZ2UpXG4gICAgfTsgXG5cbiAgICAvLyBBUEkgVmVyc2lvbiBOdW1iZXI6IFR5cGUgTnVtYmVyLCBtYWtlIHN1cmUgdG8gYWx3YXlzIHNldCBhIHZlcnNpb24gbnVtYmVyIHRoYXQgY2FuIGJlIGNvbXBhcmFibGUgY29ycmVjdGx5LiBFeGFtcGxlOiAwLjksIDAuOTEsIDAuOTIsIDEuMCwgMS4wMSwgMS4xLCAxLjIsIDEuMjEsIGV0Yy5cbiAgICBEZXhpZS52ZXJzaW9uID0gMS4yMDtcblxuICAgIGZ1bmN0aW9uIGdldE5hdGl2ZUdldERhdGFiYXNlTmFtZXNGbigpIHtcbiAgICAgICAgdmFyIGluZGV4ZWREQiA9IERleGllLmRlcGVuZGVuY2llcy5pbmRleGVkREI7XG4gICAgICAgIHZhciBmbiA9IGluZGV4ZWREQiAmJiAoaW5kZXhlZERCLmdldERhdGFiYXNlTmFtZXMgfHwgaW5kZXhlZERCLndlYmtpdEdldERhdGFiYXNlTmFtZXMpO1xuICAgICAgICByZXR1cm4gZm4gJiYgZm4uYmluZChpbmRleGVkREIpO1xuICAgIH1cblxuICAgIC8vIEV4cG9ydCBEZXhpZSB0byB3aW5kb3cgb3IgYXMgYSBtb2R1bGUgZGVwZW5kaW5nIG9uIGVudmlyb25tZW50LlxuICAgIHB1Ymxpc2goXCJEZXhpZVwiLCBEZXhpZSk7XG5cbiAgICAvLyBGb29sIElERSB0byBpbXByb3ZlIGF1dG9jb21wbGV0ZS4gVGVzdGVkIHdpdGggVmlzdWFsIFN0dWRpbyAyMDEzIGFuZCAyMDE1LlxuICAgIGRvRmFrZUF1dG9Db21wbGV0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgRGV4aWUuZmFrZUF1dG9Db21wbGV0ZSA9IGZha2VBdXRvQ29tcGxldGUgPSBkb0Zha2VBdXRvQ29tcGxldGU7XG4gICAgICAgIERleGllLmZha2UgPSBmYWtlID0gdHJ1ZTtcbiAgICB9KTtcbn0pLmFwcGx5KG51bGwsXG5cbiAgICAvLyBBTUQ6XG4gICAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID9cbiAgICBbc2VsZiB8fCB3aW5kb3csIGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkgeyBkZWZpbmUoZnVuY3Rpb24gKCkgeyByZXR1cm4gdmFsdWU7IH0pOyB9XSA6XG5cbiAgICAvLyBDb21tb25KUzpcbiAgICB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyA/XG4gICAgW2dsb2JhbCwgZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7IG1vZHVsZS5leHBvcnRzID0gdmFsdWU7IH1dXG5cbiAgICAvLyBWYW5pbGxhIEhUTUwgYW5kIFdlYldvcmtlcnM6XG4gICAgOiBbc2VsZiB8fCB3aW5kb3csIGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkgeyAoc2VsZiB8fCB3aW5kb3cpW25hbWVdID0gdmFsdWU7IH1dKTtcblxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZGV4aWUvZGlzdC9sYXRlc3QvRGV4aWUuanNcbiAqKiBtb2R1bGUgaWQgPSAzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgbmV4dFRpY2sgPSByZXF1aXJlKCdwcm9jZXNzL2Jyb3dzZXIuanMnKS5uZXh0VGljaztcbnZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBpbW1lZGlhdGVJZHMgPSB7fTtcbnZhciBuZXh0SW1tZWRpYXRlSWQgPSAwO1xuXG4vLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5leHBvcnRzLnNldFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xufTtcbmV4cG9ydHMuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG59O1xuZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkgeyB0aW1lb3V0LmNsb3NlKCk7IH07XG5cbmZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcbiAgdGhpcy5faWQgPSBpZDtcbiAgdGhpcy5fY2xlYXJGbiA9IGNsZWFyRm47XG59XG5UaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5UaW1lb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG59O1xuXG4vLyBEb2VzIG5vdCBzdGFydCB0aGUgdGltZSwganVzdCBzZXRzIHVwIHRoZSBtZW1iZXJzIG5lZWRlZC5cbmV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IG1zZWNzO1xufTtcblxuZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xufTtcblxuZXhwb3J0cy5fdW5yZWZBY3RpdmUgPSBleHBvcnRzLmFjdGl2ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG4gIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuICBpZiAobXNlY3MgPj0gMCkge1xuICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcbiAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG4gICAgICAgIGl0ZW0uX29uVGltZW91dCgpO1xuICAgIH0sIG1zZWNzKTtcbiAgfVxufTtcblxuLy8gVGhhdCdzIG5vdCBob3cgbm9kZS5qcyBpbXBsZW1lbnRzIGl0IGJ1dCB0aGUgZXhwb3NlZCBhcGkgaXMgdGhlIHNhbWUuXG5leHBvcnRzLnNldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHNldEltbWVkaWF0ZSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHZhciBpZCA9IG5leHRJbW1lZGlhdGVJZCsrO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGggPCAyID8gZmFsc2UgOiBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgaW1tZWRpYXRlSWRzW2lkXSA9IHRydWU7XG5cbiAgbmV4dFRpY2soZnVuY3Rpb24gb25OZXh0VGljaygpIHtcbiAgICBpZiAoaW1tZWRpYXRlSWRzW2lkXSkge1xuICAgICAgLy8gZm4uY2FsbCgpIGlzIGZhc3RlciBzbyB3ZSBvcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiB1c2UtY2FzZVxuICAgICAgLy8gQHNlZSBodHRwOi8vanNwZXJmLmNvbS9jYWxsLWFwcGx5LXNlZ3VcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm4uY2FsbChudWxsKTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZlbnQgaWRzIGZyb20gbGVha2luZ1xuICAgICAgZXhwb3J0cy5jbGVhckltbWVkaWF0ZShpZCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaWQ7XG59O1xuXG5leHBvcnRzLmNsZWFySW1tZWRpYXRlID0gdHlwZW9mIGNsZWFySW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBjbGVhckltbWVkaWF0ZSA6IGZ1bmN0aW9uKGlkKSB7XG4gIGRlbGV0ZSBpbW1lZGlhdGVJZHNbaWRdO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqICh3ZWJwYWNrKS9+L25vZGUtbGlicy1icm93c2VyL34vdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qc1xuICoqIG1vZHVsZSBpZCA9IDRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAod2VicGFjaykvfi9ub2RlLWxpYnMtYnJvd3Nlci9+L3Byb2Nlc3MvYnJvd3Nlci5qc1xuICoqIG1vZHVsZSBpZCA9IDVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMCAxXG4gKiovIiwiaW1wb3J0IHBpY2sgZnJvbSAnbG9kYXNoLnBpY2snXG5pbXBvcnQgb21pdCBmcm9tICdsb2Rhc2gub21pdCdcbmV4cG9ydCBkZWZhdWx0IHtcbiAgcGljazogcGljayxcbiAgb21pdDogb21pdCxcbiAgdXVpZDogKCkgPT4ge1xuICAgIHZhciB1dWlkID0gXCJcIiwgaSwgcmFuZG9tO1xuICAgIGZvciAoaSA9IDA7IGkgPCAzMjsgaSsrKSB7XG4gICAgICByYW5kb20gPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwO1xuXG4gICAgICBpZiAoaSA9PSA4IHx8IGkgPT0gMTIgfHwgaSA9PSAxNiB8fCBpID09IDIwKSB7XG4gICAgICAgIHV1aWQgKz0gXCItXCJcbiAgICAgIH1cbiAgICAgIHV1aWQgKz0gKGkgPT0gMTIgPyA0IDogKGkgPT0gMTYgPyAocmFuZG9tICYgMyB8IDgpIDogcmFuZG9tKSkudG9TdHJpbmcoMTYpO1xuICAgIH1cbiAgICByZXR1cm4gdXVpZDtcbiAgfVxufVxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3V0aWwuanNcbiAqKi8iLCIvKipcbiAqIGxvZGFzaCA0LjAuMCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUZsYXR0ZW4gPSByZXF1aXJlKCdsb2Rhc2guX2Jhc2VmbGF0dGVuJyksXG4gICAgcmVzdCA9IHJlcXVpcmUoJ2xvZGFzaC5yZXN0Jyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLnJlZHVjZWAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yXG4gKiBpdGVyYXRlZSBzaG9ydGhhbmRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW2FjY3VtdWxhdG9yXSBUaGUgaW5pdGlhbCB2YWx1ZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2luaXRGcm9tQXJyYXldIFNwZWNpZnkgdXNpbmcgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYGFycmF5YCBhcyB0aGUgaW5pdGlhbCB2YWx1ZS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gYXJyYXlSZWR1Y2UoYXJyYXksIGl0ZXJhdGVlLCBhY2N1bXVsYXRvciwgaW5pdEZyb21BcnJheSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICBpZiAoaW5pdEZyb21BcnJheSAmJiBsZW5ndGgpIHtcbiAgICBhY2N1bXVsYXRvciA9IGFycmF5WysraW5kZXhdO1xuICB9XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgYWNjdW11bGF0b3IgPSBpdGVyYXRlZShhY2N1bXVsYXRvciwgYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpO1xuICB9XG4gIHJldHVybiBhY2N1bXVsYXRvcjtcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5waWNrYCB3aXRob3V0IHN1cHBvcnQgZm9yIGluZGl2aWR1YWxcbiAqIHByb3BlcnR5IG5hbWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHtzdHJpbmdbXX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIHBpY2suXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBiYXNlUGljayhvYmplY3QsIHByb3BzKSB7XG4gIG9iamVjdCA9IE9iamVjdChvYmplY3QpO1xuICByZXR1cm4gYXJyYXlSZWR1Y2UocHJvcHMsIGZ1bmN0aW9uKHJlc3VsdCwga2V5KSB7XG4gICAgaWYgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgIHJlc3VsdFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sIHt9KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIG9iamVjdCBjb21wb3NlZCBvZiB0aGUgcGlja2VkIGBvYmplY3RgIHByb3BlcnRpZXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIHNvdXJjZSBvYmplY3QuXG4gKiBAcGFyYW0gey4uLihzdHJpbmd8c3RyaW5nW10pfSBbcHJvcHNdIFRoZSBwcm9wZXJ0eSBuYW1lcyB0byBwaWNrLCBzcGVjaWZpZWRcbiAqICBpbmRpdmlkdWFsbHkgb3IgaW4gYXJyYXlzLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbmV3IG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ2EnOiAxLCAnYic6ICcyJywgJ2MnOiAzIH07XG4gKlxuICogXy5waWNrKG9iamVjdCwgWydhJywgJ2MnXSk7XG4gKiAvLyA9PiB7ICdhJzogMSwgJ2MnOiAzIH1cbiAqL1xudmFyIHBpY2sgPSByZXN0KGZ1bmN0aW9uKG9iamVjdCwgcHJvcHMpIHtcbiAgcmV0dXJuIG9iamVjdCA9PSBudWxsID8ge30gOiBiYXNlUGljayhvYmplY3QsIGJhc2VGbGF0dGVuKHByb3BzKSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBwaWNrO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLnBpY2svaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSA3XG4gKiogbW9kdWxlIGNodW5rcyA9IDAgMVxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhcmdzVGFnID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgZ2VuVGFnID0gJ1tvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dJztcblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBlbGVtZW50cyBvZiBgdmFsdWVzYCB0byBgYXJyYXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gbW9kaWZ5LlxuICogQHBhcmFtIHtBcnJheX0gdmFsdWVzIFRoZSB2YWx1ZXMgdG8gYXBwZW5kLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5UHVzaChhcnJheSwgdmFsdWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gdmFsdWVzLmxlbmd0aCxcbiAgICAgIG9mZnNldCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGFycmF5W29mZnNldCArIGluZGV4XSA9IHZhbHVlc1tpbmRleF07XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBnbG9iYWwuT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgcHJvcGVydHlJc0VudW1lcmFibGUgPSBvYmplY3RQcm90by5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mbGF0dGVuYCB3aXRoIHN1cHBvcnQgZm9yIHJlc3RyaWN0aW5nIGZsYXR0ZW5pbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBmbGF0dGVuLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNEZWVwXSBTcGVjaWZ5IGEgZGVlcCBmbGF0dGVuLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNTdHJpY3RdIFJlc3RyaWN0IGZsYXR0ZW5pbmcgdG8gYXJyYXlzLWxpa2Ugb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtyZXN1bHQ9W11dIFRoZSBpbml0aWFsIHJlc3VsdCB2YWx1ZS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGZsYXR0ZW5lZCBhcnJheS5cbiAqL1xuZnVuY3Rpb24gYmFzZUZsYXR0ZW4oYXJyYXksIGlzRGVlcCwgaXNTdHJpY3QsIHJlc3VsdCkge1xuICByZXN1bHQgfHwgKHJlc3VsdCA9IFtdKTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XTtcbiAgICBpZiAoaXNBcnJheUxpa2VPYmplY3QodmFsdWUpICYmXG4gICAgICAgIChpc1N0cmljdCB8fCBpc0FycmF5KHZhbHVlKSB8fCBpc0FyZ3VtZW50cyh2YWx1ZSkpKSB7XG4gICAgICBpZiAoaXNEZWVwKSB7XG4gICAgICAgIC8vIFJlY3Vyc2l2ZWx5IGZsYXR0ZW4gYXJyYXlzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgICAgIGJhc2VGbGF0dGVuKHZhbHVlLCBpc0RlZXAsIGlzU3RyaWN0LCByZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXJyYXlQdXNoKHJlc3VsdCwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWlzU3RyaWN0KSB7XG4gICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5wcm9wZXJ0eWAgd2l0aG91dCBzdXBwb3J0IGZvciBkZWVwIHBhdGhzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlUHJvcGVydHkoa2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgfTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBcImxlbmd0aFwiIHByb3BlcnR5IHZhbHVlIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gYXZvaWQgYSBbSklUIGJ1Z10oaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE0Mjc5MilcbiAqIHRoYXQgYWZmZWN0cyBTYWZhcmkgb24gYXQgbGVhc3QgaU9TIDguMS04LjMgQVJNNjQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBcImxlbmd0aFwiIHZhbHVlLlxuICovXG52YXIgZ2V0TGVuZ3RoID0gYmFzZVByb3BlcnR5KCdsZW5ndGgnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBsaWtlbHkgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJndW1lbnRzOyB9KCkpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcmd1bWVudHMoWzEsIDIsIDNdKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKHZhbHVlKSB7XG4gIC8vIFNhZmFyaSA4LjEgaW5jb3JyZWN0bHkgbWFrZXMgYGFyZ3VtZW50cy5jYWxsZWVgIGVudW1lcmFibGUgaW4gc3RyaWN0IG1vZGUuXG4gIHJldHVybiBpc0FycmF5TGlrZU9iamVjdCh2YWx1ZSkgJiYgaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpICYmXG4gICAgKCFwcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHZhbHVlLCAnY2FsbGVlJykgfHwgb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gYXJnc1RhZyk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhbiBgQXJyYXlgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHR5cGUgRnVuY3Rpb25cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0FycmF5KCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0FycmF5KF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZS4gQSB2YWx1ZSBpcyBjb25zaWRlcmVkIGFycmF5LWxpa2UgaWYgaXQnc1xuICogbm90IGEgZnVuY3Rpb24gYW5kIGhhcyBhIGB2YWx1ZS5sZW5ndGhgIHRoYXQncyBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiBvclxuICogZXF1YWwgdG8gYDBgIGFuZCBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYE51bWJlci5NQVhfU0FGRV9JTlRFR0VSYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHR5cGUgRnVuY3Rpb25cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZSgnYWJjJyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiZcbiAgICAhKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nICYmIGlzRnVuY3Rpb24odmFsdWUpKSAmJiBpc0xlbmd0aChnZXRMZW5ndGgodmFsdWUpKTtcbn1cblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLmlzQXJyYXlMaWtlYCBleGNlcHQgdGhhdCBpdCBhbHNvIGNoZWNrcyBpZiBgdmFsdWVgXG4gKiBpcyBhbiBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBhcnJheS1saWtlIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZU9iamVjdChkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlT2JqZWN0KCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0FycmF5TGlrZU9iamVjdChfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNBcnJheUxpa2VPYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNBcnJheUxpa2UodmFsdWUpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOCB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvcnMsIGFuZFxuICAvLyBQaGFudG9tSlMgMS45IHdoaWNoIHJldHVybnMgJ2Z1bmN0aW9uJyBmb3IgYE5vZGVMaXN0YCBpbnN0YW5jZXMuXG4gIHZhciB0YWcgPSBpc09iamVjdCh2YWx1ZSkgPyBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICByZXR1cm4gdGFnID09IGZ1bmNUYWcgfHwgdGFnID09IGdlblRhZztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGFycmF5LWxpa2UgbGVuZ3RoLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIGxvb3NlbHkgYmFzZWQgb24gW2BUb0xlbmd0aGBdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLXRvbGVuZ3RoKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBsZW5ndGgsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0xlbmd0aCgzKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzTGVuZ3RoKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzTGVuZ3RoKEluZmluaXR5KTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0xlbmd0aCgnMycpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNMZW5ndGgodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyAmJiB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDw9IE1BWF9TQUZFX0lOVEVHRVI7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlIFtsYW5ndWFnZSB0eXBlXShodHRwczovL2VzNS5naXRodWIuaW8vI3g4KSBvZiBgT2JqZWN0YC5cbiAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgLy8gQXZvaWQgYSBWOCBKSVQgYnVnIGluIENocm9tZSAxOS0yMC5cbiAgLy8gU2VlIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxIGZvciBtb3JlIGRldGFpbHMuXG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gISF2YWx1ZSAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUZsYXR0ZW47XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9sb2Rhc2gucGljay9+L2xvZGFzaC5fYmFzZWZsYXR0ZW4vaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSA4XG4gKiogbW9kdWxlIGNodW5rcyA9IDAgMVxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIElORklOSVRZID0gMSAvIDAsXG4gICAgTUFYX0lOVEVHRVIgPSAxLjc5NzY5MzEzNDg2MjMxNTdlKzMwOCxcbiAgICBOQU4gPSAwIC8gMDtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXSc7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGBnbG9iYWxgLiAqL1xudmFyIGZyZWVQYXJzZUludCA9IHBhcnNlSW50O1xuXG4vKipcbiAqIEEgZmFzdGVyIGFsdGVybmF0aXZlIHRvIGBGdW5jdGlvbiNhcHBseWAsIHRoaXMgZnVuY3Rpb24gaW52b2tlcyBgZnVuY2BcbiAqIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIGB0aGlzQXJnYCBhbmQgdGhlIGFyZ3VtZW50cyBvZiBgYXJnc2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGludm9rZS5cbiAqIEBwYXJhbSB7Kn0gdGhpc0FyZyBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGZ1bmNgLlxuICogQHBhcmFtIHsuLi4qfSBbYXJnc10gVGhlIGFyZ3VtZW50cyB0byBpbnZva2UgYGZ1bmNgIHdpdGguXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgcmVzdWx0IG9mIGBmdW5jYC5cbiAqL1xuZnVuY3Rpb24gYXBwbHkoZnVuYywgdGhpc0FyZywgYXJncykge1xuICB2YXIgbGVuZ3RoID0gYXJncyA/IGFyZ3MubGVuZ3RoIDogMDtcbiAgc3dpdGNoIChsZW5ndGgpIHtcbiAgICBjYXNlIDA6IHJldHVybiBmdW5jLmNhbGwodGhpc0FyZyk7XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGFyZ3NbMF0pO1xuICAgIGNhc2UgMjogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCBhcmdzWzBdLCBhcmdzWzFdKTtcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSk7XG4gIH1cbiAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG59XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IGdsb2JhbC5PYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXg7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBgZnVuY2Agd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlXG4gKiBjcmVhdGVkIGZ1bmN0aW9uIGFuZCBhcmd1bWVudHMgZnJvbSBgc3RhcnRgIGFuZCBiZXlvbmQgcHJvdmlkZWQgYXMgYW4gYXJyYXkuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGlzIGJhc2VkIG9uIHRoZSBbcmVzdCBwYXJhbWV0ZXJdKGh0dHBzOi8vbWRuLmlvL3Jlc3RfcGFyYW1ldGVycykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYXBwbHkgYSByZXN0IHBhcmFtZXRlciB0by5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnQ9ZnVuYy5sZW5ndGgtMV0gVGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoZSByZXN0IHBhcmFtZXRlci5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgc2F5ID0gXy5yZXN0KGZ1bmN0aW9uKHdoYXQsIG5hbWVzKSB7XG4gKiAgIHJldHVybiB3aGF0ICsgJyAnICsgXy5pbml0aWFsKG5hbWVzKS5qb2luKCcsICcpICtcbiAqICAgICAoXy5zaXplKG5hbWVzKSA+IDEgPyAnLCAmICcgOiAnJykgKyBfLmxhc3QobmFtZXMpO1xuICogfSk7XG4gKlxuICogc2F5KCdoZWxsbycsICdmcmVkJywgJ2Jhcm5leScsICdwZWJibGVzJyk7XG4gKiAvLyA9PiAnaGVsbG8gZnJlZCwgYmFybmV5LCAmIHBlYmJsZXMnXG4gKi9cbmZ1bmN0aW9uIHJlc3QoZnVuYywgc3RhcnQpIHtcbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgc3RhcnQgPSBuYXRpdmVNYXgoc3RhcnQgPT09IHVuZGVmaW5lZCA/IChmdW5jLmxlbmd0aCAtIDEpIDogdG9JbnRlZ2VyKHN0YXJ0KSwgMCk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gbmF0aXZlTWF4KGFyZ3MubGVuZ3RoIC0gc3RhcnQsIDApLFxuICAgICAgICBhcnJheSA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgYXJyYXlbaW5kZXhdID0gYXJnc1tzdGFydCArIGluZGV4XTtcbiAgICB9XG4gICAgc3dpdGNoIChzdGFydCkge1xuICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFycmF5KTtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBhcmdzWzBdLCBhcnJheSk7XG4gICAgICBjYXNlIDI6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJnc1swXSwgYXJnc1sxXSwgYXJyYXkpO1xuICAgIH1cbiAgICB2YXIgb3RoZXJBcmdzID0gQXJyYXkoc3RhcnQgKyAxKTtcbiAgICBpbmRleCA9IC0xO1xuICAgIHdoaWxlICgrK2luZGV4IDwgc3RhcnQpIHtcbiAgICAgIG90aGVyQXJnc1tpbmRleF0gPSBhcmdzW2luZGV4XTtcbiAgICB9XG4gICAgb3RoZXJBcmdzW3N0YXJ0XSA9IGFycmF5O1xuICAgIHJldHVybiBhcHBseShmdW5jLCB0aGlzLCBvdGhlckFyZ3MpO1xuICB9O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOCB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvcnMsIGFuZFxuICAvLyBQaGFudG9tSlMgMS45IHdoaWNoIHJldHVybnMgJ2Z1bmN0aW9uJyBmb3IgYE5vZGVMaXN0YCBpbnN0YW5jZXMuXG4gIHZhciB0YWcgPSBpc09iamVjdCh2YWx1ZSkgPyBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICByZXR1cm4gdGFnID09IGZ1bmNUYWcgfHwgdGFnID09IGdlblRhZztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgW2xhbmd1YWdlIHR5cGVdKGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDgpIG9mIGBPYmplY3RgLlxuICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxuICAvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTEgZm9yIG1vcmUgZGV0YWlscy5cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhbiBpbnRlZ2VyLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIGxvb3NlbHkgYmFzZWQgb24gW2BUb0ludGVnZXJgXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9pbnRlZ2VyKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgaW50ZWdlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b0ludGVnZXIoMyk7XG4gKiAvLyA9PiAzXG4gKlxuICogXy50b0ludGVnZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiAwXG4gKlxuICogXy50b0ludGVnZXIoSW5maW5pdHkpO1xuICogLy8gPT4gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDhcbiAqXG4gKiBfLnRvSW50ZWdlcignMycpO1xuICogLy8gPT4gM1xuICovXG5mdW5jdGlvbiB0b0ludGVnZXIodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogMDtcbiAgfVxuICB2YWx1ZSA9IHRvTnVtYmVyKHZhbHVlKTtcbiAgaWYgKHZhbHVlID09PSBJTkZJTklUWSB8fCB2YWx1ZSA9PT0gLUlORklOSVRZKSB7XG4gICAgdmFyIHNpZ24gPSAodmFsdWUgPCAwID8gLTEgOiAxKTtcbiAgICByZXR1cm4gc2lnbiAqIE1BWF9JTlRFR0VSO1xuICB9XG4gIHZhciByZW1haW5kZXIgPSB2YWx1ZSAlIDE7XG4gIHJldHVybiB2YWx1ZSA9PT0gdmFsdWUgPyAocmVtYWluZGVyID8gdmFsdWUgLSByZW1haW5kZXIgOiB2YWx1ZSkgOiAwO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBudW1iZXIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMpO1xuICogLy8gPT4gM1xuICpcbiAqIF8udG9OdW1iZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvTnVtYmVyKEluZmluaXR5KTtcbiAqIC8vID0+IEluZmluaXR5XG4gKlxuICogXy50b051bWJlcignMycpO1xuICogLy8gPT4gM1xuICovXG5mdW5jdGlvbiB0b051bWJlcih2YWx1ZSkge1xuICBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdmFyIG90aGVyID0gaXNGdW5jdGlvbih2YWx1ZS52YWx1ZU9mKSA/IHZhbHVlLnZhbHVlT2YoKSA6IHZhbHVlO1xuICAgIHZhbHVlID0gaXNPYmplY3Qob3RoZXIpID8gKG90aGVyICsgJycpIDogb3RoZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogK3ZhbHVlO1xuICB9XG4gIHZhbHVlID0gdmFsdWUucmVwbGFjZShyZVRyaW0sICcnKTtcbiAgdmFyIGlzQmluYXJ5ID0gcmVJc0JpbmFyeS50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIChpc0JpbmFyeSB8fCByZUlzT2N0YWwudGVzdCh2YWx1ZSkpXG4gICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgOiAocmVJc0JhZEhleC50ZXN0KHZhbHVlKSA/IE5BTiA6ICt2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVzdDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5waWNrL34vbG9kYXNoLnJlc3QvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSA5XG4gKiogbW9kdWxlIGNodW5rcyA9IDAgMVxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBTZXRDYWNoZSA9IHJlcXVpcmUoJ2xvZGFzaC5fc2V0Y2FjaGUnKSxcbiAgICBhcnJheUluY2x1ZGVzID0gcmVxdWlyZSgnbG9kYXNoLl9hcnJheWluY2x1ZGVzJyksXG4gICAgYXJyYXlJbmNsdWRlc1dpdGggPSByZXF1aXJlKCdsb2Rhc2guX2FycmF5aW5jbHVkZXN3aXRoJyksXG4gICAgYXJyYXlNYXAgPSByZXF1aXJlKCdsb2Rhc2guX2FycmF5bWFwJyksXG4gICAgYmFzZUZsYXR0ZW4gPSByZXF1aXJlKCdsb2Rhc2guX2Jhc2VmbGF0dGVuJyksXG4gICAgY2FjaGVIYXMgPSByZXF1aXJlKCdsb2Rhc2guX2NhY2hlaGFzJyksXG4gICAga2V5c0luID0gcmVxdWlyZSgnbG9kYXNoLmtleXNpbicpLFxuICAgIHJlc3QgPSByZXF1aXJlKCdsb2Rhc2gucmVzdCcpO1xuXG4vKiogVXNlZCBhcyB0aGUgc2l6ZSB0byBlbmFibGUgbGFyZ2UgYXJyYXkgb3B0aW1pemF0aW9ucy4gKi9cbnZhciBMQVJHRV9BUlJBWV9TSVpFID0gMjAwO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5yZWR1Y2VgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvclxuICogaXRlcmF0ZWUgc2hvcnRoYW5kcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0geyp9IFthY2N1bXVsYXRvcl0gVGhlIGluaXRpYWwgdmFsdWUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpbml0RnJvbUFycmF5XSBTcGVjaWZ5IHVzaW5nIHRoZSBmaXJzdCBlbGVtZW50IG9mIGBhcnJheWAgYXMgdGhlIGluaXRpYWwgdmFsdWUuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgYWNjdW11bGF0ZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGFycmF5UmVkdWNlKGFycmF5LCBpdGVyYXRlZSwgYWNjdW11bGF0b3IsIGluaXRGcm9tQXJyYXkpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgaWYgKGluaXRGcm9tQXJyYXkgJiYgbGVuZ3RoKSB7XG4gICAgYWNjdW11bGF0b3IgPSBhcnJheVsrK2luZGV4XTtcbiAgfVxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGFjY3VtdWxhdG9yID0gaXRlcmF0ZWUoYWNjdW11bGF0b3IsIGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KTtcbiAgfVxuICByZXR1cm4gYWNjdW11bGF0b3I7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udW5hcnlgIHdpdGhvdXQgc3VwcG9ydCBmb3Igc3RvcmluZyB3cmFwcGVyIG1ldGFkYXRhLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjYXAgYXJndW1lbnRzIGZvci5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlVW5hcnkoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gZnVuYyh2YWx1ZSk7XG4gIH07XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgbWV0aG9kcyBsaWtlIGBfLmRpZmZlcmVuY2VgIHdpdGhvdXQgc3VwcG9ydCBmb3JcbiAqIGV4Y2x1ZGluZyBtdWx0aXBsZSBhcnJheXMgb3IgaXRlcmF0ZWUgc2hvcnRoYW5kcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGluc3BlY3QuXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZXMgVGhlIHZhbHVlcyB0byBleGNsdWRlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2l0ZXJhdGVlXSBUaGUgaXRlcmF0ZWUgaW52b2tlZCBwZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjb21wYXJhdG9yXSBUaGUgY29tcGFyYXRvciBpbnZva2VkIHBlciBlbGVtZW50LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgYXJyYXkgb2YgZmlsdGVyZWQgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBiYXNlRGlmZmVyZW5jZShhcnJheSwgdmFsdWVzLCBpdGVyYXRlZSwgY29tcGFyYXRvcikge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGluY2x1ZGVzID0gYXJyYXlJbmNsdWRlcyxcbiAgICAgIGlzQ29tbW9uID0gdHJ1ZSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgIHJlc3VsdCA9IFtdLFxuICAgICAgdmFsdWVzTGVuZ3RoID0gdmFsdWVzLmxlbmd0aDtcblxuICBpZiAoIWxlbmd0aCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgaWYgKGl0ZXJhdGVlKSB7XG4gICAgdmFsdWVzID0gYXJyYXlNYXAodmFsdWVzLCBiYXNlVW5hcnkoaXRlcmF0ZWUpKTtcbiAgfVxuICBpZiAoY29tcGFyYXRvcikge1xuICAgIGluY2x1ZGVzID0gYXJyYXlJbmNsdWRlc1dpdGg7XG4gICAgaXNDb21tb24gPSBmYWxzZTtcbiAgfVxuICBlbHNlIGlmICh2YWx1ZXMubGVuZ3RoID49IExBUkdFX0FSUkFZX1NJWkUpIHtcbiAgICBpbmNsdWRlcyA9IGNhY2hlSGFzO1xuICAgIGlzQ29tbW9uID0gZmFsc2U7XG4gICAgdmFsdWVzID0gbmV3IFNldENhY2hlKHZhbHVlcyk7XG4gIH1cbiAgb3V0ZXI6XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdLFxuICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlID8gaXRlcmF0ZWUodmFsdWUpIDogdmFsdWU7XG5cbiAgICBpZiAoaXNDb21tb24gJiYgY29tcHV0ZWQgPT09IGNvbXB1dGVkKSB7XG4gICAgICB2YXIgdmFsdWVzSW5kZXggPSB2YWx1ZXNMZW5ndGg7XG4gICAgICB3aGlsZSAodmFsdWVzSW5kZXgtLSkge1xuICAgICAgICBpZiAodmFsdWVzW3ZhbHVlc0luZGV4XSA9PT0gY29tcHV0ZWQpIHtcbiAgICAgICAgICBjb250aW51ZSBvdXRlcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIGlmICghaW5jbHVkZXModmFsdWVzLCBjb21wdXRlZCwgY29tcGFyYXRvcikpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5waWNrYCB3aXRob3V0IHN1cHBvcnQgZm9yIGluZGl2aWR1YWxcbiAqIHByb3BlcnR5IG5hbWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHtzdHJpbmdbXX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIHBpY2suXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBiYXNlUGljayhvYmplY3QsIHByb3BzKSB7XG4gIG9iamVjdCA9IE9iamVjdChvYmplY3QpO1xuICByZXR1cm4gYXJyYXlSZWR1Y2UocHJvcHMsIGZ1bmN0aW9uKHJlc3VsdCwga2V5KSB7XG4gICAgaWYgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgIHJlc3VsdFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sIHt9KTtcbn1cblxuLyoqXG4gKiBUaGUgb3Bwb3NpdGUgb2YgYF8ucGlja2A7IHRoaXMgbWV0aG9kIGNyZWF0ZXMgYW4gb2JqZWN0IGNvbXBvc2VkIG9mIHRoZVxuICogb3duIGFuZCBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIGBvYmplY3RgIHRoYXQgYXJlIG5vdCBvbWl0dGVkLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHsuLi4oc3RyaW5nfHN0cmluZ1tdKX0gW3Byb3BzXSBUaGUgcHJvcGVydHkgbmFtZXMgdG8gb21pdCwgc3BlY2lmaWVkXG4gKiAgaW5kaXZpZHVhbGx5IG9yIGluIGFycmF5cy4uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IDEsICdiJzogJzInLCAnYyc6IDMgfTtcbiAqXG4gKiBfLm9taXQob2JqZWN0LCBbJ2EnLCAnYyddKTtcbiAqIC8vID0+IHsgJ2InOiAnMicgfVxuICovXG52YXIgb21pdCA9IHJlc3QoZnVuY3Rpb24ob2JqZWN0LCBwcm9wcykge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICByZXR1cm4ge307XG4gIH1cbiAgcHJvcHMgPSBhcnJheU1hcChiYXNlRmxhdHRlbihwcm9wcyksIFN0cmluZyk7XG4gIHJldHVybiBiYXNlUGljayhvYmplY3QsIGJhc2VEaWZmZXJlbmNlKGtleXNJbihvYmplY3QpLCBwcm9wcykpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gb21pdDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5vbWl0L2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMCAxXG4gKiovIiwiLyoqXG4gKiBsb2Rhc2ggNC4wLjAgKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTYgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxNiBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIE1hcENhY2hlID0gcmVxdWlyZSgnbG9kYXNoLl9tYXBjYWNoZScpO1xuXG4vKiogVXNlZCB0byBzdGFuZC1pbiBmb3IgYHVuZGVmaW5lZGAgaGFzaCB2YWx1ZXMuICovXG52YXIgSEFTSF9VTkRFRklORUQgPSAnX19sb2Rhc2hfaGFzaF91bmRlZmluZWRfXyc7XG5cbi8qKlxuICpcbiAqIENyZWF0ZXMgYSBzZXQgY2FjaGUgb2JqZWN0IHRvIHN0b3JlIHVuaXF1ZSB2YWx1ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IFt2YWx1ZXNdIFRoZSB2YWx1ZXMgdG8gY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIFNldENhY2hlKHZhbHVlcykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHZhbHVlcyA/IHZhbHVlcy5sZW5ndGggOiAwO1xuXG4gIHRoaXMuX19kYXRhX18gPSBuZXcgTWFwQ2FjaGU7XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdGhpcy5wdXNoKHZhbHVlc1tpbmRleF0pO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBgdmFsdWVgIHRvIHRoZSBzZXQgY2FjaGUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIHB1c2hcbiAqIEBtZW1iZXJPZiBTZXRDYWNoZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIGNhY2hlUHVzaCh2YWx1ZSkge1xuICB2YXIgbWFwID0gdGhpcy5fX2RhdGFfXztcbiAgaWYgKGlzS2V5YWJsZSh2YWx1ZSkpIHtcbiAgICB2YXIgZGF0YSA9IG1hcC5fX2RhdGFfXyxcbiAgICAgICAgaGFzaCA9IHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyA/IGRhdGEuc3RyaW5nIDogZGF0YS5oYXNoO1xuXG4gICAgaGFzaFt2YWx1ZV0gPSBIQVNIX1VOREVGSU5FRDtcbiAgfVxuICBlbHNlIHtcbiAgICBtYXAuc2V0KHZhbHVlLCBIQVNIX1VOREVGSU5FRCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSBmb3IgdXNlIGFzIHVuaXF1ZSBvYmplY3Qga2V5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzS2V5YWJsZSh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuIHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnYm9vbGVhbicgfHxcbiAgICAodHlwZSA9PSAnc3RyaW5nJyAmJiB2YWx1ZSAhPT0gJ19fcHJvdG9fXycpIHx8IHZhbHVlID09IG51bGw7XG59XG5cbi8vIEFkZCBmdW5jdGlvbnMgdG8gdGhlIGBTZXRDYWNoZWAuXG5TZXRDYWNoZS5wcm90b3R5cGUucHVzaCA9IGNhY2hlUHVzaDtcblxubW9kdWxlLmV4cG9ydHMgPSBTZXRDYWNoZTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5vbWl0L34vbG9kYXNoLl9zZXRjYWNoZS9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDExXG4gKiogbW9kdWxlIGNodW5rcyA9IDAgMVxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgdG8gc3RhbmQtaW4gZm9yIGB1bmRlZmluZWRgIGhhc2ggdmFsdWVzLiAqL1xudmFyIEhBU0hfVU5ERUZJTkVEID0gJ19fbG9kYXNoX2hhc2hfdW5kZWZpbmVkX18nO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgZ2VuVGFnID0gJ1tvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dJztcblxuLyoqIFVzZWQgdG8gbWF0Y2ggYFJlZ0V4cGAgW3N5bnRheCBjaGFyYWN0ZXJzXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1wYXR0ZXJucykuICovXG52YXIgcmVSZWdFeHBDaGFyID0gL1tcXFxcXiQuKis/KClbXFxde318XS9nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaG9zdCBjb25zdHJ1Y3RvcnMgKFNhZmFyaSA+IDUpLiAqL1xudmFyIHJlSXNIb3N0Q3RvciA9IC9eXFxbb2JqZWN0IC4rP0NvbnN0cnVjdG9yXFxdJC87XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBob3N0IG9iamVjdCBpbiBJRSA8IDkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBob3N0IG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0hvc3RPYmplY3QodmFsdWUpIHtcbiAgLy8gTWFueSBob3N0IG9iamVjdHMgYXJlIGBPYmplY3RgIG9iamVjdHMgdGhhdCBjYW4gY29lcmNlIHRvIHN0cmluZ3NcbiAgLy8gZGVzcGl0ZSBoYXZpbmcgaW1wcm9wZXJseSBkZWZpbmVkIGB0b1N0cmluZ2AgbWV0aG9kcy5cbiAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICBpZiAodmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUudG9TdHJpbmcgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSAhISh2YWx1ZSArICcnKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBhcnJheVByb3RvID0gZ2xvYmFsLkFycmF5LnByb3RvdHlwZSxcbiAgICBvYmplY3RQcm90byA9IGdsb2JhbC5PYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZnVuY1RvU3RyaW5nID0gZ2xvYmFsLkZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGlmIGEgbWV0aG9kIGlzIG5hdGl2ZS4gKi9cbnZhciByZUlzTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gIGZ1bmNUb1N0cmluZy5jYWxsKGhhc093blByb3BlcnR5KS5yZXBsYWNlKHJlUmVnRXhwQ2hhciwgJ1xcXFwkJicpXG4gIC5yZXBsYWNlKC9oYXNPd25Qcm9wZXJ0eXwoZnVuY3Rpb24pLio/KD89XFxcXFxcKCl8IGZvciAuKz8oPz1cXFxcXFxdKS9nLCAnJDEuKj8nKSArICckJ1xuKTtcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgc3BsaWNlID0gYXJyYXlQcm90by5zcGxpY2U7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHRoYXQgYXJlIHZlcmlmaWVkIHRvIGJlIG5hdGl2ZS4gKi9cbnZhciBNYXAgPSBnZXROYXRpdmUoZ2xvYmFsLCAnTWFwJyksXG4gICAgbmF0aXZlQ3JlYXRlID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2NyZWF0ZScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gaGFzaCBvYmplY3QuXG4gKlxuICogQHByaXZhdGVcbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG5ldyBoYXNoIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gSGFzaCgpIHt9XG5cbi8qKlxuICogUmVtb3ZlcyBga2V5YCBhbmQgaXRzIHZhbHVlIGZyb20gdGhlIGhhc2guXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBoYXNoIFRoZSBoYXNoIHRvIG1vZGlmeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBoYXNoRGVsZXRlKGhhc2gsIGtleSkge1xuICByZXR1cm4gaGFzaEhhcyhoYXNoLCBrZXkpICYmIGRlbGV0ZSBoYXNoW2tleV07XG59XG5cbi8qKlxuICogR2V0cyB0aGUgaGFzaCB2YWx1ZSBmb3IgYGtleWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBoYXNoIFRoZSBoYXNoIHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZW50cnkgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGhhc2hHZXQoaGFzaCwga2V5KSB7XG4gIGlmIChuYXRpdmVDcmVhdGUpIHtcbiAgICB2YXIgcmVzdWx0ID0gaGFzaFtrZXldO1xuICAgIHJldHVybiByZXN1bHQgPT09IEhBU0hfVU5ERUZJTkVEID8gdW5kZWZpbmVkIDogcmVzdWx0O1xuICB9XG4gIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKGhhc2gsIGtleSkgPyBoYXNoW2tleV0gOiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgaGFzaCB2YWx1ZSBmb3IgYGtleWAgZXhpc3RzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gaGFzaCBUaGUgaGFzaCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZW50cnkgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW4gZW50cnkgZm9yIGBrZXlgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBoYXNoSGFzKGhhc2gsIGtleSkge1xuICByZXR1cm4gbmF0aXZlQ3JlYXRlID8gaGFzaFtrZXldICE9PSB1bmRlZmluZWQgOiBoYXNPd25Qcm9wZXJ0eS5jYWxsKGhhc2gsIGtleSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgaGFzaCBga2V5YCB0byBgdmFsdWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gaGFzaCBUaGUgaGFzaCB0byBtb2RpZnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHNldC5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAqL1xuZnVuY3Rpb24gaGFzaFNldChoYXNoLCBrZXksIHZhbHVlKSB7XG4gIGhhc2hba2V5XSA9IChuYXRpdmVDcmVhdGUgJiYgdmFsdWUgPT09IHVuZGVmaW5lZCkgPyBIQVNIX1VOREVGSU5FRCA6IHZhbHVlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXAgY2FjaGUgb2JqZWN0IHRvIHN0b3JlIGtleS12YWx1ZSBwYWlycy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gW3ZhbHVlc10gVGhlIHZhbHVlcyB0byBjYWNoZS5cbiAqL1xuZnVuY3Rpb24gTWFwQ2FjaGUodmFsdWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gdmFsdWVzID8gdmFsdWVzLmxlbmd0aCA6IDA7XG5cbiAgdGhpcy5jbGVhcigpO1xuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciBlbnRyeSA9IHZhbHVlc1tpbmRleF07XG4gICAgdGhpcy5zZXQoZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGtleS12YWx1ZSBlbnRyaWVzIGZyb20gdGhlIG1hcC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgY2xlYXJcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICovXG5mdW5jdGlvbiBtYXBDbGVhcigpIHtcbiAgdGhpcy5fX2RhdGFfXyA9IHsgJ2hhc2gnOiBuZXcgSGFzaCwgJ21hcCc6IE1hcCA/IG5ldyBNYXAgOiBbXSwgJ3N0cmluZyc6IG5ldyBIYXNoIH07XG59XG5cbi8qKlxuICogUmVtb3ZlcyBga2V5YCBhbmQgaXRzIHZhbHVlIGZyb20gdGhlIG1hcC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgZGVsZXRlXG4gKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBtYXBEZWxldGUoa2V5KSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXztcbiAgaWYgKGlzS2V5YWJsZShrZXkpKSB7XG4gICAgcmV0dXJuIGhhc2hEZWxldGUodHlwZW9mIGtleSA9PSAnc3RyaW5nJyA/IGRhdGEuc3RyaW5nIDogZGF0YS5oYXNoLCBrZXkpO1xuICB9XG4gIHJldHVybiBNYXAgPyBkYXRhLm1hcFsnZGVsZXRlJ10oa2V5KSA6IGFzc29jRGVsZXRlKGRhdGEubWFwLCBrZXkpO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIG1hcCB2YWx1ZSBmb3IgYGtleWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGdldFxuICogQG1lbWJlck9mIE1hcENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gbWFwR2V0KGtleSkge1xuICB2YXIgZGF0YSA9IHRoaXMuX19kYXRhX187XG4gIGlmIChpc0tleWFibGUoa2V5KSkge1xuICAgIHJldHVybiBoYXNoR2V0KHR5cGVvZiBrZXkgPT0gJ3N0cmluZycgPyBkYXRhLnN0cmluZyA6IGRhdGEuaGFzaCwga2V5KTtcbiAgfVxuICByZXR1cm4gTWFwID8gZGF0YS5tYXAuZ2V0KGtleSkgOiBhc3NvY0dldChkYXRhLm1hcCwga2V5KTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYSBtYXAgdmFsdWUgZm9yIGBrZXlgIGV4aXN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgaGFzXG4gKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZW50cnkgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW4gZW50cnkgZm9yIGBrZXlgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBtYXBIYXMoa2V5KSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXztcbiAgaWYgKGlzS2V5YWJsZShrZXkpKSB7XG4gICAgcmV0dXJuIGhhc2hIYXModHlwZW9mIGtleSA9PSAnc3RyaW5nJyA/IGRhdGEuc3RyaW5nIDogZGF0YS5oYXNoLCBrZXkpO1xuICB9XG4gIHJldHVybiBNYXAgPyBkYXRhLm1hcC5oYXMoa2V5KSA6IGFzc29jSGFzKGRhdGEubWFwLCBrZXkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG1hcCBga2V5YCB0byBgdmFsdWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBzZXRcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBtYXAgY2FjaGUgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBtYXBTZXQoa2V5LCB2YWx1ZSkge1xuICB2YXIgZGF0YSA9IHRoaXMuX19kYXRhX187XG4gIGlmIChpc0tleWFibGUoa2V5KSkge1xuICAgIGhhc2hTZXQodHlwZW9mIGtleSA9PSAnc3RyaW5nJyA/IGRhdGEuc3RyaW5nIDogZGF0YS5oYXNoLCBrZXksIHZhbHVlKTtcbiAgfSBlbHNlIGlmIChNYXApIHtcbiAgICBkYXRhLm1hcC5zZXQoa2V5LCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgYXNzb2NTZXQoZGF0YS5tYXAsIGtleSwgdmFsdWUpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYGtleWAgYW5kIGl0cyB2YWx1ZSBmcm9tIHRoZSBhc3NvY2lhdGl2ZSBhcnJheS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byByZW1vdmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGVudHJ5IHdhcyByZW1vdmVkLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGFzc29jRGVsZXRlKGFycmF5LCBrZXkpIHtcbiAgdmFyIGluZGV4ID0gYXNzb2NJbmRleE9mKGFycmF5LCBrZXkpO1xuICBpZiAoaW5kZXggPCAwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBsYXN0SW5kZXggPSBhcnJheS5sZW5ndGggLSAxO1xuICBpZiAoaW5kZXggPT0gbGFzdEluZGV4KSB7XG4gICAgYXJyYXkucG9wKCk7XG4gIH0gZWxzZSB7XG4gICAgc3BsaWNlLmNhbGwoYXJyYXksIGluZGV4LCAxKTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBhc3NvY2lhdGl2ZSBhcnJheSB2YWx1ZSBmb3IgYGtleWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gZ2V0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGVudHJ5IHZhbHVlLlxuICovXG5mdW5jdGlvbiBhc3NvY0dldChhcnJheSwga2V5KSB7XG4gIHZhciBpbmRleCA9IGFzc29jSW5kZXhPZihhcnJheSwga2V5KTtcbiAgcmV0dXJuIGluZGV4IDwgMCA/IHVuZGVmaW5lZCA6IGFycmF5W2luZGV4XVsxXTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYW4gYXNzb2NpYXRpdmUgYXJyYXkgdmFsdWUgZm9yIGBrZXlgIGV4aXN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGFzc29jSGFzKGFycmF5LCBrZXkpIHtcbiAgcmV0dXJuIGFzc29jSW5kZXhPZihhcnJheSwga2V5KSA+IC0xO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGBrZXlgIGlzIGZvdW5kIGluIGBhcnJheWBcbiAqIG9mIGtleS12YWx1ZSBwYWlycy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAqIEBwYXJhbSB7Kn0ga2V5IFRoZSBrZXkgdG8gc2VhcmNoIGZvci5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBtYXRjaGVkIHZhbHVlLCBlbHNlIGAtMWAuXG4gKi9cbmZ1bmN0aW9uIGFzc29jSW5kZXhPZihhcnJheSwga2V5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG4gIHdoaWxlIChsZW5ndGgtLSkge1xuICAgIGlmIChlcShhcnJheVtsZW5ndGhdWzBdLCBrZXkpKSB7XG4gICAgICByZXR1cm4gbGVuZ3RoO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgYXNzb2NpYXRpdmUgYXJyYXkgYGtleWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIG1vZGlmeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gc2V0LlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxuICovXG5mdW5jdGlvbiBhc3NvY1NldChhcnJheSwga2V5LCB2YWx1ZSkge1xuICB2YXIgaW5kZXggPSBhc3NvY0luZGV4T2YoYXJyYXksIGtleSk7XG4gIGlmIChpbmRleCA8IDApIHtcbiAgICBhcnJheS5wdXNoKFtrZXksIHZhbHVlXSk7XG4gIH0gZWxzZSB7XG4gICAgYXJyYXlbaW5kZXhdWzFdID0gdmFsdWU7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBuYXRpdmUgZnVuY3Rpb24gYXQgYGtleWAgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgbWV0aG9kIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmdW5jdGlvbiBpZiBpdCdzIG5hdGl2ZSwgZWxzZSBgdW5kZWZpbmVkYC5cbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlKG9iamVjdCwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W2tleV07XG4gIHJldHVybiBpc05hdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSBmb3IgdXNlIGFzIHVuaXF1ZSBvYmplY3Qga2V5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzS2V5YWJsZSh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuIHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnYm9vbGVhbicgfHxcbiAgICAodHlwZSA9PSAnc3RyaW5nJyAmJiB2YWx1ZSAhPT0gJ19fcHJvdG9fXycpIHx8IHZhbHVlID09IG51bGw7XG59XG5cbi8qKlxuICogUGVyZm9ybXMgYSBbYFNhbWVWYWx1ZVplcm9gXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1zYW1ldmFsdWV6ZXJvKVxuICogY29tcGFyaXNvbiBiZXR3ZWVuIHR3byB2YWx1ZXMgdG8gZGV0ZXJtaW5lIGlmIHRoZXkgYXJlIGVxdWl2YWxlbnQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb21wYXJlLlxuICogQHBhcmFtIHsqfSBvdGhlciBUaGUgb3RoZXIgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3QgPSB7ICd1c2VyJzogJ2ZyZWQnIH07XG4gKiB2YXIgb3RoZXIgPSB7ICd1c2VyJzogJ2ZyZWQnIH07XG4gKlxuICogXy5lcShvYmplY3QsIG9iamVjdCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5lcShvYmplY3QsIG90aGVyKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5lcSgnYScsICdhJyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5lcSgnYScsIE9iamVjdCgnYScpKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5lcShOYU4sIE5hTik7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGVxKHZhbHVlLCBvdGhlcikge1xuICByZXR1cm4gdmFsdWUgPT09IG90aGVyIHx8ICh2YWx1ZSAhPT0gdmFsdWUgJiYgb3RoZXIgIT09IG90aGVyKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDggd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JzLCBhbmRcbiAgLy8gUGhhbnRvbUpTIDEuOSB3aGljaCByZXR1cm5zICdmdW5jdGlvbicgZm9yIGBOb2RlTGlzdGAgaW5zdGFuY2VzLlxuICB2YXIgdGFnID0gaXNPYmplY3QodmFsdWUpID8gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlIFtsYW5ndWFnZSB0eXBlXShodHRwczovL2VzNS5naXRodWIuaW8vI3g4KSBvZiBgT2JqZWN0YC5cbiAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgLy8gQXZvaWQgYSBWOCBKSVQgYnVnIGluIENocm9tZSAxOS0yMC5cbiAgLy8gU2VlIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxIGZvciBtb3JlIGRldGFpbHMuXG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gISF2YWx1ZSAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNOYXRpdmUoQXJyYXkucHJvdG90eXBlLnB1c2gpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNOYXRpdmUoXyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc05hdGl2ZSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICByZXR1cm4gcmVJc05hdGl2ZS50ZXN0KGZ1bmNUb1N0cmluZy5jYWxsKHZhbHVlKSk7XG4gIH1cbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiZcbiAgICAoaXNIb3N0T2JqZWN0KHZhbHVlKSA/IHJlSXNOYXRpdmUgOiByZUlzSG9zdEN0b3IpLnRlc3QodmFsdWUpO1xufVxuXG4vLyBBdm9pZCBpbmhlcml0aW5nIGZyb20gYE9iamVjdC5wcm90b3R5cGVgIHdoZW4gcG9zc2libGUuXG5IYXNoLnByb3RvdHlwZSA9IG5hdGl2ZUNyZWF0ZSA/IG5hdGl2ZUNyZWF0ZShudWxsKSA6IG9iamVjdFByb3RvO1xuXG4vLyBBZGQgZnVuY3Rpb25zIHRvIHRoZSBgTWFwQ2FjaGVgLlxuTWFwQ2FjaGUucHJvdG90eXBlLmNsZWFyID0gbWFwQ2xlYXI7XG5NYXBDYWNoZS5wcm90b3R5cGVbJ2RlbGV0ZSddID0gbWFwRGVsZXRlO1xuTWFwQ2FjaGUucHJvdG90eXBlLmdldCA9IG1hcEdldDtcbk1hcENhY2hlLnByb3RvdHlwZS5oYXMgPSBtYXBIYXM7XG5NYXBDYWNoZS5wcm90b3R5cGUuc2V0ID0gbWFwU2V0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcENhY2hlO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLm9taXQvfi9sb2Rhc2guX3NldGNhY2hlL34vbG9kYXNoLl9tYXBjYWNoZS9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDEyXG4gKiogbW9kdWxlIGNodW5rcyA9IDAgMVxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uaW5jbHVkZXNgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvclxuICogc3BlY2lmeWluZyBhbiBpbmRleCB0byBzZWFyY2ggZnJvbS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAqIEBwYXJhbSB7Kn0gdGFyZ2V0IFRoZSB2YWx1ZSB0byBzZWFyY2ggZm9yLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB0YXJnZXRgIGlzIGZvdW5kLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5SW5jbHVkZXMoYXJyYXksIHZhbHVlKSB7XG4gIHJldHVybiAhIWFycmF5Lmxlbmd0aCAmJiBiYXNlSW5kZXhPZihhcnJheSwgdmFsdWUsIDApID4gLTE7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaW5kZXhPZmAgd2l0aG91dCBgZnJvbUluZGV4YCBib3VuZHMgY2hlY2tzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmcm9tSW5kZXggVGhlIGluZGV4IHRvIHNlYXJjaCBmcm9tLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoZWQgdmFsdWUsIGVsc2UgYC0xYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUluZGV4T2YoYXJyYXksIHZhbHVlLCBmcm9tSW5kZXgpIHtcbiAgaWYgKHZhbHVlICE9PSB2YWx1ZSkge1xuICAgIHJldHVybiBpbmRleE9mTmFOKGFycmF5LCBmcm9tSW5kZXgpO1xuICB9XG4gIHZhciBpbmRleCA9IGZyb21JbmRleCAtIDEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBpZiAoYXJyYXlbaW5kZXhdID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgaW5kZXggYXQgd2hpY2ggdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYE5hTmAgaXMgZm91bmQgaW4gYGFycmF5YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmcm9tSW5kZXggVGhlIGluZGV4IHRvIHNlYXJjaCBmcm9tLlxuICogQHBhcmFtIHtib29sZWFufSBbZnJvbVJpZ2h0XSBTcGVjaWZ5IGl0ZXJhdGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCBgTmFOYCwgZWxzZSBgLTFgLlxuICovXG5mdW5jdGlvbiBpbmRleE9mTmFOKGFycmF5LCBmcm9tSW5kZXgsIGZyb21SaWdodCkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuICAgICAgaW5kZXggPSBmcm9tSW5kZXggKyAoZnJvbVJpZ2h0ID8gMCA6IC0xKTtcblxuICB3aGlsZSAoKGZyb21SaWdodCA/IGluZGV4LS0gOiArK2luZGV4IDwgbGVuZ3RoKSkge1xuICAgIHZhciBvdGhlciA9IGFycmF5W2luZGV4XTtcbiAgICBpZiAob3RoZXIgIT09IG90aGVyKSB7XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUluY2x1ZGVzO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLm9taXQvfi9sb2Rhc2guX2FycmF5aW5jbHVkZXMvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwIDFcbiAqKi8iLCIvKipcbiAqIGxvZGFzaCA0LjAuMCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLmluY2x1ZGVzV2l0aGAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yXG4gKiBzcGVjaWZ5aW5nIGFuIGluZGV4IHRvIHNlYXJjaCBmcm9tLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICogQHBhcmFtIHsqfSB0YXJnZXQgVGhlIHZhbHVlIHRvIHNlYXJjaCBmb3IuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wYXJhdG9yIFRoZSBjb21wYXJhdG9yIGludm9rZWQgcGVyIGVsZW1lbnQuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHRhcmdldGAgaXMgZm91bmQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYXJyYXlJbmNsdWRlc1dpdGgoYXJyYXksIHZhbHVlLCBjb21wYXJhdG9yKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgaWYgKGNvbXBhcmF0b3IodmFsdWUsIGFycmF5W2luZGV4XSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlJbmNsdWRlc1dpdGg7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fYXJyYXlpbmNsdWRlc3dpdGgvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwIDFcbiAqKi8iLCIvKipcbiAqIGxvZGFzaCAzLjAuMCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZGVybiBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTUgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNy4wIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxNSBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5tYXBgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBvciBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBtYXBwZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGFycmF5TWFwKGFycmF5LCBpdGVyYXRlZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICByZXN1bHRbaW5kZXhdID0gaXRlcmF0ZWUoYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlNYXA7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9sb2Rhc2gub21pdC9+L2xvZGFzaC5fYXJyYXltYXAvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxNVxuICoqIG1vZHVsZSBjaHVua3MgPSAwIDFcbiAqKi8iLCIvKipcbiAqIGxvZGFzaCA0LjAuMCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJnc1RhZyA9ICdbb2JqZWN0IEFyZ3VtZW50c10nLFxuICAgIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXSc7XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgZWxlbWVudHMgb2YgYHZhbHVlc2AgdG8gYGFycmF5YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIG1vZGlmeS5cbiAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlcyBUaGUgdmFsdWVzIHRvIGFwcGVuZC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBgYXJyYXlgLlxuICovXG5mdW5jdGlvbiBhcnJheVB1c2goYXJyYXksIHZhbHVlcykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHZhbHVlcy5sZW5ndGgsXG4gICAgICBvZmZzZXQgPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBhcnJheVtvZmZzZXQgKyBpbmRleF0gPSB2YWx1ZXNbaW5kZXhdO1xuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gZ2xvYmFsLk9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIHByb3BlcnR5SXNFbnVtZXJhYmxlID0gb2JqZWN0UHJvdG8ucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZmxhdHRlbmAgd2l0aCBzdXBwb3J0IGZvciByZXN0cmljdGluZyBmbGF0dGVuaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gZmxhdHRlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRGVlcF0gU3BlY2lmeSBhIGRlZXAgZmxhdHRlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU3RyaWN0XSBSZXN0cmljdCBmbGF0dGVuaW5nIHRvIGFycmF5cy1saWtlIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbcmVzdWx0PVtdXSBUaGUgaW5pdGlhbCByZXN1bHQgdmFsdWUuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBmbGF0dGVuZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGJhc2VGbGF0dGVuKGFycmF5LCBpc0RlZXAsIGlzU3RyaWN0LCByZXN1bHQpIHtcbiAgcmVzdWx0IHx8IChyZXN1bHQgPSBbXSk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIgdmFsdWUgPSBhcnJheVtpbmRleF07XG4gICAgaWYgKGlzQXJyYXlMaWtlT2JqZWN0KHZhbHVlKSAmJlxuICAgICAgICAoaXNTdHJpY3QgfHwgaXNBcnJheSh2YWx1ZSkgfHwgaXNBcmd1bWVudHModmFsdWUpKSkge1xuICAgICAgaWYgKGlzRGVlcCkge1xuICAgICAgICAvLyBSZWN1cnNpdmVseSBmbGF0dGVuIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgICAgICBiYXNlRmxhdHRlbih2YWx1ZSwgaXNEZWVwLCBpc1N0cmljdCwgcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFycmF5UHVzaChyZXN1bHQsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFpc1N0cmljdCkge1xuICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ucHJvcGVydHlgIHdpdGhvdXQgc3VwcG9ydCBmb3IgZGVlcCBwYXRocy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZVByb3BlcnR5KGtleSkge1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W2tleV07XG4gIH07XG59XG5cbi8qKlxuICogR2V0cyB0aGUgXCJsZW5ndGhcIiBwcm9wZXJ0eSB2YWx1ZSBvZiBgb2JqZWN0YC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIGF2b2lkIGEgW0pJVCBidWddKGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNDI3OTIpXG4gKiB0aGF0IGFmZmVjdHMgU2FmYXJpIG9uIGF0IGxlYXN0IGlPUyA4LjEtOC4zIEFSTTY0LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgXCJsZW5ndGhcIiB2YWx1ZS5cbiAqL1xudmFyIGdldExlbmd0aCA9IGJhc2VQcm9wZXJ0eSgnbGVuZ3RoJyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGFuIGBhcmd1bWVudHNgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuICAvLyBTYWZhcmkgOC4xIGluY29ycmVjdGx5IG1ha2VzIGBhcmd1bWVudHMuY2FsbGVlYCBlbnVtZXJhYmxlIGluIHN0cmljdCBtb2RlLlxuICByZXR1cm4gaXNBcnJheUxpa2VPYmplY3QodmFsdWUpICYmIGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdjYWxsZWUnKSAmJlxuICAgICghcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpIHx8IG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpID09IGFyZ3NUYWcpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYEFycmF5YCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXkoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheSgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UuIEEgdmFsdWUgaXMgY29uc2lkZXJlZCBhcnJheS1saWtlIGlmIGl0J3NcbiAqIG5vdCBhIGZ1bmN0aW9uIGFuZCBoYXMgYSBgdmFsdWUubGVuZ3RoYCB0aGF0J3MgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gb3JcbiAqIGVxdWFsIHRvIGAwYCBhbmQgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoJ2FiYycpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmXG4gICAgISh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJiBpc0Z1bmN0aW9uKHZhbHVlKSkgJiYgaXNMZW5ndGgoZ2V0TGVuZ3RoKHZhbHVlKSk7XG59XG5cbi8qKlxuICogVGhpcyBtZXRob2QgaXMgbGlrZSBgXy5pc0FycmF5TGlrZWAgZXhjZXB0IHRoYXQgaXQgYWxzbyBjaGVja3MgaWYgYHZhbHVlYFxuICogaXMgYW4gb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXktbGlrZSBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5TGlrZU9iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2VPYmplY3QoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZU9iamVjdCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheUxpa2VPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzQXJyYXlMaWtlKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDggd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JzLCBhbmRcbiAgLy8gUGhhbnRvbUpTIDEuOSB3aGljaCByZXR1cm5zICdmdW5jdGlvbicgZm9yIGBOb2RlTGlzdGAgaW5zdGFuY2VzLlxuICB2YXIgdGFnID0gaXNPYmplY3QodmFsdWUpID8gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyBsb29zZWx5IGJhc2VkIG9uIFtgVG9MZW5ndGhgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy10b2xlbmd0aCkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgbGVuZ3RoLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNMZW5ndGgoMyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0xlbmd0aChOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0xlbmd0aChJbmZpbml0eSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoJzMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTGVuZ3RoKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiYgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBbbGFuZ3VhZ2UgdHlwZV0oaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4OCkgb2YgYE9iamVjdGAuXG4gKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIEF2b2lkIGEgVjggSklUIGJ1ZyBpbiBDaHJvbWUgMTktMjAuXG4gIC8vIFNlZSBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MSBmb3IgbW9yZSBkZXRhaWxzLlxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGbGF0dGVuO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLm9taXQvfi9sb2Rhc2guX2Jhc2VmbGF0dGVuL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMCAxXG4gKiovIiwiLyoqXG4gKiBsb2Rhc2ggNC4wLjAgKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTYgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxNiBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKiogVXNlZCB0byBzdGFuZC1pbiBmb3IgYHVuZGVmaW5lZGAgaGFzaCB2YWx1ZXMuICovXG52YXIgSEFTSF9VTkRFRklORUQgPSAnX19sb2Rhc2hfaGFzaF91bmRlZmluZWRfXyc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgaW4gYGNhY2hlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IGNhY2hlIFRoZSBzZXQgY2FjaGUgdG8gc2VhcmNoLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgZm91bmQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gY2FjaGVIYXMoY2FjaGUsIHZhbHVlKSB7XG4gIHZhciBtYXAgPSBjYWNoZS5fX2RhdGFfXztcbiAgaWYgKGlzS2V5YWJsZSh2YWx1ZSkpIHtcbiAgICB2YXIgZGF0YSA9IG1hcC5fX2RhdGFfXyxcbiAgICAgICAgaGFzaCA9IHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyA/IGRhdGEuc3RyaW5nIDogZGF0YS5oYXNoO1xuXG4gICAgcmV0dXJuIGhhc2hbdmFsdWVdID09PSBIQVNIX1VOREVGSU5FRDtcbiAgfVxuICByZXR1cm4gbWFwLmhhcyh2YWx1ZSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgc3VpdGFibGUgZm9yIHVzZSBhcyB1bmlxdWUgb2JqZWN0IGtleS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0tleWFibGUodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiB0eXBlID09ICdudW1iZXInIHx8IHR5cGUgPT0gJ2Jvb2xlYW4nIHx8XG4gICAgKHR5cGUgPT0gJ3N0cmluZycgJiYgdmFsdWUgIT09ICdfX3Byb3RvX18nKSB8fCB2YWx1ZSA9PSBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNhY2hlSGFzO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLm9taXQvfi9sb2Rhc2guX2NhY2hlaGFzL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMCAxXG4gKiovIiwiLyoqXG4gKiBsb2Rhc2ggNC4wLjAgKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTYgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxNiBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBNQVhfU0FGRV9JTlRFR0VSID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFyZ3NUYWcgPSAnW29iamVjdCBBcmd1bWVudHNdJyxcbiAgICBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nLFxuICAgIHN0cmluZ1RhZyA9ICdbb2JqZWN0IFN0cmluZ10nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgdW5zaWduZWQgaW50ZWdlciB2YWx1ZXMuICovXG52YXIgcmVJc1VpbnQgPSAvXig/OjB8WzEtOV1cXGQqKSQvO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnRpbWVzYCB3aXRob3V0IHN1cHBvcnQgZm9yIGl0ZXJhdGVlIHNob3J0aGFuZHNcbiAqIG9yIG1heCBhcnJheSBsZW5ndGggY2hlY2tzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gbiBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIGludm9rZSBgaXRlcmF0ZWVgLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcmVzdWx0cy5cbiAqL1xuZnVuY3Rpb24gYmFzZVRpbWVzKG4sIGl0ZXJhdGVlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgcmVzdWx0ID0gQXJyYXkobik7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBuKSB7XG4gICAgcmVzdWx0W2luZGV4XSA9IGl0ZXJhdGVlKGluZGV4KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBpbmRleC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD1NQVhfU0FGRV9JTlRFR0VSXSBUaGUgdXBwZXIgYm91bmRzIG9mIGEgdmFsaWQgaW5kZXguXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGluZGV4LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzSW5kZXgodmFsdWUsIGxlbmd0aCkge1xuICB2YWx1ZSA9ICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgfHwgcmVJc1VpbnQudGVzdCh2YWx1ZSkpID8gK3ZhbHVlIDogLTE7XG4gIGxlbmd0aCA9IGxlbmd0aCA9PSBudWxsID8gTUFYX1NBRkVfSU5URUdFUiA6IGxlbmd0aDtcbiAgcmV0dXJuIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPCBsZW5ndGg7XG59XG5cbi8qKlxuICogQ29udmVydHMgYGl0ZXJhdG9yYCB0byBhbiBhcnJheS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IGl0ZXJhdG9yIFRoZSBpdGVyYXRvciB0byBjb252ZXJ0LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGl0ZXJhdG9yVG9BcnJheShpdGVyYXRvcikge1xuICB2YXIgZGF0YSxcbiAgICAgIHJlc3VsdCA9IFtdO1xuXG4gIHdoaWxlICghKGRhdGEgPSBpdGVyYXRvci5uZXh0KCkpLmRvbmUpIHtcbiAgICByZXN1bHQucHVzaChkYXRhLnZhbHVlKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBnbG9iYWwuT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgUmVmbGVjdCA9IGdsb2JhbC5SZWZsZWN0LFxuICAgIGVudW1lcmF0ZSA9IFJlZmxlY3QgPyBSZWZsZWN0LmVudW1lcmF0ZSA6IHVuZGVmaW5lZCxcbiAgICBwcm9wZXJ0eUlzRW51bWVyYWJsZSA9IG9iamVjdFByb3RvLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmtleXNJbmAgd2hpY2ggZG9lc24ndCBza2lwIHRoZSBjb25zdHJ1Y3RvclxuICogcHJvcGVydHkgb2YgcHJvdG90eXBlcyBvciB0cmVhdCBzcGFyc2UgYXJyYXlzIGFzIGRlbnNlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICovXG5mdW5jdGlvbiBiYXNlS2V5c0luKG9iamVjdCkge1xuICBvYmplY3QgPSBvYmplY3QgPT0gbnVsbCA/IG9iamVjdCA6IE9iamVjdChvYmplY3QpO1xuXG4gIHZhciByZXN1bHQgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgIHJlc3VsdC5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gRmFsbGJhY2sgZm9yIElFIDwgOSB3aXRoIGVzNi1zaGltLlxuaWYgKGVudW1lcmF0ZSAmJiAhcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbCh7ICd2YWx1ZU9mJzogMSB9LCAndmFsdWVPZicpKSB7XG4gIGJhc2VLZXlzSW4gPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gaXRlcmF0b3JUb0FycmF5KGVudW1lcmF0ZShvYmplY3QpKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5wcm9wZXJ0eWAgd2l0aG91dCBzdXBwb3J0IGZvciBkZWVwIHBhdGhzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlUHJvcGVydHkoa2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgfTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBcImxlbmd0aFwiIHByb3BlcnR5IHZhbHVlIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gYXZvaWQgYSBbSklUIGJ1Z10oaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE0Mjc5MilcbiAqIHRoYXQgYWZmZWN0cyBTYWZhcmkgb24gYXQgbGVhc3QgaU9TIDguMS04LjMgQVJNNjQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBcImxlbmd0aFwiIHZhbHVlLlxuICovXG52YXIgZ2V0TGVuZ3RoID0gYmFzZVByb3BlcnR5KCdsZW5ndGgnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIGluZGV4IGtleXMgZm9yIGBvYmplY3RgIHZhbHVlcyBvZiBhcnJheXMsXG4gKiBgYXJndW1lbnRzYCBvYmplY3RzLCBhbmQgc3RyaW5ncywgb3RoZXJ3aXNlIGBudWxsYCBpcyByZXR1cm5lZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fG51bGx9IFJldHVybnMgaW5kZXgga2V5cywgZWxzZSBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGluZGV4S2V5cyhvYmplY3QpIHtcbiAgdmFyIGxlbmd0aCA9IG9iamVjdCA/IG9iamVjdC5sZW5ndGggOiB1bmRlZmluZWQ7XG4gIHJldHVybiAoaXNMZW5ndGgobGVuZ3RoKSAmJiAoaXNBcnJheShvYmplY3QpIHx8IGlzU3RyaW5nKG9iamVjdCkgfHwgaXNBcmd1bWVudHMob2JqZWN0KSkpXG4gICAgPyBiYXNlVGltZXMobGVuZ3RoLCBTdHJpbmcpXG4gICAgOiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGxpa2VseSBhIHByb3RvdHlwZSBvYmplY3QuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwcm90b3R5cGUsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNQcm90b3R5cGUodmFsdWUpIHtcbiAgdmFyIEN0b3IgPSB2YWx1ZSAmJiB2YWx1ZS5jb25zdHJ1Y3RvcixcbiAgICAgIHByb3RvID0gKHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgQ3Rvci5wcm90b3R5cGUpIHx8IG9iamVjdFByb3RvO1xuXG4gIHJldHVybiB2YWx1ZSA9PT0gcHJvdG87XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGFuIGBhcmd1bWVudHNgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuICAvLyBTYWZhcmkgOC4xIGluY29ycmVjdGx5IG1ha2VzIGBhcmd1bWVudHMuY2FsbGVlYCBlbnVtZXJhYmxlIGluIHN0cmljdCBtb2RlLlxuICByZXR1cm4gaXNBcnJheUxpa2VPYmplY3QodmFsdWUpICYmIGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdjYWxsZWUnKSAmJlxuICAgICghcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpIHx8IG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpID09IGFyZ3NUYWcpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYEFycmF5YCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXkoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheSgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UuIEEgdmFsdWUgaXMgY29uc2lkZXJlZCBhcnJheS1saWtlIGlmIGl0J3NcbiAqIG5vdCBhIGZ1bmN0aW9uIGFuZCBoYXMgYSBgdmFsdWUubGVuZ3RoYCB0aGF0J3MgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gb3JcbiAqIGVxdWFsIHRvIGAwYCBhbmQgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIEZ1bmN0aW9uXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoJ2FiYycpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmXG4gICAgISh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJiBpc0Z1bmN0aW9uKHZhbHVlKSkgJiYgaXNMZW5ndGgoZ2V0TGVuZ3RoKHZhbHVlKSk7XG59XG5cbi8qKlxuICogVGhpcyBtZXRob2QgaXMgbGlrZSBgXy5pc0FycmF5TGlrZWAgZXhjZXB0IHRoYXQgaXQgYWxzbyBjaGVja3MgaWYgYHZhbHVlYFxuICogaXMgYW4gb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXktbGlrZSBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5TGlrZU9iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2VPYmplY3QoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5TGlrZU9iamVjdCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheUxpa2VPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzQXJyYXlMaWtlKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDggd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JzLCBhbmRcbiAgLy8gUGhhbnRvbUpTIDEuOSB3aGljaCByZXR1cm5zICdmdW5jdGlvbicgZm9yIGBOb2RlTGlzdGAgaW5zdGFuY2VzLlxuICB2YXIgdGFnID0gaXNPYmplY3QodmFsdWUpID8gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyBsb29zZWx5IGJhc2VkIG9uIFtgVG9MZW5ndGhgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy10b2xlbmd0aCkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgbGVuZ3RoLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNMZW5ndGgoMyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0xlbmd0aChOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0xlbmd0aChJbmZpbml0eSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoJzMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTGVuZ3RoKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiYgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBbbGFuZ3VhZ2UgdHlwZV0oaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4OCkgb2YgYE9iamVjdGAuXG4gKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIEF2b2lkIGEgVjggSklUIGJ1ZyBpbiBDaHJvbWUgMTktMjAuXG4gIC8vIFNlZSBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MSBmb3IgbW9yZSBkZXRhaWxzLlxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3RyaW5nYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzU3RyaW5nKCdhYmMnKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3RyaW5nKDEpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNTdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fFxuICAgICghaXNBcnJheSh2YWx1ZSkgJiYgaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzdHJpbmdUYWcpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlIG93biBhbmQgaW5oZXJpdGVkIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIE5vbi1vYmplY3QgdmFsdWVzIGFyZSBjb2VyY2VkIHRvIG9iamVjdHMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5hID0gMTtcbiAqICAgdGhpcy5iID0gMjtcbiAqIH1cbiAqXG4gKiBGb28ucHJvdG90eXBlLmMgPSAzO1xuICpcbiAqIF8ua2V5c0luKG5ldyBGb28pO1xuICogLy8gPT4gWydhJywgJ2InLCAnYyddIChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gKi9cbmZ1bmN0aW9uIGtleXNJbihvYmplY3QpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBpc1Byb3RvID0gaXNQcm90b3R5cGUob2JqZWN0KSxcbiAgICAgIHByb3BzID0gYmFzZUtleXNJbihvYmplY3QpLFxuICAgICAgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGgsXG4gICAgICBpbmRleGVzID0gaW5kZXhLZXlzKG9iamVjdCksXG4gICAgICBza2lwSW5kZXhlcyA9ICEhaW5kZXhlcyxcbiAgICAgIHJlc3VsdCA9IGluZGV4ZXMgfHwgW10sXG4gICAgICBsZW5ndGggPSByZXN1bHQubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgcHJvcHNMZW5ndGgpIHtcbiAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgIGlmICghKHNraXBJbmRleGVzICYmIChrZXkgPT0gJ2xlbmd0aCcgfHwgaXNJbmRleChrZXksIGxlbmd0aCkpKSAmJlxuICAgICAgICAhKGtleSA9PSAnY29uc3RydWN0b3InICYmIChpc1Byb3RvIHx8ICFoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSkpKSB7XG4gICAgICByZXN1bHQucHVzaChrZXkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGtleXNJbjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5vbWl0L34vbG9kYXNoLmtleXNpbi9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDE4XG4gKiogbW9kdWxlIGNodW5rcyA9IDAgMVxuICoqLyIsIi8qKlxuICogbG9kYXNoIDQuMC4wIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTYgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIElORklOSVRZID0gMSAvIDAsXG4gICAgTUFYX0lOVEVHRVIgPSAxLjc5NzY5MzEzNDg2MjMxNTdlKzMwOCxcbiAgICBOQU4gPSAwIC8gMDtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXSc7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGBnbG9iYWxgLiAqL1xudmFyIGZyZWVQYXJzZUludCA9IHBhcnNlSW50O1xuXG4vKipcbiAqIEEgZmFzdGVyIGFsdGVybmF0aXZlIHRvIGBGdW5jdGlvbiNhcHBseWAsIHRoaXMgZnVuY3Rpb24gaW52b2tlcyBgZnVuY2BcbiAqIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIGB0aGlzQXJnYCBhbmQgdGhlIGFyZ3VtZW50cyBvZiBgYXJnc2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGludm9rZS5cbiAqIEBwYXJhbSB7Kn0gdGhpc0FyZyBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGZ1bmNgLlxuICogQHBhcmFtIHsuLi4qfSBbYXJnc10gVGhlIGFyZ3VtZW50cyB0byBpbnZva2UgYGZ1bmNgIHdpdGguXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgcmVzdWx0IG9mIGBmdW5jYC5cbiAqL1xuZnVuY3Rpb24gYXBwbHkoZnVuYywgdGhpc0FyZywgYXJncykge1xuICB2YXIgbGVuZ3RoID0gYXJncyA/IGFyZ3MubGVuZ3RoIDogMDtcbiAgc3dpdGNoIChsZW5ndGgpIHtcbiAgICBjYXNlIDA6IHJldHVybiBmdW5jLmNhbGwodGhpc0FyZyk7XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGFyZ3NbMF0pO1xuICAgIGNhc2UgMjogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCBhcmdzWzBdLCBhcmdzWzFdKTtcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSk7XG4gIH1cbiAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG59XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IGdsb2JhbC5PYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXg7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBgZnVuY2Agd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlXG4gKiBjcmVhdGVkIGZ1bmN0aW9uIGFuZCBhcmd1bWVudHMgZnJvbSBgc3RhcnRgIGFuZCBiZXlvbmQgcHJvdmlkZWQgYXMgYW4gYXJyYXkuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGlzIGJhc2VkIG9uIHRoZSBbcmVzdCBwYXJhbWV0ZXJdKGh0dHBzOi8vbWRuLmlvL3Jlc3RfcGFyYW1ldGVycykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYXBwbHkgYSByZXN0IHBhcmFtZXRlciB0by5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnQ9ZnVuYy5sZW5ndGgtMV0gVGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoZSByZXN0IHBhcmFtZXRlci5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgc2F5ID0gXy5yZXN0KGZ1bmN0aW9uKHdoYXQsIG5hbWVzKSB7XG4gKiAgIHJldHVybiB3aGF0ICsgJyAnICsgXy5pbml0aWFsKG5hbWVzKS5qb2luKCcsICcpICtcbiAqICAgICAoXy5zaXplKG5hbWVzKSA+IDEgPyAnLCAmICcgOiAnJykgKyBfLmxhc3QobmFtZXMpO1xuICogfSk7XG4gKlxuICogc2F5KCdoZWxsbycsICdmcmVkJywgJ2Jhcm5leScsICdwZWJibGVzJyk7XG4gKiAvLyA9PiAnaGVsbG8gZnJlZCwgYmFybmV5LCAmIHBlYmJsZXMnXG4gKi9cbmZ1bmN0aW9uIHJlc3QoZnVuYywgc3RhcnQpIHtcbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgc3RhcnQgPSBuYXRpdmVNYXgoc3RhcnQgPT09IHVuZGVmaW5lZCA/IChmdW5jLmxlbmd0aCAtIDEpIDogdG9JbnRlZ2VyKHN0YXJ0KSwgMCk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gbmF0aXZlTWF4KGFyZ3MubGVuZ3RoIC0gc3RhcnQsIDApLFxuICAgICAgICBhcnJheSA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgYXJyYXlbaW5kZXhdID0gYXJnc1tzdGFydCArIGluZGV4XTtcbiAgICB9XG4gICAgc3dpdGNoIChzdGFydCkge1xuICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFycmF5KTtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBhcmdzWzBdLCBhcnJheSk7XG4gICAgICBjYXNlIDI6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJnc1swXSwgYXJnc1sxXSwgYXJyYXkpO1xuICAgIH1cbiAgICB2YXIgb3RoZXJBcmdzID0gQXJyYXkoc3RhcnQgKyAxKTtcbiAgICBpbmRleCA9IC0xO1xuICAgIHdoaWxlICgrK2luZGV4IDwgc3RhcnQpIHtcbiAgICAgIG90aGVyQXJnc1tpbmRleF0gPSBhcmdzW2luZGV4XTtcbiAgICB9XG4gICAgb3RoZXJBcmdzW3N0YXJ0XSA9IGFycmF5O1xuICAgIHJldHVybiBhcHBseShmdW5jLCB0aGlzLCBvdGhlckFyZ3MpO1xuICB9O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOCB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvcnMsIGFuZFxuICAvLyBQaGFudG9tSlMgMS45IHdoaWNoIHJldHVybnMgJ2Z1bmN0aW9uJyBmb3IgYE5vZGVMaXN0YCBpbnN0YW5jZXMuXG4gIHZhciB0YWcgPSBpc09iamVjdCh2YWx1ZSkgPyBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICByZXR1cm4gdGFnID09IGZ1bmNUYWcgfHwgdGFnID09IGdlblRhZztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgW2xhbmd1YWdlIHR5cGVdKGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDgpIG9mIGBPYmplY3RgLlxuICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxuICAvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTEgZm9yIG1vcmUgZGV0YWlscy5cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhbiBpbnRlZ2VyLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIGxvb3NlbHkgYmFzZWQgb24gW2BUb0ludGVnZXJgXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9pbnRlZ2VyKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgaW50ZWdlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b0ludGVnZXIoMyk7XG4gKiAvLyA9PiAzXG4gKlxuICogXy50b0ludGVnZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiAwXG4gKlxuICogXy50b0ludGVnZXIoSW5maW5pdHkpO1xuICogLy8gPT4gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDhcbiAqXG4gKiBfLnRvSW50ZWdlcignMycpO1xuICogLy8gPT4gM1xuICovXG5mdW5jdGlvbiB0b0ludGVnZXIodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogMDtcbiAgfVxuICB2YWx1ZSA9IHRvTnVtYmVyKHZhbHVlKTtcbiAgaWYgKHZhbHVlID09PSBJTkZJTklUWSB8fCB2YWx1ZSA9PT0gLUlORklOSVRZKSB7XG4gICAgdmFyIHNpZ24gPSAodmFsdWUgPCAwID8gLTEgOiAxKTtcbiAgICByZXR1cm4gc2lnbiAqIE1BWF9JTlRFR0VSO1xuICB9XG4gIHZhciByZW1haW5kZXIgPSB2YWx1ZSAlIDE7XG4gIHJldHVybiB2YWx1ZSA9PT0gdmFsdWUgPyAocmVtYWluZGVyID8gdmFsdWUgLSByZW1haW5kZXIgOiB2YWx1ZSkgOiAwO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBudW1iZXIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMpO1xuICogLy8gPT4gM1xuICpcbiAqIF8udG9OdW1iZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvTnVtYmVyKEluZmluaXR5KTtcbiAqIC8vID0+IEluZmluaXR5XG4gKlxuICogXy50b051bWJlcignMycpO1xuICogLy8gPT4gM1xuICovXG5mdW5jdGlvbiB0b051bWJlcih2YWx1ZSkge1xuICBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdmFyIG90aGVyID0gaXNGdW5jdGlvbih2YWx1ZS52YWx1ZU9mKSA/IHZhbHVlLnZhbHVlT2YoKSA6IHZhbHVlO1xuICAgIHZhbHVlID0gaXNPYmplY3Qob3RoZXIpID8gKG90aGVyICsgJycpIDogb3RoZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogK3ZhbHVlO1xuICB9XG4gIHZhbHVlID0gdmFsdWUucmVwbGFjZShyZVRyaW0sICcnKTtcbiAgdmFyIGlzQmluYXJ5ID0gcmVJc0JpbmFyeS50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIChpc0JpbmFyeSB8fCByZUlzT2N0YWwudGVzdCh2YWx1ZSkpXG4gICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgOiAocmVJc0JhZEhleC50ZXN0KHZhbHVlKSA/IE5BTiA6ICt2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVzdDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5vbWl0L34vbG9kYXNoLnJlc3QvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxOVxuICoqIG1vZHVsZSBjaHVua3MgPSAwIDFcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9