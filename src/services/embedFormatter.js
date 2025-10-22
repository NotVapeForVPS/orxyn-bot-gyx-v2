/**
 * Service de formatage des embeds
 * Centralise le style visuel de tous les embeds du bot
 */

import { EmbedBuilder } from 'discord.js';

// Couleurs du thème GYX Boosts
export const COLORS = {
  PRIMARY: 0xFF0000,      // Rouge foncé principal
  SUCCESS: 0x00FF00,      // Vert pour succès
  ERROR: 0xFF0000,        // Rouge pour erreurs
  WARNING: 0xFFA500,      // Orange pour avertissements
  INFO: 0xFF0000          // Rouge pour informations
};

// Footer par défaut
const DEFAULT_FOOTER = 'Partenaire Officiel GYX Engine';
const SUPPORT_LINK = 'discord.gg/gyx-engine';

/**
 * Crée un embed avec le style GYX Boosts
 */
export function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || COLORS.PRIMARY)
    .setFooter({ 
      text: options.footer || DEFAULT_FOOTER,
      iconURL: options.footerIcon
    })
    .setTimestamp(options.timestamp !== false ? new Date() : null);
  
  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.author) embed.setAuthor(options.author);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.fields) embed.addFields(options.fields);
  if (options.url) embed.setURL(options.url);
  
  return embed;
}

/**
 * Crée un embed de succès
 */
export function successEmbed(title, description, fields = []) {
  return createEmbed({
    title: `✅ ${title}`,
    description,
    color: COLORS.SUCCESS,
    fields
  });
}

/**
 * Crée un embed d'erreur
 */
export function errorEmbed(title, description) {
  return createEmbed({
    title: `❌ ${title}`,
    description,
    color: COLORS.ERROR
  });
}

/**
 * Crée un embed d'avertissement
 */
export function warningEmbed(title, description) {
  return createEmbed({
    title: `⚠️ ${title}`,
    description,
    color: COLORS.WARNING
  });
}

/**
 * Crée un embed d'information
 */
export function infoEmbed(title, description, fields = []) {
  return createEmbed({
    title: `ℹ️ ${title}`,
    description,
    color: COLORS.INFO,
    fields
  });
}

/**
 * Crée l'embed de bienvenue
 */
export function welcomeEmbed(member) {
  return createEmbed({
    description: `Bienvenue ${member} <:boost:1429082673241915422>\nPour toute question veuillez ouvrir un <#1428885835545317610> !`,
    color: COLORS.PRIMARY,
    thumbnail: member.user.displayAvatarURL({ dynamic: true })
  });
}

/**
 * Crée un embed de log pour la modération
 */
export function moderationLogEmbed(action, moderator, target, reason = 'Aucune raison fournie') {
  const actionEmojis = {
    ban: '🔨',
    unban: '🔓',
    kick: '👢',
    mute: '🔇',
    unmute: '🔊',
    warn: '⚠️'
  };
  
  return createEmbed({
    title: `${actionEmojis[action] || '📋'} ${action.toUpperCase()}`,
    color: COLORS.WARNING,
    fields: [
      {
        name: 'Modérateur',
        value: `${moderator.tag} (${moderator.id})`,
        inline: true
      },
      {
        name: 'Cible',
        value: typeof target === 'string' ? target : `${target.tag} (${target.id})`,
        inline: true
      },
      {
        name: 'Raison',
        value: reason,
        inline: false
      }
    ]
  });
}

/**
 * Crée un embed de ticket
 */
export function ticketEmbed(title, description, fields = []) {
  return createEmbed({
    title: `🎫 ${title}`,
    description,
    color: COLORS.PRIMARY,
    fields
  });
}

/**
 * Crée un embed de giveaway
 */
export function giveawayEmbed(prize, description, endTime, winners) {
  return createEmbed({
    title: '🎉 GIVEAWAY 🎉',
    description: `**Récompense:** ${prize}\n\n${description || 'Réagis avec 🎉 pour participer !'}`,
    color: COLORS.PRIMARY,
    fields: [
      {
        name: 'Nombre de gagnants',
        value: winners.toString(),
        inline: true
      },
      {
        name: 'Se termine',
        value: `<t:${Math.floor(endTime / 1000)}:R>`,
        inline: true
      }
    ],
    footer: `${DEFAULT_FOOTER} • Se termine le`
  });
}

/**
 * Crée un embed de résultats de giveaway
 */
export function giveawayWinnersEmbed(prize, winners) {
  const winnersList = winners.map(w => `<@${w}>`).join('\n');
  
  return createEmbed({
    title: '🎉 GIVEAWAY TERMINÉ 🎉',
    description: `**Récompense:** ${prize}\n\n**Gagnant(s):**\n${winnersList}`,
    color: COLORS.SUCCESS
  });
}

/**
 * Crée un embed personnalisé pour un panel de ticket
 */
export function createTicketPanelEmbed(panelData) {
  const embed = new EmbedBuilder()
    .setTitle(panelData.title || '🎫 Support GYX Boosts')
    .setDescription(panelData.description || 'Cliquez sur le bouton ci-dessous pour ouvrir un ticket.')
    .setColor(panelData.color ? parseInt(panelData.color.replace('#', ''), 16) : COLORS.PRIMARY)
    .setFooter({ text: panelData.footer || DEFAULT_FOOTER })
    .setTimestamp();
  
  if (panelData.banner) embed.setImage(panelData.banner);
  if (panelData.thumbnail) embed.setThumbnail(panelData.thumbnail);
  
  return embed;
}

export default {
  COLORS,
  createEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  welcomeEmbed,
  moderationLogEmbed,
  ticketEmbed,
  giveawayEmbed,
  giveawayWinnersEmbed,
  createTicketPanelEmbed
};
