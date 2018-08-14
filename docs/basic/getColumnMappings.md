### ``getColumnMappings(tblName)``
Returns the columnMappings for ``tblName``.
- `tblName` `<String>`
```js
var columnMappings = {
	mapping: {
		group0: 'Col0'
		group1: 'Col1'
		group2: 'Col2'
		group3: 'Col3',
		field0: 'Col4',
		field1: 'Col5',
		field2: 'Col6',
		field3: 'Col7'
	},
	groups: [group0, group1, group2, group3],
	fields: [field0, field1, field2, field3]
};
```

```js
return sqlh.createTable('Test', ['group'], ['field']).then(function(){
	var columnMappings = sqlh.getColumnMappings('Test');
});
```