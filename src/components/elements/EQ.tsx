import React, { useState, useRef, useEffect } from 'react';
import { ConnectableNode, tryTo } from '../Channel';
import { useKnob } from '../Knob';
import { Box } from '../style/Box';
import { Row } from '../style/Geometry';

const dbToY = (db: number, pixelsPerDb: number, height: number) => {
    var y = (0.5 * height) - pixelsPerDb * db;
    return y;
};

const drawCurve = (audio: AudioContext, filter: BiquadFilterNode, canvas: HTMLCanvasElement) => {
    const canvasContext = canvas.getContext('2d');
    if(!canvasContext) return;

    const curveColor = "rgb(224,27,106)";
    const gridColor = "rgb(100,100,100)";
    const textColor = "rgb(81,127,207)";
    const dbScale = 60;

    const width = canvas.width;
    const height = canvas.height;

    let play = true;

    const draw = () => {
        if(!play) return;
        requestAnimationFrame(draw);

        canvasContext.clearRect(0, 0, width, height);
        canvasContext.fillRect(0, 0, width, height);

        canvasContext.strokeStyle = curveColor;
        canvasContext.lineWidth = 3;
        canvasContext.beginPath();
        canvasContext.moveTo(0, 0);

        const pixelsPerDb = (0.5 * height) / dbScale;
        
        var noctaves = 11;
        
        var frequencyHz = new Float32Array(width);
        var magResponse = new Float32Array(width);
        var phaseResponse = new Float32Array(width);
        var nyquist = 0.5 * audio.sampleRate;
        // First get response.
        for (var i = 0; i < width; ++i) {
            var f = i / width;
            
            // Convert to log frequency scale (octaves).
            f = nyquist * Math.pow(2.0, noctaves * (f - 1.0));
            
            frequencyHz[i] = f;
        }

        filter.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
        
        for (i = 0; i < width; ++i) {
            f = magResponse[i];
            var response = magResponse[i];
            var dbResponse = 20.0 * Math.log(response) / Math.LN10;
            
            var x = i;
            var y = dbToY(dbResponse, pixelsPerDb, height);
            
            if ( i === 0 )
                canvasContext.moveTo(x,y);
            else
                canvasContext.lineTo(x, y);
        }
        canvasContext.stroke();
        canvasContext.beginPath();
        canvasContext.lineWidth = 1;
        canvasContext.strokeStyle = gridColor;
        
        // Draw frequency scale.
        for (var octave = 0; octave <= noctaves; octave++) {
            x = octave * width / noctaves;
            
            canvasContext.strokeStyle = gridColor;
            canvasContext.moveTo(x, 30);
            canvasContext.lineTo(x, height);
            canvasContext.stroke();

            f = nyquist * Math.pow(2.0, octave - noctaves);
            var value = f.toFixed(0);
            var unit = 'Hz';
            if (f > 1000) {
            unit = 'KHz';
            value = (f/1000).toFixed(1);
            }
            canvasContext.textAlign = "center";
            canvasContext.strokeStyle = textColor;
            canvasContext.strokeText(value + unit, x, 20);
        }

        // Draw 0dB line.
        canvasContext.beginPath();
        canvasContext.moveTo(0, 0.5 * height);
        canvasContext.lineTo(width, 0.5 * height);
        canvasContext.stroke();
        
        // Draw decibel scale.
        
        for (var db = -dbScale; db < dbScale - 10; db += 10) {
            y = dbToY(db, pixelsPerDb, height);
            canvasContext.strokeStyle = textColor;
            canvasContext.strokeText(db.toFixed(0) + "dB", width - 40, y);
            canvasContext.strokeStyle = gridColor;
            canvasContext.beginPath();
            canvasContext.moveTo(0, y);
            canvasContext.lineTo(width, y);
            canvasContext.stroke();
        }
    };

    draw();

    return () => {
        play = false;
    };
}

interface EQProps extends ConnectableNode {
    initial: {
        enabled?: boolean,
        frequency: number,
        detune: number,
        Q: number,
        gain: number,
        biquadType: string
    }
}

const BiquadTypes = [
    'lowpass',
    'highpass',
    'bandpass',
    'lowshelf',
    'highshelf',
    'peaking',
    'notch',
    'allpass'
];

export const getLogScale = (factor: number, min: number, max: number) => {
    const nyquist = max;
    const noctaves = Math.log(nyquist / min) / Math.LN2;
    const v2 = Math.pow(2.0, noctaves * (factor - 1.0));
    return v2 * nyquist;
}

export const getCutoff = (audio: AudioContext, factor: number, min: number = 10): number => {
    return getLogScale(factor, min, audio.sampleRate * .5);
};

export const EQ = ({ audio, initial, serialized$, commands$, input, out }: EQProps) => {
    const [enabled, setEnabled] = useState<boolean>(initial.enabled ?? true);
    const [biquad] = useState<BiquadFilterNode>(new BiquadFilterNode(audio));

    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [frequency, frequencyKnob] = useKnob(initial.frequency ?? .5, { min: 0, max: 1, bind: biquad.frequency });
    const [detune, detuneKnob] = useKnob(initial.detune ?? 0, { min: 0, max: 100, bind: biquad.detune });
    const [Q, QKnob] = useKnob(initial.Q ?? .01, { min: 0.0001, max: 1, bind: biquad.Q });
    const [gain, gainKnob] = useKnob(initial.gain ?? 0, { min: -40, max: 40, bind: biquad.gain });
    const [biquadType, setBiquadType] = useState<BiquadFilterType>((initial.biquadType ?? 'lowpass') as BiquadFilterType);
    
    useEffect(() => {
        if(!canvasRef.current) return;

        return drawCurve(audio, biquad, canvasRef.current);
    }, [audio, biquad, canvasRef]);

    useEffect(() => {
        if(enabled)
            input?.connect(biquad).connect(out);
        else
            input?.connect(out);

        return () => [
            () => input?.disconnect(biquad),
            () => input?.disconnect(out),
            () => biquad.disconnect(out)
        ].forEach(tryTo);
    }, [input, biquad, out, enabled]);

    useEffect(() => {
        biquad.frequency.setValueAtTime(getCutoff(audio, frequency), audio.currentTime);
        biquad.detune.setValueAtTime(detune, audio.currentTime)
        biquad.Q.setValueAtTime(getLogScale(Q, .0001, 100), audio.currentTime);
        biquad.gain.setValueAtTime(gain, audio.currentTime);
        biquad.type = biquadType;
    }, [audio, frequency, detune, Q, gain, biquadType, biquad]);

    const serializedData = {
        frequency,
        detune,
        Q,
        gain,
        biquadType
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => serialized$.next(serializedData), Object.values(serializedData));

    return (
        <Box>
            <Row>
                <h3>EQ</h3>
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            </Row>

            <Row>
                <canvas ref={canvasRef}></canvas>
            </Row>

            <Row>
                <label>
                    <select value={biquadType} onChange={e => setBiquadType(e.target.value as BiquadFilterType)}>
                        {
                            BiquadTypes.map((v, i) => <option key={i} value={v}>{v}</option>)
                        }
                    </select>
                </label>
                <label>
                    <span>Frequency: {getCutoff(audio, frequency).toFixed(0)}</span>
                    {frequencyKnob}
                </label>
            </Row>

            <Row>
                <label>
                    <span>Detune: {detune}</span>
                    {detuneKnob}
                </label>
                <label>
                    <span>Q: {getLogScale(Q, .0001, 100).toFixed(3)}</span>
                    {QKnob}
                </label>
                <label>
                    <span>Gain: {gain}</span>
                    {gainKnob}
                </label>
            </Row>
        </Box>
    );
};