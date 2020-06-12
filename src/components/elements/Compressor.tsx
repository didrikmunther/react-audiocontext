import React, { useState, useEffect } from 'react';
import { Box } from '../style/Box';
import { ConnectableNode, tryTo } from '../Channel';
import { useKnob } from '../Knob';
import { Row } from '../style/Geometry';

interface CompressorProps extends ConnectableNode {

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