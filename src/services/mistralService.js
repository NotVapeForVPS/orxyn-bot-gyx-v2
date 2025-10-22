/**
 * Service d'intégration avec l'API Mistral AI
 * Gestion intelligente des requêtes avec queue, retries et fallback
 */

import { request } from 'undici';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { readData, writeData } from './dataService.js';
import { mistralLogger as logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.join(__dirname, '../../prompts');

// Configuration
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || 'mlCfO3YxF3CbwpDT2uPrQ0VCoAUV5cVq';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-tiny'; // Modèle économique pour démarrer
const TIMEOUT = 15000; // 15 secondes
const MAX_RETRIES = 2;
const MAX_HISTORY = 10; // Nombre de messages d'historique à envoyer

// Mode mock si pas de clé valide
const MOCK_MODE = !MISTRAL_API_KEY || MISTRAL_API_KEY === '';

// Chargement du prompt système
let SYSTEM_PROMPT = '';
try {
  SYSTEM_PROMPT = await fs.readFile(path.join(PROMPTS_DIR, 'prompt.txt'), 'utf8');
} catch (error) {
  logger.error('Erreur lors du chargement du prompt système:', error);
  SYSTEM_PROMPT = 'Tu es un assistant du serveur GYX Boosts. Sois professionnel et courtois.';
}

/**
 * Sanitize le contenu pour éviter les injections et limiter la taille
 */
function sanitizeContent(content) {
  if (!content) return '';
  
  // Limiter la longueur
  const maxLength = 2000;
  let sanitized = content.substring(0, maxLength);
  
  // Nettoyer les caractères spéciaux potentiellement problématiques
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

/**
 * Appelle l'API Mistral avec retry et timeout
 */
async function callMistralAPI(messages, retries = 0) {
  if (MOCK_MODE) {
    logger.info('Mode MOCK activé - Pas de clé Mistral valide');
    return getMockResponse(messages[messages.length - 1].content);
  }
  
  try {
    logger.debug(`Appel API Mistral (tentative ${retries + 1}/${MAX_RETRIES + 1})`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    const response = await request(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.statusCode !== 200) {
      const errorBody = await response.body.text();
      throw new Error(`API Mistral error ${response.statusCode}: ${errorBody}`);
    }
    
    const data = await response.body.json();
    logger.debug('Réponse API Mistral reçue avec succès');
    
    return data.choices[0].message.content;
    
  } catch (error) {
    logger.error(`Erreur API Mistral (tentative ${retries + 1}):`, error);
    
    // Retry avec backoff
    if (retries < MAX_RETRIES) {
      const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
      logger.info(`Nouvelle tentative dans ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callMistralAPI(messages, retries + 1);
    }
    
    // Si toutes les tentatives échouent, mode fallback
    logger.warn('Toutes les tentatives ont échoué, passage en mode fallback');
    return getMockResponse(messages[messages.length - 1].content);
  }
}

/**
 * Génère une réponse mock intelligente
 */
function getMockResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
    return '👋 Bonjour ! Bienvenue sur le support GYX Boosts. Je suis actuellement en mode démo. Comment puis-je vous aider aujourd\'hui ?';
  }
  
  if (lowerMessage.includes('boost') || lowerMessage.includes('commande')) {
    return '🚀 Pour toute demande de boost, un membre de notre équipe va prendre en charge votre demande. Pourriez-vous préciser le type de boost souhaité et la quantité ?';
  }
  
  if (lowerMessage.includes('problème') || lowerMessage.includes('bug') || lowerMessage.includes('erreur')) {
    return '🔧 Je comprends que vous rencontrez un problème. Un membre du staff va examiner votre situation rapidement. Pouvez-vous décrire le problème plus en détail ?';
  }
  
  if (lowerMessage.includes('prix') || lowerMessage.includes('tarif') || lowerMessage.includes('coût')) {
    return '💎 Pour les tarifs, je vous invite à consulter nos salons d\'information ou un membre du staff pourra vous fournir un devis personnalisé.';
  }
  
  if (lowerMessage.includes('merci') || lowerMessage.includes('thanks')) {
    return '😊 De rien ! N\'hésitez pas si vous avez d\'autres questions. Notre équipe est là pour vous aider !';
  }
  
  return 'Je suis là pour vous aider ! Un membre de notre équipe GYX Boosts va prendre en charge votre demande. En attendant, n\'hésitez pas à me donner plus de détails sur votre besoin. 🎫';
}

/**
 * Génère une réponse IA pour un ticket
 */
export async function generateTicketResponse(ticketData, userMessage, messageHistory = []) {
  try {
    logger.info(`Génération réponse IA pour ticket ${ticketData.id}`);
    
    // Sanitize le message utilisateur
    const sanitizedMessage = sanitizeContent(userMessage);
    
    // Construire l'historique de messages
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      }
    ];
    
    // Ajouter l'historique récent (limité)
    const recentHistory = messageHistory.slice(-MAX_HISTORY);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.isBot ? 'assistant' : 'user',
        content: sanitizeContent(msg.content)
      });
    }
    
    // Ajouter le message actuel
    messages.push({
      role: 'user',
      content: sanitizedMessage
    });
    
    // Appel à l'API
    const response = await callMistralAPI(messages);
    
    // Log de la réponse (sans info sensible)
    logger.info(`Réponse générée pour ticket ${ticketData.id}: ${response.substring(0, 100)}...`);
    
    return response;
    
  } catch (error) {
    logger.error('Erreur lors de la génération de réponse IA:', error);
    return getMockResponse(userMessage);
  }
}

/**
 * Génère un message d'accueil automatique pour un nouveau ticket
 */
export async function generateWelcomeMessage(ticketData, reason) {
  try {
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Un utilisateur vient d'ouvrir un ticket avec la raison suivante: "${reason}". Génère un message d'accueil chaleureux et demande-lui de détailler sa demande.`
      }
    ];
    
    const response = await callMistralAPI(messages);
    logger.info(`Message d'accueil généré pour ticket ${ticketData.id}`);
    
    return response;
    
  } catch (error) {
    logger.error('Erreur lors de la génération du message d\'accueil:', error);
    return '👋 Bienvenue sur le support GYX Boosts !\n\nJe suis l\'assistant automatique et je suis là pour vous aider. Un membre de notre équipe pourra également intervenir si nécessaire.\n\nPouvez-vous me décrire votre demande ou votre question ? Plus vous donnerez de détails, plus nous pourrons vous aider rapidement ! 🎫';
  }
}

/**
 * Vérifie si le mode mock est activé
 */
export function isMockMode() {
  return MOCK_MODE;
}

export default {
  generateTicketResponse,
  generateWelcomeMessage,
  isMockMode
};
