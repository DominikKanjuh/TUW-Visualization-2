#!/bin/bash

# URLs for downloading
AIR_POLLUTION_URL="https://1drv.ms/u/s!AqjaHlNJFPaTyPgcoE-xWs24SeERvQ?e=wxWQe6"
EARTH_RELIEF_URL="https://1drv.ms/u/s!AqjaHlNJFPaTyPgbm1i6fFWasH1IFg?e=ZlQmtx"
TEMPERATURE_URL="https://1drv.ms/u/s!AqjaHlNJFPaTyPga_Xvu1PGFiCOXkg?e=nVlDaU"

# Download and move files
curl -L "$AIR_POLLUTION_URL" -o /database/sql/air_pollution_import.sql
curl -L "$EARTH_RELIEF_URL" -o /database/sql/earth_relief_import.sql
curl -L "$TEMPERATURE_URL" -o /database/sql/temperature_import.sql

echo "Files downloaded and moved to /database/sql/"
