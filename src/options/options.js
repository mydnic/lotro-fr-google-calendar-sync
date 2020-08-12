
function saveOptions() {
    const calendarId = document.getElementById('calendar-id').value;

    chrome.storage.sync.set(
        { calendarId },
        function () {
            const status = document.getElementById('status');
            const oldStatus = status.textContent;
            status.textContent = 'Options saved.';
            setTimeout(() => {
                status.textContent = oldStatus;
            }, 750);
        }
    );
}

function restoreOptions() {
    chrome.storage.sync.get(
        {
            calendarId: '',
        },
        function (items) {
            document.getElementById('calendar-id').value = items.calendarId;
            setDisabledForOptions(false);
        }
    );
}

async function authorize() {
    document.getElementById('auth-error').textContent = '';
    const btn = document.getElementById('grant-access');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Loading...';

    try {
        await utils.getAuthToken(true);
        const hasAccess = await checkGoogleCalendarAccess();
        console.log('has access', hasAccess);
    } catch (error) {
        alert(error)
        document.getElementById('auth-error').textContent = 'Auth error: ' + error.message;
    }

    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = label;
        initialize();
    }, 250);
}

async function initialize() {
    setDisabledForOptions(true);
    const hasAccess = await checkGoogleCalendarAccess();
    if (hasAccess) {
        hideGrantAccessPanel();

        let calendars;
        try {
            const token = await utils.getAuthToken();
            calendars = await getCalendars(token)
            console.log(calendars);
        } catch (error) {
            console.log('error', error);
            showGrantAccessPanel();
            return;
        }

        const calendarsSelect = document.getElementById('calendar-id');
        calendarsSelect.innerHTML = '';

        const selectOption = document.createElement('option');
        selectOption.disabled = true;
        selectOption.selected = true;
        selectOption.innerHTML = 'Select...';

        calendars.forEach(calendar => {
            const option = document.createElement('option');
            option.value = calendar.id;
            option.innerHTML = calendar.summary;
            calendarsSelect.appendChild(option);
        });

        calendarsSelect.value = calendars[0].id;
        console.log(calendarsSelect, calendars[0].id, calendarsSelect.value);
        restoreOptions();
    } else {
        showGrantAccessPanel();
    }
}

async function checkGoogleCalendarAccess() {
    let hasAccess = false;
    try {
        const token = await utils.getAuthToken();
        hasAccess = true;
        chrome.identity.removeCachedAuthToken({ token });
    } catch (error) {
        console.debug(error);
    }
    return hasAccess;
}

async function getCalendars(token) {
    const headers = new Headers({
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    })
    const queryParams = { headers };

    let response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', queryParams)
    let json = await response.json();
    let calendars = json.items
    let calendarList = []

    for (var i = calendars.length; i-- > 0;) {
        var accessRole = calendars[i].accessRole;

        if (accessRole == "owner" || accessRole == "writer") {
            calendarList.push({
                "summary": calendars[i].summary,
                "id": calendars[i].id
            });
        }
    }

    return calendarList
}

function hideGrantAccessPanel() {
    document.getElementById('missing-permission').style.display = 'none';
    document.getElementById('options').style.display = 'block';
}

function showGrantAccessPanel() {
    document.getElementById('missing-permission').style.display = 'block';
    document.getElementById('options').style.display = 'none';
}

function setDisabledForOptions(disabled) {
    document.getElementById('calendar-id').disabled = disabled;
    document.getElementById('save').disabled = disabled;
}

document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('grant-access').addEventListener('click', authorize);

initialize();
