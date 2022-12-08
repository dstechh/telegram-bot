const axios = require("axios");
const axiosCookieJarSupport = require("axios-cookiejar-support");
const tough = require("tough-cookie");
const userAgent = require("../lib/user-agent");

module.exports = (options = {}) => {
    let defaultHeaders = {
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "upgrade-insecure-requests": "1",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "Windows",
        "user-agent": userAgent.defaultDesktop
    };

    if (options.userAgent) {
        if (options.userAgent.mobile) {
            Object.assign(defaultHeaders, {
                "user-agent": (options.userAgent.random ? userAgent.randomMobile : userAgent.defaultMobile),
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": "Android",
            });
        } else {
            Object.assign(defaultHeaders, {
                "user-agent": (options.userAgent.random ? userAgent.randomDesktop : userAgent.defaultDesktop),
            })
        }

        delete options["userAgent"];
    }

    if (options.headers) {
        options.headers = {...defaultHeaders, ...options.headers};
    } else {
        options.headers = defaultHeaders;
    }

    const client = axios.create(options);

    axiosCookieJarSupport.wrapper(client);
    client.defaults.jar = new tough.CookieJar();
    client.defaults.withCredentials = true;

    return client;
}