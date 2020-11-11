// Extension content.js script, listens for (window) messages from
// injected script, build auction data structure. Also listens for
// (chrome) messages from Popup.js when it runs and responds to it 
// with the auction data it collected so far

var auctionObj = {};
var gptObj = {};
var bidRequestedObj = {};

function convertTimestamp(requestTimestamp) {
	let ts = new Date(requestTimestamp);
	let year = ts.getFullYear() + 1900;
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

		const removeElements = (elms) => elms.forEach(el => el.remove());
		let toRemove =  document.querySelectorAll(".p_overlay")
		removeElements(toRemove);

		// for debugging
		let elmt = document.getElementById(msg.obj.target);
		elmt.style.borderWidth = "4px";
		elmt.style.borderColor = "blue";
		elmt.style.borderStyle = "solid";
		elmt.style.fillOpacity = "0.5";
		elmt.style.fill = "orange";
		elmt.style.background = "green";
		elmt.scrollIntoView();

		// desired size
	
		let iframe_elmt = elmt.querySelector("iframe");
		// let cssObj = window.getComputedStyle(elmt, null);
		// let txt="";
		// for (let i = 0; i < cssObj.length; i++) {
		// 	let cssObjProp = cssObj.item(i)
		// 	let prop = cssObjProp + " = " + cssObj.getPropertyValue(cssObjProp)
    	// 	txt += prop + "\n";
		// }
		// console.log(txt);
		
		let cWidth = 0;
		let cHeight = 0;
		if (iframe_elmt) {
			let ifDestination = $('iframe:first').offset();
//			console.log(ifDestination);
			let elmtStyle = window.getComputedStyle(elmt, null);
			cWidth = parseInt(elmtStyle.getPropertyValue("width"), 10);
			cHeight = parseInt(elmtStyle.getPropertyValue("height"), 10);
			// elmtStyle = window.getComputedStyle(elmt.parentElement, null);
			// cWidth = parseInt(elmtStyle.getPropertyValue("width"), 10);
			// cHeight = parseInt(elmtStyle.getPropertyValue("height"), 10);
		}

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
				"auctionTimestamp": convertTimestamp(auctionTimestamp),
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
