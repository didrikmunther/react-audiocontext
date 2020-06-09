import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const DisplayStyled = styled.div`
    margin: 15px;
    border-radius: 3px;
    overflow: hidden;
`;

type DisplayProps = {
    analyser: AnalyserNode
};

export const Display = ({ analyser }: DisplayProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(!canvasRef.current) return;
        const canvas = canvasRef.current;

        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        analyser.fftSize = 256;
        var bufferLengthAlt = analyser.frequencyBinCount;
        var dataArrayAlt = new Uint8Array(bufferLengthAlt);

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        const drawAlt = () => {
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
    }, [canvasRef, analyser]);

    return (
        <DisplayStyled>
            <canvas ref={canvasRef}></canvas>
        </DisplayStyled>
    );
};