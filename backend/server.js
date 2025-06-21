require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/initiate-subscription', async (req, res) => {
  try {
    // Check for required environment variables
    const requiredEnvVars = ['TELEBIRR_APP_ID', 'TELEBIRR_APP_KEY', 'TELEBIRR_APP_SECRET', 'TELEBIRR_SHORT_CODE', 'TELEBIRR_NOTIFY_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return res.status(500).json({ 
        error: 'Server configuration error', 
        details: `Missing environment variables: ${missingVars.join(', ')}` 
      });
    }

    // Validate request body
    if (!req.body.subscriptionId || !req.body.subject || !req.body.amount || !req.body.returnUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'subscriptionId, subject, amount, and returnUrl are required' 
      });
    }

    // Prepare Telebirr subscription payload (adjust fields as per Telebirr docs)
    const payload = {
      appId: process.env.TELEBIRR_APP_ID,
      outTradeNo: req.body.subscriptionId, // unique subscription/order ID
      subject: req.body.subject, // e.g. "Bingo Game Monthly Subscription"
      totalAmount: req.body.amount, // subscription amount
      shortCode: process.env.TELEBIRR_SHORT_CODE,
      notifyUrl: process.env.TELEBIRR_NOTIFY_URL, // webhook for subscription events
      returnUrl: req.body.returnUrl, // where to redirect after authorization
      timeoutExpress: "15m",
      period: req.body.period || "MONTH", // e.g. "MONTH"
      interval: req.body.interval || 1, // e.g. 1 for every month
    };

    console.log('Attempting Telebirr API call with payload:', { ...payload, appId: '[HIDDEN]' });

    // For development/testing purposes, return a mock response instead of calling the actual API
    // Remove this block when you have proper Telebirr credentials and want to use the real API
    if (!process.env.TELEBIRR_USE_REAL_API || process.env.TELEBIRR_USE_REAL_API !== 'true') {
      console.log('Using mock Telebirr response for development');
      const mockSubscriptionUrl = `${req.body.returnUrl}?payment=success&subscription_id=${req.body.subscriptionId}`;
      return res.json({ subscriptionUrl: mockSubscriptionUrl });
    }

    // Call Telebirr Subscription API (replace with actual endpoint from docs)
    const response = await axios.post(
      'https://app.telebirr.com/api/payment/subscription', // Example endpoint, check docs
      payload,
      {
        headers: {
          'App-Key': process.env.TELEBIRR_APP_KEY,
          'App-Secret': process.env.TELEBIRR_APP_SECRET,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('Telebirr API response received');
    
    // Return subscription authorization URL to frontend
    res.json({ subscriptionUrl: response.data.subscriptionUrl });
  } catch (error) {
    console.error('Error in /api/initiate-subscription:', error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(500).json({ 
        error: 'Unable to connect to Telebirr API', 
        details: 'Please check your network connection and API endpoint' 
      });
    }
    
    if (error.response) {
      console.error('Telebirr API error response:', error.response.data);
      return res.status(500).json({ 
        error: 'Telebirr API error', 
        details: error.response.data 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));