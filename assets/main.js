const colors = {
	default: {bg: "white", elem: "black", link: "#0000EE", border: "#A8C3BC"},
	alt: 	 {bg: "black", elem: "white", link: "cyan", border: "teal"}
};
const $=e=>document.getElementById(e), _=e=>document.createElement(e), root=document.documentElement;

function setTheme(theme) {
	for(let type of Object.keys(theme)) root.style.setProperty("--main_"+type+"_color", theme[type]);
}
function toggleTheme() {
	const theme = root.style.getPropertyValue('--main_bg_color') != colors.alt.bg ? colors.alt : colors.default;
	setTheme(theme);
	localStorage.setItem("bg-color", theme.bg);
}

function displayBody() {
	document.body.style.display = "";
}

function attachListeners() {
	// Set dark theme switch state
	const lightSwitch = $("switch");
	lightSwitch.checked = localStorage.getItem("bg-color") == colors.alt.bg;
	lightSwitch.addEventListener("click", toggleTheme);

	// Highlight current location
	const currentPageElement = document.querySelector("[href='"+location.pathname.slice(location.pathname.lastIndexOf("/") + 1)+"']");
	if (currentPageElement) currentPageElement.className = "current";

	// Search on Enter press
	const searchbar = $("searchbar");
	if (searchbar) {
		searchbar.addEventListener("keypress", e => (e.key === "Enter")&&searchHTML());
		searchbar.nextSibling.addEventListener("click", searchHTML);
	}
}

function afterCSS() {
	displayBody();

	// Remove bullet where there is image or details
	const links = document.querySelectorAll("li>a:first-child,li>details:first-child");
	for (var i = 0; i < links.length; i++) {
		let elem = links[i];
		if (getComputedStyle(elem).backgroundImage != "none" && elem.parentNode.firstChild === elem || elem.nodeName === "DETAILS") {
			elem.parentNode.className = "noBullet";
		}
	}

	// Create navigation sidebar
	if (root.scrollHeight-300 > window.outerHeight && !$("sitemap")) {
		createSidebar();
	}
	$(location.hash.slice(1)) && $(location.hash.slice(1)).scrollIntoView();

	// Add last modified date
	if ($("siteDate")) {
		let lastModified = new Date(document.lastModified),
			timeStr = new Intl.DateTimeFormat('et', {
				year: 'numeric', month: '2-digit', day: '2-digit',
				hour: 'numeric', minute: 'numeric', second: 'numeric'})
				.format(lastModified);
		$("siteDate").innerHTML += timeStr.replaceAll(".", "/");
	}
}

function loadTemplate(template) {
	// Load theme based on storage
	root.style.backgroundColor = "var(--main_bg_color)";
	const theme = localStorage.getItem("bg-color") == colors.alt.bg ? colors.alt : colors.default;
	setTheme(theme);

	// Add early instructions to head
	const cssLink = _("link"),
		  faviconLink = _("link");
	cssLink.rel = "stylesheet";
	cssLink.href = "assets/main.css";
	cssLink.type = "text/css";
	faviconLink.rel = "icon";
	faviconLink.href = "data:;";
	document.head.append(cssLink, faviconLink);

	const elements = ["head", "header", "footer"],
		  xhttp = new XMLHttpRequest();

	// Force the response to be parsed as HTML
	xhttp.responseType = 'document';
	xhttp.overrideMimeType('text/html');

	xhttp.onload = function() {
		if (this.status == 200) {
			const importContent = () => {
				for(let elem of elements){
					let docElement = document.getElementsByTagName(elem)[0];
					if (docElement) {
						let importElement = this.responseXML.getElementsByTagName(elem)[0];
						docElement.innerHTML += importElement.innerHTML;
					}
				}
				attachListeners();
				document.querySelector("link[href$='main.css']").addEventListener("load", afterCSS);
			};

			if (document.readyState !== "loading") importContent();
			else document.addEventListener("DOMContentLoaded", importContent);

		} else console.error("Could not load template page");
	}
	xhttp.open("GET", "assets/template" + (template||"") + ".html");
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
	const query = $("searchbar").value.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
		  resultsBox = $("searchResults"),
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
		let listItem = _("li"),
			a = _("a");
		a.href = url;
		a.textContent = title;
		a.style.fontWeight = "bold";
		listItem.appendChild(a);

		let subList = _("ul");
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

				let subListItem = _("li");
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
					let li = _("li");
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
	$("searchResults").style.display = "none";
	window.onscroll();
}

function scrollUp() {
	document.body.scrollTop = 0; // For Safari
	root.scrollTop = 0;
}

function toggleSidebar() {
	root.style.setProperty('--sidebar_width', $("sidebarBtn").checked ? "0px" : "175px");
}

function findListHeading(list, allowNested=true) {
	let heading, text, depth = 0, node = list.previousSibling;
	while (node.nodeName != "MAIN") {

		const parent = node.parentNode;
		if (parent.nodeName == "UL" || parent.className == "detailsList") {
			if (!allowNested) return {};
			depth++;
		}

		if (!heading) {
			while (node.previousSibling && node.nodeType != Node.ELEMENT_NODE && !node.textContent.trim()) {
				node = node.previousSibling;
			}

			let content = node.textContent.trim();
			while (node.nodeType == Node.ELEMENT_NODE) {
				// Join direct children into heading text
				content = Array.from(node.childNodes, ({nodeValue}) => nodeValue).join("").trim();
				node = node.firstChild;
			}
			if (content) {
				if (content.length > 110) return {};
				heading = node.parentNode;
				text = content;
			}
		}
		node = parent;
	}

	return {heading, text, depth};
}

function createSidebar() {
	const elements = document.querySelectorAll("main ul,.detailsList,h3>a"),
		  header = document.getElementsByTagName("header")[0],
		  btn = _("input"),
		  nav = _("nav"),
		  heading = _("span"),
		  div = _("div"),
		  sitemap = _("a");

	btn.id = "sidebarBtn";
	btn.type = "checkbox";
	btn.title = btn.id;
	btn.addEventListener("click", toggleSidebar);

	sitemap.href = "sitemap.html";
	sitemap.target = "_self";
	sitemap.textContent = "Sisukaart";
	div.append(sitemap);

	heading.textContent = "Sisukord";
	nav.id = "sidebar";
	nav.append(heading, div);

	window.onscroll = ()=>{
		// +3 et oleks ühel joonel esimese alapealkirjaga
		nav.style.paddingTop = window.pageYOffset <= header.scrollHeight+3
			? (header.scrollHeight - window.pageYOffset + 23) + "px"
			: "20px";
		btn.style.marginTop = (parseInt(nav.style.paddingTop) - 3) + "px";
	};
	window.onresize = ()=>{
		if (!root.style.getPropertyValue('--sidebar_width')) btn.checked = window.innerWidth < 780 ? true : false;
		window.onscroll();
	};

	for (var i = 0; i < elements.length; i++) {

		const {heading, text, depth} = elements[i].nodeName == "A"
			? {heading: elements[i], text: elements[i].textContent}
			: findListHeading(elements[i], false);
		if (!text) continue;

		// Create link with heading text
		if (!heading.id) {
			heading.id = i;
		}
		const a = _("a");
		a.href = "#" + heading.id;
		a.target = "_self";
		a.textContent = text.replace(/:$/,"");
		div.append(a);
	}
	if (div.childElementCount > 2) {
		header.insertAdjacentElement("afterend", nav);
		header.insertAdjacentElement("afterend", btn);
		window.onresize();
	}
}

document.addEventListener("DOMContentLoaded", function() {
	// Hide until CSS loaded or timeout
	setTimeout(displayBody, 8000);
	document.body.style.display = "none";
});
//window.addEventListener("load", );