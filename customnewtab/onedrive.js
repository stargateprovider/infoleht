const odOptions = {
  clientId: "5024a142-154d-45c4-9ca4-2013bca8919a",
  action: "query",
  multiSelect: true,
  advanced: {},
  success: function(files) { console.log(files) },
  cancel: function() { /* cancel handler */ },
  error: function(error) { /* error handler */ }
}
function launchOneDrivePicker(){
  OneDrive.open(odOptions);
}
