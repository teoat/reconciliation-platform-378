use super::types::ValidationService;

#[test]
fn test_validate_csv_structure_with_comma_delimiter() {
    let service = ValidationService::new().unwrap();
    let csv_data = "name,email,age\nJohn,john@example.com,30\nJane,jane@example.com,25";

    let result = service.validate_csv_structure_with_delimiter(csv_data, Some(','));
    assert!(result.is_ok());

    let headers = result.unwrap();
    assert_eq!(headers, vec!["name", "email", "age"]);
}

#[test]
fn test_validate_csv_structure_with_semicolon_delimiter() {
    let service = ValidationService::new().unwrap();
    // European Excel CSV format
    let csv_data = "name;email;age\nJohn;john@example.com;30\nJane;jane@example.com;25";

    let result = service.validate_csv_structure_with_delimiter(csv_data, Some(';'));
    assert!(result.is_ok());

    let headers = result.unwrap();
    assert_eq!(headers, vec!["name", "email", "age"]);
}

#[test]
fn test_validate_csv_structure_with_tab_delimiter() {
    let service = ValidationService::new().unwrap();
    // Tab-separated values (TSV)
    let csv_data = "name\temail\tage\nJohn\tjohn@example.com\t30\nJane\tjane@example.com\t25";

    let result = service.validate_csv_structure_with_delimiter(csv_data, Some('\t'));
    assert!(result.is_ok()); // Corrected syntax error here

    let headers = result.unwrap();
    assert_eq!(headers, vec!["name", "email", "age"]);
}

#[test]
fn test_validate_csv_structure_with_pipe_delimiter() {
    let service = ValidationService::new().unwrap();
    // Pipe-delimited format (common in enterprise)
    let csv_data = "name|email|age\nJohn|john@example.com|30\nJane|jane@example.com|25";

    let result = service.validate_csv_structure_with_delimiter(csv_data, Some('|'));
    assert!(result.is_ok());

    let headers = result.unwrap();
    assert_eq!(headers, vec!["name", "email", "age"]);
}

#[test]
fn test_validate_csv_structure_backward_compatibility() {
    let service = ValidationService::new().unwrap();
    let csv_data = "name,email,age\nJohn,john@example.com,30\nJane,jane@example.com,25";

    // Old method should still work (defaults to comma)
    let result = service.validate_csv_structure(csv_data);
    assert!(result.is_ok());

    let headers = result.unwrap();
    assert_eq!(headers, vec!["name", "email", "age"]);
}

#[test]
fn test_validate_csv_structure_field_count_mismatch() {
    let service = ValidationService::new().unwrap();
    // Row 2 has only 2 fields instead of 3
    let csv_data = "name;email;age\nJohn;john@example.com;30\nJane;jane@example.com";

    let result = service.validate_csv_structure_with_delimiter(csv_data, Some(';'));
    assert!(result.is_err());

    let error_msg = result.unwrap_err().to_string();
    assert!(error_msg.contains("Row 2 has 2 fields, expected 3"));
    assert!(error_msg.contains("delimiter: ';'"));
}

#[test]
fn test_validate_csv_structure_duplicate_headers() {
    let service = ValidationService::new().unwrap();
    let csv_data = "name;email;name\nJohn;john@example.com;John";

    let result = service.validate_csv_structure_with_delimiter(csv_data, Some(';'));
    assert!(result.is_err());

    let error_msg = result.unwrap_err().to_string();
    assert!(error_msg.contains("Duplicate header found: name"));
}

#[test]
fn test_validate_csv_structure_empty_file() {
    let service = ValidationService::new().unwrap();
    let csv_data = "";

    let result = service.validate_csv_structure_with_delimiter(csv_data, Some(','));
    assert!(result.is_err());

    let error_msg = result.unwrap_err().to_string();
    assert!(error_msg.contains("CSV file is empty"));
}

#[test]
fn test_validate_csv_structure_trimming() {
    let service = ValidationService::new().unwrap();
    // Headers and fields with whitespace
    let csv_data = " name , email , age \n John , john@example.com , 30 ";

    let result = service.validate_csv_structure_with_delimiter(csv_data, Some(','));
    assert!(result.is_ok());

    let headers = result.unwrap();
    // Headers should be trimmed
    assert_eq!(headers, vec!["name", "email", "age"]);
}
