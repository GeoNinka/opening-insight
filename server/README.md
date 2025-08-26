# OpeningInsight
Серверная часть веб-приложения
Основные используемые библиотеки:
- express
- prisma
- stockfish
  
## Project Setup

```sh
npm install
```
В файле .env установите 
```.env
PORT = 5000
DATABASE_URL = *ваше подключение к базе данных*
JWT_SECRET = *ваш JWT_SECRET*
```

```sh
npx prisma db push
```
```sh
npm run dev
```
