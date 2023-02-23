if(typeof _!="function")_=e=>document.createElement(e);

//Proxyd: https://gist.github.com/jimmywarting/ac1be6ea0297c16c477e17f8fbe51347
let proxy = "";
const proxies = [
	"https://vcorsproxy.vercel.app/api?url=",
	"https://api.codetabs.com/v1/proxy?quest=",
	"https://cors-proxy.htmldriven.com/",
	"https://proxy.cors.sh/",
	"https://api.allorigins.win/raw?url="
];

const defaultGroup = "Peamine";
let selectedGroup = defaultGroup;
const initSources = [];
const sources = {};
const items = {};

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

async function fetchFeeds(group, n) {
	const findDate = el => el.querySelector("pubDate,published,updated").innerHTML,
		  parser = new DOMParser(),
		  promises = [],
		  dataArray = [],
		  nSources = sources[group] ? sources[group].length : 0;
	const srcNames = new Array(nSources);

	for (let i = 0; i < nSources; i++) {
		let url = sources[group][i].url;
		promises.push(
			fetch(proxy + url, {cache: "no-cache"}) // no-cache kontrollib kas serveris on uuem versioon
			.then(file => file.text())
			.then(str => {
				const doc = parser.parseFromString(str, "text/xml");
				srcNames[i] = getTitle(doc);
				dataArray.push(...Array.from(doc.querySelectorAll("item,entry"), item=>({item, i})));
			})
			.catch(err => console.log(url + " " + err))
		);
	}
	await Promise.allSettled(promises);

	dataArray.sort((a,b) => {
		let da = new Date(findDate(a.item)),
			db = new Date(findDate(b.item));
		return (db > da) - (db < da);
	});

	const itemsUl = _("ul"), len = dataArray.length;
	let item, link, a, li, tooltip, desc, media, img;

	for (let i = 0; i < len && i < n; i++) {
		item = dataArray[i].item;
		li = _("li");
		li.setAttribute("data-class", srcNames[dataArray[i].i]);
		sources[group][dataArray[i].i].hidden && li.classList.add("hidden");

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
		itemsUl.appendChild(li);
	}
	return {itemsUl, srcNames};
}

function updateLocalStorage() {
	localStorage.setItem(window.location.pathname.match(".*/(.+?)\\.")[1], JSON.stringify(sources));
}

function createSourceListItem(name, source, custom=false) {
	const li = _("li"),
		  span = _("span"),
		  label = _("label"),
		  input = _("input"),
		  checkbox = _("input"),
		  srcIndex = sources[selectedGroup].findIndex(s=>s.url===source);

	label.innerHTML = name + ":";
	input.type = "text";
	input.title = name;
	input.setAttribute("value", source);
	input.disabled = true;
	checkbox.type = "checkbox";
	checkbox.title = name;
	checkbox.checked = !sources[selectedGroup][srcIndex].hidden;
	checkbox.addEventListener("click", ()=>{
		sources[selectedGroup][srcIndex].hidden = !sources[selectedGroup][srcIndex].hidden;
		document.getElementById("feeds")
		.querySelectorAll("[data-class='"+name+"']")
		.forEach(el=>el.classList.toggle("hidden"));
		updateLocalStorage();
	});

	if (custom) {
		deleteBtn = _("button");
		deleteBtn.innerHTML = "&#x2715;";
		deleteBtn.className = "deleteBtn";
		deleteBtn.addEventListener("click", ()=>{
			sources[selectedGroup].splice(srcIndex, 1);
			items[selectedGroup].srcNames?.splice(srcIndex, 1);
			li.remove();
			updateLocalStorage();
			document.getElementById("feeds")
				.querySelectorAll("[data-class='"+name+"']")
				.forEach(e=>e.remove());
		});
		span.appendChild(deleteBtn);
	}

	if (name === undefined) {
		span.className = "failedSrc";
	}
	span.append(checkbox, label);
	li.append(span, input);
	return li;
}

function createImportExportButtons() {
	const feedsName = window.location.pathname.match(".*/(.+?)\\.")[1];

	// Hidden file picker
	const reader = new FileReader();
	const filePicker = _("input");
	filePicker.type = "file";
	filePicker.addEventListener("change", ()=>{
		reader.onload = e => {

			let newData = null;
			if (e.target.result.startsWith("data:application/json;base64,")) {
				try {
					const parsed = JSON.parse(window.atob(e.target.result.substring(29)));
					if (parsed && Object.values(parsed).every(cat => cat.every(e => e.url))) {

						if (localStorage.getItem(feedsName)) {
							// Merge without duplicate urls
							newData = JSON.parse(localStorage.getItem(feedsName));

							for (const group in parsed) {
								if (!newData[group]) {
									newData[group] = [];
								}

								const localUrls = {};
								for (const entry of newData[group]) {
									localUrls[entry.url] = true;
								}

								for (const entry of parsed[group]) {
									if (!localUrls[entry.url]) {
										localUrls[entry.url] = true;
										newData[group].push(entry);
									}
								}
							}

						} else {
							newData = parsed;
						}

						localStorage.setItem(feedsName, JSON.stringify(newData));
						location.reload();
					}
				} catch{}
			}

			!newData && alert("File has invalid content.");
		};
		reader.readAsDataURL(filePicker.files[0]);
	});

	// Triggers file picker
	const btnImport = _("button");
	btnImport.textContent = "Impordi";
	btnImport.addEventListener("click", ()=>{
		filePicker.click();
	});

	// Download btn
	const btnExport = _("button");
	btnExport.textContent = "Salvesta faili";
	btnExport.addEventListener("click", ()=>{
		const data = localStorage.getItem(feedsName);
		const anchor = _("a");
		anchor.download = "feeds.json";
		anchor.href = "data:text/plain;charset=utf-8," + encodeURIComponent(data);
		anchor.click();
	});

	// Clear btn
	const btnClear = _("button");
	btnClear.textContent = "Tühjenda";
	btnClear.addEventListener("click", ()=>{
		for (const group in sources) {
			delete items[group];
			delete sources[group];
		}
		changeGroup(defaultGroup);
		updateLocalStorage();
	});

	const container = _("div");
	container.className = "importExportDiv";
	container.append(btnImport, btnExport, btnClear);
	return container;
}

function createUILists() {
	const nSources = sources[selectedGroup]?.length || 0,
		  srcNames = items[selectedGroup] ? items[selectedGroup]["srcNames"] : [],
		  sourcesUl = _("ul");

	for (let i = 0; i < nSources; i++) {
		const srcUrl = sources[selectedGroup][i].url;
		sourcesUl.appendChild(createSourceListItem(srcNames[i], srcUrl, !initSources.includes(srcUrl)));
	}
	const { itemsUl } = items[selectedGroup] ? items[selectedGroup] : {};

	if (itemsUl?.hasChildNodes()) {
		return { itemsUl, sourcesUl };
	} else if (srcNames && !srcNames.length) {
		return { itemsUl: "Allikad puuduvad või allikais puudub sisu.", sourcesUl };
	} else {
		return { itemsUl: "Viga sisu toomisel. Proovi hiljem uuesti.", sourcesUl };
	}
}

function changeGroup(newGroup) {
	const feedsContainer = document.getElementById("feeds");
	selectedGroup = newGroup;

	Promise.resolve(items[selectedGroup]).then(value => {
		items[selectedGroup] = value;
		const { itemsUl, sourcesUl } = createUILists();

		feedsContainer.firstChild.lastChild.remove();
		feedsContainer.firstChild.appendChild(sourcesUl);

		feedsContainer.lastChild.remove();
		feedsContainer.append(itemsUl);
	});
}

async function loadFeeds() {
	const feedsContainer = document.getElementById("feeds"),
		  spinner = _("div");

	// Laadimisvaade
	spinner.className = "spinner";
	for (let i = 1; i <= 5; i++) {
		spinner.appendChild(_("div")).className = "rect" + i;
		spinner.append(" ");
	}
	feedsContainer.appendChild(spinner);

	// Too sisu
	items[selectedGroup] = await items[selectedGroup];

	// Kategooriate vaade
	const groupsLabel = _("span"),
		  groupsContainer = _("li"),
		  deleteBtn = _("button"),
		  groups = _("select"),
		  newGroupContainer = _("span"),
		  newGroupInput = _("input"),
		  newGroupBtn = _("button");

	groupsLabel.innerHTML = "Vali allikate grupp:";
	deleteBtn.innerHTML = "&#x2715;";
	deleteBtn.className = "deleteBtn";
	for (const key in sources) {
		const opt = _("option");
		opt.value = key;
		opt.textContent = key;
		groups.appendChild(opt);
	}
	newGroupInput.type = "text";
	newGroupInput.placeholder = "Uus grupp...";
	newGroupBtn.innerHTML = "+";
	newGroupContainer.className = "inputContainer";
	newGroupContainer.append(groups, deleteBtn, newGroupInput, newGroupBtn);
	groupsContainer.append(groupsLabel, newGroupContainer);

	// Allikate vaade
	const newSrcLi = _("li"),
		  newSrcSpan = _("span"),
		  newSrcLabel = _("label"),
		  newSrcInputContainer = _("span"),
		  newSrcInput = _("input"),
		  addBtn = _("button"),
		  status = _("span");
	newSrcLabel.textContent = "Lisa uus allikas:"
	newSrcInput.type = "text";
	newSrcInput.title = "newSource";
	newSrcInput.placeholder = "Uus allikas...";
	addBtn.innerHTML = "+";
	newSrcSpan.appendChild(newSrcLabel);
	newSrcInputContainer.className = "inputContainer";
	newSrcInputContainer.append(newSrcInput, addBtn);
	newSrcLi.append(newSrcSpan, newSrcInputContainer, status);

	// on group change
	groups.addEventListener("change", event => changeGroup(event.target.value));
	document.addEventListener("keydown", event => {
		if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
		
		const newIndex = [...groups.children].findIndex(c => c.value === groups.value)
		+ (event.key === "ArrowRight" ? 1 : -1);

		if (newIndex >= 0 && newIndex < groups.children.length) {
			changeGroup(groups.children[newIndex].value);
			groups.value = groups.children[newIndex].value;
		}
	});

	// on delete group
	deleteBtn.addEventListener("click", ()=>{
		if (selectedGroup === defaultGroup) {
			return;
		}
		delete sources[selectedGroup];
		groups.querySelector("[value='"+selectedGroup+"']").remove();
		updateLocalStorage();
		changeGroup(groups.firstChild.value);
	});

	// on add group
	newGroupBtn.addEventListener("click", () => {
		const groupName = newGroupInput.value;
		if (!groupName || sources[groupName]) return;

		sources[groupName] = [];
		items[groupName] = fetchFeeds(groupName);
		updateLocalStorage();

		const opt = _("option");
		opt.value = groupName;
		opt.textContent = groupName;
		groups.appendChild(opt);
		newGroupInput.value = "";
	});

	// on add source
	addBtn.addEventListener("click", ()=>{
		let url = newSrcInput.value.trim();
		if (!url) return;
		if (sources[selectedGroup].findIndex(s=>s.url===url) >= 0) {
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

		addBtn.disabled = true;
		status.innerHTML = "Kontrollin...";
		let fetchUrl = url;

		fetch(fetchUrl)
			.then(file => file.text())
			.catch(err => {
				console.log("Pole otse kättesaadav: " + fetchUrl);
				fetchUrl = proxy + url;
			})
			.finally(() => fetch(fetchUrl)
				.then(file => file.text())
				.then(str => new DOMParser().parseFromString(str, "text/xml"))
				.catch(err => {
					status.innerHTML = "Viga: Ei saanud kätte sisu.";
				})
				.then(doc => {
					if (!doc) return;
					if (doc.getElementsByTagName("parsererror").length) {
						throw "parsererror from: " + url;
					}
					const name = getTitle(doc);
					sources[selectedGroup].push({url, hidden: false});
					items[selectedGroup].srcNames.push(name);

					newSrcLi.parentElement.nextElementSibling.insertAdjacentElement("beforeend", createSourceListItem(name, url, true));
					updateLocalStorage();
					status.innerHTML = "";
					newSrcInput.value = "";
				})
				.catch(err => {
					console.log(err);
					status.innerHTML = "Viga: Ei suutnud lingilt lugeda RSS sisu.";
				})
				.finally(()=>{
					addBtn.disabled = false;
				})
			);
	});


	const sourcesSettingsUl = _("ul");
	sourcesSettingsUl.append(groupsContainer, newSrcLi);
	
	const { itemsUl, sourcesUl } = createUILists();
	feedsContainer.innerHTML = `<details class="feedSources"><summary class="link">Vali allikad</summary></details>`;

	feedsContainer.firstChild.addEventListener("toggle", () => {
		if (feedsContainer.firstChild.open) {
			newGroupContainer.insertAdjacentElement("afterbegin", groups);
		} else if (Object.keys(sources).length > 1) {
			feedsContainer.firstChild.firstChild.appendChild(groups);
		}
	});
	Object.keys(sources).length > 1 && feedsContainer.firstChild.firstChild.appendChild(groups);
	
	feedsContainer.firstChild.append(createImportExportButtons(), sourcesSettingsUl, sourcesUl);
	feedsContainer.append(itemsUl);
}

window.addEventListener("load", async()=>{
	for (proxy of proxies) {
		try {
			const testResponse = await fetch(proxy + "https://www.youtube.com/", {
				// method: "POST",
				// referrerPolicy: "no-referrer-when-downgrade",
				// cache: "no-cache",
				// headers: {
				// 	'Accept': 'application/json',
				// 	'Content-Type': 'application/json',
				// },
				// body: JSON.stringify({url: "https://www.youtube.com/"})
			});
			if (testResponse.ok) {
				break;
			}
		} catch (err) {
			console.warn("proxy " + proxy + " failed.", err);
		}
	}
	console.log("using proxy " + proxy);

	sources[defaultGroup] = [];
	for (let i = 0; i < initSources.length; i++) {
		initSources[i].startsWith("http") || (initSources[i] = "https://www.youtube.com/feeds/videos.xml?channel_id=UC" + initSources[i]);
		sources[selectedGroup].push({url: initSources[i], hidden: false});
	}

	const localSources = JSON.parse(localStorage.getItem(window.location.pathname.match(".*/(.+?)\\.")[1]));
	if (localSources && Object.keys(localSources).length) {
		for (const group in sources) delete sources[group];
		for (const group in localSources) sources[group] = localSources[group];
	}

	for (const group in sources) {
		items[group] = fetchFeeds(group, sources[group]?.length>10 ? 14*sources[group].length : 65);
	}
	loadFeeds();
});