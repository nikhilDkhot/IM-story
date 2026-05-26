initiateTransaction: function (dataParams, callback) {
        console.log("initiateTransaction dataParams:", dataParams)
        //VALIDATION
        var vStatus = validateRule(dataParams, {
            // mobileno: 'required|numeric|min:1000000000|max:10000000000',
            "guid": "required",
            "account_no": "required",
            "accounts_id": "required",
            "account_outlet_name": "required",
            "account_mobileno": "required",
            "uri_path": "required",
            "product": "required",
            //"subproduct": "required",
            "tx_method": "required",
            //"tx_mode": "required",
            //"operator": "required",
            //"vendor": "required",

            "wallet_type": "required",
            "txamount": 'required|numeric',
            //"narration": "required",
            //"remarks": "required",
            "client_info": "required",
            //"ref_no": "required",
            //"tx_ref": "required",
            //"tx_start": "required",

            "medium": "required",
            "userid": "required",
            "clientip": "required",
            "site": "required",
            "host": "required",
        });
        console.log('transaction.js 1')
        if (!vStatus.status) {
            return callback(false, vStatus.errors);
        }

        if (dataParams.tx_start == null) {
            dataParams.tx_start = moment().format("Y-M-D HH:mm:ss");
        }
        if (dataParams.tx_mode == null) {
            dataParams.tx_mode = "forward";
        }
        if (dataParams.timestamp == null) {
            dataParams.timestamp = moment().format("Y-M-D HH:mm:ss");
        }

        if (dataParams.scheme_product == null) dataParams.scheme_product = dataParams.product;
        if (dataParams.subproduct == null) dataParams.subproduct = "";
        if (dataParams.baseAmount == null) dataParams.baseAmount = dataParams.txamount;
        if (dataParams.base_amount == null) dataParams.base_amount = dataParams.txamount;
        console.log("dataParams 1",dataParams);
        // console.log("dataParams 1");

        // if (TXLOCK.walletlock_check(dataParams.account_no)) {
        //     return callback(false, "Wallet Lock");
        // }
        LIMITENTRY.checkPayoutLimit(dataParams, function (txAllowed, errMsg) {
            console.log('transaction.js 2', txAllowed, errMsg)
            // console.log('transaction.js 2')

            if (!txAllowed) {
                return callback(false, errMsg);
            }

            TXLOCK.walletlock_check(dataParams.account_no, function (status) {
                console.log('transaction.js 3', status)
                // console.log('transaction.js 3')
                if (status) {
                    return callback(false, "Wallet Lock", dataParams);
                }
                //Prepare Transaction

                //console.log("TX-INITIALIZE", dataParams);

                //PRODUCT
                //CONFIG.log_sql = true;

                // dbRead_selectQ("products", "*", {
                //     "prod_code": dataParams.product
                // }, {}, function(productData) {
                PRODUCT.isProductTypeSettlement(dataParams.product, dataParams.subproduct, function (isSettlement, productData) {
                    console.log("isProductTypeSettlement productData",isSettlement, productData)
                    // console.log('transaction.js 4', isSettlement, productData)
                    // console.log('transaction.js 4')
                    if (!productData) {
                        return callback(false, "Product Not Found or not allowed");
                    }
                    //productData = productData[0];
                    if (productData.blocked == "true") {
                        return callback(false, "Product Is No Longer Available");
                    }
                    // if (productData[0].active == "false") {
                    //     return callback(false, "Product Is Not Available For Temporary Period");
                    // }

                    if (dataParams.txamount != null && parseInt(dataParams.txamount) <= 0) {
                        isSettlement = false;
                    }

                    if (isSettlement) dataParams.tx_mode = "settlement";

                    dataParams.productData = productData;
                    dataParams.baseAmount = dataParams.txamount;
                    //console.log("productData XXXXXXXXX",productData, dataParams);

                    if (productData.cluster_mode == "true") {
                        // console.log("clusteramount productData.cluster_amount,dataParams.baseAmount",productData.cluster_amount,dataParams.baseAmount);

                        if (productData.cluster_amount < dataParams.baseAmount) {
                            // console.log("cluster REQUIRE-CLUSTERMODE",{
                            // 	"CLUSTER": {
                            // 		"cluster_amount": productData.cluster_amount,
                            // 		"cluster_mode": productData.cluster_mode,
                            // 		"product": productData.prod_code,
                            // 		"base_amount": dataParams.baseAmount,
                            // 		"fullamount_tx_count": totalFullTxCount,
                            // 		"additional_amount": totalAdditionalAmount
                            // 	}
                            // })

                            var totalFullTxCount = Math.floor(dataParams.baseAmount / productData.cluster_amount);
                            var totalAdditionalAmount = dataParams.baseAmount % productData.cluster_amount;

                            return callback(false, "REQUIRE-CLUSTERMODE", {
                                "CLUSTER": {
                                    "cluster_amount": productData.cluster_amount,
                                    "cluster_mode": productData.cluster_mode,
                                    "product": productData.prod_code,
                                    "base_amount": dataParams.baseAmount,
                                    "fullamount_tx_count": totalFullTxCount,
                                    "additional_amount": totalAdditionalAmount
                                }
                            });
                        }
                    }

                    //Validate Wallet
                    //Verify Transaction
                    //TxLog Entry
                    //Do Wallet Deduction
                    // //console.log("BP7:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before getWallet");
                    WALLET.getWallet(dataParams.accounts_id, function (walletData) {
                        console.log('transaction.js 5', walletData)
                        // console.log('transaction.js 5')

                        // console.log("getWallet walletData",walletData);
                        //console.log("dataParams", dataParams);
                        // //console.log("BP8:",moment().format("YYYY-MM-DD hh:mm:ss"), "After getWallet");
                        if (!walletData) {
                            return callback(false, "Wallet Not Found for the Account");
                        }

                        if (walletData.guid != dataParams.guid) {
                            return callback(false, "Transaction Server Misconfigured");
                        }

                        if (dataParams.wallet_type == "prepaid") {
                            walletData.prepaid_amount = parseFloat(walletData.prepaid_amount);

                            if (isNaN(walletData.prepaid_amount)) {
                                return callback(false, "Wallet Balance Amount Error");
                            }
                            if (productData.reverse_tx == 'false' && (dataParams.txamount != 0 && dataParams.txamount > (walletData.prepaid_amount - walletData.minimum_prepaid_balance))) { //*0.99
                                return callback(false, "Transaction Amount can not exceed Wallet Balance");
                            }
                        } else if (dataParams.wallet_type == "wallet3") {
                            walletData.wallet3_amount = parseFloat(walletData.wallet3_amount);

                            if (isNaN(walletData.wallet3_amount)) {
                                return callback(false, "Wallet Balance Amount Error");
                            }
                            if (productData.reverse_tx == 'false' && ( dataParams.txamount != 0 && dataParams.txamount > (walletData.wallet3_amount - walletData.minimum_wallet3_balance))) { //*0.99
                                return callback(false, "Transaction Amount can not exceed Wallet Balance");
                            }
                        } else {
                            walletData.postpaid_amount = parseFloat(walletData.postpaid_amount);

                            if (isNaN(walletData.postpaid_amount)) {
                                return callback(false, "Wallet Balance Amount Error");
                            }
                            if (productData.reverse_tx == 'false' && (dataParams.txamount != 0 && dataParams.txamount > (walletData.postpaid_amount - walletData.minimum_postpaid_balance))) { //*0.99
                                return callback(false, "Transaction Amount can not exceed Wallet Balance");
                            }
                        }

                        // //console.log("BP9:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before findScheme");
                        SCHEME.findSchemeAuto(productData, dataParams, function (schemeData, errorMessage) {
                            console.log('transaction.js 6', schemeData, errorMessage)
                            // console.log('transaction.js 6')

                            //console.log("BP10:",moment().format("YYYY-MM-DD hh:mm:ss"), "After findScheme");
                            // console.log("SCHEME.findSchemeAuto scheme", schemeData);
                            if (!schemeData) {
                                return callback(false, errorMessage || "Scheme not found");
                            }

                            if (schemeData.activated == "false") {
                                return callback(false, "Scheme is not activated");
                            }

                            // dataParams.narration = "TX for Member "+dataParams.account_no+
                            //               " From "+dataParams.wallet_type+" Wallet"+
                            //               " For "+dataParams.product+
                            //               " For "+dataParams.client_info;

                            dataParams.narration = getWalletNarration(dataParams.product, dataParams.subproduct, dataParams);
                            dataParams.category = "transaction";
                            dataParams.schemeData = schemeData;
                            // console.log("dataParams before fetch_schemeslab",dataParams)
                            //console.log("BP11:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before findSchemeSlab", schemeData, dataParams.txamount, dataParams.operator);
                            SCHEME.fetchSchemeSlab(schemeData, dataParams.txamount, dataParams.operator, function (txSlab, errorMessage) {
                                // console.log("BP12:",moment().format("YYYY-MM-DD hh:mm:ss"), "After findSchemeSlab", txSlab, errorMessage);
                                console.log("fetchSchemeSlab",txSlab, errorMessage);
                                // console.log('transaction.js 7', txSlab, errorMessage)
                                console.log('transaction.js 7')

                                if (!txSlab) {
                                    if (!errorMessage) errorMessage = "Error in Schemes";
                                    return callback(false, errorMessage, dataParams.operator);
                                }

                                dataParams.txSlab = txSlab;

                                dataParams.baseAmount = dataParams.txamount;
                                dataParams.base_amount = dataParams.txamount;
                                dataParams.txamount = SCHEME.calcTxValue(schemeData, dataParams, txSlab);
                                // console.log('dataParams.txamount - ', dataParams.txamount)
                                if (productData.reverse_tx == "false") {
                                    if (dataParams.txamount == 0) {
                                        // ALLOW 0 AMT TRANSACTION IN ALL CASES
                                    } else if (dataParams.wallet_type == "prepaid") {
                                        if ((parseFloat(walletData.prepaid_amount) - parseFloat(dataParams.txamount)) < 0) {
                                            //TXLOCK.walletlock_end(dataParams.account_no);
                                            return callback(false, "Prepaid Wallet Amount Not Enough For This Transaction");
                                        }
                                    } else if (dataParams.wallet_type == "wallet3") {
                                        if ((parseFloat(walletData.wallet3_amount) - parseFloat(dataParams.txamount)) < 0) {
                                            //TXLOCK.walletlock_end(dataParams.account_no);
                                            return callback(false, "Wallet3 Amount Not Enough For This Transaction");
                                        }
                                    } else {
                                        if ((parseFloat(walletData.postpaid_amount) - parseFloat(dataParams.txamount)) < 0) {
                                            //TXLOCK.walletlock_end(dataParams.account_no);
                                            return callback(false, "Postpaid Wallet Amount Not Enough For This Transaction");
                                        }
                                    }
                                }

                                if (dataParams.vendor == null || dataParams.vendor.length <= 0) {
                                    //console.log("BP13:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before getVendor");
                                    VENDORAPI.getVendor(dataParams.product, function (vendorData) {
                                        // console.log('transaction.js vendorData - ', vendorData)
                                        console.log('transaction.js vendorData - ')
                                        // //console.log("BP14:",moment().format("YYYY-MM-DD hh:mm:ss"), "After getVendor");
                                        if (!vendorData) {
                                            //console.log("TXINIT-VENDOR", dataParams.product);
                                            return callback(false, "Vendor Could Not Be Identified (1)");
                                        }

                                        dataParams.schemeData = schemeData;
                                        dataParams.vendorData = vendorData;
                                        dataParams.vendor = vendorData.api_vendor;

                                        // Get revenue params
                                        // MAR-2024: MOVING TO COMPLETE TXN
                                        // REVENUE.getRevenueParamsForTxnLog(dataParams, function (revenueParams) {
                                        //     dataParams = { ...dataParams, ...revenueParams };
                                        // console.log("generateTxLogRecord",dataParams);
                                        // //console.log("BP15:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before generateTxLogRecord");
                                        TRANSACTION.generateTxLogRecord(dataParams, function (txLogRecord) {
                                            // console.log("txlogdata", txLogRecord);
                                            console.log("txlogdata");
                                            // //console.log("BP16:",moment().format("YYYY-MM-DD hh:mm:ss"), "After generateTxLogRecord");
                                            var txid = txLogRecord.txid;
                                            // console.log("txid:", txid)
                                            dataParams.txid = txid;
                                            dataParams["account_outlet_name"] = txLogRecord.account_outlet_name;
                                            dataParams["account_mobileno"] = txLogRecord.account_mobileno;
                                            dataParams["scheme"] = txLogRecord.scheme;

                                            // //console.log("BP17:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before logTx");
                                            TRANSACTION.logTx(txLogRecord, function (result, errorMessage) {
                                                // console.log("BP18:",result, "After logTx");
                                                console.log("BP18:");
                                                if (!result) {
                                                    if (errorMessage == null) errorMessage = "Error creating transaction, try again later";
                                                    var data = {
                                                        "guid": txLogRecord.guid,
                                                        "data": JSON.stringify(txLogRecord),
                                                        "error": errorMessage,
                                                        "dataObject": "",
                                                        //"category": (wData.category!=undefined)?wData.category:"",
                                                        //"rowhash": TXLOCK.generateDataHash(dataParams,"TX"),
                                                        //"url": (dataParams.uri_path!=undefined)?dataParams.uri_path:"", 
                                                        "txid": (txLogRecord.txid != undefined) ? txLogRecord.txid : "",
                                                        "entry_type": "logTx",
                                                        "amount": (txLogRecord.amount != undefined) ? txLogRecord.amount : "",
                                                        "created_by": (dataParams.userid != undefined) ? dataParams.userid : "",
                                                        "created_on": moment().format("Y-M-D HH:mm:ss"),
                                                        "edited_by": (dataParams.userid != undefined) ? dataParams.userid : "",
                                                        "edited_on": moment().format("Y-M-D HH:mm:ss")
                                                    }

                                                    dblog_insertQ1("log_cluster", data, function (dataInsertID, errorMessage1) {
                                                        // if (!dataInsertID) {
                                                        //     return callback(false, errorMessage);
                                                        // }
                                                        //return callback(false,"Wallet Lock",dataParams);
                                                        //return callback(true, wData);
                                                        //return callback(false, errorMessage);
                                                    });
                                                    return callback(false, errorMessage);
                                                }

                                                dataParams.transaction_amount = dataParams.txamount;
                                                dataParams.scheme_code = dataParams.scheme.scheme_code;
                                                dataParams.wtx_ref = dataParams.tx_ref;

                                                if (productData.reverse_tx == "false") {
                                                    // //console.log("BP19:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before deductFunds");
                                                    WALLET.deductFunds(dataParams, function (ans, errMsg) {
                                                        // //console.log("BP20:",moment().format("YYYY-MM-DD hh:mm:ss"), "After deductFunds");
                                                        if (!ans) {
                                                            if (errMsg == null) errMsg = "Error Deducting Wallet Balance";
                                                            return callback(false, errMsg);
                                                        }

                                                        return callback(dataParams);
                                                    });
                                                } else {
                                                    return callback(dataParams);
                                                }
                                            });
                                        });
                                        // });
                                    });
                                } else {
                                    //console.log("BP37:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before getVendorData", dataParams.vendor, dataParams.product);
                                    VENDORAPI.getVendorData(dataParams.vendor, dataParams.product, function (vendorData) {
                                        console.log('transaction.js 8', vendorData)
                                        // console.log('transaction.js 8')

                                        // //console.log("BP38:",moment().format("YYYY-MM-DD hh:mm:ss"), "After getVendorData");
                                        // console.log("getVendorData vendordata", vendorData);
                                        if (!vendorData) {
                                            //return callback(false, "Vendor Could Not Be Identified (2)");
                                            return callback(false, "Transaction is not initiated at this time, please try after some time");
                                        }

                                        dataParams.schemeData = schemeData;
                                        dataParams.vendorData = vendorData;

                                        // MAR-2024: MOVING TO COMPLETE TXN
                                        // REVENUE.getRevenueParamsForTxnLog(dataParams, function (revenueParams) {
                                        // dataParams = { ...dataParams, ...revenueParams };

                                        // console.log("generateTxLogRecord",dataParams)
                                        // //console.log("BP39:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before getTxLogRecord");
                                        TRANSACTION.generateTxLogRecord(dataParams, function (txLogRecord) {
                                            console.log("BP40:",moment().format("YYYY-MM-DD hh:mm:ss"), "After getTxLogRecord", txLogRecord);
                                            // console.log("BP40:");
                                            var txid = txLogRecord.txid;

                                            dataParams.txid = txid;
                                            dataParams["account_outlet_name"] = txLogRecord.account_outlet_name;
                                            dataParams["account_mobileno"] = txLogRecord.account_mobileno;
                                            dataParams["scheme"] = txLogRecord.scheme;

                                            // //console.log("BP41:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before logTx");
                                            TRANSACTION.logTx(txLogRecord, function (result, errorMessage) {
                                                // console.log('transaction.js 9')

                                                console.log("BP42:",moment().format("YYYY-MM-DD hh:mm:ss"), "After logTx", result, errorMessage);
                                                if (!result) {
                                                    if (errorMessage == null) errorMessage = "Error creating transaction, try again later";
                                                    return callback(false, errorMessage);
                                                }

                                                dataParams.transaction_amount = dataParams.txamount;
                                                dataParams.scheme_code = dataParams.scheme.scheme_code;
                                                dataParams.wtx_ref = dataParams.tx_ref;

                                                if (productData.reverse_tx == "false") {
                                                    //console.log("BP43:",moment().format("YYYY-MM-DD hh:mm:ss"), "Before deductFunds", dataParams);
                                                    WALLET.deductFunds(dataParams, function (ans, errMsg) {
                                                        console.log('transaction.js 10', ans, errMsg)
                                                        // console.log('transaction.js 10')

                                                        // console.log("deductFunds true true", ans, errMsg);
                                                        // //console.log("BP44:",moment().format("YYYY-MM-DD hh:mm:ss"), "After deductFunds");
                                                        if (!ans) {
                                                            if (errMsg == null) errMsg = "Error Deducting Wallet Balance";
                                                            return callback(false, errMsg);
                                                        }
                                                        //console.log("dataparams",dataParams);
                                                        return callback(dataParams);
                                                    });
                                                } else {
                                                    // console.log("reverse tx true");
                                                    return callback(dataParams);
                                                }
                                            });
                                        });
                                        // });
                                    });
                                }
                            });
                        });
                    });
                });
            })

        });
    }
