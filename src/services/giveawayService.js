/**
 * Service de gestion des giveaways
 * Gère la création, le tirage au sort et la planification des giveaways
 */

import { v4 as uuidv4 } from 'uuid';
import schedule from 'node-schedule';
import { readData, writeData, updateData } from './dataService.js';
import { giveawayEmbed, giveawayWinnersEmbed } from './embedFormatter.js';
import logger from './logger.js';

// Map des jobs planifiés
const scheduledJobs = new Map();

/**
 * Crée un nouveau giveaway
 */
export async function createGiveaway(channel, prize, description, duration, winnersCount, hostedBy) {
  try {
    const giveawayId = uuidv4();
    const endTime = Date.now() + duration;
    
    // Créer l'embed
    const embed = giveawayEmbed(prize, description, endTime, winnersCount);
    
    // Envoyer le message
    const message = await channel.send({ embeds: [embed] });
    
    // Ajouter la réaction
    await message.react('🎉');
    
    // Sauvegarder le giveaway
    const giveaways = await readData('giveaways.json');
    giveaways[giveawayId] = {
      id: giveawayId,
      guildId: channel.guild.id,
      channelId: channel.id,
      messageId: message.id,
      prize,
      description: description || '',
      winnersCount,
      hostedBy,
      endTime,
      ended: false,
      winnersUsers: []
    };
    
    await writeData('giveaways.json', giveaways);
    
    // Planifier la fin du giveaway
    scheduleGiveawayEnd(giveawayId, endTime);
    
    logger.info(`Giveaway ${giveawayId} créé: ${prize} (${winnersCount} gagnant(s), fin: ${new Date(endTime).toISOString()})`);
    
    return { giveawayId, message };
    
  } catch (error) {
    logger.error('Erreur lors de la création du giveaway:', error);
    throw error;
  }
}

/**
 * Termine un giveaway et tire au sort les gagnants
 */
export async function endGiveaway(giveawayId, client) {
  try {
    const giveaways = await readData('giveaways.json');
    const giveaway = giveaways[giveawayId];
    
    if (!giveaway) {
      throw new Error('Giveaway non trouvé');
    }
    
    if (giveaway.ended) {
      throw new Error('Giveaway déjà terminé');
    }
    
    // Récupérer le message
    const guild = await client.guilds.fetch(giveaway.guildId);
    const channel = await guild.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId);
    
    // Récupérer les participants (réactions 🎉)
    const reaction = message.reactions.cache.get('🎉');
    if (!reaction) {
      throw new Error('Aucune réaction trouvée');
    }
    
    const users = await reaction.users.fetch();
    const participants = users.filter(u => !u.bot).map(u => u.id);
    
    if (participants.length === 0) {
      // Aucun participant
      await channel.send(`❌ Le giveaway pour **${giveaway.prize}** s'est terminé sans participant !`);
      
      giveaway.ended = true;
      await writeData('giveaways.json', giveaways);
      
      return { winners: [] };
    }
    
    // Tirer au sort les gagnants
    const winnersCount = Math.min(giveaway.winnersCount, participants.length);
    const winners = [];
    
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    for (let i = 0; i < winnersCount; i++) {
      winners.push(shuffled[i]);
    }
    
    // Mettre à jour le giveaway
    giveaway.ended = true;
    giveaway.winnersUsers = winners;
    await writeData('giveaways.json', giveaways);
    
    // Annoncer les gagnants
    const embed = giveawayWinnersEmbed(giveaway.prize, winners);
    await channel.send({ embeds: [embed] });
    
    // Féliciter les gagnants
    const winnersMentions = winners.map(w => `<@${w}>`).join(', ');
    await channel.send(`🎉 Félicitations ${winnersMentions} ! Vous avez gagné **${giveaway.prize}** !`);
    
    logger.info(`Giveaway ${giveawayId} terminé: ${winners.length} gagnant(s)`);
    
    // Annuler le job planifié
    if (scheduledJobs.has(giveawayId)) {
      scheduledJobs.get(giveawayId).cancel();
      scheduledJobs.delete(giveawayId);
    }
    
    return { winners };
    
  } catch (error) {
    logger.error('Erreur lors de la fin du giveaway:', error);
    throw error;
  }
}

/**
 * Reroll les gagnants d'un giveaway
 */
export async function rerollGiveaway(giveawayId, client) {
  try {
    const giveaways = await readData('giveaways.json');
    const giveaway = giveaways[giveawayId];
    
    if (!giveaway) {
      throw new Error('Giveaway non trouvé');
    }
    
    if (!giveaway.ended) {
      throw new Error('Le giveaway n\'est pas encore terminé');
    }
    
    // Récupérer le message
    const guild = await client.guilds.fetch(giveaway.guildId);
    const channel = await guild.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId);
    
    // Récupérer les participants
    const reaction = message.reactions.cache.get('🎉');
    if (!reaction) {
      throw new Error('Aucune réaction trouvée');
    }
    
    const users = await reaction.users.fetch();
    const participants = users.filter(u => !u.bot).map(u => u.id);
    
    if (participants.length === 0) {
      throw new Error('Aucun participant');
    }
    
    // Nouveau tirage au sort
    const winnersCount = Math.min(giveaway.winnersCount, participants.length);
    const winners = [];
    
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    for (let i = 0; i < winnersCount; i++) {
      winners.push(shuffled[i]);
    }
    
    // Mettre à jour
    giveaway.winnersUsers = winners;
    await writeData('giveaways.json', giveaways);
    
    // Annoncer les nouveaux gagnants
    const winnersMentions = winners.map(w => `<@${w}>`).join(', ');
    await channel.send(`🔄 Nouveaux gagnants pour **${giveaway.prize}** : ${winnersMentions} ! 🎉`);
    
    logger.info(`Giveaway ${giveawayId} reroll: ${winners.length} nouveau(x) gagnant(s)`);
    
    return { winners };
    
  } catch (error) {
    logger.error('Erreur lors du reroll du giveaway:', error);
    throw error;
  }
}

/**
 * Planifie la fin d'un giveaway
 */
function scheduleGiveawayEnd(giveawayId, endTime) {
  const endDate = new Date(endTime);
  
  const job = schedule.scheduleJob(endDate, async () => {
    logger.info(`Fin automatique du giveaway ${giveawayId}`);
    try {
      // Le client sera récupéré via le contexte global
      const { client } = await import('../index.js');
      await endGiveaway(giveawayId, client);
    } catch (error) {
      logger.error(`Erreur lors de la fin automatique du giveaway ${giveawayId}:`, error);
    }
  });
  
  scheduledJobs.set(giveawayId, job);
  logger.debug(`Giveaway ${giveawayId} planifié pour ${endDate.toISOString()}`);
}

/**
 * Charge et planifie tous les giveaways actifs au démarrage
 */
export async function loadActiveGiveaways(client) {
  try {
    const giveaways = await readData('giveaways.json');
    const now = Date.now();
    
    for (const [id, giveaway] of Object.entries(giveaways)) {
      if (!giveaway.ended && giveaway.endTime > now) {
        scheduleGiveawayEnd(id, giveaway.endTime);
        logger.info(`Giveaway ${id} rechargé et planifié`);
      } else if (!giveaway.ended && giveaway.endTime <= now) {
        // Giveaway qui aurait dû se terminer
        logger.info(`Fin immédiate du giveaway ${id} (déjà expiré)`);
        try {
          await endGiveaway(id, client);
        } catch (error) {
          logger.error(`Erreur lors de la fin du giveaway expiré ${id}:`, error);
        }
      }
    }
    
    logger.info(`${scheduledJobs.size} giveaway(s) actif(s) chargé(s)`);
  } catch (error) {
    logger.error('Erreur lors du chargement des giveaways actifs:', error);
  }
}

/**
 * Récupère un giveaway par son ID
 */
export async function getGiveaway(giveawayId) {
  const giveaways = await readData('giveaways.json');
  return giveaways[giveawayId];
}

/**
 * Récupère tous les giveaways actifs d'une guilde
 */
export async function getActiveGiveaways(guildId) {
  const giveaways = await readData('giveaways.json');
  return Object.values(giveaways).filter(g => g.guildId === guildId && !g.ended);
}

export default {
  createGiveaway,
  endGiveaway,
  rerollGiveaway,
  loadActiveGiveaways,
  getGiveaway,
  getActiveGiveaways
};
