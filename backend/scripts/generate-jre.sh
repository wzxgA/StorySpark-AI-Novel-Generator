#!/bin/bash
set -euo pipefail
echo "=== Phase 7: Generate Minimal JRE for StorySpark ==="

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

# 1. Build the Spring Boot fat jar
echo "[1/4] Building backend JAR..."
mvn clean package -DskipTests -q

JAR="target/storyspark-backend-0.1.0-SNAPSHOT.jar"
JRE_OUTPUT="../../jre"

if [ ! -f "$JAR" ]; then
    echo "ERROR: JAR not found at $JAR"
    exit 1
fi

# 2. Run jdeps to find required modules
echo "[2/4] Analyzing required modules with jdeps..."
jdeps --list-deps --multi-release 17 --ignore-missing-deps "$JAR" > jdeps-output.txt

# 3. Parse jdeps output and construct --add-modules list
MODULES=$(grep -v 'not found' jdeps-output.txt | grep -v 'JDK' | paste -sd, -)
if [ -z "$MODULES" ]; then
    echo "WARNING: jdeps returned no modules, using default set"
    MODULES="java.base,java.sql,java.management,java.naming,java.xml,java.desktop,java.security.jgss,java.instrument,jdk.unsupported,java.net.http,java.compiler"
fi
echo "   Required modules: $MODULES"

# 4. Run jlink
echo "[3/4] Generating minimal JRE with jlink..."
rm -rf "$JRE_OUTPUT"
jlink --no-header-files --no-man-pages --compress=2 \
  --add-modules "$MODULES" \
  --output "$JRE_OUTPUT"

# 5. Report size
echo "[4/4] Done!"
du -sh "$JRE_OUTPUT"
echo "You can now run: cd frontend && npm run electron:build"
