const REGEX = new RegExp("item>\\s*<title>(?<name>.+?)</title>[\\s\\S]*?<link>(?:<!\\[CDATA\\[)?(?<link>.+?)(?:\\]\\]>)?<[\\s\\S]+?pubDate>(?<date>.+?)<[\\s\\S]+?(?<desc><description>[\\s\\S]+?</description>)", "g"),
	 REGEX2 = new RegExp("entry>[\\s\\S]+?<title>(?<name>.+?)<[\\s\\S]+?href=\"(?<link>.+?)\"[\\s\\S]+?published>(?<date>.+?)<[\\s\\S]+?thumbnail url=\"(?<desc>.+?)\"", "g");

async function fetchFeeds(sources, n) {
	//Proxyd: https://gist.github.com/jimmywarting/ac1be6ea0297c16c477e17f8fbe51347
	const parser = new DOMParser(),
		  proxy = "https://api.allorigins.win/raw?url=",
		  promises = [],
		  dataArray = [];

	for (var i = 0; i < sources.length; i++) {
		let selectedRegex = sources[i].indexOf("youtube.") == -1 ? REGEX : REGEX2;

		promises.push(
			fetch(proxy + sources[i])
			.then(file => file.text())
			.then(str => dataArray.push(...Array.from(str.matchAll(selectedRegex))))
			.catch(err => console.error(err + " " + sources[i]))
		);
	}
	await Promise.allSettled(promises);

	dataArray.sort((a,b) => {
		let da = new Date(a.groups.date),
			db = new Date(b.groups.date);
		return (db > da) - (db < da);
	});

	var ul = document.createElement("ul");
	var a, li, tooltip, matchGroup, doc, img;

	for (var i = 0; i < dataArray.length && i < n; i++) {
		matchGroup = dataArray[i].groups;

		li = document.createElement("li");
		a = document.createElement("a");
		a.className = "tooltipBox";
		a.href = matchGroup.link, "text/html";
		a.append(parser.parseFromString(matchGroup.name, "text/html").documentElement.textContent);

		tooltip = document.createElement("div");
		tooltip.className = "tooltipText";
		tooltip.append(matchGroup.date);
		if (matchGroup["desc"]) {
			if (matchGroup.desc.endsWith(".jpg")) {
				img = new Image();
				img.src = matchGroup.desc;
				tooltip.append(img);
			} else {
				doc = parser.parseFromString(matchGroup.desc, "text/html");
				doc = parser.parseFromString(doc.documentElement.textContent.trim(), "text/html");
				tooltip.append(doc.body);
			}
		}

		a.appendChild(tooltip);
		li.appendChild(a);
		ul.appendChild(li);
	}
	return ul;
}

async function loadFeeds(sources, n, heading) {
	const feedsContainer = document.getElementById("feeds"),
		  spinner = document.createElement("div");
	spinner.className = "spinner";
	for (var i = 1; i <= 5; i++) {
		spinner.appendChild(document.createElement("div")).className = "rect" + i;
		spinner.appendChild(document.createTextNode(" "));
	}
	feedsContainer.appendChild(spinner);

	const feedsList = await fetchFeeds(sources, n);
	feedsContainer.innerHTML = feedsList.hasChildNodes() ? heading : "Tekkis viga. Proovi hiljem uuesti.";
	feedsContainer.appendChild(feedsList);
}