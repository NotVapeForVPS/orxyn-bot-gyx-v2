/**
 * Commande /ticket - Gestion complète des tickets
 */

import { SlashCommandBuilder } from 'discord.js';
import { createTicket, getTicketByChannel, closeTicket, claimTicket, toggleTicketAI, addUserToTicket, removeUserFromTicket } from '../../services/ticketService.js';
import { generateWelcomeMessage } from '../../services/mistralService.js';
import { readData } from '../../services/dataService.js';
import { successEmbed, errorEmbed, ticketEmbed } from '../../services/embedFormatter.js';
import logger from '../../services/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Gestion des tickets')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Créer un nouveau ticket')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Raison du ticket')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Fermer ce ticket')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Raison de la fermeture')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('claim')
        .setDescription('Prendre en charge ce ticket')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Ajouter un utilisateur au ticket')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('L\'utilisateur à ajouter')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Retirer un utilisateur du ticket')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('L\'utilisateur à retirer')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('rename')
        .setDescription('Renommer ce ticket')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Nouveau nom du ticket')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ai')
        .setDescription('Activer/désactiver l\'IA pour ce ticket')
    ),
  
  adminOnly: false, // create is public, others need to check permissions
  
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'create':
        await handleCreate(interaction);
        break;
      case 'close':
        await handleClose(interaction);
        break;
      case 'claim':
        await handleClaim(interaction);
        break;
      case 'add':
        await handleAdd(interaction);
        break;
      case 'remove':
        await handleRemove(interaction);
        break;
      case 'rename':
        await handleRename(interaction);
        break;
      case 'ai':
        await handleAI(interaction);
        break;
      default:
        await interaction.reply({
          embeds: [errorEmbed('Sous-commande inconnue.')],
          ephemeral: true
        });
    }
  }
};

async function handleCreate(interaction) {
  const reason = interaction.options.getString('reason') || 'Non spécifié';
  
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const config = await readData('config.json');
    
    const { channel, ticket } = await createTicket({
      guild: interaction.guild,
      opener: interaction.member,
      panelId: null,
      reason,
      categoryId: null,
      staffRoles: config.adminRoleId ? [config.adminRoleId] : [],
    });
    
    const embed = ticketEmbed(ticket);
    await channel.send({
      content: `<@${interaction.user.id}> Ticket créé !`,
      embeds: [embed],
    });
    
    try {
      const welcomeMsg = await generateWelcomeMessage(interaction.user.id, reason);
      await channel.send(welcomeMsg);
    } catch (error) {
      logger.error('Error sending AI welcome message:', error);
    }
    
    await interaction.editReply({
      content: `✅ Votre ticket a été créé : <#${channel.id}>`,
    });
    
    logger.info(`Ticket ${ticket.id} created by ${interaction.user.tag} via command`);
    
  } catch (error) {
    logger.error('Error creating ticket:', error);
    
    await interaction.editReply({
      content: '❌ Une erreur est survenue lors de la création du ticket.',
    });
  }
}

async function handleClose(interaction) {
  const reason = interaction.options.getString('reason') || 'Non spécifié';
  
  try {
    const ticket = await getTicketByChannel(interaction.channel.id);
    
    if (!ticket) {
      await interaction.reply({
        embeds: [errorEmbed('Cette commande doit être utilisée dans un ticket.')],
        ephemeral: true
      });
      return;
    }
    
    await interaction.deferReply();
    
    const { transcriptPath } = await closeTicket(ticket.id, reason, interaction.user);
    
    await interaction.editReply({
      embeds: [successEmbed(
        `Ce ticket sera supprimé dans 5 secondes.\n\nTranscript sauvegardé.`
      )]
    });
    
    try {
      await interaction.channel.send({
        content: '📄 **Transcript du ticket**',
        files: [transcriptPath],
      });
    } catch (error) {
      logger.warn('Could not send transcript file:', error);
    }
    
    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (error) {
        logger.error('Error deleting ticket channel:', error);
      }
    }, 5000);
  } catch (error) {
    logger.error('Error closing ticket:', error);
    
    const errorMessage = {
      embeds: [errorEmbed('Une erreur s\'est produite lors de la fermeture du ticket.')],
    };
    
    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply({...errorMessage, ephemeral: true});
    }
  }
}

async function handleClaim(interaction) {
  try {
    const ticket = await getTicketByChannel(interaction.channel.id);
    
    if (!ticket) {
      await interaction.reply({
        embeds: [errorEmbed('Cette commande doit être utilisée dans un ticket.')],
        ephemeral: true
      });
      return;
    }
    
    if (ticket.status === 'claimed') {
      await interaction.reply({
        embeds: [errorEmbed(`Ce ticket est déjà pris en charge par <@${ticket.claimedBy}>`)],
        ephemeral: true
      });
      return;
    }
    
    await claimTicket(ticket.id, interaction.user.id);
    
    await interaction.channel.setTopic(
      `Ticket • Claim par ${interaction.user.tag} • ID: ${ticket.id}`
    );
    
    await interaction.reply({
      embeds: [successEmbed(
        `✅ Ticket claim par ${interaction.user} !`
      )]
    });
  } catch (error) {
    logger.error('Error claiming ticket:', error);
    await interaction.reply({
      embeds: [errorEmbed('Une erreur s\'est produite.')],
      ephemeral: true
    });
  }
}

async function handleAdd(interaction) {
  const user = interaction.options.getUser('user');
  
  try {
    const ticket = await getTicketByChannel(interaction.channel.id);
    
    if (!ticket) {
      await interaction.reply({
        embeds: [errorEmbed('Cette commande doit être utilisée dans un ticket.')],
        ephemeral: true
      });
      return;
    }
    
    await addUserToTicket(ticket.id, interaction.channel, user);
    
    await interaction.reply({
      embeds: [successEmbed(
        `✅ ${user} a été ajouté au ticket.`
      )]
    });
  } catch (error) {
    logger.error('Error adding user to ticket:', error);
    await interaction.reply({
      embeds: [errorEmbed('Une erreur s\'est produite.')],
      ephemeral: true
    });
  }
}

async function handleRemove(interaction) {
  const user = interaction.options.getUser('user');
  
  try {
    const ticket = await getTicketByChannel(interaction.channel.id);
    
    if (!ticket) {
      await interaction.reply({
        embeds: [errorEmbed('Cette commande doit être utilisée dans un ticket.')],
        ephemeral: true
      });
      return;
    }
    
    await removeUserFromTicket(ticket.id, interaction.channel, user);
    
    await interaction.reply({
      embeds: [successEmbed(
        `✅ ${user} a été retiré du ticket.`
      )]
    });
  } catch (error) {
    logger.error('Error removing user from ticket:', error);
    await interaction.reply({
      embeds: [errorEmbed('Une erreur s\'est produite.')],
      ephemeral: true
    });
  }
}

async function handleRename(interaction) {
  const newName = interaction.options.getString('name');
  
  try {
    const ticket = await getTicketByChannel(interaction.channel.id);
    
    if (!ticket) {
      await interaction.reply({
        embeds: [errorEmbed('Cette commande doit être utilisée dans un ticket.')],
        ephemeral: true
      });
      return;
    }
    
    await interaction.channel.setName(newName);
    
    await interaction.reply({
      embeds: [successEmbed(
        `✅ Le ticket a été renommé en "${newName}".`
      )]
    });
  } catch (error) {
    logger.error('Error renaming ticket:', error);
    await interaction.reply({
      embeds: [errorEmbed('Une erreur s\'est produite.')],
      ephemeral: true
    });
  }
}

async function handleAI(interaction) {
  try {
    const ticket = await getTicketByChannel(interaction.channel.id);
    
    if (!ticket) {
      await interaction.reply({
        embeds: [errorEmbed('Cette commande doit être utilisée dans un ticket.')],
        ephemeral: true
      });
      return;
    }
    
    const updated = await toggleTicketAI(ticket.id, !ticket.aiEnabled);
    const status = updated.aiEnabled ? 'activée' : 'désactivée';
    
    await interaction.reply({
      embeds: [successEmbed(
        updated.aiEnabled 
          ? '✅ L\'IA a été activée pour ce ticket.'
          : '✅ L\'IA a été désactivée pour ce ticket.'
      )]
    });
  } catch (error) {
    logger.error('Error toggling ticket AI:', error);
    await interaction.reply({
      embeds: [errorEmbed('Une erreur s\'est produite.')],
      ephemeral: true
    });
  }
}
