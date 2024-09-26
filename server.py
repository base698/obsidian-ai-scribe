"""
Server Shim for Whisper and Ollama Interactions

This Python script serves as a shim between obsidian-transcript-plugin and the Whisper and Ollama APIs. It makes 
requests to these services on behalf of your plugin, allowing you to interact with users in a more 
seamless way.

Author: Justin Thomas
"""
from flask import Flask, request, jsonify
import whisper
import argparse
import requests
from flask_cors import CORS
import threading

# Create a lock object
lock = threading.Lock()


def transcribe(filepath, model="medium"):
    """
    Transcribes an audio file using Whisper.

    Args:
        filepath (str): Path to the audio file to be transcribed.
        model (str, optional): Model used for transcription. Can be one of "tiny", "small", "medium", 
or "large". Defaults to "medium".

    Returns:
        str: The transcribed text as a string.

    Raises:
        Exception: If an error occurs during transcription.
    """
    if lock.locked():
        return None
    lock.acquire()
    model = whisper.load_model("medium")
    try:
        result = model.transcribe(filepath)
        lock.release()
        return result['text']
    except Exception as e:
        lock.release()
        raise e

# Ollama local API endpoint
def ollama_health():
    url = "http://localhost:11434"
    response = requests.get(url)
    return 'Ollama' in response.text 

def ollama_request(prompt, model="llama3"):
    if lock.locked():
        return None
    lock.acquire()

    url = "http://localhost:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    # Make the POST request
    response = requests.post(url, json=payload)
    lock.release()

    # Check if the request was successful
    if response.status_code == 200:
        # Parse the JSON response
        result = response.json()
        # Extract the generated response
        generated_text = result['response']
        print("Generated response:", generated_text)
        return generated_text

    else:
        error_message = f"Error: {response.status_code} - {response.text}"
        raise requests.HTTPError(error_message)

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": ["app://obsidian.md"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})


@app.route('/health', methods=['GET'])
def health_check():
    try:
       if ollama_health():
         return "Ok", 200
    except Exception as e:
        print(e)
    return "Ollama not running", 502
    

@app.route('/v1/transcribe', methods=['POST'])
def transcribe_endpoint():
    # Extract filename from the request body
    data = request.json
    filename = data.get('filename')
    model = data.get('model')

    print(f'filename is {filename}')
    if model != "medium" or model != "small":
        print(f'Model unknown. Setting model({model}) to small')
        model = "small"
    
    if not filename:
        return jsonify({"error": "Filename is required"}), 400
    
    transcription_result = transcribe(filename)
    if transcription_result == None:
        return jsonify({"error": "Only one request allowed at a time."}), 429
    
    return jsonify({"text": transcription_result}), 200

@app.route('/v1/ollama/tags', methods=['GET'])
def get_models():
    url = "http://localhost:11434/api/tags"
    response = requests.get(url)
    return response.text, 200

 
@app.route('/v1/ollama/<model>', methods=['POST'])
def run_model(model):
    # Extract prompt from the request body
    data = request.json
    prompt = data.get('prompt')
    
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400
    
    model_output = ollama_request(prompt,model)

    if model_output == None:
        return jsonify({"error": "Only one request allowed at a time."}), 429
    
    return jsonify({"text": model_output}), 200

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcription script with optional server mode")
    parser.add_argument("--server", action="store_true", help="Run as a Flask server")
    parser.add_argument("input", nargs="?", default="", help="Input text to transcribe")
    args = parser.parse_args()

    if args.server:
        print("Running in server mode...")
        app.run(debug=True,port=5522)
    else:
        print("Running transcription directly...")
        result = transcribe(args.input)
        print(result)
