import { getQuizSessionReport } from '../helpers/quizSessions';
import { deleteQuestion } from '../helpers/questions';

export default async function finishActivation({ chatbot, chatId, api, chatSession }) {
    const messagesIds = await chatSession.get('messagesIds');

    await Promise.all(messagesIds.map(async messageId => {
        await deleteQuestion({
            chatbot,
            chatId,
            messageId
        });
    }));
    await chatSession.delete('messagesIds');

    const quizSession = await chatSession.get('quizSession');

    if (!quizSession) {
        return chatbot.sendMessage({
            chatId,
            text: 'No any passings to finish! Try to start one before.'
        });
    }

    await chatSession.delete('lastAskedQuestion');
    try {
        const answers = quizSession.questions.map(question => {
            return {
                questionId: question.id,
                answer: question.accountAnswers
            };
        });
        await api.quizSessions.update(quizSession.id, { status: 'FINISHED', answers });
    } catch (error) {
        switch (error.code) {
            case 'SESSION_FINISHED': {
                console.log('SESSION_FINISHED');

                await chatbot.sendMessage({
                    chatId,
                    text: 'Unfortunately time is over.'
                });

                break;
            }
            default: {
                console.log('---error---\n', error, '\n');
                await chatbot.sendMessage({
                    chatId,
                    text: 'Smth wrong. Life is pain.'
                });
                throw error;
            }
        }
    }
    await chatSession.delete('quizSession');
    const text = await getQuizSessionReport({ api, quizSession });

    return chatbot.sendMessage({
        chatId,
        text
    });
};
