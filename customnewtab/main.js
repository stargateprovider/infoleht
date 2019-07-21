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

function fetchFavicon(url, crop=false){
	if (crop){
		url = url.slice(0, url.slice(8).indexOf('/') + 9);
	}
	return "https://www.google.com/s2/favicons?domain=" + url;
}

function appendToQuickLinks(links) {
	var quicklinks = document.getElementById('quick-links');

	for (var i=0; i < links.length; i++) {
		var div = quicklinks.appendChild(document.createElement('div'));
		div.className = "bookmark";
		var a = div.appendChild(document.createElement('a'));
		a.href = links[i].url;

		var icon = new Image();
		icon.src = links[i].favIconUrl;
		a.insertAdjacentElement("afterbegin", icon);
		quickLinksURLs.push(links[i].url);
	}
}
function appendListToSidebar(links, cropLinks=true) {
	var container = document.getElementById("sidebar");
	var ol = container.appendChild(document.createElement('ul'));

	for (var i=0; i < links.length; i++) {
		var link = links[i].hasOwnProperty('tab') ? links[i].tab : links[i];
		if (!link.hasOwnProperty('url') || link.url.startsWith("edge://")){
			continue;
		}
		for (var j in quickLinksURLs){
			if (link.url.includes(quickLinksURLs[j])) {continue;}
		}

		var li = ol.appendChild(document.createElement('li'));
		var a = li.appendChild(document.createElement('a'));
		a.href = link.url;
		a.appendChild(document.createTextNode(link.title));

		var icon = new Image();
		icon.src = link.favIconUrl ? link.favIconUrl : fetchFavicon(link.url, cropLinks);
		a.insertAdjacentElement("afterbegin", icon);
	}
}

/*function fetchWallpaper() {
	var xhttp = new XMLHttpRequest();

	xhttp.onload = function() {
		if (this.readyState == 4 && this.status == 200) {
			docElement = document.getElementById("middle");
			importElement = this.responseXML.getElementsByTagName("item")[1];

			// Parse item data into a temporary 'div' tag
			var div = document.createElement("div");
			var desc = importElement.getElementsByTagName("description")[0];
			var doc = new DOMParser().parseFromString(desc.innerHTML, "text/html");
			div.innerHTML = doc.documentElement.textContent.trim();

			var a = docElement.appendChild(document.createElement("a"));
			var image = a.appendChild(new Image());
			image.src = div.querySelector("img").src;
			a.href = importElement.getElementsByTagName("link")[0].innerHTML;

		} else {console.error("Could not load wallpaper.");}
	}
	xhttp.open("GET", "https://spaceshipsgalore.tumblr.com/rss", true);
	xhttp.send();
}*/

function searchWeb(source) {
	let query = document.getElementById("searchForm").children[0].value;
	window.open(source+query, name="_blank");
	window.close();
}

function saveNotes() {
	localStorage.setItem("notes", document.getElementById("notepad").value);
}

document.addEventListener('DOMContentLoaded', function(e) {
	// Load links from bookmarks and recently closed
	chrome.sessions.getRecentlyClosed(appendListToSidebar);
	chrome.topSites.get(appendListToSidebar);
	chrome.bookmarks.getTree(function(bookmarkTree){
		var links = bookmarkTree[0].children[1].children;
		var musicLinks = links.find(e => e.title=="m").children;
		appendListToSidebar(musicLinks, false);
	});

	// Load links from file
	readFile("links.json", "application/json", function(file){
		var data = JSON.parse(file.responseText);
		appendToQuickLinks(data.quickLinks, false);
		for (let i=0; i < data.slowLinks.length; i++){
			appendListToSidebar(data.slowLinks[i], false);
		}
	});

	// Load notes if it exists in localStorage
	document.getElementById("notepad").value=localStorage.getItem("notes");
	document.getElementById("btn-save-notes").addEventListener("click", saveNotes);

	// Add eventlisteners
	let formInputs = document.getElementById("searchForm").children;
	let query = formInputs[0].value;
	for (let i=1; i < formInputs.length; i++){
		if (formInputs[i].value){
			formInputs[i].addEventListener("click", function(){searchWeb(formInputs[i].value)});
		}
	}

	document.addEventListener("mousemove", (e) => {
		let sidebar = document.getElementById("sidebar");
		let visible = sidebar.style.display;
		let sw = sidebar.offsetWidth;
		let ww = window.innerWidth;
		let mx = e.clientX;
		sidebar.style.display = e.clientY>5 && (ww-mx<20 || (visible && ww-sw-mx<0)) ? "flex" : "none";
	});

	document.getElementById("feeds").ontoggle=function(){
		loadFeeds();
		document.getElementById("feeds").ontoggle=function(){};
	};

	// Focus on searchbar
	formInputs[0].focus();
});

//window.onload = function(){}