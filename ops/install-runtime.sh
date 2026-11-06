#!/usr/bin/env bash
set -euo pipefail
base=/srv/apps/ordinary-mage/runtime
version=node-v24.13.0-linux-arm64
mkdir -p "$base"
cd "$base"
if [ ! -x "$version/bin/node" ]; then
  curl --fail --location --silent --show-error "https://nodejs.org/dist/v24.13.0/$version.tar.xz" -o "$version.tar.xz"
  curl --fail --location --silent --show-error https://nodejs.org/dist/v24.13.0/SHASUMS256.txt -o SHASUMS256.txt
  grep " $version.tar.xz$" SHASUMS256.txt | sha256sum --check --strict
  tar -xJf "$version.tar.xz"
fi
"$version/bin/node" --version
