export default class ChatSession {
    constructor() {
        this.data = [];
    }

    async get(key) {
        return this.data[key];
    }

    async set(key, value) {
        this.data[key] = value;
    }

    async delete(key) {
        delete this.data[key];
    }
}
