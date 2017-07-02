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

const fs                                    = require('fs');
const path                                  = require('path');
const readDataTypesMap                      = require('./DataTypesMapReader');
const Conversion                            = require('./Classes/Conversion');
const createSchema                          = require('./SchemaProcessor');
const loadStructureToMigrate                = require('./StructureLoader');
const pipeData                              = require('./DataPipeManager');
const boot                                  = require('./BootProcessor');
const { createStateLogsTable }              = require('./MigrationStateManager');
const { createDataPoolTable, readDataPool } = require('./DataPoolManager');
const log                                   = require('./Logger');

/**
 * Read the configuration file.
 *
 * @returns {Promise}
 */
const readConfig = () => {
    return new Promise(resolve => {
        const strPathToConfig = path.join(__dirname, '..', 'config.json');

        fs.readFile(strPathToConfig, (error, data) => {
            if (error) {
                console.log('\n\t--Cannot run migration\nCannot read configuration info from ' + strPathToConfig);
                process.exit();
            }

            const config            = JSON.parse(data);
            config.tempDirPath      = path.join(__dirname, '..', 'temporary_directory');
            config.logsDirPath      = path.join(__dirname, '..', 'logs_directory');
            config.dataTypesMapAddr = path.join(__dirname, '..', 'data_types_map.json');
            resolve(config);
        });
    });
};

/**
 * Read the extra configuration file, if necessary.
 *
 * @param {Object} config
 *
 * @returns {Promise}
 */
const readExtraConfig = config => {
    return new Promise(resolve => {
        if (config.enable_extra_config !== true) {
            config.extraConfig = null;
            return resolve(config);
        }

        const strPathToExtraConfig = path.join(__dirname, '..', 'extra_config.json');

        fs.readFile(strPathToExtraConfig, (error, data) => {
            if (error) {
                console.log('\n\t--Cannot run migration\nCannot read configuration info from ' + strPathToExtraConfig);
                process.exit();
            }

            config.extraConfig = JSON.parse(data);
            resolve(config);
        });
    });
};

/**
 * Initialize Conversion instance.
 *
 * @param {Object} config
 *
 * @returns {Promise}
 */
const initializeConversion = config => {
    return Promise.resolve(new Conversion(config));
};

/**
 * Creates logs directory.
 *
 * @param {Conversion} self
 *
 * @returns {Promise}
 */
const createLogsDirectory = self => {
    return new Promise(resolve => {
        console.log('\t--[DirectoriesManager.createLogsDirectory] Creating logs directory...');
        fs.stat(self._logsDirPath, (directoryDoesNotExist, stat) => {
            if (directoryDoesNotExist) {
                fs.mkdir(self._logsDirPath, self._0777, e => {
                    if (e) {
                        const msg = '\t--[DirectoriesManager.createLogsDirectory] Cannot perform a migration due to impossibility to create '
                            + '"logs_directory": ' + self._logsDirPath;

                        console.log(msg);
                        process.exit();
                    } else {
                        log(self, '\t--[DirectoriesManager.createLogsDirectory] Logs directory is created...');
                        resolve(self);
                    }
                });
            } else if (!stat.isDirectory()) {
                console.log('\t--[DirectoriesManager.createLogsDirectory] Cannot perform a migration due to unexpected error');
                process.exit();
            } else {
                log(self, '\t--[DirectoriesManager.createLogsDirectory] Logs directory already exists...');
                resolve(self);
            }
        });
    });
};

readConfig()
    .then(readExtraConfig)
    .then(initializeConversion)
    .then(boot)
    .then(readDataTypesMap)
    .then(createLogsDirectory)
    .then(createSchema)
    .then(createStateLogsTable)
    .then(createDataPoolTable)
    .then(loadStructureToMigrate)
    .then(readDataPool)
    .then(pipeData)
    .catch(error => console.log(error));
