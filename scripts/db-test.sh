#!/usr/bin/env bash
# Aplica migraciones y pruebas de esquema contra un Postgres desechable.
# Requiere Docker. No toca el proyecto de Supabase.
set -euo pipefail

CONTENEDOR=na-prop-test-db
PUERTO=5544
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! docker inspect "$CONTENEDOR" >/dev/null 2>&1; then
  echo "→ levantando $CONTENEDOR en el puerto $PUERTO"
  docker run -d --name "$CONTENEDOR" \
    -e POSTGRES_PASSWORD=test -e POSTGRES_DB=bitacora \
    -p "$PUERTO":5432 postgres:16 >/dev/null
elif [ "$(docker inspect -f '{{.State.Running}}' "$CONTENEDOR")" != "true" ]; then
  docker start "$CONTENEDOR" >/dev/null
fi

until docker exec "$CONTENEDOR" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done

echo "→ base limpia"
docker exec "$CONTENEDOR" psql -U postgres -d postgres -q \
  -c "drop database if exists bitacora;" -c "create database bitacora;"

psql_() { docker exec -i "$CONTENEDOR" psql -U postgres -d bitacora -q -v ON_ERROR_STOP=1; }

echo "→ shim de auth"
psql_ < "$RAIZ/supabase/tests/shim_auth.sql"

echo "→ migraciones"
for f in "$RAIZ"/supabase/migrations/*.sql; do
  echo "   $(basename "$f")"
  psql_ < "$f"
done

echo "→ pruebas"
docker exec -i "$CONTENEDOR" psql -U postgres -d bitacora -q \
  < "$RAIZ/supabase/tests/pruebas_esquema.sql"
