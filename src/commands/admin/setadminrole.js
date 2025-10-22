/**
 * Commande /setadminrole - Configure le rôle admin du bot
 */

import { SlashCommandBuilder } from 'discord.js';
import { updateConfig } from '../../services/dataService.js';
import { successEmbed, errorEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setadminrole')
    .setDescription('Configure le rôle admin du bot')
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Le rôle qui aura accès aux commandes admin')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    
    try {
      await updateConfig({ adminRoleId: role.id });
      
      await interaction.reply({
        embeds: [successEmbed(
          'Rôle admin configuré',
          `Le rôle ${role} aura accès à toutes les commandes administratives du bot.`
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors de la configuration du rôle admin:', error);
      
      await interaction.reply({
        embeds: [errorEmbed(
          'Erreur',
          'Une erreur s\'est produite lors de la configuration du rôle admin.'
        )],
        ephemeral: true
      });
    }
  }
};
