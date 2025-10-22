# 📋 Liste des Commandes - Orxyn Bot

## 🔧 Commandes Admin

### `/setadminrole <role>`
Configure le rôle admin du bot.
- **Permissions**: Manage Guild OU rôle admin
- **Exemple**: `/setadminrole @Admin`

### `/setwelcomechannel <channel>`
Configure le salon de bienvenue.
- **Permissions**: Admin
- **Exemple**: `/setwelcomechannel #bienvenue`

### `/setwelcomerole <role>`
Configure le rôle attribué automatiquement aux nouveaux membres.
- **Permissions**: Admin
- **Exemple**: `/setwelcomerole @Membre`

### `/setlogchannel <channel>`
Configure le salon de logs du serveur.
- **Permissions**: Admin
- **Exemple**: `/setlogchannel #logs`

---

## 👮 Commandes de Modération

### `/ban <user> [reason]`
Bannir un utilisateur du serveur.
- **Permissions**: Admin + Ban Members
- **Exemple**: `/ban @user reason:Spam`

### `/unban <user_id>`
Débannir un utilisateur.
- **Permissions**: Admin + Ban Members
- **Exemple**: `/unban user_id:123456789`

### `/kick <user> [reason]`
Expulser un utilisateur du serveur.
- **Permissions**: Admin + Kick Members
- **Exemple**: `/kick @user reason:Comportement inapproprié`

### `/mute <user> <duration> [reason]`
Mute un utilisateur (utilise le timeout Discord).
- **Permissions**: Admin + Moderate Members
- **Durée**: Format naturel (ex: 5m, 1h, 1d)
- **Maximum**: 28 jours
- **Exemple**: `/mute @user duration:1h reason:Spam`

### `/unmute <user>`
Retire le mute d'un utilisateur.
- **Permissions**: Admin + Moderate Members
- **Exemple**: `/unmute @user`

### `/warn <user> <reason>`
Avertir un utilisateur.
- **Permissions**: Admin + Moderate Members
- **Exemple**: `/warn @user reason:Langage inapproprié`

### `/warnings <user>`
Voir les avertissements d'un utilisateur.
- **Permissions**: Admin + Moderate Members
- **Exemple**: `/warnings @user`

---

## 🎫 Commandes de Tickets

### `/ticket create <reason>`
Créer un nouveau ticket.
- **Permissions**: Tout le monde
- **Exemple**: `/ticket create reason:J'ai besoin d'aide`

### `/ticket close [reason]`
Fermer le ticket actuel.
- **Permissions**: Opener OU Staff
- **Exemple**: `/ticket close reason:Problème résolu`

### `/ticket claim`
Prendre en charge le ticket actuel.
- **Permissions**: Staff
- **Exemple**: `/ticket claim`

### `/ticket add <user>`
Ajouter un utilisateur au ticket.
- **Permissions**: Staff
- **Exemple**: `/ticket add @user`

### `/ticket remove <user>`
Retirer un utilisateur du ticket.
- **Permissions**: Staff
- **Exemple**: `/ticket remove @user`

### `/ticket rename <name>`
Renommer le ticket actuel.
- **Permissions**: Staff
- **Exemple**: `/ticket rename nouveau-nom`

### `/ticket ai`
Activer/désactiver l'IA pour le ticket actuel.
- **Permissions**: Staff
- **Exemple**: `/ticket ai`

---

## 🎛️ Commandes de Panels de Tickets

### `/ticketpanel create [options]`
Créer un nouveau panel de ticket personnalisable.
- **Permissions**: Admin
- **Options**:
  - `title`: Titre de l'embed
  - `description`: Description de l'embed
  - `color`: Couleur hex (ex: #FF0000)
  - `category`: Catégorie où créer les tickets
  - `staff_role`: Rôle staff avec accès aux tickets
- **Exemple**: `/ticketpanel create title:"Support GYX" color:#FF0000`

### `/ticketpanel edit <panel_id> [options]`
Éditer un panel existant.
- **Permissions**: Admin
- **Exemple**: `/ticketpanel edit panel_id:abc123 title:"Nouveau Titre"`

### `/ticketpanel send <panel_id> <channel>`
Envoyer un panel dans un salon.
- **Permissions**: Admin
- **Exemple**: `/ticketpanel send panel_id:abc123 channel:#support`

### `/ticketpanel list`
Lister tous les panels du serveur.
- **Permissions**: Admin
- **Exemple**: `/ticketpanel list`

### `/ticketpanel delete <panel_id>`
Supprimer un panel.
- **Permissions**: Admin
- **Exemple**: `/ticketpanel delete panel_id:abc123`

---

## 🎉 Commandes de Giveaways

### `/giveaway start <duration> <winners> <prize> [description] [channel]`
Démarrer un nouveau giveaway.
- **Permissions**: Admin
- **Paramètres**:
  - `duration`: Durée (ex: 2h, 1d, 30m)
  - `winners`: Nombre de gagnants
  - `prize`: Récompense
  - `description`: Description optionnelle
  - `channel`: Salon où poster (défaut: salon actuel)
- **Exemple**: `/giveaway start duration:2h winners:3 prize:"3x Nitro"`

### `/giveaway end <giveaway_id>`
Terminer un giveaway manuellement.
- **Permissions**: Admin
- **Exemple**: `/giveaway end giveaway_id:abc123`

### `/giveaway reroll <giveaway_id>`
Retirer des gagnants pour un giveaway.
- **Permissions**: Admin
- **Exemple**: `/giveaway reroll giveaway_id:abc123`

### `/giveaway list`
Lister les giveaways actifs.
- **Permissions**: Admin
- **Exemple**: `/giveaway list`

---

## 📊 Récapitulatif

- **Total**: 25+ commandes
- **Catégories**: 5 (Admin, Modération, Tickets, Panels, Giveaways)
- **Permissions**: Système de rôles admin flexible
- **Disponibilité**: Commandes globales (délai ~1h pour apparaître)

---

## 🔐 Permissions

### Système de Permissions

Le bot utilise un système de permissions en deux niveaux :

1. **Rôle Admin Configuré** : Défini avec `/setadminrole`
2. **Permission Discord** : Fallback sur `Manage Guild`

### Commandes Publiques

Seules ces commandes sont accessibles à tous :
- `/ticket create`

Toutes les autres commandes nécessitent des permissions admin.

---

## 💡 Conseils d'Utilisation

1. **Configurez d'abord le rôle admin** : `/setadminrole`
2. **Créez un panel de tickets** : `/ticketpanel create`
3. **Envoyez-le dans un salon** : `/ticketpanel send`
4. **Configurez les salons de logs** : `/setlogchannel`

**Note**: Les boutons de panel sont permanents et ne s'invalident jamais.

---

## 📚 Documentation Complète

Pour plus de détails, consultez `README.md`.
