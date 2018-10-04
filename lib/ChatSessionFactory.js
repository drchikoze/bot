import ChatSession from './ChatSession';

export default class ChatSessionFactory {
    async create() {
        return new ChatSession();
    }
}
