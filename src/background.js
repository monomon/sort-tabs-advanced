/**
 * Comparison functions
 */
function compareByUrlAsc(a, b) {
	let url1 = new URL(a.url);
	let url2 = new URL(b.url);

	return url1.hostname
		.localeCompare(url2.hostname);
}

function compareByUrlDesc(a, b) {
	let url1 = new URL(a.url);
	let url2 = new URL(b.url);

	return url2.hostname
		.localeCompare(url1.hostname);
}

function compareByDomainAsc(a, b) {
	let url1 = new URL(a.url);
	let url2 = new URL(b.url);

	let domain1 = url1.hostname
		  .split(".")
		  .slice(-2)
		  .join(".");
	let domain2 = url2.hostname
		  .split(".")
		  .slice(-2)
		  .join(".");

	return domain1.localeCompare(domain2);
}

function compareByDomainDesc(a, b) {
	let url1 = new URL(a.url);
	let url2 = new URL(b.url);

	let domain1 = url1.hostname
		  .split(".")
		  .slice(-2)
		  .join(".");
	let domain2 = url2.hostname
		  .split(".")
		  .slice(-2)
		  .join(".");

	return domain2.localeCompare(domain1);
}

function compareByTitleAsc(a, b) {
	return a.title.localeCompare(b.title);
}

function compareByTitleDesc(a, b) {
	return b.title.localeCompare(a.title);
}

function compareByLastAccessAsc(a, b) {
	if (a.lastAccessed < b.lastAccessed) {
		return -1;
	} else if (a.lastAccessed > b.lastAccessed) {
		return 1;
	} else {
		return 0;
	}
}

function compareByLastAccessDesc(a, b) {
	if (b.lastAccessed < a.lastAccessed) {
		return -1;
	} else if (b.lastAccessed > a.lastAccessed) {
		return 1;
	} else {
		return 0;
	}
}

function onSettingsSortAuto(evt) {
  if (evt.target.checked) {
    browser.tabs.onUpdated.addListener(settingsSortAutoHandler);
    browser.tabs.onCreated.addListener(settingsSortAutoHandler);
  } else {
    browser.tabs.onUpdated.removeListener(settingsSortAutoHandler);
    browser.tabs.onCreated.removeListener(settingsSortAutoHandler);
  }

  return Promise.resolve();
}

function onSettingsSortPinned(evt) {
  return Promise.resolve();
}

let menuIdToComparator = {
	"sort-by-url-asc" : compareByUrlAsc,
	"sort-by-url-desc" : compareByUrlDesc,
	"sort-by-domain-asc" : compareByDomainAsc,
	"sort-by-domain-desc" : compareByDomainDesc,
	"sort-by-last-access-asc" : compareByLastAccessAsc,
	"sort-by-last-access-desc" : compareByLastAccessDesc,
	"sort-by-title-asc" : compareByTitleAsc,
	"sort-by-title-desc" : compareByTitleDesc,
};

let settingsMenuIdToHandler = {
  "settings-sort-auto": onSettingsSortAuto,
  "settings-sort-pinned": onSettingsSortPinned
};

function sortTabsComparatorName(compName, settings) {
  return sortTabs(menuIdToComparator[compName], settings);
}

function settingsSortAutoHandler(tabId, changeInfo, tabInfo) {
  browser.storage.local.get({
    "last-comparator": undefined,
    "settings-sort-auto": false,
    "settings-sort-pinned": false
  }).then(
    (settings) => {
      if (menuIdToComparator[settings["last-comparator"]] !== undefined) {
        return sortTabs(menuIdToComparator[settings["last-comparator"]], settings);
      }
    }, onError);
}

function sortTabs(comparator, settings) {
	let num_pinned = 0;
	return browser.tabs.query({
		pinned : true,
		currentWindow : true
	}).then(
    (pinnedTabs) => {
		  num_pinned = pinnedTabs.length;

      if (settings["settings-sort-pinned"]) {
        console.log("Sorting pinned: " + num_pinned.toString());
		    pinnedTabs.sort(comparator);
		    return browser.tabs.move(
			    pinnedTabs.map((tab) => { return tab.id; }),
			    { index : 0 });
      } else {
        return [];
      }
	  }, onError).then(
      (_) => {
		    return browser.tabs.query({
			    pinned : false,
			    currentWindow : true
		    });
	    }, onError).then(
        (normalTabs) => {
          console.log("Sorting normal " + normalTabs.length.toString());
          console.log("Starting at index " + num_pinned);
		      normalTabs.sort(comparator);
		      return browser.tabs.move(
			      normalTabs.map((tab) => { return tab.id; }),
			      { index : num_pinned }
		      );
	      }, onError);
}

function settingChanged(evt) {
  return settingsMenuIdToHandler[evt.target.id](evt)
    .then(
      (e) => {
        return browser.storage.local.set({
          [evt.target.id]: evt.target.checked
        });
      }, onError);
}

function onError(error) {
  console.trace(error);
}
