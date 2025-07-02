#!/bin/bash

# Wait for MongoDB to be up
until mongosh --host mongodb:27017 --eval 'quit(db.runCommand({ping: 1}).ok ? 0 : 2)' &>/dev/null; do
  printf '.'
  sleep 1
done

# Setup MongoDB Replica Set
cd /
echo 'rs.initiate({"_id": "rs0", "version": 1, "members": [{"_id": 0, "host": "localhost:27017", "priority": 2}]})' > config-replica.js
mongosh -u "$DATABASE_USER" -p "$DATABASE_PASSWORD" --host mongodb:27017 /config-replica.js
