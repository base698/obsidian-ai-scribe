import { App, Editor, MarkdownView, 
     Modal, Plugin, PluginManifest,
     PluginSettingTab, Setting } from 'obsidian';


import TranscribeAction from 'transcribe-action';
import LLMActionModal from 'llm-action-modal';
import {Updater, ProgressStatusBar} from 'progress-status-bar';

import ProcessManager from 'process-manager';

interface ScribePluginSettings {
    host: string;
}

const DEFAULT_SETTINGS: ScribePluginSettings = {
    host: 'http://127.0.0.1:5522'
}


export default class ScribePlugin extends Plugin {
    settings: ScribePluginSettings;
    processManager: ProcessManager;

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
    }

    async onload() {
        await this.loadSettings();

        const vaultPath = this.app.vault.adapter.basePath;
        const pluginDir =  `${vaultPath}/.obsidian/plugins/${this.manifest.id}`;
        const runPath = `${pluginDir}/run_server.sh`;

        const cmd = `${runPath} ${pluginDir}`;

        this.processManager = new ProcessManager();
        //this.processManager.start(cmd);


        let statusBarItemEl = this.addStatusBarItem();

		const transUpdater:Updater = new ProgressStatusBar(statusBarItemEl, 'Transcribing');
		const LLMUpdater:Updater = new ProgressStatusBar(statusBarItemEl, 'Asking AI');
        TranscribeAction.init(this, this.settings.host, transUpdater);
        LLMActionModal.init(this, this.settings.host, LLMUpdater);

        // This adds an editor command that can perform some operation on the current editor instance
        this.addCommand({
            id: 'sample-editor-command',
            name: 'Sample editor command',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                console.log(editor.getSelection());
                editor.replaceSelection('Sample Editor Command');
            }
        });

        // This adds a complex command that can check whether the current state of the app allows execution of the command
        this.addCommand({
            id: 'open-history',
            name: 'Open history',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.
                    if (!checking) {
                        new SampleModal(this.app).open();
                    }

                    // This command will only show up in Command Palette when the check function returns true
                    return true;
                }
            }
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new ScribeSettingTab(this.app, this));

        // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
        // Using this function will automatically remove the event listener when this plugin is disabled.
        this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            console.log('click', evt);
        });

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
    }

    async onunload() {
        await this.processManager.stop();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SampleModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.setText('Woah!');
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

class ScribeSettingTab extends PluginSettingTab {
    plugin: ScribePlugin;

    constructor(app: App, plugin: ScribePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('host')
            .setDesc('Server and port for Whisper and LLM, http://127.0.0.1:5522')
            .addText(text => text
                .setPlaceholder('http://127.0.0.1:1234')
                .setValue(this.plugin.settings.host)
                .onChange(async (value) => {
                    this.plugin.settings.host = value;
                    await this.plugin.saveSettings();
                }));
    }
}