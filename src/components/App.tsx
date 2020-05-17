import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Synth, SynthData, SynthElementType } from './Synth';
import { Piano } from './Piano';
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

	useEffect(() => {
		analyser.connect(audio.destination);
	}, [audio, analyser]);

	const [synth, setSynth] = useState<SynthData[]>([{
		id: 1,
		connections: [0],
		elementType: SynthElementType.Oscillator,

		form: 'sine',
		attack: .2,
		release: .5,
		volume: 1
	},{
		id: 3,
		connections: [0],
		elementType: SynthElementType.Oscillator,

		form: 'square',
		attack: .2,
		release: .5,
		volume: 1
	}]);

	return (
		<DemoCanvasWidget>
			<Synth
				synth={synth}
				setSynth={setSynth}></Synth>
			<Piano
				audio={audio}
				analyser={analyser}
				synth={synth}></Piano>
			<Display
				analyser={analyser}></Display>
		</DemoCanvasWidget>
	);
};
