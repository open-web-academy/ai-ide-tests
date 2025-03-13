from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)

@app.route('/run-model', methods=['POST'])
def run_model():
    try:
        script_path = os.path.join('src', 'lib', 'kickstart_tensorflow.py')
        result = subprocess.run(['python3', script_path], 
                              capture_output=True, 
                              text=True)
        return jsonify({
            'stdout': result.stdout,
            'stderr': result.stderr,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

if __name__ == '__main__':
    app.run(port=5000)