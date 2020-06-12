import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectableNode, tryTo } from '../Channel';
import { Box } from '../style/Box';
import { Row } from '../style/Geometry';

interface ReverbProps extends ConnectableNode {
    initial: {
        enabled?: boolean,
        impulse?: string
    }
}

const Impulses = [
    'Block Inside.wav',
    'Bottle Hall.wav',
    'Cement Blocks 1.wav',
    'Cement Blocks 2.wav',
    'Chateau de Logne, Outside.wav',
    'Conic Long Echo Hall.wav',
    'Deep Space.wav',
    'Derlon Sanctuary.wav',
    'Direct Cabinet N1.wav',
    'Direct Cabinet N2.wav',
    'Direct Cabinet N3.wav',
    'Direct Cabinet N4.wav',
    'Five Columns Long.wav',
    'Five Columns.wav',
    'French 18th Century Salon.wav',
    'Going Home.wav',
    'Greek 7 Echo Hall.wav',
    'Highly Damped Large Room.wav',
    'In The Silo Revised.wav',
    'In The Silo.wav',
    'Large Bottle Hall.wav',
    'Large Long Echo Hall.wav',
    'Large Wide Echo Hall.wav',
    'Masonic Lodge.wav',
    'Musikvereinsaal.wav',
    'Narrow Bumpy Space.wav',
    'Nice Drum Room.wav',
    'On a Star.wav',
    'Parking Garage.wav',
    'Rays.wav',
    'Right Glass Triangle.wav',
    'Ruby Room.wav',
    'Scala Milan Opera Hall.wav',
    'Small Drum Room.wav',
    'Small Prehistoric Cave.wav',
    'St Nicolaes Church.wav',
    'Trig Room.wav',
    'Vocal Duo.wav'
].map(v => v.slice(0, v.length - 4))

export const Reverb = ({ audio, input, out, serialized$, initial }: ReverbProps) => {
    const [enabled, setEnabled] = useState<boolean>(initial.enabled ?? true);

    const [convolver] = useState<ConvolverNode>(new ConvolverNode(audio));
    const [impulse, setImpulse] = useState<string>(initial.impulse ?? Impulses[0]);
    const [currentSound, setCurrentSound] = useState<ArrayBuffer>();
    const player = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        fetch(`./resources/impulses/${impulse}.wav`)
            .then(r => r.arrayBuffer())
            .then(v => {
                setCurrentSound(v.slice(0));
                audio.decodeAudioData(v, buf => convolver.buffer = buf);
            });
    }, [audio, impulse, convolver]);

    useEffect(() => {
        if(enabled)
            input?.connect(convolver).connect(out);
        else
            input?.connect(out);

        return () => [
            () => input?.disconnect(out),
            () => input?.disconnect(convolver),
            () => convolver.disconnect(out)
        ].forEach(tryTo);
    }, [enabled, input, convolver, out]);

    const serializedData = {
        enabled,
        impulse
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => serialized$.next(serializedData), Object.values(serializedData));

    const playSound = useCallback(
        () => {
            if(!player?.current || !currentSound) return;

            let blob = new Blob([currentSound], { type: 'audio/mp3' });
            let url = window.URL.createObjectURL(blob)
            player.current.src = url;
            player.current.play();
        },
        [currentSound]
    );

    return (
        <Box>
            <Row>
                <h3>Reverb</h3>
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            </Row>

            <audio ref={player} style={{display: 'none'}}></audio>

            <Row>
                <label>
                    <span>Impulse <b>{impulse}</b></span>
                    <select value={impulse} onChange={e => setImpulse(e.target.value as string)}>
                        {
                            Impulses.map((v, i) => <option key={i} value={v}>{v}</option>)
                        }
                    </select>
                    <button onClick={playSound}>Play sound</button>
                </label>
            </Row>
        </Box>
    );
};