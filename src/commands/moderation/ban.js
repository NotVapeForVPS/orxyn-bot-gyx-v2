/**
 * Commande /ban - Bannir un utilisateur
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addLog, getConfig } from '../../services/dataService.js';
import { successEmbed, errorEmbed, moderationLogEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un utilisateur du serveur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('L\'utilisateur à bannir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Raison du bannissement')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';
    
    try {
      // Vérifier si l'utilisateur est bannable
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      
      if (member && !member.bannable) {
        await interaction.reply({
          embeds: [errorEmbed('Erreur', 'Je ne peux pas bannir cet utilisateur.')],
          ephemeral: true
        });
        return;
      }
      
      // Bannir
      await interaction.guild.members.ban(user, { reason });
      
      // Log
      await addLog('moderation_logs.json', {
        type: 'ban',
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
            embeds: [moderationLogEmbed('ban', interaction.user, user, reason)]
          });
        }
      }
      
      await interaction.reply({
        embeds: [successEmbed(
          'Utilisateur banni',
          `${user.tag} a été banni.\n**Raison:** ${reason}`
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite lors du bannissement.')],
        ephemeral: true
      });
    }
  }
};
