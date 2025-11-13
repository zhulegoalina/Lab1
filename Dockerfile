FROM nginx:alpine

# Устанавливаем рабочую директорию
WORKDIR /usr/share/nginx/html

# Копируем все файлы проекта
COPY . .

# Убедимся что права правильные
RUN chmod -R 755 /usr/share/nginx/html

# Экспонируем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]