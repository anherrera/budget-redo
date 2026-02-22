#!/usr/bin/env bash
set -euo pipefail

# Restore MongoDB JSON backup from openclaw container into the budget app's mongo container.
#
# The backup is JSON arrays exported by openclaw's backup script at:
#   /state/workspace/mongodb-backup/budget-app-20260222_143453/
#
# Target DB: budget
#
# Run this on paloma where both containers are running.

DUMP_DIR="budget-app-20260222_143453"
OPENCLAW_CONTAINER="openclaw"
BACKUP_PATH="/state/workspace/mongodb-backup/${DUMP_DIR}"
HOST_TMP="/tmp/${DUMP_DIR}"
COLLECTIONS=(events users meteor_accounts_loginServiceConfiguration)

# Figure out the mongo container name (handles docker-compose project name prefixes)
MONGO_CONTAINER=$(docker ps --filter "ancestor=mongo:7" --format '{{.Names}}' | head -1)
if [ -z "$MONGO_CONTAINER" ]; then
    MONGO_CONTAINER=$(docker ps --filter "name=mongo" --format '{{.Names}}' | grep -v openclaw | head -1)
fi

if [ -z "$MONGO_CONTAINER" ]; then
    echo "ERROR: Could not find the budget mongo container. Is docker-compose up?"
    exit 1
fi

echo "Source: ${OPENCLAW_CONTAINER}:${BACKUP_PATH}"
echo "Target: ${MONGO_CONTAINER} → database 'budget'"
echo ""

# 1. Copy dump from openclaw to host
echo "Copying dump from openclaw container to host..."
rm -rf "${HOST_TMP}"
docker cp "${OPENCLAW_CONTAINER}:${BACKUP_PATH}" "${HOST_TMP}"

# 2. Copy dump into the mongo container
echo "Copying dump into mongo container..."
docker cp "${HOST_TMP}" "${MONGO_CONTAINER}:/tmp/${DUMP_DIR}"

# 3. Import each collection
echo "Importing collections..."
for collection in "${COLLECTIONS[@]}"; do
    echo "  ${collection}..."
    docker exec "${MONGO_CONTAINER}" mongoimport \
        --db budget \
        --collection "${collection}" \
        --drop \
        --jsonArray \
        --file "/tmp/${DUMP_DIR}/${collection}.json"
done

# 4. Verify
echo ""
echo "Verifying restore..."
docker exec "${MONGO_CONTAINER}" mongosh budget --quiet --eval '
    const collections = db.getCollectionNames();
    print("Collections: " + collections.join(", "));
    collections.forEach(c => {
        print("  " + c + ": " + db[c].countDocuments() + " docs");
    });
'

# 5. Cleanup
rm -rf "${HOST_TMP}"
docker exec "${MONGO_CONTAINER}" rm -rf "/tmp/${DUMP_DIR}"

echo ""
echo "Done! Data restored to 'budget' database."
