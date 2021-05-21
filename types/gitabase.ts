import { Gitable } from "../src/gitable";
import { Json } from "./http";

export type GitabaseRootFile = {
    gitabase: GitabaseManifest;
    name: string;
    tableFiles: string[];
}

export type GitabaseManifest = {
    version: number;
}

export type GitabaseContainer = {
    rootFile: GitabaseRootFile;
    tables: Record<string, Gitable>;
}

export type GitabaseStoreOptions = Record<string, any>;

export interface GitabaseStore {
    options: GitabaseStoreOptions;
    stageChanges(table: Gitable): Promise<void>;
    flush(): Promise<void>;
    openDatabase(): Promise<GitabaseContainer>;
    getTable(tableName: string): Promise<Gitable>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
}