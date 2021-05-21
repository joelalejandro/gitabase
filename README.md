# gitabase

Una base de datos hecha con JSON y Git. ¿¿¿CÓMO DIJO???

Más información acá:
https://www.youtube.com/watch?v=B5KE56yvpTc

## Quiero usar esto

```
npm i github:joelalejandro/gitabase#master
```

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