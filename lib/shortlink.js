const axios = require("axios");
const { isValidUrl } = require("../utils");


module.exports = (url) => {
    if (!isValidUrl(url)) {
        return null;
    }

    return new Promise(resolve => {
        axios.get(`https://tinyurl.com/api-create.php?url=${url}`)
             .then(response => {
                const result = response.data;
                resolve(isValidUrl(result) ? result : null);
            })
                .catch(error => resolve(null))
    })
}