#!/bin/bash

AIR_POLLUTION_URL="https://api.onedrive.com/v1.0/shares/s!AqjaHlNJFPaTyPgcoE-xWs24SeERvQ/root/content"
EARTH_RELIEF_URL="https://api.onedrive.com/v1.0/shares/s!AqjaHlNJFPaTyPgbm1i6fFWasH1IFg/root/content"
TEMPERATURE_URL="https://api.onedrive.com/v1.0/shares/s!AqjaHlNJFPaTyPga_Xvu1PGFiCOXkg/root/content"

TARGET_DIR="./database/sql"
mkdir -p "$TARGET_DIR"

rm -f "$TARGET_DIR/air_pollution_import.sql"
rm -f "$TARGET_DIR/earth_relief_import.sql"
rm -f "$TARGET_DIR/temperature_import.sql"

echo "Downloading air pollution data..."
curl -L -o "$TARGET_DIR/air_pollution_import.sql" "$AIR_POLLUTION_URL"
if [ $? -eq 0 ]; then
    echo "Air pollution data downloaded successfully"
else
    echo "Failed to download air pollution data"
fi

echo "Downloading earth relief data..."
curl -L -o "$TARGET_DIR/earth_relief_import.sql" "$EARTH_RELIEF_URL"
if [ $? -eq 0 ]; then
    echo "Earth relief data downloaded successfully"
else
    echo "Failed to download earth relief data"
fi

echo "Downloading temperature data..."
curl -L -o "$TARGET_DIR/temperature_import.sql" "$TEMPERATURE_URL"
if [ $? -eq 0 ]; then
    echo "Temperature data downloaded successfully"
else
    echo "Failed to download temperature data"
fi

echo "Download process completed"
