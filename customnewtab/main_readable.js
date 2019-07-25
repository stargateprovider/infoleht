const REGEX_DEFAULT = "item>\\s*<title>(?<name>.+?)</title>[\\s\\S]*?<link>(?:<!\\[CDATA\\[)?(?<link>.+?)(?:\\]\\]>)?<[\\s\\S]+?pubDate>(?<date>.+?)<";
var quickLinksURLs = [];

function readFile(file, type, callback) {
	var rawFile = new XMLHttpRequest();
	rawFile.overrideMimeType(type);
	rawFile.open("GET", file, true);
	rawFile.onload = function() {
		if (rawFile.readyState === 4 && rawFile.status == "200") {
			callback(rawFile);
		}
	}
	rawFile.send(null);
}

function loadFeeds(name, dataArray, container, lastcheck){
	var [url, regexStr, prefix] = dataArray;

	var newElem = document.createElement.bind(document);
	var details = newElem("details");
	var summary = details.appendChild(newElem("summary"));
	summary.appendChild(document.createTextNode(name));

	var processFeed = function(file) {
		var fileText = file.responseText;
		if (!regexStr){
			regexStr = REGEX_DEFAULT;
		}
		var regex = new RegExp(regexStr, "g");
		var data = fileText.matchAll(regex);
		var ul = newElem("ul");

		var parser = new DOMParser();
		var match, i = 0, newEntry = false;
		while (!(match = data.next()).done && i++ < 30) {
			matchGroup = match.value.groups;

			var li = ul.appendChild(newElem("li"));
			var a = li.appendChild(newElem("a"));
			a.href = parser.parseFromString(prefix + matchGroup["link"], "text/html").documentElement.textContent;
			a.appendChild(document.createTextNode(parser.parseFromString(matchGroup["name"], "text/html").documentElement.textContent));
			var textarea = a.appendChild(newElem("textarea"));

			textarea.appendChild(document.createTextNode(matchGroup["date"]));
			if (matchGroup["desc"]){
				textarea.appendChild(document.createTextNode("\n"+matchGroup["desc"]));
			}
			a.className = "tooltipBox";
			textarea.className = "tooltipText";
			textarea.setAttribute("readonly", "true");

			if (!lastcheck || new Date(matchGroup["date"]) >= lastcheck){
				a.style.color = "cyan";
				newEntry = true;
			}
		}
		if (newEntry){
			details.appendChild(ul);
			container.appendChild(details);
		}
	}

	if (Array.isArray(url)){
		for (i=0; i<url.length; i++){
			readFile(url[i], "text/xml", processFeed);
		}
	} else {
		readFile(url, "text/xml", processFeed);
	}
}

function fetchFavicon(url, crop=false){
	if (crop){
		url = url.slice(0, url.slice(8).indexOf('/') + 9);
	}
	return "https://www.google.com/s2/favicons?domain=" + url;
}

function appendToQuickLinks(links) {
	var quicklinks = document.getElementById('quick-links');

	for (var i=0; i < links.length; i++) {
		var div = document.createElement("div");
		div.className = "bookmark";
		var a = div.appendChild(document.createElement("a"));
		a.href = links[i].url;

		var icon = new Image();
		icon.src = links[i].favIconUrl;
		a.insertAdjacentElement("afterbegin", icon);

		quicklinks.appendChild(div);
		quickLinksURLs.push(links[i].url);
	}
}
function appendListToSidebar(links, cropLinks=true) {
	var newElem = document.createElement.bind(document)
	var container = document.getElementById("sidebar");
	var ol = newElem("ul");

	nQuickLinks = quickLinksURLs.length;
	for (var i=0; i < links.length; i++) {
		var link = links[i].hasOwnProperty("tab") ? links[i].tab : links[i];
		if (!link.hasOwnProperty("url") || link.url.startsWith("edge://")){
			continue;
		}
		var linkIsIn = link.url.includes.bind(link.url);
		for (var j=0; j<nQuickLinks; j++){
			if (linkIsIn(quickLinksURLs[j])) {continue;}
		}

		var li = ol.appendChild(newElem("li"));
		var a = li.appendChild(newElem("a"));
		a.href = link.url;
		a.appendChild(document.createTextNode(link.title));

		var icon = new Image();
		icon.src = link.favIconUrl ? link.favIconUrl : fetchFavicon(link.url, cropLinks);
		a.insertAdjacentElement("afterbegin", icon);
	}
	container.appendChild(ol);
}

document.addEventListener('DOMContentLoaded', function(e) {
	console.time("main-load");
	var getElemById = document.getElementById.bind(document);

	// Determine if we are local
	var otherBookmarksId;
	if (window.location.origin.startsWith("chrome-extension://")){
		otherBookmarksId = "2";}
	else if (window.location.origin.startsWith("moz-extension://")){
		otherBookmarksId = "unfiled_____";}

	if (typeof otherBookmarksId !== "undefined"){
		// Load links from bookmarks and recently closed
		chrome.sessions.getRecentlyClosed(appendListToSidebar);
		chrome.topSites.get(appendListToSidebar);
		chrome.bookmarks.getSubTree(otherBookmarksId, function(bookmarkTree){
			var musicLinks = bookmarkTree[0].children.find(e => e.title=="m").children;
			appendListToSidebar(musicLinks, false);
		});
	}

	var feedsContainer = document.getElementById("feeds");
	// Load links and feeds from file
	var jsonFileHandler = function(responseText){
		var data = JSON.parse(responseText);
		appendToQuickLinks(data.quickLinks);
		linksArrayLen = data.slowLinks.length;
		for (let i=0; i < linksArrayLen; i++){
			appendListToSidebar(data.slowLinks[i], false);
		}

		var feedsToggleHandler = function(){
			this.removeEventListener("toggle", feedsToggleHandler);
			var lastcheck = new Date(localStorage.getItem("lastcheck"));

			webfeeds = data.feeds.Web;
			for(obj in webfeeds){
				loadFeeds(obj, webfeeds[obj], feedsContainer, lastcheck);
			}
			localStorage.setItem("lastcheck", new Date);
		}
		feedsContainer.addEventListener("toggle", feedsToggleHandler);
	}

	var staticLinks = sessionStorage.getItem("staticLinks");
	if (staticLinks){
		jsonFileHandler(staticLinks);
	}
	else{
		readFile("links.json",
			"application/json",
			file => {
				responseText = file.responseText;
				sessionStorage.setItem("staticLinks", responseText);
				jsonFileHandler(responseText);
			}
	);}

	// Load notes if it exists in localStorage
	var notepad = getElemById("notepad")
	notepad.value = localStorage.getItem("notes");
	var saveNotes = function(){
		localStorage.setItem("notes", notepad.value);
	};
	getElemById("btn-save-notes").addEventListener("click", saveNotes);

	// Add eventlisteners
	var searchForm = getElemById("searchForm");
	var searchbar = searchForm.children[0];
	searchForm.addEventListener("click", function(e){
		if (e.target.name){
			let parameters = e.target.name.split("&");
			for (var j=0; j<parameters.length-1; j++){

				let pair = parameters[j].split("=");
				let input = document.createElement("input");
				input.setAttribute("type", "hidden");
				input.setAttribute("name", pair[0]);
				input.setAttribute("value", pair[1]);
				searchForm.appendChild(input);
			}
			searchbar.name = parameters[j];
		}else{
			searchbar.name = "q";
		}
		searchForm.target = e.ctrlKey ? "_blank" : "_self";
	});

	var sidebar = getElemById("sidebar");
	document.addEventListener("mousemove", e => {
		if (e.altKey){
			return;
		}
		let visible = sidebar.style.display;
		let sw = sidebar.offsetWidth;
		let ww = window.innerWidth;
		let mx = e.clientX;
		sidebar.style.display = e.clientY>5 && (ww-mx<20 || (visible && ww-sw-mx<0)) ? "flex" : "none";
	});

	notepad.addEventListener("keydown", e => {
		if (e.ctrlKey && e.key == "s"){
			e.preventDefault();
			saveNotes();
		}
	});

	// Focus on searchbar
	searchbar.focus();
	console.timeEnd("main-load");
});
//window.onload = function(){}