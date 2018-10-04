import EventEmitter from 'events';

export default class Base extends EventEmitter {
    run() {
        throw new Error('[run] must be redefined in subclass');
    }

    sendMessage() {
        throw new Error('[sendMessage] must be redefined in subclass');
    }

    updateMessage() {
        throw new Error('[updateMessage] must be redefined in subclass');
    }

    sendImage() {
        throw new Error('[sendImage] must be redefined in subclass');
    }
}
