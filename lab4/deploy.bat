@echo off
echo 🚀 Запуск сборки Docker образа...

docker build -t raster-algorithms .

echo 🛑 Останавливаем старый контейнер...
docker stop raster-app 2>nul
docker rm raster-app 2>nul

echo 🎯 Запускаем новый контейнер...
docker run -d -p 3000:3000 --name raster-app raster-algorithms

echo.
echo ✅ Готово!
echo 🌐 Приложение доступно по адресу: http://localhost:3000
echo.
echo 📋 Команды для управления:
echo    Просмотр логов: docker logs raster-app
echo    Остановка: docker stop raster-app
echo    Удаление: docker rm raster-app
pause