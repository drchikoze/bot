#!/usr/bin/env node

import ChatBot            from '../lib/ChatBot';
import ApiFactory         from '../lib/ApiFactory';
import ChatSessionFactory from '../lib/ChatSessionFactory';
import TelegramBackend    from '../lib/backend/Telegram';

import CONFIG from '../etc/config.json';

main(CONFIG);

async function main(config) {
    try {
        const chatBot = new ChatBot({
            apiFactory: new ApiFactory({
                accessKey       : config.itsquiz.accessKey,
                defaultPassword : config.itsquiz.defaultPassword,
                apiPrefix       : config.itsquiz.apiPrefix
            }),
            chatSessionFactory: new ChatSessionFactory(),
            backends: {
                telegram: new TelegramBackend({
                    token: config.telegram.token
                })
            }
        });

        chatBot.run();
    } catch (e) {
        console.log(e);
        process.exit();
    }
}
