import {  MarkdownView, 
	 Notice, Plugin, TFile
} from 'obsidian';
import {Updater, ProgressStatusBar} from 'progress-status-bar';
import { transcribeFile } from 'ai-client';

function getFileName(selection: string): string {
	const match = /!?\[\[(.*?\.webm)\]\]/.exec(selection);
	if(match) {
		return match[1];
	}
	return '';
}

function getFullPathFromFile(files: TFile[], filename: string): string {
	let file: TFile | undefined = files.find((file: TFile) => {
        return file.path.includes(filename);
	});
	return this.app.vault.adapter.getFullPath(file?.path);
}

export default class TranscribeAction {
    statusBarItemEl: HTMLElement
    plugin: Plugin;
	updater: Updater;
    
	constructor(plugin: Plugin, host: string, updater:Updater) {
        this.plugin = plugin;
		this.updater = updater;
        
	}

    static init(plugin: Plugin, host:string, updater:Updater) {
		// This creates an icon in the left ribbon.
		const ribbonIconEl = plugin.addRibbonIcon('activity', 'Transcribe Selection', async (evt: MouseEvent) => {
		    const editor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
            if (editor) {
			    const selectedText = editor.getSelection();
				const filename: string = getFileName(selectedText);

				if(!filename) {
					return new Notice('No recording found in selection.',3000);
				}

				let fullPath = getFullPathFromFile(plugin.app.vault.getFiles(),filename);

		        // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
				updater.start();

				try {
					let output = await transcribeFile(fullPath, host);
					updater.stop();
					if(output.error) {
						console.log(output.error);
						return new Notice(output.error, 6000);
					}
					navigator.clipboard.writeText(output);
					new Notice("Copied: "+output.slice(0,200)+"...",5000);
					console.log(output)

				} catch(err) {
					console.log(err);
					new Notice(err);
				}
				updater.stop();
				
            }
		});

		ribbonIconEl.addClass('my-plugin-ribbon-class');

    }
}
