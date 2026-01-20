Step 1: SmartCollect Api request

When SmartCollect AI calls our API:
The subProduct coming in the request is razorpay-qr.
Based on this, the flow goes to the vendor layer.

Step 2: Fetch data from Razorpay table
Inside the vendor flow:
We first check the Razorpay QR table in the database.
If the data already exists, we use it directly.
If the data does not exist, then:
We call the vendor’s API.
Whatever response we receive from the vendor:
We store that response in the Razorpay table.

## As part of this task:
I added a new column called subProduct in the Razorpay table.
Now whenever a new QR record is inserted:
The record also stores the subProduct value (for example: razorpay-qr).

Step 3: Razorpay callback flow
When Razorpay sends a callback
there is  function fetches the required qr data from the db.
There another function called processQR  function.

Step 4: Transaction handling
Inside the processQR() function:
Two internal functions are executed:
Initiate transaction
Auto-complete transaction

Step 5: Product validation logic
Inside the auto-complete transaction function:
The system checks:
Whether the product type is settlement or not.
Our new requirement was:
We need to treat SmartCollect
whose subProduct is razorpay-qr
as a settlement product.

I used the database as the single source of truth for subProduct so that during Razorpay callback we can dynamically decide whether the transaction should behave as settlement or not. 