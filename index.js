class DataRouter {
    /**
     * @param {HTMLElement} element
     * @param {DataRouterHistory} historyMode
     */
    constructor(element, historyMode) {
        this.element = element;
        this.historyMode = historyMode;
        this.element.attachShadow({ mode: 'open', slotAssignment: 'manual' });
        this.slot = document.createElement('slot');
        this.element.shadowRoot.appendChild(this.slot);
        this.baseURL = window.location.origin;

        this.historyMode.addEventListener('changeState', this);

        this.handleEvent({ type: 'changeState' });
    }

    get current() {
        return this.historyMode.current;
    }

    /**
     * @param {string} state 
     */
    set current(state) {
        this.historyMode.current = state;
    }

    /**
     * @type {HTMLSlotElement}
     */
    slot;

    handleEvent(event) {
        switch (event.type) {
            case 'changeState':
                const children = /** @type {HTMLElement[]}*/(Array.from(this.element.children));
            
                children.filter((element) => 'activeRoute' in element.dataset)
                    .forEach((element) => delete element.dataset.activeRoute);
                let matches = children.filter((element) => {
                if (!element.dataset.route) return false;
                    
                    const pattern = new URLPattern({ pathname: element.dataset.route });
                    return pattern.test(new URL(this.current, this.baseURL));
                });

                if (!matches.length) {
                    matches = children.filter((element) => 'fallbackRoute' in element.dataset);
                }
                
                matches.forEach((element) => {element.dataset.activeRoute = ''});
                this.slot.assign(...matches);
                break;
        }
    }
}

class DataRouterHistory extends EventTarget {
    /**
     * @abstract
     * @returns {string}
     */
    get current() {}

    /**
     * @abstract
     * @param {string} arg0
     */
    set current(arg0) {}
}

class DataRouterMemoryHistory extends DataRouterHistory {
    constructor() {
        super();
    }

    _current;

    get current() {
        return this._current;
    }

    set current(state) {
        this._current = state;
        this.dispatchEvent(new Event('changeState'));
    }
}

class DataRouterHashHistory extends DataRouterHistory {
    constructor() {
        super();
        window.addEventListener('hashchange', () => {
            this.dispatchEvent(new Event('changeState'));
        });
    }

    get current() {
        return window.location.hash.slice(1);
    }

    set current(state) {
        window.location.hash = `#${state}`;
    }
}

function toElement(mode) {
    return class extends HTMLElement {
        connectedCallback() {
            if (!this.router) {
                this.router = new DataRouter(this, new mode());
            }
            this.router.handleEvent({ type: 'changeState' });
        }

        /**
         * @returns {string}
         */
        get current() {
            return this.router.current;
        }

        /**
         * @param {string} state
         */
        set current(state) {
            this.router.current = state;
        }
    }
}

const DataRouterMemoryElement = toElement(DataRouterMemoryHistory);
const DataRouterHashElement = toElement(DataRouterHashHistory);

customElements.define('data-memory-router', DataRouterMemoryElement);
customElements.define('data-hash-router', DataRouterHashElement);

export { DataRouter, DataRouterHistory, DataRouterMemoryHistory,
    DataRouterHashHistory, DataRouterMemoryElement, DataRouterHashElement }

