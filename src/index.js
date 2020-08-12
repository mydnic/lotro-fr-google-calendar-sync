const raids = $('table.caltab .raid')

const monthStart = parseDate($('table.caltab td.day:not(.nextmonth)').first().find('.calday').attr('day') + ' 00:00:00', 'dd.mm.yyyy hh:ii:ss')
const monthEnd = parseDate($('table.caltab td.day:not(.nextmonth)').last().find('.calday').attr('day') + ' 00:00:00', 'dd.mm.yyyy hh:ii:ss')

chrome.storage.sync.get(['calendarId'], function (result) {
    calendarId = result.calendarId

    if (calendarId) {
        getEvents()
    } else {
        console.log("Aucun calendrier n'a été séléctionné. Veuillez vous rendre dans les options de l'extension");
    }
});

function getEvents() {
    chrome.runtime.sendMessage({
        type: 'GET_EVENTS', parameters: {
            timeMin: monthStart,
            timeMax: monthEnd
        }
    }, resp => {
        if (resp) {
            checkForEventsToDelete(resp, raids)
            raids.each(function () {
                if ($(this).find('img').attr('src') === '/img/rp/raid0.png') { // If raid is confirmed
                    const date = $(this).parent().find('.calday').attr('day')
                    const url = $(this).find('a').attr('href')
                    const infos = $(this).attr('title').split("\n")
                    const startAt = infos[2].slice(12, 20)
                    const endAt = infos[3].slice(6, 14)

                    let created = false
                    resp.forEach(gCalEvent => {
                        if (gCalEvent.description && gCalEvent.description.includes(url)) {
                            created = true
                        }
                    });
                    if (!created) {
                        createRaid({
                            date, url, infos, startAt, endAt
                        })
                    }
                }
            })
        }
    })
}

function createRaid(parameters) {
    chrome.runtime.sendMessage({
        type: 'CREATE_EVENT', parameters
    }, resp => {
        console.log('Event created in google calendar');
    })
}

function deleteEvent(event) {
    chrome.runtime.sendMessage({
        type: 'DELETE_EVENT', parameters: { event }
    }, resp => {
        console.log('Event deleted from google calendar');
    })
}

function checkForEventsToDelete(gCalEvents, raids) {
    gCalEvents.forEach(gCalEvent => {
        if (gCalEvent.description && gCalEvent.description.includes('/rp/raid-') && gCalEvent.description.includes('--- NE PAS SUPPRIMER ---')) {
            // this google calendar event is a raid

            raids.each(function () {
                const confirmed = $(this).find('img').attr('src') === '/img/rp/raid0.png'
                const raidUrl = $(this).find('a').attr('href')

                if (gCalEvent.description.includes(raidUrl) && !confirmed) {
                    deleteEvent(gCalEvent)
                }
            })

        }
    })
}
