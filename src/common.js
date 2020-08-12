window.utils = {
    getAuthToken: interactive => {
        return new Promise((resolve, reject) =>
            chrome.identity.getAuthToken({ interactive }, token => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(token);
                }
            })
        );
    }
};

window.parseDate = function (input, format) {
    var parts = input.match(/(\d+)/g),
        i = 0, fmt = {};
    // extract date-part indexes from the format
    format.replace(/(yyyy|dd|mm|hh|ii|ss)/g, function (part) { fmt[part] = i++; });

    return new Date(parts[fmt['yyyy']], parts[fmt['mm']] - 1, parts[fmt['dd']], parts[fmt['hh']], parts[fmt['ii']], parts[fmt['ss']]);
}
