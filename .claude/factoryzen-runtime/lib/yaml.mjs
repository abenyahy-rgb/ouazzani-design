/* POINT D'ENTRÉE UNIQUE VERS LE PARSEUR YAML.
 *
 * Le plugin est installé par CLONE, jamais par « npm install » : Claude Code copie les
 * fichiers du dépôt et n'exécute aucune étape d'installation de dépendances. Une
 * dépendance déclarée dans package.json est donc ABSENTE à l'exécution, et tout ce qui
 * l'importe échoue — la CLI, la tour de contrôle, et surtout la garde en boucle, qui
 * sortait alors en 1 au lieu de 2 : elle ne refusait plus rien, elle échouait en OUVRANT.
 *
 * Le parseur est donc vendoré, au même titre que les skills externes et pour la même
 * raison : ce dont l'exécution dépend doit être LIVRÉ, pas espéré. L'empreinte de la
 * copie est épinglée au registre et rehachée à chaque contrôle — une copie contrôlée
 * n'est pas une seconde source de vérité, une copie libre en serait une.
 *
 * Tout le dépôt importe d'ici. Cinq fichiers importaient « js-yaml » directement : cinq
 * occasions de retomber sur la dépendance absente sans que rien ne le dise. */
export { default } from '../vendor/js-yaml/js-yaml.mjs';
