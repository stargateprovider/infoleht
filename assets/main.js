const colors = {
	default: {bg: "white", elem: "black", link: "#0000EE", border: "#A8C3BC"},
	alt: 	 {bg: "black", elem: "white", link: "cyan", border: "teal"}
};

function changeTheme(color) {
	const root = document.documentElement;
	root.style.setProperty('--main_bg_color', color);
	root.style.setProperty('--main_elem_color', color==colors.default.bg ? colors.default.elem : colors.alt.elem);
	root.style.setProperty('--main_link_color', color==colors.default.bg ? colors.default.link : colors.alt.link);
	root.style.setProperty('--main_border_color', color==colors.default.bg ? colors.default.border : colors.alt.border);
	localStorage.setItem("bg-color", color);
}
function toggleTheme() {
	let color = document.documentElement.style.getPropertyValue('--main_bg_color');
	changeTheme(color != colors.alt.bg ? colors.alt.bg : colors.default.bg);
}

function attachListeners() {
	// Set dark theme switch state
	const lightSwitch = document.getElementById("switch");
	lightSwitch.checked = localStorage.getItem("bg-color") == colors.alt.bg;
	lightSwitch.addEventListener("click", toggleTheme);

	// Highlight current location
	const currentPageElement = document.querySelector("[href='"+location.pathname.slice(location.pathname.lastIndexOf("/") + 1)+"']");
	if (currentPageElement) currentPageElement.className = "current";

	// Search on Enter press
	const searchbar = document.getElementById("searchbar");
	if (searchbar) {
		searchbar.addEventListener("keypress", e=>{if (e.key === "Enter") searchHTML();});
		searchbar.nextSibling.addEventListener("click", searchHTML);
	}
}

function afterCSS() {
	// Remove bullet where there is image or details
	const links = document.querySelectorAll("li>a:first-child,li>details:first-child");
	for (var i = 0; i < links.length; i++) {
		let elem = links[i];
		if (getComputedStyle(elem).backgroundImage != "none" && elem.parentNode.firstChild === elem || elem.nodeName === "DETAILS") {
			elem.parentNode.className = "noBullet";
		}
	}
	// Create navigation sidebar
	if (document.documentElement.scrollHeight-300 > window.outerHeight) {
		createSidebar();
	}
}

function includeTemplate(alternative) {
	const elements = ["head", "header", "footer"],
		  xhttp = new XMLHttpRequest();

	// Force the response to be parsed as HTML
	xhttp.responseType = 'document';
	xhttp.overrideMimeType('text/html');

	xhttp.onload = function() {
		if (this.readyState == 4 && this.status == 200) {
			for(var i in elements){
				docElement = document.getElementsByTagName(elements[i])[0];
				if (docElement) {
					importElement = this.responseXML.getElementsByTagName(elements[i])[0];
					docElement.innerHTML += importElement.innerHTML;
				}
			}
			attachListeners();
			document.querySelector("link[href$='main.css']").addEventListener("load", afterCSS);

		} else {console.error("Could not load template page");}
	}
	xhttp.open("GET", "assets/template" + (alternative?"2":"") + ".html");
	xhttp.send();
}

function shortenStr(text, charlimit, middle, dot=false) {
	if (text.length > charlimit) {
		const allow = charlimit/2 - 10,
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

	let listItem, subList, sites = ["index", "charts", "teadvus", "kuiv", "ajalugu", "corona", "filo", "vandenou_sissejuhatus", "europa_allikad", "praktiline", "muu"];
	const regex = new RegExp("("+query+")", "ig"),
		  replacement = "<span class='highlight'>$&</span>",
		  parser = new DOMParser(),
		  decoder = new TextDecoder("windows-1252");

	for (i = 0; i < sites.length; i++) {
		fetch(sites[i]+".html").then(async file => {

			// await, et saada Promise asemel andmed
			let doc = parser.parseFromString(await file.text(), "text/html");
			let filename = file.url.slice(file.url.lastIndexOf("/") + 1);
			[listItem, subList] = createSubList(doc.title+":", filename);

			// Valib ainult kogu kuvatava teksti igalt lehelt
			let walk = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, null, false);
			while(elem = walk.nextNode()) {

				let subListItem = document.createElement("li");
				let index = elem.textContent.toLowerCase().indexOf(query);
				let elemParent = elem.parentNode.cloneNode(); // deep=false ehk ilma sisuta
				let text = shortenStr(elem.textContent, 150, index).replace(regex, replacement);

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
			resultsHeading.textContent = nChildren + " vastet otsingule '" + query + "':";
		});
	}

	let listItem2, subList2, sites2 = ["assets/tsitaadid.txt", "assets/tsitaadid_düün.txt"];
	[listItem2, subList2] = createSubList("Tsitaadid:", "tsitaadid.html");

	for (i = 0; i < sites2.length; i++) {
		fetch(sites2[i])
		.then(file => file.arrayBuffer())
		.then(buffer => {
			let lines = decoder.decode(buffer).split("\n");
			for (var i = 0; i < lines.length; i++) {

				let index = lines[i].toLowerCase().indexOf(query);
				if (index > -1) {
					let li = document.createElement("li");
					li.innerHTML = shortenStr(lines[i], 330, index, true).replace(regex, replacement);
					subList2.appendChild(li);
					nChildren++;
				}
			}
			if (subList2.hasChildNodes()) {
				listItem2.appendChild(subList2);
				resultsList.appendChild(listItem2);
			}
			resultsHeading.textContent = nChildren + " vastet otsingule '" + query + "':";
		});
	}
}

function closeSearch() {
	document.getElementById("searchResults").style.display = "none";
	window.onscroll();
}

function scrollUp() {
	document.body.scrollTop = 0; // For Safari
	document.documentElement.scrollTop = 0;
}

function toggleSidebar() {
	const nav = document.getElementById("sidebar"),
		  btn = document.getElementById("sidebarBtn");
	
	if (nav.style.display != "none") {
		btn.textContent = "<<";
		nav.style.display = "none";
	} else {
		btn.textContent = ">>";
		nav.style.display = "block";
	}
}

function createSidebar() {
	const elements = document.querySelectorAll("*:not(nav,#searchResults,li)>ul,.detailsList,.chapter"),
		  header = document.getElementsByTagName("header")[0],
		  nav = document.createElement("nav"),
		  btn = document.createElement("button"),
		  div = document.createElement("div");
	btn.id = "sidebarBtn";
	btn.textContent = ">>";
	btn.addEventListener("click", toggleSidebar);
	nav.id = "sidebar";
	nav.append("Sisukord");
	nav.append(div);

	window.onscroll = ()=>{
		// +3 et oleks ühel joonel esimese alapealkirjaga
		nav.style.paddingTop = btn.style.marginTop = window.pageYOffset <= header.scrollHeight+3
			? (header.scrollHeight - window.pageYOffset + 23).toString() + "px"
			: "20px";
	};

	for (var i = 0; i < elements.length; i++) {
		let heading, parent = elements[i].parentNode;

		// Skip if nested list
		while (parent.nodeName != "BODY" && parent.nodeName != "UL" && parent.className != "detailsList") {
			if (!heading && parent.firstChild.textContent.trim()) {
				heading = parent;
			}
			parent = parent.parentNode;
		}

		// Find list heading
		if (elements[i].previousElementSibling) heading = elements[i].previousElementSibling;
		if (parent.nodeName != "BODY" || !heading) continue;

		// Create link with heading text
		if (!heading.id) {
			heading.id = i;
		}
		let a = document.createElement("a");
		a.href = "#" + heading.id;
		a.target = "_self";

		while (heading.nodeType != 3) heading = heading.firstChild;
		a.textContent = heading.textContent.replace(/:$/,"");
		div.append(a);
	}
	if (div.childElementCount > 1) {
		header.insertAdjacentElement("afterend", nav);
		header.insertAdjacentElement("afterend", btn);
		window.onscroll();
	}
}

document.addEventListener("DOMContentLoaded", function() {
	// Load theme based on storage
	changeTheme(localStorage.getItem("bg-color") == colors.alt.bg ? colors.alt.bg : colors.default.bg);
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
