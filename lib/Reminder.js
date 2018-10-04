import EventEmitter from 'events';
import binarysearch from 'binarysearch';

const INTERVAL = 1000;
let instance = null;

export default class SingletonReminder extends EventEmitter {
    constructor() {
        super();
        // if(!instance) {
        //     instance = this;
        // }

        this.eventsMap = {};

        // return instance;
    }

    subscribeForRemind({ timeToRemind, data }) {
        console.log('data\n\n\n\n', data);
        this.eventsMap[timeToRemind] = data;
    }

    start() {
        this._checkEvents();
    }

    _checkEvents() {
        const events = Object.keys(this.eventsMap);
        if (events.length) {
            const currentTimeStamp = Date.now();
            const eventsToRemind = binarysearch.rangeValue(
                Object.keys(this.eventsMap),
                0,
                currentTimeStamp
            );

            eventsToRemind.forEach(event => {
                this.emit('completed', this.eventsMap[event]);
                delete this.eventsMap[event];
            });

        }
        setTimeout( this._checkEvents.bind(this), INTERVAL)
    }

}
