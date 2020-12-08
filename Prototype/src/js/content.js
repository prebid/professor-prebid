/* global dfjs */
// Extension content.js script, listens for (window) messages from
// injected script, build auction data structure. Also listens for
// (chrome) messages from Popup.js when it runs and responds to it 
// with the auction data it collected so far

var bidRequestedObj = {};

var allBidsDf = new dfjs.DataFrame([]), allAuctionsDf = new dfjs.DataFrame([]), allSlotsDf = new dfjs.DataFrame([]);
var prebidConfig = {};


function myCallBack(response) {
	console.log('PREBID_TOOLS: From BACKGROUND.js = ' + response.msg);
}

function sendMessageToBackground(evt, datum, callback) {
	let data = {
		type: evt,
		obj: datum
	}

	try {
		chrome.runtime.sendMessage(JSON.stringify(data), callback);
	} catch (err) {
		console.log('PREBID_ERROR sendMessageToBackground() ' + err);
	}
}

////////////////////////////////////
// Masks
////////////////////////////////////
function createMask(target, creativeRenderTime) {
	let mask_container_id = "mask_container_" + target;
	if (document.getElementById(mask_container_id)) {
		document.getElementById(mask_container_id).remove();
	}

	// TODO - needs to be tidied up
	let elmt = document.getElementById(target);
	elmt.style.borderWidth = "4px";
	elmt.style.borderColor = "blue";
	elmt.style.borderStyle = "solid";
	elmt.style.fillOpacity = "0.5";
	elmt.style.fill = "orange";
	elmt.style.background = "green";
	elmt.scrollIntoView();

	// desired size
	let elmtStyle = window.getComputedStyle(elmt, null);
	let cWidth = parseInt(elmtStyle.getPropertyValue("width"), 10);
	let cHeight = parseInt(elmtStyle.getPropertyValue("height"), 10);

	// create a mask
	let mask_container = document.createElement("div");
	mask_container.id = mask_container_id;
	mask_container.classList.add("p_overlay");	
	mask_container.style.width = cWidth + "px"; 
	mask_container.style.height = cHeight + "px"; 
	
	let title_elmt = document.createElement("p");
	title_elmt.style.fontSize = "20px";
	title_elmt.style.color = "white";
	title_elmt.style.fontWeight = "bold";
	title_elmt.innerText = target;
	mask_container.appendChild(title_elmt);
	let hr1 = document.createElement("hr");
	hr1.style.margin = "0px";
	mask_container.appendChild(hr1);
	// Main body
	let mask_container_body_id = "mask_container_body_" + target;
	mask_body_elmt = document.createElement('div');
	mask_body_elmt.classList.add('p_overlay_body');
	mask_body_elmt.id = mask_container_body_id;
	mask_container.appendChild(mask_body_elmt);

	// General section
	let general_section_elmt = document.createElement("p");
	general_section_elmt.style.fontSize = "10px";
	general_section_elmt.style.color = "grey";
	general_section_elmt.innerText = 	"\nAd render time - " + creativeRenderTime;
	let hr2 = document.createElement("hr");
	hr2.style.margin = "0px";
	general_section_elmt.appendChild(hr2);
	mask_body_elmt.appendChild(general_section_elmt);

	// Add the mask to the doc
	elmt.parentElement.insertBefore(mask_container, elmt);
}


function updateMask(slotRow, slotBidsDf) {
	let target = slotRow.get('slotElementId');
	let creativeRenderTime = slotRow.get('slotLoadTs') - slotRow.get('slotRenderedTs');
	// TODO get auction time
	createMask(target, creativeRenderTime);

	// do we have a prebid winner?
	slotBidsDf = slotBidsDf.sortBy('rendered', true); // rendered = true will be first
	let winner = slotBidsDf.filter(row => row.get('rendered') == true);
	let prebidRenderedAd = winner.dim()[0] != 0 ? true : false;

	// if we do display them first
	let mask_container_body_id = "mask_container_body_" + target;
	let mask_body_elmt = document.getElementById(mask_container_body_id);
	let body_table = document.createElement('table');
	body_table.style.width = '100%';
	body_table.classList.add('mask_body_table');

	if (prebidRenderedAd) {
		mask_body_elmt.style.background = '#F9FFCB';
	}


	function extractBidderInfo(body, row) {
		let tr = document.createElement('tr');
		let td = document.createElement('td');
		td.style.fontWeight = 'bold';
		td.style.textAlign = 'center';
		td.style.verticalAlign = 'middle';
		td.innerText = row.get('bidder') + (row.get('rendered') ? ' - Auction Winner' : '');
		tr.appendChild(td);
		body.appendChild(tr);
		tr = document.createElement('tr');
		td = document.createElement('td');
		td.style.textAlign = 'center';
		td.style.verticalAlign = 'middle';
		td.innerText = 'Response Time - ' + (row.has('time') && row.get('time') ? row.get('time') + 'ms' : 'N/A');
		tr.appendChild(td);
		body.appendChild(tr);
		tr = document.createElement('tr');
		td = document.createElement('td');
		td.style.textAlign = 'center';
		td.style.verticalAlign = 'middle';
		td.innerText = 'Bid CPM - ' + (row.has('cpm') && row.get('cpm') ? row.get('cpm') : 'No Bid');
		tr.appendChild(td);
		body.appendChild(tr);
		let hr = document.createElement('hr');
		hr.style.borderTop = 'dotted 1px';
		hr.style.margin = '0px'
		body.appendChild(hr);
	}

	mask_body_elmt.appendChild(body_table);
	slotBidsDf.map(row => extractBidderInfo(body_table, row));
}


function updateAllMasks(slotDf = allSlotsDf, slotBidsDf = allBidsDf) {
	function getSlotBids(slotRow, allBids) {
		return allBidsDf.filter(row => row.get('adUnitPath') == slotRow.get('adUnitPath'));
	}
	allSlotsDf.map(row => updateMask(row, getSlotBids(row, slotBidsDf)));
}

function removeMask() {
	const removeElements = (elms) => elms != null ? elms.forEach(el => el.remove()) : null;
	let toRemove = document.querySelectorAll('.p_overlay');
	removeElements(toRemove);
}


////////////////////////////////////
// Chrome Extension Events
////////////////////////////////////
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	// When POPUP becomes active it will send us a message, in response we
	// send back the collected data structures

	let msg = JSON.parse(request);

	if (msg.type == 'POPUP_ACTIVE' || msg.type == 'REFRESH') {
		console.log('PREBID_TOOLS: Sending auction data in response');
		let data = JSON.stringify({
			msg: 'POPUP_ACTIVE_RESPONSE',
			dfs: {
				auction: allAuctionsDf.toCollection(),
				slots: allSlotsDf.toCollection(),
				allBids: allBidsDf.toCollection()
			},
			prebidConfig : JSON.stringify(prebidConfig)
		});
		sendResponse(data);
	} else if (msg.type == 'POPUP_GPTBUTTON') {
		console.log('PREBID_TOOLS: POPUP_GPTBUTTON id=' + msg.obj.target);
		// TODO use auction data 
		console.log('XXXXXXXXXXXXXXXXXX NOT IMPLEMENTED YET');

		sendResponse({
			msg: 'POPUP_GPTBUTTON_RESPONSE'
		});

	} else if (msg.type == 'PROFESSOR_PREBID_ENABLED') {
		if (!msg.obj.isEnabled) {
			removeMask();
		}
		sendResponse({
			msg: 'MASKS_REMOVED'
		});
	} else  {
		console.log('PREBID_TOOLS: UNKNOWN MESSAGE ' + msg);
	}
});


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
					updateMask(slotLoadedDf.getRow(0), slotBidsDf);
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
