// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveProposal } from '@polkadot/api-derive/types';

import { Avatar, Button, Divider, Grid, Link, Paper, Tooltip, Zoom } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../../../../util/getLogo';
import { ChainInfo, ProposalsInfo } from '../../../../util/plusTypes';
import { amountToHuman, formatMeta } from '../../../../util/plusUtils';
import Identity from '../../Council/overview/Identity';
import VoteProposal from './VoteProposal';

interface Props {
  proposalsInfo: ProposalsInfo;
  chain: Chain;
  chainInfo: ChainInfo;
  currentBlockNumber: number;
  // handleSecond: (proposalId: string, depositorsLength: number) => void;
}

const secondToolTip = 'Seconding a proposal that indicates your backing for the proposal. Proposals with greater interest moves up the queue for potential next referendums.'

export default function Proposals({ chain, chainInfo, currentBlockNumber, proposalsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accountsInfo, proposals } = proposalsInfo;
  const chainName = chain?.name.replace(' Relay Chain', '');

  const [showVoteProposalModal, setShowVoteProposalModal] = useState<boolean>(false);
  const [selectedProposal, setSelectedProposal] = useState<DeriveProposal>();

  const handleSecond = useCallback((p: DeriveProposal): void => {
    setShowVoteProposalModal(true);
    setSelectedProposal(p);
  }, []);

  const handleVoteProposalModalClose = useCallback(() => {
    setShowVoteProposalModal(false);
  }, []);

  return (
    <>
      {proposals?.length
        ? proposals.map((p, index) => {
          const value = p.image?.proposal;
          const meta = value?.registry.findMetaCall(value.callIndex);
          const description = formatMeta(meta?.meta);

          return (
            <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 20px' }}>
              <Grid container justifyContent='space-between'>
                {value
                  ? <Grid item xs={4}>
                    {meta.section}. {meta.method}
                  </Grid>
                  : <Grid item xs={4}></Grid>
                }
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  #{String(p?.index)} {' '}
                </Grid>

                <Grid item container justifyContent='flex-end' xs={4}>
                  <Grid item>
                    <Link
                      href={`https://${chainName}.polkassembly.io/proposal/${p?.index}`}
                      underline='none'
                      rel='noreferrer'
                      target='_blank'
                    >
                      <Avatar
                        alt={'Polkassembly'}
                        src={getLogo('polkassembly')}
                        sx={{ height: 15, width: 15 }}
                      />
                    </Link>
                  </Grid>
                  <Grid item>
                    <Link
                      href={`https://${chainName}.subscan.io/democracy_proposal/${p?.index}`}
                      underline='none'
                      rel='noreferrer'
                      target='_blank'
                    >
                      <Avatar
                        alt={'subscan'}
                        src={getLogo('subscan')}
                        sx={{ height: 15, width: 15 }}
                      />
                    </Link>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item>
                <Divider />
              </Grid>

              <Grid container justifyContent='space-between' sx={{ fontSize: 11, paddingTop: 1, color: 'red' }}>
                <Grid item>
                  {t('Locked')}{': '}{Number(amountToHuman(p.balance.toString(), chainInfo.decimals)).toLocaleString()} {' '}{chainInfo.coin}
                </Grid>
                <Grid item>
                  {t('Deposit')}{': '}{amountToHuman(p.image.balance.toString(), chainInfo.decimals, 6)} {' '}{chainInfo.coin}
                </Grid>
                <Grid item>
                  {t('Seconds')}{': '}{p.seconds.length - 1}
                </Grid>
              </Grid>

              <Grid item xs={12} sx={{ fontWeight: '600', margin: '20px 0px 30px' }}>
                {description}
              </Grid>

              {p?.proposer &&
                <Identity accountInfo={accountsInfo[index]} chain={chain} showAddress title={t('Proposer')} />
              }

              {/* <Grid item xs={12} sx={{ border: '1px dotted', borderRadius: '10px', padding: 1, margin: '20px 1px 20px' }}>
                {t('Hash')}<br />
                {p.imageHash.toString()}
              </Grid> */}

              <Grid item xs={12} sx={{ paddingTop: 2, textAlign: 'center' }}>
                {/* <Tooltip TransitionComponent={Zoom} arrow placement='top' title={secondToolTip}> */}
                <Button color='warning' onClick={() => handleSecond(p)} variant='contained'>
                  {t('Second')}
                </Button>
                {/* </Tooltip> */}
              </Grid>
            </Paper>);
        })
        : <Grid xs={12} sx={{ paddingTop: 3, textAlign: 'center' }}>
          {t('No active proposals')}
        </Grid>}

      {showVoteProposalModal &&
        <VoteProposal
          chain={chain}
          chainInfo={chainInfo}
          handleVoteProposalModalClose={handleVoteProposalModalClose}
          selectedProposal={selectedProposal}
          showVoteProposalModal={showVoteProposalModal}
        />
      }

    </>
  );
}
