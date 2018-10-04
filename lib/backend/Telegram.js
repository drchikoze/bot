// @flow

import Telegraf, { Markup, Telegram } from 'telegraf';
import Base from './Base';

export default class TelegramBackend extends Base {
    constructor({ token }) {
        super();

        this.token    = token;
        this.telegram = new Telegram(token);
        this.telegraf = this._createTelegrafBot(this.token);
    }

    run() {
        console.log('START TELEGRAF');
        this.telegraf.startPolling();
    }

    async sendMessage({ chatId, text, buttons, isVerticalButtons }) {
        return this.telegram.sendMessage(
            chatId,
            text,
            buttons
                ? this._prepareButtonsInlineKeyboard({ buttons, isVerticalButtons })
                : undefined
        );
    }

    async updateMessage({ chatId, messageId, text, buttons, isVerticalButtons }) {
        return this.telegram.editMessageText(
            chatId,
            messageId,
            undefined,
            text,
            buttons
                ? this._prepareButtonsInlineKeyboard({ buttons, isVerticalButtons })
                : undefined
        );
    }

    async sendImage({ chatId, imageUrl }) {
        return this.telegram.sendPhoto(chatId, imageUrl);
    }

    _prepareButtonsInlineKeyboard({ buttons, isVerticalButtons }) {
        const buttonsMarkup = buttons.map(btn => {
            const callbackStr = `e|${btn.event}|${btn.payload}`;

            console.log('register button with callback %s', callbackStr);

            const button = Markup.callbackButton(btn.label, callbackStr);

            return isVerticalButtons ? [ button ] : button;
        });

        return Markup.inlineKeyboard(buttonsMarkup).oneTime().resize().extra();
    }

    _createTelegrafBot(token) {
        const telegraf = new Telegraf(token);

        telegraf.command('start', (ctx) => {
            const activationId = ctx.message.text.replace(/^\/start\s*/, '');

            const data = {
                payload: activationId,
                from: {
                    userName: ctx.from.username,
                    firstName: ctx.from.first_name
                },
                chatId: ctx.chat.id
            };

            this.emit('start', data);
        });

        telegraf.command('finish', (ctx) => {
            const data = {
                from: {
                    userName: ctx.from.username,
                    firstName: ctx.from.first_name
                },
                chatId: ctx.chat.id
            };

            this.emit('finish', data);
        });


        telegraf.command('help', (ctx) => {
            const data = {
                payload: '',
                from: {
                    userName: ctx.from.username,
                    firstName: ctx.from.first_name
                },
                chatId: ctx.chat.id
            };

            this.emit('help', data);
        });

        telegraf.action(/e\|([^|]+)\|([^|]+)/, (ctx) => {
            console.log('MATCH', ctx.match);
            const event   = ctx.match[1];
            const payload = ctx.match[2];

            this.emit(event, {
                payload,
                from: {
                    userName: ctx.from.username,
                    firstName: ctx.from.first_name
                },
                messageId : ctx.callbackQuery.message.message_id,
                chatId    : ctx.chat.id
            });
        });

        telegraf.action(/.+/, (ctx) => {
            console.log('UNMATCHED ACTION', ctx.match);
        });

        return telegraf;
    }
}
