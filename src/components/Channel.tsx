import React, { useState, useCallback, useEffect } from 'react';
import { ES1 } from './elements/ES1';
import { Observable } from 'rxjs';
import { Compressor } from './elements/Compressor';

export type Command = {
    note: number,
    velocity: number
}

export interface ConnectableNode {
    audio: AudioContext,
    input?: AudioNode,
    out: AudioNode,
    initial: any,
    commands$?: Observable<Command>,
    setSerialized: (serialize: () => {
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

const Elements: {
    [id: string]: (props: ConnectableNode) => JSX.Element
} = {
    'ES1': ES1,
    'Compressor': Compressor
};

export const Channel = ({ audio, out, commands$ }: ChannelProps) => {
    // const [serialized] = useState(getLocal('ES1'));
    const [elements, setElements] = useState<JSX.Element[]>([]);

    const [loaded] = useState<{
        instrument: {
            id: string,
            initial: any
        },
        plugins: {
            id: string,
            initial: any
        }[]
    }>({
        instrument: {
            id: 'ES1',
            initial: getLocal('ES1')
        },
        plugins: [{
            id: 'Compressor',
            initial: {}
        }]
    });

    
    const setSerialized = useCallback(
		serialize => localStorage.setItem('ES1', JSON.stringify(serialize())),
		[]
    );

    useEffect(() => {
        const InstrumentEl = Elements[loaded.instrument.id];
        const instrumentNode = audio.createGain();
        // instrumentNode.connect(out);

        let prevPlugin = instrumentNode;
        const plugins = loaded.plugins.reverse().map((plugin, i) => {
            const pluginNode = audio.createGain();
            const PluginEl = Elements[plugin.id];
            const el = <PluginEl key={i + 1} audio={audio} input={prevPlugin} out={pluginNode} setSerialized={() => {}} initial={plugin.initial} />
            prevPlugin = pluginNode;
            return el;
        });

        prevPlugin.connect(out);

        setElements([
            <InstrumentEl key={0} audio={audio} commands$={commands$} out={instrumentNode} setSerialized={setSerialized} initial={loaded.instrument.initial as any} />,
            ...plugins
        ]);
    }, [audio, loaded, commands$, out, setSerialized]);

    return (
        <>
            {elements}
            {/* <ES1 audio={audio} commands$={commands$} out={out} setSerialized={setSerialized} initial={serialized as any} /> */}
            {/* <Compressor audio={audio} setSerialized={setSerialized} out={out} initial={{}} /> */}
        </>
    );
};