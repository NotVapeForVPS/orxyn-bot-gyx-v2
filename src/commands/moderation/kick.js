/**
 * Commande /kick - Expulser un utilisateur
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addLog, getConfig } from '../../services/dataService.js';
import { successEmbed, errorEmbed, moderationLogEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un utilisateur du serveur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('L\'utilisateur à expulser')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Raison de l\'expulsion')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';
    
    try {
      const member = await interaction.guild.members.fetch(user.id);
      
      if (!member.kickable) {
        await interaction.reply({
          embeds: [errorEmbed('Erreur', 'Je ne peux pas expulser cet utilisateur.')],
          ephemeral: true
        });
        return;
      }
      
      // Expulser
      await member.kick(reason);
      
      // Log
      await addLog('moderation_logs.json', {
        type: 'kick',
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
            embeds: [moderationLogEmbed('kick', interaction.user, user, reason)]
          });
        }
      }
      
      await interaction.reply({
        embeds: [successEmbed(
          'Utilisateur expulsé',
          `${user.tag} a été expulsé.\n**Raison:** ${reason}`
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'expulsion:', error);
      
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite lors de l\'expulsion.')],
        ephemeral: true
      });
    }
  }
};
