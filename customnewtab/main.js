const quickLinksURLs = [
"https://www.youtube.com/",
"https://mail.google.com/mail/#inbox",
"https://outlook.live.com/owa/",
"https://onedrive.live.com/",
"https://www.github.com",
"https://stargateprovider.github.io/infoleht",
"https://www.swedbank.ee/private",
]
const quickLinksFavicons = [
"https://s.ytimg.com/yts/img/favicon_32-vflOogEID.png",
"https://ssl.gstatic.com/ui/v1/icons/mail/images/favicon5.ico",
"https://outlook.live.com/favicon.ico",
"https://onedrive.live.com/favicon.ico",
"https://www.github.com/favicon.ico",
"https://stargateprovider.github.io/infoleht/images/icon32.png",
"https://www.swedbank.ee/favicon.ico",
]

function insertFavicon(tag, url, crop=false, pos="afterbegin"){
	var icon = new Image();
	if (crop){
		url = url.slice(0, url.slice(8).indexOf('/') + 9);
	}

	icon.src = "https://www.google.com/s2/favicons?domain=" + url;
	tag.insertAdjacentElement(pos, icon);
}

function appendToContainer(parentId, links, favicons) {
	var quicklinks = document.getElementById(parentId);

	for (var i=0; i < links.length; i++) {
		var div = quicklinks.appendChild(document.createElement('div'));
		div.className = "bookmark"
		var a = div.appendChild(document.createElement('a'));
		a.href = links[i];

		var icon = new Image();
		icon.src = favicons[i];
		a.insertAdjacentElement("afterbegin", icon);
	}
}
function appendToSlowLinks(links) {
	var quicklinks = document.getElementById("slow-links");

	for (var i=0; i < links.length; i++) {
		var div = quicklinks.appendChild(document.createElement('div'));
		div.className = "bookmark"
		var a = div.appendChild(document.createElement('a'));
		a.href = links[i];

		var icon = new Image();
		icon.src = favicons[i];
		a.insertAdjacentElement("afterbegin", icon);
	}
}
function appendToSidebar(links) {
	var popupDiv = document.getElementById('sidebar');
	var ol = popupDiv.appendChild(document.createElement('ul'));

	for (var i=0; i < links.length; i++) {
		var link = links[i].hasOwnProperty('tab') ? links[i].tab : links[i];
		if (link.url.includes(quickLinksURLs[i])){
			continue;
		}

		var li = ol.appendChild(document.createElement('li'));
		var a = li.appendChild(document.createElement('a'));
		a.href = link.url;
		a.appendChild(document.createTextNode(link.title));
		insertFavicon(a, link.url, true);
	}
}

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
	appendToContainer("quick-links", quickLinksURLs, quickLinksFavicons);

	chrome.sessions.getRecentlyClosed(appendToSidebar);
	chrome.topSites.get(appendToSidebar);
	chrome.bookmarks.getTree(function(bookmarkTree){
		var links = bookmarkTree[0].children[1].children;
		var musicLinks = links[4].children;
		appendToSidebar(musicLinks);
	});

	// Add favicons next to links
	var links = document.querySelectorAll("li > a");
	for (var i=0; i<links.length; i++) {
		insertFavicon(links[i], links[i].href, true);
	}

	let formInputs = document.getElementById("searchForm").children;
	let query = formInputs[0].value;
	for (let i=1; i < formInputs.length; i++){
		if (formInputs[i].value){
			formInputs[i].addEventListener("click", function(){searchWeb(formInputs[i].value)});
		}
	}

	// Load notes if it exists in localStorage
	document.getElementById("notepad").value=localStorage.getItem("notes");
	document.getElementById("btn-save-notes").addEventListener("click", saveNotes);

	document.addEventListener("mousemove", (e) => {
		let sidebar = document.getElementById("sidebar");
		let visible = sidebar.style.display;
		let sw = sidebar.offsetWidth;
		let ww = window.innerWidth;
		let mx = e.clientX;
		sidebar.style.display = e.clientY>45 && (ww-mx<75 || (visible && ww-sw-mx<0)) ? "flex" : "none";
	});
})

window.onload = function(){
	document.getElementById("feeds").open = false;
	document.getElementById("searchForm").children[0].focus();
}

