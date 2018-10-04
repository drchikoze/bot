// @flow
/* eslint max-len: 0 */

import EventEmitter from 'events';
import eventHandlers from './eventHandlers';
import Reminder from './Reminder';

export default class ChatBot extends EventEmitter {
    constructor({ backends, apiFactory, chatSessionFactory }) {
        super();

        this.questionsState     = {}; // TMP

        this.apiFactory         = apiFactory;
        this.chatSessionFactory = chatSessionFactory;
        this.backends           = backends;
        this.apiInstancesCache  = {};
        this.chatSessions       = {};
        this.reminder = new Reminder();

        this._registerEventHandlers(eventHandlers);

        this.reminder.start();
        this.reminder.on('completed', async (data) => {
            await this.emitEvent('start', data);
        });
    }

    async getReminder() {
        return this.reminder || new Reminder();
    }

    async run() {
        this._getBackend().run();
    }

    async sendMessage(...args) {
        console.log('SEND MESSAGE', args);
        const [ { chatId } ] = args;
        const currentChatSession = this.chatSessions[chatId];
        let messagesIds = await currentChatSession.get('messagesIds');

        if (!messagesIds) {
            await currentChatSession.set('messagesIds', []);
            messagesIds = await currentChatSession.get('messagesIds');
        }


        const currentMessage = await this._getBackend().sendMessage(...args);
        messagesIds.push(currentMessage.message_id);
        await currentChatSession.set('messagesIds', messagesIds);

        return currentMessage;
    }

    async updateMessage(...args) {
        console.log('UPDATE MESSAGE', args);

        return this._getBackend().updateMessage(...args);
    }

    async emitEvent(eventName, args) {
        console.log('emitEvent\n\n');
        this._getBackend().emit(eventName, args);
    }

    async sendImage(...args) {
        console.log('SEND IMAGE', args);

        return this._getBackend().sendImage(...args);
    }

    async _getApi({ chatId, from }) {
        if (!this.apiInstancesCache[from.userName]) {
            const api = await this.apiFactory.create({
                messenger : 'TELEGRAM',
                firstName : from.firstName,
                userName  : from.userName,
                chatId
            });

            this.apiInstancesCache[from.userName] = api;
        }

        return this.apiInstancesCache[from.userName];
    }

    async _getChatSession({ chatId }) {
        if (!this.chatSessions[chatId]) {
            const chatSession = await this.chatSessionFactory.create({
                messenger : 'TELEGRAM',
                chatId
            });

            this.chatSessions[chatId] = chatSession;
        }

        return this.chatSessions[chatId];
    }

    _getBackend() {
        return this.backends.telegram;
    }

    _registerEventHandlers(handlers) {
        for (const eventName in handlers) {
            if (handlers.hasOwnProperty(eventName)) {
                const eventHandler = handlers[eventName];

                this._getBackend().on(eventName, (args) => {
                    this.emit(eventName, args);
                });

                this.on(eventName,  async (args) => {
                    try {
                        console.info(`===============\nPROCESSING EVENT [${eventName}]`, args);

                        const api = await this._getApi({
                            from   : args.from,
                            chatId : args.chatId
                        });

                        const chatSession = await this._getChatSession({
                            chatId: args.chatId
                        });

                        await eventHandler({ ...args, api, chatbot: this, chatSession });
                    } catch (e) {
                        console.error(`ERROR IN EVENT [${eventName}]`, e);
                    }
                });
            }
        }
    }
}
