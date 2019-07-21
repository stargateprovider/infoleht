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