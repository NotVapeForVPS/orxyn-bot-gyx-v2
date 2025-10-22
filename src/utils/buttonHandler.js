/**
 * Gestionnaire des interactions avec les boutons permanents
 */

import { createTicket } from '../services/ticketService.js';
import { getPanel } from '../services/ticketPanelService.js';
import { errorEmbed, successEmbed } from '../services/embedFormatter.js';
import logger from '../services/logger.js';

/**
 * Gère l'interaction avec un bouton
 */
export async function handleButtonInteraction(interaction) {
  try {
    const customId = interaction.customId;
    
    // Bouton d'ouverture de ticket
    if (customId.startsWith('ticket_open_')) {
      await handleTicketOpen(interaction, customId);
      return;
    }
    
    logger.warn(`Interaction bouton non gérée: ${customId}`);
    
  } catch (error) {
    logger.error('Erreur lors du traitement de l\'interaction bouton:', error);
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite lors du traitement de votre demande.')],
        ephemeral: true
      });
    }
  }
}

/**
 * Gère l'ouverture d'un ticket via bouton de panel
 */
async function handleTicketOpen(interaction, customId) {
  try {
    const panelId = customId.replace('ticket_open_', '');
    const panel = await getPanel(panelId);
    
    if (!panel) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Panel de ticket introuvable.')],
        ephemeral: true
      });
      return;
    }
    
    // Vérifier si l'utilisateur a déjà un ticket ouvert
    const { readData } = await import('../services/dataService.js');
    const tickets = await readData('tickets.json');
    
    const existingTicket = Object.values(tickets).find(
      t => t.opener === interaction.user.id && 
           t.guildId === interaction.guild.id && 
           t.status !== 'closed'
    );
    
    if (existingTicket) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', `Vous avez déjà un ticket ouvert: <#${existingTicket.channelId}>`)],
        ephemeral: true
      });
      return;
    }
    
    // Créer le ticket
    await interaction.deferReply({ ephemeral: true });
    
    const { ticketId, channel } = await createTicket(
      interaction.guild,
      interaction.member,
      'Ouvert via panel',
      panelId
    );
    
    await interaction.editReply({
      embeds: [successEmbed('Ticket créé', `Votre ticket a été créé: ${channel}`)],
      ephemeral: true
    });
    
    logger.info(`Ticket ${ticketId} créé via panel ${panelId} par ${interaction.user.tag}`);
    
  } catch (error) {
    logger.error('Erreur lors de l\'ouverture du ticket:', error);
    
    if (interaction.deferred) {
      await interaction.editReply({
        embeds: [errorEmbed('Erreur', 'Impossible de créer le ticket. Veuillez réessayer.')],
        ephemeral: true
      });
    } else {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Impossible de créer le ticket. Veuillez réessayer.')],
        ephemeral: true
      });
    }
  }
}

export default {
  handleButtonInteraction
};
