/*
 * This file is a part of "NMIG" - the database migration tool.
 *
 * Copyright (C) 2016 - present, Anatoly Khaytovich <anatolyuss@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program (please see the "LICENSE.md" file).
 * If not, see <http://www.gnu.org/licenses/gpl.txt>.
 *
 * @author Anatoly Khaytovich <anatolyuss@gmail.com>
 */
'use strict';

/**
 * Escape special characters.
 *
 * @param {String} value
 *
 * @returns {String}
 */
const escapeValue = value => {
    return value
        .toString()
        .replace(/\\/g, '\\\\')
        //.replace(/\b/g, '\\b')
        //.replace(/\f/g, '\\f')
        //.replace(/\v/g, '\\v')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
};

/**
 * Check if given value is null or undefined.
 *
 * @param {String|Null|Undefined} value
 *
 * @returns {Boolean}
 */
const isNull = value => {
    return value === undefined || value === null;
};

/**
 * Check if given value is numeric.
 *
 * @param {String} type
 *
 * @returns {Boolean}
 */
const shouldEscape = type => {
    return type.indexOf('char') !== -1
        || type.indexOf('text') !== -1
        || type.indexOf('blob') !== -1
        || type.indexOf('varbinary') !== -1
        || type.indexOf('enum') !== -1
        || type.indexOf('set') !== -1
        || type.indexOf('json') !== -1;
};

/**
 * Prepare given record to be loaded via PostgreSQL COPY, using text format.
 *
 * @param {Object} record
 * @param {Array} columnTypeArray
 *
 * @returns {String}
 */
const processRecord = (record, columnTypeArray) => {
    let retVal = '';
    let cnt    = 0;

    for (const column in record) {
        if (isNull(record[column])) {
            retVal += 'null\t';
        } else if (shouldEscape(columnTypeArray[cnt])) {
            retVal += escapeValue(record[column]) + '\t';
        } else {
            retVal += record[column] + '\t';
        }

        cnt++;
    }

    return retVal.slice(0, -1);
};

/**
 * Prepare the input to be loaded via PostgreSQL COPY, using text format.
 *
 * @param {Array}    inputRecords
 * @param {String}   columnTypeList
 * @param {Function} callback
 *
 * @returns {undefined}
 */
module.exports = (inputRecords, columnTypeList, callback) => {
    let formattedString   = '';
    const columnTypeArray = columnTypeList.split(',');

    for (let i = 0; i < inputRecords.length; ++i) {
        formattedString += processRecord(inputRecords[i], columnTypeArray) + '\n';
    }

    callback(null, formattedString.slice(0, -1));
};
