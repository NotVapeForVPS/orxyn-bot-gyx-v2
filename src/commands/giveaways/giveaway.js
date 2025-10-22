/**
 * Commande /giveaway - Gestion complète des giveaways
 */

import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { parseDuration } from '../../utils/timeUtils.js';
import { createGiveaway, endGiveaway, rerollGiveaway, getGiveaway, getActiveGiveaways } from '../../services/giveawayService.js';
import { successEmbed, errorEmbed, infoEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Gestion des giveaways')
    .addSubcommand(subcommand =>
      subcommand
        .setName('start')
        .setDescription('Démarrer un nouveau giveaway')
        .addStringOption(option =>
          option
            .setName('duration')
            .setDescription('Durée du giveaway (ex: 2h, 1d, 30m)')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('winners')
            .setDescription('Nombre de gagnants')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(option =>
          option
            .setName('prize')
            .setDescription('Récompense du giveaway')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Description supplémentaire')
            .setRequired(false)
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Salon où poster le giveaway')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('end')
        .setDescription('Terminer un giveaway manuellement')
        .addStringOption(option =>
          option
            .setName('giveaway_id')
            .setDescription('ID du giveaway à terminer')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reroll')
        .setDescription('Retirer des gagnants pour un giveaway')
        .addStringOption(option =>
          option
            .setName('giveaway_id')
            .setDescription('ID du giveaway')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Lister les giveaways actifs')
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'start':
        await handleStart(interaction);
        break;
      case 'end':
        await handleEnd(interaction);
        break;
      case 'reroll':
        await handleReroll(interaction);
        break;
      case 'list':
        await handleList(interaction);
        break;
      default:
        await interaction.reply({
          embeds: [errorEmbed('Erreur', 'Sous-commande inconnue.')],
          ephemeral: true
        });
    }
  }
};

async function handleStart(interaction) {
  const durationStr = interaction.options.getString('duration');
  const winners = interaction.options.getInteger('winners');
  const prize = interaction.options.getString('prize');
  const description = interaction.options.getString('description');
  const channel = interaction.options.getChannel('channel') || interaction.channel;
  
  try {
    const duration = parseDuration(durationStr);
    
    await interaction.deferReply({ ephemeral: true });
    
    const { giveawayId, message } = await createGiveaway(
      channel,
      prize,
      description,
      duration,
      winners,
      interaction.user.id
    );
    
    await interaction.editReply({
      embeds: [successEmbed(
        'Giveaway créé',
        `Le giveaway a été créé dans ${channel} !\n[Voir le message](${message.url})`,
        [
          { name: 'ID', value: giveawayId, inline: true },
          { name: 'Récompense', value: prize, inline: true },
          { name: 'Gagnants', value: winners.toString(), inline: true },
          { name: 'Durée', value: durationStr, inline: true }
        ]
      )],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur lors de la création du giveaway:', error);
    const errorMessage = {
      embeds: [errorEmbed('Erreur', error.message || 'Une erreur s\'est produite.')],
      ephemeral: true
    };
    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

async function handleEnd(interaction) {
  const giveawayId = interaction.options.getString('giveaway_id');
  
  try {
    const giveaway = await getGiveaway(giveawayId);
    
    if (!giveaway) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Giveaway introuvable.')],
        ephemeral: true
      });
      return;
    }
    
    if (giveaway.guildId !== interaction.guild.id) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Ce giveaway n\'appartient pas à ce serveur.')],
        ephemeral: true
      });
      return;
    }
    
    if (giveaway.ended) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Ce giveaway est déjà terminé.')],
        ephemeral: true
      });
      return;
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    const { winners } = await endGiveaway(giveawayId, interaction.client);
    
    await interaction.editReply({
      embeds: [successEmbed(
        'Giveaway terminé',
        `Le giveaway **${giveaway.prize}** a été terminé.\n${winners.length} gagnant(s) tiré(s) au sort.`
      )],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur lors de la fin du giveaway:', error);
    const errorMessage = {
      embeds: [errorEmbed('Erreur', error.message || 'Une erreur s\'est produite.')],
      ephemeral: true
    };
    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

async function handleReroll(interaction) {
  const giveawayId = interaction.options.getString('giveaway_id');
  
  try {
    const giveaway = await getGiveaway(giveawayId);
    
    if (!giveaway) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Giveaway introuvable.')],
        ephemeral: true
      });
      return;
    }
    
    if (giveaway.guildId !== interaction.guild.id) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Ce giveaway n\'appartient pas à ce serveur.')],
        ephemeral: true
      });
      return;
    }
    
    if (!giveaway.ended) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Ce giveaway n\'est pas encore terminé.')],
        ephemeral: true
      });
      return;
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    const { winners } = await rerollGiveaway(giveawayId, interaction.client);
    
    await interaction.editReply({
      embeds: [successEmbed(
        'Giveaway reroll',
        `Les gagnants ont été retirés !\n${winners.length} nouveau(x) gagnant(s).`
      )],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur lors du reroll:', error);
    const errorMessage = {
      embeds: [errorEmbed('Erreur', error.message || 'Une erreur s\'est produite.')],
      ephemeral: true
    };
    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

async function handleList(interaction) {
  try {
    const giveaways = await getActiveGiveaways(interaction.guild.id);
    
    if (giveaways.length === 0) {
      await interaction.reply({
        embeds: [infoEmbed(
          'Aucun giveaway actif',
          'Il n\'y a aucun giveaway actif sur ce serveur.'
        )],
        ephemeral: true
      });
      return;
    }
    
    const giveawaysList = giveaways.map(g => {
      const endDate = new Date(g.endTime);
      return `**${g.id}**\n└ Récompense: ${g.prize}\n└ Gagnants: ${g.winnersCount}\n└ Fin: <t:${Math.floor(g.endTime / 1000)}:R>\n└ Salon: <#${g.channelId}>`;
    }).join('\n\n');
    
    await interaction.reply({
      embeds: [infoEmbed(
        'Giveaways actifs',
        giveawaysList,
        [
          {
            name: '📊 Total',
            value: `${giveaways.length} giveaway(s) actif(s)`,
            inline: false
          }
        ]
      )],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur lors de la liste des giveaways:', error);
    await interaction.reply({
      embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite.')],
      ephemeral: true
    });
  }
}
