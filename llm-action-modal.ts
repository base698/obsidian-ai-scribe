import {
	MarkdownView,
	Modal, Notice, Plugin, Setting
} from 'obsidian';

import { LLMProvider } from 'ai-client';

import { Updater } from 'progress-status-bar';


export default class LLMActionModal extends Modal {
	plugin: Plugin;
	updater: Updater;
	provider: LLMProvider;

	constructor(plugin: Plugin, host: string, provider: LLMProvider, updater: Updater) {
		super(plugin.app);
		this.updater = updater;
		this.provider = provider;
		this.plugin = plugin;

		provider.health().then(() => {
			updater.display('');
		});
	}

	setProvider(provider: LLMProvider) {
		this.provider = provider;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	async onOpen() {

		const { contentEl } = this;

		contentEl.createEl('h2', { text: "Select a Model" });
		const models = await this.provider.getModels();
		models.forEach((model: string) => {
			new Setting(contentEl).setName(model).addButton(button => {
				button.setButtonText('Select').onClick(async () => {
					console.log(`Selected ${model}`);
					this.close();
					await this.doModelRequest(model);
				})

			});

		});

	}

	async doModelRequest(model: string) {
		const editor = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (editor) {
			const selectedText = editor.getSelection();

			const isOk = await this.provider.health();
			if (!isOk) {
				return new Notice("Please start Ollama", 3000);
			}

			this.updater.start();

			try {
				let output = await this.provider.getResponse(selectedText, model);
				navigator.clipboard.writeText(output);
				new Notice("Copied: " + output.slice(0, 200) + "...", 5000);
				console.log(output)

			} catch (e) {
				new Notice(e);
			}

			this.updater.stop();
		}
	}

	public static init(plugin: Plugin, host: string, provider: LLMProvider, updater: Updater): LLMActionModal {
		const modal = new LLMActionModal(plugin, host, provider, updater);
		const minutesIcon = plugin.addRibbonIcon('bot', 'Prompt Selection', async (evt: MouseEvent) => {
			modal.open();
		});
		minutesIcon.addClass('my-plugin-ribbon-class');
		return modal;

	}
}
