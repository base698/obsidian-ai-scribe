import {
    App, Editor, MarkdownView,
    Plugin, PluginManifest,
    PluginSettingTab, Setting, Notice
} from 'obsidian';


import TranscribeAction from 'transcribe-action';
import LLMActionModal from 'llm-action-modal';
import { Updater, ProgressStatusBar } from 'progress-status-bar';

import ProcessManager from 'process-manager';
import { LLMProvider, LocalWhisperProvider, OllamaLLMProvider, OpenAILLMProvider, TranscriptionProvider } from 'ai-client';
import { getHistory, HistoryModal } from 'history';
import { getFilename } from 'file-util';

interface ScribePluginSettings {
    host: string;
    ai: 'Local AI' | 'openai';
    openaiKey: string;
}

const DEFAULT_SETTINGS: ScribePluginSettings = {
    host: 'http://127.0.0.1:5522',
    ai: 'Local AI',
    openaiKey: ''
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
        const pluginDir = `${vaultPath}/.obsidian/plugins/${this.manifest.id}`;
        const runPath = `${pluginDir}/run_server.sh`;

        this.processManager = new ProcessManager(this.app.vault.adapter);
        await this.processManager.start(runPath);


        let statusBarItemEl = this.addStatusBarItem();
        const llmUpdater: Updater = new ProgressStatusBar(statusBarItemEl, 'Asking AI');
        const transUpdater: Updater = new ProgressStatusBar(statusBarItemEl, 'Transcribing');


        let getProviders = (): [TranscriptionProvider, LLMProvider] => {
            let transProvider: TranscriptionProvider = new LocalWhisperProvider(this.settings.host);
            let llmProvider: LLMProvider = new OllamaLLMProvider(this.settings.host);

            if (this.settings.ai == 'openai') {
                const openai: OpenAILLMProvider = new OpenAILLMProvider(this.settings.openaiKey);
                llmProvider = openai;
                transProvider = openai;
            }
            return [transProvider, llmProvider];
        };

        this.registerInterval(window.setInterval(async () => {
            try {
                const ok = await llmProvider.health();
                if (ok) {
                    statusBarItemEl.setText('🟢');
                    return;
                }
            } catch (e) {
                statusBarItemEl.setText('⛔ AI Server is not Running')
            }
        }, 10 * 1000));


        const doHistory = () => new HistoryModal(this.app, getHistory()).open();

        const icon = this.addRibbonIcon('bot', 'Prompt Selection', async (evt: MouseEvent) => {
            const [transProvider, llmProvider] = getProviders();
            const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;

            let llmAction: LLMActionModal;
            let transcribeAction: TranscribeAction;

            if (editor) {
                const selectedText = editor.getSelection();

                console.log(selectedText);
                if (selectedText.trim() == '') {
                    return new Notice('No selection found.  Highlight to use as prompt.');
                } else if (getFilename(selectedText) === '') {
                    llmAction = LLMActionModal.init(this, llmProvider, llmUpdater, doHistory);

                } else {
                    transcribeAction = new TranscribeAction(transProvider, transUpdater, doHistory);
                    await transcribeAction.doRequest(selectedText);
                }
            }

        });

        icon.addClass('my-plugin-ribbon-class');

        this.addCommand({
            id: 'stop-server',
            name: 'Stop Python Server',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.processManager.stop();
            }
        });

        this.addCommand({
            id: 'start-server',
            name: 'Start Python Server',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.processManager.start(runPath);
            }
        });


        // This adds a complex command that can check whether the current state of the app allows execution of the command
        this.addCommand({
            id: 'open-history',
            name: 'Open history',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                let history = getHistory();
                new HistoryModal(this.app, history).open();
            }
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new ScribeSettingTab(this.app, this));

    }

    async onunload() {
        await this.processManager.stop();
    }

    async onclose() {
        console.log('closing!');
        await this.processManager.stop();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class ScribeSettingTab extends PluginSettingTab {
    plugin: ScribePlugin;

    constructor(app: App, plugin: ScribePlugin) {
        super(app, plugin);
        this.plugin = plugin;
        
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        // Setting for choosing between two options using radio buttons
        new Setting(containerEl)
            .setName('Choose AI Server')
            .addDropdown(dd =>
                dd.addOption('openai', 'Open AI')
                    .addOption('Local AI', 'Local AI')
                    .setValue(this.plugin.settings.ai)
                    .onChange(async (value: string) => {
                        this.plugin.settings.ai = (value == 'openai') ? 'openai' : 'Local AI';
                        await this.plugin.saveSettings();
                        this.display(); // Re-render the settings tab
                    })
            );

        // Conditionally add the text field based on the selected radio option
        if (this.plugin.settings.ai === 'openai') {
            new Setting(containerEl)
                .setName("openAIKey")
                .addText(text => {
                    text.setPlaceholder('sk-....')
                        .setValue(this.plugin.settings.openaiKey)
                        .onChange(async (value) => {
                            this.plugin.settings.openaiKey = value;
                            await this.plugin.saveSettings();
                        })
                });

        } else {
            new Setting(containerEl)
                .setName('host')
                .setDesc('Server and port for Whisper and LLM, http://127.0.0.1:5522')
                .addText(text => text
                    .setPlaceholder('http://127.0.0.1:1234')
                    .setValue(this.plugin.settings.host)
                    .onChange(async (value) => {
                        this.plugin.settings.host = value;
                        await this.plugin.saveSettings();
                    }))
        }
    }
}