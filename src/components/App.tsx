import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
// import { Synth, SynthData, SynthElementType } from './Synth';
// import { Piano } from './Piano';
// import { Display } from './Display';
import { ES1, ConnectableNode } from './ES1/ES1';

interface DemoCanvasWidgetProps {
	color?: string;
	background?: string;
	children: React.ReactNode;
};

interface ContainerProps {
	color: string;
	background: string
};

export const Container = styled.div<ContainerProps>`
	height: 100%;
	background-color: ${p => p.background};
	background-size: 50px 50px;
	display: flex;
	/* > * {
		height: 100%;
		min-height: 100%;
		width: 100%;
	} */
	background-image: linear-gradient(
			0deg,
			transparent 24%,
			${p => p.color} 25%,
			${p => p.color} 26%,
			transparent 27%,
			transparent 74%,
			${p => p.color} 75%,
			${p => p.color} 76%,
			transparent 77%,
			transparent
		),
		linear-gradient(
			90deg,
			transparent 24%,
			${p => p.color} 25%,
			${p => p.color} 26%,
			transparent 27%,
			transparent 74%,
			${p => p.color} 75%,
			${p => p.color} 76%,
			transparent 77%,
			transparent
		);
`;

const DemoCanvasWidget = (props: DemoCanvasWidgetProps) => (
	<Container
		background={props.background || 'rgb(60, 60, 60)'}
		color={props.color || 'rgba(255,255,255, 0.05)'}>
		{props.children}
	</Container>
);

const getLocal = (key: string): Object => {
	const res = localStorage.getItem(key);
	if(res === null)
		return {};

	return JSON.parse(res) || {};
};

export const App = () => {
	const [audio] = useState(new AudioContext());
	const [analyser] = useState(audio.createAnalyser());

	const [,setNode] = useState<ConnectableNode>();
	const [serialized, setSerialized] = useState(getLocal('ES1'));

	useEffect(() => {
		analyser.connect(audio.destination);
	}, [audio, analyser]);

	const _setNode = useCallback(
		(node: ConnectableNode) => {
			const serialized = node.getSerialized();
			setNode(node);
			setSerialized(serialized);
			console.log(serialized);
			localStorage.setItem('ES1', JSON.stringify(serialized));
		},
		[setNode, setSerialized]
	);

	return (
		<DemoCanvasWidget>
			<ES1 audio={audio} setNode={_setNode} initial={serialized as any}></ES1>
			{/* <Synth
				synth={synth}
				setSynth={setSynth}></Synth>
			<Piano
				audio={audio}
				analyser={analyser}
				synth={synth}></Piano>
			<Display
				analyser={analyser}></Display> */}
		</DemoCanvasWidget>
	);
};
