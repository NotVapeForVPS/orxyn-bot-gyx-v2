/**
 * Commande /warn - Avertir un utilisateur
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addLog, getConfig } from '../../services/dataService.js';
import { successEmbed, errorEmbed, moderationLogEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un utilisateur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('L\'utilisateur à avertir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Raison de l\'avertissement')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    
    try {
      // Log
      await addLog('moderation_logs.json', {
        type: 'warn',
        moderator: interaction.user.id,
        moderatorTag: interaction.user.tag,
        target: user.id,
        targetTag: user.tag,
        reason
      });
      
      // Envoyer dans le salon de logs
      const config = await getConfig();
      if (config.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
          await logChannel.send({
            embeds: [moderationLogEmbed('warn', interaction.user, user, reason)]
          });
        }
      }
      
      // Essayer d'envoyer un DM à l'utilisateur
      try {
        await user.send(`⚠️ Vous avez reçu un avertissement sur **${interaction.guild.name}**\n**Raison:** ${reason}`);
      } catch {
        // L'utilisateur a peut-être désactivé les DMs
      }
      
      await interaction.reply({
        embeds: [successEmbed(
          'Avertissement enregistré',
          `${user.tag} a été averti.\n**Raison:** ${reason}`
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'avertissement:', error);
      
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite lors de l\'avertissement.')],
        ephemeral: true
      });
    }
  }
};
