"""Inkloom AI - Video Processor & Metadata Analysis Unit Tests."""

import os
import struct
import pytest
from app.services.media_audit.video_processor import VideoProcessor, parse_mp4_atoms_metadata
from app.services.media_audit.interfaces import MediaProcessingStatus
from app.services.media_audit.file_validation import SafeTempFile


def create_synthetic_mp4_header(duration_sec: float = 12.0, width: int = 1920, height: int = 1080) -> bytes:
    """Build a minimal synthetic ISO-BMFF MP4 container in binary."""
    # 1. 'ftyp' box
    ftyp_payload = b"isom\x00\x00\x02\x00mp41isom"
    ftyp_box = struct.pack(">I4s", len(ftyp_payload) + 8, b"ftyp") + ftyp_payload

    # 2. 'mvhd' box (timescale=1000, duration=duration_sec*1000)
    timescale = 1000
    duration_ticks = int(duration_sec * timescale)
    # mvhd: size(4), type(4), version(1), flags(3), create(4), mod(4), timescale(4), duration(4), rate(4), vol(2), res(10), matrix(36), pre(24), next_track(4) = 108 bytes
    mvhd_body = (
        b"\x00" * 4  # version=0, flags=0
        + b"\x00" * 4  # creation time
        + b"\x00" * 4  # modification time
        + struct.pack(">II", timescale, duration_ticks)
        + b"\x00\x01\x00\x00"  # rate 1.0
        + b"\x01\x00"  # volume 1.0
        + b"\x00" * 10  # reserved
        + b"\x00" * 36  # matrix
        + b"\x00" * 24  # pre-defined
        + b"\x00\x00\x00\x02"  # next track id
    )
    mvhd_box = struct.pack(">I4s", len(mvhd_body) + 8, b"mvhd") + mvhd_body

    # 3. 'tkhd' box with dimensions as 16.16 fixed point
    tkhd_body = (
        b"\x00" * 4  # version & flags
        + b"\x00" * 4  # creation
        + b"\x00" * 4  # mod
        + b"\x00\x00\x00\x01"  # track ID
        + b"\x00" * 4  # reserved
        + struct.pack(">I", duration_ticks)  # duration
        + b"\x00" * 8  # reserved
        + b"\x00\x00"  # layer
        + b"\x00\x00"  # alternate group
        + b"\x00\x00"  # volume
        + b"\x00\x00"  # reserved
        + b"\x00" * 36  # matrix
        + struct.pack(">II", width << 16, height << 16)  # width, height
    )
    tkhd_box = struct.pack(">I4s", len(tkhd_body) + 8, b"tkhd") + tkhd_body

    # 4. 'moov' box containing 'mvhd' and 'tkhd'
    moov_payload = mvhd_box + tkhd_box
    moov_box = struct.pack(">I4s", len(moov_payload) + 8, b"moov") + moov_payload

    return ftyp_box + moov_box


def test_pure_python_mp4_atom_parser():
    """Verify parse_mp4_atoms_metadata extracts duration and dimensions without FFmpeg."""
    mp4_bytes = create_synthetic_mp4_header(duration_sec=14.5, width=1920, height=1080)

    with SafeTempFile(suffix=".mp4") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(mp4_bytes)

        metadata = parse_mp4_atoms_metadata(tf_path)
        assert metadata["duration_seconds"] == 14.5
        assert metadata["width"] == 1920
        assert metadata["height"] == 1080


def test_video_transcript_timestamp_preservation():
    """Verify video processor maps transcript segments to timestamps across duration."""
    processor = VideoProcessor()
    mp4_bytes = create_synthetic_mp4_header(duration_sec=30.0)

    transcript = (
        "Welcome to the official Inkloom corporate announcement. "
        "We guarantee complete error-free marketing compliance. "
        "Get started with Inkloom AI today."
    )

    with SafeTempFile(suffix=".mp4") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(mp4_bytes)

        res = processor.process_video(
            file_path=tf_path,
            filename="keynote.mp4",
            transcript_text=transcript,
        )

        assert res.status == MediaProcessingStatus.SUCCESS
        assert len(res.segments) >= 2
        # Verify first segment starts at 0.0s and subsequent segments have positive timestamps
        assert res.segments[0].timestamp_seconds == 0.0
        assert res.segments[-1].timestamp_seconds > 0.0
        assert res.metadata["duration_seconds"] == 30.0


def test_video_without_transcript_reports_warning():
    """Verify videos lacking an external transcript report that audio was not audited."""
    processor = VideoProcessor()
    mp4_bytes = create_synthetic_mp4_header(duration_sec=10.0)

    with SafeTempFile(suffix=".mp4") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(mp4_bytes)

        res = processor.process_video(
            file_path=tf_path,
            filename="silent.mp4",
            transcript_text=None,
        )

        assert res.status == MediaProcessingStatus.PARTIAL
        assert any("transcript" in w.lower() for w in res.warnings)
        assert res.extracted_text == ""


def test_corrupted_video_container_handling():
    """Verify corrupt video headers do not crash the parser."""
    with SafeTempFile(suffix=".mp4") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(b"\x00\x00\x00\x20ftypmp42corrupted_data_not_real_atoms")

        metadata = parse_mp4_atoms_metadata(tf_path)
        assert metadata["format"] == "mp4"
        assert metadata["duration_seconds"] is None
