### ``buildColumnStatements(tblName, groups, fields, prefix, suffix, leftOrRight, aliasTblName)``
Returns a string that represents the columns of a `SELECT` statement using the columnMappings for ``groups`` and ``fields`` of ``tblName``. A ``prefix`` or ``suffix`` can be provided to wrap each column for additional operations. If ``leftOrRight`` is provided as `left` or `right`, the mapping of ``groupOrField`` is expected to have the suffix `_1` or `_2` respectively. This can be used when performing a join when there are duplicate groups or fields. If ``aliasTblName`` is provided, an alias for each column will be based on the columnMappings of ``aliasTblName``.
- `tblName` `<String>`
- `groups` `<Array>`
- `fields` `<Array>`
- `prefix` `<String>` : Optional, default is ``
- `suffix` `<String>` : Optional, default is ``
- `leftOrRight` `<String>` : Optional, default is `null`
- `aliasTblName` `<String>` : Optional, default is `null`

```js
var selectStmt = 'SELECT ' + sqlh.buildColumnStatements('Test', ['group0', 'group1'], ['field0', 'field1'], 'ISNULL(', ', N/A)') + ' FROM Test';
```