var oneDriveFilePickerError = function() {
	console.log('OneDrive Launch Failed!');
}
var oneDriveFilePickerSuccess2 = function(files) {
	console.log(files);
}
var oneDriveFilePickerSuccess = function(files) {
	console.log(files);
	var odOptions = {
		clientId: "5024a142-154d-45c4-9ca4-2013bca8919a",
		action: "download",
		multiSelect: true,
		openInNewWindow: false,
		advanced: {
			redirectUri: "https://stargateprovider.github.io/infoleht/customnewtab/odt.html",
			queryParameters: "select=id,name,size,file,folder,@microsoft.graph.downloadUrl",
			filter: "folder,.json",
			accessToken: files.accessToken
		},
		success: 'oneDriveFilePickerSuccess2',
		cancel: 'oneDriveFilePickerCancel',
		error: 'oneDriveFilePickerError'
	}
	OneDrive.open(odOptions);
}
var oneDriveFilePickerCancel = function(e) {
	console.log('OneDrive Launch Cancelled!');
}

function launchOneDrivePicker(){
	var odOptions = {
		clientId: "5024a142-154d-45c4-9ca4-2013bca8919a",
		action: "query",
		multiSelect: true,
		openInNewWindow: false,
		advanced: {
			redirectUri: "https://stargateprovider.github.io/infoleht/customnewtab/odt.html",
			queryParameters: "select=id,name,size,file,folder,@microsoft.graph.downloadUrl",
			filter: "folder,.json"
		},
		success: 'oneDriveFilePickerSuccess',
		cancel: 'oneDriveFilePickerCancel',
		error: 'oneDriveFilePickerError'
	}
	OneDrive.open(odOptions);
}
