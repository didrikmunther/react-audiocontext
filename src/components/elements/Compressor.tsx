import React, { useState, useEffect, useRef } from 'react';
import { Box } from '../style/Box';
import { ConnectableNode, tryTo } from '../Channel';
import { useKnob } from '../Knob';
import { Row } from '../style/Geometry';
import styled from 'styled-components';

const CompressorReductionStyled = styled.div`
    display: flex;
    align-items: center;
`;

interface CompressorReductionProps {
    compressor?: DynamicsCompressorNode
}

const CompressorReduction = ({ compressor }: CompressorReductionProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(!canvasRef.current) return;

        const { width, height } = canvasRef.current;
        const ctx = canvasRef.current.getContext('2d');
        if(!ctx) return;

        ctx.clearRect(0, 0, width, height);
        ctx.font = "30px Arial";

        if(!compressor) return;

        let play: boolean = true;

        const render = () => {
            if(!play) return;
            requestAnimationFrame(render);

            ctx.clearRect(0, 0, width, height);

            const bar = compressor.reduction / -60;
            ctx.fillStyle = 'rgb(' + (255 * bar + 50) + ',50,50)';
            ctx.fillRect(0, 0, width * bar, height);
        };

        render();

        return () => {
            play = false;
        };
    }, [compressor, canvasRef]);

    const canvasStyle = {
        width: 100,
        height: 10
    };

    return (
        <CompressorReductionStyled>
            <canvas ref={canvasRef} style={canvasStyle}></canvas>
        </CompressorReductionStyled>
    );
};

interface CompressorProps extends ConnectableNode {
    initial: {
        enabled: boolean,
        threshold: number,
        knee: number,
        ratio: number,
        attack: number,
        release: number
    }
};

export const Compressor = ({ audio, input, out, initial, serialized$ }: CompressorProps) => {
    const [enabled, setEnabled] = useState<boolean>(initial.enabled ?? true);

    const [compressor] = useState<DynamicsCompressorNode>(new DynamicsCompressorNode(audio));

    const [threshold, thresholdKnob] = useKnob(initial.threshold ?? -50, { min: -100, max: 0 });
    const [knee, kneeKnob] = useKnob(initial.knee ?? 40, { min: 0, max: 40 });
    const [ratio, ratioKnob] = useKnob(initial.ratio ?? 12, { min: 1, max: 20 });
    const [attack, attackKnob] = useKnob(initial.attack ?? 0, { max: 1 });
    const [release, releaseKnob] = useKnob(initial.release ?? .25, {min: .01});

    useEffect(() => {
        if(enabled)
            input?.connect(compressor).connect(out);
        else
            input?.connect(out);

        return () => [
            () => input?.disconnect(compressor),
            () => input?.disconnect(out),
            () => compressor.disconnect(out)
        ].forEach(tryTo);
    }, [input, out, compressor, enabled]);

    useEffect(() => {
        compressor.threshold.setValueAtTime(threshold, audio.currentTime);
        compressor.knee.setValueAtTime(knee, audio.currentTime);
        compressor.ratio.setValueAtTime(ratio, audio.currentTime);
        compressor.attack.setValueAtTime(attack, audio.currentTime);
        compressor.release.setValueAtTime(release, audio.currentTime);
    }, [audio, compressor, threshold, knee, ratio, attack, release]);

    const serializedData = {
        enabled,
        threshold,
        knee,
        ratio,
        release,
        attack,
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => serialized$.next(serializedData), Object.values(serializedData));

    return (
        <Box>
            <Row>
                <h3>Compressor</h3>
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                <CompressorReduction compressor={enabled ? compressor : undefined} />
            </Row>

            <Row>
                <label>
                    <span>Ratio: {ratio}</span>
                    {ratioKnob}
                </label>
            </Row>
            <Row>
                <label>
                    <span>Threshold: {threshold}</span>
                    {thresholdKnob}
                </label>
                <label>
                    <span>Knee: {knee}</span>
                    {kneeKnob}
                </label>
            </Row>
            <Row>
                <label>
                    <span>Release: {release}</span>
                    {releaseKnob}
                </label>
                <label>
                    <span>Attack: {attack}</span>
                    {attackKnob}
                </label>
            </Row>
        </Box>
    );
};