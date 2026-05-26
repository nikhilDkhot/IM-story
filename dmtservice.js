module.exports = function (server, restify) {

    //check merchant outlet id
    server.post('/services/dmt_instantpay/check_onboard_status', (req, res, next) => {
        //below table is used for both intantpay bbps and intantpay upi for outlet id check
        db_selectQ("instantpay_bbps_onboarding", "*", {
            "guid": req.get("GUID"),
            "blocked": "false",
            "status": "completed"
        }, {}, function (resultData) {
            console.log("instantpay_dmt_onboarding data", resultData);

            if (!resultData) {
                const failedResponse = {
                    status: "error",
                    msg: "Merchant is not onboarded.",
                    data: resultData
                }

                res.send(failedResponse);
                return next();
            }

            const successResponse = {
                status: "success",
                msg: "Merchant Already Onboarded.",
                data: resultData
            }
            res.send(successResponse)
            return next();
        })
    })

    //do onboarding of merchant
    server.post('/services/dmt_instantpay/onboarding', (req, res, next) => {
        let vStatus = validateRule(req.body, {
            pan_no: "required",
            aadhaar_no: "required"
        })

        if (!vStatus.status) {
            res.send({
                "status": "error",
                "msg": "Input Validation Failed",
                "data": vStatus.errors
            });
            return next();
        }


        db_selectQ("accountids,accountids_users", "accountids.*,DATE_FORMAT(accountids.dob,'%Y-%m-%d') as dateOfBirth,accountids_users.gender", {
            "accountids.blocked": "false",
            "accountids.guid": req.get("GUID"),
            [`accountids_users.guid = accountids.guid`]: "RAW"
        }, {}, function (accountData, error) {
            console.log("AccountID Result", accountData, error)
            if (!accountData) {
                let resultsData = {
                    "status": "error",
                    "msg": "Account Not Found",
                    "data": accountData
                };
                res.send(resultsData);
                return next();
            }

            let latLong = req.body.geolocation.split(",")
            let requestParams = {
                "mobile": accountData[0].mobile,
                "name": accountData[0].full_name,
                "gender": accountData[0].gender == "male" ? "M" : "F",
                "pan": req.body.pan_no,
                "email": accountData[0].email1,
                "address": {
                    "full": accountData[0].address,
                    "city": accountData[0].city,
                    "pincode": accountData[0].pincode
                },
                "aadhaar": req.body.aadhaar_no,
                "dateOfBirth": accountData[0].dateOfBirth,
                "latitude": latLong[0],
                "longitude": latLong[1]
            }
           
            // console.log("bbps2  VENDOR_INSTANTPAY_BILLPAY.transaction requestParams", requestParams);
            VENDOR_INSTANTPAY_DMT.onboardingDmt(requestParams, function (response, msg, error) {
                console.log("dmt_instant_pay_**Onboarding**", response, msg, error);
                if (response && response?.data?.outletId) {
                    db_insertQ1("instantpay_bbps_onboarding", {
                        guid: accountData[0].guid,
                        outlet_id: response?.data?.outletId,
                        json_dump: JSON.stringify(response) || null,
                        status: "completed",
                        extras: "",
                        created_on: moment().format("Y-MM-DD HH:mm:ss"),
                        created_by: req.get("USERID") || "",
                        edited_on: moment().format("Y-MM-DD HH:mm:ss"),
                        edited_by: req.get("USERID") || ""
                    }, function (insertResult, err) {
                        if (insertResult) {

                            res.send({ status: "success", msg: msg, data: response });
                            return next();
                        } else {
                            res.send({ status: "error", msg: err || "Error while onboarding merchant", data: err || {} });
                            return next();
                        }
                    });
                } else {
                    db_insertQ1("instantpay_bbps_onboarding", {
                        guid: accountData[0].guid,
                        outlet_id: null,
                        json_dump: JSON.stringify(error) || null,
                        status: "rejected",
                        extras: "",
                        created_on: moment().format("Y-MM-DD HH:mm:ss"),
                        created_by: req.get("USERID") || "",
                        edited_on: moment().format("Y-MM-DD HH:mm:ss"),
                        edited_by: req.get("USERID") || ""
                    }, function (insertResult) {
                        res.send({ status: "error", msg: msg || "Error while onboarding merchant", data: error || {} });
                        return next();
                    });
                }
            });
        })

    })

    //
    server.post("/services/dmt_instantpay/getRemitter", (req, res, next) => {
        let vStatus = validateRule(req.body, {
            mobileNumber: "required"
        })
        if (!vStatus.status) {
            res.send({
                "status": "error",
                "msg": "Input Validation Failed",
                "data": vStatus.errors
            });
            return next();
        }
        try {
            ACCOUNT.getAccountInfoOnMemberNo(req.get("GUID"), function (accountData) {
                console.log("accountData:", accountData);
                if (accountData) {
                    db_selectQ("instantpay_bbps_onboarding", "outlet_id", { guid: req.get("GUID"), status: "completed", blocked: "false" }, {}, function (onboardData, error) {
                        console.log('instantpay_bbps_onboarding, error - ', onboardData, error)
                        if (!onboardData) {
                            res.send({ status: "error", msg: "Merchant not onboarded" });
                            return next();
                        }
                        

                        VENDOR_INSTANTPAY_DMT.getRemitterProfileDmt(req.body.mobileNumber, onboardData[0].outlet_id, function (status, msg, dataObj) {
                            //condition to be write for response and msg
                            console.log("getRemitterProfileDmt", status, msg, dataObj);
                            if (status === true) {
                                res.send({ status: "success", msg: msg, data: dataObj });
                                return next();
                            } else {
                                res.send({ status: "error", msg: msg, data: dataObj || {} });
                                return next();
                            }
                        });
                    });
                }
                else {
                    res.send({ status: "error", msg: "Account not found" });
                    return next();
                }
            });
        } catch (error) {
            res.send({
                "status": "error",
                "msg": "Failed calling API",
                "data": {}
            });
            return next();
        }
    })

    server.post("/services/dmt_instantpay/sendRegOTP", (req, res, next) => {
        let vStatus = validateRule(req.body, {
            mobileNumber: "required"
        })
        if (!vStatus.status) {
            res.send({
                "status": "error",
                "msg": "Input Validation Failed",
                "data": vStatus.errors
            });
            return next();
        }
        try {
            ACCOUNT.getAccountInfoOnMemberNo(req.get("GUID"), function (accountData) {
                console.log("accountData:", accountData);
                if (accountData) {
                    db_selectQ("instantpay_bbps_onboarding", "outlet_id", { guid: req.get("GUID"), status: "completed", blocked: "false" }, {}, function (onboardData, error) {
                        console.log('instantpay_bbps_onboarding, error - ', onboardData, error)
                        if (!onboardData) {
                            res.send({ status: "error", msg: "Merchant not onboarded" });
                            return next();
                        }
                        

                        VENDOR_INSTANTPAY_DMT.sendRemitterRegOTP(req.body.mobileNumber, onboardData[0].outlet_id, function (status, msg, dataObj) {
                            //condition to be write for response and msg
                            console.log("getRemitterProfileDmt", status, msg, dataObj);
                            if (status === true) {
                                res.send({ status: "success", msg: msg, data: dataObj });
                                return next();
                            } else {
                                res.send({ status: "error", msg: msg, data: dataObj || {} });
                                return next();
                            }
                        });
                    });
                }
                else {
                    res.send({ status: "error", msg: "Account not found" });
                    return next();
                }
            });
        } catch (error) {
            res.send({
                "status": "error",
                "msg": "Failed calling API",
                "data": {}
            });
            return next();
        }
    })

    server.post("/services/dmt_instantpay/verifyOTP", (req, res, next) => {
        let vStatus = validateRule(req.body, {
            mobileNumber: "required"
        })
        if (!vStatus.status) {
            res.send({
                "status": "error",
                "msg": "Input Validation Failed",
                "data": vStatus.errors
            });
            return next();
        }
        try {
            ACCOUNT.getAccountInfoOnMemberNo(req.get("GUID"), function (accountData) {
                console.log("accountData:", accountData);
                if (accountData) {
                    db_selectQ("instantpay_bbps_onboarding", "outlet_id", { guid: req.get("GUID"), status: "completed", blocked: "false" }, {}, function (onboardData, error) {
                        console.log('instantpay_bbps_onboarding, error - ', onboardData, error)
                        if (!onboardData) {
                            res.send({ status: "error", msg: "Merchant not onboarded" });
                            return next();
                        }

                        const params = {
                            mobileNo: req.body.mobileNumber,
                            otp: req.body.otp,
                            outletId: onboardData[0].outlet_id
                        }


                        VENDOR_INSTANTPAY_DMT.verifyRegOTP(params, function (status, msg, dataObj) {
                            //condition to be write for response and msg
                            console.log("getRemitterProfileDmt", status, msg, dataObj);
                            if (status === true) {
                                res.send({ status: "success", msg: msg, data: dataObj });
                                return next();
                            } else {
                                res.send({ status: "error", msg: msg, data: dataObj || {} });
                                return next();
                            }
                        });
                    });
                }
                else {
                    res.send({ status: "error", msg: "Account not found" });
                    return next();
                }
            });
        } catch (error) {
            res.send({
                "status": "error",
                "msg": "Failed calling API",
                "data": {}
            });
            return next();
        }
    })



    

}