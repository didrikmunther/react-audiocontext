import React, { useContext, useEffect, useCallback, useState } from 'react';
import { Box } from '../style/Box';
import { BehaviorSubject } from 'rxjs';
import { useKnob } from '../Knob';
import { Row } from '../style/Geometry';
import { tryTo } from '../Channel';
import { getLogScale, getCutoff } from './EQ';

export const LFOContext = React.createContext<BehaviorSubject<AudioNode | null>>(new BehaviorSubject<AudioNode | null>(null));

const MinFreq = .1;
const MinGain = .01;

const getGain = (gain: number) => gain === 0 ? 0 : getLogScale(gain, MinGain, 1000);

interface LFOProps {
    audio: AudioContext
};

export const LFO = ({ audio }: LFOProps) => {
    const lfo$ = useContext(LFOContext);

    const [isMoving, setIsMoving] = useState<boolean>(false);
    const [pos, setPos] = useState<[number, number]>();

    const [frequency, frequencyKnob] = useKnob(.5, { min: 0, max: 1 });
    const [gain, gainKnob] = useKnob(.1, { min: 0, max: 1, step: .001 });

    const [form, setForm] = useState<OscillatorType>('sine' as OscillatorType);
    const [lfo] = useState<OscillatorNode>(new OscillatorNode(audio));
    const [lfoGain] = useState<GainNode>(new GainNode(audio));

    useEffect(() => {
        lfo.start();
    }, [lfo]);

    useEffect(() => {
        lfo.type = form;
        lfo.frequency.setValueAtTime(getCutoff(audio, frequency, MinFreq), audio.currentTime);
        lfoGain.gain.setValueAtTime(getGain(gain), audio.currentTime);
        lfo.connect(lfoGain);

        return () => {
            lfo.frequency.cancelScheduledValues(audio.currentTime);
            lfoGain.gain.cancelScheduledValues(audio.currentTime);

            [
                () => lfo.disconnect(lfoGain)
            ].forEach(tryTo);
        };
    }, [audio, lfo, lfoGain, frequency, form, gain]);
    
    const onMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            setIsMoving(true);
            let hasMoved = false;

            const start = [e.clientX, e.clientY];
            setPos([0, 0]);

            const onMouseUp = () => {
                document.removeEventListener('mouseup', onMouseUp);
                document.removeEventListener('mousemove', onMouseMove);

                setIsMoving(false);

                if(hasMoved)
                    lfo$.next(null);
            };

            const onMouseMove = (e: MouseEvent) => {
                if(!hasMoved) {
                    hasMoved = true;
                    lfo$.next(lfoGain);
                }

                e.preventDefault();
                const position: [number, number] = [e.clientX - start[0], e.clientY - start[1]];
                setPos(position);
            };
    
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('mousemove', onMouseMove);
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
                        <span>Gain: {getGain(gain).toFixed(Math.log10(1 / MinGain))}</span>
                        {gainKnob}
                    </label>
                </Row>
            </Box>
        </Box>
    );
};