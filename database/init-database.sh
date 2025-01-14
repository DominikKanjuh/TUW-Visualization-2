#!/bin/bash

echo "Initializing database..."

until psql -U "$POSTGRES_USER" -c '\l'; do
    echo "Waiting for database to be ready..."
    sleep 2
done

echo "Setting up PostGIS extensions in vis_2_geodb..."
psql -U "$POSTGRES_USER" -d vis_2_geodb -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -U "$POSTGRES_USER" -d vis_2_geodb -c "CREATE EXTENSION IF NOT EXISTS postgis_raster;"

echo "Cleaning up existing tables in vis_2_geodb..."
psql -U "$POSTGRES_USER" -d vis_2_geodb -c "DROP TABLE IF EXISTS public.air_pollution;"
psql -U "$POSTGRES_USER" -d vis_2_geodb -c "DROP TABLE IF EXISTS public.earth_relief;"
psql -U "$POSTGRES_USER" -d vis_2_geodb -c "DROP TABLE IF EXISTS public.temperature;"

# Import SQL files
echo "Importing data into vis_2_geodb..."
for file in /sql/*.sql; do
    echo "Running $file in vis_2_geodb..."
    psql -U "$POSTGRES_USER" -d vis_2_geodb -f "$file" >/dev/null 2>&1
done

echo "Database initialization complete."
