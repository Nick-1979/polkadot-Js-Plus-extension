// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens Close recovery for a lost account
 * */

import type { ApiPromise } from '@polkadot/api';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Grid, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Chain } from '@polkadot/extension-chains/types';
import { NextStepButton } from '@polkadot/extension-ui/components';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Identity, ShowBalance2, ShowValue } from '../../components';
import { Rescuer } from '../../util/plusTypes';
import Confirm from './Confirm';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo;
  chain: Chain;
  className?: string;
  rescuer: Rescuer;
}

function CloseRecovery({ account, api, chain, rescuer }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [date, setDate] = useState<Date | undefined>();

  useEffect((): void => {
    api && rescuer?.option?.created && api.rpc.chain.getHeader().then((h) => {
      const currentBlockNumber = h.number.toNumber();
      const now = Date.now();
      const initiateRecoveryBlock = rescuer.option.created.toNumber();
      const initiateRecoveryTime = now - (currentBlockNumber - initiateRecoveryBlock) * 6000;

      setDate(new Date(initiateRecoveryTime));
    });
  }, [api, rescuer]);

  const handleNextToCloseRecovery = useCallback(() => {
    setState('closeRecovery');
    setConfirmModalOpen(true);
  }, []);

  return (
    <>
      <Grid item p='0px 17px 0px' sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography sx={{ color: 'text.primary' }} variant='overline'>
          {t('Close recovery')}
        </Typography>
      </Grid>
      <Grid container>
        <Grid item p='35px 15px 15px'>
          <Typography sx={{ color: 'text.primary' }} variant='body2'>
            {t<string>('The following account has initiated a recovery process for your account:')}
          </Typography>
        </Grid>
        <Grid alignItems='center' container item justifyContent='center' sx={{ bgcolor: 'white', border: '1px solid', borderColor: grey[600], borderRadius: 5, fontSize: 12, height: '200px', overflowY: 'auto', px: '30px' }} xs={12}>
          <Identity accountInfo={rescuer} api={api} chain={chain} showAddress />
          <ShowBalance2 api={api} balance={rescuer.option.deposit} direction='row' title={`${t('Deposited')}:`} />
          <ShowValue title='Initiation time' value={date?.toString()} />
        </Grid>
        <Grid item p='20px 15px 20px' xs={12}>
          <Typography sx={{ color: 'text.primary' }} variant='subtitle2'>
            {t<string>('If it isn\'t you, close the recovery process, which will automatically transfer it\'s deposit to your account')}
          </Typography>
        </Grid>
        <Grid item pt='20px' xs={12}>
          <NextStepButton
            data-button-action=''
            isDisabled={!api}
            onClick={handleNextToCloseRecovery}
          >
            {t<string>('Next')}
          </NextStepButton>
        </Grid>
      </Grid>
      {showConfirmModal && api && chain && state &&
        <Confirm
          account={account}
          api={api}
          chain={chain}
          lostAccount={account}
          rescuer={rescuer}
          setConfirmModalOpen={setConfirmModalOpen}
          setState={setState}
          showConfirmModal={showConfirmModal}
          state={state}
        />
      }
    </>
  );
}

export default styled(CloseRecovery)`
         height: calc(100vh - 2px);
         overflow: auto;
         scrollbar - width: none;
 
         &:: -webkit - scrollbar {
           display: none;
         width:0,
        }
         .empty-list {
           text - align: center;
   }`;
