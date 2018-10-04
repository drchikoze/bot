export async function suggestActivation({ chatbot, chatId, activation }) {
    await chatbot.sendMessage({
        chatId,
        text: `We have a quiz for you. "${activation.name}".\n${activation.message}`
    });

    await chatbot.sendImage({ chatId, imageUrl: activation.pictureURL.trim() });

    return chatbot.sendMessage({
        chatId,
        text: `You will have ${activation.timeToPass / 60} minutes to answer ${activation.numberOfQuestions} questions. Are you ready to start?`,
        buttons: [
            { label: 'Yes', event: 'passActivation', payload: activation.id },
            { label: 'No', event: 'skipActivation' },
            { label: 'Remind later', event: 'remindMeLater', payload: activation.id }
        ]
    });
}


export async function suggestRandomActivation({ api, chatbot, chatId  }) {
    const sugestedActivations = (await api.quizwall.activations.list({ limit: 3, sortBy: 'popular' })).data.entities;
    const activationsButtons = sugestedActivations.map(activation => {
        return {
            label: activation.name,
            event: 'passActivation',
            payload: activation.id.toString()
        };
    });

    await chatbot.sendMessage({
        chatId,
        text: 'I can suggest you several test. Please choose one you like most',
        buttons: activationsButtons,
        isVerticalButtons: true
    });
}
