from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
import time
import uuid
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()
app = Flask(__name__)
CORS(app)

CHAPA_SECRET = os.getenv("CHAPA_SECRET_KEY")

cred = credentials.Certificate("./serviceAccountKey.json")  # Update path if needed
firebase_admin.initialize_app(cred)
fs_db = firestore.client()


@app.route('/api/update-user', methods=['POST'])
def update_user():
    if not request.is_json:
        return jsonify(
            {"error": "Invalid Content-Type. Must be application/json"}), 400

    data = request.get_json()

    if data is None:
        return jsonify({"error": "Invalid JSON payload"}), 400

    user_id = data.get("userId")
    phone = data.get("phone")
    telegram_username = data.get("telegram")

    # Here you would typically use something like Firestore's client to update the user profile
    # db.collection('users').document(user_id).update({
    #     'phone': phone,
    #     'telegram': telegram_username
    # })

    return jsonify({
        "success": True,
        "message": "User updated successfully"
    }), 200


@app.route('/api/create-payment', methods=['POST'])
def create_payment():
    data = request.json
    tx_ref = f"bingo-{uuid.uuid4()}"

    payload = {
        "amount": data.get("amount"),
        "currency": "ETB",
        "email": data.get("email"),
        "first_name": data.get("first_name"),
        "last_name": data.get("last_name"),
        "tx_ref": tx_ref,
        "callback_url":
        "https://28f0eda4-60c8-4ddb-a036-763cb8fd46c0-00-2bbc1x56d1sdx.worf.replit.dev:5000/api/payment-callback",
        "return_url":
        "https://28f0eda4-60c8-4ddb-a036-763cb8fd46c0-00-2bbc1x56d1sdx.worf.replit.dev/payment-complete",
        "customization[title]": "Bingo Game",
        "customization[description]": "Entry Fee"
    }

    headers = {"Authorization": f"Bearer {CHAPA_SECRET}"}

    try:
        response = requests.post(
            "https://api.chapa.co/v1/transaction/initialize",
            headers=headers,
            json=payload)
        chapa_res = response.json()

        if chapa_res.get("status") != "success":
            return jsonify(
                {"error": chapa_res.get("message", "Unknown error")}), 400

        return jsonify({
            "checkout_url": chapa_res["data"]["checkout_url"],
            "tx_ref": tx_ref
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/wallet/deposit', methods=['POST'])
def wallet_deposit():
    data = request.get_json()
    amount = data.get('amount')
    email = data.get('email')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    user_id = data.get('userId')
    phone = data.get('phone')  # <-- Accept phone

    if not all([amount, email, first_name, last_name, user_id, phone]):
        return jsonify({'error': 'Missing required fields'}), 400

    tx_ref = f"deposit-{user_id}-{int(time.time())}"
    payload = {
        "amount": str(amount),
        "currency": "ETB",
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "phone_number": phone,  # <-- Pass phone to Chapa
        "tx_ref": tx_ref,
        "callback_url": "https://73db-196-190-131-11.ngrok-free.app/api/payment-callback",
        "return_url": "http://localhost:5173/wallet",
        "customization": {
            "title": "Deposit to Wallet",
            "description": "Deposit funds to your wallet"
        }
    }

    headers = {
        "Authorization": f"Bearer {CHAPA_SECRET}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        "https://api.chapa.co/v1/transaction/initialize",
        json=payload,
        headers=headers
    )

    if response.status_code != 200:
        return jsonify({'error': 'Chapa API error', 'details': response.text}), 500

    resp_json = response.json()
    if resp_json.get('status') != 'success':
        return jsonify({'error': 'Chapa error', 'details': resp_json}), 500

    # After creating tx_ref in /api/wallet/deposit
    fs_db.collection('transactions').document(tx_ref).set({
        "userId": user_id,
        "amount": float(amount),
        "status": "pending",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "type": "deposit"
    })

    return jsonify({
        "checkout_url": resp_json['data']['checkout_url'],
        "tx_ref": tx_ref
    })


@app.route('/api/wallet/withdraw', methods=['POST'])
def process_withdrawal():
    try:
        data = request.json

        # In a real app, you would:
        # 1. Validate the withdrawal request
        # 2. Check user balance
        # 3. Process the withdrawal to their account
        # 4. Update the database

        return jsonify({
            "success": True,
            "transactionId": f"WTH-{data.get('userId')}-{int(time.time())}",
            "status": "processing",
            "message": "Withdrawal request submitted successfully"
        })

    except Exception as e:
        print(f"Withdrawal error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/payment-callback', methods=['GET', 'POST'])
def payment_callback():
    try:
        data = request.json if request.method == 'POST' else request.args
        print("Received Chapa callback:", data)

        # Example: Extract tx_ref, userId, amount from callback or your DB
        tx_ref = data.get('tx_ref')
        status = data.get('status')
        amount = float(data.get('amount', 0))
        user_id = data.get('userId')  # You may need to map tx_ref to userId in your DB

        if status == "success":
            # Update transaction status
            fs_db.collection('transactions').document(tx_ref).set({
                "status": "completed"
            }, merge=True)

            # Increment wallet balance
            wallet_ref = fs_db.collection('wallets').document(user_id)
            wallet_ref.update({
                "balance": firestore.Increment(amount)
            })

        return jsonify({"message": "Payment callback processed"}), 200

    except Exception as e:
        print(f"Callback error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/verify-payment/<tx_ref>', methods=['GET'])
def verify_payment(tx_ref):
    headers = {"Authorization": f"Bearer {CHAPA_SECRET}"}

    try:
        response = requests.get(
            f"https://api.chapa.co/v1/transaction/verify/{tx_ref}",
            headers=headers)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "bingo-backend"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
