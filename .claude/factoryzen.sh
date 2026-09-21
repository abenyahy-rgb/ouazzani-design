#!/bin/sh
# Résolution de la racine du plugin, et garde à SÛRETÉ INVERSE.
#
# DÉFAUT CONSTATÉ EN SESSION RÉELLE. Le sous-module ne se clone pas sur Claude Code Web :
# « git submodule update --init » échoue faute d'authentification sur un dépôt privé,
# l'URL du .gitmodules ne passant pas par le proxy authentifié de la session. La garde
# pointait donc vers un fichier absent, le hook sortait en 1 — et un hook PreToolUse ne
# refuse QU'EN SORTANT EN 2. Elle échouait en OUVRANT : la frontière d'écriture ne tenait
# plus, silencieusement.
#
# Deux réponses, dans cet ordre d'importance.
#
# 1. À SÛRETÉ INVERSE. Plugin introuvable n'est plus « l'écriture passe » mais un REFUS
#    motivé. Une garde absente doit coûter, pas se taire : c'est la seule façon qu'un
#    défaut d'installation soit vu le jour où il arrive, et non six mois plus tard.
#
# 2. PLUSIEURS PROVENANCES. Le plugin est cherché là où chaque environnement le place —
#    sous-module en CLI local, dépôt frère attaché à l'environnement sur le web. Le
#    sous-module reste la source épinglée ; le frère n'est qu'une autre porte vers le
#    même dépôt, jamais une copie.

# CLAUDE_PROJECT_DIR est fourni aux HOOKS, pas au lancement d'un serveur MCP : la tour
# mourait aussitot (CONNECTION_CLOSED) sur un chemin non resolu. Le script se localise
# donc lui-meme — il vit sous <projet>/.claude/ — et n'utilise la variable que si elle
# existe. Un chemin qui depend d'une variable absente n'est pas un chemin.
PROJECT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." 2>/dev/null && pwd)}"
export CLAUDE_PROJECT_DIR="$PROJECT"

find_root() {
  for c in \
    "$PROJECT/.factoryzen" \
    "$PROJECT/../autonomous-product-factory" \
    "$PROJECT/../Autonomous-Product-Factory" \
    "$HOME/autonomous-product-factory" \
    "$HOME/Autonomous-Product-Factory"
  do
    [ -f "$c/bin/apf" ] && [ -f "$c/core/method.yaml" ] && { (cd "$c" && pwd); return 0; }
  done
  return 1
}

case "$1" in
  ensure)
    # Le sous-module d'abord : c'est la source épinglée. Son échec n'est pas fatal, une
    # autre porte existe peut-être — mais il est DIT, sinon l'installation dégradée
    # passerait pour normale.
    if [ ! -f "$PROJECT/.factoryzen/bin/apf" ]; then
      git -C "$PROJECT" submodule update --init --depth 1 .factoryzen 2>/dev/null \
        || echo "FactoryZen : sous-module non clonable (depot prive, authentification absente) — repli sur un depot frere." >&2
    fi
    if root=$(find_root); then
      echo "FactoryZen : $root"
    else
      echo "FactoryZen INTROUVABLE — la garde refusera toute ecriture jusqu'a resolution." >&2
      exit 1
    fi
    ;;

  tower)
    # La tour passe par le meme resolveur que la garde : sur le web le plugin est un
    # depot frere, pas un sous-module, et .mcp.json ne peut pas le savoir.
    if root=$(find_root); then
      CLAUDE_PLUGIN_ROOT="$root" exec node "$root/mcp/server.mjs"
    fi
    echo "FactoryZen introuvable : la tour de controle ne peut pas demarrer." >&2
    exit 1
    ;;

  trace)
    # LA TRACE OBSERVE, ELLE NE DÉCIDE PAS — donc elle sort TOUJOURS en 0.
    #
    # C'est l'inverse exact de la garde juste en dessous, et l'asymétrie est voulue. Un hook
    # PreToolUse qui échoue REFUSE l'écriture : si la trace se comportait comme la garde, un
    # plugin introuvable arrêterait un travail que la garde, elle, aurait laissé passer. Un
    # observateur qui bloque ce qu'il observe est un défaut, pas un contrôle.
    shift
    if root=$(find_root); then
      "$root/bin/apf" trace hook "$@" >/dev/null 2>&1
    fi
    exit 0
    ;;

  guard)
    if root=$(find_root); then
      exec "$root/bin/apf" guard
    fi
    # LE POINT CRITIQUE. Sans plugin, on refuse — on ne laisse pas passer.
    cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"FactoryZen introuvable : la garde ne peut pas juger cette ecriture, donc elle la refuse.\n\nCe depot est gouverne par FactoryZen et la frontiere d'ecriture est portee par le plugin. Sans lui, autoriser reviendrait a ecrire hors de toute gouvernance — un defaut d'installation deviendrait un contournement silencieux.\n\nResoudre : « git submodule update --init .factoryzen », ou attacher abenyahy-rgb/Autonomous-Product-Factory aux sources de l'environnement."}}
JSON
    exit 2
    ;;

  *)
    echo "usage: factoryzen.sh ensure|guard|tower|trace <evenement>" >&2
    exit 64
    ;;
esac
