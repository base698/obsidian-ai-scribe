import {  MarkdownView, 
	 Modal, Notice, Plugin, App, Setting
} from 'obsidian';

import { llmWithPrompt, getModels, health } from 'ai-client';

import { Updater } from 'progress-status-bar';


export default class LLMActionModal extends Modal {
    plugin: Plugin;
	updater: Updater;
    
	constructor(plugin: Plugin, host: string, updater: Updater) {
		super(plugin.app);
		this.updater = updater;
        this.plugin = plugin;

		health().then(()=> {
		   updater.display('');
		});
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

				this.updater.start();

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

				this.updater.stop();
            }
    }

    public static init(plugin: Plugin, host:string, updater: Updater) {
		const modal = new LLMActionModal(plugin,host,updater);
		const minutesIcon = plugin.addRibbonIcon('bot', 'Prompt Selection', async (evt: MouseEvent) => {
			modal.open();
		});
		minutesIcon.addClass('my-plugin-ribbon-class');

    }
}
