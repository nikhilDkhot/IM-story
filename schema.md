Here’s the relationship and execution flow for your `findSchemeAuto`, `findScheme2`, and `findScheme` logic.

# High-Level Flow

```text
findSchemeAuto()
        |
        v
ACCOUNT.getAdharPanLinkStatus()
        |
        +-----------------------------+
        |                             |
 Aadhaar linked                 Aadhaar not linked
 tds = 2                        tds = 20
        |
        v
Check product/scheme_engine
        |
        +---------------------------------------------+
        |                                             |
 scheme2 / QRPAY3                              normal scheme
        |                                             |
        v                                             v
SCHEME.findScheme2()                          SCHEME.findScheme()
        |                                             |
        |                                             |
 DB Query on:                                  DB Query on:
 schemes                                      schemes
 schemes_allocated                            schemes_allocated
 products                                     products
        |                                             |
        +-----------------------------+---------------+
                                      |
                               Scheme Found?
                                      |
                      +---------------+---------------+
                      |                               |
                    YES                              NO
                      |                               |
          Parse scheme_defination JSON       getFallbackSchemeMap()
                      |
                      v
              Attach tds value
                      |
                      v
                  callback()
```

---

# Detailed Relationship Diagram

```text
+---------------------------------------------------+
|                 findSchemeAuto                    |
+---------------------------------------------------+
| Inputs:                                           |
| - productData                                     |
| - dataParams                                      |
| - callback                                        |
+---------------------------------------------------+
                     |
                     v
+---------------------------------------------------+
| ACCOUNT.getAdharPanLinkStatus(guid)               |
+---------------------------------------------------+
                     |
          +----------+----------+
          |                     |
          v                     v
      status=false?         status=true?
      tds = 20              tds = 2
                     |
                     v
        +----------------------------------+
        | Check scheme_engine/product      |
        +----------------------------------+
                     |
     +---------------+----------------+
     |                                |
     v                                v
+--------------------+      +--------------------+
| SCHEME.findScheme2 |      | SCHEME.findScheme  |
+--------------------+      +--------------------+
| Params:            |      | Params:            |
| accID              |      | accID              |
| productCode        |      | productCode        |
| subproductCode     |      | walletType         |
| walletType         |      +--------------------+
+--------------------+
            |                         |
            +------------+------------+
                         |
                         v
         +--------------------------------------+
         | Build whereClause                    |
         +--------------------------------------+
         | schemes_allocated.accountids_id      |
         | schemes.scheme_product               |
         | schemes.scheme_subproduct (only v2)  |
         | products.blocked=false               |
         | schemes.blocked=false                |
         | schemes_allocated.blocked=false      |
         +--------------------------------------+
                         |
                         v
         +--------------------------------------+
         | dbRead_selectQ()                     |
         | tables:                              |
         | - schemes                            |
         | - schemes_allocated                  |
         | - products                           |
         +--------------------------------------+
                         |
             +-----------+-----------+
             |                       |
             v                       v
        No scheme                Scheme found
             |                       |
             v                       v
+--------------------------+   +----------------------+
| getFallbackSchemeMap()   |   | Parse JSON           |
+--------------------------+   | scheme_defination    |
                               +----------------------+
                                            |
                                 +----------+----------+
                                 |                     |
                                 v                     v
                              JSON Error           JSON OK
                                 |                     |
                                 v                     v
                           callback(error)      schemeData ready
                                                       |
                                                       v
                                              schemeData.tds
                                                       |
                                                       v
                                                  callback()
```

---

# Database Relationship Diagram (ER Style)

```text
+----------------------+
|      schemes         |
+----------------------+
| id                   |
| scheme_product       |
| scheme_subproduct    |
| wallet_type          |
| blocked              |
| scheme_defination    |
+----------------------+
            |
            | schemes.id = schemes_allocated.scheme_id
            |
            v
+----------------------+
|  schemes_allocated   |
+----------------------+
| scheme_id            |
| accountids_id        |
| blocked              |
+----------------------+

            ^
            |
            | schemes.scheme_product = products.prod_code
            |
+----------------------+
|      products        |
+----------------------+
| id                   |
| prod_code            |
| blocked              |
+----------------------+
```

---

# Core Logic Relationships

## 1. `findSchemeAuto`

Acts as:

* Orchestrator
* TDS decision maker
* Router between `findScheme` and `findScheme2`

Depends on:

* `ACCOUNT.getAdharPanLinkStatus`
* `SCHEME.findScheme`
* `SCHEME.findScheme2`

---

## 2. `findScheme2`

Enhanced version with:

* `subproductCode`
* More granular scheme mapping

Used when:

* `scheme_engine == "scheme2"`
* OR `QRPAY/QRPAY3`

---

## 3. `findScheme`

Legacy/general scheme finder.

Simpler matching:

* account
* product
* wallet type

No subproduct filtering.

---

# Important Observation

There is duplicated code between:

* `findScheme`
* `findScheme2`

Only difference:

```js
"schemes.scheme_subproduct": subproductCode
```

This can be refactored into a single reusable function.

Example idea:

```js
findSchemeCommon(accID, productCode, subproductCode=null, walletType, callback)
```

Then conditionally add:

```js
if(subproductCode){
   whereClause["schemes.scheme_subproduct"] = subproductCode;
}
```

That would reduce maintenance risk and improve readability.
