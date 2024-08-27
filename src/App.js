import React, {useRef, useState} from 'react';
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';
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

    const startAnimation = async (callback) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let frameCount = 0;


        const subtitles = [
            { text: "Hello", start: 0, end: 1 },
            { text: "Guys,", start: 1, end: 2 },
            { text: "This", start: 2, end: 3 },
            { text: "is", start: 3, end: 4 },
            { text: "a", start: 4, end: 5 },
            { text: "test", start: 5, end: 6 },
            { text: "for", start: 6, end: 7 },
            { text: "captions", start: 7, end: 8 },
            { text: "😊", start: 8, end: 9 },
        ];

        let currentTime = 0;
        let fadeInDuration = 1;  // 1 second
        let fadeOutDuration = 1; // 1 second

        const drawSubtitle = (subtitle, opacity) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(subtitle.text, canvas.width / 2, canvas.height - 5);
        }

        const animate = async () => {
            currentTime += 0.05; // Increment time by 50ms

            const subtitle = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);

            if (subtitle) {
                let opacity = 1;
                if (currentTime < subtitle.start + fadeInDuration) {
                    opacity = (currentTime - subtitle.start) / fadeInDuration; // Fade in
                } else if (currentTime > subtitle.end - fadeOutDuration) {
                    opacity = (subtitle.end - currentTime) / fadeOutDuration; // Fade out
                }

                drawSubtitle(subtitle, opacity);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            await captureFrame(frameCount);

            frameCount++;
            if (frameCount < 1000) {
                requestAnimationFrame(animate);
            } else {
                callback()
            }
        };

        const  captureFrame = async (frameCount) => {
            canvas.toBlob(async (blob) => {
                if (blob) {

                    let pngFile = frameCount.toString().padStart(7, '0');
                    const url = await blobToDataURL(blob);
                    setDataURL(url);
                    ffmpeg.FS('writeFile', `${pngFile}.png`, await fetchFile(url));

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
            <canvas ref={canvasRef} width="256" height="240" style={{border:'1px solid #000'}}></canvas>

            {dataURL && <img src={dataURL} alt="Canvas Image" />}
            <button onClick={doTranscode}>Start</button>
            <p>{message}</p>
        </div>
    );
}

export default App;
