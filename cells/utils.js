
export function random(from, to) {
    if(to === undefined){
        to = from
        from = 0
    }
    return Math.floor(Math.random() * (to - from) + from)
}
