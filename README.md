# pvsqlite3helper

This is an npm module design to perform common sqlite3 uses with pVelocity's [pvserver](https://github.com/pVelocity/pvserver). The sqlite3 database is only active in memory.

## Getting Started

Install the ``pvsqlite3helper`` module.

    npm install --save pvsqlite3helper

Use the require statement to load the module.

```js
var sqlh = require('pvsqlite3helper');
```

## Methods

### Basic
- [setVerbose](docs/basic/setVerbose.md)
- [getDatabase](docs/basic/getDatabase.md)
- [closeDatabase](docs/basic/closeDatabase.md)
- [getColumnMappings](docs/basic/getColumnMappings.md)
- [setColumnMappings](docs/basic/setColumnMappings.md)
- [normalizeColName](docs/basic/normalizeColName.md)
- [buildColumnStatements](docs/basic/buildColumnStatements.md)
- [createTable](docs/basic/createTable.md)

### pvserver
- [insertEngineResults](docs/pvserver/insertEngineResults.md)
- [getEngineResults](docs/pvserver/getEngineResults.md)
- [forEachEngineResults](docs/pvserver/forEachEngineResults.md)
- [joinEngineResults](docs/pvserver/joinEngineResults.md)

## License

Copyright (c) 2016, pVelocity Inc

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.