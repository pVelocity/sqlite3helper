/*global*/
'use strict';

/* jshint strict: true */
/* jshint node: true */
/* jshint unused: false */
var sqlite3 = require('sqlite3');
var isVerbose = false;

module.exports = {
    get: function() {
        return sqlite3;
    },

    setVerbose: function(verbose) {
        if (isVerbose !== verbose) {
            isVerbose = verbose;
            if (verbose) {
                sqlite3 = require('sqlite3').verbose();
            } else {
                sqlite3 = require('sqlite3');
            }
        }
    }
};