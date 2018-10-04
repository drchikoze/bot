import moment from 'moment';

export function isQuizSessionFinished({ quizSession }) {
    if (quizSession.finishedAt) {
        return true;
    }

    return false;
}

export async function getQuizSessionData({ api, activationId }) {
    const activation = (await api.quizwall.activations.show(activationId)).data;
    const startedQuizSessions = (await api.quizSessions.list({ status: 'started', isInbox: true })).data.entities;
    console.log('\n\ngetQuizSessionData\n\n');
    let quizSessionId;
    // check out of time existing quizSession

    if (startedQuizSessions.length) {
        quizSessionId = startedQuizSessions[0].id;
    } else {
        quizSessionId = (await api.quizSessions.create(activation.links.action.id)).id;
        await api.quizSessions.start(quizSessionId);
    }

    const data        = await api.quizSessions.show(quizSessionId);
    const quizSession = data.data;
    const account     = data.linked.accounts[0];

    let i = 0;

    for (const question of quizSession.questions) {
        question.number = ++i;
    }

    return { activation, quizSession, account };
}

export function isNewActivationStarted({ quizSession, activation }) {
    return !(quizSession.links.activation.id === activation.id);
}

export function isSessionOutOfTime({ quizSession }) {
    const startedAt = moment(quizSession.startedAt);
    const finishedAt = startedAt.add(moment.duration(quizSession.timeToPass, 'seconds'));
    const currentTime = moment();

    return currentTime.isAfter(finishedAt);
}

export function getRemainingTime({ quizSession }) {
    const startedAt = moment(quizSession.startedAt);
    const finishedAt = startedAt.add(moment.duration(quizSession.timeToPass, 'seconds'));
    const currentTime = moment();
    const duration = Math.round(moment.duration(finishedAt.diff(currentTime)).asMinutes());

    switch (duration) {
        case 0: {
            return 'less then one minute';
        }
        case 1: {
            return `about ${duration} minute`;
        }
        default: {
            return `about ${duration} minutes`;
        }
    }
}

export async function getAssessmetSystemReport({ api, assessmentSystemId, gainedScore }) {
    // if (assessmentSystemId === 'STANDARD') {
    if (gainedScore > 95) {
        return 'You rock! Excellent job!';
    }

    if (gainedScore > 75) {
        return 'Great result!';
    }

    if (gainedScore > 50) {
        return 'Good job!';
    }

    if (gainedScore > 30) {
        return 'You could do better!';
    }

    return 'You could do better!';
}

export async function getQuizSessionReport({ api, quizSession }) {
    const quizSessionWithReults = await api.quizSessions.show(quizSession.id);

    const assessmentSystemId =
        (await api.quizwall.activations.show(quizSessionWithReults.data.links.activation.id)).data.assessmentSystemId;

    const gainedPercent =
        Math.round(quizSessionWithReults.data.gainedPoints / quizSessionWithReults.data.maxPoints * 100);

    const assessmetSystemReport = await getAssessmetSystemReport({
        api,
        assessmentSystemId,
        gainedScore: gainedPercent
    });

    return `Great! You've just finished the test. Your result ${gainedPercent}% \n${assessmetSystemReport}`;
}
