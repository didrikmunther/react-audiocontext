import React, { useState, useEffect } from 'react';
import { Box } from './style/Box';
import { Subject } from 'rxjs';
import { Command } from './Channel';

const useMidiAccess = (): [WebMidi.MIDIAccess | undefined, string | undefined] => {
    const [error, setError] = useState<string>();
    const [access, setAccess] = useState<WebMidi.MIDIAccess>();

    useEffect(() => {
        if(!navigator.requestMIDIAccess) {
            setError("Midi not supported");
            return;
        }

        navigator.requestMIDIAccess()
            .then(
                access => setAccess(access),
                error => setError(error)
            );
    }, []);

    return [access, error];
};

interface MidiProps {
    commands$: Subject<Command>
};

export const Midi = ({ commands$ }: MidiProps) => {
    const [access, error] = useMidiAccess();
    const [man, setMan] = useState<string>();
    const [name, setName] = useState<string>();
    const [interfaces, setInterfaces] = useState<WebMidi.MIDIInput[]>([]);

    // const hasAccess = access && access.inputs.size > 0;

    useEffect(() => {
        if(!access) return;

        const update = () => {
            let elements = [];
            for(let input of access.inputs.values()) {
                elements.push(input);
            }

            setInterfaces(elements);
        };

        access.onstatechange = e => {
            console.log(e);

            setMan(e.port.manufacturer);
            setName(e.port.name);

            update();
        };

        update();
    }, [access, setMan, setName, setInterfaces]);

    useEffect(() => {
        const origin = `MIDI:${man}:${name}`;

        interfaces.forEach(input => {
            input.onmidimessage = e => {
                const [command, note] = e.data;
                const velocity = (e.data.length > 2) ? e.data[2] : 0;

                // console.log(command, note, velocity);

                const noteOn = () => commands$.next({note, velocity, origin});
                const noteOff = () => commands$.next({note, velocity: 0, origin});

                switch(command) {
                    case 144:
                        if(velocity > 0)
                            noteOn();
                        else
                            noteOff();
                        break;

                    case 128:
                        noteOff();
                        break;
                }
            };
        });
    }, [commands$, interfaces, man, name]);

    if(!error && interfaces.length <= 0)
        return <></>;

    if(error)
        return <h2>MIDI error: {error}</h2>;

    return (
        <Box>
            <h3>Midi connected</h3>
            <h4>{man}: {name}</h4>
        </Box>
    );
};
