// Extension content.js script, listens for (window) messages from
// injected script, build auction data structure. Also listens for
// (chrome) messages from Popup.js when it runs and responds to it 
// with the auction data it collected so far

var auctionObj = {};
var gptObj = {};
var bidRequestedObj = {};

function convertTimestamp(requestTimestamp) {
	let ts = new Date(requestTimestamp);
	let year = ts.getYear() + 1900;
	let mon = ts.getMonth() + 1;
	let day = ts.getUTCDate();
	let h = ts.getHours();
	let m = ts.getMinutes();
	let s = ts.getSeconds();
	let ms = ts.getMilliseconds();

	if (mon < 10) {
		mon = '0' + mon
	}

	if (day < 10) {
		day = '0' + day
	}

	if (h < 10) {
		h = '0' + h
	}

	if (m < 10) {
		m = '0' + m
	}

	if (s < 10) {
		s = '0' + s
	}

	return (`${year}-${mon}-${day} ${h}:${m}:${s}.${ms}`);
}

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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	// When POPUP becomes active it will send us a message, in response we
	// send back the collected data structures

	let msg = JSON.parse(request);

	if (msg.type == 'POPUP_ACTIVE') {
		console.log('PREBID_TOOLS: Sending auction data in response');
		sendResponse({
			auction: JSON.stringify(auctionObj),
			gpt: JSON.stringify(gptObj),
			bidrequested: JSON.stringify(bidRequestedObj)
		});
	} else if (msg.type == 'POPUP_GPTBUTTON') {
		console.log('PREBID_TOOLS: POPUP_GPTBUTTON id=' + msg.obj.target);

		let elmt = document.getElementById(msg.obj.target);
		elmt.style.borderWidth = "4px";
		elmt.style.borderColor = "red";
		elmt.style.borderStyle = "solid";
		elmt.scrollIntoView();

		sendResponse({
			msg: 'POPUP_GPTBUTTON_RESPONSE'
		});

		msg.obj.nottarget.forEach(t => {
			let elmt = document.getElementById(t);
			elmt.style.borderWidth = "0px";
		});
	}
});

window.addEventListener("message", function(event) {
	if (event.source != window) {
		return;
	}

	if (event.data.type && (event.data.type == "AUCTION_END")) {
		console.log('PREBID_TOOLS: Received AUCTION_END event');

		// When we get AUCTION_END from injected script build data structure
		// to be sent to the POPUP script when it activates

		let auctionObjects = JSON.parse(event.data.obj);
		let auctionTimestamp = auctionObjects['auctionTimestamp'];
		let adUnitMapToSlot = auctionObjects['adUnits'];
		let rawData = auctionObjects['rawData'];

		const unique = (value, index, self) => {
			return self.indexOf(value) === index
		};

		let yesBids = Object.keys(auctionObjects['yesBids']);
		let noBids = Object.keys(auctionObjects['noBids']);
		let adUnitArray = yesBids.concat(noBids).filter(unique);
		let wonBids = auctionObjects['wonBids'];
		let bidderRequests = auctionObjects['bidderRequests'];

		bidderRequests.forEach(bidderRequest => {
			bidRequestedObj[bidderRequest.auctionId + '_' + bidderRequest.bidderCode] = bidderRequest;
		});

		var adUnitObj = {};
		var anyAuctionId;

		adUnitArray.forEach(adUnit => {
			var adUnitAry = [];
			//			var anyAuctionId;

			if (typeof auctionObjects['yesBids'][adUnit] !== 'undefined') {
				let yesBids = auctionObjects['yesBids'][adUnit].bids;

				adUnitAry = adUnitAry.concat(yesBids);

				yesBids.forEach(bid => {
					if (typeof bid.auctionId !== 'undefined') {
						anyAuctionId = bid.auctionId;
					}
				});
			}

			if (typeof auctionObjects['noBids'][adUnit] !== 'undefined') {
				let noBids = auctionObjects['noBids'][adUnit].bids;

				adUnitAry = adUnitAry.concat(noBids);

				noBids.forEach(bid => {
					if (typeof bid.auctionId !== 'undefined') {
						anyAuctionId = bid.auctionId;
					}
				});
			}

			adUnitObj[adUnit] = adUnitAry.filter(unique);
			auctionObj[anyAuctionId] = {
				"auctionTimestamp": convertTimestamp(auctionTimestamp),
				"adUnitObj": adUnitObj,
				"adUnitMapToSlot": adUnitMapToSlot
			};
		});

		try { // probably should be if (typeof .....) {}
			auctionObj[anyAuctionId].host = window.location.host;
		} catch (err) {
			console.log('PREBID_ERROR: auctionObj[anyAuctionId].host = window.location.host');
		}
		auctionObj[anyAuctionId].auctionId = anyAuctionId;
	} else if (event.data.type && (event.data.type == "GPT_SLOTRENDERED")) {
		console.log('PREBID_TOOLS: Received GPT_SLOTRENDERED event');

		let gptSlotInfo = JSON.parse(event.data.obj);
		gptObj[gptSlotInfo.slotElementId] = gptSlotInfo;
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