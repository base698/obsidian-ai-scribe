import {
    App, 
    Modal, 
    Notice
} from 'obsidian';


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

export class HistoryModal extends Modal {
    history: IHistory;
    constructor(app: App, history: IHistory) {
        super(app);
        this.history = history;
    }

    async onOpen() {
        const { contentEl } = this;
        let requests = await this.history.get();
        requests.sort((a,b) => b._start - a._start);
        if(requests.length > 10) {
            requests = requests.slice(0,10);
        }

        // Create table
        const table = contentEl.createEl('table');
        const headerRow = table.createEl('tr');
        headerRow.createEl('th', { text: 'Date' });
        headerRow.createEl('th', { text: 'Prompt' });
        headerRow.createEl('th', { text: 'Response' });
        headerRow.createEl('th', { text: '' });

        requests.forEach((data:IHistoryLog) => {
        // Add data to table
        const dataRow = table.createEl('tr');
        dataRow.createEl('td', { text: `${new Date(data._start).toString().slice(0,24)}` });
        dataRow.createEl('td', { text: data._prompt.slice(0,100) });
        dataRow.createEl('td', { text: data._response.slice(0,100) });

        // Create copy button
        const copyButton = dataRow.createEl('td').createEl('button', { text: 'Copy' });
        copyButton.addEventListener('click', () => this.copyToClipboard(data));

        });
    }

    copyToClipboard(data: IHistoryLog) {
        const textToCopy = `${data._response}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
        }, (err) => {
            new Notice('Failed to copy to clipboard');
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}