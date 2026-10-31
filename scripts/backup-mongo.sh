#!/usr/bin/env bash
# Nightly backup of the budget Mongo database (not managed, nothing else backs
# it up): mongodump from the compose container -> verify -> thin -> mirror to
# irena. Pages ntfy on any failure; a backup that fails silently is worse than
# none.
#
# Retention thins with age: every daily for 14 days, then one per ISO week for
# 8 weeks, then one per month for 12 months. Older dumps are deleted.
#
# Cron (paloma, crontab of sophie):
#   41 3 * * * NTFY_TOPIC_URL=... $HOME/budget-redo/scripts/backup-mongo.sh >> $HOME/backups/budget-mongo.log 2>&1
#
# Env:
#   NTFY_TOPIC_URL   ntfy topic to page on failure (required)
#   BACKUP_DEST      rsync dest, user@host:dir (default: irena)
#   LOCAL_DIR        local dump directory (default: ~/backups/budget-mongo)
set -u

NTFY_TOPIC_URL="${NTFY_TOPIC_URL:?NTFY_TOPIC_URL not set}"
BACKUP_DEST="${BACKUP_DEST:-dev_sophie@100.79.202.18:backups/budget-mongo}"
LOCAL_DIR="${LOCAL_DIR:-$HOME/backups/budget-mongo}"
CONTAINER=budget-redo-mongo-1
DB=budget

fail() {
    curl -s --max-time 10 -H "Title: Budget Mongo backup FAILED" -H "Priority: urgent" \
        -H "Tags: floppy_disk,rotating_light" -d "$1" "$NTFY_TOPIC_URL" >/dev/null || true
    echo "$(date -Is) FAIL: $1"
    exit 1
}

mkdir -p "$LOCAL_DIR" || fail "cannot create $LOCAL_DIR"
dump="$LOCAL_DIR/budget-$(date +%F).archive.gz"
tmp="$dump.tmp"
trap 'rm -f "$tmp"' EXIT

docker exec "$CONTAINER" mongodump --quiet --db "$DB" --archive --gzip > "$tmp" \
    || fail "mongodump exited non-zero"
[ -s "$tmp" ] || fail "dump file empty"

# Refuse to keep a dump mongorestore cannot read, or one missing the events.
check=$(docker exec -i "$CONTAINER" mongorestore --dryRun --archive --gzip --nsInclude "$DB.*" -v < "$tmp" 2>&1) \
    || fail "dump failed mongorestore --dryRun"
grep -q "$DB.events" <<<"$check" || fail "dump has no $DB.events collection"

chmod 600 "$tmp" && mv -f "$tmp" "$dump" || fail "could not stage $dump"

python3 - "$LOCAL_DIR" <<'EOF' || fail "pruning failed"
import re, sys
from datetime import date
from pathlib import Path

d = Path(sys.argv[1])
dumps = {}
for p in d.glob("budget-*.archive.gz"):
    m = re.fullmatch(r"budget-(\d{4}-\d{2}-\d{2})\.archive\.gz", p.name)
    if m:
        dumps[date.fromisoformat(m[1])] = p

today = date.today()
keep, weeks, months = set(), set(), set()
for day in sorted(dumps, reverse=True):  # newest first: keep the latest per bucket
    age = (today - day).days
    if age < 14:
        keep.add(day)
    elif age < 14 + 8 * 7:
        if day.isocalendar()[:2] not in weeks:
            weeks.add(day.isocalendar()[:2]); keep.add(day)
    elif age < 365:
        if (day.year, day.month) not in months:
            months.add((day.year, day.month)); keep.add(day)
for day, p in dumps.items():
    if day not in keep:
        p.unlink()
        print(f"pruned {p.name}")
EOF

rsync -a --delete -e "ssh -o BatchMode=yes" "$LOCAL_DIR/" "$BACKUP_DEST/" \
    || fail "rsync to $BACKUP_DEST failed"

echo "$(date -Is) OK: $(basename "$dump") ($(du -h "$dump" | cut -f1)) -> $BACKUP_DEST, $(ls "$LOCAL_DIR" | wc -l) kept"
