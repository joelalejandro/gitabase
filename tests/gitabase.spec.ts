import CommitDataBuffer from '../src/commit-data-buffer';
import { Gitabase } from '../src/gitabase';
import { Gitable } from '../src/gitable';
import { GitabaseContainer, GitabaseStore, GitabaseStoreOptions } from '../types/gitabase';

const mockData = {
    foods: [
        { id: 1, name: 'empanada' },
        { id: 2, name: 'burger' },
        { id: 3, name: 'tofu' }
    ],
    drinks: [
        { id: 1, name: 'beer' },
        { id: 2, name: 'water' },
        { id: 3, name: 'fernet' }
    ],
};

class MemoryStore implements GitabaseStore {
    options: GitabaseStoreOptions;
    private dataBuffer: CommitDataBuffer = new CommitDataBuffer();
    
    openDatabase = jest.fn((): Promise<GitabaseContainer> => {
        return Promise.resolve({
            rootFile: {
                gitabase: {
                    version: 1
                },
                name: 'gitabase-test-db',
                tableFiles: ['foods', 'drinks'],
            },
            tables: {
                foods: new Gitable('foods'),
                drinks: new Gitable('drinks'),
            },
        });
    });

    getTable = jest.fn((tableName: string): Promise<Gitable> => {
        return Promise.resolve(new Gitable(tableName, mockData[tableName]));
    });

    stageChanges = jest.fn(async (table: Gitable): Promise<void> => {
        await this.dataBuffer.stageChanges(table);
    });

    flush = jest.fn(async (): Promise<void> => {
        await this.dataBuffer.flush();
    });

    commit = jest.fn(async (): Promise<void> => {
        await this.flush();
    });

    rollback = jest.fn();
}

describe('gitabase', () => {
    let gitabase: Gitabase;
    let store: MemoryStore;

    beforeEach(() => {
        gitabase = new Gitabase();
        store = new MemoryStore();

        gitabase.useStore(store);
    });

    it('should open a database', async () => {
        await gitabase.openDatabase();
        expect(store.openDatabase).toHaveBeenCalled();
        expect(gitabase.name).toBe('gitabase-test-db');
        expect(gitabase.version).toBe(1);
    });

    it('should get data from a table', async () => {
        await gitabase.openDatabase();
        const foods = await gitabase.selectFrom('foods');
        expect(store.getTable).toHaveBeenCalledWith('foods');
        expect(foods).toEqual(mockData.foods);

        const drinks = await gitabase.selectFrom('drinks');
        expect(store.getTable).toHaveBeenCalledWith('drinks');
        expect(drinks).toEqual(mockData.drinks);
    });

    it('should insert a row into a table', async () => {
        await gitabase.openDatabase();
        const food = { id: 4, name: 'bagna cauda' };
        await gitabase.insertInto('foods', food);

        expect(store.stageChanges).toHaveBeenCalled();
        expect(store.commit).toHaveBeenCalled();
        expect(store.flush).toHaveBeenCalled();
        
        const foods = await gitabase.selectFrom('foods');
        expect(foods.pop()).toEqual(food);
    });

    it('should insert many rows into a table', async () => {
        const newDrinks = [{ id: 4, name: 'wine' }, { id: 5, name: 'soda' }];

        await gitabase.openDatabase();
        await gitabase.insertInto('drinks', newDrinks);

        expect(store.stageChanges).toHaveBeenCalled();
        expect(store.commit).toHaveBeenCalled();
        expect(store.flush).toHaveBeenCalled();

        const drinks = await gitabase.selectFrom('drinks');
        expect(drinks.some(drink => drink['id'] === 4 && drink['name'] === 'wine')).toBe(true);
        expect(drinks.some(drink => drink['id'] === 5 && drink['name'] === 'soda')).toBe(true);
    });

    it('should insert rows in tables while in a transaction', async () => {
        const newFood = { id: 4, name: 'bagna cauda' };
        const newDrinks = [{ id: 4, name: 'wine' }, { id: 5, name: 'soda' }];

        await gitabase.openDatabase();
        await gitabase.beginTransaction();
        await gitabase.insertInto('foods', newFood);
        expect(store.commit).not.toHaveBeenCalled();
        await gitabase.insertInto('drinks', newDrinks);
        expect(store.commit).not.toHaveBeenCalled();
        await gitabase.commit();

        expect(store.stageChanges).toHaveBeenCalledTimes(2);
        expect(store.commit).toHaveBeenCalledTimes(1);
        expect(store.flush).toHaveBeenCalledTimes(2);

        const foods = await gitabase.selectFrom('foods');
        expect(foods.pop()).toEqual(newFood);

        const drinks = await gitabase.selectFrom('drinks');
        expect(drinks.some(drink => drink['id'] === 4 && drink['name'] === 'wine')).toBe(true);
        expect(drinks.some(drink => drink['id'] === 5 && drink['name'] === 'soda')).toBe(true);
    });
});