#!/bin/bash

set -e

PATH=$PATH:/opt/homebrew/bin/:/usr/bin

script_dir=$(dirname "$0")

if [ ! -e "${script_dir}/plugin_env" ]; then
   /usr/bin/python3 -m venv ${script_dir}/plugin_env
fi

source ${script_dir}/plugin_env/bin/activate  

python -m pip install --upgrade pip > /tmp/ai-scribe.log 2>&1

pip install -r ${script_dir}/requirements.txt > /tmp/ai-scribe.log 2>&1

python ${script_dir}/server.py --server > /tmp/ai-scribe.log 2>&1 &

pid=$!
echo $! 
echo $! > ${script_dir}/server.py.pid
