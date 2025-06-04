# SAE 4.01 - Application de Collecte Audio avec Déploiement via Docker

Une application web moderne et sécurisée pour la collecte d'enregistrements vocaux avec interface utilisateur intuitive et déploiement Docker.

## Aperçu du Projet

Cette application permet de collecter des enregistrements audio d'utilisateurs lisant des phrases prédéfinies, tout en garantissant l'anonymat et la confidentialité. Elle respecte toutes les exigences fonctionnelles et techniques spécifiées dans le cahier des charges.

### Fonctionnalités Principales

- **Interface moderne et responsive** avec design contemporain
- **Collecte anonyme** d'informations démographiques (âge, genre)
- **Consentement explicite** requis avant la collecte
- **Enregistrement audio** avec contrôles intuitifs
- **Configuration flexible** du nombre de phrases
- **Sauvegarde fiable** avec gestion des sessions
- **Sortie anticipée** avec préservation des données
- **Containerisation Docker** complète

##  Architecture

```
SAE_4.01_DOCKER/
├── backend/
│   ├── index.php             
│   └── sentences.php          
├── frontend/
│   ├── home.html             
│   └── script.js            
├── sentences/
│   └── sentences.txt         
├── recordings/               
├── sessions/                 
├── Dockerfile               
├── compose.yaml             
└── README.md               
```

##  Installation et Démarrage

### Prérequis

- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- Navigateur moderne avec support WebRTC

### Installation Rapide

1. **Cloner le projet**
   ```bash
   git clone git@github.com:NathanEyer/SAE_4.01_Docker.git
   cd SAE_4.01_DOCKER
   ```

2. **Donner les permissions nécessaires (si pas effectif lors du clonage)**
   docker-compose up -d
   ```

4. **Accéder à l'application**
   ```
   http://localhost:8080/home.html
   ```

## Utilisation

### Étapes du Processus

1. **Page d'accueil** : Introduction et démarrage
2. **Informations démographiques** : Saisie âge, genre, consentement
3. **Configuration** : Choix du nombre de phrases (5-20)
4. **Enregistrement** : Lecture et enregistrement des phrases
5. **Finalisation** : Résumé et sauvegarde

### Interface d'Enregistrement

- **🎤 Enregistrer** : Démarrer l'enregistrement
- **⏹️ Arrêter** : Terminer l'enregistrement
- **▶️ Écouter** : Lecture de l'enregistrement
- **🔄 Réenregistrer** : Nouvel enregistrement
- **✅ Valider** : Sauvegarder et continuer
- **⏭️ Passer** : Ignorer la phrase actuelle
- **🚪 Terminer** : Fin anticipée de session

## 🔧 Configuration

### Variables d'Environnement

Modifiez le fichier `compose.yaml` pour personnaliser :

```yaml
environment:
  - PHP_UPLOAD_MAX_FILESIZE=50M
  - PHP_POST_MAX_SIZE=50M
  - PHP_MAX_EXECUTION_TIME=300
```

### Phrases Personnalisées

Éditez `sentences/sentences.txt` pour ajouter vos propres phrases :

```
Votre première phrase à enregistrer.
Votre deuxième phrase à enregistrer.
...
```

### Configuration Apache

Le fichier `Dockerfile` inclut une configuration Apache optimisée avec :
- Support des Single Page Applications
- Headers de sécurité
- Configuration CORS
- Protection des dossiers sensibles

## 📊 Monitoring et Logs

### Vérification de l'état

```bash
# État des conteneurs
docker-compose ps

# Logs de l'application
docker-compose logs -f audio-collector

# Santé de l'application
curl http://localhost:8080/index.php?action=sentences
```

### Métriques

L'application inclut un healthcheck automatique :
- Vérification toutes les 30 secondes
- Timeout de 10 secondes
- 3 tentatives avant échec

## 🔒 Sécurité et Confidentialité

### Mesures de Protection

- **Anonymat garanti** : Aucune information personnellement identifiable
- **Consentement explicite** requis
- **Données chiffrées** en transit (HTTPS en production)
- **Accès restreint** aux dossiers sensibles
- **Headers de sécurité** configurés

### Structure des Données

```json
{
  "id": "session_unique_id",
  "age": 25,
  "gender": "femme",
  "consent": true,
  "sentenceCount": 10,
  "createdAt": "2024-12-19 10:30:00",
  "recordings": [
    {
      "fileName": "session_id_sentence_0_timestamp.webm",
      "sentenceIndex": 0,
      "sentence": "Phrase enregistrée",
      "timestamp": "2024-12-19_10-31-15"
    }
  ]
}
```

## 🌐 Déploiement Cloud

### AWS (Amazon Web Services)

1. **Elastic Container Service (ECS)**
   ```bash
   # Pousser l'image vers ECR
   aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.eu-west-1.amazonaws.com
   docker tag audio-collector:latest <account>.dkr.ecr.eu-west-1.amazonaws.com/audio-collector:latest
   docker push <account>.dkr.ecr.eu-west-1.amazonaws.com/audio-collector:latest
   ```

2. **Elastic Beanstalk**
   ```bash
   # Déploiement avec EB CLI
   eb init audio-collector
   eb create production
   eb deploy
   ```

### Google Cloud Platform

```bash
# Google Cloud Run
gcloud builds submit --tag gcr.io/PROJECT-ID/audio-collector
gcloud run deploy --image gcr.io/PROJECT-ID/audio-collector --platform managed
```

### Microsoft Azure

```bash
# Azure Container Instances
az container create \
  --resource-group audio-collector-rg \
  --name audio-collector \
  --image audio-collector:latest \
  --ports 80
```

### Heroku

```bash
# Déploiement Heroku
heroku create audio-collector-app
heroku container:push web
heroku container:release web
```

## 🧪 Tests

### Tests Fonctionnels

```bash
# Test de l'API
curl -X GET "http://localhost:8080/index.php?action=sentences"

# Test d'upload (avec fichier test)
curl -X POST \
  -F "audio=@test-audio.webm" \
  -F "sessionId=test_session" \
  -F "sentenceIndex=0" \
  "http://localhost:8080/index.php"
```

### Tests de Performance

```bash
# Test de charge avec Apache Bench
ab -n 100 -c 10 http://localhost:8080/

# Monitoring des ressources
docker stats audio-collector-app
```

## 🛠️ Développement

### Environnement de Développement

1. **Mode développement avec volumes**
   ```bash
   docker-compose -f compose.dev.yaml up
   ```

2. **Debug PHP**
   ```bash
   docker-compose exec audio-collector tail -f /var/log/apache2/error.log
   ```

### Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amélioration`)
3. Commit les modifications (`git commit -am 'Ajout fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amélioration`)
5. Créer une Pull Request

## 📚 Documentation API

### Endpoints Disponibles

- `GET /index.php?action=sentences` - Récupérer les phrases
- `POST /index.php` - Créer une session, sauvegarder enregistrement, finaliser session

### Codes de Retour

- `200` - Succès
- `400` - Requête invalide
- `500` - Erreur serveur

## 🆘 Dépannage

### Problèmes Courants

1. **Port 8080 déjà utilisé**
   ```bash
   # Changer le port dans compose.yaml
   ports:
     - "8081:80"
   ```

2. **Permissions des fichiers**
   ```bash
   sudo chown -R www-data:www-data recordings/ sessions/
   chmod -R 775 recordings/ sessions/
   ```

3. **Problème de microphone**
   - Vérifier les autorisations du navigateur
   - Utiliser HTTPS en production
   - Tester avec différents navigateurs

### Logs de Debug

```bash
# Logs complets
docker-compose logs audio-collector

# Logs Apache
docker-compose exec audio-collector tail -f /var/log/apache2/error.log

# Logs PHP
docker-compose exec audio-collector tail -f /var/log/apache2/access.log
```

## 📄 Licence

Ce projet est développé dans le cadre du module S4-DACS-01-1. Tous droits réservés.

## 👥 Équipe

- **Développement** : [Votre nom]
- **Architecture** : [Votre nom]
- **DevOps** : [Votre nom]

## 📞 Support

Pour toute question ou problème :
- 📧 Email : [votre.email@exemple.com]
- 🐛 Issues : [Lien vers les issues GitHub]
- 📖 Wiki : [Lien vers la documentation]

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024