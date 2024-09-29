import {
	Notice, Plugin, TFile
} from 'obsidian';
import { Updater } from 'progress-status-bar';
import { TranscriptionProvider } from 'ai-client';
import { getHistory } from 'history';
import { getFilename } from 'file-util';


export default class TranscribeAction {
	statusBarItemEl: HTMLElement
	plugin: Plugin;
	updater: Updater;
	provider: TranscriptionProvider;
	notify: ()=>void;

	constructor(provider: TranscriptionProvider, updater: Updater, notify: ()=>void) {
		this.updater = updater;
		this.provider = provider;
		this.notify = notify;

	}

	setProvider(provider: TranscriptionProvider) {
		this.provider = provider;
	}

	async doRequest(selectedText: string) {
		const history = getHistory();

		const filename: string = getFilename(selectedText);

		if (!filename) {
			return new Notice('No recording found in selection.', 3000);
		}

		const file: TFile | null = window.app.vault.getFileByPath(filename)
		if (!file) {
			return new Notice(`Selection ${selectedText} did not contain file`);
		}

		file.vault = window.app.vault;

		// This adds a status bar item that updates while the request is being made
		this.updater.start();

		const start = Date.now();

		try {
			const output = await this.provider.transcribeFile(file);

			const end = Date.now();
			const duration = (end - start) / 1000 / 60;
			const log = history.build()
				.duration(duration)
				.start(start)
				.model(this.provider.model())
				.response(output)
				.prompt(filename)
			history.save(log);


			this.updater.stop();
			navigator.clipboard.writeText(output);
			new Notice("Copied: " + output.slice(0, 200) + "...", 5000);
			this.notify();

		} catch (err) {
			console.log(err);
			new Notice(err);
		}
		this.updater.stop();

	}

}
