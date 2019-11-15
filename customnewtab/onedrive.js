const odOptions = {
  clientId: "5024a142-154d-45c4-9ca4-2013bca8919a",
  action: "query",
  multiSelect: true,
  openInNewWindow: false,
  advanced: {
  	redirectUri: "https://stargateprovider.github.io/infoleht/customnewtab/odt.html"
  },
  success: function(files) { console.log(files) },
  cancel: function() { console.log("CANCEL") },
  error: function(error) { console.log(error) }
}
function launchOneDrivePicker(){
  OneDrive.open(odOptions);
}
