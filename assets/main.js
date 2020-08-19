const colors = {
	default: {bg: "white", elem: "black", link: "#0000EE", border: "teal"},
	alt: 	 {bg: "black", elem: "white", link: "cyan"}
};

function changeTheme(color) {
	let root = document.documentElement;
	root.style.setProperty('--main_bg_color', color);
	root.style.setProperty('--main_elem_color', color==colors.default.bg ? colors.default.elem : colors.alt.elem);
	root.style.setProperty('--main_link_color', color==colors.default.bg ? colors.default.link : colors.alt.link);
	localStorage.setItem("bg-color", color);
}
function toggleTheme() {
	let root = document.documentElement,
		color = root.style.getPropertyValue('--main_bg_color');
	root.style.setProperty('--main_bg_color', color!=colors.alt.bg ? colors.alt.bg : colors.default.bg);
	root.style.setProperty('--main_elem_color', color==colors.alt.bg ? colors.default.elem : colors.alt.elem);
	root.style.setProperty('--main_link_color', color==colors.alt.bg ? colors.default.link : colors.alt.link);
	localStorage.setItem("bg-color", color);
}

function includeTemplate() {
	const elements = ["head", "header", "footer"],
		  xhttp = new XMLHttpRequest();

	// Force the response to be parsed as HTML
	xhttp.responseType = 'document';
	xhttp.overrideMimeType('text/html');

	xhttp.onload = function() {
		if (this.readyState == 4 && this.status == 200) {
			for(var i in elements){
				docElement = document.getElementsByTagName(elements[i])[0];
				importElement = this.responseXML.getElementsByTagName(elements[i])[0];
				docElement.innerHTML += importElement.innerHTML;
			}

			// Search on Enter press
			document.getElementById("searchbar").addEventListener("keypress", function (e) {
				if (e.key === "Enter") searchHTML();
			});

			// Add last modified date to footer
			document.getElementsByTagName("footer")[0].innerHTML += document.lastModified;

		} else {console.error("Could not load 'template.html'.");}
	}
	xhttp.open("GET", "assets/template.html");
	xhttp.send();
}

function shortenStr(text, charlimit, middle, dot=false) {
	if (text.length > charlimit) {
		let allow = charlimit/2 - 10,
			start = Math.max(0, middle-allow),
			end = Math.min(middle+allow, text.length);
		text = text.slice(start, end);
		if (dot) {
			text = "..." + text + "...";
		}
	}
	return text;
}

function searchHTML() {
	const query = document.getElementById("searchbar").value.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
		  resultsBox = document.getElementById("searchResults"),
		  resultsHeading = resultsBox.firstElementChild.firstChild,
		  resultsList = resultsBox.lastElementChild;

	resultsBox.style.display = "block";
	resultsHeading.textContent = "0 vastet otsingule:";
	resultsList.innerHTML = "";
	if (query.length < 3) {
		resultsList.innerHTML += "Liiga lühike.";
		return;
	}
	var i, nChildren = 0;

	function createSubList(title, url) {
		let listItem = document.createElement("li"),
			a = document.createElement("a");
		a.href = url;
		a.textContent = title;
		a.style.fontWeight = "bold";
		listItem.appendChild(a);

		let subList = document.createElement("ul");
		subList.className = "detailsList";
		return [listItem, subList];
	}

	var sites = ["index", "charts", "teadvus", "kuiv", "ajalugu", "corona", "praktiline", "tsitaadid", "muu"];
	const regex = new RegExp("("+query+")", "ig"),
		  replacement = "<span class='highlight'>$&</span>",
		  parser = new DOMParser(),
		  decoder = new TextDecoder("windows-1252");

	for (i = 0; i < sites.length; i++) {
		fetch(sites[i]).then(async file => {

			// await, et saada Promise asemel andmed
			let doc = parser.parseFromString(await file.text(), "text/html");
			let filename = file.url.slice(file.url.lastIndexOf("/") + 1);
			var [listItem, subList] = createSubList(doc.title+":", filename);

			// Valib ainult kogu kuvatava teksti igalt lehelt
			var walk = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, null, false);
			while(elem = walk.nextNode()) {

				var subListItem = document.createElement("li");
				let index = elem.textContent.toLowerCase().indexOf(query);
				let elemParent = elem.parentNode.cloneNode(); // deep=false ehk ilma sisuta
				var text = shortenStr(elem.textContent, 150, index).replace(regex, replacement);

				if (index > -1) {

					if (elemParent.localName == "a") {
						elemParent.innerHTML = "..." + text + "...";
						subListItem.appendChild(elemParent);
					} else {
						subListItem.innerHTML = "..." + text + "...";
					}
				}
				else if (elemParent.localName == "a" && elemParent.href.indexOf(query) > -1) {

					elemParent.innerHTML = shortenStr(elemParent.href.replace(/^https?:\/\/w*\.?/, ""))
						.replace(regex, replacement);
					subListItem.appendChild(elemParent);
					subListItem.appendChild(document.createTextNode(" (" + text + ")"));

				}
				else {continue;}
				subList.appendChild(subListItem);
				nChildren++;
			}
			if (subList.hasChildNodes()) {
				listItem.appendChild(subList);
				resultsList.appendChild(listItem);
			}
		});
	}

	sites = ["assets/tsitaadid.txt", "assets/tsitaadid_düün.txt"];
	var [listItem, subList] = createSubList("Tsitaadid:", "tsitaadid.html");

	for (i = 0; i < sites.length; i++) {
		fetch(sites[i])
		.then(file => file.arrayBuffer())
		.then(buffer => {
			let lines = decoder.decode(buffer).split("\n");
			for (var i = 0; i < lines.length; i++) {

				let index = lines[i].toLowerCase().indexOf(query);
				if (index > -1) {
					let li = document.createElement("li");
					li.innerHTML = shortenStr(lines[i], 330, index, true).replace(regex, replacement);
					subList.appendChild(li);
					nChildren++;
				}
			}
			if (subList.hasChildNodes()) {
				listItem.appendChild(subList);
				resultsList.appendChild(listItem);
			}
			resultsHeading.textContent = nChildren + " vastet otsingule '" + query + "':";
		});
	}
}

function closeSearch() {
	document.getElementById("searchResults").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function() {
	// Load theme based on storage
	if (localStorage.getItem("bg-color")){
		changeTheme(localStorage.getItem("bg-color"));
	}
});
window.addEventListener("load", function() {
	// Add some website icons next to their links
	var i, icon, links = document.querySelectorAll("li > a");
	for (i=0; i<links.length; i++) {
		if (links[i].href.match(/[/.]youtu[.b][be][e.]/)) {
			icon = new Image(); //document.createElement("img");
			icon.src = "https://s.ytimg.com/yts/img/favicon-vfl8qSV2F.ico";
			icon.alt = "yt";
		}
		else if (links[i].href.indexOf(".bitchute.") > -1) {
			icon = new Image();
			icon.src = "https://www.bitchute.com/static/v120/images/favicon-32x32.png";
			icon.alt = "";
		}
		else if (links[i].href.indexOf("telegram") > -1) {
			icon = new Image();
			icon.src = "https://www.telegram.ee/wp-content/themes/telegram/favicon/favicon.ico"
			icon.alt = "telegram";
		}
		else if (links[i].href.indexOf("in5d") > -1) {
			icon = new Image();
			icon.src = "https://in5d.com/wp-content/uploads/2019/03/cropped-favicon5-32x32.jpg"
			icon.alt = "in5d";
		}
		else {continue;}
		links[i].insertAdjacentElement("beforebegin", icon);
	}
});
