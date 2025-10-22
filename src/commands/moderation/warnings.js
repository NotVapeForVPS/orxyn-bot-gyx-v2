/**
 * Commande /warnings - Voir les avertissements d'un utilisateur
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { readData } from '../../services/dataService.js';
import { infoEmbed, errorEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Voir les avertissements d\'un utilisateur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('L\'utilisateur dont voir les avertissements')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    
    try {
      const logs = await readData('moderation_logs.json');
      
      // Filtrer les warns pour cet utilisateur
      const warnings = logs.filter(log => 
        log.type === 'warn' && 
        log.target === user.id
      );
      
      if (warnings.length === 0) {
        await interaction.reply({
          embeds: [infoEmbed(
            'Aucun avertissement',
            `${user.tag} n'a aucun avertissement.`
          )],
          ephemeral: true
        });
        return;
      }
      
      // Créer la liste des warnings
      const warningsList = warnings.map((warn, index) => {
        const date = new Date(warn.timestamp).toLocaleString('fr-FR');
        return `**${index + 1}.** ${warn.reason}\n└ Par <@${warn.moderator}> le ${date}`;
      }).join('\n\n');
      
      await interaction.reply({
        embeds: [infoEmbed(
          `Avertissements de ${user.tag}`,
          `**Total:** ${warnings.length} avertissement(s)\n\n${warningsList}`,
          [
            {
              name: '📊 Statistiques',
              value: `Dernier avertissement: ${new Date(warnings[warnings.length - 1].timestamp).toLocaleString('fr-FR')}`,
              inline: false
            }
          ]
        )],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des avertissements:', error);
      
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite lors de la récupération des avertissements.')],
        ephemeral: true
      });
    }
  }
};
