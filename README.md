# 🤖 ORXYN - Bot Discord pour GYX Boosts

Bot Discord complet et moderne pour **GYX Boosts**, avec système de tickets intelligent (IA Mistral), modération automatique, giveaways et bien plus encore.

## ✨ Fonctionnalités

### 🎫 Système de Tickets Avancé
- **Panels personnalisables** : Créez des panels de tickets avec embeds entièrement personnalisables (titre, couleur, image, boutons)
- **IA Mistral intégrée** : Réponses automatiques intelligentes dans les tickets
- **Gestion complète** : Claim, ajout/retrait d'utilisateurs, renommage, transcripts automatiques
- **Boutons permanents** : Les boutons ne s'invalident jamais

### 👮 Modération
- **Commandes** : `/ban`, `/unban`, `/kick`, `/mute`, `/unmute`, `/warn`, `/warnings`
- **Modération automatique** : Détection et suppression automatique des liens interdits et contenus inappropriés
- **Timeout Discord** : Utilise l'API officielle Discord pour les mutes
- **Logs détaillés** : Toutes les actions sont enregistrées

### 🎉 Giveaways
- **Gestion complète** : Création, fin automatique, reroll des gagnants
- **Planification** : Les giveaways se terminent automatiquement
- **Embeds stylés** : Design moderne aux couleurs de GYX Boosts

### 🔧 Administration
- Configuration flexible des rôles et salons
- Accueil automatique des nouveaux membres avec attribution de rôle
- Système de logs centralisé

## 🚀 Installation

### Prérequis
- **Node.js v21+**
- Compte Discord Developer

### 1. Créer une Application Discord

1. Rendez-vous sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquez sur **New Application**
3. Donnez un nom à votre bot (ex: Orxyn)
4. Allez dans l'onglet **Bot**
5. Cliquez sur **Add Bot**
6. Activez les **Privileged Gateway Intents** :
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
7. Copiez le **Token** du bot

### 2. Inviter le Bot

1. Allez dans l'onglet **OAuth2 > URL Generator**
2. Sélectionnez les **scopes** :
   - ✅ `bot`
   - ✅ `applications.commands`
3. Sélectionnez les **permissions** :
   - ✅ Manage Roles
   - ✅ Manage Channels
   - ✅ Kick Members
   - ✅ Ban Members
   - ✅ Send Messages
   - ✅ Manage Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Add Reactions
   - ✅ Moderate Members (Timeout)
4. Copiez l'URL générée et invitez le bot sur votre serveur

### 3. Configuration du Projet

```bash
# Cloner le dépôt
git clone <votre-repo>
cd orxyn-bot

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
```

### 4. Configuration du fichier .env

Éditez le fichier `.env` :

```env
# OBLIGATOIRE - Token de votre bot Discord
DISCORD_TOKEN=votre_token_ici

# OPTIONNEL - Clé API Mistral (une clé par défaut est fournie)
MISTRAL_API_KEY=mlCfO3YxF3CbwpDT2uPrQ0VCoAUV5cVq

# Environnement
NODE_ENV=production

# Mode de modération local (recommandé: true)
MODERATION_LOCAL_MODE=true
```

### 5. Configuration Initiale

Éditez `data/config.json` avec vos IDs de salon et rôles :

```json
{
  "adminRoleId": "",
  "welcomeChannelId": "1428885835545317610",
  "welcomeRoleId": "1428883290668142612",
  "logChannelId": ""
}
```

### 6. Lancement

```bash
# Mode production
npm start

# Mode développement
npm run dev
```

Le bot devrait maintenant être en ligne ! ✅

## 📚 Guide d'Utilisation

### Configuration Initiale

1. **Configurer le rôle admin** (si vous voulez utiliser un rôle spécifique) :
   ```
   /setadminrole @RoleAdmin
   ```

2. **Configurer le salon de bienvenue** :
   ```
   /setwelcomechannel #bienvenue
   ```

3. **Configurer le rôle de bienvenue** :
   ```
   /setwelcomerole @Membre
   ```

4. **Configurer le salon de logs** :
   ```
   /setlogchannel #logs
   ```

### Système de Tickets

#### Créer un Panel de Ticket

```bash
# Création basique
/ticketpanel create title:"Support GYX" description:"Cliquez pour ouvrir un ticket"

# Avec options avancées
/ticketpanel create \
  title:"🎫 Support Premium" \
  description:"Notre équipe est là pour vous aider !" \
  color:#FF0000 \
  category:@CatégorieTickets \
  staff_role:@Staff
```

#### Envoyer un Panel

```bash
/ticketpanel send panel_id:abc123 channel:#support
```

#### Gérer les Panels

```bash
# Lister tous les panels
/ticketpanel list

# Éditer un panel
/ticketpanel edit panel_id:abc123 title:"Nouveau Titre"

# Supprimer un panel
/ticketpanel delete panel_id:abc123
```

#### Gestion des Tickets

Les utilisateurs peuvent ouvrir des tickets via les boutons ou :
```bash
/ticket create reason:"J'ai besoin d'aide"
```

**Staff uniquement** :
```bash
# Prendre en charge un ticket
/ticket claim

# Ajouter/retirer un utilisateur
/ticket add @user
/ticket remove @user

# Renommer le ticket
/ticket rename nouveau-nom

# Activer/désactiver l'IA
/ticket ai

# Fermer le ticket
/ticket close reason:"Problème résolu"
```

### Modération

```bash
# Bannir un utilisateur
/ban @user reason:"Spam"

# Débannir
/unban user_id:123456789

# Kick
/kick @user reason:"Comportement inapproprié"

# Mute (utilise le timeout Discord)
/mute @user duration:1h reason:"Spam"

# Unmute
/unmute @user

# Avertir
/warn @user reason:"Langage inapproprié"

# Voir les avertissements
/warnings @user
```

### Giveaways

```bash
# Créer un giveaway
/giveaway start \
  duration:2h \
  winners:3 \
  prize:"3x Nitro" \
  description:"Réagissez avec 🎉 pour participer !" \
  channel:#giveaways

# Terminer manuellement
/giveaway end giveaway_id:abc123

# Retirer des gagnants
/giveaway reroll giveaway_id:abc123

# Lister les giveaways actifs
/giveaway list
```

## 🤖 IA Mistral

### Fonctionnement

Le bot utilise l'API Mistral AI pour générer des réponses intelligentes dans les tickets :

- **Accueil automatique** : Dès l'ouverture d'un ticket, l'IA accueille l'utilisateur
- **Réponses contextuelles** : L'IA comprend le contexte et adapte ses réponses
- **Mentions intelligentes** : L'IA peut mentionner des utilisateurs si nécessaire
- **Pause automatique** : Quand un staff répond, l'IA se met en pause

### Mode Mock

Si vous n'avez pas de clé Mistral ou si l'API est inaccessible, le bot fonctionne en **mode mock** avec des réponses prédéfinies.

### Configuration

La clé par défaut est fournie dans `.env.example`. Pour utiliser votre propre clé :

1. Obtenez une clé sur [Mistral AI](https://console.mistral.ai/)
2. Remplacez `MISTRAL_API_KEY` dans `.env`

### Personnalisation des Prompts

Éditez `/prompts/prompt.txt` pour personnaliser le comportement de l'IA :
- Ton et style de réponse
- Informations sur GYX Boosts
- Instructions spécifiques

## 🔒 Sécurité

### Permissions

- Toutes les commandes administratives nécessitent le **rôle admin configuré** OU la permission **Manage Guild**
- Les commandes de modération nécessitent les permissions Discord appropriées
- Les tickets sont privés (seul l'opener et le staff ont accès)

### Données

- **Aucune base de données externe** : Tout est stocké en JSON local
- **Transcripts** : Tous les tickets sont archivés dans `/data/transcripts/`
- **Logs** : Toutes les actions sont enregistrées dans `/data/moderation_logs.json`

### Modération Automatique

Le bot analyse automatiquement les messages et bloque :
- ✅ Liens Discord non autorisés
- ✅ Liens externes suspects
- ✅ Spam et flood
- ✅ Contenu inapproprié (selon l'analyse locale)

**Important** : Le système privilégie la tolérance pour éviter les faux positifs.

## 📁 Structure du Projet

```
orxyn-bot/
├── src/
│   ├── commands/          # Toutes les commandes slash
│   │   ├── admin/         # Configuration du serveur
│   │   ├── moderation/    # Commandes de modération
│   │   ├── tickets/       # Gestion des tickets
│   │   ├── ticketpanel/   # Gestion des panels
│   │   └── giveaways/     # Gestion des giveaways
│   ├── events/            # Événements Discord
│   ├── services/          # Services métier
│   │   ├── dataService.js        # Gestion des données JSON
│   │   ├── embedFormatter.js     # Création d'embeds stylés
│   │   ├── mistralService.js     # Intégration IA Mistral
│   │   ├── moderationService.js  # Modération automatique
│   │   ├── ticketService.js      # Gestion des tickets
│   │   ├── ticketPanelService.js # Gestion des panels
│   │   ├── giveawayService.js    # Gestion des giveaways
│   │   └── logger.js             # Logs Winston
│   ├── utils/             # Utilitaires
│   └── index.js           # Point d'entrée principal
├── data/                  # Données JSON
│   ├── config.json
│   ├── tickets.json
│   ├── ticket_panels.json
│   ├── giveaways.json
│   ├── moderation_logs.json
│   └── transcripts/
├── prompts/               # Prompts pour l'IA
│   ├── prompt.txt
│   └── moderation_prompt.txt
├── logs/                  # Fichiers de logs
├── .env                   # Configuration (à créer)
├── .env.example           # Template de configuration
├── package.json
└── README.md
```

## 🎨 Personnalisation

### Couleurs et Style

Éditez `/src/services/embedFormatter.js` :

```javascript
export const COLORS = {
  PRIMARY: 0xFF0000,    // Rouge principal
  SUCCESS: 0x00FF00,    // Vert succès
  ERROR: 0xFF0000,      // Rouge erreur
  // ...
};
```

### Messages de Bienvenue

Éditez la fonction `welcomeEmbed` dans `/src/services/embedFormatter.js`

### Prompts IA

- **Tickets** : `/prompts/prompt.txt`
- **Modération** : `/prompts/moderation_prompt.txt`

## 🐛 Dépannage

### Le bot ne se connecte pas

- ✅ Vérifiez que `DISCORD_TOKEN` est correct dans `.env`
- ✅ Vérifiez que les intents sont activés dans le Developer Portal
- ✅ Consultez `/logs/error.log`

### Les commandes n'apparaissent pas

- Les commandes sont déployées **globalement** et peuvent prendre jusqu'à 1 heure pour apparaître
- Redémarrez Discord (Ctrl+R)
- Vérifiez les logs du bot

### L'IA ne répond pas

- Vérifiez `/logs/mistral.log`
- Le bot fonctionne en mode mock si la clé Mistral est invalide
- Testez avec `/ticket ai` pour activer/désactiver l'IA

### Erreurs de permissions

- Vérifiez que le bot a les bonnes permissions sur le serveur
- Le rôle du bot doit être **au-dessus** des rôles qu'il doit gérer
- Configurez `/setadminrole` si nécessaire

## 📊 Logs

Les logs sont disponibles dans `/logs/` :

- `bot.log` : Logs généraux
- `error.log` : Erreurs uniquement
- `mistral.log` : Logs de l'IA Mistral
- `moderation.log` : Actions de modération

## 🔄 Mise à Jour

```bash
# Arrêter le bot
Ctrl+C

# Mettre à jour le code
git pull

# Installer les nouvelles dépendances
npm install

# Redémarrer
npm start
```

## ⚠️ Limitations

- **Persistance** : Fichiers JSON uniquement (pas de database)
- **Scalabilité** : Adapté pour des serveurs de taille petite à moyenne
- **IA** : Dépend de la disponibilité de l'API Mistral (mode fallback inclus)
- **Timeout Discord** : Maximum 28 jours pour les mutes

## 🤝 Support

- **Discord officiel** : [discord.gg/gyx-engine](https://discord.gg/gyx-engine)
- **Issues** : Ouvrez une issue sur GitHub
- **Documentation Mistral** : [docs.mistral.ai](https://docs.mistral.ai/)

## 📝 License

MIT License - Libre d'utilisation et de modification

## 🎯 Fonctionnalités Futures Possibles

- [ ] Système de niveaux et XP
- [ ] Commandes de musique
- [ ] Intégration avec des APIs externes
- [ ] Dashboard web
- [ ] Support multi-langues

---

**Développé avec ❤️ pour GYX Boosts**

*Partenaire Officiel GYX Engine*
