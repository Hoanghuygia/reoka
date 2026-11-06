//! Pets and their public codes. Owns the `pets` table.
//!
//! Every query is scoped by owner, so one owner can never reach another's pet.

use chrono::{DateTime, Days, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;

const MAX_TEXT_LEN: usize = 100;
const PUBLIC_CODE_LEN: usize = 16;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum Gender {
    Male,
    Female,
    Unknown,
}

#[derive(Debug, Serialize)]
pub struct Pet {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub name: String,
    pub species: String,
    pub breed: Option<String>,
    pub gender: Gender,
    pub birth_date: Option<NaiveDate>,
    pub color: Option<String>,
    pub public_code: String,
    pub created_at: DateTime<Utc>,
}

/// `deny_unknown_fields` makes a client that sends e.g. `owner_id` fail loudly.
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct NewPet {
    pub name: String,
    pub species: String,
    pub breed: Option<String>,
    pub gender: Gender,
    pub birth_date: Option<NaiveDate>,
    pub color: Option<String>,
}

pub async fn create(db: &PgPool, owner_id: Uuid, new: NewPet) -> Result<Pet, AppError> {
    let name = required_text("name", &new.name)?;
    let species = required_text("species", &new.species)?;
    let breed = optional_text("breed", new.breed.as_deref())?;
    let color = optional_text("color", new.color.as_deref())?;
    validate_birth_date(new.birth_date)?;

    let public_code = nanoid::nanoid!(PUBLIC_CODE_LEN);
    let pet = sqlx::query_as!(
        Pet,
        r#"INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, color, public_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, owner_id, name, species, breed, gender AS "gender: Gender",
                     birth_date, color, public_code, created_at"#,
        owner_id,
        name,
        species,
        breed,
        new.gender as Gender,
        new.birth_date,
        color,
        public_code,
    )
    .fetch_one(db)
    .await?;
    Ok(pet)
}

pub async fn list_for_owner(db: &PgPool, owner_id: Uuid) -> Result<Vec<Pet>, AppError> {
    let pets = sqlx::query_as!(
        Pet,
        r#"SELECT id, owner_id, name, species, breed, gender AS "gender: Gender",
                  birth_date, color, public_code, created_at
           FROM pets
           WHERE owner_id = $1
           ORDER BY created_at, id"#,
        owner_id,
    )
    .fetch_all(db)
    .await?;
    Ok(pets)
}

/// Another owner's pet is `NotFound`, which also hides whether it exists.
pub async fn get_for_owner(db: &PgPool, owner_id: Uuid, pet_id: Uuid) -> Result<Pet, AppError> {
    sqlx::query_as!(
        Pet,
        r#"SELECT id, owner_id, name, species, breed, gender AS "gender: Gender",
                  birth_date, color, public_code, created_at
           FROM pets
           WHERE id = $1 AND owner_id = $2"#,
        pet_id,
        owner_id,
    )
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound)
}

fn required_text<'a>(field: &str, value: &'a str) -> Result<&'a str, AppError> {
    let value = value.trim();
    if value.is_empty() {
        return Err(AppError::Validation(format!("{field} is required")));
    }
    check_length(field, value)?;
    Ok(value)
}

/// Blank optional text is stored as NULL.
fn optional_text<'a>(field: &str, value: Option<&'a str>) -> Result<Option<&'a str>, AppError> {
    let value = value.map(str::trim).filter(|v| !v.is_empty());
    if let Some(value) = value {
        check_length(field, value)?;
    }
    Ok(value)
}

fn check_length(field: &str, value: &str) -> Result<(), AppError> {
    if value.chars().count() > MAX_TEXT_LEN {
        return Err(AppError::Validation(format!(
            "{field} must be at most {MAX_TEXT_LEN} characters"
        )));
    }
    Ok(())
}

fn validate_birth_date(birth_date: Option<NaiveDate>) -> Result<(), AppError> {
    // A day of slack: "today" in Vietnam (UTC+7) can be tomorrow in UTC.
    let latest = Utc::now().date_naive().checked_add_days(Days::new(1));
    if birth_date.is_some() && birth_date > latest {
        return Err(AppError::Validation(
            "birth_date cannot be in the future".to_string(),
        ));
    }
    Ok(())
}
