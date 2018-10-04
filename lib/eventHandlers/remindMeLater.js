// const DAY_IN_MS = 1000 * 60 * 60 * 24;
const DAY_IN_MS = 1000 * 5;

export default async function remindMeLater({ chatbot, chatId, from, payload }) {
    console.log('payload', payload);
    const reminder = await chatbot.getReminder();
    console.log('reminder', reminder);
    const currentTimeStamp = Date.now();
    reminder.subscribeForRemind({
        timeToRemind: currentTimeStamp + DAY_IN_MS,
        data: {
            from: {
                userName: from.userName,
                firstName: from.firstName
            },
            chatId,
            payload
        }
    })

    await chatbot.sendMessage({
        chatId,
        text: 'See you tomorrow'
    });
};
