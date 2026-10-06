@echo off
setlocal enabledelayedexpansion
color 0B
title FLASH - Game Folder Generator (8-file pattern)

echo.
echo =======================================================
echo   FLASH ^| Game Folder Generator
echo =======================================================
echo.

set /p DOMAIN="Enter domain (memory/numerical/logic/speed/attention/language/spatial/creativity/emotional/problem): "
if "%DOMAIN%"=="" ( echo [X] Domain cannot be empty. & pause & exit /b 1 )

set /p GAMEID="Enter game ID (e.g. seq-mem): "
if "%GAMEID%"=="" ( echo [X] Game ID cannot be empty. & pause & exit /b 1 )

set FOLDER=D:\Flash\frontend\games\%DOMAIN%\%GAMEID%

if exist "%FOLDER%" (
  echo.
  echo [!] Folder already exists: %FOLDER%
  echo.
  choice /M "Overwrite existing files"
  if errorlevel 2 ( exit /b 0 )
)

if not exist "%FOLDER%" mkdir "%FOLDER%"

type nul > "%FOLDER%\config.json"
type nul > "%FOLDER%\game.html"
type nul > "%FOLDER%\game.css"
type nul > "%FOLDER%\game.js"
type nul > "%FOLDER%\%GAMEID%-helpers.js"
type nul > "%FOLDER%\%GAMEID%-sounds.js"
type nul > "%FOLDER%\%GAMEID%-stages.js"
type nul > "%FOLDER%\%GAMEID%-extra-modes.js"

echo.
echo [OK] Created 8 files in:
echo      %FOLDER%
echo.
echo Files ready:
echo   - config.json
echo   - game.html
echo   - game.css
echo   - game.js
echo   - %GAMEID%-helpers.js
echo   - %GAMEID%-sounds.js
echo   - %GAMEID%-stages.js
echo   - %GAMEID%-extra-modes.js
echo.
echo Opening folder...
start "" "%FOLDER%"

echo.
pause