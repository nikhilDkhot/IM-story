
---
## 🌟 **The Story of SmartCollect4 & the QR Hero**
Once upon a time, in a digital city called **SmartCollect4**, there lived a helpful system whose job was to **collect payments smoothly**.
Every day, **customers** came to visit.
---
### 🧑‍💼 Step 1: Meet the Customer
First, SmartCollect4 would say:
👉 *“Let me check if you are already my friend.”*
So it searched in its table.
#### Two cases:
✅ **If customer is NOT found**
→ SmartCollect4 happily says:
“Welcome! Let me register you.”
➡️ Creates customer
➡️ Inserts into table
✅ **If customer IS found**
→ “Oh, you’re already with me!” 😄
➡️ Move to QR step
---


### 📱 Step 2: The QR Decision
Now SmartCollect4 asks:
👉 *“Which type of QR do you need?”*
There are **two types of QR heroes**:
---
## 🟢 1. Multiple-Use QR (Reusable Hero ♻️)
This QR can be used many times.
SmartCollect4 thinks:
👉 “Let me check if I already have one.”
* If QR **exists in table** ✅
  → Use it again 👍
* If QR **not found** ❌
  → Call Vendor API 📞
  → Generate new QR
  → Save in table 💾
  → Use it

---

## 🔵 2. Single-Use QR (One-Time Hero 🎯)

This QR works only once.

SmartCollect4 knows:

👉 “No need to check old ones.”

So every time:

➡️ Call Vendor API
➡️ Generate new QR
➡️ Store in table
➡️ Use it

---

## 🌈 Final Flow in Story Form

So every time:

1️⃣ Customer comes
2️⃣ Check → Exists or Not
3️⃣ If not → Create customer
4️⃣ If yes → Check QR type
5️⃣ Multiple → Reuse or Generate
6️⃣ Single → Always Generate New

And SmartCollect4 lives happily, processing payments without trouble 😄✨

---

## 📌 One-Line Memory Trick

> **Customer → Check → Create if needed → QR Type → Reuse or Generate**

---