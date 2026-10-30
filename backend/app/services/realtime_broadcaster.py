"""
Real-Time Event Broadcaster for Centralized Governance Workflow.
Provides in-memory pub-sub with tenant isolation for Server-Sent Events (SSE) and WebSockets.
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Set, Any, AsyncGenerator

logger = logging.getLogger("inkloom.realtime")


class RealtimeEventBroadcaster:
    def __init__(self):
        # Mapping: organization_id -> Set of asyncio.Queue
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}

    def subscribe(self, organization_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        if organization_id not in self._subscribers:
            self._subscribers[organization_id] = set()
        self._subscribers[organization_id].add(queue)
        logger.info(f"Subscribed client to tenant {organization_id}. Total subscribers: {len(self._subscribers[organization_id])}")
        return queue

    def unsubscribe(self, organization_id: str, queue: asyncio.Queue):
        if organization_id in self._subscribers:
            self._subscribers[organization_id].discard(queue)
            if not self._subscribers[organization_id]:
                del self._subscribers[organization_id]
        logger.info(f"Unsubscribed client from tenant {organization_id}")

    def publish(self, organization_id: str, event_type: str, data: Dict[str, Any]):
        """
        Publishes an authorized event to all active subscribers of the organization.
        """
        payload = {
            "event_type": event_type,
            "organization_id": organization_id,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        subscribers = self._subscribers.get(organization_id, set()).copy()
        if not subscribers:
            return

        for q in subscribers:
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                logger.warning(f"Subscriber queue full for tenant {organization_id}, dropping event {event_type}")
            except Exception as e:
                logger.warning(f"Error publishing event to subscriber: {e}")

    async def sse_event_stream(self, organization_id: str) -> AsyncGenerator[str, None]:
        """
        Yields SSE formatted text/event-stream chunks with keep-alive pings.
        """
        queue = self.subscribe(organization_id)
        # Send initial connected event
        init_event = {
            "event_type": "connected",
            "organization_id": organization_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": "Real-time governance feedback stream connected.",
        }
        yield f"event: connected\ndata: {json.dumps(init_event)}\n\n"

        try:
            while True:
                try:
                    # Wait for next event or 15s keep-alive timeout
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    event_type = payload.get("event_type", "message")
                    yield f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"
                except asyncio.TimeoutError:
                    # Send keep-alive comment
                    yield f": keep-alive ping {datetime.now(timezone.utc).isoformat()}\n\n"
        finally:
            self.unsubscribe(organization_id, queue)


# Global singleton instance
broadcaster = RealtimeEventBroadcaster()

