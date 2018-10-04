import { updateQuestion, askQuestion } from '../helpers/questions';
import {
    getRemainingTime
 } from '../helpers/quizSessions';

export default async function answered({ chatbot, chatId, from, chatSession, api, payload, messageId }) {
    const { questionId, selectedOption } = parsePayload(payload);

    const question = chatbot.questionsState[questionId];

    if (!question.options) question.options = [];

    let options = question.options.map(option => {
        return { text: option.text, selected: false };
    });

    if (question.type === 'SINGLE') {
        question.accountAnswers = [ +selectedOption ];

        question.accountAnswers.forEach(answerIdx => {
            options[answerIdx].selected = true;
        });
    } else if (question.type === 'MULTIPLE') {
        if (question.accountAnswers.includes(+selectedOption)) {
            question.accountAnswers = question.accountAnswers.filter(answerIdx => answerIdx !== +selectedOption);
        } else {
            question.accountAnswers = [...question.accountAnswers, +selectedOption];
        }
        question.accountAnswers.forEach(answerIdx => {
            options[answerIdx].selected = true;
        });
    } else if (question.type === 'YESNO') {
        if (+selectedOption === 0) {
            options = [
                { text: 'Yes', selected: true },
                { text: 'No', selected: false }
            ];

            question.accountAnswers = [ true ];
        } else if (+selectedOption === 1) {
            options = [
                { text: 'Yes', selected: false },
                { text: 'No', selected: true }
            ];
            question.accountAnswers = [ false ];
        } else {
            options = [
                { text: 'Yes', selected: false },
                { text: 'No', selected: false }
            ];
            question.accountAnswers = [];
        }
    }

    const quizSession = await chatSession.get('quizSession');
    const questionsLength = quizSession.questions.length;
    const result = await api.quizSessions.update(quizSession.id, {
        answers: [ {
            questionId: question.id,
            answer: question.accountAnswers
        } ]
    });

    await updateQuestion({
        chatbot,
        chatId,
        messageId,
        questionId,
        question,
        options,
        questionsLength
    });

    if (!!result.positionByGainedPoints) {
        return chatbot.emitEvent('finish', {
            from: {
                userName: from.userName,
                firstName: from.firstName
            },
            chatId
        });
    }

    const lastAskedQuestion = await chatSession.get('lastAskedQuestion');

    if (lastAskedQuestion === question.number) {
        const lastAskedQuestionIndex = quizSession.questions.findIndex(q => question.number === q.number);

        const nextQuestion = quizSession.questions[lastAskedQuestionIndex + 1];

        if (nextQuestion) {
            // const quizSessionWithReults = await api.quizSessions.show(quizSession.id);
            const remainingTime = getRemainingTime({ quizSession });

            await chatbot.sendMessage({ chatId, text: `Awesome! You have ${remainingTime}.\n\n` });

            await askQuestion(chatbot, chatId, nextQuestion, questionsLength);
            await chatSession.set('lastAskedQuestion', nextQuestion.number);
        } else {
            return chatbot.sendMessage({
                chatId,
                text: 'you have answered all questions, would you like finish the test?',
                buttons: [
                    {
                        label: 'Yes',
                        event: 'finish'
                    }
                ]
            });
        }
    }
};

function parsePayload(payload) {
    const match = payload.match(/([^-]+)-([^-]+)/);

    if (!match) {
        throw new Error(`WRONG PAYLOAD FORMAT ${payload}`);
    }

    const questionId     = match[1];
    const selectedOption = match[2];

    return { questionId, selectedOption };
}
