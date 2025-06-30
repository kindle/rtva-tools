#!/bin/bash
# filepath: check_rdh.sh
 
HOST="192.168.151.168"
PORT=14004
TIMEOUT=5
 
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color
 
if timeout $TIMEOUT bash -c "</dev/tcp/$HOST/$PORT" 2>/dev/null; then
    echo -e "${GREEN}RDH is connected.${NC}"
else
    echo -e "${RED}Failed to connect to RDH.${NC}"
fi
