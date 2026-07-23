# 4. Périmètre de la version 1 (MVP)

Frontière nette. Tout ce qui ne figure pas dans « ce que la v1 contient » ne doit
**pas** être développé en v1, même si cela paraît utile. Repris du PRD v0.3, ch. 4.

> ⚠️ **Ce chapitre a été amendé le 21/07/2026** par l'interview d'architecture. Les écarts
> assumés sont consolidés dans **`docs/mvp-scope.md`** ; le détail de chaque décision est
> dans **`docs/decisions/architecture-decisions.md`** (AD-XXX). Les annotations ci-dessous
> signalent chaque point touché.

## 4.1 Périmètre fonctionnel v1 — les 9 blocs (ch. 5, en intégralité)

1. **Atelier de création de scénario** (5.1) — 3 portées de réutilisation, catalogue/sur-mesure, clonage.
2. **Pilotage en direct** (5.2) — tableau de bord par exception, boîte de réception facilitateur.
3. **Bruit de fond / Pattern of Life** (5.3). *— Amendé le 21/07, voir AD-017 (portées + création ouverte).*
4. **Expérience du participant** (5.4) — canaux socle + optionnels, 2 modes de livraison, rattrapage des injects manqués. *— Précisé le 21/07, voir AD-009 (canaux en liste contrôlée).*
5. **Role-player IA** (5.5) — avec ses deux garde-fous (exigences fermes).
6. **Gestion des accès et inscription des participants** (5.6). *— Précisé le 21/07, voir AD-010 (adresse email réelle conservée le temps de l'exercice, purgée ensuite).*
7. **Débrief et export** (5.7). *— Précisé le 21/07, voir AD-006 (livrable détaché survivant à la purge) et AD-011 (auteur qualifié).*
8. **Administration des comptes et attribution des profils** (5.8). *— **Amendé le 21/07, voir AD-002** : un journal d'audit d'administration append-only entre au MVP (élargissement n°1).*
9. **Sûreté de l'exercice** (5.9) — marquage des contenus + arrêt d'urgence. *— Précisé le 21/07, voir AD-012 (validation obligatoire avant un exercice réel).*

## 4.2 Partis pris de conception v1 (comment, pas quoi)

1. Scénario en graphe **sans branchement réel** (déroulé linéaire). *— Précisé le 21/07, voir AD-004 : le graphe est désormais **explicite** (étapes-nœuds + liens), avec un seul lien sortant en v1.*
2. Facilitation **strictement centralisée** (pas de facilitateur local).
3. Horloge au choix (auto/manuelle), bascule possible en cours d'exercice. *— **Amendé le 21/07, voir AD-015** : manuel par défaut + moteur automatique **minimal** (avance l'horloge fictive à rapport fixe, débrayable d'un clic, sans perte d'état). Vitesse variable = post-v1. Élargissement n°2.*
4. Horloge fictive avançant **par sauts** paramétrés sur les injects. *— Précisé le 21/07, voir AD-014 (repères fictifs structurés et triables + libellé d'affichage) et AD-013 (« temps écoulé » = horloge fictive, jamais le temps réel).*
5. Relances de facilitateur **tapées à la main**, en direct.
6. Bruit de fond **générique et neutre** uniquement (portée plateforme, éditeur seul). *— **Amendé le 21/07, voir AD-017** : deux portées (plateforme **ou** compte racine) et création ouverte aux responsables d'organisation et aux facilitateurs, à leur propre portée. Élargissement n°3.*
7. Inscription par **import** en amont + **accès de secours** pour les retardataires.
8. Accès client **sur devis**, sans paiement en ligne.
9. Ciblage par **sélection explicite** d'équipes et de rôles (pas d'étiquettes). *— **Amendé le 21/07, voir AD-007** : ciblage via un **référentiel déclaré** par le scénario, avec **4 modes** (toutes les cellules / une cellule / sélection multiple / **sélection de participants**). Le ciblage nominatif est autorisé au niveau de l'instance, jamais dans le scénario réutilisable.*

## 4.3 Explicitement repoussé en version ultérieure

1. Branchement réel du scénario (les décisions modifient la suite).
2. Bibliothèque de relances pré-écrites / assistance IA au facilitateur.
3. Bruit de fond thématique par type de crise. *— **Amendé le 21/07, voir AD-017** : le bruit de fond **à portée compte racine** est ouvert en v1 ; seul le bruit **thématique par type de crise** en tant que fonctionnalité outillée reste hors v1.*
4. Étiquettes de ciblage.
5. Profil d'observateur / évaluateur.
6. Paiement en ligne.
7. Isolation physique par base dédiée.
8. Changement de nature d'un compte en libre-service.

**Fil conducteur** : la v1 est un **tronc commun solide, débriefé mais non ramifié**,
qui prépare les évolutions par des choix de modélisation faits dès maintenant
(graphe, événements typés/horodatés, état d'avancement par équipe, versionnement du contenu).

> *— **Amendé le 21/07, voir AD-005** : « état d'avancement par équipe » ne signifie plus une
> progression divergente. Les équipes avancent au **rythme commun** de l'horloge unique ;
> l'**étape courante est une propriété de l'instance**, et l'état par équipe ne conserve que
> ce qui lui est propre (décisions rendues, marqueurs). Seul le **contenu ciblé** distingue
> les équipes.*
