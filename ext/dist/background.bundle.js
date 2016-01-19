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
	
	var _dexie = __webpack_require__(1);
	
	var _dexie2 = _interopRequireDefault(_dexie);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/* ==========================================
	 * indexedDBのsetup
	 * ===========================================*/
	
	/* -----------------------------------
	  Schema
	* ------------------------------------
	 id: 1 // auto increment, index
	 url: '', // index
	 contents: [
	    {
	      contentId: 1, // auto increment, index
	      targetElm: 'element',
	      contentText: 'text or markdown'
	    },
	 ]
	* */
	
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
	
	// TODO: Schemaを変更
	var db = new _dexie2.default('SashikomiDB');
	db.version(1).stores({
	  memos: "++id, url"
	});
	
	db.open();
	
	/* =============================================
	 * Message Passing(onMessage)
	 * ==============================================
	
	chrome.runtime.onMessage.addListener(
	  function (request, sender, sendResponse) {
	
	    console.log(request);
	    console.log(request.url);
	
	    sendResponse({url: request.url});
	
	    // 実際はtypeを受け取って、以下のような感じでswitch分岐
	    switch (request.type) {
	      case "hello":
	        hello(request.text, sendResponse);
	        break;
	      case "night":
	        night(request.text, sendResponse);
	        break;
	      default:
	        console.log("Error: Unkown request.");
	        console.log(request);
	    }
	  }
	);
	
	
	function hello(name, callback) {
	  callback("Hello, " + name);
	}
	
	function night(name, callback) {
	  callback("Good night, " + name);
	}
	 * */
	// TODO: inject.jsからのMessageをlistenして、DBのCRUD処理
	
	/* =============================================
	 * Message Passing(send)
	 * ==============================================
	
	 * content_scripsへのmessage_sendはchrome.tabs.sendMessageでtabIdを
	 指定して送信する必要がある。以下の例は、tab eventと組み合わせて、
	 tabIdを取得し、sendMessageしている。
	
	  * chrome.tabs.sendMessageでsendしているが、
	 content_scrips側では、chrome.runtime.onMessageに発火する
	
	 chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	  chrome.tabs.sendMessage(tabId, tab.url,  function(res) {
	    if (res) {
	      console.log(res)
	    }
	  });
	});
	
	 1. ContextMenuから新規Component追加の命令をContentScriptsに司令
	
	* */
	
	/* =============================================
	 * browserAction
	 * ==============================================*/
	
	/* #onClick
	* TODO: popup.htmlを開く
	* 挿入できなかったcontent(error)をpopup.htmlで表示
	* errorがなければなにも表示しない
	* -------------------------------*/
	//chrome.browserAction.onClicked.addListener(function () {
	//
	//});
	
	/* #setBadgeText
	* TODO: 挿入errorがあればBadgeTextで通知
	* chrome.browserAction.setBadgeText(object details)
	* https://developer.chrome.com/extensions/browserAction
	*/

/***/ },
/* 1 */
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
	
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).setImmediate))

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(3).nextTick;
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
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).setImmediate, __webpack_require__(2).clearImmediate))

/***/ },
/* 3 */
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


/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYWRjMzJiNGM0ZWU0YzUwY2U3MjkiLCJ3ZWJwYWNrOi8vLy4vc3JjL2JnL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vZGV4aWUvZGlzdC9sYXRlc3QvRGV4aWUuanMiLCJ3ZWJwYWNrOi8vLyh3ZWJwYWNrKS9+L25vZGUtbGlicy1icm93c2VyL34vdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsIndlYnBhY2s6Ly8vKHdlYnBhY2spL34vbm9kZS1saWJzLWJyb3dzZXIvfi9wcm9jZXNzL2Jyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNMQSxLQUFJLEVBQUUsR0FBRyxvQkFBVSxhQUFhLENBQUMsQ0FBQztBQUNsQyxHQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNuQixRQUFLLEVBQUUsV0FBVztFQUNuQixDQUFDLENBQUM7O0FBRUgsR0FBRSxDQUFDLElBQUksRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7bUNDdENUO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0Esb0VBQW1FO0FBQ25FO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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NEIsVUFBVSIsImZpbGUiOiJiYWNrZ3JvdW5kLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgYWRjMzJiNGM0ZWU0YzUwY2U3MjlcbiAqKi8iLCJpbXBvcnQgRGV4aWUgZnJvbSAnZGV4aWUnXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogaW5kZXhlZERC44Guc2V0dXBcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBTY2hlbWFcbiogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gaWQ6IDEgLy8gYXV0byBpbmNyZW1lbnQsIGluZGV4XG4gdXJsOiAnJywgLy8gaW5kZXhcbiBjb250ZW50czogW1xuICAgIHtcbiAgICAgIGNvbnRlbnRJZDogMSwgLy8gYXV0byBpbmNyZW1lbnQsIGluZGV4XG4gICAgICB0YXJnZXRFbG06ICdlbGVtZW50JyxcbiAgICAgIGNvbnRlbnRUZXh0OiAndGV4dCBvciBtYXJrZG93bidcbiAgICB9LFxuIF1cbiogKi9cblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBPcGVyYXRpb24gU2FtcGxlXG4qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gZGIudHJhbnNhY3Rpb24oJ3J3JywgZGIubWVtb3MsIGZ1bmN0aW9uICgpIHtcbiAgIGRiLm1lbW9zLmFkZCh7IHVybDogJ2h0dHA6Ly9leGFtcGxlLmNvbScsXG4gICAgICBjb250ZW50czogW3sgbm9kZTogJ2VsZW1lbnQnLCBjb250ZW50OiAndGV4dCBvciBtYXJrZG93bicgfV1cbiAgIH0pO1xuICAgZGIubWVtb3Mud2hlcmUoJ3VybCcpLmVxdWFscygnaHR0cDovL2V4YW1wbGUuY29tJykuZWFjaCgoaXRlbSkgPT4gY29uc29sZS5sb2coaXRlbSkpO1xuIH0pO1xuXG4qL1xuXG4vLyBUT0RPOiBTY2hlbWHjgpLlpInmm7RcbmxldCBkYiA9IG5ldyBEZXhpZSgnU2FzaGlrb21pREInKTtcbmRiLnZlcnNpb24oMSkuc3RvcmVzKHtcbiAgbWVtb3M6IFwiKytpZCwgdXJsXCJcbn0pO1xuXG5kYi5vcGVuKCk7XG5cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBNZXNzYWdlIFBhc3Npbmcob25NZXNzYWdlKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5jaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoXG4gIGZ1bmN0aW9uIChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkge1xuXG4gICAgY29uc29sZS5sb2cocmVxdWVzdCk7XG4gICAgY29uc29sZS5sb2cocmVxdWVzdC51cmwpO1xuXG4gICAgc2VuZFJlc3BvbnNlKHt1cmw6IHJlcXVlc3QudXJsfSk7XG5cbiAgICAvLyDlrp/pmpvjga90eXBl44KS5Y+X44GR5Y+W44Gj44Gm44CB5Lul5LiL44Gu44KI44GG44Gq5oSf44GY44Gnc3dpdGNo5YiG5bKQXG4gICAgc3dpdGNoIChyZXF1ZXN0LnR5cGUpIHtcbiAgICAgIGNhc2UgXCJoZWxsb1wiOlxuICAgICAgICBoZWxsbyhyZXF1ZXN0LnRleHQsIHNlbmRSZXNwb25zZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIm5pZ2h0XCI6XG4gICAgICAgIG5pZ2h0KHJlcXVlc3QudGV4dCwgc2VuZFJlc3BvbnNlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yOiBVbmtvd24gcmVxdWVzdC5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlcXVlc3QpO1xuICAgIH1cbiAgfVxuKTtcblxuXG5mdW5jdGlvbiBoZWxsbyhuYW1lLCBjYWxsYmFjaykge1xuICBjYWxsYmFjayhcIkhlbGxvLCBcIiArIG5hbWUpO1xufVxuXG5mdW5jdGlvbiBuaWdodChuYW1lLCBjYWxsYmFjaykge1xuICBjYWxsYmFjayhcIkdvb2QgbmlnaHQsIFwiICsgbmFtZSk7XG59XG4gKiAqL1xuLy8gVE9ETzogaW5qZWN0Lmpz44GL44KJ44GuTWVzc2FnZeOCkmxpc3RlbuOBl+OBpuOAgURC44GuQ1JVROWHpueQhlxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIE1lc3NhZ2UgUGFzc2luZyhzZW5kKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gKiBjb250ZW50X3Njcmlwc+OBuOOBrm1lc3NhZ2Vfc2VuZOOBr2Nocm9tZS50YWJzLnNlbmRNZXNzYWdl44GndGFiSWTjgpJcbiDmjIflrprjgZfjgabpgIHkv6HjgZnjgovlv4XopoHjgYzjgYLjgovjgILku6XkuIvjga7kvovjga/jgIF0YWIgZXZlbnTjgajntYTjgb/lkIjjgo/jgZvjgabjgIFcbiB0YWJJZOOCkuWPluW+l+OBl+OAgXNlbmRNZXNzYWdl44GX44Gm44GE44KL44CCXG5cbiAgKiBjaHJvbWUudGFicy5zZW5kTWVzc2FnZeOBp3NlbmTjgZfjgabjgYTjgovjgYzjgIFcbiBjb250ZW50X3Njcmlwc+WBtOOBp+OBr+OAgWNocm9tZS5ydW50aW1lLm9uTWVzc2FnZeOBq+eZuueBq+OBmeOCi1xuXG4gY2hyb21lLnRhYnMub25VcGRhdGVkLmFkZExpc3RlbmVyKGZ1bmN0aW9uKHRhYklkLCBjaGFuZ2VJbmZvLCB0YWIpIHtcbiAgY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UodGFiSWQsIHRhYi51cmwsICBmdW5jdGlvbihyZXMpIHtcbiAgICBpZiAocmVzKSB7XG4gICAgICBjb25zb2xlLmxvZyhyZXMpXG4gICAgfVxuICB9KTtcbn0pO1xuXG4gMS4gQ29udGV4dE1lbnXjgYvjgonmlrDopo9Db21wb25lbnTov73liqDjga7lkb3ku6TjgpJDb250ZW50U2NyaXB0c+OBq+WPuOS7pFxuXG4qICovXG5cblxuXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogYnJvd3NlckFjdGlvblxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG5cbi8qICNvbkNsaWNrXG4qIFRPRE86IHBvcHVwLmh0bWzjgpLplovjgY9cbiog5oy/5YWl44Gn44GN44Gq44GL44Gj44GfY29udGVudChlcnJvcinjgpJwb3B1cC5odG1s44Gn6KGo56S6XG4qIGVycm9y44GM44Gq44GR44KM44Gw44Gq44Gr44KC6KGo56S644GX44Gq44GEXG4qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuLy9jaHJvbWUuYnJvd3NlckFjdGlvbi5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoZnVuY3Rpb24gKCkge1xuLy9cbi8vfSk7XG5cbi8qICNzZXRCYWRnZVRleHRcbiogVE9ETzog5oy/5YWlZXJyb3LjgYzjgYLjgozjgbBCYWRnZVRleHTjgafpgJrnn6VcbiogY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KG9iamVjdCBkZXRhaWxzKVxuKiBodHRwczovL2RldmVsb3Blci5jaHJvbWUuY29tL2V4dGVuc2lvbnMvYnJvd3NlckFjdGlvblxuKi9cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2JnL2luZGV4LmpzXG4gKiovIiwiLyogQSBNaW5pbWFsaXN0aWMgV3JhcHBlciBmb3IgSW5kZXhlZERCXG4gICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgQnkgRGF2aWQgRmFobGFuZGVyLCBkYXZpZC5mYWhsYW5kZXJAZ21haWwuY29tXG5cbiAgIFZlcnNpb24gMS4yLjAgLSBTZXB0ZW1iZXIgMjIsIDIwMTUuXG5cbiAgIFRlc3RlZCBzdWNjZXNzZnVsbHkgb24gQ2hyb21lLCBPcGVyYSwgRmlyZWZveCwgRWRnZSwgYW5kIElFLlxuXG4gICBPZmZpY2lhbCBXZWJzaXRlOiB3d3cuZGV4aWUuY29tXG5cbiAgIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSBWZXJzaW9uIDIuMCwgSmFudWFyeSAyMDA0LCBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvXG4qL1xuKGZ1bmN0aW9uIChnbG9iYWwsIHB1Ymxpc2gsIHVuZGVmaW5lZCkge1xuXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBmdW5jdGlvbiBleHRlbmQob2JqLCBleHRlbnNpb24pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBleHRlbnNpb24gIT09ICdvYmplY3QnKSBleHRlbnNpb24gPSBleHRlbnNpb24oKTsgLy8gQWxsb3cgdG8gc3VwcGx5IGEgZnVuY3Rpb24gcmV0dXJuaW5nIHRoZSBleHRlbnNpb24uIFVzZWZ1bCBmb3Igc2ltcGxpZnlpbmcgcHJpdmF0ZSBzY29wZXMuXG4gICAgICAgIE9iamVjdC5rZXlzKGV4dGVuc2lvbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBvYmpba2V5XSA9IGV4dGVuc2lvbltrZXldO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXJpdmUoQ2hpbGQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyb206IGZ1bmN0aW9uIChQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBDaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBhcmVudC5wcm90b3R5cGUpO1xuICAgICAgICAgICAgICAgIENoaWxkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENoaWxkO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZDogZnVuY3Rpb24gKGV4dGVuc2lvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kKENoaWxkLnByb3RvdHlwZSwgdHlwZW9mIGV4dGVuc2lvbiAhPT0gJ29iamVjdCcgPyBleHRlbnNpb24oUGFyZW50LnByb3RvdHlwZSkgOiBleHRlbnNpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvdmVycmlkZShvcmlnRnVuYywgb3ZlcnJpZGVkRmFjdG9yeSkge1xuICAgICAgICByZXR1cm4gb3ZlcnJpZGVkRmFjdG9yeShvcmlnRnVuYyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gRGV4aWUoZGJOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm9wdGlvbnNcIiB0eXBlPVwiT2JqZWN0XCIgb3B0aW9uYWw9XCJ0cnVlXCI+U3BlY2lmeSBvbmx5IGlmIHlvdSB3aWNoIHRvIGNvbnRyb2wgd2hpY2ggYWRkb25zIHRoYXQgc2hvdWxkIHJ1biBvbiB0aGlzIGluc3RhbmNlPC9wYXJhbT5cbiAgICAgICAgdmFyIGFkZG9ucyA9IChvcHRpb25zICYmIG9wdGlvbnMuYWRkb25zKSB8fCBEZXhpZS5hZGRvbnM7XG4gICAgICAgIC8vIFJlc29sdmUgYWxsIGV4dGVybmFsIGRlcGVuZGVuY2llczpcbiAgICAgICAgdmFyIGRlcHMgPSBEZXhpZS5kZXBlbmRlbmNpZXM7XG4gICAgICAgIHZhciBpbmRleGVkREIgPSBkZXBzLmluZGV4ZWREQixcbiAgICAgICAgICAgIElEQktleVJhbmdlID0gZGVwcy5JREJLZXlSYW5nZSxcbiAgICAgICAgICAgIElEQlRyYW5zYWN0aW9uID0gZGVwcy5JREJUcmFuc2FjdGlvbjtcblxuICAgICAgICB2YXIgRE9NRXJyb3IgPSBkZXBzLkRPTUVycm9yLFxuICAgICAgICAgICAgVHlwZUVycm9yID0gZGVwcy5UeXBlRXJyb3IsXG4gICAgICAgICAgICBFcnJvciA9IGRlcHMuRXJyb3I7XG5cbiAgICAgICAgdmFyIGdsb2JhbFNjaGVtYSA9IHRoaXMuX2RiU2NoZW1hID0ge307XG4gICAgICAgIHZhciB2ZXJzaW9ucyA9IFtdO1xuICAgICAgICB2YXIgZGJTdG9yZU5hbWVzID0gW107XG4gICAgICAgIHZhciBhbGxUYWJsZXMgPSB7fTtcbiAgICAgICAgdmFyIG5vdEluVHJhbnNGYWxsYmFja1RhYmxlcyA9IHt9O1xuICAgICAgICAvLy88dmFyIHR5cGU9XCJJREJEYXRhYmFzZVwiIC8+XG4gICAgICAgIHZhciBpZGJkYiA9IG51bGw7IC8vIEluc3RhbmNlIG9mIElEQkRhdGFiYXNlXG4gICAgICAgIHZhciBkYl9pc19ibG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgdmFyIGRiT3BlbkVycm9yID0gbnVsbDtcbiAgICAgICAgdmFyIGlzQmVpbmdPcGVuZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIFJFQURPTkxZID0gXCJyZWFkb25seVwiLCBSRUFEV1JJVEUgPSBcInJlYWR3cml0ZVwiO1xuICAgICAgICB2YXIgZGIgPSB0aGlzO1xuICAgICAgICB2YXIgcGF1c2VkUmVzdW1lYWJsZXMgPSBbXTtcbiAgICAgICAgdmFyIGF1dG9TY2hlbWEgPSB0cnVlO1xuICAgICAgICB2YXIgaGFzTmF0aXZlR2V0RGF0YWJhc2VOYW1lcyA9ICEhZ2V0TmF0aXZlR2V0RGF0YWJhc2VOYW1lc0ZuKCk7XG5cbiAgICAgICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgICAgIC8vIElmIGJyb3dzZXIgKG5vdCBub2RlLmpzIG9yIG90aGVyKSwgc3Vic2NyaWJlIHRvIHZlcnNpb25jaGFuZ2UgZXZlbnQgYW5kIHJlbG9hZCBwYWdlXG4gICAgICAgICAgICBkYi5vbihcInZlcnNpb25jaGFuZ2VcIiwgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgLy8gRGVmYXVsdCBiZWhhdmlvciBmb3IgdmVyc2lvbmNoYW5nZSBldmVudCBpcyB0byBjbG9zZSBkYXRhYmFzZSBjb25uZWN0aW9uLlxuICAgICAgICAgICAgICAgIC8vIENhbGxlciBjYW4gb3ZlcnJpZGUgdGhpcyBiZWhhdmlvciBieSBkb2luZyBkYi5vbihcInZlcnNpb25jaGFuZ2VcIiwgZnVuY3Rpb24oKXsgcmV0dXJuIGZhbHNlOyB9KTtcbiAgICAgICAgICAgICAgICAvLyBMZXQncyBub3QgYmxvY2sgdGhlIG90aGVyIHdpbmRvdyBmcm9tIG1ha2luZyBpdCdzIGRlbGV0ZSgpIG9yIG9wZW4oKSBjYWxsLlxuICAgICAgICAgICAgICAgIGRiLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgZGIub24oJ2Vycm9yJykuZmlyZShuZXcgRXJyb3IoXCJEYXRhYmFzZSB2ZXJzaW9uIGNoYW5nZWQgYnkgb3RoZXIgZGF0YWJhc2UgY29ubmVjdGlvbi5cIikpO1xuICAgICAgICAgICAgICAgIC8vIEluIG1hbnkgd2ViIGFwcGxpY2F0aW9ucywgaXQgd291bGQgYmUgcmVjb21tZW5kZWQgdG8gZm9yY2Ugd2luZG93LnJlbG9hZCgpXG4gICAgICAgICAgICAgICAgLy8gd2hlbiB0aGlzIGV2ZW50IG9jY3Vycy4gRG8gZG8gdGhhdCwgc3Vic2NyaWJlIHRvIHRoZSB2ZXJzaW9uY2hhbmdlIGV2ZW50XG4gICAgICAgICAgICAgICAgLy8gYW5kIGNhbGwgd2luZG93LmxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBWZXJzaW9uaW5nIEZyYW1ld29yay0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuXG4gICAgICAgIHRoaXMudmVyc2lvbiA9IGZ1bmN0aW9uICh2ZXJzaW9uTnVtYmVyKSB7XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJ2ZXJzaW9uTnVtYmVyXCIgdHlwZT1cIk51bWJlclwiPjwvcGFyYW0+XG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cIlZlcnNpb25cIj48L3JldHVybnM+XG4gICAgICAgICAgICBpZiAoaWRiZGIpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBhZGQgdmVyc2lvbiB3aGVuIGRhdGFiYXNlIGlzIG9wZW5cIik7XG4gICAgICAgICAgICB0aGlzLnZlcm5vID0gTWF0aC5tYXgodGhpcy52ZXJubywgdmVyc2lvbk51bWJlcik7XG4gICAgICAgICAgICB2YXIgdmVyc2lvbkluc3RhbmNlID0gdmVyc2lvbnMuZmlsdGVyKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2Ll9jZmcudmVyc2lvbiA9PT0gdmVyc2lvbk51bWJlcjsgfSlbMF07XG4gICAgICAgICAgICBpZiAodmVyc2lvbkluc3RhbmNlKSByZXR1cm4gdmVyc2lvbkluc3RhbmNlO1xuICAgICAgICAgICAgdmVyc2lvbkluc3RhbmNlID0gbmV3IFZlcnNpb24odmVyc2lvbk51bWJlcik7XG4gICAgICAgICAgICB2ZXJzaW9ucy5wdXNoKHZlcnNpb25JbnN0YW5jZSk7XG4gICAgICAgICAgICB2ZXJzaW9ucy5zb3J0KGxvd2VyVmVyc2lvbkZpcnN0KTtcbiAgICAgICAgICAgIHJldHVybiB2ZXJzaW9uSW5zdGFuY2U7XG4gICAgICAgIH07IFxuXG4gICAgICAgIGZ1bmN0aW9uIFZlcnNpb24odmVyc2lvbk51bWJlcikge1xuICAgICAgICAgICAgdGhpcy5fY2ZnID0ge1xuICAgICAgICAgICAgICAgIHZlcnNpb246IHZlcnNpb25OdW1iZXIsXG4gICAgICAgICAgICAgICAgc3RvcmVzU291cmNlOiBudWxsLFxuICAgICAgICAgICAgICAgIGRic2NoZW1hOiB7fSxcbiAgICAgICAgICAgICAgICB0YWJsZXM6IHt9LFxuICAgICAgICAgICAgICAgIGNvbnRlbnRVcGdyYWRlOiBudWxsXG4gICAgICAgICAgICB9OyBcbiAgICAgICAgICAgIHRoaXMuc3RvcmVzKHt9KTsgLy8gRGVyaXZlIGVhcmxpZXIgc2NoZW1hcyBieSBkZWZhdWx0LlxuICAgICAgICB9XG5cbiAgICAgICAgZXh0ZW5kKFZlcnNpb24ucHJvdG90eXBlLCB7XG4gICAgICAgICAgICBzdG9yZXM6IGZ1bmN0aW9uIChzdG9yZXMpIHtcbiAgICAgICAgICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgICAgICAgICAgLy8vICAgRGVmaW5lcyB0aGUgc2NoZW1hIGZvciBhIHBhcnRpY3VsYXIgdmVyc2lvblxuICAgICAgICAgICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwic3RvcmVzXCIgdHlwZT1cIk9iamVjdFwiPlxuICAgICAgICAgICAgICAgIC8vLyBFeGFtcGxlOiA8YnIvPlxuICAgICAgICAgICAgICAgIC8vLyAgIHt1c2VyczogXCJpZCsrLGZpcnN0LGxhc3QsJmFtcDt1c2VybmFtZSwqZW1haWxcIiwgPGJyLz5cbiAgICAgICAgICAgICAgICAvLy8gICBwYXNzd29yZHM6IFwiaWQrKywmYW1wO3VzZXJuYW1lXCJ9PGJyLz5cbiAgICAgICAgICAgICAgICAvLy8gPGJyLz5cbiAgICAgICAgICAgICAgICAvLy8gU3ludGF4OiB7VGFibGU6IFwiW3ByaW1hcnlLZXldWysrXSxbJmFtcDtdWypdaW5kZXgxLFsmYW1wO11bKl1pbmRleDIsLi4uXCJ9PGJyLz48YnIvPlxuICAgICAgICAgICAgICAgIC8vLyBTcGVjaWFsIGNoYXJhY3RlcnM6PGJyLz5cbiAgICAgICAgICAgICAgICAvLy8gIFwiJmFtcDtcIiAgbWVhbnMgdW5pcXVlIGtleSwgPGJyLz5cbiAgICAgICAgICAgICAgICAvLy8gIFwiKlwiICBtZWFucyB2YWx1ZSBpcyBtdWx0aUVudHJ5LCA8YnIvPlxuICAgICAgICAgICAgICAgIC8vLyAgXCIrK1wiIG1lYW5zIGF1dG8taW5jcmVtZW50IGFuZCBvbmx5IGFwcGxpY2FibGUgZm9yIHByaW1hcnkga2V5IDxici8+XG4gICAgICAgICAgICAgICAgLy8vIDwvcGFyYW0+XG4gICAgICAgICAgICAgICAgdGhpcy5fY2ZnLnN0b3Jlc1NvdXJjZSA9IHRoaXMuX2NmZy5zdG9yZXNTb3VyY2UgPyBleHRlbmQodGhpcy5fY2ZnLnN0b3Jlc1NvdXJjZSwgc3RvcmVzKSA6IHN0b3JlcztcblxuICAgICAgICAgICAgICAgIC8vIERlcml2ZSBzdG9yZXMgZnJvbSBlYXJsaWVyIHZlcnNpb25zIGlmIHRoZXkgYXJlIG5vdCBleHBsaWNpdGVseSBzcGVjaWZpZWQgYXMgbnVsbCBvciBhIG5ldyBzeW50YXguXG4gICAgICAgICAgICAgICAgdmFyIHN0b3Jlc1NwZWMgPSB7fTtcbiAgICAgICAgICAgICAgICB2ZXJzaW9ucy5mb3JFYWNoKGZ1bmN0aW9uICh2ZXJzaW9uKSB7IC8vICd2ZXJzaW9ucycgaXMgYWx3YXlzIHNvcnRlZCBieSBsb3dlc3QgdmVyc2lvbiBmaXJzdC5cbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5kKHN0b3Jlc1NwZWMsIHZlcnNpb24uX2NmZy5zdG9yZXNTb3VyY2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdmFyIGRic2NoZW1hID0gKHRoaXMuX2NmZy5kYnNjaGVtYSA9IHt9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJzZVN0b3Jlc1NwZWMoc3RvcmVzU3BlYywgZGJzY2hlbWEpO1xuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgbGF0ZXN0IHNjaGVtYSB0byB0aGlzIHZlcnNpb25cbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgQVBJXG4gICAgICAgICAgICAgICAgZ2xvYmFsU2NoZW1hID0gZGIuX2RiU2NoZW1hID0gZGJzY2hlbWE7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVGFibGVzQXBpKFthbGxUYWJsZXMsIGRiLCBub3RJblRyYW5zRmFsbGJhY2tUYWJsZXNdKTtcbiAgICAgICAgICAgICAgICBzZXRBcGlPblBsYWNlKFtub3RJblRyYW5zRmFsbGJhY2tUYWJsZXNdLCB0YWJsZU5vdEluVHJhbnNhY3Rpb24sIE9iamVjdC5rZXlzKGRic2NoZW1hKSwgUkVBRFdSSVRFLCBkYnNjaGVtYSk7XG4gICAgICAgICAgICAgICAgc2V0QXBpT25QbGFjZShbYWxsVGFibGVzLCBkYiwgdGhpcy5fY2ZnLnRhYmxlc10sIGRiLl90cmFuc1Byb21pc2VGYWN0b3J5LCBPYmplY3Qua2V5cyhkYnNjaGVtYSksIFJFQURXUklURSwgZGJzY2hlbWEsIHRydWUpO1xuICAgICAgICAgICAgICAgIGRiU3RvcmVOYW1lcyA9IE9iamVjdC5rZXlzKGRic2NoZW1hKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGdyYWRlOiBmdW5jdGlvbiAodXBncmFkZUZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwidXBncmFkZUZ1bmN0aW9uXCIgb3B0aW9uYWw9XCJ0cnVlXCI+RnVuY3Rpb24gdGhhdCBwZXJmb3JtcyB1cGdyYWRpbmcgYWN0aW9ucy48L3BhcmFtPlxuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICBmYWtlQXV0b0NvbXBsZXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdXBncmFkZUZ1bmN0aW9uKGRiLl9jcmVhdGVUcmFuc2FjdGlvbihSRUFEV1JJVEUsIE9iamVjdC5rZXlzKHNlbGYuX2NmZy5kYnNjaGVtYSksIHNlbGYuX2NmZy5kYnNjaGVtYSkpOy8vIEJVR0JVRzogTm8gY29kZSBjb21wbGV0aW9uIGZvciBwcmV2IHZlcnNpb24ncyB0YWJsZXMgd29udCBhcHBlYXIuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2ZnLmNvbnRlbnRVcGdyYWRlID0gdXBncmFkZUZ1bmN0aW9uO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9wYXJzZVN0b3Jlc1NwZWM6IGZ1bmN0aW9uIChzdG9yZXMsIG91dFNjaGVtYSkge1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHN0b3JlcykuZm9yRWFjaChmdW5jdGlvbiAodGFibGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdG9yZXNbdGFibGVOYW1lXSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluc3RhbmNlVGVtcGxhdGUgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleGVzID0gcGFyc2VJbmRleFN5bnRheChzdG9yZXNbdGFibGVOYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJpbUtleSA9IGluZGV4ZXMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmltS2V5Lm11bHRpKSB0aHJvdyBuZXcgRXJyb3IoXCJQcmltYXJ5IGtleSBjYW5ub3QgYmUgbXVsdGktdmFsdWVkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByaW1LZXkua2V5UGF0aCkgc2V0QnlLZXlQYXRoKGluc3RhbmNlVGVtcGxhdGUsIHByaW1LZXkua2V5UGF0aCwgcHJpbUtleS5hdXRvID8gMCA6IHByaW1LZXkua2V5UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleGVzLmZvckVhY2goZnVuY3Rpb24gKGlkeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZHguYXV0bykgdGhyb3cgbmV3IEVycm9yKFwiT25seSBwcmltYXJ5IGtleSBjYW4gYmUgbWFya2VkIGFzIGF1dG9JbmNyZW1lbnQgKCsrKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlkeC5rZXlQYXRoKSB0aHJvdyBuZXcgRXJyb3IoXCJJbmRleCBtdXN0IGhhdmUgYSBuYW1lIGFuZCBjYW5ub3QgYmUgYW4gZW1wdHkgc3RyaW5nXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEJ5S2V5UGF0aChpbnN0YW5jZVRlbXBsYXRlLCBpZHgua2V5UGF0aCwgaWR4LmNvbXBvdW5kID8gaWR4LmtleVBhdGgubWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuIFwiXCI7IH0pIDogXCJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dFNjaGVtYVt0YWJsZU5hbWVdID0gbmV3IFRhYmxlU2NoZW1hKHRhYmxlTmFtZSwgcHJpbUtleSwgaW5kZXhlcywgaW5zdGFuY2VUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gcnVuVXBncmFkZXJzKG9sZFZlcnNpb24sIGlkYnRyYW5zLCByZWplY3QsIG9wZW5SZXEpIHtcbiAgICAgICAgICAgIGlmIChvbGRWZXJzaW9uID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy9nbG9iYWxTY2hlbWEgPSB2ZXJzaW9uc1t2ZXJzaW9ucy5sZW5ndGggLSAxXS5fY2ZnLmRic2NoZW1hO1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB0YWJsZXM6XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZ2xvYmFsU2NoZW1hKS5mb3JFYWNoKGZ1bmN0aW9uICh0YWJsZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlVGFibGUoaWRidHJhbnMsIHRhYmxlTmFtZSwgZ2xvYmFsU2NoZW1hW3RhYmxlTmFtZV0ucHJpbUtleSwgZ2xvYmFsU2NoZW1hW3RhYmxlTmFtZV0uaW5kZXhlcyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gUG9wdWxhdGUgZGF0YVxuICAgICAgICAgICAgICAgIHZhciB0ID0gZGIuX2NyZWF0ZVRyYW5zYWN0aW9uKFJFQURXUklURSwgZGJTdG9yZU5hbWVzLCBnbG9iYWxTY2hlbWEpO1xuICAgICAgICAgICAgICAgIHQuaWRidHJhbnMgPSBpZGJ0cmFucztcbiAgICAgICAgICAgICAgICB0LmlkYnRyYW5zLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBbXCJwb3B1bGF0aW5nIGRhdGFiYXNlXCJdKTtcbiAgICAgICAgICAgICAgICB0Lm9uKCdlcnJvcicpLnN1YnNjcmliZShyZWplY3QpO1xuICAgICAgICAgICAgICAgIFByb21pc2UubmV3UFNEKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5QU0QudHJhbnMgPSB0O1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGIub24oXCJwb3B1bGF0ZVwiKS5maXJlKHQpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5SZXEub25lcnJvciA9IGlkYnRyYW5zLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXYpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfTsgIC8vIFByb2hpYml0IEFib3J0RXJyb3IgZmlyZSBvbiBkYi5vbihcImVycm9yXCIpIGluIEZpcmVmb3guXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkgeyBpZGJ0cmFucy5hYm9ydCgpOyB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlkYnRyYW5zLmRiLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBVcGdyYWRlIHZlcnNpb24gdG8gdmVyc2lvbiwgc3RlcC1ieS1zdGVwIGZyb20gb2xkZXN0IHRvIG5ld2VzdCB2ZXJzaW9uLlxuICAgICAgICAgICAgICAgIC8vIEVhY2ggdHJhbnNhY3Rpb24gb2JqZWN0IHdpbGwgY29udGFpbiB0aGUgdGFibGUgc2V0IHRoYXQgd2FzIGN1cnJlbnQgaW4gdGhhdCB2ZXJzaW9uIChidXQgYWxzbyBub3QteWV0LWRlbGV0ZWQgdGFibGVzIGZyb20gaXRzIHByZXZpb3VzIHZlcnNpb24pXG4gICAgICAgICAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgICAgICAgICAgdmFyIG9sZFZlcnNpb25TdHJ1Y3QgPSB2ZXJzaW9ucy5maWx0ZXIoZnVuY3Rpb24gKHZlcnNpb24pIHsgcmV0dXJuIHZlcnNpb24uX2NmZy52ZXJzaW9uID09PSBvbGRWZXJzaW9uOyB9KVswXTtcbiAgICAgICAgICAgICAgICBpZiAoIW9sZFZlcnNpb25TdHJ1Y3QpIHRocm93IG5ldyBFcnJvcihcIkRleGllIHNwZWNpZmljYXRpb24gb2YgY3VycmVudGx5IGluc3RhbGxlZCBEQiB2ZXJzaW9uIGlzIG1pc3NpbmdcIik7XG4gICAgICAgICAgICAgICAgZ2xvYmFsU2NoZW1hID0gZGIuX2RiU2NoZW1hID0gb2xkVmVyc2lvblN0cnVjdC5fY2ZnLmRic2NoZW1hO1xuICAgICAgICAgICAgICAgIHZhciBhbnlDb250ZW50VXBncmFkZXJIYXNSdW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIHZhciB2ZXJzVG9SdW4gPSB2ZXJzaW9ucy5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYuX2NmZy52ZXJzaW9uID4gb2xkVmVyc2lvbjsgfSk7XG4gICAgICAgICAgICAgICAgdmVyc1RvUnVuLmZvckVhY2goZnVuY3Rpb24gKHZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwidmVyc2lvblwiIHR5cGU9XCJWZXJzaW9uXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFNjaGVtYSA9IGdsb2JhbFNjaGVtYTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1NjaGVtYSA9IHZlcnNpb24uX2NmZy5kYnNjaGVtYTtcbiAgICAgICAgICAgICAgICAgICAgYWRqdXN0VG9FeGlzdGluZ0luZGV4TmFtZXMob2xkU2NoZW1hLCBpZGJ0cmFucyk7XG4gICAgICAgICAgICAgICAgICAgIGFkanVzdFRvRXhpc3RpbmdJbmRleE5hbWVzKG5ld1NjaGVtYSwgaWRidHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWxTY2hlbWEgPSBkYi5fZGJTY2hlbWEgPSBuZXdTY2hlbWE7XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaWZmID0gZ2V0U2NoZW1hRGlmZihvbGRTY2hlbWEsIG5ld1NjaGVtYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmLmFkZC5mb3JFYWNoKGZ1bmN0aW9uICh0dXBsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goZnVuY3Rpb24gKGlkYnRyYW5zLCBjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVUYWJsZShpZGJ0cmFucywgdHVwbGVbMF0sIHR1cGxlWzFdLnByaW1LZXksIHR1cGxlWzFdLmluZGV4ZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWZmLmNoYW5nZS5mb3JFYWNoKGZ1bmN0aW9uIChjaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlLnJlY3JlYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCB5ZXQgc3VwcG9ydCBmb3IgY2hhbmdpbmcgcHJpbWFyeSBrZXlcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUucHVzaChmdW5jdGlvbiAoaWRidHJhbnMsIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSBpZGJ0cmFucy5vYmplY3RTdG9yZShjaGFuZ2UubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2UuYWRkLmZvckVhY2goZnVuY3Rpb24gKGlkeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEluZGV4KHN0b3JlLCBpZHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2UuY2hhbmdlLmZvckVhY2goZnVuY3Rpb24gKGlkeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JlLmRlbGV0ZUluZGV4KGlkeC5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRJbmRleChzdG9yZSwgaWR4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlLmRlbC5mb3JFYWNoKGZ1bmN0aW9uIChpZHhOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmUuZGVsZXRlSW5kZXgoaWR4TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZlcnNpb24uX2NmZy5jb250ZW50VXBncmFkZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goZnVuY3Rpb24gKGlkYnRyYW5zLCBjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnlDb250ZW50VXBncmFkZXJIYXNSdW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdCA9IGRiLl9jcmVhdGVUcmFuc2FjdGlvbihSRUFEV1JJVEUsIFtdLnNsaWNlLmNhbGwoaWRidHJhbnMuZGIub2JqZWN0U3RvcmVOYW1lcywgMCksIG5ld1NjaGVtYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQuaWRidHJhbnMgPSBpZGJ0cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVuY29tcGxldGVkUmVxdWVzdHMgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0Ll9wcm9taXNlID0gb3ZlcnJpZGUodC5fcHJvbWlzZSwgZnVuY3Rpb24gKG9yaWdfcHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChtb2RlLCBmbiwgd3JpdGVMb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyt1bmNvbXBsZXRlZFJlcXVlc3RzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHByb3h5KGZuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tdW5jb21wbGV0ZWRSZXF1ZXN0cyA9PT0gMCkgY2IoKTsgLy8gQSBjYWxsZWQgZGIgb3BlcmF0aW9uIGhhcyBjb21wbGV0ZWQgd2l0aG91dCBzdGFydGluZyBhIG5ldyBvcGVyYXRpb24uIFRoZSBmbG93IGlzIGZpbmlzaGVkLCBub3cgcnVuIG5leHQgdXBncmFkZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9yaWdfcHJvbWlzZS5jYWxsKHRoaXMsIG1vZGUsIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIHRyYW5zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50c1swXSA9IHByb3h5KHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHNbMV0gPSBwcm94eShyZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHdyaXRlTG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRidHJhbnMub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIFtcInJ1bm5pbmcgdXBncmFkZXIgZnVuY3Rpb24gZm9yIHZlcnNpb25cIiwgdmVyc2lvbi5fY2ZnLnZlcnNpb25dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdC5vbignZXJyb3InKS5zdWJzY3JpYmUocmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbi5fY2ZnLmNvbnRlbnRVcGdyYWRlKHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW5jb21wbGV0ZWRSZXF1ZXN0cyA9PT0gMCkgY2IoKTsgLy8gY29udGVudFVwZ3JhZGUoKSBkaWRudCBjYWxsIGFueSBkYiBvcGVyYXRpb25zIGF0IGFsbC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYW55Q29udGVudFVwZ3JhZGVySGFzUnVuIHx8ICFoYXNJRURlbGV0ZU9iamVjdFN0b3JlQnVnKCkpIHsgLy8gRG9udCBkZWxldGUgb2xkIHRhYmxlcyBpZiBpZUJ1ZyBpcyBwcmVzZW50IGFuZCBhIGNvbnRlbnQgdXBncmFkZXIgaGFzIHJ1bi4gTGV0IHRhYmxlcyBiZSBsZWZ0IGluIERCIHNvIGZhci4gVGhpcyBuZWVkcyB0byBiZSB0YWtlbiBjYXJlIG9mLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goZnVuY3Rpb24gKGlkYnRyYW5zLCBjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEZWxldGUgb2xkIHRhYmxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGVSZW1vdmVkVGFibGVzKG5ld1NjaGVtYSwgaWRidHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBOb3csIGNyZWF0ZSBhIHF1ZXVlIGV4ZWN1dGlvbiBlbmdpbmVcbiAgICAgICAgICAgICAgICB2YXIgcnVuTmV4dFF1ZXVlZEZ1bmN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5zaGlmdCgpKGlkYnRyYW5zLCBydW5OZXh0UXVldWVkRnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZU1pc3NpbmdUYWJsZXMoZ2xvYmFsU2NoZW1hLCBpZGJ0cmFucyk7IC8vIEF0IGxhc3QsIG1ha2Ugc3VyZSB0byBjcmVhdGUgYW55IG1pc3NpbmcgdGFibGVzLiAoTmVlZGVkIGJ5IGFkZG9ucyB0aGF0IGFkZCBzdG9yZXMgdG8gREIgd2l0aG91dCBzcGVjaWZ5aW5nIHZlcnNpb24pXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlblJlcS5vbmVycm9yID0gaWRidHJhbnMub25lcnJvciA9IGZ1bmN0aW9uIChldikgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyB9OyAgLy8gUHJvaGliaXQgQWJvcnRFcnJvciBmaXJlIG9uIGRiLm9uKFwiZXJyb3JcIikgaW4gRmlyZWZveC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7IGlkYnRyYW5zLmFib3J0KCk7IH0gY2F0Y2goZSkge31cbiAgICAgICAgICAgICAgICAgICAgICAgIGlkYnRyYW5zLmRiLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcnVuTmV4dFF1ZXVlZEZ1bmN0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRTY2hlbWFEaWZmKG9sZFNjaGVtYSwgbmV3U2NoZW1hKSB7XG4gICAgICAgICAgICB2YXIgZGlmZiA9IHtcbiAgICAgICAgICAgICAgICBkZWw6IFtdLCAvLyBBcnJheSBvZiB0YWJsZSBuYW1lc1xuICAgICAgICAgICAgICAgIGFkZDogW10sIC8vIEFycmF5IG9mIFt0YWJsZU5hbWUsIG5ld0RlZmluaXRpb25dXG4gICAgICAgICAgICAgICAgY2hhbmdlOiBbXSAvLyBBcnJheSBvZiB7bmFtZTogdGFibGVOYW1lLCByZWNyZWF0ZTogbmV3RGVmaW5pdGlvbiwgZGVsOiBkZWxJbmRleE5hbWVzLCBhZGQ6IG5ld0luZGV4RGVmcywgY2hhbmdlOiBjaGFuZ2VkSW5kZXhEZWZzfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGZvciAodmFyIHRhYmxlIGluIG9sZFNjaGVtYSkge1xuICAgICAgICAgICAgICAgIGlmICghbmV3U2NoZW1hW3RhYmxlXSkgZGlmZi5kZWwucHVzaCh0YWJsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciB0YWJsZSBpbiBuZXdTY2hlbWEpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkRGVmID0gb2xkU2NoZW1hW3RhYmxlXSxcbiAgICAgICAgICAgICAgICAgICAgbmV3RGVmID0gbmV3U2NoZW1hW3RhYmxlXTtcbiAgICAgICAgICAgICAgICBpZiAoIW9sZERlZikgZGlmZi5hZGQucHVzaChbdGFibGUsIG5ld0RlZl0pO1xuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2hhbmdlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGFibGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWY6IG5ld1NjaGVtYVt0YWJsZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZWNyZWF0ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWw6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZTogW11cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZERlZi5wcmltS2V5LnNyYyAhPT0gbmV3RGVmLnByaW1LZXkuc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmltYXJ5IGtleSBoYXMgY2hhbmdlZC4gUmVtb3ZlIGFuZCByZS1hZGQgdGFibGUuXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2UucmVjcmVhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlmZi5jaGFuZ2UucHVzaChjaGFuZ2UpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9sZEluZGV4ZXMgPSBvbGREZWYuaW5kZXhlcy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cnJlbnQpIHsgcHJldltjdXJyZW50Lm5hbWVdID0gY3VycmVudDsgcmV0dXJuIHByZXY7IH0sIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdJbmRleGVzID0gbmV3RGVmLmluZGV4ZXMucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXJyZW50KSB7IHByZXZbY3VycmVudC5uYW1lXSA9IGN1cnJlbnQ7IHJldHVybiBwcmV2OyB9LCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpZHhOYW1lIGluIG9sZEluZGV4ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5ld0luZGV4ZXNbaWR4TmFtZV0pIGNoYW5nZS5kZWwucHVzaChpZHhOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeE5hbWUgaW4gbmV3SW5kZXhlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRJZHggPSBvbGRJbmRleGVzW2lkeE5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJZHggPSBuZXdJbmRleGVzW2lkeE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb2xkSWR4KSBjaGFuZ2UuYWRkLnB1c2gobmV3SWR4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChvbGRJZHguc3JjICE9PSBuZXdJZHguc3JjKSBjaGFuZ2UuY2hhbmdlLnB1c2gobmV3SWR4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2UucmVjcmVhdGUgfHwgY2hhbmdlLmRlbC5sZW5ndGggPiAwIHx8IGNoYW5nZS5hZGQubGVuZ3RoID4gMCB8fCBjaGFuZ2UuY2hhbmdlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmLmNoYW5nZS5wdXNoKGNoYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGlmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVRhYmxlKGlkYnRyYW5zLCB0YWJsZU5hbWUsIHByaW1LZXksIGluZGV4ZXMpIHtcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImlkYnRyYW5zXCIgdHlwZT1cIklEQlRyYW5zYWN0aW9uXCI+PC9wYXJhbT5cbiAgICAgICAgICAgIHZhciBzdG9yZSA9IGlkYnRyYW5zLmRiLmNyZWF0ZU9iamVjdFN0b3JlKHRhYmxlTmFtZSwgcHJpbUtleS5rZXlQYXRoID8geyBrZXlQYXRoOiBwcmltS2V5LmtleVBhdGgsIGF1dG9JbmNyZW1lbnQ6IHByaW1LZXkuYXV0byB9IDogeyBhdXRvSW5jcmVtZW50OiBwcmltS2V5LmF1dG8gfSk7XG4gICAgICAgICAgICBpbmRleGVzLmZvckVhY2goZnVuY3Rpb24gKGlkeCkgeyBhZGRJbmRleChzdG9yZSwgaWR4KTsgfSk7XG4gICAgICAgICAgICByZXR1cm4gc3RvcmU7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVNaXNzaW5nVGFibGVzKG5ld1NjaGVtYSwgaWRidHJhbnMpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG5ld1NjaGVtYSkuZm9yRWFjaChmdW5jdGlvbiAodGFibGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpZGJ0cmFucy5kYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKHRhYmxlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlVGFibGUoaWRidHJhbnMsIHRhYmxlTmFtZSwgbmV3U2NoZW1hW3RhYmxlTmFtZV0ucHJpbUtleSwgbmV3U2NoZW1hW3RhYmxlTmFtZV0uaW5kZXhlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkZWxldGVSZW1vdmVkVGFibGVzKG5ld1NjaGVtYSwgaWRidHJhbnMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaWRidHJhbnMuZGIub2JqZWN0U3RvcmVOYW1lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIHZhciBzdG9yZU5hbWUgPSBpZGJ0cmFucy5kYi5vYmplY3RTdG9yZU5hbWVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChuZXdTY2hlbWFbc3RvcmVOYW1lXSA9PT0gbnVsbCB8fCBuZXdTY2hlbWFbc3RvcmVOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlkYnRyYW5zLmRiLmRlbGV0ZU9iamVjdFN0b3JlKHN0b3JlTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkSW5kZXgoc3RvcmUsIGlkeCkge1xuICAgICAgICAgICAgc3RvcmUuY3JlYXRlSW5kZXgoaWR4Lm5hbWUsIGlkeC5rZXlQYXRoLCB7IHVuaXF1ZTogaWR4LnVuaXF1ZSwgbXVsdGlFbnRyeTogaWR4Lm11bHRpIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgICBEZXhpZSBQcm90ZWN0ZWQgQVBJXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG5cbiAgICAgICAgdGhpcy5fYWxsVGFibGVzID0gYWxsVGFibGVzO1xuXG4gICAgICAgIHRoaXMuX3RhYmxlRmFjdG9yeSA9IGZ1bmN0aW9uIGNyZWF0ZVRhYmxlKG1vZGUsIHRhYmxlU2NoZW1hLCB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5KSB7XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJ0YWJsZVNjaGVtYVwiIHR5cGU9XCJUYWJsZVNjaGVtYVwiPjwvcGFyYW0+XG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gUkVBRE9OTFkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUYWJsZSh0YWJsZVNjaGVtYS5uYW1lLCB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5LCB0YWJsZVNjaGVtYSwgQ29sbGVjdGlvbik7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBXcml0ZWFibGVUYWJsZSh0YWJsZVNjaGVtYS5uYW1lLCB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5LCB0YWJsZVNjaGVtYSk7XG4gICAgICAgIH07IFxuXG4gICAgICAgIHRoaXMuX2NyZWF0ZVRyYW5zYWN0aW9uID0gZnVuY3Rpb24gKG1vZGUsIHN0b3JlTmFtZXMsIGRic2NoZW1hLCBwYXJlbnRUcmFuc2FjdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbihtb2RlLCBzdG9yZU5hbWVzLCBkYnNjaGVtYSwgcGFyZW50VHJhbnNhY3Rpb24pO1xuICAgICAgICB9OyBcblxuICAgICAgICBmdW5jdGlvbiB0YWJsZU5vdEluVHJhbnNhY3Rpb24obW9kZSwgc3RvcmVOYW1lcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGFibGUgXCIgKyBzdG9yZU5hbWVzWzBdICsgXCIgbm90IHBhcnQgb2YgdHJhbnNhY3Rpb24uIE9yaWdpbmFsIFNjb3BlIEZ1bmN0aW9uIFNvdXJjZTogXCIgKyBEZXhpZS5Qcm9taXNlLlBTRC50cmFucy5zY29wZUZ1bmMudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl90cmFuc1Byb21pc2VGYWN0b3J5ID0gZnVuY3Rpb24gdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeShtb2RlLCBzdG9yZU5hbWVzLCBmbikgeyAvLyBMYXN0IGFyZ3VtZW50IGlzIFwid3JpdGVMb2NrZWRcIi4gQnV0IHRoaXMgZG9lc250IGFwcGx5IHRvIG9uZXNob3QgZGlyZWN0IGRiIG9wZXJhdGlvbnMsIHNvIHdlIGlnbm9yZSBpdC5cbiAgICAgICAgICAgIGlmIChkYl9pc19ibG9ja2VkICYmICghUHJvbWlzZS5QU0QgfHwgIVByb21pc2UuUFNELmxldFRocm91Z2gpKSB7XG4gICAgICAgICAgICAgICAgLy8gRGF0YWJhc2UgaXMgcGF1c2VkLiBXYWl0IHRpbCByZXN1bWVkLlxuICAgICAgICAgICAgICAgIHZhciBibG9ja2VkUHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF1c2VkUmVzdW1lYWJsZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IGRiLl90cmFuc1Byb21pc2VGYWN0b3J5KG1vZGUsIHN0b3JlTmFtZXMsIGZuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja2VkUHJvbWlzZS5vbnVuY2F0Y2hlZCA9IHAub251bmNhdGNoZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBibG9ja2VkUHJvbWlzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHRyYW5zID0gZGIuX2NyZWF0ZVRyYW5zYWN0aW9uKG1vZGUsIHN0b3JlTmFtZXMsIGdsb2JhbFNjaGVtYSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zLl9wcm9taXNlKG1vZGUsIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQW4gdW5jYXRjaGVkIG9wZXJhdGlvbiB3aWxsIGJ1YmJsZSB0byB0aGlzIGFub255bW91cyB0cmFuc2FjdGlvbi4gTWFrZSBzdXJlXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGNvbnRpbnVlIGJ1YmJsaW5nIGl0IHVwIHRvIGRiLm9uKCdlcnJvcicpOlxuICAgICAgICAgICAgICAgICAgICB0cmFucy5lcnJvcihmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYi5vbignZXJyb3InKS5maXJlKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBmbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluc3RlYWQgb2YgcmVzb2x2aW5nIHZhbHVlIGRpcmVjdGx5LCB3YWl0IHdpdGggcmVzb2x2aW5nIGl0IHVudGlsIHRyYW5zYWN0aW9uIGhhcyBjb21wbGV0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UgdGhlIGRhdGEgd291bGQgbm90IGJlIGluIHRoZSBEQiBpZiByZXF1ZXN0aW5nIGl0IGluIHRoZSB0aGVuKCkgb3BlcmF0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3BlY2lmaWNhbGx5LCB0byBlbnN1cmUgdGhhdCB0aGUgZm9sbG93aW5nIGV4cHJlc3Npb24gd2lsbCB3b3JrOlxuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgZGIuZnJpZW5kcy5wdXQoe25hbWU6IFwiQXJuZVwifSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICBkYi5mcmllbmRzLndoZXJlKFwibmFtZVwiKS5lcXVhbHMoXCJBcm5lXCIpLmNvdW50KGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgYXNzZXJ0IChjb3VudCA9PT0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuY29tcGxldGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCwgdHJhbnMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9OyBcblxuICAgICAgICB0aGlzLl93aGVuUmVhZHkgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgIGlmICghZmFrZSAmJiBkYl9pc19ibG9ja2VkICYmICghUHJvbWlzZS5QU0QgfHwgIVByb21pc2UuUFNELmxldFRocm91Z2gpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF1c2VkUmVzdW1lYWJsZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmbik7XG4gICAgICAgIH07IFxuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgICAgRGV4aWUgQVBJXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG5cbiAgICAgICAgdGhpcy52ZXJubyA9IDA7XG5cbiAgICAgICAgdGhpcy5vcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmFrZSkgcmVzb2x2ZShkYik7XG4gICAgICAgICAgICAgICAgaWYgKGlkYmRiIHx8IGlzQmVpbmdPcGVuZWQpIHRocm93IG5ldyBFcnJvcihcIkRhdGFiYXNlIGFscmVhZHkgb3BlbmVkIG9yIGJlaW5nIG9wZW5lZFwiKTtcbiAgICAgICAgICAgICAgICB2YXIgcmVxLCBkYldhc0NyZWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBvcGVuRXJyb3IoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7IHJlcS50cmFuc2FjdGlvbi5hYm9ydCgpOyB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgICAgICAgICAgLyppZiAoZGJXYXNDcmVhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXb3JrYXJvdW5kIGZvciBpc3N1ZSB3aXRoIHNvbWUgYnJvd3NlcnMuIFNlZW0gbm90IHRvIGJlIG5lZWRlZCB0aG91Z2guXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVbml0IHRlc3QgXCJJc3N1ZSMxMDAgLSBub3QgYWxsIGluZGV4ZXMgYXJlIGNyZWF0ZWRcIiB3b3JrcyB3aXRob3V0IGl0IG9uIGNocm9tZSxGRixvcGVyYSBhbmQgSUUuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZGJkYi5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhlZERCLmRlbGV0ZURhdGFiYXNlKGRiLm5hbWUpOyBcbiAgICAgICAgICAgICAgICAgICAgfSovXG4gICAgICAgICAgICAgICAgICAgIGlzQmVpbmdPcGVuZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZGJPcGVuRXJyb3IgPSBlcnI7XG4gICAgICAgICAgICAgICAgICAgIGRiX2lzX2Jsb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGRiT3BlbkVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcGF1c2VkUmVzdW1lYWJsZXMuZm9yRWFjaChmdW5jdGlvbiAocmVzdW1hYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXN1bWUgYWxsIHN0YWxsZWQgb3BlcmF0aW9ucy4gVGhleSB3aWxsIGZhaWwgb25jZSB0aGV5IHdha2UgdXAuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bWFibGUucmVzdW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBwYXVzZWRSZXN1bWVhYmxlcyA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBkYk9wZW5FcnJvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlzQmVpbmdPcGVuZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSBjYWxsZXIgaGFzIHNwZWNpZmllZCBhdCBsZWFzdCBvbmUgdmVyc2lvblxuICAgICAgICAgICAgICAgICAgICBpZiAodmVyc2lvbnMubGVuZ3RoID4gMCkgYXV0b1NjaGVtYSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIE11bHRpcGx5IGRiLnZlcm5vIHdpdGggMTAgd2lsbCBiZSBuZWVkZWQgdG8gd29ya2Fyb3VuZCB1cGdyYWRpbmcgYnVnIGluIElFOiBcbiAgICAgICAgICAgICAgICAgICAgLy8gSUUgZmFpbHMgd2hlbiBkZWxldGluZyBvYmplY3RTdG9yZSBhZnRlciByZWFkaW5nIGZyb20gaXQuXG4gICAgICAgICAgICAgICAgICAgIC8vIEEgZnV0dXJlIHZlcnNpb24gb2YgRGV4aWUuanMgd2lsbCBzdG9wb3ZlciBhbiBpbnRlcm1lZGlhdGUgdmVyc2lvbiB0byB3b3JrYXJvdW5kIHRoaXMuXG4gICAgICAgICAgICAgICAgICAgIC8vIEF0IHRoYXQgcG9pbnQsIHdlIHdhbnQgdG8gYmUgYmFja3dhcmQgY29tcGF0aWJsZS4gQ291bGQgaGF2ZSBiZWVuIG11bHRpcGxpZWQgd2l0aCAyLCBidXQgYnkgdXNpbmcgMTAsIGl0IGlzIGVhc2llciB0byBtYXAgdGhlIG51bWJlciB0byB0aGUgcmVhbCB2ZXJzaW9uIG51bWJlci5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbmRleGVkREIpIHRocm93IG5ldyBFcnJvcihcImluZGV4ZWREQiBBUEkgbm90IGZvdW5kLiBJZiB1c2luZyBJRTEwKywgbWFrZSBzdXJlIHRvIHJ1biB5b3VyIGNvZGUgb24gYSBzZXJ2ZXIgVVJMIChub3QgbG9jYWxseSkuIElmIHVzaW5nIFNhZmFyaSwgbWFrZSBzdXJlIHRvIGluY2x1ZGUgaW5kZXhlZERCIHBvbHlmaWxsLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgcmVxID0gYXV0b1NjaGVtYSA/IGluZGV4ZWREQi5vcGVuKGRiTmFtZSkgOiBpbmRleGVkREIub3BlbihkYk5hbWUsIE1hdGgucm91bmQoZGIudmVybm8gKiAxMCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcSkgdGhyb3cgbmV3IEVycm9yKFwiSW5kZXhlZERCIEFQSSBub3QgYXZhaWxhYmxlXCIpOyAvLyBNYXkgaGFwcGVuIGluIFNhZmFyaSBwcml2YXRlIG1vZGUsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vZGZhaGxhbmRlci9EZXhpZS5qcy9pc3N1ZXMvMTM0IFxuICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihvcGVuRXJyb3IsIFtcIm9wZW5pbmcgZGF0YWJhc2VcIiwgZGJOYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbmJsb2NrZWQgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRiLm9uKFwiYmxvY2tlZFwiKS5maXJlKGV2KTtcbiAgICAgICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbnVwZ3JhZGVuZWVkZWQgPSB0cnljYXRjaCAoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRvU2NoZW1hICYmICFkYi5fYWxsb3dFbXB0eURCKSB7IC8vIFVubGVzcyBhbiBhZGRvbiBoYXMgc3BlY2lmaWVkIGRiLl9hbGxvd0VtcHR5REIsIGxldHMgbWFrZSB0aGUgY2FsbCBmYWlsLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGxlciBkaWQgbm90IHNwZWNpZnkgYSB2ZXJzaW9uIG9yIHNjaGVtYS4gRG9pbmcgdGhhdCBpcyBvbmx5IGFjY2VwdGFibGUgZm9yIG9wZW5pbmcgYWxyZWFkIGV4aXN0aW5nIGRhdGFiYXNlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBvbnVwZ3JhZGVuZWVkZWQgaXMgY2FsbGVkIGl0IG1lYW5zIGRhdGFiYXNlIGRpZCBub3QgZXhpc3QuIFJlamVjdCB0aGUgb3BlbigpIHByb21pc2UgYW5kIG1ha2Ugc3VyZSB0aGF0IHdlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRvIG5vdCBjcmVhdGUgYSBuZXcgZGF0YWJhc2UgYnkgYWNjaWRlbnQgaGVyZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uIChldmVudCkgeyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyB9OyAvLyBQcm9oaWJpdCBvbmFib3J0IGVycm9yIGZyb20gZmlyaW5nIGJlZm9yZSB3ZSdyZSBkb25lIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS50cmFuc2FjdGlvbi5hYm9ydCgpOyAvLyBBYm9ydCB0cmFuc2FjdGlvbiAod291bGQgaG9wZSB0aGF0IHRoaXMgd291bGQgbWFrZSBEQiBkaXNhcHBlYXIgYnV0IGl0IGRvZXNudC4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xvc2UgZGF0YWJhc2UgYW5kIGRlbGV0ZSBpdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEucmVzdWx0LmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlbHJlcSA9IGluZGV4ZWREQi5kZWxldGVEYXRhYmFzZShkYk5hbWUpOyAvLyBUaGUgdXBncmFkZSB0cmFuc2FjdGlvbiBpcyBhdG9taWMsIGFuZCBqYXZhc2NyaXB0IGlzIHNpbmdsZSB0aHJlYWRlZCAtIG1lYW5pbmcgdGhhdCB0aGVyZSBpcyBubyByaXNrIHRoYXQgd2UgZGVsZXRlIHNvbWVvbmUgZWxzZXMgZGF0YWJhc2UgaGVyZSFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxyZXEub25zdWNjZXNzID0gZGVscmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5FcnJvcihuZXcgRXJyb3IoXCJEYXRhYmFzZSAnXCIgKyBkYk5hbWUgKyBcIicgZG9lc250IGV4aXN0XCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUub2xkVmVyc2lvbiA9PT0gMCkgZGJXYXNDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEudHJhbnNhY3Rpb24ub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihvcGVuRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRWZXIgPSBlLm9sZFZlcnNpb24gPiBNYXRoLnBvdygyLCA2MikgPyAwIDogZS5vbGRWZXJzaW9uOyAvLyBTYWZhcmkgOCBmaXguXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVuVXBncmFkZXJzKG9sZFZlciAvIDEwLCByZXEudHJhbnNhY3Rpb24sIG9wZW5FcnJvciwgcmVxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgb3BlbkVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IHRyeWNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0JlaW5nT3BlbmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZGJkYiA9IHJlcS5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXV0b1NjaGVtYSkgcmVhZEdsb2JhbFNjaGVtYSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoaWRiZGIub2JqZWN0U3RvcmVOYW1lcy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkanVzdFRvRXhpc3RpbmdJbmRleE5hbWVzKGdsb2JhbFNjaGVtYSwgaWRiZGIudHJhbnNhY3Rpb24oc2FmYXJpTXVsdGlTdG9yZUZpeChpZGJkYi5vYmplY3RTdG9yZU5hbWVzKSwgUkVBRE9OTFkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkYmRiLm9udmVyc2lvbmNoYW5nZSA9IGRiLm9uKFwidmVyc2lvbmNoYW5nZVwiKS5maXJlOyAvLyBOb3QgZmlyaW5nIGl0IGhlcmUsIGp1c3Qgc2V0dGluZyB0aGUgZnVuY3Rpb24gY2FsbGJhY2sgdG8gYW55IHJlZ2lzdGVyZWQgc3Vic2NyaWJlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGFzTmF0aXZlR2V0RGF0YWJhc2VOYW1lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBsb2NhbFN0b3JhZ2Ugd2l0aCBsaXN0IG9mIGRhdGFiYXNlIG5hbWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsRGF0YWJhc2VMaXN0KGZ1bmN0aW9uIChkYXRhYmFzZU5hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhYmFzZU5hbWVzLmluZGV4T2YoZGJOYW1lKSA9PT0gLTEpIHJldHVybiBkYXRhYmFzZU5hbWVzLnB1c2goZGJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdywgbGV0IGFueSBzdWJzY3JpYmVycyB0byB0aGUgb24oXCJyZWFkeVwiKSBmaXJlIEJFRk9SRSBhbnkgb3RoZXIgZGIgb3BlcmF0aW9ucyByZXN1bWUhXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBhbiB0aGUgb24oXCJyZWFkeVwiKSBzdWJzY3JpYmVyIHJldHVybnMgYSBQcm9taXNlLCB3ZSB3aWxsIHdhaXQgdGlsIHByb21pc2UgY29tcGxldGVzIG9yIHJlamVjdHMgYmVmb3JlIFxuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5uZXdQU0QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuUFNELmxldFRocm91Z2ggPSB0cnVlOyAvLyBTZXQgYSBQcm9taXNlLVNwZWNpZmljIERhdGEgcHJvcGVydHkgaW5mb3JtaW5nIHRoYXQgb25yZWFkeSBpcyBmaXJpbmcuIFRoaXMgd2lsbCBtYWtlIGRiLl93aGVuUmVhZHkoKSBsZXQgdGhlIHN1YnNjcmliZXJzIHVzZSB0aGUgREIgYnV0IGJsb2NrIGFsbCBvdGhlcnMgKCEpLiBRdWl0ZSBjb29sIGhhP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXMgPSBkYi5vbi5yZWFkeS5maXJlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXMgJiYgdHlwZW9mIHJlcy50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBvbigncmVhZHknKSByZXR1cm5zIGEgcHJvbWlzZSwgd2FpdCBmb3IgaXQgdG8gY29tcGxldGUgYW5kIHRoZW4gcmVzdW1lIGFueSBwZW5kaW5nIG9wZXJhdGlvbnMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMudGhlbihyZXN1bWUsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGJkYi5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkYmRiID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNhcChyZXN1bWUpOyAvLyBDYW5ub3QgY2FsbCByZXN1bWUgZGlyZWN0bHkgYmVjYXVzZSB0aGVuIHRoZSBwYXVzZVJlc3VtYWJsZXMgd291bGQgaW5oZXJpdCBmcm9tIG91ciBQU0Qgc2NvcGUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5FcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiByZXN1bWUoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRiX2lzX2Jsb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF1c2VkUmVzdW1lYWJsZXMuZm9yRWFjaChmdW5jdGlvbiAocmVzdW1hYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBhbnlvbmUgaGFzIG1hZGUgb3BlcmF0aW9ucyBvbiBhIHRhYmxlIGluc3RhbmNlIGJlZm9yZSB0aGUgZGIgd2FzIG9wZW5lZCwgdGhlIG9wZXJhdGlvbnMgd2lsbCBzdGFydCBleGVjdXRpbmcgbm93LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdW1hYmxlLnJlc3VtZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF1c2VkUmVzdW1lYWJsZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIG9wZW5FcnJvcik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5FcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9OyBcblxuICAgICAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGlkYmRiKSB7XG4gICAgICAgICAgICAgICAgaWRiZGIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBpZGJkYiA9IG51bGw7XG4gICAgICAgICAgICAgICAgZGJfaXNfYmxvY2tlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZGJPcGVuRXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9OyBcblxuICAgICAgICB0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPiAwKSB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudHMgbm90IGFsbG93ZWQgaW4gZGIuZGVsZXRlKClcIik7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZG9EZWxldGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGRiLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXEgPSBpbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoZGJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaGFzTmF0aXZlR2V0RGF0YWJhc2VOYW1lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsb2JhbERhdGFiYXNlTGlzdChmdW5jdGlvbihkYXRhYmFzZU5hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwb3MgPSBkYXRhYmFzZU5hbWVzLmluZGV4T2YoZGJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvcyA+PSAwKSByZXR1cm4gZGF0YWJhc2VOYW1lcy5zcGxpY2UocG9zLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBbXCJkZWxldGluZ1wiLCBkYk5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uYmxvY2tlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGIub24oXCJibG9ja2VkXCIpLmZpcmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlzQmVpbmdPcGVuZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF1c2VkUmVzdW1lYWJsZXMucHVzaCh7IHJlc3VtZTogZG9EZWxldGUgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZG9EZWxldGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTsgXG5cbiAgICAgICAgdGhpcy5iYWNrZW5kREIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaWRiZGI7XG4gICAgICAgIH07IFxuXG4gICAgICAgIHRoaXMuaXNPcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGlkYmRiICE9PSBudWxsO1xuICAgICAgICB9OyBcbiAgICAgICAgdGhpcy5oYXNGYWlsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZGJPcGVuRXJyb3IgIT09IG51bGw7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZHluYW1pY2FsbHlPcGVuZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBhdXRvU2NoZW1hO1xuICAgICAgICB9XG5cbiAgICAgICAgLyp0aGlzLmRiZyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjb3VudGVyKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2RiZ1Jlc3VsdCB8fCAhdGhpcy5fZGJnUmVzdWx0W2NvdW50ZXJdKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2xsZWN0aW9uID09PSAnc3RyaW5nJykgY29sbGVjdGlvbiA9IHRoaXMudGFibGUoY29sbGVjdGlvbikudG9Db2xsZWN0aW9uKCkubGltaXQoMTAwKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2RiZ1Jlc3VsdCkgdGhpcy5fZGJnUmVzdWx0ID0gW107XG4gICAgICAgICAgICAgICAgdmFyIGRiID0gdGhpcztcbiAgICAgICAgICAgICAgICBuZXcgUHJvbWlzZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIFByb21pc2UuUFNELmxldFRocm91Z2ggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBkYi5fZGJnUmVzdWx0W2NvdW50ZXJdID0gY29sbGVjdGlvbi50b0FycmF5KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGJnUmVzdWx0W2NvdW50ZXJdLl92YWx1ZTtcbiAgICAgICAgfSovXG5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gUHJvcGVydGllc1xuICAgICAgICAvL1xuICAgICAgICB0aGlzLm5hbWUgPSBkYk5hbWU7XG5cbiAgICAgICAgLy8gZGIudGFibGVzIC0gYW4gYXJyYXkgb2YgYWxsIFRhYmxlIGluc3RhbmNlcy5cbiAgICAgICAgLy8gVE9ETzogQ2hhbmdlIHNvIHRoYXQgdGFibGVzIGlzIGEgc2ltcGxlIG1lbWJlciBhbmQgbWFrZSBzdXJlIHRvIHVwZGF0ZSBpdCB3aGVuZXZlciBhbGxUYWJsZXMgY2hhbmdlcy5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidGFibGVzXCIsIHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwiQXJyYXlcIiBlbGVtZW50VHlwZT1cIldyaXRlYWJsZVRhYmxlXCIgLz5cbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoYWxsVGFibGVzKS5tYXAoZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIGFsbFRhYmxlc1tuYW1lXTsgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEV2ZW50c1xuICAgICAgICAvL1xuICAgICAgICB0aGlzLm9uID0gZXZlbnRzKHRoaXMsIFwiZXJyb3JcIiwgXCJwb3B1bGF0ZVwiLCBcImJsb2NrZWRcIiwgeyBcInJlYWR5XCI6IFtwcm9taXNhYmxlQ2hhaW4sIG5vcF0sIFwidmVyc2lvbmNoYW5nZVwiOiBbcmV2ZXJzZVN0b3BwYWJsZUV2ZW50Q2hhaW4sIG5vcF0gfSk7XG5cbiAgICAgICAgLy8gSGFuZGxlIG9uKCdyZWFkeScpIHNwZWNpZmljYWxseTogSWYgREIgaXMgYWxyZWFkeSBvcGVuLCB0cmlnZ2VyIHRoZSBldmVudCBpbW1lZGlhdGVseS4gQWxzbywgZGVmYXVsdCB0byB1bnN1YnNjcmliZSBpbW1lZGlhdGVseSBhZnRlciBiZWluZyB0cmlnZ2VyZWQuXG4gICAgICAgIHRoaXMub24ucmVhZHkuc3Vic2NyaWJlID0gb3ZlcnJpZGUodGhpcy5vbi5yZWFkeS5zdWJzY3JpYmUsIGZ1bmN0aW9uIChvcmlnU3Vic2NyaWJlKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHN1YnNjcmliZXIsIGJTdGlja3kpIHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBwcm94eSAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYlN0aWNreSkgZGIub24ucmVhZHkudW5zdWJzY3JpYmUocHJveHkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2NyaWJlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvcmlnU3Vic2NyaWJlLmNhbGwodGhpcywgcHJveHkpO1xuICAgICAgICAgICAgICAgIGlmIChkYi5pc09wZW4oKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGJfaXNfYmxvY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF1c2VkUmVzdW1lYWJsZXMucHVzaCh7IHJlc3VtZTogcHJveHkgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm94eSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZmFrZUF1dG9Db21wbGV0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkYi5vbihcInBvcHVsYXRlXCIpLmZpcmUoZGIuX2NyZWF0ZVRyYW5zYWN0aW9uKFJFQURXUklURSwgZGJTdG9yZU5hbWVzLCBnbG9iYWxTY2hlbWEpKTtcbiAgICAgICAgICAgIGRiLm9uKFwiZXJyb3JcIikuZmlyZShuZXcgRXJyb3IoKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb24gPSBmdW5jdGlvbiAobW9kZSwgdGFibGVJbnN0YW5jZXMsIHNjb3BlRnVuYykge1xuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAgICAgLy8vIFxuICAgICAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm1vZGVcIiB0eXBlPVwiU3RyaW5nXCI+XCJyXCIgZm9yIHJlYWRvbmx5LCBvciBcInJ3XCIgZm9yIHJlYWR3cml0ZTwvcGFyYW0+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJ0YWJsZUluc3RhbmNlc1wiPlRhYmxlIGluc3RhbmNlLCBBcnJheSBvZiBUYWJsZSBpbnN0YW5jZXMsIFN0cmluZyBvciBTdHJpbmcgQXJyYXkgb2Ygb2JqZWN0IHN0b3JlcyB0byBpbmNsdWRlIGluIHRoZSB0cmFuc2FjdGlvbjwvcGFyYW0+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJzY29wZUZ1bmNcIiB0eXBlPVwiRnVuY3Rpb25cIj5GdW5jdGlvbiB0byBleGVjdXRlIHdpdGggdHJhbnNhY3Rpb248L3BhcmFtPlxuXG4gICAgICAgICAgICAvLyBMZXQgdGFibGUgYXJndW1lbnRzIGJlIGFsbCBhcmd1bWVudHMgYmV0d2VlbiBtb2RlIGFuZCBsYXN0IGFyZ3VtZW50LlxuICAgICAgICAgICAgdGFibGVJbnN0YW5jZXMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgLy8gTGV0IHNjb3BlRnVuYyBiZSB0aGUgbGFzdCBhcmd1bWVudFxuICAgICAgICAgICAgc2NvcGVGdW5jID0gYXJndW1lbnRzW2FyZ3VtZW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIHZhciBwYXJlbnRUcmFuc2FjdGlvbiA9IFByb21pc2UuUFNEICYmIFByb21pc2UuUFNELnRyYW5zO1xuXHRcdFx0Ly8gQ2hlY2sgaWYgcGFyZW50IHRyYW5zYWN0aW9ucyBpcyBib3VuZCB0byB0aGlzIGRiIGluc3RhbmNlLCBhbmQgaWYgY2FsbGVyIHdhbnRzIHRvIHJldXNlIGl0XG4gICAgICAgICAgICBpZiAoIXBhcmVudFRyYW5zYWN0aW9uIHx8IHBhcmVudFRyYW5zYWN0aW9uLmRiICE9PSBkYiB8fCBtb2RlLmluZGV4T2YoJyEnKSAhPT0gLTEpIHBhcmVudFRyYW5zYWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBvbmx5SWZDb21wYXRpYmxlID0gbW9kZS5pbmRleE9mKCc/JykgIT09IC0xO1xuICAgICAgICAgICAgbW9kZSA9IG1vZGUucmVwbGFjZSgnIScsICcnKS5yZXBsYWNlKCc/JywgJycpO1xuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEdldCBzdG9yZU5hbWVzIGZyb20gYXJndW1lbnRzLiBFaXRoZXIgdGhyb3VnaCBnaXZlbiB0YWJsZSBpbnN0YW5jZXMsIG9yIHRocm91Z2ggZ2l2ZW4gdGFibGUgbmFtZXMuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgdmFyIHRhYmxlcyA9IEFycmF5LmlzQXJyYXkodGFibGVJbnN0YW5jZXNbMF0pID8gdGFibGVJbnN0YW5jZXMucmVkdWNlKGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLmNvbmNhdChiKTsgfSkgOiB0YWJsZUluc3RhbmNlcztcbiAgICAgICAgICAgIHZhciBlcnJvciA9IG51bGw7XG4gICAgICAgICAgICB2YXIgc3RvcmVOYW1lcyA9IHRhYmxlcy5tYXAoZnVuY3Rpb24gKHRhYmxlSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRhYmxlSW5zdGFuY2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhYmxlSW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodGFibGVJbnN0YW5jZSBpbnN0YW5jZW9mIFRhYmxlKSkgZXJyb3IgPSBlcnJvciB8fCBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCB0eXBlLiBBcmd1bWVudHMgZm9sbG93aW5nIG1vZGUgbXVzdCBiZSBpbnN0YW5jZXMgb2YgVGFibGUgb3IgU3RyaW5nXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFibGVJbnN0YW5jZS5uYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gUmVzb2x2ZSBtb2RlLiBBbGxvdyBzaG9ydGN1dHMgXCJyXCIgYW5kIFwicndcIi5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICBpZiAobW9kZSA9PSBcInJcIiB8fCBtb2RlID09IFJFQURPTkxZKVxuICAgICAgICAgICAgICAgIG1vZGUgPSBSRUFET05MWTtcbiAgICAgICAgICAgIGVsc2UgaWYgKG1vZGUgPT0gXCJyd1wiIHx8IG1vZGUgPT0gUkVBRFdSSVRFKVxuICAgICAgICAgICAgICAgIG1vZGUgPSBSRUFEV1JJVEU7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoXCJJbnZhbGlkIHRyYW5zYWN0aW9uIG1vZGU6IFwiICsgbW9kZSk7XG5cbiAgICAgICAgICAgIGlmIChwYXJlbnRUcmFuc2FjdGlvbikge1xuICAgICAgICAgICAgICAgIC8vIEJhc2ljIGNoZWNrc1xuICAgICAgICAgICAgICAgIGlmICghZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudFRyYW5zYWN0aW9uICYmIHBhcmVudFRyYW5zYWN0aW9uLm1vZGUgPT09IFJFQURPTkxZICYmIG1vZGUgPT09IFJFQURXUklURSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlJZkNvbXBhdGlibGUpIHBhcmVudFRyYW5zYWN0aW9uID0gbnVsbDsgLy8gU3Bhd24gbmV3IHRyYW5zYWN0aW9uIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGVycm9yID0gZXJyb3IgfHwgbmV3IEVycm9yKFwiQ2Fubm90IGVudGVyIGEgc3ViLXRyYW5zYWN0aW9uIHdpdGggUkVBRFdSSVRFIG1vZGUgd2hlbiBwYXJlbnQgdHJhbnNhY3Rpb24gaXMgUkVBRE9OTFlcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudFRyYW5zYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yZU5hbWVzLmZvckVhY2goZnVuY3Rpb24gKHN0b3JlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGFyZW50VHJhbnNhY3Rpb24udGFibGVzLmhhc093blByb3BlcnR5KHN0b3JlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlJZkNvbXBhdGlibGUpIHBhcmVudFRyYW5zYWN0aW9uID0gbnVsbDsgLy8gU3Bhd24gbmV3IHRyYW5zYWN0aW9uIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgZXJyb3IgPSBlcnJvciB8fCBuZXcgRXJyb3IoXCJUYWJsZSBcIiArIHN0b3JlTmFtZSArIFwiIG5vdCBpbmNsdWRlZCBpbiBwYXJlbnQgdHJhbnNhY3Rpb24uIFBhcmVudCBUcmFuc2FjdGlvbiBmdW5jdGlvbjogXCIgKyBwYXJlbnRUcmFuc2FjdGlvbi5zY29wZUZ1bmMudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGFyZW50VHJhbnNhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgc3ViLXRyYW5zYWN0aW9uLCBsb2NrIHRoZSBwYXJlbnQgYW5kIHRoZW4gbGF1bmNoIHRoZSBzdWItdHJhbnNhY3Rpb24uXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudFRyYW5zYWN0aW9uLl9wcm9taXNlKG1vZGUsIGVudGVyVHJhbnNhY3Rpb25TY29wZSwgXCJsb2NrXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgcm9vdC1sZXZlbCB0cmFuc2FjdGlvbiwgd2FpdCB0aWwgZGF0YWJhc2UgaXMgcmVhZHkgYW5kIHRoZW4gbGF1bmNoIHRoZSB0cmFuc2FjdGlvbi5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuX3doZW5SZWFkeShlbnRlclRyYW5zYWN0aW9uU2NvcGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmdW5jdGlvbiBlbnRlclRyYW5zYWN0aW9uU2NvcGUocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgLy8gT3VyIHRyYW5zYWN0aW9uLiBUbyBiZSBzZXQgbGF0ZXIuXG4gICAgICAgICAgICAgICAgdmFyIHRyYW5zID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRocm93IGFueSBlcnJvciBpZiBhbnkgb2YgdGhlIGFib3ZlIGNoZWNrcyBmYWlsZWQuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlYWwgZXJyb3IgZGVmaW5lZCBzb21lIGxpbmVzIHVwLiBXZSB0aHJvdyBpdCBoZXJlIGZyb20gd2l0aGluIGEgUHJvbWlzZSB0byByZWplY3QgUHJvbWlzZVxuICAgICAgICAgICAgICAgICAgICAvLyByYXRoZXIgdGhhbiBtYWtlIGNhbGxlciBuZWVkIHRvIGJvdGggdXNlIHRyeS4uY2F0Y2ggYW5kIHByb21pc2UgY2F0Y2hpbmcuIFRoZSByZWFzb24gd2Ugc3RpbGxcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhyb3cgaGVyZSByYXRoZXIgdGhhbiBkbyBQcm9taXNlLnJlamVjdChlcnJvcikgaXMgdGhhdCB3ZSBsaWtlIHRvIGhhdmUgdGhlIHN0YWNrIGF0dGFjaGVkIHRvIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBlcnJvci4gQWxzbyBiZWNhdXNlIHRoZXJlIGlzIGEgY2F0Y2goKSBjbGF1c2UgYm91bmQgdG8gdGhpcyB0cnkoKSB0aGF0IHdpbGwgYnViYmxlIHRoZSBlcnJvclxuICAgICAgICAgICAgICAgICAgICAvLyB0byB0aGUgcGFyZW50IHRyYW5zYWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBUcmFuc2FjdGlvbiBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICB0cmFucyA9IGRiLl9jcmVhdGVUcmFuc2FjdGlvbihtb2RlLCBzdG9yZU5hbWVzLCBnbG9iYWxTY2hlbWEsIHBhcmVudFRyYW5zYWN0aW9uKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBQcm92aWRlIGFyZ3VtZW50cyB0byB0aGUgc2NvcGUgZnVuY3Rpb24gKGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5KVxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFibGVBcmdzID0gc3RvcmVOYW1lcy5tYXAoZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIHRyYW5zLnRhYmxlc1tuYW1lXTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRhYmxlQXJncy5wdXNoKHRyYW5zKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0cmFuc2FjdGlvbiBjb21wbGV0ZXMsIHJlc29sdmUgdGhlIFByb21pc2Ugd2l0aCB0aGUgcmV0dXJuIHZhbHVlIG9mIHNjb3BlRnVuYy5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHJldHVyblZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdW5jb21wbGV0ZWRSZXF1ZXN0cyA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IFBTRCBmcmFtZSB0byBob2xkIFByb21pc2UuUFNELnRyYW5zLiBNdXN0IG5vdCBiZSBib3VuZCB0byB0aGUgY3VycmVudCBQU0QgZnJhbWUgc2luY2Ugd2Ugd2FudFxuICAgICAgICAgICAgICAgICAgICAvLyBpdCB0byBwb3AgYmVmb3JlIHRoZW4oKSBjYWxsYmFjayBpcyBjYWxsZWQgb2Ygb3VyIHJldHVybmVkIFByb21pc2UuXG4gICAgICAgICAgICAgICAgICAgIFByb21pc2UubmV3UFNEKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIExldCB0aGUgdHJhbnNhY3Rpb24gaW5zdGFuY2UgYmUgcGFydCBvZiBhIFByb21pc2Utc3BlY2lmaWMgZGF0YSAoUFNEKSB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuUFNELnRyYW5zID0gdHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5zY29wZUZ1bmMgPSBzY29wZUZ1bmM7IC8vIEZvciBFcnJvciAoXCJUYWJsZSBcIiArIHN0b3JlTmFtZXNbMF0gKyBcIiBub3QgcGFydCBvZiB0cmFuc2FjdGlvblwiKSB3aGVuIGl0IGhhcHBlbnMuIFRoaXMgbWF5IGhlbHAgbG9jYWxpemluZyB0aGUgY29kZSB0aGF0IHN0YXJ0ZWQgYSB0cmFuc2FjdGlvbiB1c2VkIG9uIGFub3RoZXIgcGxhY2UuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnRUcmFuc2FjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVtdWxhdGUgdHJhbnNhY3Rpb24gY29tbWl0IGF3YXJlbmVzcyBmb3IgaW5uZXIgdHJhbnNhY3Rpb24gKG11c3QgJ2NvbW1pdCcgd2hlbiB0aGUgaW5uZXIgdHJhbnNhY3Rpb24gaGFzIG5vIG1vcmUgb3BlcmF0aW9ucyBvbmdvaW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLmlkYnRyYW5zID0gcGFyZW50VHJhbnNhY3Rpb24uaWRidHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuX3Byb21pc2UgPSBvdmVycmlkZSh0cmFucy5fcHJvbWlzZSwgZnVuY3Rpb24gKG9yaWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChtb2RlLCBmbiwgd3JpdGVMb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArK3VuY29tcGxldGVkUmVxdWVzdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBwcm94eShmbjIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmV0dmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBfcm9vdEV4ZWMgbmVlZGVkIHNvIHRoYXQgd2UgZG8gbm90IGxvb3NlIGFueSBJREJUcmFuc2FjdGlvbiBpbiBhIHNldFRpbWVvdXQoKSBjYWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLl9yb290RXhlYyhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR2YWwgPSBmbjIodmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIF90aWNrRmluYWxpemUgbWFrZXMgc3VyZSB0byBzdXBwb3J0IGxhenkgbWljcm8gdGFza3MgZXhlY3V0ZWQgaW4gUHJvbWlzZS5fcm9vdEV4ZWMoKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGNlcnRhaW5seSBkbyBub3Qgd2FudCB0byBjb3B5IHRoZSBiYWQgcGF0dGVybiBmcm9tIEluZGV4ZWREQiBidXQgaW5zdGVhZCBhbGxvd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhlY3V0aW9uIG9mIFByb21pc2UudGhlbigpIGNhbGxiYWNrcyB1bnRpbCB0aGUncmUgYWxsIGRvbmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLl90aWNrRmluYWxpemUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgtLXVuY29tcGxldGVkUmVxdWVzdHMgPT09IDAgJiYgdHJhbnMuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5vbi5jb21wbGV0ZS5maXJlKCk7IC8vIEEgY2FsbGVkIGRiIG9wZXJhdGlvbiBoYXMgY29tcGxldGVkIHdpdGhvdXQgc3RhcnRpbmcgYSBuZXcgb3BlcmF0aW9uLiBUaGUgZmxvdyBpcyBmaW5pc2hlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3JpZy5jYWxsKHRoaXMsIG1vZGUsIGZ1bmN0aW9uIChyZXNvbHZlMiwgcmVqZWN0MiwgdHJhbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4ocHJveHkocmVzb2x2ZTIpLCBwcm94eShyZWplY3QyKSwgdHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgd3JpdGVMb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLmNvbXBsZXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJldHVyblZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdHJhbnNhY3Rpb24gZmFpbHMsIHJlamVjdCB0aGUgUHJvbWlzZSBhbmQgYnViYmxlIHRvIGRiIGlmIG5vb25lIGNhdGNoZWQgdGhpcyByZWplY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5lcnJvcihmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0cmFucy5pZGJ0cmFucykgdHJhbnMuaWRidHJhbnMub25lcnJvciA9IHByZXZlbnREZWZhdWx0OyAvLyBQcm9oaWJpdCBBYm9ydEVycm9yIGZyb20gZmlyaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7dHJhbnMuYWJvcnQoKTt9IGNhdGNoKGUyKXt9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudFRyYW5zYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFRyYW5zYWN0aW9uLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRUcmFuc2FjdGlvbi5vbi5lcnJvci5maXJlKGUpOyAvLyBCdWJibGUgdG8gcGFyZW50IHRyYW5zYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjYXRjaGVkID0gcmVqZWN0KGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGFyZW50VHJhbnNhY3Rpb24gJiYgIWNhdGNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGIub24uZXJyb3IuZmlyZShlKTsvLyBJZiBub3QgY2F0Y2hlZCwgYnViYmxlIGVycm9yIHRvIGRiLm9uKFwiZXJyb3JcIikuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmFsbHksIGNhbGwgdGhlIHNjb3BlIGZ1bmN0aW9uIHdpdGggb3VyIHRhYmxlIGFuZCB0cmFuc2FjdGlvbiBhcmd1bWVudHMuXG4gICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLl9yb290RXhlYyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHNjb3BlRnVuYy5hcHBseSh0cmFucywgdGFibGVBcmdzKTsgLy8gTk9URTogcmV0dXJuVmFsdWUgaXMgdXNlZCBpbiB0cmFucy5vbi5jb21wbGV0ZSgpIG5vdCBhcyBhIHJldHVyblZhbHVlIHRvIHRoaXMgZnVuYy5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0cmFucy5pZGJ0cmFucyB8fCAocGFyZW50VHJhbnNhY3Rpb24gJiYgdW5jb21wbGV0ZWRSZXF1ZXN0cyA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLl9ub3AoKTsgLy8gTWFrZSBzdXJlIHRyYW5zYWN0aW9uIGlzIGJlaW5nIHVzZWQgc28gdGhhdCBpdCB3aWxsIHJlc29sdmUuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGV4Y2VwdGlvbiBvY2N1ciwgYWJvcnQgdGhlIHRyYW5zYWN0aW9uIGFuZCByZWplY3QgUHJvbWlzZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zICYmIHRyYW5zLmlkYnRyYW5zKSB0cmFucy5pZGJ0cmFucy5vbmVycm9yID0gcHJldmVudERlZmF1bHQ7IC8vIFByb2hpYml0IEFib3J0RXJyb3IgZnJvbSBmaXJpbmcuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFucykgdHJhbnMuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudFRyYW5zYWN0aW9uKSBwYXJlbnRUcmFuc2FjdGlvbi5vbi5lcnJvci5maXJlKGUpO1xuICAgICAgICAgICAgICAgICAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5lZWQgdG8gdXNlIGFzYXAoPXNldEltbWVkaWF0ZS9zZXRUaW1lb3V0KSBiZWZvcmUgY2FsbGluZyByZWplY3QgYmVjYXVzZSB3ZSBhcmUgaW4gdGhlIFByb21pc2UgY29uc3RydWN0b3IgYW5kIHJlamVjdCgpIHdpbGwgYWx3YXlzIHJldHVybiBmYWxzZSBpZiBzby5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVqZWN0KGUpKSBkYi5vbihcImVycm9yXCIpLmZpcmUoZSk7IC8vIElmIG5vdCBjYXRjaGVkLCBidWJibGUgZXhjZXB0aW9uIHRvIGRiLm9uKFwiZXJyb3JcIik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTsgXG5cbiAgICAgICAgdGhpcy50YWJsZSA9IGZ1bmN0aW9uICh0YWJsZU5hbWUpIHtcbiAgICAgICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwiV3JpdGVhYmxlVGFibGVcIj48L3JldHVybnM+XG4gICAgICAgICAgICBpZiAoZmFrZSAmJiBhdXRvU2NoZW1hKSByZXR1cm4gbmV3IFdyaXRlYWJsZVRhYmxlKHRhYmxlTmFtZSk7XG4gICAgICAgICAgICBpZiAoIWFsbFRhYmxlcy5oYXNPd25Qcm9wZXJ0eSh0YWJsZU5hbWUpKSB7IHRocm93IG5ldyBFcnJvcihcIlRhYmxlIGRvZXMgbm90IGV4aXN0XCIpOyByZXR1cm4geyBBTl9VTktOT1dOX1RBQkxFX05BTUVfV0FTX1NQRUNJRklFRDogMSB9OyB9XG4gICAgICAgICAgICByZXR1cm4gYWxsVGFibGVzW3RhYmxlTmFtZV07XG4gICAgICAgIH07XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGFibGUgQ2xhc3NcbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgZnVuY3Rpb24gVGFibGUobmFtZSwgdHJhbnNhY3Rpb25Qcm9taXNlRmFjdG9yeSwgdGFibGVTY2hlbWEsIGNvbGxDbGFzcykge1xuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwibmFtZVwiIHR5cGU9XCJTdHJpbmdcIj48L3BhcmFtPlxuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgIHRoaXMuc2NoZW1hID0gdGFibGVTY2hlbWE7XG4gICAgICAgICAgICB0aGlzLmhvb2sgPSBhbGxUYWJsZXNbbmFtZV0gPyBhbGxUYWJsZXNbbmFtZV0uaG9vayA6IGV2ZW50cyhudWxsLCB7XG4gICAgICAgICAgICAgICAgXCJjcmVhdGluZ1wiOiBbaG9va0NyZWF0aW5nQ2hhaW4sIG5vcF0sXG4gICAgICAgICAgICAgICAgXCJyZWFkaW5nXCI6IFtwdXJlRnVuY3Rpb25DaGFpbiwgbWlycm9yXSxcbiAgICAgICAgICAgICAgICBcInVwZGF0aW5nXCI6IFtob29rVXBkYXRpbmdDaGFpbiwgbm9wXSxcbiAgICAgICAgICAgICAgICBcImRlbGV0aW5nXCI6IFtub25TdG9wcGFibGVFdmVudENoYWluLCBub3BdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX3RwZiA9IHRyYW5zYWN0aW9uUHJvbWlzZUZhY3Rvcnk7XG4gICAgICAgICAgICB0aGlzLl9jb2xsQ2xhc3MgPSBjb2xsQ2xhc3MgfHwgQ29sbGVjdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4dGVuZChUYWJsZS5wcm90b3R5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGZhaWxSZWFkb25seSgpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDdXJyZW50IFRyYW5zYWN0aW9uIGlzIFJFQURPTkxZXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8vIFRhYmxlIFByb3RlY3RlZCBNZXRob2RzXG4gICAgICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgICAgIF90cmFuczogZnVuY3Rpb24gZ2V0VHJhbnNhY3Rpb24obW9kZSwgZm4sIHdyaXRlTG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl90cGYobW9kZSwgW3RoaXMubmFtZV0sIGZuLCB3cml0ZUxvY2tlZCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfaWRic3RvcmU6IGZ1bmN0aW9uIGdldElEQk9iamVjdFN0b3JlKG1vZGUsIGZuLCB3cml0ZUxvY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmFrZSkgcmV0dXJuIG5ldyBQcm9taXNlKGZuKTsgLy8gU2ltcGxpZnkgdGhlIHdvcmsgZm9yIEludGVsbGlzZW5zZS9Db2RlIGNvbXBsZXRpb24uXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RwZihtb2RlLCBbdGhpcy5uYW1lXSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgdHJhbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuKHJlc29sdmUsIHJlamVjdCwgdHJhbnMuaWRidHJhbnMub2JqZWN0U3RvcmUoc2VsZi5uYW1lKSwgdHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICB9LCB3cml0ZUxvY2tlZCk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gVGFibGUgUHVibGljIE1ldGhvZHNcbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKGtleSwgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faWRic3RvcmUoUkVBRE9OTFksIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmYWtlICYmIHJlc29sdmUoc2VsZi5zY2hlbWEuaW5zdGFuY2VUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVxID0gaWRic3RvcmUuZ2V0KGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIFtcImdldHRpbmdcIiwga2V5LCBcImZyb21cIiwgc2VsZi5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc2VsZi5ob29rLnJlYWRpbmcuZmlyZShyZXEucmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHdoZXJlOiBmdW5jdGlvbiAoaW5kZXhOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgV2hlcmVDbGF1c2UodGhpcywgaW5kZXhOYW1lKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNvdW50OiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9Db2xsZWN0aW9uKCkuY291bnQoY2IpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvQ29sbGVjdGlvbigpLm9mZnNldChvZmZzZXQpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbGltaXQ6IGZ1bmN0aW9uIChudW1Sb3dzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvQ29sbGVjdGlvbigpLmxpbWl0KG51bVJvd3MpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmV2ZXJzZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50b0NvbGxlY3Rpb24oKS5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uIChmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50b0NvbGxlY3Rpb24oKS5hbmQoZmlsdGVyRnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZWFjaDogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgZmFrZSAmJiBmbihzZWxmLnNjaGVtYS5pbnN0YW5jZVRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lkYnN0b3JlKFJFQURPTkxZLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcSA9IGlkYnN0b3JlLm9wZW5DdXJzb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgW1wiY2FsbGluZ1wiLCBcIlRhYmxlLmVhY2goKVwiLCBcIm9uXCIsIHNlbGYubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZShyZXEsIG51bGwsIGZuLCByZXNvbHZlLCByZWplY3QsIHNlbGYuaG9vay5yZWFkaW5nLmZpcmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRvQXJyYXk6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pZGJzdG9yZShSRUFET05MWSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZha2UgJiYgcmVzb2x2ZShbc2VsZi5zY2hlbWEuaW5zdGFuY2VUZW1wbGF0ZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXEgPSBpZGJzdG9yZS5vcGVuQ3Vyc29yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIFtcImNhbGxpbmdcIiwgXCJUYWJsZS50b0FycmF5KClcIiwgXCJvblwiLCBzZWxmLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGUocmVxLCBudWxsLCBmdW5jdGlvbiAoaXRlbSkgeyBhLnB1c2goaXRlbSk7IH0sIGZ1bmN0aW9uICgpIHsgcmVzb2x2ZShhKTsgfSwgcmVqZWN0LCBzZWxmLmhvb2sucmVhZGluZy5maXJlKTtcbiAgICAgICAgICAgICAgICAgICAgfSkudGhlbihjYik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvcmRlckJ5OiBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLl9jb2xsQ2xhc3MobmV3IFdoZXJlQ2xhdXNlKHRoaXMsIGluZGV4KSk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHRvQ29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuX2NvbGxDbGFzcyhuZXcgV2hlcmVDbGF1c2UodGhpcykpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBtYXBUb0NsYXNzOiBmdW5jdGlvbiAoY29uc3RydWN0b3IsIHN0cnVjdHVyZSkge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgIC8vLyAgICAgTWFwIHRhYmxlIHRvIGEgamF2YXNjcmlwdCBjb25zdHJ1Y3RvciBmdW5jdGlvbi4gT2JqZWN0cyByZXR1cm5lZCBmcm9tIHRoZSBkYXRhYmFzZSB3aWxsIGJlIGluc3RhbmNlcyBvZiB0aGlzIGNsYXNzLCBtYWtpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8vICAgICBpdCBwb3NzaWJsZSB0byB0aGUgaW5zdGFuY2VPZiBvcGVyYXRvciBhcyB3ZWxsIGFzIGV4dGVuZGluZyB0aGUgY2xhc3MgdXNpbmcgY29uc3RydWN0b3IucHJvdG90eXBlLm1ldGhvZCA9IGZ1bmN0aW9uKCl7Li4ufS5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY29uc3RydWN0b3JcIj5Db25zdHJ1Y3RvciBmdW5jdGlvbiByZXByZXNlbnRpbmcgdGhlIGNsYXNzLjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInN0cnVjdHVyZVwiIG9wdGlvbmFsPVwidHJ1ZVwiPkhlbHBzIElERSBjb2RlIGNvbXBsZXRpb24gYnkga25vd2luZyB0aGUgbWVtYmVycyB0aGF0IG9iamVjdHMgY29udGFpbiBhbmQgbm90IGp1c3QgdGhlIGluZGV4ZXMuIEFsc29cbiAgICAgICAgICAgICAgICAgICAgLy8vIGtub3cgd2hhdCB0eXBlIGVhY2ggbWVtYmVyIGhhcy4gRXhhbXBsZToge25hbWU6IFN0cmluZywgZW1haWxBZGRyZXNzZXM6IFtTdHJpbmddLCBwYXNzd29yZH08L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjaGVtYS5tYXBwZWRDbGFzcyA9IGNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5zdGFuY2VUZW1wbGF0ZSA9IE9iamVjdC5jcmVhdGUoY29uc3RydWN0b3IucHJvdG90eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cnVjdHVyZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RydWN0dXJlIGFuZCBpbnN0YW5jZVRlbXBsYXRlIGlzIGZvciBJREUgY29kZSBjb21wZXRpb24gb25seSB3aGlsZSBjb25zdHJ1Y3Rvci5wcm90b3R5cGUgaXMgZm9yIGFjdHVhbCBpbmhlcml0YW5jZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5U3RydWN0dXJlKGluc3RhbmNlVGVtcGxhdGUsIHN0cnVjdHVyZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2hlbWEuaW5zdGFuY2VUZW1wbGF0ZSA9IGluc3RhbmNlVGVtcGxhdGU7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTm93LCBzdWJzY3JpYmUgdG8gdGhlIHdoZW4oXCJyZWFkaW5nXCIpIGV2ZW50IHRvIG1ha2UgYWxsIG9iamVjdHMgdGhhdCBjb21lIG91dCBmcm9tIHRoaXMgdGFibGUgaW5oZXJpdCBmcm9tIGdpdmVuIGNsYXNzXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vIG1hdHRlciB3aGljaCBtZXRob2QgdG8gdXNlIGZvciByZWFkaW5nIChUYWJsZS5nZXQoKSBvciBUYWJsZS53aGVyZSguLi4pLi4uIClcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlYWRIb29rID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmopIHJldHVybiBvYmo7IC8vIE5vIHZhbGlkIG9iamVjdC4gKFZhbHVlIGlzIG51bGwpLiBSZXR1cm4gYXMgaXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgb2JqZWN0IHRoYXQgZGVyaXZlcyBmcm9tIGNvbnN0cnVjdG9yOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcyA9IE9iamVjdC5jcmVhdGUoY29uc3RydWN0b3IucHJvdG90eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsb25lIG1lbWJlcnM6XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBtIGluIG9iaikgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShtKSkgcmVzW21dID0gb2JqW21dO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zY2hlbWEucmVhZEhvb2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaG9vay5yZWFkaW5nLnVuc3Vic2NyaWJlKHRoaXMuc2NoZW1hLnJlYWRIb29rKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjaGVtYS5yZWFkSG9vayA9IHJlYWRIb29rO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhvb2soXCJyZWFkaW5nXCIsIHJlYWRIb29rKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGVmaW5lQ2xhc3M6IGZ1bmN0aW9uIChzdHJ1Y3R1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAvLy8gICAgIERlZmluZSBhbGwgbWVtYmVycyBvZiB0aGUgY2xhc3MgdGhhdCByZXByZXNlbnRzIHRoZSB0YWJsZS4gVGhpcyB3aWxsIGhlbHAgY29kZSBjb21wbGV0aW9uIG9mIHdoZW4gb2JqZWN0cyBhcmUgcmVhZCBmcm9tIHRoZSBkYXRhYmFzZVxuICAgICAgICAgICAgICAgICAgICAvLy8gICAgIGFzIHdlbGwgYXMgbWFraW5nIGl0IHBvc3NpYmxlIHRvIGV4dGVuZCB0aGUgcHJvdG90eXBlIG9mIHRoZSByZXR1cm5lZCBjb25zdHJ1Y3RvciBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwic3RydWN0dXJlXCI+SGVscHMgSURFIGNvZGUgY29tcGxldGlvbiBieSBrbm93aW5nIHRoZSBtZW1iZXJzIHRoYXQgb2JqZWN0cyBjb250YWluIGFuZCBub3QganVzdCB0aGUgaW5kZXhlcy4gQWxzb1xuICAgICAgICAgICAgICAgICAgICAvLy8ga25vdyB3aGF0IHR5cGUgZWFjaCBtZW1iZXIgaGFzLiBFeGFtcGxlOiB7bmFtZTogU3RyaW5nLCBlbWFpbEFkZHJlc3NlczogW1N0cmluZ10sIHByb3BlcnRpZXM6IHtzaG9lU2l6ZTogTnVtYmVyfX08L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXBUb0NsYXNzKERleGllLmRlZmluZUNsYXNzKHN0cnVjdHVyZSksIHN0cnVjdHVyZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhZGQ6IGZhaWxSZWFkb25seSxcbiAgICAgICAgICAgICAgICBwdXQ6IGZhaWxSZWFkb25seSxcbiAgICAgICAgICAgICAgICAnZGVsZXRlJzogZmFpbFJlYWRvbmx5LFxuICAgICAgICAgICAgICAgIGNsZWFyOiBmYWlsUmVhZG9ubHksXG4gICAgICAgICAgICAgICAgdXBkYXRlOiBmYWlsUmVhZG9ubHlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFdyaXRlYWJsZVRhYmxlIENsYXNzIChleHRlbmRzIFRhYmxlKVxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICBmdW5jdGlvbiBXcml0ZWFibGVUYWJsZShuYW1lLCB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5LCB0YWJsZVNjaGVtYSwgY29sbENsYXNzKSB7XG4gICAgICAgICAgICBUYWJsZS5jYWxsKHRoaXMsIG5hbWUsIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnksIHRhYmxlU2NoZW1hLCBjb2xsQ2xhc3MgfHwgV3JpdGVhYmxlQ29sbGVjdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBkZXJpdmUoV3JpdGVhYmxlVGFibGUpLmZyb20oVGFibGUpLmV4dGVuZChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFkZDogZnVuY3Rpb24gKG9iaiwga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgLy8vICAgQWRkIGFuIG9iamVjdCB0byB0aGUgZGF0YWJhc2UuIEluIGNhc2UgYW4gb2JqZWN0IHdpdGggc2FtZSBwcmltYXJ5IGtleSBhbHJlYWR5IGV4aXN0cywgdGhlIG9iamVjdCB3aWxsIG5vdCBiZSBhZGRlZC5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwib2JqXCIgdHlwZT1cIk9iamVjdFwiPkEgamF2YXNjcmlwdCBvYmplY3QgdG8gaW5zZXJ0PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwia2V5XCIgb3B0aW9uYWw9XCJ0cnVlXCI+UHJpbWFyeSBrZXk8L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGluZ0hvb2sgPSB0aGlzLmhvb2suY3JlYXRpbmcuZmlyZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lkYnN0b3JlKFJFQURXUklURSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUsIHRyYW5zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc0N0eCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNyZWF0aW5nSG9vayAhPT0gbm9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVmZmVjdGl2ZUtleSA9IGtleSB8fCAoaWRic3RvcmUua2V5UGF0aCA/IGdldEJ5S2V5UGF0aChvYmosIGlkYnN0b3JlLmtleVBhdGgpIDogdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5VG9Vc2UgPSBjcmVhdGluZ0hvb2suY2FsbCh0aGlzQ3R4LCBlZmZlY3RpdmVLZXksIG9iaiwgdHJhbnMpOyAvLyBBbGxvdyBzdWJzY3JpYmVycyB0byB3aGVuKFwiY3JlYXRpbmdcIikgdG8gZ2VuZXJhdGUgdGhlIGtleS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWZmZWN0aXZlS2V5ID09PSB1bmRlZmluZWQgJiYga2V5VG9Vc2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaWRic3RvcmUua2V5UGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEJ5S2V5UGF0aChvYmosIGlkYnN0b3JlLmtleVBhdGgsIGtleVRvVXNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5ID0ga2V5VG9Vc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy90cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXEgPSBrZXkgPyBpZGJzdG9yZS5hZGQob2JqLCBrZXkpIDogaWRic3RvcmUuYWRkKG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXNDdHgub25lcnJvcikgdGhpc0N0eC5vbmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtcImFkZGluZ1wiLCBvYmosIFwiaW50b1wiLCBzZWxmLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXlQYXRoID0gaWRic3RvcmUua2V5UGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleVBhdGgpIHNldEJ5S2V5UGF0aChvYmosIGtleVBhdGgsIGV2LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpc0N0eC5vbnN1Y2Nlc3MpIHRoaXNDdHgub25zdWNjZXNzKGV2LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAvKn0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5vbihcImVycm9yXCIpLmZpcmUoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnMuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9Ki9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHB1dDogZnVuY3Rpb24gKG9iaiwga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgLy8vICAgQWRkIGFuIG9iamVjdCB0byB0aGUgZGF0YWJhc2UgYnV0IGluIGNhc2UgYW4gb2JqZWN0IHdpdGggc2FtZSBwcmltYXJ5IGtleSBhbHJlYWQgZXhpc3RzLCB0aGUgZXhpc3Rpbmcgb25lIHdpbGwgZ2V0IHVwZGF0ZWQuXG4gICAgICAgICAgICAgICAgICAgIC8vLyA8L3N1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm9ialwiIHR5cGU9XCJPYmplY3RcIj5BIGphdmFzY3JpcHQgb2JqZWN0IHRvIGluc2VydCBvciB1cGRhdGU8L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJrZXlcIiBvcHRpb25hbD1cInRydWVcIj5QcmltYXJ5IGtleTwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0aW5nSG9vayA9IHRoaXMuaG9vay5jcmVhdGluZy5maXJlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRpbmdIb29rID0gdGhpcy5ob29rLnVwZGF0aW5nLmZpcmU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjcmVhdGluZ0hvb2sgIT09IG5vcCB8fCB1cGRhdGluZ0hvb2sgIT09IG5vcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBlb3BsZSBsaXN0ZW5zIHRvIHdoZW4oXCJjcmVhdGluZ1wiKSBvciB3aGVuKFwidXBkYXRpbmdcIikgZXZlbnRzIVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgbXVzdCBrbm93IHdoZXRoZXIgdGhlIHB1dCBvcGVyYXRpb24gcmVzdWx0cyBpbiBhbiBDUkVBVEUgb3IgVVBEQVRFLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl90cmFucyhSRUFEV1JJVEUsIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIHRyYW5zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2luY2Uga2V5IGlzIG9wdGlvbmFsLCBtYWtlIHN1cmUgd2UgZ2V0IGl0IGZyb20gb2JqIGlmIG5vdCBwcm92aWRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlZmZlY3RpdmVLZXkgPSBrZXkgfHwgKHNlbGYuc2NoZW1hLnByaW1LZXkua2V5UGF0aCAmJiBnZXRCeUtleVBhdGgob2JqLCBzZWxmLnNjaGVtYS5wcmltS2V5LmtleVBhdGgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWZmZWN0aXZlS2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm8gcHJpbWFyeSBrZXkuIE11c3QgdXNlIGFkZCgpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFucy50YWJsZXNbc2VsZi5uYW1lXS5hZGQob2JqKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJpbWFyeSBrZXkgZXhpc3QuIExvY2sgdHJhbnNhY3Rpb24gYW5kIHRyeSBtb2RpZnlpbmcgZXhpc3RpbmcuIElmIG5vdGhpbmcgbW9kaWZpZWQsIGNhbGwgYWRkKCkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLl9sb2NrKCk7IC8vIE5lZWRlZCBiZWNhdXNlIG9wZXJhdGlvbiBpcyBzcGxpdHRlZCBpbnRvIG1vZGlmeSgpIGFuZCBhZGQoKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2xvbmUgb2JqIGJlZm9yZSB0aGlzIGFzeW5jIGNhbGwuIElmIGNhbGxlciBtb2RpZmllcyBvYmogdGhlIGxpbmUgYWZ0ZXIgcHV0KCksIHRoZSBJREIgc3BlYyByZXF1aXJlcyB0aGF0IGl0IHNob3VsZCBub3QgYWZmZWN0IG9wZXJhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gZGVlcENsb25lKG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zLnRhYmxlc1tzZWxmLm5hbWVdLndoZXJlKFwiOmlkXCIpLmVxdWFscyhlZmZlY3RpdmVLZXkpLm1vZGlmeShmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlcGxhY2UgZXh0aXN0aW5nIHZhbHVlIHdpdGggb3VyIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ1JVRCBldmVudCBmaXJpbmcgaGFuZGxlZCBpbiBXcml0ZWFibGVDb2xsZWN0aW9uLm1vZGlmeSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gb2JqO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2JqZWN0J3Mga2V5IHdhcyBub3QgZm91bmQuIEFkZCB0aGUgb2JqZWN0IGluc3RlYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ1JVRCBldmVudCBmaXJpbmcgd2lsbCBiZSBkb25lIGluIGFkZCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zLnRhYmxlc1tzZWxmLm5hbWVdLmFkZChvYmosIGtleSk7IC8vIFJlc29sdmluZyB3aXRoIGFub3RoZXIgUHJvbWlzZS4gUmV0dXJuZWQgUHJvbWlzZSB3aWxsIHRoZW4gcmVzb2x2ZSB3aXRoIHRoZSBuZXcga2V5LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWZmZWN0aXZlS2V5OyAvLyBSZXNvbHZlIHdpdGggdGhlIHByb3ZpZGVkIGtleS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuZmluYWxseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFucy5fdW5sb2NrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVzZSB0aGUgc3RhbmRhcmQgSURCIHB1dCgpIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pZGJzdG9yZShSRUFEV1JJVEUsIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcSA9IGtleSA/IGlkYnN0b3JlLnB1dChvYmosIGtleSkgOiBpZGJzdG9yZS5wdXQob2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QsIFtcInB1dHRpbmdcIiwgb2JqLCBcImludG9cIiwgc2VsZi5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5UGF0aCA9IGlkYnN0b3JlLmtleVBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXlQYXRoKSBzZXRCeUtleVBhdGgob2JqLCBrZXlQYXRoLCBldi50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgJ2RlbGV0ZSc6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwia2V5XCI+UHJpbWFyeSBrZXkgb2YgdGhlIG9iamVjdCB0byBkZWxldGU8L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5ob29rLmRlbGV0aW5nLnN1YnNjcmliZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGVvcGxlIGxpc3RlbnMgdG8gd2hlbihcImRlbGV0aW5nXCIpIGV2ZW50LiBNdXN0IGltcGxlbWVudCBkZWxldGUgdXNpbmcgV3JpdGVhYmxlQ29sbGVjdGlvbi5kZWxldGUoKSB0aGF0IHdpbGxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbGwgdGhlIENSVUQgZXZlbnQuIE9ubHkgV3JpdGVhYmxlQ29sbGVjdGlvbi5kZWxldGUoKSB3aWxsIGtub3cgd2hldGhlciBhbiBvYmplY3Qgd2FzIGFjdHVhbGx5IGRlbGV0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53aGVyZShcIjppZFwiKS5lcXVhbHMoa2V5KS5kZWxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIG9uZSBsaXN0ZW5zLiBVc2Ugc3RhbmRhcmQgSURCIGRlbGV0ZSgpIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pZGJzdG9yZShSRUFEV1JJVEUsIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcSA9IGlkYnN0b3JlLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgW1wiZGVsZXRpbmdcIiwga2V5LCBcImZyb21cIiwgaWRic3RvcmUubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaG9vay5kZWxldGluZy5zdWJzY3JpYmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBlb3BsZSBsaXN0ZW5zIHRvIHdoZW4oXCJkZWxldGluZ1wiKSBldmVudC4gTXVzdCBpbXBsZW1lbnQgZGVsZXRlIHVzaW5nIFdyaXRlYWJsZUNvbGxlY3Rpb24uZGVsZXRlKCkgdGhhdCB3aWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWxsIHRoZSBDUlVEIGV2ZW50LiBPbmx5IFdyaXRlYWJsZUNvbGxlY3Rpb24uZGVsZXRlKCkgd2lsbCBrbm93cyB3aGljaCBvYmplY3RzIHRoYXQgYXJlIGFjdHVhbGx5IGRlbGV0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50b0NvbGxlY3Rpb24oKS5kZWxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pZGJzdG9yZShSRUFEV1JJVEUsIGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcSA9IGlkYnN0b3JlLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0LCBbXCJjbGVhcmluZ1wiLCBpZGJzdG9yZS5uYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uIChrZXlPck9iamVjdCwgbW9kaWZpY2F0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1vZGlmaWNhdGlvbnMgIT09ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkobW9kaWZpY2F0aW9ucykpIHRocm93IG5ldyBFcnJvcihcImRiLnVwZGF0ZShrZXlPck9iamVjdCwgbW9kaWZpY2F0aW9ucykuIG1vZGlmaWNhdGlvbnMgbXVzdCBiZSBhbiBvYmplY3QuXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGtleU9yT2JqZWN0ID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShrZXlPck9iamVjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdCB0byBtb2RpZnkuIEFsc28gbW9kaWZ5IGdpdmVuIG9iamVjdCB3aXRoIHRoZSBtb2RpZmljYXRpb25zOlxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMobW9kaWZpY2F0aW9ucykuZm9yRWFjaChmdW5jdGlvbiAoa2V5UGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEJ5S2V5UGF0aChrZXlPck9iamVjdCwga2V5UGF0aCwgbW9kaWZpY2F0aW9uc1trZXlQYXRoXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBnZXRCeUtleVBhdGgoa2V5T3JPYmplY3QsIHRoaXMuc2NoZW1hLnByaW1LZXkua2V5UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIk9iamVjdCBkb2VzIG5vdCBjb250YWluIGl0cyBwcmltYXJ5IGtleVwiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53aGVyZShcIjppZFwiKS5lcXVhbHMoa2V5KS5tb2RpZnkobW9kaWZpY2F0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBrZXkgdG8gbW9kaWZ5XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53aGVyZShcIjppZFwiKS5lcXVhbHMoa2V5T3JPYmplY3QpLm1vZGlmeShtb2RpZmljYXRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyBUcmFuc2FjdGlvbiBDbGFzc1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICBmdW5jdGlvbiBUcmFuc2FjdGlvbihtb2RlLCBzdG9yZU5hbWVzLCBkYnNjaGVtYSwgcGFyZW50KSB7XG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgICAgICAvLy8gICAgVHJhbnNhY3Rpb24gY2xhc3MuIFJlcHJlc2VudHMgYSBkYXRhYmFzZSB0cmFuc2FjdGlvbi4gQWxsIG9wZXJhdGlvbnMgb24gZGIgZ29lcyB0aHJvdWdoIGEgVHJhbnNhY3Rpb24uXG4gICAgICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwibW9kZVwiIHR5cGU9XCJTdHJpbmdcIj5Bbnkgb2YgXCJyZWFkd3JpdGVcIiBvciBcInJlYWRvbmx5XCI8L3BhcmFtPlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwic3RvcmVOYW1lc1wiIHR5cGU9XCJBcnJheVwiPkFycmF5IG9mIHRhYmxlIG5hbWVzIHRvIG9wZXJhdGUgb248L3BhcmFtPlxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5kYiA9IGRiO1xuICAgICAgICAgICAgdGhpcy5tb2RlID0gbW9kZTtcbiAgICAgICAgICAgIHRoaXMuc3RvcmVOYW1lcyA9IHN0b3JlTmFtZXM7XG4gICAgICAgICAgICB0aGlzLmlkYnRyYW5zID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMub24gPSBldmVudHModGhpcywgW1wiY29tcGxldGVcIiwgXCJlcnJvclwiXSwgXCJhYm9ydFwiKTtcbiAgICAgICAgICAgIHRoaXMuX3JlY3Vsb2NrID0gMDtcbiAgICAgICAgICAgIHRoaXMuX2Jsb2NrZWRGdW5jcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fcHNkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2Ric2NoZW1hID0gZGJzY2hlbWE7XG4gICAgICAgICAgICBpZiAocGFyZW50KSB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgICAgIHRoaXMuX3RwZiA9IHRyYW5zYWN0aW9uUHJvbWlzZUZhY3Rvcnk7XG4gICAgICAgICAgICB0aGlzLnRhYmxlcyA9IE9iamVjdC5jcmVhdGUobm90SW5UcmFuc0ZhbGxiYWNrVGFibGVzKTsgLy8gLi4uc28gdGhhdCBhbGwgbm9uLWluY2x1ZGVkIHRhYmxlcyBleGlzdHMgYXMgaW5zdGFuY2VzIChwb3NzaWJsZSB0byBjYWxsIHRhYmxlLm5hbWUgZm9yIGV4YW1wbGUpIGJ1dCB3aWxsIGZhaWwgYXMgc29vbiBhcyB0cnlpbmcgdG8gZXhlY3V0ZSBhIHF1ZXJ5IG9uIGl0LlxuXG4gICAgICAgICAgICBmdW5jdGlvbiB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5KG1vZGUsIHN0b3JlTmFtZXMsIGZuLCB3cml0ZUxvY2tlZCkge1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZXMgYSBQcm9taXNlIGluc3RhbmNlIGFuZCBjYWxscyBmbiAocmVzb2x2ZSwgcmVqZWN0LCB0cmFucykgd2hlcmUgdHJhbnMgaXMgdGhlIGluc3RhbmNlIG9mIHRoaXMgdHJhbnNhY3Rpb24gb2JqZWN0LlxuICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgZm9yIHdyaXRlLWxvY2tpbmcgdGhlIHRyYW5zYWN0aW9uIGR1cmluZyB0aGUgcHJvbWlzZSBsaWZlIHRpbWUgZnJvbSBjcmVhdGlvbiB0byBzdWNjZXNzL2ZhaWx1cmUuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhY3R1YWxseSBub3QgbmVlZGVkIHdoZW4ganVzdCB1c2luZyBzaW5nbGUgb3BlcmF0aW9ucyBvbiBJREIsIHNpbmNlIElEQiBpbXBsZW1lbnRzIHRoaXMgaW50ZXJuYWxseS5cbiAgICAgICAgICAgICAgICAvLyBIb3dldmVyLCB3aGVuIGltcGxlbWVudGluZyBhIHdyaXRlIG9wZXJhdGlvbiBhcyBhIHNlcmllcyBvZiBvcGVyYXRpb25zIG9uIHRvcCBvZiBJREIoY29sbGVjdGlvbi5kZWxldGUoKSBhbmQgY29sbGVjdGlvbi5tb2RpZnkoKSBmb3IgZXhhbXBsZSksXG4gICAgICAgICAgICAgICAgLy8gbG9jayBpcyBpbmRlZWQgbmVlZGVkIGlmIERleGllIEFQSXNob3VsZCBiZWhhdmUgaW4gYSBjb25zaXN0ZW50IG1hbm5lciBmb3IgdGhlIEFQSSB1c2VyLlxuICAgICAgICAgICAgICAgIC8vIEFub3RoZXIgZXhhbXBsZSBvZiB0aGlzIGlzIGlmIHdlIHdhbnQgdG8gc3VwcG9ydCBjcmVhdGUvdXBkYXRlL2RlbGV0ZSBldmVudHMsXG4gICAgICAgICAgICAgICAgLy8gd2UgbmVlZCB0byBpbXBsZW1lbnQgcHV0KCkgdXNpbmcgYSBzZXJpZXMgb2Ygb3RoZXIgSURCIG9wZXJhdGlvbnMgYnV0IHN0aWxsIG5lZWQgdG8gbG9jayB0aGUgdHJhbnNhY3Rpb24gYWxsIHRoZSB3YXkuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuX3Byb21pc2UobW9kZSwgZm4sIHdyaXRlTG9ja2VkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHN0b3JlTmFtZXMubGVuZ3RoIC0gMTsgaSAhPT0gLTE7IC0taSkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gc3RvcmVOYW1lc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgdGFibGUgPSBkYi5fdGFibGVGYWN0b3J5KG1vZGUsIGRic2NoZW1hW25hbWVdLCB0cmFuc2FjdGlvblByb21pc2VGYWN0b3J5KTtcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmxlc1tuYW1lXSA9IHRhYmxlO1xuICAgICAgICAgICAgICAgIGlmICghdGhpc1tuYW1lXSkgdGhpc1tuYW1lXSA9IHRhYmxlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXh0ZW5kKFRyYW5zYWN0aW9uLnByb3RvdHlwZSwge1xuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRyYW5zYWN0aW9uIFByb3RlY3RlZCBNZXRob2RzIChub3QgcmVxdWlyZWQgYnkgQVBJIHVzZXJzLCBidXQgbmVlZGVkIGludGVybmFsbHkgYW5kIGV2ZW50dWFsbHkgYnkgZGV4aWUgZXh0ZW5zaW9ucylcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIF9sb2NrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gVGVtcG9yYXJ5IHNldCBhbGwgcmVxdWVzdHMgaW50byBhIHBlbmRpbmcgcXVldWUgaWYgdGhleSBhcmUgY2FsbGVkIGJlZm9yZSBkYXRhYmFzZSBpcyByZWFkeS5cbiAgICAgICAgICAgICAgICArK3RoaXMuX3JlY3Vsb2NrOyAvLyBSZWN1cnNpdmUgcmVhZC93cml0ZSBsb2NrIHBhdHRlcm4gdXNpbmcgUFNEIChQcm9taXNlIFNwZWNpZmljIERhdGEpIGluc3RlYWQgb2YgVExTIChUaHJlYWQgTG9jYWwgU3RvcmFnZSlcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcmVjdWxvY2sgPT09IDEgJiYgUHJvbWlzZS5QU0QpIFByb21pc2UuUFNELmxvY2tPd25lckZvciA9IHRoaXM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX3VubG9jazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgtLXRoaXMuX3JlY3Vsb2NrID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChQcm9taXNlLlBTRCkgUHJvbWlzZS5QU0QubG9ja093bmVyRm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuX2Jsb2NrZWRGdW5jcy5sZW5ndGggPiAwICYmICF0aGlzLl9sb2NrZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gdGhpcy5fYmxvY2tlZEZ1bmNzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkgeyBmbigpOyB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfbG9ja2VkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2tzIGlmIGFueSB3cml0ZS1sb2NrIGlzIGFwcGxpZWQgb24gdGhpcyB0cmFuc2FjdGlvbi5cbiAgICAgICAgICAgICAgICAvLyBUbyBzaW1wbGlmeSB0aGUgRGV4aWUgQVBJIGZvciBleHRlbnNpb24gaW1wbGVtZW50YXRpb25zLCB3ZSBzdXBwb3J0IHJlY3Vyc2l2ZSBsb2Nrcy5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGFjY29tcGxpc2hlZCBieSB1c2luZyBcIlByb21pc2UgU3BlY2lmaWMgRGF0YVwiIChQU0QpLlxuICAgICAgICAgICAgICAgIC8vIFBTRCBkYXRhIGlzIGJvdW5kIHRvIGEgUHJvbWlzZSBhbmQgYW55IGNoaWxkIFByb21pc2UgZW1pdHRlZCB0aHJvdWdoIHRoZW4oKSBvciByZXNvbHZlKCBuZXcgUHJvbWlzZSgpICkuXG4gICAgICAgICAgICAgICAgLy8gUHJvbWlzZS5QU0QgaXMgbG9jYWwgdG8gY29kZSBleGVjdXRpbmcgb24gdG9wIG9mIHRoZSBjYWxsIHN0YWNrcyBvZiBhbnkgb2YgYW55IGNvZGUgZXhlY3V0ZWQgYnkgUHJvbWlzZSgpOlxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgKiBjYWxsYmFjayBnaXZlbiB0byB0aGUgUHJvbWlzZSgpIGNvbnN0cnVjdG9yICAoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCl7Li4ufSlcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICogY2FsbGJhY2tzIGdpdmVuIHRvIHRoZW4oKS9jYXRjaCgpL2ZpbmFsbHkoKSBtZXRob2RzIChmdW5jdGlvbiAodmFsdWUpey4uLn0pXG4gICAgICAgICAgICAgICAgLy8gSWYgY3JlYXRpbmcgYSBuZXcgaW5kZXBlbmRhbnQgUHJvbWlzZSBpbnN0YW5jZSBmcm9tIHdpdGhpbiBhIFByb21pc2UgY2FsbCBzdGFjaywgdGhlIG5ldyBQcm9taXNlIHdpbGwgZGVyaXZlIHRoZSBQU0QgZnJvbSB0aGUgY2FsbCBzdGFjayBvZiB0aGUgcGFyZW50IFByb21pc2UuXG4gICAgICAgICAgICAgICAgLy8gRGVyaXZhdGlvbiBpcyBkb25lIHNvIHRoYXQgdGhlIGlubmVyIFBTRCBfX3Byb3RvX18gcG9pbnRzIHRvIHRoZSBvdXRlciBQU0QuXG4gICAgICAgICAgICAgICAgLy8gUHJvbWlzZS5QU0QubG9ja093bmVyRm9yIHdpbGwgcG9pbnQgdG8gY3VycmVudCB0cmFuc2FjdGlvbiBvYmplY3QgaWYgdGhlIGN1cnJlbnRseSBleGVjdXRpbmcgUFNEIHNjb3BlIG93bnMgdGhlIGxvY2suXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlY3Vsb2NrICYmICghUHJvbWlzZS5QU0QgfHwgUHJvbWlzZS5QU0QubG9ja093bmVyRm9yICE9PSB0aGlzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfbm9wOiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAvLyBBbiBhc3luY3JvbmljIG5vLW9wZXJhdGlvbiB0aGF0IG1heSBjYWxsIGdpdmVuIGNhbGxiYWNrIHdoZW4gZG9uZSBkb2luZyBub3RoaW5nLiBBbiBhbHRlcm5hdGl2ZSB0byBhc2FwKCkgaWYgd2UgbXVzdCBub3QgbG9zZSB0aGUgdHJhbnNhY3Rpb24uXG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZXNbdGhpcy5zdG9yZU5hbWVzWzBdXS5nZXQoMCkudGhlbihjYik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX3Byb21pc2U6IGZ1bmN0aW9uIChtb2RlLCBmbiwgYldyaXRlTG9jaykge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5uZXdQU0QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwO1xuICAgICAgICAgICAgICAgICAgICAvLyBSZWFkIGxvY2sgYWx3YXlzXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi5fbG9ja2VkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBzZWxmLmFjdGl2ZSA/IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbGYuaWRidHJhbnMgJiYgbW9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlkYmRiKSB0aHJvdyBkYk9wZW5FcnJvciA/IG5ldyBFcnJvcihcIkRhdGFiYXNlIG5vdCBvcGVuLiBGb2xsb3dpbmcgZXJyb3IgaW4gcG9wdWxhdGUsIHJlYWR5IG9yIHVwZ3JhZGUgZnVuY3Rpb24gbWFkZSBEZXhpZS5vcGVuKCkgZmFpbDogXCIgKyBkYk9wZW5FcnJvcikgOiBuZXcgRXJyb3IoXCJEYXRhYmFzZSBub3Qgb3BlblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkYnRyYW5zID0gc2VsZi5pZGJ0cmFucyA9IGlkYmRiLnRyYW5zYWN0aW9uKHNhZmFyaU11bHRpU3RvcmVGaXgoc2VsZi5zdG9yZU5hbWVzKSwgc2VsZi5tb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRidHJhbnMub25lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9uKFwiZXJyb3JcIikuZmlyZShlICYmIGUudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTsgLy8gUHJvaGliaXQgZGVmYXVsdCBidWJibGluZyB0byB3aW5kb3cuZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYWJvcnQoKTsgLy8gTWFrZSBzdXJlIHRyYW5zYWN0aW9uIGlzIGFib3J0ZWQgc2luY2Ugd2UgcHJldmVudERlZmF1bHQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGJ0cmFucy5vbmFib3J0ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdvcmthcm91bmQgZm9yIGlzc3VlICM3OCAtIGxvdyBkaXNrIHNwYWNlIG9uIGNocm9tZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9uYWJvcnQgaXMgY2FsbGVkIGJ1dCBuZXZlciBvbmVycm9yLiBDYWxsIG9uZXJyb3IgZXhwbGljaXRlbHkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEbyB0aGlzIGluIGEgZnV0dXJlIHRpY2sgc28gd2UgYWxsb3cgZGVmYXVsdCBvbmVycm9yIHRvIGV4ZWN1dGUgYmVmb3JlIGRvaW5nIHRoZSBmYWxsYmFjay5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzYXAoZnVuY3Rpb24gKCkgeyBzZWxmLm9uKCdlcnJvcicpLmZpcmUobmV3IEVycm9yKFwiVHJhbnNhY3Rpb24gYWJvcnRlZCBmb3IgdW5rbm93biByZWFzb25cIikpOyB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub24oXCJhYm9ydFwiKS5maXJlKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGJ0cmFucy5vbmNvbXBsZXRlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9uKFwiY29tcGxldGVcIikuZmlyZShlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiV3JpdGVMb2NrKSBzZWxmLl9sb2NrKCk7IC8vIFdyaXRlIGxvY2sgaWYgd3JpdGUgb3BlcmF0aW9uIGlzIHJlcXVlc3RlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuKHJlc29sdmUsIHJlamVjdCwgc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEaXJlY3QgZXhjZXB0aW9uIGhhcHBlbmVkIHdoZW4gZG9pbiBvcGVyYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIG11c3QgaW1tZWRpYXRlbHkgZmlyZSB0aGUgZXJyb3IgYW5kIGFib3J0IHRoZSB0cmFuc2FjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB0aGlzIGhhcHBlbnMgd2UgYXJlIHN0aWxsIGNvbnN0cnVjdGluZyB0aGUgUHJvbWlzZSBzbyB3ZSBkb24ndCB5ZXQga25vd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3aGV0aGVyIHRoZSBjYWxsZXIgaXMgYWJvdXQgdG8gY2F0Y2goKSB0aGUgZXJyb3Igb3Igbm90LiBIYXZlIHRvIG1ha2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdHJhbnNhY3Rpb24gZmFpbC4gQ2F0Y2hpbmcgc3VjaCBhbiBlcnJvciB3b250IHN0b3AgdHJhbnNhY3Rpb24gZnJvbSBmYWlsaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbGltaXRhdGlvbiB3ZSBoYXZlIHRvIGxpdmUgd2l0aC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGV4aWUuaWdub3JlVHJhbnNhY3Rpb24oZnVuY3Rpb24gKCkgeyBzZWxmLm9uKCdlcnJvcicpLmZpcmUoZSk7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSA6IFByb21pc2UucmVqZWN0KHN0YWNrKG5ldyBFcnJvcihcIlRyYW5zYWN0aW9uIGlzIGluYWN0aXZlLiBPcmlnaW5hbCBTY29wZSBGdW5jdGlvbiBTb3VyY2U6IFwiICsgc2VsZi5zY29wZUZ1bmMudG9TdHJpbmcoKSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmFjdGl2ZSAmJiBiV3JpdGVMb2NrKSBwLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3VubG9jaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUcmFuc2FjdGlvbiBpcyB3cml0ZS1sb2NrZWQuIFdhaXQgZm9yIG11dGV4LlxuICAgICAgICAgICAgICAgICAgICAgICAgcCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9ibG9ja2VkRnVuY3MucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3Byb21pc2UobW9kZSwgZm4sIGJXcml0ZUxvY2spLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHAub251bmNhdGNoZWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnViYmxlIHRvIHRyYW5zYWN0aW9uLiBFdmVuIHRob3VnaCBJREIgZG9lcyB0aGlzIGludGVybmFsbHksIGl0IHdvdWxkIGp1c3QgZG8gaXQgZm9yIGVycm9yIGV2ZW50cyBhbmQgbm90IGZvciBjYXVnaHQgZXhjZXB0aW9ucy5cbiAgICAgICAgICAgICAgICAgICAgICAgIERleGllLmlnbm9yZVRyYW5zYWN0aW9uKGZ1bmN0aW9uICgpIHsgc2VsZi5vbihcImVycm9yXCIpLmZpcmUoZSk7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUcmFuc2FjdGlvbiBQdWJsaWMgTWV0aG9kc1xuICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9uKFwiY29tcGxldGVcIiwgY2IpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vbihcImVycm9yXCIsIGNiKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhYm9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlkYnRyYW5zICYmIHRoaXMuYWN0aXZlKSB0cnkgeyAvLyBUT0RPOiBpZiAhdGhpcy5pZGJ0cmFucywgZW5xdWV1ZSBhbiBhYm9ydCgpIG9wZXJhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pZGJ0cmFucy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uLmVycm9yLmZpcmUobmV3IEVycm9yKFwiVHJhbnNhY3Rpb24gQWJvcnRlZFwiKSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGFibGU6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnRhYmxlcy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJUYWJsZSBcIiArIG5hbWUgKyBcIiBub3QgaW4gdHJhbnNhY3Rpb25cIik7IHJldHVybiB7IEFOX1VOS05PV05fVEFCTEVfTkFNRV9XQVNfU1BFQ0lGSUVEOiAxIH07IH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50YWJsZXNbbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFdoZXJlQ2xhdXNlXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIGZ1bmN0aW9uIFdoZXJlQ2xhdXNlKHRhYmxlLCBpbmRleCwgb3JDb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJ0YWJsZVwiIHR5cGU9XCJUYWJsZVwiPjwvcGFyYW0+XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJpbmRleFwiIHR5cGU9XCJTdHJpbmdcIiBvcHRpb25hbD1cInRydWVcIj48L3BhcmFtPlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwib3JDb2xsZWN0aW9uXCIgdHlwZT1cIkNvbGxlY3Rpb25cIiBvcHRpb25hbD1cInRydWVcIj48L3BhcmFtPlxuICAgICAgICAgICAgdGhpcy5fY3R4ID0ge1xuICAgICAgICAgICAgICAgIHRhYmxlOiB0YWJsZSxcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXggPT09IFwiOmlkXCIgPyBudWxsIDogaW5kZXgsXG4gICAgICAgICAgICAgICAgY29sbENsYXNzOiB0YWJsZS5fY29sbENsYXNzLFxuICAgICAgICAgICAgICAgIG9yOiBvckNvbGxlY3Rpb25cbiAgICAgICAgICAgIH07IFxuICAgICAgICB9XG5cbiAgICAgICAgZXh0ZW5kKFdoZXJlQ2xhdXNlLnByb3RvdHlwZSwgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAvLyBXaGVyZUNsYXVzZSBwcml2YXRlIG1ldGhvZHNcblxuICAgICAgICAgICAgZnVuY3Rpb24gZmFpbChjb2xsZWN0aW9uLCBlcnIpIHtcbiAgICAgICAgICAgICAgICB0cnkgeyB0aHJvdyBlcnI7IH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5fY3R4LmVycm9yID0gZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldFNldEFyZ3MoYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLmxlbmd0aCA9PT0gMSAmJiBBcnJheS5pc0FycmF5KGFyZ3NbMF0pID8gYXJnc1swXSA6IGFyZ3MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB1cHBlckZhY3RvcnkoZGlyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpciA9PT0gXCJuZXh0XCIgPyBmdW5jdGlvbiAocykgeyByZXR1cm4gcy50b1VwcGVyQ2FzZSgpOyB9IDogZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudG9Mb3dlckNhc2UoKTsgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGxvd2VyRmFjdG9yeShkaXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyID09PSBcIm5leHRcIiA/IGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnRvTG93ZXJDYXNlKCk7IH0gOiBmdW5jdGlvbiAocykgeyByZXR1cm4gcy50b1VwcGVyQ2FzZSgpOyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gbmV4dENhc2luZyhrZXksIGxvd2VyS2V5LCB1cHBlck5lZWRsZSwgbG93ZXJOZWVkbGUsIGNtcCwgZGlyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGtleS5sZW5ndGgsIGxvd2VyTmVlZGxlLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdmFyIGxscCA9IC0xO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGx3cktleUNoYXIgPSBsb3dlcktleVtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGx3cktleUNoYXIgIT09IGxvd2VyTmVlZGxlW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY21wKGtleVtpXSwgdXBwZXJOZWVkbGVbaV0pIDwgMCkgcmV0dXJuIGtleS5zdWJzdHIoMCwgaSkgKyB1cHBlck5lZWRsZVtpXSArIHVwcGVyTmVlZGxlLnN1YnN0cihpICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY21wKGtleVtpXSwgbG93ZXJOZWVkbGVbaV0pIDwgMCkgcmV0dXJuIGtleS5zdWJzdHIoMCwgaSkgKyBsb3dlck5lZWRsZVtpXSArIHVwcGVyTmVlZGxlLnN1YnN0cihpICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGxwID49IDApIHJldHVybiBrZXkuc3Vic3RyKDAsIGxscCkgKyBsb3dlcktleVtsbHBdICsgdXBwZXJOZWVkbGUuc3Vic3RyKGxscCArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNtcChrZXlbaV0sIGx3cktleUNoYXIpIDwgMCkgbGxwID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxlbmd0aCA8IGxvd2VyTmVlZGxlLmxlbmd0aCAmJiBkaXIgPT09IFwibmV4dFwiKSByZXR1cm4ga2V5ICsgdXBwZXJOZWVkbGUuc3Vic3RyKGtleS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGlmIChsZW5ndGggPCBrZXkubGVuZ3RoICYmIGRpciA9PT0gXCJwcmV2XCIpIHJldHVybiBrZXkuc3Vic3RyKDAsIHVwcGVyTmVlZGxlLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChsbHAgPCAwID8gbnVsbCA6IGtleS5zdWJzdHIoMCwgbGxwKSArIGxvd2VyTmVlZGxlW2xscF0gKyB1cHBlck5lZWRsZS5zdWJzdHIobGxwICsgMSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBhZGRJZ25vcmVDYXNlQWxnb3JpdGhtKGMsIG1hdGNoLCBuZWVkbGUpIHtcbiAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJuZWVkbGVcIiB0eXBlPVwiU3RyaW5nXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICB2YXIgdXBwZXIsIGxvd2VyLCBjb21wYXJlLCB1cHBlck5lZWRsZSwgbG93ZXJOZWVkbGUsIGRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpbml0RGlyZWN0aW9uKGRpcikge1xuICAgICAgICAgICAgICAgICAgICB1cHBlciA9IHVwcGVyRmFjdG9yeShkaXIpO1xuICAgICAgICAgICAgICAgICAgICBsb3dlciA9IGxvd2VyRmFjdG9yeShkaXIpO1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJlID0gKGRpciA9PT0gXCJuZXh0XCIgPyBhc2NlbmRpbmcgOiBkZXNjZW5kaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJOZWVkbGUgPSB1cHBlcihuZWVkbGUpO1xuICAgICAgICAgICAgICAgICAgICBsb3dlck5lZWRsZSA9IGxvd2VyKG5lZWRsZSk7XG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGRpcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW5pdERpcmVjdGlvbihcIm5leHRcIik7XG4gICAgICAgICAgICAgICAgYy5fb25kaXJlY3Rpb25jaGFuZ2UgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgZXZlbnQgb25seXMgb2NjdXIgYmVmb3JlIGZpbHRlciBpcyBjYWxsZWQgdGhlIGZpcnN0IHRpbWUuXG4gICAgICAgICAgICAgICAgICAgIGluaXREaXJlY3Rpb24oZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGMuX2FkZEFsZ29yaXRobShmdW5jdGlvbiAoY3Vyc29yLCBhZHZhbmNlLCByZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImN1cnNvclwiIHR5cGU9XCJJREJDdXJzb3JcIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJhZHZhbmNlXCIgdHlwZT1cIkZ1bmN0aW9uXCI+PC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwicmVzb2x2ZVwiIHR5cGU9XCJGdW5jdGlvblwiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBjdXJzb3Iua2V5O1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvd2VyS2V5ID0gbG93ZXIoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoKGxvd2VyS2V5LCBsb3dlck5lZWRsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoZnVuY3Rpb24gKCkgeyBjdXJzb3IuY29udGludWUoKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXh0TmVlZGxlID0gbmV4dENhc2luZyhrZXksIGxvd2VyS2V5LCB1cHBlck5lZWRsZSwgbG93ZXJOZWVkbGUsIGNvbXBhcmUsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV4dE5lZWRsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoZnVuY3Rpb24gKCkgeyBjdXJzb3IuY29udGludWUobmV4dE5lZWRsZSk7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBXaGVyZUNsYXVzZSBwdWJsaWMgbWV0aG9kc1xuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgYmV0d2VlbjogZnVuY3Rpb24gKGxvd2VyLCB1cHBlciwgaW5jbHVkZUxvd2VyLCBpbmNsdWRlVXBwZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAvLy8gICAgIEZpbHRlciBvdXQgcmVjb3JkcyB3aG9zZSB3aGVyZS1maWVsZCBsYXlzIGJldHdlZW4gZ2l2ZW4gbG93ZXIgYW5kIHVwcGVyIHZhbHVlcy4gQXBwbGllcyB0byBTdHJpbmdzLCBOdW1iZXJzIGFuZCBEYXRlcy5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwibG93ZXJcIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJ1cHBlclwiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImluY2x1ZGVMb3dlclwiIG9wdGlvbmFsPVwidHJ1ZVwiPldoZXRoZXIgaXRlbXMgdGhhdCBlcXVhbHMgbG93ZXIgc2hvdWxkIGJlIGluY2x1ZGVkLiBEZWZhdWx0IHRydWUuPC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiaW5jbHVkZVVwcGVyXCIgb3B0aW9uYWw9XCJ0cnVlXCI+V2hldGhlciBpdGVtcyB0aGF0IGVxdWFscyB1cHBlciBzaG91bGQgYmUgaW5jbHVkZWQuIERlZmF1bHQgZmFsc2UuPC9wYXJhbT5cbiAgICAgICAgICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJDb2xsZWN0aW9uXCI+PC9yZXR1cm5zPlxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlTG93ZXIgPSBpbmNsdWRlTG93ZXIgIT09IGZhbHNlOyAgIC8vIERlZmF1bHQgdG8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlVXBwZXIgPSBpbmNsdWRlVXBwZXIgPT09IHRydWU7ICAgIC8vIERlZmF1bHQgdG8gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgKChsb3dlciA+IHVwcGVyKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGxvd2VyID09PSB1cHBlciAmJiAoaW5jbHVkZUxvd2VyIHx8IGluY2x1ZGVVcHBlcikgJiYgIShpbmNsdWRlTG93ZXIgJiYgaW5jbHVkZVVwcGVyKSkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBJREJLZXlSYW5nZS5vbmx5KGxvd2VyKTsgfSkubGltaXQoMCk7IC8vIFdvcmthcm91bmQgZm9yIGlkaW90aWMgVzNDIFNwZWNpZmljYXRpb24gdGhhdCBEYXRhRXJyb3IgbXVzdCBiZSB0aHJvd24gaWYgbG93ZXIgPiB1cHBlci4gVGhlIG5hdHVyYWwgcmVzdWx0IHdvdWxkIGJlIHRvIHJldHVybiBhbiBlbXB0eSBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBJREJLZXlSYW5nZS5ib3VuZChsb3dlciwgdXBwZXIsICFpbmNsdWRlTG93ZXIsICFpbmNsdWRlVXBwZXIpOyB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVxdWFsczogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5fY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbigpIHsgcmV0dXJuIElEQktleVJhbmdlLm9ubHkodmFsdWUpOyB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFib3ZlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uKCkgeyByZXR1cm4gSURCS2V5UmFuZ2UubG93ZXJCb3VuZCh2YWx1ZSwgdHJ1ZSk7IH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYWJvdmVPckVxdWFsOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uKCkgeyByZXR1cm4gSURCS2V5UmFuZ2UubG93ZXJCb3VuZCh2YWx1ZSk7IH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYmVsb3c6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBJREJLZXlSYW5nZS51cHBlckJvdW5kKHZhbHVlLCB0cnVlKTsgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBiZWxvd09yRXF1YWw6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBJREJLZXlSYW5nZS51cHBlckJvdW5kKHZhbHVlKTsgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdGFydHNXaXRoOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInN0clwiIHR5cGU9XCJTdHJpbmdcIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHJldHVybiBmYWlsKG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMpLCBuZXcgVHlwZUVycm9yKFwiU3RyaW5nIGV4cGVjdGVkXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmV0d2VlbihzdHIsIHN0ciArIFN0cmluZy5mcm9tQ2hhckNvZGUoNjU1MzUpLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHN0YXJ0c1dpdGhJZ25vcmVDYXNlOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInN0clwiIHR5cGU9XCJTdHJpbmdcIj48L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHJldHVybiBmYWlsKG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMpLCBuZXcgVHlwZUVycm9yKFwiU3RyaW5nIGV4cGVjdGVkXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0ciA9PT0gXCJcIikgcmV0dXJuIHRoaXMuc3RhcnRzV2l0aChzdHIpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uKCkgeyByZXR1cm4gSURCS2V5UmFuZ2UuYm91bmQoc3RyLnRvVXBwZXJDYXNlKCksIHN0ci50b0xvd2VyQ2FzZSgpICsgU3RyaW5nLmZyb21DaGFyQ29kZSg2NTUzNSkpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSWdub3JlQ2FzZUFsZ29yaXRobShjLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5pbmRleE9mKGIpID09PSAwOyB9LCBzdHIpO1xuICAgICAgICAgICAgICAgICAgICBjLl9vbmRpcmVjdGlvbmNoYW5nZSA9IGZ1bmN0aW9uICgpIHsgZmFpbChjLCBuZXcgRXJyb3IoXCJyZXZlcnNlKCkgbm90IHN1cHBvcnRlZCB3aXRoIFdoZXJlQ2xhdXNlLnN0YXJ0c1dpdGhJZ25vcmVDYXNlKClcIikpOyB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVxdWFsc0lnbm9yZUNhc2U6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwic3RyXCIgdHlwZT1cIlN0cmluZ1wiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhaWwobmV3IHRoaXMuX2N0eC5jb2xsQ2xhc3ModGhpcyksIG5ldyBUeXBlRXJyb3IoXCJTdHJpbmcgZXhwZWN0ZWRcIikpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uKCkgeyByZXR1cm4gSURCS2V5UmFuZ2UuYm91bmQoc3RyLnRvVXBwZXJDYXNlKCksIHN0ci50b0xvd2VyQ2FzZSgpKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIGFkZElnbm9yZUNhc2VBbGdvcml0aG0oYywgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPT09IGI7IH0sIHN0cik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYW55T2Y6IGZ1bmN0aW9uICh2YWx1ZUFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHgsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2hlbWEgPSBjdHgudGFibGUuc2NoZW1hO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaWR4U3BlYyA9IGN0eC5pbmRleCA/IHNjaGVtYS5pZHhCeU5hbWVbY3R4LmluZGV4XSA6IHNjaGVtYS5wcmltS2V5O1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNDb21wb3VuZCA9IGlkeFNwZWMgJiYgaWR4U3BlYy5jb21wb3VuZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNldCA9IGdldFNldEFyZ3MoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBhcmUgPSBpc0NvbXBvdW5kID8gY29tcG91bmRDb21wYXJlKGFzY2VuZGluZykgOiBhc2NlbmRpbmc7XG4gICAgICAgICAgICAgICAgICAgIHNldC5zb3J0KGNvbXBhcmUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2V0Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uKCkgeyByZXR1cm4gSURCS2V5UmFuZ2Uub25seShcIlwiKTsgfSkubGltaXQoMCk7IC8vIFJldHVybiBhbiBlbXB0eSBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIElEQktleVJhbmdlLmJvdW5kKHNldFswXSwgc2V0W3NldC5sZW5ndGggLSAxXSk7IH0pO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgYy5fb25kaXJlY3Rpb25jaGFuZ2UgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wYXJlID0gKGRpcmVjdGlvbiA9PT0gXCJuZXh0XCIgPyBhc2NlbmRpbmcgOiBkZXNjZW5kaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0NvbXBvdW5kKSBjb21wYXJlID0gY29tcG91bmRDb21wYXJlKGNvbXBhcmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0LnNvcnQoY29tcGFyZSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgICAgICAgICAgICAgYy5fYWRkQWxnb3JpdGhtKGZ1bmN0aW9uIChjdXJzb3IsIGFkdmFuY2UsIHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBjdXJzb3Iua2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNvbXBhcmUoa2V5LCBzZXRbaV0pID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjdXJzb3IgaGFzIHBhc3NlZCBiZXlvbmQgdGhpcyBrZXkuIENoZWNrIG5leHQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID09PSBzZXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIG5leHQuIFN0b3Agc2VhcmNoaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBhcmUoa2V5LCBzZXRbaV0pID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGN1cnJlbnQgY3Vyc29yIHZhbHVlIHNob3VsZCBiZSBpbmNsdWRlZCBhbmQgd2Ugc2hvdWxkIGNvbnRpbnVlIGEgc2luZ2xlIHN0ZXAgaW4gY2FzZSBuZXh0IGl0ZW0gaGFzIHRoZSBzYW1lIGtleSBvciBwb3NzaWJseSBvdXIgbmV4dCBrZXkgaW4gc2V0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoZnVuY3Rpb24gKCkgeyBjdXJzb3IuY29udGludWUoKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGN1cnNvci5rZXkgbm90IHlldCBhdCBzZXRbaV0uIEZvcndhcmQgY3Vyc29yIHRvIHRoZSBuZXh0IGtleSB0byBodW50IGZvci5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKGZ1bmN0aW9uICgpIHsgY3Vyc29yLmNvbnRpbnVlKHNldFtpXSk7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBub3RFcXVhbDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmVsb3codmFsdWUpLm9yKHRoaXMuX2N0eC5pbmRleCkuYWJvdmUodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBub25lT2Y6IGZ1bmN0aW9uKHZhbHVlQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYSA9IGN0eC50YWJsZS5zY2hlbWE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZHhTcGVjID0gY3R4LmluZGV4ID8gc2NoZW1hLmlkeEJ5TmFtZVtjdHguaW5kZXhdIDogc2NoZW1hLnByaW1LZXk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc0NvbXBvdW5kID0gaWR4U3BlYyAmJiBpZHhTcGVjLmNvbXBvdW5kO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2V0ID0gZ2V0U2V0QXJncyhhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2V0Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIG5ldyB0aGlzLl9jdHguY29sbENsYXNzKHRoaXMpOyAvLyBSZXR1cm4gZW50aXJlIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wYXJlID0gaXNDb21wb3VuZCA/IGNvbXBvdW5kQ29tcGFyZShhc2NlbmRpbmcpIDogYXNjZW5kaW5nO1xuICAgICAgICAgICAgICAgICAgICBzZXQuc29ydChjb21wYXJlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJhbnNmb3JtIFtcImFcIixcImJcIixcImNcIl0gdG8gYSBzZXQgb2YgcmFuZ2VzIGZvciBiZXR3ZWVuL2Fib3ZlL2JlbG93OiBbW251bGwsXCJhXCJdLCBbXCJhXCIsXCJiXCJdLCBbXCJiXCIsXCJjXCJdLCBbXCJjXCIsbnVsbF1dXG4gICAgICAgICAgICAgICAgICAgIHZhciByYW5nZXMgPSBzZXQucmVkdWNlKGZ1bmN0aW9uIChyZXMsIHZhbCkgeyByZXR1cm4gcmVzID8gcmVzLmNvbmNhdChbW3Jlc1tyZXMubGVuZ3RoIC0gMV1bMV0sIHZhbF1dKSA6IFtbbnVsbCwgdmFsXV07IH0sIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICByYW5nZXMucHVzaChbc2V0W3NldC5sZW5ndGggLSAxXSwgbnVsbF0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBUcmFuc2Zvcm0gcmFuZ2Utc2V0cyB0byBhIGJpZyBvcigpIGV4cHJlc3Npb24gYmV0d2VlbiByYW5nZXM6XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGl6ID0gdGhpcywgaW5kZXggPSBjdHguaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByYW5nZXMucmVkdWNlKGZ1bmN0aW9uKGNvbGxlY3Rpb24sIHJhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbiA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2VbMV0gPT09IG51bGwgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLm9yKGluZGV4KS5hYm92ZShyYW5nZVswXSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLm9yKGluZGV4KS5iZXR3ZWVuKHJhbmdlWzBdLCByYW5nZVsxXSwgZmFsc2UsIGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpei5iZWxvdyhyYW5nZVsxXSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIG51bGwpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBzdGFydHNXaXRoQW55T2Y6IGZ1bmN0aW9uICh2YWx1ZUFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHgsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQgPSBnZXRTZXRBcmdzKGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZXQuZXZlcnkoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHR5cGVvZiBzID09PSAnc3RyaW5nJzsgfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWlsKG5ldyBjdHguY29sbENsYXNzKHRoaXMpLCBuZXcgVHlwZUVycm9yKFwic3RhcnRzV2l0aEFueU9mKCkgb25seSB3b3JrcyB3aXRoIHN0cmluZ3NcIikpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXQubGVuZ3RoID09PSAwKSByZXR1cm4gbmV3IGN0eC5jb2xsQ2xhc3ModGhpcywgZnVuY3Rpb24gKCkgeyByZXR1cm4gSURCS2V5UmFuZ2Uub25seShcIlwiKTsgfSkubGltaXQoMCk7IC8vIFJldHVybiBhbiBlbXB0eSBjb2xsZWN0aW9uLlxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXRFbmRzID0gc2V0Lm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcyArIFN0cmluZy5mcm9tQ2hhckNvZGUoNjU1MzUpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHZhciBzb3J0RGlyZWN0aW9uID0gYXNjZW5kaW5nO1xuICAgICAgICAgICAgICAgICAgICBzZXQuc29ydChzb3J0RGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBrZXlJc0JleW9uZEN1cnJlbnRFbnRyeShrZXkpIHsgcmV0dXJuIGtleSA+IHNldEVuZHNbaV07IH1cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24ga2V5SXNCZWZvcmVDdXJyZW50RW50cnkoa2V5KSB7IHJldHVybiBrZXkgPCBzZXRbaV07IH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoZWNrS2V5ID0ga2V5SXNCZXlvbmRDdXJyZW50RW50cnk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBuZXcgY3R4LmNvbGxDbGFzcyh0aGlzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSURCS2V5UmFuZ2UuYm91bmQoc2V0WzBdLCBzZXRbc2V0Lmxlbmd0aCAtIDFdICsgU3RyaW5nLmZyb21DaGFyQ29kZSg2NTUzNSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGMuX29uZGlyZWN0aW9uY2hhbmdlID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gXCJuZXh0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja0tleSA9IGtleUlzQmV5b25kQ3VycmVudEVudHJ5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnREaXJlY3Rpb24gPSBhc2NlbmRpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrS2V5ID0ga2V5SXNCZWZvcmVDdXJyZW50RW50cnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ydERpcmVjdGlvbiA9IGRlc2NlbmRpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQuc29ydChzb3J0RGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEVuZHMuc29ydChzb3J0RGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBjLl9hZGRBbGdvcml0aG0oZnVuY3Rpb24gKGN1cnNvciwgYWR2YW5jZSwgcmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IGN1cnNvci5rZXk7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY2hlY2tLZXkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjdXJzb3IgaGFzIHBhc3NlZCBiZXlvbmQgdGhpcyBrZXkuIENoZWNrIG5leHQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID09PSBzZXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIG5leHQuIFN0b3Agc2VhcmNoaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA+PSBzZXRbaV0gJiYga2V5IDw9IHNldEVuZHNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY3VycmVudCBjdXJzb3IgdmFsdWUgc2hvdWxkIGJlIGluY2x1ZGVkIGFuZCB3ZSBzaG91bGQgY29udGludWUgYSBzaW5nbGUgc3RlcCBpbiBjYXNlIG5leHQgaXRlbSBoYXMgdGhlIHNhbWUga2V5IG9yIHBvc3NpYmx5IG91ciBuZXh0IGtleSBpbiBzZXQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShmdW5jdGlvbiAoKSB7IGN1cnNvci5jb250aW51ZSgpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3Vyc29yLmtleSBub3QgeWV0IGF0IHNldFtpXS4gRm9yd2FyZCBjdXJzb3IgdG8gdGhlIG5leHQga2V5IHRvIGh1bnQgZm9yLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzb3J0RGlyZWN0aW9uID09PSBhc2NlbmRpbmcpIGN1cnNvci5jb250aW51ZShzZXRbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGN1cnNvci5jb250aW51ZShzZXRFbmRzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuXG5cblxuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyBDb2xsZWN0aW9uIENsYXNzXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIGZ1bmN0aW9uIENvbGxlY3Rpb24od2hlcmVDbGF1c2UsIGtleVJhbmdlR2VuZXJhdG9yKSB7XG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+XG4gICAgICAgICAgICAvLy8gXG4gICAgICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwid2hlcmVDbGF1c2VcIiB0eXBlPVwiV2hlcmVDbGF1c2VcIj5XaGVyZSBjbGF1c2UgaW5zdGFuY2U8L3BhcmFtPlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwia2V5UmFuZ2VHZW5lcmF0b3JcIiB2YWx1ZT1cImZ1bmN0aW9uKCl7IHJldHVybiBJREJLZXlSYW5nZS5ib3VuZCgwLDEpO31cIiBvcHRpb25hbD1cInRydWVcIj48L3BhcmFtPlxuICAgICAgICAgICAgdmFyIGtleVJhbmdlID0gbnVsbCwgZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgaWYgKGtleVJhbmdlR2VuZXJhdG9yKSB0cnkge1xuICAgICAgICAgICAgICAgIGtleVJhbmdlID0ga2V5UmFuZ2VHZW5lcmF0b3IoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSBleDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHdoZXJlQ3R4ID0gd2hlcmVDbGF1c2UuX2N0eDtcbiAgICAgICAgICAgIHRoaXMuX2N0eCA9IHtcbiAgICAgICAgICAgICAgICB0YWJsZTogd2hlcmVDdHgudGFibGUsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHdoZXJlQ3R4LmluZGV4LFxuICAgICAgICAgICAgICAgIGlzUHJpbUtleTogKCF3aGVyZUN0eC5pbmRleCB8fCAod2hlcmVDdHgudGFibGUuc2NoZW1hLnByaW1LZXkua2V5UGF0aCAmJiB3aGVyZUN0eC5pbmRleCA9PT0gd2hlcmVDdHgudGFibGUuc2NoZW1hLnByaW1LZXkubmFtZSkpLFxuICAgICAgICAgICAgICAgIHJhbmdlOiBrZXlSYW5nZSxcbiAgICAgICAgICAgICAgICBvcDogXCJvcGVuQ3Vyc29yXCIsXG4gICAgICAgICAgICAgICAgZGlyOiBcIm5leHRcIixcbiAgICAgICAgICAgICAgICB1bmlxdWU6IFwiXCIsXG4gICAgICAgICAgICAgICAgYWxnb3JpdGhtOiBudWxsLFxuICAgICAgICAgICAgICAgIGZpbHRlcjogbnVsbCxcbiAgICAgICAgICAgICAgICBpc01hdGNoOiBudWxsLFxuICAgICAgICAgICAgICAgIG9mZnNldDogMCxcbiAgICAgICAgICAgICAgICBsaW1pdDogSW5maW5pdHksXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLCAvLyBJZiBzZXQsIGFueSBwcm9taXNlIG11c3QgYmUgcmVqZWN0ZWQgd2l0aCB0aGlzIGVycm9yXG4gICAgICAgICAgICAgICAgb3I6IHdoZXJlQ3R4Lm9yXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZXh0ZW5kKENvbGxlY3Rpb24ucHJvdG90eXBlLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBDb2xsZWN0aW9uIFByaXZhdGUgRnVuY3Rpb25zXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhZGRGaWx0ZXIoY3R4LCBmbikge1xuICAgICAgICAgICAgICAgIGN0eC5maWx0ZXIgPSBjb21iaW5lKGN0eC5maWx0ZXIsIGZuKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkTWF0Y2hGaWx0ZXIoY3R4LCBmbikge1xuICAgICAgICAgICAgICAgIGN0eC5pc01hdGNoID0gY29tYmluZShjdHguaXNNYXRjaCwgZm4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRJbmRleE9yU3RvcmUoY3R4LCBzdG9yZSkge1xuICAgICAgICAgICAgICAgIGlmIChjdHguaXNQcmltS2V5KSByZXR1cm4gc3RvcmU7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4U3BlYyA9IGN0eC50YWJsZS5zY2hlbWEuaWR4QnlOYW1lW2N0eC5pbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKCFpbmRleFNwZWMpIHRocm93IG5ldyBFcnJvcihcIktleVBhdGggXCIgKyBjdHguaW5kZXggKyBcIiBvbiBvYmplY3Qgc3RvcmUgXCIgKyBzdG9yZS5uYW1lICsgXCIgaXMgbm90IGluZGV4ZWRcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN0eC5pc1ByaW1LZXkgPyBzdG9yZSA6IHN0b3JlLmluZGV4KGluZGV4U3BlYy5uYW1lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gb3BlbkN1cnNvcihjdHgsIHN0b3JlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldEluZGV4T3JTdG9yZShjdHgsIHN0b3JlKVtjdHgub3BdKGN0eC5yYW5nZSB8fCBudWxsLCBjdHguZGlyICsgY3R4LnVuaXF1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGl0ZXIoY3R4LCBmbiwgcmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgIGlmICghY3R4Lm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZXJhdGUob3BlbkN1cnNvcihjdHgsIGlkYnN0b3JlKSwgY29tYmluZShjdHguYWxnb3JpdGhtLCBjdHguZmlsdGVyKSwgZm4sIHJlc29sdmUsIHJlamVjdCwgY3R4LnRhYmxlLmhvb2sucmVhZGluZy5maXJlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbHRlciA9IGN0eC5maWx0ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2V0ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJpbUtleSA9IGN0eC50YWJsZS5zY2hlbWEucHJpbUtleS5rZXlQYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc29sdmVkID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVzb2x2ZWJvdGgoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCsrcmVzb2x2ZWQgPT09IDIpIHJlc29sdmUoKTsgLy8gU2VlbXMgbGlrZSB3ZSBqdXN0IHN1cHBvcnQgb3IgYnR3biBtYXggMiBleHByZXNzaW9ucywgYnV0IHRoZXJlIGFyZSBubyBsaW1pdCBiZWNhdXNlIHdlIGRvIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gdW5pb24oaXRlbSwgY3Vyc29yLCBhZHZhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmaWx0ZXIgfHwgZmlsdGVyKGN1cnNvciwgYWR2YW5jZSwgcmVzb2x2ZWJvdGgsIHJlamVjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IGN1cnNvci5wcmltYXJ5S2V5LnRvU3RyaW5nKCk7IC8vIENvbnZlcnRzIGFueSBEYXRlIHRvIFN0cmluZywgU3RyaW5nIHRvIFN0cmluZywgTnVtYmVyIHRvIFN0cmluZyBhbmQgQXJyYXkgdG8gY29tbWEtc2VwYXJhdGVkIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNldC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRba2V5XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbihpdGVtLCBjdXJzb3IsIGFkdmFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgub3IuX2l0ZXJhdGUodW5pb24sIHJlc29sdmVib3RoLCByZWplY3QsIGlkYnN0b3JlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGUob3BlbkN1cnNvcihjdHgsIGlkYnN0b3JlKSwgY3R4LmFsZ29yaXRobSwgdW5pb24sIHJlc29sdmVib3RoLCByZWplY3QsIGN0eC50YWJsZS5ob29rLnJlYWRpbmcuZmlyZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0SW5zdGFuY2VUZW1wbGF0ZShjdHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3R4LnRhYmxlLnNjaGVtYS5pbnN0YW5jZVRlbXBsYXRlO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIHJldHVybiB7XG5cbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8vIENvbGxlY3Rpb24gUHJvdGVjdGVkIEZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgICAgICBfcmVhZDogZnVuY3Rpb24gKGZuLCBjYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3R4LmVycm9yKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN0eC50YWJsZS5fdHJhbnMobnVsbCwgZnVuY3Rpb24gcmVqZWN0b3IocmVzb2x2ZSwgcmVqZWN0KSB7IHJlamVjdChjdHguZXJyb3IpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN0eC50YWJsZS5faWRic3RvcmUoUkVBRE9OTFksIGZuKS50aGVuKGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF93cml0ZTogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHguZXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3R4LnRhYmxlLl90cmFucyhudWxsLCBmdW5jdGlvbiByZWplY3RvcihyZXNvbHZlLCByZWplY3QpIHsgcmVqZWN0KGN0eC5lcnJvcik7IH0pO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3R4LnRhYmxlLl9pZGJzdG9yZShSRUFEV1JJVEUsIGZuLCBcImxvY2tlZFwiKTsgLy8gV2hlbiBkb2luZyB3cml0ZSBvcGVyYXRpb25zIG9uIGNvbGxlY3Rpb25zLCBhbHdheXMgbG9jayB0aGUgb3BlcmF0aW9uIHNvIHRoYXQgdXBjb21pbmcgb3BlcmF0aW9ucyBnZXRzIHF1ZXVlZC5cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9hZGRBbGdvcml0aG06IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICAgICAgICAgICAgICBjdHguYWxnb3JpdGhtID0gY29tYmluZShjdHguYWxnb3JpdGhtLCBmbik7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIF9pdGVyYXRlOiBmdW5jdGlvbiAoZm4sIHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXIodGhpcy5fY3R4LCBmbiwgcmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gQ29sbGVjdGlvbiBQdWJsaWMgbWV0aG9kc1xuICAgICAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgICAgICBlYWNoOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcblxuICAgICAgICAgICAgICAgICAgICBmYWtlICYmIGZuKGdldEluc3RhbmNlVGVtcGxhdGUoY3R4KSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWQoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCwgaWRic3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXIoY3R4LCBmbiwgcmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBjb3VudDogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmYWtlKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKDApLnRoZW4oY2IpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHggPSB0aGlzLl9jdHg7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0eC5maWx0ZXIgfHwgY3R4LmFsZ29yaXRobSB8fCBjdHgub3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gZmlsdGVycyBhcmUgYXBwbGllZCBvciAnb3JlZCcgY29sbGVjdGlvbnMgYXJlIHVzZWQsIHdlIG11c3QgY291bnQgbWFudWFsbHlcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVhZChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0LCBpZGJzdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXIoY3R4LCBmdW5jdGlvbiAoKSB7ICsrY291bnQ7IHJldHVybiBmYWxzZTsgfSwgZnVuY3Rpb24gKCkgeyByZXNvbHZlKGNvdW50KTsgfSwgcmVqZWN0LCBpZGJzdG9yZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBjYik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UsIHdlIGNhbiB1c2UgdGhlIGNvdW50KCkgbWV0aG9kIGlmIHRoZSBpbmRleC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWFkKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkeCA9IGdldEluZGV4T3JTdG9yZShjdHgsIGlkYnN0b3JlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVxID0gKGN0eC5yYW5nZSA/IGlkeC5jb3VudChjdHgucmFuZ2UpIDogaWR4LmNvdW50KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgW1wiY2FsbGluZ1wiLCBcImNvdW50KClcIiwgXCJvblwiLCBzZWxmLm5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShNYXRoLm1pbihlLnRhcmdldC5yZXN1bHQsIE1hdGgubWF4KDAsIGN0eC5saW1pdCAtIGN0eC5vZmZzZXQpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGNiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBzb3J0Qnk6IGZ1bmN0aW9uIChrZXlQYXRoLCBjYikge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJrZXlQYXRoXCIgdHlwZT1cIlN0cmluZ1wiPjwvcGFyYW0+XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJ0cyA9IGtleVBhdGguc3BsaXQoJy4nKS5yZXZlcnNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0UGFydCA9IHBhcnRzWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4ID0gcGFydHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0dmFsKG9iaiwgaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkpIHJldHVybiBnZXR2YWwob2JqW3BhcnRzW2ldXSwgaSAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialtsYXN0UGFydF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIG9yZGVyID0gdGhpcy5fY3R4LmRpciA9PT0gXCJuZXh0XCIgPyAxIDogLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gc29ydGVyKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhVmFsID0gZ2V0dmFsKGEsIGxhc3RJbmRleCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYlZhbCA9IGdldHZhbChiLCBsYXN0SW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFWYWwgPCBiVmFsID8gLW9yZGVyIDogYVZhbCA+IGJWYWwgPyBvcmRlciA6IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9BcnJheShmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEuc29ydChzb3J0ZXIpO1xuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgdG9BcnJheTogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWFkKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmYWtlICYmIHJlc29sdmUoW2dldEluc3RhbmNlVGVtcGxhdGUoY3R4KV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXIoY3R4LCBmdW5jdGlvbiAoaXRlbSkgeyBhLnB1c2goaXRlbSk7IH0sIGZ1bmN0aW9uIGFycmF5Q29tcGxldGUoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCwgaWRic3RvcmUpO1xuICAgICAgICAgICAgICAgICAgICB9LCBjYik7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIG9mZnNldDogZnVuY3Rpb24gKG9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICAgICAgICAgICAgICBpZiAob2Zmc2V0IDw9IDApIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHgub2Zmc2V0ICs9IG9mZnNldDsgLy8gRm9yIGNvdW50KClcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHgub3IgJiYgIWN0eC5hbGdvcml0aG0gJiYgIWN0eC5maWx0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEZpbHRlcihjdHgsIGZ1bmN0aW9uIG9mZnNldEZpbHRlcihjdXJzb3IsIGFkdmFuY2UsIHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID09PSAwKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID09PSAxKSB7IC0tb2Zmc2V0OyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKGZ1bmN0aW9uICgpIHsgY3Vyc29yLmFkdmFuY2Uob2Zmc2V0KTsgb2Zmc2V0ID0gMDsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRGaWx0ZXIoY3R4LCBmdW5jdGlvbiBvZmZzZXRGaWx0ZXIoY3Vyc29yLCBhZHZhbmNlLCByZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgtLW9mZnNldCA8IDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGxpbWl0OiBmdW5jdGlvbiAobnVtUm93cykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdHgubGltaXQgPSBNYXRoLm1pbih0aGlzLl9jdHgubGltaXQsIG51bVJvd3MpOyAvLyBGb3IgY291bnQoKVxuICAgICAgICAgICAgICAgICAgICBhZGRGaWx0ZXIodGhpcy5fY3R4LCBmdW5jdGlvbiAoY3Vyc29yLCBhZHZhbmNlLCByZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoLS1udW1Sb3dzIDw9IDApIGFkdmFuY2UocmVzb2x2ZSk7IC8vIFN0b3AgYWZ0ZXIgdGhpcyBpdGVtIGhhcyBiZWVuIGluY2x1ZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVtUm93cyA+PSAwOyAvLyBJZiBudW1Sb3dzIGlzIGFscmVhZHkgYmVsb3cgMCwgcmV0dXJuIGZhbHNlIGJlY2F1c2UgdGhlbiAwIHdhcyBwYXNzZWQgdG8gbnVtUm93cyBpbml0aWFsbHkuIE90aGVyd2lzZSB3ZSB3b3VsZG50IGNvbWUgaGVyZS5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICB1bnRpbDogZnVuY3Rpb24gKGZpbHRlckZ1bmN0aW9uLCBiSW5jbHVkZVN0b3BFbnRyeSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICAgICAgICAgICAgICBmYWtlICYmIGZpbHRlckZ1bmN0aW9uKGdldEluc3RhbmNlVGVtcGxhdGUoY3R4KSk7XG4gICAgICAgICAgICAgICAgICAgIGFkZEZpbHRlcih0aGlzLl9jdHgsIGZ1bmN0aW9uIChjdXJzb3IsIGFkdmFuY2UsIHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXJGdW5jdGlvbihjdXJzb3IudmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZShyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYkluY2x1ZGVTdG9wRW50cnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGZpcnN0OiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGltaXQoMSkudG9BcnJheShmdW5jdGlvbiAoYSkgeyByZXR1cm4gYVswXTsgfSkudGhlbihjYik7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGxhc3Q6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlKCkuZmlyc3QoY2IpO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBhbmQ6IGZ1bmN0aW9uIChmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJqc0Z1bmN0aW9uRmlsdGVyXCIgdHlwZT1cIkZ1bmN0aW9uXCI+ZnVuY3Rpb24odmFsKXtyZXR1cm4gdHJ1ZS9mYWxzZX08L3BhcmFtPlxuICAgICAgICAgICAgICAgICAgICBmYWtlICYmIGZpbHRlckZ1bmN0aW9uKGdldEluc3RhbmNlVGVtcGxhdGUodGhpcy5fY3R4KSk7XG4gICAgICAgICAgICAgICAgICAgIGFkZEZpbHRlcih0aGlzLl9jdHgsIGZ1bmN0aW9uIChjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJGdW5jdGlvbihjdXJzb3IudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkTWF0Y2hGaWx0ZXIodGhpcy5fY3R4LCBmaWx0ZXJGdW5jdGlvbik7IC8vIG1hdGNoIGZpbHRlcnMgbm90IHVzZWQgaW4gRGV4aWUuanMgYnV0IGNhbiBiZSB1c2VkIGJ5IDNyZCBwYXJ0IGxpYnJhcmllcyB0byB0ZXN0IGEgY29sbGVjdGlvbiBmb3IgYSBtYXRjaCB3aXRob3V0IHF1ZXJ5aW5nIERCLiBVc2VkIGJ5IERleGllLk9ic2VydmFibGUuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBvcjogZnVuY3Rpb24gKGluZGV4TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFdoZXJlQ2xhdXNlKHRoaXMuX2N0eC50YWJsZSwgaW5kZXhOYW1lLCB0aGlzKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgcmV2ZXJzZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdHguZGlyID0gKHRoaXMuX2N0eC5kaXIgPT09IFwicHJldlwiID8gXCJuZXh0XCIgOiBcInByZXZcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9vbmRpcmVjdGlvbmNoYW5nZSkgdGhpcy5fb25kaXJlY3Rpb25jaGFuZ2UodGhpcy5fY3R4LmRpcik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBkZXNjOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgZWFjaEtleTogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgICAgICAgICAgICAgIGZha2UgJiYgY2IoZ2V0QnlLZXlQYXRoKGdldEluc3RhbmNlVGVtcGxhdGUodGhpcy5fY3R4KSwgdGhpcy5fY3R4LmluZGV4ID8gdGhpcy5fY3R4LnRhYmxlLnNjaGVtYS5pZHhCeU5hbWVbdGhpcy5fY3R4LmluZGV4XS5rZXlQYXRoIDogdGhpcy5fY3R4LnRhYmxlLnNjaGVtYS5wcmltS2V5LmtleVBhdGgpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHguaXNQcmltS2V5KSBjdHgub3AgPSBcIm9wZW5LZXlDdXJzb3JcIjsgLy8gTmVlZCB0aGUgY2hlY2sgYmVjYXVzZSBJREJPYmplY3RTdG9yZSBkb2VzIG5vdCBoYXZlIFwib3BlbktleUN1cnNvcigpXCIgd2hpbGUgSURCSW5kZXggaGFzLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICh2YWwsIGN1cnNvcikgeyBjYihjdXJzb3Iua2V5LCBjdXJzb3IpOyB9KTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgZWFjaFVuaXF1ZUtleTogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N0eC51bmlxdWUgPSBcInVuaXF1ZVwiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoS2V5KGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAga2V5czogZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3R4LmlzUHJpbUtleSkgY3R4Lm9wID0gXCJvcGVuS2V5Q3Vyc29yXCI7IC8vIE5lZWQgdGhlIGNoZWNrIGJlY2F1c2UgSURCT2JqZWN0U3RvcmUgZG9lcyBub3QgaGF2ZSBcIm9wZW5LZXlDdXJzb3IoKVwiIHdoaWxlIElEQkluZGV4IGhhcy5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZha2UpIHJldHVybiBuZXcgUHJvbWlzZSh0aGlzLmVhY2hLZXkuYmluZCh0aGlzKSkudGhlbihmdW5jdGlvbih4KSB7IHJldHVybiBbeF07IH0pLnRoZW4oY2IpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uIChpdGVtLCBjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEucHVzaChjdXJzb3Iua2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgICAgICAgICAgICAgfSkudGhlbihjYik7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHVuaXF1ZUtleXM6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdHgudW5pcXVlID0gXCJ1bmlxdWVcIjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMua2V5cyhjYik7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGZpcnN0S2V5OiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGltaXQoMSkua2V5cyhmdW5jdGlvbiAoYSkgeyByZXR1cm4gYVswXTsgfSkudGhlbihjYik7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGxhc3RLZXk6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlKCkuZmlyc3RLZXkoY2IpO1xuICAgICAgICAgICAgICAgIH0sXG5cblxuICAgICAgICAgICAgICAgIGRpc3RpbmN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgYWRkRmlsdGVyKHRoaXMuX2N0eCwgZnVuY3Rpb24gKGN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0cktleSA9IGN1cnNvci5wcmltYXJ5S2V5LnRvU3RyaW5nKCk7IC8vIENvbnZlcnRzIGFueSBEYXRlIHRvIFN0cmluZywgU3RyaW5nIHRvIFN0cmluZywgTnVtYmVyIHRvIFN0cmluZyBhbmQgQXJyYXkgdG8gY29tbWEtc2VwYXJhdGVkIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZvdW5kID0gc2V0Lmhhc093blByb3BlcnR5KHN0cktleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRbc3RyS2V5XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIWZvdW5kO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV3JpdGVhYmxlQ29sbGVjdGlvbiBDbGFzc1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICBmdW5jdGlvbiBXcml0ZWFibGVDb2xsZWN0aW9uKCkge1xuICAgICAgICAgICAgQ29sbGVjdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVyaXZlKFdyaXRlYWJsZUNvbGxlY3Rpb24pLmZyb20oQ29sbGVjdGlvbikuZXh0ZW5kKHtcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFdyaXRlYWJsZUNvbGxlY3Rpb24gUHVibGljIE1ldGhvZHNcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIG1vZGlmeTogZnVuY3Rpb24gKGNoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IHRoaXMuX2N0eCxcbiAgICAgICAgICAgICAgICAgICAgaG9vayA9IGN0eC50YWJsZS5ob29rLFxuICAgICAgICAgICAgICAgICAgICB1cGRhdGluZ0hvb2sgPSBob29rLnVwZGF0aW5nLmZpcmUsXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0aW5nSG9vayA9IGhvb2suZGVsZXRpbmcuZmlyZTtcblxuICAgICAgICAgICAgICAgIGZha2UgJiYgdHlwZW9mIGNoYW5nZXMgPT09ICdmdW5jdGlvbicgJiYgY2hhbmdlcy5jYWxsKHsgdmFsdWU6IGN0eC50YWJsZS5zY2hlbWEuaW5zdGFuY2VUZW1wbGF0ZSB9LCBjdHgudGFibGUuc2NoZW1hLmluc3RhbmNlVGVtcGxhdGUpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dyaXRlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QsIGlkYnN0b3JlLCB0cmFucykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbW9kaWZ5ZXI7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2hhbmdlcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hhbmdlcyBpcyBhIGZ1bmN0aW9uIHRoYXQgbWF5IHVwZGF0ZSwgYWRkIG9yIGRlbGV0ZSBwcm9wdGVydGllcyBvciBldmVuIHJlcXVpcmUgYSBkZWxldGlvbiB0aGUgb2JqZWN0IGl0c2VsZiAoZGVsZXRlIHRoaXMuaXRlbSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1cGRhdGluZ0hvb2sgPT09IG5vcCAmJiBkZWxldGluZ0hvb2sgPT09IG5vcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vb25lIGNhcmVzIGFib3V0IHdoYXQgaXMgYmVpbmcgY2hhbmdlZC4gSnVzdCBsZXQgdGhlIG1vZGlmaWVyIGZ1bmN0aW9uIGJlIHRoZSBnaXZlbiBhcmd1bWVudCBhcyBpcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RpZnllciA9IGNoYW5nZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBlb3BsZSB3YW50IHRvIGtub3cgZXhhY3RseSB3aGF0IGlzIGJlaW5nIG1vZGlmaWVkIG9yIGRlbGV0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGV0IG1vZGlmeWVyIGJlIGEgcHJveHkgZnVuY3Rpb24gdGhhdCBmaW5kcyBvdXQgd2hhdCBjaGFuZ2VzIHRoZSBjYWxsZXIgaXMgYWN0dWFsbHkgZG9pbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbmQgY2FsbCB0aGUgaG9va3MgYWNjb3JkaW5nbHkhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZ5ZXIgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3JpZ0l0ZW0gPSBkZWVwQ2xvbmUoaXRlbSk7IC8vIENsb25lIHRoZSBpdGVtIGZpcnN0IHNvIHdlIGNhbiBjb21wYXJlIGxhdGVycy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZXMuY2FsbCh0aGlzLCBpdGVtKSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZTsgLy8gQ2FsbCB0aGUgcmVhbCBtb2RpZnllciBmdW5jdGlvbiAoSWYgaXQgcmV0dXJucyBmYWxzZSBleHBsaWNpdGVseSwgaXQgbWVhbnMgaXQgZG9udCB3YW50IHRvIG1vZGlmeSBhbnl0aW5nIG9uIHRoaXMgb2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoXCJ2YWx1ZVwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHJlYWwgbW9kaWZ5ZXIgZnVuY3Rpb24gcmVxdWVzdHMgYSBkZWxldGlvbiBvZiB0aGUgb2JqZWN0LiBJbmZvcm0gdGhlIGRlbGV0aW5nSG9vayB0aGF0IGEgZGVsZXRpb24gaXMgdGFraW5nIHBsYWNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRpbmdIb29rLmNhbGwodGhpcywgdGhpcy5wcmltS2V5LCBpdGVtLCB0cmFucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBkZWxldGlvbi4gQ2hlY2sgd2hhdCB3YXMgY2hhbmdlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9iamVjdERpZmYgPSBnZXRPYmplY3REaWZmKG9yaWdJdGVtLCB0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsQ2hhbmdlcyA9IHVwZGF0aW5nSG9vay5jYWxsKHRoaXMsIG9iamVjdERpZmYsIHRoaXMucHJpbUtleSwgb3JpZ0l0ZW0sIHRyYW5zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZGRpdGlvbmFsQ2hhbmdlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhvb2sgd2FudCB0byBhcHBseSBhZGRpdGlvbmFsIG1vZGlmaWNhdGlvbnMuIE1ha2Ugc3VyZSB0byBmdWxsZmlsbCB0aGUgd2lsbCBvZiB0aGUgaG9vay5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhhZGRpdGlvbmFsQ2hhbmdlcykuZm9yRWFjaChmdW5jdGlvbiAoa2V5UGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRCeUtleVBhdGgoaXRlbSwga2V5UGF0aCwgYWRkaXRpb25hbENoYW5nZXNba2V5UGF0aF0pOyAgLy8gQWRkaW5nIHtrZXlQYXRoOiB1bmRlZmluZWR9IG1lYW5zIHRoYXQgdGhlIGtleVBhdGggc2hvdWxkIGJlIGRlbGV0ZWQuIEhhbmRsZWQgYnkgc2V0QnlLZXlQYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh1cGRhdGluZ0hvb2sgPT09IG5vcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hhbmdlcyBpcyBhIHNldCBvZiB7a2V5UGF0aDogdmFsdWV9IGFuZCBubyBvbmUgaXMgbGlzdGVuaW5nIHRvIHRoZSB1cGRhdGluZyBob29rLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleVBhdGhzID0gT2JqZWN0LmtleXMoY2hhbmdlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbnVtS2V5cyA9IGtleVBhdGhzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmeWVyID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW55dGhpbmdNb2RpZmllZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtS2V5czsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXlQYXRoID0ga2V5UGF0aHNbaV0sIHZhbCA9IGNoYW5nZXNba2V5UGF0aF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXRCeUtleVBhdGgoaXRlbSwga2V5UGF0aCkgIT09IHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QnlLZXlQYXRoKGl0ZW0sIGtleVBhdGgsIHZhbCk7IC8vIEFkZGluZyB7a2V5UGF0aDogdW5kZWZpbmVkfSBtZWFucyB0aGF0IHRoZSBrZXlQYXRoIHNob3VsZCBiZSBkZWxldGVkLiBIYW5kbGVkIGJ5IHNldEJ5S2V5UGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW55dGhpbmdNb2RpZmllZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFueXRoaW5nTW9kaWZpZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoYW5nZXMgaXMgYSBzZXQgb2Yge2tleVBhdGg6IHZhbHVlfSBhbmQgcGVvcGxlIGFyZSBsaXN0ZW5pbmcgdG8gdGhlIHVwZGF0aW5nIGhvb2sgc28gd2UgbmVlZCB0byBjYWxsIGl0IGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWxsb3cgaXQgdG8gYWRkIGFkZGl0aW9uYWwgbW9kaWZpY2F0aW9ucyB0byBtYWtlLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9yaWdDaGFuZ2VzID0gY2hhbmdlcztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXMgPSBzaGFsbG93Q2xvbmUob3JpZ0NoYW5nZXMpOyAvLyBMZXQncyB3b3JrIHdpdGggYSBjbG9uZSBvZiB0aGUgY2hhbmdlcyBrZXlQYXRoL3ZhbHVlIHNldCBzbyB0aGF0IHdlIGNhbiByZXN0b3JlIGl0IGluIGNhc2UgYSBob29rIGV4dGVuZHMgaXQuXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RpZnllciA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFueXRoaW5nTW9kaWZpZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWRkaXRpb25hbENoYW5nZXMgPSB1cGRhdGluZ0hvb2suY2FsbCh0aGlzLCBjaGFuZ2VzLCB0aGlzLnByaW1LZXksIGRlZXBDbG9uZShpdGVtKSwgdHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZGRpdGlvbmFsQ2hhbmdlcykgZXh0ZW5kKGNoYW5nZXMsIGFkZGl0aW9uYWxDaGFuZ2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjaGFuZ2VzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXlQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWwgPSBjaGFuZ2VzW2tleVBhdGhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0QnlLZXlQYXRoKGl0ZW0sIGtleVBhdGgpICE9PSB2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEJ5S2V5UGF0aChpdGVtLCBrZXlQYXRoLCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW55dGhpbmdNb2RpZmllZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRkaXRpb25hbENoYW5nZXMpIGNoYW5nZXMgPSBzaGFsbG93Q2xvbmUob3JpZ0NoYW5nZXMpOyAvLyBSZXN0b3JlIG9yaWdpbmFsIGNoYW5nZXMgZm9yIG5leHQgaXRlcmF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFueXRoaW5nTW9kaWZpZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdWNjZXNzQ291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXRlcmF0aW9uQ29tcGxldGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZhaWx1cmVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHZhciBmYWlsS2V5cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEtleSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbW9kaWZ5SXRlbShpdGVtLCBjdXJzb3IsIGFkdmFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRLZXkgPSBjdXJzb3IucHJpbWFyeUtleTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzQ29udGV4dCA9IHsgcHJpbUtleTogY3Vyc29yLnByaW1hcnlLZXksIHZhbHVlOiBpdGVtIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobW9kaWZ5ZXIuY2FsbCh0aGlzQ29udGV4dCwgaXRlbSkgIT09IGZhbHNlKSB7IC8vIElmIGEgY2FsbGJhY2sgZXhwbGljaXRlbHkgcmV0dXJucyBmYWxzZSwgZG8gbm90IHBlcmZvcm0gdGhlIHVwZGF0ZSFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYkRlbGV0ZSA9ICF0aGlzQ29udGV4dC5oYXNPd25Qcm9wZXJ0eShcInZhbHVlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXEgPSAoYkRlbGV0ZSA/IGN1cnNvci5kZWxldGUoKSA6IGN1cnNvci51cGRhdGUodGhpc0NvbnRleHQudmFsdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK2NvdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yID0gZXZlbnRSZWplY3RIYW5kbGVyKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWx1cmVzLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWxLZXlzLnB1c2godGhpc0NvbnRleHQucHJpbUtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzQ29udGV4dC5vbmVycm9yKSB0aGlzQ29udGV4dC5vbmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja0ZpbmlzaGVkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBDYXRjaCB0aGVzZSBlcnJvcnMgYW5kIGxldCBhIGZpbmFsIHJlamVjdGlvbiBkZWNpZGUgd2hldGhlciBvciBub3QgdG8gYWJvcnQgZW50aXJlIHRyYW5zYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgYkRlbGV0ZSA/IFtcImRlbGV0aW5nXCIsIGl0ZW0sIFwiZnJvbVwiLCBjdHgudGFibGUubmFtZV0gOiBbXCJtb2RpZnlpbmdcIiwgaXRlbSwgXCJvblwiLCBjdHgudGFibGUubmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXNDb250ZXh0Lm9uc3VjY2VzcykgdGhpc0NvbnRleHQub25zdWNjZXNzKHRoaXNDb250ZXh0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytzdWNjZXNzQ291bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrRmluaXNoZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpc0NvbnRleHQub25zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG9vayB3aWxsIGV4cGVjdCBlaXRoZXIgb25lcnJvciBvciBvbnN1Y2Nlc3MgdG8gYWx3YXlzIGJlIGNhbGxlZCFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzQ29udGV4dC5vbnN1Y2Nlc3ModGhpc0NvbnRleHQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZG9SZWplY3QoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsdXJlcy5wdXNoKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWxLZXlzLnB1c2goY3VycmVudEtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBNb2RpZnlFcnJvcihcIkVycm9yIG1vZGlmeWluZyBvbmUgb3IgbW9yZSBvYmplY3RzXCIsIGZhaWx1cmVzLCBzdWNjZXNzQ291bnQsIGZhaWxLZXlzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBjaGVja0ZpbmlzaGVkKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZXJhdGlvbkNvbXBsZXRlICYmIHN1Y2Nlc3NDb3VudCArIGZhaWx1cmVzLmxlbmd0aCA9PT0gY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmFpbHVyZXMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9SZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc3VjY2Vzc0NvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9pdGVyYXRlKG1vZGlmeUl0ZW0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGlvbkNvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrRmluaXNoZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZG9SZWplY3QsIGlkYnN0b3JlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICdkZWxldGUnOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9kaWZ5KGZ1bmN0aW9uICgpIHsgZGVsZXRlIHRoaXMudmFsdWU7IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSGVscCBmdW5jdGlvbnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vXG5cbiAgICAgICAgZnVuY3Rpb24gbG93ZXJWZXJzaW9uRmlyc3QoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEuX2NmZy52ZXJzaW9uIC0gYi5fY2ZnLnZlcnNpb247XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzZXRBcGlPblBsYWNlKG9ianMsIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnksIHRhYmxlTmFtZXMsIG1vZGUsIGRic2NoZW1hLCBlbmFibGVQcm9oaWJpdGVkREIpIHtcbiAgICAgICAgICAgIHRhYmxlTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAodGFibGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhYmxlSW5zdGFuY2UgPSBkYi5fdGFibGVGYWN0b3J5KG1vZGUsIGRic2NoZW1hW3RhYmxlTmFtZV0sIHRyYW5zYWN0aW9uUHJvbWlzZUZhY3RvcnkpO1xuICAgICAgICAgICAgICAgIG9ianMuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghb2JqW3RhYmxlTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVQcm9oaWJpdGVkREIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCB0YWJsZU5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHZhciBjdXJyZW50VHJhbnMgPSBQcm9taXNlLlBTRCAmJiBQcm9taXNlLlBTRC50cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VHJhbnMgJiYgY3VycmVudFRyYW5zLmRiID09PSBkYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50VHJhbnMudGFibGVzW3RhYmxlTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFibGVJbnN0YW5jZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpbdGFibGVOYW1lXSA9IHRhYmxlSW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlVGFibGVzQXBpKG9ianMpIHtcbiAgICAgICAgICAgIG9ianMuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2JqW2tleV0gaW5zdGFuY2VvZiBUYWJsZSkgZGVsZXRlIG9ialtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXRlcmF0ZShyZXEsIGZpbHRlciwgZm4sIHJlc29sdmUsIHJlamVjdCwgcmVhZGluZ0hvb2spIHtcbiAgICAgICAgICAgIHZhciBwc2QgPSBQcm9taXNlLlBTRDtcbiAgICAgICAgICAgIHJlYWRpbmdIb29rID0gcmVhZGluZ0hvb2sgfHwgbWlycm9yO1xuICAgICAgICAgICAgaWYgKCFyZXEub25lcnJvcikgcmVxLm9uZXJyb3IgPSBldmVudFJlamVjdEhhbmRsZXIocmVqZWN0KTtcbiAgICAgICAgICAgIGlmIChmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gdHJ5Y2F0Y2goZnVuY3Rpb24gZmlsdGVyX3JlY29yZChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJzb3IgPSByZXEucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IGZ1bmN0aW9uICgpIHsgY3Vyc29yLmNvbnRpbnVlKCk7IH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVyKGN1cnNvciwgZnVuY3Rpb24gKGFkdmFuY2VyKSB7IGMgPSBhZHZhbmNlcjsgfSwgcmVzb2x2ZSwgcmVqZWN0KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbihyZWFkaW5nSG9vayhjdXJzb3IudmFsdWUpLCBjdXJzb3IsIGZ1bmN0aW9uIChhZHZhbmNlcikgeyBjID0gYWR2YW5jZXI7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYygpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgcmVqZWN0LCBwc2QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gdHJ5Y2F0Y2goZnVuY3Rpb24gZmlsdGVyX3JlY29yZChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJzb3IgPSByZXEucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IGZ1bmN0aW9uICgpIHsgY3Vyc29yLmNvbnRpbnVlKCk7IH07XG4gICAgICAgICAgICAgICAgICAgICAgICBmbihyZWFkaW5nSG9vayhjdXJzb3IudmFsdWUpLCBjdXJzb3IsIGZ1bmN0aW9uIChhZHZhbmNlcikgeyBjID0gYWR2YW5jZXI7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYygpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgcmVqZWN0LCBwc2QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcGFyc2VJbmRleFN5bnRheChpbmRleGVzKSB7XG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJpbmRleGVzXCIgdHlwZT1cIlN0cmluZ1wiPjwvcGFyYW0+XG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cIkFycmF5XCIgZWxlbWVudFR5cGU9XCJJbmRleFNwZWNcIj48L3JldHVybnM+XG4gICAgICAgICAgICB2YXIgcnYgPSBbXTtcbiAgICAgICAgICAgIGluZGV4ZXMuc3BsaXQoJywnKS5mb3JFYWNoKGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXgudHJpbSgpO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gaW5kZXgucmVwbGFjZShcIiZcIiwgXCJcIikucmVwbGFjZShcIisrXCIsIFwiXCIpLnJlcGxhY2UoXCIqXCIsIFwiXCIpO1xuICAgICAgICAgICAgICAgIHZhciBrZXlQYXRoID0gKG5hbWUuaW5kZXhPZignWycpICE9PSAwID8gbmFtZSA6IGluZGV4LnN1YnN0cmluZyhpbmRleC5pbmRleE9mKCdbJykgKyAxLCBpbmRleC5pbmRleE9mKCddJykpLnNwbGl0KCcrJykpO1xuXG4gICAgICAgICAgICAgICAgcnYucHVzaChuZXcgSW5kZXhTcGVjKFxuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBrZXlQYXRoIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4LmluZGV4T2YoJyYnKSAhPT0gLTEsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4LmluZGV4T2YoJyonKSAhPT0gLTEsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4LmluZGV4T2YoXCIrK1wiKSAhPT0gLTEsXG4gICAgICAgICAgICAgICAgICAgIEFycmF5LmlzQXJyYXkoa2V5UGF0aCksXG4gICAgICAgICAgICAgICAgICAgIGtleVBhdGguaW5kZXhPZignLicpICE9PSAtMVxuICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcnY7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhc2NlbmRpbmcoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZGVzY2VuZGluZyhhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSA8IGIgPyAxIDogYSA+IGIgPyAtMSA6IDA7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wb3VuZENvbXBhcmUoaXRlbUNvbXBhcmUpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gaXRlbUNvbXBhcmUoYVtpXSwgYltpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IDApIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICsraTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IGEubGVuZ3RoIHx8IGkgPT09IGIubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW1Db21wYXJlKGEubGVuZ3RoLCBiLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbWJpbmUoZmlsdGVyMSwgZmlsdGVyMikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlcjEgPyBmaWx0ZXIyID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmlsdGVyMS5hcHBseSh0aGlzLCBhcmd1bWVudHMpICYmIGZpbHRlcjIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSA6IGZpbHRlcjEgOiBmaWx0ZXIyO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaGFzSUVEZWxldGVPYmplY3RTdG9yZUJ1ZygpIHtcbiAgICAgICAgICAgIC8vIEFzc3VtZSBidWcgaXMgcHJlc2VudCBpbiBJRTEwIGFuZCBJRTExIGJ1dCBkb250IGV4cGVjdCBpdCBpbiBuZXh0IHZlcnNpb24gb2YgSUUgKElFMTIpXG4gICAgICAgICAgICByZXR1cm4gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiVHJpZGVudFwiKSA+PSAwIHx8IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk1TSUVcIikgPj0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJlYWRHbG9iYWxTY2hlbWEoKSB7XG4gICAgICAgICAgICBkYi52ZXJubyA9IGlkYmRiLnZlcnNpb24gLyAxMDtcbiAgICAgICAgICAgIGRiLl9kYlNjaGVtYSA9IGdsb2JhbFNjaGVtYSA9IHt9O1xuICAgICAgICAgICAgZGJTdG9yZU5hbWVzID0gW10uc2xpY2UuY2FsbChpZGJkYi5vYmplY3RTdG9yZU5hbWVzLCAwKTtcbiAgICAgICAgICAgIGlmIChkYlN0b3JlTmFtZXMubGVuZ3RoID09PSAwKSByZXR1cm47IC8vIERhdGFiYXNlIGNvbnRhaW5zIG5vIHN0b3Jlcy5cbiAgICAgICAgICAgIHZhciB0cmFucyA9IGlkYmRiLnRyYW5zYWN0aW9uKHNhZmFyaU11bHRpU3RvcmVGaXgoZGJTdG9yZU5hbWVzKSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgICAgICBkYlN0b3JlTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAoc3RvcmVOYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gdHJhbnMub2JqZWN0U3RvcmUoc3RvcmVOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAga2V5UGF0aCA9IHN0b3JlLmtleVBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGRvdHRlZCA9IGtleVBhdGggJiYgdHlwZW9mIGtleVBhdGggPT09ICdzdHJpbmcnICYmIGtleVBhdGguaW5kZXhPZignLicpICE9PSAtMTtcbiAgICAgICAgICAgICAgICB2YXIgcHJpbUtleSA9IG5ldyBJbmRleFNwZWMoa2V5UGF0aCwga2V5UGF0aCB8fCBcIlwiLCBmYWxzZSwgZmFsc2UsICEhc3RvcmUuYXV0b0luY3JlbWVudCwga2V5UGF0aCAmJiB0eXBlb2Yga2V5UGF0aCAhPT0gJ3N0cmluZycsIGRvdHRlZCk7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHN0b3JlLmluZGV4TmFtZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkYmluZGV4ID0gc3RvcmUuaW5kZXgoc3RvcmUuaW5kZXhOYW1lc1tqXSk7XG4gICAgICAgICAgICAgICAgICAgIGtleVBhdGggPSBpZGJpbmRleC5rZXlQYXRoO1xuICAgICAgICAgICAgICAgICAgICBkb3R0ZWQgPSBrZXlQYXRoICYmIHR5cGVvZiBrZXlQYXRoID09PSAnc3RyaW5nJyAmJiBrZXlQYXRoLmluZGV4T2YoJy4nKSAhPT0gLTE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IG5ldyBJbmRleFNwZWMoaWRiaW5kZXgubmFtZSwga2V5UGF0aCwgISFpZGJpbmRleC51bmlxdWUsICEhaWRiaW5kZXgubXVsdGlFbnRyeSwgZmFsc2UsIGtleVBhdGggJiYgdHlwZW9mIGtleVBhdGggIT09ICdzdHJpbmcnLCBkb3R0ZWQpO1xuICAgICAgICAgICAgICAgICAgICBpbmRleGVzLnB1c2goaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBnbG9iYWxTY2hlbWFbc3RvcmVOYW1lXSA9IG5ldyBUYWJsZVNjaGVtYShzdG9yZU5hbWUsIHByaW1LZXksIGluZGV4ZXMsIHt9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2V0QXBpT25QbGFjZShbYWxsVGFibGVzXSwgZGIuX3RyYW5zUHJvbWlzZUZhY3RvcnksIE9iamVjdC5rZXlzKGdsb2JhbFNjaGVtYSksIFJFQURXUklURSwgZ2xvYmFsU2NoZW1hKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFkanVzdFRvRXhpc3RpbmdJbmRleE5hbWVzKHNjaGVtYSwgaWRidHJhbnMpIHtcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5cbiAgICAgICAgICAgIC8vLyBJc3N1ZSAjMzAgUHJvYmxlbSB3aXRoIGV4aXN0aW5nIGRiIC0gYWRqdXN0IHRvIGV4aXN0aW5nIGluZGV4IG5hbWVzIHdoZW4gbWlncmF0aW5nIGZyb20gbm9uLWRleGllIGRiXG4gICAgICAgICAgICAvLy8gPC9zdW1tYXJ5PlxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwic2NoZW1hXCIgdHlwZT1cIk9iamVjdFwiPk1hcCBiZXR3ZWVuIG5hbWUgYW5kIFRhYmxlU2NoZW1hPC9wYXJhbT5cbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImlkYnRyYW5zXCIgdHlwZT1cIklEQlRyYW5zYWN0aW9uXCI+PC9wYXJhbT5cbiAgICAgICAgICAgIHZhciBzdG9yZU5hbWVzID0gaWRidHJhbnMuZGIub2JqZWN0U3RvcmVOYW1lcztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RvcmVOYW1lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIHZhciBzdG9yZU5hbWUgPSBzdG9yZU5hbWVzW2ldO1xuICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IGlkYnRyYW5zLm9iamVjdFN0b3JlKHN0b3JlTmFtZSk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzdG9yZS5pbmRleE5hbWVzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleE5hbWUgPSBzdG9yZS5pbmRleE5hbWVzW2pdO1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5UGF0aCA9IHN0b3JlLmluZGV4KGluZGV4TmFtZSkua2V5UGF0aDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRleGllTmFtZSA9IHR5cGVvZiBrZXlQYXRoID09PSAnc3RyaW5nJyA/IGtleVBhdGggOiBcIltcIiArIFtdLnNsaWNlLmNhbGwoa2V5UGF0aCkuam9pbignKycpICsgXCJdXCI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2hlbWFbc3RvcmVOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4U3BlYyA9IHNjaGVtYVtzdG9yZU5hbWVdLmlkeEJ5TmFtZVtkZXhpZU5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4U3BlYykgaW5kZXhTcGVjLm5hbWUgPSBpbmRleE5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHRlbmQodGhpcywge1xuICAgICAgICAgICAgQ29sbGVjdGlvbjogQ29sbGVjdGlvbixcbiAgICAgICAgICAgIFRhYmxlOiBUYWJsZSxcbiAgICAgICAgICAgIFRyYW5zYWN0aW9uOiBUcmFuc2FjdGlvbixcbiAgICAgICAgICAgIFZlcnNpb246IFZlcnNpb24sXG4gICAgICAgICAgICBXaGVyZUNsYXVzZTogV2hlcmVDbGF1c2UsXG4gICAgICAgICAgICBXcml0ZWFibGVDb2xsZWN0aW9uOiBXcml0ZWFibGVDb2xsZWN0aW9uLFxuICAgICAgICAgICAgV3JpdGVhYmxlVGFibGU6IFdyaXRlYWJsZVRhYmxlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGluaXQoKTtcblxuICAgICAgICBhZGRvbnMuZm9yRWFjaChmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgIGZuKGRiKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBQcm9taXNlIENsYXNzXG4gICAgLy9cbiAgICAvLyBBIHZhcmlhbnQgb2YgcHJvbWlzZS1saWdodCAoaHR0cHM6Ly9naXRodWIuY29tL3RheWxvcmhha2VzL3Byb21pc2UtbGlnaHQpIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS90YXlsb3JoYWtlcyAtIGFuIEErIGFuZCBFQ01BU0NSSVBUIDYgY29tcGxpYW50IFByb21pc2UgaW1wbGVtZW50YXRpb24uXG4gICAgLy9cbiAgICAvLyBNb2RpZmllZCBieSBEYXZpZCBGYWhsYW5kZXIgdG8gYmUgaW5kZXhlZERCIGNvbXBsaWFudCAoU2VlIGRpc2N1c3Npb246IGh0dHBzOi8vZ2l0aHViLmNvbS9wcm9taXNlcy1hcGx1cy9wcm9taXNlcy1zcGVjL2lzc3Vlcy80NSkgLlxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gd2lsbCBub3QgdXNlIHNldFRpbWVvdXQgb3Igc2V0SW1tZWRpYXRlIHdoZW4gaXQncyBub3QgbmVlZGVkLiBUaGUgYmVoYXZpb3IgaXMgMTAwJSBQcm9taXNlL0ErIGNvbXBsaWFudCBzaW5jZVxuICAgIC8vIHRoZSBjYWxsZXIgb2YgbmV3IFByb21pc2UoKSBjYW4gYmUgY2VydGFpbiB0aGF0IHRoZSBwcm9taXNlIHdvbnQgYmUgdHJpZ2dlcmVkIHRoZSBsaW5lcyBhZnRlciBjb25zdHJ1Y3RpbmcgdGhlIHByb21pc2UuIFdlIGZpeCB0aGlzIGJ5IHVzaW5nIHRoZSBtZW1iZXIgdmFyaWFibGUgY29uc3RydWN0aW5nIHRvIGNoZWNrXG4gICAgLy8gd2hldGhlciB0aGUgb2JqZWN0IGlzIGJlaW5nIGNvbnN0cnVjdGVkIHdoZW4gcmVqZWN0IG9yIHJlc29sdmUgaXMgY2FsbGVkLiBJZiBzbywgdGhlIHVzZSBzZXRUaW1lb3V0L3NldEltbWVkaWF0ZSB0byBmdWxmaWxsIHRoZSBwcm9taXNlLCBvdGhlcndpc2UsIHdlIGtub3cgdGhhdCBpdCdzIG5vdCBuZWVkZWQuXG4gICAgLy9cbiAgICAvLyBUaGlzIHRvcGljIHdhcyBhbHNvIGRpc2N1c3NlZCBpbiB0aGUgZm9sbG93aW5nIHRocmVhZDogaHR0cHM6Ly9naXRodWIuY29tL3Byb21pc2VzLWFwbHVzL3Byb21pc2VzLXNwZWMvaXNzdWVzLzQ1IGFuZCB0aGlzIGltcGxlbWVudGF0aW9uIHNvbHZlcyB0aGF0IGlzc3VlLlxuICAgIC8vXG4gICAgLy8gQW5vdGhlciBmZWF0dXJlIHdpdGggdGhpcyBQcm9taXNlIGltcGxlbWVudGF0aW9uIGlzIHRoYXQgcmVqZWN0IHdpbGwgcmV0dXJuIGZhbHNlIGluIGNhc2Ugbm8gb25lIGNhdGNoZWQgdGhlIHJlamVjdCBjYWxsLiBUaGlzIGlzIHVzZWRcbiAgICAvLyB0byBzdG9wUHJvcGFnYXRpb24oKSBvbiB0aGUgSURCUmVxdWVzdCBlcnJvciBldmVudCBpbiBjYXNlIGl0IHdhcyBjYXRjaGVkIGJ1dCBub3Qgb3RoZXJ3aXNlLlxuICAgIC8vXG4gICAgLy8gQWxzbywgdGhlIGV2ZW50IG5ldyBQcm9taXNlKCkub251bmNhdGNoZWQgaXMgY2FsbGVkIGluIGNhc2Ugbm8gb25lIGNhdGNoZXMgYSByZWplY3QgY2FsbC4gVGhpcyBpcyB1c2VkIGZvciB1cyB0byBtYW51YWxseSBidWJibGUgYW55IHJlcXVlc3RcbiAgICAvLyBlcnJvcnMgdG8gdGhlIHRyYW5zYWN0aW9uLiBXZSBtdXN0IG5vdCByZWx5IG9uIEluZGV4ZWREQiBpbXBsZW1lbnRhdGlvbiB0byBkbyB0aGlzLCBiZWNhdXNlIGl0IG9ubHkgZG9lcyBzbyB3aGVuIHRoZSBzb3VyY2Ugb2YgdGhlIHJlamVjdGlvblxuICAgIC8vIGlzIGFuIGVycm9yIGV2ZW50IG9uIGEgcmVxdWVzdCwgbm90IGluIGNhc2UgYW4gb3JkaW5hcnkgZXhjZXB0aW9uIGlzIHRocm93bi5cbiAgICB2YXIgUHJvbWlzZSA9IChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLy8gVGhlIHVzZSBvZiBhc2FwIGluIGhhbmRsZSgpIGlzIHJlbWFya2VkIGJlY2F1c2Ugd2UgbXVzdCBOT1QgdXNlIHNldFRpbWVvdXQoZm4sMCkgYmVjYXVzZSBpdCBjYXVzZXMgcHJlbWF0dXJlIGNvbW1pdCBvZiBpbmRleGVkREIgdHJhbnNhY3Rpb25zIC0gd2hpY2ggaXMgYWNjb3JkaW5nIHRvIGluZGV4ZWREQiBzcGVjaWZpY2F0aW9uLlxuICAgICAgICB2YXIgX3NsaWNlID0gW10uc2xpY2U7XG4gICAgICAgIHZhciBfYXNhcCA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICd1bmRlZmluZWQnID8gZnVuY3Rpb24oZm4sIGFyZzEsIGFyZzIsIGFyZ04pIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgZm4uYXBwbHkoZ2xvYmFsLCBfc2xpY2UuY2FsbChhcmdzLCAxKSk7IH0sIDApOyAvLyBJZiBub3QgRkYxMyBhbmQgZWFybGllciBmYWlsZWQsIHdlIGNvdWxkIHVzZSB0aGlzIGNhbGwgaGVyZSBpbnN0ZWFkOiBzZXRUaW1lb3V0LmNhbGwodGhpcywgW2ZuLCAwXS5jb25jYXQoYXJndW1lbnRzKSk7XG4gICAgICAgIH0gOiBzZXRJbW1lZGlhdGU7IC8vIElFMTArIGFuZCBub2RlLlxuXG4gICAgICAgIGRvRmFrZUF1dG9Db21wbGV0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBTaW1wbGlmeSB0aGUgam9iIGZvciBWUyBJbnRlbGxpc2Vuc2UuIFRoaXMgcGllY2Ugb2YgY29kZSBpcyBvbmUgb2YgdGhlIGtleXMgdG8gdGhlIG5ldyBtYXJ2ZWxsb3VzIGludGVsbGlzZW5zZSBzdXBwb3J0IGluIERleGllLlxuICAgICAgICAgICAgX2FzYXAgPSBhc2FwID0gZW5xdWV1ZUltbWVkaWF0ZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGZuLmFwcGx5KGdsb2JhbCwgX3NsaWNlLmNhbGwoYXJncywgMSkpOyB9LCAwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBhc2FwID0gX2FzYXAsXG4gICAgICAgICAgICBpc1Jvb3RFeGVjdXRpb24gPSB0cnVlO1xuXG4gICAgICAgIHZhciBvcGVyYXRpb25zUXVldWUgPSBbXTtcbiAgICAgICAgdmFyIHRpY2tGaW5hbGl6ZXJzID0gW107XG4gICAgICAgIGZ1bmN0aW9uIGVucXVldWVJbW1lZGlhdGUoZm4sIGFyZ3MpIHtcbiAgICAgICAgICAgIG9wZXJhdGlvbnNRdWV1ZS5wdXNoKFtmbiwgX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXhlY3V0ZU9wZXJhdGlvbnNRdWV1ZSgpIHtcbiAgICAgICAgICAgIHZhciBxdWV1ZSA9IG9wZXJhdGlvbnNRdWV1ZTtcbiAgICAgICAgICAgIG9wZXJhdGlvbnNRdWV1ZSA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBxdWV1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHF1ZXVlW2ldO1xuICAgICAgICAgICAgICAgIGl0ZW1bMF0uYXBwbHkoZ2xvYmFsLCBpdGVtWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vdmFyIFByb21pc2VJRCA9IDA7XG4gICAgICAgIGZ1bmN0aW9uIFByb21pc2UoZm4pIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ29iamVjdCcpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Byb21pc2VzIG11c3QgYmUgY29uc3RydWN0ZWQgdmlhIG5ldycpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykgdGhyb3cgbmV3IFR5cGVFcnJvcignbm90IGEgZnVuY3Rpb24nKTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gbnVsbDsgLy8gbnVsbCAoPXBlbmRpbmcpLCBmYWxzZSAoPXJlamVjdGVkKSBvciB0cnVlICg9cmVzb2x2ZWQpXG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IG51bGw7IC8vIGVycm9yIG9yIHJlc3VsdFxuICAgICAgICAgICAgdGhpcy5fZGVmZXJyZWRzID0gW107XG4gICAgICAgICAgICB0aGlzLl9jYXRjaGVkID0gZmFsc2U7IC8vIGZvciBvbnVuY2F0Y2hlZFxuICAgICAgICAgICAgLy90aGlzLl9pZCA9ICsrUHJvbWlzZUlEO1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGNvbnN0cnVjdGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9QU0QgPSBQcm9taXNlLlBTRDtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBkb1Jlc29sdmUodGhpcywgZm4sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25zdHJ1Y3RpbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICBhc2FwKHJlc29sdmUsIHNlbGYsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNlbGYsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnN0cnVjdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNhcChyZWplY3QsIHNlbGYsIHJlYXNvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KHNlbGYsIHJlYXNvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgY29uc3RydWN0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBoYW5kbGUoc2VsZiwgZGVmZXJyZWQpIHtcbiAgICAgICAgICAgIGlmIChzZWxmLl9zdGF0ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX2RlZmVycmVkcy5wdXNoKGRlZmVycmVkKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjYiA9IHNlbGYuX3N0YXRlID8gZGVmZXJyZWQub25GdWxmaWxsZWQgOiBkZWZlcnJlZC5vblJlamVjdGVkO1xuICAgICAgICAgICAgaWYgKGNiID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBEZWZlcnJlZCBkb2VzbnQgaGF2ZSBhIGxpc3RlbmVyIGZvciB0aGUgZXZlbnQgYmVpbmcgdHJpZ2dlcmVkIChvbkZ1bGZpbGxlZCBvciBvblJlamVjdCkgc28gbGV0cyBmb3J3YXJkIHRoZSBldmVudCB0byBhbnkgZXZlbnR1YWwgbGlzdGVuZXJzIG9uIHRoZSBQcm9taXNlIGluc3RhbmNlIHJldHVybmVkIGJ5IHRoZW4oKSBvciBjYXRjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIChzZWxmLl9zdGF0ZSA/IGRlZmVycmVkLnJlc29sdmUgOiBkZWZlcnJlZC5yZWplY3QpKHNlbGYuX3ZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXQsIGlzUm9vdEV4ZWMgPSBpc1Jvb3RFeGVjdXRpb247XG4gICAgICAgICAgICBpc1Jvb3RFeGVjdXRpb24gPSBmYWxzZTtcbiAgICAgICAgICAgIGFzYXAgPSBlbnF1ZXVlSW1tZWRpYXRlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0ZXJQU0QgPSBQcm9taXNlLlBTRDtcbiAgICAgICAgICAgICAgICBQcm9taXNlLlBTRCA9IHNlbGYuX1BTRDtcbiAgICAgICAgICAgICAgICByZXQgPSBjYihzZWxmLl92YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLl9zdGF0ZSAmJiAoIXJldCB8fCB0eXBlb2YgcmV0LnRoZW4gIT09ICdmdW5jdGlvbicgfHwgcmV0Ll9zdGF0ZSAhPT0gZmFsc2UpKSBzZXRDYXRjaGVkKHNlbGYpOyAvLyBDYWxsZXIgZGlkICdyZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTsnIC0gZG9uJ3QgcmVnYXJkIGl0IGFzIGNhdGNoZWQhXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBjYXRjaGVkID0gZGVmZXJyZWQucmVqZWN0KGUpO1xuICAgICAgICAgICAgICAgIGlmICghY2F0Y2hlZCAmJiBzZWxmLm9udW5jYXRjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9udW5jYXRjaGVkKGUpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIFByb21pc2UuUFNEID0gb3V0ZXJQU0Q7XG4gICAgICAgICAgICAgICAgaWYgKGlzUm9vdEV4ZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG9wZXJhdGlvbnNRdWV1ZS5sZW5ndGggPiAwKSBleGVjdXRlT3BlcmF0aW9uc1F1ZXVlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmluYWxpemVyID0gdGlja0ZpbmFsaXplcnMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmluYWxpemVyKSB0cnkge2ZpbmFsaXplcigpO30gY2F0Y2goZSl7fVxuICAgICAgICAgICAgICAgICAgICB9IHdoaWxlICh0aWNrRmluYWxpemVycy5sZW5ndGggPiAwIHx8IG9wZXJhdGlvbnNRdWV1ZS5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICAgICAgYXNhcCA9IF9hc2FwO1xuICAgICAgICAgICAgICAgICAgICBpc1Jvb3RFeGVjdXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9yb290RXhlYyhmbikge1xuICAgICAgICAgICAgdmFyIGlzUm9vdEV4ZWMgPSBpc1Jvb3RFeGVjdXRpb247XG4gICAgICAgICAgICBpc1Jvb3RFeGVjdXRpb24gPSBmYWxzZTtcbiAgICAgICAgICAgIGFzYXAgPSBlbnF1ZXVlSW1tZWRpYXRlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAoaXNSb290RXhlYykge1xuICAgICAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAob3BlcmF0aW9uc1F1ZXVlLmxlbmd0aCA+IDApIGV4ZWN1dGVPcGVyYXRpb25zUXVldWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaW5hbGl6ZXIgPSB0aWNrRmluYWxpemVycy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaW5hbGl6ZXIpIHRyeSB7IGZpbmFsaXplcigpOyB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAodGlja0ZpbmFsaXplcnMubGVuZ3RoID4gMCB8fCBvcGVyYXRpb25zUXVldWUubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgICAgIGFzYXAgPSBfYXNhcDtcbiAgICAgICAgICAgICAgICAgICAgaXNSb290RXhlY3V0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzZXRDYXRjaGVkKHByb21pc2UpIHtcbiAgICAgICAgICAgIHByb21pc2UuX2NhdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHByb21pc2UuX3BhcmVudCkgc2V0Q2F0Y2hlZChwcm9taXNlLl9wYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVzb2x2ZShwcm9taXNlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdmFyIG91dGVyUFNEID0gUHJvbWlzZS5QU0Q7XG4gICAgICAgICAgICBQcm9taXNlLlBTRCA9IHByb21pc2UuX1BTRDtcbiAgICAgICAgICAgIHRyeSB7IC8vUHJvbWlzZSBSZXNvbHV0aW9uIFByb2NlZHVyZTogaHR0cHM6Ly9naXRodWIuY29tL3Byb21pc2VzLWFwbHVzL3Byb21pc2VzLXNwZWMjdGhlLXByb21pc2UtcmVzb2x1dGlvbi1wcm9jZWR1cmVcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IHByb21pc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZSBjYW5ub3QgYmUgcmVzb2x2ZWQgd2l0aCBpdHNlbGYuJyk7XG4gICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICYmICh0eXBlb2YgbmV3VmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXdWYWx1ZS50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb1Jlc29sdmUocHJvbWlzZSwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbmV3VmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlID8gbmV3VmFsdWUuX3RoZW4ocmVzb2x2ZSwgcmVqZWN0KSA6IG5ld1ZhbHVlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocHJvbWlzZSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcm9taXNlLl9zdGF0ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcHJvbWlzZS5fdmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBmaW5hbGUuY2FsbChwcm9taXNlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIFByb21pc2UuUFNEID0gb3V0ZXJQU0Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZWplY3QocHJvbWlzZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBvdXRlclBTRCA9IFByb21pc2UuUFNEO1xuICAgICAgICAgICAgUHJvbWlzZS5QU0QgPSBwcm9taXNlLl9QU0Q7XG4gICAgICAgICAgICBwcm9taXNlLl9zdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgcHJvbWlzZS5fdmFsdWUgPSBuZXdWYWx1ZTtcblxuICAgICAgICAgICAgZmluYWxlLmNhbGwocHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAoIXByb21pc2UuX2NhdGNoZWQpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvbWlzZS5vbnVuY2F0Y2hlZClcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2Uub251bmNhdGNoZWQocHJvbWlzZS5fdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBQcm9taXNlLm9uLmVycm9yLmZpcmUocHJvbWlzZS5fdmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBQcm9taXNlLlBTRCA9IG91dGVyUFNEO1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2UuX2NhdGNoZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBmaW5hbGUoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5fZGVmZXJyZWRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlKHRoaXMsIHRoaXMuX2RlZmVycmVkc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9kZWZlcnJlZHMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIERlZmVycmVkKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIHRoaXMub25GdWxmaWxsZWQgPSB0eXBlb2Ygb25GdWxmaWxsZWQgPT09ICdmdW5jdGlvbicgPyBvbkZ1bGZpbGxlZCA6IG51bGw7XG4gICAgICAgICAgICB0aGlzLm9uUmVqZWN0ZWQgPSB0eXBlb2Ygb25SZWplY3RlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uUmVqZWN0ZWQgOiBudWxsO1xuICAgICAgICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIHRoaXMucmVqZWN0ID0gcmVqZWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRha2UgYSBwb3RlbnRpYWxseSBtaXNiZWhhdmluZyByZXNvbHZlciBmdW5jdGlvbiBhbmQgbWFrZSBzdXJlXG4gICAgICAgICAqIG9uRnVsZmlsbGVkIGFuZCBvblJlamVjdGVkIGFyZSBvbmx5IGNhbGxlZCBvbmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBNYWtlcyBubyBndWFyYW50ZWVzIGFib3V0IGFzeW5jaHJvbnkuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBkb1Jlc29sdmUocHJvbWlzZSwgZm4sIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gICAgICAgICAgICB2YXIgZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmbihmdW5jdGlvbiBQcm9taXNlX3Jlc29sdmUodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbmUpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIG9uRnVsZmlsbGVkKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiBQcm9taXNlX3JlamVjdChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbmUpIHJldHVybiBwcm9taXNlLl9jYXRjaGVkO1xuICAgICAgICAgICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9uUmVqZWN0ZWQocmVhc29uKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvbmUpIHJldHVybjtcbiAgICAgICAgICAgICAgICByZXR1cm4gb25SZWplY3RlZChleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBQcm9taXNlLm9uID0gZXZlbnRzKG51bGwsIFwiZXJyb3JcIik7XG5cbiAgICAgICAgUHJvbWlzZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShhcmd1bWVudHNbMF0pID8gYXJndW1lbnRzWzBdIDogYXJndW1lbnRzKTtcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHJldHVybiByZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgICB2YXIgcmVtYWluaW5nID0gYXJncy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVzKGksIHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAmJiAodHlwZW9mIHZhbCA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhlbiA9IHZhbC50aGVuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuLmNhbGwodmFsLCBmdW5jdGlvbiAodmFsKSB7IHJlcyhpLCB2YWwpOyB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1tpXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgtLXJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByZXMoaSwgYXJnc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyogUHJvdG90eXBlIE1ldGhvZHMgKi9cbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuX3N0YXRlID09PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICBoYW5kbGUoc2VsZiwgbmV3IERlZmVycmVkKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXNvbHZlLCByZWplY3QpKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGFzYXAoaGFuZGxlLCBzZWxmLCBuZXcgRGVmZXJyZWQob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlc29sdmUsIHJlamVjdCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBwLl9QU0QgPSB0aGlzLl9QU0Q7XG4gICAgICAgICAgICBwLm9udW5jYXRjaGVkID0gdGhpcy5vbnVuY2F0Y2hlZDsgLy8gTmVlZGVkIHdoZW4gZXhjZXB0aW9uIG9jY3VycyBpbiBhIHRoZW4oKSBjbGF1c2Ugb2YgYSBzdWNjZXNzZnVsIHBhcmVudCBwcm9taXNlLiBXYW50IG9udW5jYXRjaGVkIHRvIGJlIGNhbGxlZCBldmVuIGluIGNhbGxiYWNrcyBvZiBjYWxsYmFja3Mgb2YgdGhlIG9yaWdpbmFsIHByb21pc2UuXG4gICAgICAgICAgICBwLl9wYXJlbnQgPSB0aGlzOyAvLyBVc2VkIGZvciByZWN1cnNpdmVseSBjYWxsaW5nIG9udW5jYXRjaGVkIGV2ZW50IG9uIHNlbGYgYW5kIGFsbCBwYXJlbnRzLlxuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgIH07XG5cbiAgICAgICAgUHJvbWlzZS5wcm90b3R5cGUuX3RoZW4gPSBmdW5jdGlvbiAob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgIGhhbmRsZSh0aGlzLCBuZXcgRGVmZXJyZWQob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIG5vcCxub3ApKTtcbiAgICAgICAgfTtcblxuICAgICAgICBQcm9taXNlLnByb3RvdHlwZVsnY2F0Y2gnXSA9IGZ1bmN0aW9uIChvblJlamVjdGVkKSB7XG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGVkKTtcbiAgICAgICAgICAgIC8vIEZpcnN0IGFyZ3VtZW50IGlzIHRoZSBFcnJvciB0eXBlIHRvIGNhdGNoXG4gICAgICAgICAgICB2YXIgdHlwZSA9IGFyZ3VtZW50c1swXSwgY2FsbGJhY2sgPSBhcmd1bWVudHNbMV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicpIHJldHVybiB0aGlzLnRoZW4obnVsbCwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBDYXRjaGluZyBlcnJvcnMgYnkgaXRzIGNvbnN0cnVjdG9yIHR5cGUgKHNpbWlsYXIgdG8gamF2YSAvIGMrKyAvIGMjKVxuICAgICAgICAgICAgICAgIC8vIFNhbXBsZTogcHJvbWlzZS5jYXRjaChUeXBlRXJyb3IsIGZ1bmN0aW9uIChlKSB7IC4uLiB9KTtcbiAgICAgICAgICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIHR5cGUpIHJldHVybiBjYWxsYmFjayhlKTsgZWxzZSByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuIHRoaXMudGhlbihudWxsLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIC8vIENhdGNoaW5nIGVycm9ycyBieSB0aGUgZXJyb3IubmFtZSBwcm9wZXJ0eS4gTWFrZXMgc2Vuc2UgZm9yIGluZGV4ZWREQiB3aGVyZSBlcnJvciB0eXBlXG4gICAgICAgICAgICAgICAgLy8gaXMgYWx3YXlzIERPTUVycm9yIGJ1dCB3aGVyZSBlLm5hbWUgdGVsbHMgdGhlIGFjdHVhbCBlcnJvciB0eXBlLlxuICAgICAgICAgICAgICAgIC8vIFNhbXBsZTogcHJvbWlzZS5jYXRjaCgnQ29uc3RyYWludEVycm9yJywgZnVuY3Rpb24gKGUpIHsgLi4uIH0pO1xuICAgICAgICAgICAgICAgIGlmIChlICYmIGUubmFtZSA9PT0gdHlwZSkgcmV0dXJuIGNhbGxiYWNrKGUpOyBlbHNlIHJldHVybiBQcm9taXNlLnJlamVjdChlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIFByb21pc2UucHJvdG90eXBlWydmaW5hbGx5J10gPSBmdW5jdGlvbiAob25GaW5hbGx5KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIG9uRmluYWxseSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBvbkZpbmFsbHkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIFByb21pc2UucHJvdG90eXBlLm9udW5jYXRjaGVkID0gbnVsbDsgLy8gT3B0aW9uYWwgZXZlbnQgdHJpZ2dlcmVkIGlmIHByb21pc2UgaXMgcmVqZWN0ZWQgYnV0IG5vIG9uZSBsaXN0ZW5lZC5cblxuICAgICAgICBQcm9taXNlLnJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKCkgeyB9KTtcbiAgICAgICAgICAgIHAuX3N0YXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIHAuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgfTtcblxuICAgICAgICBQcm9taXNlLnJlamVjdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAoKSB7IH0pO1xuICAgICAgICAgICAgcC5fc3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIHAuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgfTtcblxuICAgICAgICBQcm9taXNlLnJhY2UgPSBmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIHZhbHVlcy5tYXAoZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIFByb21pc2UuUFNEID0gbnVsbDsgLy8gUHJvbWlzZSBTcGVjaWZpYyBEYXRhIC0gYSBUTFMgUGF0dGVybiAoVGhyZWFkIExvY2FsIFN0b3JhZ2UpIGZvciBQcm9taXNlcy4gVE9ETzogUmVuYW1lIFByb21pc2UuUFNEIHRvIFByb21pc2UuZGF0YVxuXG4gICAgICAgIFByb21pc2UubmV3UFNEID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgbmV3IFBTRCBzY29wZSAoUHJvbWlzZSBTcGVjaWZpYyBEYXRhKVxuICAgICAgICAgICAgdmFyIG91dGVyU2NvcGUgPSBQcm9taXNlLlBTRDtcbiAgICAgICAgICAgIFByb21pc2UuUFNEID0gb3V0ZXJTY29wZSA/IE9iamVjdC5jcmVhdGUob3V0ZXJTY29wZSkgOiB7fTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuKCk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIFByb21pc2UuUFNEID0gb3V0ZXJTY29wZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBQcm9taXNlLl9yb290RXhlYyA9IF9yb290RXhlYztcbiAgICAgICAgUHJvbWlzZS5fdGlja0ZpbmFsaXplID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChpc1Jvb3RFeGVjdXRpb24pIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbiBhIHZpcnR1YWwgdGlja1wiKTtcbiAgICAgICAgICAgIHRpY2tGaW5hbGl6ZXJzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlO1xuICAgIH0pKCk7XG5cblxuICAgIC8vXG4gICAgLy9cbiAgICAvLyAtLS0tLS0gRXhwb3J0YWJsZSBIZWxwIEZ1bmN0aW9ucyAtLS0tLS0tXG4gICAgLy9cbiAgICAvL1xuXG4gICAgZnVuY3Rpb24gbm9wKCkgeyB9XG4gICAgZnVuY3Rpb24gbWlycm9yKHZhbCkgeyByZXR1cm4gdmFsOyB9XG5cbiAgICBmdW5jdGlvbiBwdXJlRnVuY3Rpb25DaGFpbihmMSwgZjIpIHtcbiAgICAgICAgLy8gRW5hYmxlcyBjaGFpbmVkIGV2ZW50cyB0aGF0IHRha2VzIE9ORSBhcmd1bWVudCBhbmQgcmV0dXJucyBpdCB0byB0aGUgbmV4dCBmdW5jdGlvbiBpbiBjaGFpbi5cbiAgICAgICAgLy8gVGhpcyBwYXR0ZXJuIGlzIHVzZWQgaW4gdGhlIGhvb2soXCJyZWFkaW5nXCIpIGV2ZW50LlxuICAgICAgICBpZiAoZjEgPT09IG1pcnJvcikgcmV0dXJuIGYyO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgcmV0dXJuIGYyKGYxKHZhbCkpO1xuICAgICAgICB9OyBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYWxsQm90aChvbjEsIG9uMikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgb24xLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBvbjIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTsgXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaG9va0NyZWF0aW5nQ2hhaW4oZjEsIGYyKSB7XG4gICAgICAgIC8vIEVuYWJsZXMgY2hhaW5lZCBldmVudHMgdGhhdCB0YWtlcyBzZXZlcmFsIGFyZ3VtZW50cyBhbmQgbWF5IG1vZGlmeSBmaXJzdCBhcmd1bWVudCBieSBtYWtpbmcgYSBtb2RpZmljYXRpb24gYW5kIHRoZW4gcmV0dXJuaW5nIHRoZSBzYW1lIGluc3RhbmNlLlxuICAgICAgICAvLyBUaGlzIHBhdHRlcm4gaXMgdXNlZCBpbiB0aGUgaG9vayhcImNyZWF0aW5nXCIpIGV2ZW50LlxuICAgICAgICBpZiAoZjEgPT09IG5vcCkgcmV0dXJuIGYyO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IGYxLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAocmVzICE9PSB1bmRlZmluZWQpIGFyZ3VtZW50c1swXSA9IHJlcztcbiAgICAgICAgICAgIHZhciBvbnN1Y2Nlc3MgPSB0aGlzLm9uc3VjY2VzcywgLy8gSW4gY2FzZSBldmVudCBsaXN0ZW5lciBoYXMgc2V0IHRoaXMub25zdWNjZXNzXG4gICAgICAgICAgICAgICAgb25lcnJvciA9IHRoaXMub25lcnJvcjsgICAgIC8vIEluIGNhc2UgZXZlbnQgbGlzdGVuZXIgaGFzIHNldCB0aGlzLm9uZXJyb3JcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9uc3VjY2VzcztcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9uZXJyb3I7XG4gICAgICAgICAgICB2YXIgcmVzMiA9IGYyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBpZiAob25zdWNjZXNzKSB0aGlzLm9uc3VjY2VzcyA9IHRoaXMub25zdWNjZXNzID8gY2FsbEJvdGgob25zdWNjZXNzLCB0aGlzLm9uc3VjY2VzcykgOiBvbnN1Y2Nlc3M7XG4gICAgICAgICAgICBpZiAob25lcnJvcikgdGhpcy5vbmVycm9yID0gdGhpcy5vbmVycm9yID8gY2FsbEJvdGgob25lcnJvciwgdGhpcy5vbmVycm9yKSA6IG9uZXJyb3I7XG4gICAgICAgICAgICByZXR1cm4gcmVzMiAhPT0gdW5kZWZpbmVkID8gcmVzMiA6IHJlcztcbiAgICAgICAgfTsgXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaG9va1VwZGF0aW5nQ2hhaW4oZjEsIGYyKSB7XG4gICAgICAgIGlmIChmMSA9PT0gbm9wKSByZXR1cm4gZjI7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gZjEuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmIChyZXMgIT09IHVuZGVmaW5lZCkgZXh0ZW5kKGFyZ3VtZW50c1swXSwgcmVzKTsgLy8gSWYgZjEgcmV0dXJucyBuZXcgbW9kaWZpY2F0aW9ucywgZXh0ZW5kIGNhbGxlcidzIG1vZGlmaWNhdGlvbnMgd2l0aCB0aGUgcmVzdWx0IGJlZm9yZSBjYWxsaW5nIG5leHQgaW4gY2hhaW4uXG4gICAgICAgICAgICB2YXIgb25zdWNjZXNzID0gdGhpcy5vbnN1Y2Nlc3MsIC8vIEluIGNhc2UgZXZlbnQgbGlzdGVuZXIgaGFzIHNldCB0aGlzLm9uc3VjY2Vzc1xuICAgICAgICAgICAgICAgIG9uZXJyb3IgPSB0aGlzLm9uZXJyb3I7ICAgICAvLyBJbiBjYXNlIGV2ZW50IGxpc3RlbmVyIGhhcyBzZXQgdGhpcy5vbmVycm9yXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vbnN1Y2Nlc3M7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vbmVycm9yO1xuICAgICAgICAgICAgdmFyIHJlczIgPSBmMi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKG9uc3VjY2VzcykgdGhpcy5vbnN1Y2Nlc3MgPSB0aGlzLm9uc3VjY2VzcyA/IGNhbGxCb3RoKG9uc3VjY2VzcywgdGhpcy5vbnN1Y2Nlc3MpIDogb25zdWNjZXNzO1xuICAgICAgICAgICAgaWYgKG9uZXJyb3IpIHRoaXMub25lcnJvciA9IHRoaXMub25lcnJvciA/IGNhbGxCb3RoKG9uZXJyb3IsIHRoaXMub25lcnJvcikgOiBvbmVycm9yO1xuICAgICAgICAgICAgcmV0dXJuIHJlcyA9PT0gdW5kZWZpbmVkID9cbiAgICAgICAgICAgICAgICAocmVzMiA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogcmVzMikgOlxuICAgICAgICAgICAgICAgIChyZXMyID09PSB1bmRlZmluZWQgPyByZXMgOiBleHRlbmQocmVzLCByZXMyKSk7XG4gICAgICAgIH07IFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0b3BwYWJsZUV2ZW50Q2hhaW4oZjEsIGYyKSB7XG4gICAgICAgIC8vIEVuYWJsZXMgY2hhaW5lZCBldmVudHMgdGhhdCBtYXkgcmV0dXJuIGZhbHNlIHRvIHN0b3AgdGhlIGV2ZW50IGNoYWluLlxuICAgICAgICBpZiAoZjEgPT09IG5vcCkgcmV0dXJuIGYyO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGYxLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgPT09IGZhbHNlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZjIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTsgXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmV2ZXJzZVN0b3BwYWJsZUV2ZW50Q2hhaW4oZjEsIGYyKSB7XG4gICAgICAgIGlmIChmMSA9PT0gbm9wKSByZXR1cm4gZjI7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoZjIuYXBwbHkodGhpcywgYXJndW1lbnRzKSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmMS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9OyBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub25TdG9wcGFibGVFdmVudENoYWluKGYxLCBmMikge1xuICAgICAgICBpZiAoZjEgPT09IG5vcCkgcmV0dXJuIGYyO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZjEuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGYyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07IFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb21pc2FibGVDaGFpbihmMSwgZjIpIHtcbiAgICAgICAgaWYgKGYxID09PSBub3ApIHJldHVybiBmMjtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSBmMS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKHJlcyAmJiB0eXBlb2YgcmVzLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhpeiA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGYyLmFwcGx5KHRoaXosIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGYyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07IFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV2ZW50cyhjdHgsIGV2ZW50TmFtZXMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgIHZhciBldnMgPSB7fTtcbiAgICAgICAgdmFyIHJ2ID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgc3Vic2NyaWJlcikge1xuICAgICAgICAgICAgaWYgKHN1YnNjcmliZXIpIHtcbiAgICAgICAgICAgICAgICAvLyBTdWJzY3JpYmVcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgICAgICB2YXIgZXYgPSBldnNbZXZlbnROYW1lXTtcbiAgICAgICAgICAgICAgICBldi5zdWJzY3JpYmUuYXBwbHkoZXYsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjdHg7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoZXZlbnROYW1lKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvLyBSZXR1cm4gaW50ZXJmYWNlIGFsbG93aW5nIHRvIGZpcmUgb3IgdW5zdWJzY3JpYmUgZnJvbSBldmVudFxuICAgICAgICAgICAgICAgIHJldHVybiBldnNbZXZlbnROYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTsgXG4gICAgICAgIHJ2LmFkZEV2ZW50VHlwZSA9IGFkZDtcblxuICAgICAgICBmdW5jdGlvbiBhZGQoZXZlbnROYW1lLCBjaGFpbkZ1bmN0aW9uLCBkZWZhdWx0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGV2ZW50TmFtZSkpIHJldHVybiBhZGRFdmVudEdyb3VwKGV2ZW50TmFtZSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGV2ZW50TmFtZSA9PT0gJ29iamVjdCcpIHJldHVybiBhZGRDb25maWd1cmVkRXZlbnRzKGV2ZW50TmFtZSk7XG4gICAgICAgICAgICBpZiAoIWNoYWluRnVuY3Rpb24pIGNoYWluRnVuY3Rpb24gPSBzdG9wcGFibGVFdmVudENoYWluO1xuICAgICAgICAgICAgaWYgKCFkZWZhdWx0RnVuY3Rpb24pIGRlZmF1bHRGdW5jdGlvbiA9IG5vcDtcblxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB7XG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlcnM6IFtdLFxuICAgICAgICAgICAgICAgIGZpcmU6IGRlZmF1bHRGdW5jdGlvbixcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnN1YnNjcmliZXJzLnB1c2goY2IpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmZpcmUgPSBjaGFpbkZ1bmN0aW9uKGNvbnRleHQuZmlyZSwgY2IpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdW5zdWJzY3JpYmU6IGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnN1YnNjcmliZXJzID0gY29udGV4dC5zdWJzY3JpYmVycy5maWx0ZXIoZnVuY3Rpb24gKGZuKSB7IHJldHVybiBmbiAhPT0gY2I7IH0pO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmZpcmUgPSBjb250ZXh0LnN1YnNjcmliZXJzLnJlZHVjZShjaGFpbkZ1bmN0aW9uLCBkZWZhdWx0RnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBldnNbZXZlbnROYW1lXSA9IHJ2W2V2ZW50TmFtZV0gPSBjb250ZXh0O1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZGRDb25maWd1cmVkRXZlbnRzKGNmZykge1xuICAgICAgICAgICAgLy8gZXZlbnRzKHRoaXMsIHtyZWFkaW5nOiBbZnVuY3Rpb25DaGFpbiwgbm9wXX0pO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoY2ZnKS5mb3JFYWNoKGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGNmZ1tldmVudE5hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGFyZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZChldmVudE5hbWUsIGNmZ1tldmVudE5hbWVdWzBdLCBjZmdbZXZlbnROYW1lXVsxXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcmdzID09PSAnYXNhcCcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmF0aGVyIHRoYW4gYXBwcm9hY2hpbmcgZXZlbnQgc3Vic2NyaXB0aW9uIHVzaW5nIGEgZnVuY3Rpb25hbCBhcHByb2FjaCwgd2UgaGVyZSBkbyBpdCBpbiBhIGZvci1sb29wIHdoZXJlIHN1YnNjcmliZXIgaXMgZXhlY3V0ZWQgaW4gaXRzIG93biBzdGFja1xuICAgICAgICAgICAgICAgICAgICAvLyBlbmFibGluZyB0aGF0IGFueSBleGNlcHRpb24gdGhhdCBvY2N1ciB3b250IGRpc3R1cmIgdGhlIGluaXRpYXRvciBhbmQgYWxzbyBub3QgbmVzY2Vzc2FyeSBiZSBjYXRjaGVkIGFuZCBmb3Jnb3R0ZW4uXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gYWRkKGV2ZW50TmFtZSwgbnVsbCwgZnVuY3Rpb24gZmlyZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5zdWJzY3JpYmVycy5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzYXAoZnVuY3Rpb24gZmlyZUV2ZW50KCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbi5hcHBseShnbG9iYWwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnN1YnNjcmliZSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hhbmdlIGhvdyBzdWJzY3JpYmUgd29ya3MgdG8gbm90IHJlcGxhY2UgdGhlIGZpcmUgZnVuY3Rpb24gYnV0IHRvIGp1c3QgYWRkIHRoZSBzdWJzY3JpYmVyIHRvIHN1YnNjcmliZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGV4dC5zdWJzY3JpYmVycy5pbmRleE9mKGZuKSA9PT0gLTEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5zdWJzY3JpYmVycy5wdXNoKGZuKTtcbiAgICAgICAgICAgICAgICAgICAgfTsgXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZSBob3cgdW5zdWJzY3JpYmUgd29ya3MgZm9yIHRoZSBzYW1lIHJlYXNvbiBhcyBhYm92ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZHhPZkZuID0gY29udGV4dC5zdWJzY3JpYmVycy5pbmRleE9mKGZuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZHhPZkZuICE9PSAtMSkgY29udGV4dC5zdWJzY3JpYmVycy5zcGxpY2UoaWR4T2ZGbiwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH07IFxuICAgICAgICAgICAgICAgIH0gZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGV2ZW50IGNvbmZpZ1wiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkRXZlbnRHcm91cChldmVudEdyb3VwKSB7XG4gICAgICAgICAgICAvLyBwcm9taXNlLWJhc2VkIGV2ZW50IGdyb3VwIChpLmUuIHdlIHByb21pc2UgdG8gY2FsbCBvbmUgYW5kIG9ubHkgb25lIG9mIHRoZSBldmVudHMgaW4gdGhlIHBhaXIsIGFuZCB0byBvbmx5IGNhbGwgaXQgb25jZS5cbiAgICAgICAgICAgIHZhciBkb25lID0gZmFsc2U7XG4gICAgICAgICAgICBldmVudEdyb3VwLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBhZGQobmFtZSkuc3Vic2NyaWJlKGNoZWNrRG9uZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNoZWNrRG9uZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9uZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDEsIGwgPSBhcmdzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgYWRkKGFyZ3NbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzc2VydChiKSB7XG4gICAgICAgIGlmICghYikgdGhyb3cgbmV3IEVycm9yKFwiQXNzZXJ0aW9uIGZhaWxlZFwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhc2FwKGZuKSB7XG4gICAgICAgIGlmIChnbG9iYWwuc2V0SW1tZWRpYXRlKSBzZXRJbW1lZGlhdGUoZm4pOyBlbHNlIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH1cblxuICAgIHZhciBmYWtlQXV0b0NvbXBsZXRlID0gZnVuY3Rpb24gKCkgeyB9Oy8vIFdpbGwgbmV2ZXIgYmUgY2hhbmdlZC4gV2UganVzdCBmYWtlIGZvciB0aGUgSURFIHRoYXQgd2UgY2hhbmdlIGl0IChzZWUgZG9GYWtlQXV0b0NvbXBsZXRlKCkpXG4gICAgdmFyIGZha2UgPSBmYWxzZTsgLy8gV2lsbCBuZXZlciBiZSBjaGFuZ2VkLiBXZSBqdXN0IGZha2UgZm9yIHRoZSBJREUgdGhhdCB3ZSBjaGFuZ2UgaXQgKHNlZSBkb0Zha2VBdXRvQ29tcGxldGUoKSlcblxuICAgIGZ1bmN0aW9uIGRvRmFrZUF1dG9Db21wbGV0ZShmbikge1xuICAgICAgICB2YXIgdG8gPSBzZXRUaW1lb3V0KGZuLCAxMDAwKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRvKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0cnljYXRjaChmbiwgcmVqZWN0LCBwc2QpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvdXRlclBTRCA9IFByb21pc2UuUFNEOyAvLyBTdXBwb3J0IFByb21pc2Utc3BlY2lmaWMgZGF0YSAoUFNEKSBpbiBjYWxsYmFjayBjYWxsc1xuICAgICAgICAgICAgUHJvbWlzZS5QU0QgPSBwc2Q7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBQcm9taXNlLlBTRCA9IG91dGVyUFNEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEJ5S2V5UGF0aChvYmosIGtleVBhdGgpIHtcbiAgICAgICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvSW5kZXhlZERCLyNzdGVwcy1mb3ItZXh0cmFjdGluZy1hLWtleS1mcm9tLWEtdmFsdWUtdXNpbmctYS1rZXktcGF0aFxuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleVBhdGgpKSByZXR1cm4gb2JqW2tleVBhdGhdOyAvLyBUaGlzIGxpbmUgaXMgbW92ZWQgZnJvbSBsYXN0IHRvIGZpcnN0IGZvciBvcHRpbWl6YXRpb24gcHVycG9zZS5cbiAgICAgICAgaWYgKCFrZXlQYXRoKSByZXR1cm4gb2JqO1xuICAgICAgICBpZiAodHlwZW9mIGtleVBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB2YXIgcnYgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0ga2V5UGF0aC5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gZ2V0QnlLZXlQYXRoKG9iaiwga2V5UGF0aFtpXSk7XG4gICAgICAgICAgICAgICAgcnYucHVzaCh2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgICB9XG4gICAgICAgIHZhciBwZXJpb2QgPSBrZXlQYXRoLmluZGV4T2YoJy4nKTtcbiAgICAgICAgaWYgKHBlcmlvZCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBpbm5lck9iaiA9IG9ialtrZXlQYXRoLnN1YnN0cigwLCBwZXJpb2QpXTtcbiAgICAgICAgICAgIHJldHVybiBpbm5lck9iaiA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogZ2V0QnlLZXlQYXRoKGlubmVyT2JqLCBrZXlQYXRoLnN1YnN0cihwZXJpb2QgKyAxKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRCeUtleVBhdGgob2JqLCBrZXlQYXRoLCB2YWx1ZSkge1xuICAgICAgICBpZiAoIW9iaiB8fCBrZXlQYXRoID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXlQYXRoICE9PSAnc3RyaW5nJyAmJiAnbGVuZ3RoJyBpbiBrZXlQYXRoKSB7XG4gICAgICAgICAgICBhc3NlcnQodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyAmJiAnbGVuZ3RoJyBpbiB2YWx1ZSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGtleVBhdGgubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICAgICAgc2V0QnlLZXlQYXRoKG9iaiwga2V5UGF0aFtpXSwgdmFsdWVbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHBlcmlvZCA9IGtleVBhdGguaW5kZXhPZignLicpO1xuICAgICAgICAgICAgaWYgKHBlcmlvZCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEtleVBhdGggPSBrZXlQYXRoLnN1YnN0cigwLCBwZXJpb2QpO1xuICAgICAgICAgICAgICAgIHZhciByZW1haW5pbmdLZXlQYXRoID0ga2V5UGF0aC5zdWJzdHIocGVyaW9kICsgMSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlbWFpbmluZ0tleVBhdGggPT09IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSBkZWxldGUgb2JqW2N1cnJlbnRLZXlQYXRoXTsgZWxzZSBvYmpbY3VycmVudEtleVBhdGhdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbm5lck9iaiA9IG9ialtjdXJyZW50S2V5UGF0aF07XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5uZXJPYmopIGlubmVyT2JqID0gKG9ialtjdXJyZW50S2V5UGF0aF0gPSB7fSk7XG4gICAgICAgICAgICAgICAgICAgIHNldEJ5S2V5UGF0aChpbm5lck9iaiwgcmVtYWluaW5nS2V5UGF0aCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIGRlbGV0ZSBvYmpba2V5UGF0aF07IGVsc2Ugb2JqW2tleVBhdGhdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWxCeUtleVBhdGgob2JqLCBrZXlQYXRoKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5UGF0aCA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICBzZXRCeUtleVBhdGgob2JqLCBrZXlQYXRoLCB1bmRlZmluZWQpO1xuICAgICAgICBlbHNlIGlmICgnbGVuZ3RoJyBpbiBrZXlQYXRoKVxuICAgICAgICAgICAgW10ubWFwLmNhbGwoa2V5UGF0aCwgZnVuY3Rpb24oa3ApIHtcbiAgICAgICAgICAgICAgICAgc2V0QnlLZXlQYXRoKG9iaiwga3AsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaGFsbG93Q2xvbmUob2JqKSB7XG4gICAgICAgIHZhciBydiA9IHt9O1xuICAgICAgICBmb3IgKHZhciBtIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShtKSkgcnZbbV0gPSBvYmpbbV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZXBDbG9uZShhbnkpIHtcbiAgICAgICAgaWYgKCFhbnkgfHwgdHlwZW9mIGFueSAhPT0gJ29iamVjdCcpIHJldHVybiBhbnk7XG4gICAgICAgIHZhciBydjtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYW55KSkge1xuICAgICAgICAgICAgcnYgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gYW55Lmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgIHJ2LnB1c2goZGVlcENsb25lKGFueVtpXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGFueSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgIHJ2ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIHJ2LnNldFRpbWUoYW55LmdldFRpbWUoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBydiA9IGFueS5jb25zdHJ1Y3RvciA/IE9iamVjdC5jcmVhdGUoYW55LmNvbnN0cnVjdG9yLnByb3RvdHlwZSkgOiB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gYW55KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFueS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICBydltwcm9wXSA9IGRlZXBDbG9uZShhbnlbcHJvcF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnY7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0T2JqZWN0RGlmZihhLCBiKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIHZlcnNpb24gdGhhdCB3aWxsIGFsd2F5cyByZXR1cm4ga2V5cGF0aHMgb24gdGhlIHJvb3QgbGV2ZWwuXG4gICAgICAgIC8vIElmIGZvciBleGFtcGxlIGEgYW5kIGIgZGlmZmVycyBieTogKGEuc29tZVByb3BzT2JqZWN0LnggIT0gYi5zb21lUHJvcHNPYmplY3QueCksIHdlIHdpbGwgcmV0dXJuIHRoYXQgXCJzb21lUHJvcHNPYmplY3RcIiBpcyBjaGFuZ2VkXG4gICAgICAgIC8vIGFuZCBub3QgXCJzb21lUHJvcHNPYmplY3QueFwiLiBUaGlzIGlzIGFjY2VwdGFibGUgYW5kIHRydWUgYnV0IGNvdWxkIGJlIG9wdGltaXplZCB0byBzdXBwb3J0IG5lc3RsZWQgY2hhbmdlcyBpZiB0aGF0IHdvdWxkIGdpdmUgYVxuICAgICAgICAvLyBiaWcgb3B0aW1pemF0aW9uIGJlbmVmaXQuXG4gICAgICAgIHZhciBydiA9IHt9O1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIGEpIGlmIChhLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICBpZiAoIWIuaGFzT3duUHJvcGVydHkocHJvcCkpXG4gICAgICAgICAgICAgICAgcnZbcHJvcF0gPSB1bmRlZmluZWQ7IC8vIFByb3BlcnR5IHJlbW92ZWRcbiAgICAgICAgICAgIGVsc2UgaWYgKGFbcHJvcF0gIT09IGJbcHJvcF0gJiYgSlNPTi5zdHJpbmdpZnkoYVtwcm9wXSkgIT0gSlNPTi5zdHJpbmdpZnkoYltwcm9wXSkpXG4gICAgICAgICAgICAgICAgcnZbcHJvcF0gPSBiW3Byb3BdOyAvLyBQcm9wZXJ0eSBjaGFuZ2VkXG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwcm9wKSAmJiAhYS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgcnZbcHJvcF0gPSBiW3Byb3BdOyAvLyBQcm9wZXJ0eSBhZGRlZFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVR5cGUodHlwZSkge1xuICAgICAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdHlwZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBbcGFyc2VUeXBlKHR5cGVbMF0pXTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlICYmIHR5cGVvZiB0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdmFyIHJ2ID0ge307XG4gICAgICAgICAgICBhcHBseVN0cnVjdHVyZShydiwgdHlwZSk7XG4gICAgICAgICAgICByZXR1cm4gcnY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5U3RydWN0dXJlKG9iaiwgc3RydWN0dXJlKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHN0cnVjdHVyZSkuZm9yRWFjaChmdW5jdGlvbiAobWVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBwYXJzZVR5cGUoc3RydWN0dXJlW21lbWJlcl0pO1xuICAgICAgICAgICAgb2JqW21lbWJlcl0gPSB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXZlbnRSZWplY3RIYW5kbGVyKHJlamVjdCwgc2VudGFuY2UpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdmFyIGVyck9iaiA9IChldmVudCAmJiBldmVudC50YXJnZXQuZXJyb3IpIHx8IG5ldyBFcnJvcigpO1xuICAgICAgICAgICAgaWYgKHNlbnRhbmNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9jY3VycmVkV2hlbiA9IFwiIG9jY3VycmVkIHdoZW4gXCIgKyBzZW50YW5jZS5tYXAoZnVuY3Rpb24gKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlb2YgKHdvcmQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6IHJldHVybiB3b3JkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOiByZXR1cm4gd29yZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBKU09OLnN0cmluZ2lmeSh3b3JkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pLmpvaW4oXCIgXCIpO1xuICAgICAgICAgICAgICAgIGlmIChlcnJPYmoubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJPYmoudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJPYmoubmFtZSArIG9jY3VycmVkV2hlbiArIChlcnJPYmoubWVzc2FnZSA/IFwiLiBcIiArIGVyck9iai5tZXNzYWdlIDogXCJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb2RlIGJlbG93IHdvcmtzIGZvciBzdGFja2VkIGV4Y2VwdGlvbnMsIEJVVCEgc3RhY2sgaXMgbmV2ZXIgcHJlc2VudCBpbiBldmVudCBlcnJvcnMgKG5vdCBpbiBhbnkgb2YgdGhlIGJyb3dzZXJzKS4gU28gaXQncyBubyB1c2UgdG8gaW5jbHVkZSBpdCFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qZGVsZXRlIHRoaXMudG9TdHJpbmc7IC8vIFByb2hpYml0aW5nIGVuZGxlc3MgcmVjdXJzaXZlbmVzcyBpbiBJRS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJPYmouc3RhY2spIHJ2ICs9IChlcnJPYmouc3RhY2sgPyBcIi4gU3RhY2s6IFwiICsgZXJyT2JqLnN0YWNrIDogXCJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvU3RyaW5nID0gdG9TdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnY7Ki9cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlcnJPYmogPSBlcnJPYmogKyBvY2N1cnJlZFdoZW47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlamVjdChlcnJPYmopO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnQpIHsvLyBPbGQgdmVyc2lvbnMgb2YgSW5kZXhlZERCU2hpbSBkb2VzbnQgcHJvdmlkZSBhbiBlcnJvciBldmVudFxuICAgICAgICAgICAgICAgIC8vIFN0b3AgZXJyb3IgZnJvbSBwcm9wYWdhdGluZyB0byBJREJUcmFuc2FjdGlvbi4gTGV0IHVzIGhhbmRsZSB0aGF0IG1hbnVhbGx5IGluc3RlYWQuXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnN0b3BQcm9wYWdhdGlvbikgLy8gSW5kZXhlZERCU2hpbSBkb2VzbnQgc3VwcG9ydCB0aGlzXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkgLy8gSW5kZXhlZERCU2hpbSBkb2VzbnQgc3VwcG9ydCB0aGlzXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFjayhlcnJvcikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHByZXZlbnREZWZhdWx0KGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdsb2JhbERhdGFiYXNlTGlzdChjYikge1xuICAgICAgICB2YXIgdmFsLFxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlID0gRGV4aWUuZGVwZW5kZW5jaWVzLmxvY2FsU3RvcmFnZTtcbiAgICAgICAgaWYgKCFsb2NhbFN0b3JhZ2UpIHJldHVybiBjYihbXSk7IC8vIEVudnMgd2l0aG91dCBsb2NhbFN0b3JhZ2Ugc3VwcG9ydFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFsID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnRGV4aWUuRGF0YWJhc2VOYW1lcycpIHx8IFwiW11cIik7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHZhbCA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjYih2YWwpKSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnRGV4aWUuRGF0YWJhc2VOYW1lcycsIEpTT04uc3RyaW5naWZ5KHZhbCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBJbmRleFNwZWMgc3RydWN0XG4gICAgLy9cbiAgICBmdW5jdGlvbiBJbmRleFNwZWMobmFtZSwga2V5UGF0aCwgdW5pcXVlLCBtdWx0aSwgYXV0bywgY29tcG91bmQsIGRvdHRlZCkge1xuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJuYW1lXCIgdHlwZT1cIlN0cmluZ1wiPjwvcGFyYW0+XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImtleVBhdGhcIiB0eXBlPVwiU3RyaW5nXCI+PC9wYXJhbT5cbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwidW5pcXVlXCIgdHlwZT1cIkJvb2xlYW5cIj48L3BhcmFtPlxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJtdWx0aVwiIHR5cGU9XCJCb29sZWFuXCI+PC9wYXJhbT5cbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiYXV0b1wiIHR5cGU9XCJCb29sZWFuXCI+PC9wYXJhbT5cbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY29tcG91bmRcIiB0eXBlPVwiQm9vbGVhblwiPjwvcGFyYW0+XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImRvdHRlZFwiIHR5cGU9XCJCb29sZWFuXCI+PC9wYXJhbT5cbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5rZXlQYXRoID0ga2V5UGF0aDtcbiAgICAgICAgdGhpcy51bmlxdWUgPSB1bmlxdWU7XG4gICAgICAgIHRoaXMubXVsdGkgPSBtdWx0aTtcbiAgICAgICAgdGhpcy5hdXRvID0gYXV0bztcbiAgICAgICAgdGhpcy5jb21wb3VuZCA9IGNvbXBvdW5kO1xuICAgICAgICB0aGlzLmRvdHRlZCA9IGRvdHRlZDtcbiAgICAgICAgdmFyIGtleVBhdGhTcmMgPSB0eXBlb2Yga2V5UGF0aCA9PT0gJ3N0cmluZycgPyBrZXlQYXRoIDoga2V5UGF0aCAmJiAoJ1snICsgW10uam9pbi5jYWxsKGtleVBhdGgsICcrJykgKyAnXScpO1xuICAgICAgICB0aGlzLnNyYyA9ICh1bmlxdWUgPyAnJicgOiAnJykgKyAobXVsdGkgPyAnKicgOiAnJykgKyAoYXV0byA/IFwiKytcIiA6IFwiXCIpICsga2V5UGF0aFNyYztcbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIFRhYmxlU2NoZW1hIHN0cnVjdFxuICAgIC8vXG4gICAgZnVuY3Rpb24gVGFibGVTY2hlbWEobmFtZSwgcHJpbUtleSwgaW5kZXhlcywgaW5zdGFuY2VUZW1wbGF0ZSkge1xuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJuYW1lXCIgdHlwZT1cIlN0cmluZ1wiPjwvcGFyYW0+XG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInByaW1LZXlcIiB0eXBlPVwiSW5kZXhTcGVjXCI+PC9wYXJhbT5cbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiaW5kZXhlc1wiIHR5cGU9XCJBcnJheVwiIGVsZW1lbnRUeXBlPVwiSW5kZXhTcGVjXCI+PC9wYXJhbT5cbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiaW5zdGFuY2VUZW1wbGF0ZVwiIHR5cGU9XCJPYmplY3RcIj48L3BhcmFtPlxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnByaW1LZXkgPSBwcmltS2V5IHx8IG5ldyBJbmRleFNwZWMoKTtcbiAgICAgICAgdGhpcy5pbmRleGVzID0gaW5kZXhlcyB8fCBbbmV3IEluZGV4U3BlYygpXTtcbiAgICAgICAgdGhpcy5pbnN0YW5jZVRlbXBsYXRlID0gaW5zdGFuY2VUZW1wbGF0ZTtcbiAgICAgICAgdGhpcy5tYXBwZWRDbGFzcyA9IG51bGw7XG4gICAgICAgIHRoaXMuaWR4QnlOYW1lID0gaW5kZXhlcy5yZWR1Y2UoZnVuY3Rpb24gKGhhc2hTZXQsIGluZGV4KSB7XG4gICAgICAgICAgICBoYXNoU2V0W2luZGV4Lm5hbWVdID0gaW5kZXg7XG4gICAgICAgICAgICByZXR1cm4gaGFzaFNldDtcbiAgICAgICAgfSwge30pO1xuICAgIH1cblxuICAgIC8vXG4gICAgLy8gTW9kaWZ5RXJyb3IgQ2xhc3MgKGV4dGVuZHMgRXJyb3IpXG4gICAgLy9cbiAgICBmdW5jdGlvbiBNb2RpZnlFcnJvcihtc2csIGZhaWx1cmVzLCBzdWNjZXNzQ291bnQsIGZhaWxlZEtleXMpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gXCJNb2RpZnlFcnJvclwiO1xuICAgICAgICB0aGlzLmZhaWx1cmVzID0gZmFpbHVyZXM7XG4gICAgICAgIHRoaXMuZmFpbGVkS2V5cyA9IGZhaWxlZEtleXM7XG4gICAgICAgIHRoaXMuc3VjY2Vzc0NvdW50ID0gc3VjY2Vzc0NvdW50O1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBmYWlsdXJlcy5qb2luKCdcXG4nKTtcbiAgICB9XG4gICAgZGVyaXZlKE1vZGlmeUVycm9yKS5mcm9tKEVycm9yKTtcblxuICAgIC8vXG4gICAgLy8gU3RhdGljIGRlbGV0ZSgpIG1ldGhvZC5cbiAgICAvL1xuICAgIERleGllLmRlbGV0ZSA9IGZ1bmN0aW9uIChkYXRhYmFzZU5hbWUpIHtcbiAgICAgICAgdmFyIGRiID0gbmV3IERleGllKGRhdGFiYXNlTmFtZSksXG4gICAgICAgICAgICBwcm9taXNlID0gZGIuZGVsZXRlKCk7XG4gICAgICAgIHByb21pc2Uub25ibG9ja2VkID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBkYi5vbihcImJsb2NrZWRcIiwgZm4pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH07XG5cbiAgICAvL1xuICAgIC8vIFN0YXRpYyBleGlzdHMoKSBtZXRob2QuXG4gICAgLy9cbiAgICBEZXhpZS5leGlzdHMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGV4aWUobmFtZSkub3BlbigpLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgICAgICAgIGRiLmNsb3NlKCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vXG4gICAgLy8gU3RhdGljIG1ldGhvZCBmb3IgcmV0cmlldmluZyBhIGxpc3Qgb2YgYWxsIGV4aXN0aW5nIGRhdGFiYXNlcyBhdCBjdXJyZW50IGhvc3QuXG4gICAgLy9cbiAgICBEZXhpZS5nZXREYXRhYmFzZU5hbWVzID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICB2YXIgZ2V0RGF0YWJhc2VOYW1lcyA9IGdldE5hdGl2ZUdldERhdGFiYXNlTmFtZXNGbigpO1xuICAgICAgICAgICAgaWYgKGdldERhdGFiYXNlTmFtZXMpIHsgLy8gSW4gY2FzZSBnZXREYXRhYmFzZU5hbWVzKCkgYmVjb21lcyBzdGFuZGFyZCwgbGV0J3MgcHJlcGFyZSB0byBzdXBwb3J0IGl0OlxuICAgICAgICAgICAgICAgIHZhciByZXEgPSBnZXREYXRhYmFzZU5hbWVzKCk7XG4gICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtdLnNsaWNlLmNhbGwoZXZlbnQudGFyZ2V0LnJlc3VsdCwgMCkpOyAvLyBDb252ZXJzdCBET01TdHJpbmdMaXN0IHRvIEFycmF5PFN0cmluZz5cbiAgICAgICAgICAgICAgICB9OyBcbiAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGV2ZW50UmVqZWN0SGFuZGxlcihyZWplY3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbG9iYWxEYXRhYmFzZUxpc3QoZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihjYik7XG4gICAgfTsgXG5cbiAgICBEZXhpZS5kZWZpbmVDbGFzcyA9IGZ1bmN0aW9uIChzdHJ1Y3R1cmUpIHtcbiAgICAgICAgLy8vIDxzdW1tYXJ5PlxuICAgICAgICAvLy8gICAgIENyZWF0ZSBhIGphdmFzY3JpcHQgY29uc3RydWN0b3IgYmFzZWQgb24gZ2l2ZW4gdGVtcGxhdGUgZm9yIHdoaWNoIHByb3BlcnRpZXMgdG8gZXhwZWN0IGluIHRoZSBjbGFzcy5cbiAgICAgICAgLy8vICAgICBBbnkgcHJvcGVydHkgdGhhdCBpcyBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHdpbGwgYWN0IGFzIGEgdHlwZS4gU28ge25hbWU6IFN0cmluZ30gd2lsbCBiZSBlcXVhbCB0byB7bmFtZTogbmV3IFN0cmluZygpfS5cbiAgICAgICAgLy8vIDwvc3VtbWFyeT5cbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwic3RydWN0dXJlXCI+SGVscHMgSURFIGNvZGUgY29tcGxldGlvbiBieSBrbm93aW5nIHRoZSBtZW1iZXJzIHRoYXQgb2JqZWN0cyBjb250YWluIGFuZCBub3QganVzdCB0aGUgaW5kZXhlcy4gQWxzb1xuICAgICAgICAvLy8ga25vdyB3aGF0IHR5cGUgZWFjaCBtZW1iZXIgaGFzLiBFeGFtcGxlOiB7bmFtZTogU3RyaW5nLCBlbWFpbEFkZHJlc3NlczogW1N0cmluZ10sIHByb3BlcnRpZXM6IHtzaG9lU2l6ZTogTnVtYmVyfX08L3BhcmFtPlxuXG4gICAgICAgIC8vIERlZmF1bHQgY29uc3RydWN0b3IgYWJsZSB0byBjb3B5IGdpdmVuIHByb3BlcnRpZXMgaW50byB0aGlzIG9iamVjdC5cbiAgICAgICAgZnVuY3Rpb24gQ2xhc3MocHJvcGVydGllcykge1xuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwicHJvcGVydGllc1wiIHR5cGU9XCJPYmplY3RcIiBvcHRpb25hbD1cInRydWVcIj5Qcm9wZXJ0aWVzIHRvIGluaXRpYWxpemUgb2JqZWN0IHdpdGguXG4gICAgICAgICAgICAvLy8gPC9wYXJhbT5cbiAgICAgICAgICAgIHByb3BlcnRpZXMgPyBleHRlbmQodGhpcywgcHJvcGVydGllcykgOiBmYWtlICYmIGFwcGx5U3RydWN0dXJlKHRoaXMsIHN0cnVjdHVyZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENsYXNzO1xuICAgIH07IFxuXG4gICAgRGV4aWUuaWdub3JlVHJhbnNhY3Rpb24gPSBmdW5jdGlvbiAoc2NvcGVGdW5jKSB7XG4gICAgICAgIC8vIEluIGNhc2UgY2FsbGVyIGlzIHdpdGhpbiBhIHRyYW5zYWN0aW9uIGJ1dCBuZWVkcyB0byBjcmVhdGUgYSBzZXBhcmF0ZSB0cmFuc2FjdGlvbi5cbiAgICAgICAgLy8gRXhhbXBsZSBvZiB1c2FnZTpcbiAgICAgICAgLy8gXG4gICAgICAgIC8vIExldCdzIHNheSB3ZSBoYXZlIGEgbG9nZ2VyIGZ1bmN0aW9uIGluIG91ciBhcHAuIE90aGVyIGFwcGxpY2F0aW9uLWxvZ2ljIHNob3VsZCBiZSB1bmF3YXJlIG9mIHRoZVxuICAgICAgICAvLyBsb2dnZXIgZnVuY3Rpb24gYW5kIG5vdCBuZWVkIHRvIGluY2x1ZGUgdGhlICdsb2dlbnRyaWVzJyB0YWJsZSBpbiBhbGwgdHJhbnNhY3Rpb24gaXQgcGVyZm9ybXMuXG4gICAgICAgIC8vIFRoZSBsb2dnaW5nIHNob3VsZCBhbHdheXMgYmUgZG9uZSBpbiBhIHNlcGFyYXRlIHRyYW5zYWN0aW9uIGFuZCBub3QgYmUgZGVwZW5kYW50IG9uIHRoZSBjdXJyZW50XG4gICAgICAgIC8vIHJ1bm5pbmcgdHJhbnNhY3Rpb24gY29udGV4dC4gVGhlbiB5b3UgY291bGQgdXNlIERleGllLmlnbm9yZVRyYW5zYWN0aW9uKCkgdG8gcnVuIGNvZGUgdGhhdCBzdGFydHMgYSBuZXcgdHJhbnNhY3Rpb24uXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgICBEZXhpZS5pZ25vcmVUcmFuc2FjdGlvbihmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgICAgICBkYi5sb2dlbnRyaWVzLmFkZChuZXdMb2dFbnRyeSk7XG4gICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVW5sZXNzIHVzaW5nIERleGllLmlnbm9yZVRyYW5zYWN0aW9uKCksIHRoZSBhYm92ZSBleGFtcGxlIHdvdWxkIHRyeSB0byByZXVzZSB0aGUgY3VycmVudCB0cmFuc2FjdGlvblxuICAgICAgICAvLyBpbiBjdXJyZW50IFByb21pc2Utc2NvcGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuIGFsdGVybmF0aXZlIHRvIERleGllLmlnbm9yZVRyYW5zYWN0aW9uKCkgd291bGQgYmUgc2V0SW1tZWRpYXRlKCkgb3Igc2V0VGltZW91dCgpLiBUaGUgcmVhc29uIHdlIHN0aWxsIHByb3ZpZGUgYW5cbiAgICAgICAgLy8gQVBJIGZvciB0aGlzIGJlY2F1c2VcbiAgICAgICAgLy8gIDEpIFRoZSBpbnRlbnRpb24gb2Ygd3JpdGluZyB0aGUgc3RhdGVtZW50IGNvdWxkIGJlIHVuY2xlYXIgaWYgdXNpbmcgc2V0SW1tZWRpYXRlKCkgb3Igc2V0VGltZW91dCgpLlxuICAgICAgICAvLyAgMikgc2V0VGltZW91dCgpIHdvdWxkIHdhaXQgdW5uZXNjZXNzYXJ5IHVudGlsIGZpcmluZy4gVGhpcyBpcyBob3dldmVyIG5vdCB0aGUgY2FzZSB3aXRoIHNldEltbWVkaWF0ZSgpLlxuICAgICAgICAvLyAgMykgc2V0SW1tZWRpYXRlKCkgaXMgbm90IHN1cHBvcnRlZCBpbiB0aGUgRVMgc3RhbmRhcmQuXG4gICAgICAgIHJldHVybiBQcm9taXNlLm5ld1BTRChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBQcm9taXNlLlBTRC50cmFucyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gc2NvcGVGdW5jKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRGV4aWUuc3Bhd24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChnbG9iYWwuY29uc29sZSkgY29uc29sZS53YXJuKFwiRGV4aWUuc3Bhd24oKSBpcyBkZXByZWNhdGVkLiBVc2UgRGV4aWUuaWdub3JlVHJhbnNhY3Rpb24oKSBpbnN0ZWFkLlwiKTtcbiAgICAgICAgcmV0dXJuIERleGllLmlnbm9yZVRyYW5zYWN0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgRGV4aWUudmlwID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIC8vIFRvIGJlIHVzZWQgYnkgc3Vic2NyaWJlcnMgdG8gdGhlIG9uKCdyZWFkeScpIGV2ZW50LlxuICAgICAgICAvLyBUaGlzIHdpbGwgbGV0IGNhbGxlciB0aHJvdWdoIHRvIGFjY2VzcyBEQiBldmVuIHdoZW4gaXQgaXMgYmxvY2tlZCB3aGlsZSB0aGUgZGIucmVhZHkoKSBzdWJzY3JpYmVycyBhcmUgZmlyaW5nLlxuICAgICAgICAvLyBUaGlzIHdvdWxkIGhhdmUgd29ya2VkIGF1dG9tYXRpY2FsbHkgaWYgd2Ugd2VyZSBjZXJ0YWluIHRoYXQgdGhlIFByb3ZpZGVyIHdhcyB1c2luZyBEZXhpZS5Qcm9taXNlIGZvciBhbGwgYXN5bmNyb25pYyBvcGVyYXRpb25zLiBUaGUgcHJvbWlzZSBQU0RcbiAgICAgICAgLy8gZnJvbSB0aGUgcHJvdmlkZXIuY29ubmVjdCgpIGNhbGwgd291bGQgdGhlbiBiZSBkZXJpdmVkIGFsbCB0aGUgd2F5IHRvIHdoZW4gcHJvdmlkZXIgd291bGQgY2FsbCBsb2NhbERhdGFiYXNlLmFwcGx5Q2hhbmdlcygpLiBCdXQgc2luY2VcbiAgICAgICAgLy8gdGhlIHByb3ZpZGVyIG1vcmUgbGlrZWx5IGlzIHVzaW5nIG5vbi1wcm9taXNlIGFzeW5jIEFQSXMgb3Igb3RoZXIgdGhlbmFibGUgaW1wbGVtZW50YXRpb25zLCB3ZSBjYW5ub3QgYXNzdW1lIHRoYXQuXG4gICAgICAgIC8vIE5vdGUgdGhhdCB0aGlzIG1ldGhvZCBpcyBvbmx5IHVzZWZ1bCBmb3Igb24oJ3JlYWR5Jykgc3Vic2NyaWJlcnMgdGhhdCBpcyByZXR1cm5pbmcgYSBQcm9taXNlIGZyb20gdGhlIGV2ZW50LiBJZiBub3QgdXNpbmcgdmlwKClcbiAgICAgICAgLy8gdGhlIGRhdGFiYXNlIGNvdWxkIGRlYWRsb2NrIHNpbmNlIGl0IHdvbnQgb3BlbiB1bnRpbCB0aGUgcmV0dXJuZWQgUHJvbWlzZSBpcyByZXNvbHZlZCwgYW5kIGFueSBub24tVklQZWQgb3BlcmF0aW9uIHN0YXJ0ZWQgYnlcbiAgICAgICAgLy8gdGhlIGNhbGxlciB3aWxsIG5vdCByZXNvbHZlIHVudGlsIGRhdGFiYXNlIGlzIG9wZW5lZC5cbiAgICAgICAgcmV0dXJuIFByb21pc2UubmV3UFNEKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFByb21pc2UuUFNELmxldFRocm91Z2ggPSB0cnVlOyAvLyBNYWtlIHN1cmUgd2UgYXJlIGxldCB0aHJvdWdoIGlmIHN0aWxsIGJsb2NraW5nIGRiIGR1ZSB0byBvbnJlYWR5IGlzIGZpcmluZy5cbiAgICAgICAgICAgIHJldHVybiBmbigpO1xuICAgICAgICB9KTtcbiAgICB9OyBcblxuICAgIC8vIERleGllLmN1cnJlbnRUcmFuc2FjdGlvbiBwcm9wZXJ0eS4gT25seSBhcHBsaWNhYmxlIGZvciB0cmFuc2FjdGlvbnMgZW50ZXJlZCB1c2luZyB0aGUgbmV3IFwidHJhbnNhY3QoKVwiIG1ldGhvZC5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRGV4aWUsIFwiY3VycmVudFRyYW5zYWN0aW9uXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cIlRyYW5zYWN0aW9uXCI+PC9yZXR1cm5zPlxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuUFNEICYmIFByb21pc2UuUFNELnRyYW5zIHx8IG51bGw7XG4gICAgICAgIH1cbiAgICB9KTsgXG5cbiAgICBmdW5jdGlvbiBzYWZhcmlNdWx0aVN0b3JlRml4KHN0b3JlTmFtZXMpIHtcbiAgICAgICAgcmV0dXJuIHN0b3JlTmFtZXMubGVuZ3RoID09PSAxID8gc3RvcmVOYW1lc1swXSA6IHN0b3JlTmFtZXM7XG4gICAgfVxuXG4gICAgLy8gRXhwb3J0IG91ciBQcm9taXNlIGltcGxlbWVudGF0aW9uIHNpbmNlIGl0IGNhbiBiZSBoYW5keSBhcyBhIHN0YW5kYWxvbmUgUHJvbWlzZSBpbXBsZW1lbnRhdGlvblxuICAgIERleGllLlByb21pc2UgPSBQcm9taXNlO1xuICAgIC8vIEV4cG9ydCBvdXIgZGVyaXZlL2V4dGVuZC9vdmVycmlkZSBtZXRob2RvbG9neVxuICAgIERleGllLmRlcml2ZSA9IGRlcml2ZTtcbiAgICBEZXhpZS5leHRlbmQgPSBleHRlbmQ7XG4gICAgRGV4aWUub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgICAvLyBFeHBvcnQgb3VyIGV2ZW50cygpIGZ1bmN0aW9uIC0gY2FuIGJlIGhhbmR5IGFzIGEgdG9vbGtpdFxuICAgIERleGllLmV2ZW50cyA9IGV2ZW50cztcbiAgICBEZXhpZS5nZXRCeUtleVBhdGggPSBnZXRCeUtleVBhdGg7XG4gICAgRGV4aWUuc2V0QnlLZXlQYXRoID0gc2V0QnlLZXlQYXRoO1xuICAgIERleGllLmRlbEJ5S2V5UGF0aCA9IGRlbEJ5S2V5UGF0aDtcbiAgICBEZXhpZS5zaGFsbG93Q2xvbmUgPSBzaGFsbG93Q2xvbmU7XG4gICAgRGV4aWUuZGVlcENsb25lID0gZGVlcENsb25lO1xuICAgIERleGllLmFkZG9ucyA9IFtdO1xuICAgIERleGllLmZha2VBdXRvQ29tcGxldGUgPSBmYWtlQXV0b0NvbXBsZXRlO1xuICAgIERleGllLmFzYXAgPSBhc2FwO1xuICAgIC8vIEV4cG9ydCBvdXIgc3RhdGljIGNsYXNzZXNcbiAgICBEZXhpZS5Nb2RpZnlFcnJvciA9IE1vZGlmeUVycm9yO1xuICAgIERleGllLk11bHRpTW9kaWZ5RXJyb3IgPSBNb2RpZnlFcnJvcjsgLy8gQmFja3dhcmQgY29tcGF0aWJpbGl0eSBwcmUgMC45LjhcbiAgICBEZXhpZS5JbmRleFNwZWMgPSBJbmRleFNwZWM7XG4gICAgRGV4aWUuVGFibGVTY2hlbWEgPSBUYWJsZVNjaGVtYTtcbiAgICAvL1xuICAgIC8vIERlcGVuZGVuY2llc1xuICAgIC8vXG4gICAgLy8gVGhlc2Ugd2lsbCBhdXRvbWF0aWNhbGx5IHdvcmsgaW4gYnJvd3NlcnMgd2l0aCBpbmRleGVkREIgc3VwcG9ydCwgb3Igd2hlcmUgYW4gaW5kZXhlZERCIHBvbHlmaWxsIGhhcyBiZWVuIGluY2x1ZGVkLlxuICAgIC8vXG4gICAgLy8gSW4gbm9kZS5qcywgaG93ZXZlciwgdGhlc2UgcHJvcGVydGllcyBtdXN0IGJlIHNldCBcIm1hbnVhbGx5XCIgYmVmb3JlIGluc3RhbnNpYXRpbmcgYSBuZXcgRGV4aWUoKS4gRm9yIG5vZGUuanMsIHlvdSBuZWVkIHRvIHJlcXVpcmUgaW5kZXhlZGRiLWpzIG9yIHNpbWlsYXIgYW5kIHRoZW4gc2V0IHRoZXNlIGRlcHMuXG4gICAgLy9cbiAgICB2YXIgaWRic2hpbSA9IGdsb2JhbC5pZGJNb2R1bGVzICYmIGdsb2JhbC5pZGJNb2R1bGVzLnNoaW1JbmRleGVkREIgPyBnbG9iYWwuaWRiTW9kdWxlcyA6IHt9O1xuICAgIERleGllLmRlcGVuZGVuY2llcyA9IHtcbiAgICAgICAgLy8gUmVxdWlyZWQ6XG4gICAgICAgIC8vIE5PVEU6IFRoZSBcIl9cIi1wcmVmaXhlZCB2ZXJzaW9ucyBhcmUgZm9yIHByaW9yaXRpemluZyBJREItc2hpbSBvbiBJT1M4IGJlZm9yZSB0aGUgbmF0aXZlIElEQiBpbiBjYXNlIHRoZSBzaGltIHdhcyBpbmNsdWRlZC5cbiAgICAgICAgaW5kZXhlZERCOiBpZGJzaGltLnNoaW1JbmRleGVkREIgfHwgZ2xvYmFsLmluZGV4ZWREQiB8fCBnbG9iYWwubW96SW5kZXhlZERCIHx8IGdsb2JhbC53ZWJraXRJbmRleGVkREIgfHwgZ2xvYmFsLm1zSW5kZXhlZERCLFxuICAgICAgICBJREJLZXlSYW5nZTogaWRic2hpbS5JREJLZXlSYW5nZSB8fCBnbG9iYWwuSURCS2V5UmFuZ2UgfHwgZ2xvYmFsLndlYmtpdElEQktleVJhbmdlLFxuICAgICAgICBJREJUcmFuc2FjdGlvbjogaWRic2hpbS5JREJUcmFuc2FjdGlvbiB8fCBnbG9iYWwuSURCVHJhbnNhY3Rpb24gfHwgZ2xvYmFsLndlYmtpdElEQlRyYW5zYWN0aW9uLFxuICAgICAgICAvLyBPcHRpb25hbDpcbiAgICAgICAgRXJyb3I6IGdsb2JhbC5FcnJvciB8fCBTdHJpbmcsXG4gICAgICAgIFN5bnRheEVycm9yOiBnbG9iYWwuU3ludGF4RXJyb3IgfHwgU3RyaW5nLFxuICAgICAgICBUeXBlRXJyb3I6IGdsb2JhbC5UeXBlRXJyb3IgfHwgU3RyaW5nLFxuICAgICAgICBET01FcnJvcjogZ2xvYmFsLkRPTUVycm9yIHx8IFN0cmluZyxcbiAgICAgICAgbG9jYWxTdG9yYWdlOiAoKHR5cGVvZiBjaHJvbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgY2hyb21lICE9PSBudWxsID8gY2hyb21lLnN0b3JhZ2UgOiB2b2lkIDApICE9IG51bGwgPyBudWxsIDogZ2xvYmFsLmxvY2FsU3RvcmFnZSlcbiAgICB9OyBcblxuICAgIC8vIEFQSSBWZXJzaW9uIE51bWJlcjogVHlwZSBOdW1iZXIsIG1ha2Ugc3VyZSB0byBhbHdheXMgc2V0IGEgdmVyc2lvbiBudW1iZXIgdGhhdCBjYW4gYmUgY29tcGFyYWJsZSBjb3JyZWN0bHkuIEV4YW1wbGU6IDAuOSwgMC45MSwgMC45MiwgMS4wLCAxLjAxLCAxLjEsIDEuMiwgMS4yMSwgZXRjLlxuICAgIERleGllLnZlcnNpb24gPSAxLjIwO1xuXG4gICAgZnVuY3Rpb24gZ2V0TmF0aXZlR2V0RGF0YWJhc2VOYW1lc0ZuKCkge1xuICAgICAgICB2YXIgaW5kZXhlZERCID0gRGV4aWUuZGVwZW5kZW5jaWVzLmluZGV4ZWREQjtcbiAgICAgICAgdmFyIGZuID0gaW5kZXhlZERCICYmIChpbmRleGVkREIuZ2V0RGF0YWJhc2VOYW1lcyB8fCBpbmRleGVkREIud2Via2l0R2V0RGF0YWJhc2VOYW1lcyk7XG4gICAgICAgIHJldHVybiBmbiAmJiBmbi5iaW5kKGluZGV4ZWREQik7XG4gICAgfVxuXG4gICAgLy8gRXhwb3J0IERleGllIHRvIHdpbmRvdyBvciBhcyBhIG1vZHVsZSBkZXBlbmRpbmcgb24gZW52aXJvbm1lbnQuXG4gICAgcHVibGlzaChcIkRleGllXCIsIERleGllKTtcblxuICAgIC8vIEZvb2wgSURFIHRvIGltcHJvdmUgYXV0b2NvbXBsZXRlLiBUZXN0ZWQgd2l0aCBWaXN1YWwgU3R1ZGlvIDIwMTMgYW5kIDIwMTUuXG4gICAgZG9GYWtlQXV0b0NvbXBsZXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICBEZXhpZS5mYWtlQXV0b0NvbXBsZXRlID0gZmFrZUF1dG9Db21wbGV0ZSA9IGRvRmFrZUF1dG9Db21wbGV0ZTtcbiAgICAgICAgRGV4aWUuZmFrZSA9IGZha2UgPSB0cnVlO1xuICAgIH0pO1xufSkuYXBwbHkobnVsbCxcblxuICAgIC8vIEFNRDpcbiAgICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgP1xuICAgIFtzZWxmIHx8IHdpbmRvdywgZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7IGRlZmluZShmdW5jdGlvbiAoKSB7IHJldHVybiB2YWx1ZTsgfSk7IH1dIDpcblxuICAgIC8vIENvbW1vbkpTOlxuICAgIHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzID9cbiAgICBbZ2xvYmFsLCBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHsgbW9kdWxlLmV4cG9ydHMgPSB2YWx1ZTsgfV1cblxuICAgIC8vIFZhbmlsbGEgSFRNTCBhbmQgV2ViV29ya2VyczpcbiAgICA6IFtzZWxmIHx8IHdpbmRvdywgZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7IChzZWxmIHx8IHdpbmRvdylbbmFtZV0gPSB2YWx1ZTsgfV0pO1xuXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9kZXhpZS9kaXN0L2xhdGVzdC9EZXhpZS5qc1xuICoqIG1vZHVsZSBpZCA9IDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBuZXh0VGljayA9IHJlcXVpcmUoJ3Byb2Nlc3MvYnJvd3Nlci5qcycpLm5leHRUaWNrO1xudmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGltbWVkaWF0ZUlkcyA9IHt9O1xudmFyIG5leHRJbW1lZGlhdGVJZCA9IDA7XG5cbi8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cbmV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFyVGltZW91dCk7XG59O1xuZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRJbnRlcnZhbCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhckludGVydmFsKTtcbn07XG5leHBvcnRzLmNsZWFyVGltZW91dCA9XG5leHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbih0aW1lb3V0KSB7IHRpbWVvdXQuY2xvc2UoKTsgfTtcblxuZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuICB0aGlzLl9pZCA9IGlkO1xuICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcbn1cblRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2NsZWFyRm4uY2FsbCh3aW5kb3csIHRoaXMuX2lkKTtcbn07XG5cbi8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuZXhwb3J0cy5lbnJvbGwgPSBmdW5jdGlvbihpdGVtLCBtc2Vjcykge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG59O1xuXG5leHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gLTE7XG59O1xuXG5leHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cbiAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG4gIGlmIChtc2VjcyA+PSAwKSB7XG4gICAgaXRlbS5faWRsZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gb25UaW1lb3V0KCkge1xuICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcbiAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG4gICAgfSwgbXNlY3MpO1xuICB9XG59O1xuXG4vLyBUaGF0J3Mgbm90IGhvdyBub2RlLmpzIGltcGxlbWVudHMgaXQgYnV0IHRoZSBleHBvc2VkIGFwaSBpcyB0aGUgc2FtZS5cbmV4cG9ydHMuc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gc2V0SW1tZWRpYXRlIDogZnVuY3Rpb24oZm4pIHtcbiAgdmFyIGlkID0gbmV4dEltbWVkaWF0ZUlkKys7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aCA8IDIgPyBmYWxzZSA6IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBpbW1lZGlhdGVJZHNbaWRdID0gdHJ1ZTtcblxuICBuZXh0VGljayhmdW5jdGlvbiBvbk5leHRUaWNrKCkge1xuICAgIGlmIChpbW1lZGlhdGVJZHNbaWRdKSB7XG4gICAgICAvLyBmbi5jYWxsKCkgaXMgZmFzdGVyIHNvIHdlIG9wdGltaXplIGZvciB0aGUgY29tbW9uIHVzZS1jYXNlXG4gICAgICAvLyBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2NhbGwtYXBwbHktc2VndVxuICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbi5jYWxsKG51bGwpO1xuICAgICAgfVxuICAgICAgLy8gUHJldmVudCBpZHMgZnJvbSBsZWFraW5nXG4gICAgICBleHBvcnRzLmNsZWFySW1tZWRpYXRlKGlkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpZDtcbn07XG5cbmV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSB0eXBlb2YgY2xlYXJJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IGNsZWFySW1tZWRpYXRlIDogZnVuY3Rpb24oaWQpIHtcbiAgZGVsZXRlIGltbWVkaWF0ZUlkc1tpZF07XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogKHdlYnBhY2spL34vbm9kZS1saWJzLWJyb3dzZXIvfi90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzXG4gKiogbW9kdWxlIGlkID0gMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqICh3ZWJwYWNrKS9+L25vZGUtbGlicy1icm93c2VyL34vcHJvY2Vzcy9icm93c2VyLmpzXG4gKiogbW9kdWxlIGlkID0gM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwIDFcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9