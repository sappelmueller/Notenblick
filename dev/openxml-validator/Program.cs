using System;
using System.IO;
using System.Collections.Generic;
using System.Text.Json;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;

// Development tool only. Never loads personal data, Office, network templates or macros.
var results = new List<object>();
bool failed = false;
foreach (var file in args) {
    var errors = new List<object>();
    try {
        using OpenXmlPackage package = Path.GetExtension(file) == ".docx"
            ? WordprocessingDocument.Open(file, false)
            : SpreadsheetDocument.Open(file, false);
        var validator = new OpenXmlValidator(FileFormatVersions.Office2010) { MaxNumberOfErrors = 0 };
        foreach (var error in validator.Validate(package)) {
            errors.Add(new { id = error.Id, part = error.Part?.Uri.ToString(), path = error.Path?.XPath, description = error.Description });
        }
    } catch (Exception error) {
        errors.Add(new { id = "PackageOpen", description = error.GetType().Name });
    }
    failed |= errors.Count != 0;
    results.Add(new { file = Path.GetFileName(file), errors });
}
Console.WriteLine(JsonSerializer.Serialize(new { sdk = "3.3.0", format = "Office2010", results }));
return failed ? 1 : 0;
