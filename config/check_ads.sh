#!/bin/bash
# filepath: check_ads.sh
 
HOST="10.51.8.199"
PORT=14002
TIMEOUT=5
 
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color
 
if timeout $TIMEOUT bash -c "</dev/tcp/$HOST/$PORT" 2>/dev/null; then
    echo -e "${GREEN}ADS is connected.${NC}"
else
    echo -e "${RED}Failed to connect to ADS.${NC}"
fi
