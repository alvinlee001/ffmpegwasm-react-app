import React, { useState } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import './App.css';

function pad(num, size) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

function App() {
  const [videoSrc, setVideoSrc] = useState('');
  const [message, setMessage] = useState('Click Start to transcode');
  const ffmpeg = createFFmpeg({
    log: true,
  });
  const doTranscode = async () => {
    setMessage('Loading ffmpeg-core.js');
    await ffmpeg.load();
    setMessage('Start transcoding');
    ffmpeg.FS('writeFile', 'test.avi', await fetchFile('/flame.avi'));
    for (let i = 0; i < 218; i++) {
      let pngFile = i.toString().padStart(7, '0');
      ffmpeg.FS('writeFile', `${pngFile}.png`, await fetchFile(`/frames/${pngFile}.png`));
    }

    // await ffmpeg.run('-i', 'test.avi', 'test.mp4');
    await ffmpeg.run(
        '-i', 'test.avi',
        '-framerate', '30', '-loop', '1', '-i', '%07d.png',
        '-c:v', 'libvpx-vp9', '-b:v', '1M',
        '-filter_complex', 'overlay=shortest=1',
        'test.webm');
    setMessage('Complete transcoding');
    const data = ffmpeg.FS('readFile', 'test.webm');
    setVideoSrc(URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })));
  };
  return (
    <div className="App">
      <p/>
      <video src={videoSrc} controls></video><br/>
      <button onClick={doTranscode}>Start</button>
      <p>{message}</p>
    </div>
  );
}

export default App;
