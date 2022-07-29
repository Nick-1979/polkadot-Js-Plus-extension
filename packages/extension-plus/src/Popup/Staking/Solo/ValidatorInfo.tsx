// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  this component shows a validator's info in a page including its nominators listand a link to subscan
 * */

import { BubbleChart as BubbleChartIcon } from '@mui/icons-material';
import { Avatar, Container, Divider, Grid, Link, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useState, useEffect } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';
import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Identity, PlusHeader, Popup, ShortAddress } from '../../../components';
import { SELECTED_COLOR } from '../../../util/constants';
import getLogo from '../../../util/getLogo';
import { AccountsBalanceType } from '../../../util/plusTypes';

interface Props {
  chain: Chain;
  api: ApiPromise;
  showValidatorInfoModal: boolean;
  setShowValidatorInfoModal: Dispatch<SetStateAction<boolean>>;
  info: DeriveStakingQuery;
  validatorsIdentities: DeriveAccountInfo[] | undefined;
  staker?: AccountsBalanceType | string;
}

export default function ValidatorInfo({ api, chain, info, setShowValidatorInfoModal, showValidatorInfoModal, staker, validatorsIdentities }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [accountInfo, setAccountInfo] = useState<DeriveAccountInfo | undefined>();
  const chainName = chain?.name.replace(' Relay Chain', '');

  const own = api.createType('Balance', info?.exposure.own || info?.stakingLedger.active);
  const total = api.createType('Balance', info?.exposure.total);

  useEffect(() => {
    const accountInfo = validatorsIdentities?.find((v) => v.accountId === info?.accountId);

    if (accountInfo) {
      return setAccountInfo(accountInfo);
    }

    // eslint-disable-next-line no-void
    void api.derive.accounts.info(info.accountId).then((info) => {
      setAccountInfo(info);
    });
  }, [api, info, validatorsIdentities]);

  const handleDetailsModalClose = useCallback(
    (): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setShowValidatorInfoModal(false);
    }, [setShowValidatorInfoModal]);

  const sortedNominators = info?.exposure?.others.sort((a, b) => b.value - a.value);
  const stakerAddress = staker?.address ?? staker;
  const myIndex = stakerAddress ? sortedNominators.findIndex((n) => n.who.toString() === stakerAddress) : -1;

  return (
    <Popup handleClose={handleDetailsModalClose} id='scrollArea' showModal={showValidatorInfoModal}>
      <PlusHeader action={handleDetailsModalClose} chain={chain} closeText={'Close'} icon={<BubbleChartIcon fontSize='small' />} title={'Validator Info'} />
      <Container sx={{ p: '0px 20px' }}>
        <Grid item sx={{ p: 1 }} xs={12}>
          <Paper elevation={3}>
            <Grid container item justifyContent='flex-start' sx={{ fontSize: 12, p: '20px 10px 20px', textAlign: 'center' }}>
              <Grid item sx={{ height: '40px' }} xs={11}>
                {accountInfo && <Identity accountInfo={accountInfo} chain={chain} iconSize={40} showAddress={true} />}
              </Grid>
              <Grid item sx={{ pr: 3, pt: 1 }} xs={1}>
                <Link
                  href={`https://${chainName}.subscan.io/account/${info?.accountId}`}
                  rel='noreferrer'
                  target='_blank'
                  underline='none'
                >
                  <Avatar
                    alt={'subscan'}
                    src={getLogo('subscan')}
                    sx={{ height: 18, width: 18 }}
                  />
                </Link>
              </Grid>
              <Grid item sx={{ p: '10px 0px 20px' }} xs={12}>
                <Divider />
              </Grid>
              <Grid item sx={{ pl: 3, textAlign: 'left' }} xs={6}>
                {t('Own')}{': '}{own.toHuman()}
              </Grid>
              <Grid item sx={{ pr: 3, textAlign: 'right' }} xs={6}>
                {t('Total')}{': '}{total.toHuman()}
              </Grid>
              <Grid item sx={{ pl: 3, pt: 1, textAlign: 'left' }} xs={6}>
                {t('Commission')}{': '}   {info.validatorPrefs.commission === 1 ? 0 : info.validatorPrefs.commission / (10 ** 7)}%
              </Grid>
              {myIndex && myIndex !== -1 &&
                <Grid item sx={{ pr: 3, pt: 1, textAlign: 'right' }} xs={6}>
                  {t('Your rank')}{': '}{myIndex + 1}
                </Grid>
              }
            </Grid>
          </Paper>
        </Grid>
        <Grid container item justifyContent='center' spacing={1} xs={12}>
          <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 15, textAlign: 'center', p: '10px 0px 5px' }}>
            {t('Nominators')}
          </Grid>
          <Grid item sx={{ fontSize: 12 }}>
            ({info?.exposure?.others?.length})
          </Grid>
        </Grid>
        <Grid item sx={{ bgcolor: 'background.paper', height: '300px', overflowY: 'auto', scrollbarWidth: 'none', width: '100%', p: 2 }} xs={12}>
          {sortedNominators.map(({ value, who }, index) => {
            const staked = api.createType('Balance', value);

            return (
              <Paper elevation={2} key={index} sx={{ bgcolor: index === myIndex ? SELECTED_COLOR : '', my: 1, p: '5px' }}>
                <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 12 }}>
                  <Grid item xs={1}>
                    <Identicon
                      prefix={chain?.ss58Format ?? 42}
                      size={30}
                      theme={chain?.icon || 'polkadot'}
                      value={who}
                    />
                  </Grid>
                  <Grid item sx={{ textAlign: 'left' }} xs={6}>
                    <ShortAddress address={who} charsCount={8} fontSize={12} />
                  </Grid>
                  <Grid item sx={{ textAlign: 'right' }} xs={5}>
                    {staked.toHuman()}
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Grid>
      </Container>
    </Popup>
  );
}
