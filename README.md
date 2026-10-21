# Akira Educación — frontend

Aplicación frontend de Akira Educación construida con Angular, Bootstrap y SCSS. La interfaz parte de la plantilla Berry Free Angular Admin; conserva su licencia MIT en [LICENSE](LICENSE).

## Requisitos e inicio

Se necesita [NVM](https://github.com/nvm-sh/nvm) para gestionar Node.js y npm. El archivo [.nvmrc](.nvmrc) fija Node `24.22.0`, la versión con la que se verificó el proyecto.

1. Instala NVM si aún no lo tienes. En Fish, usa una implementación compatible como [nvm.fish](https://github.com/jorgebucaran/nvm.fish); en Bash o Zsh puedes usar el NVM oficial.
2. Abre una terminal en la carpeta del proyecto y ejecuta:

```sh
nvm install
nvm use
node --version
npm --version
npm ci
npm start
```

`nvm install` instala la versión indicada en `.nvmrc`; `nvm use` la activa en la terminal actual. `npm ci` instala las dependencias del lockfile. `npm start` inicia el servidor de desarrollo; abre [http://localhost:4200/](http://localhost:4200/) en el navegador y deja esa terminal abierta. Para detener el servidor, presiona `Ctrl+C`.

npm install -g @angular/cli

Si `nvm` no se reconoce, configura NVM para tu shell y abre una nueva terminal antes de volver a ejecutar los comandos.

## Comandos

- `npm run build`: compilación de producción.
- `npm run build:dev`: compilación de desarrollo.
- `npm run build:prod`: compilación explícita de producción.
- `npm run watch`: compilación de desarrollo en modo observación.
- `npm run lint`: análisis estático del código.
- `npm run prettier`: formato de los archivos de `src/`.

La plantilla todavía no tiene un ejecutor de pruebas ni un objetivo `test` configurado. Se comprobó `npm ci`, `npm run build` y el inicio del servidor con Node `24.22.0`.

## Configuración

- Las rutas de la aplicación están en `src/app/app-routing.module.ts`.
- Los ajustes de entorno están en `src/environments/`.
- No guardes secretos en Angular ni en variables `environment`: esos valores se entregan al navegador. Los archivos `.env` reales quedan excluidos de Git.
- Para publicar bajo una subruta, configura el `base-href` para el destino en el proceso de compilación/despliegue.

## Inicio del repositorio

```sh
git add .
git commit -m "chore: initialize Akira Educación frontend"
```
