export default async function skipActivation({ chatbot, chatId, from }) {
    return chatbot.sendMessage({
        chatId,
        text: `See you later, ${from.firstName}.`
    });
};
