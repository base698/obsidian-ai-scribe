import {
	MarkdownView,
	Notice, Plugin, TFile
} from 'obsidian';
import { Updater } from 'progress-status-bar';
import { TranscriptionProvider } from 'ai-client';
import { JSONFileHistory } from 'history';

function getFileName(selection: string): string {
	const match = /!?\[\[(.*?\.webm)\]\]/.exec(selection);
	if (match) {
		return match[1];
	}
	return '';
}

export default class TranscribeAction {
	statusBarItemEl: HTMLElement
	plugin: Plugin;
	updater: Updater;
	provider: TranscriptionProvider;

	constructor(plugin: Plugin, provider: TranscriptionProvider, updater: Updater) {
		this.plugin = plugin;
		this.updater = updater;
		this.provider = provider;

	}

	setProvider(provider: TranscriptionProvider) {
		this.provider = provider;
	}

	static init(plugin: Plugin, tsProvider: TranscriptionProvider, updater: Updater): TranscribeAction {
		// This creates an icon in the left ribbon.
		const action = new TranscribeAction(plugin, tsProvider, updater);
		const history = new JSONFileHistory();

		const ribbonIconEl = plugin.addRibbonIcon('activity', 'Transcribe Selection', async (evt: MouseEvent) => {
			const editor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			if (editor) {
				const selectedText = editor.getSelection();
				const filename: string = getFileName(selectedText);

				if (!filename) {
					return new Notice('No recording found in selection.', 3000);
				}

				const file: TFile | null = plugin.app.vault.getFileByPath(filename)
				if (!file) {
					return new Notice(`Selection ${selectedText} did not contain file`);
				}

				file.vault = plugin.app.vault;

				// This adds a status bar item that updates while the request is being made
				updater.start();

				const start = Date.now();

				try {
					let output = await action.provider.transcribeFile(file);

					const end = Date.now();
					const duration = (end - start) / 60;
					const log = history.build()
						.duration(duration)
						.start(start)
						.model(action.provider.model())
						.response(output)
						.prompt(filename)
					history.save(log);


					updater.stop();
					navigator.clipboard.writeText(output);
					new Notice("Copied: " + output.slice(0, 200) + "...", 5000);

				} catch (err) {
					console.log(err);
					new Notice(err);
				}
				updater.stop();

			}
		});

		ribbonIconEl.addClass('my-plugin-ribbon-class');

		return action;
	}
}
