function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i <ca.length; i++) {
		var c = ca[i];
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
	root.style.setProperty('--main_elem_color', color=="white" ? "black" : "white");
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
	var elements = ["head", "header", "footer"];
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
				for(var i in elements){
					console.log(elements[i], this.response);
					docElement = document.getElementsByTagName(elements[i])[0];
					importElement = this.responseXML.getElementsByTagName(elements[i])[0];
					docElement.innerHTML += importElement.innerHTML;
				}
			} else {
				console.error("Failed to import template.html.");
			}
		}
	}
	xhttp.open("GET", "resources/template.html", true);
	xhttp.send();
	return;
}
window.onload = function() {
	// Add youtube, telegram, in5D icons next to their links
	var links = document.querySelectorAll("li > a");
	for (var i=0; i<links.length; i++) {
		if (links[i].href.indexOf("youtu") > -1) {
			var icon = new Image(); //document.createElement("img");
			icon.src = "https://s.ytimg.com/yts/img/favicon-vfl8qSV2F.ico";
			icon.alt = "yt_icon";
			icon.style = "margin-right:5px;max-width:16px;"
			links[i].insertAdjacentElement("beforebegin", icon);
		}
		else if (links[i].href.indexOf("telegram") > -1) {
			var icon = new Image();
			icon.src = "https://www.telegram.ee/wp-content/themes/telegram/favicon/favicon.ico"
			icon.alt = "telegram_icon";
			icon.style = "margin-right:5px;max-width:16px;"
			links[i].insertAdjacentElement("beforebegin", icon);
		}
		else if (links[i].href.indexOf("in5d") > -1) {
			var icon = new Image();
			icon.src = "https://in5d.com/wp-content/uploads/2019/03/cropped-favicon5-32x32.jpg"
			icon.alt = "in5d_icon";
			icon.style = "margin-right:5px;max-width:16px;"
			links[i].insertAdjacentElement("beforebegin", icon);
		}
	}

	// Bring in template
	includeTemplate();

	// Load theme based on cookies
	if (getCookie("bg-color") != ""){
		changeTheme(getCookie("bg-color"));
	}

	// Add last modified date to footer
	var x = document.lastModified;
	document.getElementsByTagName("footer")[0].innerHTML += "Viimati muudetud " + x;
}
