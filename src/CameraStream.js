import React, { useState, useRef } from 'react';
import { useUserMedia } from './hooks/useUserMedia';
import jsQR from 'jsqr';
// import { useStyles } from '../hooks/useStyles';

const states = {
  LOADING: 'LOADING',
  READY: 'READY',
  QR_FOUND: 'QR_FOUND',
  ERROR: 'ERROR,'
}

const CAPTURE_OPTIONS = {
  video: { facingMode: 'environment' },
};

const CameraStream = () => {
  const [currentState, setCurrentState] = useState(states.READY);
  const [videoIsLoading, setVideoIsLoading] = useState(true);
  const [qrResult, setQrResult] = useState({
    label: '',
    timestamp: '',
  });
  const videoRef = useRef();
  const canvasRef = useRef();
  const mediaStream = useUserMedia(CAPTURE_OPTIONS);

  const drawLine = (begin, end, color) => {
    const context = canvasRef.current.getContext('2d');
    context.beginPath();
    context.moveTo(begin.x, begin.y);
    context.lineTo(end.x, end.y);
    context.lineWidth = 4;
    context.strokeStyle = color;
    context.stroke();
  };

  const tick = () => {
    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      setVideoIsLoading(false);
      const context = canvasRef.current?.getContext('2d');

      canvasRef.current.height = videoRef.current.videoHeight;
      canvasRef.current.width = videoRef.current.videoWidth;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (code) {
        drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
        drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
        drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
        drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
        setCurrentState(states.QR_FOUND);
        setQrResult({
          ...qrResult,
          label: code.data,
        });
      }
    }
    requestAnimationFrame(tick);
  }

  if (mediaStream && videoRef.current && !videoRef.current.srcObject) {
    videoRef.current.srcObject = mediaStream;
    requestAnimationFrame(tick);
  }

  const handleCanPlay = () => {
    videoRef.current.play();
  };

  const handleClick = () => {
    debugger;
    window.location.href = qrResult.label;
  }

  return (
    <div id="container">
      <video id="player" ref={videoRef} onCanPlay={handleCanPlay} autoPlay playsInline muted />
      { !videoIsLoading && <canvas id="canvas" ref={canvasRef}></canvas> }
      {
        currentState === states.QR_FOUND
        &&
        <div id="capture-container">
          <button onClick={handleClick} className="pure-material-button-contained">Click me</button>
        </div>
      }
    </div>
  );
}

export default CameraStream;


