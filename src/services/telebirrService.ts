import axios from "axios";

export async function initiateTelebirrSubscription(subscriptionData: {
  subscriptionId: string;
  subject: string;
  amount: number;
  returnUrl: string;
  period: string; // e.g. "MONTH"
  interval: number; // e.g. 1
}) {
  const res = await axios.post("http://localhost:3001/api/initiate-subscription", subscriptionData);
  return res.data.subscriptionUrl;
}