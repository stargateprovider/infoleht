if(typeof _!="function")_=e=>document.createElement(e);
//Proxyd: https://gist.github.com/jimmywarting/ac1be6ea0297c16c477e17f8fbe51347
const proxy = "https://api.allorigins.win/raw?url=";
const initSources = [];
const sources = [];

{ //Load CSS
const cssLink = _("link");
cssLink.rel = "stylesheet";
cssLink.href = "assets/rssfeed.css";
cssLink.type = "text/css";
document.head.appendChild(cssLink);
}

function getTitle(el) {
	return el.getElementsByTagName("title")[0].textContent;
}

async function fetchFeeds(n) {
	const findDate = el => el.querySelector("pubDate,published,updated").innerHTML,
		  parser = new DOMParser(),
		  promises = [],
		  dataArray = [],
		  srcNames = new Array(sources.length);

	for (let i = 0; i < sources.length; i++) {
		promises.push(
			fetch(proxy + sources[i].url, {cache: "no-cache"}) // no-cache kontrollib kas serveris on uuem versioon
			.then(file => file.text())
			.then(str => {
				const doc = parser.parseFromString(str, "text/xml");
				srcNames[i] = getTitle(doc);
				dataArray.push(...Array.from(doc.querySelectorAll("item,entry"), item=>({item, i})));
			})
			.catch(err => console.error(err + " " + sources[i].url))
		);
	}
	await Promise.allSettled(promises);

	dataArray.sort((a,b) => {
		let da = new Date(findDate(a.item)),
			db = new Date(findDate(b.item));
		return (db > da) - (db < da);
	});

	const ul = _("ul"), len = dataArray.length;
	let item, link, a, li, tooltip, desc, media, img;

	for (var i = 0; i < len && i < n; i++) {
		item = dataArray[i].item;
		li = _("li");
		li.setAttribute("data-class", srcNames[dataArray[i].i]);
		sources[dataArray[i].i].hidden && li.classList.add("hidden");

		link = item.getElementsByTagName("link")[0] || item.getElementsByTagName("guid")[0];
		a = _("a");
		a.className = "tooltipBox";
		a.href = link.innerHTML || link.getAttribute("href");
		a.append(getTitle(item));

		tooltip = _("div");
		tooltip.className = "tooltipText";
		tooltip.append(findDate(item));

		if (media = item.querySelector("thumbnail,enclosure")) {
			img = new Image();
			img.src = media.getAttribute("url");
			tooltip.append(img);
		}
		if (desc = item.querySelector("description")) {
			desc = desc.firstChild || desc.textContent;
			tooltip.append(desc.nodeType == Node.TEXT_NODE ? desc : parser.parseFromString(desc.data, "text/html").body);
		}

		a.appendChild(tooltip);
		li.appendChild(a);
		ul.appendChild(li);
	}
	return {ul, srcNames};
}

function updateLocalStorage() {
	localStorage.setItem(window.location.pathname.match(".*/(.+?)\\.")[1], JSON.stringify(sources));
}

function createSourceListItem(name, source, custom=false) {
	const li = _("li"),
		  label = _("label"),
		  input = _("input"),
		  checkbox = _("input"),
		  srcIndex = sources.findIndex(s=>s.url===source);

	label.innerHTML = name + ": ";
	input.type = "text";
	input.title = name;
	input.setAttribute("value", source);
	input.disabled = true;
	checkbox.type = "checkbox";
	checkbox.title = name;
	checkbox.checked = !sources[srcIndex].hidden;
	checkbox.addEventListener("click", ()=>{
		sources[srcIndex].hidden = !sources[srcIndex].hidden;
		document.getElementById("feeds")
		.querySelectorAll("[data-class='"+name+"']")
		.forEach(el=>el.classList.toggle("hidden"));
		updateLocalStorage();
	});

	li.append(label, input, checkbox);

	if (custom) {
		deleteBtn = _("button");
		deleteBtn.innerHTML = "&#x2715;";
		deleteBtn.className = "deleteBtn";
		deleteBtn.addEventListener("click", ()=>{
			sources.splice(srcIndex, 1);
			li.remove();
			updateLocalStorage();
			document.getElementById("feeds")
				.querySelectorAll("[data-class='"+name+"']")
				.forEach(e=>e.remove());
		});
		li.appendChild(deleteBtn);
	}

	return li;
}

async function loadFeeds() {
	const feedsContainer = document.getElementById("feeds"),
		  spinner = _("div");
	// Laadimisvaade
	spinner.className = "spinner";
	for (var i = 1; i <= 5; i++) {
		spinner.appendChild(_("div")).className = "rect" + i;
		spinner.append(" ");
	}
	feedsContainer.appendChild(spinner);

	// Too sisu
	const {ul, srcNames} = await fetchFeeds(sources.length>10 ? 14*sources.length : 65);

	// Allikate vaade
	feedsContainer.innerHTML = "<details class=\"feedSources\"><summary class=\"link\">Vali allikad</summary></details>";
	const sourcesUl = _("ul"),
		  li = _("li"),
		  label = _("label"),
		  input = _("input"),
		  addBtn = _("button"),
		  status = _("span");
	label.innerHTML = "Lisa muu allikas:"
	input.type = "text";
	input.title = "newSource";
	addBtn.innerHTML = "Lisa";
	li.append(label, input, addBtn, status);

	// onAdd
	addBtn.addEventListener("click", ()=>{
		let url = input.value.trim();
		if (!url) return;
		if (sources.findIndex(s=>s.url===url) >= 0) {
			status.innerHTML = "Allikas juba olemas.";
			return;
		}

		try {
			!url.startsWith("http") && (url = "http://" + url);
			url = "" + new URL(url);
		} catch (TypeError) {
			status.innerHTML = "Vigane link.";
			return;
		}

		status.innerHTML = "Kontrollin...";
		fetch(proxy + url)
			.then(file => file.text())
			.then(str => new DOMParser().parseFromString(str, "text/xml"))
			.catch(err => {
				console.error(err);
				status.innerHTML = "Viga: Ei saanud kätte sisu.";
			})
			.then(doc => {
				if (doc.getElementsByTagName("parsererror").length) {
					throw "parsererror from: " + url;
				}
				const name = getTitle(doc);
				sources.push({url, hidden: false});
				li.insertAdjacentElement("beforebegin", createSourceListItem(name, url, true));
				updateLocalStorage();
				status.innerHTML = "";
				input.value = "";
			})
			.catch(err => {
				console.error(err);
				status.innerHTML = "Viga: Ei suutnud lingilt lugeda RSS sisu.";
			});
	});

	// Allikate loend
	for (var i = 0; i < srcNames.length; i++) {
		sourcesUl.appendChild(createSourceListItem(srcNames[i], sources[i].url, !initSources.includes(sources[i].url)));
	}
	sourcesUl.appendChild(li);

	feedsContainer.firstChild.appendChild(sourcesUl);
	feedsContainer.append(ul.hasChildNodes() ? "" : "Viga sisu toomisel. Proovi hiljem uuesti.");
	feedsContainer.appendChild(ul);
}

window.addEventListener("load", ()=>{
	for (var i = 0; i < initSources.length; i++) {
		initSources[i].startsWith("http") || (initSources[i] = "https://www.youtube.com/feeds/videos.xml?channel_id=UC" + initSources[i]);
		sources.push({url: initSources[i], hidden: false});
	}
	const localSources = localStorage.getItem(window.location.pathname.match(".*/(.+?)\\.")[1]);
	if (localSources) {
		sources.length = 0;
		sources.push(...JSON.parse(localSources));
	}
	loadFeeds();
});