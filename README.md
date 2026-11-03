# Заметки

SPA для заметок со списками задач на Nuxt 4, Composition API, Pinia и TypeScript strict.

## Запуск

Требуется Node.js 20.19 или новее.

```bash
npm ci
npm run dev
```

Полная проверка проекта:

```bash
npm run check
```

Отдельные команды: `npm test`, `npm run typecheck`, `npm run build`.

## Docker

Собрать и запустить production-версию:

```bash
docker-compose up --build
```

Приложение будет доступно на [http://localhost:3000](http://localhost:3000). Для остановки используйте `docker-compose down`.

Если порт 3000 занят, внешний порт можно изменить:

```bash
NOTES_APP_PORT=3001 docker-compose up --build
```
