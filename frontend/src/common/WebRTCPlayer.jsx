import React, { useEffect, useRef, useState } from 'react';
import { Loader2, VideoOff } from 'lucide-react';

// Stream path selection:
//   Normal state  → <streamPath>       (raw camera stream - zero latency)
//   Violence ≥65% → <streamPath>_bbox  (bboxAPI — shows bounding boxes)

const BBOX_CAMERAS   = ['cam_01', 'cam_02', 'cam_03', 'cam_04', 'cam_05'];

const WebRTCPlayer = ({ streamPath, isMuted = true, alertStatus, onStatusChange }) => {
  const videoRef = useRef(null);
  const pcRef    = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'playing' | 'error'

  const isViolent      = alertStatus === 'VIOLENCE_DETECTED';
  const hasBbox        = BBOX_CAMERAS.includes(streamPath);
  const shouldShowBbox = hasBbox && isViolent;

  // Determine target path based on alert state
  const desiredPath = shouldShowBbox ? `${streamPath}_bbox` : streamPath;

  const updateStatus = (s) => {
    setStatus(s);
    onStatusChange?.(s);
  };

  useEffect(() => {
    if (!streamPath) {
      updateStatus('error');
      return;
    }

    let isCancelled = false;
    let sessionUrl = '';

    // Create RTCPeerConnection for WHEP
    const pc = new RTCPeerConnection({
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
      iceTransportPolicy: "all"
    });
    pcRef.current = pc;

    const remoteStream = new MediaStream();
    if (videoRef.current) {
      videoRef.current.srcObject = remoteStream;
    }

    pc.ontrack = (event) => {
      if (isCancelled) return;
      remoteStream.addTrack(event.track);
    };

    pc.onconnectionstatechange = () => {
      if (isCancelled) return;
      switch (pc.connectionState) {
        case 'connected':
          updateStatus('playing');
          break;
        case 'disconnected':
        case 'failed':
        case 'closed':
          updateStatus('error');
          break;
      }
    };

    const connect = async () => {
      try {
        if (isCancelled) return;
        updateStatus('loading');

        // Add transceivers for receiving video and audio
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Connect using the Vite /rtc_ proxy (pointing to MediaMTX port 8889 WHEP)
        const whepUrl = `/rtc_/${desiredPath}/whep`;

        const response = await fetch(whepUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: offer.sdp,
        });

        if (isCancelled) return;

        if (response.status !== 201) {
          throw new Error(`WHEP POST failed: ${response.status} ${response.statusText}`);
        }

        const location = response.headers.get('Location');
        if (!location) {
          throw new Error('Missing Location header');
        }

        // Parse location for session deletion
        const locationPath = new URL(location, window.location.origin + whepUrl).pathname;
        sessionUrl = locationPath.startsWith('/rtc_') ? locationPath : `/rtc_${locationPath}`;

        const answerSdp = await response.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      } catch (e) {
        if (!isCancelled) {
          console.error(`[WebRTCPlayer] connection failed for "${desiredPath}":`, e);
          updateStatus('error');
        }
      }
    };

    connect();

    return () => {
      isCancelled = true;
      if (sessionUrl) {
        // Delete session to release server resources
        fetch(sessionUrl, { method: 'DELETE' }).catch(() => {});
      }
      pc.close();
      pcRef.current = null;
    };
  }, [desiredPath]);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          status === 'playing' ? 'opacity-100' : 'opacity-0'
        }`}
        onPlay={() => updateStatus('playing')}
        onPlaying={() => updateStatus('playing')}
      />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 p-2 text-center">
          <VideoOff className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-xs text-slate-400">Stream unavailable (WebRTC)</p>
        </div>
      )}
    </div>
  );
};

export default WebRTCPlayer;
