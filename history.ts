import {
    App,
    Modal,
    Notice,
    DataAdapter
} from 'obsidian';


export interface IHistory {
    save(hl: HistoryLog): void;
    get(): Promise<IHistoryLog[]>;
    build(): HistoryLog;
}

let appHistory: IHistory;
export function getHistory(adapter: DataAdapter): IHistory {
    if (!appHistory) {
        appHistory = new JSONFileHistory(adapter);
    }

    return appHistory;
}

export class JSONFileHistory implements IHistory {
    private _filename: string;
    private adapter: DataAdapter;

    constructor(adapter:DataAdapter,filename = 'ai-script.json') {
        this._filename = filename;
        this.adapter = adapter;
    }

    save(hl: HistoryLog) {
        const line = hl.toString();

        this.adapter.append(this._filename, line + '\n');
    }

    async get(): Promise<IHistoryLog[]> {
        const data = await this.adapter.read(this._filename);
        const lines = data.split('\n');
        return lines.filter((item: string) => item.trim()).map((line: string) => {
            const log: IHistoryLog = JSON.parse(line);
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

    model(m: string): HistoryLog {
        this._model = m;
        return this;
    }

    response(r: string): HistoryLog {
        this._response = r;
        return this;
    }

    prompt(p: string): HistoryLog {
        this._prompt = p;
        return this;
    }

    json(): IHistoryLog {
        return this;
    }

    toString(): string {
        return JSON.stringify(this.json());
    }

}

function timeAgo(date:Date) {
    const now:Date = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);  // Difference in seconds

    let interval = Math.floor(seconds / 31536000);  // Seconds in a year
    if (interval >= 1) {
        return interval === 1 ? "1 year ago" : `${interval} years ago`;
    }

    interval = Math.floor(seconds / 2592000);  // Seconds in a month
    if (interval >= 1) {
        return interval === 1 ? "1 month ago" : `${interval} months ago`;
    }

    interval = Math.floor(seconds / 86400);  // Seconds in a day
    if (interval >= 1) {
        return interval === 1 ? "1 day ago" : `${interval} days ago`;
    }

    interval = Math.floor(seconds / 3600);  // Seconds in an hour
    if (interval >= 1) {
        return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
    }

    interval = Math.floor(seconds / 60);  // Seconds in a minute
    if (interval >= 1) {
        return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
    }

    return "just now";
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
        requests.sort((a, b) => b._start - a._start);
        if (requests.length > 10) {
            requests = requests.slice(0, 10);
        }

        contentEl.className = 'scribe-history';
        // Create table
        const table = contentEl.createEl('table');
        const headerRow = table.createEl('tr');
        headerRow.createEl('th', { text: '' });
        headerRow.createEl('th', { text: 'Date' });
        headerRow.createEl('th', { text: 'Model' });
        headerRow.createEl('th', { text: 'Prompt' });
        headerRow.createEl('th', { text: 'Response' });

        requests.forEach((data: IHistoryLog) => {
            // Add data to table
            const dataRow = table.createEl('tr');
            // Create copy button
            const copyButton = dataRow.createEl('td').createEl('button', { text: 'Copy' });
            copyButton.className = 'copy-button';
            copyButton.addEventListener('click', () => this.copyToClipboard(data));
            dataRow.createEl('td', { text: `${timeAgo(new Date(data._start))}` });
            dataRow.createEl('td', { text: data._model });
            dataRow.createEl('td', { text: data._prompt });
            dataRow.createEl('td', { text: data._response });


        });
    }

    copyToClipboard(data: IHistoryLog) {
        const textToCopy = `${data._response}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            this.close();
        }, (err) => {
            new Notice('Failed to copy to clipboard');
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}