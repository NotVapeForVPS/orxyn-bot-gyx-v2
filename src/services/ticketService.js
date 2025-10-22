/**
 * Service de gestion des tickets
 * Gère le cycle de vie complet des tickets et les transcripts
 */

import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { readData, writeData, updateData, writeTranscript } from './dataService.js';
import { generateWelcomeMessage, generateTicketResponse } from './mistralService.js';
import logger from './logger.js';

/**
 * Crée un nouveau ticket
 */
export async function createTicket(guild, member, reason, panelId = null) {
  try {
    const ticketId = uuidv4();
    const tickets = await readData('tickets.json');
    const panels = await readData('ticket_panels.json');
    
    // Récupérer les infos du panel si fourni
    const panel = panelId ? panels[panelId] : null;
    const categoryId = panel?.categoryId;
    const staffRoles = panel?.staffRoles || [];
    
    // Créer le salon de ticket
    const ticketChannel = await guild.channels.create({
      name: `ticket-${member.user.username}`,
      type: ChannelType.GuildText,
      parent: categoryId || null,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        // Ajouter les permissions pour les rôles staff
        ...staffRoles.map(roleId => ({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        }))
      ]
    });
    
    // Sauvegarder le ticket dans les données
    tickets[ticketId] = {
      id: ticketId,
      guildId: guild.id,
      opener: member.id,
      channelId: ticketChannel.id,
      panelId: panelId,
      reason: reason,
      messages: [],
      status: 'open',
      claimedBy: null,
      createdAt: new Date().toISOString(),
      closedAt: null,
      closeReason: null,
      transcriptPath: null,
      aiEnabled: true
    };
    
    await writeData('tickets.json', tickets);
    
    logger.info(`Ticket ${ticketId} créé par ${member.user.tag} dans ${guild.name}`);
    
    // Générer et envoyer le message d'accueil IA
    try {
      const welcomeMsg = await generateWelcomeMessage(tickets[ticketId], reason);
      await ticketChannel.send(welcomeMsg);
      
      // Enregistrer le message d'accueil
      tickets[ticketId].messages.push({
        authorId: 'bot',
        content: welcomeMsg,
        timestamp: new Date().toISOString(),
        isBot: true
      });
      await writeData('tickets.json', tickets);
    } catch (error) {
      logger.error('Erreur lors de l\'envoi du message d\'accueil:', error);
    }
    
    return { ticketId, channel: ticketChannel };
    
  } catch (error) {
    logger.error('Erreur lors de la création du ticket:', error);
    throw error;
  }
}

/**
 * Ferme un ticket et génère le transcript
 */
export async function closeTicket(ticketId, closedBy, reason = 'Aucune raison fournie') {
  try {
    const tickets = await readData('tickets.json');
    const ticket = tickets[ticketId];
    
    if (!ticket) {
      throw new Error('Ticket non trouvé');
    }
    
    // Mettre à jour le statut
    ticket.status = 'closed';
    ticket.closedAt = new Date().toISOString();
    ticket.closeReason = reason;
    
    // Générer les transcripts
    const transcriptTxt = generateTranscriptTxt(ticket);
    const transcriptJson = ticket.messages;
    
    // Sauvegarder les transcripts
    const txtPath = await writeTranscript(ticketId, transcriptTxt, 'txt');
    const jsonPath = await writeTranscript(ticketId, transcriptJson, 'json');
    
    ticket.transcriptPath = txtPath;
    
    await writeData('tickets.json', tickets);
    
    logger.info(`Ticket ${ticketId} fermé par ${closedBy}`);
    
    return { txtPath, jsonPath };
    
  } catch (error) {
    logger.error('Erreur lors de la fermeture du ticket:', error);
    throw error;
  }
}

/**
 * Génère un transcript au format texte
 */
function generateTranscriptTxt(ticket) {
  let transcript = '';
  transcript += '═══════════════════════════════════════════\n';
  transcript += '        TRANSCRIPT DE TICKET\n';
  transcript += '═══════════════════════════════════════════\n\n';
  transcript += `Ticket ID: ${ticket.id}\n`;
  transcript += `Ouvert par: ${ticket.opener}\n`;
  transcript += `Raison: ${ticket.reason}\n`;
  transcript += `Créé le: ${ticket.createdAt}\n`;
  transcript += `Fermé le: ${ticket.closedAt}\n`;
  transcript += `Raison de fermeture: ${ticket.closeReason}\n`;
  transcript += `Statut: ${ticket.status}\n`;
  if (ticket.claimedBy) {
    transcript += `Pris en charge par: ${ticket.claimedBy}\n`;
  }
  transcript += '\n═══════════════════════════════════════════\n';
  transcript += '        MESSAGES\n';
  transcript += '═══════════════════════════════════════════\n\n';
  
  for (const msg of ticket.messages) {
    const timestamp = new Date(msg.timestamp).toLocaleString('fr-FR');
    const author = msg.isBot ? 'Bot (IA)' : msg.authorId;
    transcript += `[${timestamp}] ${author}:\n`;
    transcript += `${msg.content}\n\n`;
  }
  
  transcript += '═══════════════════════════════════════════\n';
  transcript += '        FIN DU TRANSCRIPT\n';
  transcript += '═══════════════════════════════════════════\n';
  
  return transcript;
}

/**
 * Enregistre un message dans l'historique du ticket
 */
export async function logTicketMessage(ticketId, authorId, content, isBot = false) {
  try {
    await updateData('tickets.json', (tickets) => {
      if (tickets[ticketId]) {
        tickets[ticketId].messages.push({
          authorId,
          content,
          timestamp: new Date().toISOString(),
          isBot
        });
      }
      return tickets;
    });
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement du message:', error);
  }
}

/**
 * Récupère un ticket par son ID
 */
export async function getTicket(ticketId) {
  const tickets = await readData('tickets.json');
  return tickets[ticketId];
}

/**
 * Récupère un ticket par l'ID du salon
 */
export async function getTicketByChannelId(channelId) {
  const tickets = await readData('tickets.json');
  return Object.values(tickets).find(t => t.channelId === channelId);
}

/**
 * Marque un ticket comme pris en charge (claim)
 */
export async function claimTicket(ticketId, userId) {
  return updateData('tickets.json', (tickets) => {
    if (tickets[ticketId]) {
      tickets[ticketId].status = 'claimed';
      tickets[ticketId].claimedBy = userId;
    }
    return tickets;
  });
}

/**
 * Active/désactive l'IA pour un ticket
 */
export async function toggleTicketAI(ticketId) {
  return updateData('tickets.json', (tickets) => {
    if (tickets[ticketId]) {
      tickets[ticketId].aiEnabled = !tickets[ticketId].aiEnabled;
      return { enabled: tickets[ticketId].aiEnabled, tickets };
    }
    return { enabled: false, tickets };
  });
}

/**
 * Ajoute un utilisateur à un ticket
 */
export async function addUserToTicket(channel, user) {
  try {
    await channel.permissionOverwrites.create(user, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
    logger.info(`Utilisateur ${user.tag} ajouté au ticket ${channel.name}`);
  } catch (error) {
    logger.error('Erreur lors de l\'ajout d\'un utilisateur au ticket:', error);
    throw error;
  }
}

/**
 * Retire un utilisateur d'un ticket
 */
export async function removeUserFromTicket(channel, user) {
  try {
    await channel.permissionOverwrites.delete(user);
    logger.info(`Utilisateur ${user.tag} retiré du ticket ${channel.name}`);
  } catch (error) {
    logger.error('Erreur lors du retrait d\'un utilisateur du ticket:', error);
    throw error;
  }
}

export default {
  createTicket,
  closeTicket,
  logTicketMessage,
  getTicket,
  getTicketByChannelId,
  claimTicket,
  toggleTicketAI,
  addUserToTicket,
  removeUserFromTicket
};
