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
    // value = value.replace(/(?:\\[rn]|[\r\n]+)+/g, "");

    return value
        .toString()
        //.replace(/\b/gi, '\\b') //  error: invalid input syntax for integer: ////////
        .replace(/\f/gi, '\\f')  // error: missing data for column "readed" ///////
        .replace(/\v/gi, '\\v')  //  error: literal carriage return found in data ////////
        .replace(/\n/gi, '\\n')
        .replace(/\r/gi, '\\r')
        .replace(/\t/gi, '\\t')
        .replace(/\r\n/gi, '\\r\\n')
        .replace(/\\/gi, '\\\\');
};

/**
 * Check if given column's value should be escaped.
 *
 * @param {String} type
 *
 * @returns {Boolean}
 */
const shouldBeEscaped = type => {
    return type.indexOf('char') !== -1
        || type.indexOf('text') !== -1
        || type.indexOf('blob') !== -1
        || type.indexOf('binary') !== -1
        || type.indexOf('enum') !== -1
        || type.indexOf('geometry') !== -1
        || type.indexOf('point') !== -1
        || type.indexOf('linestring') !== -1
        || type.indexOf('polygon') !== -1
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
        if (record[column] === undefined || record[column] === null) {
            retVal += 'null\t';
        } else if (shouldBeEscaped(columnTypeArray[cnt])) {
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
    let formattedString      = '';
    const inputRecordsLength = inputRecords.length;
    const columnTypeArray    = columnTypeList.split(',');

    for (let i = 0; i < inputRecordsLength; ++i) {
        formattedString += processRecord(inputRecords[i], columnTypeArray) + '\n';
    }

    callback(null, formattedString.slice(0, -1));
};
