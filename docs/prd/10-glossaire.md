# 10. Glossaire (vocabulaire figé)

Dictionnaire officiel du projet. Toutes les conversations (BMAD, Claude Code) et
tout le code doivent employer ces mots. Repris du PRD v0.3, ch. 10.

- **Scénario** — Plan écrit et réutilisable d'un exercice (liste d'injects + séquence). Actif durable, porteur d'une portée de réutilisation.
- **Instance** — Exécution réelle d'un scénario, à une date donnée, pour un client donné. Donnée vivante et temporaire. **Ne désigne JAMAIS un serveur, un conteneur ou un déploiement.**
- **Exercice** — Terme métier désignant le même objet qu'une instance. Une mission peut comporter plusieurs exercices.
- **Mission** — Regroupement des exercices d'un même engagement. Couche à part entière de la hiérarchie et unité de rattachement des droits et du contenu sur-mesure partagés entre facilitateurs.
- **Inject** — Unité de contenu injectée. Défini par une source, un canal, un contenu et un déclencheur ; porte une cible de diffusion et, le cas échéant, un saut de temps.
- **Source** — Qui parle dans le scénario : une fiche personnage, incarnée par un humain ou une IA.
- **Fiche personnage** — Ce qu'un personnage est indépendamment de toute crise (prénom, nom, métier, fonction, rattachement, expertise, ton). Actif permanent réutilisable, porteur d'une portée. À ne pas confondre avec le briefing.
- **Briefing** — Ce qu'un personnage sait, ignore, cherche et s'interdit dans un scénario précis. Rattaché à un couple (fiche personnage, scénario), sans portée propre, hérite de celle du scénario.
- **Prompt système** — Objet non stocké. Assemblé à l'appel du modèle à partir de la fiche, du briefing et du fil de conversation.
- **Portée de réutilisation** — Attribut déterminant qui peut voir, utiliser et cloner un actif de contenu. Trois valeurs : plateforme (catalogue éditeur), compte racine (catalogue privé), organisation (sur-mesure). Le clonage ne descend que vers le bas.
- **Canal** — L'onglet par lequel un inject arrive au participant. Socle : mail, chat d'équipe, messagerie pro, journal de bord, décisions, réseau social, site d'actualité. Optionnels : tableau de bord, carte de situation, bulletin d'autorité. Un appel ou une vidéo ne sont pas des canaux mais des interruptions en mode actif.
- **Décisions** — Canal unique de questionnement des équipes (quiz et questions à choix confondus). Ressort de jeu + matière première du débrief.
- **Déclencheur** — Ce qui fait apparaître un inject : temps réel écoulé, action du facilitateur, et plus tard (v2) une décision du joueur.
- **Horloge réelle** — Temps effectivement écoulé depuis le lancement. Cadence le MEL, sert au débrief et à l'audit. Affichée au seul facilitateur.
- **Horloge fictive** — Temps du scénario, celui des personnages. Avance par sauts, pas par défilement accéléré. Seule horloge affichée au participant.
- **Saut de temps** — Passage de l'horloge fictive à une nouvelle date, annoncé au participant. Paramétré sur l'inject qui le porte.
- **Cible de diffusion** — Périmètre de destinataires d'un inject. Croisement de deux dimensions multi-valuées : périmètre d'équipes (instance entière ou liste) × filtre de rôles (tous ou liste), auquel s'ajoute la sélection de destinataires individuels. Dans le **contenu réutilisable (scénario)**, toujours exprimée par un nom d'équipe, de rôle ou de **place individuelle** — **jamais par un nom propre**, sous peine de rendre le scénario non rejouable. Au niveau de l'**instance**, le ciblage **nominatif** de participants réels est autorisé, la liste étant connue (import en amont ou en direct). [→ AD-007]
- **Équipe** — Cellule de jeu à l'intérieur d'une instance. Ne porte aucun droit d'accès. Peut n'avoir qu'un participant.
- **Profil** — L'un des cinq niveaux d'accès (ch. 3) : administrateur plateforme, responsable de cabinet, responsable d'organisation, responsable de filiale, facilitateur. Définit des droits, pas une fonction de jeu. Le participant n'est pas un profil.
- **Participant** — Personne qui joue l'exercice. Identité éphémère sans compte ni mot de passe, rattachée à une seule instance, portée par un lien personnel unique, détruite à la purge.
- **Rôle (dans une équipe)** — Fonction tenue par un participant (RH, communication, pilotage, juridique). Unique par participant. Cible d'inject + axe de débrief. Une fonction se modélise soit comme équipe, soit comme rôle, jamais les deux dans un même exercice.
- **MEL (Master Event List)** — File d'attente des injects à venir. Support commun aux modes horloge automatique et manuel.
- **Pattern of Life** — Bruit de fond permanent recréant le trafic normal. Générique et neutre en v1, publié par l'éditeur en portée plateforme.
- **Mode catalogue** — Scénario écrit une fois sur une organisation fictive, rejouable tel quel. Portée plateforme (éditeur) ou compte racine (cabinet).
- **Mode sur-mesure** — Scénario personnalisé pour une organisation cliente, portée organisation, cloisonné.
- **Version figée** — Copie immuable (scénario, séquence, injects, fiches, briefings) prise au lancement de l'instance. C'est elle qui est jouée et débriefée.
- **Livrable de débrief** — Export autoportant et figé produit à la clôture. Seul artefact survivant à la purge ; support de la preuve de participation.
- **Arrêt d'urgence** — Dispositif de sûreté interrompant instantanément un exercice et diffusant un message réel à tous les participants. Distinct de la pause tactique.
- **Modèle piloté / modèle autonome** — Deux modèles d'usage, distingués par la nature du compte racine. Piloté : un cabinet détient le compte, ses consultants animent. Autonome : une organisation détient directement le compte. Même application, même modèle de données.
- **Cabinet** — Structure de conseil titulaire d'un compte, opérant pour plusieurs organisations clientes indépendantes. Couche facultative au sommet de l'arbre, présente uniquement en modèle piloté. Scort Conseil en est un.
- **Compte racine** — Titulaire d'un compte (cabinet ou organisation autonome). Seule frontière d'isolation. Boîte noire pour tous les autres.
- **Organisation cliente** — Entité pour laquelle un exercice est joué. Cliente d'un cabinet (piloté) ou directement titulaire (autonome). À distinguer d'une filiale.
- **Éditeur** — Titulaire de la plateforme, qui l'exploite et publie le contenu de portée plateforme. N'est pas un compte racine.
