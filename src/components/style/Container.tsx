import styled from 'styled-components';

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
	flex-wrap: wrap;
	> div {
		flex: 1 1 100%;
	}
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
};
`;
