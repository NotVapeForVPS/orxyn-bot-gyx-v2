/**
 * Commande /unban - Débannir un utilisateur
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addLog, getConfig } from '../../services/dataService.js';
import { successEmbed, errorEmbed, moderationLogEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannir un utilisateur')
    .addStringOption(option =>
      option
        .setName('user_id')
        .setDescription('L\'ID de l\'utilisateur à débannir')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction) {
    const userId = interaction.options.getString('user_id');
    
    try {
      // Débannir
      await interaction.guild.members.unban(userId);
      
      // Log
      await addLog('moderation_logs.json', {
        type: 'unban',
        moderator: interaction.user.id,
        moderatorTag: interaction.user.tag,
        target: userId,
        reason: 'Débanni'
      });
      
      // Envoyer dans le salon de logs
      const config = await getConfig();
      if (config.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
          await logChannel.send({
            embeds: [moderationLogEmbed('unban', interaction.user, userId, 'Débanni')]
          });
        }
      }
      
      await interaction.reply({
        embeds: [successEmbed(
          'Utilisateur débanni',
          `L'utilisateur avec l'ID \`${userId}\` a été débanni.`
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors du débannissement:', error);
      
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Cet utilisateur n\'est pas banni ou l\'ID est invalide.')],
        ephemeral: true
      });
    }
  }
};
