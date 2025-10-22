/**
 * Événement interactionCreate - Gère toutes les interactions (commandes, boutons, etc.)
 */

import { Events } from 'discord.js';
import { handleButtonInteraction } from '../utils/buttonHandler.js';
import { errorEmbed } from '../services/embedFormatter.js';
import { isAdmin } from '../utils/permissions.js';
import logger from '../services/logger.js';

// Commandes qui ne nécessitent PAS de permissions admin
const PUBLIC_COMMANDS = ['ticket'];

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      // Gérer les boutons
      if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
        return;
      }
      
      // Gérer les commandes slash
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command) {
          logger.warn(`Commande inconnue: ${interaction.commandName}`);
          return;
        }
        
        // Vérifier les permissions admin (sauf pour les commandes publiques)
        if (!PUBLIC_COMMANDS.includes(interaction.commandName)) {
          const hasAdminPerms = await isAdmin(interaction.member);
          
          if (!hasAdminPerms) {
            await interaction.reply({
              embeds: [errorEmbed('Permission refusée', 'Vous n\'avez pas la permission d\'utiliser cette commande.')],
              ephemeral: true
            });
            return;
          }
        }
        
        // Exécuter la commande
        try {
          logger.info(`Commande exécutée: /${interaction.commandName} par ${interaction.user.tag}`);
          await command.execute(interaction);
        } catch (error) {
          logger.error(`Erreur lors de l'exécution de /${interaction.commandName}:`, error);
          
          const errorMessage = {
            embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite lors de l\'exécution de cette commande.')],
            ephemeral: true
          };
          
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        }
      }
      
      // Gérer les modals
      if (interaction.isModalSubmit()) {
        // Les modals seront gérés dans les commandes respectives
        logger.debug(`Modal soumis: ${interaction.customId}`);
      }
      
    } catch (error) {
      logger.error('Erreur dans interactionCreate:', error);
    }
  }
};
