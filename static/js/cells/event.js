

export class EventManager {

    constructor(){

        Object.defineProperties(this, {
            events: {
                writable: true,
                configurable: true,
                enumerable: false,
                value: {}
            },
            subscribers: {
                writable: true,
                configurable: true,
                enumerable: false,
                value: {}
            }
        })
    }

    _validate(event, ctx, method = null){

        if(typeof(event) !== 'string'){
            throw TypeError(`\
EventManager._validate: event name must be a string: "${ event }" \
[${ ctx.constructor.name }]`)
        }

        if(method && typeof(method !== 'string')){
            throw TypeError(`\
EventManager._validate: must given handler's name: "${ method }" \
[${ ctx.constructor.name }]`)
        }

        if(method && !(method in ctx)){
            throw Error(`\
EventManager._validate: the "${ method }" \
is undefined [${ ctx.constructor.name }]`)
        }

        if(method && typeof(ctx[method]) !== 'function'){
            throw TypeError(`\
EventManager._validate: the "${ method }" \
is not a function [${ ctx.constructor.name }]`)
        }

    } 

    on(event, method){
        if(!method){
            throw TypeError(`\
EventManager.on: require to pass event handler: "${ method }" \
[${ this.constructor.name }]`)
        }
        this._validate(event, this, method)

        const events = this.events

        if(!(event in events)){
            events[event] = []
        }

        if(events[event].indexOf(method) < 0){
            events[event].push(method)
        }
        return this
    }

    off(event, method = null){
        this._validate(event, this, method)

        const events = this.events
        
        if(event in events){
            events[event].forEach((m, i, a) => {
                if(!method || m === method){
                    a[i] = null
                }
            })

            events[event] = events[event].filter(e => e !== null)
        }

        return this
    }


    _trigger(event, ...extra){
        const events = this.events,
              subscribers = this.subscribers;

        if(event in events){
            events[event].forEach(m => {
                this._validate(event, this, m)
                this[m](...extra)
            })
        }

        if(event in subscribers){
            subscribers[event].forEach(pair => {
                const [scr, method] = pair
                this._validate(event, scr, method)
                scr[method](this, ...extra)
            })
        }

        return this
    }

    trigger(event, ...extra){
        if(event === 'all'){
            throw Error('EventManager.trigger: the "all" can\'t triggered manualy')
        }

        EventManager.lastEvent = {
            event,
            extra,
            target: this,
        }

        this._trigger(event, ...extra)
        this._trigger('all', ...extra)

        return this
    }

    subscribe(event, subscr, method){
        if(!method){
            throw TypeError(`\
EventManager.subscribe: require to pass event handler: "${ method }" \
[${ this.constructor.name }]`)
        }
        this._validate(event, subscr, method)

        const scrs = this.subscribers

        if(!(event in scrs)){
            scrs[event] = []
        }

        for(let i = 0, len = scrs[event].length; i < len; i++){
            const [iScr, iFn] = scrs[event][i]
            if(iScr === subscr && iFn === method){
                return this
            } 
        }

        scrs[event].push([subscr, method])
        return this
    }

    unsubscribe(event, subscr, method){
        this._validate(event, subscr, method)

        const scrs = this.subscribers
 
        if(event in scrs){
            scrs[event].forEach((pair, i, a) => {
                if(pair[0] === subscr){
                    if(!method || pair[1] === method){
                        pair = null
                        a[i] = null
                    }
                }
            })  // forEach

            scrs[event] = scrs[event].filter(p => p !== null)
        }  // if

        return this
    }

    clear(cat){
        const events = this.events,
              subscribers = this.subscribers

        if(!cat || cat === 'events'){
            for(const event in events){
                this.off(event)
                delete events[event]  
            }
        }
        
        if(!cat || cat === 'subscribers'){
            for(const event in subscribers){
                subscribers[event].forEach((scr, i, a) => {
                    delete scr[0]
                    delete scr[1]
                    a[i] = null
                })  // forEach

                delete subscribers[event]
            }  // for
        }  // if
        
        return this
    }

    listenTo(manager, event, method){
        if(!(manager instanceof EventManager)){
            throw TypeError(`\
EventManager.listenTo: target for listening must be an EventManager instance \
[${ this.constructor.name }]`)
        }

        this._validate(event, this, method)
        manager.subscribe(event, this, method)
    }

    stopListenTo(manager, event, method){
        if(!(manager instanceof EventManager)){
            throw TypeError(`\
EventManager.stopListenTo: target must be an EventManager instance \
[${ this.constructor.name }]`)
        }

        this._validate(event, this, method)
        manager.unsubscribe(event, this, method)
    }
}

EventManager.lastEvent = null
