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
	let color = document.documentElement.style.getPropertyValue('--main_bg_color');
	changeTheme(color != colors.alt.bg ? colors.alt.bg : colors.default.bg);
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

			// Set dark theme switch state
			document.getElementById("switch").checked = localStorage.getItem("bg-color") == colors.alt.bg;

			// Search on Enter press
			document.getElementById("searchbar").addEventListener("keypress", function (e) {
				if (e.key === "Enter") searchHTML();
			});
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
				else if (elemParent.localName == "a" && (index = elemParent.href.indexOf(query)) > -1) {

					elemParent.innerHTML = shortenStr(elemParent.href.replace(/^https?:\/\/w*\.?/, ""), 100, index-5)
						.replace(regex, replacement);
					subListItem.appendChild(elemParent);
					subListItem.append(" (" + text + ")");

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

function scrollUp() {
	document.body.scrollTop = 0; // For Safari
	document.documentElement.scrollTop = 0;
}

document.addEventListener("DOMContentLoaded", function() {
	// Load theme based on storage
	if (localStorage.getItem("bg-color") == colors.alt.bg) {
		changeTheme(colors.alt.bg);
	}
});
window.addEventListener("load", function() {
	// Add last modified date
	if (document.getElementById("siteDate")) {
		let lastModified = new Date(document.lastModified),
			timeStr = new Intl.DateTimeFormat('et', {
				year: 'numeric', month: '2-digit', day: '2-digit',
				hour: 'numeric', minute: 'numeric', second: 'numeric'})
				.format(lastModified);
		document.getElementById("siteDate").innerHTML += timeStr.replaceAll(".", "/");
	}
});
