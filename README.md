# gitabase

Una base de datos hecha con JSON y Git. ¿¿¿CÓMO DIJO???

Más información acá:
https://www.youtube.com/watch?v=B5KE56yvpTc

## ¿Esto funciona?

En mi máquina anda.

![image](https://user-images.githubusercontent.com/118913/119130813-14bae300-ba0f-11eb-8b67-eadde77be080.png)

## Quiero usar esto

### Proveedores soportados

- GitLab

### Instalación

```
npm i github:joelalejandro/gitabase#main
```

### Cómo levantar una Gitabase en GitLab

1. Creá un repo de Gitabase, usando esta estructura como punto de partida: https://gitlab.com/joelalejandro/gitabase-test-db.
2. Creá un usuario de GitLab adicional *que no sea el dueño del repo* y agregalo al repo de la base con el rol de Developer.
3. Creá un access token con este nuevo usuario, sólo con el permiso *API*.

### Ejemplos

```ts
import Gitabase, { GitlabStore } from 'gitabase';

const db = new Gitabase();
const store = new GitlabStore({
    projectId: Number(process.env.GITLAB_PROJECT_ID),
    token: process.env.GITLAB_TOKEN,
    branch: 'master',
    commitAuthor: 'Yo',
    commitEmail: 'yo@no-email.com'
});

db.useStore(store);
await db.openDatabase();
db.name === 'mi-base'; // true;

// Leer datos
const tableData = await db.selectFrom('mi-tabla');

// Escribir datos
await db.insertInto('mi-tabla', { id: 'foo', name: 'coso' });

// Hacer transacción
await db.beginTransaction();
await db.insertInto('mi-tabla1', { id: 'foo', name: 'coso' });
await db.insertInto('mi-tabla2', { id: 'foo', name: 'coso' });
await db.commit();

// Rollbackear (OJO: esto es revertir el último commit de Git)
await db.rollback();
```

## Más cosas

El [test de Gitabase](./tests/gitabase.spec.ts) muestra más ejemplos.

## Disclaimer

Esto es un experimento y bajo ningún concepto está validado su funcionamiento estable en producción. Si usás esto, es bajo tu propio riesgo. ¡Divertite!
