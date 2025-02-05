from flask import Flask, request, jsonify
from dotenv import load_dotenv
import time
from flask_cors import CORS
from openai import OpenAI
import os
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

MODEL = "gpt-4o"

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_location",
            "description": "Browse hotels and landmarks of a location for travel plan recommendations",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "Location to search for, in the format of 'Paris, Ile-de-France, France'",
                    }
                },
                "required": ["location"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    }
]

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)


@app.route("/")
def home():
    return "Server is running"


@app.route("/search_location", methods=["POST", "OPTIONS"])
def search_location():
    if request.method == "OPTIONS":
        return jsonify({"status": "OK"}), 200

    data = request.get_json(force=True)
    print("/search_location Incoming data", data)
    location = data.get("location")

    if not location:
        return jsonify({"error": "Location is required"}), 400

    print("Call SerpAPI to search the location", location)
    #####
    # We can call a third-party API here to search for hotels and landmarks of a location
    # For now, we just return a dummy response
    # return jsonify(
    #     {
    #         "hotels": [
    #             {
    #                 "name": "Hotel A",
    #                 "address": "123 Main St, Paris, Ile-de-France, France",
    #                 "price": 100,
    #                 "rating": 4.5,
    #             },
    #             {
    #                 "name": "Hotel B",
    #                 "address": "456 Elm St, Paris, Ile-de-France, France",
    #                 "price": 150,
    #                 "rating": 4.0,
    #             },
    #         ],
    #         "landmarks": [
    #             {
    #                 "name": "Eiffel Tower",
    #                 "address": "Champ de Mars, 5 Avenue Anatole, Paris, Ile-de-France, France",
    #                 "rating": 4.9,
    #             },
    #             {
    #                 "name": "Louvre Museum",
    #                 "address": "Rue de Rivoli, Paris, Ile-de-France, France",
    #                 "rating": 4.8,
    #             },
    #         ],
    #     }
    # )


@app.route("/get_response", methods=["POST"])
def get_response():
    data = request.get_json()
    # {'messages': [{'role': 'system', 'content': '\nYou are a helpful travel assistant.\n'}, {'role': 'user', 'content': 'test'}, {'role': 'user', 'content': 'test'}]}

    messages = data["messages"]
    print("Incoming messages", messages)

    chat_completion = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        tools=tools,
    )
    print("Chat completion", chat_completion)
    response_message = chat_completion.choices[0].message
    print("Response message", response_message)
    # message can contain the following that we need to use
    ## content: str
    ## role: str ("user" or "assistant" or "system")
    ## tool_calls: array
    ###  - id: str
    ###  - type: str ("function")
    ###  - function: object
    ####   - name: str
    ####   - arguments: str (json string)
    ## audio: object or null
    # We send back the response message to the frontend and let it handle tool calls (call another backend API route, or call a third-party API)

    return jsonify(response_message.model_dump())


if __name__ == "__main__":
    # Debug mode should be set to False in production
    app.run(debug=True, port=8000)
