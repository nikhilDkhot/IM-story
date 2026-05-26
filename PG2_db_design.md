

"tableName": "pg_requests",
{
    "id": 2077902,
    "client_id": "3", //IM or NFT
    "amount": "11.00",
    "status": "completed", //failed,inprogress
    "email": "xyz@gmail.com",
    "mobile": "9594939222",
    "first_name": "xyz",
    "last_name": null,
    "payment_id": "39f9c3088848dbfccc676f0dfa59b522", //made my pg2 sever
    "tx_ref": "730210890181785989313", //coming from client
    "engine": "runpaisa", //from data_engine table
    "pg_id": 26,
    "notified_status": "sent", //open
    "payload": "{\"customer\":{\"first_name\":\"xyz\",\"mobile\":\"9594939222\",\"email\":\"xyz@gmail.com\"},\"pgcode\":\"pg1_test\",\"tx_ref\":\"730210890181785989313\",\"description\":\"PG\",\"amount\":1100}",
    "webhook_retry_count": 1,
    "blocked": "false",
    "created_on": "2026-03-31T07:24:08.000Z",
    "created_by": "55e89a2371aa2101fa4fc405256eaf2bc2b63ba1593d664d45a45cfdb2d54ce5",
    "edited_on": "2026-03-31T07:24:08.000Z",
    "edited_by": "55e89a2371aa2101fa4fc405256eaf2bc2b63ba1593d664d45a45cfdb2d54ce5"
}

"tableName": "pg_transactions"
{
            "id": 2038820,
            "pg_request_id": 2077902,  //pg_requests
            "tx_ref": "730210890181785989313",
            "outward_id": "50f8067f09d0de78b1502073e609db", //from vendor api
            "rrn": "pay_SXkWmiqCTConSo", //after callback come from vendor
            "utr": null,
            "vendor_ref_id": "50f8067f09d0de78b1502073e609db", //after callback come from vendor
            "mode": "credit_card", //after callback come from vendor
            "card_type": "razorpayolbuiz", //after callback come from vendor
            "card_number": "3423", //after callback come from vendor
            "remarks": "Transaction Successful",  //after callback come from vendor
            "error_remarks": null,
            "order_payload": "", //strigfy request config
            "order_response": "",//strigfy response after creating link
            "order_callback": "",//strigfy callback after come from vendor
            "blocked": "false",
            "created_on": "2026-03-31T07:24:08.000Z",
            "created_by": "55e89a2371aa2101fa4fc405256eaf2bc2b63ba1593d664d45a45cfdb2d54ce5",
            "edited_on": "2026-03-31T07:24:08.000Z",
            "edited_by": "55e89a2371aa2101fa4fc405256eaf2bc2b63ba1593d664d45a45cfdb2d54ce5"
        }