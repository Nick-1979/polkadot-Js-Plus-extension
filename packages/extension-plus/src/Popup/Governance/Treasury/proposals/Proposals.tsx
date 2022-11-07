// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveAccountInfo, DeriveTreasuryProposal } from '@polkadot/api-derive/types';

import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import { Avatar, Button, Divider, Grid, Link, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import Identity from '../../../../components/Identity';
import getLogo from '../../../../util/getLogo';
import { ChainInfo } from '../../../../util/plusTypes';
import { amountToHuman } from '../../../../util/plusUtils';

interface Props {
  proposals: DeriveTreasuryProposal[] | null;
  chain: Chain;
  chainInfo: ChainInfo;
  title?: string
  showSubmit?: boolean;
  handleSubmitProposal?: () => void;
}

export default function Proposals({ chain, chainInfo, handleSubmitProposal, proposals, showSubmit, title }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chainName = chain?.name.replace(' Relay Chain', '');
  const [identities, setIdentities] = useState<DeriveAccountInfo[]>();
  const { api, coin, decimals } = chainInfo;
  const FEE_DECIMAL_DIGITS = coin === 'DOT' ? 4 : 6;
  const toHuman = useCallback((value: bigint) => `${api.createType('Balance', value).toHuman()}`, [api]);

  useEffect(() => {
    if (!proposals) return;
    const ids = proposals.map((i) => [i.proposal.proposer, i.proposal.beneficiary]).flat();

    Promise.all(ids.map((i) => api.derive.accounts.info(i))).then((infos) => {
      setIdentities(infos);
    }).catch(console.error);
  }, [api, proposals]);

  if (!proposals) return (<></>);

  return (
    <>
      <Grid container justifyContent='flex-start'>
        <Grid item sx={{ color: grey[600], fontSize: 15, fontWeigth: 'bold', p: '10px 30px 10px', textAlign: 'left' }} xs={4}>
          {showSubmit &&
            <Button onClick={handleSubmitProposal} size='small' startIcon={<AddCircleRoundedIcon />} color='warning' variant='outlined'>
              {t('Submit')}
            </Button>
          }
        </Grid>
        <Grid item sx={{ color: grey[600], fontSize: 15, fontWeigth: 'bold', p: '10px 30px 10px', textAlign: 'center' }} xs={4}>
          {title}
        </Grid>
      </Grid>

      {proposals?.length
        ? proposals.map((p, index) => {
          const proposerAccountInfo = identities?.find((i) => i.accountId.toString() === p.proposal.proposer.toString());
          const beneficiaryAccountInfo = identities?.find((i) => i.accountId.toString() === p.proposal.beneficiary.toString());

          return (
            <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '10px 30px 10px', p: '10px 20px' }}>
              <Grid alignItems='center' container justifyContent='space-between'>
                <Grid item>
                  <Avatar sx={{ bgcolor: 'black', fontSize: 14, height: 30, width: 30 }}>
                    {String(p?.id)}
                  </Avatar>
                </Grid>
                <Grid item sx={{ fontSize: 12 }}>
                  {t('Payment')}{': '}{toHuman(p?.proposal.value)}
                </Grid>
                <Grid item sx={{ fontSize: 12 }}>
                  {t('Bond')}{': '}{toHuman(p?.proposal.bond)}
                </Grid>

              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid container item justifyContent='flex-end' spacing={1} xs={12}>
                <Grid item>
                  <Link
                    href={`https://dotreasury.com/${chainInfo?.coin}/proposals/${p?.id}`}
                    rel='noreferrer'
                    target='_blank'
                    underline='none'
                  >
                    <Avatar
                      alt={'dotreasury'}
                      src={getLogo('dotreasury')}
                      sx={{ height: 15, width: 15 }}
                    />
                  </Link>
                </Grid>
                <Grid item>
                  <Link
                    href={`https://${chainName}.polkassembly.io/treasury/${p?.id}`}
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
                    href={`https://${chainName}.subscan.io/treasury/${p?.id}`}
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

              <Grid item sx={{ fontSize: 12, pt: 1, textAlign: 'left' }} xs={12}>
                {proposerAccountInfo &&
                  <Identity accountInfo={proposerAccountInfo} chain={chain} showAddress title={t('Proposer')} />
                }
              </Grid>

              <Grid item sx={{ fontSize: 12, pt: 1, textAlign: 'left' }} xs={12}>
                {beneficiaryAccountInfo &&
                  <Identity accountInfo={beneficiaryAccountInfo} chain={chain} showAddress title={t('Beneficiary')} />
                }
              </Grid>
            </Paper>);
        })
        : <Grid sx={{ fontSize: 12, p: 2, textAlign: 'center' }} xs={12}>
          {t('No proposal')}
        </Grid>}
    </>
  );
}
