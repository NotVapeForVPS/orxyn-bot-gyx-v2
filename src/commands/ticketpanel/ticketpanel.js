/**
 * Commande /ticketpanel - Gestion complète des panels de tickets
 */

import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { createPanel, updatePanel, deletePanel, getPanel, getGuildPanels, sendPanel } from '../../services/ticketPanelService.js';
import { successEmbed, errorEmbed, infoEmbed } from '../../services/embedFormatter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Gestion des panels de tickets')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Créer un nouveau panel de ticket personnalisable')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Titre de l\'embed')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Description de l\'embed')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('color')
            .setDescription('Couleur de l\'embed (format hex, ex: #FF0000)')
            .setRequired(false)
        )
        .addChannelOption(option =>
          option
            .setName('category')
            .setDescription('Catégorie où créer les tickets')
            .setRequired(false)
        )
        .addRoleOption(option =>
          option
            .setName('staff_role')
            .setDescription('Rôle staff qui aura accès aux tickets')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Éditer un panel existant')
        .addStringOption(option =>
          option
            .setName('panel_id')
            .setDescription('ID du panel à éditer')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Nouveau titre')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Nouvelle description')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('color')
            .setDescription('Nouvelle couleur (format hex)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('send')
        .setDescription('Envoyer un panel dans un salon')
        .addStringOption(option =>
          option
            .setName('panel_id')
            .setDescription('ID du panel à envoyer')
            .setRequired(true)
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Salon où envoyer le panel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Lister tous les panels de ce serveur')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Supprimer un panel')
        .addStringOption(option =>
          option
            .setName('panel_id')
            .setDescription('ID du panel à supprimer')
            .setRequired(true)
        )
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'create':
        await handleCreate(interaction);
        break;
      case 'edit':
        await handleEdit(interaction);
        break;
      case 'send':
        await handleSend(interaction);
        break;
      case 'list':
        await handleList(interaction);
        break;
      case 'delete':
        await handleDelete(interaction);
        break;
      default:
        await interaction.reply({
          embeds: [errorEmbed('Erreur', 'Sous-commande inconnue.')],
          ephemeral: true
        });
    }
  }
};

async function handleCreate(interaction) {
  try {
    const title = interaction.options.getString('title') || '🎫 Support GYX Boosts';
    const description = interaction.options.getString('description') || 'Cliquez sur le bouton ci-dessous pour ouvrir un ticket.';
    const color = interaction.options.getString('color') || '#FF0000';
    const category = interaction.options.getChannel('category');
    const staffRole = interaction.options.getRole('staff_role');
    
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Format de couleur invalide. Utilisez le format hex (#FF0000).')],
        ephemeral: true
      });
      return;
    }
    
    const panelData = {
      title,
      description,
      color,
      categoryId: category?.id || null,
      staffRoles: staffRole ? [staffRole.id] : [],
      buttonText: '📩 Ouvrir un Ticket',
      buttonEmoji: '📩',
      buttonStyle: 'Primary',
      footer: 'Partenaire Officiel GYX Engine'
    };
    
    const { panelId, panel } = await createPanel(interaction.guild.id, panelData);
    
    await interaction.reply({
      embeds: [successEmbed(
        'Panel créé',
        `Le panel **${panelId}** a été créé avec succès !\n\nUtilisez \`/ticketpanel send ${panelId} #salon\` pour l'envoyer dans un salon.\nUtilisez \`/ticketpanel edit ${panelId}\` pour le modifier.`,
        [
          { name: 'ID du panel', value: panelId, inline: false },
          { name: 'Titre', value: title, inline: true },
          { name: 'Couleur', value: color, inline: true }
        ]
      )],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur lors de la création du panel:', error);
    await interaction.reply({
      embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite lors de la création du panel.')],
      ephemeral: true
    });
  }
}

async function handleEdit(interaction) {
  const panelId = interaction.options.getString('panel_id');
  
  try {
    const panel = await getPanel(panelId);
    
    if (!panel) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Panel introuvable.')],
        ephemeral: true
      });
      return;
    }
    
    if (panel.guildId !== interaction.guild.id) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Ce panel n\'appartient pas à ce serveur.')],
        ephemeral: true
      });
      return;
    }
    
    const updates = {};
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color');
    
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (color) {
      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        await interaction.reply({
          embeds: [errorEmbed('Erreur', 'Format de couleur invalide.')],
          ephemeral: true
        });
        return;
      }
      updates.color = color;
    }
    
    if (Object.keys(updates).length === 0) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Aucune modification spécifiée.')],
        ephemeral: true
      });
      return;
    }
    
    await updatePanel(panelId, updates);
    
    await interaction.reply({
      embeds: [successEmbed(
        'Panel mis à jour',
        `Le panel **${panelId}** a été mis à jour.\n\nRe-envoyez-le avec \`/ticketpanel send ${panelId} #salon\` pour appliquer les modifications.`
      )],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur lors de l\'édition du panel:', error);
    await interaction.reply({
      embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite.')],
      ephemeral: true
    });
  }
}

async function handleSend(interaction) {
  const panelId = interaction.options.getString('panel_id');
  const channel = interaction.options.getChannel('channel');
  
  try {
    const panel = await getPanel(panelId);
    
    if (!panel) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Panel introuvable.')],
        ephemeral: true
      });
      return;
    }
    
    if (panel.guildId !== interaction.guild.id) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Ce panel n\'appartient pas à ce serveur.')],
        ephemeral: true
      });
      return;
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    const message = await sendPanel(channel, panelId);
    
    await interaction.editReply({
      embeds: [successEmbed(
        'Panel envoyé',
        `Le panel a été envoyé dans ${channel}.\n[Voir le message](${message.url})`
      )],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du panel:', error);
    const errorMessage = {
      embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite lors de l\'envoi du panel.')],
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
    const panels = await getGuildPanels(interaction.guild.id);
    
    if (panels.length === 0) {
      await interaction.reply({
        embeds: [infoEmbed(
          'Aucun panel',
          'Ce serveur n\'a aucun panel de ticket.\n\nUtilisez `/ticketpanel create` pour en créer un.'
        )],
        ephemeral: true
      });
      return;
    }
    
    const panelsList = panels.map(p => {
      const channelInfo = p.channelId ? `<#${p.channelId}>` : 'Non envoyé';
      return `**${p.id}**\n└ Titre: ${p.title}\n└ Salon: ${channelInfo}`;
    }).join('\n\n');
    
    await interaction.reply({
      embeds: [infoEmbed(
        'Panels de tickets',
        panelsList,
        [
          {
            name: '📊 Total',
            value: `${panels.length} panel(s)`,
            inline: false
          }
        ]
      )],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur lors de la liste des panels:', error);
    await interaction.reply({
      embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite.')],
      ephemeral: true
    });
  }
}

async function handleDelete(interaction) {
  const panelId = interaction.options.getString('panel_id');
  
  try {
    const panel = await getPanel(panelId);
    
    if (!panel) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Panel introuvable.')],
        ephemeral: true
      });
      return;
    }
    
    if (panel.guildId !== interaction.guild.id) {
      await interaction.reply({
        embeds: [errorEmbed('Erreur', 'Ce panel n\'appartient pas à ce serveur.')],
        ephemeral: true
      });
      return;
    }
    
    await deletePanel(panelId);
    
    if (panel.messageId && panel.channelId) {
      try {
        const channel = interaction.guild.channels.cache.get(panel.channelId);
        if (channel) {
          const message = await channel.messages.fetch(panel.messageId).catch(() => null);
          if (message) {
            await message.delete();
          }
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du message du panel:', error);
      }
    }
    
    await interaction.reply({
      embeds: [successEmbed(
        'Panel supprimé',
        `Le panel **${panelId}** a été supprimé.`
      )],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du panel:', error);
    await interaction.reply({
      embeds: [errorEmbed('Erreur', 'Une erreur s\'est produite.')],
      ephemeral: true
    });
  }
}
