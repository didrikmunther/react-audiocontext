import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Piano } from './Piano';
import { Channel, InputNode } from './Channel';
import { Display } from './Display';

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
	align-items: start;
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

export const App = () => {
	const [audio] = useState(new AudioContext());
	const [analyser] = useState(audio.createAnalyser());
	const [inputNode, setInputNode] = useState<InputNode>();

	useEffect(() => {
		analyser.connect(audio.destination);
	}, [audio, analyser]);

	const playNote = useCallback(
		(note: number, releasePromise: Promise<void>) => {
			if(!inputNode) return;

			const { release } = inputNode.connect(analyser).play(note);

			releasePromise.then(release);
		},
		[analyser, inputNode]
	);

	return (
		<DemoCanvasWidget>
			<Piano audio={audio} playNote={playNote}></Piano>
			<Channel audio={audio} setInputNode={setInputNode}></Channel>
			<Display analyser={analyser}></Display>
		</DemoCanvasWidget>
	);
};
