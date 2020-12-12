/**
 * background.js
 * 
 * this file will handle events messaging between all the different parts of the extension
 */

const EVENT_OPEN_MAIN_TAB = 'PROFESSOR_PREBID_OPEN_MAIN'
const EVENT_SEND_DATA_TO_BACKGROUND = 'PROFESSOR_PREBID_AUCTION_DATA'
const EVENT_MAIN_PAGE_REQUEST_DATA = 'PROFESSOR_PREBID_MAIN_PAGE_REQUEST_DATA'

let mainTabId
let tempData

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const msgType = message && message.type

  switch (msgType) {
    case EVENT_OPEN_MAIN_TAB:
      if (mainTabId) {
        chrome.tabs.update(mainTabId, { active: true  }, function (tab) {
					mainTabId = tab.id
					sendResponse()
        })
      } else {
        chrome.tabs.create({ url: './main.html' }, function (tab) {
					mainTabId = tab.id
					console.log('created tab with tabId: ', mainTabId)
					sendResponse()
        })
			}
			
			return true
    case EVENT_SEND_DATA_TO_BACKGROUND:
      console.log(`received event: ${EVENT_SEND_DATA_TO_BACKGROUND}`, message)
      console.log('storing payload in a temp variable')
			tempData = message.payload
			sendResponse()
      break
    case EVENT_MAIN_PAGE_REQUEST_DATA:
      sendResponse(tempData)
			break
		default:
			sendResponse()
  }
})

// handle main tab closing
chrome.tabs.onRemoved.addListener(function (tabId) {
  if (tabId === mainTabId) {
    console.log('main tab is closed, clearing mainTabId & tempData')
    mainTabId = undefined
    tempData = undefined
  }
})