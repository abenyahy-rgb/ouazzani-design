# Des fichiers privés, un accès signé
### ADR de départ · Départ d'architecture standard

> Décision de départ. Gardée, elle est reprise dans `C1.4-socle/decisions/adr/` et revérifiée
> sur le produit ; adaptée, réécrite sur ce qui change ; écartée, remplacée par une ADR qui dit
> pourquoi.

## ADR-05 — Les fichiers vivent dans un stockage d'objets privé, atteint seulement par des liens signés que l'API émet après autorisation

Stockage compatible S3, compartiments privés, clés d'objet aléatoires et immuables. L'API
autorise, puis émet un lien signé de courte durée, en téléversement (reprenable) comme en
lecture ; le client n'utilise jamais son jeton utilisateur sur le stockage. Un fichier
téléversé reste en quarantaine jusqu'à validation : liste blanche de types, octets magiques,
limites de taille, analyse antivirale si le produit reçoit des documents de tiers.

**Pourquoi.** Aucun chemin non authentifié vers un octet stocké ; l'autorisation reste dans
l'API (ADR-04). Un lien de courte durée limite ce qu'une fuite expose.

## Alternatives rejetées

- **Un compartiment public**, ou des URL devinables : un lien qui fuit est une donnée qui fuit.
- **Les octets en base** : sauvegardes et coûts gonflés, sans gain.
- **Le jeton utilisateur sur le stockage, avec politiques de la plateforme** : une seconde
  autorisation, hors de l'API.

## Ce que la décision exclut

Pas de lien public permanent par défaut ; un partage passe par une décision explicite et son
ADR. Les objets ne sont pas dans les sauvegardes de la base : leur sauvegarde se traite à part.

## Classement

CORE INVARIANT : les clés et le modèle d'accès sont référencés par toutes les données livrées.

## Conditions de réexamen

Un volume ou un trafic sortant mesuré justifie un CDN pour les documents générés ; une fonction
du produit exige un partage public, décidé comme tel.
