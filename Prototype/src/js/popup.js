// This script runs when the extension popup is activated.

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	let msg = JSON.parse(request);

	if (msg.type == 'GPT_VISIBILITY_EVENT') {
		let view = '';

		console.log('GPT_VISIBILITY_EVENT: ' + msg.obj);

		msg.obj.forEach(x => {
			console.log(x);
			view = view.concat('<div>' + x + '</div>');
		});

		document.getElementById('view').innerHTML = view;

		sendResponse({
			msg: 'GPT_VISIBILITY_EVENT_RESPONSE'
		});
	}
});

document.addEventListener('DOMContentLoaded', function () {
	var gResponse;

	// Inform content.js script that we just became active and it will
	// respond with any auction data that might be available

	chrome.storage.local.get(["PP_Enabled"], function (result) {
		isEnabled = result.PP_Enabled;
		let pp_switch = document.getElementById('pp_enabled_switch');
		pp_switch.checked = isEnabled;
	});

  document.getElementById('btn--data-tab').addEventListener('click', openDataTab, false)
	document.getElementById('pp_enabled_switch').addEventListener('click', handleEnableButtonStateChange, false);

	getAllAuctionData()
}, false);


function sendMessage(evt, x) {
	let data = {
		type: evt,
		obj: x
	};

	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, JSON.stringify(data), function (response) {
			console.log('PP_POPUP: sentMessage(' + evt + ' ' + x + ')');
			console.log('PP_POPUP: received response(' + response + ')');

		});
	});
}

function handleEnableButtonStateChange(event) {

	let isEnabled = event.target.checked
	chrome.storage.local.set({ "PP_Enabled": isEnabled }, function () {
		console.log('Value is set to ' + isEnabled);
	});

	sendMessage('PROFESSOR_PREBID_ENABLED', { 'isEnabled': isEnabled });
}


function getAllAuctionData() {
	chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function (tabs) {
		let data = {
			type: 'POPUP_ACTIVE',
			obj: ''
		};
		// When POPUP is activated, send message, "processResponse()" is a callback that the
		// content.js script populates in response. SO, content.js builds data structures but
		// doesn't do anything until popup activates'
		chrome.tabs.sendMessage(tabs[0].id, JSON.stringify(data), sendDataToBackground);
	});
}

/**
 * openDataTab
 * 
 * opens the "main" html file in a new tab via the background.js script
 */
function openDataTab () {
	chrome.runtime.sendMessage({
		type: 'PROFESSOR_PREBID_OPEN_MAIN'
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
			type: 'PROFESSOR_PREBID_AUCTION_DATA',
			payload: data
		})
	}
}







// ***********************************************
// * OLD
// Some of the below might be useful



function convertTimestamp(requestTimestamp) {
	let ts = new Date(requestTimestamp);
	let h = ts.getHours();
	let m = ts.getMinutes();
	let s = ts.getSeconds();
	let ms = ts.getMilliseconds();

	if (h < 10) {
		h = '0' + h
	}
	if (m < 10) {
		m = '0' + m
	}
	if (s < 10) {
		s = '0' + s
	}

	return (`${h}:${m}:${s}.${ms}`);
}

// This method populated the 3 tabs in the popup. I'm sure there is a much better way
// to build the popup HTML using jquery. This works but hardly elegant nor flexible.

function processResponse(response) {
	gResponse = response;

	var auctionDiv = document.getElementById('auctionDiv');
	var requestDiv = document.getElementById('requestDiv');
	var gptDiv = document.getElementById('gptDiv');

	// Auction Tab

	var tableNumber = 1;
	var tabId = null;

	for (let [auctionId, auctionData] of Object.entries(JSON.parse(response.auction))) {
		console.log('auctionId=' + auctionId);

		const hr = document.createElement('hr');

		let adUnitObj = auctionData.adUnitObj;

		const auctionHeading = document.createElement('div');
		auctionHeading.style = "font-weight:bold";
		auctionHeading.textContent = `AuctionTime: ${auctionData.auctionTimestamp} AuctionID: ${auctionId}`;
		auctionDiv.appendChild(hr);
		auctionDiv.appendChild(auctionHeading);

		for (let [adUnit, value1] of Object.entries(adUnitObj)) {
			console.log('adUnit=' + adUnit);
			console.log(value1);

			const adUnitHeading = document.createElement('div');
			adUnitHeading.style = "font-weight:bold";
			adUnitHeading.textContent = `AdUnitName: ${adUnit}`;
			auctionDiv.appendChild(adUnitHeading);

			const slotHeading = document.createElement('div');
			slotHeading.style = "font-weight:bold";
			let slot = auctionData.adUnitMapToSlot[adUnit];
			slotHeading.textContent = `AdUnitPath: ${slot}`;
			auctionDiv.appendChild(slotHeading);

			const tab = document.createElement('table');
			tab.id = 'table_' + tableNumber;
			auctionDiv.appendChild(tab);

			let r = tab.insertRow(0);
			r.style = "background-color:yellow";

			let c = r.insertCell(0);
			c.innerHTML = 'Bidder';

			c = r.insertCell(1);
			c.innerHTML = 'RequestTimestamp';

			c = r.insertCell(2);
			c.innerHTML = 'TimeToRespond';

			c = r.insertCell(3);
			c.innerHTML = 'Size';

			c = r.insertCell(4);
			c.innerHTML = 'CPM';

			var rowNumber = 1;
			value1.forEach(e => {
				let r = tab.insertRow(rowNumber);
				r.style = "background-color:gainsboro";

				let c = r.insertCell(0);
				c.innerHTML = `${e.bidder}`;

				c = r.insertCell(1);
				if (typeof e.requestTimestamp !== 'undefined') {
					c.innerHTML = convertTimestamp(e.requestTimestamp);
				} else {
					c.innerHTML = "-";
				}

				c = r.insertCell(2);
				if (typeof e.timeToRespond !== 'undefined') {
					c.innerHTML = `${e.timeToRespond}`;
				} else {
					c.innerHTML = "-";
				}

				c = r.insertCell(3);
				if (typeof e.size !== 'undefined') {
					c.innerHTML = `${e.size}`;
				} else {
					c.innerHTML = "-";
				}

				c = r.insertCell(4);
				if (typeof e.cpm !== 'undefined') {
					c.innerHTML = `${e.cpm.toFixed(2)}`;
				} else {
					c.innerHTML = "-";
				}

				rowNumber++;
			});
		}
	}

	// REQUEST Tab

	// This is just a SAMPLE of data that can be displayed, there is lots more in the data structure

	for (let [auctionId, info] of Object.entries(JSON.parse(response.bidrequested))) {
		const hr = document.createElement('hr');

		requestDiv.appendChild(hr);

		let requestHeading = document.createElement('div');
		requestHeading.style = "font-weight:bold";
		requestHeading.textContent = `AuctionID: ${info.auctionId}`;
		requestDiv.appendChild(requestHeading);

		requestHeading = document.createElement('div');
		requestHeading.style = "font-weight:bold";
		requestHeading.textContent = `Bidder: ${info.bidderCode}`;
		requestDiv.appendChild(requestHeading);

		if (typeof info.gdprConsent !== 'undefined') {
			requestHeading = document.createElement('div');
			requestHeading.textContent = `Gdpr Consent String: ${info.gdprConsent.consentString}`;
			requestDiv.appendChild(requestHeading);

			requestHeading = document.createElement('div');
			requestHeading.textContent = `Gdpr Vendor Data Metadata: ${info.gdprConsent.vendorData.metadata}`;
			requestDiv.appendChild(requestHeading);

			requestHeading = document.createElement('div');
			requestHeading.textContent = `Gdpr gdprApplies: ${info.gdprConsent.vendorData.gdprApplies}`;
			requestDiv.appendChild(requestHeading);

			requestHeading = document.createElement('div');
			requestHeading.textContent = `Gdpr hasGlobalScope: ${info.gdprConsent.vendorData.hasGlobalScope}`;
			requestDiv.appendChild(requestHeading);
		} else if (typeof info.uspConsent !== 'undefined') {
			requestHeading = document.createElement('div');
			requestHeading.textContent = `uspConsent: ${info.uspConsent}`;
			requestDiv.appendChild(requestHeading);
		}
	}

	// GPT Tab

	// This is just a SAMPLE of data that can be displayed, there is lots more in the data structure

	function treeListener(idx) {
		var node = document.getElementById('myUL' + idx);
		var toggler = node.getElementsByClassName("caret");
		var i;

		toggler[0].addEventListener("click", function () {
			this.parentElement.querySelector(".nested").classList.toggle("active");
			this.classList.toggle("caret-down");
		});
	}

	var i = 0;
	for (let [slot, info] of Object.entries(JSON.parse(response.gpt))) {
		const hr = document.createElement('hr');

		let gptAdUnitPath = info.adUnitPath;
		let gptSlotElementId = info.slotElementId;

		gptDiv.appendChild(hr);
		let gptButton = document.createElement('button');
		gptButton.innerHTML = "Press To Highlight Ad Slot";
		gptButton.id = gptSlotElementId;
		gptDiv.appendChild(gptButton);
		document.getElementById(gptSlotElementId).addEventListener('click', onclickGptButton, false)

		let gptHeading = document.createElement('div');
		gptHeading.style = "font-weight:bold";
		gptHeading.textContent = `${gptAdUnitPath}`;
		gptDiv.appendChild(gptHeading);

		gptHeading = document.createElement('div');
		gptHeading.style = "font-weight:bold";
		gptHeading.textContent = `${gptSlotElementId}`;
		gptDiv.appendChild(gptHeading);

		let ul0 = document.createElement('ul');
		let ul1 = document.createElement('ul');
		let il = document.createElement('il');
		let span = document.createElement('span');

		ul0.id = "myUL" + i;
		ul1.className = "nested";
		span.className = "caret";
		span.innerHTML = "Targeting KV Pairs";

		gptDiv.appendChild(ul0);
		ul0.appendChild(il);
		il.appendChild(span);
		il.appendChild(ul1);

		for (let [k, v] of Object.entries(info.gptTargeting)) {
			let li = document.createElement('li');
			li.innerHTML = `${k} = ${v}`;
			ul1.appendChild(li);
		}

		treeListener(i);

		i++;
	}
};

function onclickGptButton(event) {
	if (gResponse !== 'undefined') {
		let data = {
			target: event.target.id,
			nottarget: []
		};

		for (let [slot, info] of Object.entries(JSON.parse(gResponse.gpt))) {
			if (info.slotElementId !== event.target.id) {
				data.nottarget.push(info.slotElementId);
			}
		}

		sendMessage('POPUP_GPTBUTTON', data);
	} else {
		console.log('gResponse is undefined');
	}
}

function onclickAuction() {
	var i, tabcontent, tablinks;

	tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

	tablinks = document.getElementsByClassName("tablinks");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}

	document.getElementById('auctionDiv').style.display = "block";
	event.currentTarget.className += " active";
}

function onclickRequest() {
	var i, tabcontent, tablinks;

	tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

	tablinks = document.getElementsByClassName("tablinks");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}

	document.getElementById('requestDiv').style.display = "block";
	event.currentTarget.className += " active";
}

function onclickGpt() {
	var i, tabcontent, tablinks;

	tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

	tablinks = document.getElementsByClassName("tablinks");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}

	document.getElementById('gptDiv').style.display = "block";
	event.currentTarget.className += " active";
}


