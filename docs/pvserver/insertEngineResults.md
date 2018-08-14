### ``insertEngineResults(tblName, tblData, groups, fields, defaultGroupValue, defaultFieldValue)``
Creates a table in the Database under ``tblName`` using ``groups`` and ``fields`` as columns with ``tblData`` inserted. ColumnMappings are set for ``tblName`` with ``groups`` and ``fields``. Database is initialized if not already. If a table already exists under ``tblName``, it will be overwritten along with the columnMappings.

- `tblName` `<String>`
- `tblData` `<Array>`
- `groups` `<Array>`
- `fields` `<Array>`
- `defaultGroupValue` `<String>` : Optional, default is `- N/A -`; `null` is valid, `undefined` will set this to the default
- `defaultFieldValue` `<Number>` : Optional, default is `0`; `null` is valid, `undefined` will set this to the default

```js
var tblData = [{
	group0: 'Hello',
	group1: 'World',
	field0: 1,
	field1: 1.1
}, {
	group0: 'Bye',
	group1: 'World',
	field0: -1,
	field1: -1.1
}];

return sqlh.insertEngineResults('Test', tblData, ['group0', 'group1'], ['field0', 'field1']).then(function(){
	console.log('Done');
});
```