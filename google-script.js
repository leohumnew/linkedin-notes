function doGet(e) {
    var ss = SpreadsheetApp.openByUrl("LINK TO SPREADSHEET");
    var sheet = ss.getSheetByName("Notes");
    var name = e.parameter.name; 
    var note = e.parameter.note;
    var link = e.parameter.link;

    // If name is "load", return all notes along with their names and links
    if (name == "load") {
        var data = sheet.getDataRange().getValues();
        var notes = {};
        for (var i = 1; i < data.length; i++) {
            notes[data[i][2]] = [data[i][0], data[i][1]];
        }
        return ContentService.createTextOutput(JSON.stringify(notes));
    }

    // If note is empty, delete row
    if (note == "") {
        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
            if (data[i][2] == link) {
                sheet.deleteRow(i + 1);
                return ContentService.createTextOutput("Note deleted");
            }
        }
    }

    // Check if link already exists
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][2] == link) {
            sheet.getRange(i + 1, 2).setValue(note);
            return ContentService.createTextOutput("Note updated");
        }
    }

    // Otherwise, add new row
    sheet.appendRow([name, note, link]);
    return ContentService.createTextOutput("Note added");
}