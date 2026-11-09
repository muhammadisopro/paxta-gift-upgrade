@echo off
chcp 65001 >nul
echo ========================================================
echo  Paxta Gifts (@UpgradeBot) - Render Deploy
echo ========================================================
echo.
echo [1/2] GitHub-ga yuklanmoqda (git push origin master)...
git push origin master
if %ERRORLEVEL% NEQ 0 (
    echo [XATO] Git push muvaffaqiyatsiz bo'ldi!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Render.com avtomatik ravishda deploy jarayonini boshladi!
echo Manzil: https://paxta-gift-upgrade.onrender.com
echo.
pause
