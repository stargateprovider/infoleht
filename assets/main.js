var colors = {
	default: {bg: "white", elem: "black", link: "#0000EE", border: "teal"},
	alt: 	 {bg: "black", elem: "white", link: "cyan"}
};

function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var c, ca = decodedCookie.split(';');
	for(var i=0; i<ca.length; i++) {
		c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}
function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires="+d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function changeTheme(color) {
	let root = document.documentElement;
	root.style.setProperty('--main_bg_color', color);
	root.style.setProperty('--main_elem_color', color==colors.default.bg ? colors.default.elem : colors.alt.elem);
	root.style.setProperty('--main_link_color', color==colors.default.bg ? colors.default.link : colors.alt.link);
	setCookie("bg-color", color, 365);
}
function toggleTheme() {
	let root = document.documentElement;
	let color = root.style.getPropertyValue('--main_bg_color');
	root.style.setProperty('--main_bg_color', color!=colors.alt.bg ? colors.alt.bg : colors.default.bg);
	root.style.setProperty('--main_elem_color', color==colors.alt.bg ? colors.default.elem : colors.alt.elem);
	root.style.setProperty('--main_link_color', color==colors.alt.bg ? colors.default.link : colors.alt.link);
	setCookie("bg-color", color, 365);
}
function includeHTML() {
	var z, i, elmnt, file, xhttp;
	/* Loop through a collection of all HTML elements: */
	z = document.getElementsByTagName("*");
	for (i = 0; i < z.length; i++) {
		elmnt = z[i];
		/*search for elements with a certain atrribute:*/
		file = elmnt.getAttribute("w3-include-html");
		if (file) {
			/* Make an HTTP request using the attribute value as the file name: */
			xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4) {
					if (this.status == 200) {elmnt.innerHTML += this.responseText;}
					if (this.status == 404) {elmnt.innerHTML += " imported page not found.";}
					/* Remove the attribute, and call this function once more: */
					elmnt.removeAttribute("w3-include-html");
					includeHTML();
				}
			}
			xhttp.open("GET", file, true);
			xhttp.send();
			/* Exit the function: */
			return;
		}
	}
}
function includeTemplate() {
	var elements = ["head", "header"];
	var xhttp = new XMLHttpRequest();

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

		} else {console.error("Could not load 'template.html'.");}
	}
	xhttp.open("GET", "assets/template.html", true);
	xhttp.send();
	return;
}

function searchHTML() {
	var query = document.getElementById("searchbar").value.toLowerCase();
	var resultsBox = document.getElementById("searchResults");
	resultsBox.style.display = "block";

	var resultsList = resultsBox.lastElementChild;
	resultsList.innerHTML = "";
	if (query.length < 3) {
		resultsList.innerHTML += "Liiga lühike.";
		return;
	}

	var sites = ["index", "charts", "teadvus", "kuiv", "ajalugu", "corona", "praktiline", "tsitaadid", "muu"];
	const regex = new RegExp("("+query+")", "ig");
	const replacement = "<span class='highlight'>$&</span>";
	const parser = new DOMParser();

	for (i = 0; i < sites.length; i++) {
		fetch(sites[i])
		.then(file=>file.text())
		.then(filetext => {
			let doc = parser.parseFromString(filetext, "text/html");
			console.log(doc)
			let listItem = document.createElement("li");
			let a = document.createElement("a");
			a.href = filename;
			a.textContent = doc.title + ":";
			a.style.fontWeight = "bold";
			listItem.appendChild(a);

			var subList = document.createElement("ul");
			subList.className = "detailsList";

			// Valib ainult kogu kuvatava teksti igalt lehelt
			var walk = document.createTreeWalker(this.responseXML.body, NodeFilter.SHOW_TEXT, null, false);
			while(elem = walk.nextNode()) {

				var subListItem = document.createElement("li");
				let index = elem.textContent.toLowerCase().indexOf(query);
				let elemParent = elem.parentNode.cloneNode(); // deep=false ehk ilma sisuta

				let text = elem.textContent;
				if (text.length > 150) {
					let start = Math.max(0, index-65);
					let end = Math.min(index+65, text.length);
					text = text.slice(start, end);
				}
				text = "..." + text.replace(regex, replacement) + "...";

				if (index > -1) {

					if (elemParent.localName == "a") {
						elemParent.innerHTML = text;
						subListItem.appendChild(elemParent);
					} else {
						subListItem.innerHTML = text;
					}
					subList.appendChild(subListItem);
				}
				else if (elemParent.localName == "a" && elemParent.href.indexOf(query) > -1) {

					elemParent.innerHTML = elemParent.href.replace(/^https?:\/\/w*\.?/, "").replace(regex, replacement);
					subListItem.appendChild(elemParent);
					subListItem.appendChild(document.createTextNode(" (" + text + ")"));
					subList.appendChild(subListItem);
				}
			}
			if (subList.hasChildNodes()) {
				listItem.appendChild(subList);
				resultsList.appendChild(listItem);
			}
		});
	}


	sites = ["assets/tsitaadid.txt", "assets/tsitaadid_düün.txt"];

	let listItem = document.createElement("li");
	let a = document.createElement("a");
	a.href = "tsitaadid.html";
	a.textContent = "Tsitaadid:";
	a.style.fontWeight = "bold";
	listItem.appendChild(a);

	var subList = document.createElement("ul");
	subList.className = "detailsList";
	const decoder = new TextDecoder("windows-1252");

	for (i = 0; i < sites.length; i++) {
		fetch(sites[i])
		.then(file => file.arrayBuffer())
		.then(buffer => {
			let lines = decoder.decode(buffer).split("\n");
			for (var i = 0; i < lines.length; i++) {

				if (lines[i].toLowerCase().includes(query)) {
					let li = document.createElement("li");
					let text = lines[i];
					if (text.length > 355) {
						let start = Math.max(0, index-165);
						let end = Math.min(index+165, text.length);
						text = text.slice(start, end);
					}
					li.innerHTML = "..." + text.replace(regex, replacement) + "...";
					subList.appendChild(li);
				}
			}
			if (subList.hasChildNodes()) {
				listItem.appendChild(subList);
				resultsList.appendChild(listItem);
			}
		});
	}
}

function closeSearch() {
	document.getElementById("searchResults").style.display = "none";
}

window.addEventListener("load", function() {
	// Add some website icons next to their links
	var icon, links = document.querySelectorAll("li > a");
	for (var i=0; i<links.length; i++) {
		if (links[i].href.match(/[/.]youtu[.b][be][e.]/)) {
			icon = new Image(); //document.createElement("img");
			icon.src = "https://s.ytimg.com/yts/img/favicon-vfl8qSV2F.ico";
			icon.alt = "yt_icon";
		}
		else if (links[i].href.indexOf(".bitchute.") > -1) {
			icon = new Image();
			icon.src = "https://www.bitchute.com/static/v120/images/favicon-32x32.png";
			icon.alt = "";
		}
		else if (links[i].href.indexOf("telegram") > -1) {
			icon = new Image();
			icon.src = "https://www.telegram.ee/wp-content/themes/telegram/favicon/favicon.ico"
			icon.alt = "telegram_icon";
		}
		else if (links[i].href.indexOf("in5d") > -1) {
			icon = new Image();
			icon.src = "https://in5d.com/wp-content/uploads/2019/03/cropped-favicon5-32x32.jpg"
			icon.alt = "in5d_icon";
		}
		else {continue;}
		links[i].insertAdjacentElement("beforebegin", icon);
	}

	// Load theme based on cookies
	if (getCookie("bg-color") != ""){
		changeTheme(getCookie("bg-color"));
	}

	// Add last modified date to footer
	var x = document.lastModified;
	document.getElementsByTagName("footer")[0].innerHTML += " | Loodud 28/06/2019 | Viimati muudetud " + x;
});
