#!/bin/bash

set -e


if [ ! -e "plugin_env" ]; then 
   /usr/bin/python3 -m venv plugin_env
fi

source plugin_env/bin/activate
python -m pip install --upgrade pip

pip install -r requirements.txt

python server.py --server

