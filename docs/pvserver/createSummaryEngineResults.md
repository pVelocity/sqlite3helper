### ``createSummaryEngineResults(summaryTblName, tblName, groups, fields)``
Creates a Summary Table in the Database under ``summaryTblName`` using ``groups`` and ``fields`` from the table ``tblName``. A Summary Table is a table that consists of the ``fields`` subtotals for every combination of ``groups`` from the table ``tblName``. ColumnMappings are set for ``summaryTblName`` with ``groups`` and ``fields``. Database is initialized if not already. If a table already exists under ``summaryTblName``, it will be overwritten along with the columnMappings.

- `summaryTblName` `<String>`
- `tblName` `<String>`
- `groups` `<Array>`
- `fields` `<Array>`

```js
return sqlh.createSummaryEngineResults('SummaryTest', 'Test', ['group0', 'group1'], ['field0', 'field1']).then(function(){
    console.log('Done');
});
```