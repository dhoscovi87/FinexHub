import uuid
print(str(uuid.uuid4()))
curl -X GET \
  https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/YOUR_API_USER_ID \
  -H "Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY"