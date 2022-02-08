// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Button as MuiButton, Grid } from '@mui/material';
import React from 'react';

import { BackButton, Button } from '../../../extension-ui/src/components';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';

interface Props {
  state: string;
  handleReject: () => void;
  handleBack: () => void;
  isDisabled?: boolean;
  handleConfirm: () => Promise<void>;
  text?: string;
}

export default function ConfirmButton({ handleBack, handleConfirm, handleReject, isDisabled = false, state, text = 'Confirm' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid container item data-testid='confirmButton' justifyContent='space-between' sx={{ m: 1 }} xs={12}>
      {['success', 'failed'].includes(state)
        ? <Grid item xs={12}>
          <MuiButton color={state === 'success' ? 'success' : 'error'} fullWidth onClick={handleReject} size='large' variant='contained'>
            {state === 'success' ? t('Done') : t('Failed')}
          </MuiButton>
        </Grid>
        : <>
          <Grid item xs={1}>
            <BackButton onClick={handleBack} />
          </Grid>
          <Grid item sx={{ paddingLeft: '10px' }} xs={11}>
            <Button data-button-action='' isBusy={state === 'confirming'} isDisabled={isDisabled} onClick={handleConfirm}>
              {t(text)}
            </Button>
          </Grid>
        </>}
    </Grid>
  );
}
