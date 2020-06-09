import React, { useState, useCallback } from 'react';
import { ES1 } from './ES1/ES1';
import { Observable } from 'rxjs';

export type Command = {
    note: number,
    velocity: number
}

export interface ConnectableNode {
    audio: AudioContext,
    setSerialized: (serialized: {
        [key: string]: any
    }) => void,
};

const getLocal = (key: string): Object => {
	const res = localStorage.getItem(key);
	if(res === null)
		return {};

	return JSON.parse(res) || {};
};

interface ChannelProps {
    audio: AudioContext,
    out: AudioNode,
    commands$: Observable<Command>
};

export const Channel = ({ audio, out, commands$ }: ChannelProps) => {
    const [serialized] = useState(getLocal('ES1'));

    const setSerialized = useCallback(
		serialized => localStorage.setItem('ES1', JSON.stringify(serialized)),
		[]
	);

    return (
        <>
            <ES1 audio={audio} commands$={commands$} out={out} setSerialized={setSerialized} initial={serialized as any}></ES1>
        </>
    );
};