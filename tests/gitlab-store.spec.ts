import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';

import { GitlabStore } from '../src/stores/gitlab-store'
import { GitabaseContainer } from '../types/gitabase';

describe('gitabase/stores/gitlab-store', () => {
    let store: GitlabStore;
    let db: GitabaseContainer;

    beforeAll(async () => {
        store = new GitlabStore({
            projectId: Number(process.env.GITLAB_PROJECT_ID),
            token: process.env.GITLAB_TOKEN,
            branch: 'master',
            commitAuthor: 'Gitabase',
            commitEmail: 'gitabase@no-email.com'
        });
        db = await store.openDatabase();
    });

    it('should open the database', async () => {
        expect(db.rootFile.name).toBe('gitabase-test-db');
        expect(db.rootFile.gitabase.version).toBe(1);
        expect(db.rootFile.tableFiles).toEqual(['products']);
    });

    it('should get the products table', async () => {
        const table = await store.getTable('products');
        expect(table.name).toBe('products');
    });

    it('should put data in products', async () => {
        const table = await store.getTable('products');
        const row = { id: crypto.randomBytes(4).toString('hex'), name: 'Fritatta' };
        table.insert(row);
        await store.stageChanges(table);
        await store.commit();
        
        const updatedTable = await store.getTable('products');
        expect(updatedTable.selectAll().pop()).toEqual(row);
    });

    it('should revert the last operation', async () => {
        const table = await store.getTable('products');
        const count = table.selectAll().length;
        await store.rollback();
        const updatedTable = await store.getTable('products');
        const updatedCount = updatedTable.selectAll().length;
        expect(updatedCount).not.toBe(count);
    });
});