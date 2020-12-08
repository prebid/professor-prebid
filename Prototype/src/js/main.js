/* global dfjs, $, overviewPageTimelineData, Chart, ChartDataLabels, options */
var allBidsDf, allAuctionsDf, allSlotsDf;
var auctionTimelineData = {};

const EVENT_MAIN_PAGE_REQUEST_DATA = 'PROFESSOR_PREBID_MAIN_PAGE_REQUEST_DATA'

document.addEventListener('DOMContentLoaded', function () {
	console.log('asking data from background.js')
	chrome.runtime.sendMessage({ type: EVENT_MAIN_PAGE_REQUEST_DATA }, pipe(initialiseData, getOverviewTabContent))
}, false);

// allow us to curry functions
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

// For Debug
function displayTable(output, defaultOutput = 'n/a') {
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

function initialiseData(response) {
	if (response) {
		console.log(response);
		let responseData = JSON.parse(response);
		if (responseData['dfs']) {
			allBidsDf = new dfjs.DataFrame(responseData['dfs']['allBids']);
			console.log('passed all bids df');
			console.log(allBidsDf.toCSV());
			allAuctionsDf = new dfjs.DataFrame(responseData['dfs']['auction']);
			console.log(allAuctionsDf.toCSV());
			allSlotsDf = new dfjs.DataFrame(responseData['dfs']['slots']);
			console.log(allSlotsDf.toCSV());
		}

		function collectAuctionData(bids, auctionGroupedDf) {

			function collectAuctionSlotData(group) {

				let auctionId = group.getRow(0).get('auction');
				// join auctions and slots
				let auctionData = group.join(allSlotsDf, ['slotElementId', 'adUnitPath']);
				// join with bids
				let auctionBidData = auctionData.join(bids.select('auction', 'adUnitPath', 'slotElementId', 'bidder', 'type'), ['auction', 'adUnitPath'], 'inner', shouldDropDuplicates = false)
				// calculate the stats
				let res = auctionBidData.groupBy('auction', 'adUnitPath').aggregate(g => [g.filter(r => r.get('type') == 'noBid').distinct('bidder').count(), g.filter(r => r.get('type') == 'bid').distinct('bidder').count(), g.distinct('adUnitPath').count(), g.distinct('bidder').count()]).rename('aggregation', 'bidStats');
				res = res.join(auctionData, ['auction', 'adUnitPath']);

				if (res.count() > 0) {
					auctionTimelineData[auctionId] = res;
				}
			}

			// for each auction process the set of bids
			auctionGroupedDf.aggregate(g => collectAuctionSlotData(g))
		}

		// collect all the data for the overview page : for each auction, for each slot, the number of ads, bidders etc & the timestamps for each phase of the auction
		collectAuctionData(allBidsDf, allAuctionsDf.groupBy('auction'));

		return auctionTimelineData;
	} else {
		console.error('called initialiseData without a response')
	}
}

////////////////////////////////////
// Now create the page content
////////////////////////////////////
function getOverviewTabContent(auctionTimeData) {
	if (!auctionTimeData) {
		console.error('getOverviewTabContent did not recieve any data')
		return
	}
	function addStatsToPage(container, auctionId, atld) {
		let tableElement = document.createElement("table");
		var rowElement = document.createElement("tr");
		var tdElement = document.createElement("td");
		tdElement.setAttribute('colSpan', 2);
		let auctionBidders = atld.get('bidStats')
		let auctionElement = document.createElement("p");
		auctionElement.style.fontSize = "10px";
		auctionElement.style.color = "grey";
		auctionElement.innerText = "Auction - " + auctionId;
		tdElement.appendChild(auctionElement);
		rowElement.appendChild(tdElement);
		tdElement = document.createElement("td");
		let adUnitElement = document.createElement("p");
		adUnitElement.style.fontSize = "10px";
		adUnitElement.style.color = "grey";
		adUnitElement.innerText = "Ad Unit - " + atld.get('adUnitPath');
		tdElement.appendChild(adUnitElement);
		rowElement.appendChild(tdElement);
		tableElement.appendChild(rowElement);
		rowElement = document.createElement("tr");
		tdElement = document.createElement("td");
		let numberAdsElement = document.createElement("p");
		numberAdsElement.style.fontSize = "10px";
		numberAdsElement.style.color = "grey";
		numberAdsElement.innerText = "Ads detected - " + auctionBidders[2];
		tdElement.appendChild(numberAdsElement);
		rowElement.appendChild(tdElement);
		tdElement = document.createElement("td");
		let numberBiddersElement = document.createElement("p");
		numberBiddersElement.style.fontSize = "10px";
		numberBiddersElement.style.color = "grey";
		numberBiddersElement.innerText = "Number of bidders - " + auctionBidders[1];
		tdElement.appendChild(numberBiddersElement);
		rowElement.appendChild(tdElement);
		tdElement = document.createElement("td");
		let noBidRatioElement = document.createElement("p");
		noBidRatioElement.style.fontSize = "10px";
		noBidRatioElement.style.color = "grey";
		noBidRatioElement.innerText = "No bids ratio - " + auctionBidders[0] + "/" + auctionBidders[3];
		tdElement.appendChild(noBidRatioElement);
		rowElement.appendChild(tdElement);
		tableElement.appendChild(rowElement);
		container.appendChild(tableElement);
	}

	$('#overview-content').empty();
	$('#timeline-container').empty();
	let overviewContentContainerElement = document.getElementById('overview-content');
	// for each auction
	for (var [auctionId, auctionTimelineData] of Object.entries(auctionTimeData)) {
		auctionTimelineData.map(row => addStatsToPage(overviewContentContainerElement, auctionId, row));
		// for debug
		let auctionContent = auctionTimelineData.toArray().reduce((p, n) => p + n.join('\t') + '\n', '');
		console.log(auctionContent);
		let auctionContentEl = document.createElement('p');
		auctionContentEl.innerText = auctionContent;
		overviewContentContainerElement.appendChild(auctionContentEl);


		// We need to calculate the diffs from the timestamps for the timeline barchar 
		// and it needs to be transposed to be in the correct format
		function computeElementDiffs(m) {
			return m.map(a => a.map((n, i, a) => i ? n - a[i - 1] : 0 - n));
		}
		function transpose(arr) {
			return Object.keys(arr[0]).map(function (c) {
				return arr.map(function (r) {
					return r[c];
				});
			});
		}

		let timelineData = auctionTimelineData.select('preAuctionStartTime', 'startTime', 'endTime', 'slotRenderedTs', 'slotLoadTs').toArray();
		// TODO for mult auctions we need to insert a first el which is the time from the earliest auc start to this auc
		if (timelineData.length > 0) {
			timelineData = transpose(computeElementDiffs(timelineData)).slice(1);
			console.log(timelineData);
		}

		overviewPageTimelineData.labels = auctionTimelineData.distinct('adUnitPath').toArray();
		for (var i = 0; i < 4; i++) {
			overviewPageTimelineData.datasets[i].data = timelineData[i];
		}

		Chart.plugins.unregister(ChartDataLabels);
		let timelineContainer = document.getElementById('timeline-container');
		let canvasElement = document.createElement('canvas');
		canvasElement.style.width = '800px';
		canvasElement.style.height = '75px';
		timelineContainer.appendChild(canvasElement);


		var myBarChart1 = new Chart(canvasElement, {
			type: 'horizontalBar',
			data: overviewPageTimelineData,
			plugins: [ChartDataLabels],
			options: options
		});
	}
}

function getBidderStatisticsContent() {
	// get avg cpm and time for each bidder
	// for all auctions but optionally for a selected ad unit
	// display in a carousel

	$('#bidder-stats-container').empty();
	let bidderStatsContainerElement = document.getElementById('bidder-stats-container');
	let bidderStatsContentElement = document.createElement('div');
	bidderStatsContentElement.class = 'bidder-stats-content';
	bidderStatsContentElement.id = 'bidder-stats-content';
	bidderStatsContainerElement.appendChild(bidderStatsContentElement);

	function addCard(container, bidder, cpm, time) {
		const cardDiv = document.createElement('div');
		const tab = document.createElement('table');
		tab.id = 'table-bidder-stats-card';
		cardDiv.appendChild(tab);
	
		let r = tab.insertRow(-1);
		r.style = "background-color:yellow";
		let c = r.insertCell(0);
		c.innerHTML = 'Bidder ' + bidder;

		r = tab.insertRow(-1);
		r.style = "background-color:lightgrey";

		c = r.insertCell(0);
		c.innerHTML = 'Avg Bid CPM<br/>' + cpm + '$';

		r = tab.insertRow(-1);
		r.style = "background-color:lightgrey";

		c = r.insertCell(0);
		c.innerHTML = 'Avg Response Time<br/>' + time + 'ms';;

		container.appendChild(cardDiv);
	
	}

	let bidderDf = allBidsDf.filter(r => r.get('type') == 'bid').groupBy('bidder').aggregate(bidderGroup => ({cpm:bidderGroup.stat.mean('cpm'), 'time':bidderGroup.stat.mean('time')}));

	displayTable(bidderDf.toArray());

	bidderDf.map(r => addCard(bidderStatsContentElement, r.get('bidder'), r.get('aggregation').cpm, r.get('aggregation').time));


	try {
		$('#bidder-stats-content').slick({
			arrows: true,
			dots: true,
			slidesToShow: 4,
			slidesToScroll: 4,
			infinite: true,
			cssEase: 'linear',
			dotsClass: 'slick-dots'
		}); 
	} catch (e) {
		// TODO -> why does it throws an error?
		console.error(e)
	}
}

// eslint-disable-next-line no-unused-vars
function displayTabContent(tab) {
	switch (tab) {
		case 0: getOverviewTabContent(auctionTimelineData); // will update/set auctionTimelineData
			break;
		case 1: getBidderStatisticsContent();
			break;
		case 2: console.log('not implemented yet. tab ' + tab);
			break;
		case 3: console.log('not implemented yet. tab ' + tab);
			break;
		default: console.log('not implemented yet. tab ' + tab);
	}
}
