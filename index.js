class DataRouter {
    /**
     * @param {HTMLElement} element
     * @param {DataRouterHistory} historyMode
     */
    constructor(element, historyMode) {
        this.element = element;
        this.historyMode = historyMode;
        this.shadowRoot = this.element.attachShadow({ mode: 'open', slotAssignment: 'manual' });
        this.slot = document.createElement('slot');
        this.shadowRoot.appendChild(this.slot);

        this.historyMode.addEventListener('changeState', this);
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
     * @type {ShadowRoot}
     */
    shadowRoot;

    /**
     * @type {HTMLSlotElement}
     */
    slot;

    /**
     * 
     * @param {Event} event 
     */
    handleEvent(event) {
        switch (event.type) {
            case 'changeState':
                const children = /** @type {HTMLElement[]}*/(Array.from(this.element.children));
                const matches = children.filter((element) => {
                    if (!element.dataset.route) return false;
                    const pattern = new URLPattern({ pathname: element.dataset.route });
                    return pattern.test(new URL(this.current, window.location.href));
                });
                if (!matches.length) {
                    this.slot.assign(...Array.from(this.element.children)
                        .filter(element => element.dataset.defaultRoute));
                } else {
                    this.slot.assign(...matches);
                }
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

    /**
     * @abstract
     * @returns {string}
     */
    pop() {}
    /**
     * @abstract
     * @param {string} state
     */
    push(state) {}
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

    /**
     * @override
     * @returns {string}
     */
    pop() {
        return current
    }


    push(state) {
        this.current = state;
    }
}

class DataRouterElement extends HTMLElement {
    static observedAttributes = ['route']
    connectedCallback() {
        if (!this.router) {
            let mode;
            switch (this.getAttribute('mode')) {
                default:
                    mode = new DataRouterMemoryHistory();
                    break;
            }
            this.router = new DataRouter(this, mode);
        }
        this.attributeChangedCallback('route');
    }

    attributeChangedCallback(name) {
        switch (name) {
            case 'route':
                this.router?.current = this.getAttribute('route');
                break;
        }
    }
}

customElements.define('data-router', DataRouterElement)

export { DataRouter }

