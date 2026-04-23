SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;