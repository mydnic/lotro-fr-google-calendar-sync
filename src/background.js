chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    let calendarId;
    chrome.storage.sync.get(['calendarId'], function (result) {
        calendarId = result.calendarId
    });


    if (request.type == "GET_EVENTS") {
        chrome.identity.getAuthToken({}, authToken => {
            if (chrome.runtime.lastError) {
                sendResponse();
            } else {
                const headers = new Headers({
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'application/json; charset=utf-8',
                })
                const queryParams = {
                    method: 'GET',
                    headers,
                };
                var url = new URL('https://www.googleapis.com/calendar/v3/calendars/' + calendarId + '/events')
                var params = request.parameters
                url.search = new URLSearchParams(params).toString();
                fetch(url, queryParams)
                    .then((response) => response.json())
                    .then(data => {
                        sendResponse(data.items)
                    })
            }
        })
        return true

    } else if (request.type == "CREATE_EVENT") {
        console.log('received CREATE_EVENT');
        chrome.identity.getAuthToken({}, authToken => {
            if (chrome.runtime.lastError) {
                sendResponse();
            } else {
                const headers = new Headers({
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'application/json; charset=utf-8',
                })
                var url = 'https://www.googleapis.com/calendar/v3/calendars/' + calendarId + '/events'
                const queryParams = {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(makeEventData(request.parameters)),
                };
                fetch(url, queryParams)
                    .then(data => {
                        sendResponse(data)
                    })
            }
        })
        return true
    } else if (request.type == "DELETE_EVENT") {
        console.log('received DELETE_EVENT');
        chrome.identity.getAuthToken({}, authToken => {
            if (chrome.runtime.lastError) {
                sendResponse();
            } else {
                const eventId = request.parameters.event.id
                const headers = new Headers({
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'application/json; charset=utf-8',
                })
                var url = 'https://www.googleapis.com/calendar/v3/calendars/' + calendarId + '/events/' + eventId
                const queryParams = {
                    method: 'DELETE',
                    headers,
                };
                console.log(url, request.parameters);
                fetch(url, queryParams)
                    .then((response) => response.json())
                    .then(data => {
                        sendResponse(data)
                    })
            }
        })
        return true
    }

});


function makeEventData(parameters) {
    let description = parameters.infos.slice(0, 6).join("\n").replace('~', "\n").replace('</span><br>', "\n").replace('</span><br>', "\n").replace(/<\/?[^>]+(>|$)/g, "")
    description += "\n"
    description += "\n"
    description += "\n"
    description += "--- NE PAS SUPPRIMER ---"
    description += "\n"
    description += parameters.url

    console.log(description);
    return {
        'summary': 'Raid: ' + parameters.infos[0].split('~')[0],
        'description': description,
        'start': {
            'dateTime': parseDate(parameters.date + ' ' + parameters.startAt, 'dd.mm.yyyy hh:ii:ss'),
        },
        'end': {
            'dateTime': parseDate(parameters.date + ' ' + parameters.endAt, 'dd.mm.yyyy hh:ii:ss'),
        }
    }
}

