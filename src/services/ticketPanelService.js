/**
 * Service de gestion des panels de tickets
 * Permet de créer, éditer et gérer des panels personnalisables
 */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { readData, writeData, updateData } from './dataService.js';
import { createTicketPanelEmbed } from './embedFormatter.js';
import logger from './logger.js';

/**
 * Crée un nouveau panel de ticket
 */
export async function createPanel(guildId, panelData) {
  try {
    const panelId = uuidv4();
    const panels = await readData('ticket_panels.json');
    
    panels[panelId] = {
      id: panelId,
      guildId,
      title: panelData.title || '🎫 Support GYX Boosts',
      description: panelData.description || 'Cliquez sur le bouton ci-dessous pour ouvrir un ticket.',
      color: panelData.color || '#FF0000',
      banner: panelData.banner || null,
      thumbnail: panelData.thumbnail || null,
      footer: panelData.footer || 'Partenaire Officiel GYX Engine',
      buttonText: panelData.buttonText || '📩 Ouvrir un Ticket',
      buttonEmoji: panelData.buttonEmoji || '📩',
      buttonStyle: panelData.buttonStyle || 'Primary',
      categoryId: panelData.categoryId || null,
      staffRoles: panelData.staffRoles || [],
      archiveChannel: panelData.archiveChannel || null,
      createdAt: new Date().toISOString(),
      messageId: null,
      channelId: null
    };
    
    await writeData('ticket_panels.json', panels);
    logger.info(`Panel de ticket ${panelId} créé pour la guilde ${guildId}`);
    
    return { panelId, panel: panels[panelId] };
    
  } catch (error) {
    logger.error('Erreur lors de la création du panel:', error);
    throw error;
  }
}

/**
 * Met à jour un panel existant
 */
export async function updatePanel(panelId, updates) {
  try {
    const result = await updateData('ticket_panels.json', (panels) => {
      if (!panels[panelId]) {
        throw new Error('Panel non trouvé');
      }
      
      panels[panelId] = {
        ...panels[panelId],
        ...updates
      };
      
      return panels;
    });
    
    logger.info(`Panel ${panelId} mis à jour`);
    return result[panelId];
    
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du panel:', error);
    throw error;
  }
}

/**
 * Supprime un panel
 */
export async function deletePanel(panelId) {
  try {
    await updateData('ticket_panels.json', (panels) => {
      delete panels[panelId];
      return panels;
    });
    
    logger.info(`Panel ${panelId} supprimé`);
  } catch (error) {
    logger.error('Erreur lors de la suppression du panel:', error);
    throw error;
  }
}

/**
 * Récupère un panel par son ID
 */
export async function getPanel(panelId) {
  const panels = await readData('ticket_panels.json');
  return panels[panelId];
}

/**
 * Récupère tous les panels d'une guilde
 */
export async function getGuildPanels(guildId) {
  const panels = await readData('ticket_panels.json');
  return Object.values(panels).filter(p => p.guildId === guildId);
}

/**
 * Envoie un panel dans un salon
 */
export async function sendPanel(channel, panelId) {
  try {
    const panel = await getPanel(panelId);
    
    if (!panel) {
      throw new Error('Panel non trouvé');
    }
    
    // Créer l'embed
    const embed = createTicketPanelEmbed(panel);
    
    // Créer le bouton avec custom_id fixe
    const button = new ButtonBuilder()
      .setCustomId(`ticket_open_${panelId}`)
      .setLabel(panel.buttonText)
      .setStyle(getButtonStyle(panel.buttonStyle))
      .setEmoji(panel.buttonEmoji);
    
    const row = new ActionRowBuilder().addComponents(button);
    
    // Envoyer le message
    const message = await channel.send({
      embeds: [embed],
      components: [row]
    });
    
    // Mettre à jour le panel avec l'ID du message
    await updatePanel(panelId, {
      messageId: message.id,
      channelId: channel.id
    });
    
    logger.info(`Panel ${panelId} envoyé dans ${channel.name} (message: ${message.id})`);
    
    return message;
    
  } catch (error) {
    logger.error('Erreur lors de l\'envoi du panel:', error);
    throw error;
  }
}

/**
 * Convertit le style de bouton string en ButtonStyle
 */
function getButtonStyle(style) {
  const styles = {
    Primary: ButtonStyle.Primary,
    Secondary: ButtonStyle.Secondary,
    Success: ButtonStyle.Success,
    Danger: ButtonStyle.Danger
  };
  
  return styles[style] || ButtonStyle.Primary;
}

/**
 * Récupère un panel par l'ID du message
 */
export async function getPanelByMessageId(messageId) {
  const panels = await readData('ticket_panels.json');
  return Object.values(panels).find(p => p.messageId === messageId);
}

export default {
  createPanel,
  updatePanel,
  deletePanel,
  getPanel,
  getGuildPanels,
  sendPanel,
  getPanelByMessageId
};
