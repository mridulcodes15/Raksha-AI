import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# -----------------------------
# Load Data (optional)
# -----------------------------
def load_data(path="data/synthetic_calls.json"):
    try:
        with open(path, "r") as f:
            return json.load(f)
    except:
        return []


# -----------------------------
# Feature Extraction
# -----------------------------
def extract_flags(transcript):
    transcript = transcript or ""
    text = transcript.lower()

    return {
        "urgency_flag": any(word in text for word in ["immediately", "urgent", "now"]),
        "isolation_flag": any(
            word in text
            for word in ["do not disconnect", "stay on call", "do not inform"]
        ),
    }


# -----------------------------
# Scam Score
# -----------------------------
def compute_scam_score(call):
    score = 0

    identity = call.get("caller_claimed_identity", "")
    accusation = call.get("accusation_type", "")
    payment = call.get("payment_destination_claim", "")
    duration = call.get("call_duration_sec", 0)

    if identity in ["CBI", "ED", "Mumbai Police", "Customs", "RBI"]:
        score += 0.2

    if accusation in [
        "money_laundering",
        "drug_trafficking",
        "parcel_with_contraband",
        "aadhaar_misuse",
    ]:
        score += 0.2

    if call.get("video_call_flag", False):
        score += 0.15

    if call.get("fake_document_shown", False):
        score += 0.15

    if call.get("isolation_flag", False):
        score += 0.15

    if call.get("urgency_flag", False):
        score += 0.1

    if "escrow" in payment.lower():
        score += 0.05

    if duration > 7200:
        score += 0.1
    elif duration > 1800:
        score += 0.05

    return round(min(score, 1.0), 2)


# -----------------------------
# Existing Analysis Function
# -----------------------------
def analyze_calls():
    data = load_data()
    results = []

    for call in data:
        transcript = call.get("transcript_text", "")
        extracted_flags = extract_flags(transcript)
        call.update(extracted_flags)

        scam_prob = compute_scam_score(call)

        triggers = [k for k, v in call.items() if k.endswith("_flag") and v]

        results.append({
            "call_id": call.get("call_id"),
            "scam_probability": scam_prob,
            "key_triggers": triggers
        })

    return results


# -----------------------------
# API
# -----------------------------
@app.route("/analyze", methods=["POST"])
def analyze():
    call = request.get_json() or {}

    # Print request for debugging
    print("Received JSON:", call)

    # Accept different frontend field names
    transcript = (
        call.get("transcript_text")
        or call.get("transcript")
        or call.get("text")
        or call.get("message")
        or call.get("input")
        or ""
    )

    extracted_flags = extract_flags(transcript)
    call.update(extracted_flags)

    # Default values
    call.setdefault("caller_claimed_identity", "")
    call.setdefault("accusation_type", "")
    call.setdefault("payment_destination_claim", "")
    call.setdefault("video_call_flag", False)
    call.setdefault("fake_document_shown", False)
    call.setdefault("call_duration_sec", 0)

    scam_prob = compute_scam_score(call)

    triggers = [k for k, v in call.items() if k.endswith("_flag") and v]

    return jsonify({
        "success": True,
        "scam_probability": scam_prob,
        "key_triggers": triggers
    })


# -----------------------------
# Health Check
# -----------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Backend Running"
    })


# -----------------------------
# Run
# -----------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)