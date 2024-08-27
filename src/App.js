import React, {useEffect, useRef, useState} from 'react';
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

    // canvas
    const canvasRef = useRef(null);
    const [dataURL, setDataURL] = useState('');
    const [frames, setFrames] = useState([]);
    const [frameIndex, setFrameIndex] = useState(0);

    const startAnimation = async (callback) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let x = 0;
        let y = 50;
        let frameCount = 0;
        const animate = async () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

            // Draw a rectangle
            ctx.fillStyle = 'blue';
            ctx.fillRect(x, y, 100, 50);

            // Capture the frame
            await captureFrame(frameCount);

            // Update position for animation
            x += 2;
            if (x > canvas.width) x = -100;

            frameCount++;
            setFrameIndex(frameCount);
            if (frameCount < 10) {
                requestAnimationFrame(animate);
            } else {
                callback()
            }
        };

        const  captureFrame = async (frameCount) => {
            // const dataURL = canvas.toDataURL('image/png');
            // setFrames(prevFrames => [...prevFrames, dataURL]);
            canvas.toBlob(async (blob) => {
                if (blob) {
                    // const blobURL = URL.createObjectURL(blob);
                    // setFrames(prevFrames => [...prevFrames, blobURL]);
                    // console.log("blob xxx", blob.toString())

                    // console.log('frames lol', URL.createObjectURL(blob))
                    // let temp = new Blob([blob], { type: 'image/png' })
                    // ffmpeg.FS('writeFile', `${pngFile}.png`, URL.createObjectURL(temp));

                    let pngFile = frameCount.toString().padStart(7, '0');
                    const url = await blobToDataURL(blob);
                    setDataURL(url);
                    ffmpeg.FS('writeFile', `${pngFile}.png`, await fetchFile(url));

                    // setFrames(prevFrames => [...prevFrames, blob]);
                }
            }, 'image/png');
        };

        // Start animation
        await animate();

        // Cleanup on component unmount
        return () => cancelAnimationFrame(animate);
    };
    const blobToDataURL = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const ffmpeg = createFFmpeg({
        log: true,
    });
    const doTranscode = async () => {
        setMessage('Loading ffmpeg-core.js');
        await ffmpeg.load();
        startAnimation(async () => {

            setMessage('Start transcoding');
            ffmpeg.FS('writeFile', 'test.avi', await fetchFile('/flame.avi'));
            // for (let i = 0; i < frames.length; i++) {
            //   let pngFile = i.toString().padStart(7, '0');
            //   console.log('frames lol', frames[i])
            //   ffmpeg.FS('writeFile', `${pngFile}.png`, frames[i]);
            //   if (i > 100) {
            //     break;
            //   }
            // }

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
        });
    };
    return (
        <div className="App">
            <p/>
            <video src={videoSrc} controls></video>
            <br/>
            <canvas ref={canvasRef} width="500" height="400" style={{border:'1px solid #000'}}></canvas>

            {dataURL && <img src={dataURL} alt="Canvas Image" />}
            <button onClick={doTranscode}>Start</button>
            <p>{message}</p>
        </div>
    );
}

export default App;
