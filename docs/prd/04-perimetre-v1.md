# 4. Périmètre de la version 1 (MVP)

Frontière nette. Tout ce qui ne figure pas dans « ce que la v1 contient » ne doit
**pas** être développé en v1, même si cela paraît utile. Repris du PRD v0.3, ch. 4.

## 4.1 Périmètre fonctionnel v1 — les 9 blocs (ch. 5, en intégralité)

1. **Atelier de création de scénario** (5.1) — 3 portées de réutilisation, catalogue/sur-mesure, clonage.
2. **Pilotage en direct** (5.2) — tableau de bord par exception, boîte de réception facilitateur.
3. **Bruit de fond / Pattern of Life** (5.3).
4. **Expérience du participant** (5.4) — canaux socle + optionnels, 2 modes de livraison, rattrapage des injects manqués.
5. **Role-player IA** (5.5) — avec ses deux garde-fous (exigences fermes).
6. **Gestion des accès et inscription des participants** (5.6).
7. **Débrief et export** (5.7).
8. **Administration des comptes et attribution des profils** (5.8).
9. **Sûreté de l'exercice** (5.9) — marquage des contenus + arrêt d'urgence.

## 4.2 Partis pris de conception v1 (comment, pas quoi)

1. Scénario en graphe **sans branchement réel** (déroulé linéaire).
2. Facilitation **strictement centralisée** (pas de facilitateur local).
3. Horloge au choix (auto/manuelle), bascule possible en cours d'exercice.
4. Horloge fictive avançant **par sauts** paramétrés sur les injects.
5. Relances de facilitateur **tapées à la main**, en direct.
6. Bruit de fond **générique et neutre** uniquement (portée plateforme, éditeur seul).
7. Inscription par **import** en amont + **accès de secours** pour les retardataires.
8. Accès client **sur devis**, sans paiement en ligne.
9. Ciblage par **sélection explicite** d'équipes et de rôles (pas d'étiquettes).

## 4.3 Explicitement repoussé en version ultérieure

1. Branchement réel du scénario (les décisions modifient la suite).
2. Bibliothèque de relances pré-écrites / assistance IA au facilitateur.
3. Bruit de fond thématique par type de crise.
4. Étiquettes de ciblage.
5. Profil d'observateur / évaluateur.
6. Paiement en ligne.
7. Isolation physique par base dédiée.
8. Changement de nature d'un compte en libre-service.

**Fil conducteur** : la v1 est un **tronc commun solide, débriefé mais non ramifié**,
qui prépare les évolutions par des choix de modélisation faits dès maintenant
(graphe, événements typés/horodatés, état d'avancement par équipe, versionnement du contenu).
