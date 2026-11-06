//! Reoka backend: a modular monolith split by domain.
//!
//! Each domain module owns its tables. Other modules use its public functions
//! and never query those tables directly. See `README.md` for the rules.

pub mod config;
pub mod error;
pub mod http;
pub mod state;

pub mod identity;
pub mod pet;
pub mod zalo;

// Domain modules still to be built.
mod audit;
mod clinic;
mod medical;
mod reminder;
