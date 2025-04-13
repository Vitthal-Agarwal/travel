from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for all domains

# GET Endpoint: Returns a welcome message.
@app.route('/api/welcome', methods=['GET'])
def welcome():
    return jsonify({"message": "Welcome to the Flask API endpoint!"}), 200

# POST Endpoint: Accepts JSON data and echoes it back in the response.
@app.route('/api/data', methods=['POST'])
def data_endpoint():
    # Check if the request content type is JSON
    if not request.is_json:
        return jsonify({"error": "Request must be in JSON format"}), 400

    # Retrieve the JSON data sent in the request
    data = request.get_json()

    # Process the data here if necessary.
    response = {
        "status": "success",
        "received": data
    }
    return jsonify(response), 200

if __name__ == '__main__':
    # Run the Flask app in debug mode on port 5000.
    app.run(debug=True, host='0.0.0.0', port=5000)
