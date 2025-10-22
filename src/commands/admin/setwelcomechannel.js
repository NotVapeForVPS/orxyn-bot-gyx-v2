/**
 * Commande /setwelcomechannel - Configure le salon de bienvenue
 */

import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { updateConfig } from '../../services/dataService.js';
import { successEmbed, errorEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setwelcomechannel')
    .setDescription('Configure le salon de bienvenue')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Le salon où envoyer les messages de bienvenue')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    
    try {
      await updateConfig({ welcomeChannelId: channel.id });
      
      await interaction.reply({
        embeds: [successEmbed(
          'Salon de bienvenue configuré',
          `Les messages de bienvenue seront envoyés dans ${channel}`
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors de la configuration du salon de bienvenue:', error);
      
      await interaction.reply({
        embeds: [errorEmbed(
          'Erreur',
          'Une erreur s\'est produite lors de la configuration du salon de bienvenue.'
        )],
        ephemeral: true
      });
    }
  }
};
