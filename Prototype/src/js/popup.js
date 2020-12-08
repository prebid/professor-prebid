// This script runs when the extension popup is activated.

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	let msg = JSON.parse(request);

	if (msg.type == 'GPT_VISIBILITY_EVENT') {
		let view = '';

		console.log('GPT_VISIBILITY_EVENT: ' + msg.obj);

		msg.obj.forEach(x => {
			console.log(x);
			view = view.concat('<div>' + x + '</div>');
		});

		document.getElementById('view').innerHTML = view;

		sendResponse({
			msg: 'GPT_VISIBILITY_EVENT_RESPONSE'
		});
	}
});

document.addEventListener('DOMContentLoaded', function () {
	var gResponse;

	// Inform content.js script that we just became active and it will
	// respond with any auction data that might be available

	chrome.storage.local.get(["PP_Enabled"], function (result) {
		isEnabled = result.PP_Enabled;
		let pp_switch = document.getElementById('pp_enabled_switch');
		pp_switch.checked = isEnabled;
	});

  document.getElementById('btn--data-tab').addEventListener('click', openDataTab, false)
	document.getElementById('pp_enabled_switch').addEventListener('click', handleEnableButtonStateChange, false);

	getAllAuctionData()
}, false);


function sendMessage(evt, x) {
	let data = {
		type: evt,
		obj: x
	};

	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, JSON.stringify(data), function (response) {
			console.log('PP_POPUP: sentMessage(' + evt + ' ' + x + ')');
			console.log('PP_POPUP: received response(' + response + ')');

		});
	});
}

function handleEnableButtonStateChange(event) {

	let isEnabled = event.target.checked
	chrome.storage.local.set({ "PP_Enabled": isEnabled }, function () {
		console.log('Value is set to ' + isEnabled);
	});

	sendMessage('PROFESSOR_PREBID_ENABLED', { 'isEnabled': isEnabled });
}


function getAllAuctionData() {
	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
		let data = {
			type: 'POPUP_ACTIVE',
			obj: ''
		};
		// When POPUP is activated, send message, "processResponse()" is a callback that the
		// content.js script populates in response. SO, content.js builds data structures but
		// doesn't do anything until popup activates'
		chrome.tabs.sendMessage(tabs[0].id, JSON.stringify(data), sendDataToBackground);
	});
}

/**
 * openDataTab
 * 
 * opens the "main" html file in a new tab via the background.js script
 */
function openDataTab () {
	chrome.runtime.sendMessage({
		type: 'PROFESSOR_PREBID_OPEN_MAIN'
	})
}

/**
 * sendDataToBackground
 * 
 * sends the data from content.js (via initialiseData) to the background.js script where it gets passed to the main.js script
 */
function sendDataToBackground (data) {
	if (data) {
		chrome.runtime.sendMessage({
			type: 'PROFESSOR_PREBID_AUCTION_DATA',
			payload: data
		})
	}
}