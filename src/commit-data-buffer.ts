import { Gitable } from "./gitable";

class CommitDataBuffer {
    private dataToCommit: Gitable[] = [];
    
    async stageChanges(table: Gitable) {
        this.dataToCommit.push(table);
    }

    async read() {
        return this.dataToCommit;
    }

    async flush() {
        this.dataToCommit = [];
    }
}

export default CommitDataBuffer;