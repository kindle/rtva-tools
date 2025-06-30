#!/bin/bash
# filepath: check_crashdumps.sh
 
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color
 
printf "%-45s %s\n" "Path" "Has crashdump?"
printf "===============================================================\n"
 
for i in {0..4}; do
    LOG_DIR="/data/VAH/vae${i}/log/crashdumps"
    COUNT=$(ls "$LOG_DIR"/callstack_*.log 2>/dev/null | wc -l)
    if [ "$COUNT" -gt 0 ]; then
        printf "${RED}%-45s [YES][%d]${NC}\n" "$LOG_DIR" "$COUNT"
    else
        printf "${GREEN}%-45s [NO]${NC}\n" "$LOG_DIR"
    fi
done
