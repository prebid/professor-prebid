// This script runs when the extension popup is activated.

const LOG_PREFIX = 'PP_POPUP:'
const SWITCH_STORAGE_KEY = 'PP_Enabled'
const EVENT_POPUP_ACTIVE = 'PROFESSOR_PREBID_POPUP_ACTIVE'
const EVENT_MASKS_STATE = 'PROFESSOR_PREBID_MASKS_STATE'
const EVENT_OPEN_MAIN_PAGE = 'PROFESSOR_PREBID_OPEN_MAIN'
const EVENT_SEND_DATA_TO_BACKGROUND = 'PROFESSOR_PREBID_AUCTION_DATA'
const EVENT_GPT_VISIBILITY_EVENT = 'GPT_VISIBILITY_EVENT'

chrome.runtime.onMessage.addListener(function (request) {
	const msg = JSON.parse(request);

	if (msg.type === EVENT_GPT_VISIBILITY_EVENT) {
		console.log(`${LOG_PREFIX} GPT_VISIBILITY_EVENT:`, msg.obj);

		let view = ''
		msg.obj.forEach(x => {
			view += `<div>${x}</div>`
		});

		document.getElementById('view').innerHTML = view;
	}
});

document.addEventListener('DOMContentLoaded', function () {
	chrome.storage.local.get([SWITCH_STORAGE_KEY], function (result) {
		const isEnabled = result[SWITCH_STORAGE_KEY];
		const switchEl = document.getElementById('pp_enabled_switch');
		switchEl.checked = isEnabled;
	});
	
  document.getElementById('btn--data-tab').addEventListener('click', openDataTab, false)
	document.getElementById('pp_enabled_switch').addEventListener('click', handleEnableButtonStateChange, false);
	
	// talk with content.js
	getAllAuctionData()
}, false);

function handleEnableButtonStateChange(event) {
	const isEnabled = event.target.checked
	chrome.storage.local.set({ SWITCH_STORAGE_KEY: isEnabled }, function () {
		console.log(`${LOG_PREFIX} switch button state changed to: `, isEnabled);
	});

	sendMessageToActiveWindow(EVENT_MASKS_STATE, { isEnabled });
}

/**
 * sendMessageToActiveWindow
 * 
 * sends a message to the active page
 */
function sendMessageToActiveWindow(type, payload) {
	const data = {
		type,
		payload
	};

	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, JSON.stringify(data), function (response) {
			console.log(`${LOG_PREFIX} sendMessage:`, type, data);
			console.log(`${LOG_PREFIX} received response: `, response);
		});
	});
}

/**
 * getAllAuctionData
 * 
 * request data from content.js and sends it to the background
 */
function getAllAuctionData() {
	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
		const data = {
			type: EVENT_POPUP_ACTIVE,
		}

		chrome.tabs.sendMessage(tabs[0].id, data, sendDataToBackground);
	});
}

/**
 * openDataTab
 * 
 * opens the "main" html file in a new tab via the background.js script
 */
function openDataTab () {
	chrome.runtime.sendMessage({
		type: EVENT_OPEN_MAIN_PAGE
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
			type: EVENT_SEND_DATA_TO_BACKGROUND,
			payload: data
		})
	}
}