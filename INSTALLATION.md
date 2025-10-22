# 🚀 Installation Rapide - Orxyn Bot

## Installation en 5 minutes

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer l'environnement

Créez un fichier `.env` :

```bash
cp .env.example .env
```

Éditez `.env` et remplacez `your_discord_bot_token_here` par votre token Discord :

```env
DISCORD_TOKEN=VOTRE_TOKEN_ICI
MISTRAL_API_KEY=mlCfO3YxF3CbwpDT2uPrQ0VCoAUV5cVq
NODE_ENV=production
MODERATION_LOCAL_MODE=true
```

### 3. Lancer le bot

```bash
npm start
```

C'est tout ! Le bot est maintenant en ligne 🎉

---

## Obtenir votre Token Discord

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquez sur **New Application**
3. Donnez un nom à votre application (ex: Orxyn)
4. Allez dans **Bot** > **Add Bot**
5. **Copiez le Token** et collez-le dans votre `.env`
6. Activez les **Privileged Gateway Intents** :
   - ✅ Server Members Intent
   - ✅ Message Content Intent

---

## Inviter le bot sur votre serveur

1. Dans le Developer Portal, allez dans **OAuth2** > **URL Generator**
2. Sélectionnez :
   - Scopes: `bot` + `applications.commands`
   - Permissions Bot:
     - Manage Roles
     - Manage Channels
     - Kick Members
     - Ban Members
     - Moderate Members
     - Send Messages
     - Manage Messages
     - Embed Links
     - Read Message History
     - Add Reactions
3. Copiez l'URL et ouvrez-la dans votre navigateur
4. Sélectionnez votre serveur et autorisez le bot

---

## Configuration Initiale (Optionnel)

Après avoir lancé le bot, vous pouvez configurer :

```bash
# Salon de bienvenue
/setwelcomechannel #bienvenue

# Rôle de bienvenue
/setwelcomerole @Membre

# Rôle admin
/setadminrole @Admin

# Salon de logs
/setlogchannel #logs
```

---

## Problèmes Courants

### Le bot ne se connecte pas
- Vérifiez que le token dans `.env` est correct
- Vérifiez que les intents sont activés dans le Developer Portal

### Les commandes n'apparaissent pas
- Les commandes globales peuvent prendre jusqu'à 1h pour apparaître
- Redémarrez Discord (Ctrl+R)
- Vérifiez les logs du bot

### L'IA ne répond pas
- Le bot fonctionne en mode mock si la clé Mistral est invalide
- Vérifiez `/logs/mistral.log` pour plus d'infos

---

## Support

- Discord : [discord.gg/gyx-engine](https://discord.gg/gyx-engine)
- Documentation complète : Voir `README.md`

**Bon développement ! 🚀**
