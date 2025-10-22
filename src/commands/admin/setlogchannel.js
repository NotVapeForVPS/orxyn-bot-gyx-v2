/**
 * Commande /setlogchannel - Configure le salon de logs
 */

import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { updateConfig } from '../../services/dataService.js';
import { successEmbed, errorEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlogchannel')
    .setDescription('Configure le salon de logs du serveur')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Le salon où envoyer les logs')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    
    try {
      await updateConfig({ logChannelId: channel.id });
      
      await interaction.reply({
        embeds: [successEmbed(
          'Salon de logs configuré',
          `Les logs seront envoyés dans ${channel}`
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors de la configuration du salon de logs:', error);
      
      await interaction.reply({
        embeds: [errorEmbed(
          'Erreur',
          'Une erreur s\'est produite lors de la configuration du salon de logs.'
        )],
        ephemeral: true
      });
    }
  }
};
