import React, { useState, useCallback } from 'react';
import { ES1, InputNode } from './ES1/ES1';

const getLocal = (key: string): Object => {
	const res = localStorage.getItem(key);
	if(res === null)
		return {};

	return JSON.parse(res) || {};
};

interface ChannelProps {
    audio: AudioContext,
    setInputNode: (node: InputNode) => void
};

export const Channel = ({ audio, setInputNode }: ChannelProps) => {
    const [serialized] = useState(getLocal('ES1'));

    const setInstrument = useCallback(
		(node: InputNode) => {
            setInputNode(node);

            const serialized = node.getSerialized();
			localStorage.setItem('ES1', JSON.stringify(serialized));
		},
		[setInputNode]
	);

    return (
        <>
            <ES1 audio={audio} setNode={setInstrument} initial={serialized as any}></ES1>
        </>
    );
};