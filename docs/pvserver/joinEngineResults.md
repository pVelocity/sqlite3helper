### ``joinEngineResults(joinInfo, removeGroupNull, removeFieldNull)``
Performs `JOIN` operation based on ``joinInfo`` to create a new Join Table and returns its groups and fields.
The Join Table will be created under ``tblName`` and its ColumnMappings are set by concatenating the ``groups`` and ``fields`` from the ``left`` and ``right``. ``groups`` and ``fields`` with the same name in both left and right tables will contain the suffix `_1` and `_2` respectively. Database is initialized if not already.

A Summary Table (subtotals of the Join Table) can be created based on the ``summaryGroups`` and ``fields``.
If ``summaryTblName`` and ``summaryGroups`` are provided, the Summary Table will also be created, along with its ColumnMappings, returning its groups and fields instead of the Join Table's.

If a table already exists under ``tblName`` or ``summaryTblName``, it will be overwritten along with the columnMappings.

If ``removeGroupNull`` or ``removeFieldNull`` is ``true``, ``null`` values will be removed rather than be replaced with ``- N/A -`` for ``groups`` and ``0`` for ``fields``.

- `joinInfo` `<Object>`
- `removeGroupNull` `<Boolean>`: Optional, default is `false`
- `removeFieldNull` `<Boolean>`: Optional, default is `false`
```js
var joinInfo = {
    tblName: 'Test',
    summaryTblName: 'SummaryTest',
    type: 'JOIN',
    on: {
        aGroup0: 'bGroup0',
        aGroup1: 'bGroup1'
    },
    left: {
        tblName: 'aTable',
        groups: ['aGroup0', 'aGroup1', 'aGroup2'],
        fields: ['aField0', 'aField1'],
        summaryGroups: ['aGroup0', 'aGroup1']
    },
    right: {
        tblName: 'bTable',
        groups: ['bGroup0', 'bGroup1'],
        fields: ['bField0'],
        summaryGroups: ['bGroup0', 'bGroup1']
    }
};
```
- `type`: the type of JOIN that will be executed
	- [LEFT JOIN](https://www.w3schools.com/sql/sql_join_left.asp): also known as LEFT OUTER JOIN
 	- [JOIN](https://www.w3schools.com/sql/sql_join_inner.asp): also known as INNER JOIN
	- [FULL JOIN](https://www.w3schools.com/sql/sql_join_full.asp): also known as FULL OUTER JOIN
- `on`: groups from left and right tables that will be matched; keys and values are associated with the left and right tables respectively
- `left`: details of the left table
- `right`: details of the right table
- `tblName`: name of the table
- `summaryTblName`: name of the summary table
- `groups`: groups of the left table
- `fields`: fields of the right table
- `summaryGroups`: groups of the left table used for summary

```js
var joinInfo = {
    tblName: 'Test',
    type: 'JOIN',
    on: {
        aGroup0: 'bGroup0',
        aGroup1: 'bGroup1'
    },
    left: {
        tblName: 'aTable',
        groups: ['aGroup0', 'aGroup1', 'aGroup2'],
        fields: ['aField0', 'aField1']
    },
    right: {
        tblName: 'bTable',
        groups: ['bGroup0', 'bGroup1'],
        fields: ['bField0']
    }
};

return sqlh.joinEngineResults(joinInfo).then(function(){
	console.log('Done');
});
```
