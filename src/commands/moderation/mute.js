/**
 * Commande /mute - Mute un utilisateur (utilise Discord timeout)
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { parseDuration } from '../../utils/timeUtils.js';
import { addLog, getConfig } from '../../services/dataService.js';
import { successEmbed, errorEmbed, moderationLogEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute un utilisateur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('L\'utilisateur à mute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Durée du mute (ex: 5m, 1h, 1d)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Raison du mute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';
    
    try {
      // Parser la durée
      const duration = parseDuration(durationStr);
      
      // Limite max de Discord: 28 jours
      if (duration > 28 * 24 * 60 * 60 * 1000) {
        await interaction.reply({
          embeds: [errorEmbed('Erreur', 'La durée maximale est de 28 jours.')],
          ephemeral: true
        });
        return;
      }
      
      const member = await interaction.guild.members.fetch(user.id);
      
      if (!member.moderatable) {
        await interaction.reply({
          embeds: [errorEmbed('Erreur', 'Je ne peux pas mute cet utilisateur.')],
          ephemeral: true
        });
        return;
      }
      
      // Mute via Discord timeout
      await member.timeout(duration, reason);
      
      // Log
      await addLog('moderation_logs.json', {
        type: 'mute',
        moderator: interaction.user.id,
        moderatorTag: interaction.user.tag,
        target: user.id,
        targetTag: user.tag,
        duration: durationStr,
        reason
      });
      
      // Envoyer dans le salon de logs
      const config = await getConfig();
      if (config.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
          await logChannel.send({
            embeds: [moderationLogEmbed('mute', interaction.user, user, `${reason} (Durée: ${durationStr})`)]
          });
        }
      }
      
      await interaction.reply({
        embeds: [successEmbed(
          'Utilisateur mute',
          `${user.tag} a été mute pendant ${durationStr}.\n**Raison:** ${reason}`
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors du mute:', error);
      
      await interaction.reply({
        embeds: [errorEmbed('Erreur', error.message || 'Une erreur s\'est produite lors du mute.')],
        ephemeral: true
      });
    }
  }
};
