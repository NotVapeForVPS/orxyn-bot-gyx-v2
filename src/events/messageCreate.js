/**
 * Événement messageCreate - Gère les messages (modération auto + réponses IA tickets)
 */

import { Events } from 'discord.js';
import { quickBlockCheck, localAnalyze, logModerationAction } from '../services/moderationService.js';
import { getTicketByChannelId, logTicketMessage } from '../services/ticketService.js';
import { generateTicketResponse } from '../services/mistralService.js';
import { isAdmin } from '../utils/permissions.js';
import logger from '../services/logger.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignorer les bots
    if (message.author.bot) return;
    
    // Ignorer les DMs
    if (!message.guild) return;
    
    try {
      // 1. Vérifier si c'est un message dans un ticket
      const ticket = await getTicketByChannelId(message.channel.id);
      if (ticket) {
        await handleTicketMessage(message, ticket);
        return;
      }
      
      // 2. Modération automatique
      const isUserAdmin = await isAdmin(message.member);
      if (!isUserAdmin) {
        await handleModeration(message);
      }
      
    } catch (error) {
      logger.error('Erreur dans messageCreate:', error);
    }
  }
};

/**
 * Gère les messages dans les tickets
 */
async function handleTicketMessage(message, ticket) {
  try {
    // Enregistrer le message dans l'historique
    await logTicketMessage(ticket.id, message.author.id, message.content, false);
    
    // Si l'IA est désactivée pour ce ticket, ne pas répondre
    if (!ticket.aiEnabled) {
      return;
    }
    
    // Si c'est un message d'un staff, désactiver temporairement l'IA
    // (L'IA peut être réactivée avec /ticket ai toggle)
    const isUserAdmin = await isAdmin(message.member);
    if (isUserAdmin && message.author.id !== ticket.opener) {
      logger.info(`Staff ${message.author.tag} a répondu dans le ticket ${ticket.id}, IA mise en pause`);
      return;
    }
    
    // Générer une réponse IA
    try {
      const typing = message.channel.sendTyping();
      
      const response = await generateTicketResponse(
        ticket,
        message.content,
        ticket.messages
      );
      
      await typing;
      
      const botMessage = await message.channel.send(response);
      
      // Enregistrer la réponse de l'IA
      await logTicketMessage(ticket.id, 'bot', response, true);
      
      logger.debug(`Réponse IA envoyée dans le ticket ${ticket.id}`);
      
    } catch (error) {
      logger.error('Erreur lors de la génération de réponse IA:', error);
    }
    
  } catch (error) {
    logger.error('Erreur lors du traitement du message de ticket:', error);
  }
}

/**
 * Gère la modération automatique
 */
async function handleModeration(message) {
  try {
    // 1. Quick-block check (liens interdits)
    const quickBlock = quickBlockCheck(message.content);
    
    if (quickBlock.shouldBlock) {
      // Supprimer le message
      await message.delete().catch(() => {});
      
      // Mute 5 minutes
      await message.member.timeout(5 * 60 * 1000, quickBlock.reason).catch(() => {});
      
      // Envoyer un message éphémère
      const warningMsg = await message.channel.send(
        `⚠️ ${message.author}, votre message a été supprimé : **${quickBlock.reason}**. Vous êtes mute pendant 5 minutes.`
      );
      
      setTimeout(() => warningMsg.delete().catch(() => {}), 10000);
      
      // Log l'action
      await logModerationAction(message, 'delete+mute', quickBlock.reason);
      
      logger.info(`Quick-block appliqué à ${message.author.tag}: ${quickBlock.reason}`);
      return;
    }
    
    // 2. Analyse locale approfondie
    const analysis = await localAnalyze(message.content);
    
    if (analysis.action === 'delete+mute') {
      // Supprimer le message
      await message.delete().catch(() => {});
      
      // Mute 5 minutes
      await message.member.timeout(5 * 60 * 1000, analysis.reason).catch(() => {});
      
      // Notifier
      const warningMsg = await message.channel.send(
        `⚠️ ${message.author}, votre message a été supprimé : **${analysis.reason}**. Vous êtes mute pendant 5 minutes.`
      );
      
      setTimeout(() => warningMsg.delete().catch(() => {}), 10000);
      
      // Log l'action
      await logModerationAction(message, 'delete+mute', analysis.reason);
      
      logger.info(`Modération auto appliquée à ${message.author.tag}: ${analysis.reason} (confiance: ${(analysis.confidence * 100).toFixed(0)}%)`);
    }
    
  } catch (error) {
    logger.error('Erreur lors de la modération automatique:', error);
  }
}
