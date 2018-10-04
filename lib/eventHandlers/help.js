export default async function help({ chatbot, chatId }) {
    await chatbot.sendMessage({
        chatId,
        text: 'Sorry, bro. Life is pain. I cannot help you.'
    });
};
