// Monitor

"use strict";

import Cluster from "cluster";
import { formatDate } from "./utils/time-utils";
import { LogsConfig } from "./config/config-logs";
import winston from 'winston';
import { ElasticsearchTransport } from "winston-elasticsearch";
import { Config } from "./config/config";

/**
 * Log level
 */
export type MonitorLogLevel = "info" | "warn" | "error" | "debug" | "trace";

/**
 * Monitor log metadata
 */
export type MonitorLogMetadata = any;


/**
 * Monitor. Logs messages.
 */
export class Monitor {
    private static consoleLogger: winston.Logger;
    private static elasticLogger: winston.Logger;

    /**
     * Gets logger instance for Console
     * @returns The logger, or null if disabled
     */
    private static getConsoleLogger(): winston.Logger {
        if (Monitor.consoleLogger) {
            return Monitor.consoleLogger;
        }

        const customFormat = winston.format.printf(({ message, meta }) => {
            if (Cluster.isMaster || Cluster.isPrimary) {
                return `[${formatDate(Date.now())}] ${message} ${meta ? JSON.stringify(meta) : ''}`;
            } else {
                return `[${formatDate(Date.now())}] [Worker ${Cluster.worker ? Cluster.worker.id : '-'}] ${message} ${meta ? JSON.stringify(meta) : ''}`;
            }
        });

        Monitor.consoleLogger = winston.createLogger({
            level: 'debug',
            format: customFormat,
            transports: [
                new winston.transports.Console({
                    level: "debug",
                }),
            ],
        });

        Monitor.consoleLogger.on("error", () => {
            return; // Ignore errors
        });

        return Monitor.consoleLogger;
    }

    /**
     * Gets logger instance for Elastic Search
     * @returns The logger, or null if disabled
     */
    private static getElasticSearchLogger(): winston.Logger | null {
        if (Monitor.elasticLogger) {
            return Monitor.elasticLogger;
        }

        if (!LogsConfig.getInstance().elasticSearchEnabled) {
            return null;
        }

        const elasticSearchTransport = new ElasticsearchTransport({
            level: 'debug',
            clientOpts: {
                node: LogsConfig.getInstance().elasticNode,
                auth: {
                    username: LogsConfig.getInstance().elasticUser,
                    password: LogsConfig.getInstance().elasticPassword
                },
                tls: {
                    rejectUnauthorized: false,
                },
            },
            indexPrefix: LogsConfig.getInstance().elasticIndexPrefix, // Prefix for name index
            indexSuffixPattern: 'YYYY-MM-DD', // Pattern for index
            transformer: (logData) => {
                return {
                    ...logData.meta,
                    '@timestamp': (new Date()).toISOString(),
                    message: logData.message,
                    severity: logData.level,
                    appName: Config.getInstance().appName,
                    appVersion: Config.getInstance().appVersion,
                    process: (Cluster.isWorker ? `worker-${Cluster.worker ? Cluster.worker.id : 'unknown'}` : "master") + "-" + process.pid,
                };
            }
        });

        elasticSearchTransport.on("error", () => {
            return; // Ignore errors
        });

        const customFormat = winston.format.printf(({ level, message, meta }) => {
            return JSON.stringify({
                ...((meta || {}) as any),
                '@timestamp': (new Date()).toISOString(),
                message,
                level,
                appName: Config.getInstance().appName,
                appVersion: Config.getInstance().appVersion,
                process: (Cluster.isWorker ? `worker-${Cluster.worker ? Cluster.worker.id : 'unknown'}` : "master") + "-" + process.pid,
            });
        });

        const transports: winston.transport[] = [
            elasticSearchTransport
        ];

        Monitor.elasticLogger = winston.createLogger({
            level: 'debug',
            format: customFormat,
            transports: transports,
        });

        Monitor.elasticLogger.on("error", () => {
            return; // Ignore errors
        });

        return Monitor.elasticLogger;
    }

    /**
     * Logs a message.
     * @param level Log level
     * @param msg The message to log.
     * @param metadata The log metadata
     */
    public static log(level: MonitorLogLevel, msg: string, metadata?: MonitorLogMetadata) {
        const loggers = [
            Monitor.getElasticSearchLogger(),
            Monitor.getConsoleLogger(),
        ];

        for (const logger of loggers) {
            if (!logger) {
                continue;
            }

            switch (level) {
                case "error":
                    logger.error(msg, metadata);
                    break;
                case "warn":
                    logger.warn(msg, metadata);
                    break;
                case "debug":
                case "trace":
                    logger.debug(msg, metadata);
                    break;
                default:
                    logger.info(msg, metadata);
            }
        }
    }

    /**
     * Logs an information message.
     * @param msg The message to log.
     * @param metadata The log metadata
     */
    public static status(msg: string, metadata?: MonitorLogMetadata) {
        Monitor.log('info', `[STATUS] ${msg}`, metadata);
    }

    /**
     * Logs an information message.
     * @param msg The message to log.
     * @param metadata The log metadata
     */
    public static info(msg: string, metadata?: MonitorLogMetadata) {
        if (!LogsConfig.getInstance().logInfo) {
            return;
        }
        Monitor.log('info', `[INFO] ${msg}`, metadata);
    }

    /**
     * Logs a debug message.
     * @param msg The message to log.
     * @param metadata The log metadata
     */
    public static debug(msg: string, metadata?: MonitorLogMetadata) {
        if (!LogsConfig.getInstance().logDebug) {
            return;
        }
        Monitor.log('debug', `[DEBUG] ${msg}`, metadata);
    }

    /**
     * Logs a trace message.
     * @param msg The message to log.
     * @param metadata The log metadata
     */
    public static trace(msg: string, metadata?: MonitorLogMetadata) {
        if (!LogsConfig.getInstance().logDebug) {
            return;
        }
        Monitor.log('trace', `[TRACE] ${msg}`, metadata);
    }

    /**
     * Logs an error stack trace for debugging purposes.
     * @param err The error to log.
     * @param metadata The log metadata
     */
    public static debugException(err: Error, metadata?: MonitorLogMetadata) {
        if (!LogsConfig.getInstance().logDebug) {
            return;
        }
        Monitor.log('error', `[DEV-ERROR] ${err.stack}`, metadata);
    }

    /**
     * Logs a warning message.
     * @param msg The message to log.
     * @param metadata The log metadata
     */
    public static warning(msg: string, metadata?: MonitorLogMetadata) {
        Monitor.log('warn', `[WARNING] ${msg}`, metadata);
    }

    /**
     * Logs an error message.
     * @param msg The message to log.
     * @param metadata The log metadata
     */
    public static error(msg: string, metadata?: MonitorLogMetadata) {
        Monitor.log('error', `[ERROR] ${msg}`, metadata);
    }

    /**
     * Logs an error stack trace.
     * @param err The error to log.
     * @param metadata The log metadata
     */
    public static exception(err: Error, metadata?: MonitorLogMetadata) {
        Monitor.log('error', `[ERROR] ${err.stack}`, metadata);
    }
}
