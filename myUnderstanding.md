* **`checkPayoutLimit`**
  Checks whether the total payout amount
  `(txData[0]['amount'] + dataParams.txamount)`
  exceeds the account’s monthly payout limit
  `accountData[0]['maxlimit_payouts_monthly']`.
  If the limit is exceeded, the transaction should not be allowed.

* **`walletlock_check`**
  Verifies whether the wallet associated with the provided `guid` is locked or active before processing the transaction.

* **`isProductTypeSettlement`**
  Validates settlement availability based on the primary product type.
  If the primary product check fails, it validates using the subproduct type.
  If both validations fail, settlement will be considered `false`.

* **`getWallet`**
  Retrieves wallet information from the `wallet` table for the specified account.
