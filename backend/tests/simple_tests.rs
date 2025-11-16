//! Simple Backend Tests
//! These tests verify basic functionality without complex dependencies

#[cfg(test)]
mod tests {
    use serde_json::json;

    #[test]
    fn test_json_parsing() {
        let data = json!({
            "name": "Test Project",
            "id": 1
        });

        assert_eq!(data["name"], "Test Project");
        assert_eq!(data["id"], 1);
    }

    #[test]
    fn test_basic_arithmetic() {
        assert_eq!(2 + 2, 4);
        assert_eq!(10 - 5, 5);
        assert_eq!(3 * 3, 9);
    }

    #[test]
    fn test_string_operations() {
        let s = "Hello World";
        assert_eq!(s.len(), 11);
        assert_eq!(s.contains("World"), true);
    }
}
