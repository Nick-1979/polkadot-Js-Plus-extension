// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveProposal } from '@polkadot/api-derive/types';

import { Avatar, Button, Divider, Grid, Link, Paper, Tooltip } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import Identity from '../../../../components/Identity';
import getLogo from '../../../../util/getLogo';
import { ChainInfo, ProposalsInfo } from '../../../../util/plusTypes';
import { amountToHuman, formatMeta } from '../../../../util/plusUtils';
import Second from './Second';

interface Props {
  address: string;
  proposalsInfo: ProposalsInfo | null;
  chain: Chain;
  chainInfo: ChainInfo;
}

const secondToolTip = 'Express your backing. Proposals with greater interest moves up the queue for potential next referendums.';

export default function Proposals({ address, chain, chainInfo, proposalsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chainName = chain?.name.replace(' Relay Chain', '');

  const [showVoteProposalModal, setShowVoteProposalModal] = useState<boolean>(false);
  const [selectedProposal, setSelectedProposal] = useState<DeriveProposal>();

  const { coin, decimals } = chainInfo;

  const handleSecond = useCallback((p: DeriveProposal): void => {
    setShowVoteProposalModal(true);
    setSelectedProposal(p);
  }, []);

  const handleVoteProposalModalClose = useCallback(() => {
    setShowVoteProposalModal(false);
  }, []);

  if (!proposalsInfo) { return (<></>); }

  const { accountsInfo, proposals } = proposalsInfo;

  return (
    <>
      {proposals?.length
        ? proposals.map((p, index) => {
          const value = p?.image?.proposal;
          const meta = value ? value.registry.findMetaCall(value.callIndex) : undefined;
          const description = meta ? formatMeta(meta?.meta) : undefined;

          return (
            <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 20px' }}>
              <Grid container justifyContent='space-between'>
                {value
                  ? <Grid item sx={{ fontSize: 11 }} xs={4}>
                    {meta?.section}. {meta?.method}
                  </Grid>
                  : <Grid item xs={4}></Grid>
                }
                <Grid item sx={{ fontSize: 12, textAlign: 'center' }} xs={4}>
                  #{String(p?.index)} {' '}
                </Grid>
                <Grid container item justifyContent='flex-end' xs={4}>
                  <Grid item>
                    <Link
                      href={`https://${chainName}.polkassembly.io/proposal/${p?.index}`}
                      rel='noreferrer'
                      target='_blank'
                      underline='none'
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
                      rel='noreferrer'
                      target='_blank'
                      underline='none'
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
                  {t('Locked')}{': '}{p?.balance ? Number(amountToHuman(p.balance.toString(), decimals)).toLocaleString() : '0.00'} {' '}{coin}
                </Grid>
                <Grid item>
                  {t('Deposit')}{': '}{p?.image ? amountToHuman(p.image.balance.toString(), decimals, 6) : '0.00'} {' '}{coin}
                </Grid>
                <Grid item>
                  {t('Seconds')}{': '}{p.seconds.length - 1}
                </Grid>
              </Grid>
              <Grid item sx={{ fontSize: 12, fontWeight: '600', margin: '20px 0px 30px' }} xs={12}>
                {description}
              </Grid>
              <Grid item sx={{ fontSize: 12 }} xs={12}>
                {p?.proposer &&
                  <Identity accountInfo={accountsInfo[index]} chain={chain} showAddress title={t('Proposer')} />
                }
              </Grid>
              <Grid container justifyContent='center' sx={{ paddingTop: 2 }}>
                <Tooltip id='seconding' placement='top' title={secondToolTip}>
                  <Button color='warning' onClick={() => handleSecond(p)} variant='contained'>
                    {t('Endorse')}
                  </Button>
                </Tooltip>
              </Grid>
            </Paper>);
        })
        : <Grid item sx={{ fontSize: 12, paddingTop: 3, textAlign: 'center' }} xs={12}>
          {t('No active proposal')}
        </Grid>}
      {selectedProposal && showVoteProposalModal &&
        <Second
          address={address}
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
