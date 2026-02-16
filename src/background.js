/**
 * Comparison functions
 */
function compareByUrlAsc(a, b) {
	return a.url.localeCompare(b.url);
}

function compareByUrlDesc(a, b) {
	return b.url.localeCompare(a.url);
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
	return browser.tabs.query({
		currentWindow : true
	}).then((tabs) => {
		const pinnedTabs = [];
		const normalTabs = [];
		for (const tab of tabs) {
			if (tab.pinned)
				pinnedTabs.push(tab);
			else
				normalTabs.push(tab);
		}
		if (settings["settings-sort-pinned"]) {
			sortTabsInternal(pinnedTabs, comparator);
		}
		sortTabsInternal(normalTabs, comparator);
	});
}

function sortTabsInternal(tabs, comparator) {
	if (tabs.length == 0)
		return;

	const offset = tabs[0].index;
	const beforeIds = tabs.map(tab => tab.id);
	const afterIds = tabs.slice(0).sort(comparator).map(tab => tab.id);
	let currentIds = beforeIds.slice(0);
	for (const difference of differ.diff(beforeIds, afterIds)) {
		if (!difference.added)
			continue;
		const movingIds = difference.value;
		const lastMovingId = movingIds[movingIds.length - 1];
		const nearestFollowingIndex = afterIds.indexOf(lastMovingId) + 1;
		let newIndex = nearestFollowingIndex < afterIds.length ? currentIds.indexOf(afterIds[nearestFollowingIndex]) : -1;
		if (newIndex < 0)
			newIndex = beforeIds.length;
		const oldIndex = currentIds.indexOf(movingIds[0]);
		if (oldIndex < newIndex)
			newIndex--;
		browser.tabs.move(movingIds, {
			index: newIndex + offset
		});
		currentIds = currentIds.filter(id => !movingIds.includes(id));
		currentIds.splice(newIndex, 0, ...movingIds);
	}
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
