const ffi = require('ffi-napi');
const ref = require('ref-napi');
 
const sqlite3 = ref.types.void;
const sqlite3Ptr = ref.refType(sqlite3);
const sqlite3PtrPtr = ref.refType(sqlite3Ptr);
 
const sqlstatement = ref.types.void;
const sqlstatementPtr = ref.refType(sqlstatement);
const sqlstatementPtrPtr = ref.refType(sqlstatementPtr);
 
// yoink constants from reading sqlite3.h and put here
const SQLITE_ROW = 100;
const SQLITE_DONE = 101;
const SQL_TYPE = {
  int: 1,
  float: 2,
  text: 3,
  blob: 4,
  none: 5,
};

const _lib = ffi.Library('libsqlite3', {
  'sqlite3_bind_int64': [ 'int', [ sqlstatementPtr, 'int', 'long long' ] ],
  'sqlite3_bind_double': [ 'int', [ sqlstatementPtr, 'int', 'double' ] ],
  'sqlite3_bind_text': [ 'int', [ sqlstatementPtr, 'int', 'string', 'int', 'long long'] ],
  'sqlite3_open': [ 'int', [ 'string', sqlite3PtrPtr ] ],
  'sqlite3_prepare_v2': [ 'int', [ sqlite3Ptr, 'string', 'int', sqlstatementPtrPtr, 'int' ] ],
  'sqlite3_close': [ 'int', [ sqlite3Ptr ] ],
  'sqlite3_exec': [ 'int', [ sqlite3Ptr, 'string', 'pointer', 'pointer', 'string' ] ],
  'sqlite3_step': [ 'int', [ sqlstatementPtr] ],
  'sqlite3_column_type': [ 'int', [ sqlstatementPtr, 'int' ] ],
  'sqlite3_column_text': [ 'string', [ sqlstatementPtr, 'int' ] ],
  'sqlite3_column_name': [ 'string', [ sqlstatementPtr, 'int' ] ],
  'sqlite3_column_count': [ 'int', [ sqlstatementPtr ] ],
  'sqlite3_column_int64': [ 'long long', [sqlstatementPtr, 'int' ] ],
  'sqlite3_column_double': [ 'double', [sqlstatementPtr, 'int' ] ],
});
 
// eventually, your code should be structured into this class
class SQLite {
  #db;
  constructor(filename=':memory:') {
    const ss_db = ref.alloc(sqlite3PtrPtr);
    const rc = _lib.sqlite3_open(filename, ss_db);
    console.log(ss_db.deref());
    if (rc != 0) {
      throw new Error("Cannot read in memory!");
    } 
    this.#db = ss_db;
  }
  query(statement, binding=[]) {
    let rc = 0;
    const res = ref.alloc(sqlstatementPtrPtr)
    rc = _lib.sqlite3_prepare_v2(this.#db.deref(), statement, -1, res, 0);
    if (rc != 0) {
      throw new Error("ERROR!");
    }

    for (let i = 0; i < binding.length; i++) {
      const param = binding[i];
      const typeParam = typeof(param);
      if (typeParam === 'number') {
          if (Number.isInteger(param)) {
            rc = _lib.sqlite3_bind_int64(res.deref(), i+1, param);
          }
          else {
            rc = _lib.sqlite3_bind_double(res.deref(), i+1, param);
          }
      }
      else if (typeParam === 'string') {
        rc = _lib.sqlite3_bind_text(res.deref(), i+1, param, param.length, 0);
      }
    }
'?'
    const ret = [];
    while (_lib.sqlite3_step(res.deref()) == SQLITE_ROW) {
      const obj = {};
      for (let i = 0; i < _lib.sqlite3_column_count(res.deref()); i++) {
        const colName = _lib.sqlite3_column_name(res.deref(), i);
        const value = this.#value(res, i);
        obj[colName] = value;
      };
      ret.push(obj);
    }
    return ret;
  }
  
  #value(res, i) {
    switch (_lib.sqlite3_column_type(res.deref(), i)) {
      case SQL_TYPE.text:
          return _lib.sqlite3_column_text(res.deref(), i);
      case SQL_TYPE.int:
        return _lib.sqlite3_column_int64(res.deref(), i);
      case SQL_TYPE.float:
        return _lib.sqlite3_column_double(res.deref(), i);
    };
  }
}       

// and should be callable like below

let db;
function init(filename=':memory:') {
  db = new SQLite(filename);
}


function sql(str,...vals) {
  if (db != undefined) {
    const formattedStr = str.join('?');
    return db.query(formattedStr,vals);
  }
};

module.exports = { init, sql };



// // use below as a playground
// let rc = 0;
 
// // translation of
// // sqlite3 *db;
// // int rc = sqlite3_open(':memory:', &db);
// // printf("%d\n", rc);
// const ss_db = ref.alloc(sqlite3PtrPtr);
// rc = _lib.sqlite3_open(':memory:', ss_db);
// console.log(rc);
 
// // translation of
// // sqlite3 *db;
// // sqlite3_stmnt *res;
// // int rc = sqlite3_prepare_v2(db, "SELECT SQLITE_VERSION()", -1, &res, 0);
// // printf("%d\n", rc);
// const res = ref.alloc(sqlstatementPtrPtr);
// rc = _lib.sqlite3_prepare_v2(ss_db.deref(), 'SELECT SQLITE_VERSION()', -1, res, 0);
// console.log(rc);
