export async function health(host:string='http://127.0.0.1:5522') {
	const response = await fetch(`${host}/health`)
	return response.ok;
}

export async function getModels(): Promise<string[]> {

	return ["llama3.1", "llava"];
}

export async function llmWithPrompt(prompt:string, model:string, host:string='http://127.0.0.1:5522') {
	// API endpoint URL
	const url = `${host}/v1/${model}/run`;
  
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
	if(!response.ok) {
		return data;
	}

	return data['text'];
	  
}

export async function transcribeFile(filename:string, host:string='http://127.0.0.1:5522') {
	// API endpoint URL
	const url = `${host}/v1/transcribe`;
  
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

	if(!response.ok) {
		return data;
	}

	return data['text'];
}