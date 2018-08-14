### ``normalizeColName(tblName, groupOrField, leftOrRight)``
Returns the column name of ``groupOrField`` for ``tblName`` by using the columnMapping. If ``leftOrRight`` is provided as `left` or `right`, the mapping of ``groupOrField`` is expected to have the suffix `_1` or `_2` respectively. This can be used when performing a join when there are duplicate groups or fields.
- `tblName` `<String>`
- `groupOrField` `<String>`
- `leftOrRight` `<String>` : Optional, default is `null`

```js
sqlh.normalizeColName('Test', 'group0');
```