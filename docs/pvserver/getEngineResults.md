### ``getEngineResults(tblName)``
Return all table rows from ``tblName``. This is equivalent to `SELECT * FROM tblName`. If columnMappings exists for `tblName`, all columns will be parsed as `TEXT`.
- `tblName` `<String>`

```js
return sqlh.getEngineResults('Test').then(function(rows){
	console.log('Done');
});
```