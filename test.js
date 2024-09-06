const {init, sql} = require('./lib.js');

init();
console.log(sql`SELECT SQLITE_VERSION()`);
console.log(sql`CREATE TABLE test (id TEXT)`);
console.log(sql`CREATE TABLE test2 (id INT)`);
console.log(sql`INSERT INTO test (id) VALUES ("a")`);
console.log(sql`INSERT INTO test2 (id) VALUES (5)`);
console.log(sql`SELECT * FROM test`);
console.log(sql`SELECT * FROM test2`);

const testId = "a";
console.log(sql`SELECT * FROM test WHERE id=${testId}`);

const test2Id = 5;
console.log(sql`SELECT * FROM test2 WHERE id=${test2Id}`);
