# 🚀 Guide de démarrage rapide — Orxyn Bot

## ✅ Checklist avant le lancement

### 1. Vérifier l'installation

```bash
# Vérifiez que Node.js v21+ est installé
node --version

# Installez les dépendances
npm install
```

### 2. Configuration Discord

1. Créez une application sur https://discord.com/developers/applications
2. Créez un bot dans l'onglet "Bot"
3. **ACTIVEZ ces intents dans l'onglet Bot :**
   - ✅ Presence Intent
   - ✅ Server Members Intent  
   - ✅ Message Content Intent

### 3. Configuration du fichier .env

Créez/éditez le fichier `.env` à la racine :

```env
DISCORD_TOKEN=VOTRE_TOKEN_ICI
MISTRAL_API_KEY=mlCfO3YxF3CbwpDT2uPrQ0VCoAUV5cVq
NODE_ENV=production
MODERATION_LOCAL_MODE=true
```

### 4. Inviter le bot

URL d'invitation (remplacez `CLIENT_ID`) :
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 5. Lancer le bot

```bash
npm start
```

Vous devriez voir :
```
✅ Loaded event: ready
✅ Loaded event: guildCreate
...
✅ Logged in as Orxyn#1234
🚀 Orxyn bot is ready!
```

---

## 🎯 Configuration initiale sur le serveur

Une fois le bot en ligne, exécutez ces commandes sur votre serveur Discord :

```
1. /setadminrole @Admin
2. /setwelcomechannel #bienvenue
3. /setwelcomerole @Membre
4. /setlogchannel #logs
```

---

## 🎫 Créer votre premier panel de tickets

```
/ticketpanel-create 
  title:"🎫 Support GYX Boosts"
  description:"Besoin d'aide ? Cliquez ci-dessous !"
  color:#FF0000
  category:Tickets
  staff_role:@Support
```

Puis envoyez-le :
```
/ticketpanel-send panel_id:VOTRE_ID channel:#support
```

---

## 🎁 Lancer un giveaway de test

```
/giveaway-start 
  duration:10m
  winners:1
  prize:"Test"
  channel:#giveaways
```

---

## 🐛 En cas de problème

### Le bot ne se connecte pas
- Vérifiez que `DISCORD_TOKEN` est correct dans `.env`
- Vérifiez les intents dans le Discord Developer Portal

### Les commandes n'apparaissent pas
- Attendez 1 heure (commandes globales)
- Ou invitez le bot sur un autre serveur de test
- Vérifiez les logs dans `logs/error.log`

### L'IA ne répond pas
- Le bot fonctionne en mode mock sans clé API Mistral
- Vérifiez `logs/mistral.log` pour les détails

---

## 📂 Structure des fichiers

Vérifiez que ces dossiers/fichiers existent :

```
✅ /data/
   ├── config.json
   ├── tickets.json
   ├── ticket_panels.json
   ├── giveaways.json
   └── transcripts/

✅ /logs/

✅ /src/
   ├── commands/
   ├── events/
   ├── services/
   └── utils/

✅ /prompts/
   ├── prompt.txt
   └── moderation_prompt.txt

✅ .env
✅ package.json
✅ README.md
```

---

## 🎨 Personnalisation rapide

### Changer la couleur des embeds
Fichier: `src/services/embedFormatter.js`
```javascript
const ORXYN_COLOR = 0xFF0000; // Changez cette valeur
```

### Modifier le message de bienvenue
Fichier: `data/config.json`
Puis modifiez `src/services/embedFormatter.js` fonction `welcomeEmbed`

### Personnaliser l'IA
Fichiers: `prompts/prompt.txt` et `prompts/moderation_prompt.txt`

---

## 📊 Commandes les plus utiles

| Commande | Description |
|----------|-------------|
| `/ticketpanel-create` | Crée un panel de tickets personnalisé |
| `/ticketpanel-send` | Envoie le panel dans un salon |
| `/giveaway-start` | Lance un giveaway |
| `/ban` / `/kick` / `/mute` | Modération manuelle |
| `/setadminrole` | Configure les permissions |

---

## 💡 Conseils

1. **Testez d'abord sur un serveur de test** avant de déployer en production
2. **Sauvegardez régulièrement** le dossier `/data/` (contient toutes vos données)
3. **Vérifiez les logs** dans `/logs/` en cas de comportement étrange
4. **Utilisez des catégories Discord** pour organiser les tickets
5. **Configurez plusieurs rôles staff** pour les tickets si nécessaire

---

## 🎯 Prochaines étapes

1. ✅ Bot installé et configuré
2. ✅ Panneau de tickets créé
3. ✅ Rôles et salons configurés
4. 📝 Personnaliser les messages et prompts
5. 🎨 Adapter les couleurs à votre serveur
6. 🧪 Tester toutes les fonctionnalités
7. 🚀 Déployer en production !

---

**Besoin d'aide ?** Consultez le README.md ou rejoignez discord.gg/gyx-engine

**Bon lancement ! 🚀**
