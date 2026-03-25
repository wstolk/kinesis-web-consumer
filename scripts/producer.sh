#!/bin/sh
echo "Waiting for stream to be ready..."
sleep 10
while ! awslocal kinesis describe-stream --stream-name my-stream --query 'StreamDescription.StreamStatus' --output text 2>/dev/null | grep -q ACTIVE; do
  sleep 2
done
echo "Stream is active. Starting data producer..."

SEQ=0
while true; do
  SEQ=$((SEQ + 1))

  # Pick random values
  USER=$(echo "alice bob charlie diana eve frank" | tr ' ' '\n' | shuf -n 1)
  EVENT=$(echo "page_view click purchase signup logout search add_to_cart checkout error timeout" | tr ' ' '\n' | shuf -n 1)
  PAGE=$(echo "/home /products /cart /checkout /profile /settings /search /api/health" | tr ' ' '\n' | shuf -n 1)
  STATUS=$(echo "200 200 200 200 201 301 400 404 500" | tr ' ' '\n' | shuf -n 1)
  DURATION=$((RANDOM % 2000 + 50))
  TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
  SESSION="sess-${SEQ}-${RANDOM}"

  DATA=$(printf '{"seq":%d,"event":"%s","user":"%s","path":"%s","status":%s,"duration_ms":%d,"timestamp":"%s","metadata":{"session_id":"%s","ip":"10.0.%d.%d","user_agent":"Mozilla/5.0"}}' \
    "$SEQ" "$EVENT" "$USER" "$PAGE" "$STATUS" "$DURATION" "$TIMESTAMP" "$SESSION" "$((RANDOM % 255))" "$((RANDOM % 255))")

  awslocal kinesis put-record --stream-name my-stream --partition-key "$USER" --data "$DATA" > /dev/null 2>&1

  echo "[${TIMESTAMP}] #${SEQ}: ${EVENT} by ${USER} (${STATUS})"

  sleep $((RANDOM % 3 + 1))
done
