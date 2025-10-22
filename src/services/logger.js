/**
 * Service de logging centralisé
 * Utilise Winston pour gérer les logs du bot
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '../../logs');

// Configuration des formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`;
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Logger principal
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [
    // Console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // Fichier général
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'bot.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Fichier erreurs
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Logger spécifique pour Mistral
export const mistralLogger = winston.createLogger({
  level: 'debug',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'mistral.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ]
});

// Logger spécifique pour la modération
export const moderationLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'moderation.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ]
});

export default logger;
