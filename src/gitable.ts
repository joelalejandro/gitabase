import { Json } from "../types/http";

class Gitable {
    private data: Json[] = [];

    constructor(public readonly name: string, initialData?: Json[]) {
        if (initialData) {
            this.data = initialData;
        }
    }

    selectAll() {
        return this.data;
    }

    insert(data: Json | Json[]) {
        if (Array.isArray(data)) {
            this.data.push(...data);
        } else {
            this.data.push(data);
        }
    }
}

export { Gitable };