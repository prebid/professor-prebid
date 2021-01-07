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

	if (DEBUG) {
		displayTable(bidderDf.toArray());
	}

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

function updateBidderTimelineContent(auctionId, adUnitPath, bidder) {

	function collectAuctionBidderData(groupedBidders, auctionId, adUnitPath, bidder) {

		function collectAuctionBidderSlotData(group) {

			let res =  auctionId != 'all' ? group.filter(r => r.get('auction') == auctionId) : group;
			if (adUnitPath != 'all') {
				res = res.filter(r => r.get('adUnitPath') == adUnitPath);
			}
			if (bidder != 'all') {
				res = res.filter(r => r.get('bidder') == bidder);
			}
			res = res.groupBy('auction', 'adUnitPath', 'bidder').aggregate(g => ({'cpm' : g.stat.mean('cpm'), 'bidderStart' : g.stat.mean('bidRequestTime'), 'bidderEnd' : g.stat.mean('bidResponseTime')})).rename('aggregation', 'bidStats');
			res = res.join(auctionBidDataDf, ['auction', 'adUnitPath', 'bidder']);
			return res.sortBy(['adUnitPath', 'startTime', 'bidResponseTime']);
		}
		// for each auction process the set of bids
		return groupedBidders.aggregate(g => collectAuctionBidderSlotData(g))
	}
	// collect all the data for the bidder timeline page : for each auction, bidder, possibly filtered by slot
	// for each return the number of ads, bidders etc & the timestamps for each phase of the auction
	let allBidders = allBidsDf.filter(r => r.get('type') == 'bid' && r.get('slotElementId') != undefined)
	console.log('auction ' + auctionId + ' : adUnitPath ' + adUnitPath + ' : bidder ' + bidder)
	return collectAuctionBidderData(allBidders.groupBy('auction'), auctionId, adUnitPath, bidder);
}


function updateTimelinePageContent(atld) {
	
	// for each auction
	function addTimeline(auctionId, auctionData) {

		let timelineData = auctionData.select('preAuctionStartTime', 'startTime', 'bidRequestTime', 'bidResponseTime', 'endTime', 'slotRenderedTs', 'slotLoadTs');
		if (timelineData.count() > 0) {

			let tld = timelineData.map(r => new dfjs.Row([r.get('startTime') - r.get('preAuctionStartTime'), r.get('bidRequestTime') - r.get('startTime'), r.get('bidResponseTime') - r.get('bidRequestTime'), r.get('endTime') - r.get('bidResponseTime'), r.get('slotLoadTs') == null ? 0 : r.get('slotLoadTs') - r.get('slotRenderedTs')], ['preAuction', 'auctionInit', 'bidTime', 'postAuctionWait', 'render']));
            tld = tld.toArray();
            
			timelineData = transpose(tld);
			if (DEBUG) {
				console.log('timelineData ', timelineData);
			}
		}

		return {	
			auction : auctionId,
			timelineData : timelineData, 
			bidders : auctionData.select('adUnitPath', 'bidder').toArray().map(r => (r[0].length > 12 ? '...' + r[0].slice(-10) : r[0]) + ' ' + (r[1].length > 12 ? '...' + r[1].slice(-10) : r[1])), 
			winners : auctionData.filterWithIndex(r => r.get('rendered') == true) 
		}
	}

	clearTimelines();
	let bidderTimelines = atld.withColumn('tld', auction => addTimeline(auction.get('auction'), auction.get('aggregation'))).select('tld').toArray();
	bidderTimelines.map(tld => renderBidderTimeline(tld[0]));

}

function getBidderTimelineContent() {
	// get list of ad units
	let allBidders = allBidsDf.filter(r => r.get('type') == 'bid').sortBy( 'cpm', true)
	let adUnits = ['all'].concat(allBidders.filter(r => r.get('type') == 'bid' && r.get('slotElementId') != undefined).distinct('adUnitPath').toArray());
	let auctions  = ['all'].concat(allBidders.filter(r => r.get('type') == 'bid' && r.get('slotElementId') != undefined).distinct('auction').toArray());
	let bidders = ['all'].concat(allBidders.filter(r => r.get('type') == 'bid' && r.get('slotElementId') != undefined).distinct('bidder').toArray());

	$('#bidder-timeline-auction-selector').empty();
	$('#bidder-timeline-adunit-selector').empty();
	$('#bidder-timeline-bidder-selector').empty();
	auctions.map(a => $('#bidder-timeline-auction-selector').append(new Option(a, a)));
	adUnits.map(au => $('#bidder-timeline-adunit-selector').append(new Option(au, au)));
	bidders.map(b => $('#bidder-timeline-bidder-selector').append(new Option(b, b)));

	let atld = undefined;
	$('#bidder-timeline-auction-selector').on('change', function() {
		let auction = $(this).val();
		// TODO update relevant adunit and bidder dropdowns for this adunit?
		atld = updateBidderTimelineContent(auction, $('#bidder-timeline-adunit-selector').val(), $('#bidder-timeline-bidder-selector').val());
		updateTimelinePageContent(atld);
	});

	$('#bidder-timeline-adunit-selector').on('change', function() {
		let adunit = $(this).val();
		// TODO update relevant auction and bidder dropdowns for this adunit?
		atld = updateBidderTimelineContent($('#bidder-timeline-auction-selector').val(), adunit, $('#bidder-timeline-bidder-selector').val());
		updateTimelinePageContent(atld);
	});

	$('#bidder-timeline-bidder-selector').on('change', function() {
		let bidder = $(this).val();
		// TODO update relevant auction and adunit dropdowns for this adunit?
		atld = updateBidderTimelineContent($('#bidder-timeline-auction-selector').val(), $('#bidder-timeline-adunit-selector').val(), bidder);
		updateTimelinePageContent(atld);
	});

	atld = updateBidderTimelineContent('all', 'all', 'all');	
	// now update the page
	updateTimelinePageContent(atld);
}


////////////////////////////////////
// Render functions
////////////////////////////////////
function clearTimelines() {
	$('#bidder-timeline-content').empty();
	$('#bidder-timeline-container').empty();
}

function renderBidderTimeline(tld) {

	let bidderPageTimelineData = $.extend( true, {}, bidderPageTimelineDataTemplate );
	bidderPageTimelineData.labels = tld.bidders;
	for (var i = 0; i < 5; i++) {
		bidderPageTimelineData.datasets[i].data = tld.timelineData[i];
		bidderPageTimelineData.datasets[i].backgroundColor  = Array(bidderPageTimelineData.labels.length).fill(bidderPageTimelineData.datasets[i].backgroundColor[0]);
			bidderPageTimelineData.datasets[i].borderWidth = Array(bidderPageTimelineData.labels.length).fill(0);	
			bidderPageTimelineData.datasets[i].borderColor = Array(bidderPageTimelineData.labels.length).fill('black')
	}
	if (tld.winners.length>0) {
		function showWinner(winner) {
			for (var i = 0; i < 5; i++) {
				bidderPageTimelineData.datasets[i].borderColor[winner.index] = 'rgba(255, 0, 0, 1)'
				bidderPageTimelineData.datasets[i].borderWidth[winner.index] = 2;	
				bidderPageTimelineData.datasets[i].backgroundColor[winner.index] = bidderPageTimelineData.datasets[i].backgroundColor[winner.index].replace(/[^,]+(?=\))/, '1')
			}
		}

		tld.winners.map(r => showWinner(r));
	}
	let timelineContainer = document.getElementById('bidder-timeline-container');
	let auctionHeader = document.createElement('div');
	auctionHeader.innerHTML='<p>Auction ' + tld.auction + '</p>'
	let canvasElement = document.createElement('canvas');
	canvasElement.style.width = '800px';
	timelineContainer.appendChild(auctionHeader);
	timelineContainer.appendChild(canvasElement);

	let timelineOptions = $.extend( true, {}, options );
	timelineOptions['legend']['display'] = true;
	timelineOptions['plugins']['datalabels']['align'] = 'center';
	timelineOptions['plugins']['datalabels']['formatter'] = function(value, context) { return value == 0 ? "" : value;};
	new Chart(canvasElement, {
		type: 'horizontalBar',
		data: bidderPageTimelineData,
		plugins: [ChartDataLabels],
		options: timelineOptions
	});
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

