#!/bin/bash
# filepath: check_vah_err.sh
 
grep -Hni "Error" /data/VAH/vae0/log/events/*.qvt

