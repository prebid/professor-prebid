/* global dfjs */
// This script runs when the extension popup is activated.

const LOG_PREFIX = 'PP_POPUP:'
const SWITCH_STORAGE_KEY = 'PP_Enabled'
const EVENT_POPUP_ACTIVE = 'PROFESSOR_PREBID_POPUP_ACTIVE'
const EVENT_MASKS_STATE = 'PROFESSOR_PREBID_MASKS_STATE'
const EVENT_OPEN_MAIN_PAGE = 'PROFESSOR_PREBID_OPEN_MAIN'
const EVENT_SEND_DATA_TO_BACKGROUND = 'PROFESSOR_PREBID_AUCTION_DATA'
const EVENT_RECEIEVED_AUCTION_DATA = 'PROFESSOR_PREBID_AUCTION_DATA_FROM_CONTENT'

chrome.runtime.onMessage.addListener(function (request, _, sendResponse) {
	const msg = safelyParseJSON(request);
	const type = msg.type
	const payload = msg.payload

	// handle auction data even when the popup is already open
	// this makes sure that the popup is always updated with latest values
	if (type === EVENT_RECEIEVED_AUCTION_DATA) {
		handleAuctionData(payload)
	}

	sendResponse()
});

document.addEventListener('DOMContentLoaded', function () {
	chrome.storage.local.get([SWITCH_STORAGE_KEY], function (result) {
		const isEnabled = result[SWITCH_STORAGE_KEY];
		const switchEl = document.getElementById('pp_enabled_switch');
		switchEl.checked = isEnabled;
	});
	
  document.getElementById('bidder-stats').addEventListener('click', openDataTab, false)
  document.getElementById('timeline').addEventListener('click', openDataTab, false)
  document.getElementById('config').addEventListener('click', openDataTab, false)
	document.getElementById('open_console').addEventListener('click', handleEnableButtonStateChange, false);
	
	// talk with content.js
	getAllAuctionData()
}, false);

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

		chrome.tabs.sendMessage(tabs[0].id, data, handleAuctionData);
	});
}

/**
 * openDataTab
 * 
 * opens the "main" html file in a new tab via the background.js script
 */
function openDataTab (e) {
	chrome.runtime.sendMessage({
		type: EVENT_OPEN_MAIN_PAGE,
		payload: e.currentTarget.id
	})
}

/**
 * handleAuctionData
 * 
 * 1. create the popup's ui
 * 2. sends the data from content.js (via initialiseData) to the background.js script where it gets passed to the main.js script
 */
function handleAuctionData (data) {
	if (data) {
		createPopupUI(data)

		// send to background
		chrome.runtime.sendMessage({
			type: EVENT_SEND_DATA_TO_BACKGROUND,
			payload: data
		})
	}
}

/**
 * popup UI
 * 
 */

function handleEnableButtonStateChange() {
	const checkbox = document.getElementById('pp_enabled_switch')
	const isEnabled = !checkbox.checked
	checkbox.checked = isEnabled
	
	chrome.storage.local.set({ [SWITCH_STORAGE_KEY]: isEnabled }, function () {
		console.log(`${LOG_PREFIX} switch button state changed to: `, isEnabled);
	});
	
	sendMessageToActiveWindow(EVENT_MASKS_STATE, { isEnabled });
}

function createPopupUI (data) {
	if (data.dfs) {
		const allBidsDf = new dfjs.DataFrame(data['dfs']['allBids']); 
		const allAuctionsDf = new dfjs.DataFrame(data['dfs']['auction']);
		const allSlotsDf = new dfjs.DataFrame(data['dfs']['slots']);

		// join auctions and slots
		const auctionData = allAuctionsDf.join(allSlotsDf, ['slotElementId', 'adUnitPath']);
		// join with bids and set global
		const auctionBidDataDf = auctionData.join(
			allBidsDf.select(
				'auction', 'adUnitPath', 'slotElementId', 'bidder', 'type', 'bidRequestTime', 'bidResponseTime', 'nonRenderedHighestCpm', 'rendered'), ['auction', 'adUnitPath'],
				'inner',
				false
			)
		// calculate the stats
		let res = auctionBidDataDf.groupBy('auction', 'adUnitPath')
			.aggregate(g => 
				[
					g.filter(r => r.get('type') == 'noBid').distinct('bidder').count(), 
					g.filter(r => r.get('type') == 'bid').distinct('bidder').count(), 
					g.distinct('adUnitPath').count(), 
					g.distinct('bidder').count()
				]
			)
			.rename('aggregation', 'bidStats');
		// collect all the data for the popup
		res = res.join(auctionData, ['auction', 'adUnitPath']);

		createStatsUI(res)
		createTimelineUI(res)
	}
}

function createStatsUI (data) {
	const adsDetected = data.groupBy('adUnitPath').aggregate(g => g.count()).count()
	const numberOfBidders = '0' // TODO -> get get average from data
	const noBidsRatio = '0/0' // TODO -> get average from data

	document.querySelector('[data-slot="ads_detected"]').textContent = adsDetected
	document.querySelector('[data-slot="num_of_bidders"]').textContent = numberOfBidders
	document.querySelector('[data-slot="no_bid_ratio"]').textContent = noBidsRatio

}

function createTimelineUI (data) {
	// TODO -> get real values
	const preAuctionTime = 103 
	const auctionTime = 567
	const adServerTime = 212
	const total = preAuctionTime + auctionTime + adServerTime

	const preAuction = document.querySelector('#timeline-section__pre-auction')
	const auction = document.querySelector('#timeline-section__auction')
	const adServer = document.querySelector('#timeline-section__ad-server')

	const getPercentage = (v) => 100 * (v / total)

	preAuction.style.width = `${getPercentage(preAuctionTime)}%`
	auction.style.width = `${getPercentage(auctionTime)}%`
	adServer.style.width = `${getPercentage(adServerTime)}%`

	preAuction.querySelector('.bar-value').textContent = `${preAuctionTime}ms`
	auction.querySelector('.bar-value').textContent = `${auctionTime}ms`
	adServer.querySelector('.bar-value').textContent = `${adServerTime}ms`

	document.querySelector('#ad-load-runtime-title > span').textContent = `${total}ms`
}

/**
 * Utils
 */

function safelyParseJSON (data) {
	if (typeof data === 'object') { return data }

	try {
		return JSON.parse(data)
	} catch (e) {
		console.error(`${LOG_PREFIX}.safelyParseJSON failed with data `, data)
		return {}
	}
}