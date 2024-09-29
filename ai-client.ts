import { TFile } from "obsidian";


export interface LLMProvider {
  getModels(): Promise<string[]>;
  getResponse(prompt: string, model: string): Promise<string>;
  health(): Promise<boolean>;
}

export class OpenAILLMProvider implements LLMProvider, TranscriptionProvider {
  key: string;
  constructor(key: string) {
    this.key = key;
  }

  model() {
    return 'whisper-1';
  }

  async transcribeFile(file: TFile): Promise<string> {

    const apiUrl = 'https://api.openai.com/v1/audio/transcriptions';

    const formData = new FormData();
    // Read the file as an ArrayBuffer
    const fileBuffer = await file.vault.adapter.readBinary(file.path);

    // Create a Blob from the ArrayBuffer
    const blob = new Blob([fileBuffer]);//, { type: 'audio/mpeg' });

    // Create FormData and append the file
    formData.append('file', blob, file.path);
    formData.append('model', 'whisper-1');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.key}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.text;

  }

  // TODO: consider using this in getModels
  async health() {
    const apiUrl = 'https://api.openai.com/v1/models';

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.key}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) != null;

  }

  async getModels(): Promise<string[]> {
    return ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4o-mini', 'o1-preview']
  }

  async getResponse(prompt: string, model = "gpt-4") {
    const url = 'https://api.openai.com/v1/chat/completions';
    const requestBody = {
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.key}`
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()
    return data.choices[0].message.content;

  }


}

export class OllamaLLMProvider implements LLMProvider {
  host: string;

  constructor(host = 'http://127.0.0.1:5522') {
    this.host = host;
  }

  async health() {
    const response = await fetch(`${this.host}/health`)
    return response.ok;
  }

  async getModels(): Promise<string[]> {

    const url = `${this.host}/v1/ollama/tags`;

    // Request options
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const response = await fetch(url, options);
    const data = await response.json();

    return data.models.map((item: any) => item.model);
  }

  async getResponse(prompt: string, model = "llama3.1") {
    // API endpoint URL
    const url = `${this.host}/v1/ollama/${model}`;

    // Request body
    const body = JSON.stringify({ prompt: prompt });

    // Request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    };

    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      return data;
    }

    return data['text'];

  }

}


export interface TranscriptionProvider {
  model():string;
  transcribeFile(file: TFile): Promise<string>;
}

export class LocalWhisperProvider implements TranscriptionProvider {
  host: string;
  constructor(host = 'http://127.0.0.1:5522') {
    this.host = host;
  }

  model(): string {
    return 'whisper-small'
  }

  async transcribeFile(file: TFile): Promise<string> {
    // API endpoint URL
    const url = `${this.host}/v1/transcribe`;

    const filename = file.vault.adapter.getFullPath(file.path);

    // Request body
    const body = JSON.stringify({ filename: filename });

    // Request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    };

    // Make the fetch request
    const response = await fetch(url, options);
    const data = await response.json()

    if (!response.ok) {
      return data;
    }

    return data['text'];

  }
}

