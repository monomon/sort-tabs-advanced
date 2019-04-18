/**
 * Sort tabs web extension
 */

/**
 * menu definitions
 */
let menuDefs = [{
	id : "sort-by-url-asc",
	title : "sort by url (asc)",
	contexts : ["tools_menu", "browser_action"],
	icons : {
		16 : "icons/sort-icon-url-asc-16.png"
	}
}, {
	id : "sort-by-url-desc",
	title : "sort by url (desc)",
	contexts : ["tools_menu", "browser_action"],
	icons : {
		16 : "icons/sort-icon-url-desc-16.png"
	}
}, {
	id : "sort-by-domain-asc",
	title : "sort by domain (asc)",
	contexts : ["tools_menu", "browser_action"],
	icons : {
		16 : "icons/sort-icon-domain-asc-16.png"
	}
}, {
	id : "sort-by-domain-desc",
	title : "sort by domain (desc)",
	contexts : ["tools_menu", "browser_action"],
	icons : {
		16 : "icons/sort-icon-domain-desc-16.png"
	}
}, {
	id : "sort-by-title-asc",
	title : "sort by title (asc)",
	contexts : ["tools_menu", "browser_action"],
	icons : {
		16 : "icons/sort-icon-title-asc-16.png"
	}
}, {
	id : "sort-by-title-desc",
	title : "sort by title (desc)",
	contexts : ["tools_menu", "browser_action"],
	icons : {
		16 : "icons/sort-icon-title-desc-16.png"
	}
}, {
	id : "sort-by-last-access-asc",
	title : "sort by last access (asc)",
	contexts : ["tools_menu", "browser_action"],
	icons : {
		16 : "icons/sort-icon-access-time-asc-16.png"
	}
}, {
	id : "sort-by-last-access-desc",
	title : "sort by last access (desc)",
	contexts : ["tools_menu", "browser_action"],
	icons : {
		16 : "icons/sort-icon-access-time-desc-16.png"
	}
}];

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

function sortTabs(comparator) {
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
		sortTabsInternal(pinnedTabs, comparator);
		sortTabsInternal(normalTabs, comparator);
	});
}

function sortTabsInternal(tabs, comparator) {
	if (tabs.length == 0)
		return;

	const offset = tabs[0].index;
	const beforeIds = tabs.map(tab => tab.id);
	const afterIds = tabs.slice(0).sort(comparator).map(tab => tab.id);
	let sortedIds = beforeIds.slice(0);
	for (const difference of differ.diff(beforeIds, afterIds)) {
		if (!difference.added)
			continue;
		let movingIds = difference.value;
		const nearestFollowingIndex = afterIds.indexOf(movingIds[movingIds.length - 1]) + 1;
		let newIndex = nearestFollowingIndex < afterIds.length ? sortedIds.indexOf(afterIds[nearestFollowingIndex]) : -1;
		if (newIndex < 0)
			newIndex = beforeIds.length;
		let oldIndices = movingIds.map(id => sortedIds.indexOf(id));
		if (oldIndices[0] < newIndex)
			newIndex--;
		browser.tabs.move(movingIds, {
			index: newIndex + offset
		});
		sortedIds = sortedIds.filter(id => !movingIds.includes(id));
		sortedIds.splice(newIndex, 0, ...movingIds);
	}
}

function clickHandler(evt) {
	if (menuIdToComparator[evt.target.id]) {
		sortTabs(menuIdToComparator[evt.target.id])
			.then(() => {
				window.close();
			});
	} else {
		console.warn('handler not found ' + evt.target.id);
	}
}

function createButton(buttonDef) {
	let newEl = document.createElement('div');
	newEl.id = buttonDef.id;
	newEl.innerText = buttonDef.title;
	// newEl.src = "../" + buttonDef.icons[16];
	newEl.addEventListener("click", clickHandler);
	return newEl;
}

/**
 * init
 */

// do this before content loaded
const buttons = menuDefs.map(createButton);
const buttonGroup = document.createElement("div");
buttons.forEach((button) => buttonGroup.append(button));

// now just append the container
document.addEventListener("DOMContentLoaded", () => {
	let cont = document.getElementById("options");
	cont.append(buttonGroup);
});
