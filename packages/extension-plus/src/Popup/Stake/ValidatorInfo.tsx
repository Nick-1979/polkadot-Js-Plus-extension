// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import DetailsIcon from '@mui/icons-material/Details';
import { Avatar, Container, Divider, Grid, Link, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback } from 'react';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';
import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, ShortAddress } from '../../components';
import getLogo from '../../util/getLogo';
import { ValidatorsName } from '../../util/plusTypes';
import { amountToHuman } from '../../util/plusUtils';

interface Props {
  chain: Chain;
  coin: string;
  decimals: number;
  showValidatorInfoModal: boolean;
  setShowValidatorInfoModal: Dispatch<SetStateAction<boolean>>;
  info: DeriveStakingQuery;
  validatorsName: ValidatorsName[];
}

export default function ValidatorInfo({ chain, coin, decimals, info, setShowValidatorInfoModal, showValidatorInfoModal, validatorsName }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const chainName = chain?.name.replace(' Relay Chain', '');
  const validatorName = validatorsName.find((v) => v.address === info.accountId.toString());

  const handleDetailsModalClose = useCallback(
    (): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setShowValidatorInfoModal(false);
    },
    [setShowValidatorInfoModal]
  );

  return (
    <Popup id='scrollArea' showModal={showValidatorInfoModal} handleClose={handleDetailsModalClose}>
      <PlusHeader action={handleDetailsModalClose} chain={chain} closeText={'Close'} icon={<DetailsIcon fontSize='small' />} title={'Validator Info'} />
      <Container sx={{ p: '0px 20px' }}>
        <Grid item xs={12} sx={{ p: 1 }}>
          <Paper elevation={3}>
            <Grid item container justifyContent='center' sx={{ fontSize: 12, textAlign: 'center', p: '20px 10px 20px' }}>
              <Grid item container alignItems='center' justifyContent='center' spacing={1} xs={12}>
                <Grid item>
                  <Identicon
                    prefix={chain?.ss58Format ?? 42}
                    size={40}
                    theme={chain?.icon || 'polkadot'}
                    value={info?.accountId}
                  />
                </Grid>
                <Grid item sx={{ fontWeight: '700' }}>
                  {validatorName?.name}
                </Grid>
              </Grid>
              <Grid item xs={12} sx={{ fontWeight: '500' }}>
                {info?.accountId}
              </Grid>
              <Grid item xs={12} sx={{ p: '10px 0px 20px' }}>
                <Divider />
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'left', pl: 3 }}>
                {t('Own')}{': '}{Number(info?.exposure.own).toLocaleString()} {' '}{coin}
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right', pr: 3 }}>
                {t('Total')}{': '}{Number(info?.exposure.total).toLocaleString()}{' '}{coin}
              </Grid>
              <Grid item xs={11} sx={{ textAlign: 'left', pt: 1, pl: 3 }}>
                {t('Commission')}{': '}{info?.validatorPrefs.commission / 10 ** 7}%
              </Grid>
              <Grid item xs={1} sx={{ pt: 1, pr: 3 }}>
                <Link
                  href={`https://${chainName}.subscan.io/account/${info?.accountId}`}
                  underline='none'
                  rel='noreferrer'
                  target='_blank'
                >
                  <Avatar
                    alt={'subscan'}
                    src={getLogo('subscan')}
                    sx={{ height: 18, width: 18 }}
                  />
                </Link>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item container justifyContent='center' spacing={1} xs={12}>
          <Grid item sx={{ textAlign: 'center', color: grey[600], fontFamily: 'fantasy', fontSize: 15, padding: '10px 0px 5px' }}>
            {t('Nominators')}
          </Grid>
          <Grid item sx={{ fontSize: 12 }} >
            ({info?.exposure?.others?.length})
          </Grid>
        </Grid>
        <Grid item xs={12} sx={{ bgcolor: 'background.paper', height: '300px', overflowY: 'auto', scrollbarWidth: 'none', width: '100%', p: 2 }}>
          {info?.exposure?.others.map(({ value, who }) => (
            <Paper elevation={2} key={who} sx={{ p: 1, m: 1 }}>
              <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 12 }}>
                <Grid item xs={1}>
                  <Identicon
                    prefix={chain?.ss58Format ?? 42}
                    size={30}
                    theme={chain?.icon || 'polkadot'}
                    value={who}
                  />
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  <ShortAddress address={who} charsCount={8} />
                </Grid>
                <Grid item xs={5} sx={{ textAlign: 'right' }}>
                  {Number(amountToHuman(value, decimals)).toLocaleString()} {' '}{coin}
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Grid>
      </Container>
    </Popup>
  );
}
