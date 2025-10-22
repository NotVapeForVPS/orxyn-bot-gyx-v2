/**
 * Commande /setwelcomerole - Configure le rôle de bienvenue
 */

import { SlashCommandBuilder } from 'discord.js';
import { updateConfig } from '../../services/dataService.js';
import { successEmbed, errorEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setwelcomerole')
    .setDescription('Configure le rôle attribué automatiquement aux nouveaux membres')
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Le rôle à attribuer')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    
    try {
      await updateConfig({ welcomeRoleId: role.id });
      
      await interaction.reply({
        embeds: [successEmbed(
          'Rôle de bienvenue configuré',
          `Le rôle ${role} sera automatiquement attribué aux nouveaux membres.`
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors de la configuration du rôle de bienvenue:', error);
      
      await interaction.reply({
        embeds: [errorEmbed(
          'Erreur',
          'Une erreur s\'est produite lors de la configuration du rôle de bienvenue.'
        )],
        ephemeral: true
      });
    }
  }
};
