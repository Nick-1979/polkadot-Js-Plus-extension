/* eslint-disable react/jsx-max-props-per-line */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import {
	CancelOutlined as CancelOutlinedIcon,
	Preview as PreviewIcon,
	HowToReg as HowToRegIcon
} from '@mui/icons-material';
import { Button, Container, Divider, Grid, Paper } from '@mui/material';
import React, { useState, useCallback } from 'react';

import useMetadata from '../../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { CouncilInfo } from '../../../../util/plusTypes';
import Members from './Members';
import MyVotes from './myVotes/MyVotes';
import Votes from './vote/Vote';

interface Props {
	councilInfo: CouncilInfo;
	genesisHash: string;
	coin: string;
	decimals: number;
}

export default function Overview({ coin, councilInfo, decimals, genesisHash }: Props): React.ReactElement<Props> {
	const { t } = useTranslation();
	const chain = useMetadata(genesisHash, true);
	const [ showMyVotesModal, setShowMyVotesModal ] = useState<boolean>(false);
	const [ showVotesModal, setShowVotesModal ] = useState<boolean>(false);

	console.log('councilInfo', councilInfo);

	const {
		accountInfos,
		candidateCount,
		candidates,
		desiredRunnersUp,
		desiredSeats,
		members,
		runnersUp
	} = councilInfo;
	const membersInfo = {
		backed: members.map((m) => m[1].toString()),
		// desiredSeats: Number(desiredSeats),
		infos: accountInfos.slice(0, members.length)
	};
	const runnersUpInfo = {
		backed: runnersUp.map((m) => m[1].toString()),
		// desiredSeats: Number(desiredRunnersUp),
		infos: accountInfos.slice(members.length, members.length + runnersUp.length)
	};
	const candidatesInfo = {
		backed: candidates.map((m) => '0'), // TODO: is 0 a good default for candidates backup amount?!
		// desiredSeats: Number(candidateCount),
		infos: accountInfos.slice(members.length + runnersUp.length)
	};

	const allCouncilInfo = {
		backed: membersInfo.backed.concat(runnersUpInfo.backed, candidatesInfo.backed),
		infos: accountInfos
	};

	const handleShowMyVotes = useCallback(() => {
		setShowMyVotesModal(true);
	}, []);
	const handleShowVotes = useCallback(() => {
		setShowVotesModal(true);
	}, []);

	return (
		<Container disableGutters maxWidth="md">
			<Paper elevation={4} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 40px' }}>
				<Grid container justifyContent="space-between" sx={{ textAlign: 'center' }}>
					<Grid item>
						{t('Seats')}
						<br />
						{members.length}/{councilInfo.desiredSeats.toString()}
					</Grid>
					<Grid item>
						{t('Runners up')}
						<br />
						{councilInfo.runnersUp.length}/{councilInfo.desiredRunnersUp.toString()}
					</Grid>
					<Grid item>
						{t('Candidates')}
						<br />
						{councilInfo.candidateCount.toString()}
					</Grid>
				</Grid>

				<Grid item sx={{ padding: '20px 0px 10px ' }}>
					<Divider />
				</Grid>

				<Grid container justifyContent="space-between" sx={{ textAlign: 'center' }}>
					<Grid item>
						<Button
							color="primary"
							onClick={handleShowMyVotes}
							size="small"
							startIcon={<PreviewIcon />}
							variant="outlined"
						>
							{' '}
							{t('My votes')}
						</Button>
					</Grid>
					<Grid item>
						<Button
							color="warning"
							onClick={handleShowVotes}
							size="small"
							startIcon={<HowToRegIcon />}
							variant="contained"
						>
							{' '}
							{t('Vote')}
						</Button>
					</Grid>
				</Grid>
			</Paper>

			{councilInfo ? (
				<Container id="scrollArea" sx={{ height: '300px', overflowY: 'auto' }}>
					<Members
						chain={chain}
						coin={coin}
						decimals={decimals}
						membersType={t('Members')}
						personsInfo={membersInfo}
					/>
					<Members
						chain={chain}
						coin={coin}
						decimals={decimals}
						membersType={t('Runners up')}
						personsInfo={runnersUpInfo}
					/>
					<Members
						chain={chain}
						coin={coin}
						decimals={decimals}
						membersType={t('Candidates')}
						personsInfo={candidatesInfo}
					/>
				</Container>
			) : (
				<Grid sx={{ textAlign: 'center', paddingTop: 3 }} xs={12}>
					{t('No data')}
				</Grid>
			)}

			{showMyVotesModal && (
				<MyVotes
					chain={chain}
					coin={coin}
					decimals={decimals}
					allCouncilInfo={allCouncilInfo}
					setShowMyVotesModal={setShowMyVotesModal}
					showMyVotesModal={showMyVotesModal}
				/>
			)}

			{showVotesModal && (
				<Votes
					chain={chain}
					coin={coin}
					decimals={decimals}
					allCouncilInfo={allCouncilInfo}
					setShowVotesModal={setShowVotesModal}
					showVotesModal={showVotesModal}
				/>
			)}
		</Container>
	);
}
