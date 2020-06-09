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

    const hasAccess = access && access.inputs.size > 0;

    useEffect(() => {
        if(!access || !hasAccess)
            return;

        access.onstatechange = e => {
            setMan(e.port.manufacturer);
            setName(e.port.name);
        };

        for(let input of access.inputs.values()) {
            input.onmidimessage = e => {
                const [command, note] = e.data;
                const velocity = (e.data.length > 2) ? e.data[2] : 0;

                console.log(command, note, velocity);

                const noteOn = () => commands$.next({note, velocity});
                const noteOff = () => commands$.next({note, velocity: 0});

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
        }
    }, [access, hasAccess, commands$, setMan, setName]);

    if(!error && !hasAccess)
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