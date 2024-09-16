import {  MarkdownView, 
	 Modal, Notice, Plugin, App, Setting
} from 'obsidian';

import { llmWithPrompt, getModels, health } from 'ai-client';

import ProgressStatusBar from 'progress-status-bar';

export default class LLMActionModal extends Modal {
    statusBarItemEl: HTMLElement
    plugin: Plugin;
    
	constructor(plugin: Plugin, host: string) {
		super(plugin.app);
        this.statusBarItemEl = plugin.addStatusBarItem();
        this.plugin = plugin;
        
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	async onOpen() {

		const {contentEl} = this;

        contentEl.createEl('h2', {text: "Select a Model"});
        const models = await getModels();
        models.forEach((model: string) => {
            new Setting(contentEl).setName(model).addButton(button => {
                button.setButtonText('Select').onClick(async ()=>{
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

				const isOk = await health();
				if(!isOk) {
					return new Notice("Please start Ollama", 3000);
				}

				const updater = new ProgressStatusBar(this.statusBarItemEl, 'Asking AI');
				updater.start();

				try {
				   let output = await llmWithPrompt(selectedText,model,this.host)
					if(output.error) {
						return new Notice(output.error, 3000);
					}
					navigator.clipboard.writeText(output);
					new Notice("Copied: "+output.slice(0,200)+"...",5000);
					console.log(output)

				} catch(e) {
					new Notice(e);
				}

				updater.stop();
            }
    }

    public static init(plugin: Plugin, host:string) {
		const minutesIcon = plugin.addRibbonIcon('bot', 'Prompt Selection', async (evt: MouseEvent) => {
			new LLMActionModal(plugin,host).open();
		});
		minutesIcon.addClass('my-plugin-ribbon-class');

    }
}
