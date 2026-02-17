
On 16th February, we are going to do the live ShadavalPay PG integration. For that, I need to complete some setup.
First, create an engine that contains the engine name and PG code.
Then, create a MID, which will include the PG code, engine, auth ID, auth secret, and auth key.
If required in the code, add the config key to the database.
whitelist vender ip through api
Now, I have revised the flow:
An APIHub request is sent to the PG. From there, the PG sends a redirection link. The browser opens this link, and after the payment is completed, the vendor API is called by the PG.
Then, a callback hits the PG microservice, and finally, the PG sends this callback to APIHub.

---
---

### Table Structure Overview

The **paymentgateway** table will store the following fields:

* Engine
* PG Code
* Auth ID
* Auth Secret
* Auth Key
In **APIHub**, whenever a transaction is initiated through the payment gateway, entries will be created in two tables:
* **fundrequest**
* **pgrequest**

These tables will be used to track and manage transaction-related data.
---

