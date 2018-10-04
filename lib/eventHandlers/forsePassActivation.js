import { askQuestion } from '../helpers/questions';
import {
    getQuizSessionData,
    getQuizSessionReport
} from '../helpers/quizSessions';

export default async function passActivation({ chatbot, chatId, payload, api, chatSession }) {
    const quizSession = await chatSession.get('quizSession');
    const questionsLength = quizSession.questions.length;

    if (payload === 'undefined') {
        const lastAskedQuestion = await chatSession.get('lastAskedQuestion');
        const index = lastAskedQuestion > 0 ? lastAskedQuestion : 0;
        const question = quizSession.questions[index - 1];

        await askQuestion(chatbot, chatId, question, questionsLength);
    } else {
        // finish last session
        await api.quizSessions.update(quizSession.id, { status: 'FINISHED' });

        const text = await getQuizSessionReport({ api, quizSession });

        await chatbot.sendMessage({
            chatId,
            text
        });

        // start new session
        const newSessionData = await getQuizSessionData({ api, activationId: payload });
        const newQuizSession = newSessionData.quizSession;
        const newActivation = newSessionData.activation;

        await chatbot.sendMessage({
            chatId,
            text: `Great! Lets start test "${newActivation.name}"`
        });
        // check last question
        await chatSession.set('quizSession', newQuizSession);

        const firstQuestion = newQuizSession.questions[0];
        await chatSession.set('lastAskedQuestion', firstQuestion.number);

        await askQuestion(chatbot, chatId, firstQuestion, questionsLength);
    }
};
