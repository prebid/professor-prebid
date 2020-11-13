// Extension content.js script, listens for (window) messages from
// injected script, build auction data structure. Also listens for
// (chrome) messages from Popup.js when it runs and responds to it 
// with the auction data it collected so far

var auctionObj = {};
var gptObj = {};
var bidRequestedObj = {};

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
		// TODO use auction data 


		const removeElements = (elms) => elms.forEach(el => el.remove());
		let toRemove =  document.querySelectorAll(".p_overlay")
		removeElements(toRemove);

		// TODO - needs to be tidied up
		let elmt = document.getElementById(msg.obj.target);
		elmt.style.borderWidth = "4px";
		elmt.style.borderColor = "blue";
		elmt.style.borderStyle = "solid";
		elmt.style.fillOpacity = "0.5";
		elmt.style.fill = "orange";
		elmt.style.background = "green";
		elmt.scrollIntoView();

		// desired size
//		let ifDestination = $('iframe:first').offset();
//			console.log(ifDestination);
		let elmtStyle = window.getComputedStyle(elmt, null);
		let cWidth = parseInt(elmtStyle.getPropertyValue("width"), 10);
		let cHeight = parseInt(elmtStyle.getPropertyValue("height"), 10);

		// create a mask
		let mask_container = document.createElement("div");
		let mask_container_id = "mask_container_" + msg.obj.target;
		mask_container.id = mask_container_id;
		mask_container.className = "p_overlay";
		mask_container.style.borderWidth = "4px";
		mask_container.style.borderColor = "red"
		mask_container.style.borderStyle = "solid";
		mask_container.style.margin = "0 auto";
		mask_container.style.background = "rgba(100, 100, 200, .75)";
		mask_container.style.zIndex = "99";
		mask_container.style.position = "absolute"; 
		mask_container.style.width = cWidth + "px"; 
		mask_container.style.height = cHeight + "px"; 

		let title_elmt = document.createElement("p");
		title_elmt.style.fontSize = "20px";
		title_elmt.style.color = "white";
		title_elmt.style.fontWeight = "bold";
		title_elmt.innerText = msg.obj.target + "<br/>";
		mask_container.appendChild(title_elmt);
		elmt.parentElement.insertBefore(mask_container, elmt);

		sendResponse({
			msg: 'POPUP_GPTBUTTON_RESPONSE'
		});

		msg.obj.nottarget.forEach(t => {
			let elmt = document.getElementById(t);
			elmt.style.borderWidth = "0px";
		});
	}
});


// data received from injected.js
window.addEventListener("message", function(event) {
	if (event.source != window) {
		return;
	}

	if (event.data.type && (event.data.type == "AUCTION_END")) {
		console.log('PREBID_TOOLS: Received AUCTION_END event');

		// When we get AUCTION_END from injected script build data structure
		// to be sent to the POPUP script when it activates
		if(event.data.dfs) {
			allBidsDf = new dfjs.DataFrame(event.data.dfs['AllBids']);
			console.log('passed all bids df');
			console.log(allBidsDf.toCSV());
			highestCpmBidsDf = new dfjs.DataFrame(event.data.dfs['HighestCpmBids']);
			console.log('passed highest cpm bids df');
			console.log(highestCpmBidsDf.toCSV());
			allWinningBidsDf = new dfjs.DataFrame(event.data.dfs['AllWinningBids']);
			console.log('passed all winning bids df');
			console.log(allWinningBidsDf.toCSV());
		}

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

		adUnitArray.forEach(adUnit => {
			var adUnitAry = [];
			var anyAuctionId;

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
				"auctionTimestamp": moment().format("YYYY-MM-DD HH:mm:ss.SSS", auctionTimestamp),
				"adUnitObj": adUnitObj,
				"adUnitMapToSlot": adUnitMapToSlot
			};
		});
		
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
