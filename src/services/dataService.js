/**
 * Service de gestion des données JSON
 * Fournit des opérations atomiques de lecture/écriture pour tous les fichiers de données
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');

// Lock simple pour éviter les conflits d'écriture
const locks = new Map();

/**
 * Acquiert un lock sur un fichier
 */
async function acquireLock(filename) {
  while (locks.get(filename)) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  locks.set(filename, true);
}

/**
 * Libère un lock sur un fichier
 */
function releaseLock(filename) {
  locks.delete(filename);
}

/**
 * Lit un fichier JSON de manière atomique
 */
export async function readData(filename) {
  const filepath = path.join(DATA_DIR, filename);
  
  try {
    await acquireLock(filename);
    
    // Créer le fichier s'il n'existe pas
    await fs.ensureFile(filepath);
    
    const content = await fs.readFile(filepath, 'utf8');
    
    if (!content || content.trim() === '') {
      // Fichier vide, retourner structure par défaut
      const defaultData = filename.endsWith('.json') 
        ? (filename.includes('logs') || filename.includes('queue') ? [] : {})
        : {};
      return defaultData;
    }
    
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Fichier n'existe pas encore
      return filename.includes('logs') || filename.includes('queue') ? [] : {};
    }
    throw error;
  } finally {
    releaseLock(filename);
  }
}

/**
 * Écrit des données dans un fichier JSON de manière atomique
 */
export async function writeData(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  const tmpFilepath = `${filepath}.tmp`;
  
  try {
    await acquireLock(filename);
    
    // Écrire dans un fichier temporaire
    await fs.ensureFile(tmpFilepath);
    await fs.writeFile(tmpFilepath, JSON.stringify(data, null, 2), 'utf8');
    
    // Renommer atomiquement
    await fs.rename(tmpFilepath, filepath);
  } catch (error) {
    // Nettoyer le fichier temporaire en cas d'erreur
    try {
      await fs.remove(tmpFilepath);
    } catch {}
    throw error;
  } finally {
    releaseLock(filename);
  }
}

/**
 * Met à jour une partie des données (read-modify-write atomique)
 */
export async function updateData(filename, updateFn) {
  try {
    await acquireLock(filename);
    
    const data = await readData(filename);
    const updatedData = await updateFn(data);
    await writeData(filename, updatedData);
    
    return updatedData;
  } finally {
    releaseLock(filename);
  }
}

/**
 * Ajoute une entrée à un fichier de logs (array)
 */
export async function addLog(filename, entry) {
  return updateData(filename, (logs) => {
    if (!Array.isArray(logs)) logs = [];
    logs.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    return logs;
  });
}

/**
 * Lit la configuration
 */
export async function getConfig() {
  return readData('config.json');
}

/**
 * Met à jour la configuration
 */
export async function updateConfig(updates) {
  return updateData('config.json', (config) => ({
    ...config,
    ...updates
  }));
}

/**
 * Écrit un fichier de transcript
 */
export async function writeTranscript(ticketId, content, format = 'txt') {
  const filename = `${ticketId}.${format}`;
  const filepath = path.join(DATA_DIR, 'transcripts', filename);
  
  await fs.ensureFile(filepath);
  
  if (format === 'json') {
    await fs.writeFile(filepath, JSON.stringify(content, null, 2), 'utf8');
  } else {
    await fs.writeFile(filepath, content, 'utf8');
  }
  
  return filepath;
}

export default {
  readData,
  writeData,
  updateData,
  addLog,
  getConfig,
  updateConfig,
  writeTranscript
};
