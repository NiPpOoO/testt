# WEBAR-SNOWMAN

Демо WebAR: модель лисы появляется при распознавании NFT-маркера снеговика.

## Структура
- assets/
  - markers/snowman/
    - snowman.iset
    - snowman.fset
    - snowman.fset3
  - models/
    - Fox.glb
- src/
  - script.js
  - style.css
- index.html

## Запуск локально
```bash
npm i
npm run start
# открой http://localhost:8080
#
# Дополнительно: обработка фото (удаление фона -> «Африка», горизонтальный PNG)
# открой http://localhost:8080/bg.html
