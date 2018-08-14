### ``closeDatabase()``
Ensures that the Database is closed.

```js
var db = sqlh.getDatabase();
return sqlh.closeDatabse().then(function(){
	console.log('Done');
});
```