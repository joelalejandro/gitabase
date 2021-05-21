import crypto from 'crypto';

import { GitabaseContainer, GitabaseRootFile, GitabaseStore, GitabaseStoreOptions } from "../../types/gitabase";
import { Json } from "../../types/http";
import CommitDataBuffer from '../commit-data-buffer';
import { Gitable } from '../gitable';
import { request } from "../utils/http";

interface GitlabStoreOptions extends GitabaseStoreOptions {
    projectId: number;
    token: string;
    branch?: string;
    commitEmail?: string;
    commitAuthor?: string;
}

interface GitlabRequestHeaders extends Record<string, string> {
    'PRIVATE-TOKEN': string;
}

interface GitlabCommit {
    id: string;
}


class GitlabStore implements GitabaseStore {
    private baseUrl: string;
    private dataBuffer: CommitDataBuffer;

    constructor(public readonly options: GitlabStoreOptions) {
        this.baseUrl = `https://gitlab.com/api/v4/projects/${this.options.projectId.toString()}`;
        this.dataBuffer = new CommitDataBuffer();
        
        if (!this.options.branch) {
            this.options.branch = 'main';
        }

        if (!this.options.commitAuthor) {
            this.options.commitAuthor = 'Gitabase';
        }

        if (!this.options.commitEmail) {
            this.options.commitEmail = 'gitabase@no-email.com';
        }
    }

    private getReadEndpoint(file: string) {
        return `${this.baseUrl}/repository/files/${encodeURIComponent(file)}/raw`;
    }

    private getWriteEndpoint() {
        return `${this.baseUrl}/repository/commits`;
    }

    private getHeadEndpoint() {
        return `${this.baseUrl}/repository/commits`;
    }

    private getRollbackEndpoint(commitId: string) {
        return `${this.baseUrl}/repository/commits/${commitId}/revert`;
    }

    private get requestHeaders(): GitlabRequestHeaders {
        return {
            'PRIVATE-TOKEN': this.options.token
        };
    }

    private openRootFile(): Promise<GitabaseRootFile> {
        return request<GitabaseRootFile>(this.getReadEndpoint('root.gitabase'), 'GET', {
            headers: this.requestHeaders
        });
    }

    private openTableFile(tableName: string): Promise<Json[]> {
        return request(this.getReadEndpoint(`tables/${tableName}.gitable`), 'GET', {
            headers: this.requestHeaders
        });
    }

    private async getLatestCommitId(): Promise<string> {
        const commits = await request<GitlabCommit[]>(this.getHeadEndpoint(), 'GET', { headers: this.requestHeaders });
        return commits.shift().id;
    }

    async openDatabase(): Promise<GitabaseContainer> {
        const rootFile = await this.openRootFile();
        const tableList = rootFile.tableFiles.map(tableName => ({ [tableName]: new Gitable(tableName) }));
        const reducedTableList = tableList.reduce((accumulated, table) => ({ ...accumulated, ...table }), {});
        return { rootFile, tables: reducedTableList };
    }

    async getTable(tableName: string): Promise<Gitable> {
        const initialTableData = await this.openTableFile(tableName);
        return new Gitable(tableName, initialTableData);
    }

    async stageChanges(table: Gitable) {
        await this.dataBuffer.stageChanges(table);
    }

    async flush() {
        await this.dataBuffer.flush();
    }
    
    async commit(): Promise<void> {
        const operationId = crypto.randomBytes(4).toString('hex');
        const dataBuffer = await this.dataBuffer.read();
        await request<GitlabCommit>(this.getWriteEndpoint(), 'POST', {
            body: {
                branch: this.options.branch,
                commit_message: `gitabase(commit): operation ${operationId}`,
                author_email: this.options.commitEmail,
                author_name: this.options.commitAuthor,
                actions: dataBuffer.map(gitable => ({
                    action: 'update',
                    file_path: `tables/${gitable.name}.gitable`,
                    content: JSON.stringify(gitable.selectAll()),
                }))
            },
            headers: this.requestHeaders,
        });
        await this.dataBuffer.flush();
    }
    
    async rollback(): Promise<void> {
        const commitId = await this.getLatestCommitId();
        await request(this.getRollbackEndpoint(commitId), 'POST', { 
            body: {
                branch: this.options.branch,
            },
            headers: this.requestHeaders 
        });
    }
}

export { GitlabStore, GitlabStoreOptions };