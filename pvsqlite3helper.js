/*global PV */
'use strict';

/* jshint strict: true */
/* jshint node: true */
/* jshint unused: false */
require('pvjs');
var sqlite3 = require('./sqlite3package/sqlite3package.js');
var prom = require('bluebird');
var columnMappings = {};
var db = null;
var isVerbose = false;

module.exports = {
    setVerbose: function(verbose) {
        if (isVerbose !== verbose) {
            isVerbose = verbose;
            sqlite3.setVerbose(verbose);
        }
    },

    getDatabase: function() {
        if (PV.isDatabase(db) === false || db.open === false) {
            db = prom.promisifyAll(new (sqlite3.get()).Database(':memory:'));
        }
        return db;
    },

    closeDatabase: function() {
        return new prom(function(resolve, reject) {
            if (PV.isDatabase(db) && db.open === true) {
                return db.closeAsync().then(function() {
                    db = null;
                    resolve();
                });
            } else {
                db = null;
                resolve();
            }
        });
    },

    getColumnMappings: function(tblName) {
        if (PV.isObject(columnMappings) && PV.isObject(columnMappings[tblName])) {
            return columnMappings[tblName];
        }
        return {};
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
                columnMappings[tblName] = {};
                columnMappings[tblName].mappings = mapping;
                columnMappings[tblName].groups = groups;
                columnMappings[tblName].fields = fields;
            }
        }
    },

    normalizeColName: function(tblName, groupOrField, leftOrRight) {
        var colMapping = this.getColumnMappings(tblName);
        if (PV.isObject(colMapping.mappings)) {
            if (PV.isString(colMapping.mappings[groupOrField])) {
                return colMapping.mappings[groupOrField];
            } else if (leftOrRight === 'left' && PV.isString(colMapping.mappings[groupOrField + '_1'])) {
                return colMapping.mappings[groupOrField + '_1'];
            } else if (leftOrRight === 'right' && PV.isString(colMapping.mappings[groupOrField + '_2'])) {
                return colMapping.mappings[groupOrField + '_2'];
            }
        }
        return groupOrField;
    },

    createTable: function(tblName, groups, fields) {
        this.getDatabase();
        this.setColumnMappings(tblName, groups, fields);

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
        return db.runAsync(createStmt);
    },

    insertEngineResults: function(tblName, tblData, groups, fields, defaultGroupValue, defaultFieldValue) {
        this.getDatabase();
        if (PV.isUndefined(defaultGroupValue)) {
            defaultGroupValue = '- N/A -';
        }

        if (PV.isUndefined(defaultFieldValue)) {
            defaultFieldValue = 0;
        }

        var stmt = null;
        var cols = [];
        if (PV.isArray(groups)) {
            cols = groups;
        }
        if (PV.isArray(fields)) {
            cols = cols.concat(fields);
        }

        return db.runAsync('DROP TABLE IF EXISTS ' + tblName).then(function() {
            return this.createTable(tblName, groups, fields);
        }.bind(this)).then(function() {
            var preCol = [];
            for (var i = 0; i < cols.length; i++) {
                preCol.push('?');
            }
            var insertStmt = 'INSERT INTO ' + tblName + ' VALUES (' + preCol.join(',') + ')';
            return db.prepare(insertStmt);
        }.bind(this)).then(function(result) {
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
                            vals.push(defaultGroupValue);
                        }
                    }
                }
                if (PV.isArray(fields)) {
                    for (var f = 0; f < fields.length; f++) {
                        var fValObj = tblData[row][fields[f]];
                        if (PV.isObject(fValObj) && PV.isString(fValObj.text)) {
                            var fValue = parseFloat(fValObj.text);
                            if (isNaN(fValue)) {
                                vals.push(defaultFieldValue);
                            } else {
                                vals.push(fValue);
                            }
                        } else if (PV.isString(fValObj)) {
                            var fValue2 = parseFloat(fValObj);
                            if (isNaN(fValue2)) {
                                vals.push(defaultFieldValue);
                            } else {
                                vals.push(fValue2);
                            }
                        } else if (PV.isNumber(fValObj)) {
                            vals.push(fValObj);
                        } else {
                            vals.push(defaultFieldValue);
                        }
                    }
                }
                promises.push(stmt.runAsync(vals));
            }
            return prom.all(promises);
        }).then(function() {
            return stmt.finalizeAsync();
        });
    },

    buildColumnStatements: function(tblName, groups, fields, prefix, suffix, leftOrRight, aliasTblName) {
        var selCols = '';
        var cols = [];
        if (PV.isArray(groups)) {
            cols = groups;
        }
        if (PV.isArray(fields)) {
            cols = cols.concat(fields);
        }
        if (PV.isString(prefix) === false) {
            prefix = '';
        }
        if (PV.isString(suffix) === false) {
            suffix = '';
        }
        if (cols.length > 0) {
            var colStr = [];
            for (var i = 0; i < cols.length; i++) {
                if (PV.isString(aliasTblName)) {
                    colStr.push(prefix + this.normalizeColName(tblName, cols[i]) + suffix + ' AS [' + this.normalizeColName(aliasTblName, cols[i], leftOrRight) + ']');
                } else {
                    colStr.push(prefix + this.normalizeColName(tblName, cols[i], leftOrRight) + suffix);
                }
            }
            selCols = colStr.join(', ');
        }
        return selCols;
    },

    getJoinGroupsOrFields: function(existingGroupsOrFields, groupsOrFields) {
        var arr = existingGroupsOrFields.slice();
        for (var i = 0; i < groupsOrFields.length; i++) {
            var index = arr.indexOf(groupsOrFields[i]);
            if (index > -1) {
                arr[index] = arr[index] + '_1';
                arr.push(groupsOrFields[i] + '_2');
            } else {
                arr.push(groupsOrFields[i]);
            }
        }
        return arr;
    },

    joinEngineResults: function(tblName, joinInfo, removeGroupNull, removeFieldNull) {
        this.getDatabase();
        var groups = this.getJoinGroupsOrFields(joinInfo.left.groups, joinInfo.right.groups);
        var fields = this.getJoinGroupsOrFields(joinInfo.left.fields, joinInfo.right.fields);
        return db.runAsync('DROP TABLE IF EXISTS ' + tblName).then(function() {
            return this.createTable(tblName, groups, fields);
        }.bind(this)).then(function() {
            var selCols = [];

            var aGroupPrefix = 'IFNULL(A.';
            var bGroupPrefix = 'IFNULL(B.';
            var aGroupSuffix = ', \'- N/A -\')';
            var bGroupSuffix = ', \'- N/A -\')';
            if (removeGroupNull === true) {
                aGroupPrefix = 'A.';
                bGroupPrefix = 'B.';
                aGroupSuffix = '';
                bGroupSuffix = '';
            }

            var aFieldPrefix = 'IFNULL(A.';
            var bFieldPrefix = 'IFNULL(B.';
            var aFieldSuffix = ', 0)';
            var bFieldSuffix = ', 0)';
            if (removeFieldNull === true) {
                aFieldPrefix = 'A.';
                bFieldPrefix = 'B.';
                aFieldSuffix = '';
                bFieldSuffix = '';
            }

            var leftGroupColSelect = this.buildColumnStatements(joinInfo.left.tblName, joinInfo.left.groups, null, aGroupPrefix, aGroupSuffix, 'left', tblName);
            var leftFieldColSelect = this.buildColumnStatements(joinInfo.left.tblName, null, joinInfo.left.fields, aFieldPrefix, aFieldSuffix, 'left', tblName);

            var rightGroupColSelect = this.buildColumnStatements(joinInfo.right.tblName, joinInfo.right.groups, null, bGroupPrefix, bGroupSuffix, 'right', tblName);
            var rightFieldColSelect = this.buildColumnStatements(joinInfo.right.tblName, null, joinInfo.right.fields, bFieldPrefix, bFieldSuffix, 'right', tblName);

            if (leftGroupColSelect !== '') { selCols.push(leftGroupColSelect); }
            if (leftFieldColSelect !== '') { selCols.push(leftFieldColSelect); }
            if (rightGroupColSelect !== '') { selCols.push(rightGroupColSelect); }
            if (rightFieldColSelect !== '') { selCols.push(rightFieldColSelect); }

            var onStmt = [];
            var whereStmt = [];
            for (var leftOn in joinInfo.on) {
                var rightOn = joinInfo.on[leftOn];

                onStmt.push('A.' + this.normalizeColName(joinInfo.left.tblName, leftOn) + '= B.' + this.normalizeColName(joinInfo.right.tblName, rightOn));
                whereStmt.push('A.' + this.normalizeColName(joinInfo.left.tblName, leftOn) + ' IS NULL');
            }

            var leftColInsert = this.buildColumnStatements(tblName, joinInfo.left.groups, joinInfo.left.fields, '[', ']', 'left');
            var rightColInsert = this.buildColumnStatements(tblName, joinInfo.right.groups, joinInfo.right.fields, '[', ']', 'right');

            var insertStmt = 'INSERT INTO ' + tblName + ' (' + leftColInsert + ', ' + rightColInsert + ')';

            if (joinInfo.type === 'FULL JOIN') {
                var leftStmt = 'SELECT ' + selCols.join(', ') +
                    ' FROM ' + joinInfo.left.tblName + ' AS A' +
                    ' LEFT JOIN ' + joinInfo.right.tblName + ' AS B' +
                    ' ON ' + onStmt.join(' AND ');
                var rightStmt = 'SELECT ' + selCols.join(', ') +
                    ' FROM ' + joinInfo.right.tblName + ' AS B' +
                    ' LEFT JOIN ' + joinInfo.left.tblName + ' AS A' +
                    ' ON ' + onStmt.join(' AND ') +
                    ' WHERE ' + whereStmt.join(' AND ');
                var unionStmt = leftStmt + ' UNION ALL ' + rightStmt;

                return db.runAsync(insertStmt + ' ' + unionStmt);
            } else {
                var selectStmt = 'SELECT ' + selCols.join(', ') +
                    ' FROM ' + joinInfo.left.tblName + ' AS A ' +
                    joinInfo.type + ' ' + joinInfo.right.tblName + ' AS B ' +
                    ' ON ' + onStmt.join(' AND ');

                return db.runAsync(insertStmt + ' ' + selectStmt);
            }
        }.bind(this)).then(function() {
            return {
                groups: groups,
                fields: fields
            };
        });
    },

    getEngineResults: function(tblName) {
        var mappings = this.getColumnMappings(tblName);
        var groups = mappings.groups;
        var fields = mappings.fields;

        var cols = [];
        if (PV.isArray(groups)) {
            cols = groups;
        }
        if (PV.isArray(fields)) {
            cols = cols.concat(fields);
        }
        var selCols = '*';
        if (cols.length > 0) {
            var colStr = [];
            for (var i = 0; i < cols.length; i++) {
                colStr.push('CAST(' + this.normalizeColName(tblName, cols[i]) + ' AS TEXT) AS [' + cols[i] + ']');
            }
            selCols = colStr.join(',');
        }
        if (PV.isString(fields)) {
            selCols += ',' + fields;
        }
        var selectStmt = 'SELECT ' + selCols + ' FROM ' + tblName;

        return db.allAsync(selectStmt);
    },

    forEachEngineResults: function(tblName, callback) {
        var mappings = this.getColumnMappings(tblName);
        var groups = mappings.groups;
        var fields = mappings.fields;

        var cols = [];
        if (PV.isArray(groups)) {
            cols = groups;
        }
        if (PV.isArray(fields)) {
            cols = cols.concat(fields);
        }
        var selCols = '*';
        if (cols.length > 0) {
            var colStr = [];
            for (var i = 0; i < cols.length; i++) {
                colStr.push('CAST(' + this.normalizeColName(tblName, cols[i]) + ' AS TEXT) AS [' + cols[i] + ']');
            }
            selCols = colStr.join(',');
        }
        if (PV.isString(fields)) {
            selCols += ',' + fields;
        }
        var selectStmt = 'SELECT ' + selCols + ' FROM ' + tblName;

        return db.eachAsync(selectStmt, callback);
    }
};