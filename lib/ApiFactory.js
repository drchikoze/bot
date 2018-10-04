import itsquizAPI from 'itsquiz-api';

export default class ApiFactory {
    constructor({ accessKey, defaultPassword, apiPrefix }) {
        if (!accessKey)       throw new Error('[accessKey] is required');
        if (!defaultPassword) throw new Error('[defaultPassword] is required');
        if (!apiPrefix)       throw new Error('[apiPrefix] is required');

        this.accessKey = accessKey;
        this.defaultPassword = defaultPassword;
        this.apiPrefix = apiPrefix;
    }

    async create({ userName, firstName, chatId, messenger }) {
        console.info(`Create api for ${userName}`);

        const api = itsquizAPI({ apiPrefix: this.apiPrefix, isVerbose: true });

        const login    = `${userName}@telegram.itsquiz.com`;
        const password = this.defaultPassword;

        console.info(`Autenticate user ${login}`);

        try {
            await api.sessions.create({ login, password });
        } catch (error) {
            console.log(error);
            console.info(`Cannot login as ${login}. Creating new user.`);

            api.accounts.createForMessenger({
                messenger,
                chatId,
                firstName,
                userName,
                chatbotKey: this.accessKey
            });
        }

        return api;
    }
}
