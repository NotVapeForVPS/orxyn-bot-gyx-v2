/**
 * Service de modération automatique
 * Analyse locale des messages sans appel API externe
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { addLog } from './dataService.js';
import { moderationLogger as logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.join(__dirname, '../../prompts');

// Quick-block regex patterns
const QUICK_BLOCK_PATTERNS = [
  /discord\.gg\/[\w-]+/i,
  /\.gg\/[\w-]+/i,
  /https?:\/\//i,
  /google\.com/i,
  /bit\.ly/i,
  /tinyurl\.com/i
];

// Keywords pour l'analyse locale (pondération)
const HIGH_RISK_KEYWORDS = [
  // Insultes racistes/discriminatoires graves
  { pattern: /\b(n[i1]gg[ae]r|n[e3]gr[o0])\b/i, weight: 0.9 },
  { pattern: /\b(f[a4]gg[o0]t|p[e3]d[o0])\b/i, weight: 0.9 },
  
  // Menaces de violence
  { pattern: /\b(kill yourself|kys|suicide|die|mort)\b/i, weight: 0.8 },
  { pattern: /\b(bomb|terrorist|attack)\b/i, weight: 0.7 },
];

const MEDIUM_RISK_KEYWORDS = [
  // Insultes graves mais contexte nécessaire
  { pattern: /\b(connard|salope|putain de merde)\b/i, weight: 0.5 },
  { pattern: /\b(fuck you|shit on you)\b/i, weight: 0.5 },
  
  // Spam patterns
  { pattern: /(.)\1{10,}/i, weight: 0.6 }, // Répétition de caractères
  { pattern: /[A-Z\s]{50,}/i, weight: 0.4 }, // Tout en majuscules
];

const LOW_RISK_KEYWORDS = [
  // Gros mots communs (souvent acceptables en contexte)
  { pattern: /\bmerde\b/i, weight: 0.2 },
  { pattern: /\bputain\b/i, weight: 0.2 },
  { pattern: /\bcon\b/i, weight: 0.2 },
  { pattern: /\bfuck\b/i, weight: 0.3 },
  { pattern: /\bshit\b/i, weight: 0.2 },
];

// Facteurs réducteurs (contexte positif)
const REDUCERS = [
  { pattern: /😂|🤣|😅|lol|mdr|xd/i, reduction: 0.3 },
  { pattern: /\?$/, reduction: 0.1 },
  { pattern: /\b(juste|question|demande)\b/i, reduction: 0.1 },
];

/**
 * Quick-block check pour liens et spam évidents
 */
export function quickBlockCheck(content) {
  for (const pattern of QUICK_BLOCK_PATTERNS) {
    if (pattern.test(content)) {
      logger.info('Quick-block déclenché:', { pattern: pattern.toString(), content: content.substring(0, 50) });
      return {
        shouldBlock: true,
        reason: 'Lien interdit ou spam détecté',
        pattern: pattern.toString()
      };
    }
  }
  
  return { shouldBlock: false };
}

/**
 * Analyse locale du message
 * Retourne: { action: 'none'|'delete+mute', reason: string, confidence: number }
 */
export async function localAnalyze(content) {
  try {
    logger.debug('Analyse locale du message:', content.substring(0, 100));
    
    let score = 0;
    const factors = [];
    
    // 1. Vérifier les keywords à haut risque
    for (const { pattern, weight } of HIGH_RISK_KEYWORDS) {
      if (pattern.test(content)) {
        score += weight;
        factors.push(`high_risk: ${pattern.toString()}`);
        logger.debug(`High risk keyword détecté: ${pattern.toString()}, score: ${weight}`);
      }
    }
    
    // 2. Vérifier les keywords à risque moyen
    for (const { pattern, weight } of MEDIUM_RISK_KEYWORDS) {
      if (pattern.test(content)) {
        score += weight;
        factors.push(`medium_risk: ${pattern.toString()}`);
        logger.debug(`Medium risk keyword détecté: ${pattern.toString()}, score: ${weight}`);
      }
    }
    
    // 3. Vérifier les keywords à faible risque
    for (const { pattern, weight } of LOW_RISK_KEYWORDS) {
      if (pattern.test(content)) {
        score += weight;
        factors.push(`low_risk: ${pattern.toString()}`);
      }
    }
    
    // 4. Appliquer les réducteurs (contexte positif)
    for (const { pattern, reduction } of REDUCERS) {
      if (pattern.test(content)) {
        score = Math.max(0, score - reduction);
        factors.push(`reducer: ${pattern.toString()}`);
        logger.debug(`Réducteur appliqué: ${pattern.toString()}, réduction: ${reduction}`);
      }
    }
    
    // 5. Facteurs aggravants supplémentaires
    if (content.length > 200 && content === content.toUpperCase()) {
      score += 0.2;
      factors.push('all_caps_long');
    }
    
    // Compter les mentions
    const mentions = (content.match(/<@!?\d+>/g) || []).length;
    if (mentions > 3) {
      score += 0.15 * mentions;
      factors.push(`multiple_mentions: ${mentions}`);
    }
    
    // 6. Décision finale
    const confidence = Math.min(1, score);
    const action = confidence >= 0.6 ? 'delete+mute' : 'none';
    
    let reason = 'Aucune violation détectée';
    if (action === 'delete+mute') {
      if (factors.some(f => f.includes('high_risk'))) {
        reason = 'Contenu haineux ou menaces détectés';
      } else if (factors.some(f => f.includes('multiple_mentions'))) {
        reason = 'Spam de mentions';
      } else if (factors.some(f => f.includes('all_caps'))) {
        reason = 'Spam en majuscules';
      } else {
        reason = 'Contenu inapproprié détecté';
      }
    }
    
    logger.info('Résultat analyse:', { action, reason, confidence: confidence.toFixed(2), factors });
    
    return {
      action,
      reason,
      confidence,
      factors
    };
    
  } catch (error) {
    logger.error('Erreur lors de l\'analyse locale:', error);
    return {
      action: 'none',
      reason: 'Erreur d\'analyse',
      confidence: 0
    };
  }
}

/**
 * Log une action de modération automatique
 */
export async function logModerationAction(message, action, reason) {
  try {
    await addLog('moderation_logs.json', {
      type: 'auto_moderation',
      action,
      reason,
      messageId: message.id,
      channelId: message.channel.id,
      authorId: message.author.id,
      authorTag: message.author.tag,
      content: message.content.substring(0, 200),
      timestamp: new Date().toISOString()
    });
    
    logger.info('Action de modération enregistrée:', { action, reason, author: message.author.tag });
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement de l\'action de modération:', error);
  }
}

export default {
  quickBlockCheck,
  localAnalyze,
  logModerationAction
};
