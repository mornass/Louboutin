#!/usr/bin/env bash
# Compresse chaque .glb de models-source/ vers public/models/ :
# géométrie Meshopt + textures WebP 1024 px, sans simplification du maillage.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/models
for src in models-source/*.glb; do
  name=$(basename "$src")
  npx gltf-transform optimize "$src" "public/models/$name" \
    --compress meshopt \
    --texture-compress webp \
    --texture-size "${TEXTURE_SIZE:-1024}" \
    --simplify false \
    --instance false \
    --flatten false
  ls -lh "public/models/$name" | awk '{print $5, $9}'
done
