/*global PV */
'use strict';

/* jshint strict: true */
/* jshint node: true */
/* jshint unused: false */
require('pvjs');
var sqlite3 = require('sqlite3');
var prom = require('bluebird');

module.exports = {
    columnMappings: {},
    db: null,

    getDatabase: function() {
        if (PV.isDatabase(this.db) === false) {
            this.db = prom.promisifyAll(new sqlite3.Database(':memory:'));
        }
        return this.db;
    },

    setColumnMappings: function(tblName, groups, fields) {
        if (PV.isString(tblName)) {
            var cols = [];
            if (PV.isArray(groups)) {
                cols = groups;
            }
            if (PV.isArray(fields)) {
                cols = cols.concat(fields);
            }
            if (cols.length > 0) {
                var mapping = {};
                for (var i = 0; i < cols.length; i++) {
                    mapping[cols[i]] = 'Col' + i;
                }
                this.columnMappings[tblName] = {};
                this.columnMappings[tblName].mappings = mapping;
                this.columnMappings[tblName].groups = groups;
                this.columnMappings[tblName].fields = fields;
            }
        }
    },

    getColumnMappings: function(tblName) {
        if (PV.isObject(this.columnMappings) && PV.isObject(this.columnMappings[tblName])) {
            return this.columnMappings[tblName];
        }
        return {};
    },

    normalizeColName: function(tblName, groupOrField) {
        var colMapping = this.getColumnMappings(tblName);
        if (PV.isObject(colMapping.mappings) && PV.isString(colMapping.mappings[groupOrField])) {
            return colMapping.mappings[groupOrField];
        }
        return groupOrField;
    },

    createTable: function(tblName, groups, fields) {
        var arrStmt = [];
        if (PV.isArray(groups)) {
            for (var i = 0; i < groups.length; i++) {
                arrStmt.push(this.normalizeColName(tblName, groups[i]) + ' TEXT');
            }
        }
        if (PV.isArray(fields)) {
            for (var j = 0; j < fields.length; j++) {
                arrStmt.push(this.normalizeColName(tblName, fields[j]) + ' NUMERIC');
            }
        }
        var createStmt = 'CREATE TABLE ' + tblName + '(' + arrStmt.join(',') + ')';
        return this.db.runAsync(createStmt);
    },

    insertEngineResults: function(tblName, tblData, groups, fields) {
        var stmt = null;
        return new prom.Promise(function(resolve, reject) {
            if (PV.isString(tblName) && PV.isArray(tblData) && (PV.isArray(groups) || PV.isArray(fields))) {
                var cols = [];
                if (PV.isArray(groups)) {
                    cols = groups;
                }
                if (PV.isArray(fields)) {
                    cols = cols.concat(fields);
                }
                return this.db.runAsync('DROP TABLE IF EXISTS ' + tblName).then(function() {
                    this.setColumnMappings(tblName, groups, fields);
                    return this.createTable(tblName, groups, fields);
                }).then(function() {
                    var preCol = [];
                    for (var i = 0; i < cols.length; i++) {
                        preCol.push('?');
                    }
                    var insertStmt = 'INSERT INTO ' + tblName + ' VALUES (' + preCol.join(',') + ')';
                    return this.db.prepare(insertStmt);
                }).then(function(result) {
                    stmt = prom.promisifyAll(result);

                    var promises = [];
                    for (var row = 0; row < tblData.length; row++) {
                        var vals = [];
                        if (PV.isArray(groups)) {
                            for (var g = 0; g < groups.length; g++) {
                                var gValObj = tblData[row][groups[g]];
                                if (PV.isObject(gValObj) && PV.isString(gValObj.text)) {
                                    vals.push(gValObj.text);
                                } else if (PV.isString(gValObj) || PV.isNumber(gValObj)) {
                                    vals.push(gValObj + '');
                                } else {
                                    vals.push('null');
                                }
                            }
                        }
                        if (PV.isArray(fields)) {
                            for (var f = 0; f < fields.length; f++) {
                                var fValObj = tblData[row][fields[f]];
                                if (PV.isObject(fValObj) && PV.isString(fValObj.text)) {
                                    var fValue = parseFloat(fValObj.text);
                                    if (isNaN(fValue)) {
                                        vals.push('null');
                                    } else {
                                        vals.push(fValue);
                                    }
                                } else if (PV.isString(fValObj)) {
                                    var fValue2 = parseFloat(fValObj);
                                    if (isNaN(fValue2)) {
                                        vals.push('null');
                                    } else {
                                        vals.push(fValue2);
                                    }
                                } else if (PV.isNumber(fValObj)) {
                                    vals.push(fValObj);
                                } else {
                                    vals.push('null');
                                }
                            }
                        }
                        promises.push(stmt.runAsync(vals));
                    }
                    return prom.all(promises);
                }).then(function() {
                    resolve(stmt.finalizeAsync());
                });
            } else {
                resolve(false);
            }
        }.bind(this));
    }
};