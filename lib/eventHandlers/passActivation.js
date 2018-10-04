import { askQuestion } from '../helpers/questions';
import { suggestRandomActivation } from '../helpers/activations';
import {
    isSessionOutOfTime,
    getQuizSessionData,
    isNewActivationStarted,
    getQuizSessionReport
} from '../helpers/quizSessions';

export default async function passActivation({ chatbot, chatId, payload, api, chatSession }) {
    try {
        const { quizSession, activation } = await getQuizSessionData({ api, activationId: payload });
        const isCurrentSessionOutOfTime = await isSessionOutOfTime({ api, quizSession });
        const questionsLength = quizSession.questions.length;

        if (!isCurrentSessionOutOfTime) {
            if (!isNewActivationStarted({ quizSession, activation })) {
                await chatbot.sendMessage({
                    chatId,
                    text: `Great! Lets start test "${activation.name}"`
                });

                await chatSession.set('quizSession', quizSession);

                // check last question
                const lastAskedQuestion = await chatSession.get('lastAskedQuestion');
                let firstQuestion;

                if (!lastAskedQuestion) {
                    firstQuestion = quizSession.questions[0];
                    await chatSession.set('lastAskedQuestion', firstQuestion.number);
                } else {
                    firstQuestion = quizSession.questions[lastAskedQuestion - 1];
                }

                await askQuestion(chatbot, chatId, firstQuestion, questionsLength);
            } else {
                // asc start new session or continue prev
                await chatbot.sendMessage({
                    chatId,
                    text: `You have unfinished quiz. You have time to finish it. Do you want finish previous test and start new?`,
                    buttons: [
                        {
                            label: 'Yes',
                            event: 'forsePassActivation',
                            payload: activation.id
                        },
                        {
                            label: 'No, continue prev.',
                            event: 'forsePassActivation'
                        }
                    ]
                });

                // go to forsePassActivation
            }
        } else {
            const text = await getQuizSessionReport({ api, quizSession });

            await chatbot.sendMessage({
                chatId,
                text: 'Your last test is out of time.'
            });

            await chatbot.sendMessage({
                chatId,
                text
            });

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
    } catch (error) {
        if (error.code === 'EXCEEDED_MAX_NUMBER_OF_TRIES') {
            await chatbot.sendMessage({
                chatId,
                text: "Sorry, you've exceeeded number of tries for this test"
            });

            await suggestRandomActivation({
                api,
                chatId,
                chatbot
            });
        }  else {
            throw error;
        }

        console.log(error);
    }
};
