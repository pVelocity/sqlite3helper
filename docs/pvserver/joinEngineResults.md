### ``joinEngineResults(tblName, joinInfo, removeGroupNull, removeFieldNull)``
Performs `JOIN` operation based on ``joinInfo`` to create a new table under ``tblName`` and returns its groups and fields. ColumnMappings are set for ``tblName`` with ``groups`` and ``fields``. Database is initialized if not already. If a table already exists under ``tblName``, it will be overwritten along with the columnMappings. If ``removeGroupNull`` or ``removeFieldNull`` is ``true``, ``null`` values will be removed rather than be replaced with ``- N/A -`` for ``groups`` and ``0`` for ``fields``.
- `tblName` `<String>`
- `joinInfo` `<Object>`
- `removeGroupNull` `<Boolean>`: Optional, default is `false`
- `removeFieldNull` `<Boolean>`: Optional, default is `false`
```js
var joinInfo = {
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
```
- `type`: the type of JOIN that will be executed
	- [LEFT JOIN](https://www.w3schools.com/sql/sql_join_left.asp): also known as LEFT OUTER JOIN
 	- [JOIN](https://www.w3schools.com/sql/sql_join_inner.asp): also known as INNER JOIN
	- [FULL JOIN](https://www.w3schools.com/sql/sql_join_full.asp): also known as FULL OUTER JOIN
- `on`: groups from left and right tables that will be matched; keys and values are associated with the left and right tables respectively
- `left`: details of the left table
- `right`: details of the right table
- `tblName`: name of the table
- `groups`: groups of the table; on groups must be present, groups with the same name in both left and right tables will contain the suffix `_1` and `_2` respectively
- `fields`: fields of the table; fields with the same name in both left and right tables will contain the suffix `_1` and `_2` respectively

```js
var joinInfo = {
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

return sqlh.joinEngineResults('Test', joinInfo).then(function(){
	console.log('Done');
});
```
