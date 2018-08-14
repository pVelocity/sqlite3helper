### ``createTable(tblName, groups, fields)``
Creates a table in the Database under ``tblName`` using ``groups`` and ``fields`` as columns. ColumnMappings are set for ``tblName`` with ``groups`` and ``fields``. Database is initialized if not already. If a table already exists under ``tblName``, it will be overwritten along with the columnMappings.
- `tblName` `<String>`
- `groups` `<Array>`
- `fields` `<Array>`

```js
return sqlh.createTable('Test', ['group0', 'group1'], ['field0', 'field1']).then(function(){
	console.log('Done');
});
```