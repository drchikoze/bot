
export async function askQuestion(chatbot, chatId, question, questionsLength) {
    chatbot.questionsState[question.id] = question;

    const specificHelper = {
        SINGLE   : preparareSingleChoiceOptions,
        MULTIPLE : prepareMultipleChoiceOptions,
        YESNO    : prepareYesNoChoiceOptions
    }[question.type];

    const options = await specificHelper(chatbot, chatId, question);
    const body = createQuestionBody(question, questionsLength);
    const buttons = createQuestionButtons({ questionId: question.id, options });

    const match = question.body.match(/(\/?be\/user-static.+?(png|gif|jpg))+/g);

    if (match) {
        // Send separate caption for questions with images;
        const bodyForImage = createImageQuestionBody(question);
        // await chatbot.sendMessage({ chatId, text: createQuestionCaption(question) });
        await chatbot.sendMessage({ chatId, text: `Question #${question.number} of #${questionsLength}:` });

        await Promise.all(match.map(async url => {
            const imageUrl = `https://app.itsquiz.com${url}`;

            await chatbot.sendImage({ chatId, imageUrl });
        }));

        return chatbot.sendMessage({
            chatId,
            text: bodyForImage,
            buttons,
            isVerticalButtons: true
        });
    }

    return chatbot.sendMessage({
        chatId,
        text: body,
        buttons,
        isVerticalButtons: true
    });
}

export async function updateQuestion({ chatbot, chatId, questionId, messageId, question, options, questionsLength }) {
    const body    = createQuestionBody(question, questionsLength);
    const buttons = createQuestionButtons({ questionId, options });

    return chatbot.updateMessage({
        chatId,
        messageId,
        text: body,
        buttons,
        isVerticalButtons: true
    });
}

// export async function deleteQuestion({ chatbot, chatId, questionId, messageId, question, options }) {
export async function deleteQuestion({ chatbot, chatId, messageId }) {
    return chatbot.updateMessage({
        chatId,
        messageId,
        text: 'deleted question',
        isVerticalButtons: true
    });
}

async function preparareSingleChoiceOptions(chatbot, chatId, question) {
    const options = question.options.map(option => {
        return { text: option.text, selected: false };
    });

    question.accountAnswers.forEach(answerIdx => {
        options[answerIdx].selected = true;
    });

    return options;
}

async function prepareMultipleChoiceOptions(chatbot, chatId, question) {
    const options = question.options.map(option => {
        return { text: option.text, selected: false };
    });

    question.accountAnswers.forEach(answerIdx => {
        options[answerIdx].selected = true;
    });

    return options;
}

async function prepareYesNoChoiceOptions(chatbot, chatId, question) {
    const answer = question.accountAnswers[0];

    let options = [
        { text: 'Yes', selected: false },
        { text: 'No', selected: false }
    ];

    if (answer === true) {
        options = [
            { text: 'Yes', selected: true },
            { text: 'No', selected: false }
        ];
    } else if (answer === false) {
        options = [
            { text: 'Yes', selected: false },
            { text: 'No', selected: true }
        ];
    }

    return options;
}

export function createImageQuestionBody(question) {
    const text = question.body.replace(/!\[[^\]]+]\(?(.+)\/be\/user-static.+?(png|gif|jpg)\)/, '');

    const typeDesc = {
        SINGLE   : '(select one answer)',
        MULTIPLE : '(select one or more answers)',
        YESNO    : '(yes/no type)',
        ORDERED  : '(make answers in a correct order)',
        MATCH    : '(match answers)'
    }[question.type];

    return `${typeDesc}\n${text}`;
}

export function createQuestionBody(question, questionsLength) {
    const match = question.body.match(/(\/be\/user-static.+?(png|gif|jpg))/);
    const typeDesc = {
        SINGLE   : '(select one answer)',
        MULTIPLE : '(select one or more answers)',
        YESNO    : '(yes/no type)',
        ORDERED  : '(make answers in a correct order)',
        MATCH    : '(match answers)'
    }[question.type];

    if (match) {
        const body =  question.body.replace(/!\[[^\]]+]\(?(.+)\/be\/user-static.+?(png|gif|jpg)\)/, '');

        return `${typeDesc}\n\n${body}`;
    }



    return `Question #${question.number} of #${questionsLength}: ${typeDesc}\n\n${question.body}`;
}

function createQuestionCaption(question) {
    const typeDesc = {
        SINGLE   : '(select one answer)',
        MULTIPLE : '(select one or more answers)',
        YESNO    : '(yes/no type)',
        ORDERED  : '(make answers in a correct order)',
        MATCH    : '(match answers)'
    }[question.type];

    return `Question #${question.number}: ${typeDesc}`;
}

function createQuestionButtons({ questionId, options }) {
    return options.map((option, i) => {
        const payload = `${questionId}-${i}`;
        const text = option.selected ?  `[[ ${option.text} ]]` : `${option.text}`;

        return { label: text, event: 'answered', payload };
    });
}
