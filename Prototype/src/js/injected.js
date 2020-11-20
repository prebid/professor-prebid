// This script is injected into the original page and is the ONLY
// way to gain access to the JS context of the page (namely pbjs)
// The only way for an injected script to message to the content.js
// script is via window.postMessage()

var do_once_pbjs = 1;
var allBidsDf, bidderDoneDf;
var auctionDf, slotDf;
// TODO do we need this ?
//var slotDf = new pbjs.DataFrame([], ['slotId', 'slotPath', 'size', 'prebidWinnerId']);


// Need to use window.postMessage() to communicate with content.js

function sendMessage(evt, x) {
	console.log('PREBID_TOOLS: sendMessage(' + evt + ')');

	window.postMessage({
		type: evt,
		obj: JSON.stringify(x)
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

function getAllBids(pbjs, ts) {
	let winners = pbjs.getAllWinningBids();
	console.log('num winners at ' + moment().format() + " = " + winners.length)
	let pwinners = pbjs.getAllPrebidWinningBids();
	console.log('num pwinners at ' + moment().format() + " = " + pwinners.length)
	let output = [];
	forEach(pbjs.getBidResponses(), function (code, bid) {
		output.push({
			auction: bid.auctionId,
			adunit: code,
			adId: bid.adId,
			bidder: bid.bidder,
			time: bid.timeToRespond,
			cpm: bid.cpm,
			slotSize: bid.size,
			netRevenue: bid.netRevenue,
			dealId: bid.dealId,
			creativeId: bid.creativeId,
			msg: bid.statusMessage,
			nonRenderedHighestCpm: false,
			rendered: !!winners.find(function (winner) {
				return winner.adId == bid.adId;
			}),
			created: ts,
			modified: ts
		});
	});
	forEach(pbjs.getNoBids && pbjs.getNoBids() || {}, function (code, bid) {
		output.push({
			auction: bid.auctionId,
			adunit: code,
			adId: bid.adId,
			bidder: bid.bidder,
			slotSize: bid.size,
			msg: "no bid",
			nonRenderedHighestCpm: false,
			rendered: false,
			created: ts,
			modified: ts
		});
	});
	return output;
};

// TODO May merge into single df
function getHighestCpmBids(pbjs, ts) {
	let output = [];
	pbjs.getHighestCpmBids().forEach(bid => {
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
			nonRenderedHighestCpm: true,
			rendered: false,
			created: ts,
			modified: ts
		});
	});
	return output;
}

// TODO may merge into single df
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
			created: ts,
			modified: ts
		});
	});
	return output;
}


function checkForPBJS(domFoundTime) {
	if (window.pbjs && window.pbjs.libLoaded && do_once_pbjs == 1) {

		window.pbjs.onEvent('auctionInit', function (data) {
			let ts = Date.now();
			console.log('PREBID_TOOLS: auctionInit ' + moment().format("YYYY-MM-DD HH:mm:ss.SSS", ts));

			let existingRow = auctionDf.find(r => r.auction == data.auctionId)
			if (existingRow) {
				existingRow.set("auctionStart", ts);
			} else {
				auctionDf.push([data.auctionId, ts, null]);
			}
		});

		window.pbjs.onEvent('auctionEnd', function (data) {
			let auctionStartTime = data.timestamp;
			let auctionEndTime = Date.now();
			console.log('PREBID_TOOLS: auctionEnd ' + moment().format("YYYY-MM-DD HH:mm:ss.SSS", auctionEndTime));

			// TODO hmmm 'data' seems to contain all (and more) data that I use from
			// the various other pbjs.get... methods. I guess longer term should look to
			// parse and use 'data' directly

			console.log(data);

			//console.log(window.pbjs.getConfig());

			var adUnitObj = {};

			window.pbjs.adUnits.forEach(e => {
				adUnitObj[e.code] = e.path;
			});

			// Just dump all and won bids
			console.log('PREBID_TOOLS: auctionEnd. Show all the bids for each auction/ad slot');
			displayTable(getAllBids(window.pbjs, domFoundTime), 'No prebid responses');
			console.log('PREBID_TOOLS: auctionEnd . Return the highest bids for each slot that have not been rendered.');
			console.log('this means from one call to the next if the highest bid from the firtst call is actually rendered then the second call will return the 2nd highest bid from that auction.');
			displayTable(getHighestCpmBids(window.pbjs, domFoundTime), 'No prebid winners');
			console.log('PREBID_TOOLS: auctionEnd. Record any (including historic) rendered ads that a pb bidder won.')
			displayTable(getAllWinningBids(window.pbjs, domFoundTime), 'No Prebid Rendered Ads');


			let new_allBidsDf = new dfjs.DataFrame(getAllBids(window.pbjs, domFoundTime));
			let highestCpmBids = new dfjs.DataFrame(getHighestCpmBids(window.pbjs, domFoundTime));
			let allWinningBids = new dfjs.DataFrame(getAllWinningBids(window.pbjs, domFoundTime));

			let auction = auctionDf.findWithIndex(row => row.auction == data.auctionId);
			if (auction) {
				auctionDf.setRowInPlace(auction.index, row => row.set('auctionStart', auctionStartTime).set('auctionEnd', auctionEndTime));
			} else {
				auctionDf.push([data.auctionId, auctionStartTime, auctionEndTime]);
			}		
			console.log('Auction DF');
			console.log(auctionDf.toCSV());

			function createOrUpdateDf(a, b) {
				return a ? a.union(b) : b;
			}
			allBidsDf = createOrUpdateDf(allBidsDf, new_allBidsDf);
			allBidsDf = allBidsDf.join(highestCpmBids.select('auction', 'adunit', 'adId', 'bidder', 'nonRenderedHighestCpm', 'modified').rename({'nonRenderedHighestCpm' :'nonRenderedHighestCpm_2', 'modified' : 'modified_2'}), ['auction', 'adunit', 'adId', 'bidder'], 'outer');
			allBidsDf = allBidsDf.map(row => row.set('nonRenderedHighestCpm', row.get('nonRenderedHighestCpm_2') ? true : false)).drop(['nonRenderedHighestCpm_2', 'modified_2']);
			allBidsDf = allBidsDf.join(allWinningBids.select('auction', 'adunit', 'adId', 'bidder', 'nonRenderedHighestCpm', 'rendered', 'modified').rename({'nonRenderedHighestCpm' : 'nonRenderedHighestCpm_2', 'rendered' : 'rendered_2', 'modified' : 'modified_2'}), ['auction', 'adunit', 'adId', 'bidder'], 'left');
			allBidsDf = allBidsDf.map(row => row.set('nonRenderedHighestCpm', row.get('nonRenderedHighestCpm_2') ? true : false) && row.set('rendered', row.get('rendered_2') ? true : false)).drop(['nonRenderedHighestCpm_2', 'rendered_2', 'modified_2']);
			try {
				allBidsDf = allBidsDf.join(bidderDoneDf, ['auction', 'adunit', 'bidder'], left);
				allBidsDf = allBidsDf.map(row => row.set('time', row.get('time') == undefined ? row.get('responseTime') - auctionStartTime : row.get('time'))).drop(['responseTime']);
			} catch (e) {
				console.log(e);
			}


			let dfs = {};
			dfs['allBids'] = allBidsDf.toCollection();
			dfs['auction'] = auctionDf.toCollection();
			dfs['slots'] = slotDf.toCollection();


			// On auctionEnd, let the content script know it happened
			let response = {
				"auctionTimestamp": Date.now(),
				"adUnits": adUnitObj,
				"bidderRequests": data.bidderRequests,
				"dfs" : dfs
			};
			sendMessage("AUCTION_END", response);
		});

		// won the adserver auction
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


			let r = allBidsDf.findWithIndex(row => row.get('auction') == data.auctionId && row.get('adunit') == data.adUnitCode && row.get('adId') == data.adId && row.get('bidder') == data.bidderCode);
			allBidsDf = allBidsDf.setRow(r.index, row => row.set('rendered', true).set('nonRenderedHighestCpm', false));
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

		window.pbjs.onEvent('bidderDone', function (data) {
			console.log('PREBID_TOOLS: Bidder Done '  + JSON.stringify(data.bidderCode));
			let ts = Date.now();
			function updateBidderDoneDf(doneBid) {
				bidderDoneDf = bidderDoneDf.push([doneBid.auctionId, doneBid.adUnitCode, doneBid.bidder, 'done', ts]);
			}
			data.bids.forEach(doneBid => updateBidderDoneDf(doneBid));
		});

		
		window.pbjs.onEvent('bidTimeout', function (data) {
			// adUnitCode: "/43340684/EGNET_LB_2"
			// auctionId: "69ba022d-d486-45ca-b9b5-d59463130379"
			// bidId: "55dff330955aa37"
			// bidder: "sovrn"
			console.log('PREBID_TOOLS: bidTimeout ' + JSON.stringify(data));
			let ts = Date.now();
			data.bids.forEach(doneBid => bidderDoneDf.push(doneBid.auctionId, doneBid.adUnitCode, doneBid.bidder, 'done', ts));


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
var slotIdHash = {};

// Check for GPT loaded and add listeners to various events when ready

function checkForGPT(domFoundTime) {
	if (window.googletag && window.googletag.pubadsReady && window.googletag.apiReady && do_once_gpt == 1) {
		// fires when a creative is injected into a slot. It will occur before the creative's resources are fetched.
		googletag.pubads().addEventListener('slotRenderEnded', function (event) {
			let targeting = {};
			let ts = Date.now();
			slotIdHash[event.slot.getSlotElementId()] = ts;
			console.log('GPT_TOOLS: SlotRenderEnded slotElementId ' + event.slot.getSlotElementId());
			console.log('GPT_TOOLS: SlotRenderEnded slotId ' + event.slot.getSlotId());
			console.log('GPT_TOOLS: SlotRenderEnded adunitpath ' + event.slot.getAdUnitPath());
			console.log('GPT_TOOLS: SlotRenderEnded ' + JSON.stringify(event));

			event.slot.getTargetingKeys().forEach(k => {
				targeting[k] = event.slot.getTargeting(k);
			});

			console.log('GPT_TOOLS: campaignId=' + event.campaignId + ' lineItemId=' + event.lineItemId + ' advertiserId=' + event.advertiserId);

			let existingRow = slotDf.find(r => r.slotElementId == event.slot.slotElementId && r.adUnitPath == event.slot.getAdUnitPath());
			if (!existingRow) {
				slotDf = slotDf.push([event.slot.getSlotElementId(), event.slot.getAdUnitPath(), ts, null]);
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
			let loadTs = Date.now();
			let creativeRenderTime = loadTs - slotIdHash[event.slot.getSlotElementId()];

			console.log("GPT_TOOLS: (slotOnload_Time - slotRenderEnded_Time)[" + event.slot.getSlotElementId() + "] = " + creativeRenderTime + 'msec');

			slotDf = slotDf.map(row => row.set('slotLoadTs', (row.get('slotElementId') == event.slot.getSlotElementId() &&  row.get('adUnitPath') == event.slot.getAdUnitPath()) ? loadTs : row.get('slotLoadTs')));
			displayTable(slotDf.toCollection());

			let slotBidsDf = allBidsDf.filter(row => row.get('adunit') == event.slot.getAdUnitPath());
//			slotBidsDf = slotBidsDf.join(slotDf, ['adUnitPath']);
			// Remove SlotElementID from hash
			delete slotIdHash[event.slot.getSlotElementId()];

			console.log('GPT_TOOLS: slotOnload ' + JSON.stringify(event));
			let response = {
				slotDf : slotDf.filter(row => row.get('slotElementId') == event.slot.getSlotElementId() && row.get('adUnitPath') == event.slot.getAdUnitPath()).toCollection(),
				bidsDf : slotBidsDf.toCollection()
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

var domFoundTime = Date.now();

console.log('PREBID_TOOLS: Entry ' + moment().format("YYYY-MM-DD HH:mm:ss.SSS", Date.now()));

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
			auctionDf = new dfjs.DataFrame([], ['auction', 'startTime', 'endTime']);
			bidderDoneDf = new dfjs.DataFrame([], ['auction', 'adunit', 'bidder', 'type', 'responseTime']);
			slotDf = new dfjs.DataFrame([], ['slotElementId', 'adUnitPath', 'slotRenderedTs', 'slotLoadTs']);
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

