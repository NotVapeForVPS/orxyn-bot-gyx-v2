/**
 * Événement ready - Déclenché quand le bot est prêt
 */

import { Events } from 'discord.js';
import logger from '../services/logger.js';
import { loadActiveGiveaways } from '../services/giveawayService.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logger.info(`✅ Bot connecté en tant que ${client.user.tag}`);
    logger.info(`📊 Présent sur ${client.guilds.cache.size} serveur(s)`);
    
    // Définir l'activité du bot
    client.user.setActivity('GYX Boosts | /help', { type: 'WATCHING' });
    
    // Charger les giveaways actifs
    try {
      await loadActiveGiveaways(client);
      logger.info('✅ Giveaways actifs chargés');
    } catch (error) {
      logger.error('❌ Erreur lors du chargement des giveaways:', error);
    }
    
    logger.info('🚀 Bot Orxyn opérationnel !');
  }
};
