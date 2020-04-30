/*global PV */
'use strict';

/* jshint strict: true */
/* jshint node: true */
/* jshint unused: false */
require('pvjs');
let sqlite3 = require('sqlite3');
let util = require('util');
let columnMappings = {};
let db = null;
let isVerbose = false;

module.exports = {
  setVerbose: function(verbose) {
    if (isVerbose !== verbose) {
      isVerbose = verbose;
      if (verbose) {
        sqlite3 = require('sqlite3').verbose();
      } else {
        sqlite3 = require('sqlite3');
      }
    }
  },

  getDatabase: function() {
    if (PV.isDatabase(db) === false || db.open === false) {
      db = new sqlite3.Database(':memory:');
      db.closeAsync = util.promisify(db.close);
      db.runAsync = util.promisify(db.run);
      db.prepareAsync = util.promisify(db.prepare);
      db.allAsync = util.promisify(db.all);
      db.eachAsync = util.promisify(db.each);
    }
    return db;
  },

  closeDatabase: async function() {
    if (PV.isDatabase(db) && db.open === true) {
      return db.closeAsync().then(function() {
        db = null;
        return;
      });
    } else {
      db = null;
      return;
    }
  },

  getCombination: function(arr) {
    let result = [];
    let f = function(prefix, arr) {
      for (let i = 0; i < arr.length; i++) {
        let c = prefix.concat([arr[i]]);
        result.push(c);
        f(c, arr.slice(i + 1));
      }
    }
    f([], arr);
    return result;
  },

  getColumnMappings: function(tblName) {
    if (PV.isObject(columnMappings) && PV.isObject(columnMappings[tblName])) {
      return columnMappings[tblName];
    }
    return {};
  },

  setColumnMappings: function(tblName, groups, fields) {
    if (PV.isString(tblName)) {
      let cols = [];
      if (PV.isArray(groups)) {
        cols = groups;
      }
      if (PV.isArray(fields)) {
        cols = cols.concat(fields);
      }
      if (cols.length > 0) {
        let mapping = {};
        for (let i = 0; i < cols.length; i++) {
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
    let colMapping = this.getColumnMappings(tblName);
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

    let arrStmt = [];
    if (PV.isArray(groups)) {
      for (let i = 0; i < groups.length; i++) {
        arrStmt.push(this.normalizeColName(tblName, groups[i]) + ' TEXT');
      }
    }
    if (PV.isArray(fields)) {
      for (let j = 0; j < fields.length; j++) {
        arrStmt.push(this.normalizeColName(tblName, fields[j]) + ' NUMERIC');
      }
    }
    let createStmt = 'CREATE TABLE ' + tblName + '(' + arrStmt.join(',') + ')';
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

    let stmt = null;
    let cols = [];
    if (PV.isArray(groups)) {
      cols = groups;
    }
    if (PV.isArray(fields)) {
      cols = cols.concat(fields);
    }

    return db.runAsync('DROP TABLE IF EXISTS ' + tblName).then(function() {
      return this.createTable(tblName, groups, fields);
    }.bind(this)).then(function() {
      let preCol = [];
      for (let i = 0; i < cols.length; i++) {
        preCol.push('?');
      }
      let insertStmt = 'INSERT INTO ' + tblName + ' VALUES (' + preCol.join(',') + ')';
      return db.prepare(insertStmt);
    }.bind(this)).then(function(result) {

      stmt.runAsync = util.promisify(stmt.run);
      stmt.finalizeAsync = util.promisify(stmt.finalize);

      let promises = [];
      for (let row = 0; row < tblData.length; row++) {
        let vals = [];
        if (PV.isArray(groups)) {
          for (let g = 0; g < groups.length; g++) {
            let gValObj = tblData[row][groups[g]];
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
          for (let f = 0; f < fields.length; f++) {
            let fValObj = tblData[row][fields[f]];
            if (PV.isObject(fValObj) && PV.isString(fValObj.text)) {
              let fValue = parseFloat(fValObj.text);
              if (isNaN(fValue)) {
                vals.push(defaultFieldValue);
              } else {
                vals.push(fValue);
              }
            } else if (PV.isString(fValObj)) {
              let fValue2 = parseFloat(fValObj);
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
      return Promise.all(promises);
    }).then(function() {
      return stmt.finalizeAsync();
    });
  },

  buildColumnStatements: function(tblName, groups, fields, prefix, suffix, leftOrRight, aliasTblName) {
    let selCols = '';
    let cols = [];
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
      let colStr = [];
      for (let i = 0; i < cols.length; i++) {
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
    let arr = [];
    if (PV.isArray(existingGroupsOrFields)) {
      arr = existingGroupsOrFields.slice();
      if (PV.isArray(groupsOrFields)) {
        for (let i = 0; i < groupsOrFields.length; i++) {
          let index = arr.indexOf(groupsOrFields[i]);
          if (index > -1) {
            arr[index] = arr[index] + '_1';
            arr.push(groupsOrFields[i] + '_2');
          } else {
            arr.push(groupsOrFields[i]);
          }
        }
      }
    }
    return arr;
  },

  joinEngineResults: function(joinInfo, removeGroupNull, removeFieldNull) {
    this.getDatabase();
    let tblName = joinInfo.tblName;
    let groups = this.getJoinGroupsOrFields(joinInfo.left.groups, joinInfo.right.groups);
    let fields = this.getJoinGroupsOrFields(joinInfo.left.fields, joinInfo.right.fields);

    let summaryTblName = joinInfo.summaryTblName;
    let summaryGroups = this.getJoinGroupsOrFields(joinInfo.left.summaryGroups, joinInfo.right.summaryGroups);
    let isSummary = PV.isString(summaryTblName) && summaryGroups.length > 0;
    return db.runAsync('DROP TABLE IF EXISTS ' + tblName).then(function() {
      return this.createTable(tblName, groups, fields);
    }.bind(this)).then(function() {
      let selCols = [];

      let aGroupPrefix = 'IFNULL(A.';
      let bGroupPrefix = 'IFNULL(B.';
      let aGroupSuffix = ', \'- N/A -\')';
      let bGroupSuffix = ', \'- N/A -\')';
      if (removeGroupNull === true) {
        aGroupPrefix = 'A.';
        bGroupPrefix = 'B.';
        aGroupSuffix = '';
        bGroupSuffix = '';
      }

      let aFieldPrefix = 'IFNULL(A.';
      let bFieldPrefix = 'IFNULL(B.';
      let aFieldSuffix = ', 0)';
      let bFieldSuffix = ', 0)';
      if (removeFieldNull === true) {
        aFieldPrefix = 'A.';
        bFieldPrefix = 'B.';
        aFieldSuffix = '';
        bFieldSuffix = '';
      }

      let leftGroupColSelect = this.buildColumnStatements(joinInfo.left.tblName, joinInfo.left.groups, null, aGroupPrefix, aGroupSuffix, 'left', tblName);
      let leftFieldColSelect = this.buildColumnStatements(joinInfo.left.tblName, null, joinInfo.left.fields, aFieldPrefix, aFieldSuffix, 'left', tblName);

      let rightGroupColSelect = this.buildColumnStatements(joinInfo.right.tblName, joinInfo.right.groups, null, bGroupPrefix, bGroupSuffix, 'right', tblName);
      let rightFieldColSelect = this.buildColumnStatements(joinInfo.right.tblName, null, joinInfo.right.fields, bFieldPrefix, bFieldSuffix, 'right', tblName);

      if (leftGroupColSelect !== '') { selCols.push(leftGroupColSelect); }
      if (leftFieldColSelect !== '') { selCols.push(leftFieldColSelect); }
      if (rightGroupColSelect !== '') { selCols.push(rightGroupColSelect); }
      if (rightFieldColSelect !== '') { selCols.push(rightFieldColSelect); }

      let onStmt = [];
      let whereStmt = [];
      for (let leftOn in joinInfo.on) {
        let rightOn = joinInfo.on[leftOn];

        onStmt.push('A.' + this.normalizeColName(joinInfo.left.tblName, leftOn) + '= B.' + this.normalizeColName(joinInfo.right.tblName, rightOn));
        whereStmt.push('A.' + this.normalizeColName(joinInfo.left.tblName, leftOn) + ' IS NULL');
      }

      let leftColInsert = this.buildColumnStatements(tblName, joinInfo.left.groups, joinInfo.left.fields, '[', ']', 'left');
      let rightColInsert = this.buildColumnStatements(tblName, joinInfo.right.groups, joinInfo.right.fields, '[', ']', 'right');

      let insertStmt = 'INSERT INTO ' + tblName + ' (' + leftColInsert + ', ' + rightColInsert + ')';

      if (joinInfo.type === 'FULL JOIN') {
        let leftStmt = 'SELECT ' + selCols.join(', ') +
          ' FROM ' + joinInfo.left.tblName + ' AS A' +
          ' LEFT JOIN ' + joinInfo.right.tblName + ' AS B' +
          ' ON ' + onStmt.join(' AND ');
        let rightStmt = 'SELECT ' + selCols.join(', ') +
          ' FROM ' + joinInfo.right.tblName + ' AS B' +
          ' LEFT JOIN ' + joinInfo.left.tblName + ' AS A' +
          ' ON ' + onStmt.join(' AND ') +
          ' WHERE ' + whereStmt.join(' AND ');
        let unionStmt = leftStmt + ' UNION ALL ' + rightStmt;

        return db.runAsync(insertStmt + ' ' + unionStmt);
      } else {
        let selectStmt = 'SELECT ' + selCols.join(', ') +
          ' FROM ' + joinInfo.left.tblName + ' AS A ' +
          joinInfo.type + ' ' + joinInfo.right.tblName + ' AS B ' +
          ' ON ' + onStmt.join(' AND ');

        return db.runAsync(insertStmt + ' ' + selectStmt);
      }
    }.bind(this)).then(function() {
      if (isSummary === true) {
        return this.createSummaryEngineResults(summaryTblName, tblName, summaryGroups, fields);
      } else {
        return;
      }
    }.bind(this)).then(function() {
      if (isSummary === true) {
        return {
          tblName: summaryTblName,
          groups: summaryGroups,
          fields: fields
        };
      } else {
        return {
          tblName: tblName,
          groups: groups,
          fields: fields
        };
      }
    });
  },

  createSummaryEngineResults: function(summaryTblName, tblName, groups, fields) {
    return db.runAsync('DROP TABLE IF EXISTS ' + summaryTblName).then(function() {
      return this.createTable(summaryTblName, groups, fields);
    }.bind(this)).then(function() {
      let fieldCols = [];
      fields.forEach(function(field) {
        fieldCols.push('SUM(' + this.normalizeColName(tblName, field) + ') AS [' + field + ']');
      }.bind(this));
      let fieldStmt = fieldCols.join(', ');

      let summaryStmts = [];
      let groupCombinations = this.getCombination(groups);
      groupCombinations.forEach(function(groupCombo) {
        let groupComboCols = [];
        groups.forEach(function(group) {
          if (groupCombo.indexOf(group) > -1) {
            groupComboCols.push(this.normalizeColName(tblName, group) + ' AS [' + group + ']');
          } else {
            groupComboCols.push('NULL AS ' + group);
          }
        }.bind(this));

        summaryStmts.push('SELECT ' + groupComboCols.join(', ') + ', ' + fieldStmt + ' FROM ' + tblName + ' GROUP BY ' + groupCombo.join(', '));
      }.bind(this));
      let unionStmt = summaryStmts.join(' UNION ');

      let colInsert = this.buildColumnStatements(summaryTblName, groups, fields);
      let insertStmt = 'INSERT INTO ' + summaryTblName + ' (' + colInsert + ')';

      return db.runAsync(insertStmt + ' ' + unionStmt);
    }.bind(this));
  },

  getEngineResults: function(tblName) {
    let mappings = this.getColumnMappings(tblName);
    let groups = mappings.groups;
    let fields = mappings.fields;

    let cols = [];
    if (PV.isArray(groups)) {
      cols = groups;
    }
    if (PV.isArray(fields)) {
      cols = cols.concat(fields);
    }
    let selCols = '*';
    if (cols.length > 0) {
      let colStr = [];
      for (let i = 0; i < cols.length; i++) {
        colStr.push('CAST(' + this.normalizeColName(tblName, cols[i]) + ' AS TEXT) AS [' + cols[i] + ']');
      }
      selCols = colStr.join(',');
    }
    if (PV.isString(fields)) {
      selCols += ',' + fields;
    }
    let selectStmt = 'SELECT ' + selCols + ' FROM ' + tblName;

    return db.allAsync(selectStmt);
  },

  forEachEngineResults: function(tblName, callback) {
    let mappings = this.getColumnMappings(tblName);
    let groups = mappings.groups;
    let fields = mappings.fields;

    let cols = [];
    if (PV.isArray(groups)) {
      cols = groups;
    }
    if (PV.isArray(fields)) {
      cols = cols.concat(fields);
    }
    let selCols = '*';
    if (cols.length > 0) {
      let colStr = [];
      for (let i = 0; i < cols.length; i++) {
        colStr.push('CAST(' + this.normalizeColName(tblName, cols[i]) + ' AS TEXT) AS [' + cols[i] + ']');
      }
      selCols = colStr.join(',');
    }
    if (PV.isString(fields)) {
      selCols += ',' + fields;
    }
    let selectStmt = 'SELECT ' + selCols + ' FROM ' + tblName;

    return db.eachAsync(selectStmt, callback);
  }
};