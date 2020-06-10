import React, { useState, useEffect } from 'react';
import { Command, ConnectableNode } from '../Channel';
import { Box } from '../style/Box';
import { Notes } from '../../data/Notes';
import { Observable } from 'rxjs';

export type OscillatorMode = 'poly' | 'mono' | 'legato';

const useSlider = (initialValue: number, min: number = 0, max: number = 2, step: number = .01) => {
    const [value, setValue] = useState<number>(initialValue);

    return {
        value,
        setValue,
        reset: () => setValue(initialValue),
        bind: {
            value,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(+(e.target as HTMLInputElement)?.value),
            step,
            type: 'range',
            min,
            max,
        }
    };
};

// const usePoly = () => {
//     return [
//         (note: number) => {
//             out.connect(node);
//             osc.frequency.setValueAtTime(note, audio.currentTime);
//             osc.frequency.value = note;
//             osc.start();

//             return {
//                 release: () => {
//                     console.log('ES1 releasing note', note);
//                     setFrequencies(frequencies => frequencies.filter(v => v !== note));

//                     env.gain.setValueAtTime(1, audio.currentTime);
//                     env.gain.linearRampToValueAtTime(0, audio.currentTime + release);
//                 }
//             };
//         }
//     ];
// };

interface ES1Props extends ConnectableNode {
    commands$: Observable<Command>,
    out: AudioNode,
    initial: {
        mode?: string | OscillatorMode,
        form?: string | OscillatorType,
        release: number,
        attack: number,
        volume: number,
        glide: number,
        voices: number,
        detune: number
    }
};

export const ES1 = ({ audio, setSerialized, initial, out, commands$ }: ES1Props) => {
    const [mode, setMode] = useState<OscillatorMode>((initial.mode ?? 'poly') as OscillatorMode);
    const [form, setForm] = useState<OscillatorType>((initial.form ?? 'sine') as OscillatorType);
    const {value: release, bind: releaseBind} = useSlider(initial.release ?? .2);
    const {value: attack, bind: attackBind} = useSlider(initial.attack ?? .2);
    const {value: volume, bind: volumeBind} = useSlider(initial.volume ?? .2);
    const {value: glide, bind: glideBind} = useSlider(initial.glide ?? .2);
    const {value: voices, bind: voicesBind} = useSlider(initial.voices ?? 1);
    const {value: detune, bind: detuneBind} = useSlider(initial.detune ?? 0);

    const [playing] = useState<{
        [note: number]: {
            osc: OscillatorNode[],
            env: GainNode,
            gain: GainNode
        }
    }>({});

    // const [gains, setGains] = useState<GainNode[]>([]);
    // const [oscillators, setOscillators] = useState<OscillatorNode[]>([]);
    // const [frequencies, setFrequencies] = useState<number[]>([]);

    useEffect(() => {
        const sub = commands$.subscribe(({ note, velocity }) => {
            console.log('ES1 received command', note, velocity);

            if(velocity <= 0) {
                const active = playing[note];
                if(!active)
                    return;

                active.env.gain.cancelScheduledValues(audio.currentTime)
                    .setTargetAtTime(active.env.gain.value, audio.currentTime, 0)
                    .linearRampToValueAtTime(0, audio.currentTime + release);

                setTimeout(() => {
                    active.osc.forEach(v => v.stop(audio.currentTime));
                    active.gain.disconnect(out);
                }, release * 1e3);

                return;
            }

            const env = audio.createGain();
            env.gain.cancelScheduledValues(audio.currentTime)
                .setValueAtTime(0, audio.currentTime)
                .linearRampToValueAtTime(1, audio.currentTime + attack);
            
            const gain = audio.createGain();
            gain.gain.setValueAtTime(volume * velocity / 127, audio.currentTime);

            const [, frequency] = Object.entries(Notes)[note];

            const osc = [...Array(voices)].map((v, i, a) => {
                const osc = audio.createOscillator();
                osc.connect(env).connect(gain).connect(out);

                osc.type = form;
                osc.frequency.setValueAtTime(frequency, audio.currentTime);
                osc.detune.setValueAtTime(detune * ( a.length / 2 - i ), audio.currentTime);
                return osc;
            });
            
            // console.log('Playing frequency', toneName, frequency);
            osc.forEach(v => v.start());

            playing[note] = {
                osc,
                env,
                gain
            };
        });

        return () => sub.unsubscribe();
    }, [audio, commands$, playing, form, release, attack, volume, mode, glide, out, voices, detune]);

    const serialized = {
        mode,
        form,
        release,
        attack,
        volume,
        glide,
        voices,
        detune
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => setSerialized(serialized), Object.values(serialized));

    return (
        <Box>
            <h3>Oscillator</h3>
            {/* <h4>Frequencies: {JSON.stringify(frequencies)}</h4> */}

            <label>
                <span>Mode <b>{mode}</b></span>
                <select value={mode} onChange={e => setMode(e.target.value as OscillatorMode)}>
                    <option value="poly">Poly</option>
                    <option value="mono">Mono</option>
                    <option value="legato">Legato</option>
                </select>
            </label>
            <label>
                <span>Form <b>{form}</b></span>
                <select value={form} onChange={e => setForm(e.target.value as OscillatorType)}>
                    <option value="sine">Sine</option>
                    <option value="triangle">Triangle</option>
                    <option value="square">Square</option>
                </select>
            </label>
            <label>
                <span>Glide: {glide}</span>
                <input {...glideBind}></input>
            </label>
            <label>
                <span>Release: {release}</span>
                <input {...releaseBind}></input>
            </label>
            <label>
                <span>Attack: {attack}</span>
                <input {...attackBind}></input>
            </label>
            <label>
                <span>Volume: {volume}</span>
                <input {...volumeBind} max={1} step={.0001}></input>
            </label>
            <label>
                <span>Voices: {voices}</span>
                <input {...voicesBind} step={1} min={1} max={16}></input>
            </label>
            <label>
                <span>Detune: {detune}</span>
                <input {...detuneBind}></input>
            </label>
        </Box>
    )
};