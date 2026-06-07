from flask import Flask, request, jsonify
import pickle

app = Flask(__name__)

# Load model
model = pickle.load(open("model.pkl", "rb"))
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    resume = data.get("resume", "")
    job = data.get("job", "")

    text = resume + " " + job
    vec = vectorizer.transform([text])

    score = model.predict(vec)[0]

    return jsonify({
        "match_score": round(float(score) * 100, 2)
    })

if __name__ == "__main__":
    app.run(port=5001)