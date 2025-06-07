@echo off
echo Starting PDF Print Client...
echo.
cd /d "%~dp0"
npm start
echo.
echo Print client stopped. Press any key to exit...
pause > nul