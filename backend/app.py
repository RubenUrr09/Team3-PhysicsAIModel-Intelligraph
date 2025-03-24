from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add proper logging for easier debugging
import logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"status": "API is running"})

@app.route('/predict', methods=['POST'])
def predict():
    app.logger.info("Received request to /predict endpoint")

    if not request.json:
        app.logger.error("No JSON data received")
        return jsonify({"error": "No data provided"}), 400

    data = request.json
    question = data.get("question", "")
    app.logger.info(f"Received question: {question}")

    try:
        from phys_ai_model import get_answer

        # Prepare response message
        log_output = []
        # Get AI-generated answer
        answer = get_answer(question)
        log_output.append(f"\nAI Model Answer: {answer}")

        # Join logs into a string and return them in JSON response
        response_text = "\n".join(log_output)

        app.logger.info(f"Response: {response_text}")
        return jsonify({"answer": response_text})

    except ImportError as e:
        app.logger.error(f"ImportError: {e}")
        return jsonify({"error": f"Module import error: {e}"}), 500
    except Exception as e:
        app.logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.logger.info(f"Starting Flask server. Current directory: {os.getcwd()}")
    app.logger.info(f"Python path: {sys.path}")
    app.run(debug=True, host="0.0.0.0", port=5000)