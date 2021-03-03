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

 var auctionBidDataDf;

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

		// join auctions and slots - makes sure we are counting all the bids for which we have known auctions and slots
		const auctionData = allAuctionsDf.join(allSlotsDf, ['slotElementId', 'slotElementId']);
		// join with bids and set global
		auctionBidDataDf = auctionData.join(
			allBidsDf.select(
				'auction', 'adUnitPath', 'slotElementId', 'bidder', 'type', 'bidRequestTime', 'bidResponseTime', 'nonRenderedHighestCpm', 'rendered'), ['auction', 'adUnitPath'],
				'inner',
				false
			)
		// calculate the stats
		let content = createOverviewContent(auctionBidDataDf);
		// Render to popup
		addStatsToPage(content.adsDetected, content.numberOfBidders, content.noBidsRatio);
		addTimeline(content.adLoadRuntime, content.timelineData);
	}
}



////////////////////////////////////
// Now create the page content
////////////////////////////////////
function createOverviewContent(overviewData) {
	if (!overviewData) {
		console.error('getOverviewTabContent was called without data')
		return
	}

	let content = { adsDetected : overviewData.distinct('adUnitPath').count(), 
				numberOfBidders : overviewData.distinct('bidder').count(),
				noBidsRatio : overviewData.filter(r => r.get('type') == 'noBid').distinct('bidder').count() / 
				overviewData.distinct('bidder').count()
			}

	content.timelineData = [0,0,0,0];
	let timelineDataDf = overviewData.select('auction', 'preAuctionStartTime', 'startTime', 'endTime', 'slotRenderedTs', 'slotLoadTs');
	
	if (timelineDataDf.count() > 0) {
		// we need to take the average for each auction and then average those. only the initial auctions pre-auction time is relevant.

		function computeTimelinePerAuction(auctionGroup) {

			let preAuction = auctionGroup.stat.mean('preAuctionStartTime');
			let startTime = auctionGroup.stat.mean('startTime');
			let endTime = auctionGroup.stat.mean('endTime');
			let slotRendered = auctionGroup.stat.mean('slotRenderedTs');
			let slotLoad = auctionGroup.stat.mean('slotLoadTs');
			return new dfjs.DataFrame([[preAuction, startTime, endTime, slotRendered, slotLoad]], ['preAuctionStartTime','startTime', 'endTime', 'slotRenderedTs', 'slotLoadTs']);
		}

		let perAuctionTimelineData = timelineDataDf.groupBy('auction').aggregate(auction => computeTimelinePerAuction(auction));

		let tld = perAuctionTimelineData.reduce((p, n) => p.union(n.get('aggregation')), new dfjs.DataFrame([], ['preAuctionStartTime','startTime', 'endTime', 'slotRenderedTs', 'slotLoadTs']))

		tld = tld.map(r => new dfjs.Row([r.get('startTime') - r.get('preAuctionStartTime'), r.get('endTime') - r.get('startTime'), r.get('slotRenderedTs') - r.get('endTime'), r.get('slotLoadTs') - r.get('slotRenderedTs')], ['preAuction', 'auction', 'adServer', 'render']));
		
		let preAuction =  (tld.filter(r => r.get('preAuction') != 0).stat.mean('preAuction')).toFixed(0);
		let auction =  (tld.stat.mean('auction')).toFixed(0);
		let adServer =  (tld.stat.mean('adServer')).toFixed(0);
		let render =  (tld.stat.mean('render')).toFixed(0);

		content.timelineData = [ preAuction, auction, adServer, render ];
	}
	content.adLoadRuntime = content.timelineData.reduce((p,n) => p + parseInt(n), 0)
	return content;
}


////////////////////////////////////
// Render the page content
////////////////////////////////////
function addStatsToPage(adsDetected, numberOfBidders, noBidsRatio) {
	document.querySelector('[data-slot="ads_detected"]').textContent = adsDetected
	document.querySelector('[data-slot="num_of_bidders"]').textContent = numberOfBidders
	document.querySelector('[data-slot="no_bid_ratio"]').textContent = noBidsRatio
}

function addTimeline(adLoadRuntime, timelineData) {
	// Using ChartJS
	let overviewPageTimelineData = $.extend( true, {}, overviewPageTimelineDataTemplate );
	for (var i = 0; i < 4; i++) {
		overviewPageTimelineData.datasets[i].data = [timelineData[i]];
	}

	let adLoadTimelineTitle = document.getElementById('ad-load-runtime-title');
	adLoadTimelineTitle.innerHTML = 'Ad load runtime - ' + adLoadRuntime + ' ms'

	Chart.plugins.unregister(ChartDataLabels);
	Chart.defaults.global.elements.rectangle.borderWidth = 2;
	let timelineContainer = document.getElementById('timeline-bar-container');
	let canvasElement = document.createElement('canvas');
	canvasElement.style.width = '800px';
	canvasElement.style.height = '100px';
	canvasElement.style.border = 'none';
	timelineContainer.appendChild(canvasElement);

	let overviewTimelineOptions = $.extend( true, {}, options );
	var myBarChart1 = new Chart(canvasElement, {
		type: 'horizontalBar',
		data: overviewPageTimelineData,
		plugins: [ChartDataLabels],
		options: overviewTimelineOptions
	});

}

// /**Chart Data**/
var overviewPageTimelineDataTemplate = {
  labels: [""],
  datasets: [{
    label: 'pre-auction',
    backgroundColor: [
      'rgba(200, 200, 200, 1)'
    ],
    borderWidth: 0
  }, {
    label: 'auction',
    backgroundColor: [
      'rgba(100, 100, 255, 1)'
    ],
    borderWidth: 0
  }, {
    label: 'ad-server',
    backgroundColor: [
      'rgba(255, 255, 100, 1)'
    ],
    borderWidth: 0
  },
  {
    label: 'render',
    backgroundColor: [
      'rgba(200, 50, 50, 1)'
    ],
    borderWidth: 0
  }]
};

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