
### 📘 Airtel Fund Transfer (AFT) – Simple Flow

1️⃣ **Check Agent**

* First, we call the **Agent API**.
* We check whether the agent is registered or not.
* If the agent is not registered, we register the agent.

2️⃣ **Fetch Customer**

* Then, we call the **Fetch Customer API**.
* From this API, we may get a **redirection link**.

👉 If we get the link:

* We redirect the customer to the **Airtel Portal**.

👉 If we do NOT get the link:

* We move to the next step.

3️⃣ **Aadhaar Validation**

* We call the **Aadhaar Validation API**.
* This API may also give a redirection link.

👉 If we get the link:

* We redirect the customer to the portal.

👉 If we still do NOT get any link:

* We show the **vendor’s error/message** to the user.

4️⃣ **Balance Check (Vendor Side)**

* Airtel vendor calls our **Balance Check API**.
* In this API, we **initiate the transaction**.

5️⃣ **Transaction on Airtel Portal**

* The customer completes the transaction on the Airtel portal.

6️⃣ **Transaction Callback**

* After completion, Airtel sends us a **Transaction Callback**.
* We receive it and **mark the transaction as completed** in our system.

---

### ✅ In Short (One-Line Flow)

Agent Check → Fetch Customer → Redirect / Aadhaar Verify → Show Vendor Message → Balance Check → Portal Transaction → Callback → Complete Transaction

---

If you want, I can also convert this into a **diagram or technical documentation format** for your office use.
