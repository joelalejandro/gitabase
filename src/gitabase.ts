import { GitabaseContainer, GitabaseStore } from "../types/gitabase";
import { Json } from "../types/http";

class Gitabase {
    private db: GitabaseContainer;
    private store: GitabaseStore;
    private inTransaction: boolean = false;

    useStore(store: GitabaseStore) {
        this.store = store;
    }

    async openDatabase() {
        this.db = await this.store.openDatabase();
    }

    async selectFrom(tableName: string) {
        const table = await this.store.getTable(tableName);
        return table.selectAll();
    }

    async beginTransaction() {
        await this.store.flush();
        this.inTransaction = true;
    }

    async insertInto(tableName: string, data: Json) {
        const table = await this.store.getTable(tableName);
        table.insert(data);
        await this.store.stageChanges(table);
        if (!this.inTransaction) {
            await this.store.commit();
        }
    }

    async commit() {
        await this.store.commit();
        this.inTransaction = false;
    }

    get version(): number {
        return this.db.rootFile.gitabase.version;
    }

    get name(): string {
        return this.db.rootFile.name;
    }
}

export { Gitabase };