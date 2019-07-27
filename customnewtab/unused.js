function fetchWallpaper() {
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
}


} else {
			var doc = parser.parseFromString(fileText, "text/html");
			data = doc.querySelectorAll("entry");
			if (!data.length){
				data = doc.getElementsByTagName("channel")[0].getElementsByTagName("item");
			}
			for (var i=0; i<data.length; i++){
				li = ul.appendChild(newElem("li"));
				a = li.appendChild(newElem("a"));
				link = data[i].getElementsByTagName("link")[0];
				a.href = link.textContent ? link.textContent : link.href;
				a.appendChild(document.createTextNode(data[i].getElementsByTagName("title")[0].textContent));
				textarea = a.appendChild(newElem("textarea"));

				dateTag = data[i].querySelector("pubDate, published");
				textarea.appendChild(document.createTextNode(dateTag.textContent));
				desc = data[i].getElementsByTagName("description")[0];
				if (desc){
					doc = parser.parseFromString(desc.textContent, "text/html");
					let trimmedText = doc.documentElement.textContent;
					var doc = parser.parseFromString(trimmedText, "text/html");
					trimmedText = doc.documentElement;
					textarea.appendChild(trimmedText);
				}

				a.className = "tooltipBox";
				textarea.className = "tooltipText";
				textarea.setAttribute("readonly", "true");

				if (!lastcheck || new Date(dateTag.textContent) >= lastcheck){
					a.style.color = "cyan";
					newEntry = true;
				}
			}
		}