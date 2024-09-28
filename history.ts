
export interface IHistory {
    save(hl: HistoryLog): void;
    get(): Promise<IHistoryLog[]>;
    build(): HistoryLog;
}

let appHistory: IHistory;
export function getHistory(): IHistory {
    if(!appHistory) {
        appHistory = new JSONFileHistory();
    }

    return appHistory;
}

export class JSONFileHistory implements IHistory {
    private _filename: string;

    constructor(filename:string='ai-script.json') {
        this._filename = filename;
    }

    save(hl: HistoryLog) {
        const line = hl.toString();

        window.app.vault.adapter.append(this._filename,line+'\n');
    }

    async get():Promise<IHistoryLog[]> {
        const data = await window.app.vault.adapter.read(this._filename);
        const lines = data.split('\n');
        return lines.filter((item:string)=>item.trim()).map((line:string) => {
            const log:IHistoryLog = JSON.parse(line);
            return log;
        })
    }

    build() {
        return new HistoryLog();
    }
}

export interface IHistoryLog {
    _duration: number;
    _start: number;
    _model: string;
    _response: string;
    _prompt: string;
}

class HistoryLog implements IHistoryLog {
    _duration: number;
    _start: number;
    _model: string;
    _response: string;
    _prompt: string;

    start(start: number): HistoryLog {
        this._start = start;
        return this;
    }

    duration(duration: number): HistoryLog {
        this._duration = duration;
        return this;
    }

    model(m:string): HistoryLog {
        this._model = m;
        return this;
    }

    response(r:string): HistoryLog {
        this._response = r;
        return this;
    }

    prompt(p:string): HistoryLog {
        this._prompt = p;
        return this;
    }

    json():IHistoryLog {
        return this;
    }

    toString(): string {
        return JSON.stringify(this.json());
    }

}