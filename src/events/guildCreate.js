/**
 * Événement guildCreate - Déclenché quand le bot rejoint un serveur
 */

import { Events } from 'discord.js';
import { updateData } from '../services/dataService.js';
import logger from '../services/logger.js';

export default {
  name: Events.GuildCreate,
  async execute(guild) {
    logger.info(`📥 Bot ajouté au serveur: ${guild.name} (${guild.id})`);
    
    try {
      // Enregistrer la guilde
      await updateData('guilds.json', (guilds) => {
        guilds[guild.id] = {
          id: guild.id,
          name: guild.name,
          joinedAt: new Date().toISOString(),
          memberCount: guild.memberCount
        };
        return guilds;
      });
      
      logger.info(`✅ Guilde ${guild.name} enregistrée`);
      
      // Les commandes sont déjà déployées globalement au démarrage
      // Pas besoin de les redéployer ici
      
    } catch (error) {
      logger.error(`❌ Erreur lors de l'enregistrement de la guilde ${guild.name}:`, error);
    }
  }
};
