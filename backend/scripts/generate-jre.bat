@echo off
setlocal enabledelayedexpansion
echo === Phase 7: Generate Minimal JRE for StorySpark ===

REM 1. Build the Spring Boot fat jar
echo [1/4] Building backend JAR...
cd /d "%~dp0.."
call mvn clean package -DskipTests -q
if %ERRORLEVEL% neq 0 (
    echo ERROR: Maven build failed
    exit /b 1
)

set JAR=target\storyspark-backend-0.1.0-SNAPSHOT.jar
set JRE_OUTPUT=..\..\jre

if not exist "%JAR%" (
    echo ERROR: JAR not found at %JAR%
    exit /b 1
)

REM 2. Run jdeps to find required modules
echo [2/4] Analyzing required modules with jdeps...
set JDK_BIN=%JAVA_HOME%\bin
if not exist "%JDK_BIN%\jdeps.exe" (
    echo ERROR: jdeps not found. Set JAVA_HOME to a JDK 17+ installation.
    exit /b 1
)

"%JDK_BIN%\jdeps" --list-deps --multi-release 17 --ignore-missing-deps "%JAR%" > jdeps-output.txt
if %ERRORLEVEL% neq 0 (
    echo ERROR: jdeps failed
    exit /b 1
)

REM 3. Parse jdeps output and construct --add-modules list
set MODULES=
for /f "tokens=*" %%m in ('type jdeps-output.txt ^| findstr /v "not found" ^| findstr /v "JDK"') do (
    if "!MODULES!"=="" (set MODULES=%%m) else (set MODULES=!MODULES!,%%m)
)

if "!MODULES!"=="" (
    echo WARNING: jdeps returned no modules, using default set
    set MODULES=java.base,java.sql,java.management,java.naming,java.xml,java.desktop,java.security.jgss,java.instrument,jdk.unsupported,java.net.http,java.compiler
)

echo    Required modules: !MODULES!

REM 4. Run jlink
echo [3/4] Generating minimal JRE with jlink...
if exist "%JRE_OUTPUT%" rmdir /s /q "%JRE_OUTPUT%"

"%JDK_BIN%\jlink" --no-header-files --no-man-pages --compress=2 --add-modules "!MODULES!" --output "%JRE_OUTPUT%"
if %ERRORLEVEL% neq 0 (
    echo ERROR: jlink failed
    exit /b 1
)

REM 5. Report size
echo [4/4] Done!
for /f "tokens=3" %%s in ('dir /s "%JRE_OUTPUT%" ^| findstr "File(s)"') do set SIZE=%%s
echo JRE generated at %JRE_OUTPUT%
echo.
echo You can now run: cd frontend ^&^& npm run electron:build
