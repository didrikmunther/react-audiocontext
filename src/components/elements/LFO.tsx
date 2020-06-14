import React, { useContext, useEffect, useCallback, useState } from 'react';
import { Box } from '../style/Box';
import { BehaviorSubject } from 'rxjs';
import { useKnob } from '../Knob';
import { Row } from '../style/Geometry';
import { tryTo } from '../Channel';
import { getCutoff } from './EQ';

export const LFOContext = React.createContext<BehaviorSubject<AudioNode | null>>(new BehaviorSubject<AudioNode | null>(null));

const MinFreq = .1;

interface LFOProps {
    audio: AudioContext
};

export const LFO = ({ audio }: LFOProps) => {
    const lfo$ = useContext(LFOContext);

    const [isMoving, setIsMoving] = useState<boolean>(false);
    const [pos, setPos] = useState<[number, number]>();

    const [frequency, frequencyKnob] = useKnob(.5, { min: 0, max: 1 });
    const [gain, gainKnob] = useKnob(100, { min: 0, max: 1000, step: 1 });

    const [form, setForm] = useState<OscillatorType>('sine' as OscillatorType);
    const [lfo] = useState<OscillatorNode>(new OscillatorNode(audio));
    const [lfoGain] = useState<GainNode>(new GainNode(audio));

    useEffect(() => {
        lfo.start();
    }, [lfo]);

    useEffect(() => {
        lfo.type = form;
        lfo.frequency.setValueAtTime(getCutoff(audio, frequency, MinFreq), audio.currentTime);
        lfoGain.gain.setValueAtTime(gain, audio.currentTime);
        lfo.connect(lfoGain);

        return () => {
            lfo.frequency.cancelScheduledValues(audio.currentTime);
            lfoGain.gain.cancelScheduledValues(audio.currentTime);

            [
                () => lfo.disconnect(lfoGain)
            ].forEach(tryTo);
        };
    }, [audio, lfo, lfoGain, frequency, form, gain]);

    // const onMouseMove = useCallback(
    //     (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {

    //     },
    //     []
    // );
    
    const onMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            setIsMoving(true);

            const start = [e.clientX, e.clientY];
            setPos([0, 0]);

            const onMouseUp = () => {
                document.removeEventListener('mouseup', onMouseUp);
                document.removeEventListener('mousemove', onMouseMove);

                setIsMoving(false);
                lfo$.next(null);
            };

            const onMouseMove = (e: MouseEvent) => {
                const position: [number, number] = [e.clientX - start[0], e.clientY - start[1]];
                setPos(position);
            };
    
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('mousemove', onMouseMove);

            lfo$.next(lfoGain);
        },
        [lfo$, lfoGain]
    );

    let style = {};
    if(isMoving && pos) {
        style = {
            transform: `translate(${pos[0]}px, ${pos[1]}px)`
        };
    }

    return (
        <Box>
            <h3>LFO (drag and drop)</h3>

            <Box style={style} onMouseDown={onMouseDown}>
                <Row>
                    <label>
                        <span>Form <b>{form}</b></span>
                        <select value={form} onChange={e => setForm(e.target.value as OscillatorType)}>
                            <option value="sine">Sine</option>
                            <option value="triangle">Triangle</option>
                            <option value="square">Square</option>
                            <option value="sawtooth">Sawtooth</option>
                        </select>
                    </label>
                </Row>
                <Row>
                    <label>
                        <span>Frequency: {getCutoff(audio, frequency, MinFreq).toFixed(1)}</span>
                        {frequencyKnob}
                    </label>
                    <label>
                        <span>Gain: {gain}</span>
                        {gainKnob}
                    </label>
                </Row>
            </Box>
        </Box>
    );
};