# PRD : Plateforme de simulation d'exercices de crise

**Version :** 0.3 (mécanisme d'attribution des profils ajouté au chapitre 5.8)
**Date :** 16 juillet 2026
**Statut :** Base d'exigences arbitrée, prête pour le cadrage d'architecture technique
**Auteur :** Thomas Scorticati (Scort Conseil)
**Sources :** Synthèse de conception issue de la phase de brainstorm (`synthese_simulateur_crise.md`), PRD v0.1 du 14 juillet 2026, audit et arbitrages du 15 juillet 2026 (v0.2), complément sur l'attribution des profils du 16 juillet 2026 (v0.3).
**Destination :** Base de travail pour le développement assisté (BMAD, Claude Code) et pour le cadrage d'architecture technique qui suivra.

*Note liminaire sur le statut du document.* Ce PRD traduit en exigences les décisions arrêtées pendant le brainstorm, puis les arbitrages issus de l'audit de la v0.1. Les valeurs chiffrées (seuils, durées, volumétrie) sont des propositions signalées comme telles, à confirmer au cadrage technique. Les points restés volontairement ouverts sont regroupés au chapitre 9 plutôt que tranchés arbitrairement. Le nom de produit reste à définir : le document parle de «la plateforme».

*Avertissement de vocabulaire à l'attention des outils de développement assisté.* Le mot **instance** désigne dans tout ce document l'exécution d'un exercice, et jamais un serveur, un conteneur ou un déploiement. Ce sens est celui du glossaire du chapitre 10 et prévaut sur tout usage courant du terme en informatique.

---

## Ce qui change depuis la version 0.1

1. **Le role-player IA est confirmé dans le périmètre de la version 1** (chapitre 4), et le fournisseur retenu est Mistral (chapitre 7).
2. **Le chapitre 4 est restructuré.** La v0.1 confondait le périmètre fonctionnel et les partis pris de conception, et excluait donc par omission la moitié du chapitre 5. Le périmètre est désormais énoncé explicitement.
3. **Le scénario, la fiche personnage et le bruit de fond entrent dans le modèle de données** et portent une **portée de réutilisation** à trois valeurs : plateforme, compte racine, organisation (chapitres 5.1 et 6). La v0.1 ne rattachait le scénario à rien.
4. **Le persona est scindé en fiche personnage permanente et briefing propre à un scénario** (chapitre 5.5). La v0.1 mettait la connaissance du scénario dans un objet réutilisable, ce qui provoquait des fuites de contenu entre clients.
5. **La cible de diffusion devient multi-valuée et croise deux dimensions**, un périmètre d'équipes et un filtre de rôles (chapitres 5.1 et 6). La v0.1 ne permettait pas d'adresser un sous-ensemble d'équipes, ce qui rendait le cas d'usage à 300 cellules injouable.
6. **La purge est remplacée par trois régimes de rétention distincts** et une exigence d'export du débrief (chapitres 5.7 et 7). La v0.1 supprimait la preuve de participation exigée par ailleurs.
7. **Un bloc 5.9 «Sûreté de l'exercice» est créé** : marquage systématique des contenus et arrêt d'urgence.
8. **Le rattrapage des injects manqués est spécifié** (chapitre 5.4). C'est une exigence déterminante pour l'architecture de livraison.
9. **L'instance fige à son lancement la version du scénario, des briefings et des fiches personnages** (chapitres 5.1 et 6).
10. **Le participant sort de la hiérarchie des profils de compte** et devient un modèle d'identité distinct (chapitre 3).
11. **La souveraineté est confirmée comme ambition ferme**, avec Supabase auto-hébergé et Mistral (chapitre 7). Le point ouvert sur l'infrastructure temps réel est refermé.
12. **La volumétrie cible est fixée** à 300 cellules et 1500 connexions simultanées (chapitre 2).
13. **Un chapitre 8.2 traite la position de prestataire tiers de services TIC au sens DORA et le RGPD.** La v0.1 invoquait DORA comme besoin client sans en tirer les conséquences sur la plateforme elle-même.

---

## Ce qui change depuis la version 0.2

1. **Le mécanisme d'attribution des profils à l'intérieur d'un compte est spécifié** (chapitre 5.8, points 6 à 9). La v0.2 définissait la hiérarchie des profils et la nature du compte, mais ne disait jamais comment une personne se rattache concrètement à la bonne organisation au moment où elle reçoit un profil, ce qui restait un angle mort. L'attribution suit désormais un principe d'invitation nominative en cascade, où chaque profil n'invite que vers un niveau égal ou inférieur au sien et à l'intérieur de son propre périmètre, avec un lien à usage unique, borné à une semaine, renvoyable en un clic et journalisé.

---

## 1. Contexte et vision produit

La plateforme est un outil de simulation d'exercices de crise, inspiré du fonctionnement de Conducttr, destiné à entraîner des équipes à la gestion de crise à travers des scénarios interactifs multicanaux.

Le produit est pensé dès sa conception pour un **double usage**. Il est d'abord un outil de travail pour les missions personnelles de conseil, en business continuity et en conformité DORA notamment. Il est ensuite une offre commerciale en SaaS, vendue à d'autres organisations. Ce choix de dogfooding est un atout stratégique assumé, pas une contrainte subie : chaque mission personnelle enrichit et éprouve le produit avant qu'il ne soit vendu à des tiers. Toute exigence du présent document doit donc rester valable dans les deux régimes, l'usage interne et la vente externe.

**Le produit est un moteur et un fonds de contenu.** La plateforme ne vend pas seulement l'outil : elle met à disposition de tous ses clients un catalogue de scénarios, une bibliothèque de bruit de fond et un répertoire de fiches personnages, produits et publiés par l'éditeur. Un client peut s'en servir tel quel, les cloner pour les adapter, ou écrire son propre contenu sans jamais y toucher. Cette dimension éditoriale est une composante de l'offre à part entière, et non un simple jeu de démonstration ; elle est ce qui rend la plateforme utilisable dès le premier jour par un client qui n'a pas d'ingénierie de scénario en interne. Elle impose en contrepartie une règle de portée du contenu, énoncée au chapitre 5.1, qui doit se concilier avec l'isolation stricte entre comptes du chapitre 7.

Le **positionnement est volontairement large** plutôt que cantonné au secteur financier. La cible couvre aussi bien des institutions financières soumises à DORA que des entités étatiques, une administration cantonale par exemple. Le principe fondateur qui rend ce positionnement large tenable techniquement est celui d'un **moteur générique constant à contenu variable** : l'architecture ne change jamais d'un secteur à l'autre, seul le contenu des scénarios change. Ce principe est la clé de voûte de tout le PRD ; il justifie que la même application serve des contextes très différents sans branche de code spécifique par métier.

La plateforme doit par ailleurs servir **deux modèles d'usage distincts avec le même moteur**, ce qui est la principale source de complexité du modèle de profils (chapitre 3). Ces deux modèles se distinguent par la nature de la structure qui détient le compte.

1. **Le modèle piloté.** Un **cabinet de conseil** détient le compte. Il a plusieurs organisations clientes, chacune pouvant compter des filiales, chaque organisation ou filiale pouvant porter plusieurs missions, et chaque mission plusieurs exercices. Ses consultants conçoivent et animent les exercices pour le compte de ces organisations, sans appartenir à leur hiérarchie.
2. **Le modèle autonome.** Une **organisation** détient directement le compte, sans aucun cabinet. Elle peut elle aussi compter des filiales, chacune pouvant porter ses propres missions et mener ses propres exercices. Ce sont ses propres collaborateurs qui conçoivent et animent ces exercices, en payant l'accès à l'application.

**La filiale est facultative et identique dans les deux modèles ; elle n'est jamais ce qui les distingue.** Une organisation qui en compte laisse chacune de ses filiales mener ses propres exercices, avec ses propres missions et son propre responsable de filiale, sans qu'une filiale voie l'activité des autres ; seule l'organisation au-dessus d'elles voit l'ensemble (voir les chapitres 3 et 6). Une organisation qui n'a pas de filiales rattache directement ses missions et ses exercices à elle-même, sans niveau intermédiaire ni écran supplémentaire. C'est la présence ou l'absence du **cabinet**, et elle seule, qui sépare les deux modèles.

Un point de structure conditionne toute la suite : **les clients d'un cabinet ne sont pas ses filiales**. Une filiale appartient au même groupe que sa maison mère, alors qu'un client de cabinet est une entreprise entièrement indépendante. Le mécanisme de filiale ne peut donc pas servir à modéliser un portefeuille de clients. Le cabinet est un niveau à part, facultatif, situé au sommet de l'arbre plutôt qu'en son milieu, et présent uniquement dans le modèle piloté (voir le chapitre 6).

Ce niveau est nécessaire dès la version 1, y compris pour l'usage interne : Scort Conseil est lui-même un cabinet au sens de ce modèle. Vendre plus tard l'accès à d'autres cabinets ne demandera donc aucun cas particulier, seulement l'ouverture commerciale d'une structure déjà en place. Les deux modèles partagent la même application et le même modèle de données ; ils ne se distinguent que par la présence ou l'absence du niveau cabinet, par la personne qui tient le profil de facilitateur, et par la façon dont son accès est octroyé. Dans les deux cas, l'accès reste ouvert sur devis (chapitre 8). La nature du compte est déterminée à sa création et commande l'affichage de l'administration des profils (chapitre 5.8), tandis que l'étanchéité entre comptes racine est imposée côté serveur (chapitre 7).

Deux cas d'usage réels ont guidé la conception et servent de repères concrets tout au long du document.

1. **Une mission bancaire type BForBank.** Une institution financière unique, soumise à DORA, qui joue un exercice de crise sur un nombre modéré d'équipes (cellule de crise, communication, RH, IT, direction). L'enjeu dominant est la qualité de mise en scène, la traçabilité nominative des participants comme preuve de participation, et un débrief exploitable au regard des référentiels.
2. **Un exercice de grande ampleur type Canton de Vaud.** Une administration cantonale qui réunit plusieurs centaines de communes en simultané dans un seul exercice partagé, toutes soumises à la même horloge et au même scénario, mais recevant des injects différenciés selon leur rôle. L'enjeu dominant est l'absence totale de friction d'inscription et la capacité du facilitateur à piloter des centaines d'équipes sans se noyer.

Ces deux cas ne demandent pas deux produits ni deux architectures : ils sont deux points sur un même continuum couvert par le même moteur générique. Le PRD doit être lu avec ces deux extrêmes en tête.

---

## 2. Objectifs et critères de succès

La synthèse impose deux axes de succès non négociables, qui structurent les priorités de la version 1.

**Objectif 1 : scalabilité sans friction d'inscription.** La plateforme doit pouvoir faire tourner un exercice massif à plusieurs centaines de participants sans qu'aucun participant ait à créer de compte ni à retenir de mot de passe. La friction d'inscription est explicitement identifiée comme l'obstacle numéro un à la participation à grande échelle.

**Objectif 2 : valeur de débrief.** Un exercice ne se termine pas à la dernière minute jouée mais au débrief. La plateforme doit produire une matière de débrief exploitable, c'est-à-dire des décisions et des interactions capturées, horodatées et attribuées, permettant une After-Action Review et des conclusions actionnables après l'exercice.

Critères mesurables retenus.

1. On dispose, pour chaque exercice, de la liste des participants présents et des absents (établie par rapport à la liste importée) ainsi que du taux de participation.
2. **Une instance supporte 300 cellules et 1500 connexions simultanées actives** sans dégradation perceptible de la livraison des injects. Cette cible est dimensionnée sur le cas d'usage Canton de Vaud, où le commanditaire raisonne en cellules (300 communes) et non en personnes ; le facteur de 5 personnes par cellule est une hypothèse de dimensionnement. La confirmation de cette cible reste subordonnée à son coût d'infrastructure, à évaluer au cadrage technique (voir chapitre 9).
3. Un facilitateur unique peut superviser un exercice comportant plusieurs dizaines d'équipes en identifiant en un coup d'oeil les équipes en décrochage, sans avoir à parcourir toutes les équipes une par une.
4. À la clôture d'un exercice, l'ensemble des décisions et interactions est disponible sous forme de vues agrégées par décision, par équipe et par rôle, sans reconstitution manuelle, et exportable en un livrable autoportant (voir 5.7).

---

## 3. Utilisateurs et profils

### 3.1 Deux modèles d'identité, à ne pas confondre

La plateforme connaît **deux populations qui ne s'authentifient pas de la même façon et ne relèvent pas du même modèle**.

1. **Les utilisateurs de la plateforme** disposent d'un compte nominatif avec authentification, et portent l'un des cinq profils de la hiérarchie décrite ci-dessous. Ils conçoivent, administrent et pilotent.
2. **Les participants** ne disposent d'aucun compte et d'aucun mot de passe. Leur identité est une identité éphémère, rattachée à une seule instance, créée par l'import de la liste des participants ou par l'accès de secours, et matérialisée par un lien personnel unique (voir 5.6). Elle disparaît avec la purge des données d'instance (voir 7.6).

Cette séparation est structurante pour le développement : ce sont deux mécanismes d'authentification distincts, et le participant n'est pas le dernier échelon d'une échelle de droits. La v0.1 le plaçait en sixième position d'une hiérarchie de comptes dont le chapitre 6 précisait par ailleurs qu'il ne faisait pas partie ; l'héritage vers ce niveau n'avait aucun sens opérationnel.

### 3.2 La hiérarchie des profils de compte

Le système de droits repose sur une **hiérarchie de profils à portée imbriquée** : la visibilité d'un profil supérieur inclut automatiquement celle des profils inférieurs, par héritage. On ne cumule pas manuellement plusieurs profils sur une même personne ; on lui attribue un profil, et l'héritage fait le reste.

Deux axes sont traités séparément dans l'architecture, ce qui évite de créer un nouveau profil chaque fois qu'un cas particulier de permission apparaît.

1. **La portée** définit quelles données sont visibles : tout un cabinet, toute une organisation, une filiale, une mission, ou une seule instance.
2. **Le niveau de permission** définit ce que l'utilisateur peut faire de ces données : consulter, créer, modifier.

Les cinq niveaux, du plus large au plus restreint, sont les suivants.

1. **Développeur et administrateur de la plateforme.** Accès complet en consultation et en modification à l'ensemble des données, tous cabinets et toutes organisations confondus. C'est le niveau technique et d'exploitation. Il est aussi le seul à pouvoir publier ou promouvoir un contenu en portée plateforme (voir 5.1). Ce profil est l'unique exception à l'isolation du chapitre 7 ; à ce titre, il fait l'objet d'exigences propres de journalisation et d'encadrement énoncées en 8.2.
2. **Responsable de cabinet.** N'existe que dans le modèle piloté. Voit et peut modifier l'ensemble des clients, des missions et des exercices de son cabinet, et de son cabinet seulement. Il n'a aucun accès aux autres cabinets, ni aux organisations autonomes.
3. **Responsable au niveau d'une organisation cliente.** C'est le profil le plus élevé côté client. Sa portée couvre l'ensemble des exercices de son organisation, filiales comprises, et aucune autre organisation. Son niveau de permission dépend du modèle d'usage : en modèle autonome, il voit et modifie ; lorsque son organisation est servie par un cabinet, il voit tout, débrief compris, mais ne modifie pas, la modification du contenu restant au cabinet.
4. **Responsable au niveau d'une filiale.** Même logique que le niveau précédent, à l'échelle de sa filiale. Sa portée couvre l'ensemble des exercices de sa filiale, à l'intérieur de son organisation. Il ne voit ni les autres filiales de son organisation, ni les autres organisations.
5. **Facilitateur d'un exercice.** Voit et modifie les injects et le pilotage du ou des exercices dont il a la charge, et de ceux-là seulement. Il accède en outre au contenu réutilisable selon les règles de portée du chapitre 5.1, ce qui excède le périmètre des seuls exercices dont il a la charge : il peut consulter et cloner le catalogue de portée plateforme, consulter et utiliser le contenu de portée compte racine de la structure à laquelle il appartient, et créer du contenu sur-mesure sur les missions qui lui sont confiées. Le modèle ne prévoit qu'une seule définition de ce profil, commune aux deux modèles d'usage, plutôt qu'un profil interne et un profil externe distincts : seule change l'appartenance de la personne qui le tient, un consultant du cabinet en modèle piloté, un collaborateur du client en modèle autonome. Lorsque plusieurs facilitateurs se partagent un exercice, leurs droits communs sur le contenu obéissent au principe de propriété du contenu énoncé plus bas, et leur pilotage conjoint aux exigences de concurrence du chapitre 5.2.

Aucun de ces profils n'est nominatif : un profil est une définition de droits, pas une personne. Le même profil peut donc être tenu par plusieurs personnes sur le même périmètre, qui disposent alors de droits strictement identiques : plusieurs administrateurs de la plateforme, plusieurs responsables au sein d'un même cabinet, d'une même organisation ou d'une même filiale, plusieurs facilitateurs sur un même exercice. Réciproquement, une même personne peut tenir son profil sur plusieurs périmètres de même nature, un facilitateur en charge de plusieurs exercices par exemple. Le lien entre une personne et le périmètre sur lequel elle exerce son profil est donc une relation de plusieurs à plusieurs dans les deux sens, ce qui exclut de modéliser un titulaire comme un simple champ posé sur l'objet concerné.

Ces cinq niveaux ne sont pas tous obligatoires : la hiérarchie s'adapte au type et à la taille de la structure. Le niveau cabinet est absent de tout le modèle autonome. Une organisation sans filiales n'a pas de responsable de filiale ; elle se limite alors à un responsable d'organisation et à un ou plusieurs facilitateurs, l'instance étant rattachée directement à l'organisation (voir le modèle de données au chapitre 6). Par le jeu de l'héritage, une même personne peut aussi assumer plusieurs fonctions sans qu'on lui attribue plusieurs profils : un responsable d'organisation en modèle autonome peut ainsi être le facilitateur direct d'un exercice, puisque son profil inclut déjà les capacités du facilitateur.

### 3.3 Quatre principes complétant le socle

**Un profil supérieur peut se substituer à un facilitateur, à l'intérieur de son propre arbre.** Parce que la portée est imbriquée, un profil supérieur peut modifier directement le contenu et le pilotage d'un exercice relevant de sa portée, sans passer par le facilitateur titulaire. Ce droit couvre le cas d'un facilitateur absent, ainsi que le cas d'un désaccord où le profil supérieur préfère modifier lui-même plutôt que de demander la modification au facilitateur. Il s'exerce toujours à l'intérieur d'un même arbre, jamais à travers la frontière entre un cabinet et son client : dans le modèle piloté, le responsable de cabinet se substitue à ses propres consultants ; dans le modèle autonome, le responsable d'organisation ou de filiale se substitue à ses propres facilitateurs. Un responsable côté client servi par un cabinet voit tout le travail du cabinet sur ses missions, mais n'y touche jamais directement. Cette règle prévaut, le cas échéant, sur les mentions d'accès réservé au facilitateur ailleurs dans ce document, par exemple l'atelier de création de scénario au chapitre 5.1 ou l'arrêt d'urgence au chapitre 5.9.

**Le facilitateur peut être interne ou externe au client.** Selon le modèle d'usage (chapitre 1), le profil de facilitateur est tenu soit par un collaborateur de l'organisation cliente, qui appartient alors à sa hiérarchie, soit par un consultant, qui appartient à la hiérarchie de son cabinet et ne figure dans aucun organigramme client. Dans ce second cas, l'accès du consultant est octroyé de façon ponctuelle sur une organisation, une mission ou une instance précise du portefeuille de son cabinet, indépendamment de toute structure hiérarchique côté client. Le modèle de droits doit donc permettre d'attacher un accès à une portée sans passer par l'appartenance à l'organisation concernée.

**Le contenu appartient à la mission, pas au facilitateur.** Une mission regroupe les exercices d'un même engagement et peut en comporter plusieurs (voir le glossaire). Les droits et le contenu sur-mesure sont rattachés à la mission elle-même : lorsque plusieurs facilitateurs travaillent sur la même mission, ils disposent tous des mêmes droits sur le même contenu. Un facilitateur absent le jour de l'exercice ne doit jamais bloquer l'accès à un contenu qu'il aurait créé seul.

**Un profil de compte n'est jamais joueur.** Une personne qui doit jouer l'exercice sans en connaître le contenu ne reçoit aucun profil de compte : elle est participant, avec l'identité éphémère décrite en 3.1, et n'entre pas dans la hiérarchie ci-dessus. C'est la réponse retenue au risque de divulgation du scénario : le responsable d'organisation voit tout, y compris le déroulé avant l'exercice, parce que c'est le sens même de son profil de commanditaire ; si l'on ne veut pas qu'une personne voie tout, on ne lui donne pas ce profil. Aucun mécanisme de masquage partiel du scénario à un profil supérieur n'est prévu, en version 1 comme au-delà.

Ce chapitre reste conceptuel. Sa traduction fonctionnelle, c'est-à-dire la façon dont la nature du compte est déterminée et dont l'administration des profils s'affiche en conséquence, fait l'objet du chapitre 5.8. Son application effective repose sur l'isolation imposée côté serveur décrite au chapitre 7 : c'est elle, et non l'affichage, qui garantit qu'un cabinet ou une organisation ne puisse jamais atteindre les données d'un autre.

---

## 4. Périmètre de la version 1 et évolutions prévues

Ce chapitre fixe une frontière nette. Il se lit en trois listes : ce que la version 1 contient, comment elle le fait, et ce qu'elle ne fait pas. Tout ce qui ne figure pas dans la première liste ne doit pas être développé en version 1, même si cela paraît utile.

### 4.1 Le périmètre fonctionnel de la version 1

La version 1 comprend les neuf blocs fonctionnels du chapitre 5, dans leur intégralité.

1. **Atelier de création de scénario** (5.1), y compris les trois portées de réutilisation du contenu, la distinction catalogue et sur-mesure, et le clonage.
2. **Pilotage en direct par le facilitateur** (5.2), y compris le tableau de bord par exception et la boîte de réception du facilitateur.
3. **Bruit de fond et Pattern of Life** (5.3).
4. **Expérience du participant** (5.4), y compris les canaux du socle, les canaux optionnels, les deux modes de livraison et le rattrapage des injects manqués.
5. **Role-player IA** (5.5). Ce bloc est confirmé dans le périmètre de la version 1, avec ses deux garde-fous, qui sont des exigences fermes et non des options.
6. **Gestion des accès et inscription des participants** (5.6).
7. **Débrief et export** (5.7).
8. **Administration des comptes et attribution des profils** (5.8).
9. **Sûreté de l'exercice** (5.9), marquage des contenus et arrêt d'urgence.

### 4.2 Les partis pris de conception de la version 1

Ces points ne sont pas un périmètre mais des arbitrages : ils disent comment les blocs ci-dessus sont réalisés.

1. Un tronc commun de scénario, modélisé en graphe mais sans branchement réel : chaque étape ne pointe que vers une seule étape suivante, ce qui revient en pratique à un déroulé linéaire.
2. Une facilitation strictement centralisée, sans profil de facilitateur local par équipe ou par entité.
3. Une horloge au choix, automatique par minuteur ou manuelle, avec bascule possible en cours d'exercice.
4. Une horloge fictive avançant par sauts de temps paramétrés sur les injects, affichée au participant, pour les scénarios à cinétique lente.
5. Des relances de facilitateur tapées à la main, en direct.
6. Un bruit de fond générique et neutre uniquement, publié par l'éditeur en portée plateforme.
7. Une inscription des participants par import en amont, complétée d'un accès de secours pour les retardataires.
8. Un accès client ouvert uniquement après contact et devis, sans paiement en ligne.
9. Un ciblage des injects par sélection explicite d'équipes et de rôles, sans système d'étiquettes.

### 4.3 Explicitement repoussé à une version ultérieure

1. **Le branchement réel du scénario**, où les décisions des participants modifient la suite de l'exercice.
2. **Une bibliothèque de messages de relance pré-écrits, ou une assistance par IA**, pour accélérer les interventions du facilitateur à grande échelle.
3. **Un bruit de fond thématique**, propre à chaque type de scénario.
4. **Les étiquettes de ciblage.** Un champ multi-valué posé sur le participant à l'import, qui permettrait d'adresser un inject à un sous-ensemble d'équipes sans les nommer une à une («zone inondable», «commune de montagne»). Écarté de la version 1 par choix de simplicité. La conséquence assumée est énoncée en 5.1 : un inject visant un sous-ensemble nommé d'équipes n'est pas réutilisable en catalogue, et «riverain» n'est pas un axe de débrief disponible.
5. **Un profil d'observateur ou d'évaluateur.** Un utilisateur suivant une équipe en direct sans jouer, dont les notes qualitatives nourriraient l'After-Action Review. En version 1, le débrief repose uniquement sur les événements captés par le système ; les notes d'observation restent hors plateforme.
6. **Le paiement en ligne** (voir chapitre 8).
7. **L'isolation physique par base dédiée** pour un client particulièrement sensible (voir 7.3).
8. **Le changement de nature d'un compte en libre-service** (voir 5.8).

Le fil conducteur de cette frontière est que la version 1 se limite à un **tronc commun solide, débriefé mais non ramifié**, tout en préparant le terrain des évolutions par des choix de modélisation faits dès maintenant (graphe, événements typés et horodatés, état d'avancement par équipe, versionnement du contenu). Ces choix sont détaillés aux chapitres 5 et 6.

---

## 5. Exigences fonctionnelles

Ce chapitre est le coeur du PRD. Il est découpé en neuf blocs fonctionnels. Chaque bloc ouvre sur le contexte de conception, puis énonce des exigences numérotées et référençables.

### 5.1 Atelier de création de scénario

Un scénario est un actif de contenu, distinct de son exécution. L'atelier de création est ouvert aux facilitateurs, aux profils supérieurs de leur arbre selon la règle de substitution du chapitre 3, et à l'administrateur de la plateforme. Il comprend trois blocs de travail : un éditeur d'inject, un constructeur de séquence, et un sélecteur de bruit de fond. Tout exercice repose obligatoirement sur un scénario ; il n'existe pas d'instance sans scénario.

**La portée de réutilisation du contenu.** C'est le mécanisme qui concilie l'existence d'un catalogue commercial partagé avec l'isolation stricte entre comptes du chapitre 7. Il s'applique à l'identique à trois actifs : le scénario, la fiche personnage et le template de bruit de fond.

1. **Trois portées de réutilisation.** Tout actif de contenu porte une portée à trois valeurs, fixée à sa création. La **portée plateforme** désigne un contenu écrit sur une organisation fictive, publié par l'administrateur de la plateforme, lisible et clonable par tous les comptes racine sans exception : c'est le catalogue commercial de l'éditeur. La **portée compte racine** désigne un contenu écrit sur une organisation fictive, réutilisable sur toutes les missions du cabinet ou de l'organisation autonome qui l'a produit, et invisible de tout autre compte racine : c'est le catalogue privé d'un cabinet. La **portée organisation** désigne un contenu personnalisé pour une organisation cliente précise, cloisonné à elle, invisible même des autres organisations du portefeuille du même cabinet : c'est le sur-mesure.
2. **Le clonage ne descend que vers le bas.** Un contenu de portée plateforme peut être cloné en portée compte racine ou en portée organisation ; un contenu de portée compte racine peut être cloné en portée organisation. L'inverse est impossible. Seul l'administrateur de la plateforme peut promouvoir un contenu en portée plateforme, ce qui est un acte éditorial et non un droit d'utilisateur.
3. **Le clonage n'altère jamais l'original.** Le clone est une copie indépendante et complète. Toute modification ultérieure de l'original ne se propage pas aux clones déjà créés, et réciproquement.
4. **Un contenu de portée plateforme est en lecture seule pour tous sauf l'administrateur, et n'est jamais supprimable une fois référencé, seulement archivable.** Un contenu archivé reste lisible et rejouable par les scénarios qui le référencent, mais n'est plus proposé à la sélection pour un nouveau contenu. Sans cette règle, l'éditeur casserait à distance les scénarios de ses propres clients.
5. **La portée ne franchit jamais la frontière du compte racine, sauf depuis la plateforme.** Ce qui traverse la frontière n'est jamais la donnée d'un compte racine mais le contenu éditorial de l'éditeur, ce qui est cohérent avec le chapitre 7 : aucun cabinet ne voit le contenu d'un autre cabinet, quelle que soit sa portée.

**L'éditeur d'inject.**

6. **Éditeur d'inject.** La plateforme doit permettre de créer et de modifier un inject en renseignant son contenu, son canal, sa source (une fiche personnage, voir 5.5), sa cible de diffusion et son déclencheur.
7. **La cible de diffusion croise deux dimensions.** La cible d'un inject se compose d'un **périmètre d'équipes** et d'un **filtre de rôles**, tous deux multi-valués. Le périmètre d'équipes vaut soit l'instance entière, soit une liste d'équipes explicitement sélectionnées. Le filtre de rôles vaut soit tous les membres, soit une liste de rôles explicitement sélectionnés. Le croisement des deux couvre tous les cas de figure avec un seul sélecteur et sans écran supplémentaire : l'instance entière et tous les membres pour une publication sur le réseau social ; une liste de quarante équipes et tous les membres pour un inject visant quarante communes riveraines ; l'instance entière et le rôle de pilote de cellule pour un inject visant les trois cents pilotes en une seule sélection ; une liste de quarante équipes et le rôle de pilote pour les quarante pilotes riverains ; une équipe et un rôle pour une personne unique.
8. **Le scénario ne connaît que des équipes et des rôles.** La cible d'un inject est toujours abstraite, exprimée par un nom d'équipe ou un nom de rôle, et jamais par un nom propre. C'est l'import de la liste des participants, à la préparation d'une instance (voir 5.6), qui rattache une personne réelle à chaque rôle. Cette règle est la condition de la réutilisation d'un scénario catalogue d'un client à l'autre.
9. **Conséquence assumée de l'absence d'étiquettes.** Un inject dont le périmètre est une liste d'équipes nommées est lié à la nomenclature d'équipes d'un exercice donné. Il n'est donc pas réutilisable tel quel en portée plateforme ou compte racine, et impose un clonage puis une réaffectation manuelle des cibles pour un autre client. Un scénario destiné à ces deux portées doit par conséquent cibler l'instance entière ou des rôles, et non des équipes nommées. Cette limite est le prix assumé du choix de conception énoncé en 4.3 ; elle est levée par les étiquettes en version 2.
10. **Une fonction est soit une équipe, soit un rôle, jamais les deux.** Dans un exercice donné, une même fonction, la RH par exemple, se modélise soit comme une équipe à part entière, soit comme un rôle individuel à l'intérieur d'une équipe, et jamais sous les deux formes à la fois. Un grand exercice fera de la RH une cellule ; un exercice à cellule unique en fera un rôle porté par une personne. Sans cette règle, un même nom désignerait deux cibles différentes dans un même scénario.
11. **Contrôle de cohérence avant lancement.** La plateforme doit vérifier, à la préparation d'une instance et avant tout lancement, que chaque cible déclarée par le scénario trouve au moins un destinataire dans la liste importée, et signaler au facilitateur tout inject orphelin, c'est-à-dire visant une équipe ou un rôle que personne ne tient. À défaut, un inject disparaîtrait silencieusement le jour de l'exercice. Ce contrôle est un avertissement bloquant à l'écran, que le facilitateur peut lever explicitement.

**La séquence et le contenu associé.**

12. **Constructeur de séquence.** La plateforme doit permettre d'organiser les injects dans le déroulé du scénario, et de marquer dès à présent de futurs points de décision, même si le branchement réel n'est pas encore actif en version 1.
13. **Sélecteur de bruit de fond.** La plateforme doit permettre de piocher dans la bibliothèque de bruit de fond décrite en 5.3 pour l'associer à un scénario, et de fixer à ce moment la cible de chaque template retenu.
14. **Distinction catalogue et sur-mesure.** Un scénario de type catalogue repose sur une organisation fictive et se rejoue tel quel ; il relève de la portée plateforme ou de la portée compte racine. Un scénario de type sur-mesure est personnalisé pour une organisation cliente précise ; il relève de la portée organisation. Le type de scénario et sa portée sont donc deux expressions de la même décision, et non deux champs indépendants.
15. **Confidentialité des interactions.** Seul le scénario en tant que plan est réutilisable. Les interactions réelles produites pendant une instance (réponses des participants, décisions prises, messages échangés) sont strictement confidentielles à cette instance, ne sont jamais visibles d'un client à l'autre, et relèvent du régime de rétention défini en 7.6. Aucune interaction ne remonte jamais vers un actif de contenu, quelle que soit sa portée.

**Le figement et la répétition.**

16. **L'instance fige son contenu à son lancement.** Au lancement d'une instance, la plateforme doit figer une version immuable du scénario joué, de sa séquence, de ses injects, des fiches personnages et des briefings mobilisés. L'instance ne référence plus ensuite les actifs vivants de la bibliothèque mais cette version figée. Sans cette règle, réécrire un scénario ou une fiche personnage en juin rendrait illisible le débrief d'un exercice joué en mars, et modifierait rétroactivement la preuve de ce qui a été envoyé. Cette exigence est la condition de la valeur probante du débrief (voir 5.7 et 8.2).
17. **Mode répétition.** La plateforme doit permettre de rejouer une instance dans des conditions strictement identiques à un exercice réel (les injects partent réellement, les échanges sont réels), à seule fin de vérifier que le scénario fonctionne avant le jour officiel. Cette instance est étiquetée comme test, ce qui l'exclut automatiquement des compteurs de facturation et lui applique une purge plus rapide de ses données.

### 5.2 Pilotage en direct par le facilitateur

La facilitation est centralisée. Un nombre restreint de facilitateurs, selon le modèle d'usage un ou plusieurs consultants dans le modèle piloté, ou des collaborateurs désignés du client dans le modèle autonome, pilotent l'ensemble des instances en cours, déclenchent les injects si nécessaire, surveillent le déroulement de toutes les équipes, répondent aux sollicitations des participants et peuvent relancer ponctuellement une équipe passive. Les participants n'ont aucun pouvoir de pilotage.

1. **Choix de l'horloge à la préparation.** La plateforme doit permettre au facilitateur de choisir, au moment de préparer l'exercice, si l'horloge du scénario avance automatiquement selon un minuteur, ou s'il avance chaque étape manuellement.
2. **Bascule en cours d'exercice.** En mode automatique, la plateforme doit permettre au facilitateur de mettre l'horloge en pause à tout moment et de reprendre la main manuellement, sans perdre la position atteinte dans le déroulé. Le mode automatique et le mode manuel doivent s'appuyer sur la même file d'attente d'injects à venir (l'équivalent d'un MEL, Master Event List) ; seul le mécanisme qui fait avancer cette file diffère. Cette pause est un outil tactique de pilotage, à distinguer de l'arrêt d'urgence du chapitre 5.9, qui est un dispositif de sûreté.
3. **Deux horloges, deux interfaces.** La plateforme doit distinguer deux temps pendant un exercice. L'**horloge réelle** mesure le temps effectivement écoulé depuis le lancement : elle sert au pilotage et n'a aucun intérêt pour le joueur. L'**horloge fictive** porte le temps du scénario, celui que vivent les personnages de la crise. L'interface du participant n'affiche que l'horloge fictive, l'horloge réelle en étant absente. L'interface du facilitateur affiche les deux, la réelle pour tenir son déroulé, la fictive pour savoir où en est le scénario.
4. **L'horloge fictive avance par sauts.** Le temps fictif ne défile pas à un rythme accéléré : il progresse par sauts explicites. Lorsqu'un saut survient, le participant voit s'afficher la nouvelle date du scénario, «Nous sommes à J+3» par exemple. Ce mécanisme répond aux scénarios à cinétique lente, cyberattaque ou inondation notamment, dont la crise se déroule sur plusieurs jours quand l'exercice ne dure que quelques heures. Un scénario sans aucun saut se joue en temps réel, sans traitement particulier.
5. **Le saut est un attribut de l'inject.** Un saut de temps est paramétré sur l'inject qui le porte, au moment de préparer l'exercice, par le facilitateur ou par un profil supérieur habilité selon les règles du chapitre 3. Il n'existe donc pas d'horloge fictive à piloter séparément : déclencher l'inject installe la date qu'il annonce, ce qui vaut indifféremment en mode automatique et en mode manuel (points 1 et 2). Les participants ne peuvent en aucun cas agir sur cette date.
6. **Le MEL reste cadencé en temps réel.** La file d'attente des injects à venir est ordonnée et déclenchée en temps réel, par le minuteur ou par le facilitateur. Le temps fictif ne commande jamais l'envoi : il est une donnée portée par les injects et affichée au participant. Cette exigence prolonge le principe du point 2, la file restant unique quel que soit le mécanisme qui la fait avancer.

> ⚠️ **Amendé le 23/07/2026 — voir ARB-1** (`docs/decisions/architecture-decisions.md`). Décision de Thomas : **c'est l'horloge fictive qui commande l'envoi**, pas le temps réel. L'horloge fictive devient un objet persisté sur l'instance, avancé par le facilitateur ou par un moteur automatique à cadence fixe ; les injects « temps écoulé » se déclenchent quand elle atteint leur position. Les points 5 et 6 ci-dessus sont donc renversés.
7. **Déclenchement manuel d'injects.** La plateforme doit permettre au facilitateur de déclencher un inject à la demande.
8. **Concurrence entre facilitateurs.** Lorsque plusieurs facilitateurs pilotent la même instance, la plateforme doit garantir qu'un inject ne peut être déclenché qu'une seule fois, quel que soit le nombre de facilitateurs qui actionnent le même bouton simultanément. Le déclenchement, la pause, la reprise et l'arrêt d'urgence sont des actions idempotentes à l'échelle de l'instance. Chaque facilitateur doit voir en temps réel l'état du MEL et l'identité de l'auteur de la dernière action de pilotage. La v0.1 posait un pilotage conjoint sans jamais traiter ce cas, qui produirait des doubles envois.
9. **Tableau de bord par exception.** Le tableau de bord du facilitateur doit fonctionner par exception plutôt que par exhaustivité. Il doit remonter en priorité les équipes qui décrochent (silence prolongé, absence de réponse à un point de décision), plutôt que d'afficher à plat l'ensemble des équipes, ce qui serait ingérable au-delà de quelques dizaines d'équipes. Les seuils de décrochage (durée de silence par exemple) sont une proposition à paramétrer, à valider.
10. **Accès au détail d'une équipe.** Depuis le tableau de bord, le facilitateur doit pouvoir ouvrir la vue d'une équipe signalée et consulter ce qu'elle a reçu et produit, sans quitter son poste de pilotage ni parcourir les autres équipes.
11. **Boîte de réception du facilitateur.** Les messages émis par un participant vers un persona qui n'est pas délégué à l'IA doivent arriver dans une boîte de réception unique du facilitateur, groupée par persona et par équipe, d'où il peut répondre en incarnant ce persona. Sans cet écran, un message de participant se perd et le point 5.4 sur l'écriture des participants n'a aucun destinataire.
12. **Relance manuelle.** La plateforme doit permettre au facilitateur d'écrire et d'envoyer en direct un message de relance à une équipe passive, en choisissant le canal et le persona émetteur. En version 1, cette relance est tapée à la main.
13. **Événements typés et horodatés.** Chaque message envoyé par un facilitateur doit être enregistré, dès la version 1, comme un événement typé et horodaté, afin de rendre possible sans reconstruction l'évolution en version 2 (bibliothèque de relances, assistance IA). L'horodatage retient les deux temps, réel et fictif, le premier servant au débrief et à l'audit, le second à la relecture du scénario.
14. **Vue de présence et taux de participation.** Le tableau de bord du facilitateur doit afficher, pour chaque instance, la liste des participants présents et des absents, établie par rapport à la liste importée (voir 5.6), ainsi que le taux de participation global de l'exercice.
15. **Clôture de l'instance.** La plateforme doit permettre au facilitateur de clore explicitement une instance. La clôture arrête le MEL, coupe les conversations IA en cours, met fin aux sessions des participants sur un écran de fin, et déclenche la mise à disposition du débrief (voir 5.7). Elle est le point de départ des délais de rétention du chapitre 7.6.

### 5.3 Bruit de fond et Pattern of Life

En complément des injects scénarisés qui font avancer l'intrigue, la plateforme intègre un bruit de fond permanent, destiné à recréer le trafic normal d'une organisation en crise et à forcer les participants à distinguer le signal du bruit, plutôt qu'à traiter tout message reçu comme nécessairement important.

1. **Nature du bruit de fond en version 1.** Le bruit de fond doit être générique et neutre, détaché du thème de la crise en cours (météo, actualité anodine, message de routine).
2. **Une bibliothèque unique, de portée plateforme.** Le bruit de fond constitue une bibliothèque de templates publiée par l'éditeur en portée plateforme, disponible pour n'importe quel scénario de n'importe quel compte racine, catalogue comme sur-mesure. C'est un contenu offert avec le produit. En version 1, seul l'administrateur de la plateforme publie du bruit de fond en bibliothèque ; aucun compte client ne produit ses propres templates.

> ⚠️ **Amendé le 23/07/2026 — voir AD-017 et ARB-7** (élargissement de périmètre MVP assumé). Les clients **peuvent** créer leur propre bruit de fond dès la v1 : responsables d'organisation et au-dessus, et facilitateurs à la portée dérivée de leur contexte d'accès (jamais choisie librement) ; jamais un participant. Le bruit de fond porte **les trois portées** (plateforme, compte racine, organisation), conformément à 5.1 et au ch. 6. Le bruit de **portée plateforme publié par l'éditeur reste visible de tous les utilisateurs**.
3. **Le bruit de fond propre à un facilitateur passe par l'inject ordinaire.** Un facilitateur qui veut un bruit de fond qui lui est propre, dans une autre langue ou avec une couleur locale, l'écrit comme un inject normal de son scénario. Il n'y a pour lui aucune différence de geste ni d'écran, et donc aucun mécanisme à construire. Cette règle vaut aussi pour tout contenu d'ambiance spécifique à un scénario particulier, qui ne relève d'aucun système séparé.
4. **Un template de bruit de fond ne porte pas de cible.** Un template est défini par un canal, un contenu et une source, et rien d'autre. Sa cible de diffusion est fixée au moment où le facilitateur l'associe à son scénario (voir 5.1), avec l'instance entière pour valeur par défaut. Un template ne peut pas savoir à l'avance s'il vise toute une administration cantonale ou une seule cellule de communication.
5. **La source d'un template est une fiche personnage de portée plateforme.** Un template de bruit de fond a un émetteur, donc une fiche personnage, qui suit nécessairement la portée du template.
6. **Préparation et statut de validation.** Le contenu de bruit de fond doit pouvoir être préparé manuellement ou généré par IA en amont de l'exercice. Il doit porter un statut de validation (brouillon ou validé) et ne pouvoir être utilisé dans un exercice réel qu'une fois validé, afin d'éviter qu'un contenu généré automatiquement et non relu ne parte vers un client sans contrôle humain préalable.

### 5.4 Expérience du participant

La plateforme est une web app responsive, sans installation requise. Le poste principal du participant reste l'ordinateur, où se déroule l'essentiel de l'exercice (mail, chat d'équipe, décisions). L'interface facilitateur reste, elle, pensée pour un poste de travail classique, dense en information.

1. **Parité desktop et mobile.** L'ensemble des canaux doit être disponible à la fois sur ordinateur et sur mobile, dans une présentation plus épurée et tactile sur mobile. Aucun canal ne doit être réservé à un seul des deux appareils : un participant doit pouvoir, par exemple, suivre le fil d'actualité simulé sur son téléphone pendant qu'il traite ses mails sur son ordinateur.
2. **Canaux du socle.** Les canaux suivants sont toujours présents, quel que soit le scénario : le mail, un chat d'équipe de type messagerie instantanée, un outil de discussion d'équipe de type messagerie professionnelle, un journal de bord tenant lieu de main courante de la cellule de crise, un espace de décisions, un réseau social simulé de type microblogging, et un site d'actualité simulé. L'espace de décisions est le canal unique de questionnement des équipes, questions à choix ou quiz de décision confondus : il sert à la fois le ressort de jeu et la matière du débrief (voir 5.7), et ne doit donc pas être scindé en deux canaux distincts.
3. **Canaux optionnels, activés selon le scénario.** Les canaux suivants ne sont affichés que si le scénario les mobilise, et restent absents de l'interface sinon : un tableau de bord d'indicateurs, une carte de situation, et un bulletin de vigilance ou d'autorité. Le choix des canaux optionnels actifs est fait à la préparation de l'exercice, par le facilitateur ou un profil supérieur habilité selon les règles du chapitre 3.
4. **Les canaux optionnels restent génériques.** Un canal optionnel ne doit jamais être spécialisé par type de crise : c'est son contenu, défini par le scénario, qui varie, conformément au principe du moteur générique du chapitre 1. Le tableau de bord porte ainsi les alertes du SOC et les systèmes tombés pour une cyberattaque, la hauteur d'eau et les axes coupés pour une inondation, la courbe de température et l'absentéisme pour une canicule, le pointage des effectifs évacués et manquants pour un incendie industriel. La carte de situation porte de la même façon une zone inondée ou un périmètre de sécurité, et le bulletin d'autorité un message Vigicrues, un arrêté préfectoral ou une alerte du CERT. Ajouter un canal par type de crise est explicitement proscrit.
5. **Interruptions actives.** Un appel téléphonique simulé ou une vidéo ne sont pas des onglets et ne relèvent donc ni du socle ni des canaux optionnels : ce sont des interruptions livrées en mode actif au sens du point suivant, qui surviennent où que le participant se trouve dans l'application.
6. **Deux modes de livraison des injects.** La plateforme doit distinguer un mode passif et un mode actif. Le mode passif laisse le contenu disponible dans un canal jusqu'à ce que le participant aille le consulter (mail, publication, article). Le mode actif interrompt le participant où qu'il se trouve dans l'application (popup, appel entrant, vidéo). Cette distinction est un levier de mise en scène pour le facilitateur, indépendant du contenu de l'inject lui-même.
7. **Seule l'horloge fictive est visible.** L'interface du participant affiche la date du scénario et jamais l'horloge réelle de l'exercice, qui ne relève que du pilotage. À chaque saut de temps, la nouvelle date lui est signalée (voir 5.2).

**Ce que le participant peut produire.**

8. **Le participant répond sur le canal d'arrivée.** Le participant doit pouvoir répondre à un inject sur le canal par lequel il l'a reçu, et engager de lui-même une sollicitation ou un commentaire depuis un canal, sans attendre d'y avoir été invité.
9. **Canaux en écriture et canaux en lecture.** Le participant écrit sur le mail, le chat d'équipe, la messagerie professionnelle, le journal de bord, l'espace de décisions et le réseau social. Il ne produit rien sur le site d'actualité, le tableau de bord d'indicateurs, la carte de situation et le bulletin de vigilance ou d'autorité, qui restent en lecture seule : ce sont des canaux d'autorité extérieure, et laisser un joueur y écrire détruirait la mise en scène.
10. **Le réseau social est public à l'échelle de l'instance.** Une publication d'un participant sur le réseau social simulé est visible de tous les participants de l'instance, toutes équipes confondues. Dans un exercice à trois cents communes, une publication maladroite d'une commune est donc vue par les deux cent quatre-vingt-dix-neuf autres. C'est un choix de conception assumé, fidèle à la réalité d'une crise, et un ressort de jeu majeur.
11. **Le participant écrit à un persona.** Le participant doit pouvoir adresser un message à un persona depuis un canal en écriture, en le sélectionnant dans son annuaire. Le message est traité soit par l'IA si le persona lui est délégué (voir 5.5), soit par le facilitateur depuis sa boîte de réception (voir 5.2).
12. **L'annuaire du participant n'est pas un spoiler.** Le participant ne voit dans son annuaire que les personas qui lui ont déjà écrit au cours de l'exercice, augmentés de ceux explicitement marqués joignables dès le lancement à la préparation du scénario (le support informatique, l'astreinte, l'autorité de tutelle). Sans cette règle, voir «Jean Moreau, journaliste» dans ses contacts dès la première minute annonce au joueur que la presse va sortir.
13. **Tout ce que le participant produit est un événement typé, horodaté et attribué**, au même titre que les injects et les décisions, et alimente le débrief (voir 5.7).

**Le rattrapage après une déconnexion.**

14. **L'exercice ne s'arrête pas pour un absent.** L'horloge, le MEL et les autres équipes poursuivent leur cours indépendamment de la présence effective d'un participant. Aucun mécanisme de mise en attente de l'exercice au bénéfice d'un participant déconnecté n'est prévu.
15. **Les injects manqués sont livrés au retour.** Un participant qui perd sa connexion puis revient doit retrouver l'intégralité de ce qui lui était destiné pendant son absence, injects collectifs comme injects individuels, dans l'ordre où ils ont été émis. Cette exigence est déterminante pour l'architecture : elle impose une boîte de réception persistante par destinataire, et interdit de fonder la livraison sur une simple diffusion volatile en temps réel.
16. **Le retour est signalé par des notifications par canal.** L'interface doit indiquer, canal par canal, le nombre de contenus non consultés, sous forme d'un compteur visible sur l'icône du canal concerné : un «3» en rouge sur l'icône du canal mail signale trois messages reçus pendant l'absence.
17. **Un inject en mode actif manqué est dégradé en mode passif.** Un appel entrant ou une popup émis pendant l'absence ne sont pas rejoués comme des interruptions au retour du participant, mais déposés comme un contenu consultable dans le canal correspondant, assorti de l'heure fictive à laquelle ils ont eu lieu. Faire sonner maintenant un appel qui a eu lieu il y a vingt minutes n'a aucun sens.
18. **La date fictive au retour est celle de l'instance.** Un participant qui revient est immédiatement replacé à la date fictive courante de l'instance, et non à celle portée par le premier inject qu'il rattrape. Les sauts de temps survenus pendant son absence lui sont signalés dans l'ordre, mais ne le ramènent jamais en arrière.
19. **Le rattrapage est tracé.** L'écart entre l'heure d'émission d'un inject et l'heure de sa consultation effective est conservé et exploitable au débrief : il distingue une équipe qui n'a pas réagi d'une équipe qui n'était pas là.

### 5.5 Personas et role-player IA

Certains personas de l'exercice peuvent être incarnés soit par un role-player humain, soit par une intelligence artificielle, de façon transparente pour le participant qui ne perçoit aucune différence entre les deux. Ce bloc est dans le périmètre de la version 1.

**La fiche personnage et le briefing.** Un persona se décompose en deux objets distincts. Cette séparation est la condition de la réutilisation d'un personnage d'un scénario à l'autre : mettre la connaissance de la crise dans un objet réutilisable ferait qu'un journaliste évoquerait une fuite de données bancaires à un syndic vaudois, ce qui serait une fuite de contenu entre clients produite par le moteur lui-même.

1. **La fiche personnage est permanente et réutilisable.** Elle porte ce que le personnage est indépendamment de toute crise : prénom, nom, métier, fonction, employeur ou média de rattachement, domaine d'expertise, ton et style de langage. Elle est créée à la volée depuis l'éditeur d'inject au moment de désigner l'expéditeur, enregistrée en base, et réutilisable dans tout autre inject et tout autre scénario relevant de sa portée.
2. **La fiche personnage porte une portée de réutilisation.** Elle obéit aux trois portées du chapitre 5.1, avec les mêmes règles de clonage, de lecture seule et d'archivage. Une fiche de portée plateforme est donc utilisable aussi bien par les scénarios catalogue de l'éditeur que par le sur-mesure d'un client.
3. **Le briefing est propre à un scénario.** Il porte ce que le personnage sait de cette crise-ci, ce qu'il en ignore, ce qu'il cherche à obtenir, et ce qu'il ne fera jamais. Un même personnage porte autant de briefings que de scénarios où il apparaît.
4. **Le briefing n'a pas de portée propre : il appartient au scénario et en hérite.** Un compte qui clone un scénario de portée plateforme emporte le briefing dans son clone et peut le retoucher librement, sans jamais toucher à la fiche personnage, qui reste l'actif éditorial de la plateforme. Pour un scénario catalogue, le briefing est écrit à l'avance et livré avec le scénario, de sorte qu'il est prêt à jouer sans travail préalable du facilitateur qui l'utilise.
5. **Le prompt système n'est pas un objet stocké.** Le prompt effectivement transmis au modèle est assemblé au moment de l'appel, à partir de la fiche personnage, du briefing du scénario joué et du fil de la conversation en cours. Il n'existe donc pas de champ «prompt système» à saisir, ni à maintenir en double.
6. **La version figée de l'instance emporte fiches et briefings.** Conformément à l'exigence 5.1.16, l'instance fige à son lancement la version des fiches et des briefings mobilisés, afin que le débrief reste fidèle à ce qui a effectivement été joué.

**Le role-player IA.**

7. **Choix persona par persona et message par message.** La plateforme doit permettre au facilitateur de choisir, pour chaque persona et même pour chaque message, s'il répond lui-même ou s'il délègue à l'IA. Un persona non délégué à l'IA fait arriver les messages qui lui sont adressés dans la boîte de réception du facilitateur (voir 5.2.11).
8. **Déclenchement aligné sur les injects.** Le déclenchement d'une prise de parole d'un persona IA doit suivre exactement les mêmes règles que n'importe quel autre inject : lancement manuel par le facilitateur, ou automatique par le chrono si ce mode a été configuré à la préparation.
9. **Autonomie de conversation.** Une fois la conversation lancée, l'IA doit la poursuivre en autonomie complète, en générant et envoyant ses réponses aux messages des participants sans validation humaine message par message. Ce choix est nécessaire pour supporter un grand nombre d'équipes en simultané avec peu de facilitateurs.
10. **Cloisonnement du contexte d'appel.** Un appel au modèle ne doit jamais transporter autre chose que la fiche, le briefing et le fil de la conversation en cours avec cette équipe. Aucun contenu d'une autre équipe, d'une autre instance ou d'un autre compte ne doit entrer dans le contexte, quelle qu'en soit la commodité technique.
11. **Garde-fou de reprise en main.** La plateforme doit permettre à tout moment à un facilitateur de reprendre la main sur une conversation IA en cours, sans interrompre le fil pour le participant.
12. **Garde-fou de journalisation.** La plateforme doit journaliser de façon complète et systématique chaque message généré par l'IA, avec le contexte qui l'a produit, consultable après coup, notamment si un client s'interroge sur un échange précis lors du débrief.
13. **Coupure de l'IA à l'arrêt et à la clôture.** Toute conversation IA en cours est immédiatement interrompue par un arrêt d'urgence (voir 5.9) comme par la clôture d'une instance (voir 5.2.15). Aucun message généré ne doit partir après l'un ou l'autre de ces événements.

Point de vigilance à porter au cadrage technique et à la sécurité : le flux IA autonome est le seul de toute l'application où du contenu part vers un participant sans supervision humaine préalable. Les garde-fous ci-dessus ne sont pas optionnels ; ils sont la contrepartie de l'autonomie. Le fournisseur retenu et les conséquences de ce flux sur la localisation des données sont traités au chapitre 7.

### 5.6 Gestion des accès et inscription des participants

La traçabilité nominative des participants est requise, notamment pour répondre aux exigences de preuve de participation des clients soumis à DORA. Pour un exercice de grande ampleur, cette traçabilité ne doit jamais reposer sur un effort d'inscription individuel, qui deviendrait un obstacle à la participation à grande échelle. La charge d'inscription est donc portée par l'organisateur de la mission, pas par chaque participant.

1. **Import de liste en amont.** La plateforme doit permettre d'importer en amont une liste de participants comportant, pour chacun, son nom, son email professionnel, son équipe et son rôle éventuel dans cette équipe. C'est cet import qui rattache une personne réelle à chaque rôle abstrait du scénario (voir 5.1), et qui rend donc possibles à la fois le ciblage effectif des injects, la traçabilité nominative et l'attribution du débrief.
2. **Un rôle unique par participant.** Un participant appartient à une seule équipe et n'y porte qu'un seul rôle. Le rôle est à la fois un axe de ciblage (voir 5.1.7) et le seul axe d'agrégation individuelle du débrief (voir 5.7) ; le charger d'informations de ciblage circonstancielles le rendrait inexploitable en débrief.
3. **Restitution de l'import.** L'import doit rendre compte à l'écran, avant validation, du nombre d'équipes et de participants créés, de la liste des rôles reconnus, et des anomalies détectées (doublon d'email, ligne incomplète, équipe à un seul membre). Il alimente le contrôle de cohérence avant lancement de l'exigence 5.1.11.
4. **Lien personnel unique.** Chaque participant doit recevoir par email un lien personnel unique, qui le rattache automatiquement à son équipe sans création de compte ni mot de passe à retenir.
5. **Portée et durée de vie du lien.** Le lien n'est valable que pour une instance et n'ouvre aucun droit au-delà d'elle. Il cesse de fonctionner à la clôture de l'instance. Il doit être révocable individuellement et regénérable par le facilitateur. La plateforme doit accepter la reprise de session depuis un autre appareil avec le même lien, ce qui est le cas normal d'un participant qui passe de son ordinateur à son téléphone.
6. **Limite assumée du lien personnel.** Un lien transmissible sans authentification fait reposer la preuve de participation sur une présomption : la plateforme atteste que le porteur du lien s'est connecté, non que la personne nommée était devant l'écran. Cette limite est le prix de l'objectif 1 du chapitre 2 ; elle doit être connue et énoncée au client plutôt que masquée, et elle est rappelée dans le livrable de débrief (voir 5.7).
7. **Accès de secours.** La plateforme doit offrir un accès de secours pour les organisations qui n'auraient pas préparé leur liste à temps, ou pour les retardataires : un accès par code ou QR code, où la personne indique rapidement son nom et son email, et sélectionne son équipe dans une liste déroulante plutôt que de la saisir librement, afin d'éviter les doublons.
8. **Distinction de l'origine.** L'accès de secours doit rester tracé, mais avec une origine distincte (auto-inscrit plutôt qu'invité), afin de savoir ensuite qui manquait à l'appel par rapport à la liste prévue. Cette distinction alimente à la fois le taux de participation (voir 5.2.14) et les compteurs de facturation (voir chapitre 8).

### 5.7 Débrief et export

Chaque décision et chaque interaction pendant un exercice est conçue comme un événement horodaté et attribué à une équipe et, le cas échéant, au rôle du participant concerné. Cette donnée est la matière première du débrief, et la seule preuve que l'exercice a eu lieu.

1. **Capture des décisions et des interactions.** La plateforme doit capturer chaque décision et chaque interaction comme un événement horodaté, attribué à une équipe et au rôle du participant lorsqu'il en porte un. L'horodatage retient les deux temps, réel et fictif.
2. **Vues agrégées.** La plateforme doit produire des vues de débrief agrégées par décision, par équipe et par rôle, alimentant une After-Action Review. L'agrégation par rôle est indispensable aux exercices à cellule unique, où l'agrégation par équipe ne distingue plus rien.
3. **Délai de réaction.** Les vues de débrief doivent exposer, pour chaque inject appelant une réaction, le délai écoulé entre son émission et la première réponse de l'équipe, ainsi que l'écart de consultation issu de l'exigence 5.4.19. C'est la mesure la plus directement exploitable en After-Action Review.
4. **Export du livrable de débrief.** La plateforme doit permettre d'exporter, à la clôture d'une instance, un livrable autoportant et figé comprenant l'identification de l'exercice (client, date, scénario et sa version), la liste nominative des participants présents et absents avec leur origine et le taux de participation, le déroulé complet des injects effectivement émis avec leurs deux horodatages, les décisions prises et les réponses apportées par équipe et par rôle, les délais de réaction, et la mention de la limite de preuve de l'exigence 5.6.6. Ce livrable est le seul artefact qui survit à la purge des données d'instance ; il est donc conçu pour être lisible sans la plateforme.
5. **Le livrable est la preuve.** Le livrable exporté est ce que le client soumis à DORA verse à son programme de tests de résilience opérationnelle et présente le cas échéant à son autorité compétente. Sa conservation relève du client, une fois exporté ; la plateforme n'a pas vocation à tenir l'archive réglementaire de ses clients. Cette répartition doit être explicite dans le contrat (voir 8.2).
6. **Journal des messages IA joint sur demande.** Le journal complet de l'exigence 5.5.12 doit pouvoir être exporté en annexe du livrable, afin de répondre à un client qui s'interroge sur un échange précis.
7. **Formats.** Le livrable est exporté en un format documentaire lisible en l'état et en un format tabulaire réexploitable. Les formats précis sont à arrêter au cadrage technique.

### 5.8 Administration des comptes et attribution des profils

Ce bloc est la traduction fonctionnelle du modèle de profils du chapitre 3. Puisque la plateforme sert deux modèles d'usage avec la même application (chapitre 1), la nature de la structure titulaire du compte doit être déterminée une fois, à la création, et commander ensuite ce que l'administration des profils propose à l'écran. À défaut, rien n'empêcherait de construire un écran générique unique où la modification resterait offerte partout par défaut.

1. **Question posée à la création du compte.** La création d'un compte doit comporter un champ déterminant sa nature : cabinet de conseil, ou organisation autonome. Cette réponse est renseignée dans le back-office par l'administrateur de la plateforme au moment de la configuration du compte (chapitre 8), et non choisie en libre-service par le client.
2. **Affichage différencié de l'administration des profils.** L'écran d'attribution des profils ne doit pas proposer les mêmes options selon la nature du compte. Un compte de cabinet propose les profils de responsable de cabinet et de facilitateur, ainsi que l'espace de création de ses organisations clientes. Un compte d'organisation autonome propose directement les profils de responsable d'organisation, de responsable de filiale et de facilitateur, et n'expose jamais la notion de cabinet, qui lui est simplement absente plutôt que grisée.
3. **Affichage différencié des permissions.** Pour les profils de responsable d'organisation et de responsable de filiale, les champs de consultation et de modification affichés à l'écran doivent refléter le modèle d'usage : modifiables en modèle autonome, en lecture seule lorsque l'organisation est servie par un cabinet.
4. **Le front n'est jamais la sécurité.** Les deux exigences précédentes relèvent du confort d'usage et de la lisibilité. Elles ne constituent en aucun cas la barrière de sécurité, qui est imposée côté serveur à chaque requête, indépendamment de ce qui est affiché (voir le chapitre 7).
5. **Nature du compte figée en version 1.** La nature d'un compte est fixée à sa création et n'est pas modifiable par le client. Un changement de nature, par exemple une organisation autonome qui engage ensuite un cabinet, reste un cas exceptionnel traité manuellement par l'administrateur de la plateforme.
6. **Attribution des profils par invitation nominative en cascade.** L'attribution d'un profil à une personne, à l'intérieur d'un compte déjà créé, se fait par invitation et non par inscription libre. Un profil ne peut inviter que vers un profil de niveau égal ou inférieur au sien au sens de la hiérarchie imbriquée du chapitre 3.2, et uniquement à l'intérieur de son propre périmètre : le responsable de cabinet invite les responsables d'organisation cliente et les facilitateurs de son cabinet ; le responsable d'organisation invite les responsables de filiale et les facilitateurs de son organisation ; le responsable de filiale invite les facilitateurs de sa filiale. La création du compte racine lui-même reste hors de ce mécanisme et demeure la seule prérogative de l'administrateur de la plateforme (voir point 1).
7. **La plateforme ne vérifie pas l'appartenance réelle de l'invité.** Comme pour tout accès B2B de ce type, la plateforme ne contrôle jamais que la personne invitée travaille effectivement pour l'organisation qui l'invite. Cette confiance est déléguée à l'inviteur, dont l'identité a été vérifiée en amont par l'administrateur de la plateforme au moment du devis (voir 8.1).
8. **Lien d'invitation nominatif, borné et à usage unique.** L'invitation doit être émise pour une adresse email précise saisie par l'inviteur, et ne doit activer que ce compte-là, avec le profil et le périmètre choisis par l'inviteur. Elle expire au bout d'une semaine si elle n'a pas été utilisée, et devient invalide dès qu'elle a servi une fois.
9. **Renvoi en un clic et journalisation.** Passé le délai d'expiration, l'inviteur doit pouvoir renvoyer l'invitation à la même personne, pour le même profil et le même périmètre, sans ressaisie. Le renvoi génère un nouveau lien et invalide immédiatement l'ancien, même non utilisé. Toute émission ou tout renvoi d'invitation est enregistré comme un événement horodaté et attribué, au même titre que les autres actions journalisées au chapitre 7.10.

### 5.9 Sûreté de l'exercice

Une simulation de crise produit des contenus qui ressemblent à s'y méprendre à des contenus réels : mails, articles de presse, publications, alertes d'autorité. Deux risques en découlent, et ils sont opérationnels avant d'être techniques. Un contenu simulé peut sortir du périmètre de l'exercice et être pris pour réel. Une vraie crise peut survenir pendant l'exercice, et il faut alors pouvoir tout arrêter en quelques secondes. Ce bloc est une exigence de sûreté ; il n'est pas négociable et conditionne la vente à des clients régulés.

**Le marquage des contenus.**

1. **Mention automatique sur chaque inject.** La plateforme doit ajouter automatiquement une mention d'exercice à la fin du contenu de chaque inject émis, du type «EXERCICE - EXERCICE». Cette mention est ajoutée par le moteur et n'est ni saisie ni supprimable par le facilitateur.
2. **Mention dans l'objet des messages.** La mention doit également figurer en tête de l'objet des mails et des messages, et non seulement en fin de contenu. Une capture d'écran ou un aperçu de notification ne montre que le début d'un message.
3. **Bandeau permanent de l'interface.** L'interface du participant doit porter en permanence un bandeau d'exercice visible, sur ordinateur comme sur mobile, indépendamment du canal consulté et du contenu affiché. Les contenus sans texte de fin, un appel entrant, une popup, une vidéo, une carte, un tableau de bord, ne sont couverts que par ce bandeau.
4. **Le marquage survit à l'export.** Tout contenu exporté ou imprimé depuis la plateforme conserve la mention.

**L'arrêt d'urgence.**

5. **Un dispositif distinct de la pause.** L'arrêt d'urgence n'est pas la mise en pause tactique de l'exigence 5.2.2. Il est destiné à la survenue d'un événement réel pendant l'exercice, et doit être atteignable en un geste depuis n'importe quel écran de pilotage.
6. **Qui peut l'actionner.** Le facilitateur de l'instance, ainsi que tout profil supérieur habilité de son arbre au sens du chapitre 3. Aucun participant, en aucune circonstance.
7. **La sécurité du déclenchement.** Le déclenchement se fait en deux temps. Un bouton d'arrêt d'exercice, puis une confirmation demandant la ressaisie du mot de passe de l'utilisateur et la rédaction du message qui sera affiché aux participants. Ce double garde-fou évite l'arrêt accidentel d'un exercice à trois cents cellules.
8. **Les effets de l'arrêt.** L'arrêt d'urgence gèle immédiatement le MEL, interrompt toute conversation IA en cours, empêche tout nouvel envoi quelle qu'en soit l'origine, et affiche à tous les participants de l'instance une popup non refermable portant le message rédigé par l'auteur de l'arrêt. Cette popup est le seul contenu de la plateforme qui ne porte pas la mention d'exercice, puisqu'elle est précisément le message qui sort de la fiction.
9. **La reprise est explicite.** Une instance arrêtée en urgence ne redémarre jamais d'elle-même. Sa reprise éventuelle est une action explicite et tracée, distincte de la reprise après une pause.
10. **L'arrêt est un événement de premier ordre.** L'arrêt, son auteur, son horodatage, son message et la position du MEL au moment du gel sont journalisés et figurent dans le livrable de débrief (voir 5.7).

---

## 6. Modèle conceptuel des données

Ce chapitre décrit les entités clés et leurs relations à un niveau volontairement non technique. Le schéma technique détaillé n'est pas l'objet de ce chapitre : il sera produit dans le document d'architecture.

**Les objets fondateurs de l'inject.** Toute l'application repose sur quatre objets centraux. La **source**, c'est-à-dire une fiche personnage, incarnée par un humain ou par une IA (voir 5.5). Le **canal** (l'onglet par où le contenu arrive au joueur, appartenant soit au socle permanent, soit aux canaux optionnels activés selon le scénario, voir le chapitre 5.4). L'**inject** (le contenu lui-même). Le **déclencheur** (ce qui fait apparaître l'inject : le temps réel écoulé depuis le lancement, une action du facilitateur, plus tard une décision du joueur). Un inject peut enfin porter un **saut de temps**, qui installe une nouvelle date fictive au moment où il est déclenché (voir le chapitre 5.2) ; le temps fictif est donc une donnée transportée par les injects, et non une horloge autonome.

> ⚠️ **Amendé le 23/07/2026 — voir ARB-1.** Le déclencheur « temps écoulé » se réfère à l'**horloge fictive** et jamais au temps réel ; le temps fictif **est** une horloge autonome, persistée sur l'instance. Le canal, par ailleurs, est une **liste fermée** définie par la plateforme (AD-009).

> ⚠️ **Amendé le 23/07/2026 — voir ARB-5.** La cible d'un inject est l'**intersection de trois dimensions facultatives** : périmètre d'équipes × filtre de rôles × personnes nommées. Le **rôle n'est jamais obligatoire**. Les personnes nommées ne sont renseignées qu'au niveau de l'**instance**, jamais dans le scénario réutilisable.

> ⚠️ **Amendé le 23/07/2026 — voir ARB-2.** L'« état d'avancement par équipe » décrit plus bas est **confirmé** : chaque équipe porte sa propre position. En v1 toutes les valeurs sont identiques (rythme commun), la divergence v2 s'ouvrant sans migration.

**La cible de diffusion.** Un inject porte en outre une cible, qui n'est pas une valeur unique mais le croisement de deux dimensions, chacune multi-valuée. Le **périmètre d'équipes** vaut l'instance entière ou une liste d'équipes. Le **filtre de rôles** vaut tous les membres ou une liste de rôles. Le destinataire effectif est l'intersection des deux. C'est cette cible qui permet à un même scénario générique de distribuer un contenu différencié selon la fonction de chacun, sans dupliquer le contenu. Elle est toujours exprimée de façon abstraite, par un nom d'équipe ou de rôle et jamais par un nom propre : c'est l'instance qui, par l'import de la liste des participants (voir 5.6), rattache une personne réelle à chaque rôle. Le nom propre n'est pour autant ni perdu ni masqué, l'instance le connaît et s'en sert pour l'envoi effectif, pour la traçabilité nominative et pour l'attribution du débrief.

**Le contenu réutilisable et sa portée.** Trois objets sont des actifs de contenu durables, indépendants de toute exécution : le **scénario**, la **fiche personnage** et le **template de bruit de fond**. Chacun porte une **portée de réutilisation** à trois valeurs, plateforme, compte racine ou organisation, qui détermine qui peut le voir, l'utiliser et le cloner (voir 5.1). La portée est l'unique mécanisme de partage du contenu ; il n'en existe pas d'autre. Le **briefing** est le seul objet de contenu sans portée propre : il est rattaché à un couple fiche personnage et scénario, et hérite de la portée de ce dernier.

**La distinction scénario contre instance.** Le **scénario** est le plan écrit, réutilisable, qui contient la liste des injects et leur séquence ; c'est un actif durable. L'**instance** est une exécution réelle de ce plan, à une date donnée, pour un client donné, avec de vraies équipes ; c'est une donnée vivante et temporaire. Le scénario est modélisé comme un graphe dès la version 1, même si chaque étape ne pointe encore que vers une seule étape suivante ; ce choix permet d'ajouter un vrai branchement en version 2 sans reconstruire l'architecture.

**Le figement de l'instance.** Une instance ne référence pas les actifs vivants de la bibliothèque : elle en fige à son lancement une version immuable, scénario, séquence, injects, fiches personnages et briefings compris (voir 5.1.16). Le modèle de données doit donc distinguer l'actif éditorial, qui vit et se corrige, de la version jouée, qui ne bouge plus jamais. C'est la condition à la fois de la valeur probante du débrief et de la liberté éditoriale de l'éditeur, qui peut corriger un scénario catalogue sans altérer l'histoire des exercices déjà joués.

**La hiérarchie des comptes.** Elle répond à une seule question : qui a accès à quoi. Elle ne prend pas la forme d'une chaîne unique dont on retirerait des maillons, mais de deux arbres selon le modèle d'usage (chapitre 1).

1. Modèle piloté : un **cabinet**, une **organisation** cliente, une **filiale** facultative, une **mission**, une **instance**.
2. Modèle autonome : une **organisation**, une **filiale** facultative, une **mission**, une **instance**.

Ces deux listes s'arrêtent volontairement à l'instance. L'arbre ne s'arrête pas là pour autant : l'instance se compose ensuite d'équipes et de participants, décrits plus bas, qui relèvent d'une autre question et ne sont donc pas des niveaux de la hiérarchie des comptes.

Le sommet de cet arbre est le **compte racine** au sens du chapitre 7 : un cabinet dans le premier cas, une organisation dans le second. L'organisation ne disparaît jamais, dans aucun des deux modèles ; seule sa position change, au sommet quand elle est autonome, sous le cabinet quand elle est cliente. Une instance correspond à un exercice joué : «exercice» côté métier, «instance» côté technique, un seul et même objet.

Une seule couche est réellement facultative à l'intérieur d'un arbre donné, la **filiale** : une mission ou une instance peut être rattachée directement à l'organisation quand celle-ci n'a pas de filiales. Le **cabinet** n'est pas une couche facultative mais la marque du modèle piloté : présent, il coiffe plusieurs organisations clientes indépendantes les unes des autres ; absent, l'organisation est elle-même titulaire du compte. Ces deux couches ne sont surtout pas interchangeables : une filiale appartient au même groupe que sa maison mère, alors qu'une organisation cliente d'un cabinet est une entreprise entièrement indépendante. Un portefeuille de clients ne doit donc jamais être modélisé comme un ensemble de filiales.

La **mission** est une couche à part entière de l'arbre, et non un simple regroupement d'affichage. Le chapitre 3 le tranche : elle est l'unité de rattachement des droits et du contenu sur-mesure partagés entre facilitateurs. La v0.1 la présentait comme un point à finaliser en architecture alors que le chapitre 3 en avait déjà fait un porteur de droits.

Le cabinet et l'organisation autonome constituent donc les deux formes possibles du compte racine, seule frontière d'isolation de la plateforme. Aucune donnée d'un compte racine, aucune identité de titulaire, ne traverse cette frontière. Le contenu de portée plateforme n'est pas une exception à cette règle : il n'appartient à aucun compte racine, il appartient à l'éditeur. Les organisations clientes d'un même cabinet, qui ne sont pas des comptes racine, sont cloisonnées entre elles par une règle distincte (voir le chapitre 7).

**La composition interne d'un exercice.** Elle répond à une question différente : comment l'exercice se joue. Une instance réunit une ou plusieurs **équipes**, et chaque équipe compte un ou plusieurs **participants**, chacun pouvant porter un **rôle**. L'équipe et le participant ne sont pas des niveaux de la hiérarchie des comptes : ils ne délimitent aucun périmètre de droits ni d'isolation. Ils commandent en revanche ce que chacun reçoit pendant l'exercice, par le jeu de la cible de diffusion, ce qui est un mécanisme d'acheminement du contenu et non d'autorisation d'accès aux données. Une équipe d'une seule personne est parfaitement valide, la DRH tenant à elle seule lieu de cellule RH dans un petit exercice.

Cette séparation couvre les deux configurations sans mode particulier ni écran supplémentaire. Un exercice à cellule unique est une instance à une seule équipe, dont les fonctions (RH, communication, pilotage, juridique) sont portées par les rôles de ses participants. Un exercice de grande ampleur est une instance à plusieurs équipes, chacune portant une fonction, avec le cas échéant des rôles à l'intérieur de chacune. Elle couvre de la même façon les cas d'usage du chapitre 1 : des filiales qui s'entraînent en autonomie, chacune avec sa propre instance, et un exercice unique et massif partagé par des centaines d'équipes sous une même horloge.

**Deux populations, deux modèles d'identité.** Les **utilisateurs de la plateforme** ont un compte authentifié et portent un profil ; ils vivent en dehors des instances et leur durée de vie est celle du compte. Les **participants** n'ont pas de compte : leur identité est éphémère, rattachée à une seule instance, produite par l'import ou l'accès de secours, portée par un lien personnel, et détruite avec la purge de l'instance (voir 3.1 et 7.6). Ce sont deux tables, deux mécanismes d'authentification et deux cycles de vie distincts. La même personne physique peut naturellement être l'un et l'autre, un facilitateur qui joue un exercice chez un confrère par exemple, sans qu'aucun lien technique ne soit établi entre ses deux existences.

**La boîte de réception par destinataire.** L'exigence de rattrapage (5.4.15) impose que chaque contenu destiné à un participant soit persisté à son adresse, avec son état de consultation, et non seulement diffusé en temps réel. Le temps réel est un mécanisme de notification posé au-dessus de cette persistance, jamais le support de la livraison lui-même. C'est la décision de modélisation la plus structurante du chapitre pour l'architecture technique.

**L'état d'avancement par équipe.** Chaque équipe possède son propre état d'avancement dans le scénario, indépendant d'une simple horloge globale partagée. C'est cette donnée qui permettra plus tard à deux équipes de suivre des chemins différents si le branchement de la version 2 est activé, sans retoucher le modèle de données à ce moment-là.

---

## 7. Exigences non fonctionnelles

1. **Scalabilité.** La plateforme doit supporter 300 cellules et 1500 connexions simultanées lors d'un exercice massif, sans dégradation perceptible de la livraison des injects. La confirmation de cette cible est subordonnée à son coût d'infrastructure (voir chapitre 9).
2. **Souveraineté et localisation des données.** La souveraineté est une ambition commerciale ferme et un argument de vente, non une exigence imposée par un client identifié. L'hébergement doit être assuré par une entreprise française, ou au pire européenne, tout en offrant des régions d'hébergement en Suisse, aux États-Unis et au Canada pour répondre aux exigences de localisation de certains clients. OVHcloud est le candidat retenu (entreprise française cotée à Paris, datacenters en Amérique du Nord, site à Zurich), sous réserve du point ouvert du chapitre 9 sur la disponibilité effective des services managés à Zurich. La couverture multi-régions n'est pas une exigence de la version 1 : elle est une capacité à ouvrir à la demande, la version 1 pouvant se déployer sur une région unique.
3. **SecNumCloud.** Le label SecNumCloud de l'ANSSI n'est pas une propriété d'OVHcloud dans son ensemble mais une offre qualifiée distincte, à catalogue de services restreint et à coût sensiblement supérieur. DORA ne l'exige pas. Il constitue donc un argument de confiance mobilisable et une cible éventuelle, et non un acquis de l'hébergement chez OVHcloud. Aucune communication commerciale ne doit laisser entendre le contraire tant que l'offre qualifiée n'est pas effectivement souscrite.
4. **Pile technique retenue.** Supabase est retenu en **auto-hébergement**, ce qui préserve la souveraineté sans renoncer à ses services, y compris sa couche temps réel. Ce choix referme le point ouvert de la v0.1 sur l'infrastructure temps réel, et transfère en contrepartie à l'exploitant la charge des sauvegardes, des montées de version, de la supervision et de la haute disponibilité du service temps réel à 1500 connexions. Cette charge est une exigence d'exploitation à part entière, à dimensionner au cadrage technique, et non un effet de bord du choix.
5. **Fournisseur de modèle d'IA.** Mistral est retenu pour le role-player IA (voir 5.5), au motif de la cohérence avec l'exigence de souveraineté, et en connaissance d'un écart de performance assumé avec les modèles américains. Ce choix est structurant : recourir à un fournisseur non européen ferait sortir vers un pays tiers les messages réels de participants identifiés, ruinerait la promesse de souveraineté et interdirait toute perspective de qualification. Le modèle doit rester interchangeable derrière une couche d'abstraction, afin qu'un changement de fournisseur reste une décision et non une réécriture.
6. **Isolation entre comptes racine.** Une isolation logique est retenue par défaut : les données de tous les comptes partagent la même infrastructure mais sont strictement filtrées et cloisonnées à chaque accès. La frontière d'isolation est le **compte racine**, c'est-à-dire un cabinet ou une organisation autonome (voir le chapitre 6). Chaque compte racine est une boîte noire pour tous les autres, sans exception et quels que soient leurs types respectifs : deux organisations autonomes ne se voient pas, une organisation autonome et un cabinet ne se voient pas, deux cabinets ne se voient pas. L'isolation porte sur le contenu des exercices comme sur l'identité même des titulaires : un compte racine ne doit jamais pouvoir constater l'existence d'un autre, ni voir son nom, la liste de ses clients, ou son activité. Deux réserves, qui ne sont pas des exceptions. Une organisation cliente voit le cabinet qui la sert, ce qui relève de la relation de service elle-même. Et le contenu de portée plateforme est visible de tous, parce qu'il n'appartient à aucun compte racine mais à l'éditeur (voir 5.1) : ce qui traverse la frontière est le contenu de l'éditeur, jamais la donnée d'un client. Une isolation physique optionnelle (base de données dédiée à un client particulièrement sensible) doit rester possible pour des missions à très haute exigence, sans être nécessaire dès la version 1.
7. **Isolation entre organisations d'un même cabinet.** Les organisations clientes d'un même cabinet ne sont pas des comptes racine distincts : l'isolation du point précédent ne les protège donc pas les unes des autres, et une règle distincte est nécessaire. Une organisation cliente ne doit jamais voir les autres organisations du portefeuille de son cabinet, ni leur existence, ni leur nom, ni leur activité. Cette règle est le pendant, au niveau de l'infrastructure, de la portée du profil de responsable d'organisation définie au chapitre 3, qui ne couvre aucune autre organisation. Seul le cabinet, à travers son responsable et ses consultants habilités, voit l'ensemble de son portefeuille.
8. **Isolation imposée côté serveur.** Le cloisonnement décrit aux deux points précédents doit être appliqué côté serveur, sur chaque requête, et ne doit jamais reposer sur l'affichage. L'interface peut masquer un champ ou le présenter en lecture seule pour le confort d'usage (chapitre 5.8), mais un appel direct à l'API, par un outil de développement ou un script, doit se voir opposer exactement le même refus, indépendamment de ce que montre l'écran. Le front reflète la règle, il ne la porte pas.
9. **Trois régimes de rétention.** La v0.1 purgeait les interactions après le débrief tout en exigeant par ailleurs une preuve de participation, ce qui était contradictoire. Trois régimes distincts sont désormais retenus.
   1. **Le contenu réutilisable est conservé sans limite de durée** : scénarios, injects, fiches personnages, briefings, templates de bruit de fond. Il ne contient aucune donnée personnelle de participant.
   2. **Le livrable de débrief exporté est figé et conservé** comme preuve de la tenue de l'exercice (voir 5.7). Sa durée de conservation sur la plateforme est un paramètre à fixer, la conservation de long terme incombant au client une fois l'export réalisé.
   3. **Les données brutes d'instance sont purgées** après la clôture et l'exploitation du débrief : messages échangés, réponses, sessions, identités éphémères des participants. Les instances étiquetées comme test bénéficient d'un délai plus court.
   Les délais précis de chaque régime sont un point ouvert du chapitre 9.
10. **Journal d'audit.** Un journal d'audit doit être tenu, comme extension du principe déjà retenu pour les décisions et les injects : chaque connexion, chaque consultation sensible, chaque modification est un événement horodaté et attribué. Le journal est lui-même soumis aux frontières d'isolation des points 6 à 8 : chacun ne consulte que le journal de son propre périmètre, jamais celui d'un autre. Il relève d'un régime de rétention propre, plus long que celui des données brutes d'instance, faute de quoi la purge effacerait la trace des accès qu'il a précisément pour objet de conserver.
11. **Disponibilité et continuité.** Une plateforme d'exercices de continuité vendue à des entités régulées sera interrogée sur sa propre continuité, dès le premier questionnaire sécurité. Trois exigences en découlent, dont les valeurs sont des propositions à valider. Un objectif de disponibilité en dehors des fenêtres d'exercice de 99,5 pour cent. Un objectif de disponibilité pendant une fenêtre d'exercice planifiée nettement supérieur, l'indisponibilité de la plateforme au milieu d'un exercice à trois cents cellules étant un incident client majeur et non une simple gêne. Une interdiction de toute opération de maintenance pendant une fenêtre d'exercice déclarée. Un objectif de reprise (RTO) et de perte de données maximale admissible (RPO) doivent être fixés au cadrage technique, sachant qu'une instance en cours perdue est un exercice perdu et non rejouable dans la journée.
12. **Dégradation de l'IA.** L'indisponibilité du fournisseur de modèle ne doit jamais interrompre un exercice. En cas d'échec d'un appel, la conversation concernée bascule automatiquement dans la boîte de réception du facilitateur (voir 5.2.11), qui reprend la main, et l'incident est signalé à l'écran de pilotage. Le reste de l'exercice se poursuit normalement.
13. **Performance perçue.** Le délai entre le déclenchement d'un inject et sa réception par le dernier destinataire d'une instance à 1500 connexions ne doit pas excéder quelques secondes, valeur cible à arrêter au cadrage technique. Au-delà, la synchronisation du jeu entre équipes est rompue.

---

## 8. Modèle économique et contraintes commerciales

### 8.1 Accès et facturation

1. **Accès sur devis uniquement.** L'accès à la plateforme n'est jamais ouvert en libre-service par carte bancaire, y compris pour les petits clients. Chaque nouveau client passe par un contact direct et un devis avant que son accès ne soit configuré et activé.
2. **Pas de paiement en ligne en version 1.** Aucune infrastructure de paiement en ligne n'est nécessaire, ce qui simplifie fortement le périmètre.
3. **Back-office d'administration.** Un espace d'administration réservé au porteur du projet (et à terme à ses collègues) est indispensable, permettant de créer manuellement chaque compte, qu'il s'agisse d'un cabinet ou d'une organisation autonome, de renseigner sa nature à la création (chapitre 5.8), de définir les droits associés, de publier le contenu de portée plateforme (chapitre 5.1), et de suspendre un accès si besoin.
4. **Facturation au volume.** La facturation est envisagée au volume plutôt qu'au forfait fixe, sur des unités telles que le nombre d'instances lancées ou le nombre de participants ayant réellement rejoué un exercice. Les montants précis ne sont pas encore arrêtés (voir chapitre 9), mais l'architecture capture déjà nativement les données nécessaires (instances, équipes, participants avec leur statut invité ou rejoint) ; il suffit d'un tableau de bord de synthèse par client agrégeant ces comptages sur la période choisie, sans nouveau système de mesure. Dans le modèle piloté, le redevable de cette facturation reste à trancher (voir chapitre 9).
5. **Les compteurs survivent à la purge.** Les compteurs de facturation sont des agrégats sans donnée personnelle et ne sont donc pas purgés avec les données brutes d'instance (voir 7.9). Sans cette règle, la purge effacerait l'assiette de facturation.
6. **Le catalogue est une composante de l'offre.** Le contenu de portée plateforme (scénarios, bruit de fond, fiches personnages) est produit et publié par l'éditeur et fait partie de ce qui est vendu. Sa valorisation commerciale, incluse dans l'accès ou facturée à part, reste à trancher (voir chapitre 9).

### 8.2 Position réglementaire de la plateforme

Ce bloc n'existait pas en v0.1, qui invoquait DORA uniquement comme un besoin du client, sans en tirer les conséquences sur la plateforme elle-même. Or vendre ce produit à une entité financière change la position de l'éditeur.

1. **L'éditeur devient prestataire tiers de services TIC au sens de DORA.** Un client soumis à DORA devra inscrire la plateforme dans son registre d'information des accords contractuels, mener une diligence préalable avant contractualisation, et faire figurer au contrat les clauses minimales exigées par le règlement : description du service, localisation du traitement et du stockage des données, dispositions de protection des données, droits d'accès, d'inspection et d'audit, obligations d'assistance en cas d'incident, niveaux de service, délais de préavis et conditions de résiliation, et stratégie de sortie. Ces demandes arriveront systématiquement, sous forme de questionnaire fournisseur et d'annexe contractuelle. Une plateforme d'exercices de crise ne soutenant a priori aucune fonction critique ou importante, c'est le régime allégé qui s'applique et non le régime renforcé, mais le socle contractuel reste dû.
2. **C'est un argument commercial autant qu'une contrainte.** Arriver avec ces éléments préparés (localisation des données, liste des sous-traitants ultérieurs, engagements de service, plan de sortie, procédure d'incident) plutôt que de les subir est un différenciateur direct auprès de la cible bancaire, et cohérent avec le positionnement de l'éditeur.
3. **Mistral est un sous-traitant ultérieur et doit être déclaré comme tel.** Le recours à un fournisseur de modèle doit être documenté, contractualisé et notifiable au client, et tout changement de fournisseur doit lui être communiqué. C'est une conséquence directe de l'exigence 7.5.
4. **Répartition des rôles au regard du RGPD.** La plateforme traite des données à caractère personnel : identité et email professionnel des participants, contenu de leurs échanges, traces de connexion. L'éditeur agit en qualité de sous-traitant, le client en qualité de responsable de traitement. Un accord de sous-traitance conforme est donc requis avec chaque client, ainsi que la tenue de la liste des sous-traitants ultérieurs, une durée de conservation limitée et documentée (voir 7.9), et la minimisation des données collectées à l'import, qui n'a besoin de rien d'autre que le nom, l'email professionnel, l'équipe et le rôle.
5. **L'information des participants incombe au client.** Le client, en tant que responsable de traitement, informe ses participants de la nature de l'exercice et du traitement de leurs données. La plateforme doit lui fournir de quoi le faire, et non se substituer à lui.
6. **Le profil d'administrateur de la plateforme doit être encadré.** Un profil disposant d'un accès complet à toutes les données de tous les clients est le premier point qu'un questionnaire de sécurité bancaire relèvera. Trois exigences en découlent : ce profil est nominatif et attribué au plus petit nombre, chacun de ses accès à des données client est journalisé au même titre que les autres (voir 7.10), et l'existence de cet accès est déclarée au client plutôt que dissimulée. La formule de la v0.1, «à l'exception des mots de passe», ne constitue pas un contrôle : les mots de passe sont de toute façon stockés sous forme d'empreinte et illisibles de quiconque.

---

## 9. Risques, hypothèses et points ouverts

Ces sujets devront être tranchés au moment du cadrage technique ou de la construction de l'offre. Ils sont repris ici sans être arbitrés dans ce PRD.

1. **Services cloud managés d'OVHcloud à Zurich.** À vérifier avant tout engagement contractuel : s'assurer que le site de Zurich propose bien l'ensemble de la gamme de services nécessaires, et pas seulement des serveurs dédiés ou des VPS. Ce point conditionne la promesse de localisation en Suisse, donc le cas d'usage Canton de Vaud.
2. **Coût de la cible de volumétrie.** La cible de 300 cellules et 1500 connexions simultanées est retenue sous réserve de son coût d'infrastructure, à chiffrer avant confirmation. Il s'agit d'une décision économique, non technique.
3. **Charge d'exploitation de Supabase auto-hébergé.** Le choix de l'auto-hébergement transfère à l'exploitant les sauvegardes, les montées de version, la supervision et la haute disponibilité du service temps réel. Cette charge doit être dimensionnée et confrontée à la réalité d'une structure de très petite taille.
4. **Objectifs de continuité de la plateforme.** RTO, RPO et objectifs de disponibilité restent à fixer (voir 7.11), sachant qu'une instance en cours perdue est un exercice perdu.
5. **Politique de rétention.** Les délais précis de chacun des trois régimes du point 7.9 restent à établir, en tenant compte des attentes des clients régulés et du principe de limitation de conservation.
6. **Grille tarifaire.** Seules les unités de mesure de la facturation sont posées à ce jour ; les montants restent à fixer.
7. **Valorisation du catalogue.** Le contenu de portée plateforme est-il inclus dans l'accès, ou facturé à part comme une offre de contenu distincte ? La question ne bloque pas la conception, la portée étant déjà modélisée, mais elle structure l'offre.
8. **Redevable de la facturation dans le modèle piloté.** Qui paie lorsqu'un cabinet opère pour plusieurs clients : le cabinet, sur une facturation agrégée couvrant l'ensemble de son portefeuille, ou chaque organisation cliente directement ? La question n'est pas bloquante pour la conception, le modèle de données comptant déjà les volumes à chaque niveau de l'arbre, mais elle conditionne l'offre commerciale faite aux autres cabinets.
9. **Seuils de décrochage du tableau de bord.** Les durées de silence et les critères déclenchant le signalement d'une équipe (voir 5.2.9) sont à calibrer sur un exercice réel plutôt qu'a priori.
10. **Formats de l'export de débrief.** Les formats documentaire et tabulaire du livrable (voir 5.7.7) restent à arrêter.
11. **Bruit de fond et langue.** La bibliothèque étant de portée plateforme et publiée par le seul éditeur, un client non francophone ne peut pas produire son propre bruit de fond en bibliothèque et doit passer par des injects ordinaires (voir 5.3.3). Ce choix est assumé en version 1 ; son coût commercial est à surveiller si la cible s'internationalise.
12. **Nom du produit.** Toujours à définir.
13. **Point de vigilance transverse : le flux IA autonome.** Rappel du chapitre 5.5, le role-player IA est le seul flux où du contenu part vers un participant sans supervision humaine préalable. Ce risque est couvert par les garde-fous de reprise en main, de journalisation, de cloisonnement du contexte et de coupure à l'arrêt, qui doivent être considérés comme des exigences fermes et non comme des options.

---

## 10. Glossaire

Ce projet a généré un vocabulaire propre. Il est figé ici pour que toutes les conversations à venir, y compris avec BMAD et Claude Code, utilisent les mêmes mots.

**Scénario.** Le plan écrit et réutilisable d'un exercice : la liste de ses injects et leur séquence. Actif durable, indépendant de toute exécution, porteur d'une portée de réutilisation.

**Instance.** Une exécution réelle d'un scénario, à une date donnée, pour un client donné, avec de vraies équipes. Donnée vivante et temporaire. C'est l'objet technique qui réalise un exercice. Ce terme ne désigne jamais un serveur, un conteneur ou un déploiement.

**Exercice.** Une simulation de crise jouée, pour un client, à une date donnée, avec de vraies équipes. Terme métier désignant le même objet qu'une instance. Une mission peut comporter plusieurs exercices.

**Mission.** Le regroupement des exercices d'un même engagement, couche à part entière de la hiérarchie des comptes et unité de rattachement des droits et du contenu sur-mesure partagés entre facilitateurs. Elle correspond à un contrat passé avec un client dans le modèle piloté, et à un programme d'exercices que l'organisation se donne à elle-même dans le modèle autonome.

**Inject.** Une unité de contenu injectée dans l'exercice. Défini par une source, un canal, un contenu et un déclencheur, et porteur d'une cible de diffusion et, le cas échéant, d'un saut de temps.

**Source.** Qui parle dans le scénario : une fiche personnage, incarnée par un humain ou par une IA.

**Fiche personnage.** Ce qu'un personnage est indépendamment de toute crise : prénom, nom, métier, fonction, rattachement, expertise, ton. Actif permanent et réutilisable, porteur d'une portée de réutilisation. À ne pas confondre avec le briefing.

**Briefing.** Ce qu'un personnage sait, ignore, cherche et s'interdit dans un scénario précis. Rattaché à un couple fiche personnage et scénario, sans portée propre, hérite de celle du scénario. C'est ce qui permet au même personnage de servir dans deux crises sans transporter la connaissance de l'une dans l'autre.

**Prompt système.** Objet non stocké. Assemblé au moment de l'appel au modèle à partir de la fiche personnage, du briefing et du fil de conversation en cours.

**Portée de réutilisation.** L'attribut qui détermine qui peut voir, utiliser et cloner un actif de contenu. Trois valeurs : plateforme (catalogue de l'éditeur, ouvert à tous les comptes racine), compte racine (catalogue privé d'un cabinet ou d'une organisation autonome), organisation (sur-mesure cloisonné à une organisation cliente). S'applique au scénario, à la fiche personnage et au template de bruit de fond. Le clonage ne descend que vers le bas.

**Canal.** L'onglet par lequel un inject arrive au participant. Les canaux du socle sont toujours présents : mail, chat d'équipe, messagerie professionnelle, journal de bord, décisions, réseau social, site d'actualité. Les canaux optionnels ne sont activés que si le scénario les mobilise : tableau de bord d'indicateurs, carte de situation, bulletin de vigilance ou d'autorité. Un appel ou une vidéo ne sont pas des canaux mais des interruptions en mode actif. Le participant écrit sur une partie seulement des canaux du socle (voir 5.4.9).

**Décisions.** Le canal unique de questionnement des équipes, quiz et questions à choix confondus. Ressort de jeu pendant l'exercice, et matière première du débrief.

**Déclencheur.** Ce qui fait apparaître un inject : le temps réel écoulé, une action du facilitateur, et plus tard (version 2) une décision du joueur.
> ⚠️ **Amendé le 23/07/2026 — ARB-1** : « temps écoulé » = position atteinte sur l'**horloge fictive**, jamais le temps réel.

**Horloge réelle.** Le temps effectivement écoulé depuis le lancement d'un exercice. Cadence le MEL, sert au débrief et à l'audit, et n'est affichée qu'au facilitateur.
> ⚠️ **Amendé le 23/07/2026 — ARB-1** : l'horloge réelle **ne cadence plus le MEL**. Elle sert au débrief et à l'audit, et alimente le moteur automatique qui fait avancer l'horloge fictive à cadence fixe.

**Horloge fictive.** Le temps du scénario, celui que vivent les personnages de la crise. Avance par sauts et non par défilement accéléré. Seule horloge affichée au participant.
> ⚠️ **Amendé le 23/07/2026 — ARB-1, AD-014** : l'horloge fictive est **persistée sur l'instance** et **commande le déclenchement** des injects. Elle est représentée par un repère normalisé triable doublé d'un libellé lisible.

**Saut de temps.** Le passage de l'horloge fictive à une nouvelle date, annoncé au participant («Nous sommes à J+3»). Paramétré sur l'inject qui le porte lors de la préparation de l'exercice. Un scénario sans saut se joue en temps réel.

**Cible de diffusion.** Le périmètre de destinataires d'un inject. Croisement de deux dimensions multi-valuées : un périmètre d'équipes (l'instance entière, ou une liste d'équipes) et un filtre de rôles (tous les membres, ou une liste de rôles). Toujours exprimée par un nom d'équipe ou de rôle, jamais par un nom propre.

**Équipe.** Une cellule de jeu à l'intérieur d'une instance. Ne porte aucun droit d'accès et n'appartient donc pas à la hiérarchie des comptes. Peut ne compter qu'un seul participant.

**Profil.** L'un des cinq niveaux d'accès du chapitre 3 : administrateur de la plateforme, responsable de cabinet, responsable d'organisation, responsable de filiale, facilitateur. Un profil est une définition de droits, pas une personne, et ne dit rien de la fonction tenue dans une cellule pendant un exercice, qui relève du rôle. Le participant n'est pas un profil.

**Participant.** Une personne qui joue l'exercice. Identité éphémère sans compte ni mot de passe, rattachée à une seule instance, créée par l'import ou l'accès de secours, portée par un lien personnel unique, détruite avec la purge des données d'instance. N'appartient pas à la hiérarchie des profils de compte.

**Rôle (dans une équipe).** La fonction tenue par un participant à l'intérieur de son équipe : RH, communication, pilotage, juridique. Unique par participant. Sert de cible d'inject et d'axe de débrief. Une fonction se modélise soit comme équipe, soit comme rôle, jamais les deux dans un même exercice. À ne pas confondre avec les profils d'accès du chapitre 3, qui définissent des droits et non des fonctions de jeu.

**MEL (Master Event List).** La file d'attente des injects à venir dans une instance. Support commun aux modes horloge automatique et manuel ; seul le mécanisme qui la fait avancer diffère.

**Pattern of Life.** Le bruit de fond permanent qui recrée le trafic normal d'une organisation, destiné à forcer les participants à distinguer le signal du bruit. Générique et neutre en version 1, publié par l'éditeur en portée plateforme.

**Mode catalogue.** Un scénario écrit une fois sur une organisation fictive, rejouable tel quel. De portée plateforme lorsqu'il est publié par l'éditeur, de portée compte racine lorsqu'un cabinet le produit pour son propre usage.

**Mode sur-mesure.** Un scénario personnalisé pour une organisation cliente précise, éventuellement cloné depuis un scénario catalogue, de portée organisation, strictement cloisonné et invisible ailleurs.

**Version figée.** La copie immuable du scénario, de sa séquence, de ses injects, des fiches et des briefings, prise au lancement d'une instance. C'est elle qui est jouée et débriefée, et non l'actif vivant de la bibliothèque.

**Livrable de débrief.** L'export autoportant et figé produit à la clôture d'une instance. Seul artefact qui survit à la purge des données brutes, et support de la preuve de participation.

**Arrêt d'urgence.** Le dispositif de sûreté permettant d'interrompre instantanément un exercice et de diffuser un message réel à tous les participants (chapitre 5.9). Distinct de la pause tactique du pilotage.

**Modèle piloté et modèle autonome.** Les deux modèles d'usage de la plateforme, distingués par la nature de la structure titulaire du compte. Dans le modèle piloté, un cabinet de conseil détient le compte et ses consultants conçoivent et animent les exercices pour ses organisations clientes. Dans le modèle autonome, une organisation détient directement le compte, sans cabinet, et ses propres collaborateurs animent leurs exercices en payant l'accès. Même application et même modèle de données ; seules diffèrent la présence du niveau cabinet et l'appartenance de la personne qui tient le profil de facilitateur.

**Cabinet.** Une structure de conseil titulaire d'un compte, qui opère pour plusieurs organisations clientes indépendantes les unes des autres. Couche facultative au sommet de l'arbre, présente uniquement dans le modèle piloté. Scort Conseil est lui-même un cabinet au sens de ce modèle.

**Compte racine.** Le titulaire d'un compte sur la plateforme, c'est-à-dire un cabinet ou une organisation autonome, et seule frontière d'isolation du produit. Chaque compte racine est une boîte noire pour tous les autres, quels que soient leurs types. Les organisations clientes d'un même cabinet ne sont pas des comptes racine et relèvent d'une règle de cloisonnement distincte.

**Organisation cliente.** L'entité pour laquelle un exercice est joué. Elle est soit cliente d'un cabinet dans le modèle piloté, soit directement titulaire de son compte dans le modèle autonome. À distinguer d'une filiale, qui appartient au même groupe que sa maison mère, alors que deux organisations clientes d'un même cabinet sont des entreprises indépendantes.

**Éditeur.** Le titulaire de la plateforme elle-même, qui l'exploite et publie le contenu de portée plateforme. N'est pas un compte racine : il est au-dessus de la frontière d'isolation.

---

*Fin du PRD version 0.2. Ce document constitue la base de vision et d'exigences pour la suite du travail : cadrage d'architecture technique, puis développement assisté par Claude Code.*
