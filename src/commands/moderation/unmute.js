/**
 * Commande /unmute - Unmute un utilisateur
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addLog, getConfig } from '../../services/dataService.js';
import { successEmbed, errorEmbed, moderationLogEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute un utilisateur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('L\'utilisateur à unmute')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    
    try {
      const member = await interaction.guild.members.fetch(user.id);
      
      if (!member.isCommunicationDisabled()) {
        await interaction.reply({
          embeds: [errorEmbed('Erreur', 'Cet utilisateur n\'est pas mute.')],
          ephemeral: true
        });
        return;
      }
      
      // Unmute
      await member.timeout(null);
      
      // Log
      await addLog('moderation_logs.json', {
        type: 'unmute',
        moderator: interaction.user.id,
        moderatorTag: interaction.user.tag,
        target: user.id,
        targetTag: user.tag,
        reason: 'Unmute'
      });
      
      // Envoyer dans le salon de logs
      const config = await getConfig();
      if (config.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
          await logChannel.send({
            embeds: [moderationLogEmbed('unmute', interaction.user, user, 'Unmute')]
          });
        }
      }
      
      await interaction.reply({
        embeds: [successEmbed(
          'Utilisateur unmute',
          `${user.tag} a été unmute.`
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors du unmute:', error);
      
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite lors du unmute.')],
        ephemeral: true
      });
    }
  }
};
