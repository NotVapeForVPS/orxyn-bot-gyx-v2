/**
 * Événement guildMemberAdd - Déclenché quand un membre rejoint le serveur
 */

import { Events } from 'discord.js';
import { getConfig } from '../services/dataService.js';
import { welcomeEmbed } from '../services/embedFormatter.js';
import logger from '../services/logger.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      logger.info(`👤 Nouveau membre: ${member.user.tag} sur ${member.guild.name}`);
      
      const config = await getConfig();
      
      // Attribuer le rôle de bienvenue
      if (config.welcomeRoleId) {
        try {
          const role = member.guild.roles.cache.get(config.welcomeRoleId);
          if (role) {
            await member.roles.add(role);
            logger.info(`✅ Rôle ${role.name} attribué à ${member.user.tag}`);
          } else {
            logger.warn(`⚠️ Rôle de bienvenue ${config.welcomeRoleId} introuvable`);
          }
        } catch (error) {
          logger.error('❌ Erreur lors de l\'attribution du rôle de bienvenue:', error);
        }
      }
      
      // Envoyer le message de bienvenue
      if (config.welcomeChannelId) {
        try {
          const channel = member.guild.channels.cache.get(config.welcomeChannelId);
          if (channel) {
            const embed = welcomeEmbed(member);
            await channel.send({ embeds: [embed] });
            logger.info(`✅ Message de bienvenue envoyé pour ${member.user.tag}`);
          } else {
            logger.warn(`⚠️ Salon de bienvenue ${config.welcomeChannelId} introuvable`);
          }
        } catch (error) {
          logger.error('❌ Erreur lors de l\'envoi du message de bienvenue:', error);
        }
      }
      
    } catch (error) {
      logger.error('❌ Erreur dans guildMemberAdd:', error);
    }
  }
};
