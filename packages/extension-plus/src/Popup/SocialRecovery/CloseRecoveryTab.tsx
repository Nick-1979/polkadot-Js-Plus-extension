/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens Close recovery for a named lost account
 * */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { HealthAndSafety as HealthAndSafetyIcon } from '@mui/icons-material';
import { Typography, Grid } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Identity, PlusHeader, Popup, ShowBalance2, ShowValue } from '../../components';
import type { ApiPromise } from '@polkadot/api';

import { Rescuer } from '../../util/plusTypes';
import { Button } from '@polkadot/extension-ui/components';
import Confirm from './Confirm';
import { Chain } from '@polkadot/extension-chains/types';
import { grey } from '@mui/material/colors';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  formattedAddress: string;
  chain: Chain;
  className?: string;
  rescuer: Rescuer;
}

function CloseRecovery({ api, chain, formattedAddress, rescuer }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [date, setDate] = useState<Date | undefined>();

  useEffect((): void => {
    api && rescuer && api.rpc.chain.getHeader().then((h) => {
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
      <Grid container>
        <Grid item py='15px'>
          <Typography py='7px' sx={{ color: 'text.primary' }} variant='body2'>
            {t<string>('The following account has initiated a recovery process for your account:')}
          </Typography>
        </Grid>
        <Grid alignItems='center' container item justifyContent='center' sx={{ bgcolor: 'white', border: '1px solid', borderColor: grey[600], borderRadius: 5, fontSize: 12, height: '190px', overflowY: 'auto', px: '30px' }} xs={12}>
          <Identity address={rescuer.accountId} api={api} chain={chain} showAddress />
          <ShowBalance2 api={api} balance={rescuer.option.deposit} direction='row' title={`${t('Deposited')}:`} />
          <ShowValue title='Initiation time' value={date?.toString()} />
        </Grid>
        <Grid item py='25px' xs={12}>
          <Typography sx={{ color: 'text.primary' }} variant='subtitle2'>
            {t<string>('If it isn\'t you, close the recovery process, which will automatically transfer their deposit to your account')}
          </Typography>
        </Grid>
        <Grid item sx={{ pt: 4 }} xs={12}>
          <Button
            data-button-action=''
            // isDisabled={!lostAccount || !lostAccountRecoveryInfo || !!hasActiveRecoveries || isProxy}
            onClick={handleNextToCloseRecovery}
          >
            {t<string>('Next')}
          </Button>
        </Grid>
      </Grid>
      {showConfirmModal && api && chain && state &&
        <Confirm
          account={{ accountId: formattedAddress }}
          lostAccount={{ accountId: formattedAddress }}
          api={api}
          chain={chain}
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
