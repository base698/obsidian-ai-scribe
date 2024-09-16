interface HistoryLog {
    action: string,
    data: string,
    created: Date
}

interface History {
    save(action: string, data: string): boolean
    get(): HistoryLog[]
}