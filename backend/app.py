
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

CHAPA_SECRET = os.getenv("CHAPA_SECRET_KEY")

@app.route('/api/wallet/deposit', methods=['POST'])
def create_deposit():
    try:
        data = request.json
        tx_ref = f"DEP-{data.get('userId')}-{int(__import__('time').time())}"
        
        payload = {
            "amount": data.get("amount"),
            "currency": "ETB",
            "email": data.get("email", "user@example.com"),
            "first_name": data.get("firstName", "User"),
            "last_name": data.get("lastName", "Player"),
            "tx_ref": tx_ref,
            "callback_url": "http://0.0.0.0:5000/api/payment-callback",
            "return_url": "http://0.0.0.0:5173/wallet?payment=success",
            "customization[title]": "Bingo Game Deposit",
            "customization[description]": f"Wallet deposit via {data.get('paymentMethod', {}).get('name', 'Payment')}"
        }

        headers = {
            "Authorization": f"Bearer {CHAPA_SECRET}",
            "Content-Type": "application/json"
        }

        response = requests.post("https://api.chapa.co/v1/transaction/initialize",
                                headers=headers, json=payload)
        chapa_res = response.json()

        if chapa_res.get("status") != "success":
            return jsonify({"error": chapa_res.get("message", "Payment initialization failed")}), 400

        return jsonify({
            "success": True,
            "checkout_url": chapa_res["data"]["checkout_url"],
            "transactionId": tx_ref
        })

    except Exception as e:
        print(f"Deposit error: {str(e)}")
        return jsonify({"error": str(e)}), 500

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
            "transactionId": f"WTH-{data.get('userId')}-{int(__import__('time').time())}",
            "status": "processing",
            "message": "Withdrawal request submitted successfully"
        })
        
    except Exception as e:
        print(f"Withdrawal error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/payment-callback', methods=['GET', 'POST'])
def payment_callback():
    try:
        print("Received Chapa callback:", request.args if request.method == 'GET' else request.json)
        
        # In a real app, you would:
        # 1. Verify the callback signature
        # 2. Update the transaction status in your database
        # 3. Update the user's wallet balance
        
        return jsonify({"message": "Payment callback processed"}), 200
        
    except Exception as e:
        print(f"Callback error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/verify-payment/<tx_ref>', methods=['GET'])
def verify_payment(tx_ref):
    try:
        headers = {
            "Authorization": f"Bearer {CHAPA_SECRET}"
        }
        
        response = requests.get(f"https://api.chapa.co/v1/transaction/verify/{tx_ref}",
                               headers=headers)
        chapa_res = response.json()
        
        return jsonify(chapa_res)
        
    except Exception as e:
        print(f"Verification error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "bingo-wallet-api"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
