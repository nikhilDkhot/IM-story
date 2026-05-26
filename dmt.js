
const msBaseURL = getEnvConfig("instant_pay.msBaseUrl2");
module.exports = {
    getRemitterProfileDmt: function (mobileno, outletId, callback) {
        try {
            const msEnvConfig = getMsEnvConfig("ms_instantpay");
            console.log("getRemitterProfile msEnvConfig:", msEnvConfig);
            let requestParams = {
                method: 'POST',
                url: `${msEnvConfig.DMT_BASE_URL}/fi/remit/out/domestic/v2/remitterProfile`,
                headers: {
                    'Content-Type': msEnvConfig.Content_Type,
                    'X-Ipay-Auth-Code': msEnvConfig.IPAY_AUTH_CODE,
                    'X-Ipay-Client-Id': msEnvConfig.Ipay_Client_Id,
                    'X-Ipay-Client-Secret': msEnvConfig.Ipay_Client_Secret,
                    'X-Ipay-Endpoint-Ip': msEnvConfig.Ipay_Endpoint_Ip,
                    'X-Ipay-Outlet-Id': outletId

                },
                "data": {
                    "mobileNumber": mobileno
                }
            };

            const config = {
                method: 'POST',
                url: msBaseURL + '/services/bbps/generic_api',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'ms-config': JSON.stringify(msEnvConfig)
                },
                data: requestParams
            };
            console.log("getRemitterProfile config", config);
            axios(config).then(function (response) {
                console.log("getRemitterProfile responseData", response.data);
                if (response?.data) {
                    if (response.data?.status == "success") {
                        return callback(true, response.data?.msg, response.data?.data);
                    } else if (response.data?.status == "error" && response.data?.data?.statuscode.toLowerCase() == "rnf") {
                        _CACHE.storeData("instantpay.referenceKey." + outletId, response.data?.data?.data?.referenceKey);
                        return callback(false, response.data?.msg, response.data?.data);
                    }
                } else {
                    return callback(false, "Failed to fetch remitter data");
                }
            }).catch(function (error) {
                console.log("getRemitterProfile catch error", error);
                callback(false, "Failed to fetch", error);
                return;
            });

        } catch (error) {
            console.log("getRemitterProfile catch error", error);
            callback(false, "Failed to fetch", error);
            return;

        }
    },

    // SEND REMITTER REGISTRATION OTP
    sendRemitterRegOTP: function (params, callback) {
        try {
            const vStatus = validateRule(params, {
                mobileNo: 'required',
                outletId: 'required',
                aadhaarNo: 'required',
                //referenceKey: 'required'
            });
            if (!vStatus.status) return callback(false, "Input validation failed");
            _CACHE.fetchData("instantpay.referenceKey." + params.outletId, function (referenceKey) {
                const msEnvConfig = getMsEnvConfig("ms_instantpay");
                console.log("sendRemitterRegOTP msEnvConfig:", msEnvConfig);
                let requestParams = {
                    method: 'POST',
                    url: `${msEnvConfig.DMT_BASE_URL}/fi/remit/out/domestic/v2/remitterRegistration`,
                    headers: {
                        'Content-Type': msEnvConfig.Content_Type,
                        'X-Ipay-Auth-Code': msEnvConfig.IPAY_AUTH_CODE,
                        'X-Ipay-Client-Id': msEnvConfig.Ipay_Client_Id,
                        'X-Ipay-Client-Secret': msEnvConfig.Ipay_Client_Secret,
                        'X-Ipay-Endpoint-Ip': msEnvConfig.Ipay_Endpoint_Ip,
                        'X-Ipay-Outlet-Id': params.outletId

                    },
                    "data": {
                        "mobileNumber": params.mobileNo,
                        encryptedAadhaar: VENDOR_INSTANTPAY_BILLPAY.encryptEas(params.aadhaarNo, msEnvConfig.encryptionKey),
                        referenceKey: referenceKey || ""
                    }
                };
                const config = {
                    method: 'POST',
                    url: msBaseURL + '/services/bbps/generic_api',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'ms-config': JSON.stringify(msEnvConfig)
                    },
                    data: requestParams
                };
                console.log("sendRemitterRegOTP config", config);
                axios(config).then(function (response) {
                    console.log("sendRemitterRegOTP responseData", response.data);
                    if (response?.data?.statuscode?.toUpperCase() == "OTP") {
                        return callback(response.data, response.data.status);
                    } else {
                        return callback(false, response.data?.status);
                    }
                }).catch(function (error) {
                    console.log("sendRemitterRegOTP catch error", error?.response?.data, error?.message);
                    callback(false, error?.response?.data?.status);
                    return;
                });

            })
        } catch (error) {
            console.log("sendRemitterRegOTP catch error2", error);
            callback(false, error);
            return;
        }
    },

    verifyRegOTP: function (params, callback) {
        try {
            const vStatus = validateRule(params, {
                mobileNo: 'required',
                outletId: 'required',
                //referenceKey: 'required',
                otp: 'required'
            });
            if (!vStatus.status) return callback(false, "Input validation failed");
            _CACHE.fetchData("instantpay.referenceKey." + params.outletId, function (referenceKey) {
                const msEnvConfig = getMsEnvConfig("ms_instantpay");
                console.log("verifyRegOTP msEnvConfig:", msEnvConfig);
                let requestParams = {
                    method: 'POST',
                    url: `${msEnvConfig.DMT_BASE_URL}/fi/remit/out/domestic/v2/remitterRegistrationVerification-1`,
                    headers: {
                        'Content-Type': msEnvConfig.Content_Type,
                        'X-Ipay-Auth-Code': msEnvConfig.IPAY_AUTH_CODE,
                        'X-Ipay-Client-Id': msEnvConfig.Ipay_Client_Id,
                        'X-Ipay-Client-Secret': msEnvConfig.Ipay_Client_Secret,
                        'X-Ipay-Endpoint-Ip': msEnvConfig.Ipay_Endpoint_Ip,
                        'X-Ipay-Outlet-Id': params.outletId
                    },
                    "data": {
                        "mobileNumber": params.mobileNo,
                        otp: params.otp,
                        referenceKey: referenceKey || ""
                    }
                };
                const config = {
                    method: 'POST',
                    url: msBaseURL + '/services/bbps/generic_api',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'ms-config': JSON.stringify(msEnvConfig)
                    },
                    data: requestParams
                };
                console.log("verifyRegOTP config", config);
                axios(config).then(function (response) {
                    console.log("verifyRegOTP responseData", response.data);
                    if (response?.data) {
                        return callback(response.data);
                    } else {
                        return callback(false, response.data?.status);
                    }
                }).catch(function (error) {
                    console.log("verifyRegOTP catch error", error?.response?.data, error?.message);
                    callback(false, error?.response?.data?.status);
                    return;
                });
            })

        } catch (error) {
            console.log("verifyRegOTP catch error2", error);
            callback(false, error);

        }
    },

    performRemitterEKYC: function (params, callback) {
        const vStatus = validateRule(params, {
            mobileNo: 'required',
            outletId: 'required',
            referenceKey: 'required',
            geolocation: 'required',
            externalRef: 'required',
            captureType: 'required',
            biometricData: 'required',
        });
        if (!vStatus.status) return callback(false, "Input validation failed");
        const geolocArr = params.geolocation.split(",");
        const msEnvConfig = getMsEnvConfig("ms_instantpay");
        console.log("sendRemitterRegOTP msEnvConfig:", msEnvConfig);
        let requestParams = {
            method: 'POST',
            url: `${msEnvConfig.DMT_BASE_URL}/fi/remit/out/domestic/v2/remitterKyc`,
            headers: {
                'Content-Type': msEnvConfig.Content_Type,
                'X-Ipay-Auth-Code': msEnvConfig.IPAY_AUTH_CODE,
                'X-Ipay-Client-Id': msEnvConfig.Ipay_Client_Id,
                'X-Ipay-Client-Secret': msEnvConfig.Ipay_Client_Secret,
                'X-Ipay-Endpoint-Ip': msEnvConfig.Ipay_Endpoint_Ip,
                'X-Ipay-Outlet-Id': params.outletId

            },
            "data": {
                "mobileNumber": params.mobileNo,
                "referenceKey": params.referenceKey,
                "latitude": geolocArr[0],
                "longitude": geolocArr[1],
                "externalRef": params.tx_ref,
                "consentTaken": "Y",
                "biometricData": params.biometricData
            }
        };

        const config = {
            method: 'POST',
            url: msBaseURL + '/services/bbps/generic_api',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'ms-config': JSON.stringify(msEnvConfig)
            },
            data: requestParams
        };
        console.log("performRemitterEKYC config", config);
        axios(config).then(function (response) {
            console.log("performRemitterEKYC responseData", response.data);
            if (response?.data) {
                return callback(response.data);
            } else {
                return callback(false, response.data?.status);
            }
        }).catch(function (error) {
            console.log("performRemitterEKYC catch error", error?.response?.data, error?.message);
            callback(false, error?.response?.data?.status);
            return;
        });
    }
}