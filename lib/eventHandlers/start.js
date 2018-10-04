import { suggestActivation, suggestRandomActivation } from '../helpers/activations';

export default async function start({ chatbot, chatId, payload, from, api }) {
    console.log('start\n\n\n\nfuck y');
    const isNewSession = true;

    if (isNewSession) {
        await chatbot.sendMessage({
            chatId,
            text: `Hi, ${from.firstName}! I am itsquiz bot. Please say "/help" if you want to know what can I do`
        });
    }

    if ( payload ) {
        const activationId = payload;
        const activation   = await api.quizwall.activations.show(activationId);

        await suggestActivation({
            chatbot,
            chatId,
            activation : activation.data
        });
    } else {
        await suggestRandomActivation({
            api,
            chatbot,
            chatId
        });
    }
};
