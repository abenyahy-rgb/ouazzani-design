# synthetic-users — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 11 — Test d'expérience synthétique du socle

**Entrée.** Socle exécutable DÉPLOYÉ et figé — commit et sha256 du build connus (WP-10) ; glossaire et navigation (WP-08) ; squelette (WP-05) ; personas PER-nn et verbatims (WP-04). Sans socle déployé : BLOCKED, jamais un test sur un fichier local.

**Tâche.** Écrire le protocole et le plan de campagne AVANT toute session : personas en fiches de faits de vie tirées des PER-nn et de leurs verbatims, rendues en prose ; missions dites avec les mots de l'utilisateur, avec leur arrêt naturel ; liste fermée du vocabulaire interne construite depuis WP-08 (termes TRM-nn, écrans) et WP-05 (étapes). Écrire le manifeste de pare-feu haché AVANT chaque session. Lancer les sessions, une par persona × mission, en contexte frais ; annoter (passe aveugle O1 figée, puis O2) ; agréger les patterns (R1 figée, puis R2) ; trier et ROUTER chaque constat vers WP-05, WP-08 ou WP-10 avant le gel.

**Vérification.** LE TEST PORTE SUR LA STRUCTURE : trouver son chemin, comprendre les mots, réussir les parcours d'argent et de droits — payer, changer d'avis, arrêter, faire une pause. Le contenu pédagogique est hors champ ; une session qui bute sur un champ ABSENT du corpus enregistre un ARRÊT ATTENDU, pas un défaut. Ni persona ni mission ne contient un mot de l'interface (filtre déterministe sur la liste fermée). Observations immuables, liées au sha256 du socle testé ; une correction produit un NOUVEAU candidat, et la régression tourne sur lui, avec les MÊMES personas et missions. Aucun score ni seuil tant qu'un run ne les a pas fixés sur preuve. Toujours « N sessions synthétiques », jamais « N utilisateurs » ; les sessions sur le même modèle sont déclarées CORRÉLÉES. Une revue experte qui connaît l'intention présentée comme ce test est un BLOCKER. K7 rejoue SUX1 à SUX6 sur les octets de la campagne.

**Sortie.** Campagne SUX commitée : protocole antérieur aux sessions, socle haché, résultats bruts, annotations, patterns, triage ; chaque constat routé vers WP-05, WP-08 ou WP-10 et traité AVANT le gel — un terme non compris retourne à WP-08, une étape introuvable à WP-05, un parcours d'argent ou de droits raté à WP-10. Un candidat corrigé est re-testé.

Responsible : `quality-engineer et factory-lead` · Accountable : `product-lead` · Cadence C1, étape C1.4

## Activité 17 — Validation utilisateurs et convergence

**Entrée.** Prototype QA-clean et figé par commit, déployé ; personas PER-nn documentés (WP-04) ; participants réels seulement s'il en existe, explicitement identifiés.

**Tâche.** Écrire le protocole AVANT le test ; figer la version testée ; conduire la revue experte AXR par persona, PUIS la campagne SUX aveugle sur la même version figée, et la confrontation documentaire ; traiter les résultats — une correction produit un nouveau candidat, et la régression SUX rejoue les mêmes personas et missions sur lui — ; stabiliser le périmètre ; donner à chaque hypothèse de comportement non tranchée sa mesure en production.

**Vérification.** Version testée figée par commit. Revue experte conduite par un agent qui n'a pas conçu le prototype, étiquetée SYNTHETIC · AXR. Campagne SUX aveugle étiquetée SYNTHETIC · SUX, et K7 rejoue SUX1 à SUX6 sur ses octets. Une revue experte présentée comme un test d'utilisateur est un BLOCKER. Résultats non filtrés, y compris ceux qui contredisent la thèse. Chaque correction trace vers un constat étiqueté — SYNTHETIC · AXR, SYNTHETIC · SUX, DOCUMENTARY ou EMPIRICAL. Aucune hypothèse de comportement déclarée validée sur une preuve synthétique ou documentaire : elle est tranchée par des participants réels, ou reportée avec sa mesure en production.

**Sortie.** Résultats commités avec la version testée, chacun étiqueté ; campagne SUX de release commitée ; hypothèses UNVALIDATED tranchées, ou reportées avec leur mesure en production — métrique, événement, seuil, décision.

Responsible : `product-lead puis product-designer · quality-engineer orchestre la campagne SUX` · Accountable : `Product Owner` · Cadence C2, étape C2.3
