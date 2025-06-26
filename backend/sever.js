require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/initiate-subscription', async (req, res) => {
  try {
    // Prepare Telebirr subscription payload (adjust fields as per Telebirr docs)
    const payload = {
      // appId: process.env.TELEBIRR_APP_ID,
      outTradeNo: req.body.subscriptionId, // unique subscription/order ID
      subject: req.body.subject, // e.g. "Bingo Game Monthly Subscription"
      totalAmount: req.body.amount, // subscription amount
      shortCode: process.env.TELEBIRR_SHORT_CODE,
      notifyUrl: process.env.TELEBIRR_NOTIFY_URL, // webhook for subscription events
      returnUrl: req.body.returnUrl, // where to redirect after authorization
      timeoutExpress: "15m",
      period: req.body.period, // e.g. "MONTH"
      interval: req.body.interval, // e.g. 1 for every month
      // ...other required fields per Telebirr docs
    };

    // Call Telebirr Subscription API (replace with actual endpoint from docs)
    const response = await axios.post(
      'https://app.telebirr.com/api/payment/subscription', // Example endpoint, check docs
      payload,
      {
        headers: {
          // 'App-Key': process.env.TELEBIRR_APP_KEY,
          'App-Secret': process.env.TELEBIRR_APP_SECRET,
          'Content-Type': 'application/json'
        }
      }
    );

    // Return subscription authorization URL to frontend
    res.json({ subscriptionUrl: response.data.subscriptionUrl });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: error.message, details: error.response?.data });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));