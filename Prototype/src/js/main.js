/* global dfjs, $, Chart, ChartDataLabels, options */
var allBidsDf, allAuctionsDf, allSlotsDf, auctionBidDataDf;
var prebidConfig = {};
Chart.plugins.unregister(ChartDataLabels);

const DEBUG = 1

const EVENT_MAIN_PAGE_REQUEST_DATA = 'PROFESSOR_PREBID_MAIN_PAGE_REQUEST_DATA'

document.addEventListener('DOMContentLoaded', function () {
	if (DEBUG) {
		console.log('asking data from background.js')
	}
	getDataFromBackground()
}, false);

/**
 * onHashChange
 * 
 * acts as a simple hash router
 */
function onHashChange () {
	const hash = window.location.hash.substr(1);

	if (!hash) {
		window.location.hash = '#timeline'
	}

	handleNavbarActiveItem()
	handleActivePage()

	switch (hash) {
		case 'timeline':
			onTimelinePage()
			break
		case 'bidder-stats':
			onBidderStatsPage()
			break
		case 'config':
			onConfigPage()
			break
	}
}

/**
 * handleActivePage
 * 
 * runs on hash change and set a data-active attribute on the correct page element
 */
function handleActivePage () {
	const hash = window.location.hash

	const oldContent = document.querySelector('.page[data-active="true"]')
	const newContent = document.querySelector(hash)

	if (oldContent) {
		oldContent.removeAttribute('data-active')
	}

	if (newContent) {
		newContent.setAttribute('data-active', true)
	} else {
		// handle unknown hash
	}
}

/**
 * handleNavbarActiveItem
 * 
 * change the active item in the main navbar whenever the page hash changes 
 */
function handleNavbarActiveItem () {
	const hash = window.location.hash

	// switch old active with new one
	const oldActive = document.querySelector(`#main-nav a.active`)
	const newActive = document.querySelector(`#main-nav a[href="${hash}"]`)

	if (oldActive) {
		oldActive.classList.remove('active')
	}
	if (newActive) {
		newActive.classList.add('active')
	} else {
		// handle unknown hash
	}
}

function onTimelinePage () {
	getBidderTimelineContent()
}

function onBidderStatsPage () {
	getBidderStatisticsContent()
}

function onConfigPage () {
	getPrebidConfig()
}

/**
 * initPage
 * 
 * run this function right after data initialization
 */
function initPage (data) {
	if (data) {
		window.addEventListener('hashchange', onHashChange)
		onHashChange() // run once at start

		if (DEBUG) {
			console.log('initialize hash router')
		}
	} else {
//		alert('could not get data from background!!')
		console.log('no data')
	}
}

/**
 * initializeData
 * 
 * popuplate dataframes with data from background
 */
function initializeData(response) {
	if (!response || !response['dfs']) {
		if (DEBUG) {
			console.error('called initializeData without a response')
		}
		return
	}

	allBidsDf = new dfjs.DataFrame(response['dfs']['allBids']);
	allAuctionsDf = new dfjs.DataFrame(response['dfs']['auction']);
	allSlotsDf = new dfjs.DataFrame(response['dfs']['slots']);
	prebidConfig = JSON.parse(response['prebidConfig']);

	if (DEBUG) {
		console.log('passed all bids df');
		displayTable(allBidsDf.toCollection());
		displayTable(allAuctionsDf.toCollection());
		displayTable(allSlotsDf.toCollection());
	}

	// join auctions and slots
	let auctionData = allAuctionsDf.join(allSlotsDf, ['slotElementId']);
	// join with bids and set global
	auctionBidDataDf = auctionData.join(allBidsDf.select('auction', 'adUnitPath', 'slotElementId', 'bidder', 'type', 'bidRequestTime', 'bidResponseTime', 'nonRenderedHighestCpm', 'rendered'), ['auction', 'adUnitPath'], 'inner', false)
	// calculate the stats
	let res = auctionBidDataDf.groupBy('auction', 'adUnitPath').aggregate(g => [g.filter(r => r.get('type') == 'noBid').distinct('bidder').count(), g.filter(r => r.get('type') == 'bid').distinct('bidder').count(), g.distinct('adUnitPath').count(), g.distinct('bidder').count()]).rename('aggregation', 'bidStats');
	res = res.join(auctionData, ['auction', 'adUnitPath']);

	// collect all the data for the overview page : for each auction, for each slot, the number of ads, bidders etc & the timestamps for each phase of the auction
	return res;
}

/**
 * getDataFromBackground
 * 
 * get data from background.js script
 */
function getDataFromBackground () {
	chrome.runtime.sendMessage({ type: EVENT_MAIN_PAGE_REQUEST_DATA }, pipe(initializeData, initPage))
}

var bidderPageTimelineDataTemplate = {
	labels: [""],
	datasets: [{
		label: 'pre-auction',
		backgroundColor: Array(5).fill('rgba(200, 200, 200, .75)'),
		borderWidth: 0
	},{
		label: 'auction-init',
		backgroundColor: Array(5).fill('rgba(100, 100, 255, .75)'),
		borderWidth: 0
	},{
		label: 'bid time',
		backgroundColor: Array(5).fill('rgba(255, 255, 100, .75)'),
		borderWidth: 0
	},{
		label: 'post-auction wait',
		backgroundColor: Array(5).fill('rgba(200, 50, 50, .75)'),
		borderWidth: 0
	},{
		label: 'render',
		backgroundColor: Array(5).fill('rgba(150, 150, 150, .75)'),
		borderWidth: 0
	}]
};

function updateBidderStatisticsContent(allBidders, selectedAdUnit) {
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


	if (selectedAdUnit != 'all') {
		allBidders = allBidders.filter(r => r.get('adUnitPath') == selectedAdUnit)
	}

	let bidderDf = allBidders.groupBy('bidder').aggregate(bidderGroup => ({cpm:bidderGroup.stat.mean('cpm'), 'time':bidderGroup.stat.mean('time')}));
	bidderDf.map(r => addCard(bidderStatsContentElement, r.get('bidder'), r.get('aggregation').cpm, r.get('aggregation').time));

	// TODO get all these behind a debug flag
	displayTable(bidderDf.toArray());


	$('#bidder-stats-content').slick({
		arrows: true,
		dots: true,
		slidesToShow: 4,
		slidesToScroll: 4,
		infinite: true,
		cssEase: 'linear',
		dotsClass: 'slick-dots'
	}); 
}

function getBidderStatisticsContent() {
	// get list of ad units for which we have rendered
	let allBidders = allBidsDf.filter(r => r.get('type') == 'bid' && r.get('slotElementId') != undefined).sortBy('cpm', true)
	let adUnits = ['all'].concat(allBidders.distinct('adUnitPath').toArray())
	$('#bidder-stats-adunit-selector').empty();
	adUnits.map(au => $('#bidder-stats-adunit-selector').append(new Option(au, au)));

	$('#bidder-stats-adunit-selector').on('change', function() {
		let adunit = $(this).val();
		updateBidderStatisticsContent(allBidders, adunit);
	});

	updateBidderStatisticsContent(allBidders, 'all');	
}

function updateBidderTimelineContent(auctionId, adUnitPath) {

	function collectAuctionBidderData(groupedBidders, auctionId, adUnitPath) {

		function collectAuctionBidderSlotData(group) {

			let res =  auctionId != 'all' ? group.filter(r => r.get('auction') == auctionId) : group;
			if (adUnitPath != 'all') {
				res = res.filter(r => r.get('adUnitPath') == adUnitPath);
				res = res.groupBy('auction', 'bidder').aggregate(g => ({'cpm' : g.stat.mean('cpm'), 'bidderStart' : g.stat.mean('bidRequestTime'), 'bidderEnd' : g.stat.mean('bidResponseTime')})).rename('aggregation', 'bidStats');
				res = res.withColumn('adUnitPath', () => adUnitPath);
			} else {
				res = res.groupBy('auction', 'adUnitPath', 'bidder').aggregate(g => ({'cpm' : g.stat.mean('cpm'), 'bidderStart' : g.stat.mean('bidRequestTime'), 'bidderEnd' : g.stat.mean('bidResponseTime')})).rename('aggregation', 'bidStats');
			}
			res = res.join(auctionBidDataDf, ['auction', 'adUnitPath', 'bidder']);
			return res.sortBy(['startTime', 'bidResponseTime']);
		}
		// for each auction process the set of bids
		return groupedBidders.aggregate(g => collectAuctionBidderSlotData(g))
	}
	// collect all the data for the bidder timeline page : for each auction, bidder, possibly filtered by slot
	// for each return the number of ads, bidders etc & the timestamps for each phase of the auction
	let allBidders = allBidsDf.filter(r => r.get('type') == 'bid' && r.get('slotElementId') != undefined)
	return collectAuctionBidderData(allBidders.groupBy('auction'), auctionId, adUnitPath);
}

function updateTimelinePageContent(atld) {
	
	// for each auction
	function addTimeline(auctionId, auctionData) {

		// function computeTimelinePerAuction(auctionGroup) {

		// 	let preAuction = auctionGroup.stat.mean('preAuctionStartTime');
		// 	let startTime = auctionGroup.stat.mean('startTime');
		// 	let endTime = auctionGroup.stat.mean('endTime');
		// 	let slotRendered = auctionGroup.stat.mean('slotRenderedTs');
		// 	let slotLoad = auctionGroup.stat.mean('slotLoadTs');
		// 	return new dfjs.DataFrame([[preAuction, startTime, endTime, slotRendered, slotLoad]], ['preAuctionStartTime','startTime', 'endTime', 'slotRenderedTs', 'slotLoadTs']);
		// }



		let timelineData = auctionData.select('preAuctionStartTime', 'startTime', 'bidRequestTime', 'bidResponseTime', 'endTime', 'slotRenderedTs', 'slotLoadTs');
		if (timelineData.count() > 0) {

			let tld = timelineData.map(r => new dfjs.Row([r.get('startTime') - r.get('preAuctionStartTime'), r.get('bidRequestTime') - r.get('startTime'), r.get('bidResponseTime') - r.get('bidRequestTime'), r.get('endTime') - r.get('bidResponseTime'), r.get('slotLoadTs') == null ? 0 : r.get('slotLoadTs') - r.get('slotRenderedTs')], ['preAuction', 'auctionInit', 'bidTime', 'postAuctionWait', 'render']));
            tld = tld.toArray();
            
// 			let preAuction =  tld.select('preAuction').map(r => r.get('preAuction'));
// 			let auctionInit =  (tld.stat.mean('auctionInit')).toFixed(0);
// 			let bidTime =  (tld.stat.mean('bidTime')).toFixed(0);
// 			let postAuctionWait =  (tld.stat.mean('postAuctionWait')).toFixed(0);
// 			// sometimes we might not have had the slot render event yet so we'll remove those from the average calcs
// 			let render =  (tld.filter(r => r.get('render') > 0 ).stat.mean('render')).toFixed(0);

// 			timelineData = [ preAuction, auctionInit, bidTime, postAuctionWait, render ];
// 			timelineData = transpose(timelineData)


			timelineData = transpose(tld);
			if (DEBUG) {
				console.log('timelineData ', timelineData);
			}

			let bidderPageTimelineData = $.extend( true, {}, bidderPageTimelineDataTemplate );
			bidderPageTimelineData.labels = auctionData.select('bidder').toArray();
			for (var i = 0; i < 5; i++) {
				bidderPageTimelineData.datasets[i].data = timelineData[i];
				bidderPageTimelineData.datasets[i].backgroundColor  = Array(bidderPageTimelineData.labels.length).fill(bidderPageTimelineData.datasets[i].backgroundColor[0]);
			}
			let winner = auctionData.findWithIndex(r => r.get('rendered') == true)
			if (winner) {
				for(i=0; i<5; i++) {
					bidderPageTimelineData.datasets[i].borderWidth = Array(bidderPageTimelineData.labels.length).fill(0);	
					bidderPageTimelineData.datasets[i].borderWidth[winner.index] = 2; 
					bidderPageTimelineData.datasets[i].borderColor = Array(bidderPageTimelineData.labels.length).fill('black')
					bidderPageTimelineData.datasets[i].borderColor[winner.index] = 'rgba(255, 0, 0, 1)'
					bidderPageTimelineData.datasets[i].backgroundColor[winner.index] = bidderPageTimelineData.datasets[i].backgroundColor[winner.index].replace(/[^,]+(?=\))/, '1')
				}
			}

			let timelineContainer = document.getElementById('bidder-timeline-container');
			let auctionHeader = document.createElement('div');
			auctionHeader.innerHTML='<p>Auction ' + auctionId + '</p>'
			let canvasElement = document.createElement('canvas');
			canvasElement.style.width = '800px';
			timelineContainer.appendChild(auctionHeader);
			timelineContainer.appendChild(canvasElement);

			let timelineOptions = $.extend( true, {}, options );
			timelineOptions['legend']['display'] = true;
			timelineOptions['plugins']['datalabels']['align'] = 'center';
			timelineOptions['plugins']['datalabels']['formatter'] = 'function(value, context) { return value == 0 ? "" : value;';
			new Chart(canvasElement, {
				type: 'horizontalBar',
				data: bidderPageTimelineData,
				plugins: [ChartDataLabels],
				options: timelineOptions
			});
		}
	}

	$('#bidder-timeline-content').empty();
	$('#bidder-timeline-container').empty();
	atld.map(auction => addTimeline(auction.get('auction'), auction.get('aggregation')));

}

function getBidderTimelineContent() {
	// get list of ad units
	let allBidders = allBidsDf.filter(r => r.get('type') == 'bid').sortBy('cpm', true)
	let adUnits = ['all'].concat(allBidders.filter(r => r.get('type') == 'bid' && r.get('slotElementId') != undefined).distinct('adUnitPath').toArray());
	let auctions  = ['all'].concat(allBidders.filter(r => r.get('type') == 'bid' && r.get('slotElementId') != undefined).distinct('auction').toArray());

	$('#bidder-timeline-auction-selector').empty();
	$('#bidder-timeline-adunit-selector').empty();
	auctions.map(a => $('#bidder-timeline-auction-selector').append(new Option(a, a)));
	adUnits.map(au => $('#bidder-timeline-adunit-selector').append(new Option(au, au)));

	let atld = undefined;
	$('#bidder-timeline-auction-selector').on('change', function() {
		let auction = $(this).val();
		atld = updateBidderTimelineContent(auction, $('#bidder-timeline-adunit-selector').val());
		updateTimelinePageContent(atld);
	});

	$('#bidder-timeline-adunit-selector').on('change', function() {
		let adunit = $(this).val();
		atld = updateBidderTimelineContent($('#bidder-timeline-auction-selector').val(), adunit);
		updateTimelinePageContent(atld);
	});

	atld = updateBidderTimelineContent('all', 'all');	
	// now update the page
	updateTimelinePageContent(atld);
}

function getPrebidConfig() {
	// do something with prebidConfig
	console.log(prebidConfig)
}

/**
 * Utils
 */

// allow us to curry functions
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

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

// For Debug
function displayTable(output, defaultOutput = 'n/a') {
	if (DEBUG) {
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
}

// Old TODO -> remove if not needed

// /**Chart Data**/
// var overviewPageTimelineDataTemplate = {
//   labels: [""],
//   datasets: [{
//     label: 'pre-auction',
//     backgroundColor: [
//       'rgba(200, 200, 200, 1)', 'rgba(200, 200, 200, 1)'
//     ],
//     borderWidth: 0
//   }, {
//     label: 'auction',
//     backgroundColor: [
//       'rgba(100, 100, 255, 1)', 'rgba(100, 100, 255, 1)'
//     ],
//     borderWidth: 0
//   }, {
//     label: 'ad server',
//     backgroundColor: [
//       'rgba(255, 255, 100, 1)', 'rgba(255, 255, 100, 1)'
//     ],
//     borderWidth: 0
//   },
//   {
//     label: 'render',
//     backgroundColor: [
//       'rgba(200, 50, 50, 1)', 'rgba(200, 50, 50, 1)'
//     ],
//     borderWidth: 0
//   }]
// };

// function getOverviewTabContent(overviewData) {
// 	if (!overviewData) {
// 		console.error('getOverviewTabContent was called without data')
// 		return
// 	}

// 	function addStatsToPage(container, auctionId, atld) {
// 		let tableElement = document.createElement("table");
// 		var rowElement = document.createElement("tr");
// 		var tdElement = document.createElement("td");
// 		tdElement.setAttribute('colSpan', 2);
// 		let auctionBidders = atld.get('bidStats')
// 		let auctionElement = document.createElement("p");
// 		auctionElement.style.fontSize = "10px";
// 		auctionElement.style.color = "grey";
// 		auctionElement.innerText = "Auction - " + auctionId;
// 		tdElement.appendChild(auctionElement);
// 		rowElement.appendChild(tdElement);
// 		tdElement = document.createElement("td");
// 		let adUnitElement = document.createElement("p");
// 		adUnitElement.style.fontSize = "10px";
// 		adUnitElement.style.color = "grey";
// 		adUnitElement.innerText = "Ad Unit - " + atld.get('adUnitPath');
// 		tdElement.appendChild(adUnitElement);
// 		rowElement.appendChild(tdElement);
// 		tableElement.appendChild(rowElement);
// 		rowElement = document.createElement("tr");
// 		tdElement = document.createElement("td");
// 		let numberAdsElement = document.createElement("p");
// 		numberAdsElement.style.fontSize = "10px";
// 		numberAdsElement.style.color = "grey";
// 		numberAdsElement.innerText = "Ads detected - " + auctionBidders[2];
// 		tdElement.appendChild(numberAdsElement);
// 		rowElement.appendChild(tdElement);
// 		tdElement = document.createElement("td");
// 		let numberBiddersElement = document.createElement("p");
// 		numberBiddersElement.style.fontSize = "10px";
// 		numberBiddersElement.style.color = "grey";
// 		numberBiddersElement.innerText = "Number of bidders - " + auctionBidders[1];
// 		tdElement.appendChild(numberBiddersElement);
// 		rowElement.appendChild(tdElement);
// 		tdElement = document.createElement("td");
// 		let noBidRatioElement = document.createElement("p");
// 		noBidRatioElement.style.fontSize = "10px";
// 		noBidRatioElement.style.color = "grey";
// 		noBidRatioElement.innerText = "No bids ratio - " + auctionBidders[0] + "/" + auctionBidders[3];
// 		tdElement.appendChild(noBidRatioElement);
// 		rowElement.appendChild(tdElement);
// 		tableElement.appendChild(rowElement);
// 		container.appendChild(tableElement);
// 	}

// 	$('#overview-content').empty();
// 	$('#timeline-container').empty();
// 	let overviewContentContainerElement = document.getElementById('overview-content');
// 	// for each auction
// 	function addAuctionCard(auctionData) {

//         let auctionId = auctionData.getRow(0).get('auction')
// 		auctionData.map(row => addStatsToPage(overviewContentContainerElement, auctionId, row));
// 		// for debug
// 		let auctionContent = auctionData.toArray().reduce((p, n) => p + n.join('\t') + '\n', '');
// 		console.log(auctionContent);
// 		let auctionContentEl = document.createElement('p');
// 		auctionContentEl.innerText = auctionContent;
// 		overviewContentContainerElement.appendChild(auctionContentEl);

// 		let timelineData = auctionData.select('preAuctionStartTime', 'startTime', 'endTime', 'slotRenderedTs', 'slotLoadTs').toArray();
// 		// TODO for mult auctions we need to insert a first el which is the time from the earliest auc start to this auc
// 		if (timelineData.length > 0) {
// 			timelineData = transpose(computeElementDiffs(timelineData)).slice(1);
// 			console.log(timelineData);
// 		}

// 		let overviewPageTimelineData = $.extend( true, {}, overviewPageTimelineDataTemplate );
// 		overviewPageTimelineData.labels = auctionData.distinct('adUnitPath').toArray();
// 		for (var i = 0; i < 4; i++) {
// 			overviewPageTimelineData.datasets[i].data = timelineData[i];
// 		}

// 		Chart.plugins.unregister(ChartDataLabels);
// 		let timelineContainer = document.getElementById('timeline-container');
// 		let canvasElement = document.createElement('canvas');
// 		canvasElement.style.width = '800px';
// 		canvasElement.style.height = '75px';
// 		timelineContainer.appendChild(canvasElement);


// 		var myBarChart1 = new Chart(canvasElement, {
// 			type: 'horizontalBar',
// 			data: overviewPageTimelineData,
// 			plugins: [ChartDataLabels],
// 			options: options
// 		});
// 	}
// 	overviewData.groupBy('auction', 'adUnitPath').aggregate(group => addAuctionCard(group))
// }

// function displayTabContent(tab) {
// 	switch (tab) {
// 		case 0: getDataFromBackground();
// 			break;
// 		case 1: getBidderStatisticsContent();
// 			break;
// 		case 2: getBidderTimelineContent();
// 			break;
// 		case 3: getPrebidConfig();
// 			break;
// 		default: console.log('not implemented yet. tab ' + tab);
// 	}
// }