// Custom types for Diesel schema compatibility
// Extracted from schema.rs for better organization

use diesel::deserialize::FromSql;
use diesel::serialize::ToSql;
use diesel::pg::Pg;
use diesel::expression::AsExpression;

/// Custom JsonValue type for Diesel compatibility
#[derive(Debug, Clone, PartialEq, diesel::deserialize::FromSqlRow, diesel::expression::AsExpression)]
#[diesel(sql_type = diesel::sql_types::Jsonb)]
pub struct JsonValue(pub serde_json::Value);

impl FromSql<diesel::sql_types::Jsonb, Pg> for JsonValue {
    fn from_sql(bytes: diesel::pg::PgValue) -> diesel::deserialize::Result<Self> {
        let value = serde_json::from_slice(bytes.as_bytes())?;
        Ok(JsonValue(value))
    }
}

impl ToSql<diesel::sql_types::Jsonb, Pg> for JsonValue {
    fn to_sql(&self, out: &mut diesel::serialize::Output<Pg>) -> diesel::serialize::Result {
        let json_bytes = serde_json::to_vec(&self.0)?;
        out.write_all(&json_bytes)?;
        Ok(diesel::serialize::IsNull::No)
    }
}