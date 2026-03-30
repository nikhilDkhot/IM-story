
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
Today I learned about PG2. Since the PG server was down, some transactions did not reach APIHub to PG2.

First, the transaction comes into the fundrequest table, where we get the tx_ref, which is coming from the API. From there, the transaction moves to the pgrequest table, where a link is generated. An interesting point is that the fundrequest ID is stored in the pgrequest table as pg_request_id.

Next, when the callback is received, the callback data is inserted into the pgrequest table. After that, the status in the fundrequest table is changed to completed, and the notified status is updated from open to sent. Additionally, an entry is created in the log_webhook table using the tx_ref.


