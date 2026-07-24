//! ISO 3166-1 helpers backed by an embedded country table.

use lazy_static::lazy_static;
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
struct IsoRow {
    a: String,
    n: String,
    name: String,
}

struct IsoTables {
    alpha2_to_numeric: HashMap<String, String>,
    numeric_to_alpha2: HashMap<String, String>,
    alpha2_to_name: HashMap<String, String>,
}

lazy_static! {
    static ref TABLES: IsoTables = {
        let rows: Vec<IsoRow> =
            serde_json::from_str(include_str!("../../data/iso3166.json")).unwrap_or_default();
        let mut alpha2_to_numeric = HashMap::new();
        let mut numeric_to_alpha2 = HashMap::new();
        let mut alpha2_to_name = HashMap::new();
        for row in rows {
            let a = row.a.to_uppercase();
            alpha2_to_numeric.insert(a.clone(), row.n.clone());
            numeric_to_alpha2.insert(row.n.clone(), a.clone());
            if let Ok(n) = row.n.parse::<u32>() {
                numeric_to_alpha2.insert(n.to_string(), a.clone());
            }
            alpha2_to_name.insert(a, row.name);
        }
        IsoTables {
            alpha2_to_numeric,
            numeric_to_alpha2,
            alpha2_to_name,
        }
    };
}

pub fn country_display_name(iso2: &str) -> String {
    let code = iso2.trim().to_uppercase();
    if code.is_empty() {
        return "Unknown".to_string();
    }
    TABLES
        .alpha2_to_name
        .get(&code)
        .cloned()
        .unwrap_or(code)
}

pub fn iso2_to_numeric_id(iso2: &str) -> Option<String> {
    TABLES
        .alpha2_to_numeric
        .get(&iso2.trim().to_uppercase())
        .cloned()
}

#[allow(dead_code)]
pub fn numeric_id_to_iso2(id: &str) -> Option<String> {
    let raw = id.trim().to_string();
    let padded = format!("{:0>3}", raw);
    TABLES
        .numeric_to_alpha2
        .get(&padded)
        .or_else(|| TABLES.numeric_to_alpha2.get(&raw))
        .cloned()
}
