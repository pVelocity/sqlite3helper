### ``forEachEngineResults(tblName, callback)``
Executes ``callback`` on each table row from ``tblName`` and returns the total number of rows processed. If columnMappings exists for `tblName`, all columns will be parsed as `TEXT`.
- `tblName` `<String>`
- `callback` `<Function>`

```js
var rows = [];
return sqlh.forEachEngineResults('Test', function(err, row){
	rows.push(row);
}).then(function(){
	console.log('Done');
});
```