/**
 * ORXYN - Bot Discord pour GYX Boosts
 * Bot de gestion de serveur avec système de tickets IA, modération et giveaways
 */

import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Partials, REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import logger from './services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Vérifier les variables d'environnement
if (!process.env.DISCORD_TOKEN) {
  logger.error('❌ DISCORD_TOKEN manquant dans .env');
  process.exit(1);
}

// Créer le client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

// Collection pour stocker les commandes
client.commands = new Collection();

/**
 * Charge toutes les commandes
 */
async function loadCommands() {
  const commands = [];
  const commandFolders = ['admin', 'moderation', 'tickets', 'ticketpanel', 'giveaways'];
  
  for (const folder of commandFolders) {
    const commandsPath = join(__dirname, 'commands', folder);
    const commandFiles = await fs.readdir(commandsPath);
    
    for (const file of commandFiles) {
      if (!file.endsWith('.js')) continue;
      
      const filePath = join(commandsPath, file);
      const command = await import(`file://${filePath}`);
      
      if ('data' in command.default && 'execute' in command.default) {
        client.commands.set(command.default.data.name, command.default);
        commands.push(command.default.data.toJSON());
        logger.debug(`✅ Commande chargée: ${command.default.data.name}`);
      } else {
        logger.warn(`⚠️ Commande invalide: ${file}`);
      }
    }
  }
  
  logger.info(`📋 ${commands.length} commande(s) chargée(s)`);
  return commands;
}

/**
 * Déploie les commandes slash globalement
 */
async function deployCommands(commands) {
  try {
    logger.info('🔄 Déploiement des commandes slash...');
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    
    logger.info('✅ Commandes slash déployées globalement');
  } catch (error) {
    logger.error('❌ Erreur lors du déploiement des commandes:', error);
  }
}

/**
 * Charge tous les événements
 */
async function loadEvents() {
  const eventsPath = join(__dirname, 'events');
  const eventFiles = await fs.readdir(eventsPath);
  
  for (const file of eventFiles) {
    if (!file.endsWith('.js')) continue;
    
    const filePath = join(eventsPath, file);
    const event = await import(`file://${filePath}`);
    
    if (event.default.once) {
      client.once(event.default.name, (...args) => event.default.execute(...args));
    } else {
      client.on(event.default.name, (...args) => event.default.execute(...args));
    }
    
    logger.debug(`✅ Événement chargé: ${event.default.name}`);
  }
  
  logger.info('📡 Événements chargés');
}

/**
 * Initialisation du bot
 */
async function init() {
  try {
    logger.info('🚀 Démarrage d\'Orxyn...');
    
    // Charger les événements
    await loadEvents();
    
    // Charger les commandes
    const commands = await loadCommands();
    
    // Se connecter à Discord
    await client.login(process.env.DISCORD_TOKEN);
    
    // Attendre que le bot soit prêt
    await new Promise(resolve => client.once('ready', resolve));
    
    // Déployer les commandes
    await deployCommands(commands);
    
  } catch (error) {
    logger.error('❌ Erreur fatale lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', error => {
  logger.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  logger.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Gestion de l'arrêt gracieux
process.on('SIGINT', async () => {
  logger.info('⚠️ SIGINT reçu, arrêt du bot...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('⚠️ SIGTERM reçu, arrêt du bot...');
  await client.destroy();
  process.exit(0);
});

// Exporter le client pour les services
export { client };

// Démarrer le bot
init();
