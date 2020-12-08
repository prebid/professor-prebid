/* global moment, dfjs, pbjs, googletag */
// This script is injected into the original page and is the ONLY
// way to gain access to the JS context of the page (namely pbjs)
// The only way for an injected script to message to the content.js
// script is via window.postMessage()

const bidColumns = ['auction', 'adUnitPath', 'adId', 'bidder', 'time', 'cpm', 'slotSize', 'netRevenue', 'dealId', 'creativeId', 'msg', 'nonRenderedHighestCpm', 'rendered', 		'bidRequestTime', 'bidResponseTime', 'created', 'modified', 'type', 'slotElementId'];
var domFoundTime = Date.now();
var do_once_pbjs = 1;
var allBidsDf, bidderDoneDf;
var auctionDf, slotDf;
var slotBidsBySlotElementId = {}


////////////////////////////////////
// Utility functions
////////////////////////////////////

const replacer = (key, value) => typeof value === 'undefined' ? null : value;

function sendMessage(evt, x) {
	console.log('PREBID_TOOLS: sendMessage(' + evt + ')');

	// Need to use window.postMessage() to communicate with content.js
	window.postMessage({
		type: evt,
		obj: JSON.stringify(x, replacer)
	});
}

// Check for PBJS loaded and add listeners to various events when ready
function displayTable(output, defaultOutput) {
	if (output.length) {
		if (console.table) {
			console.table(output);
		} else {
			for (var j = 0; j < output.length; j++) {
				console.log(output[j]);
			}
		}
	} else {
		console.warn(defaultOutput);
	}
}

function forEach(responses, cb) {
	Object.keys(responses).forEach(function (adUnitCode) {
		var response = responses[adUnitCode];
		response.bids.forEach(function (bid) {
			cb(adUnitCode, bid);
		});
	});
}


////////////////////////////////////
// Extract bid data into dataframes
////////////////////////////////////
function getAllBids(pbjs, ts) {
	let highestCPMBids = pbjs.getHighestCpmBids();
	let winners = pbjs.getAllWinningBids();
	console.log('num winners at ' + moment().format() + " = " + winners.length)
	let pwinners = pbjs.getAllPrebidWinningBids();
	console.log('num pwinners at ' + moment().format() + " = " + pwinners.length)
	let output = [];
	forEach(pbjs.getBidResponses(), function (code, bid) {
		output.push({
			auction: bid.auctionId,
			adUnitPath: code,
			adId: bid.adId,
			bidder: bid.bidder,
			time: bid.timeToRespond,
			cpm: bid.cpm,
			slotSize: bid.size,
			netRevenue: bid.netRevenue,
			dealId: bid.dealId,
			creativeId: bid.creativeId,
			msg: bid.statusMessage,
			nonRenderedHighestCpm: !!highestCPMBids.find(function (winner) {
				return winner.adId == bid.adId;
			}),
			rendered: !!winners.find(function (winner) {
				return winner.adId == bid.adId;
			}),
			bidRequestTime: bid.requestTimestamp,
			bidResponseTime: bid.responseTimestamp,
			created: ts,
			modified: ts,
			type : 'bid',
			slotElementId : undefined
		});
	});
	forEach(pbjs.getNoBids && pbjs.getNoBids() || {}, function (code, bid) {
		output.push({
			auction: bid.auctionId,
			adUnitPath: code,
			adId: bid.adId,
			bidder: bid.bidder,
			slotSize: bid.size,
			msg: "no bid",
			nonRenderedHighestCpm: false,
			rendered: false,
			bidRequestTime: bid.requestTimestamp,
			bidResponseTime: bid.responseTimestamp,
			created: ts,
			modified: ts,
			type : 'noBid',
			slotElementId : undefined
		});
	});
	return output;
};

// TODO For debug
function getHighestCpmBids(pbjs, ts) {
	let output = [];
	pbjs.getHighestCpmBids().forEach(bid => {
		output.push({
			auction: bid.auctionId,
			adUnitPath: bid.adUnitCode,
			adId: bid.adId,
			bidder: bid.bidder,
			time: bid.timeToRespond,
			cpm: bid.cpm,
			slotSize: bid.size,
			netRevenue: bid.netRevenue,
			dealId: bid.dealId,
			creativeId: bid.creativeId,
			nonRenderedHighestCpm: true,
			rendered: false,
			bidRequestTime: bid.requestTimestamp,
			bidResponseTime: bid.responseTimestamp,
			created: ts,
			modified: ts,
			slotElementId : undefined
		});
	});
	return output;
}

// TODO For debug
function getAllWinningBids(pbjs, ts) {
	let output = [];
	pbjs.getAllWinningBids().forEach(bid => {
		output.push({
			auction: bid.auctionId,
			adunit: bid.adUnitCode,
			adId: bid.adId,
			bidder: bid.bidder,
			time: bid.timeToRespond,
			cpm: bid.cpm,
			slotSize: bid.size,
			netRevenue: bid.netRevenue,
			dealId: bid.dealId,
			creativeId: bid.creativeId,
			nonRenderedHighestCpm: false,
			rendered: true,
			bidRequestTime: bid.requestTimestamp,
			bidResponseTime: bid.responseTimestamp,
			created: ts,
			modified: ts,
			slotElementId : undefined
		});
	});
	return output;
}

////////////////////////////////////
// Dataframe utility functions - TODO move
////////////////////////////////////

function updateAuctionDf(auctionId, aup, preAuctionStartTime, auctionStartTime, auctionEndTime = undefined) {
	try {
		auctionDf = auctionDf.push([auctionId, undefined, aup, preAuctionStartTime, auctionStartTime, auctionEndTime]);
	} catch (e) {
		console.log(e)
	}
}

function updateBidderDoneDf(doneBid) {
	let ts = Date.now();
	try {
		bidderDoneDf = bidderDoneDf.push([doneBid.auctionId, doneBid.adUnitCode, doneBid.advertiserId, doneBid.bidder, 'timeout', ts]);
	} catch (e) {
		console.log(e)
	}
}

////////////////////////////////////
// Prebid event handing
////////////////////////////////////
function checkForPBJS(domFoundTime) {
	if (window.pbjs && window.pbjs.libLoaded && do_once_pbjs == 1) {

		window.pbjs.onEvent('auctionInit', function (data) {
			let ts = Date.now();
			console.log('PREBID_TOOLS: auctionInit ' + moment().format("YYYY-MM-DD HH:mm:ss.SSS", ts));

			let existingRows = auctionDf.find(r => r.get('auction') == data.auctionId)
			if (existingRows) {
				console.log('XXXXXXXXXXXXXXXXXXXX Should not happen!!! XXXXXXXXXXXXXXXXXX');
			} else {
				data.adUnitCodes.forEach(aup => updateAuctionDf(data.auctionId, aup, domFoundTime, data.timestamp));
				console.log('XXXXXXXXXXXXXXXXXXXX Could capture bid requests here');
			}
		});

		window.pbjs.onEvent('auctionEnd', function (data) {
			let auctionStartTime = data.timestamp;
			let auctionEndTime = Date.now();
			console.log('PREBID_TOOLS: auctionEnd ' + moment().format("YYYY-MM-DD HH:mm:ss.SSS", auctionEndTime));

			//console.log(window.pbjs.getConfig());

			// Debug - dump all and won bids
			console.log('PREBID_TOOLS: auctionEnd. Show all the bids for each auction/ad slot');
			displayTable(getAllBids(window.pbjs, auctionEndTime), 'No prebid responses');
			console.log('PREBID_TOOLS: auctionEnd . Return the highest bids for each slot that have not been rendered.');
			console.log('this means from one call to the next if the highest bid from the firtst call is actually rendered then the second call will return the 2nd highest bid from that auction.');
			displayTable(getHighestCpmBids(window.pbjs, auctionEndTime), 'No prebid winners');
			console.log('PREBID_TOOLS: auctionEnd. Record any (including historic) rendered ads that a pb bidder won.')
			displayTable(getAllWinningBids(window.pbjs, auctionEndTime), 'No Prebid Rendered Ads');

			// get the new data and merge with existing
			let new_allBidsDf = new dfjs.DataFrame(getAllBids(window.pbjs, auctionEndTime), bidColumns);
			let highestCpmBids = new dfjs.DataFrame(getHighestCpmBids(window.pbjs, auctionEndTime), bidColumns);
			let allWinningBids = new dfjs.DataFrame(getAllWinningBids(window.pbjs, auctionEndTime), bidColumns);

			// TODO need to extract this update into a general df func
			let auction = auctionDf.findWithIndex(row => row.get('auction') == data.auctionId);
			if (auction) {
				auctionDf.setRowInPlace(auction.index, row => row.set('preAuctionStartTime', domFoundTime).set('startTime', auctionStartTime).set('endTime', auctionEndTime));
			} else {
				data.adUnitCodes.forEach(aup => updateAuctionDf(data.auctionId, aup, domFoundTime, auctionStartTime, auctionEndTime));
			}		
			console.log('Auction DF');
			displayTable(auctionDf.toCollection());

			function createOrUpdateDf(a, b) {
				return a ? a.union(b) : b;
			}
			allBidsDf = createOrUpdateDf(allBidsDf, new_allBidsDf);
			// TODO need to extract this update into a general df func
			// Let's mark the highest cpm bids - these can change if a bidder is selected as a winner
			allBidsDf = allBidsDf.join(highestCpmBids.select('auction', 'adUnitPath', 'adId', 'bidder', 'nonRenderedHighestCpm', 'modified').rename({'nonRenderedHighestCpm' :'nonRenderedHighestCpm_2', 'modified' : 'modified_2'}), ['auction', 'adUnitPath', 'adId', 'bidder'], 'outer');
			allBidsDf = allBidsDf.map(row => row.set('nonRenderedHighestCpm', row.get('nonRenderedHighestCpm_2') ? true : false)).drop(['nonRenderedHighestCpm_2', 'modified_2']);
			// Let's mark the ad winners
			allBidsDf = allBidsDf.join(allWinningBids.select('auction', 'adUnitPath', 'adId', 'bidder', 'nonRenderedHighestCpm', 'rendered', 'modified').rename({'nonRenderedHighestCpm' : 'nonRenderedHighestCpm_2', 'rendered' : 'rendered_2', 'modified' : 'modified_2'}), ['auction', 'adUnitPath', 'adId', 'bidder'], 'left');
			allBidsDf = allBidsDf.map(row => row.set('nonRenderedHighestCpm', row.get('nonRenderedHighestCpm_2') ? true : false) && row.set('rendered', row.get('rendered_2') ? true : false)).drop(['nonRenderedHighestCpm_2', 'rendered_2', 'modified_2']);

			// merge in any bidder done data that comes in
			// TODO need to clear this data so not updatad multiple times?
			try {
				allBidsDf = allBidsDf.join(bidderDoneDf, ['auction', 'adUnitPath', 'bidder'], 'left');
				allBidsDf = allBidsDf.map(row => row.set('time', row.get('time') == undefined ? row.get('responseTime') - auctionStartTime : row.get('time'))).drop(['responseTime']);
			} catch (e) {
				console.log(e);
			}

			// Debug
			displayTable(allBidsDf.toCollection(), 'No all bids');

			// On auctionEnd, let the content script know it happened
			let dfs = {};
			dfs['allBids'] = allBidsDf.toCollection();
			dfs['auction'] = auctionDf.toCollection();
			dfs['slots'] = slotDf.toCollection();
			let response = {
				"auctionTimestamp": Date.now(),
				"bidderRequests": data.bidderRequests,
				"dfs" : dfs
			};
			sendMessage("AUCTION_END", response);
		});

		// won the adserver auction
		// capture state change
		window.pbjs.onEvent('bidWon', function (data) {
			console.log('PREBID_TOOLS: bidWon ' + moment().format("YYYY-MM-DD HH:mm:ss.SSS", Date.now()));
			// we want to capture the adId and relate back to wonbids to update it to a adserver win
			console.log('PREBID_TOOLS: bidWon auctionId: ' + data.auctionId);
			console.log('PREBID_TOOLS: bidWon adunit: ' + data.adUnitCode);
			console.log('PREBID_TOOLS: bidWon AdId: ' + data.adId);
			console.log('PREBID_TOOLS: bidWon bidder: ' + data.bidderCode);
			console.log('PREBID_TOOLS: bidWon creativeId: ' + data.creativeId);
			console.log('PREBID_TOOLS: bidWon meta: ' + data.meta);
			console.log(data);


			let r = allBidsDf.findWithIndex(row => row.get('auction') == data.auctionId && row.get('adUnitPath') == data.adUnitCode && row.get('adId') == data.adId && row.get('bidder') == data.bidderCode);
			let ts = Date.now();
			allBidsDf = allBidsDf.setRow(r.index, row => row.set('rendered', true).set('nonRenderedHighestCpm', false).set('modified', ts));
			displayTable(allBidsDf.toCollection())

		});

        /* Log when ad units are added to Prebid */
		window.pbjs.onEvent('addAdUnits', function () {
			console.log('PREBID_TOOLS: Ad units were added to Prebid.');
			console.log(pbjs.adUnits);
		});

		window.pbjs.onEvent('bidResponse', function (data) {
//			console.log('PREBID_TOOLS: Bid Response '  + JSON.stringify(data))
		});

		// update bidderDone with done
		window.pbjs.onEvent('bidderDone', function (data) {
			console.log('PREBID_TOOLS: Bidder Done '  + JSON.stringify(data.bidderCode));
			data.bids.forEach(doneBid => updateBidderDoneDf(doneBid));
		});

		
		// update bidderDone with timeout
		window.pbjs.onEvent('bidTimeout', function (data) {
			console.log('PREBID_TOOLS: bidTimeout ' + JSON.stringify(data));
			data.bids.forEach(doneBid => updateBidderDoneDf(doneBid));
			
			data.forEach(nobid => {
				console.log('PREBID_TOOLS: bidTimeout ' + JSON.stringify(nobid));
			});
		});

		do_once_pbjs = 0;

		console.log('PREBID_TOOLS: PBJS check found: ' + moment().format("YYYY-MM-DD HH:mm:ss.SSS", Date.now()) + ' ' + (Date.now() - domFoundTime) + 'ms');

		return 1;
	} else {
		return 0;
	}
}



var do_once_gpt = 1;
var visibleSlots = new Set();
////////////////////////////////////
// GPT Slot  event handing
////////////////////////////////////
function checkForGPT(domFoundTime) {
	if (window.googletag && window.googletag.pubadsReady && window.googletag.apiReady && do_once_gpt == 1) {
		// fires when a creative is injected into a slot. It will occur before the creative's resources are fetched.
		googletag.pubads().addEventListener('slotRenderEnded', function (event) {
			let ts = Date.now();
			console.log('GPT_TOOLS: SlotRenderEnded slotElementId ' + event.slot.getSlotElementId());
			console.log('GPT_TOOLS: SlotRenderEnded slotId ' + event.slot.getSlotId());
			console.log('GPT_TOOLS: SlotRenderEnded adunitpath ' + event.slot.getAdUnitPath());
			console.log('GPT_TOOLS: SlotRenderEnded ' + JSON.stringify(event));

			let targeting = {};
			event.slot.getTargetingKeys().forEach(k => {
				targeting[k] = event.slot.getTargeting(k);
			});

			console.log('GPT_TOOLS: hb_adid=' + targeting['hb_adid'] + ' campaignId=' + event.campaignId + ' lineItemId=' + event.lineItemId + ' advertiserId=' + event.advertiserId);

			// add it to our slots dataframe
			let existingRow = slotDf.find(r => r.get('slotElementId') == event.slot.getSlotElementId() && r.get('adUnitPath') == event.slot.getAdUnitPath());
			if (!existingRow) {
				slotDf = slotDf.push([event.slot.getSlotElementId(), event.slot.getAdUnitPath(), event.slot.getTargetingMap()['hb_adid'], ts, null]);
			}

			let response = {
				"gptTimestamp": Date.now(),
				"gptTargeting": targeting,
				"adUnitPath": event.slot.getAdUnitPath(),
				"slotElementId": event.slot.getSlotElementId()
			};

			sendMessage("GPT_SLOTRENDERED", response);
		});

		googletag.pubads().addEventListener('slotOnload', function (event) {
			// Is this how GAM computed creative render time?
			console.log('GPT_TOOLS: slotOnload ' + JSON.stringify(event));
			let loadTs = Date.now();
			// update the slot dataframe with the load timestamp
			slotDf = slotDf.map(row => row.set('slotLoadTs', (row.get('slotElementId') == event.slot.getSlotElementId() && row.get('adUnitPath') == event.slot.getAdUnitPath()) ? loadTs : row.get('slotLoadTs')));
			displayTable(slotDf.toCollection());
			
			// we now want to link the bids to this slot. 
			// There is no auction id in the slot event. We could use the adUnitPath but multiple auctions can run on the same adUnit which means it can be difficult to link correctly. However we can use the hb_adid to link to the adid.
			let slotBidsDf = allBidsDf.filter(row => row.get('adUnitPath') == event.slot.getAdUnitPath() && row.get('cpm') != undefined);

			// multiple slots with same adunitpath?
			let adUnitSlots = slotDf.filter(row => row.get('adUnitPath') == event.slot.getAdUnitPath() );
			if (adUnitSlots.count() > 1) {
				// mult auctions for this adUnitPath. find the auction we are looking at from the highest prebid bidder which will have its hb_adid set. We can then identify the slotElementId for these bids
				let bidderWithMatchingTargeting = allBidsDf.filter(row => row.get('adUnitPath') == event.slot.getAdUnitPath() && row.get('adId') == event.slot.getTargetingMap()['hb_adid']);
				let matchingAuction = bidderWithMatchingTargeting.select('auction');
				let thisSlotBids = slotBidsDf.filter(row => row.get('auction') == matchingAuction);
				let thisSlotAuction = thisSlotBids.distinct('auction');
				if (thisSlotAuction.count() > 1) {
					console.error('XXXXXXXXXXXXXXXXXXX Multiple Auctions for same slot with interleaving times?')
					thisSlotAuction.map(a => console.log('Auction ' + a));
				}
				slotBidsBySlotElementId[event.slot.get('slotElementId')] = thisSlotBids;
			}

// 				// should never happen now that we are using hb_adid
// 				console.warn("Uh oh, is hb_adid targeting a single slot?")
// 				// sort by time and for each find the bids that have a response time earlier
// 				// these are these slots bids. remove them from the total and continue
// 				adUnitSlots = adUnitSlots.sortBy('slotRenderedTs');
				
// 				function extractSlotBids(slot) {
// 					let thisSlotBids = slotBidsDf.filter(row => row.get('bidResponseTime') < slot.get('slotRenderedTs'));
// 					let thisSlotAuction = thisSlotBids.distinct('auction');
// 					if (thisSlotAuction.count() > 1) {
// 						console.error('XXXXXXXXXXXXXXXXXXX Multiple Auctions for same slot with interleaving times?')
// 						thisSlotAuction.map(a => console.log('Auction ' + a));
// 					}
// 					slotBidsBySlotElementId[slot.get('slotElementId')] = thisSlotBids;
// //					slot.set('auction', thisSlotAuction.getRow(0).get('auction'));
// 					slotBidsDf = slotBidsDf.diff(thisSlotBids, ['auction'])
// 				}	
// 				adUnitSlots.map(slot => extractSlotBids(slot));
// 				slotBidsDf = slotBidsBySlotElementId[event.slot.getSlotElementId()];
// 			}
			else {
				// we only have one slot for this adUnitPath
				slotBidsBySlotElementId[event.slot.getSlotElementId()] = slotBidsDf;
			}
			// We now have the correct set of bids for this slot 
			slotBidsDf = slotBidsDf.replace(undefined, event.slot.getSlotElementId(), ['slotElementId']);
			console.log('slotbidsdf for ' + event.slot.getSlotElementId());
			displayTable(slotBidsDf.toCollection(), 'no slot bids');
			if (slotBidsDf.count() > 0) {
				// lets update the main dataframes - TODO need a nice utiliy func for this
				allBidsDf = allBidsDf.join(slotBidsDf.select('auction', 'adUnitPath', 'adId', 'bidder', 'slotElementId').rename({'slotElementId' : 'slotElementId2'}), ['auction', 'adUnitPath', 'adId', 'bidder'], 'left')
				allBidsDf = allBidsDf.map(row => row.set('slotElementId', row.get('slotElementId2') ? row.get('slotElementId2') : row.get('slotElementId'))).drop('slotElementId2');

				auctionDf = auctionDf.map(row => row.set('slotElementId', row.get('auction') == slotBidsDf.getRow(0).get('auction') && row.get('adUnitPath') == slotBidsDf.getRow(0).get('adUnitPath')? event.slot.getSlotElementId() : row.get('slotElementId')));

				displayTable(auctionDf.toCollection(), 'no auctions');
				displayTable(allBidsDf.toCollection(), 'no bids');
			}

			// pull out this slot's data and send the response
			let thisSlotDf = slotDf.filter(row => row.get('slotElementId') == event.slot.getSlotElementId() &&  row.get('adUnitPath') == event.slot.getAdUnitPath());
			let response = {
				slotDf : thisSlotDf.toCollection(),
				bidsDf : slotBidsDf.toCollection(),
				auctionDf : auctionDf.filter(row => row.get('slotElementId') == event.slot.getSlotElementId()).toCollection()
			}
			sendMessage('GPT_SLOTLOADED', response, response);
		});

		googletag.pubads().addEventListener('impressionViewable', function (event) {
			console.log('GPT_TOOLS: ImpressionViewable ' + JSON.stringify(event));
		});

		googletag.pubads().addEventListener('slotRequested', function (event) {
			console.log('GPT_TOOLS: SlotRequested ' + JSON.stringify(event));
		});

		googletag.pubads().addEventListener('slotResponse', function (event) {
			console.log('GPT_TOOLS: SlotResponse ' + JSON.stringify(event));
		});

		googletag.pubads().addEventListener('slotVisibilityChanged', function (event) {
			console.log('GPT_TOOLS: SlotVisibilityChanged ' + JSON.stringify(event));

			// Want this to feed the popup but can't message to that directly so this
			// message goes to content.js which then sends to popup.js

			if (event.inViewPercentage > 0) {
				visibleSlots.add(event.slot.getSlotElementId());
			} else {
				visibleSlots.delete(event.slot.getSlotElementId());
			}

			sendMessage('GPT_VISIBILITY_EVENT', Array.from(visibleSlots));
		});
		

		do_once_gpt = 0;

		console.log('PREBID_TOOLS: GPT check found: ' + moment().format("YYYY-MM-DD HH:mm:ss.SSS", Date.now()) + ' ' + (Date.now() - domFoundTime) + 'ms');

		return 1;
	} else {
		return 0;
	}
}


// Set a interval check to see when the PBJS and GPT ojects are loaded and ready


console.log('PREBID_TOOLS: Entry ' + moment().format("YYYY-MM-DD HH:mm:ss.SSS", domFoundTime));

if (checkForPBJS(domFoundTime) == 0) {
	var count_pbjs = 0;
	var timer_pbjs = setInterval(checkForPBJSExists, 10);

	function checkForPBJSExists() {
		if (checkForPBJS(domFoundTime) == 0) {
			if (count_pbjs++ > 1000) {
				clearInterval(timer_pbjs);
				console.log('PREBID_TOOLS: PBJS check failure');
			}
		} else {
			clearInterval(timer_pbjs);
			allBidsDf = new dfjs.DataFrame([], bidColumns);
			auctionDf = new dfjs.DataFrame([], ['auction', 'slotElementId', 'adUnitPath', 'preAuctionStartTime', 'startTime', 'endTime']);
			bidderDoneDf = new dfjs.DataFrame([], ['auction', 'adUnitPath', 'bidder', 'type', 'responseTime']);
			slotDf = new dfjs.DataFrame([], ['slotElementId', 'adUnitPath', 'adId', 'slotRenderedTs', 'slotLoadTs']);
		}
	}
}

if (checkForGPT(domFoundTime) == 0) {
	var count_gpt = 0;
	var timer_gpt = setInterval(checkForGPTExists, 10);

	function checkForGPTExists() {
		if (checkForGPT(domFoundTime) == 0) {
			if (count_gpt++ > 1000) {
				clearInterval(timer_gpt);
				console.log('PREBID_TOOLS: GPT check failure');
			}
		} else {
			clearInterval(timer_gpt);
		}
	}
}

