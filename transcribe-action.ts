import {
	MarkdownView,
	Notice, Plugin, TFile
} from 'obsidian';
import { Updater } from 'progress-status-bar';
import { TranscriptionProvider } from 'ai-client';

function getFileName(selection: string): string {
	const match = /!?\[\[(.*?\.webm)\]\]/.exec(selection);
	if (match) {
		return match[1];
	}
	return '';
}

function findTFile(files: TFile[], filename: string): TFile {
	let file: TFile | undefined = files.find((file: TFile) => {
		return file.path.includes(filename);
	});

	if (file == undefined) {
		throw `TFile ${filename} Not Found`;
	}

	return file;

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

		const ribbonIconEl = plugin.addRibbonIcon('activity', 'Transcribe Selection', async (evt: MouseEvent) => {
			const editor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			if (editor) {
				const selectedText = editor.getSelection();
				const filename: string = getFileName(selectedText);

				if (!filename) {
					return new Notice('No recording found in selection.', 3000);
				}

				const file = findTFile(plugin.app.vault.getFiles(), filename);
				file.vault = plugin.app.vault;

				// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
				updater.start();

				try {
					let output = await action.provider.transcribeFile(file);
					updater.stop();
					navigator.clipboard.writeText(output);
					new Notice("Copied: " + output.slice(0, 200) + "...", 5000);
					console.log(output)

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
