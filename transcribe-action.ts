import {
	Notice, Plugin, TFile
} from 'obsidian';
import { Updater } from 'progress-status-bar';
import { TranscriptionProvider } from 'ai-client';
import { IHistory } from 'history';


export default class TranscribeAction {
	statusBarItemEl: HTMLElement
	plugin: Plugin;
	updater: Updater;
	provider: TranscriptionProvider;
	history: IHistory;
	notify: ()=>void;

	constructor(provider: TranscriptionProvider, updater: Updater, history:IHistory, notify: ()=>void) {
		this.updater = updater;
		this.provider = provider;
		this.notify = notify;
		this.history = history;

	}

	setProvider(provider: TranscriptionProvider) {
		this.provider = provider;
	}

	async doRequest(file: TFile) {

		// This adds a status bar item that updates while the request is being made
		this.updater.start();

		const start = Date.now();

		try {
			const output = await this.provider.transcribeFile(file);

			const end = Date.now();
			const duration = (end - start) / 1000 / 60;
			const log = this.history.build()
				.duration(duration)
				.start(start)
				.model(this.provider.model())
				.response(output)
				.prompt(file.path)
			this.history.save(log);

			this.updater.stop();
			this.notify();

		} catch (err) {
			console.log(err);
			new Notice(err);
		}
		this.updater.stop();

	}

}
