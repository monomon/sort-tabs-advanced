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

let settingsDefs = [{
	id : "settings-sort-auto",
	title : "sort automatically",
	contexts : ["tools_menu", "browser_action"]
}, {
  id: "settings-sort-pinned",
  title: "sort pinned tabs",
	contexts : ["tools_menu", "browser_action"]
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

let settingsMenuIdToHandler = {
  "settings-sort-auto": onSettingsSortAuto,
  "settings-sort-pinned": onSettingsSortPinned
};

function sortTabs(comparator) {
	let num_pinned = 0;
	return browser.tabs.query({
		pinned : true,
		currentWindow : true
	}).then(
    (pinnedTabs) => {
      if (settings["settings-sort-pinned"]) {
		    num_pinned = pinnedTabs.length;
		    pinnedTabs.sort(comparator);
		    return browser.tabs.move(
			    pinnedTabs.map((tab) => { return tab.id; }),
			    { index : 0 });
      } else {
        return Promise.resolve();
      }
	  }, onError).then(
      () => {
		    return browser.tabs.query({
			    pinned : false,
			    currentWindow : true
		    });
	    }, onError).then(
        (normalTabs) => {
		      normalTabs.sort(comparator);
		      return browser.tabs.move(
			      normalTabs.map((tab) => { return tab.id; }),
			      { index : num_pinned }
		      );
	      }, onError);
}

function onError(error) {
  console.log(error);
}

function initializeSettings() {
  let defaultDict = settingsDefs.reduce(
    (acc, cur, idx, src) => Object.assign(acc, {[cur.id]: false}),
    {});
  return browser.storage.local.get(defaultDict);
}

function clickHandler(evt) {
	if (menuIdToComparator[evt.target.id]) {
		sortTabs(menuIdToComparator[evt.target.id])
			.then(
        () => {
          console.log("Click handler: " + evt.target.id);
          browser.storage.local.set({
            "last-comparator": evt.target.id
          }).then(
				    () => window.close(),
            onError);
			  }, onError);
	} else {
		console.warn('handler not found ' + evt.target.id);
	}
}

function settingsClickHandler(evt, settings) {
  if (settingsMenuIdToHandler[evt.target.id]) {
    console.log(evt.target.id);
    settingsMenuIdToHandler[evt.target.id](evt).then(
      (e) => {
        return browser.storage.local.set({
          [evt.target.id]: evt.target.checked
        });
      }, onError);
  } else {
    console.warn('handler not found ' + evt.target.id);
  }
}

function createButton(buttonDef, settings) {
	let newEl = document.createElement('div');
	newEl.id = buttonDef.id;
  newEl.innerText = buttonDef.title;
	// newEl.src = "../" + buttonDef.icons[16];
	newEl.addEventListener("click", clickHandler);
	return newEl;
}

function settingsSortAutoHandler(tabId, changeInfo, tabInfo) {
  browser.storage.local.get("last-comparator").then(
    (last_comparator) => {
      if (menuIdToComparator[last_comparator]) {
        return sortTabs(menuIdToComparator[last_comparator]);
      }
    }, onError);
}

function onSettingsSortAuto(evt) {
  if (evt.target.checked) {
    browser.tabs.onUpdated.addListener(settingsSortAutoHandler);
  } else {
    browser.tabs.onUpdated.removeListener(settingsSortAutoHandler);
  }

  return Promise.resolve();
}

function onSettingsSortPinned(evt) {
  return Promise.resolve();
}

function createSettingsToggle(buttonDef, settings) {
  let newEl = document.createElement('div');
  newEl.id = buttonDef.id;
  let checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = buttonDef.id;
  checkbox.name = buttonDef.id;
  let label = document.createElement('label');
  label.innerText = buttonDef.title;
  label.htmlFor = buttonDef.id;
  checkbox.checked = settings[buttonDef.id];

  newEl.appendChild(checkbox);
  newEl.appendChild(label);
  newEl.addEventListener(
    "click",
    (evt) => settingsClickHandler(evt, settings));
  return newEl;
}

/**
 * init
 */

// do this before content loaded
// const settingsGroup = settingsDefs.map(createSettingsToggle);
document.addEventListener(
  "DOMContentLoaded",
  () => {
    initializeSettings().then(
      (settings) => {
        console.log(settings);
        const settingsGroup = document.createElement("div");
        const settingsButtons = settingsDefs.map(
          (def) => createSettingsToggle(def, settings));
        settingsButtons.forEach((button) => settingsGroup.appendChild(button));

        const buttons = menuDefs.map(
          (menuDef) => createButton(menuDef, settings));
        const buttonGroup = document.createElement("div");
        buttons.forEach((button) => buttonGroup.appendChild(button));
        // console.log(buttons);

	      let cont = document.getElementById("options");
	      cont.appendChild(buttonGroup);
        cont.appendChild(document.createElement("hr"));
        let settingsCont = document.getElementById("settings");
        settingsCont.appendChild(settingsGroup);
      }, onError);
  },
  (err) => console.log(err));
