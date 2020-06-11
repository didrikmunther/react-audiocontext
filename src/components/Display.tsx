import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const DisplayStyled = styled.div`
    margin: 15px;
    border-radius: 3px;
    overflow: hidden;
`;

type DisplayProps = {
    audio: AudioContext,
    out: AudioNode
};

export const WaveDisplay = ({ audio, out }: DisplayProps) => {
    const [analyser, setAnalyser] = useState<AnalyserNode>(new AnalyserNode(audio));
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(!canvasRef.current) return;
        const canvas = canvasRef.current;

        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        out.connect(analyser);

        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        analyser.fftSize = 2048;
        var bufferLength = analyser.fftSize;
        var dataArray = new Uint8Array(bufferLength);

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        let play = true;

        const drawAlt = () => {
            if(!play)
                return;

            requestAnimationFrame(drawAlt);
            analyser.getByteTimeDomainData(dataArray);

            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgb(250, 250, 250)';

            ctx.beginPath();

            var sliceWidth = WIDTH * 1.0 / bufferLength;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {
                var v = dataArray[i] / 128.0;
                var y = v * HEIGHT / 2;
        
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
        
                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };

        drawAlt();
        return () => {
            play = false;
            setAnalyser(new AnalyserNode(audio));
        };
    }, [audio, canvasRef, analyser, out]);

    return (
        <DisplayStyled>
            <canvas ref={canvasRef}></canvas>
        </DisplayStyled>
    );
};

export const FrequencyDisplay = ({ audio, out }: DisplayProps) => {
    const [analyser, setAnalyser] = useState<AnalyserNode>(new AnalyserNode(audio));
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(!canvasRef.current) return;
        const canvas = canvasRef.current;

        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        out.connect(analyser);

        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        analyser.fftSize = 256;
        var bufferLengthAlt = analyser.frequencyBinCount;
        var dataArrayAlt = new Uint8Array(bufferLengthAlt);

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        let play = true;

        const drawAlt = () => {
            if(!play)
                return;

            requestAnimationFrame(drawAlt);
            analyser.getByteFrequencyData(dataArrayAlt);

            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            var barWidth = (WIDTH / bufferLengthAlt) * 2.5;
            var barHeight;
            var x = 0;

            for(var i = 0; i < bufferLengthAlt; i++) {
                barHeight = dataArrayAlt[i];

                ctx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
                ctx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

                x += barWidth + 1;
            }
        };

        drawAlt();
        return () => {
            play = false;
            setAnalyser(new AnalyserNode(audio));
        };
    }, [audio, out, canvasRef, analyser]);

    return (
        <DisplayStyled>
            <canvas ref={canvasRef}></canvas>
        </DisplayStyled>
    );
};