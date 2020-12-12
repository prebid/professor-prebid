/* global dfjs */
// Extension content.js script, listens for (window) messages from
// injected script, build auction data structure. Also listens for
// (chrome) messages from Popup.js when it runs and responds to it 
// with the auction data it collected so far

const LOG_PREFIX = 'PROFESSOR_PREBID_CONTENT.JS:'
const EVENT_POPUP_ACTIVE = 'PROFESSOR_PREBID_POPUP_ACTIVE'
const EVENT_MASKS_STATE = 'PROFESSOR_PREBID_MASKS_STATE'

var prebidConfig = {};
var bidRequestedObj = {};
var allBidsDf = new dfjs.DataFrame([]),
		allAuctionsDf = new dfjs.DataFrame([]),
		allSlotsDf = new dfjs.DataFrame([]);

chrome.runtime.onMessage.addListener(function(message, _, sendResponse) {
	const messageObj = safelyParseJSON(message)
	const type = messageObj.type
	const payload = messageObj.payload

	if (type === EVENT_POPUP_ACTIVE) {
		console.log(`${LOG_PREFIX} sending auction data to popup`);

		const data = {
			dfs: {
				auction: allAuctionsDf.toCollection(),
				slots: allSlotsDf.toCollection(),
				allBids: allBidsDf.toCollection()
			},
			prebidConfig : JSON.stringify(prebidConfig)
		}
		
		sendResponse(data);
	} else if (type === EVENT_MASKS_STATE) {
		if (payload.isEnabled) {
			showMasks()
			sendResponse('mask overlays visible')
		} else {
			hideMasks();
			sendResponse('mask overlays hidden')
		}
	} else {
		console.log(`${LOG_PREFIX} received unhandled message`, message)
	}
});

/**
 * createMask
 * 
 * create the mask overlays
 */
function createMask(slotRow, slotBidsDf, auctionRow) {
	const targetId = slotRow.get('slotElementId');
	const creativeRenderTime = slotRow.get('slotLoadTs') - slotRow.get('slotRenderedTs');
	const auctionTime = auctionRow.get('endTime') - auctionRow.get('startTime')

	// do we have a prebid winner?
	const sortedSlotBidsDf = slotBidsDf.sortBy('rendered', true); // rendered = true will be first
	const winner = sortedSlotBidsDf.filter(row => row.get('rendered') == true);
	const prebidRenderedAd = winner.dim()[0] ? true : false;

	const maskContainerId = `prpb_mask_container_${targetId}`
	const targetEl = document.getElementById(targetId)
	const maskContainerEl = document.createElement('div')

	// get the size of the ad so it can attached to the mask 
	const targetElStyles = window.getComputedStyle(targetEl);
	const targetWidth = targetElStyles.getPropertyValue('width')
	const targetHeight = targetElStyles.getPropertyValue('height')

	// create the mask
	maskContainerEl.id = maskContainerId
	maskContainerEl.classList.add('prpb-mask__overlay', 'js-prpb-mask');	
	maskContainerEl.style.width = targetWidth; 
	maskContainerEl.style.height = targetHeight; 

	if (prebidRenderedAd) {
		maskContainerEl.classList.add('prpb-mask__overlay--bg-yellow')
	} else {
		maskContainerEl.classList.add('prpb-mask__overlay--bg-blue')
	}
	
	// create the title
	const titleEl = document.createElement('p');
	titleEl.classList.add('prpb-mask__title')
	titleEl.innerText = `${targetId}`;
	
	// create the mask body
	const maskBodyId =  `prpb_mask_body_${targetId}`;
	const maskBodyEl = document.createElement('div');
	maskBodyEl.id = maskBodyId;
	maskBodyEl.classList.add('prpb-mask__overlay-body');
	
	// create the status element
	const statusEl = document.createElement('p')
	statusEl.classList.add('prpb-mask__status')
	statusEl.textContent = `Status - ${prebidRenderedAd ? 'Ad Server Impression' : 'Prebid Impression'}`

	// create the general section
	const generalSectionEl = document.createElement('div');
	generalSectionEl.classList.add('prpb-mask__general-section')
	
	// create the ad render time element
	const adRenderTimeEl = document.createElement('p')
	adRenderTimeEl.textContent = `Ad render time - ${creativeRenderTime}ms`
	
	generalSectionEl.append(adRenderTimeEl)

	if (prebidRenderedAd) {
		// create the winner element
		const winnerEl = document.createElement('div')
		winnerEl.classList.add('prpb-mask__general-section-winner')
		
		// create the winner element's content
		const winnerTitleEl = document.createElement('p')
		const winnerCPMEl = document.createElement('p')
		const auctionTimeEl = document.createElement('p')

		winnerTitleEl.textContent = `Bidder Won - ${winner.get('bidder')}`
		winnerCPMEl.textContent = `Bid win CPM - ${winner.get('cpm')}`
		auctionTimeEl.textContent = `Auction time - ${auctionTime}`

		winnerEl.append(winnerTitleEl, winnerCPMEl, auctionTimeEl)
		generalSectionEl.append(winnerEl)
	}

	const bidderListTitleEl = document.createElement('p')
	bidderListTitleEl.classList.add('prpb-mask__bidder-list-title')
	bidderListTitleEl.textContent = 'Bidders'

	const bidderListEl = document.createElement('ul')
	bidderListEl.classList.add('prpb-mask__bidder-list')

	// create bidder list items
	sortedSlotBidsDf.map(bid => {
		const bidder = bid.get('bidder')
		const responseTime = bid.has('time') ? bid.get('time') : null
		const cpm = bid.has('cpm') ? bid.get('cpm') : null
		const isWinner = bid.get('rendered') ? true : false

		// create the bidder item element
		const itemEl = document.createElement('li')
		itemEl.classList.add('prpb-mask__bidder-list-item')

		// create the bidder item element's content
		const titleEl = document.createElement('p')
		titleEl.classList.add('prpb-mask__bidder_list-item-title')
		const responseTimeEl = document.createElement('p')
		const cpmEl = document.createElement('p')

		titleEl.textContent = `${bidder} ${isWinner ? ' - Auction Winner' : ''}`
		responseTimeEl.textContent = `Response Time - ${responseTime ? `${responseTime}ms` : 'N/A'}`
		cpmEl.textContent = `Bid CPM - ${cpm || 'No bid'}`

		itemEl.append(titleEl, responseTimeEl, cpmEl)
		bidderListEl.append(itemEl)
	})

	maskBodyEl.append(statusEl, generalSectionEl, bidderListTitleEl, bidderListEl);
	maskContainerEl.append(titleEl, maskBodyEl)

	const prevContainerEl = document.getElementById(maskContainerId)

	// insert to DOM
	if (prevContainerEl) {
		prevContainerEl.replaceWith(maskContainerEl)
	} else {
		targetEl.insertBefore(maskContainerEl, targetEl.firstChild);
	}

}

/**
 * hideMasks
 * 
 * traverse all masks on page and hide them by adding a "hidden" class
 */
function hideMasks() {
	const masks = document.querySelectorAll('.js-prpb-mask');
	masks.forEach(mask => {
		mask.classList.add('prpb-mask--hidden')
	})
}

/**
 * showMasks
 * 
 * traverse all masks on page and remove their hidden class
 */
function showMasks() {
	const masks = document.querySelectorAll('.js-prpb-mask');
	masks.forEach(mask => {
		mask.classList.remove('prpb-mask--hidden')
	})
}


////////////////////////////////////
// Handle data from injected.js
////////////////////////////////////
window.addEventListener("message", function(event) {
	if (event.source != window) {
		return;
	}

	if (event.data.type && (event.data.type == "CONFIG_AVAILABLE")) {
		console.log('PREBID_TOOLS: Received CONFIG_AVAILABLE event');
		prebidConfig = JSON.parse(event.data.obj)['prebidConfig'];
		console.log(prebidConfig);
	} else if (event.data.type && (event.data.type == "AUCTION_END")) {
		console.log('PREBID_TOOLS: Received AUCTION_END event');

		// When we get AUCTION_END from injected script build data structure
		// to be sent to the POPUP script when it activates
		let auctionObjects = JSON.parse(event.data.obj);
		if(auctionObjects['dfs']) {
			allBidsDf = new dfjs.DataFrame(auctionObjects['dfs']['allBids']);
			console.log('passed all bids df');
			console.log(allBidsDf.toCSV());
			allAuctionsDf = new dfjs.DataFrame(auctionObjects['dfs']['auction']);
			console.log(allAuctionsDf.toCSV());
			allSlotsDf = new dfjs.DataFrame(auctionObjects['dfs']['slots']);
			console.log(allSlotsDf.toCSV());
		}

		// TODO use this info
		let bidderRequests = auctionObjects['bidderRequests'];
		bidderRequests.forEach(bidderRequest => {
			bidRequestedObj[bidderRequest.auctionId + '_' + bidderRequest.bidderCode] = bidderRequest;
		});
		
	} else if (event.data.type && (event.data.type == "GPT_SLOTRENDERED")) {
		console.log('PREBID_TOOLS: Received GPT_SLOTRENDERED event');
		let gptSlotInfo = JSON.parse(event.data.obj);
		console.log(gptSlotInfo);
		let response = JSON.parse(event.data.obj);
		let auctionDf = new dfjs.DataFrame(response['auctionDf']);
		if (auctionDf.count() > 0) {
			let auctionId = auctionDf.getRow(0).get('auction');
			let adunit = auctionDf.getRow(0).get('adUnitPath');
			let slotElementId = response['slotElementId'];
			let auction = allAuctionsDf.findWithIndex(row => row.get('auction') == auctionId && row.get('adUnitPath') == adunit);
			if (auction) {
				allAuctionsDf.setRowInPlace(auction.index, row => row.set('slotElementId', slotElementId));
			} else {
				console.warn("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX This shouldn't happen !");
			}		
		}
	} else if (event.data.type && (event.data.type == "GPT_SLOTLOADED")) {
		console.log('PREBID_TOOLS: Received GPT_SLOTLOADED event');
		let gptSlotInfo = JSON.parse(event.data.obj);
		console.log(gptSlotInfo);
		chrome.storage.local.get(["PP_Enabled"], function(result) {
			if (result.PP_Enabled) {
				let response = JSON.parse(event.data.obj);
				let slotLoadedDf = new dfjs.DataFrame(response['slotDf']);
				let auctionDf = new dfjs.DataFrame(response['auctionDf']);
				let slotBidsDf = new dfjs.DataFrame(response['bidsDf']);
				allSlotsDf = allSlotsDf ? allSlotsDf.join(slotLoadedDf, ['slotElementId', 'adUnitPath'], 'outer') : slotLoadedDf;

				allBidsDf = allBidsDf ? allBidsDf.diff(slotBidsDf, ['auction', 'adUnitPath', 'adId', 'bidder']).join(slotBidsDf, ['auction', 'adUnitPath', 'adId', 'bidder'], 'outer') : slotBidsDf;
				
				if (auctionDf.count() > 0) {
					let auctionId = auctionDf.getRow(0).get('auction');
					let adunit = auctionDf.getRow(0).get('adUnitPath');
					let slotElementId = slotLoadedDf.getRow(0).get('slotElementId');
					let auction = allAuctionsDf.findWithIndex(row => row.get('auction') == auctionId && row.get('adUnitPath') == adunit && row.get('slotElementId') == undefined);
					if (auction) {
						allAuctionsDf.setRowInPlace(auction.index, row => row.set('slotElementId', slotElementId));
					} else {
						console.warn("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX This shouldn't happen !");
					}		
					createMask(slotLoadedDf.getRow(0), slotBidsDf, auctionDf.getRow(0));
				}
			}
		});

	} else if (event.data.type && (event.data.type == "GPT_VISIBILITY_EVENT")) {
		console.log('PREBID_TOOLS: Received GPT_VISIBILITY_EVENT event');

		try {
			let myObj = JSON.parse(event.data.obj);

			let data = {
				type: 'GPT_VISIBILITY_EVENT',
				obj: myObj
			}

			chrome.runtime.sendMessage(JSON.stringify(data), function(response) {
				console.log('PREBID_TOOLS: content.js GPT_VISIBILITY_EVENT = ' + response);
			});
		} catch (err) {
			console.log('PREBID_ERROR = ' + err);
		}
	}
}, false);

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