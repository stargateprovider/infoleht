const REGEX_DEFAULT = "item>\\s*<title>(?<name>.+?)</title>[\\s\\S]*?<link>(?:<!\\[CDATA\\[)?(?<link>.+?)(?:\\]\\]>)?<[\\s\\S]+?pubDate>(?<date>.+?)<[\\s\\S]+?(?<desc><description>[\\s\\S]+?</description>)";
var quickLinksURLs = [];
var bookmarkColor = "#333"

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
	var prefix = prefix ? prefix : "";

	var newElem = document.createElement.bind(document);
	var details = newElem("details");
	var summary = details.appendChild(newElem("summary"));
	summary.appendChild(document.createTextNode(name));

	var processFeed = function(file) {
		if (!regexStr){
			regexStr = REGEX_DEFAULT;
		}
		var data = file.responseText.matchAll(new RegExp(regexStr, "g"));

		var parser = new DOMParser();
		var ul = newElem("ul");
		var a, li, textarea, newEntry, match, matchGroup, doc, i = 0, newEntry = false;
		while (!(match = data.next()).done && i++ < 30) {
			matchGroup = match.value.groups;

			li = ul.appendChild(newElem("li"));
			a = li.appendChild(newElem("a"));
			a.className = "tooltipBox";
			a.href = parser.parseFromString(prefix+matchGroup.link, "text/html").documentElement.textContent;
			a.appendChild(document.createTextNode(parser.parseFromString(matchGroup.name, "text/html").documentElement.textContent));

			textarea = a.appendChild(newElem("textarea"));
			textarea.className = "tooltipText";
			textarea.setAttribute("readonly", "true");
			textarea.appendChild(document.createTextNode(matchGroup.date));
			if (matchGroup["desc"]){
				doc = parser.parseFromString(matchGroup.desc, "text/html");
				doc = parser.parseFromString(doc.documentElement.textContent.trim(), "text/html");
				textarea.appendChild(document.createTextNode("\n\n"+doc.documentElement.textContent));
			}

			if (!lastcheck || new Date(matchGroup.date) >= lastcheck){
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

function addBookmark(event){
	event.preventDefault();

	let inputs = event.target.childNodes;
	let a1 = document.createElement("a");
	let a2 = document.createElement("a");
	a1.href = inputs[0].value; // Converts
	a2.href = inputs[1].value; // Converts
	let obj = {"url":a1.href, "favIconUrl":a2.href};
	appendToQuickLinks([obj]);

	let localQuickLinks = JSON.parse(localStorage.getItem("quick-links"));
	localQuickLinks.push(obj);
	localStorage.setItem("quick-links", JSON.stringify(localQuickLinks));
}
function moveBookmark(event){
	event.preventDefault();
	let container = document.getElementById("quick-links");
	let bookmarks = container.childNodes;
	for (var i=0; bookmarks[++i] != event.currentTarget;);

	if (i>1){
		let removed = container.removeChild(bookmarks[i]);
		container.insertBefore(removed, bookmarks[i-1]);

		let localQuickLinks = JSON.parse(localStorage.getItem("quick-links"));
		[localQuickLinks[i-1], localQuickLinks[i-2]] = [localQuickLinks[i-2], localQuickLinks[i-1]]
		localStorage.setItem("quick-links", JSON.stringify(localQuickLinks));
	}
}
function delBookmark(event){
	event.preventDefault();
	let container = document.getElementById("quick-links");
	let bookmarks = container.childNodes;
	for (var i=0; bookmarks[++i] != event.currentTarget;);
	container.removeChild(bookmarks[i]);

	let localQuickLinks = JSON.parse(localStorage.getItem("quick-links"));
	localQuickLinks.splice(i-1, 1);
	localStorage.setItem("quick-links", JSON.stringify(localQuickLinks));
}
function setBookmarkClickEvent(bg, func=undefined){
	let bookmarks = document.getElementsByClassName("bookmark");
	bookmarkColor = bookmarkColor != bg ? bg : "#333";
	for (let i=0; i<bookmarks.length; i++){
		bookmarks[i].removeEventListener("click", delBookmark);
		bookmarks[i].removeEventListener("click", moveBookmark);
		bookmarks[i].style.background = bookmarkColor;
		if (func && bookmarkColor == bg){
			bookmarks[i].addEventListener("click", func);
		}
	}
}

document.addEventListener("DOMContentLoaded", function(e) {
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
		let localQuickLinks = JSON.parse(localStorage.getItem("quick-links"));
		if (localQuickLinks){
			appendToQuickLinks(localQuickLinks);
		} else {
			localStorage.setItem("quick-links", JSON.stringify(data.quickLinks));
			appendToQuickLinks(data.quickLinks);
		}

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

	// Bind bookmark editing buttons
	getElemById("quick-links-add").addEventListener("click", e=>{
		setBookmarkClickEvent("#333");
		let form = getElemById("form-popup");
		let top = getElemById("quick-links-add").getBoundingClientRect().top;
		form.style.top = top.toString() + "px";
		form.style.display = form.style.display != "block" ? "block" : "none";
	});
	getElemById("form-popup").addEventListener("submit", addBookmark);
	getElemById("quick-links-move").addEventListener("click", e=>{
		setBookmarkClickEvent("darkblue", moveBookmark)});
	getElemById("quick-links-del").addEventListener("click", e=>{
		setBookmarkClickEvent("darkred", delBookmark)});

	// Load notes if it exists in localStorage
	var notepad = getElemById("notepad");
	notepad.value = localStorage.getItem("notes");
	// Eventlisteners for saving notes
	var saveNotes = function(){
		localStorage.setItem("notes", notepad.value);
	};
	getElemById("btn-save-notes").addEventListener("click", saveNotes);
	notepad.addEventListener("keydown", e=>{
		if (e.ctrlKey && e.key == "s"){
			e.preventDefault();
			saveNotes();
		}
	});

	// Eventlistener for searchForm
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

	// Eventlistener for sidebar
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

	// Focus on searchbar
	searchbar.focus();
});
//window.onload = function(){}